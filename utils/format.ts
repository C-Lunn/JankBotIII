export const pad = (ts: number, zpad: number = 2) => {
    let out = ts.toString();
    while (out.length < zpad) {
        out = "0" + out;
    }
    return out.substring(0, zpad > 0 ? Math.max(zpad, out.length) : out.length);
};

const HOUR_THRES = 1000 * 60 * 60;
const MINUTE_THRES = 1000 * 60;

type TimeObject = {
    sign: string;
    h: number | string;
    m: number | string;
    s: number | string;
    ms: number | string;
};

export class TS {
    ts: number;
    sign: string;
    h: number;
    m: number;
    s: number;
    ms: number;

    constructor(milliseconds: number | Partial<TimeObject>) {
        if (typeof milliseconds === "number") {
            this.ts = milliseconds;

            let remainder: number = Math.abs(milliseconds);
            this.sign = milliseconds >= 0 ? "" : "-";

            this.h = Math.floor(remainder / HOUR_THRES);
            remainder -= this.h * HOUR_THRES;
            this.m = Math.floor(remainder / MINUTE_THRES);
            remainder -= this.m * MINUTE_THRES;
            this.s = Math.floor(remainder / 1000);
            remainder -= this.s * 1000;
            this.ms = remainder;
        } else {
            this.sign = milliseconds.sign || "";
            this.h = Number(milliseconds.h);
            this.m = Number(milliseconds.m);
            this.s = Number(milliseconds.s);
            this.ms = Number(milliseconds.ms);
        }
    }

    get shortformat() {
        if (this.ts === Number.NEGATIVE_INFINITY) {
            return "";
        }

        let out = "";
        out = `${pad(this.s)}`;
        if (Math.abs(this.ts) >= MINUTE_THRES) out = `${pad(this.m)}:${out}`;
        if (Math.abs(this.ts) >= HOUR_THRES) out = `${pad(this.h)}:${out}`;
        out = `${this.sign}${out}`;

        return out;
    }
}

export const shortformat = (milliseconds: number) => new TS(milliseconds).shortformat;
