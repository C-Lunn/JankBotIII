import { Message, MessageActionRow, MessageButton } from "discord.js";
import { Bot } from "./Bot";

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
        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId("QUIT_SIB")
                .setStyle("PRIMARY")
                .setLabel("Quit Sibelius")
        );

        const message = await msg.channel.send({
            components: [ row ]
        });

    }
}