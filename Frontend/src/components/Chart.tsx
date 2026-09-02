"use client";

import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const baseLayout: Record<string, unknown> = {
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  font: { color: "#8593ad", size: 11, family: "var(--font-sans)" },
  margin: { l: 40, r: 20, t: 20, b: 36 },
  xaxis: { gridcolor: "#1e293b", zerolinecolor: "#1e293b" },
  yaxis: { gridcolor: "#1e293b", zerolinecolor: "#1e293b" },
  legend: { orientation: "h", y: -0.25 },
};

export default function Chart({
  data,
  layout,
  height = 260,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  layout?: Record<string, unknown>;
  height?: number;
}) {
  return (
    <Plot
      data={data}
      layout={{ ...baseLayout, ...layout, height }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: "100%" }}
    />
  );
}
