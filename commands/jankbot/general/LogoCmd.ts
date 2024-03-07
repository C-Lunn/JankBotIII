import { ActionRowBuilder, ButtonBuilder, ButtonComponent, ButtonStyle, Message } from "discord.js";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";

export default class LogoCmd extends JankbotCmd {
    private _logos: string[];
    constructor(bot: Bot) {
        super();
        this.name = "logo";
        this.description = "Get a random logo.";
        this.aliases = [];
        this._logos = JSON.parse(readFileSync(join(__dirname, "..", "..", "..", "resource", "muselogos.json"))!.toString());

        bot.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isButton()) return;
            if (interaction.customId.startsWith("LOGO:")) {
                await interaction.deferUpdate();
                let logo = this._logos[Math.floor(Math.random() * this._logos.length)];
                ButtonBuilder.from(interaction.message!.components![0].components![0] as ButtonComponent).setDisabled(true);
                const row = new ActionRowBuilder().addComponents(
                    ButtonBuilder.from(interaction.message!.components![0].components![0] as ButtonComponent)
                );
                await (interaction.message as Message).edit({
                    content: logo,
                    //@ts-ignore
                    components: [row]
                });
                setTimeout(() => {
                    (row.components[0] as ButtonBuilder).setDisabled(false);
                    (interaction.message as Message).edit({
                        //@ts-ignore
                        components: [row]
                    });
                }, 1000);
            }
        });
    }

    public override async run(bot: Bot, message: Message, args: string[]) {
        let logo = this._logos[Math.floor(Math.random() * this._logos.length)];
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("LOGO:NEXT")
                .setStyle(ButtonStyle.Primary)
                .setLabel("New All")
                .setDisabled(true)
        );

        const msg = await message.channel.send({
            content: logo,
            //@ts-ignore
            components: [row]
        });

        setTimeout(() => {
            (row.components[0] as ButtonBuilder).setDisabled(false);
            msg.edit({
                //@ts-ignore
                components: [row]
            });
        }, 1000);

    }
}