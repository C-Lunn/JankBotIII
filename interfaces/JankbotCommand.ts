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
    protected run: (bot: Bot, message: Message, args: string[]) => Promise<void>;
    protected _is_tantamod: boolean;

    constructor(name: string, 
                description: string,
                bot: Bot,
                run: (bot: Bot, message: Message, args: string[]) => Promise<void>,
                is_tantamod: boolean = false,
                aliases?: string[],
                permissions?: string[],
                cooldown?: number) {
        this.name = name;
        this.description = description;
        this.aliases = aliases;
        this.permissions = permissions;
        this.cooldown = cooldown;
        this.run = run;
        this.bot = bot;
        this._is_tantamod = is_tantamod;
    }

    execute(message: Message, args: string[]) {
        if (this._is_tantamod && !message.member!.roles.cache.has("736622853797052519")) {
            message.react("🚫")
        } else {
            this.run(this.bot, message, args);
        }
    }
}
