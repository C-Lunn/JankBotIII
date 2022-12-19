import { Message, MessageActionRow, MessageActionRowComponent, MessageButton } from "discord.js";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

export default class LogoCmd extends JankbotCmd {
    private _logos: string[];
    constructor(bot: Bot) {
        super();
        this.name = "logo";
        this.description = "Get a random logo.";
        this.aliases = [];
        this._logos = readdirSync(join(__dirname, "..", "..", "..", "resource", "muselogos"));

        bot.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isButton()) return;
            if (interaction.customId.startsWith("LOGO:")) {
                await interaction.deferUpdate();
                const logo = readFileSync(join(__dirname, "..", "..", "..", "resource", "muselogos", this._logos[Math.floor(Math.random() * this._logos.length)]));
                (interaction.message!.components![0].components![0] as MessageButton).setDisabled(true);
                const row = new MessageActionRow().addComponents((interaction.message!.components![0].components![0] as MessageButton));
                await (interaction.message as Message).edit({
                    files: [ logo ],
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
        let logo = readFileSync(join(__dirname, "..", "..", "..", "resource", "muselogos", this._logos[Math.floor(Math.random() * this._logos.length)]));
        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId("LOGO:NEXT")
                .setStyle("PRIMARY")
                .setLabel("New All")
                .setDisabled(true)
        );

        const msg = await message.channel.send({
            files: [ logo ],
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