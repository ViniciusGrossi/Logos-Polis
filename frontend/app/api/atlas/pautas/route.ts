import { atlasController } from "@/features/atlas/server/controller";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return atlasController("pautas", request); }
