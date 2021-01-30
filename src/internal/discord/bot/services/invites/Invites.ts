import { Client } from 'moyai-lib';
import Service from '../../lib/structures/service/Service';

export default class Invites extends Service {
    public constructor(client: Client) {
        super(client, {
            name: "invites",
            description: "Manage the invites with full detailed information.",
            premium: false,
            disabled: false,
            events: []
        });
    }
}