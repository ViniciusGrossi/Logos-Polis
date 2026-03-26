'use client';

import { useMemo } from 'react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

interface HeatmapViewerProps {
  data: any[]; // GeoJSON FeatureCollection
  onPointClick?: (feature: any) => void;
  isLoading?: boolean;
}

const mapStyle = {
  version: 8,
  sources: {
    'raster-tiles': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'simple-tiles',
      type: 'raster',
      source: 'raster-tiles',
      minzoom: 0,
      maxzoom: 22
    }
  ]
};

export function HeatmapViewer({ data, onPointClick, isLoading }: HeatmapViewerProps) {
  const geoJsonData = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: data.map(item => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [item.lng, item.lat] // longitude, latitude
        },
        properties: { ...item }
      }))
    };
  }, [data]);

  return (
    <div className="w-full h-full min-h-[500px] border-2 border-slate-700 bg-slate-900 relative shadow-[4px_4px_0px_#1e293b]">
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
          <div className="font-mono text-emerald-400 animate-pulse tracking-widest uppercase text-sm font-bold">
            Carregando inteligência territorial...
          </div>
        </div>
      )}
      
      <Map
        initialViewState={{
          longitude: -46.6333,
          latitude: -23.5505,
          zoom: 11
        }}
        mapStyle={mapStyle as any}
        interactiveLayerIds={['points']}
        onClick={(e) => {
          if (e.features && e.features.length > 0 && onPointClick) {
            onPointClick(e.features[0].properties);
          }
        }}
      >
        <div className="absolute inset-0 pointer-events-none bg-slate-950/60 mix-blend-color" />
        {/* Camada Brutalista extra para escurecer o mapa base open-source */}

        {data.length > 0 && (
          <Source type="geojson" data={geoJsonData as any}>
            <Layer 
              id="heatmap"
              type="heatmap"
              paint={{
                'heatmap-weight': ['interpolate', ['linear'], ['get', 'score'], 0, 0, 100, 1],
                'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
                'heatmap-color': [
                  'interpolate', ['linear'], ['heatmap-density'],
                  0, 'rgba(0,0,0,0)',
                  0.2, '#1e293b',       // slate-800
                  0.4, '#f59e0b',       // amber-500
                  0.8, '#ef4444',       // red-500
                  1, '#b91c1c'          // red-700
                ],
                'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 30],
                'heatmap-opacity': 0.8
              }}
            />
            {/* Camada de pontos individuais ao dar zoom */}
            <Layer 
              id="points"
              type="circle"
              minzoom={13}
              paint={{
                'circle-radius': 6,
                'circle-color': [
                  'match',
                  ['get', 'sentiment'],
                  'apoiador', '#10b981', // emerald-500
                  'neutro', '#f59e0b',   // amber-500
                  'critico', '#ef4444',  // red-500
                  '#64748b'              // default slate-500
                ],
                'circle-stroke-color': '#000000',
                'circle-stroke-width': 2
              }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}
