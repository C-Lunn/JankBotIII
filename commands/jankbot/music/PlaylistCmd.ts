import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import { EmbedBuilder, Message } from "discord.js";
import { MusicQueue } from "../../../structs/MusicQueue";
import { Playlist } from "../../../structs/Playlist";
import { i18n } from "../../../utils/i18n";
import JankbotMusicCmd from "../../../interfaces/JankbotMusicCommand";
import { Bot } from "../../../structs/Bot";

export default class PlaylistCmd extends JankbotMusicCmd {
    constructor(public bot: Bot) {
        super();
        this.name = "playlist";
        this.cooldown = 5;
        this.aliases = ["pl"];
        this.category = "music";
        this.description = i18n.__("playlist.description");
        this.permissions = ["Connect", "Speak", "AddReactions", "ManageMessages"];
    }
    
    async run(bot: Bot, message: Message, args: string[]) {
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
        
        let desc = `Added ${playlist.videos.length} items to the queue.`;
        if (playlist.videos.length === 99) {
            desc = desc + "\n\n The playlist may have been truncated to 99 items";
        }
        
        let playlistEmbed = new EmbedBuilder()
            .setTitle(`${playlist.data.title}`)
            .setDescription(
                desc
            )
            .setURL(playlist.data.url!)
            .setColor("#F8AA2A")
            .setTimestamp();
        
        if (desc.length >= 2048) {
            playlistEmbed.setDescription(
                desc.slice(0, 2007) + i18n.__("playlist.playlistCharLimit")
            );
        }
        
        message
            .reply({
                content: i18n.__mf("playlist.startedPlaylist", { author: message.author }),
                embeds: [playlistEmbed]
            })
            .catch(console.error);
    }
}
