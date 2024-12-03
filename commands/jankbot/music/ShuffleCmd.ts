import { Message } from "discord.js";
import { i18n } from "../../../utils/i18n";
import { canModifyQueue } from "../../../utils/queue";
import JankbotMusicCmd from "../../../interfaces/JankbotMusicCommand";
import { Bot } from "../../../structs/Bot";

export default class ShuffleCmd extends JankbotMusicCmd {
    constructor(public bot: Bot) {
        super();
        this.name = "shuffle";
        this.category = "music";
        this._is_tantamod = true;
        this.description = i18n.__("shuffle.description");
    }
    
    async run(bot: Bot, message: Message) {
        const queue = bot.queues.get(message.guild!.id);
        
        if (!queue) return message.reply(i18n.__("shuffle.errorNotQueue")).catch(console.error);
        
        if (!canModifyQueue(message.member!)) return i18n.__("common.errorNotChannel");
        
        let songs = queue.songs;
        
        for (let i = songs.length - 1; i > 1; i--) {
            let j = 1 + Math.floor(Math.random() * i);
            [songs[i], songs[j]] = [songs[j], songs[i]];
        }
        
        queue.songs = songs;
        
        queue.textChannel.send(i18n.__mf("shuffle.result", { author: message.author })).catch(console.error);
    }
}
