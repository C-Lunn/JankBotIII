import { Message } from "discord.js";
import { bot } from "../index";
import { AttemptToReplacePlayingSongError, QueueIndexOutofBoundsError } from "../structs/MusicQueue";
import { i18n } from "../utils/i18n";
import { canModifyQueue } from "../utils/queue";

export default {
    name: "move",
    aliases: ["mv"],
    description: i18n.__("move.description"),
    category: "music",
    execute(message: Message, args: number[]) {
        const queue = bot.queues.get(message.guild!.id);

        if (!queue) return message.reply("There is no queue active.").catch(console.error);

        if (!canModifyQueue(message.member!)) return;
        if (args.length !== 2) return message.reply("Usage: move <from> <to>").catch(console.error);

        if (isNaN(args[0]) || args[0] < 1 || args[1] < 1 || args[0] > queue.songs.length || args[1] > queue.songs.length)
            return message.reply("Usage: move <from> <to>");

        try {
            const move_title = queue.songs[args[0] - 1].title;
            queue.move(args[0] - 1, args[1] - 1);
            return message.reply(`Moved ${args[0]} (${move_title}) to ${args[1]}.`);
        } catch (e) {
            if (e instanceof QueueIndexOutofBoundsError) {
                if ((e as QueueIndexOutofBoundsError).info.which === "from") {
                    return message.reply("Invalid index for from.");
                } else {
                    return message.reply("Invalid index for to.");
                }
            } else if (e instanceof AttemptToReplacePlayingSongError) {
                return message.reply("Cannot replace the currently playing song.");
            }
            else {
                console.log(e);
            }
        }
    }
};
