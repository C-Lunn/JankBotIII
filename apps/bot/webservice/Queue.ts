import { VoiceChannel } from "discord.js";
import { z } from "zod";
import { bot, guild_id } from "..";
import { Queue } from "../structs/Queue";
import { Response, ResponseKind, Request } from "janktypes";
import { WsConnection } from "./WsConnection";

export async function check_queue(conn: WsConnection, r: Request) {
    const queue = bot.queues.get("1030609563671613490");
    let res: Response;
    if (!queue) res = {
        kind: ResponseKind.Ok,
        data: false,
        ref: r.ref,
    };
    else res = {
        kind: ResponseKind.Ok,
        data: true,
        ref: r.ref,
    };

    conn.send(res);
}

export const add_queue_data = z.string();

export async function add_queue(conn: WsConnection, r: Request) {
    const data = add_queue_data.parse(r.data);

}