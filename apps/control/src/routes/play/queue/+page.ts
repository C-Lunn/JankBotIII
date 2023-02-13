import { ws } from "$lib/Service";
import { RequestKind, ResponseKind } from "janktypes";
import { z } from "zod";
import type { PageLoad } from "./$types";

export const _song_res_schema = z.array(
    z.object({
        url: z.string(),
        title: z.string(),
        added_by: z.string(),
        duration: z.number(),
        active: z.boolean(),
    })
);

type SongList = z.infer<typeof _song_res_schema>

export const load: PageLoad = async ({parent}) => {
    await parent();

    const data = await ws.new_request(RequestKind.GetQueueContents);

    if (data.kind == ResponseKind.Empty) {
        return { songs: [] }
    }

    const songs: SongList = await _song_res_schema.parseAsync(data.data);
    return { songs }
};