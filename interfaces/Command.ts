export interface Command {
    name: string;
    description: string;
    aliases?: string[];
    permissions?: string[];
    cooldown?: number;
    category?: string;
    is_tantamod?: boolean;
    execute(...args: any): any;
}
