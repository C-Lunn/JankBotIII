import { Message, PermissionsString } from "discord.js";
import { Bot } from "../structs/Bot";
import JankbotCmd, { JbMessage } from "./JankbotCommand";

export default class JankbotMusicCmd extends JankbotCmd {
    constructor() {
        super();
    }

    override execute(message: JbMessage, args: string[]) {
        if(this._is_tantamod && !message.member!.roles.cache.has("736622853797052519")) {
            message.react("🚫")
            return;
        }
        if (this.bot.getDJMode(message.guildId!) && !message.member!.roles.cache.has("736622853797052519")) {
            message.react("🚫");
            message.reply("DJ mode is on.")
        } else {
            if (!message.channel.isSendable()) return;
            //@ts-ignore
            this.run(this.bot, message, args);
        }
    }

    public static music_factory(name: string,
                            description: string,
                            bot: Bot,
                            run: (bot: Bot, message: JbMessage, args: string[]) => Promise<void>,
                            aliases?: string[],
                            permissions?: PermissionsString[],
                            cooldown?: number) {
        const inst = new JankbotMusicCmd();
        inst.name = name;
        inst.description = description;
        inst.aliases = aliases;
        inst.permissions = permissions;
        inst.cooldown = cooldown;
        inst.bot = bot;
        inst.run = run;
        return inst;
    }
}

