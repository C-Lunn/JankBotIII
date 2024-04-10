import { WsCommand, type WsMessage } from "../../utils/socket";
import { $songs, $thread } from "./state";

export default class Client {
    constructor() {
        console.info("connecting :3");
        this.ws = new WebSocket("ws://localhost:3001/gramophone");
        this.ws.onopen = () => this.on_open()
        this.ws.onmessage = (e) => this.handle_incoming(e)
    }

    on_open() {
        console.info("connected!");
    }

    handle_incoming(e: MessageEvent) {
        const msg = JSON.parse(e.data) as WsMessage;
        console.log(msg);

        switch (msg.command) {
            case WsCommand.SongList: {
                $songs.value = msg.data;
                return;
            }
            case WsCommand.ThreadDetails: {
                $thread.value = msg.data;
                return;
            }
        }
    }

    ws: WebSocket;
}
