import {  ThreadChannel } from "discord.js";
import JankbotCmd, { type JbMessage } from "../../../interfaces/JankbotCommand.ts";
import { Bot } from "../../../structs/Bot.ts";
import { parseSubmission } from "../../../utils/gramophone.ts";

export default class GramophoneThreadCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();

        this.name = "gramothread";
        this.aliases = ["gth"];
        this.description = "Parses a Gramophone thread in a DM";
        this.permissions = [];
        this._is_tantamod = true;
        this.bot = bot;
    }

    public override async run(bot: Bot, message: JbMessage, args: string[]) {
        message.react("😶");
        const [command, threadId] = message.content.split(" ");

        if (!threadId) {
            message.react("👎");
            message.reply("You didn't give me a thread ID.");
            return;
        }

        const thread = message.client.channels.cache.get(threadId);
        if (!thread) {
            message.react("👎");
            message.reply("I can't find that thread.");
            return;
        }

        if (!thread.isThread()) {
            message.react("👎");
            message.reply("That isn't a thread.");
            return;
        }

        const threadContent = (await thread.fetch()) as ThreadChannel;
        const msgs = await threadContent.messages.fetch();

        const parsedMsgs = await Promise.all(
            msgs.map(async (msg) => {
                const content = await msg.fetch();
                return await parseSubmission(content.content);
            })
        );

        message.author.send(await parsedMsgs.map((m) => JSON.stringify(m, null, 2)).join(", "));
        message.react("👍");
        message.reply(`DMed you ${threadContent.messageCount} results.`);
    }
}
