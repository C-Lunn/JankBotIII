import { Message } from "discord.js";
import { NoMoreSongsInQueueError } from "../../../structs/MusicQueue";
import { i18n } from "../../../utils/i18n";
import { canModifyQueue } from "../../../utils/queue";
import { Bot } from "../../../structs/Bot";
import JankbotMusicCmd from "../../../interfaces/JankbotMusicCommand";

export default class SkipCmd extends JankbotMusicCmd {
    constructor(public bot: Bot) {
        super();
        this.name = "skip";
        this.category = "music";
        this.aliases = ["s"];
        this.description = i18n.__("skip.description");
    }
    
    async run(bot: Bot, message: Message) {
        const queue = bot.queues.get(message.guild!.id);
        
        if (!queue) return message.reply(i18n.__("skip.errorNotQueue")).catch(console.error);
        
        if (!canModifyQueue(message.member!)) return i18n.__("common.errorNotChannel");
        
        try {
            queue.player.stop();
            message.react("🆗");
        } catch (error) {
            if (error instanceof NoMoreSongsInQueueError) {
                return queue.stop();
            }
            throw error;
        }
    }
}
