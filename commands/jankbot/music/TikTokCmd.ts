import AsyncLock from "async-lock";
import * as fs from "fs";
import * as os from "os";
import JankbotMusicCmd from "../../../interfaces/JankbotMusicCommand.ts";
import { Bot } from "../../../structs/Bot.ts";
import play from './PlayCmd.ts';
import type { JbMessage } from "../../../interfaces/JankbotCommand.ts";

export let lock = new AsyncLock({ timeout: 200000 });

export default class TikTokCmd extends JankbotMusicCmd {
    private _ttsVoices = [
        // DISNEY VOICES
        'en_us_ghostface',            // Ghost Face
        'en_us_chewbacca',            // Chewbacca
        'en_us_c3po',                 // C3PO
        'en_us_stitch',               // Stitch
        'en_us_stormtrooper',         // Stormtrooper
        'en_us_rocket',               // Rocket
        'en_female_madam_leota',      // Madame Leota
        'en_male_ghosthost',          // Ghost Host
        'en_male_pirate',             // Pirate

        // ENGLISH VOICES
        'en_au_001',                  // English AU - Female
        'en_au_002',                  // English AU - Male
        'en_uk_001',                  // English UK - Male 1
        'en_uk_003',                  // English UK - Male 2
        'en_us_001',                  // English US - Female (Int. 1)
        'en_us_002',                  // English US - Female (Int. 2)
        'en_us_006',                  // English US - Male 1
        'en_us_007',                  // English US - Male 2
        'en_us_009',                  // English US - Male 3
        'en_us_010',                  // English US - Male 4

        // EUROPE VOICES
        'fr_001',                     // French - Male 1
        'fr_002',                     // French - Male 2
        'de_001',                     // German - Female
        'de_002',                     // German - Male
        'es_002',                     // Spanish - Male

        // AMERICA VOICES
        'es_mx_002',                  // Spanish MX - Male
        'br_001',                     // Portuguese BR - Female 1
        'br_003',                     // Portuguese BR - Female 2
        'br_004',                     // Portuguese BR - Female 3
        'br_005',                     // Portuguese BR - Male

        // ASIA VOICES
        'id_001',                     // Indonesian - Female
        'jp_001',                     // Japanese - Female 1
        'jp_003',                     // Japanese - Female 2
        'jp_005',                     // Japanese - Female 3
        'jp_006',                     // Japanese - Male
        'kr_002',                     // Korean - Male 1
        'kr_003',                     // Korean - Female
        'kr_004',                     // Korean - Male 2

        // SINGING VOICES
        'en_female_f08_salut_damour',  // Alto
        'en_male_m03_lobby',  // Tenor
        'en_female_f08_warmy_breeze',  // Warmy Breeze
        'en_male_m03_sunshine_soon',  // Sunshine Soon
        'en_female_ht_f08_glorious',  // Glorious
        'en_male_sing_funny_it_goes_up',  // It Goes Up
        'en_male_m2_xhxs_m03_silly',  // Chipmunk
        'en_female_ht_f08_wonderful_world',  // Dramatic

        // OTHER
        'en_male_narration',  // narrator
        'en_male_funny',  // wacky
        'en_female_emotional',  // peaceful
        'en_male_cody',  // serious
    ]


    private async _playTts(
        message: JbMessage,
        speaker: string,
        text: string
    ) {
        if (!this._ttsVoices.includes(speaker)) {
            message.channel.send(`:warning: **Command must begin with the name of a speaker.** Full List: https://github.com/oscie57/tiktok-voice/wiki/Voice-Codes}`);
            return;
        }
        if (text.length > 200) {
            message.channel.send(`:warning: **Message must contain 200 characters or fewer.**`);
            return;
        }

        const req = await fetch("https://tiktok-tts.weilnet.workers.dev/api/generation", {
            "credentials": "omit",
            "headers": {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:108.0) Gecko/20100101 Firefox/108.0",
                "Accept": "*/*",
                "Accept-Language": "en-GB,en;q=0.5",
                "Content-Type": "application/json",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "cross-site"
            },
            "referrer": "https://weilbyte.github.io/",
            "body": `{"text":"${text}","voice":"${speaker}"}`,
            "method": "POST",
            "mode": "cors"
        });
        const json = await req.json();

        if (json['success'] == false) throw new Error("thing broke oops");

        const data = json['data'];

        const decoded = Buffer.from(data, 'base64');

        const temp_dir = os.tmpdir();
        const name = `jankbot_tiktok_${speaker}_${text.slice(0, 10).replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;
        const file_target = `${temp_dir}/${name}.mp3`
        fs.writeFile(file_target, decoded, () => null);

        await new play(this.bot).run(this.bot, message, [`file://${file_target}`]);

        // wait 5 seconds before taking on a new request
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    constructor(bot: Bot) {
        super();
        this.name = "tiktok";
        this.description = "use the silly tiktok tts voices";
        this.aliases = ['tts'];
        this.bot = bot;
    }

    public override async run(bot: Bot, message: JbMessage, args: string[]) {
        lock.acquire('tts', async () => {
            let speaker;
            let text;
            if (this._ttsVoices.includes(args[0])) {
                speaker = args[0];
                text = args.slice(1).join(" ")
            } else {
                speaker = "en_us_001";
                text = args.join(" ")
            }

            text = text.replaceAll("\n", " ");

            await this._playTts(message, speaker, text);
        });

    }
}
