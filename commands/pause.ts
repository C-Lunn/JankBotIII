import { Message } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { canModifyQueue } from "../utils/queue";

export default {
    name: "pause",
    description: i18n.__("pause.description"),
    category: "music",
    execute(message: Message) {
        const queue = bot.queues.get(message.guild!.id);

        if (!queue) return message.reply(i18n.__("pause.errorNotQueue")).catch(console.error);

        if (!canModifyQueue(message.member!)) return i18n.__("common.errorNotChannel");

        if (queue.player.pause()) {
            queue.textChannel.send(i18n.__mf("pause.result", { author: message.author })).catch(console.error);

            return true;
        }
    }
};
