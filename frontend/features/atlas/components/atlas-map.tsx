"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import {
  type GeoJSONSource,
  type LngLatBoundsLike,
  type Map as LibreMap,
} from "maplibre-gl";
import type { FeatureCollection, Geometry, Position } from "geojson";
import { Minus, Plus, RotateCcw, RotateCw, Box, Square, Mountain } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import type {
  AtlasGeometry,
  AtlasIndicator,
  ComparisonRow,
  TerritoryRecord,
} from "../types";
import {
  candidateClass,
  candidatePct,
  displayName,
  margin,
  pct,
  pp,
  rate,
  validVotesLabel,
  winner,
} from "../format";
import { nextDetail, intersectsViewport, shouldEmitCamera, type AtlasCamera, type AtlasDetail } from "../map-navigation";
import { useMunicipalLayers } from "../use-municipal-layers";
export type { AtlasCamera } from "../map-navigation";
interface MapProps {
  geometry: AtlasGeometry;
  records: TerritoryRecord[];
  indicator: AtlasIndicator;
  symbols?: boolean;
  selectedId?: string | null;
  highlightedIds?: string[];
  comparison?: ComparisonRow[];
  delta?: boolean;
  changesOnly?: boolean;
  onSelect: (id: string) => void;
  camera?: AtlasCamera | null;
  onCameraChange?: (camera: AtlasCamera) => void;
  label?: string;
  controls?: boolean;
  perspective?: boolean;
  progressive?: { year: number; round: 1 | 2 };
  municipalComparison?: ComparisonRow[];
  liveCamera?: boolean;
}
interface MapPalette {
  pt: string;
  bolsonaro: string;
  other: string;
  neutral: string;
  cyan: string;
  gold: string;
  border: string;
  text: string;
  background: string;
}
function palette(element: HTMLElement): MapPalette {
  const style = getComputedStyle(element);
  const read = (key: string) => style.getPropertyValue(key).trim();
  return {
    pt: read("--atlas-party-pt"),
    bolsonaro: read("--atlas-party-bolsonaro"),
    other: read("--atlas-party-other"),
    neutral: read("--atlas-map-neutral"),
    cyan: read("--atlas-cyan"),
    gold: read("--atlas-gold"),
    border: read("--atlas-map-border"),
    text: read("--atlas-text"),
    background: read("--atlas-bg"),
  };
}
function positions(geometry: Geometry): Position[] {
  if (geometry.type === "GeometryCollection")
    return geometry.geometries.flatMap(positions);
  const output: Position[] = [];
  function collect(value: unknown) {
    if (!Array.isArray(value)) return;
    if (typeof value[0] === "number" && typeof value[1] === "number")
      output.push([value[0], value[1]]);
    else value.forEach(collect);
  }
  collect(geometry.coordinates);
  return output;
}
function shaded(color: string, opacity: number, background: string): string {
  const rgb = (hex: string) =>
    /^#[\da-f]{6}$/i.test(hex)
      ? [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16))
      : null;
  const front = rgb(color),
    back = rgb(background);
  return front && back
    ? `rgb(${front.map((channel, index) => Math.round(channel * opacity + back[index] * (1 - opacity))).join(",")})`
    : color;
}
function bounds(geometry: AtlasGeometry): LngLatBoundsLike {
  let west = Infinity,
    east = -Infinity,
    south = Infinity,
    north = -Infinity;
  geometry.features.forEach((feature) =>
    positions(feature.geometry).forEach(([x, y]) => {
      west = Math.min(west, x);
      east = Math.max(east, x);
      south = Math.min(south, y);
      north = Math.max(north, y);
    }),
  );
  return [
    [west, south],
    [east, north],
  ];
}
function pointCenter(geometry: Geometry): [number, number] {
  const coords = positions(geometry);
  let x = 0,
    y = 0;
  coords.forEach((point) => {
    x += point[0];
    y += point[1];
  });
  return coords.length ? [x / coords.length, y / coords.length] : [0, 0];
}
function frameGeometry(
  map: LibreMap,
  geometry: AtlasGeometry,
  relief: boolean,
  duration = 0,
) {
  const width=map.getContainer().clientWidth;
  const immersive=!!map.getContainer().closest(".atlas-immersive");
  const padding=immersive
    ? width>900 ? {top:180,bottom:130,left:360,right:100}
      : width>600 ? {top:160,bottom:150,left:32,right:80}
        : {top:210,bottom:150,left:24,right:74}
    : {top:36,bottom:60,left:35,right:35};
  map.fitBounds(bounds(geometry), {
    padding,
    pitch: relief ? 45 : 0,
    bearing: relief ? -8 : 0,
    duration: relief ? 0 : duration,
    maxZoom: 8,
  });
  // FitBounds targets the ground plane; compensate modestly for foreshortening.
  if (relief) map.setZoom(map.getZoom() + 0.3);
}
function indicatorValue(
  record: TerritoryRecord | undefined,
  indicator: AtlasIndicator,
): number | null {
  const metric = record?.metric;
  if (!metric) return null;
  switch (indicator) {
    case "margin":
      return margin(metric);
    case "turnout":
      return rate(metric.turnout, metric.eligible);
    case "abstention":
      return rate(metric.abstentions, metric.eligible);
    case "blank":
      return rate(metric.blankVotes, metric.turnout);
    case "null":
      return rate(metric.nullVotes, metric.turnout);
    default: {
      const candidate = winner(metric);
      return candidate ? candidatePct(candidate, metric) : null;
    }
  }
}

export function AtlasMap({
  geometry: scopeGeometry,
  records: scopeRecords,
  indicator,
  symbols = false,
  selectedId,
  highlightedIds = [],
  comparison,
  delta = false,
  changesOnly = false,
  onSelect,
  camera,
  onCameraChange,
  label = "Mapa eleitoral interativo",
  controls = true,
  perspective = false,
  progressive,
  municipalComparison,
  liveCamera = false,
}: MapProps) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<LibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const [painted, setPainted] = useState(false);
  const [failure, setFailure] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const activeHover = hovered ?? focused;
  const [depthChoice, setDepthChoice] = useState(camera?.pitch !== 0);
  const reliefEnabled = perspective && depthChoice && !symbols;
  const [detail, setDetail] = useState<AtlasDetail>("states");
  const [visibleUfs, setVisibleUfs] = useState<string[]>([]);
  const progressiveEnabled = !!progressive;
  const municipal = useMunicipalLayers(detail === "municipalities" ? visibleUfs : [], progressive);
  const geometry = useMemo<AtlasGeometry>(() => {
    if (!progressiveEnabled || detail !== "municipalities" || !municipal.blocks.length) return scopeGeometry;
    const loaded = new Set(municipal.blocks.map(block => block.uf));
    return {type:"FeatureCollection", features:[
      ...scopeGeometry.features.filter(feature => !loaded.has(feature.properties.id)),
      ...municipal.blocks.flatMap(block => block.geometry.features),
    ]};
  }, [scopeGeometry, detail, progressiveEnabled, municipal.blocks]);
  const records = useMemo(() => [...scopeRecords, ...municipal.blocks.flatMap(block => block.records)], [scopeRecords, municipal.blocks]);
  const selection = useRef(onSelect);
  const cameraHandler = useRef(onCameraChange);
  const sync = useRef(false);
  const markers = useRef<maplibregl.Marker[]>([]);
  const layout = useRef({ geometry: scopeGeometry, reliefEnabled, liveCamera });
  const initialCamera = useRef(camera);
  const cameraValue = useRef(camera);
  const framed = useRef(false);
  useEffect(() => {
    selection.current = onSelect;
    cameraHandler.current = onCameraChange;
    cameraValue.current = camera;
    layout.current = { geometry: scopeGeometry, reliefEnabled, liveCamera };
  }, [onSelect, onCameraChange, scopeGeometry, reliefEnabled, camera, liveCamera]);
  const byId = useMemo(
    () => new Map(records.map((record) => [record.territory.id, record])),
    [records],
  );
  const changeById = useMemo(
    () => new Map([...(comparison ?? []), ...(municipalComparison ?? [])].map((row) => [row.territory.id, row])),
    [comparison, municipalComparison],
  );
  const hoverRecord = activeHover ? byId.get(activeHover) : undefined;
  const hoverChange = activeHover ? changeById.get(activeHover) : undefined;

  useEffect(() => {
    if (!container.current) return;
    // Local worker: no CDN dependency and stable URL across bundlers.
    maplibregl.setWorkerUrl("/vendor/atlas/maplibre-worker.mjs");
    const colors = palette(container.current);
    let map: LibreMap;
    try {
      map = new maplibregl.Map({
        container: container.current,
        attributionControl: false,
        style: {
          version: 8,
          "font-faces": { "Atlas Map": [{url: "/fonts/polis/inter-latin.woff2"}] },
          light: { anchor: "viewport", color: colors.text, intensity: 0.45, position: [1.4, 210, 45] },
          sources: {},
          layers: [
            {
              id: "background",
              type: "background",
              paint: { "background-color": colors.background },
            },
          ],
        },
        center: [-52, -14],
        zoom: 2.2,
        pitch: 0,
        bearing: 0,
        minZoom: 1.5,
        maxZoom: 12,
        maxPitch: 60,
        renderWorldCopies: false,
        dragRotate: true,
        touchPitch: true,
        canvasContextAttributes: { antialias: true },
      });
    } catch {
      // Reflect an unavailable external WebGL renderer and keep the accessible table usable.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFailure(true);
      return;
    }
    instance.current = map;
    map.on("load", () => {
      map.addSource("territories", {
        type: "geojson",
        promoteId: "id",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "territory-fill",
        type: "fill",
        source: "territories",
        paint: {
          "fill-color": [
            "coalesce",
            ["feature-state", "color"],
            colors.neutral,
          ],
          "fill-opacity": ["coalesce", ["feature-state", "opacity"], 0.2],
        },
      });
      map.addLayer({
        id: "territory-relief",
        type: "fill-extrusion",
        source: "territories",
        paint: {
          "fill-extrusion-color": [
            "coalesce",
            ["feature-state", "reliefColor"],
            colors.neutral,
          ],
          "fill-extrusion-height": ["coalesce", ["feature-state", "height"], 0],
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": 0.95,
          "fill-extrusion-vertical-gradient": true,
        },
      });
      map.addLayer({
        id: "territory-line",
        type: "line",
        source: "territories",
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            colors.text,
            colors.border,
          ],
          "line-width": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            2,
            0.7,
          ],
          "line-opacity": 0.85,
        },
      });
      map.addLayer({
        id: "territory-selection",
        type: "line",
        source: "territories",
        paint: {
          "line-color": colors.cyan,
          "line-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            2.5,
            0,
          ],
          "line-opacity": 1,
        },
      });
      map.addSource("state-outlines", {type:"geojson", data:{type:"FeatureCollection",features:[]}});
      map.addLayer({id:"state-outlines", type:"line", source:"state-outlines", paint:{"line-color":colors.text,"line-width":0.8,"line-opacity":0.25}});
      map.addSource("municipal-labels", {type:"geojson", data:{type:"FeatureCollection",features:[]}});
      map.addLayer({id:"municipal-labels", type:"symbol",source:"municipal-labels",minzoom:6,layout:{"text-field":["get","name"],"text-font":["Atlas Map"],"text-size":13,"text-padding":5,"text-max-width":10},paint:{"text-color":colors.text,"text-halo-color":colors.background,"text-halo-width":2}});
      map.addSource("symbols", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "vote-symbols",
        type: "circle",
        source: "symbols",
        paint: {
          "circle-radius": ["get", "radius"],
          "circle-color": ["get", "color"],
          "circle-opacity": ["get", "opacity"],
          "circle-stroke-color": colors.text,
          "circle-stroke-width": 0.6,
          "circle-stroke-opacity": ["get", "opacity"],
        },
      });
      const click = (event: maplibregl.MapLayerMouseEvent) => {
        const id: unknown = event.features?.[0]?.properties?.id;
        if (typeof id === "string") selection.current(id);
      };
      const hover = (event: maplibregl.MapLayerMouseEvent) => {
        const id: unknown = event.features?.[0]?.properties?.id;
        setHovered(typeof id === "string" ? id : null);
        map.getCanvas().style.cursor = "pointer";
      };
      for (const layer of [
        "territory-fill",
        "territory-relief",
        "vote-symbols",
      ]) {
        map.on("click", layer, click);
        map.on("mousemove", layer, hover);
        map.on("mouseleave", layer, () => {
          setHovered(null);
          map.getCanvas().style.cursor = "grab";
        });
      }
      setReady(true);
    });
    const emitCamera = (event: "move" | "moveend") => {
      if (shouldEmitCamera(event, sync.current, layout.current.liveCamera, framed.current)) {
        const center = map.getCenter();
        cameraHandler.current?.({
          center: [center.lng, center.lat],
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing: map.getBearing(),
        });
      }
    };
    map.on("move", () => emitCamera("move"));
    map.on("moveend", () => emitCamera("moveend"));
    const updateDetail = () => {
      setDetail(previous => nextDetail(map.getZoom(), previous));
      const viewport = map.getBounds();
      const padding = 0.8;
      const area: [number,number,number,number] = [viewport.getWest()-padding,viewport.getSouth()-padding,viewport.getEast()+padding,viewport.getNorth()+padding];
      const ids = layout.current.geometry.features.filter(feature => {
        if (!/^[A-Z]{2}$/.test(feature.properties.id)) return false;
        const points = positions(feature.geometry);
        const bbox: [number,number,number,number] = [Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
        return intersectsViewport(bbox,area);
      }).map(feature => feature.properties.id).sort();
      setVisibleUfs(previous => previous.join(",") === ids.join(",") ? previous : ids);
    };
    map.on("moveend", updateDetail);
    map.on("idle", () => {
      if (
        container.current &&
        map.getSource("territories") &&
        map.querySourceFeatures("territories").length > 0
      )
        container.current.dataset.atlasRendered = "true";
      if (
        map.getSource("territories") &&
        map.querySourceFeatures("territories").length > 0
      )
        setPainted(true);
    });
    const observer = new ResizeObserver(() => {
      map.resize();
    });
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      map.remove();
      instance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = instance.current;
    if (!map || !ready) return;
    // Reflect pending external WebGL source rendering, cleared by its idle event.
    setPainted(false);
    if (container.current) container.current.dataset.atlasRendered = "false";
    (map.getSource("territories") as GeoJSONSource).setData(geometry);
    (map.getSource("state-outlines") as GeoJSONSource).setData({type:"FeatureCollection",features:scopeGeometry.features.filter(feature => /^[A-Z]{2}$/.test(feature.properties.id))});
    const labels: FeatureCollection = {type:"FeatureCollection",features:geometry.features.filter(feature=>! /^[A-Z]{2}$/.test(feature.properties.id)).map(feature=>({type:"Feature",geometry:{type:"Point",coordinates:pointCenter(feature.geometry)},properties:{name:displayName(feature.properties.name ?? feature.properties.id)}}))};
    (map.getSource("municipal-labels") as GeoJSONSource).setData(labels);
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];
    if (scopeGeometry.features.every((f) => /^[A-Z]{2}$/.test(f.properties.id))) {
      scopeGeometry.features.forEach((feature) => {
        const element = document.createElement("button");
        element.className = "atlas-state-label";
        element.textContent = feature.properties.id;
        element.setAttribute(
          "aria-label",
          `Abrir ${feature.properties.name ?? feature.properties.id}`,
        );
        element.onclick = () => selection.current(feature.properties.id);
        element.onmouseenter = () => setHovered(feature.properties.id);
        element.onmouseleave = () => setHovered(null);
        element.onfocus = () => setFocused(feature.properties.id);
        element.onblur = () => setFocused(null);
        const marker = new maplibregl.Marker({ element })
          .setLngLat(pointCenter(feature.geometry))
          .addTo(map);
        markers.current.push(marker);
      });
    }
  }, [geometry, scopeGeometry, ready]);

  useEffect(() => {
    const map = instance.current;
    if (!map || !ready) return;
    const firstFrame=!framed.current;
    framed.current = true;
    if (cameraValue.current) map.jumpTo({...cameraValue.current,pitch:layout.current.reliefEnabled?cameraValue.current.pitch:0});
    else if (firstFrame && initialCamera.current) map.jumpTo({...initialCamera.current,pitch:layout.current.reliefEnabled?initialCamera.current.pitch:0});
    else frameGeometry(map, scopeGeometry, layout.current.reliefEnabled);
  }, [scopeGeometry, ready]);

  useEffect(() => {
    const map = instance.current;
    if (!map || !ready) return;
    if (reliefEnabled && map.getPitch() === 0) map.setPitch(45);
    if (!reliefEnabled && map.getPitch() !== 0) map.setPitch(0);
    map.setLayoutProperty("territory-relief", "visibility", reliefEnabled ? "visible" : "none");
  }, [reliefEnabled, ready]);

  useEffect(() => {
    const map = instance.current;
    if (!map || !ready || !container.current) return;
    container.current.dataset.atlasRendered = "false";
    const colors = palette(container.current);
    const largest = Math.max(
      1,
      ...records.map((record) => record.metric?.validVotes ?? 0),
    );
    const features = geometry.features.map((feature) => {
      const id = feature.properties.id;
      const record = byId.get(id);
      const changed = changeById.get(id);
      const candidate = winner(record?.metric);
      const value = indicatorValue(record, indicator);
      const candidateKey = candidateClass(candidate) as
        "pt" | "bolsonaro" | "other" | "neutral";
      const color = delta
        ? changed?.deltaPp == null
          ? colors.neutral
          : changed.deltaPp < 0
            ? colors.gold
            : colors.cyan
        : value === null
          ? colors.neutral
          : indicator === "winner" || indicator === "margin"
            ? colors[candidateKey]
            : colors.cyan;
      // Shared fixed scale: winner margin 0..50pp, participation 0..100%; delta ±20pp.
      let opacity = delta
        ? 0.22 + Math.min(Math.abs(changed?.deltaPp ?? 0) / 20, 1) * 0.72
        : indicator === "winner" || indicator === "margin"
          ? 0.38 + Math.min((margin(record?.metric) ?? 0) / 50, 1) * 0.55
          : 0.16 + Math.min((value ?? 0) / 100, 1) * 0.8;
      if (value === null && !delta) opacity = 0.2;
      if (
        (changesOnly && !changed?.changed) ||
        (highlightedIds.length > 0 && !highlightedIds.includes(id))
      )
        opacity = 0.12;
      const symbolOpacity = opacity;
      if (symbols) opacity = 0.11;
      return {
        ...feature,
        properties: {
          ...feature.properties,
          id,
          color,
          opacity,
          symbolOpacity,
          selected: selectedId === id || highlightedIds.includes(id),
        },
      };
    });
    for (const feature of features) {
      map.setFeatureState(
        { source: "territories", id: feature.properties.id },
        {
          color: feature.properties.color,
          opacity: feature.properties.opacity,
          selected: feature.properties.selected,
          reliefColor: shaded(
            feature.properties.color,
            feature.properties.opacity,
            colors.background,
          ),
        },
      );
    }
    const pointFeatures: FeatureCollection = {
      type: "FeatureCollection",
      features: symbols
        ? features.map((feature) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates:
                byId.get(feature.properties.id)?.territory.centroid ??
                pointCenter(feature.geometry),
            },
            properties: {
              id: feature.properties.id,
              color: feature.properties.color,
              opacity: feature.properties.symbolOpacity,
              radius:
                Math.sqrt(
                  (byId.get(feature.properties.id)?.metric?.validVotes ?? 0) /
                    largest,
                ) * 42,
            },
          }))
        : [],
    };
    (map.getSource("symbols") as GeoJSONSource).setData(pointFeatures);
  }, [
    geometry,
    records,
    indicator,
    symbols,
    selectedId,
    highlightedIds,
    changeById,
    byId,
    delta,
    changesOnly,
    ready,
  ]);

  useEffect(() => {
    const map = instance.current;
    if (!map || !ready) return;
    for (const feature of geometry.features) {
      const id = feature.properties.id;
      const selected = id === selectedId || highlightedIds.includes(id);
      const hover = id === activeHover;
      map.setFeatureState(
        { source: "territories", id },
        {
          hover,
          // Equal, decorative relief. Never encode votes or physical altitude here.
          height:
            reliefEnabled
              ? hover
                ? (/^[A-Z]{2}$/.test(id) ? 70000 : 2600)
                : selected
                  ? (/^[A-Z]{2}$/.test(id) ? 65000 : 2200)
                  : (/^[A-Z]{2}$/.test(id) ? 22000 : 650)
              : 0,
        },
      );
    }
    markers.current.forEach((marker) => {
      const element = marker.getElement();
      element.classList.toggle("selected", element.textContent === selectedId);
      element.classList.toggle("hovered", element.textContent === activeHover);
      element.setAttribute(
        "aria-pressed",
        String(element.textContent === selectedId),
      );
    });
  }, [geometry, ready, activeHover, selectedId, highlightedIds, reliefEnabled]);

  useEffect(() => {
    const map = instance.current;
    if (!map || !ready || !camera) return;
    const current = map.getCenter();
    if (
      Math.abs(current.lng - camera.center[0]) < 0.00001 &&
      Math.abs(current.lat - camera.center[1]) < 0.00001 &&
      Math.abs(map.getZoom() - camera.zoom) < 0.00001 &&
      Math.abs(map.getPitch() - (reliefEnabled ? camera.pitch : 0)) < 0.00001 &&
      Math.abs(map.getBearing() - camera.bearing) < 0.00001
    )
      return;
    sync.current = true;
    map.jumpTo({...camera,pitch:reliefEnabled ? camera.pitch : 0});
    sync.current = false;
  }, [camera, ready, reliefEnabled]);

  return (
    <div
      className="atlas-map atlas-map-wrap"
      role="region"
      aria-label={label}
      data-depth={reliefEnabled ? "3d" : "2d"}
      data-selection={selectedId ?? ""}
      data-hover={activeHover ?? ""}
      data-detail={detail}
    >
      <div className="atlas-map-canvas" ref={container} />
      <div className="atlas-map-ambient" aria-hidden="true" />
      {label !== "Mapa eleitoral interativo" && (
        <div className="atlas-map-label">{label}</div>
      )}
      <div className="atlas-map-coordinate" aria-hidden="true">
        {reliefEnabled
          ? "Perspectiva · relevo visual, sem escala de altitude"
          : "Cartografia IBGE · vista 2D"}
      </div>
      {controls && (
        <div className="atlas-map-controls">
          {perspective && !symbols && (
            <button
              title={reliefEnabled ? "Ver mapa em 2D" : "Ver mapa em 3D"}
              aria-label={reliefEnabled ? "Ver mapa em 2D" : "Ver mapa em 3D"}
              aria-pressed={reliefEnabled}
              onClick={() => setDepthChoice((value) => !value)}
            >
              {reliefEnabled ? <Square size={16} /> : <Box size={16} />}
            </button>
          )}
          <button
            title="Aproximar mapa"
            aria-label="Aproximar mapa"
            onClick={() => instance.current?.zoomIn()}
          >
            <Plus size={16} />
          </button>
          <button
            title="Afastar mapa"
            aria-label="Afastar mapa"
            onClick={() => instance.current?.zoomOut()}
          >
            <Minus size={16} />
          </button>
          <button
            title="Reenquadrar mapa"
            aria-label="Reenquadrar mapa"
            onClick={() => {
              if (instance.current)
                frameGeometry(
                  instance.current,
                  scopeGeometry,
                  reliefEnabled,
                  cameraHandler.current ||
                    matchMedia("(prefers-reduced-motion: reduce)").matches
                    ? 0
                    : 180,
                );
            }}
          >
            <RotateCcw size={15} />
          </button>
          <button aria-label="Girar mapa à direita" title="Girar mapa à direita" onClick={() => {const map=instance.current;if(map) map.rotateTo(map.getBearing()+15, {duration:matchMedia("(prefers-reduced-motion: reduce)").matches?0:200});}}><RotateCw size={16}/></button>
          {reliefEnabled && <button aria-label="Alternar inclinação do mapa" title="Alternar inclinação do mapa" onClick={() => {const map=instance.current;if(map)map.easeTo({pitch:map.getPitch()>=55?30:map.getPitch()+15,duration:matchMedia("(prefers-reduced-motion: reduce)").matches?0:200});}}><Mountain size={16}/></button>}
        </div>
      )}
      {progressive && detail === "municipalities" && (municipal.pending || municipal.failed) && <div className="atlas-map-detail-status" role="status">{municipal.failed ? "Malha municipal indisponível. Estados permanecem visíveis; tente novamente ao reenquadrar." : "Carregando municípios deste enquadramento…"}</div>}
      {hoverRecord && hoverRecord.territory.id !== selectedId && (
        <div className="atlas-map-tooltip" aria-live="polite">
          <b>{hoverRecord.territory.name}</b>
          <span>
            {delta && hoverChange
              ? pp(hoverChange.deltaPp)
              : indicator === "winner"
                ? `${displayName(winner(hoverRecord.metric)?.name ?? "Empate / sem dado")} · ${pct(indicatorValue(hoverRecord, indicator))}`
                : pct(indicatorValue(hoverRecord, indicator))}
          </span>
          <small>
            {validVotesLabel(hoverRecord.metric)}
          </small>
        </div>
      )}
      {(!ready || !painted) && !failure && (
        <div className="atlas-map-loading" role="status">
          <div className="atlas-compass" />
          Preparando cartografia…
        </div>
      )}
      {failure && (
        <div className="atlas-map-loading" role="alert">
          Seu navegador não disponibilizou o mapa. Explore os mesmos dados na
          tabela abaixo.
        </div>
      )}
    </div>
  );
}
