import {
  type Interaction,
  InteractionType,
} from "discord.js";
import type { BotContext } from "../context.js";
import {
  handlePurgeDataButton,
  PURGE_BUTTON_CANCEL,
  PURGE_BUTTON_CONFIRM,
} from "../interactions/purgeDataButtonHandler.js";
import { handleParticipateButton } from "../interactions/buttonHandler.js";
import { handleEventoCommand } from "../commands/eventoCommand.js";
import { handleEventoAutocomplete } from "../commands/eventoAutocomplete.js";
import { EMBED, embedResponse } from "../utils/embedResponse.js";

export function createInteractionCreateListener(ctx: BotContext) {
  return async (interaction: Interaction): Promise<void> => {
    try {
      if (interaction.isAutocomplete()) {
        if (interaction.commandName === "evento") {
          await handleEventoAutocomplete(interaction, ctx);
        }
        return;
      }

      if (interaction.isButton()) {
        if (interaction.customId.startsWith("evt:participate:")) {
          await handleParticipateButton(interaction, ctx);
        } else if (
          interaction.customId === PURGE_BUTTON_CONFIRM ||
          interaction.customId === PURGE_BUTTON_CANCEL
        ) {
          await handlePurgeDataButton(interaction, ctx);
        }
        return;
      }

      if (interaction.type !== InteractionType.ApplicationCommand) return;
      if (!interaction.isChatInputCommand()) return;

      if (interaction.commandName === "evento") {
        await handleEventoCommand(interaction, ctx);
      }
    } catch (err) {
      console.error("[interaction]", err);
      try {
        if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
          await interaction.reply({
            embeds: [
              embedResponse(
                "Erro",
                "Ocorreu um erro ao processar esta interação. Tente novamente.",
                EMBED.error,
              ),
            ],
            ephemeral: true,
          });
        }
      } catch {
        // ignorar falha secundária
      }
    }
  };
}
