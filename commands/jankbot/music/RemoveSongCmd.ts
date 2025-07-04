import { AttemptToReplacePlayingSongError, QueueIndexOutofBoundsError } from "../../../structs/MusicQueue.ts";
import { i18n } from "../../../utils/i18n.ts";
import { icon } from "../../../utils/icons.ts";
import { canModifyQueue } from "../../../utils/queue.ts";
import JankbotMusicCmd from "../../../interfaces/JankbotMusicCommand.ts";
import { Bot } from "../../../structs/Bot.ts";
import type { JbMessage } from "../../../interfaces/JankbotCommand.ts";

export default class RemoveSongCmd extends JankbotMusicCmd {
    constructor(public bot: Bot) {
        super();
        this.name = "remove";
        this.aliases = ["rm"];
        this.category = "music";
        this.description = i18n.__("remove.description");
    }
    
    async run(bot: Bot, message: JbMessage, args: string[]) {
        const queue = bot.queues.get(message.guild!.id);
        
        if (!queue) return message.reply(i18n.__("remove.errorNotQueue")).catch(console.error);
        
        if (!canModifyQueue(message.member!)) return i18n.__("common.errorNotChannel");
        
        if (!args.length || args.length !== 1) return message.reply(i18n.__mf("remove.usageReply", { prefix: bot.prefix }));
        
        let song = parseInt(args[0]);
        
        if (isNaN(song)) return message.reply(i18n.__mf("remove.usageReply", { prefix: bot.prefix }));
        
        try {
            const title_to_remove = await queue.remove(song - 1);
            message.reply(`Removed ${title_to_remove} from the queue.`);
        } catch (e) {
            if (e instanceof QueueIndexOutofBoundsError) {
                message.reply(`Not a valid index. ${icon("gun")}`);
            } else if (e instanceof AttemptToReplacePlayingSongError) {
                message.reply("Cannot remove the currently playing song.");
            } else {
                console.log(e);
            }
        }
    }
}
