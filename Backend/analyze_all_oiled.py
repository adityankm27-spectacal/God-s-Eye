import os
import cv2
import numpy as np
import sar_inference as si
from keras.models import load_model

TEST_IMG_DIR = "data/kaggle_oilspill/oil-spill/test/images"
TEST_LABEL_DIR = "data/kaggle_oilspill/oil-spill/test/labels"
COLOR_MAP = [[0,0,0],[0,255,255],[255,0,0],[153,76,0],[0,153,0]]

def load_mask_labels(path):
    m = cv2.imread(path, cv2.IMREAD_COLOR)
    m = cv2.cvtColor(m, cv2.COLOR_BGR2RGB)
    out = np.zeros(m.shape[:2], dtype=np.uint8)
    for i, color in enumerate(COLOR_MAP):
        out[np.all(m == color, axis=-1)] = i
    return out

model = load_model("models/deeplab_oil_finetuned.h5", compile=False)

files = sorted(os.listdir(TEST_IMG_DIR))
label_files = sorted(os.listdir(TEST_LABEL_DIR))

rows = []
for img_f, lbl_f in zip(files, label_files):
    arr = cv2.imread(os.path.join(TEST_IMG_DIR, img_f), cv2.IMREAD_GRAYSCALE).astype(np.float32)
    norm = si.normalise_8bit(arr)
    true_labels = load_mask_labels(os.path.join(TEST_LABEL_DIR, lbl_f))
    true_oil = true_labels == si.CLASS_OIL
    if true_oil.sum() == 0:
        continue

    probs = si.predict_scene(model, norm)
    pred_labels = np.argmax(probs, axis=-1)
    if pred_labels.shape != true_labels.shape:
        pred_labels = cv2.resize(pred_labels.astype(np.uint8), (true_labels.shape[1], true_labels.shape[0]), interpolation=cv2.INTER_NEAREST)

    pred_oil = pred_labels == si.CLASS_OIL
    tp = int(np.logical_and(true_oil, pred_oil).sum())
    fn = int(np.logical_and(true_oil, ~pred_oil).sum())
    recall = tp / (tp + fn) if (tp+fn) > 0 else 0.0

    rows.append({
        "file": img_f,
        "mean": float(norm.mean()),
        "std": float(norm.std()),
        "true_oil_frac": float(true_oil.sum() / true_oil.size),
        "recall": recall,
    })

# sort by recall ascending
rows.sort(key=lambda r: r["recall"])
print(f"{'file':<14} {'mean':>7} {'std':>7} {'oil%':>7} {'recall':>7}")
for r in rows:
    print(f"{r['file']:<14} {r['mean']:>7.3f} {r['std']:>7.3f} {100*r['true_oil_frac']:>6.2f}% {r['recall']:>7.3f}")

import numpy as np
means = np.array([r["mean"] for r in rows])
stds = np.array([r["std"] for r in rows])
recalls = np.array([r["recall"] for r in rows])
oilfrac = np.array([r["true_oil_frac"] for r in rows])

zero_mask = recalls == 0.0
print(f"\nn={len(rows)}, zero-recall n={zero_mask.sum()}")
print(f"mean(std) for zero-recall: {stds[zero_mask].mean():.4f} vs rest: {stds[~zero_mask].mean():.4f}")
print(f"mean(mean) for zero-recall: {means[zero_mask].mean():.4f} vs rest: {means[~zero_mask].mean():.4f}")
print(f"mean(oil_frac) for zero-recall: {oilfrac[zero_mask].mean():.4f} vs rest: {oilfrac[~zero_mask].mean():.4f}")
print(f"\ncorrelation(std, recall): {np.corrcoef(stds, recalls)[0,1]:.3f}")
print(f"correlation(mean, recall): {np.corrcoef(means, recalls)[0,1]:.3f}")
print(f"correlation(oil_frac, recall): {np.corrcoef(oilfrac, recalls)[0,1]:.3f}")
