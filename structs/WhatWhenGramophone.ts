import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, TextChannel } from "discord.js";
import { Bot } from "./Bot";

export class WhatWhenGramophone {
    public constructor(bot: Bot) {
        bot.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isButton()) return;
            if (interaction.customId.startsWith("MORE_GRAM")) {
                await interaction.deferReply({
                    ephemeral: true
                });
                const info_msg = (interaction.guild!.channels.cache.get("739173595955200121")! as TextChannel).messages.fetch("1072592855870230558");
                const msg_content = (await info_msg).content;
                let truncated = msg_content.slice(0, 1997);
                if (msg_content.length > 1997) {
                    truncated += "...";
                }
                interaction.editReply({
                    content: truncated
                })
            }
        });
    }

    public async run(msg: Message) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("MORE_GRAM")
                .setStyle(ButtonStyle.Primary)
                .setLabel("Gramophone Info")
        );

        await msg.channel.send({
            content: "Hey! If you want to know more about gramophone, check the pinned message in <#739173595955200121> or click the button below.",
            //@ts-ignore
            components: [row]
        });
    }
}