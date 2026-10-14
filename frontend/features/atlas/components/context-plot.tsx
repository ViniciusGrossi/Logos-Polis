"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ContextPoint } from "../types";
import { number, pct } from "../format";

interface Selection {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
const chartDefaults = {
  width: 760,
  height: 390,
  left: 65,
  top: 20,
  right: 25,
  bottom: 55,
};
export function ContextPlot({
  points,
  unit,
  measure,
  selectedId,
  highlighted,
  onSelect,
  onHighlight,
}: {
  points: ContextPoint[];
  unit: string;
  measure: "share" | "delta";
  selectedId: string | null;
  highlighted: string[];
  onSelect: (id: string) => void;
  onHighlight: (ids: string[]) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(chartDefaults.width);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0)
        setWidth(Math.max(240, Math.floor(entry.contentRect.width)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const chart = { ...chartDefaults, width };
  const [brush, setBrush] = useState<Selection | null>(null);
  const [hover, setHover] = useState<ContextPoint | null>(null);
  const domain = useMemo(
    () => ({
      maxX: Math.max(1, ...points.map((p) => p.x)) * 1.04,
      minY:
        measure === "share"
          ? 0
          : Math.min(-1, ...points.map((p) => p.y)) * 1.08,
      maxY:
        measure === "share"
          ? 100
          : Math.max(1, ...points.map((p) => p.y)) * 1.08,
    }),
    [points, measure],
  );
  const plotWidth = chart.width - chart.left - chart.right,
    plotHeight = chart.height - chart.top - chart.bottom;
  const x = (value: number) => chart.left + (value / domain.maxX) * plotWidth;
  const y = (value: number) =>
    chart.top +
    ((domain.maxY - value) / (domain.maxY - domain.minY)) * plotHeight;
  const coords = (event: React.PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * chart.width,
      y: ((event.clientY - box.top) / box.height) * chart.height,
    };
  };
  function finish(event: React.PointerEvent<SVGSVGElement>) {
    if (!brush) return;
    const end = coords(event);
    const lowX = Math.min(brush.x0, end.x),
      highX = Math.max(brush.x0, end.x),
      lowY = Math.min(brush.y0, end.y),
      highY = Math.max(brush.y0, end.y);
    if (highX - lowX > 5 && highY - lowY > 5)
      onHighlight(
        points
          .filter(
            (p) =>
              x(p.x) >= lowX &&
              x(p.x) <= highX &&
              y(p.y) >= lowY &&
              y(p.y) <= highY,
          )
          .map((p) => p.territory.id),
      );
    setBrush(null);
  }
  return (
    <div className="atlas-scatter-wrap" ref={ref}>
      <svg
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        style={{ height: chart.height }}
        role="img"
        aria-label="Dispersão entre contexto municipal e votação. Arraste para selecionar municípios."
        onPointerDown={(event) => {
          if (
            event.target === event.currentTarget ||
            event.target instanceof SVGRectElement
          ) {
            const p = coords(event);
            setBrush({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
            event.currentTarget.setPointerCapture(event.pointerId);
          }
        }}
        onPointerMove={(event) => {
          if (brush) {
            const p = coords(event);
            setBrush({ ...brush, x1: p.x, y1: p.y });
          }
        }}
        onPointerUp={finish}
        onPointerCancel={() => setBrush(null)}
      >
        <rect
          x={chart.left}
          y={chart.top}
          width={plotWidth}
          height={plotHeight}
          className="atlas-plot-area"
        />
        {[0, 1, 2, 3, 4].map((i) => {
          const value = domain.minY + ((domain.maxY - domain.minY) * i) / 4;
          return (
            <g key={i}>
              <line
                x1={chart.left}
                y1={y(value)}
                x2={chart.width - chart.right}
                y2={y(value)}
                className="atlas-gridline"
              />
              <text x={chart.left - 10} y={y(value) + 4} textAnchor="end">
                {Math.round(value)}
                {measure === "share" ? "%" : ""}
              </text>
            </g>
          );
        })}
        {[0, 1, 2, 3, 4].map((i) => {
          const value = (domain.maxX * i) / 4;
          return (
            <text
              key={i}
              x={x(value)}
              y={chart.height - 25}
              textAnchor="middle"
            >
              {number(Math.round(value))}
            </text>
          );
        })}
        <text x={chart.width / 2} y={chart.height - 4} textAnchor="middle">
          {unit}
        </text>
        {points.map((point) => (
          <circle
            key={point.territory.id}
            cx={x(point.x)}
            cy={y(point.y)}
            r={point.territory.id === selectedId ? 5 : 3.1}
            tabIndex={-1}
            className={`atlas-scatter-point ${point.territory.id === selectedId || highlighted.includes(point.territory.id) ? "selected" : ""} ${highlighted.length && !highlighted.includes(point.territory.id) ? "muted" : ""}`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onSelect(point.territory.id)}
            onMouseEnter={() => setHover(point)}
            onMouseLeave={() => setHover(null)}
          >
            <title>
              {point.territory.name}: {point.x} {unit}; {point.y.toFixed(1)}
              {measure === "share" ? "%" : " p.p."}
            </title>
          </circle>
        ))}
        {brush && (
          <rect
            className="atlas-brush"
            x={Math.min(brush.x0, brush.x1)}
            y={Math.min(brush.y0, brush.y1)}
            width={Math.abs(brush.x1 - brush.x0)}
            height={Math.abs(brush.y1 - brush.y0)}
          />
        )}
      </svg>
      {hover && (
        <div className="atlas-scatter-tooltip">
          <b>{hover.territory.name}</b>
          <span>
            {number(Math.round(hover.x))} {unit} ·{" "}
            {measure === "share" ? pct(hover.y) : `${hover.y.toFixed(1)} p.p.`}
          </span>
        </div>
      )}
      <p className="atlas-helper">
        Arraste uma área para realçar os mesmos municípios no mapa. Clique em um
        ponto para abrir o dossiê. A tabela oferece acesso por teclado.
      </p>
    </div>
  );
}
