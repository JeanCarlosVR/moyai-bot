import { Client } from 'moyai-lib';
import Service from '../../lib/structures/service/Service';

export default class Tickets extends Service {
    public constructor(client: Client) {
        super(client, {
            name: "tickets",
            description: "Allow the creation of tickets for supprot or another type of communication between the staff and users.",
            premium: false,
            disabled: false,
            events: []
        });
    }
}