import { Message } from "discord.js";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";

export default class JankmanCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.name = "jankman";
        this.description = "Get a jankman.";
        this.aliases = ["<:jankman:736593545376563320>"];
    }

    public override async run(bot: Bot, message: Message, args: string[]) {
        message.channel.send("https://cdn.discordapp.com/attachments/850700283767554068/1056996073182330981/jman.png");
    }
}