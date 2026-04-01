import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import { env } from "../config/env.js";
import { EMBED, embedResponse } from "./embedResponse.js";

function memberHasAnyRole(member: GuildMember, roleIds: string[]): boolean {
  if (roleIds.length === 0) return false;
  return roleIds.some((id) => member.roles.cache.has(id));
}

/** Staff: cargos em STAFF_ROLE_IDS ou permissão Gerenciar Servidor. */
export function isStaff(member: GuildMember | null): boolean {
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  return memberHasAnyRole(member, [...env.staffRoleIds]);
}

/** Admin: cargos em ADMIN_ROLE_IDS ou Gerenciar Servidor (alinhado a operações sensíveis). */
export function isAdmin(member: GuildMember | null): boolean {
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  if (env.adminRoleIds.length > 0) return memberHasAnyRole(member, [...env.adminRoleIds]);
  return false;
}

export async function requireStaff(
  interaction: ChatInputCommandInteraction,
): Promise<boolean> {
  const m = interaction.member;
  if (!m || typeof m === "string" || !("roles" in m)) {
    await interaction.reply({
      embeds: [
        embedResponse(
          "Servidor necessário",
          "Este comando só pode ser usado em um **servidor**.",
          EMBED.error,
        ),
      ],
      ephemeral: true,
    });
    return false;
  }
  if (!isStaff(m as GuildMember)) {
    await interaction.reply({
      embeds: [
        embedResponse(
          "Sem permissão",
          "É necessário cargo de **staff** (configurado no bot) ou a permissão **Gerenciar servidor**.",
          EMBED.error,
        ),
      ],
      ephemeral: true,
    });
    return false;
  }
  return true;
}

export async function requireAdmin(
  interaction: ChatInputCommandInteraction,
): Promise<boolean> {
  const m = interaction.member;
  if (!m || typeof m === "string" || !("roles" in m)) {
    await interaction.reply({
      embeds: [
        embedResponse(
          "Servidor necessário",
          "Este comando só pode ser usado em um **servidor**.",
          EMBED.error,
        ),
      ],
      ephemeral: true,
    });
    return false;
  }
  if (!isAdmin(m as GuildMember)) {
    await interaction.reply({
      embeds: [
        embedResponse(
          "Sem permissão",
          "Apenas **administradores** (cargo configurado ou **Gerenciar servidor**) podem usar esta ação.",
          EMBED.error,
        ),
      ],
      ephemeral: true,
    });
    return false;
  }
  return true;
}
