import axios from "axios";
import { find } from "geo-tz";
import { join } from "path";
import sharp from "sharp";
import type { Config } from "../../../interfaces/Config.ts";
import JankbotCmd, { type JbMessage } from "../../../interfaces/JankbotCommand.ts";
import { Bot } from "../../../structs/Bot.ts";

async function getGeoCodefromPlace(place_in: string) {
    let config: Config | undefined;
    
    try {
        config = require("../config.json");
    } catch (error) {
        config = undefined;
        console.error(error);
    }

    let mqkey;

    if (!config?.MQ_KEY) {
        mqkey = 'f6hwzfGYFCBVGlagKMC7EI61OtxD6xGl';
    } else {
        mqkey = config.MQ_KEY;
    }

    const resp = await axios.get(
        `https://www.mapquestapi.com/geocoding/v1/address?key=${encodeURIComponent(
            mqkey
        )}&location=${encodeURIComponent(place_in)}`
    );

    if (
        resp.data.results[0].locations[0].latLng.lat == 38.89037 &&
        resp.data.results[0].locations[0].latLng.lng == -77.03196
    )
        return null;
    else {
        return [
            resp.data.results[0].locations[0].latLng.lat,
            resp.data.results[0].locations[0].latLng.lng,
            resp.data.results[0].locations[0].adminArea5
        ];
    }
}

function getTimeZonefromLatLong(lat: number, long: number) {
    return find(lat, long)[0];
}

function extractPlaceNameFromMsg(msg_in: string) {
    const msg_split = msg_in.split(" ");
    const in_loc = msg_split.indexOf("in");
    const time_loc = msg_split.indexOf("time");
    let out_loc = -1;
    //strip punctuation except ,
    const chars_to_strip = [".", "?", "!", "|"];
    for (const word of msg_split) {
        for (const ch of chars_to_strip) msg_split[msg_split.indexOf(word)] = word.replaceAll(ch, "");
    }
    const terminators = ["and", "where"];
    for (const t of terminators)
        if (msg_split.indexOf(t) != -1) {
            out_loc = msg_split.indexOf(t);
            break;
        }
    if (in_loc != -1 && out_loc != -1) {
        return msg_split.slice(in_loc + 1, out_loc).join(" ");
    } else if (in_loc == -1 && out_loc != -1) {
        return msg_split.slice(time_loc + 1, out_loc).join(" ");
    } else if (in_loc != -1 && out_loc == -1) {
        return msg_split.slice(in_loc + 1).join(" ");
    } else {
        return msg_split.slice(time_loc + 1).join(" ");
    }
}

async function getClock(hour: number, minute: number, is_angry = false): Promise<Buffer> {
    const images_folder = join(import.meta.dirname, "..", "..", "..", "resource", "images");
    const hr_rotation = hour * 30 + minute * 0.5;
    const min_rotation = minute * 6;
    let images = [
        join(images_folder, "face.png"),
        join(images_folder, "gimp.png"),
        join(images_folder, "tant.png"),
        join(images_folder, "shipclocc.jpg")
    ];
    let face = sharp(images[Math.floor(Math.random() * images.length)]);
    let hr_hand = is_angry ? sharp(join(images_folder, "gunarm.png")) : sharp(join(images_folder, "ja2.png"));
    let jman = is_angry ? sharp(join(images_folder, "jankang.png")) : sharp(join(images_folder, "jankfce.png"));
    let min_hand = is_angry ? sharp(join(images_folder, "gunarm.png")) : sharp(join(images_folder, "ja2.png"));

    const jankman_as_buffer = await jman.resize(null, 380).toBuffer();

    hr_hand = hr_hand.rotate(hr_rotation + 10, {
        background: "#00FFFF00"
    });
    let h_m = await sharp(await hr_hand.toBuffer()).metadata();
    const hr_hand_as_buffer = await hr_hand
        .extract({
            top: Math.floor(h_m.height! / 2 - 255),
            left: Math.floor(h_m.width! / 2 - 255),
            width: 510,
            height: 510
        })
        .toBuffer();

    min_hand = min_hand.rotate(min_rotation + 10, {
        background: "#00FFFF00"
    });

    let m_m = await sharp(await min_hand.toBuffer()).metadata();
    const min_hand_as_buffer = await min_hand
        .extract({
            top: Math.floor(m_m.height! / 2 - 255),
            left: Math.floor(m_m.width! / 2 - 255),
            width: 510,
            height: 510
        })
        .toBuffer();

    return await face
        .composite([
            { input: hr_hand_as_buffer, top: 0, left: 0 },
            { input: jankman_as_buffer, top: 70, left: 70 },
            { input: min_hand_as_buffer, top: 0, left: 0 }
        ])
        .toBuffer();
}

export default class TimeCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.name = "time";
        this.description = "Get the time in a place";
        this.aliases = ["clock", "what time is it", "what time is it in", "what time is it in"];
        this.bot = bot;
    }

    public override async run(bot: Bot, message: JbMessage, args: string[]) {
        if (args.length == 0) {
            const jank_time = new Date();
            const clock_buffer = await getClock(jank_time.getHours(), jank_time.getMinutes());
            message.reply({
                content: "The time in Jankland is:",
                files: [clock_buffer]
            });
        } else {
            let where = args.includes("where")
            const place = extractPlaceNameFromMsg(args.join(" "));
            const geo_code = await getGeoCodefromPlace(place);
            if (geo_code == null) {
                const h = Math.floor(Math.random() * 24);
                const m = Math.floor(Math.random() * 60);
                const clock_buffer = await getClock(h, m, true);
                message.reply({
                    content: `That was not advanced. I couldn't find a time.`,
                    files: [clock_buffer]
                });
            } else {
                const time_zone = getTimeZonefromLatLong(geo_code[0], geo_code[1]);
                const d = new Date(
                    new Date().toLocaleString("en-US", {
                        //fucking americans
                        timeZone: time_zone
                    })
                );
                const clock_buffer = await getClock(d.getHours(), d.getMinutes());
                await message.reply({
                    content: `The time in [${geo_code[2].toUpperCase()}] is:`,
                    files: [clock_buffer]
                });
                if (where) {
                    if (!message.channel.isSendable()) return;
                    message.channel.send(
                        `https://www.google.com/maps/search/?api=1&query=${geo_code[0]},${geo_code[1]}`
                    )
                }
            }
        }
    }
}
