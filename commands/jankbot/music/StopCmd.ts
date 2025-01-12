import { i18n } from "../../../utils/i18n";
import { canModifyQueue } from "../../../utils/queue";
import JankbotMusicCmd from "../../../interfaces/JankbotMusicCommand";
import { Bot } from "../../../structs/Bot";
import { JbMessage } from "../../../interfaces/JankbotCommand";

export default class StopCmd extends JankbotMusicCmd {
    constructor(public bot: Bot) {
        super();
        this.name = "stop";
        this.category = "music";
        this.description = i18n.__("stop.description");
    }
    
    async run(bot: Bot, message: JbMessage) {
        const queue = bot.queues.get(message.guild!.id);
        
        if (!queue) return message.reply(i18n.__("stop.errorNotQueue")).catch(console.error);
        if (!canModifyQueue(message.member!)) return i18n.__("common.errorNotChannel");
        
        queue.stop();
        
        queue.textChannel.send(i18n.__mf("stop.result", { author: message.author })).catch(console.error);
    }
}
