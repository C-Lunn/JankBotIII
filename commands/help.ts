import { EmbedBuilder, Message } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";

export default {
    name: "help",
    aliases: ["h"],
    description: i18n.__("help.description"),
    execute(message: Message) {
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

        return message.reply({ embeds: [helpEmbed] }).catch(console.error);
    }
};
