import { Message } from "discord.js";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";

export default class CatCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.name = "kitty";
        this.description = "cat";
        this.aliases = ["cat"];
    }

    public override async run(bot: Bot, message: Message, args: string[]) {
        message.channel.send("https://imgs.xkcd.com/comics/cat_proximity.png");
    }
}