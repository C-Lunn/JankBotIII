import { Message, PermissionsString, SendableChannels } from "discord.js";
import { Bot } from "../structs/Bot";
import { Command } from "./Command";

export type JbMessage = Omit<Message, "channel"> & { channel: SendableChannels };

export default class JankbotCmd implements Command {
    public name: string;
    public description: string;
    public aliases?: string[];
    public permissions?: PermissionsString[];
    public cooldown?: number;
    public category?: string;
    public parse_quotes?: boolean;
    protected bot: Bot;
    protected _is_tantamod: boolean;
    constructor() {
    }

    execute(message: JbMessage, args: string[]) {
        const user_is_tantamod = this.bot.mod_role_id instanceof Array 
            ? this.bot.mod_role_id.reduce((acc, x) => acc || message.member!.roles.cache.has(x), false)
            : message.member!.roles.cache.has(this.bot.mod_role_id);
            
        if (this._is_tantamod && !user_is_tantamod) {
            message.react("🚫")
        } else {
            if (!message.channel.isSendable()) return;
            //@ts-ignore
            this.run(this.bot, message, args);
        }
    }

    public async run(bot: Bot, message: JbMessage, args: string[]): Promise<any> {
        console.log("Command not implemented.");
    }

    // OOP PATTERN SPOTTED
    public static factory(name: string,
        description: string,
        bot: Bot,
        run: (bot: Bot, message: JbMessage, args: string[]) => Promise<void>,
        is_tantamod: boolean = false,
        aliases?: string[],
        permissions?: PermissionsString[],
        cooldown?: number
    ) {
        const inst = new JankbotCmd();
        inst.name = name;
        inst.description = description;
        inst.aliases = aliases;
        inst.permissions = permissions;
        inst.cooldown = cooldown;
        inst.bot = bot;
        inst.run = run;
        inst._is_tantamod = is_tantamod;
        return inst;
    }
}
