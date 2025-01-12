import { writeFile } from "fs";
import { Config } from "../../../interfaces/Config";
import { i18n } from "../../../utils/i18n";
import JankbotCmd, { JbMessage } from "../../../interfaces/JankbotCommand";
import { Bot } from "../../../structs/Bot";

export default class SetMessagePruningCmd extends JankbotCmd {
    constructor(public bot: Bot) {
        super();
        this.name = "pruning";
        this.description = i18n.__("pruning.description");
        this._is_tantamod = true;
    }

    async run(bot: Bot, message: JbMessage) {
        let config: Config | undefined;

        try {
            config = require("../config.json");
        } catch (error) {
            config = undefined;
            console.error(error);
        }

        if (config) {
            config.PRUNING = !config.PRUNING;

            writeFile("./config.json", JSON.stringify(config, null, 2), (err) => {

                if (err) {
                    console.log(err);
                    if (!message.channel.isSendable()) return;
                    return message.channel.send(i18n.__("pruning.errorWritingFile")).catch(console.error);
                }
                
                if (!message.channel.isSendable()) return;
                return message.channel
                    .send(
                        i18n.__mf("pruning.result", {
                            result: config!.PRUNING ? i18n.__("common.enabled") : i18n.__("common.disabled")
                        })
                    )
                    .catch(console.error);
            });
        }

    }
}
