# God's Eye — Maritime Oil Spill Intelligence

Frontend prototype for **Smart India Hackathon 2026**
Problem Statement **SIH26143** · Theme: Space Technology · Team **BlueVision**

> Leveraging satellite imagery to determine oil spills at sea, along with AIS data
> correlations to identify the vessel responsible for the spill.

This is a **frontend demo**. All data is realistic mock data in `src/lib/mockData.ts` —
no backend or live satellite feed is required to run or present it.

## Running it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:3000

## Screens (one per pipeline stage)

| Route | Feature from the deck |
| --- | --- |
| `/` | Landing — idea framing and the full question pipeline |
| `/dashboard` | Mission overview — pipeline status, KPIs, live map, spill trend |
| `/dashboard/detection` | *Is there an oil spill?* — SAR scene, U-Net mask, look-alike filtering |
| `/dashboard/characterization` | *How big is it?* — area, perimeter, thickness, volume estimation |
| `/dashboard/oiltype` | *What kind of oil?* — spectral signature match, classifier ranking |
| `/dashboard/drift` | *Where did it come from / go?* — backward hindcast, forward forecast, at-risk assets |
| `/dashboard/vessels` | *Which ship is most suspicious?* — AIS+SAR correlation, ranking, SHAP explainability |
| `/dashboard/evidence` | Evidence file, authority alerting, cleanup recommendation |
| `/dashboard/tech` | Technical approach and tech stack |

## Regenerating presentation screenshots

High-resolution (2x) full-page PNGs for the slide deck are in `screenshots/`.
With the dev server running:

```bash
npm run screenshots
```

Uses your installed Google Chrome via `puppeteer-core` — no extra browser download.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · MapLibre GL JS · Plotly.js · lucide-react

Basemap tiles are Esri dark canvas (OpenStreetMap data) — no API key needed.
# God-s-Eye
