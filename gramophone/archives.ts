import path from "node:path";
import { Worker } from "node:worker_threads"
import { Bot } from "../structs/Bot";
import { better_scrape_thread } from "../utils/thread_scraper";
import { Message } from "discord.js";
import { JbMessage } from "../interfaces/JankbotCommand";
import { lookup_recording } from "./metadata";
import db from "../utils/db";

export type ArchiveReport = {
    status: "success" | "failure" | "reused",
    url: string,
    author: string,
    submission_id?: string,
    because?: Error,
}[];

const new_thread_stmt = db.prepare(`
    INSERT INTO thread (id, title, number)
    VALUES (:id, :title, :number)
    ON CONFLICT DO UPDATE SET title = :title, number = :number
        WHERE id = :id
`)

export async function start_archiving({
    title, request, thread_id, overwrite, number
}: {
    title: string,
    number: number,
    request: JbMessage,
    thread_id: string,
    overwrite?: boolean, /* todo: do something with this lol */
}): Promise<ArchiveReport> {
    new_thread_stmt.run({ title, number, id: thread_id });

    const data = await better_scrape_thread(request.client, thread_id);

    const p = new Promise<ArchiveReport>((resolve, reject) => {
        const worker = new Worker(path.resolve(__dirname, './archive_doer.ts'));

        worker.on("online", () => {
            worker.postMessage(data);
        })
        worker.on("message", (m: ArchiveReport) => {
            console.log(overwrite);
            resolve(m);
        })
    });

    return p;
}

export async function reload_song(id: string, new_mbid?: string) {
    let old_mbid = db.prepare("SELECT mbid FROM song WHERE id = ?").get(id) as string | undefined;

    if (!old_mbid && !new_mbid) {
        throw new Error("Nothing to reload (specify a new_mbid, maybe)")
    }

    const mbid = new_mbid ?? old_mbid;
    const meta = await lookup_recording(mbid!);

    db.prepare(`
        UPDATE song
        SET mbid = :mbid, title = :title, release_date = :release_date, 
            album_mbid = :album_mbid, album_title = :album_title, 
            cover_id = :cover_id, artist_mbid = :artist_mbid, 
            artist_name = :artist_name
        WHERE id = ?
    `).run({ ...meta, cover_id: null }, id);

    return meta;
}

export function normalise_url(url: string | URL): URL {
    url = new URL(url);
    if (url.hostname == "youtube.com" || url.hostname == "www.youtube.com") {
        const video_id = url.searchParams.get("v");
        if (!video_id) {
            throw new Error("Invalid YouTube URL")
        }
        url.search = ""
        url.searchParams.set("v", video_id);
    }
    return url;
}