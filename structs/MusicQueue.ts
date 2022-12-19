import {
    AudioPlayer,
    AudioPlayerPlayingState,
    AudioPlayerState,
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
import { Message, TextChannel, User } from "discord.js";
import { promisify } from "node:util";
import { bot } from "../index";
import { QueueOptions } from "../interfaces/QueueOptions";
import { config } from "../utils/config";
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

    public constructor(options: QueueOptions) {
        Object.assign(this, options);

        this.textChannel = options.message.channel as TextChannel;
        this.player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
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
                try {
                    await this.playNext();
                } catch (e) {
                    if (e instanceof NoMoreSongsInQueueError) {
                        //print
                        this.stop();
                    } else {
                        throw e;
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

    public async playNext() {
        if (this.queueLock) return;
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
                return active_song;
            }
        } finally {
            this.queueLock = false;
        }
    }

    public stop() {
        if (this._state === QueueState.Finished) return;
        this.player.stop();
        this._state = QueueState.Finished;
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

    public skipTo(index: number) {
        if (this.queueLock) return;
        try {
            this.queueLock = true;
            if (index < 0 || index >= this.songs.length) {
                throw new QueueIndexOutofBoundsError("na", this.songs.length);
            }
            this._active_idx = index - 1;
            return this.playNext();
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
    }

    public activeSong() {
        return this.songs[this._active_idx];
    }

    public get activeIndex() {
        return this._active_idx;
    }
}

// export {
//     MusicQueue,
//     QueueState,
//     QueueIndexOutofBoundsError,
//     AttemptToReplacePlayingSongError,
//     NoMoreSongsInQueueError
// }