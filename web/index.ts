import express from "express";
import { Bot } from "../structs/Bot";
import { get_avatar, get_thread_info, scrape_thread } from "../utils/thread_scraper";
import { config } from "../utils/config";
import path from "path";
import nunjucks from "nunjucks";
import db from "../utils/db";

export default class WebService {
    app = express();

    constructor(public bot: Bot) {
        // set up nunjucks
        const views = path.join(__dirname, 'views');
        const assets = path.join(__dirname, 'assets');
        this.app.set('views', views);
        nunjucks.configure(views, {
            autoescape: true,
            express: this.app,
            watch: process.env.NODE_ENV == "development",
        });
        this.app.set('view engine', 'html');
        this.app.use(express.static(assets));

        this.app.get('/', (req, res) => res.render("index.html"));

        this.app.get('/gramophone/:number', this.threadview)

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

    static #get_thread_stmt = db.prepare(`
        SELECT title, number FROM thread WHERE number = ?
    `);
    static #get_submissions = db.prepare(`
        SELECT song.*, submission.*
        FROM thread, song, submission
        WHERE submission.thread_id = thread.id 
            AND song.id = submission.song_id 
            AND thread.number = ?
    `);
    threadview({ params: { number }, ...req }: express.Request, res: express.Response) {
        const thread = WebService.#get_thread_stmt.get(number);
        if (!thread) return res.status(404).send("Not found.");

        const submissions = WebService.#get_submissions.all(number);

        res.render("thread.html", { thread, submissions });
    }

    listen() {
        const port = config.PORT ?? 3000;
        this.app.listen(port, () => {
            console.info(`Web Service listening on port ${port}`);
        });
    }
}
