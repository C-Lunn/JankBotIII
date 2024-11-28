import express from "express";
import { Bot } from "../structs/Bot";
import { get_avatar, get_thread_info, scrape_thread } from "../utils/thread_scraper";
import { config } from "../utils/config";
import path from "path";
import nunjucks from "nunjucks";

export default class WebService {
    app = express();

    constructor(public bot: Bot) {
        // set up nunjucks
        const views = path.join(__dirname, 'views');
        this.app.set('views', views);
        nunjucks.configure(views, {
            autoescape: true,
            express: this.app
        });
        this.app.set('view engine', 'html');

        this.app.get('/', (req, res) => res.render("index.html"));

        this.app.get('/np', (req, res) => {
            const queue = bot.queues.get('638309926225313832');
            if (queue) {
                res.send(queue.songs[0].title);
            } else {
                res.send('No queue');
            }
        });

        this.app.get('/thread/:id', async (req, res) => {
            const msgs = await scrape_thread(bot, req.params.id);
            res.send(msgs);
        });

        this.app.get('/thread_info/:id', async (req, res) => {
            const msgs = await get_thread_info(bot, req.params.id);
            res.send(msgs);
        });


        this.app.get('/avatar/:uid', async (req, res) => {
            get_avatar(res, bot, req.params.uid);
        });
    }

    listen() {
        const port = config.PORT ?? 3000;
        this.app.listen(port, () => {
            console.info(`Web Service listening on port ${port}`);
        });
    }
}
