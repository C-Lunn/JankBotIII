import { type DiscordGatewayAdapterCreator, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import {
    ActionRowBuilder, BaseInteraction, ButtonBuilder,
    ButtonStyle,
    ChannelType,
    Guild,
    type Interaction,
    Message, MessageFlags, ModalBuilder, ModalSubmitInteraction,
    StageChannel, TextInputBuilder, TextInputStyle,
    type VoiceBasedChannel
} from "discord.js";
import pfs from "fs/promises";
import nunjucks from "nunjucks";
import PQueue from "p-queue";
import path from "path";
import { Bot } from "../../structs/Bot.ts";
import { MusicQueue } from "../../structs/MusicQueue.ts";
import { NotAMusicError, Song, type SongData, SongType } from "../../structs/Song.ts";
import { config } from "../../utils/config.ts";
import { get_metadata } from "../metadata.ts";
import BumperQueue from "./bumpers.ts";

const status_file = (await pfs.readFile(path.join(import.meta.dirname, "msg-template.njk"))).toString("utf-8");
const status_template = nunjucks.compile(status_file)

const add_song_button = "add-song";
const add_song_dialog_id = "add-song-dialog";
const song_url = "song-url";

const status_row = new ActionRowBuilder<ButtonBuilder>({
    components: [
        new ButtonBuilder({
            custom_id: add_song_button,
            label: "Add Song",
            style: ButtonStyle.Primary
        }),
    ]
});

// genuinely the most insane api i've ever seen. do these people know html is free.
const add_song_diag = new ModalBuilder({
    custom_id: add_song_dialog_id,
    title: "Add a Song",
    components: [
        new ActionRowBuilder<TextInputBuilder>({
            components: [new TextInputBuilder({
                custom_id: song_url,
                style: TextInputStyle.Short,
                required: true,
                label: "Song URL",
                placeholder: "YouTube or Soundcloud, if you don't mind.",
            })]
        })
    ]
})

interface RadioSessionBackup {
    songs: { data: SongData, added_by: string, added_on: string }[],
    statusmsg_id: string,
    statusmsg_channel_id: string,
    stage_id: string,
    guild_id: string,
    active_index: number,
}

export default class RadioSession {
    constructor(public statusmsg: Message, public stage: StageChannel, public bot: Bot) {
        this.guild = statusmsg.guild!;

        this.setup();

        this.ready = new Promise((resolve) => {
            this.#ready_resolve = resolve;
        })
    }

    guild: Guild;
    queue: MusicQueue;

    ready: Promise<void>;
    #ready_resolve: () => void;

    lookup_queue = new PQueue({ concurrency: 2, timeout: 60_000 });

    static on_interaction(bot: Bot, interaction: Interaction) {
        if (!bot.radio_session) {
            if (!interaction.isRepliable()) return;
            return interaction.reply({ content: "The radio is offline.", flags: MessageFlags.Ephemeral })
        }
        if (interaction.isModalSubmit() && interaction.customId == add_song_dialog_id) {
            bot.radio_session.on_dialog_submit(interaction);
        }
        if (interaction.isButton() && interaction.customId == add_song_button) {
            interaction.showModal(add_song_diag)
        }
    }

    async setup() {
        let queue = this.bot.queues.get(this.guild.id);
        if (!queue) {
            this.queue = await this.initVoiceConnection(this.stage)
                .then(x => new MusicQueue({
                    connection: x,
                    message: this.statusmsg,
                }));
            this.bot.queues.set(this.guild.id, this.queue)
        }

        this.queue.on("update", () => {
            this.update_status();
            this.save();
        });

        this.bumper_queue = new BumperQueue(this.queue.player);

        this.queue.play_bumper = async () => await this.bumper_queue.play();

        this.update_status();
        await this.setup_stage();

        this.#ready_resolve()
    }

    async setup_stage() {
        const state = await this.guild.voiceStates.fetch(this.bot.client.user!.id);
        state.setSuppressed(false);
    }

    update_status() {
        const playlist_url = new URL(
            "/radio/",
            config.WEBROOT ?? "https://gramophone.space"
        ).toString();

        const content = status_template.render({
            current: this.queue.activeSong(),
            playlist: this.queue.songs.slice(this.queue.activeIndex + 1),
            config,
            playlist_url,
        })
        this.statusmsg.edit({
            content,
            components: [status_row],
            allowedMentions: { users: [] },
        });
    }


    async initVoiceConnection(channel: VoiceBasedChannel): Promise<VoiceConnection> {
        const conn = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
        })

        await new Promise(resolve => setTimeout(resolve, 1000));

        return conn;
    }

    async on_dialog_submit(interaction: ModalSubmitInteraction) {
        const input = interaction.fields.getTextInputValue(song_url);
        this.add_song(input, interaction)
    }

    async add_song(input: string, m: ModalSubmitInteraction | Message) {
        const url = URL.parse(input);
        if (!url) {
            // @ts-ignore
            return m.reply({
                content: "That doesn't look like a real URL, sorry.",
                flags: m instanceof Message ? undefined : MessageFlags.Ephemeral,
            })
        }

        const user = m instanceof Message ? m.author : m.user;

        const added_by = user.id;
        let song;

        if (m instanceof BaseInteraction) {
            await m.deferReply({ flags: MessageFlags.Ephemeral });
        }
        const reply = (msg: any) => m instanceof Message ? m.reply(msg) : m.editReply(msg);

        const next = this.queue.songs.slice(this.queue.activeIndex + 1);
        if (next.find(x => x.added_by == added_by)) {
            reply("Please wait until your song has been played before submitting a new one.");
            return;
        }

        try {
            const stuff = await this.lookup_queue.add(async () => await get_metadata(url));
            if (!stuff) return;
            const { ok, song: metadata } = stuff;
            if (!ok) {
                reply("Couldn't process this link.")
                return;
            }
            console.log(metadata);

            song = metadata
                ? new Song(metadata, added_by)
                : new Song(
                    {
                        duration: NaN,
                        title: "Unknown",
                        url,
                        kind: SongType.YtDlp,
                    },
                    added_by
                );
        } catch (error) {
            if (error instanceof NotAMusicError) {
                return reply({
                    content: "We couldn't find the song you were looking for.",
                })
            }
            console.error(error);
            return reply({
                content: "Something went horribly wrong there.",
            }).catch(console.error);
        }

        reply(`Added *${song.title}* to the queue.`)
        this.queue.push(song);
        this.update_status();
        this.save();
    }

    async self_destruct() {
        this.queue.stop(true);
        const state = await this.guild.voiceStates.fetch(this.bot.client.user!.id);
        state.disconnect();
    }

    async save() {
        const data: RadioSessionBackup = {
            guild_id: this.guild.id,
            songs: this.queue.songs.map(x => ({
                data: x.metadata,
                added_by: x.added_by,
                added_on: x.added_on.toISOString(),
            })),
            stage_id: this.stage.id,
            statusmsg_id: this.statusmsg.id,
            statusmsg_channel_id: this.statusmsg.channelId,
            active_index: this.queue.activeIndex,
        };
        pfs.writeFile("radio.json", JSON.stringify(data))
    }

    // next_bumper = new Date(Date.now() + 600_000); // in 10 minutes
    bumper_queue: BumperQueue;

    static async restore(bot: Bot): Promise<RadioSession> {
        const data = await pfs.readFile("radio.json");
        const json = JSON.parse(data.toString("utf-8")) as RadioSessionBackup;

        const status = await bot.client.channels.fetch(json.statusmsg_channel_id)
            .then(x => x?.isSendable() ? x?.messages.fetch(json.statusmsg_id) : null);

        if (!status) {
            throw new Error("Couldn't find the status message")
        }

        const stage = await bot.client.channels.fetch(json.stage_id);
        if (!stage || stage.type != ChannelType.GuildStageVoice) {
            throw new Error("Couldn't find the stage")
        }

        const sesh = new RadioSession(status, stage, bot);
        await sesh.ready;

        sesh.queue.songs = json.songs.map(x => new Song(x.data, x.added_by, new Date(x.added_on)));
        await sesh.queue.skipTo(json.active_index + 1);
        sesh.queue.playNext();

        return sesh;
    }
}
