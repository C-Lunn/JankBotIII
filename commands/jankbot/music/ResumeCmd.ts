import { i18n } from "../../../utils/i18n.ts";
import { canModifyQueue } from "../../../utils/queue.ts";
import JankbotMusicCmd from "../../../interfaces/JankbotMusicCommand.ts";
import { Bot } from "../../../structs/Bot.ts";
import type { JbMessage } from "../../../interfaces/JankbotCommand.ts";

export default class ResumeCmd extends JankbotMusicCmd {
    constructor(public bot: Bot) {
        super();
        this.name = "resume";
        this.aliases = ["r"];
        this.category = "music";
        this.description = i18n.__("resume.description");
    }
    
    async run(bot: Bot, message: JbMessage) {
        const queue = bot.queues.get(message.guild!.id);
        
        if (!queue) return message.reply(i18n.__("resume.errorNotQueue")).catch(console.error);
        if (!canModifyQueue(message.member!)) return i18n.__("common.errorNotChannel");
        
        if (queue.player.unpause()) {
            queue.textChannel
                .send(i18n.__mf("resume.resultNotPlaying", { author: message.author }))
                .catch(console.error);
        
            return true;
        }
        
        message.reply(i18n.__("resume.errorPlaying")).catch(console.error);
        return false;
    }
}
