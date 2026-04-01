import pg from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;

/** Evita aviso de sslmode do pg-connection-string (Neon/Supabase com `sslmode=require`). */
function databaseUrlForPg(url: string): string {
  try {
    const u = new URL(url);
    const mode = u.searchParams.get("sslmode");
    if (
      mode &&
      ["prefer", "require", "verify-ca"].includes(mode) &&
      !u.searchParams.has("uselibpqcompat")
    ) {
      u.searchParams.set("uselibpqcompat", "true");
    }
    return u.href;
  } catch {
    return url;
  }
}

/**
 * Pool singleton de conexões PostgreSQL.
 * Usar sempre queries parametrizadas ($1, $2) para evitar SQL injection.
 */
export const pool = new Pool({
  connectionString: databaseUrlForPg(env.databaseUrl),
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on("error", (err) => {
  console.error("[pg] Erro inesperado no pool:", err);
});
