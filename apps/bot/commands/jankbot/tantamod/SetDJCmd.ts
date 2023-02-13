import { Message } from "discord.js";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";

export default class SetDjCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.name = "dj";
        this.description = "Sets the DJ mode on or off.";
        this.aliases = ["djmode"];
        this._is_tantamod = true;
        this.bot = bot;
    }

    public override async run(bot: Bot, message: Message, args: string[]) {
            if (args[0] == "on") {
                if (bot.getDJMode(message.guildId!)) {
                    message.reply("DJ mode is already on.");
                } else {
                    let time: number;
                    if (args.length > 1) {
                        time = strToMs(args.slice(1).join(""));
                        if (time == -1) {
                            message.reply("Invalid time. Example use: `!dj on 1h 30m`");
                            return;
                        } else if (time == -2) {
                            message.reply("Don't be silly.");
                            return;
                        }
                    } else {
                        time = 2 * 3600 * 1000;
                    }
                    const t = setTimeout(() => {
                        bot.setDJMode('off', message.guildId!);
                        message.channel.send("DJ mode is now off.");
                    }, time);
                    bot.setDJMode('on', message.guildId!, t);
                    message.channel.send(`DJ mode has been set to ON for ${msToStrings(time)}.`);
                }
            } else if (args[0] == "off") {
                if (bot.getDJMode(message.guildId!)) {
                    bot.setDJMode('off', message.guildId!);
                    message.channel.send("DJ mode is now off.");
                } else {
                    message.reply("DJ mode is already off.");
                }
            } else {
                message.reply("Invalid argument. Example use: `!dj on 1h 30m`");
            }
        }
}

function strToMs(str: string): number {
    if(!/^\d+[hmHM]/.test(str)) {
        return -1;
    }
    const hrs = str.match(/\d+[hH]/i)?.[0].slice(0, -1);
    const mins = str.match(/\d+[mM]/i)?.[0].slice(0, -1);
    if (hrs || mins) {
        const time = (hrs ? parseInt(hrs) * 3600000 : 0) + (mins ? parseInt(mins) * 60000 : 0);
        if (time > 1000000000) return -2;
        return time;
    } else return -1;
}

function msToStrings(ms: number){
    let days: number, hours: number, mins: number = 0;
    days = Math.floor(ms / 86400000);
    ms -= days * 86400000;
    hours = Math.floor(ms / 3600000);
    ms -= hours * 3600000;
    mins = Math.floor(ms / 60000);
    return (days > 0 ? days + (days > 1 ? "days, " : "day, "): "") + hours + (hours != 1 ? " hours and " : " hour and ") + mins + (mins != 1 ? " minutes." : " minute.");
}