import { WebSocketServer, type WebSocket } from "ws";
import type { Bot } from "../structs/Bot";
import type { Channel, ThreadChannel } from "discord.js";
import { scrape_thread } from "./thread_scraper";

export const NotAThreadError = new Error("not even a thread");

export class GramophoneServer {
    constructor(
        public bot: Bot,
        public thread: ThreadChannel,
        public target_channel: Channel
    ) {
        this.wss = new WebSocketServer({
            // we'll be resuing the server express creates, so we don't need to
            // make one here
            noServer: true,
        });

        this.wss.on("connection", (e) => this.handle_incoming(e));
    }

    static async from_id(
        bot: Bot,
        thread_id: string,
        target_channel: Channel
    ) {
        const thread = await bot.client.channels.fetch(thread_id);
        if (!thread?.isThread()) {
            throw NotAThreadError;
        }

        return new this(bot, thread, target_channel);
    }

    wss: WebSocketServer;
    subscrumblers: Set<GramophoneClient> = new Set();

    handle_incoming(ws: WebSocket) {
        const client = new GramophoneClient(ws, this);
        this.subscrumblers.add(client);
    }

    async fetch_songs() {
        const thread = await scrape_thread(this.bot, this.thread.id);
        return thread;
    }

    fetch_thread_info(): ThreadDetails {
        return {
            title: this.thread.name
        }
    }
}

export enum WsCommand {
    ThreadDetails,

    SongList,
    SongAdded,
    SongRemoved,

    /** A list of users in the stage */
    UserList,
    /** User has joined the target stage */
    UserOnline,
    /** User has left the target stage */
    UserOffline,

    /** Play a song */
    Play,
    /** Resume playback after a {@link Pause} */
    Resume,
    /** Pause playback */
    Pause,
    /** Clear Queue */
    Stop,

    /** A new song is playing */
    Playing,
    /** Playback has been resumed */
    Resumed,
    /** Playback has been paused */
    Paused,
    /** The amount of time elapsed */
    Progress,
    /** The song has finished playback */
    Finished,
}


export type WsMessage =
    {
        command: WsCommand.SongList,
        data: Awaited<ReturnType<GramophoneServer['fetch_songs']>>
    } |
    {
        command: WsCommand.ThreadDetails,
        data: ThreadDetails,
    }

export type ThreadDetails = {
    title: string,
}
class GramophoneClient {
    constructor(public ws: WebSocket, public server: GramophoneServer) {
        this.handle_open();
    }

    send(command: WsCommand, data: any) {
        this.ws.send(JSON.stringify({ command, data }));
    }

    async handle_open() {
        const snogs = await this.server.fetch_songs();
        const thread = this.server.fetch_thread_info();
        this.send(WsCommand.SongList, snogs);
        this.send(WsCommand.ThreadDetails, thread);
    }
}