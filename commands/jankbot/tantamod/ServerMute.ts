import { GuildMember, Message, MessageMentions, User } from "discord.js";
import JankbotCmd from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";

export default class ServerMuteCmd extends JankbotCmd {
    constructor(public bot: Bot) {
        super();
    }

    name = "server-mute";
    aliases = ["sm", "kill"];
    _is_tantamod = true;

    public async run(bot: Bot, message: Message, args: string[]) {
        const arg = args[0];
        const reason = args.slice(1).join(" ");
        console.log(reason);
        if (!arg) {
            message.reply("you gotta specify a user");
            return;
        }

        const user = await get_user_arg(bot, message, arg);
        if (!user) {
            message.reply("not even a real user");
            return;
        };

        user.voice.setMute(true);

        message.reply(`✅ muted ${user.user.username}`)
    }
}

async function get_user_arg(bot: Bot, message: Message, arg: string) {
    const match = arg.matchAll(MessageMentions.USERS_PATTERN).next().value;
    let id;

    if (match) {
        id = match[1];
    } else {
        id = arg;
    }

    console.log(id);
    
    let user: GuildMember;

    try {
        user = await message.guild!.members.fetch(id);
    } catch {
        return;
    }

    return user;
}