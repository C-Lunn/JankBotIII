import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import { Message, MessageEmbed } from "discord.js";
import { bot } from "../index";
import { MusicQueue } from "../structs/MusicQueue";
import { Playlist } from "../structs/Playlist";
import { i18n } from "../utils/i18n";

export default {
    name: "playlist",
    cooldown: 5,
    aliases: ["pl"],
    category: "music",
    description: i18n.__("playlist.description"),
    permissions: ["CONNECT", "SPEAK", "ADD_REACTIONS", "MANAGE_MESSAGES"],
    async execute(message: Message, args: any[]) {
        const { channel } = message.member!.voice;

        const queue = bot.queues.get(message.guild!.id);

        if (!args.length)
            return message.reply(i18n.__mf("playlist.usagesReply", { prefix: bot.prefix })).catch(console.error);

        if (!channel) return message.reply(i18n.__("playlist.errorNotChannel")).catch(console.error);

        if (queue && channel.id !== queue.connection.joinConfig.channelId)
            return message
                .reply(i18n.__mf("play.errorNotInSameChannel", { user: message.client.user!.username }))
                .catch(console.error);

        let playlist;

        try {
            playlist = await Playlist.from(args[0], args.join(" "), message.author.id);
        } catch (error) {
            console.error(error);

            return message.reply(i18n.__("playlist.errorNotFoundPlaylist")).catch(console.error);
        }

        if (queue) {
            queue.songs.push(...playlist.videos);
        } else {
            const newQueue = new MusicQueue({
                message,
                connection: joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
                })
            });

            if (bot.leave_timeouts.has(message.guild!.id)) {
                clearTimeout(bot.leave_timeouts.get(message.guild!.id)!);
                bot.leave_timeouts.delete(message.guild!.id);
            }

            bot.queues.set(message.guild!.id, newQueue);
            newQueue.songs.push(...playlist.videos);
            
            newQueue.playNext();
        }

        let playlistEmbed = new MessageEmbed()
            .setTitle(`${playlist.data.title}`)
            .setDescription(
                `Added ${playlist.videos.length} items to the queue.\n\n ${playlist.videos.length === 99 ? "The playlist may have been truncated to 99 items." : ""}`
            )
            .setURL(playlist.data.url!)
            .setColor("#F8AA2A")
            .setTimestamp();

        if (playlistEmbed.description!.length >= 2048)
            playlistEmbed.description =
                playlistEmbed.description!.substr(0, 2007) + i18n.__("playlist.playlistCharLimit");

        message
            .reply({
                content: i18n.__mf("playlist.startedPlaylist", { author: message.author }),
                embeds: [playlistEmbed]
            })
            .catch(console.error);
    }
};
