import JankbotCmd, { JbMessage } from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";

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