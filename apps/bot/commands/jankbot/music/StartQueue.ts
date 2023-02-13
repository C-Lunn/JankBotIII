import { DiscordGatewayAdapterCreator, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import { Message } from "discord.js";
import { guild_id } from "../../..";
import JankbotMusicCmd from "../../../interfaces/JankbotMusicCommand";
import { Bot } from "../../../structs/Bot";
import { MusicQueue } from "../../../structs/MusicQueue";
import { i18n } from "../../../utils/i18n";

export default class StartCmd extends JankbotMusicCmd {
    constructor(bot: Bot) {
        super();
        this.bot = bot;
        this.name = "start";
        this.description = "start a queue";
    }

    public override async run(bot: Bot, message: Message, args: string[]): Promise<void> {
        const { channel } = message.member!.voice;

        if (!channel) {
            await message.reply(i18n.__("play.errorNotChannel")).catch(console.error);
            return;
        }

        const queue = bot.queues.get(message.guild!.id);

        if (queue) {
            await message.reply("A queue is already active on this server.");
            return;
        }

        const new_queue = new MusicQueue({
            message,
            connection: joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
            })
        });

        bot.queues.set(guild_id, new_queue);

        return;
    }
}