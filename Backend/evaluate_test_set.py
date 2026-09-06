"""
Evaluate the served checkpoint on the full held-out test set (110 images,
data/kaggle_oilspill/oil-spill/test/), never touched by training or
fine-tuning.

Per-teammate request: rather than one pixel-weighted score blended across
the whole dataset, define a per-image pass/fail and average that. Standard
names for what was asked for, so the definition below is auditable:

  - "85-90% overlap on the actual spill"        -> RECALL (sensitivity) for
    the oil class: of the pixels that are truly oil, how many did we find.
    TP / (TP + FN)
  - "no more than 5-15% wrong spilled
    classification"                             -> FALSE DISCOVERY RATE for
    the oil class: of the pixels we called oil, how many actually weren't.
    FP / (TP + FP), i.e. 1 - precision

  A sample "passes" if recall >= RECALL_THRESHOLD and FDR <= FDR_THRESHOLD.
  The reported "pass rate" is the fraction of the test set that passes -
  that IS the requested "per-sample threshold, then average over test data."

Images with zero actual oil pixels (22 of 110 here) have undefined recall
(0/0) - for those, "pass" means we also predicted ~0 oil (no false alarm),
checked instead via FDR alone / near-zero predicted oil area.

Also reports the same whole-dataset precision/recall/F1 the original
training notebook computed, so this stays comparable to that number
(0.9569 / 0.9597 / 0.9561, pixel-weighted across ALL 5 classes) - that
figure and the per-image oil-only pass rate below answer different
questions and neither replaces the other.

Usage:
    ./venv/bin/python evaluate_test_set.py [--model models/deeplab_oil_finetuned.h5]
"""

import argparse
import os

import cv2
import numpy as np

import sar_inference as si

TEST_IMG_DIR = "data/kaggle_oilspill/oil-spill/test/images"
TEST_LABEL_DIR = "data/kaggle_oilspill/oil-spill/test/labels"

COLOR_MAP = [
    [0, 0, 0],
    [0, 255, 255],
    [255, 0, 0],
    [153, 76, 0],
    [0, 153, 0],
]

RECALL_THRESHOLD = 0.85   # lower bound of the requested 85-90% band
FDR_THRESHOLD = 0.15      # upper bound of the requested 5-15% band
NO_OIL_FALSE_ALARM_PX = 200  # matches MIN_SLICK_PIXELS - same noise floor


def load_mask_labels(path):
    m = cv2.imread(path, cv2.IMREAD_COLOR)
    m = cv2.cvtColor(m, cv2.COLOR_BGR2RGB)
    out = np.zeros(m.shape[:2], dtype=np.uint8)
    for i, color in enumerate(COLOR_MAP):
        out[np.all(m == color, axis=-1)] = i
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="models/deeplab_oil_finetuned.h5")
    args = ap.parse_args()

    from keras.models import load_model
    model = load_model(args.model, compile=False)

    files = sorted(os.listdir(TEST_IMG_DIR))
    label_files = sorted(os.listdir(TEST_LABEL_DIR))
    assert len(files) == len(label_files)

    per_image = []
    # For the whole-dataset 5-class precision/recall/F1 (comparable to the
    # original notebook's number).
    all_true, all_pred = [], []

    for img_f, lbl_f in zip(files, label_files):
        arr = cv2.imread(os.path.join(TEST_IMG_DIR, img_f), cv2.IMREAD_GRAYSCALE).astype(np.float32)
        norm = si.normalise_8bit(arr)
        probs = si.predict_scene(model, norm)
        pred_labels = np.argmax(probs, axis=-1)

        true_labels = load_mask_labels(os.path.join(TEST_LABEL_DIR, lbl_f))
        # Ground truth mask is at native image resolution; predictions are
        # already upsampled to native resolution inside predict_scene, but
        # confirm shapes line up before comparing pixel-for-pixel.
        if pred_labels.shape != true_labels.shape:
            pred_labels = cv2.resize(
                pred_labels.astype(np.uint8), (true_labels.shape[1], true_labels.shape[0]),
                interpolation=cv2.INTER_NEAREST,
            )

        all_true.append(true_labels.ravel())
        all_pred.append(pred_labels.ravel())

        true_oil = true_labels == si.CLASS_OIL
        pred_oil = pred_labels == si.CLASS_OIL

        tp = int(np.logical_and(true_oil, pred_oil).sum())
        fp = int(np.logical_and(~true_oil, pred_oil).sum())
        fn = int(np.logical_and(true_oil, ~pred_oil).sum())

        has_oil = bool(true_oil.sum() > 0)

        if has_oil:
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            fdr = fp / (tp + fp) if (tp + fp) > 0 else 0.0
            passed = recall >= RECALL_THRESHOLD and fdr <= FDR_THRESHOLD
        else:
            recall = None
            fdr = None
            passed = pred_oil.sum() <= NO_OIL_FALSE_ALARM_PX

        per_image.append({
            "file": img_f, "has_oil": has_oil, "recall": recall,
            "fdr": fdr, "predicted_oil_px": int(pred_oil.sum()), "passed": passed,
        })

    # --- Per-image pass-rate metric (what was actually asked for) ---
    n = len(per_image)
    n_passed = sum(1 for r in per_image if r["passed"])
    with_oil = [r for r in per_image if r["has_oil"]]
    without_oil = [r for r in per_image if not r["has_oil"]]

    print(f"=== Per-image pass/fail (recall >= {RECALL_THRESHOLD:.0%}, "
          f"false-discovery-rate <= {FDR_THRESHOLD:.0%}) ===")
    print(f"Overall pass rate: {n_passed}/{n} = {n_passed/n:.1%}")
    print(f"  images WITH actual oil ({len(with_oil)}): "
          f"{sum(1 for r in with_oil if r['passed'])}/{len(with_oil)} passed")
    print(f"  images with NO actual oil ({len(without_oil)}, checked for false alarms only): "
          f"{sum(1 for r in without_oil if r['passed'])}/{len(without_oil)} passed")

    oil_recalls = [r["recall"] for r in with_oil]
    oil_fdrs = [r["fdr"] for r in with_oil]
    print(f"\nAmong images with actual oil:")
    print(f"  mean recall (coverage of true spill):  {np.mean(oil_recalls):.3f}")
    print(f"  mean FDR (share of flagged oil that's wrong): {np.mean(oil_fdrs):.3f}")

    print("\nWorst 5 by recall (hardest to fully catch):")
    for r in sorted(with_oil, key=lambda r: r["recall"])[:5]:
        print(f"  {r['file']}: recall={r['recall']:.2f} fdr={r['fdr']:.2f} passed={r['passed']}")

    print("\nWorst 5 by FDR (most false-alarm-prone):")
    for r in sorted(with_oil, key=lambda r: -r["fdr"])[:5]:
        print(f"  {r['file']}: recall={r['recall']:.2f} fdr={r['fdr']:.2f} passed={r['passed']}")

    false_alarms = [r for r in without_oil if not r["passed"]]
    if false_alarms:
        print(f"\nFalse alarms on clean scenes ({len(false_alarms)}):")
        for r in false_alarms:
            print(f"  {r['file']}: predicted {r['predicted_oil_px']} oil px (threshold {NO_OIL_FALSE_ALARM_PX})")

    # --- Whole-dataset 5-class precision/recall/F1, comparable to the
    #     original notebook's reported 0.9569/0.9597/0.9561 ---
    from sklearn.metrics import precision_score, recall_score, f1_score
    yt = np.concatenate(all_true)
    yp = np.concatenate(all_pred)
    p = precision_score(yt, yp, average="weighted", zero_division=0)
    r = recall_score(yt, yp, average="weighted", zero_division=0)
    f1 = f1_score(yt, yp, average="weighted", zero_division=0)
    print(f"\n=== Whole-dataset pixel-weighted, all 5 classes (comparable to "
          f"the original notebook's 0.9569/0.9597/0.9561) ===")
    print(f"Precision: {p:.4f}  Recall: {r:.4f}  F1: {f1:.4f}")


if __name__ == "__main__":
    main()
