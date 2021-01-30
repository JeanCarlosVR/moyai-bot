import { Client } from 'moyai-lib';
import Command from "../../../lib/structures/Command";

export default class extends Command {
    public constructor(client: Client) {
        super(client, {
            name: "createticket",
            description: null,
            service: "tickets",
            aliases: ["ct"],
            usage: null,
            cooldown: {
                default: 10000,
                premium: 5000,
            },
            disabled: false,
            for_developers: false
        });
    }

    public async run() {
        
    }
}