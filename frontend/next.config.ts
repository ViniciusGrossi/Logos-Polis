import { readdirSync, readFileSync } from "node:fs";
import type { NextConfig } from "next";

/** Only the pinned release ships in the function bundle; older immutable releases stay in the repo, not in the 250 MB function. */
function pinnedRelease(): string | null {
  const configured = process.env.ATLAS_SNAPSHOT;
  if (configured && /^atlas-v1-[0-9a-f]{16}$/.test(configured)) return configured;
  try {
    const id = (JSON.parse(readFileSync("data/atlas/catalog.json", "utf8")) as { snapshotId?: string }).snapshotId;
    return id && /^atlas-v1-[0-9a-f]{16}$/.test(id) ? id : null;
  } catch { return null; }
}
const release = pinnedRelease();

/** Tracing alone pulls every release dir; excludes keep the function at the pinned release (production never reads the working copies). */
function untracedAtlasData(): string[] {
  if (!release) return [];
  try {
    const others = readdirSync("data/atlas/releases").filter((id) => id !== release).map((id) => `./data/atlas/releases/${id}/**/*`);
    return [...others, "./data/atlas/offices/**/*", "./data/atlas/metrics/**/*", "./data/atlas/geometry/**/*"];
  } catch { return []; }
}

const nextConfig: NextConfig = {
  distDir: process.env.ATLAS_TEST_DIST_DIR || ".next",
  turbopack: { root: process.cwd() },
  outputFileTracingIncludes: {
    "/api/atlas/*": release
      ? ["./data/atlas/catalog.json", `./data/atlas/releases/${release}/**/*`]
      : ["./data/atlas/**/*"],
  },
  outputFileTracingExcludes: { "/api/atlas/*": untracedAtlasData() },
};

export default nextConfig;
