import { Client } from 'moyai-lib';
import Command from "../../../lib/structures/Command";

export default class extends Command {
    public constructor(client: Client) {
        super(client, {
            name: "invites",
            description: "Show how much invites you have.",
            service: "invites",
            aliases: ["inv"],
            usage: null,
            cooldown: {
                default: 0,
                premium: 0,
            },
            disabled: false,
            for_developers: false
        });
    }

    public async run() {
        
    }
}