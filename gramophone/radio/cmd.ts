import commandLineArgs from 'command-line-args';
import JankbotCmd, { type JbMessage } from "../../interfaces/JankbotCommand.ts";
import { Bot } from "../../structs/Bot.ts";
import { ChannelType, DiscordAPIError } from 'discord.js';
import RadioSession from './session.ts';
import pfs from "fs/promises";

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
        if (!message.guild) {
            return message.reply("This command is not available here.")
        }
        const { command, _unknown: argv } = commandLineArgs([
            { name: "command", defaultOption: true }
        ], { stopAtFirstUnknown: true, argv: args });

        switch (command) {
            case "init": { this.init(bot, message, argv); break; }
            case "restore": { this.restore(bot, message, argv); break; }
            default: message.reply(`unknown radio command "${command}"`)
        }
    }

    async init(bot: Bot, message: JbMessage, args?: string[]) {
        const { channel: id, stage: stageid } = commandLineArgs([
            { name: "channel", type: String, defaultOption: true },
            { name: "stage", type: String },
        ], { argv: args });

        let channel;
        try {
            channel = await bot.client.channels.fetch(id);
        } catch (e) {
            if (!(e instanceof DiscordAPIError)) {
                throw e
            }
        }

        if (!channel || !channel.isSendable()) {
            return message.reply("💔 Could not find a channel with that id.");
        }

        let stage;
        try {
            stage = await bot.client.channels.fetch(stageid);
        } catch (e) {
            if (!(e instanceof DiscordAPIError)) {
                throw e
            }
        }

        if (!stage) {
            return message.reply("💔 Could not find a stage with that id.");
        }

        if (stage.type != ChannelType.GuildStageVoice) {
            return message.reply("💔 The provided stage is not actually a stage.");
        }

        const msg = await channel.send("Setting up the radio…");
        bot.radio_session = new RadioSession(msg, stage, bot);

        message.reply("Jankbot is now in **Radio Mode**. Exciting times!");
    }

    async end(bot: Bot, message: JbMessage, args: string[]) {
        if (!bot.radio_session) {
            return message.reply("The radio is not active.")
        }

        await bot.radio_session.self_destruct();
        bot.radio_session = undefined;
        message.reply("Done.");
    }

    async restore(bot: Bot, message: JbMessage, args?: string[]) {
        if (bot.radio_session) {
            message.reply("A radio session is already active");
        }

        try { await pfs.stat("radio.json") } catch {
            return message.reply("Nothing to restore.");
        }

        try {
            this.bot.radio_session = await RadioSession.restore(bot);
        } catch (e) {
            message.reply(`Error: \`${e}\``)
        }

        message.react("✅");
    }
}
