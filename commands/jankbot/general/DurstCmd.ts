import { Message, MessageActionRow, MessageButton } from "discord.js";
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
                (interaction.message!.components![0].components![0] as MessageButton).setDisabled(true);
                const row = new MessageActionRow().addComponents((interaction.message!.components![0].components![0] as MessageButton));
                await (interaction.message as Message).edit({
                    content: durst,
                    components: [ row ]
                });
                setTimeout(() => {
                    row.components[0].setDisabled(false);
                    (interaction.message as Message).edit({
                        components: [ row ]
                    });
                }, 1000);
            }
        });
    }

    public override async run(bot: Bot, message: Message, args: string[]) {
        const durst = this._dursts[Math.floor(Math.random() * this._dursts.length)];
        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId("DURST:NEXT")
                .setStyle("PRIMARY")
                .setLabel("Break Stuff")
                .setDisabled(true)
        );

        const msg = await message.channel.send({
            content: durst,
            components: [ row ]
        });

        setTimeout(() => {
            row.components[0].setDisabled(false);
            msg.edit({
                components: [ row ]
            });
        }, 1000);

    }
}