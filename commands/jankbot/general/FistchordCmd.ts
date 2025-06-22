import { VoiceChannel } from "discord.js";
import JankbotCmd, { type JbMessage } from "../../../interfaces/JankbotCommand.ts";
import { Bot } from "../../../structs/Bot.ts";

export default class FistchordCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.name = "fistchord";
        this.description = "Is it fistchord yet?";
        this.aliases = ["fistcord"];
    }

    public override async run(bot: Bot, message: JbMessage, args: string[]) {
        const now = new Date();
        if (now.getDay() === 5) {
            if (now.getHours() >= 17) {
                const vc = (message.member?.guild!.channels.cache.get("944343552027164733") as VoiceChannel);
                if (vc) {
                    if (vc.members.size >= 4) {
                        await message.reply("Yes!");
                        return;
                    }
                }
                await message.reply("Almost!");
            } else {
                await message.reply("No, but it is today!");
            }
        } else {
            await message.reply("No :( Fistchord is on Friday!");
        }
    }
}