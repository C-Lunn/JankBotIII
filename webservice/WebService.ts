import { RawData, WebSocketServer, WebSocket } from "ws";
import { z } from "zod";

enum RequestKind {
    AcquireToken
}

enum ResponseKind {
    InvalidRequest = 999
}

const request_schema = z.object({
    kind: z.nativeEnum(RequestKind),
    data: z.any(),
})

type Request = z.infer<typeof request_schema>;

export class WebService {
    ws;
    constructor() {
        this.ws = new WebSocketServer({
            port: 42069
        });

        this.ws.on("connection", (ws) => new WsConnection(ws))
    }

    async on_msg(msg: RawData) {
    }
}

export class WsConnection {
    constructor(private conn: WebSocket) {
        conn.on("message", (msg) => this.on_msg(msg));
    }

    async on_msg(msg: RawData) {
        try {
            const json = JSON.parse(msg.toString());
            const req: Request = await request_schema.parseAsync(json);

            this.handle_request(req);
        } catch (e) {
            this.conn.send(JSON.stringify({
                kind: ResponseKind.InvalidRequest,
                data: JSON.stringify(e)
            }));
        }
    }

    handle_request(r: Request) {
        if (r.kind == RequestKind.AcquireToken) console.log(r);
    }
}