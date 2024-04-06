import Database from "better-sqlite3";
import { config } from "./config";

export const db = new Database(config.DB_PATH);

export class Things {
    private static set_stmt = db.prepare(`
        INSERT INTO thing (key, value) VALUES (?, ?)
    `);

    static set_thing(key: string, value: string) {
        this.set_stmt.run(key, value);
    }

    private static pr_stmt = db.prepare(`
        SELECT value FROM thing WHERE key = ?
    `).pluck();

    static get_thing(key: string) {
        return this.pr_stmt.get(key) as string | undefined;
    }
}