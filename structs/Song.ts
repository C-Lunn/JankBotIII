import { AudioResource, createAudioResource, StreamType } from "@discordjs/voice";
import * as fs from 'fs';
import pfs from "fs/promises";
import internal from "stream";
import * as web_streams from "stream/web";
import youtube from "youtube-sr";
import ytdlCore from "ytdl-core";
import { i18n } from "../utils/i18n";
import { YtDlp } from "../utils/ytdlp";

export interface SongData {
    url: URL;
    title: string;
    duration: number;
    kind: SongType;
}

export class NotAMusicError extends Error {
    constructor() {
        super("Not a music file.");
    }
}

const youtube_hosts = [
    "youtube.com",
    "www.youtube.com",
    "yt.be",
    "www.yt.be",
    "music.youtube.com",
]

const allowed_hosts = [
    ...youtube_hosts,
    "soundcloud.com",
    "www.soundcloud.com",
]

export enum SongType {
    YtDlp,
    ExternalAudio,
    File,
}

type PossibleStreamTypes = ReadableStream<Uint8Array> | web_streams.ReadableStream<any>;

export class Song {
    public readonly url: URL;
    public readonly title: string;
    public duration: number;
    public added_by: string;
    public kind: SongType;

    public constructor({ url, title, kind, duration }: SongData, added_by: string) {
        this.url = url;
        this.title = title;
        this.kind = kind;
        this.duration = duration;
        this.added_by = added_by;
    }

    public static async from(url: string = "", search: string = "", added_by: string = ""): Promise<Song> {
        let url_parsed: URL | null;
        try {
            url_parsed = new URL(url);
        } catch {
            url_parsed = null
        }

        if (!url_parsed) {
            const result = await youtube.searchOne(search);
            url_parsed = new URL(`https://youtube.com/watch?v=${result.id}`);
        }

        let songInfo = await Song.fetch_songinfo(url_parsed);

        if (songInfo) {
            return new this(songInfo, added_by);
        } else {
            return new this(
                { duration: NaN, title: "Unknown", url: url_parsed, kind: SongType.YtDlp },
                added_by
            );
        }
    }

    private static async fetch_songinfo(url: URL): Promise<SongData | undefined> {
        if (youtube_hosts.includes(url.hostname)) {
            const info = await ytdlCore.getInfo(url.toString());
            return {
                url,
                kind: SongType.YtDlp,
                title: info.videoDetails.title,
                duration: parseInt(info.videoDetails.lengthSeconds),
            };
        }

        // TODO: soundcloud, etc (try fetching details from yt-dlp)

        let file_handle: pfs.FileHandle | null = null,
            stream: PossibleStreamTypes,
            songtype: SongType;

        if (!this.its_audio(url)) {
            return
        }

        if (url.protocol == "file:") {
            file_handle = await pfs.open(url.pathname);
            songtype = SongType.File;
            stream = file_handle.readableWebStream();
        } else {
            songtype = SongType.ExternalAudio;
            stream = (await fetch(url)).body!;
        }

        let duration = 0;
        if (url.pathname.endsWith(".mp3")) {
            // dur = await createEstimator(new FetchDataReader(fetch))(lcurl);
            // console.log("mp3 duration: " + dur + "s");
            duration = NaN;
        } else if (url.pathname.endsWith(".wav")) {
            duration = await this.getWAVLength(stream);
        } else if (url.pathname.endsWith(".flac")) {
            duration = await this.getFLACLength(stream);
        }

        if (file_handle) {
            file_handle.close();
        }

        return {
            url: url,
            kind: songtype,
            title: url.pathname.split("/").at(-1) || "Unknown",
            duration: duration
        };
    }

    public static its_audio(url: URL) {
        return url.pathname.endsWith(".mp3") 
        || url.pathname.endsWith(".wav") 
        || url.pathname.endsWith(".wave")
        || url.pathname.endsWith(".flac")
        || url.pathname.endsWith(".opus")
        || url.pathname.endsWith(".ogg")
    }

    public static async getWAVLength(from: PossibleStreamTypes) {
        const rsp = from.getReader();
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

    public static async getFLACLength(from: PossibleStreamTypes) {
        const rsp = from.getReader();
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
        let type = this.kind == SongType.YtDlp ? StreamType.WebmOpus : StreamType.Arbitrary;

        let stream = await (async () => {
            switch (this.kind) {
                case SongType.YtDlp: return YtDlp.stream_url(this.url.toString());
                case SongType.File: return fs.createReadStream(this.url.pathname);
                case SongType.ExternalAudio: {
                    const rs = (await fetch(this.url)).body;
                    if (rs) {
                        return rs as unknown as internal.Readable;
                    }
                }
            }
        })();

        if (!stream) return;

        return createAudioResource(stream, { metadata: this, inputType: type, inlineVolume: true });
    }

    public startMessage() {
        return i18n.__mf("play.startedPlaying", { title: this.title, url: this.url });
    }
}
