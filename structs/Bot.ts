import { Client, Collection, Snowflake } from "discord.js";
import express from 'express';
import { readdirSync } from "fs";
import { join } from "path";
import DurstCmd from "../commands/jankbot/general/DurstCmd";
import JankmanCmd from "../commands/jankbot/general/JankmanCmd";
import LogoCmd from "../commands/jankbot/general/LogoCmd";
import MSDiscordForum from "../commands/jankbot/general/MSDiscordForum";
import SlayCmd from "../commands/jankbot/general/SlayCmd";
import TimeCmd from "../commands/jankbot/general/TimeCmd";
import LeaveCmd from "../commands/jankbot/music/LeaveCmd";
import GenerateLogosCmd from "../commands/jankbot/tantamod/GenerateLogosCmd";
import SayCmd from "../commands/jankbot/tantamod/SayCmd";
import SetDjCmd from "../commands/jankbot/tantamod/SetDJCmd";
import StarCmd from "../commands/jankbot/tantamod/StarCmd";
import CmdFromObj from "../interfaces/CmdFromObj";
import { Command } from "../interfaces/Command";
import { checkPermissions } from "../utils/checkPermissions";
import { config } from "../utils/config";
import { i18n } from "../utils/i18n";
import { MissingPermissionsException } from "../utils/MissingPermissionsException";
import { MusicQueue } from "./MusicQueue";

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class Bot {
    public readonly prefix = config.PREFIX;
    public commands = new Collection<string, Command>();
    public cooldowns = new Collection<string, Collection<Snowflake, number>>();
    public queues = new Collection<Snowflake, MusicQueue>();
    public _dj_mode = new Collection<Snowflake, NodeJS.Timeout>();
    public _voice_is_surpressed = new Collection<Snowflake, boolean>();
    public leave_timeouts = new Collection<Snowflake, NodeJS.Timeout>();

    public constructor(public readonly client: Client) {
        this.client.login(config.TOKEN);

        this.client.on("ready", () => {
            console.log(`${this.client.user!.username} ready!`);
            client.user!.setActivity(`${this.prefix}help and ${this.prefix}play`, { type: "LISTENING" });
        });

        this.client.on("warn", (info) => console.log(info));
        this.client.on("error", console.error);

        process.on('unhandledRejection', error => {
            console.log('Test error:', error);
        });

        this.importCommands();
        this.onMessageCreate();
        const app = express();
        app.get('/np', (req, res) => {
            const queue = this.queues.get('638309926225313832');
            if(queue) {
                res.send(queue.songs[0].title);
            } else {
                res.send('No queue');
            }
        });

        app.listen(3000, () => {
            console.log('Listening on port 3000');
        });
    }

    public getDJMode(guildId: Snowflake) {
        return this._dj_mode.get(guildId) ?? false;
    }

    public setDJMode(state: 'on' | 'off', guildId: Snowflake, timeout?: NodeJS.Timeout) {
        if (state === 'on') {
            if(timeout) {
                this._dj_mode.set(guildId, timeout);
            } else {
                throw new Error('Timeout not provided');
            }
        } else {
            clearTimeout(this._dj_mode.get(guildId)!);
            this._dj_mode.delete(guildId);
        }
    }

    private async importCommands() {
        console.log(__dirname);
        const commandFiles = readdirSync(join(__dirname, "..", "commands")).filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

        for (const file of commandFiles) {
            const command = await import(join(__dirname, "..", "commands", `${file}`));
            const cmd = CmdFromObj(command.default, this);
            console.log(`Registering command ${cmd.name}`);
            this.commands.set(cmd.name, cmd);
        }

        for (const c of [
            new SetDjCmd(this),
            new SlayCmd(this),
            new SayCmd(this),
            new TimeCmd(this),
            new DurstCmd(this),
            new LogoCmd(this),
            new StarCmd(this),
            new LeaveCmd(this),
            new MSDiscordForum(this),
            new JankmanCmd(this),
        ]) {
            this.commands.set(c.name, c);
        }
    }

    private async onMessageCreate() {
        this.client.on("messageCreate", async (message: any) => {
            if (message.author.bot || !message.guild) return;

            const prefixRegex = new RegExp(`^(<@!?${this.client.user!.id}>|${escapeRegex(this.prefix)})\\s*`);
            if (!prefixRegex.test(message.content)) return;

            const [, matchedPrefix] = message.content.match(prefixRegex);

            const args: string[] = message.content.slice(matchedPrefix.length).trim().split(/ +/);
            const commandName = args.shift()?.toLowerCase();

            // @ts-ignore
            const command =
                // @ts-ignore
                this.commands.get(commandName!) ?? this.commands.find((cmd) => cmd.aliases?.includes(commandName));

            if (!command) return;

            if (!this.cooldowns.has(command.name)) {
                this.cooldowns.set(command.name, new Collection());
            }

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
