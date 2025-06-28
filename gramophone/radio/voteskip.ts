import { MessageFlags } from "discord.js";
import type { JbMessage } from "../../interfaces/JankbotCommand.ts";
import JankbotMusicCmd from "../../interfaces/JankbotMusicCommand.ts";
import { Bot } from "../../structs/Bot.ts";

const reactions = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
const messages = [
    "The people have decided. This song fucking sucks dude.",
]

export default class VoteskipCmd extends JankbotMusicCmd {
    constructor(public bot: Bot) {
        super();
        this.name = "voteskip";
        this.category = "music";
        this.aliases = ["vs"];
        this.description = "Vote to skip the current song. Only works during radio sessions.";
        this.radio_safe = true;
    }

    async run(bot: Bot, message: JbMessage) {
        if (!bot.radio_session) return message.reply("The radio is off.");

        const song = bot.radio_session.queue.activeSong();
        song.voteskips.add(message.author.id);
        const members = bot.radio_session.stage.members.size - 1; // don't count the bot user

        const voteskip_threshold = Math.ceil(Math.sqrt(members));
        const threshold = Math.min(voteskip_threshold, members);

        message.react(reactions[Math.min(song.voteskips.size, voteskip_threshold)] ?? "➕");

        if (song.voteskips.size >= threshold) {
            const idx = Math.floor(Math.random() * messages.length)
            message.channel.send(messages[idx]);
            bot.radio_session.queue.player.stop();
        } else {
            const left = threshold - song.voteskips.size;
            message.reply(`<@${message.author.id}> wants to skip this song. ${left} more ${left == 1 ? "vote is" : "votes are"} needed.`)
        }
    }
}