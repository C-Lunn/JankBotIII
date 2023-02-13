import { RawData, WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { WsConnection } from "./WsConnection";

export class WebService {
    ws;

    constructor() {
        this.ws = new WebSocketServer({
            port: 42069
        });

        this.ws.on("connection", (ws) => new WsConnection(ws))
    }
}