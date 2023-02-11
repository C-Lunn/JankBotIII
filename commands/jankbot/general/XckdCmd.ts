import { Message } from "discord.js";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";

export default class XkcdCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.name = "xkcd";
        this.description = "Get a specific XKCD comic by number, the latest with 'l(atest)', and random with no arguments.";
    }

    public override async run(bot: Bot, message: Message, args: string[]): Promise<void> {
        const latest_xkcd = await fetch("https://xkcd.com/info.0.json").then(res => res.json());
        let xkcd: string;
        if (!isNaN(parseInt(args[0]))) {
            if (parseInt(args[0]) > latest_xkcd.num) {
                message.reply("That comic doesn't exist yet!");
                return;
            }
            xkcd = args[0];
        } else if (args[0] === "l" || args[0] === "latest") {
            xkcd = latest_xkcd.num.toString();
        } else {
            xkcd = Math.floor(Math.random() * latest_xkcd.num).toString();
        }
        message.reply(`https://xkcd.com/${xkcd}/`);
    }
}