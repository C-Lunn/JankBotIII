import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioResource, StreamType } from "@discordjs/voice";
import pfs from "fs/promises";
import fs from "fs";
import path from "path";

class Bumper {
    constructor(public path: string) {
        console.log(path);
    };

    into_resource(): AudioResource {
        const stream = fs.createReadStream(this.path);
        return createAudioResource(stream, {
            metadata: { bumper: this.path },
            inputType: StreamType.Arbitrary,
        });
    }
}

export default class BumperQueue {
    constructor(public player: AudioPlayer) { 
        this.queue = BumperQueue.new_queue();
        console.log("bumper queue: ", this.queue);
    };

    queue: Bumper[];
    next_bumper = BumperQueue.calc_next_bumper();

    static new_queue(): Bumper[] {
        // schwartzian transform (so O(n log n)) because i cba to do fisher-yates.
        // if we ever get one william bumpers feel free to swap this out
        return bumpers.map(value => ({ value, sort: Math.random() }))
            .toSorted((a, b) => a.sort - b.sort)
            .map(({ value }) => value)
    }

    static calc_next_bumper() {
        return new Date(Date.now() + 600_000) // 10 minutes
    }

    async play(): Promise<void> {
        if (this.next_bumper > new Date(Date.now())) {
            return
        }
        const bumper = this.queue.pop();
        if (!bumper) {
            this.queue = BumperQueue.new_queue();
            console.log("new bumper queue:", this.queue);
            return this.play(); // this could theoretically loop forever if bumpers is empty. 
            // i'm just going to assume that won't ever happen.
        }
        console.log("playing bumper: ", bumper);
        let resolve: (value: void | PromiseLike<void>) => void;
        const p = new Promise<void>(r => { resolve = r });

        const cb = (oldstate: { status: AudioPlayerStatus; }, newstate: { status: AudioPlayerStatus; }) => {
            if (newstate.status == AudioPlayerStatus.Idle) {
                this.next_bumper = BumperQueue.calc_next_bumper();
                console.log("next bumper at:", this.next_bumper)
                resolve()
            }
        }
        this.player.play(bumper.into_resource());

        this.player.on("stateChange", cb);
        return p.then(() => { this.player.off("stateChange", cb) })
    }
}

const bumper_base = "bumpers/";

// the less readable your code is the more functional it is
export const bumpers = await pfs.readdir(bumper_base, { withFileTypes: true, })
    .then(x => x.reduce((acc, y) => y.isFile()
        ? [...acc, new Bumper(path.join(y.parentPath, y.name))]
        : acc, <Bumper[]>[]
    ));
