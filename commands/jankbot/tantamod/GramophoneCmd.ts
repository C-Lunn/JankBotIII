import { Message } from "discord.js";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";
import { GramophoneServer, NotAThreadError } from "../../../utils/socket";

export default class GramophoneCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.name = "prep";
        this.description = "prime a channel for gramophoning";
        this.aliases = ["gramophone"];
        this.permissions = ["ManageMessages"];
        this._is_tantamod = true;
        this.bot = bot;
    }

    public override async run(bot: Bot, message: Message, args: string[]) {
        const id = args[0];
        if (!id) {
            message.reply("You need to provide a thread ID");
            return;
        }

        try {
            const srv = await GramophoneServer.from_id(bot, id, message.channel);
            bot.gramo = srv
            message.reply("done :)")
        } catch (e) {
            if (e == NotAThreadError) {
                message.reply("Couldn't find that thread");
                return;
            }
        }
    }
}