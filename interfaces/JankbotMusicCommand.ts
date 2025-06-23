import type { PermissionsString } from "discord.js";
import { Bot } from "../structs/Bot.ts";
import JankbotCmd, { type JbMessage } from "./JankbotCommand.ts";
import { is_tantamod } from "../utils/checkPermissions.ts";

export default class JankbotMusicCmd extends JankbotCmd {
    constructor() {
        super();
    }

    radio_safe = false;

    override execute(message: JbMessage, args: string[]) {
        const mod = is_tantamod(message.member!, this.bot);
        if (this._is_tantamod && !mod) {
            message.react("🚫")
            return;
        }
        if (!this.radio_safe && !mod) {
            message.reply("This command is unavailable while the radio is playing.");
            return;
        }
        if (this.bot.getDJMode(message.guildId!) && !mod) {
            message.react("🚫");
            message.reply("This command is unavailable while DJ mode is on.")
        } else {
            if (!message.channel.isSendable()) return;
            //@ts-ignore
            this.run(this.bot, message, args);
        }
    }

    public static music_factory(name: string,
        description: string,
        bot: Bot,
        run: (bot: Bot, message: JbMessage, args: string[]) => Promise<void>,
        aliases?: string[],
        permissions?: PermissionsString[],
        cooldown?: number) {
        const inst = new JankbotMusicCmd();
        inst.name = name;
        inst.description = description;
        inst.aliases = aliases;
        inst.permissions = permissions;
        inst.cooldown = cooldown;
        inst.bot = bot;
        inst.run = run;
        return inst;
    }
}

