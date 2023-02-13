import { browser } from "$app/environment";
import { ws } from "$lib/Service";
import { redirect } from "@sveltejs/kit";
import { RequestKind } from "janktypes";
import { z } from "zod";
import type { LayoutLoad } from "./$types";

export const ssr = false;
export const prerender = false;
const response_schema = z.boolean();

export const load: LayoutLoad = async () => {
    await ws.up();
    const res = await ws.new_request(RequestKind.CheckQueue);
    const queue_active = await response_schema.parseAsync(res.data);
    
    if (!queue_active) throw redirect(302, "/inactive/");
    return
};