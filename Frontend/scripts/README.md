# Scripts

## `generate-sar-images.py`

One-off generator that produced `public/sar/*.jpg` and `public/sar/sar-meta.json`.
Not called at build time — its output is committed as static assets.

Fetches the real Sentinel-1B pass over the MV Wakashio grounding site (Mahébourg
Lagoon, Mauritius, 10 Aug 2020) from Microsoft's Planetary Computer STAC catalogue
(no API key needed), radiometrically calibrates it to sigma-nought using the
product's own calibration and noise LUTs, applies a Lee speckle filter, warps it
to a north-up frame, and runs a real adaptive CFAR dark-spot detector to produce
the red overlay — not an illustration.

Re-run only if you want to regenerate the images (e.g. a different AOI crop or a
different documented spill):

```bash
python3.11 -m venv .venv
.venv/bin/pip install pystac-client planetary-computer rasterio numpy scipy shapely pillow global-land-mask httpx
.venv/bin/python scripts/generate-sar-images.py
```

Outputs go to `public/sar/`: `sar-raw.jpg`, `sar-compare.jpg`, `sar-mask.jpg`,
`sar-thumb.jpg`, `sar-meta.json`. If you change the scene or AOI, update
`src/lib/sarImage.ts` to match the new `sar-meta.json`.
