const orderWords = ["zero", "first", "second", "third", "fourth"];

export const matchOrder = (s: string) => {
    const words = s
        .split("\n")[0]
        .split(" ")
        .map((s) => s.toLowerCase());

    let foundOrder;

    words.forEach((word) => {
        word = word.toLowerCase();
        const order = orderWords.find((orderWord) => word.includes(orderWord));
        if (order) foundOrder = orderWords.indexOf(order);
    });

    return foundOrder;
};

export const extractTrack = (s: string) => {
    let artist, track: string;

    // track - artist format
    ({ artist, track } = /(?<artist>.+?) - (?<track>.+)/.exec(s)?.groups ?? {});

    if (artist && track) return [artist, track].map((s) => s.trim());

    // artist: and track: labels
    ({ artist, track } = /artist: (?<artist>.+?)\s*(?:track|song): (?<track>\w+)/is.exec(s)?.groups ?? {});

    if (artist && track) {
        return [artist, track];
    }

    ({ artist, track } = /(?:track|song): (?<artist>.+?)\s*artist: (?<track>\w+)/s.exec(s)?.groups ?? {});

    if (artist && track) {
    } else {
        const [artist, track] = s.split("-").map((s) => s.trim());
        if (artist && track) return [artist, track];
    }

    return [];
};

const urlRe = new RegExp(/(?<pre>.*)(?<url>http(?:s?):\/\/[^\s]+)(?<rest>.*)/s);

export const extractUrl = (s: string) => {
    const { pre, url, rest } = urlRe.exec(s)?.groups ?? {};
    if (url) return [url, pre + rest];
    return [undefined, s] as [string | undefined, string];
};

type Submission = {
    submitter: string;
    track: string;
    artist: string;
    order: number;
    url: string;
};

export const parseSubmission = async (msg: string) => {
    let out: Partial<Submission> = {};

    let first, artist, track, order, url, rest: string;

    order = matchOrder(msg) || 1; // we assume "first" or "second" markers to be on line 1
    out = { ...out, order };

    [url, rest] = extractUrl(msg);
    if (url) out = { ...out, url };

    [artist, track, rest] = extractTrack(rest);

    if (artist && track) {
        out = { ...out, artist, track };
    }
    return out;
};
