"use client";

import { useEffect, useRef } from "react";
import { Map as MLMap, Marker, Popup, NavigationControl, LngLatBounds } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  activeSpill,
  slickPolygon,
  backwardDrift,
  forwardDrift,
  vessels as allVessels,
  coastalAssets,
  Vessel,
} from "@/lib/mockData";

// Esri's light canvas is served without an API key and does not trip rate-limit
// watermarks mid-demo. Note Esri orders tile paths {z}/{y}/{x}.
const LIGHT_STYLE = {
  version: 8 as const,
  sources: {
    basemap: {
      type: "raster" as const,
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 16,
      attribution: "© Esri, © OpenStreetMap contributors",
    },
  },
  layers: [
    // Painted under the tiles so the ocean reads as light before tiles load.
    { id: "bg", type: "background" as const, paint: { "background-color": "#EAF6F8" } },
    { id: "basemap-layer", type: "raster" as const, source: "basemap" },
  ],
};

export interface MapViewProps {
  height?: number | string;
  showSlick?: boolean;
  showBackwardDrift?: boolean;
  showForwardDrift?: boolean;
  showVessels?: boolean;
  showCoastalAssets?: boolean;
  highlightVesselId?: string;
  center?: [number, number];
  zoom?: number;
  className?: string;
  /** Overrides the illustrative mock slick with a real detection polygon
   *  (e.g. from a job's geojson) and its popup content/marker position. */
  slickPolygon?: [number, number][];
  slickCenter?: [number, number];
  slickPopupHtml?: string;
}

export default function MapView({
  height = 420,
  showSlick = false,
  showBackwardDrift = false,
  showForwardDrift = false,
  showVessels = false,
  showCoastalAssets = false,
  highlightVesselId,
  center,
  zoom = 9,
  className,
  slickPolygon: slickPolygonProp,
  slickCenter,
  slickPopupHtml,
}: MapViewProps) {
  const slickPolygonToShow = slickPolygonProp ?? slickPolygon;
  const slickCenterToShow = slickCenter ?? [activeSpill.lng, activeSpill.lat];
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MLMap({
      container: containerRef.current,
      style: LIGHT_STYLE,
      center: center ?? (showSlick ? slickCenterToShow : [activeSpill.lng, activeSpill.lat]),
      zoom,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      // Slick polygon
      if (showSlick) {
        map.addSource("slick", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "Polygon", coordinates: [slickPolygonToShow] },
          },
        });
        map.addLayer({
          id: "slick-fill",
          type: "fill",
          source: "slick",
          paint: { "fill-color": "#f87171", "fill-opacity": 0.28 },
        });
        map.addLayer({
          id: "slick-line",
          type: "line",
          source: "slick",
          paint: { "line-color": "#f87171", "line-width": 2 },
        });

        const marker = document.createElement("div");
        marker.innerHTML = `<div style="position:relative;width:14px;height:14px;">
          <div class="pulse-ring" style="position:absolute;inset:0;border-radius:9999px;background:#f87171;"></div>
          <div style="position:absolute;inset:0;border-radius:9999px;background:#f87171;border:2px solid white;"></div>
        </div>`;
        new Marker({ element: marker })
          .setLngLat(slickCenterToShow)
          .setPopup(
            new Popup({ offset: 16 }).setHTML(
              slickPopupHtml ??
                `<div style="font-size:12px;font-family:sans-serif;"><strong>${activeSpill.name}</strong><br/>${activeSpill.areaKm2} km² · ${activeSpill.confidence}% confidence</div>`
            )
          )
          .addTo(map);
      }

      // Drift paths
      const addLine = (id: string, coords: [number, number][], color: string, dashed = false) => {
        map.addSource(id, {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } },
        });
        map.addLayer({
          id,
          type: "line",
          source: id,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": color,
            "line-width": 3,
            ...(dashed ? { "line-dasharray": [1, 1.4] } : {}),
          },
        });
      };
      if (showBackwardDrift) addLine("backward", backwardDrift, "#fbbf24", true);
      if (showForwardDrift) addLine("forward", forwardDrift, "#22d3ee", true);

      // Vessels
      if (showVessels) {
        allVessels.forEach((v: Vessel) => {
          const isHighlight = v.id === highlightVesselId;
          const color = v.suspicionScore > 70 ? "#f87171" : v.suspicionScore > 40 ? "#fbbf24" : "#34d399";
          const el = document.createElement("div");
          el.style.width = isHighlight ? "18px" : "13px";
          el.style.height = isHighlight ? "18px" : "13px";
          el.style.borderRadius = "4px";
          el.style.background = color;
          el.style.border = isHighlight ? "2px solid white" : "1px solid rgba(255,255,255,0.6)";
          el.style.transform = `rotate(${v.course}deg)`;
          el.style.cursor = "pointer";
          new Marker({ element: el })
            .setLngLat([v.lng, v.lat])
            .setPopup(
              new Popup({ offset: 12 }).setHTML(
                `<div style="font-size:12px;font-family:sans-serif;"><strong>${v.name}</strong><br/>${v.type}<br/>Suspicion: ${v.suspicionScore}%</div>`
              )
            )
            .addTo(map);
        });
      }

      // Coastal assets
      if (showCoastalAssets) {
        coastalAssets.forEach((a) => {
          const el = document.createElement("div");
          el.style.width = "10px";
          el.style.height = "10px";
          el.style.borderRadius = "9999px";
          el.style.background = "#a855f7";
          el.style.border = "1px solid white";
          new Marker({ element: el })
            .setLngLat([a.lng, a.lat])
            .setPopup(
              new Popup({ offset: 10 }).setHTML(
                `<div style="font-size:12px;font-family:sans-serif;"><strong>${a.name}</strong><br/>${a.type} · ETA ${a.etaHours}h</div>`
              )
            )
            .addTo(map);
        });
      }

      // Frame the map around whatever features are actually shown
      if (!center) {
        const pts: [number, number][] = [];
        if (showSlick) pts.push(...slickPolygonToShow);
        if (showBackwardDrift) pts.push(...backwardDrift);
        if (showForwardDrift) pts.push(...forwardDrift);
        if (showVessels) allVessels.forEach((v) => pts.push([v.lng, v.lat]));
        if (showCoastalAssets) coastalAssets.forEach((a) => pts.push([a.lng, a.lat]));
        if (pts.length > 1) {
          const bounds = pts.reduce(
            (b, p) => b.extend(p),
            new LngLatBounds(pts[0], pts[0])
          );
          map.fitBounds(bounds, { padding: 60, duration: 0, maxZoom: 10 });
        }
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height, width: "100%", borderRadius: "0.65rem", overflow: "hidden" }}
    />
  );
}
