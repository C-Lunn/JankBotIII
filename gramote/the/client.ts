import { WsCommand, type WsMessage } from "../../utils/socket";
import { $songs, $thread } from "./stores";

type Message = {
    command: WsCommand,
    data: any,
}

export default class Client {
    constructor() {
        console.info("connecting :3");
        this.ws = new WebSocket("ws://127.0.0.1:3001/gramophone");
        this.ws.onopen = () => this.on_open()
        this.ws.onmessage = (e) => this.handle_incoming(e)
    }

    on_open() {
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
