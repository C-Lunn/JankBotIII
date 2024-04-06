export interface Config {
    TOKEN: string;
    PREFIX: string;
    MAX_PLAYLIST_SIZE: number;
    PRUNING: boolean;
    STAY_TIME: number;
    DEFAULT_VOLUME: number;
    LOCALE: string;
    MOD_ROLE_ID: string;
    MQ_KEY?: string;
    PORT?: string;
    DB_PATH: string;
    HOSTNAME?: string;
    DON?: {
        enabled: boolean;
        username: string;

        avatar_path?: string;
        bio?: string;
        display_name?: string;
        meta?: Record<string, {value: string, linkify: boolean}>;
    };
}
