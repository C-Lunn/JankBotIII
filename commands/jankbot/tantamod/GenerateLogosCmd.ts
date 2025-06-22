import JankbotCmd, { type JbMessage } from "../../../interfaces/JankbotCommand.ts";
import { Bot } from "../../../structs/Bot.ts";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

export default class GenerateLogosCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.name = "gendursts";
        this.description = "lowgo";
        this.aliases = [""];
        this.permissions = ["ManageMessages"];
        this._is_tantamod = true;
        this.bot = bot;
    }

    public override async run(bot: Bot, message: JbMessage, args: string[]) {
        // upload images from the ../../resource/muselogos folder and save their URLs to a file in JSON format
        const urls = [];
        const logos = readdirSync(join(import.meta.dirname, "..", "..", "..", "resource", "durst"));
        let msg_to_edit = await message.channel.send("Uploading dursts...");
        let i = 1;
        for (const logo of logos) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            try {
                const logo_file = readFileSync(join(import.meta.dirname, "..", "..", "..", "resource", "durst", logo));
                const logo_url = (await message.channel.send({
                    files: [ logo_file ]
                })).attachments.first()!.url;
                urls.push(logo_url);
                await msg_to_edit.edit(`Uploading dursts... (${i++}/${logos.length})`);
            } catch (e) {
                console.log(e);
            }
        }
        await msg_to_edit.edit("Done uploading logos.");
        const logos_file = join(import.meta.dirname, "..", "..", "..", "resource", "dursts.json");
        const logos_json = JSON.stringify(urls);
        //write to file
        require("fs").writeFile(logos_file, logos_json, function(err: any) {
            if (err) {
                console.log(err);
            }
        });
    }
}