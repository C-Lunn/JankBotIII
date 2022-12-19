import move from "array-move";
import { Message } from "discord.js";
import { i18n } from "../utils/i18n";
import { canModifyQueue } from "../utils/queue";
import { bot } from "../index";

export default {
    name: "move",
    aliases: ["mv"],
    description: i18n.__("move.description"),
    category: "music",
    execute(message: Message, args: number[]) {
        const queue = bot.queues.get(message.guild!.id);

        if (!queue) return message.reply("There is no queue active.").catch(console.error);

        if (!canModifyQueue(message.member!)) return;
        console.log(args);
        if (args.length !== 2) return message.reply("Usage: move <from> <to>").catch(console.error);

        if (isNaN(args[0]) || args[0] <= 1 || args[1] <= 1 || args[0] > queue.songs.length || args[1] > queue.songs.length)
            return message.reply("Usage: move <from> <to>");


        queue.textChannel.send(
            "NOT IMPLEMENTED YET"
        );
    }
};
