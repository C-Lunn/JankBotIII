import JankbotCmd, { type JbMessage } from "../../../interfaces/JankbotCommand.ts";
import { Bot } from "../../../structs/Bot.ts";

export default class SlayCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.name = "ms";
        this.description = "Get a link to the MuseScore Discord & Forum";
    }

    public override async run(bot: Bot, message: JbMessage, args: string[]) {
        if (!message.channel.isSendable()) return;

        message.channel.send("Hey! Please ask your questions in the MuseScore Discord or Forum. \n **Discord:** https://discord.gg/jGymtwN6YG \n **Forum:** https://musescore.org/en/forum");
    }
}