import "dotenv/config";
import { Config } from "../interfaces/Config";

let config: Config;

try {
    config = require("../config.json");
} catch (error) {
    config = {
        TOKEN: process.env.TOKEN || "",
        PREFIX: process.env.PREFIX || "!",
        MAX_PLAYLIST_SIZE: parseInt(process.env.MAX_PLAYLIST_SIZE!) || 10,
        PRUNING: process.env.PRUNING === "true" ? true : false,
        STAY_TIME: parseInt(process.env.STAY_TIME!) || 30,
        DEFAULT_VOLUME: parseInt(process.env.DEFAULT_VOLUME!) || 100,
        LOCALE: process.env.LOCALE || "en",
        MOD_ROLE_ID: process.env.MOD_ROLE_ID ?? "",
        MQ_KEY: process.env.MQ_KEY,
        PORT: process.env.PORT,
        ACOUSTID_KEY: process.env.ACOUSTID_KEY,
        WEBROOT: process.env.WEBROOT,
        COOKIES_DOT_TXT: process.env.COOKIES_DOT_TXT,
    };
}

export { config };
