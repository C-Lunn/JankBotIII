import { Message } from "discord.js";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import JankbotMusicCmd from "../../../interfaces/JankbotMusicCommand";
import { Bot } from "../../../structs/Bot";

export default class LeaveCmd extends JankbotMusicCmd {
    constructor(bot: Bot) {
        super();
        this.bot = bot;
        this.name = "leave";
        this.description = "leave";
    }

    public override async run(bot: Bot, message: Message, args: string[]) {
        const queue = bot.queues.get(message.guild!.id);
        if (!queue) {
            message.channel.send("There is no queue.");
            return;
        }
        await message.channel.send("Leaving channel...");
        queue.stop();
    }
}