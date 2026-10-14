"use client";
import { useQuery } from "@tanstack/react-query";
import type { AtlasResponse } from "./types";

export async function fetchAtlasData<T>(path: string, signal?: AbortSignal): Promise<AtlasResponse<T>> {
  const response = await fetch(`/api/atlas/${path}`, { signal, cache: "no-store", credentials: "same-origin" });
  if (response.status === 401) throw new Error("Sua sessão expirou. Entre novamente no Logos Polis.");
  const body: unknown = await response.json();
  if (!response.ok) throw new Error("Não foi possível carregar os dados deste recorte.");
  return body as AtlasResponse<T>;
}

export function useAtlasData<T>(path: string | null) {
  return useQuery<AtlasResponse<T>>({
    queryKey: ["atlas", path],
    enabled: path !== null,
    staleTime: 10 * 60 * 1000,
    retry: 1,
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/atlas/${path}`, { signal, cache: "no-store", credentials: "same-origin" });
      if (response.status === 401) throw new Error("Sua sessão expirou. Entre novamente no Logos Polis.");
      const body: unknown = await response.json();
      if (!response.ok) {
        const message = typeof body === "object" && body !== null && "error" in body && typeof body.error === "object" && body.error !== null && "message" in body.error && typeof body.error.message === "string" ? body.error.message : "Não foi possível carregar os dados deste recorte.";
        throw new Error(message);
      }
      return body as AtlasResponse<T>;
    },
  });
}
