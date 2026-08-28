import Topbar from "@/components/Topbar";
import { Card } from "@/components/ui";
import { Settings2 } from "lucide-react";

const stack = [
  { group: "Satellite Data", items: ["Sentinel-1 SAR", "Sentinel-2 Optical"] },
  { group: "Image Processing", items: ["OpenCV", "NumPy", "SciPy"] },
  { group: "Raster Processing", items: ["Rasterio", "GDAL"] },
  { group: "AI / ML", items: ["PyTorch", "U-Net / DeepLabV3+", "YOLO (opt.)"] },
  { group: "Geospatial", items: ["GeoPandas", "Shapely", "PyProj"] },
  { group: "Ocean Data", items: ["Copernicus Marine (Currents, Waves)"] },
  { group: "Weather Data", items: ["Copernicus / CAMS (Wind, Weather)"] },
  { group: "Drift Modeling", items: ["OpenDrift"] },
  { group: "AIS Processing", items: ["Python", "Pandas", "MovingPandas"] },
  { group: "Database", items: ["PostgreSQL + PostGIS"] },
  { group: "Attribution Engine", items: ["XGBoost", "LightGBM"] },
  { group: "Explainability", items: ["SHAP"] },
  { group: "Backend", items: ["FastAPI"] },
  { group: "Frontend", items: ["Next.js (React)", "Tailwind CSS"] },
  { group: "Maps", items: ["MapLibre GL JS / Leaflet"] },
  { group: "Charts", items: ["Plotly.js"] },
  { group: "Authentication", items: ["Firebase (Auth)"] },
  { group: "Deployment", items: ["Docker"] },
];

export default function TechPage() {
  return (
    <>
      <Topbar title="Technical Approach" subtitle="Tech stack & methodology, as proposed in the SIH 2026 submission" />
      <main className="flex-1 space-y-5 p-4 md:p-6">
        <Card title="Tech Stack" icon={Settings2}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stack.map((s) => (
              <div key={s.group} className="rounded-lg border border-border bg-surface-2 p-3">
                <p className="text-xs font-semibold text-accent mb-1.5">{s.group}</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.items.map((i) => (
                    <span key={i} className="rounded-full bg-surface border border-border px-2 py-0.5 text-[11px] text-muted">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Pipeline" subtitle="Data Acquisition → Detection Engine → Attribution Analysis → Response Analysis" icon={Settings2}>
          <p className="text-xs text-muted leading-relaxed">
            Sentinel-1 SAR + Sentinel-2 optical passes are preprocessed (speckle filtering, geo-referencing) then run through
            an AI segmentation model to isolate candidate dark spots. A wind-gated, shape/texture XGBoost filter discards
            look-alikes. Confirmed slicks are characterized (area, thickness, volume), spectrally matched to an oil-type
            library, and back/forward-tracked using OpenDrift with wind and current forcing. AIS trajectories are
            correlated against the SAR-derived origin to rank candidate vessels, and an evidence file is compiled and
            routed to the nearest maritime authority.
          </p>
        </Card>
      </main>
    </>
  );
}
