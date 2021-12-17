import { EventEmitter } from "stream";
import { Client } from "./Client";
import { Database } from "./Database";
import { PublicUser, User } from "./models/User";
import { RateLimitChain } from "./RateLimit";
import { Server } from "./Server";

class Channel extends EventEmitter { // TODO channel
    server: Server;
    _id: string;
    settings: ChannelSettings;
    connectedClients: Client[];
    crown?: Crown;
    chatHistory: any[];

    constructor (server: Server, _id: string, set: any, p?: PublicUser, crownX?: number, crownY?: number) {
        super();

        this.server = server;
        this.connectedClients = [];
        server.channels.set(this._id, this);

        this._id = _id;
        this.settings = new ChannelSettings(set);

        if (this.isLobby()) {
            this.settings.lobby = true;
            let colors = Database.getDefaultLobbySettings();
            this.settings.color = colors.color;
            this.settings.color2 = colors.color2;
        } else {
            // TODO add crown to non-lobby rooms
            this.crown = new Crown(p._id, p.id, crownX || 50, crownY || 50);
        }

        this.chatHistory = [];
        
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
        this.applyQuota(cl);

        if (this.hasClient(cl)) {
            this.connectedClients[this.connectedClients.indexOf(this.connectedClients.find(c => c.user._id == cl.user._id))] = cl;
        } else {
            this.connectedClients.push(cl);
        }

        this.sendChannelMessageAll();
        cl.sendChatHistory(this.chatHistory);
    }

    removeClient(cl: Client) {
        this.connectedClients.splice(this.connectedClients.indexOf(cl), 1);
        // this.sendChannelMessageAll();
        this.sendByeMessageAll(cl.participantID);
    }

    hasClient(cl: Client): boolean {
        let p1 = cl.getOwnParticipant();
        for (let c of this.connectedClients) {
            let p2 = c.getOwnParticipant();
            if (p1._id == p2._id) {
                return true;
            }
        }
        return false;
    }

    sendChat(p: PublicUser, clmsg: any): void {
        // TODO chat quota
        let msg = {
            m: 'a',
            a: clmsg.message,
            p: p,
            t: Date.now()
        }

        this.chatHistory.push(msg);

        this.sendArray([msg]);
    }

    sendNoteMessage(p: PublicUser, clmsg: any): void {
        // TODO channel note messages

        for (let note of clmsg.n) {
            note.d = note.d ? note.d : 0;
        }

        // console.log(clmsg);

        let msg = {
            m: 'n',
            t: clmsg.t,
            n: clmsg.n,
            p: p.id
        }
        
        for (let cl of this.connectedClients) {
            if (cl.getOwnParticipant().id !== p.id) {
                cl.sendArray([msg]);
            }
        }
    }

    sendCursorPosition(p: User | PublicUser, x: number, y: number): void {
        let msg = {
            m: 'm',
            x: x,
            y: y,
            id: p.id
        }

        this.sendArray([msg]);
    }

    sendChannelMessageAll() {
        // console.log(this.server.channels);
        for (let cl of this.connectedClients) {
            cl.sendChannelMessage(this);
        }
    }

    sendByeMessageAll(id: string): void {
        this.sendArray([{
            m: 'bye',
            id: id
        }]);
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
            cl.sendArray(arr);
        }
    }

    sendUserUpdate(user: User | PublicUser, x?: number, y?: number) {
        for (let cl of this.connectedClients) {
            cl.sendParticipantMessage(user, {x: x, y: y});
        }
    }

    getParticipantList() {
        // console.log('getting participant list');
        let ppl = [];
        
        for (let cl of this.connectedClients) {
            if (!cl.getOwnParticipant()) continue;
            ppl.push(cl.getOwnParticipant());
        }

        // console.log('ppl: ', ppl);

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
    userId: string;
    participantId?: string;
    endPos: Vector2;
    startPos: Vector2;
    
    constructor (user_id: string, partid?: string, x?: number, y?: number) {
        this.userId = user_id;
        this.participantId = partid;

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
