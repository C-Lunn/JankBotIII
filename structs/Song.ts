import { AudioResource, createAudioResource, StreamType } from "@discordjs/voice";
import * as fs from 'fs';
import { parseFile } from "music-metadata";
import internal from "stream";
import youtube from "youtube-sr";
import { getInfo } from "ytdl-core";
import { i18n } from "../utils/i18n";
import { videoPattern } from "../utils/patterns";
import { YtDlp } from "../utils/ytdlp";

export interface SongData {
    url: string;
    title: string;
    duration: number;
}

export class NotAMusicError extends Error {
    constructor() {
        super("Not a music file.");
    }
}

export class Song {
    public readonly url: string;
    public readonly title: string;
    public duration: number;
    public added_by: string;

    public constructor({ url, title, duration }: SongData, added_by: string) {
        this.url = url;
        this.title = title;
        this.duration = duration;
        this.added_by = added_by;
    }

    public static async from(url: string = "", search: string = "", added_by: string = ""): Promise<Song> {
        let url_parsed: URL | null;
        try {
            url_parsed = new URL(url);
        } catch {
            url_parsed = null;
        }
        const isYoutubeUrl = videoPattern.test(url);
        const isDiscordCdnUrl = url_parsed?.host == "cdn.discordapp.com";
        const isFileUrl = (url_parsed?.protocol == "file:" ?? url.startsWith("file://"));
        const isAudio = (
            url_parsed?.pathname.endsWith(".mp3") ||
            url_parsed?.pathname.endsWith(".ogg") ||
            url_parsed?.pathname.endsWith(".wav") ||
            url_parsed?.pathname.endsWith(".flac") ||
            url_parsed?.pathname.endsWith(".opus")
        );

        let songInfo;

        if (isYoutubeUrl) {
            songInfo = await getInfo(url);

            return new this({
                url: songInfo.videoDetails.video_url,
                title: songInfo.videoDetails.title,
                duration: parseInt(songInfo.videoDetails.lengthSeconds)
            }, added_by);
        } else if (isDiscordCdnUrl) {
            const lcurl = url.toLowerCase();
            if (isAudio) {
                let dur = 0;
                if (url_parsed?.pathname.endsWith(".mp3")) {
                    // dur = await createEstimator(new FetchDataReader(fetch))(lcurl);
                    // console.log("mp3 duration: " + dur + "s");
                    dur = NaN;
                } else if (url_parsed?.pathname.endsWith(".wav")) {
                    dur = await this.getWAVLength(lcurl);
                } else if (url_parsed?.pathname.endsWith(".flac")) {
                    dur = await this.getFLACLength(lcurl);
                }
                return new this({
                    url: url,
                    title: url.split("/").pop()!.split(".").slice(0, -1).join(".") || "Unknown",
                    duration: dur
                }, added_by);
            } else {
                throw new NotAMusicError();
            }
        } else if (isFileUrl || isAudio) {
            let meta
            if (url_parsed?.protocol == "file:") {
                meta = await parseFile(url.replace("file://", ""));
            }

            return new this({
                url: url,
                title: url.split("/").pop()!.split(".").slice(0, -1).join(".") || "Unknown",
                duration: meta?.format.duration ?? 0,
            }, added_by);
        }
        else {
            const result = await youtube.searchOne(search);

            songInfo = await getInfo(`https://youtube.com/watch?v=${result.id}`);

            return new this({
                url: songInfo.videoDetails.video_url,
                title: songInfo.videoDetails.title,
                duration: parseInt(songInfo.videoDetails.lengthSeconds)
            }, added_by);
        }
    }

    public static async getWAVLength(url: string) {
        const rsp = (await fetch(url)).body!.getReader();
        const chunks = [];
        let length = 0;
        while (length < 44) {
            const { value, done } = await rsp.read();
            if (done) break;
            chunks.push(value);
            length += value.length;
        }
        const header = new Uint8Array(length);
        let offset = 0;
        for (const chunk of chunks) {
            header.set(chunk, offset);
            offset += chunk.length;
        }
        const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
        const byte_rate = view.getUint32(28, true);
        const payload_size = view.getUint32(40, true);
        return payload_size / byte_rate;
    }

    public static async getFLACLength(url: string) {
        const rsp = (await fetch(url)).body!.getReader();
        const chunks = [];
        let length = 0;
        while (length < 26) {
            const { value, done } = await rsp.read();
            if (done) break;
            chunks.push(value);
            length += value.length;
        }
        const start = new Uint8Array(length);
        let offset = 0;
        for (const chunk of chunks) {
            start.set(chunk, offset);
            offset += chunk.length;
        }
        const view = new DataView(start.buffer, start.byteOffset, start.byteLength);
        const sample_rate = view.getUint32(18, false) >> 12;
        const total_samples = (view.getUint32(18) & 0b1111) << 32 | view.getUint32(22);
        return total_samples / sample_rate;
    }

    public async makeResource(): Promise<AudioResource<Song> | void> {
        let stream;

        let type = this.url.includes("youtube.com") ? StreamType.WebmOpus : StreamType.Arbitrary;

        if (this.url.includes("youtube") || this.url.includes("youtu.be")) {
            stream = YtDlp.stream_url(this.url);
        } else if (this.url.startsWith("file://")) {
            const url = this.url.replace("file://", "");
            stream = fs.createReadStream(url);
        } else {
            const rs = (await fetch(this.url)).body;
            if (rs) {
                stream = rs as unknown as internal.Readable;
            }
        }

        if (!stream) return;

        return createAudioResource(stream, { metadata: this, inputType: type, inlineVolume: true });
    }

    public startMessage() {
        return i18n.__mf("play.startedPlaying", { title: this.title, url: this.url });
    }
}
