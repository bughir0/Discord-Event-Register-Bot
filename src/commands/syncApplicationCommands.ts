import { REST, Routes } from "discord.js";
import { env } from "../config/env.js";
import { buildEventoSlashCommand } from "./registerCommands.js";

/**
 * Registra comandos slash na API (guild ou global, conforme .env).
 * Usado na inicialização do bot e por `npm run deploy-commands`.
 */
export async function syncApplicationCommands(): Promise<void> {
  const commands = [buildEventoSlashCommand().toJSON()];
  const rest = new REST({ version: "10" }).setToken(env.discordToken);

  const useGuild = Boolean(env.guildId) && !env.forceGlobalSlashCommands;

  if (useGuild) {
    await rest.put(Routes.applicationGuildCommands(env.clientId, env.guildId), {
      body: commands,
    });
    console.log(`[slash] Comandos sincronizados no servidor ${env.guildId}.`);
  } else {
    await rest.put(Routes.applicationCommands(env.clientId), { body: commands });
    console.log("[slash] Comandos globais sincronizados (propagação pode levar até ~1h).");
    console.log(
      "[slash] Se não aparecerem na hora, aguarde ou confirme o scope applications.commands no convite do bot."
    );
  }
}
