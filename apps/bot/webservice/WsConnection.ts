import { RawData, WebSocket } from "ws";
import { play } from "./Play";
import { check_queue, get_queue } from "./Queue";
import { RequestKind, ResponseKind, Response, Request, request_schema } from "janktypes";

export class WsConnection {
    constructor(private conn: WebSocket) {
        conn.on("message", (msg) => this.on_msg(msg));
    }

    async on_msg(msg: RawData) {
        const json = JSON.parse(msg.toString());
        try {
            const req: Request = await request_schema.parseAsync(json);

            this.handle_request(req);
        } catch (e) {
            this.send({
                kind: ResponseKind.InvalidRequest,
                data: JSON.stringify(e),
                ref: json.ref ?? "unknown"
            });
        }
    }

    handle_request(r: Request) {
        if (r.kind == RequestKind.AcquireToken) console.log(r);
        if (r.kind == RequestKind.Play) play(this, r);
        if (r.kind == RequestKind.CheckQueue) check_queue(this, r);
        if (r.kind == RequestKind.GetQueueContents) get_queue(this, r);
    }

    send(r: Response) {
        const to_send = JSON.stringify(r);

        this.conn.send(to_send);
    }
}