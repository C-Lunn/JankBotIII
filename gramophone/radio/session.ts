import { Message } from "discord.js";
import pfs from "fs/promises";
import path from "path";

const status_template = await pfs.readFile(path.join(import.meta.dirname, "msg-template.njk"))

export default class RadioSession {
    constructor(public statusmsg: Message) {

    }

    update_status() {

    }

}
