import { Message } from "discord.js";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";
import { scrape_thread } from "../../../utils/thread_scraper";

export default class ThreadCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.name = "threadtest";
        this.description = "test the thread scraper";
        this.bot = bot;
    }

    public override async run(bot: Bot, message: Message, args: string[]) {
        scrape_thread(this.bot, "1082314035317448886");

    }
}