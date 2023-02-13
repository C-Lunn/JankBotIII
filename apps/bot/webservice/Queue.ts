import { VoiceChannel } from "discord.js";
import { z } from "zod";
import { bot, guild_id } from "..";
import { Queue } from "../structs/Queue";
import { Response, ResponseKind, Request } from "janktypes";
import { WsConnection } from "./WsConnection";

const no_queue = (conn: WsConnection, r: Request) => {
    conn.send({
        kind: ResponseKind.NoQueue,
        ref: r.ref
    });
}

export async function check_queue(conn: WsConnection, r: Request) {
    const queue = bot.queues.get(guild_id);
    if (!queue) { no_queue(conn, r); return; }
    else conn.send({
        kind: ResponseKind.Ok,
        data: true,
        ref: r.ref,
    });
}

export async function get_queue(conn: WsConnection, r: Request) {
    const queue = bot.queues.get(guild_id);
    if (!queue) { no_queue(conn, r); return; }

    const songs = queue.songs;
    const active_song = queue.activeSong();
    const new_songs = songs.map(o => {
        let active = false;
        if (o == active_song) active = true;

        return {
            ...o,
            active,
        }
    })

    conn.send({
        kind: ResponseKind.Ok,
        ref: r.ref,
        data: new_songs,
    })
}

const skip_schema = z.number();

export async function skip_to(conn: WsConnection, r: Request) {
    const queue = bot.queues.get(guild_id);
    if (!queue) { no_queue(conn, r); return; }
    const data = await skip_schema.parseAsync(r.data);
    
    queue.skipTo(data);
    conn.send({
        kind: ResponseKind.Ok,
        ref: r.ref,
    });
}