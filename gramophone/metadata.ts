import child_process from "child_process";
import { Readable } from "node:stream";
import { config } from "../utils/config.ts";
import { YtDlp } from "../utils/ytdlp.ts";
import { type SongData, SongType } from "../structs/Song.ts";
import { inspect } from "node:util";

export async function get_metadata(url: string | URL): Promise<{ ok: boolean, song?: SongMetadata | SongData }> {
    const { stream, metadata } = YtDlp.stream_url(url.toString(), "opus", { strict: true });
    const meta = await metadata;
    if (!meta.ok) {
        return { ok: false }
    }
    let data: SongData = {
        duration: meta.duration,
        kind: SongType.YtDlp,
        title: meta.title,
        url: new URL(url),
    };

    const fp = await calc_fingerprint(stream);
    if (!fp.ok) {
        return { ok: false };
    }
    const { fingerprint, duration } = fp;
    console.log("fingerprint is", fingerprint);
    const mbid = await lookup_fingerprint(fingerprint, duration);
    if (!mbid) {
        return { ok: true, song: data };
    } else {
        const song = await lookup_recording(data, mbid);
        return { ok: true, song };
    }
}

async function calc_fingerprint(stream: Readable): Promise<{ ok: false } | { ok: true, fingerprint: string, duration: number }> {
    const fp_proc = child_process.spawn("fpcalc", ["-json", "-"], {
        stdio: [stream],
    });

    return new Promise((resolve, reject) => {
        fp_proc.stdout!.on("data", m => {
            if (!(m instanceof Buffer)) { return }
            const data = m.toString("utf8");
            const json = JSON.parse(data);

            // we're done here
            stream.destroy();

            resolve({ ok: true, ...json });
        });

        fp_proc.stderr!.on("data", m => {
            if (!(m instanceof Buffer)) { return }
            const data = m.toString("utf8")
            console.error("aaaaahhh!!!:", data, stream.closed);
            resolve({ ok: false });
        });
    });
}

const lookup_url = "https://api.acoustid.org/v2/lookup"
const headers = {
    "User-Agent": "Jankbot <leah@pronounmail.com>"
}

async function lookup_fingerprint(fingerprint: string, duration: number) {
    if (!config.ACOUSTID_KEY) throw new Error("No AcoustID key in config.json");
    const params = new URLSearchParams({
        client: config.ACOUSTID_KEY,
        duration: String(Math.round(duration)),
        fingerprint,
    });
    const meta = "recordingids";

    const res = await fetch(`${lookup_url}?${params}&meta=${meta}`);
    if (!res.ok) {
        throw new Error("Fingerprint lookup failed", { cause: await res.text() });
    }

    const json = await res.json();
    console.log("acoustid lookup:", inspect(json, { depth: 6 }));
    if (json["status"] != "ok") {
        throw new Error("Fingerprint lookup failed", { cause: json });
    }
    if (json["results"].length == 0) {
        return null;
    }

    try {
        return json["results"][0]["recordings"][0]["id"] as string;
    } catch {
        return null
    }
}

const mb_root = new URL("https://musicbrainz.org/ws/2/");

interface SongMetadata extends SongData {
    mbid: string;
    title: string;
    release_date: string;

    album_mbid: string;
    album_title: string;
    artist_mbid: string;
    artist_name: string;
}

export async function lookup_recording(data: SongData, mbid: string): Promise<SongMetadata> {
    const res = await fetch(
        new URL(`recording/${mbid}?fmt=json&inc=release-groups+releases+artists`, mb_root),
        { headers }
    );

    const json = await res.json();
    const {
        id,
        title,
        releases,
        "first-release-date": release_date,
        "artist-credit": [{ name: artist_name, artist: { id: artist_mbid1 }, id: artist_mbid2 }],
    } = json;
    const artist_mbid = artist_mbid2 || artist_mbid1;

    let album_mbid, album_title;
    for (const release of releases ?? []) {
        if (release["release-group"]) {
            ({ id: album_mbid, title: album_title } = release["release-group"]);
            break;
        }
    }

    return {
        ...data,
        mbid: id,
        title,
        album_mbid,
        album_title,
        release_date,
        artist_name,
        artist_mbid,
    };
}
