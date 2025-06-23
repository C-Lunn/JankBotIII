import type { GuildMember, PermissionResolvable } from "discord.js";
import type { Command } from "../interfaces/Command.ts";
import type { JbMessage } from "../interfaces/JankbotCommand.ts";
import { Bot } from "../structs/Bot.ts";

interface PermissionResult {
    result: boolean;
    missing?: string[];
}

export async function checkPermissions(command: Command, message: JbMessage): Promise<PermissionResult> {
    const member = await message.guild!.members.fetch({ user: message.client.user!.id });
    const requiredPermissions = command.permissions as PermissionResolvable[];

    if (!command.permissions) return { result: true };

    const missing = member.permissions.missing(requiredPermissions);

    if (missing.length) {
        return { result: false, missing: missing };
    }

    return { result: true };
}

export function is_tantamod(member: GuildMember, bot: Bot) {
    return bot.mod_role_id instanceof Array
        ? bot.mod_role_id.reduce((acc, x) => acc || member.roles.cache.has(x), false)
        : member.roles.cache.has(bot.mod_role_id);
}