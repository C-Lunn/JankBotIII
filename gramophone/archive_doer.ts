import { MessagePort, parentPort } from "node:worker_threads";
import db from "../utils/db.ts";
import type { ParsedThread } from "../utils/thread_scraper.ts";
import { ArchiveReport, normalise_url } from "./archives.ts";
import { get_metadata } from "./metadata.ts";

if (parentPort) {
    parentPort.on("message", m => {
        if (typeof m == "object" && parentPort) {
            do_the_thing(m, parentPort)
        }
    });
}

const exists_stmt = db.prepare(`
    SELECT id FROM song WHERE url = ?
`).pluck();
const insert_song_stmt = db.prepare(`
    INSERT INTO song (id, url, mbid, title, release_date, album_mbid, 
        album_title, cover_id, artist_mbid, artist_name) 
    VALUES (:id, :url, :mbid, :title, :release_date, :album_mbid, 
        :album_title, :cover_id, :artist_mbid, :artist_name)
    ON CONFLICT(mbid) DO UPDATE SET URL = :url WHERE mbid = :mbid
    ON CONFLICT DO NOTHING 
`);
const insert_submission_stmt = db.prepare(`
    INSERT INTO submission (id, song_id, author_id, message, profile, thread_id, round) 
    VALUES (:id, :song_id, :author_id, :message, jsonb(:profile), :thread_id, :round)
    ON CONFLICT DO NOTHING
`);

async function do_the_thing(data: ParsedThread, parentPort: MessagePort) {
    let thread_id = data.id;
    delete data.id;

    let report: ArchiveReport = [];

    let round = 0;
    for (const [, messages] of Object.entries(data)) {
        round++;
        if (typeof messages == "string") return;

        for (const [author, data] of Object.entries(messages)) {
            const url = normalise_url(data.url).toString();

            try {
                let song_id = exists_stmt.get(url) as string | undefined;
                const submission_id = data.message.id;

                if (!song_id) {
                    song_id = crypto.randomUUID();
                    // we *could* just not await here and then use a Promise.allSettled 
                    // to get the results but then we'd get rate limited to high hell 
                    // and i don't feel like implementing a queue system right now. 
                    // this is the lord's rate limit protection.
                    //
                    // you could also have these each be a different thread but to be
                    // honest all it does is spawn a bunch of external procs and then
                    // does some fetch requests so i don't think it'd do much good.
                    const song = await get_metadata(url);
                    if (!song) {
                        throw new Error("Failed to get metadata :(")
                    }

                    insert_song_stmt.run({
                        id: song_id,
                        url,
                        ...song,
                        cover_id: null,
                    });

                    report.push({ status: "success", url, author, submission_id })
                } else {
                    report.push({ status: "reused", url, author, submission_id })
                }

                insert_submission_stmt.run({
                    id: submission_id,
                    song_id,
                    author_id: data.message.author.id,
                    message: data.message.content,
                    profile: JSON.stringify({
                        avatar: data.message.author.avatarURL,
                        display_name: data.message.author.displayName,
                    }),
                    thread_id,
                    round,
                });
            } catch (e) {
                console.error(`error on ${url}:`, e)
                report.push({ status: "failure", url, author, because: e as Error })
            }
        }
    }
    console.log("hi i'm a grub and i live in the soil");
    parentPort.postMessage(report);
}

