import { spawn } from "node:child_process";
import { config } from "./config.ts";
import Stream from "node:stream";

export class YtDlp {

    static stream_url(url: string, format = "opus", opt?: { strict?: boolean })
        : { stream: Stream.Readable, metadata: Promise<{ title: string, duration: number }> } {
        console.log(`streaming ${url} with yt-dlp`)
        const args = [
            url,
            "--extract-audio",
            "--no-playlist",
            "-O", `%(.{title,duration})j`,
            "--no-simulate",
            "--audio-format", format, // output opus
            "-o", "-", // output to stdout
        ];
        if (config.COOKIES_DOT_TXT) args.push("--cookies", config.COOKIES_DOT_TXT);

        const cmd = spawn("yt-dlp", args);

        const meta_promise = new Promise<{ title: string, duration: number }>((resolve) => {
            cmd.stderr.on("data", (error) => {
                // yt-dlp outputs the json we need to stderr because we're busy using stdin.
                const text: string = error.toString("utf8");
                try {
                    const json = JSON.parse(text);
                    resolve(json)
                } catch {
                    if (text.includes("ERROR:") && !text.includes("Broken") && opt?.strict) {
                        throw new Error("Yt-Dlp Error", {
                            cause: text,
                        });
                    }
                    console.log(`yt-dlp: ${error}`);
                }

                // if (String(error).startsWith("ERROR:")) {
                //     throw new Error("YtDlp Error", { cause: error })
                // }
            });
        });

        cmd.on("close", (code) => {
            console.log(`yt-dlp exited with code ${code}`)
        });

        return { stream: cmd.stdout, metadata: meta_promise };
    }

    static async fetch_thing_details(url: string): Promise<Record<string, unknown>> {
        console.log(`asking yt-dlp for details about ${url}`)

        const p = new Promise((resolve, reject) => {
            const cmd = spawn("yt-dlp", [
                url,
                "--skip-download",
                // only return title and duration
                "-O", `%(.{title,duration})j`,
                "-q",
                "--no-playlist",
                "--no-warnings",
            ]);

            cmd.stdout.on("data", (data: Buffer) => {
                const text = data.toString("utf8");
                const json = JSON.parse(text);
                resolve(json);
            });

            cmd.stderr.on("data", (data: Buffer) => {
                const text = data.toString("utf8");
                reject(`ytdlp err: ${text}`);
            });

            cmd.on("close", (code) => {
                console.log(`yt-dlp exited with code ${code}`)
            });
        });

        return p as Promise<Record<string, unknown>>;
    }
}
