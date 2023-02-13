import { parse } from "path";
import { extractTrack, extractUrl, matchOrder, parseSubmission } from "../../utils/gramophone";

describe("matchOrder", () => {
    it("parses the word 'first' to 1", async () => {
        expect(matchOrder("first: blabla")).toEqual(1);
    });

    it("parses the word 'third' to 3", async () => {
        expect(matchOrder("maybe third if there's time:")).toEqual(3);
    });
});

describe("extractTrackA", () => {
    it("parses 'artist - track'", async () => {
        expect(extractTrack("Foo Fighters - Everlong")).toEqual(["Foo Fighters", "Everlong"]);
    });
});

describe("extractUrl", () => {
    it("extracts only a URL string", async () => {
        expect(extractUrl("https://url.com")).toEqual(["https://url.com", ""]);
    });

    it("extracts a URL with pre", async () => {
        expect(extractUrl("url: https://url.com")).toEqual(["https://url.com", "url: "]);
    });

    it("extracts a URL with pre and rest", async () => {
        expect(extractUrl("url: https://url.com some stuff")).toEqual(["https://url.com", "url:  some stuff"]);
    });
});

describe("parseSubmission", () => {
    it("extracts track order", async () => {
        const rslt = await parseSubmission("first:");
        expect(rslt).toEqual({ order: 1 });
    });

    it("extracts track order and URL", async () => {
        const rslt = await parseSubmission("first: https://url.com");
        expect(rslt).toEqual({ order: 1, url: "https://url.com" });
    });

    it("extracts track order, URL and artist - track", async () => {
        const rslt = await parseSubmission(
            `first:
          Foo Fighters - Everlong
          https://url.com`
        );
        expect(rslt).toEqual({
            order: 1,
            artist: "Foo Fighters",
            track: "Everlong",
            url: "https://url.com"
        });
    });
    it("extracts track order, URL and artist: track/song:", async () => {
        const rslt = await parseSubmission(
            `first:
            artist: Foo Fighters
          track: Everlong
          https://url.com`
        );
        expect(rslt).toEqual({
            order: 1,
            artist: "Foo Fighters",
            track: "Everlong",
            url: "https://url.com"
        });
    });
});

describe("real-life tests", () => {
    it("parses guywithdog", async () => {
        const raw = `first (disguise title for fun surprise!): https://pcmusic.bandcamp.com/track/himera-petal-supply-gupi-all-i-want-for-christmas-is-you
      himera, gupi, petal supply - all i want for christmas is you`;
        expect(await parseSubmission(raw)).toEqual({
            order: 1,
            artist: "himera, gupi, petal supply",
            track: "all i want for christmas is you",
            url: "https://pcmusic.bandcamp.com/track/himera-petal-supply-gupi-all-i-want-for-christmas-is-you"
        });
    });

    it("parses habiboy", async () => {
        const raw = `Blays - All I Want For Christmas Is You (remix) https://soundcloud.com/realblays/all-i-want-for-christmas-is-you-wii-shop-remix-full-version?si=72a0782b85ce4226a1950249ccfb15db&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing
    SoundCloud
    Blays
    All I Want For Christmas Is You (Wii Shop Remix | Full version)
   
    `;

        expect(await parseSubmission(raw)).toEqual({
            order: 1,
            artist: "Blays",
            track: "All I Want For Christmas Is You (remix)",
            url: "https://soundcloud.com/realblays/all-i-want-for-christmas-is-you-wii-shop-remix-full-version?si=72a0782b85ce4226a1950249ccfb15db&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing"
        });
    });

    it("parses Joe", async () => {
        const raw = `I’ll be absent anyway, so this one’s for the playlist:
      trentemøller - While the Cold Winter Waiting
      https://youtu.be/EvyI5VkwCvY 
      `;

        expect(await parseSubmission(raw)).toEqual({
            order: 1,
            artist: "trentemøller",
            track: "While the Cold Winter Waiting",
            url: "https://youtu.be/EvyI5VkwCvY"
        });
    });

    it("parses Moly 1", async () => {
        const raw = `First:
      Artist: Gabe Churray (Performing Vince Guaraldi)
      Track: Skating
      Link: https://www.youtube.com/watch?v=tdS6SXGCzQA 
      YouTube
      Gabe Churray
      "Skating" from A Charlie Brown Christmas as Performed on the Moog M...
      Image
      `;

        expect(await parseSubmission(raw)).toEqual({
            order: 1,
            artist: "Gabe Churray (Performing Vince Guaraldi)",
            track: "Skating",
            url: "https://www.youtube.com/watch?v=tdS6SXGCzQA"
        });
    });
    it("parses Moly 2", async () => {
        const raw = `Second:
        Artist: Pilotredsun
        Track: sadpad
        Link: https://www.youtube.com/watch?v=cG_HOuJIXRk
        YouTube
        Lonesome James
        Pilotredsun- Sadpad
        Image
        `;

        expect(await parseSubmission(raw)).toEqual({
            order: 2,
            artist: "Pilotredsun",
            track: "sadpad",
            url: "https://www.youtube.com/watch?v=cG_HOuJIXRk"
        });
    });
});
