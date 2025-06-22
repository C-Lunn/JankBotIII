import { getVoiceConnection } from "@discordjs/voice";
import JankbotMusicCmd from "../../../interfaces/JankbotMusicCommand.ts";
import { Bot } from "../../../structs/Bot.ts";
import { icon } from "../../../utils/icons.ts";
import type { JbMessage } from "../../../interfaces/JankbotCommand.ts";

export default class LeaveCmd extends JankbotMusicCmd {
    constructor(bot: Bot) {
        super();
        this.bot = bot;
        this.name = "leave";
        this.description = "leave";
    }

    public override async run(bot: Bot, message: JbMessage, args: string[]) {
        const queue = bot.queues.get(message.guild!.id);
        if (queue) {
            queue.stop(true);
        } else {
            if (bot.leave_timeouts.has(message.guild!.id)) {
                clearTimeout(bot.leave_timeouts.get(message.guild!.id)!);
                bot.leave_timeouts.delete(message.guild!.id);
                getVoiceConnection(message.guild!.id)?.destroy();
            } else {
                await message.channel.send("I'm not in a voice channel. " + icon('gun'));
                return;
            }
        }
        
        await message.channel.send("Leaving channel...");
    }
}