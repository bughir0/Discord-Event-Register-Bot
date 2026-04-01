/**
 * Ponto de entrada: cliente Discord, migrações, registro de listeners.
 */
import { Client, GatewayIntentBits, Partials } from "discord.js";

process.on("unhandledRejection", (reason, promise) => {
  console.error("[unhandledRejection]", reason, promise);
});

process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
  process.exit(1);
});
import { env } from "./config/env.js";
import { pool } from "./database/pool.js";
import { runMigrations } from "./database/migrate.js";
import { BotContext } from "./context.js";
import { createReadyListener } from "./listeners/ready.js";
import { createInteractionCreateListener } from "./listeners/interactionCreate.js";
import { createMessageCreateListener } from "./listeners/messageCreate.js";
import { syncApplicationCommands } from "./commands/syncApplicationCommands.js";

async function bootstrap(): Promise<void> {
  await runMigrations();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
  });

  const ctx = new BotContext(client, pool);

  client.once("clientReady", createReadyListener(client));
  client.on("interactionCreate", createInteractionCreateListener(ctx));
  client.on("messageCreate", createMessageCreateListener(ctx));

  await client.login(env.discordToken);

  try {
    await syncApplicationCommands();
  } catch (e) {
    console.error("[slash] Falha ao registrar comandos na API do Discord:", e);
    throw e;
  }

  let shuttingDown = false;
  const shutdown = async (): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log("[shutdown] Encerrando…");
    try {
      client.destroy();
    } catch (e) {
      console.error("[shutdown] client.destroy:", e);
    }
    try {
      await pool.end();
    } catch (e) {
      console.error("[shutdown] pool.end:", e);
    }
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

bootstrap().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
