import JankbotCmd, { type JbMessage } from "../../../interfaces/JankbotCommand.ts";
import { Bot } from "../../../structs/Bot.ts";

export default class SlayCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.name = "slay";
        this.description = "Yaaaaaaaaaaas";
        this.aliases = ["yas"];
    }

    public override async run(bot: Bot, message: JbMessage, args: string[]) {
        message.channel.send("✨🌈");
    }
}