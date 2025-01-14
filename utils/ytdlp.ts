import { spawn } from "node:child_process";
import { config } from "./config";

export class YtDlp {
    static stream_url(url: string, format = "opus") {
        console.log(`streaming ${url} with yt-dlp`)
        const args = [
            url,
            "--extract-audio",
            "--no-playlist",
            "--audio-format", format, // output opus
            "-o", "-" // output to stdout
        ];
        if (config.COOKIES_DOT_TXT) args.push("--cookies", config.COOKIES_DOT_TXT);

        const cmd = spawn("yt-dlp", args);

        cmd.stderr.on("data", (error) => {
            // in stdout mode yt-dlp likes to use stderr for things that
            // AREN'T ERRORS. hence the lack of ceremony here.
            console.log(`yt-dlp: ${error}`);

            // if (String(error).startsWith("ERROR:")) {
            //     throw new Error("YtDlp Error", { cause: error })
            // }
        });

        cmd.on("close", (code) => {
            console.log(`yt-dlp exited with code ${code}`)
        });

        return cmd.stdout;
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
