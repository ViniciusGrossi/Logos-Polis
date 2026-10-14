import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
const developmentRuntime = process as NodeJS.Process & { polisDevelopmentSessionKey?: Uint8Array };
const developmentKey = developmentRuntime.polisDevelopmentSessionKey ??= randomBytes(32);
function sessionKey(): Uint8Array {
  const configured = process.env.JWT_SECRET;
  if (configured && configured.length >= 32) return new TextEncoder().encode(configured);
  if (process.env.NODE_ENV === "production") {
    throw new Error("Configure JWT_SECRET com pelo menos 32 caracteres.");
  }
  // Local development only: no shared, guessable fallback secret. Sessions expire on restart.
  return developmentKey;
}

export async function encrypt(payload: JWTPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(sessionKey());
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, sessionKey(), {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string, role: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, role, expiresAt });

  (await cookies()).set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  const payload = await decrypt(session);
  if (!payload || typeof payload.userId !== "string" || !payload.userId.trim() || typeof payload.role !== "string" || !payload.role.trim() || typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) return null;
  return payload;
}

export async function deleteSession() {
  (await cookies()).delete("session");
}
