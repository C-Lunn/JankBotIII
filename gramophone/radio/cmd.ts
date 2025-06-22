import commandLineArgs from 'command-line-args';
import JankbotCmd, { type JbMessage } from "../../interfaces/JankbotCommand.ts";
import { Bot } from "../../structs/Bot.ts";


export default class RadioCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.bot = bot;
        this.name = "radio";
        this.description = "Do radio stuff";
        this._is_tantamod = true;
        this.parse_quotes = true;
    }

    async run(bot: Bot, message: JbMessage, args: string[]) {
        const { command, _unknown: argv } = commandLineArgs([
            { name: "command", defaultOption: true }
        ], { stopAtFirstUnknown: true, argv: args });

        switch (command) {
            case "init": this.init(bot, message, argv)
            default: message.reply(`unknown radio command "${command}"`)
        }
    }

    async init(bot: Bot, message: JbMessage, args?: string[]) {
        const { channel: id } = commandLineArgs([
            { name: "channel", type: String, defaultOption: true },
        ], { argv: args });

        const channel = await bot.client.channels.fetch(id);

        if (!channel || !channel.isSendable()) {
            return message.reply("💔 Could not find a channel with that id.");
        }

        const msg = await channel.send("Setting up the radio…");
        

    }
}
