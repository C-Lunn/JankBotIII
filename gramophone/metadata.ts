import child_process from "child_process";
import { Readable } from "node:stream";
import { config } from "../utils/config.ts";
import { YtDlp } from "../utils/ytdlp.ts";

export async function get_metadata(url: string) {
    const stream = YtDlp.stream_url(url);
    const { fingerprint, duration } = await calc_fingerprint(stream);
    const mbid = await lookup_fingerprint(fingerprint, duration);
    if (!mbid) {
        // todo
    } else {
        const song = await lookup_recording(mbid);
        return song;
    }
}

async function calc_fingerprint(stream: Readable) {
    const fp_proc = child_process.spawn("fpcalc", ["-json", "-"], {
        stdio: [stream],
    });

    const p = new Promise<{ fingerprint: string, duration: number }>((resolve, reject) => {
        fp_proc.stdout!.on("data", m => {
            if (!(m instanceof Buffer)) { return }
            const data = m.toString("utf8");
            const json = JSON.parse(data);

            // we're done here
            stream.destroy();

            resolve(json);
        });

        fp_proc.stderr!.on("data", m => {
            if (!(m instanceof Buffer)) { return }
            const data = m.toString("utf8")
            console.error("aaaaahhh!!!:", data, stream.closed);
            reject(data);
        });
    });

    return p;
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
    if (json["status"] != "ok" || json["results"].length == 0) {
        throw new Error("Fingerprint lookup failed", { cause: json });
    }

    try {
        return json["results"][0]["recordings"][0]["id"] as string;
    } catch {
        return null
    }
}

const mb_root = new URL("https://musicbrainz.org/ws/2/");

interface SongMetadata {
    mbid: string;
    title: string;
    release_date: string;

    album_mbid: string;
    album_title: string;
    artist_mbid: string;
    artist_name: string;
}

export async function lookup_recording(mbid: string): Promise<SongMetadata> {
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
        mbid: id,
        title,
        album_mbid,
        album_title,
        release_date,
        artist_name,
        artist_mbid,
    };
}
