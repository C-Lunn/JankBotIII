import { PermissionsString } from "discord.js";

export interface Command {
    name: string;
    description: string;
    aliases?: string[];
    permissions?: PermissionsString[];
    cooldown?: number;
    category?: string;
    is_tantamod?: boolean;
    parse_quotes?: boolean,
    execute(...args: any): any;
}
