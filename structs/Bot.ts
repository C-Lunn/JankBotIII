import { ActivityType, Client, Collection, Snowflake } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import CmdFromObj from "../interfaces/CmdFromObj";
import { Command } from "../interfaces/Command";
import { checkPermissions } from "../utils/checkPermissions";
import { config } from "../utils/config";
import { i18n } from "../utils/i18n";
import { MissingPermissionsException } from "../utils/MissingPermissionsException";
import { MusicQueue } from "./MusicQueue";
import { QuitSibelius } from "./QuitSibelius";
import { WhatWhenGramophone } from "./WhatWhenGramophone";
import command_registry from "../commands/registry";
import WebService from "../web";

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class Bot {
    public readonly prefix = config.PREFIX;
    public commands = new Collection<string, Command>();
    public cooldowns = new Collection<string, Collection<Snowflake, number>>();
    public queues = new Collection<Snowflake, MusicQueue>();
    public _dj_mode = new Collection<Snowflake, NodeJS.Timeout>();
    public _voice_is_surpressed = new Collection<Snowflake, boolean>();
    public leave_timeouts = new Collection<Snowflake, NodeJS.Timeout>();
    public readonly mod_role_id = config.MOD_ROLE_ID;
    private _qs: QuitSibelius;
    private _wg: WhatWhenGramophone;
    private _all_command_names: string[] = [];

    public constructor(public readonly client: Client) {
        this.client.login(config.TOKEN);

        this.client.on("ready", () => {
            console.log(`${this.client.user!.username} ready!`);
            client.user!.setActivity(
                `${this.prefix}help and ${this.prefix}play`,
                { type: ActivityType.Listening }
            );
        });

        this.client.on("warn", (info) => console.log(info));
        this.client.on("error", console.error);

        process.on('unhandledRejection', error => {
            console.log('Test error:', error);
        });

        new WebService(this).listen();

        this.register_commands();
        this.onMessageCreate();
        this._qs = new QuitSibelius(this);
        this._wg = new WhatWhenGramophone(this);
    }

    public getDJMode(guildId: Snowflake) {
        return this._dj_mode.get(guildId) ?? false;
    }

    public setDJMode(state: 'on' | 'off', guildId: Snowflake, timeout?: NodeJS.Timeout) {
        if (state === 'on') {
            if (timeout) {
                this._dj_mode.set(guildId, timeout);
            } else {
                throw new Error('Timeout not provided');
            }
        } else {
            clearTimeout(this._dj_mode.get(guildId)!);
            this._dj_mode.delete(guildId);
        }
    }

    private async register_commands() {
        // cleanup task: this is comically slow and a really stupid api. at 
        // some point someone (me) needs to go though all these and convert 
        // them into JankbotCmds and add them to registry.ts.
        const commandFiles = readdirSync(join(__dirname, "..", "commands")).filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

        for (const file of commandFiles) {
            const command = await import(join(__dirname, "..", "commands", `${file}`));
            const cmd = CmdFromObj(command.default, this);
            console.log(`Registering command ${cmd.name}`);
            this.commands.set(cmd.name, cmd);
        }

        // this, on the other hand, is perfect.
        for (const c of command_registry(this)) {
            this.commands.set(c.name, c);
        }

        for (const [name, cmd] of this.commands) {
            if (name.length !== 1) this._all_command_names.push(name);
            if (cmd.aliases) {
                for (const alias of cmd.aliases) {
                    if (alias.length !== 1) this._all_command_names.push(alias);
                }
            }
        }
    }

    private async onMessageCreate() {
        this.client.on("messageCreate", async (message: any) => {
            if (message.author.bot || !message.guild) return;

            if (message.content.toLowerCase() === "quit sibelius"
                || message.content === "<:quit1:737227012435083274><:quit2:737226986191061013>"
                || message.content === "<:quit1:737227012435083274> <:quit2:737226986191061013>"
            ) {
                this._qs.run(message);
                return;
            }

            if ((
                    message.content.toLowerCase().includes("what")
                    || message.content.toLowerCase().includes("when")
                ) && message.content.toLowerCase().includes("gramophone")
            ) {
                const what_index = message.content.toLowerCase().indexOf("what");
                const when_index = message.content.toLowerCase().indexOf("when");
                const gram_index = message.content.toLowerCase().indexOf("gramophone");
                if (what_index !== -1) {
                    if (Math.abs(gram_index - what_index) < 25) {
                        this._wg.run(message);
                        return;
                    }
                } else if (when_index !== -1) {
                    if (Math.abs(gram_index - when_index) < 25) {
                        this._wg.run(message);
                        return;
                    }
                }
                return;
            }

            const prefixRegex = new RegExp(`^(<@!?${this.client.user!.id}>|${escapeRegex(this.prefix)})\\s*`);
            let command: Command | null = null;
            let args: string[] = [];
            if (prefixRegex.test(message.content)) {
                const [, matchedPrefix] = message.content.match(prefixRegex);

                args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
                const commandName = args.shift()?.toLowerCase();

                // @ts-ignore
                command =
                    // @ts-ignore
                    this.commands.get(commandName!) ?? this.commands.find((cmd) => cmd.aliases?.includes(commandName));

                if (!command) return;

                if (!this.cooldowns.has(command.name)) {
                    this.cooldowns.set(command.name, new Collection());
                }
            }

            if (!command || command === null) return;

            const now = Date.now();
            const timestamps: any = this.cooldowns.get(command.name);
            const cooldownAmount = (command.cooldown || 1) * 1000;

            if (timestamps.has(message.author.id)) {
                const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

                if (now < expirationTime) {
                    const timeLeft = (expirationTime - now) / 1000;
                    return message.reply(i18n.__mf("common.cooldownMessage", { time: timeLeft.toFixed(1), name: command.name }));
                }
            }

            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

            try {
                const permissionsCheck: any = await checkPermissions(command, message);

                if (permissionsCheck.result) {
                    command.execute(message, args);
                } else {
                    throw new MissingPermissionsException(permissionsCheck.missing);
                }
            } catch (error: any) {
                console.error(error);

                if (error.message.includes("permissions")) {
                    message.reply(error.toString()).catch(console.error);
                } else {
                    message.reply(i18n.__("common.errorCommand")).catch(console.error);
                }
            }
        });
    }

    public getSurpressed(guild: string) {
        return this._voice_is_surpressed.get(guild) ?? true;
    }

    public setSurpressed(guild: string, state: boolean) {
        this._voice_is_surpressed.set(guild, state);
    }

    public async destroyQueue(guildId: Snowflake) {
        this.queues.delete(guildId);
        // leave here?
    }
}
