/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Jean Vides. All rights reserved.
 *  See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import MoyaiLib from "moyai-lib";
import Bot from '../../../base/Bot';
import { inspect } from 'util'; 

export default class Cluster {

    protected shards;
    protected maxShards;
    protected firstShardID;
    protected lastShardID;
    protected mainFile: any;
    protected clusterID;
    protected clusterCount;
    protected guilds;
    protected users;
    protected uptime;
    protected exclusiveGuilds;
    protected largeGuilds;
    protected voiceChannels;
    protected shardsStats: any;
    protected app: any;
    protected client: any;
    protected test: any;

    protected ipc: any;

    public constructor() {
        this.shards = 0;
        this.maxShards = 0;
        this.firstShardID = 0;
        this.lastShardID = 0;
        this.mainFile = null;
        this.clusterID = 0;
        this.clusterCount = 0;
        this.guilds = 0;
        this.users = 0;
        this.uptime = 0;
        this.exclusiveGuilds = 0;
        this.largeGuilds = 0;
        this.voiceChannels = 0;
        this.shardsStats = [];
        this.app = null;
        this.client = null;
        this.test = false;

        console.log = (str: string) => process.send({ name: "log", msg: this.logOverride(str) });
        console.error = (str: string) => process.send({ name: "error", msg: this.logOverride(str) });
        console.warn = (str: string) => process.send({ name: "warn", msg: this.logOverride(str) });
        console.info = (str: string) => process.send({ name: "info", msg: this.logOverride(str) });
        console.debug = (str: string) => process.send({ name: "debug", msg: this.logOverride(str) });

    }

    public logOverride(message: any) {
        if (typeof message == 'object') return inspect(message);
        else return message;
    }

    public spawn() {
        process.on('uncaughtException', (err: any) => {
            process.send({ name: "error", msg: err.stack });
        });

        process.on('unhandledRejection', (reason: { stack: String }, p) => {

            process.send({ name: "error", msg: `Unhandled rejection at: Promise  ${p} reason:  ${reason.stack}` });
        });


        process.on("message", (msg: any) => {
            if (msg.name) {
                switch (msg.name) {
                    case "connect": {
                        this.firstShardID = msg.firstShardID;
                        this.lastShardID = msg.lastShardID;
                        this.mainFile = msg.file;
                        this.clusterID = msg.id;
                        this.clusterCount = msg.clusterCount;
                        this.shards = (this.lastShardID - this.firstShardID) + 1;
                        this.maxShards = msg.maxShards;

                        if (this.shards < 1) return;

                        if (msg.test) {
                            this.test = true;
                        }

                        this.connect(msg.firstShardID, msg.lastShardID, this.maxShards, msg.token, "connect", msg.clientOptions);

                        break;
                    }
                    case "stats": {
                        process.send({
                            name: "stats", stats: {
                                guilds: this.guilds,
                                users: this.users,
                                uptime: this.uptime,
                                ram: process.memoryUsage().rss,
                                shards: this.shards,
                                exclusiveGuilds: this.exclusiveGuilds,
                                largeGuilds: this.largeGuilds,
                                voice: this.voiceChannels,
                                shardsStats: this.shardsStats
                            }
                        });
                        
                        break;
                    }
                    case "fetchUser": {
                        if (!this.client) return;
                        let id = msg.value;
                        let user = this.client.users.get(id);
                        if (user) {
                            process.send({ name: "fetchReturn", value: user });
                        }

                        break;
                    }
                    case "fetchChannel": {
                        if (!this.client) return;
                        let id = msg.value;
                        let channel = this.client.getChannel(id);
                        if (channel) {
                            channel = channel.toJSON();
                            return process.send({ name: "fetchReturn", value: channel });
                        }

                        break;
                    }
                    case "fetchGuild": {
                        if (!this.client) return process.send({ name: "fetchReturn", value: { id: msg.value } });
                        let id = msg.value;
                        let guild = this.client.guilds.get(id);
                        if (guild && guild.id) {
                            guild = guild.toJSON();
                            process.send({ name: "fetchReturn", value: guild });
                        } else {
                            process.send({ name: "fetchReturn", value: { id: msg.value } });
                        }

                        break;
                    }
                    case "fetchMember": {
                        if (!this.client) return;
                        let [guildID, memberID] = msg.value;

                        let guild = this.client.guilds.get(guildID);
                        
                        if (guild) {
                            let member = guild.members.get(memberID);

                            if (member) {
                                member = member.toJSON();
                                process.send({ name: "fetchReturn", value: member });
                            }
                        }

                        break;
                    }
                    case "fetchReturn":
                        this.ipc.emit(msg.id, msg.value);
                        break;
                    case "restart":
                        process.exit(1);
                        break;
                }
            }
        });
    }

    public connect(firstShardID: number, lastShardID: number, maxShards: number, token: string, type: any, clientOptions: any) {
        process.send({ name: "log", msg: `Connecting with ${this.shards} shard(s)` });

        let options = { autoreconnect: true, firstShardID: firstShardID, lastShardID: lastShardID, maxShards: maxShards };
        let _options = Object.keys(options);
        _options.forEach(key => {
            delete clientOptions[key];
        });

        Object.assign(options, clientOptions);

        const client = MoyaiLib(token, options);
        this.client = client;

        client.on("connect", (id: any) => {
            process.send({ name: "log", msg: `Shard ${id} established connection!` });
        });

        client.on("shardDisconnect", (id: any) => {
            process.send({ name: "log", msg: `Shard ${id} disconnected!` });
            let embed = {
                description: `☠️ Shard ${id} is now offline.`,
                color: 0xFF0000
            }
            process.send({ name: "shard", embed: embed });
        });

        client.on("shardReady", (id: any) => {
            process.send({ name: "log", msg: `Shard ${id} is ready!` });
            let embed = {
                description: `🔨 Shard ${id} is now operating.`,
                color: 0x32FF00
            }
            process.send({ name: "shard", embed: embed });
        });

        client.on("shardResume", (id: any) => {
            process.send({ name: "log", msg: `Shard ${id} has resumed.` });
            let embed = {
                description: `⏸ Shard ${id} resumed.`,
                color: 0x008FFF
            }
            process.send({ name: "shard", embed: embed });
        });

        client.on("warn", (message: any, id: any) => {
            process.send({ name: "warn", msg: `Shard ${id} | ${message}` });
        });

        client.on("error", (error: any, id: any) => {
            process.send({ name: "error", msg: `Shard ${id} | ${error.stack}` });
        });

        client.once("ready", (id: any) => {
            this.loadCode(client);

            this.startStats(client);
        });

        client.on("ready", (id: any) => {
            process.send({ name: "log", msg: `Shards ${this.firstShardID} - ${this.lastShardID} are ready!` });

            process.send({ name: "shardsStarted" });
        });

        if (!this.test) {
            client.connect();
        } else {
            process.send({ name: "shardsStarted" });
            this.loadCode(client);
        }
    }

    public async loadCode(client: any) {
        this.app = new Bot(client, this.clusterID);
        this.app.launch();
        this.ipc = this.app.ipc;
    }

    public startStats(client: any) {
        setInterval(() => {
            let _shards = [];
            for(let shard of client.shards) {
                shard = shard[1]
                _shards.push({
                    id: shard.id,
                    ready: shard.ready,
                    latency: shard.latency,
                    status: shard.status
                });
            };

            this.guilds = client.guilds.size;
            this.users = client.users.size;
            this.uptime = client.uptime;
            this.voiceChannels = client.voiceConnections.size;
            this.largeGuilds = client.guilds.filter((g: any) => g.large).length;
            this.exclusiveGuilds = client.guilds.filter((g: any) => g.members.filter((m: any) => m.bot).length === 1).length;
            this.shardsStats = _shards;
        }, 1000 * 5);
    }
}