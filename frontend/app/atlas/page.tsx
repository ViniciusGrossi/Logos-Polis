import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AtlasClient } from "@/features/atlas/atlas-client";
import "@/features/atlas/atlas.css";

export const metadata: Metadata = {
  title: "Atlas Eleitoral | Logos Polis",
  description: "Território, transformação e contexto. Explore resultados eleitorais e suas evidências.",
};

export default async function AtlasPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const params = await searchParams;
  const initialParams = Object.fromEntries(Object.entries(params).filter((pair): pair is [string, string] => typeof pair[1] === "string"));
  return <AtlasClient initialParams={initialParams} />;
}
