import { EmbedBuilder, Message } from "discord.js";
import { i18n } from "../../../utils/i18n";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";

export default class HelpCmd extends JankbotCmd {
    constructor(public bot: Bot) {
        super();
        this.name = "help";
        this.aliases = ["h"];
        this.description = "Display all commands and descriptions";
    }
    
    async run(bot: Bot, message: Message, _args: string[]) {
        let commands = bot.commands;
        
        let helpEmbed = new EmbedBuilder()
            .setTitle(i18n.__mf("help.embedTitle", { botname: message.client.user!.username }))
            .setDescription(i18n.__("help.embedDescription"))
            .setColor("#F8AA2A");
        
        // TODO: split this into multiple chunks so it doesn't overflow
        let idx = 0;
        commands.forEach((cmd) => {
            if (idx >= 25) {
                helpEmbed.addFields(
                    {
                        name: `**${bot.prefix}${cmd.name} ${cmd.aliases ? `(${cmd.aliases})` : ""}**`,
                        value: `${cmd.description}`,
                        inline: true,
                    }
                );
            }
            idx++;
        });
        
        helpEmbed.setTimestamp();
        
        message.reply({ embeds: [helpEmbed] }).catch(console.error);
    }
}
