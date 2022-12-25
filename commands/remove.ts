import { Message } from "discord.js";
import { bot } from "../index";
import { AttemptToReplacePlayingSongError, QueueIndexOutofBoundsError } from "../structs/MusicQueue";
import { i18n } from "../utils/i18n";
import { icon } from "../utils/icons";
import { canModifyQueue } from "../utils/queue";

export default {
    name: "remove",
    aliases: ["rm"],
    category: "music",
    description: i18n.__("remove.description"),
    async execute(message: Message, args: any[]) {
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
};
