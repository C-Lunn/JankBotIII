let config: any | undefined;

// Will try to import a file named customicons.json in the same folder
// its keys will override the default ones below
//
// example:
// {
//   "playhead": "arrow_forward:1056281422425497700"
// }

try {
    config = require("./customicons.json");
} catch (error) {
    config = undefined;
    console.error(`customicons.json not found, using default icons...`);
}

const icons = {
    playhead: "jankdacity:837717101866516501",
    gun: "gun_jankman:841050574996766770",
    pause: "pause_the_jank:897811963835478028",
    resume: "play_the_jank:897769624077205525",
    transparent: "transparent:1055955009403113492",
    ...config
};

export const icon = (name: keyof typeof icons) => `<:${icons[name]}>`;
