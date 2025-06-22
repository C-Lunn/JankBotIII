import { Message } from "discord.js";
import JankbotCmd, { type JbMessage } from "../../../interfaces/JankbotCommand.ts";
import { Bot } from "../../../structs/Bot.ts";

export default class CatCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.name = "kitty";
        this.description = "cat";
        this.aliases = ["cat"];
    }
    

    public override async run(bot: Bot, message: JbMessage, args: string[]) {
        message.channel.send("https://imgs.xkcd.com/comics/cat_proximity.png");
    }
}