import {
    AudioPlayer,
    AudioPlayerStatus,
    AudioResource,
    createAudioPlayer,
    NoSubscriberBehavior,
    VoiceConnection
} from "@discordjs/voice";
import { EmbedBuilder, Message, TextChannel } from "discord.js";
import { promisify } from "node:util";
import { splitBar } from "string-progressbar";
import { bot } from "../index.ts";
import type { JbMessage } from "../interfaces/JankbotCommand.ts";
import { QueueOptions } from "../interfaces/QueueOptions.ts";
import { config } from "../utils/config.ts";
import { shortformat } from "../utils/format.ts";
import { icon } from "../utils/icons.ts";
import { Song } from "./Song.ts";

export enum QueueState {
    Init,
    Playing,
    Paused,
    Ready,
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

export const wait = promisify(setTimeout);

export class Queue {
    public readonly message: JbMessage;
    public readonly connection: VoiceConnection;
    public readonly player: AudioPlayer;
    public readonly textChannel: TextChannel;
    public readonly bot = bot;

    public resource: AudioResource;
    public songs: Song[] = [];
    public volume = config.DEFAULT_VOLUME || 100;
    public muted = false;
    public waitTimeout: NodeJS.Timeout;
    protected _state = QueueState.Init;
    protected _active_idx = 0;
    protected queueLock = false;
    protected readyLock = false;
    protected _last_np_msg?: Message;
    protected _msg_update_timeout: NodeJS.Timeout;

    public constructor(options: QueueOptions) {
        if (options.message) {
            this.textChannel = options.message.channel as TextChannel;
            this.message = options.message;
        // } else if (options.text_channel) {
        //     this.textChannel = options.text_channel;
        } else {
            throw new Error("No text channel provided.");
        }
        this.connection = options.connection;
        this.player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
    }

    protected _push(song: Song) {
        this.songs.push(song);
    }

    protected _unshift(song: Song) {
        this.songs.unshift(song);
    }

    protected async _skip_to(index: number) {
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

        } finally {
            this.queueLock = false;
        }
    }

    protected _move(from: number, to: number) {
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

    protected _remove(index: number) {
        if (index === this._active_idx) {
            throw new AttemptToReplacePlayingSongError();
        }
        if (index < 0 || index >= this.songs.length) {
            throw new QueueIndexOutofBoundsError('na', this.songs.length);
        }
        const s = this.songs.splice(index, 1);
        return s;
    }

    public activeSong() {
        return this.songs[this._active_idx];
    }

    public get activeIndex() {
        return this._active_idx;
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

    public async generate_np_msg(): Promise<EmbedBuilder> {
        const song = this.activeSong();
        const seek = this.resource.playbackDuration / 1000;
        const left = song.duration - seek;

        let nowPlaying = new EmbedBuilder()
            .setTitle(`${song.title}`)
            .setDescription(`${song.url} \n Queue Position: ${this.activeIndex + 1} / ${this.songs.length}`)
            .setColor("#F8AA2A");

        nowPlaying.addFields([{
            name: "Added By",
            value: `<@${song.added_by}>`,
        },
        {
            name: "\u200b",
            value: (this.player.state.status === AudioPlayerStatus.Paused ? `${icon("pause")}` : `${icon("resume")}`) + " `" +
                shortformat(seek * 1000) +
                "` [" +
                    splitBar(song.duration == 0 ? seek : song.duration, seek, 10, undefined, `${icon("playhead")}`)[0] +
                "] `" +
                (song.duration == 0 ? " ◉ LIVE" : shortformat(song.duration * 1000)) + "`"
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
            const embed: EmbedBuilder = await this.generate_np_msg();
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


}