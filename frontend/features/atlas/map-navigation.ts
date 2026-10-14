export interface AtlasCamera { center: [number, number]; zoom: number; pitch: number; bearing: number }
export type AtlasDetail = "states" | "municipalities";
export function parseCamera(value?: string): AtlasCamera | null {
  if (!value || value.split(",").some(part => !part.trim())) return null;
  const parts = value.split(",").map(Number);
  if (parts.length !== 5 || !parts.every(Number.isFinite)) return null;
  const [lng,lat,zoom,pitch,bearing] = parts;
  if (Math.abs(lng)>180 || Math.abs(lat)>85.05 || zoom<1.5 || zoom>12 || pitch<0 || pitch>60 || Math.abs(bearing)>180) return null;
  return {center:[lng,lat],zoom,pitch,bearing};
}
export function serializeCamera(camera: AtlasCamera): string {
  return [...camera.center,camera.zoom,camera.pitch,camera.bearing].map(value => Number(value.toFixed(5))).join(",");
}
export function nextDetail(zoom: number, previous: AtlasDetail): AtlasDetail {
  if (zoom>=4.8) return "municipalities";
  if (zoom<4.5) return "states";
  return previous;
}
export function intersectsViewport(bounds: [number, number, number, number], viewport: [number, number, number, number]): boolean {
  return bounds[0]<=viewport[2] && bounds[2]>=viewport[0] && bounds[1]<=viewport[3] && bounds[3]>=viewport[1];
}
export function shouldEmitCamera(event: "move" | "moveend", syncing: boolean, live: boolean, framed = true): boolean {
  return framed && !syncing && (event === "moveend" || live);
}
export function isDeltaMap(tab: string, curtain: boolean): boolean { return tab === "evolucao" && !curtain; }
