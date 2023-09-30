import { Message } from "discord.js";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";


export default class RecieverModeCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.name = "recieve";
        this.description = "recieve a stream o audio";
        this.aliases = ["reciever"];
    }

    public override async run(bot: Bot, message: Message, args: string[]) {
        const { channel } = message.member!.voice;

        if (!channel) { 
            message.reply(i18n.__("play.errorNotChannel")).catch(console.error);
            return;
        }

        const queue = bot.queues.get(message.guild!.id);

    }
}