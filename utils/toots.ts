import path from "path";
import { config } from "./config";
import { Things, db } from "./db";
import { generateKeyPair } from 'crypto';
import type { Response } from "express";

export default class FeddedVerse {
    private static create_post_stmt = db.prepare(`
        INSERT INTO post (content, author_id) VALUES (?,?);
    `);

    static publish(content: string, author_id: string) {
        this.create_post_stmt.run(content, author_id);
    }

    private static with_context(json: any) {
        return {
            '@context': [
                'https://www.w3.org/ns/activitystreams',
                'https://w3id.org/security/v1',
                {
                    schema: 'http://schema.org#',
                    PropertyValue: 'schema:PropertyValue',
                    value: 'schema:value',
                },
            ],
            ...json,
        }
    }

    private static linkify = (link: string) => (`
        <a 
            href="${link}" 
            target="_blank" 
            rel="nofollow noopener noreferrer me" 
        >
            ${link}
        </a>
    `);

    static guess_mime(pathname: string) {
        switch (path.extname(pathname)) {
            case ".gif": return "image/gif";
            case ".webp": return "image/webp";
            case ".png": return "image/png";
            case ".avif": return "image/avif";
            default: return "image/jpeg";
        }
    }

    static get_actor() {
        const id = `https://${config.HOSTNAME}/actor/${config.DON!.username}`;
        const pubkey = APSecuritie.get_public();
        const donfig = config.DON!;

        if (config.DON!.avatar_path) {

        }

        return this.with_context({
            id,

            "type": "Person",
            "preferredUsername": donfig.username,
            "inbox": `https://${config.HOSTNAME}/actor/${donfig.username}/inbox`,
            "outbox": `https://${config.HOSTNAME}/actor/${donfig.username}/outbox`,
            "url": "https://google.com",

            "name": donfig.display_name,
            "summary": donfig.bio,
            "icon": donfig.avatar_path ? {
                type: "Image",
                mediaType: this.guess_mime(donfig.avatar_path),
                url: `https://${config.HOSTNAME}/actor/icon`,
            } : undefined,

            "publicKey": {
                id: `${id}#main-key`,
                owner: id,
                publicKeyPem: pubkey,
            },

            "attachment": Object.entries(donfig.meta ?? {}).map(([k, v]) => ({
                type: 'PropertyValue',
                name: k,
                value: v.linkify ? this.linkify(v.value) : v.value,
            })),
        });
    }

    static outbox() {
        const id = `https://${config.HOSTNAME}/actor/outbox`;
        const posts = Post.all();
        return this.with_context({
            id,
            "type": "OrderedCollection",
            "totalItems": posts.length,

            "orderedItems": posts.map(o => o.to_activity()),
        });
    }

    static inbox(request: Record<string, any>, res: Response) {
        console.log(request);
        if (!("type" in request) || typeof request.type != "string") {
            return res.status(400).json("you need a type in there");
        }

        switch (request.type) {
            case "Follow": {

            }
            case "Undo": {
                
            }
        };
    }
}

export class WebFinger {
    static lookup(query: string) {
        const expected = `acct:${config.DON!.username}@${config.HOSTNAME}`;

        if (query != expected) {
            return;
        }

        return {
            "subject": expected,
            "links": [
                {
                    "rel": "self",
                    "type": "application/activity+json",
                    "href": `https://${config.HOSTNAME}/actor/${config.DON!.username}`
                }
            ]
        };
    }
}

export class APSecuritie {
    static get_public = () => Things.get_thing("public");
    static get_private = () => Things.get_thing("private");

    static async init_keys() {
        if (this.get_public()) {
            // we already have keys generated
            return;
        }

        const { privateKey, publicKey } = await this.gen_keys();

        Things.set_thing("public", publicKey);
        Things.set_thing("private", privateKey);
    }

    private static gen_keys() {
        const p: Promise<{ publicKey: string, privateKey: string }> = new Promise((resolve, reject) => {
            generateKeyPair('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            }, (err: Error | null, publicKey: string, privateKey: string) => {
                if (err) reject(err);
                resolve({ publicKey, privateKey })
            })
        });

        return p;
    }
}

class Post {
    content: string;
    created: Date;
    id: string;

    constructor({ content, created, id }: {
        content: string,
        created: string,
        id: string,
    }) {
        this.content = content;
        this.created = new Date(created);
        this.id = id;
    }

    static all_stmt = db.prepare(`
        SELECT * FROM post;
    `)

    static all() {
        return this.all_stmt.all().map(o => new this(o as any));
    }

    static fetch_stmt = db.prepare(`
        SELECT * FROM post WHERE id = ?;
    `)

    static fetch(id: string) {
        return new this(this.fetch_stmt.get(id) as any);
    }

    to_ap = () => ({
        "id": `https://${config.HOSTNAME}/posts/${this.id}`,
        "type": "Note",
        "published": this.created.toISOString(),
        "attributedTo": `https://${config.HOSTNAME}/actor/${config.DON!.username}`,
        "content": `<p>${this.content}</p>`,
        "inReplyTo": null,
        "to": ["https://www.w3.org/ns/activitystreams#Public"],
        "cc": [`https://${config.HOSTNAME}/followers`],
        "sensitive": false,
    })

    to_activity = () => {
        const obj = this.to_ap();
        return {
            "id": `${obj.id}/activity`,
            "type": "Create",
            "actor": obj.attributedTo,
            "published": obj.published,
            "to": obj.to,
            "cc": obj.cc,
            "object": obj,
        }
    }
}