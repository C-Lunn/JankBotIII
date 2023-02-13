import { browser } from "$app/environment";
import type { LayoutLoad } from "./$types";

export const ssr = false;
export const prerender = false;

export const load: LayoutLoad = async () => {
    if (!browser) throw new Error;
};