import JankbotCmd, { type JbMessage } from "../../../interfaces/JankbotCommand.ts";
import { Bot } from "../../../structs/Bot.ts";
import { scrape_thread } from "../../../utils/thread_scraper.ts";

export default class ThreadCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.name = "threadtest";
        this.description = "test the thread scraper";
        this.bot = bot;
    }

    public override async run(bot: Bot, message: JbMessage, args: string[]) {
        scrape_thread(this.bot, "1082314035317448886");

    }
}