import { EmbedAuthorData, GuildChannel, Message, ThreadChannel, User } from "discord.js";
import { Bot } from "../structs/Bot";
import { Request, Response } from "express";

const url_regex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/;

export type Song = {
    url: string,
    user: [string, string | null],
    // yippie for api stability!!!
    user_extra?: {
        role_color: string | null | undefined,
        nick: string | null | undefined,
    };
    details: {
        title: string | null | undefined,
        author: EmbedAuthorData | null | undefined;
    };
    content: string,
    timedate: Date,
    type: "file" | "external";
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

const allowed_content_types = [
    "audio/mpeg",
    "audio/ogg",
    "audio/opus",
    "audio/wave",
    "audio/wav",
    "audio/webm",
    "audio/flac",
];

export async function scrape_thread(bot: Bot, id: string)
    : Promise<Record<string, Song>[] | undefined> {
    let messages, guild, channel;
    try {
        channel = bot.client.channels.cache.get(id);

        if (!channel) {
            channel = await bot.client.channels.fetch(id);
        };

        if (!channel?.isThread) return;

        channel = channel as ThreadChannel;

        guild = bot.client.guilds.cache.get(channel.guildId);
        if (!guild) {
            guild = await bot.client.guilds.fetch(channel.guildId);
        }

        const everyone = guild.roles.everyone;

        if (!channel.permissionsFor(everyone).has("ViewChannel")) {
            return;
        }

        if (!channel?.messages) return;

        messages = await channel.messages.fetch({ limit: 100 });
    } catch {
        return;
    }

    const data: Map<string, Song>[] = [
        new Map(),
        new Map(),
        new Map(),
        new Map(),
    ];


    let arr: Message[] = [];
    messages.reverse().map((o: Message) => arr.push(o));

    let top_post = true;

    for (const msg of arr) {
        // skip the top post
        if (top_post) {
            top_post = false;
            continue;
        }

        const matches = msg.content?.match(url_regex);
        const attachments = msg.attachments;

        if (!matches && attachments.size == 0) continue;

        let url, title, author, type: "file" | "external" | undefined;

        if (attachments) {
            const attachment =
                attachments.find(o => o.contentType?.startsWith("audio/") ?? false);

            if (attachment) {
                url = attachment.url;
                title = attachment.name;
            }
            type = "file";
        }

        if (matches && !url) {
            url = matches[0];
            const embed = msg.embeds[0];
            if (embed) ({ title, author } = embed);
            type = "external";
        }

        // this is just here to please typescript
        if (!url) continue;
        if (!type) type = "external";

        let id = msg.author.id;

        let member;
        if (msg.guildId) {
            member = guild.members.cache.get(id);

            if (!member) {
                member = await guild.members.fetch(id);
            }
        }

        // evil loop 
        let idx = 0;
        while (true) {
            if (idx == data.length) continue;
            if (data[idx].get(msg.author.id)) {
                idx++;
                continue;
            }

            data[idx].set(msg.author.id, {
                url,
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
                type,
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