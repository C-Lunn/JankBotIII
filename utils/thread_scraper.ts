import { Message, MessageEmbedAuthor, User } from "discord.js";
import { Bot } from "../structs/Bot";
import { Request, Response } from "express";

const url_regex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/;

type Song = {
    url: string,
    user: [string, string | null],
    details: {
        title: string | null | undefined,
        author: MessageEmbedAuthor | null | undefined
    }
};

export async function scrape_thread(bot: Bot, id: string) {
    const channel = bot.client.channels.cache.get(id);

    //@ts-ignore
    if (!channel?.messages) return;

    //@ts-ignore
    const messages = await channel.messages.fetch({ limit: 100 });

    const data: Map<String, Song>[] = [
        new Map(),
        new Map(),
        new Map(),
        new Map(),
    ];

    let top_post = true;
    //@ts-ignore
    messages.reverse().forEach(async (o, i) => {
        // skip the top post
        if (top_post) {
            top_post = false;
            return;
        }
        const msg: Message = o;
        const matches = msg.content.match(url_regex);
        if (!matches) return;

        // evil loop 
        let idx = 0;
        while (true) {
            if (idx == data.length) return;
            if (data[idx].get(msg.author.id)) {
                idx++;
                continue;
            }

            const embed = msg.embeds[0];
            let title, author;
            if (embed) ({ title, author } = embed);

            data[idx].set(msg.author.id, {
                url: matches[0],
                details: {
                    title, author
                },
                user: [msg.author.username, msg.author.avatar]
            });

            return;
        }
    });


    return data.map(o => Object.fromEntries(o));
}

export async function get_avatar(res: Response, bot: Bot, uid: string) {
    let user = bot.client.users.cache.get(uid);
    if (!user) user = await bot.client.users.fetch(uid);

    const avatar = user?.avatar;
    if (!avatar) {
        res.status(404).send();
        return;
    }

    res.redirect(
        302,
        `https://cdn.discordapp.com/avatars/${uid}/${avatar}.png?size=32`
    );
}