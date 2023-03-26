import { Message, User } from "discord.js";
import { Bot } from "../structs/Bot";

const url_regex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/;

export async function scrape_thread(bot: Bot, id: string) {
    const channel = bot.client.channels.cache.get(id);

    //@ts-ignore
    if (!channel?.messages) throw new Error;

    //@ts-ignore
    const messages = await channel.messages.fetch({ limit: 100 });

    type Song = { url: string, user: [string, string | null] };
    const data: Map<String, Song>[] = [
        new Map(),
        new Map(),
        new Map(),
        new Map(),
    ];

    //@ts-ignore
    messages.reverse().forEach(o => {
        const msg: Message = o;
        const matches = msg.content.match(url_regex);
        if (!matches) return;

        // evil loop 
        let idx = 0;
        while (true) {
            console.log(idx);
            if (idx == data.length) return;
            if (data[idx].get(msg.author.id)) {
                idx++;
                continue;
            }
            data[idx].set(msg.author.id, {
                url: matches[0],
                user: [msg.author.username, msg.author.avatar]
            });
            return;
        }    
    });

    return data.map(o => Object.fromEntries(o));
}