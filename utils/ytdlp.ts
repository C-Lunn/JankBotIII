import { spawn } from "node:child_process";

export class YtDlp {
    static stream_url(url: string) {
        console.log(`streaming ${url} with yt-dlp`)
        const cmd = spawn("yt-dlp", [
            url,
            "--extract-audio",
            "--audio-format", "opus", // output opus
            "-o", "-" // output to stdout
        ]);

        cmd.stderr.on("data", (error) => {
            // in stdout mode yt-dlp likes to use stderr for things that
            // AREN'T ERRORS. hence the lack of ceremony here.
            console.log(`yt-dlp: ${error}`);
        });

        cmd.on("close", (code) => {
            console.log(`yt-dlp exited with code ${code}`)
        });

        return cmd.stdout;
    }
}
