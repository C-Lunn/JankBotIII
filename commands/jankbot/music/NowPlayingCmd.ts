import JankbotCmd, { type JbMessage } from "../../../interfaces/JankbotCommand.ts";
import { Bot } from "../../../structs/Bot.ts";
import { i18n } from "../../../utils/i18n.ts";

export default class NowPlayingCmd extends JankbotCmd {
    constructor(public bot: Bot) {
        super();
        this.name = "np";
        this.cooldown = 10;
        this.description = i18n.__("nowplaying.description");
    }

    async run(bot: Bot, message: JbMessage) {
        const queue = bot.queues.get(message.guild!.id);

        if (!queue || !queue.songs.length)
            return message.reply("No queue for this server.").catch(console.error);

        const msg = await queue.generate_np_msg();

        const mg = await message.channel.send({ embeds: [msg] });

        queue.set_and_update_np_msg(mg);
    }
}