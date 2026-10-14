"use client";
export default function AtlasError({ reset }: { error: Error; reset: () => void }) {
  return <div className="atlas-root atlas-loading-page" role="alert"><h1>O atlas não pôde ser carregado</h1><p>Tente novamente para retomar sua exploração.</p><button className="atlas-button" onClick={reset}>Tentar novamente</button></div>;
}
