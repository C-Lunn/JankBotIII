import { Message } from "discord.js";
import { bot } from "../index";
import { NoMoreSongsInQueueError } from "../structs/MusicQueue";
import { i18n } from "../utils/i18n";
import { canModifyQueue } from "../utils/queue";

export default {
    name: "skip",
    category: "music",
    aliases: ["s"],
    description: i18n.__("skip.description"),
    async execute(message: Message) {
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
};
