import { Message } from "discord.js";
import { i18n } from "../../../utils/i18n";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";

export default class UptimeCmd extends JankbotCmd {
    constructor(public bot: Bot) {
        super();
        this.name = "uptime";
        this.description = "find out how long the bot has been toiling";
        this.aliases = ['uptime'];
    }
    
    async run(bot: Bot, message: Message) {
        let seconds = Math.floor(bot.client.uptime! / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);
        let days = Math.floor(hours / 24);
        
        seconds %= 60;
        minutes %= 60;
        hours %= 24;
        
        message
            .reply(i18n.__mf("uptime.result", { days: days, hours: hours, minutes: minutes, seconds: seconds }))
            .catch(console.error);

    }
}