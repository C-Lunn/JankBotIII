import { QueueIndexOutofBoundsError } from "../../../structs/MusicQueue.ts";
import { i18n } from "../../../utils/i18n.ts";
import { icon } from "../../../utils/icons.ts";
import { canModifyQueue } from "../../../utils/queue.ts";
import JankbotMusicCmd from "../../../interfaces/JankbotMusicCommand.ts";
import { Bot } from "../../../structs/Bot.ts";
import type { JbMessage } from "../../../interfaces/JankbotCommand.ts";

export default class SkipToCmd extends JankbotMusicCmd {
    constructor(public bot: Bot) {
        super();
        this.name = "skipto";
        this.category = "music";
        this._is_tantamod = true;
        this.aliases = ["st"];
        this.description = i18n.__("skipto.description");
    }
    
    async run(bot: Bot, message: JbMessage, args: string[]) {
        const index = Number(args[0]);
        
        if (isNaN(index))
            return message
                .reply(i18n.__mf("skipto.usageReply", { prefix: bot.prefix, name: module.exports.name }))
                .catch(console.error);
        
        const queue = bot.queues.get(message.guild!.id);
        
        if (!queue) return message.reply(i18n.__("skipto.errorNotQueue")).catch(console.error);
        
        if (!canModifyQueue(message.member!)) return i18n.__("common.errorNotChannel");
        
        try {
            await queue.skipTo(index - 1);
            console.log(`Skipping to ${index  - 1}`);
            message.reply(`Skipped to ${args[0]}: ${queue.songs[index - 1].title}`);
        } catch (e) {
            if (e instanceof QueueIndexOutofBoundsError) {
                message.reply(`Not a valid index. ${icon("gun")}`);
            } else {
                message.reply("Unknown error.");
                console.log(e);
            }
        }
    }
}
