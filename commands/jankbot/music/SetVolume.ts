import { i18n } from "../../../utils/i18n.ts";
import { canModifyQueue } from "../../../utils/queue.ts";
import { Bot } from "../../../structs/Bot.ts";
import JankbotMusicCmd from "../../../interfaces/JankbotMusicCommand.ts";
import type { JbMessage } from "../../../interfaces/JankbotCommand.ts";

export default class SetVolumeCmd extends JankbotMusicCmd {
    constructor(public bot: Bot) {
        super();
        this.name = "volume";
        this.category = "music";
        this.aliases = ["v"];
        this.description = "Change volume of currently playing music";
    }
    
    async run(bot: Bot, message: JbMessage, args: string[]) {
        const queue = bot.queues.get(message.guild!.id);
        
        if (!queue) return message.reply(i18n.__("volume.errorNotQueue")).catch(console.error);
        
        if (!canModifyQueue(message.member!))
            return message.reply(i18n.__("volume.errorNotChannel")).catch(console.error);
        
        if (!args[0]) {   
            return message.reply(i18n.__mf("volume.currentVolume", { volume: queue.volume })).catch(console.error);
        }
        
        const target_volume = Number(args[0]);
        
        if (isNaN(target_volume)) {
            return message.reply(i18n.__("volume.errorNotNumber")).catch(console.error);
        }
        
        if (target_volume > 100 || target_volume < 0) {
            return message.reply(i18n.__("volume.errorNotValid")).catch(console.error);
        }
        
        queue.volume = target_volume;
        queue.resource.volume?.setVolumeLogarithmic(target_volume / 100);
        
        message.reply(i18n.__mf("volume.result", { arg: target_volume })).catch(console.error);
    }    
}
