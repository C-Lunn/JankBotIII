import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message } from "discord.js";
import { Bot } from "./Bot.ts";

export class QuitSibelius {
    _bot: Bot;
    public constructor(bot: Bot) {
        bot.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isButton()) return;
            if (interaction.customId.startsWith("QUIT_SIB")) {
                await interaction.deferUpdate();
                ((interaction.message) as Message).edit({
                    content: 'https://raw.githubusercontent.com/SantanaFtRobThomas/jankbot/master/images/sib_crashed.png',
                    components: []
                })
            }
        });
    }

    public async run(msg: Message) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("QUIT_SIB")
                .setStyle(ButtonStyle.Primary)
                .setLabel("Quit Sibelius")
        );

        if (!msg.channel.isSendable()) return;

        await msg.channel.send({
            //@ts-ignore
            components: [row]
        });
    }
}