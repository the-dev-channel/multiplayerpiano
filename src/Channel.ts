import { EventEmitter } from "stream";
import { Client } from "./Client";
import { Database } from "./Database";
import { RateLimitChain } from "./RateLimit";
import { Server } from "./Server";

class Channel extends EventEmitter { // TODO channel
    server: Server;
    _id: string;
    settings: ChannelSettings;
    connectedClients: Client[];
    crown?: Crown;

    constructor (server: Server, _id: string, set: any) {
        super();

        this.server = server;
        server.channels.set(this._id, this);

        this._id = _id;
        this.settings = new ChannelSettings(set);

        if (!this.isLobby()) {
            // TODO add crown to non-lobby rooms
        }
        
        this.bindEventListeners();
    }

    tick() {
        if (this.connectedClients.length <= 0) {
            this.server.destroyChannel(this._id);
        }
    }

    bindEventListeners() {
        this.on('a', msg => {

        });
    }

    addClient(cl: Client) {
        this.applyQuota(cl); // apply quota
        
        // send channel data

        cl.sendChannelMessage(this);

        if (this.hasClient(cl)) return; // check if user already in room

        this.connectedClients.push(cl);
    }

    hasClient(cl: Client) {
        let has = this.connectedClients.find(c => cl.user._id == c.user._id) == undefined;
        return typeof has !== 'undefined';
    }

    applyQuota(cl: Client) {
        let q = new RateLimitChain(2500, 800);
        let msg: any = q;
        msg.m = 'nq';
        cl.sendArray([msg]);
    }

    isLobby(): boolean {
        let reg = /^(lobby[0-9].*|test\/([A-z]{1,})|lobby$)/;

        return reg.test(this._id);
    }

    sendArray(arr: any[]) {
        for (let cl of this.connectedClients) {
            this.sendArray(arr);
        }
    }

    getParticipantList() {
        let ppl = [];

        for (let cl of this.connectedClients) {
            if (!cl.user) continue;
            ppl.push(cl.user);
        }

        return ppl;
    }
}

class ChannelSettings {
    crownsolo?: boolean;
    lobby?: boolean;
    color?: string;
    color2?: string;
    "owner_id"?: string;
    "lyrical notes"?: boolean;

    static VALID = {
        "lobby": "boolean",
        "visible": "boolean",
        "chat": "boolean",
        "crownsolo": "boolean",
        "no cussing": "boolean",
        "lyrical notes": "boolean",
        "color": function(val) {
            return typeof val === "string" && val.match(/^#[0-9a-f]{6}$/i);
        },
        "color2": function(val) {
            return typeof val === "string" && val.match(/^#[0-9a-f]{6}$/i);
        },
        "owner_id": "string"
    };

    constructor (set) {
        let def = Database.getDefaultChannelSettings();
        for (let key of Object.keys(def)) {
            this[key] = def[key];
        }

        for (let key of Object.keys(set)) {
            if (typeof set[key] === ChannelSettings.VALID[key]) {
                this[key] = set[key];
            }
        }
    }
}

type Vector2 = {
    x: number,
    y: number
}

class Crown {
    _id: string;
    id: string;
    endPos: Vector2;
    startPos: Vector2;
    
    constructor (user_id: string, partid: string, x?: number, y?: number) {
        this._id = user_id;
        this.id = partid;

        this.startPos = {
            x: x || 50,
            y: 50
        }

        this.endPos = {
            x: 50,
            y: y || 50
        }
    }
}

export {
    Channel,
    ChannelSettings
}
