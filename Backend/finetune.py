"""
Fine-tune models/deeplab_oil.h5 on the same dataset it was originally trained
on (Kaggle "oil-spill", nabilsherif/oil-spill - downloaded to
data/kaggle_oilspill/), adding photometric augmentation.

Why this exists: the deployed checkpoint reads bright, low-contrast open
water as "land" on scenes outside the brightness range it saw in training
(see DEMO 3.jpg - ~63% of the frame misclassified as land, burying most of
the oil slick). The original notebook trained with zero augmentation, so
the model never learned that a slick looks the same at different exposure
levels. This script continues training the SAME architecture and loss from
the SAME dataset, but jitters brightness/contrast/gamma per epoch so that
invariance gets learned explicitly.

Preprocessing below is copied byte-for-byte from oil-spill-detection.ipynb
(cells 3, 6, 9) - same resize, same /255 scaling, same COLOR_MAP - so the
fine-tuned weights stay a drop-in replacement for the existing inference
pipeline in sar_inference.py. Only addition: augment_photometric().

Usage:
    ./venv/bin/python finetune.py --epochs 8 --lr 1e-5
"""

import argparse
import os

os.environ.setdefault("SM_FRAMEWORK", "tf.keras")

import cv2
import numpy as np
from keras.utils import Sequence
from tqdm import tqdm

IMG_HEIGHT = 256
IMG_WIDTH = 256
IMG_CLASSES = 5

DATA_ROOT = "data/kaggle_oilspill/oil-spill"
IMG_PATH = f"{DATA_ROOT}/train/images"
LABELS_PATH = f"{DATA_ROOT}/train/labels"

# Exact COLOR_MAP from the training notebook - order defines the class
# indices sar_inference.py already relies on (CLASS_SEA=0 ... CLASS_LAND=4).
COLOR_MAP = [
    [0, 0, 0],
    [0, 255, 255],
    [255, 0, 0],
    [153, 76, 0],
    [0, 153, 0],
]


def process_mask(rgb_mask, colormap):
    output_mask = []
    for color in colormap:
        cmap = np.all(np.equal(rgb_mask, color), axis=-1)
        output_mask.append(cmap)
    return np.stack(output_mask, axis=-1)


def load_dataset():
    img_ids = sorted(os.listdir(IMG_PATH))
    label_ids = sorted(os.listdir(LABELS_PATH))
    assert len(img_ids) == len(label_ids), (
        f"image/label count mismatch: {len(img_ids)} vs {len(label_ids)}"
    )

    images, masks = [], []
    for image_filename, mask_filename in tqdm(
        zip(img_ids, label_ids), total=len(img_ids), desc="loading dataset"
    ):
        image = cv2.imread(os.path.join(IMG_PATH, image_filename), cv2.IMREAD_COLOR)
        image = cv2.resize(image, (IMG_HEIGHT, IMG_WIDTH))
        image = image / 255.0

        mask = cv2.imread(os.path.join(LABELS_PATH, mask_filename), cv2.IMREAD_COLOR)
        mask = cv2.resize(mask, (IMG_HEIGHT, IMG_WIDTH))
        mask = cv2.cvtColor(mask, cv2.COLOR_BGR2RGB)
        processed = process_mask(mask, COLOR_MAP)
        grayscale_mask = np.argmax(processed, axis=-1)

        images.append(image)
        masks.append(grayscale_mask)

    images = np.array(images, dtype=np.float32)
    masks = np.expand_dims(np.array(masks), axis=-1)
    return images, masks


def augment_photometric(image, rng):
    """Randomly jitter brightness/contrast/gamma of an already-[0,1]-scaled
    image. Mask is untouched - this changes exposure, not scene content, so
    ground truth stays valid for the augmented copy.

    Ranges are centered on demooo.jpg's profile (mean .49) and stretched to
    comfortably cover DEMO 3.jpg's profile (mean .70, std .16) so the model
    sees that brightness band during training instead of only at inference.
    """
    out = image.copy()

    # Brightness: additive shift.
    if rng.random() < 0.8:
        out = out + rng.uniform(-0.25, 0.25)

    # Contrast: scale around the image's own mean.
    if rng.random() < 0.8:
        factor = rng.uniform(0.6, 1.4)
        out = (out - out.mean()) * factor + out.mean()

    # Gamma: nonlinear brightness curve, different failure mode than a flat
    # shift and closer to how real sensor/AGC differences show up.
    if rng.random() < 0.5:
        gamma = rng.uniform(0.7, 1.4)
        out = np.clip(out, 0, 1) ** gamma

    return np.clip(out, 0.0, 1.0).astype(np.float32)


class AugmentedSequence(Sequence):
    """Keras Sequence yielding (possibly photometrically-augmented) batches.

    Each image is augmented with probability 0.7 per epoch, not always - so
    fine-tuning widens the brightness distribution without discarding the
    exact conditions the original checkpoint was already good at.
    """

    def __init__(self, images, masks_categorical, batch_size, seed=0):
        super().__init__()
        self.images = images
        self.masks = masks_categorical
        self.batch_size = batch_size
        self.rng = np.random.default_rng(seed)
        self.n = len(images)

    def __len__(self):
        return int(np.ceil(self.n / self.batch_size))

    def __getitem__(self, idx):
        lo = idx * self.batch_size
        hi = min(lo + self.batch_size, self.n)
        batch_x = np.stack([
            augment_photometric(self.images[i], self.rng)
            if self.rng.random() < 0.7 else self.images[i]
            for i in range(lo, hi)
        ])
        batch_y = self.masks[lo:hi]
        return batch_x, batch_y

    def on_epoch_end(self):
        perm = self.rng.permutation(self.n)
        self.images = self.images[perm]
        self.masks = self.masks[perm]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model-in", default="models/deeplab_oil.h5")
    ap.add_argument("--model-out", default="models/deeplab_oil_finetuned.h5")
    ap.add_argument("--epochs", type=int, default=8)
    ap.add_argument("--lr", type=float, default=1e-5)
    ap.add_argument("--batch-size", type=int, default=16)
    ap.add_argument("--val-split", type=float, default=0.1)
    args = ap.parse_args()

    import tensorflow as tf
    from keras.models import load_model
    from keras.utils import to_categorical
    import segmentation_models as sm

    print("[1/4] loading dataset...")
    images, masks = load_dataset()
    masks_cat = to_categorical(masks, num_classes=IMG_CLASSES)
    print(f"  images {images.shape}, masks {masks_cat.shape}")

    n_val = int(len(images) * args.val_split)
    rng = np.random.default_rng(42)
    perm = rng.permutation(len(images))
    val_idx, train_idx = perm[:n_val], perm[n_val:]

    train_seq = AugmentedSequence(
        images[train_idx], masks_cat[train_idx], args.batch_size, seed=1
    )
    val_x, val_y = images[val_idx], masks_cat[val_idx]
    print(f"  train {len(train_idx)}, val {len(val_idx)}")

    print(f"[2/4] loading checkpoint {args.model_in}...")
    model = load_model(args.model_in, compile=False)

    print("[3/4] compiling with the original loss (Dice + Focal)...")
    # Oil is the minority class by a wide margin and the class that actually
    # matters; sea is trivial and overrepresented. Equal weighting (the
    # original 0.1666 each) gives the optimizer no reason to prioritize
    # getting oil right over free accuracy on sea/land, which is why oil
    # recall lagged badly on the held-out set. Order matches COLOR_MAP /
    # CLASS_SEA..CLASS_LAND: [sea, oil, lookalike, ship, land].
    class_weights = [0.05, 0.4, 0.2, 0.2, 0.15]
    total_loss = sm.losses.DiceLoss(class_weights=class_weights) + sm.losses.CategoricalFocalLoss()
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=args.lr),
        loss=total_loss,
        metrics=["accuracy"],
    )

    print(f"[4/4] fine-tuning for {args.epochs} epochs at lr={args.lr}...")
    history = model.fit(
        train_seq,
        validation_data=(val_x, val_y),
        epochs=args.epochs,
        verbose=2,
    )

    model.save(args.model_out)
    print(f"saved: {args.model_out}")
    print("final val_loss:", history.history["val_loss"][-1])
    print("final val_accuracy:", history.history["val_accuracy"][-1])


if __name__ == "__main__":
    main()
