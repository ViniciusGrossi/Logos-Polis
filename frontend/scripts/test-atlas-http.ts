import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { SignJWT, type JWTPayload } from "jose";
import type {
  AtlasCatalog,
  AtlasResponse,
  AtlasGeometry,
  ContextAnalysis,
  DossierDataset,
  ComparisonDataset,
  ElectionMetric,
  TerritoryDataset,
} from "../features/atlas/types";

const origin = "http://127.0.0.1:3801";
const projectRoot = process.cwd();
const secretText = randomBytes(48).toString("hex");
const secret = new TextEncoder().encode(secretText);
let server: ChildProcess | undefined;
let passed = 0;
let step = "inicialização";
const startupErrors: string[] = [];
const pause = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
const routes = [
  "catalogo",
  "territorios?uf=BR&year=2022&round=2",
  "comparacao?uf=BR&fromYear=2018&toYear=2022&round=2&candidate=PT",
  "contexto?uf=BR&year=2022&round=2&indicator=income",
  "pautas",
  "dossie?id=BR",
];
const regionalRoutes = [
  "territorios?uf=SUDESTE&year=2022&round=2",
  "comparacao?uf=NORDESTE&fromYear=2018&toYear=2022&round=2&candidate=PT",
  "contexto?uf=SUDESTE&year=2022&round=2&indicator=income",
  "dossie?id=SUL",
  "territorios?kind=geometry&uf=SUL",
];

async function signed(
  payload: JWTPayload,
  signingKey = secret,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(signingKey);
}
async function request(route: string, token?: string): Promise<Response> {
  return fetch(`${origin}${route}`, {
    redirect: "manual",
    headers: token ? { Cookie: `session=${token}` } : {},
    signal: AbortSignal.timeout(90000),
  });
}
async function waitUntilReady() {
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    if (server?.exitCode !== null)
      throw new Error(
        "Servidor de verificação encerrou antes de ficar disponível.",
      );
    try {
      const response = await request("/api/atlas/catalogo");
      if (response.status === 401) return;
    } catch {
      /* Compilation/startup may temporarily refuse the connection. */
    }
    await pause(500);
  }
  throw new Error(
    "Servidor isolado não ficou disponível no prazo de 90 segundos.",
  );
}
async function checkCache(response: Response) {
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.ok(response.headers.get("vary")?.toLowerCase().includes("cookie"));
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
}
async function stopServer() {
  if (!server || server.exitCode !== null || !server.pid) return;
  if (process.platform === "win32") {
    // Exact PID of the helper launched above; terminate its child Next worker as well.
    const kill = spawn("taskkill", ["/PID", String(server.pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore",
    });
    await once(kill, "close");
  } else server.kill("SIGTERM");
  await Promise.race([once(server, "close"), pause(3000)]);
}

async function verify() {
  // Refuse to interact with an existing process that happens to own the test port.
  try {
    await fetch(`${origin}/api/atlas/catalogo`, {
      signal: AbortSignal.timeout(1500),
    });
    throw new Error("PORT_OCCUPIED");
  } catch (error) {
    if (error instanceof Error && error.message === "PORT_OCCUPIED")
      throw new Error(
        "Porta 3801 já ocupada; encerre o processo de verificação anterior.",
      );
  }
  const config = await readFile(
    path.join(projectRoot, "next.config.ts"),
    "utf8",
  );
  assert.ok(
    config.includes("ATLAS_TEST_DIST_DIR"),
    "Configuração de build isolado ausente",
  );
  server = spawn(
    process.execPath,
    [
      path.join(projectRoot, "node_modules", "next", "dist", "bin", "next"),
      "dev",
      "--webpack",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3801",
    ],
    {
      cwd: projectRoot,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        JWT_SECRET: secretText,
        ATLAS_TEST_DIST_DIR: ".next-verify",
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  );
  const capture = (chunk: Buffer) => {
    for (const line of chunk.toString().split(/\r?\n/)) {
      if (
        /Module not found|Failed to compile|Cannot find module|Error:.*(?:module|resolve|config|ENOENT|EADDRINUSE)/i.test(
          line,
        )
      ) {
        const safe = line
          .replaceAll(secretText, "[redacted]")
          .replace(/eyJ[A-Za-z0-9_.-]+/g, "[redacted]");
        startupErrors.push(safe.slice(0, 300));
        if (startupErrors.length > 5) startupErrors.shift();
      }
    }
  };
  server.stdout?.on("data", capture);
  server.stderr?.on("data", capture);
  await waitUntilReady();
  const now = Math.floor(Date.now() / 1000);
  const identity = {
    userId: "00000000-0000-4000-8000-000000000001",
    role: "user",
  };
  const tokens: { label: string; token?: string }[] = [
    { label: "cookie ausente" },
    {
      label: "assinatura forjada",
      token: await signed({ ...identity, exp: now + 3600 }, randomBytes(48)),
    },
    {
      label: "cookie expirado",
      token: await signed({ ...identity, exp: now - 120 }),
    },
    { label: "claim exp ausente", token: await signed(identity) },
    {
      label: "claim userId ausente",
      token: await signed({ role: "user", exp: now + 3600 }),
    },
  ];
  for (const testCase of tokens) {
    step = `página /atlas: ${testCase.label}`;
    const page = await request("/atlas", testCase.token);
    if ([302, 303, 307, 308].includes(page.status))
      assert.equal(
        new URL(page.headers.get("location") ?? "", origin).pathname,
        "/login",
      );
    else {
      // Next Server Component redirects may be delivered after streaming starts (HTTP 200).
      assert.equal(
        page.status,
        200,
        "Página protegida deve redirecionar, inclusive via streaming",
      );
      const markup = await page.text();
      const streamedRedirect =
        /<meta\b[^>]*http-equiv=["']refresh["'][^>]*content=["'][^"']*url=\/login["']/i.test(
          markup,
        );
      assert.ok(
        streamedRedirect,
        "Página sem sessão válida não contém redirect de streaming para /login",
      );
      assert.ok(
        !/class=["'][^"']*\batlas-root\b[^"']*["']/.test(markup),
        "Conteúdo do Atlas não deve ser renderizado para sessão inválida; skeleton de loading é permitido",
      );
    }
    passed++;
    for (const route of [...routes, ...regionalRoutes]) {
      step = `API ${route.split("?")[0]}: ${testCase.label}`;
      const response = await request(`/api/atlas/${route}`, testCase.token);
      assert.equal(
        response.status,
        401,
        "API deve recusar sessão inválida antes de ler snapshots",
      );
      assert.equal(
        ((await response.json()) as { error: { code: string } }).error.code,
        "UNAUTHENTICATED",
      );
      await checkCache(response);
      passed++;
    }
  }
  const valid = await signed({ ...identity, exp: now + 3600 });
  step = "página /atlas: sessão válida";
  const page = await request("/atlas", valid);
  assert.equal(page.status, 200);
  const validMarkup = await page.text();
  assert.ok(validMarkup.includes("Atlas Eleitoral"));
  assert.ok(
    /class=["'][^"']*\batlas-root\b[^"']*["']/.test(validMarkup),
    "Sessão válida deve renderizar a interface real do Atlas",
  );
  assert.ok(
    !/<meta\b[^>]*http-equiv=["']refresh["'][^>]*content=["'][^"']*url=\/login["']/i.test(
      validMarkup,
    ),
  );
  passed++;
  const localCatalog = JSON.parse(
    await readFile(
      path.join(projectRoot, "data", "atlas", "catalog.json"),
      "utf8",
    ),
  ) as AtlasCatalog;
  const localSummary = JSON.parse(
    await readFile(
      path.join(projectRoot, "data", "atlas", "summary.json"),
      "utf8",
    ),
  ) as ElectionMetric[];
  const localNational = localSummary.find(
    (m) => m.territoryId === "BR" && m.year === 2022 && m.round === 2,
  )!;
  for (const route of routes) {
    step = `API ${route.split("?")[0]}: sessão válida`;
    const response = await request(`/api/atlas/${route}`, valid);
    assert.equal(response.status, 200);
    await checkCache(response);
    const body = (await response.json()) as AtlasResponse<unknown>;
    assert.equal(body.meta.snapshotId, localCatalog.snapshotId);
    assert.equal(body.meta.generatedAt, localCatalog.generatedAt);
    assert.ok(body.meta.source.length > 0 && body.meta.methodology.length > 0);
    if (route.startsWith("catalogo"))
      assert.equal(
        (body.data as AtlasCatalog).snapshotId,
        localCatalog.snapshotId,
      );
    if (route.startsWith("territorios")) {
      const data = body.data as TerritoryDataset;
      assert.equal(data.records.length, 27);
      assert.equal(data.summary?.validVotes, localNational.validVotes);
      assert.equal(data.summary?.eligible, localNational.eligible);
    }
    if (route.startsWith("comparacao")) {
      const data = body.data as ComparisonDataset;
      assert.equal(data.summary.changed, 422);
      assert.equal(
        data.rows.length,
        localCatalog.coverage.resultsMunicipalities,
      );
    }
    passed++;
  }
  for (const route of regionalRoutes) {
    step = `Recorte regional autenticado: ${route.split("?")[0]}`;
    const response = await request(`/api/atlas/${route}`, valid);
    assert.equal(response.status, 200);
    await checkCache(response);
    const body = (await response.json()) as AtlasResponse<unknown>;
    assert.equal(body.meta.snapshotId, localCatalog.snapshotId);
    if (route.includes("kind=geometry"))
      assert.equal((body.data as AtlasGeometry).features.length, 3);
    else if (route.startsWith("territorios")) {
      assert.equal((body.data as TerritoryDataset).records.length, 4);
      assert.equal(
        (body.data as TerritoryDataset).summary?.territoryId,
        "SUDESTE",
      );
    } else if (route.startsWith("comparacao"))
      assert.ok(
        (body.data as ComparisonDataset).rows.every((row) =>
          ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"].includes(
            row.territory.uf ?? "",
          ),
        ),
      );
    else if (route.startsWith("contexto"))
      assert.ok(
        (body.data as ContextAnalysis).points.every((point) =>
          ["ES", "MG", "RJ", "SP"].includes(point.territory.uf ?? ""),
        ),
      );
    else if (route.startsWith("dossie"))
      assert.equal((body.data as DossierDataset).territory.id, "SUL");
    passed++;
  }
  for (const route of [
    "territorios?uf=../SP",
    "territorios?uf=SUDOESTE",
    "territorios?round=3",
    "territorios?year=2022&year=2018",
    "comparacao?fromYear=2022&toYear=2018",
    "contexto?weighted=yes",
    "dossie?id=../../secrets",
  ]) {
    step = `Parâmetros inválidos: ${route.split("?")[0]}`;
    const response = await request(`/api/atlas/${route}`, valid);
    assert.equal(response.status, 400);
    await checkCache(response);
    passed++;
  }
  step = "Geometria autenticada";
  const geometry = await request(
    "/api/atlas/territorios?kind=geometry&uf=BR",
    valid,
  );
  assert.equal(geometry.status, 200);
  await checkCache(geometry);
  passed++;
  console.log(
    JSON.stringify({
      httpAssertionsPassed: passed,
      invalidSessions: tokens.map((t) => t.label),
      authenticatedApis: 6,
      pageProtection:
        "redirect /login (HTTP ou streaming; somente skeleton permitido)",
      snapshot: localCatalog.snapshotId,
      isolatedPort: 3801,
      writesOperational: false,
    }),
  );
}
verify()
  .catch((error) => {
    // Never serialize requests, tokens, env, page markup or arbitrary child logs.
    console.error(
      `Falha na verificação: ${step}. ${error instanceof Error ? error.message : "Resultado inesperado"}`,
    );
    if (startupErrors.length)
      console.error(`Diagnóstico de compilação: ${startupErrors.join(" | ")}`);
    process.exitCode = 1;
  })
  .finally(stopServer);
