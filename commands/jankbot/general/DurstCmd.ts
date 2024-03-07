import { ActionRowBuilder, ButtonBuilder, ButtonComponent, ButtonStyle, Message } from "discord.js";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";

export default class DurstCmd extends JankbotCmd {
    private _dursts: string[];
    constructor(bot: Bot) {
        super();
        this.name = "durst";
        this.description = "Get a random durst.";
        this.aliases = [];
        this._dursts = JSON.parse(readFileSync(join(__dirname, "..", "..", "..", "resource", "dursts.json"))!.toString());

        bot.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isButton()) return;
            if (interaction.customId.startsWith("DURST:")) {
                await interaction.deferUpdate();
                const durst = this._dursts[Math.floor(Math.random() * this._dursts.length)];
                ButtonBuilder.from(interaction.message!.components![0].components![0] as ButtonComponent).setDisabled(true);
                const row = new ActionRowBuilder()
                    .addComponents(ButtonBuilder.from(interaction.message!.components![0].components![0] as ButtonComponent));
                await (interaction.message as Message).edit({
                    content: durst,
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

    public override async run(_bot: Bot, message: Message, _args: string[]) {
        const durst = this._dursts[Math.floor(Math.random() * this._dursts.length)];
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("DURST:NEXT")
                .setStyle(ButtonStyle.Primary)
                .setLabel("Break Stuff")
                .setDisabled(true)
        );

        const msg = await message.channel.send({
            content: durst,
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