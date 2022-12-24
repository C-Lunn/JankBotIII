import { canModifyQueue } from "../utils/queue";
import { i18n } from "../utils/i18n";
import { Message } from "discord.js";
import { bot } from "../index";
import { QueueIndexOutofBoundsError } from "../structs/MusicQueue";
import { icon } from "../utils/icons";

export default {
    name: "skipto",
    category: "music",
    is_tantamod: true,
    aliases: ["st"],
    description: i18n.__("skipto.description"),
    async execute(message: Message, args: Array<any>) {
        if (!args.length || isNaN(args[0]))
            return message
                .reply(i18n.__mf("skipto.usageReply", { prefix: bot.prefix, name: module.exports.name }))
                .catch(console.error);

        const queue = bot.queues.get(message.guild!.id);

        if (!queue) return message.reply(i18n.__("skipto.errorNotQueue")).catch(console.error);

        if (!canModifyQueue(message.member!)) return i18n.__("common.errorNotChannel");

        try {
            await queue.skipTo(args[0] - 1);
            console.log(`Skipping to ${args[0] - 1}`);
            message.reply(`Skipped to ${args[0]}: ${queue.songs[args[0] - 1].title}`);
        } catch (e) {
            if (e instanceof QueueIndexOutofBoundsError) {
                message.reply(`Not a valid index. ${icon("gun")}`);
            } else {
                message.reply("Unknown error.");
                console.log(e);
            }
        }
    }
};
