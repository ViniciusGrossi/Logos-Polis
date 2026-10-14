import React from "react";
import { createRoot } from "react-dom/client";
import { AtlasClient } from "./atlas-client";
import "./atlas.css";

const measurement = document.getElementById("atlas-preview-measurement");
if (measurement) {
  const started = performance.now();
  let initial = true,
    interaction: number | null = null;
  document.addEventListener(
    "change",
    (event) => {
      if (event.target instanceof HTMLSelectElement) {
        interaction = performance.now();
        measurement.textContent = "Atualizando indicador…";
      }
    },
    true,
  );
  const observer = new MutationObserver(() => {
    if (
      !document.querySelector('.atlas-map-canvas[data-atlas-rendered="true"]')
    )
      return;
    void document.fonts.ready.then(() => {
      if (initial) {
        initial = false;
        measurement.textContent = `Mapa pronto: ${Math.round(performance.now())} ms desde a navegação; ${Math.round(performance.now() - started)} ms após início do cliente`;
      } else if (interaction !== null) {
        measurement.textContent = `Filtro pronto: ${Math.round(performance.now() - interaction)} ms`;
        interaction = null;
      }
    });
  });
  observer.observe(document.getElementById("root")!, {
    subtree: true,
    attributes: true,
    attributeFilter: ["data-atlas-rendered"],
  });
  const vitals = document.getElementById("atlas-preview-vitals");
  let lcp: number | null = null;
  let cls = 0;
  let windowScore = 0;
  let windowStart = 0;
  let lastShift = 0;
  const showVitals = () => {
    if (vitals)
      vitals.textContent = `LCP observado: ${lcp === null ? "indisponível" : `${Math.round(lcp)} ms`} · CLS observado: ${cls.toFixed(3)} · medição desta navegação local`;
  };
  if (PerformanceObserver.supportedEntryTypes.includes("largest-contentful-paint")) {
    new PerformanceObserver((entries) => {
      lcp = entries.getEntries().at(-1)?.startTime ?? lcp;
      showVitals();
    }).observe({ type: "largest-contentful-paint", buffered: true });
  }
  if (PerformanceObserver.supportedEntryTypes.includes("layout-shift")) {
    new PerformanceObserver((entries) => {
      for (const entry of entries.getEntries()) {
        const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
        if (!shift.hadRecentInput) {
          if (shift.startTime - lastShift > 1000 || shift.startTime - windowStart > 5000) {
            windowScore = shift.value;
            windowStart = shift.startTime;
          } else windowScore += shift.value;
          lastShift = shift.startTime;
          cls = Math.max(cls, windowScore);
        }
      }
      showVitals();
    }).observe({ type: "layout-shift", buffered: true });
  }
  showVitals();
}

// Standalone loopback demonstration. Uses the same component and public snapshots,
// without changing authentication on the actual Polis page or APIs.
createRoot(document.getElementById("root")!).render(
  <AtlasClient
    initialParams={Object.fromEntries(new URLSearchParams(location.search))}
  />,
);
