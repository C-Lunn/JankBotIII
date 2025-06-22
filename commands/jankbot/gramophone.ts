import JankbotCmd, { type JbMessage } from "../../interfaces/JankbotCommand.ts";
import commandLineArgs from 'command-line-args'

import { Bot } from "../../structs/Bot.ts";
import { reload_song, start_archiving } from "../../gramophone/archives.ts";
import { config } from "../../utils/config.ts";
import db from "../../utils/db.ts";
import { inspect } from "node:util";

export default class GramophoneCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.bot = bot;
        this.name = "gramophone";
        this.description = "Do gramophone stuff";
        this._is_tantamod = true;
        this.parse_quotes = true;
    }

    async run(bot: Bot, message: JbMessage, args: string[]) {
        const { command, _unknown: argv } = commandLineArgs([
            { name: "command", defaultOption: true }
        ], { stopAtFirstUnknown: true, argv: args });

        switch (command) {
            case "archive": this.archive(bot, message, argv ?? []); break;
            case "reload": this.reload(bot, message, argv ?? []); break;
            case "publish": this.publish(bot, message, argv ?? []); break;
            case "unpublish": this.unpublish(bot, message, argv ?? []); break;
            default: message.reply(`unknown gramophone command "${command}"`)
        }
    }

    async archive(_bot: Bot, message: JbMessage, args: string[]) {
        const {
            title, number, "thread-id": thread_id, overwrite
        } = commandLineArgs([
            { name: "thread-id", type: String, defaultOption: true },
            { name: "title", type: String },
            { name: "number", type: Number },
            { name: "overwrite", type: Boolean, defaultOption: false },
        ], {
            argv: args,
        });

        message.reply("archiving now! we'll let you know how it goes")

        const report = await start_archiving({
            title, thread_id, request: message, overwrite, number,
        });

        const reused = report.filter(x => x.status == "reused");
        const successful = report.filter(x => x.status == "success");
        const failed = report.filter(x => x.status == "failure");
        const preview_url = new URL(
            "/preview/" + thread_id,
            config.WEBROOT ?? "https://gramophone.space"
        );

        const content = `## Gramophone #${number} Wrapped
### Successfully Archived

${successful.length == 0
                ? "(none)"
                : successful.map(x => `✅ <${x.url}> from <@${x.author}>`).join("\n")}
### Failed to Archive

${failed.length == 0
                ? "(none)"
                : failed.map(x => `⛔️ <${x.url}> from <@${x.author}> (${inspect(x.because)})`).join("\n")}
### Reused
-# (These songs were already in the Gramophone database)
${reused.length == 0
                ? "(none)"
                : reused.map(x => `♻️ <${x.url}> from <@${x.author}>`).join("\n")}

* Preview this thread at ${preview_url}.
* Publish it with \`${config.PREFIX}gramophone publish ${thread_id}\`.
`;
        const splitted = content.match(/.{1,2000}/g);

        // this is here to satisfy discord's message length limit
        const lines = content.split("\n");
        let acc = "";
        let first_message = true;
        for (const [idx, line] of lines.entries()) {
            if (line.length + acc.length > 2000 || idx == lines.length - 1) {
                const opt = {
                    content: acc,
                    allowedMentions: { parse: [] },
                };
                if (first_message) { await message.reply(opt); }
                else { await message.channel.send(opt); }

                first_message = false;
                acc = "";
            } else {
                acc += line + "\n"
            }
        }

    }

    async reload(_bot: Bot, message: JbMessage, args: string[]) {
        const { id, mbid } = commandLineArgs([
            { name: "id", type: String, defaultOption: true },
            { name: "mbid", type: String },
        ], { argv: args });

        const meta = await reload_song(id, mbid);

        message.reply(`all done! this song is now *${meta.title}*`);
    }

    async publish(_bot: Bot, message: JbMessage, args: string[]) {
        const { id } = commandLineArgs([
            { name: "id", type: String, defaultOption: true },
        ], { argv: args });
        const number = db.prepare("SELECT number FROM thread WHERE id = ?").pluck().get(id);

        if (!number) {
            message.reply("couldn't find that thread :(");
            return;
        }

        db.prepare("UPDATE thread SET published = 1 WHERE id = ?").run(id)

        const preview_url = new URL(
            "/gramophone/" + number,
            config.WEBROOT ?? "https://gramophone.space"
        );

        message.reply(`published! see it live at ${preview_url}`)

    }
    async unpublish(_bot: Bot, message: JbMessage, args: string[]) {
        const { id } = commandLineArgs([
            { name: "id", type: String, defaultOption: true },
        ], { argv: args });
        const number = db.prepare("SELECT number FROM thread WHERE id = ?").pluck().get(id);

        if (!number) {
            message.reply("couldn't find that thread :(");
            return;
        }

        db.prepare("UPDATE thread SET published = 0 WHERE id = ?").run(id)

        message.reply(`unpublished.`)
    }
}
