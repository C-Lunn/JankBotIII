import { v4 as uuidv4 } from 'uuid';
import AsyncLock from 'async-lock';
import { ResponseKind, request_schema, type Response, response_schema, RequestKind, type Request } from 'janktypes';

export class WebServiceClient {
    ws?: WebSocket;
    reqs: RequestList = new RequestList(this);

    constructor(private url: string) { }

    up_lock = new AsyncLock();
    active = false;

    async up() {
        if (this.active) return;
        await this.up_lock.acquire("up", async () => {
            if (this.active) return;
            let task = new Deferred();
            this.ws = new WebSocket(this.url);
            this.ws.onopen = async () => {
                if (!this.ws) throw new Error;

                if (task.resolve) task.resolve(null);

                this.ws.onmessage = async (msg) => {
                    const json = JSON.parse(msg.data);
                    this.handle_response(await response_schema.parseAsync(json));
                };
                await this.new_request(RequestKind.CheckQueue).then(o => console.log(o))
            }

            await task.promise;
            this.active = true;
        });
    }

    async new_request(code: RequestKind, data?: unknown) {
        const req = new AsyncRequest(this, code, data);
        req.send();
        return req.task.promise;
    }

    handle_response(r: Response) {
        this.reqs.resolve_requests(r);
    }

    send(data: string) {
        if (!this.ws) throw new Error;
        this.ws.send(data);
    }
}

export class RequestList {
    requests: [string, Deferred<Response>][] = [];

    constructor(private client: WebServiceClient) { }

    add_request(req: [string, Deferred<Response>]) {
        this.requests.push(req);
    }

    resolve_requests(response: Response) {
        this.requests = this.requests.filter(r => {
            if (response.ref == r[0]) {
                if (!r[1].resolve) throw new Error("task didn't do");
                r[1].resolve(response);
                return false;
            } else {
                return true;
            }
        });
    }
}

export class AsyncRequest {
    task: Deferred<Response> = new Deferred();
    ref: string;
    req: { kind: RequestKind, data: unknown, ref: string };

    constructor(private client: WebServiceClient, code: RequestKind, data?: unknown) {
        this.ref = uuidv4();

        this.req = {
            kind: code,
            data,
            ref: this.ref,
        }
    }

    send() {
        this.client.reqs.add_request([this.ref, this.task]);
        this.client.send(JSON.stringify(this.req));
        return this.task.promise;
    }
}

export class Deferred<T> {
    promise: Promise<T>;
    reject: ((reason?: string) => void) | undefined;
    resolve: ((value: T | PromiseLike<T>) => void) | undefined;

    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.reject = reject
            this.resolve = resolve
        })
    }
}