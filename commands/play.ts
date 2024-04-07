import { AudioPlayerStatus, DiscordGatewayAdapterCreator, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { Message, PermissionsString, VoiceBasedChannel } from "discord.js";
import { bot } from "../index";
import { MusicQueue } from "../structs/MusicQueue";
import { NotAMusicError, Song } from "../structs/Song";
import { i18n } from "../utils/i18n";
import { icon } from "../utils/icons";

export default {
    name: "play",
    cooldown: 3,
    aliases: ["p"],
    category: "music",
    description: i18n.__("play.description"),
    permissions: <PermissionsString[]>["Connect", "Speak", "AddReactions", "ManageMessages"],
    async execute(message: Message, args: string[]) {
        const { channel } = message.member!.voice;

        if (!channel) return message.reply(i18n.__("play.errorNotChannel")).catch(console.error);

        const queue = bot.queues.get(message.guild!.id);

        if (queue && channel.id !== queue.connection.joinConfig.channelId)
            return message
                .reply(i18n.__mf("play.errorNotInSameChannel", { user: bot.client.user!.username }))
                .catch(console.error);

        let url;

        if (!args.length) {
            if (message.attachments.size) {
                const lcurl = message.attachments.first()!.url.toLowerCase();
                if (
                    lcurl.endsWith(".mp3") ||
                    lcurl.endsWith(".ogg") ||
                    lcurl.endsWith(".wav") ||
                    lcurl.endsWith(".flac")
                ) {
                    url = message.attachments.first()!.url.toString();
                } else {
                    return message.reply(i18n.__mf("play.usageReply", { prefix: bot.prefix })).catch(console.error);
                }
            } else if (queue?.player.state.status === AudioPlayerStatus.Paused) {
                queue.player.unpause();
                return message.reply("Music resumed.");
            }
            else return message.reply(i18n.__mf("play.usageReply", { prefix: bot.prefix })).catch(console.error);
        } else url = args[0];

        const loadingReply = await message.reply("⏳ Loading...");

        let song;

        try {
            song = await Song.from(url, args.join(" "), message.author.id);
        } catch (error) {
            if (error instanceof NotAMusicError) {
                message.reply("This doesn't look like a music file.");
                return;
            }
            console.error(error);
            return message.reply(i18n.__("common.errorCommand")).catch(console.error);
        } finally {
            await loadingReply.delete();
        }

        if (queue) {
            queue.push(song);

            return message
                .reply(`${icon('playhead')} **${song.title}** has been added to the queue at position ${queue.songs.length}!`)
                .catch(console.error);
        }

        if (bot.leave_timeouts.has(message.guild!.id)) {
            clearTimeout(bot.leave_timeouts.get(message.guild!.id)!);
            bot.leave_timeouts.delete(message.guild!.id);
        }

        const newQueue = new MusicQueue({
            message,
            connection: await initVoiceConnection(channel),
        });

        newQueue.push(song);

        message.reply(`${icon('playhead')} **${song.title}** has been added to the queue at position ${newQueue.songs.length}!`)
            .catch(console.error);

        bot.queues.set(message.guild!.id, newQueue);


    }
};

async function initVoiceConnection(channel: VoiceBasedChannel): Promise<VoiceConnection> {
    const conn = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
    })

    await new Promise(resolve => setTimeout(resolve, 500));

    return conn;
}