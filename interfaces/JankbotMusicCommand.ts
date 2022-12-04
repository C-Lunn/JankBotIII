import { Message } from "discord.js";
import { Bot } from "../structs/Bot";
import JankbotCmd from "./JankbotCommand";

export default class JankbotMusicCmd extends JankbotCmd {
    constructor(name: string, 
                description: string,
                bot: Bot,
                run: (bot: Bot, message: Message, args: string[]) => Promise<void>,
                aliases?: string[],
                permissions?: string[],
                cooldown?: number) {
        super(name, description, bot, run, false, aliases, permissions, cooldown);
    }

    override execute(message: Message, args: string[]) {
        if(this._is_tantamod && !message.member!.roles.cache.has("736622853797052519")) {
            message.react("🚫")
            return;
        }
        if (this.bot.getDJMode(message.guildId!) && !message.member!.roles.cache.has("736622853797052519")) {
            message.react("🚫");
            message.reply("DJ mode is on.")
        } else {
            this.run(this.bot, message, args);
        }
    }
}

