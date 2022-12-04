import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";

export default class SlayCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super("slay", "yaaaaaaaaaaaaaaaaas", bot, async (bot, message, args) => {
            message.channel.send("✨🌈");
        }, true);
    }
}