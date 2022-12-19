import { Message, MessageEmbed } from "discord.js";
import { splitBar } from "string-progressbar";
import { i18n } from "../utils/i18n";
import { bot } from "../index";

export default {
    name: "np",
    cooldown: 10,
    description: i18n.__("nowplaying.description"),
    execute(message: Message) {
        const queue = bot.queues.get(message.guild!.id);

        if (!queue || !queue.songs.length)
            return message.reply(i18n.__("nowplaying.errorNotQueue")).catch(console.error);

        const song = queue.activeSong();
        const seek = queue.resource.playbackDuration / 1000;
        const left = song.duration - seek;

        let nowPlaying = new MessageEmbed()
            .setTitle(`Now Playing | Queue Position: ${queue.activeIndex + 1} / ${queue.songs.length}`)
            .setDescription(`${song.title}\n${song.url}`)
            .setColor("#F8AA2A");

        nowPlaying.addFields([{
            name: "Added By",
            value: `<@${song.added_by}>`,
        },
        {
            name: "\u200b",
            value: "<:play_the_jank:897769624077205525> " +
                new Date(seek * 1000).toISOString().slice(11, 19) +
                " [" +
                    splitBar(song.duration == 0 ? seek : song.duration, seek, 20, undefined, "<:jankdacity:837717101866516501>")[0] +
                "] " +
                (song.duration == 0 ? " ◉ LIVE" : new Date(song.duration * 1000).toISOString().slice(11, 19))
        }
        ])

        if (song.duration > 0) {
            nowPlaying.setFooter({
                text: i18n.__mf("nowplaying.timeRemaining", {
                    time: new Date(left * 1000).toISOString().slice(11, 19)
                })
            });
        }

        return message.reply({ embeds: [nowPlaying] });
    }
};
