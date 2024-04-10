import { signal } from "@preact/signals";
import type { Song } from "../../utils/thread_scraper";
import { ThreadDetails } from "../../utils/socket";
import Client from "./client";

export const $songs = signal<Record<string, Song>[] | null>(null);
export const $thread = signal<ThreadDetails | null>(null);
export const client = new Client();