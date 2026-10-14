// Secret values are never logged. Vercel injects production secrets at build time.
if (process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production") {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("Publicação interrompida: JWT_SECRET de produção precisa ter pelo menos 32 caracteres.");
  }
  console.log("Atlas: configuração de sessão de produção validada.");
}
