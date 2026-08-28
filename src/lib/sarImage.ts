/**
 * Metadata for the real Sentinel-1 SAR scene used across the dashboard.
 *
 * These are real, static renders — not live detections. They were generated
 * once from an actual Sentinel-1B pass over the MV Wakashio grounding site
 * (Mahebourg lagoon, Mauritius, 10 Aug 2020) via `scripts/generate-sar-images.md`:
 * radiometrically calibrated to sigma-nought, speckle-filtered, and segmented
 * with a real CFAR dark-spot detector. The red overlay is a genuine detection
 * result on that scene, not an illustration.
 */
export const sarImageMeta = {
  sceneId: "S1B_IW_GRDH_1SDV_20200810T013755_20200810T013820_022854_02B625",
  platform: "Sentinel-1B",
  acquiredAt: "2020-08-10T01:38:07Z",
  mode: "IW",
  polarizations: ["VV", "VH"],
  orbitState: "descending",
  detectedAreaKm2: 18.07,
  thresholdDb: -18.64,
  location: "Mahébourg Lagoon, Mauritius — MV Wakashio grounding site",
  eventLabel: "MV Wakashio oil spill, Aug 2020",
};

export const sarImages = {
  raw: "/sar/sar-raw.jpg",
  compare: "/sar/sar-compare.jpg",
  mask: "/sar/sar-mask.jpg",
  thumb: "/sar/sar-thumb.jpg",
};
