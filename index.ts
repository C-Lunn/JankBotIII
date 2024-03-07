import { Client, IntentsBitField } from "discord.js";
import { Bot } from "./structs/Bot";

export const bot = new Bot(
    new Client({
        rest: {
            offset: 0,
        },
        intents: [
            IntentsBitField.Flags.Guilds,
            IntentsBitField.Flags.GuildVoiceStates,
            IntentsBitField.Flags.GuildMessages,
            IntentsBitField.Flags.GuildMessageReactions,
            IntentsBitField.Flags.DirectMessages,
            IntentsBitField.Flags.MessageContent,
        ]
    })
);
