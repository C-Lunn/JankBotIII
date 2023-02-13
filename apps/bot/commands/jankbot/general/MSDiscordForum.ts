import { Message } from "discord.js";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";

export default class SlayCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.name = "ms";
        this.description = "Get a link to the MuseScore Discord & Forum";
    }

    public override async run(bot: Bot, message: Message, args: string[]) {
        message.channel.send("Hey! Please ask your questions in the MuseScore Discord or Forum. \n **Discord:** https://discord.gg/jGymtwN6YG \n **Forum:** https://musescore.org/en/forum");
    }
}