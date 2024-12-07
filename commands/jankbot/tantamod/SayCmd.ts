import { Message, TextChannel } from "discord.js";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";

export default class SayCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.name = "say";
        this.description = "Make the bot say something";
        this.aliases = ["s"];
        this.permissions = ["ManageMessages"];
        this._is_tantamod = true;
        this.bot = bot;
    }

    public override async run(bot: Bot, message: Message, args: string[]) {
            if(/^<#\d+>/.test(args[0])) {
                const channel = message.guild!.channels.cache.get(args[0].slice(2, -1));
                if(channel) {
                    if (channel instanceof TextChannel) {
                        if (/^\d+/.test(args[1])) {
                            try {
                                const msg = await channel.messages.fetch(args[1]);
                                msg.reply(args.slice(2).join(" "));
                            } catch (e) {
                                message.reply("Invalid message ID.");
                            }
                        } else {
                            channel.send(args.slice(1).join(" "));
                        }
                    } else {
                        message.reply("That's not a text channel.");
                    }
                }
            }
    }
}