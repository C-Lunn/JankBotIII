import { Message } from "discord.js";
import { i18n } from "../../../utils/i18n";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";

export default class QueueCmd extends JankbotCmd {
    constructor(public bot: Bot) {
        super();
        this.name = "queue";
        this.cooldown = 5;
        this.aliases = ["q"];
        this.description = i18n.__("queue.description");
        this.permissions = ["AddReactions", "ManageMessages"];
        this.category = "music";
    }
    
    async run(bot: Bot, message: Message) {
        const queue = bot.queues.get(message.guild!.id);
        if (!queue || !queue.songs.length) return message.reply("There are no queues active.");
        const [embed, row] = queue.generate_queue_embed();
        message.channel.send({
            embeds: [embed],
            //@ts-ignore
            components: [row]
        }).then(async (msg) => {
            queue.set_last_queue_message(msg);
        });
    }
}
