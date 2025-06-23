import { type DiscordGatewayAdapterCreator, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import {
    ActionRowBuilder, ButtonBuilder,
    ButtonStyle,
    Guild,
    type Interaction,
    Message, MessageFlags, ModalBuilder, ModalSubmitInteraction,
    StageChannel, TextInputBuilder, TextInputStyle,
    type VoiceBasedChannel
} from "discord.js";
import pfs from "fs/promises";
import nunjucks from "nunjucks";
import path from "path";
import { Bot } from "../../structs/Bot.ts";
import { MusicQueue } from "../../structs/MusicQueue.ts";
import { NotAMusicError, Song, SongType } from "../../structs/Song.ts";
import { config } from "../../utils/config.ts";
import { get_metadata } from "../metadata.ts";

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


export default class RadioSession {
    constructor(public statusmsg: Message, public stage: StageChannel, public bot: Bot) {
        this.guild = statusmsg.guild!;

        this.setup();
    }

    guild: Guild;
    queue: MusicQueue;

    static on_interaction(bot: Bot, interaction: Interaction) {
        if (!bot.radio_session) {
            if (!interaction.isRepliable()) return;
            return interaction.reply({ content: "The radio is offline.", flags: MessageFlags.Ephemeral })
        }
        if (interaction.isModalSubmit() && interaction.customId == add_song_dialog_id) {
            bot.radio_session.add_song(interaction);
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
        });

        this.update_status();
        this.setup_stage();
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


    async add_song(interaction: ModalSubmitInteraction) {
        const input = interaction.fields.getTextInputValue(song_url);
        const url = URL.parse(input);
        if (!url) {
            return interaction.reply({
                content: "That doesn't look like a real URL, sorry.",
                flags: MessageFlags.Ephemeral,
            })
        }

        const added_by = interaction.user.id;
        let song;
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        try {
            const metadata = await get_metadata(url);
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
                return interaction.editReply({
                    content: "We couldn't find the song you were looking for.",
                })
            }
            console.error(error);
            return interaction.editReply({
                content: "Something went horribly wrong there.",
            }).catch(console.error);
        }

        interaction.editReply(`Added *${song.title}* to the queue.`)
        this.queue.push(song);
        this.update_status();
    }

    async self_destruct() {
        this.queue.stop(true);
    }

    dump_queue() {
        
    }
}
