import { Message, MessageEmbedAuthor, User } from "discord.js";
import { Bot } from "../structs/Bot";
import { Request, Response } from "express";

const url_regex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/;

type Song = {
    url: string,
    user: [string, string | null],
    // yippie for api stability!!!
    user_extra?: {
        role_color: string | null | undefined,
        nick: string | null | undefined,
    };
    details: {
        title: string | null | undefined,
        author: MessageEmbedAuthor | null | undefined;
    };
    content: string,
    timedate: Date,
};

export async function get_thread_info(bot: Bot, id: string) {
    try {
        const channel = bot.client.channels.cache.get(id);

        return {
            //@ts-ignore
            title: channel!.name,
        };
    } catch {
        return;
    }
}

export async function scrape_thread(bot: Bot, id: string) {
    let messages;
    try {
        const channel = bot.client.channels.cache.get(id);

        //@ts-ignore
        if (!channel?.messages) return;

        //@ts-ignore
        messages = await channel.messages.fetch({ limit: 100 });
    } catch {
        return;
    }

    const data: Map<String, Song>[] = [
        new Map(),
        new Map(),
        new Map(),
        new Map(),
    ];

    let arr: Message[] = [];
    messages.map((o: Message) => arr.push(o));

    let top_post = true;

    for (const o of arr) {
        // skip the top post
        if (top_post) {
            top_post = false;
            continue;
        }

        const msg: Message = o;
        const matches = msg.content?.match(url_regex);
        if (!matches) continue;

        // evil loop 
        let idx = 0;
        while (true) {
            if (idx == data.length) continue;
            if (data[idx].get(msg.author.id)) {
                idx++;
                continue;
            }

            const embed = msg.embeds[0];
            let title, author;
            if (embed) ({ title, author } = embed);

            let id = msg.author.id;

            let guild, member;
            if (msg.guildId) {
                guild = bot.client.guilds.cache.get(msg.guildId);

                if (!guild) {
                    guild = await bot.client.guilds.fetch(msg.guildId);
                }

                member = guild?.members.cache.get(id);

                if (!member) {
                    member = await guild.members.fetch(id);
                }
            }

            data[idx].set(msg.author.id, {
                url: matches[0],
                details: {
                    title, author
                },
                user_extra: {
                    role_color: member?.displayHexColor,
                    nick: member?.nickname,
                },
                user: [msg.author.username, msg.author.avatar],
                content: msg.content,
                timedate: new Date(msg.createdTimestamp),
            });

            break;
        }
    };

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