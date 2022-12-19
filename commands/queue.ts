import { Message, MessageActionRow, MessageButton, MessageEmbed, MessageReaction, User } from "discord.js";
import { bot } from "../index";
import { Song } from "../structs/Song";
import { i18n } from "../utils/i18n";

export default {
    name: "queue",
    cooldown: 5,
    aliases: ["q"],
    description: i18n.__("queue.description"),
    permissions: ["MANAGE_MESSAGES", "ADD_REACTIONS"],
    category: "music",
    async execute(message: Message) {
        // const queue = bot.queues.get(message.guild!.id);
        // if (!queue || !queue.songs.length) return message.reply(i18n.__("queue.errorNotQueue"));

        // let currentPage = 0;
        // const embeds = generateQueueEmbed(message, queue.songs);
        // const row = new MessageActionRow().addComponents(
        //     new MessageButton()
        //         .setCustomId("QUEUE:PREV")
        //         .setStyle("SECONDARY")
        //         .setEmoji("⬅️")
        //         .setDisabled(currentPage === 0),
        //     new MessageButton()
        //         .setCustomId("QUEUE:STOP")
        //         .setStyle("DANGER")
        //         .setEmoji("⏹️"),
        //     new MessageButton()
        //         .setCustomId("QUEUE:NEXT")
        //         .setStyle("SECONDARY")
        //         .setEmoji("➡️")
        //         .setDisabled(currentPage === embeds.length - 1)
        // );

        // const queueEmbed = await message.reply({
        //     content: `**${i18n.__mf("queue.currentPage")} ${currentPage + 1}/${embeds.length}**`,
        //     embeds: [embeds[currentPage]],
        //     components: [row]
        // });

        // message.client.on("interactionCreate", async (interaction) => {
        //     if (!interaction.isButton()) return;
        //     await interaction.deferUpdate();
        //     if (interaction.user.id !== message.author.id) return interaction.reply({ content: i18n.__("common.errorNotUser"), ephemeral: true });
        //     if (interaction.customId.startsWith("QUEUE:")) {
        //         // await interaction.deferUpdate();
        //         switch (interaction.customId) {
        //             case "QUEUE:PREV":
        //                 currentPage--;
        //                 break;
        //             case "QUEUE:NEXT":
        //                 currentPage++;
        //                 break;
        //             case "QUEUE:STOP":
        //                 await queueEmbed.delete();
        //                 return;
        //         }
        //         for (const button of row.components) {
        //             if (button.customId === "QUEUE:PREV") button.setDisabled(currentPage === 0);
        //             if (button.customId === "QUEUE:NEXT") button.setDisabled(currentPage === embeds.length - 1);
        //         };
        //         await queueEmbed.edit({
        //             content: `**${i18n.__mf("queue.currentPage")} ${currentPage + 1}/${embeds.length}**`,
        //             embeds: [embeds[currentPage]],
        //             components: [row]
        //         });
        //     }
        // });
        const queue = bot.queues.get(message.guild!.id);
        if (!queue || !queue.songs.length) return message.reply("There are no queues active.");
        let msg = "```\n";
        for (const song of queue.songs) {
            msg += `${queue.activeSong() === song ? "P " : "  "}${song.title}\n`;
        }
        msg += "```";
        message.reply(msg);
    }
};

function generateQueueEmbed(message: Message, songs: Song[]) {
    let embeds = [];
    let k = 10;

    for (let i = 0; i < songs.length; i += 10) {
        const current = songs.slice(i, k);
        let j = i;
        k += 10;

        const info = current.map((track) => `${++j} - [${track.title}](${track.url})`).join("\n");

        const embed = new MessageEmbed()
            .setTitle(i18n.__("queue.embedTitle"))
            .setThumbnail(message.guild?.iconURL()!)
            .setColor("#F8AA2A")
            .setDescription(
                i18n.__mf("queue.embedCurrentSong", { title: songs[0].title, url: songs[0].url, info: info })
            )
            .setTimestamp();
        embeds.push(embed);
    }

    return embeds;
}
