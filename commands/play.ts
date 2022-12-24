import { AudioPlayerStatus, DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import { Message } from "discord.js";
import { bot } from "../index";
import { MusicQueue } from "../structs/MusicQueue";
import { NotAMusicError, Song } from "../structs/Song";
import { i18n } from "../utils/i18n";
import { playlistPattern } from "../utils/patterns";

export default {
    name: "play",
    cooldown: 3,
    aliases: ["p"],
    category: "music",
    description: i18n.__("play.description"),
    permissions: ["CONNECT", "SPEAK", "ADD_REACTIONS", "MANAGE_MESSAGES"],
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
                const lcurl = message.attachments.first()!.attachment.toString().toLowerCase();
                if (lcurl.endsWith(".mp3") || lcurl.endsWith(".ogg") || lcurl.endsWith(".wav") || lcurl.endsWith(".flac")) {
                    url = message.attachments.first()!.attachment.toString();
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

        // Start the playlist if playlist url was provided
        if (playlistPattern.test(args[0])) {
            await loadingReply.delete();
            return bot.commands.get("playlist")!.execute(message, args);
        }

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
                .reply(`<:jankdacity:837717101866516501> **${song.title}** has been added to the queue at position ${queue.songs.length}!`)
                .catch(console.error);
        }

        if (bot.leave_timeouts.has(message.guild!.id)) {
            clearTimeout(bot.leave_timeouts.get(message.guild!.id)!);
            bot.leave_timeouts.delete(message.guild!.id);
        }

        const newQueue = new MusicQueue({
            message,
            connection: joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
            })
        });

        newQueue.push(song);

        message.reply(`<:jankdacity:837717101866516501> **${song.title}** has been added to the queue at position ${newQueue.songs.length}!`)
                .catch(console.error);

        bot.queues.set(message.guild!.id, newQueue);

        
    }
};
