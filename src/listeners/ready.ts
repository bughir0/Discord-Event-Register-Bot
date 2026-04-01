import type { Client } from "discord.js";
import { ActivityType } from "discord.js";

export function createReadyListener(client: Client) {
  return () => {
    console.log(`[ready] ${client.user?.tag} (${client.user?.id})`);
    client.user?.setActivity("Gestão de eventos", { type: ActivityType.Watching });
  };
}
