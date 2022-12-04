import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";

export default class TantamodTestCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super("tantamodtest", "Test command for tantamod", bot, async (bot, message, args) => {
            message.channel.send("Woyoy");
        }, true);
    }
}