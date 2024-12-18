import youtube, { Playlist as YoutubePlaylist } from "youtube-sr";
import { config } from "../utils/config";
import { Song, SongType } from "./Song";
const pattern = /^.*(youtu.be\/|list=)([^#\&\?]*).*/i;

export class Playlist {
    public data: YoutubePlaylist;
    public videos: Song[];

    public constructor(playlist: YoutubePlaylist, added_by: string = "Unknown") {
        this.data = playlist;

        this.videos = this.data.videos
            .filter((video) => video.title != "Private video" && video.title != "Deleted video")
            .slice(0, config.MAX_PLAYLIST_SIZE - 1)
            .map((video) => {
                return new Song({
                    title: video.title!,
                    url: new URL(`https://youtube.com/watch?v=${video.id}`),
                    kind: SongType.YtDlp,
                    duration: video.duration / 1000,
                }, added_by);
            });
    }

    public static async from(url: string = "", search: string = "", added_by: string = "Unknown"): Promise<Playlist> {
        const urlValid = pattern.test(url);
        let playlist;

        if (urlValid) {
            playlist = await youtube.getPlaylist(url);
        } else {
            const result = await youtube.searchOne(search, "playlist");
            playlist = await youtube.getPlaylist(result.url!);
        }

        return new this(playlist, added_by);
    }
}
