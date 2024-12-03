import { Message } from "discord.js";
import { i18n } from "../../../utils/i18n";
import { canModifyQueue } from "../../../utils/queue";
import JankbotMusicCmd from "../../../interfaces/JankbotMusicCommand";
import { Bot } from "../../../structs/Bot";

export default class PauseCmd extends JankbotMusicCmd {
    constructor(public bot: Bot) {
        super();
        this.name = "pause";
        this.description =  i18n.__("pause.description"),
        this.category = "music";
    }
    
    async run(bot: Bot, message: Message) {
        const queue = bot.queues.get(message.guild!.id);
        
        if (!queue) return message.reply(i18n.__("pause.errorNotQueue")).catch(console.error);
        
        if (!canModifyQueue(message.member!)) return i18n.__("common.errorNotChannel");
        
        if (queue.player.pause()) {
            queue.textChannel.send(i18n.__mf("pause.result", { author: message.author })).catch(console.error);
        
            return true;
        }
    }
}
