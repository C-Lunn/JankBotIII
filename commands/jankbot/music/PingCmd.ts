import { Message } from "discord.js";
import { i18n } from "../../../utils/i18n";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";

export default class PingCmd extends JankbotCmd {
    constructor(public bot: Bot) {
        super();
        this.name = "ping";
        this.cooldown = 10;
        this.description = i18n.__("ping.description");
    }
    
    async run(_bot: Bot, message: Message) {
        message
            .reply(i18n.__mf("ping.result", { ping: Math.round(message.client.ws.ping) }))
            .catch(console.error);
    }
}