import { signal } from "@preact/signals";
import type { Song } from "../../utils/thread_scraper";
import { ThreadDetails } from "../../utils/socket";

export const $songs = signal<Record<string, Song>[] | null>(null);
export const $thread = signal<ThreadDetails | null>(null);