import { Message } from "discord.js";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";

export default class SlayCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.name = "slay";
        this.description = "Yaaaaaaaaaaas";
        this.aliases = ["yas"];
    }

    public override async run(bot: Bot, message: Message, args: string[]) {
        message.channel.send("✨🌈");
    }
}