import { AudioPlayerStatus } from "@discordjs/voice";
import { randomUUID } from "crypto";
import { promisify } from "util";
import { Server, WebSocket } from "ws";
import { Bot } from "./Bot";

const wait = promisify(setTimeout);

class WebSockManager {
    private _bot: Bot;
    private _server: Server
    private _connected_clients: Map<string, WebSocket> = new Map();
    constructor (bot: Bot) {
        this._bot = bot;
        this._server = new Server({ port: 42069 });
        this._server.on('connection', (socket: WebSocket) => this._onConnection(socket));
    }

    private async _onConnection (socket: WebSocket) {
        console.log("New connection");
        const session_id = randomUUID();
        this._connected_clients.set(session_id, socket);
        socket.on('message', this._onMessage.bind(this));
        socket.on('close', () => this._connected_clients.delete(session_id));
        this.sendLoop(socket);
    }

    private async _onMessage (message: string) {
        console.log("New message:", message);
    }

    public async sendLoop (socket: WebSocket) {
        const queue = this._bot.queues.get("638309926225313832");
        if (!queue) {
            socket.send(JSON.stringify({
                type: "NO_QUEUE",
                timestamp: Date.now()
            }));
            wait(250);
        } else {
            const song = queue.songs[queue.activeIndex];
            socket.send(JSON.stringify({
                type: "SONG_UPDATE",
                song: {
                    title: song.title,
                    url: song.url,
                    duration: song.duration,
                    is_playing: queue.resource.audioPlayer?.state.status === AudioPlayerStatus.Playing,
                    present_duration: (queue.resource?.playbackDuration / 1000) ?? 0
                }
            }));
            wait(5);
        }
        setTimeout(this.sendLoop.bind(this, socket), 250)
    }

}

export {
    WebSockManager
}


