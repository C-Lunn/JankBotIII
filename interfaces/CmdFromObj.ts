import { Message } from "discord.js";
import { Bot } from "../structs/Bot";
import { Command } from "./Command";
import JankbotCmd from "./JankbotCommand";
import JankbotMusicCmd from "./JankbotMusicCommand";

export default function CmdFromObj(obj: Command, bot: Bot): JankbotCmd {
    const runWrapper = async (bot: Bot, message: Message, args: string[]) => {
        obj.execute(message, args);
    }
    if (obj.category === "music") {
        return new JankbotMusicCmd(obj.name, obj.description, bot, runWrapper, obj.aliases, obj.permissions, obj.cooldown);
    } else {
        return new JankbotCmd(obj.name, obj.description, bot, runWrapper, obj.is_tantamod ?? false, obj.aliases, obj.permissions, obj.cooldown);
    }

}