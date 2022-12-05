import { GuildMember, Message } from "discord.js";
import { Bot } from "../structs/Bot";
import { Command } from "./Command";

export default class JankbotCmd implements Command {
    public name: string;
    public description: string;
    public aliases?: string[];
    public permissions?: string[];
    public cooldown?: number;
    protected bot: Bot;
    protected _is_tantamod: boolean;
    constructor() {
    }

    execute(message: Message, args: string[]) {
        if (this._is_tantamod && !message.member!.roles.cache.has("736622853797052519")) {
            message.react("🚫")
        } else {
            this.run(this.bot, message, args);
        }
    }

    public async run (bot: Bot, message: Message, args: string[]) {
        console.log("Command not implemented.");
    }

    public static factory(name: string, 
                description: string,
                bot: Bot,
                run: (bot: Bot, message: Message, args: string[]) => Promise<void>,
                is_tantamod: boolean = false,
                aliases?: string[],
                permissions?: string[],
                cooldown?: number) {
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
