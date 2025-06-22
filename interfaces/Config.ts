export interface Config {
    TOKEN: string;
    PREFIX: string;
    MAX_PLAYLIST_SIZE: number;
    PRUNING: boolean;
    STAY_TIME: number;
    DEFAULT_VOLUME: number;
    LOCALE: string;
    MOD_ROLE_ID: string | string[];
    MQ_KEY?: string;
    PORT?: string | number;
    ACOUSTID_KEY?: string;
    WEBROOT?: string;
    COOKIES_DOT_TXT?: string;
}
