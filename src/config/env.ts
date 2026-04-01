import "dotenv/config";

/**
 * Carrega e valida variáveis de ambiente.
 * Falha rápido no boot se configuração crítica estiver ausente.
 */
function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return v.trim();
}

function parseIdList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function envFlag(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export const env = {
  discordToken: requireEnv("DISCORD_TOKEN"),
  clientId: requireEnv("DISCORD_CLIENT_ID"),
  guildId: process.env.DISCORD_GUILD_ID?.trim() || "",
  /** Se true, `deploy-commands` registra sempre comandos globais (ignora DISCORD_GUILD_ID). */
  forceGlobalSlashCommands: envFlag("DISCORD_GLOBAL_COMMANDS"),
  databaseUrl: requireEnv("DATABASE_URL"),
  staffRoleIds: parseIdList(process.env.STAFF_ROLE_IDS),
  adminRoleIds: parseIdList(process.env.ADMIN_ROLE_IDS),
  adminLogChannelId: process.env.ADMIN_LOG_CHANNEL_ID?.trim() || "",
} as const;
