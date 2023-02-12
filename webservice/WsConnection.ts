import { RawData, WebSocket } from "ws";
import { play } from "./Play";
import { request_schema, ResponseKind, Request, RequestKind } from "./WebService";

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
        if (r.kind == RequestKind.Play) play(this, r);
    }
}