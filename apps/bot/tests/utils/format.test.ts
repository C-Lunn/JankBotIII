import { shortformat } from "../../utils/format";

describe("shortformat", () => {
    it("formats 0 as 00:00", async () => {
        const out = shortformat(0);
        expect(out).toEqual("00:00");
    });

    it("formats -7 seconds as -00:07", async () => {
        const out = shortformat(-7 * 1000);
        expect(out).toEqual("-00:07");
    });

    it("formats 7 seconds as 00:07", async () => {
        const out = shortformat(7 * 1000);
        expect(out).toEqual("00:07");
    });

    it("formats 12:34:56", async () => {
        const out = shortformat((12 * 3600 + 34 * 60 + 56) * 1000);
        expect(out).toEqual("12:34:56");
    });
});
