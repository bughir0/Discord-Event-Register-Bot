/**
 * Registra comandos slash na API do Discord (guild rápido ou global).
 * Execute: npm run deploy-commands
 * (O bot também sincroniza comandos ao iniciar — ver syncApplicationCommands.)
 */
import { syncApplicationCommands } from "./commands/syncApplicationCommands.js";

async function main(): Promise<void> {
  await syncApplicationCommands();
}

main().catch((e) => {
  console.error("[deploy] Falha:", e);
  if (e && typeof e === "object" && "status" in e) {
    const err = e as { status: number; rawError?: { message?: string } };
    if (err.status === 401) {
      console.error("[deploy] Token inválido ou revogado — verifique DISCORD_TOKEN no .env.");
    }
    if (err.status === 403) {
      console.error(
        "[deploy] 403: o token deste bot não tem permissão para esta aplicação. DISCORD_CLIENT_ID precisa ser o Application ID do mesmo bot do DISCORD_TOKEN."
      );
    }
  }
  process.exit(1);
});
