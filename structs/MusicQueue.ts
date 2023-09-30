import {
    AudioPlayer, AudioPlayerState,
    AudioPlayerStatus,
    AudioResource,
    createAudioPlayer,
    entersState,
    NoSubscriberBehavior,
    VoiceConnection,
    VoiceConnectionDisconnectReason,
    VoiceConnectionState,
    VoiceConnectionStatus
} from "@discordjs/voice";
import { Message, MessageActionRow, MessageButton, MessageEmbed, TextChannel } from "discord.js";
import { promisify } from "node:util";
import { splitBar } from "string-progressbar";
import { bot } from "../index";
import { QueueOptions } from "../interfaces/QueueOptions";
import { config } from "../utils/config";
import { shortformat } from "../utils/format";
import { icon } from "../utils/icons";
import { Song } from "./Song";

const wait = promisify(setTimeout);

enum QueueState {
    Init,
    Playing,
    Paused,
    Finished
}

export class NoMoreSongsInQueueError extends Error {
    constructor() {
        super("No more songs in queue.");
    }
}

export class QueueIndexOutofBoundsError extends Error {
    public info: {
        which: "from" | "to" | "na";
        limit: number;
    }
    constructor(which: "from" | "to" | "na", limit: number) {
        super("Queue index out of bounds.");
        this.info = {
            which,
            limit
        };
    }
}

export class AttemptToReplacePlayingSongError extends Error {
    constructor() {
        super("Attempt to replace playing song.");
    }
}

export class MusicQueue {
    public readonly message: Message;
    public readonly connection: VoiceConnection;
    public readonly player: AudioPlayer;
    public readonly textChannel: TextChannel;
    public readonly bot = bot;

    public resource: AudioResource;
    public songs: Song[] = [];
    public volume = config.DEFAULT_VOLUME || 100;
    public muted = false;
    public waitTimeout: NodeJS.Timeout;
    private _state = QueueState.Init;
    private _active_idx = 0;
    private queueLock = false;
    private readyLock = false;
    private _last_np_msg?: Message;
    private _msg_update_timeout: NodeJS.Timeout;
    private _last_queue_msg?: Message;
    private _last_from_to: [number, number] = [0, 0];
    private _button_listener?: (interaction: any) => void;

    public constructor(options: QueueOptions) {
        Object.assign(this, options);

        this.textChannel = options.message.channel as TextChannel;
        this.player = createAudioPlayer({ behaviors: { 
            noSubscriber: NoSubscriberBehavior.Play,
            // fixes wacky behaviour on opus streams
            maxMissedFrames: Infinity 
        } });
        this.connection.subscribe(this.player);

        this.connection.on("stateChange" as any, async (_: VoiceConnectionState, newState: VoiceConnectionState) => {
            if (newState.status === VoiceConnectionStatus.Disconnected) {
                if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
                    this.stop();
                } else if (this.connection.rejoinAttempts < 5) {
                    await wait((this.connection.rejoinAttempts + 1) * 5_000);
                    this.connection.rejoin();
                } else {
                    this.stop();
                }
            } else if (
                !this.readyLock &&
                (newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling)
            ) {
                if (this.connection.joinConfig.channelId) {
                    const channel = this.textChannel.guild.channels.cache.get(this.connection.joinConfig.channelId);
                    if (channel?.type === "GUILD_STAGE_VOICE") {
                        this.textChannel.guild.me!.voice.setSuppressed(false);
                    }
                }
                this.readyLock = true;
                try {
                    await entersState(this.connection, VoiceConnectionStatus.Ready, 20_000);
                } catch {
                    if (this.connection.state.status !== VoiceConnectionStatus.Destroyed) {
                        try {
                            this.stop();
                        } catch {}
                    }
                } finally {
                    this.readyLock = false;
                }
            }
        });

        this.player.on("stateChange" as any, async (oldState: AudioPlayerState, newState: AudioPlayerState) => {
            if (oldState.status !== AudioPlayerStatus.Idle && newState.status === AudioPlayerStatus.Idle) {
                let success = false;
                while(!success){
                    try {
                        await this.playNext();
                        success = true;
                    } catch (e) {
                        if (e instanceof NoMoreSongsInQueueError) {
                            //print
                            this.stop();
                            return;
                        } else {
                            this.textChannel.send({ content: `Encountered an error trying to play ${this.songs[this._active_idx].title}. Skipping...` })
                            console.log(e);
                        }
                    }
                }
               
            } else if (oldState.status === AudioPlayerStatus.Buffering && newState.status === AudioPlayerStatus.Playing) {
                // this.sendPlayingMessage(newState);
            }
        });

        this.player.on("error", (error) => {
            console.error(error);
            if (this.songs.length) {
                this.playNext();
            } else {
                this.stop();
            }
        });
    }

    public async push(song: Song) {
        this.songs.push(song);
        if (this._state === QueueState.Init) {
            this.playNext();
        }
    }

    public async unshift(song: Song) {
        this.songs.unshift(song);
        if (this._state === QueueState.Init) {
            this.playNext();
        }
    }

    public async playNext() {
        while (this.queueLock) {
            await new Promise((resolve) => {
                setTimeout(resolve, 100);
            });
        }
        this.queueLock = true;
        try {
            if (this._state === QueueState.Init) {
                const active_song = this.songs[this._active_idx];
                this.resource = (await active_song.makeResource()!) as AudioResource;
                this._state = QueueState.Playing;
                this.player.play(this.resource);
                return active_song;
            }
            if (!this.songs.length || this._active_idx == this.songs.length - 1 || this._state === QueueState.Finished) {
                throw new NoMoreSongsInQueueError();
            }
            if (this._state === QueueState.Playing) {
                if(this.player.state.status === AudioPlayerStatus.Playing || this.player.state.status === AudioPlayerStatus.Paused) {
                    this.player.stop();
                }
                const active_song = this.songs[++this._active_idx];
                this.resource = (await active_song.makeResource()!) as AudioResource;
                this.player.play(this.resource);
                if (this._last_queue_msg) {
                    const [mbed, _] = this.generate_queue_embed({from: this._last_from_to[0], to: this._last_from_to[1]});
                    this._last_queue_msg.edit({ embeds: [mbed] });
                }
                return active_song;
            }
        } finally {
            this.queueLock = false;
        }
    }

    public stop(now = false) {
        if (this._state === QueueState.Finished) return;
        this.player.stop();
        this._state = QueueState.Finished;
        if (this._last_queue_msg) {
            this._last_queue_msg.edit({ components: [] });
        }
        if (this._button_listener) {
            this.bot.client.removeListener("interactionCreate", this._button_listener);
        }
        this.bot.leave_timeouts.set(this.textChannel.guildId, setTimeout(() => {
            this.connection.destroy();
            this.bot.leave_timeouts.delete(this.textChannel.guildId);
        }, now ? 0 : 600_000));
        if (!now) this.textChannel.send({ content: "Queue finished. Leaving voice channel in 10 minutes." });
        this.bot.destroyQueue(this.textChannel.guildId);
    }

    public pause() {
        if (this._state === QueueState.Playing) {
            this.player.pause();
            this._state = QueueState.Paused;
        }
    }

    public resume() {
        if (this._state === QueueState.Paused) {
            this.player.unpause();
            this._state = QueueState.Playing;
        }
    }

    public setVolume(volume: number) {
        this.volume = volume;
        this.resource.volume?.setVolumeLogarithmic(this.volume / 100);
    }

    public async skipTo(index: number) {
        while (this.queueLock) 
        {
            await new Promise((resolve) => {
                setTimeout(resolve, 100);
            });
        }
        try {
            this.queueLock = true;
            if (index < 0 || index >= this.songs.length) {
                throw new QueueIndexOutofBoundsError("na", this.songs.length);
            }
            this._active_idx = index - 1;
            this.player.stop(); // this will trigger playNext
        } finally {
            this.queueLock = false;
        }
    }

    public move(from: number, to: number) {
        if (from < 0 || from >= this.songs.length) {
            throw new QueueIndexOutofBoundsError("from", this.songs.length);
        } else if (to < 0 || to >= this.songs.length) {
            throw new QueueIndexOutofBoundsError("to", this.songs.length);
        } else if (from === this._active_idx || to === this._active_idx) {
            throw new AttemptToReplacePlayingSongError();
        }
        const song = this.songs[from];
        this.songs.splice(from, 1);
        this.songs.splice(to, 0, song);

        if (this._last_queue_msg) {
            this.update_last_queue_message();
        }
    }

    public activeSong() {
        return this.songs[this._active_idx];
    }

    public get activeIndex() {
        return this._active_idx;
    }

    public async generate_np_msg(): Promise<MessageEmbed> {
        const song = this.activeSong();
        const seek = this.resource.playbackDuration / 1000;
        const left = song.duration - seek;

        let nowPlaying = new MessageEmbed()
            .setTitle(`${song.title}`)
            .setDescription(`${song.url} \n Queue Position: ${this.activeIndex + 1} / ${this.songs.length}`)
            .setColor("#F8AA2A");

        nowPlaying.addFields([{
            name: "Added By",
            value: `<@${song.added_by}>`,
        },
        song.duration != 0 ? {
            name: "\u200b",
            value: (this.player.state.status === AudioPlayerStatus.Paused ? `${icon("pause")}` : `${icon("resume")}`) + " `" +
                shortformat(seek * 1000) +
                "` [" +
                    splitBar(song.duration == 0 ? seek : song.duration, seek, 10, undefined, `${icon("playhead")}`)[0] +
                "] `" +
                (song.duration == 0 ? " ◉ LIVE" : shortformat(song.duration * 1000)) + "`"
        } : {
            name: "\u200b",
            value: "◉ LIVE"
        }
        ])

        if (song.duration > 0) {
            nowPlaying.setFooter({
                text: `Time Remaining: ${new Date(left * 1000).toISOString().slice(11, 19)}`
            });
        }
        return nowPlaying;
    }

    private async _update_last_np_msg(msg: Message) {
        if (this._last_np_msg) {
            const embed: MessageEmbed = await this.generate_np_msg();
            msg.edit({
                embeds: [embed]
            });
        }
        if (this._state === QueueState.Playing || this._state == QueueState.Paused) {
            this._msg_update_timeout = setTimeout(() => this._update_last_np_msg(msg), 2500);
        } else {
            this._last_np_msg = undefined;
        }
    }

    public async set_and_update_np_msg(msg: Message) {
        this._last_np_msg = msg;
        if (this._msg_update_timeout) {
            clearTimeout(this._msg_update_timeout);
        }
        setTimeout(() => this._update_last_np_msg(msg), 2500);
    }

    public generate_queue_embed(opt?: {
        from: number,
        to: number
    }): [MessageEmbed, MessageActionRow] {
        if (!opt) {
            let from, to;
            from = this._active_idx - 2;
            if (from < 0) from = 0;
            to = from + 9;
            if (to > this.songs.length - 1) to = this.songs.length - 1;
            return this.generate_queue_embed({
                from,
                to
            });
        }

        const queue_lines = [];
        for (let i = opt.from; i <= opt.to; i++) {
            let title;
            if (this.songs[i].title.length > 32) {
                title = this.songs[i].title.slice(0, 32) + "...";
            } else {
                title = this.songs[i].title;
            }
            if (i === this._active_idx) {
                queue_lines.push(`${icon("resume")} **${i + 1}.** ${title} \`[${shortformat(this.songs[i].duration * 1000)}]\` (<@${this.songs[i].added_by}>)`);
            } else {
                queue_lines.push(`${icon("transparent")} **${i + 1}.** ${title} \`[${shortformat(this.songs[i].duration * 1000)}]\` (<@${this.songs[i].added_by}>)`);
            }
        }

        this._last_from_to = [opt.from, opt.to];

        return [new MessageEmbed()
                        .setTitle(`Showing [${opt.from + 1}-${opt.to + 1}] of ` + this.songs.length + " songs in queue")
                        .setDescription(queue_lines.join("\n")), this.generate_action_row(opt.from, opt.to)];
    }

    public generate_action_row(from: number, to: number): MessageActionRow {
        const buttons = [];
        buttons.push(new MessageButton()
            .setCustomId("queue_prev:" + this.message.guildId!)
            .setStyle("PRIMARY")
            .setEmoji("⬆️")
            .setDisabled(from === 0)
        );

        buttons.push(new MessageButton()
            .setCustomId("queue_next:" + this.message.guildId!)
            .setStyle("PRIMARY")
            .setEmoji("⬇️")
            .setDisabled(to === this.songs.length - 1)
        );
        return new MessageActionRow()
            .addComponents(buttons);
    }

    public set_last_queue_message(msg: Message) {
        if (this._last_queue_msg) {
            this._last_queue_msg.edit({
                components: []
            })
        } else {
            this._button_listener = async (interaction) => {
                if (!interaction.isButton()) return;
                if (interaction.customId === 'queue_prev:' + this.message.guildId) {
                    interaction.deferUpdate();
                    this.update_last_queue_message('up');
                } else if (interaction.customId === 'queue_next:' + this.message.guildId!) {
                    interaction.deferUpdate();
                    this.update_last_queue_message('down');
                }
            };
            this.message.client.on('interactionCreate', this._button_listener);
        }
        this._last_queue_msg = msg;
    }

    public async update_last_queue_message(dir?: 'up' | 'down') {
        let from, to;
        if (dir === 'up') {
            from = this._last_from_to[0] - 10;
            if (from < 0) from = 0;
            to = from + 9;
        } else if (dir === 'down'){
            to = this._last_from_to[1] + 10;
            if (to > this.songs.length - 1) to = this.songs.length - 1;
            from = to - 9;
        } else {
            from = this._last_from_to[0];
            to = this._last_from_to[1];
        }
        const [embed, row] = this.generate_queue_embed({
            from,
            to
        });

        this._last_queue_msg!.edit({
            embeds: [embed],
            components: [row]
        });
    }

    public async remove(idx: number) {
        if (idx === this._active_idx) {
            throw new AttemptToReplacePlayingSongError();
        }
        if (idx < 0 || idx >= this.songs.length) {
            throw new QueueIndexOutofBoundsError('na', this.songs.length);
        }
        const s = this.songs.splice(idx, 1);
        if (this._last_queue_msg) {
            this.update_last_queue_message();
        }

        return s[0].title;
    }
}

// export {
//     MusicQueue,
//     QueueState,
//     QueueIndexOutofBoundsError,
//     AttemptToReplacePlayingSongError,
//     NoMoreSongsInQueueError
// }