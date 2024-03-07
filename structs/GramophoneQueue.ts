import { VoiceConnectionState, VoiceConnectionStatus, VoiceConnectionDisconnectReason, entersState, AudioPlayerState, AudioPlayerStatus } from "@discordjs/voice";
import { JCIMessage } from "../interfaces/JCIMessage";
import { QueueOptions } from "../interfaces/QueueOptions";
import { NoMoreSongsInQueueError, Queue, wait } from "./Queue";
import { ChannelType } from "discord.js";


export class GramophoneQueue extends Queue {
    private _notify: (msg: JCIMessage) => Promise<void>;
    constructor(options: QueueOptions, notify: (msg: JCIMessage) => Promise<void>) {
        super(options);
        this._notify = notify;
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
                    if (channel?.type === ChannelType.GuildStageVoice) {
                        this.textChannel.guild.members.me?.voice.setSuppressed(false);
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
                        // if (!this._play_single) await this.playNext();
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
                // this.playNext();
            } else {
                this.stop();
            }
        });
    }

    public stop() {
        this.player.stop();
        this.connection.destroy();
        // this._state = QueueState.Stopped;
        this._active_idx = 0;
        this.songs = [];
        this.textChannel.send({ content: "Queue stopped." });
    }
}