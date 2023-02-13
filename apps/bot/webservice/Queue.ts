import { VoiceChannel } from "discord.js";
import { z } from "zod";
import { bot, guild_id } from "..";
import { Queue } from "../structs/Queue";
import { Response, ResponseKind, Request } from "janktypes";
import { WsConnection } from "./WsConnection";

export async function check_queue(conn: WsConnection, r: Request) {
    const queue = bot.queues.get(guild_id);
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

export async function get_queue(conn: WsConnection, r: Request) {
    const queue = bot.queues.get(guild_id);
    if (!queue) {
        conn.send({
            kind: ResponseKind.Empty,
            ref: r.ref
        });
        return;
    }

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