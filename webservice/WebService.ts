import { RawData, WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { WsConnection } from "./WsConnection";

export enum RequestKind {
    AcquireToken = 1,
    Play = 201,
    Stop = 202,
    Pause = 203,
    Seek = 204,
    CheckQueue = 101,
    StartQueue = 102,

}

export enum ResponseKind {
    InvalidRequest = 999
}

export const request_schema = z.object({
    kind: z.nativeEnum(RequestKind),
    data: z.any(),
})

export type Request = z.infer<typeof request_schema>;

export class WebService {
    ws;

    constructor() {
        this.ws = new WebSocketServer({
            port: 42069
        });

        this.ws.on("connection", (ws) => new WsConnection(ws))
    }
}