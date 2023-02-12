import { z } from "zod";
import { bot } from "..";
import { Song } from "../structs/Song";
import { Request } from "./WebService";
import { WsConnection } from "./WsConnection";

const play_req = z.string();

export async function play(conn: WsConnection, r: Request) {
    const data = await play_req.parseAsync(r.data);

    const song = await Song.from(data);
    const queue = bot.queues.get("1030609563671613490");
    queue?.push(song);
}