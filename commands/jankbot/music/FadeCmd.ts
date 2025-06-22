import { Message } from "discord.js";
import JankbotMusicCmd from "../../../interfaces/JankbotMusicCommand.ts";
import { Bot } from "../../../structs/Bot.ts";
import type { JbMessage } from "../../../interfaces/JankbotCommand.ts";

export default class FadeCmd extends JankbotMusicCmd {
    constructor(public bot: Bot) {
        super();
        this.name = "fade";
        this.description = "fade oot";
        this.aliases = ['fadeout'];
    }

    async run(bot: Bot, msg: JbMessage, args: string[]) {
        const guild_id = msg.guild?.id;
        if (!guild_id) return;
        const queue = bot.queues.get(guild_id);
        if (!queue) return;

        msg.reply("fading out...");
        await queue.fade(Number(args.at(0)) || 100);
        msg.reply("done!");
    }
}
