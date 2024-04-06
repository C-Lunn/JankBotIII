import AsyncLock from "async-lock";
import { Message } from "discord.js";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";
import { db } from "../../../utils/db";
import FeddedVerse from "../../../utils/toots";

export let lock = new AsyncLock({ timeout: 200000 });

export default class TootCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.name = "toot";
        this.description = "federate an post";
        this.aliases = ["tweet", "post"];
        this.bot = bot;
    }

    public override async run(bot: Bot, message: Message, args: string[]) {
        const content = args.join(" ");
        FeddedVerse.publish(content, message.author.id);        
    }

}
