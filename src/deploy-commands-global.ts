/**
 * Força registro global (ignora DISCORD_GUILD_ID no .env).
 * npm run deploy-commands:global
 */
import "dotenv/config";
process.env.DISCORD_GLOBAL_COMMANDS = "1";
await import("./deploy-commands.js");
