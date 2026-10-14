"use client";
import { RefreshCw } from "lucide-react";
export function DataState({
  loading,
  error,
  retry,
  message = "Preparando as evidências…",
}: {
  loading?: boolean;
  error?: Error | null;
  retry?: () => void;
  message?: string;
}) {
  return (
    <div className="atlas-data-state" role={error ? "alert" : "status"}>
      {loading ? (
        <>
          <div className="atlas-compass" />
          <p>{message}</p>
        </>
      ) : error ? (
        <>
          <h3>Não foi possível abrir este recorte</h3>
          <p>{error.message}</p>
          {retry && (
            <button className="atlas-button" onClick={retry}>
              <RefreshCw size={15} />
              Tentar novamente
            </button>
          )}
          {error.message.includes("sessão") && (
            <a className="atlas-button" href="/login">
              Entrar novamente
            </a>
          )}
        </>
      ) : (
        <p>{message}</p>
      )}
    </div>
  );
}
