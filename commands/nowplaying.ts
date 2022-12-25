import { Message } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";

export default {
    name: "np",
    cooldown: 10,
    description: i18n.__("nowplaying.description"),
    async execute(message: Message) {
        const queue = bot.queues.get(message.guild!.id);

        if (!queue || !queue.songs.length)
            return message.reply("No queue for this server.").catch(console.error);

        const msg = await queue.generate_np_msg();

        const mg = await message.channel.send({ embeds: [msg] });

        queue.set_and_update_np_msg(mg);

        
    }
};
