import { Message } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";

export default {
    name: "queue",
    cooldown: 5,
    aliases: ["q"],
    description: i18n.__("queue.description"),
    permissions: ["MANAGE_MESSAGES", "ADD_REACTIONS"],
    category: "music",
    async execute(message: Message) {
        const queue = bot.queues.get(message.guild!.id);
        if (!queue || !queue.songs.length) return message.reply("There are no queues active.");
        const [embed, row] = queue.generate_queue_embed();
        message.channel.send({ embeds: [embed], components: [row] }).then(async (msg) => {
            queue.set_last_queue_message(msg);
        });
    }
};

