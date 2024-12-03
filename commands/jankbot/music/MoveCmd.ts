import { Message } from "discord.js";
import { AttemptToReplacePlayingSongError, QueueIndexOutofBoundsError } from "../../../structs/MusicQueue";
import { i18n } from "../../../utils/i18n";
import { canModifyQueue } from "../../../utils/queue";
import JankbotMusicCmd from "../../../interfaces/JankbotMusicCommand";
import { Bot } from "../../../structs/Bot";

export default class MoveCmd extends JankbotMusicCmd {
    constructor(public bot: Bot) {
        super();
        this.name = "move";
        this.aliases = ["mv"];
        this.description = i18n.__("move.description"),
        this.category = "music";
    }
    
    async run(bot: Bot, message: Message, args: string[]) {
        const queue = bot.queues.get(message.guild!.id);
        
        if (!queue) return message.reply("There is no queue active.").catch(console.error);
        
        if (!canModifyQueue(message.member!)) return;
        if (args.length !== 2) return message.reply("Usage: move <from> <to>").catch(console.error);
        
        const from = Number(args[0]), to = Number(args[1]);
        
        if (isNaN(from) || isNaN(to) || from < 1 || to < 1) {
            return message.reply("Usage: move <from> <to>");
        }
        
        if (from > queue.songs.length || to > queue.songs.length) {
            return message.reply("Invalid position ouuughh");
        }
        
        try {
            const move_title = queue.songs[from - 1].title;
            queue.move(from - 1, to - 1);
            return message.reply(`Moved ${from} (${move_title}) to ${to}.`);
        } catch (e) {
            if (e instanceof QueueIndexOutofBoundsError) {
                if ((e as QueueIndexOutofBoundsError).info.which === "from") {
                    return message.reply("Invalid index for from.");
                } else {
                    return message.reply("Invalid index for to.");
                }
            } else if (e instanceof AttemptToReplacePlayingSongError) {
                return message.reply("Cannot replace the currently playing song.");
            }
            else {
                console.log(e);
            }
        }

    }
}
