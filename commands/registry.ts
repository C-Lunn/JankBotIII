import RadioCmd from "../gramophone/radio/cmd.ts";
import VoteskipCmd from "../gramophone/radio/voteskip.ts";
import type { Command } from "../interfaces/Command.ts";
import { Bot } from "../structs/Bot.ts";
import CatCmd from "./jankbot/general/CatCmd.ts";
import DurstCmd from "./jankbot/general/DurstCmd.ts";
import FistchordCmd from "./jankbot/general/FistchordCmd.ts";
import HelpCmd from "./jankbot/general/HelpCmd.ts";
import JankmanCmd from "./jankbot/general/JankmanCmd.ts";
import LogoCmd from "./jankbot/general/LogoCmd.ts";
import MSDiscordForum from "./jankbot/general/MSDiscordForum.ts";
import SlayCmd from "./jankbot/general/MSDiscordForum.ts";
import SetMessagePruningCmd from "./jankbot/general/SetMessagePruningCmd.ts";
import ThreadCmd from "./jankbot/general/ThreadTester.ts";
import TimeCmd from "./jankbot/general/TimeCmd.ts";
import UptimeCmd from "./jankbot/general/UptimeCmd.ts";
import XkcdCmd from "./jankbot/general/XckdCmd.ts";
import GramophoneCmd from "./jankbot/gramophone.ts";
import FadeCmd from "./jankbot/music/FadeCmd.ts";
import LeaveCmd from "./jankbot/music/LeaveCmd.ts";
import MoveCmd from "./jankbot/music/MoveCmd.ts";
import NowPlayingCmd from "./jankbot/music/NowPlayingCmd.ts";
import PauseCmd from "./jankbot/music/PauseCmd.ts";
import PingCmd from "./jankbot/music/PingCmd.ts";
import PlayCmd from "./jankbot/music/PlayCmd.ts";
import PlaylistCmd from "./jankbot/music/PlaylistCmd.ts";
import QueueCmd from "./jankbot/music/QueueCmd.ts";
import RemoveSongCmd from "./jankbot/music/RemoveSongCmd.ts";
import ResumeCmd from "./jankbot/music/ResumeCmd.ts";
import SearchCmd from "./jankbot/music/SearchCmd.ts";
import SetVolumeCmd from "./jankbot/music/SetVolume.ts";
import ShuffleCmd from "./jankbot/music/ShuffleCmd.ts";
import SkipCmd from "./jankbot/music/SkipCmd.ts";
import SkipToCmd from "./jankbot/music/SkipToCmd.ts";
import StopCmd from "./jankbot/music/StopCmd.ts";
import TikTokCmd from "./jankbot/music/TikTokCmd.ts";
import GramophoneThreadCmd from "./jankbot/tantamod/GramophoneThreadCmd.ts";
import SayCmd from "./jankbot/tantamod/SayCmd.ts";
import SetDjCmd from "./jankbot/tantamod/SetDJCmd.ts";
import StarCmd from "./jankbot/tantamod/StarCmd.ts";

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
        new NowPlayingCmd(bot),
        new PingCmd(bot),
        new PlayCmd(bot),
        new QueueCmd(bot),
        new PlaylistCmd(bot),
        new SetMessagePruningCmd(bot),
        new ResumeCmd(bot),
        new SearchCmd(bot),
        new ShuffleCmd(bot),
        new SkipToCmd(bot),
        new StopCmd(bot),
        new SkipCmd(bot),
        new GramophoneCmd(bot),
        new RadioCmd(bot),
        new VoteskipCmd(bot),
    ]
}
