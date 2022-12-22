import { Message, MessageEmbed } from "discord.js";
import { splitBar } from "string-progressbar";
import { i18n } from "../utils/i18n";
import { bot } from "../index";

export default {
    name: "np",
    cooldown: 10,
    description: i18n.__("nowplaying.description"),
    async execute(message: Message) {
        const queue = bot.queues.get(message.guild!.id);

        if (!queue || !queue.songs.length)
            return message.reply(i18n.__("nowplaying.errorNotQueue")).catch(console.error);

        return await queue.generate_np_msg();
    }
};
