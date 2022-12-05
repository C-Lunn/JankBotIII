import { Message, MessageActionRow, MessageButton } from "discord.js";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

export default class DurstCmd extends JankbotCmd {
    constructor(bot: Bot) {
        super();
        this.name = "durst";
        this.description = "Get a random durst.";
        this.aliases = [];
    }

    public override async run(bot: Bot, message: Message, args: string[]) {
        const dursts = readdirSync(join(__dirname, "..", "..", "..", "resource", "durst"));
        let durst = readFileSync(join(__dirname, "..", "..", "..", "resource", "durst", dursts[Math.floor(Math.random() * dursts.length)]));
        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId("DURST:NEXT")
                .setStyle("PRIMARY")
                .setLabel("Break Stuff")
                .setDisabled(true)
        );

        const msg = await message.channel.send({
            files: [ durst ],
            components: [ row ]
        });

        setTimeout(() => {
            row.components[0].setDisabled(false);
            msg.edit({
                components: [ row ]
            });
        }, 1000);

        message.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isButton()) return;
            await interaction.deferUpdate();
            if (interaction.customId.startsWith("DURST:")) {
                durst = readFileSync(join(__dirname, "..", "..", "..", "resource", "durst", dursts[Math.floor(Math.random() * dursts.length)]));
                row.components[0].setDisabled(true);
                await msg.edit({
                    files: [ durst ],
                    components: [row]
                });
                setTimeout(() => {
                    row.components[0].setDisabled(false);
                    msg.edit({
                        components: [ row ]
                    });
                }, 1000);
            }
        });

    }
}