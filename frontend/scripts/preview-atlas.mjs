import { createRequire } from "node:module";
import { readFile, mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
const require = createRequire(path.join(root, "package.json"));
const esbuild = require("esbuild");
const build = path.join(root, ".atlas-preview");
await mkdir(build, { recursive: true });
await esbuild.build({
  entryPoints: [path.join(root, "features/atlas/preview.tsx")],
  bundle: true,
  outdir: build,
  platform: "browser",
  format: "iife",
  jsx: "automatic",
  external: ["/fonts/*"],
  define: { "process.env.NODE_ENV": '"production"' },
  minify: true,
  logLevel: "warning",
});
await esbuild.build({
  stdin: {
    contents:
      'export {AtlasService} from "./features/atlas/server/service.ts"; export {parseAtlasQuery} from "./features/atlas/server/schemas.ts";',
    resolveDir: root,
  },
  bundle: true,
  outfile: path.join(build, "service.cjs"),
  platform: "node",
  format: "cjs",
  logLevel: "warning",
});
const { AtlasService, parseAtlasQuery } = require(
  path.join(build, "service.cjs"),
);
const service = new AtlasService();
const html =
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Atlas Eleitoral · Demonstração local</title><link rel="stylesheet" href="/preview.css"><style>body{margin:0;background:#09090b}button,input,select{color:inherit}.atlas-local-note{box-sizing:border-box;height:28px;padding:7px 16px;background:#18181b;color:#a1a1aa;font:11px/14px sans-serif;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media print{.atlas-local-note{display:none}}</style></head><body><div class="atlas-local-note">Demonstração local · dados públicos reais · autenticação integrada preservada</div><main data-polis-main><div id="root"></div></main><script src="/preview.js"></script></body></html>';
const port = Number(process.env.ATLAS_PREVIEW_PORT ?? 3802);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("Invalid preview port");
const server = createServer(async (req, res) => {
  try {
    if (req.method !== "GET") {
      res.writeHead(405);
      res.end("GET only");
      return;
    }
    const url = new URL(req.url, "http://127.0.0.1");
    if (url.pathname.startsWith("/api/atlas/")) {
      const endpoint = url.pathname.split("/").at(-1);
      if (
        ![
          "catalogo",
          "territorios",
          "comparacao",
          "contexto",
          "pautas",
          "dossie",
        ].includes(endpoint)
      ) {
        res.writeHead(404);
        res.end();
        return;
      }
      const query = parseAtlasQuery(endpoint, url.searchParams);
      let data;
      if (endpoint === "catalogo") data = await service.getCatalog();
      if (endpoint === "territorios")
        data =
          query.kind === "geometry"
            ? await service.getGeometry(query.uf)
            : await service.getTerritories(query);
      if (endpoint === "comparacao") data = await service.getComparison(query);
      if (endpoint === "contexto") data = await service.getContext(query);
      if (endpoint === "pautas") data = await service.getThemes();
      if (endpoint === "dossie") data = await service.getDossier(query.id);
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(JSON.stringify(data));
      return;
    }
    if (
      process.env.ATLAS_PREVIEW_QA === "1" &&
      url.pathname === "/__qa/responsive"
    ) {
      const width = Number(url.searchParams.get("width"));
      if (![375, 768, 1440].includes(width)) {
        res.writeHead(400);
        res.end();
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        `<!DOCTYPE html><html><head><title>Atlas responsive QA ${width}px</title></head><body style="margin:0;background:#09090b"><iframe title="Atlas ${width}px" src="/atlas" width="${width}" height="1300" style="display:block;border:0"></iframe></body></html>`,
      );
      return;
    }
    let asset = null,
      mime = "";
    if (url.pathname === "/preview.js") {
      asset = path.join(build, "preview.js");
      mime = "text/javascript";
    }
    if (url.pathname === "/preview.css") {
      asset = path.join(build, "preview.css");
      mime = "text/css";
    }
    if (/^\/fonts\/atlas\/[a-z-]+\.ttf$/.test(url.pathname)) {
      asset = path.join(root, "public", url.pathname);
      mime = "font/ttf";
    }
    if (
      /^\/fonts\/polis\/(inter|jetbrains|playfair)-latin\.woff2$/.test(
        url.pathname,
      )
    ) {
      asset = path.join(root, "public", url.pathname);
      mime = "font/woff2";
    }
    if (url.pathname === "/vendor/atlas/maplibre-worker.mjs") {
      asset = path.join(root, "public", url.pathname);
      mime = "text/javascript";
    }
    if (asset) {
      res.writeHead(200, {
        "Content-Type": mime,
        "X-Content-Type-Options": "nosniff",
      });
      res.end(await readFile(asset));
      return;
    }
    if (url.pathname === "/" || url.pathname === "/atlas") {
      const measured =
        process.env.ATLAS_PREVIEW_QA === "1" &&
        url.searchParams.get("benchmark") === "1";
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(
        measured
          ? html.replace(
              "<main data-polis-main>",
              '<output id="atlas-preview-measurement" style="display:block;color:#a1a1aa;font:11px sans-serif;padding:4px 16px">Medindo abertura…</output><output id="atlas-preview-vitals" style="display:block;color:#a1a1aa;font:11px sans-serif;padding:4px 16px">Medindo estabilidade…</output><main data-polis-main>',
            )
          : html,
      );
      return;
    }
    res.writeHead(404);
    res.end("Página não encontrada");
  } catch (error) {
    res.writeHead(error.status ?? 500, {
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(
      JSON.stringify({
        error: {
          message: error.status
            ? error.message
            : "Não foi possível carregar a demonstração. Confira a preparação local.",
        },
      }),
    );
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(
    `Atlas local: http://127.0.0.1:${port}/atlas · somente loopback, sem alterações no acesso do Polis`,
  ),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(() => process.exit(0)));
