import { Command } from "../interfaces/Command";
import { Bot } from "../structs/Bot";
import CatCmd from "./jankbot/general/CatCmd";
import DurstCmd from "./jankbot/general/DurstCmd";
import FistchordCmd from "./jankbot/general/FistchordCmd";
import HelpCmd from "./jankbot/general/HelpCmd";
import JankmanCmd from "./jankbot/general/JankmanCmd";
import LogoCmd from "./jankbot/general/LogoCmd";
import MSDiscordForum from "./jankbot/general/MSDiscordForum";
import SlayCmd from "./jankbot/general/MSDiscordForum";
import ThreadCmd from "./jankbot/general/ThreadTester";
import TimeCmd from "./jankbot/general/TimeCmd";
import UptimeCmd from "./jankbot/general/UptimeCmd";
import XkcdCmd from "./jankbot/general/XckdCmd";
import FadeCmd from "./jankbot/music/FadeCmd";
import LeaveCmd from "./jankbot/music/LeaveCmd";
import MoveCmd from "./jankbot/music/MoveCmd";
import PauseCmd from "./jankbot/music/PauseCmd";
import RemoveSongCmd from "./jankbot/music/RemoveSongCmd";
import SetVolumeCmd from "./jankbot/music/SetVolume";
import TikTokCmd from "./jankbot/music/TikTokCmd";
import GramophoneThreadCmd from "./jankbot/tantamod/GramophoneThreadCmd";
import SayCmd from "./jankbot/tantamod/SayCmd";
import SetDjCmd from "./jankbot/tantamod/SetDJCmd";
import StarCmd from "./jankbot/tantamod/StarCmd";

export default function command_registry(bot: Bot): Command[] {
    return [
        new SetDjCmd(bot),
        new SlayCmd(bot),
        new SayCmd(bot),
        new TimeCmd(bot),
        new DurstCmd(bot),
        new LogoCmd(bot),
        new StarCmd(bot),
        new LeaveCmd(bot),
        new MSDiscordForum(bot),
        new JankmanCmd(bot),
        new GramophoneThreadCmd(bot),
        new TikTokCmd(bot),
        new CatCmd(bot),
        new ThreadCmd(bot),
        new XkcdCmd(bot),
        new FistchordCmd(bot),
        new FadeCmd(bot),
        new HelpCmd(bot),
        new SetVolumeCmd(bot),
        new UptimeCmd(bot),
        new MoveCmd(bot),
        new PauseCmd(bot),
        new RemoveSongCmd(bot),
    ]
}
