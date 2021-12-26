import { EventEmitter } from "stream";
import { Client } from "./Client";
import { Database } from "./Database";
import { PublicUser, User } from "./models/User";
import { RateLimitChain } from "./RateLimit";
import { Server } from "./Server";

class Channel extends EventEmitter { // TODO channel
    // static subscribers = new Map<string, string>();

    // static updateSubscribers(server) {
    //     this.subscribers.forEach((_id, participantId, map) => {
    //         let list = [];

    //         let cl = server.findClientBy_ID(_id);

    //         cl.server.channels.forEach((channel, channelId, map) => {
    //             list.push(channel.getChannelProperties());
    //         });

    //         console.log(list);
            
    //         cl.sendArray([{
    //             m: 'ls',
    //             c: true,
    //             u: list
    //         }]);

    //     });
    // }

    server: Server;
    _id: string;
    settings: ChannelSettings;
    connectedClients: {id: string, _id: string}[];
    crown?: Crown;
    chatHistory: any[];
    destroyTimeout: any;

    constructor (server: Server, _id: string, set: any, p?: PublicUser, crownX?: number, crownY?: number) {
        super();

        this.server = server;
        this.connectedClients = [];

        if (typeof _id === 'undefined' || _id == 'undefined') {
            console.log('WARNING: _id is undefined');
        }
        
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
        server.channels.set(this._id, this);
    }

    // getClient(_id) {
    //     return this.server.findClientBy_ID(_id);
    // }

    bindEventListeners() {
        this.on('update', msg => {
            this.sendUpdate();
            clearTimeout(this.destroyTimeout);
            if (this.connectedClients.length <= 0) {
                this.destroyTimeout = setTimeout(() => {
                    this.server.destroyChannel(this._id);
                }, 3000);
            }
        });
    }

    getChannelProperties() {
        return {
            settings: this.settings,
            _id: this._id,
            id: this._id,
            count: this.connectedClients.length,
            crown: this.crown ? this.crown : undefined
        }
    }

    setSettings(set) {
        this.settings = new ChannelSettings(set);
        this.emit('update');
    }

    sendUpdate() {
        // this.server.sendChannelUpdateIncomplete([this.getChannelProperties()]);
        this.server.emit('channel_update', this.getChannelProperties());
    }

    addClient(cl: Client) {
        //this.applyQuota(cl);

        if (this.hasClient(cl)) {
            // console.log('already has client');
            // this.connectedClients.set(cl.getOwnParticipant()._id, cl);
            // cl.participantID = this.server.findClientBy_ID(cl.getOwnParticipant()._id).participantID;
            
            // find the old client ids and update them
            this.connectedClients.find(c => c._id == cl.getOwnParticipant()._id).id = cl.participantID;
        } else {
            // console.log('does not have client');
            this.connectedClients.push({
                id: cl.participantID,
                _id: cl.getOwnParticipant()._id
            });
        }

        // console.log(this.connectedClients);
        cl.emit("bye");

        cl.currentChannelID = this._id;

        this.sendChannelMessageAll();
        cl.sendChatHistory(this.chatHistory);

        this.emit('update');
    }

    removeClient(cl: Client) {
        // this.connectedClients.delete(cl.getOwnParticipant()._id);
        // this.sendChannelMessageAll();
        // this.connectedClients.splice(this.connectedClients.indexOf(cl.getOwnParticipant()._id), 1);
        // this.sendByeMessageAll(cl.participantID);

        // remove the user's _id from the array
        // remove this user's _id from the connected clients array
        this.connectedClients.splice(this.connectedClients.indexOf({_id: cl.getOwnParticipant()._id, id: cl.participantID}), 1);
        // console.log(this.connectedClients);
        this.sendChannelMessageAll();

        this.sendByeMessageAll(cl.participantID);

        this.emit('update');
    }

    hasClient(cl: Client): boolean {
        for (let {_id, id} of this.connectedClients) {
            if (cl.participantID == id) {
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

        // this.connectedClients.forEach(_id => {
        //     let cl = this.server.findClientBy_ID(_id);
        //     if (cl.getOwnParticipant().id !== p.id) {
        //         cl.sendArray([msg]);
        //     }
        // });

        for (let {_id, id} of this.connectedClients) {
            let cl = this.server.findClientByID(id);
            if (cl.participantID !== p.id) {
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
        // console.log("This is running.")
        this.connectedClients.forEach(({_id, id}) => {
            // console.log(_id);
            let cl = this.server.findClientByID(id);
            // if (cl.currentChannelID !== this._id) {
                // console.log('sendChannelMessageAll ' + cl.participantID, cl.getOwnParticipant()._id);
            // }
            cl.sendChannelMessage(this);
        });
    }

    sendByeMessageAll(id: string): void {
        this.sendArray([{
            m: 'bye',
            p: id
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
        // for (let cl of this.connectedClients) {
        //     cl.sendArray(arr);
        // }

        // this.connectedClients.forEach(_id => {
        //     let cl = this.server.findClientBy_ID(_id);
        //     cl.sendArray(arr);
        // });

        for (let {_id, id} of this.connectedClients) {
            // console.log('id: ', id);
            let cl = this.server.findClientByID(id);
            // console.log(cl);
            // console.log(cl);
            if (cl.currentChannelID !== this._id) continue;
            cl.sendArray(arr);
        }
    }

    sendUserUpdate(user: User | PublicUser, x?: number, y?: number) {
        // for (let cl of this.connectedClients) {
        //     cl.sendParticipantMessage(user, {x: x, y: y});
        // }

        // this.connectedClients.forEach(_id => {
        //     let cl = this.server.findClientBy_ID(_id);
        //     cl.sendParticipantMessage(user, {x: x, y: y});
        // });

        for (let {_id, id} of this.connectedClients) {
            let cl = this.server.findClientByID(id);
            cl.sendParticipantMessage(user, {x: x, y: y});
        }
    }

    getParticipantList() {
        // console.log('getting participant list');
        let ppl = [];

        for (let {_id, id} of this.connectedClients) {
            let cl = this.server.findClientByID(id);
            if (!cl.getOwnParticipant()) return;
            ppl.push(cl.getOwnParticipant());
        }

        // this.connectedClients.forEach(_id => {
        //     let cl = this.server.findClientBy_ID(_id);
        //     if (!cl.getOwnParticipant()) return;
        //     ppl.push(cl.getOwnParticipant());
        // });

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

    static ADMIN_ONLY = [
        "lobby",
        "owner_id",
        "lyrical notes"
    ]

    constructor (set, admin: boolean = false) {
        // set defaults
        let def = Database.getDefaultChannelSettings();
        for (let key of Object.keys(def)) {
            this[key] = def[key];
        }

        // set values
        for (let key of Object.keys(set)) {
            if (typeof set[key] === ChannelSettings.VALID[key]) {
                if (ChannelSettings.ADMIN_ONLY.indexOf(key) !== -1) {
                    if (!admin) continue;
                }
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
    time: number;
    endPos: Vector2;
    startPos: Vector2;
    
    constructor (user_id: string, partid?: string, x?: number, y?: number) {
        this.userId = user_id;
        this.participantId = partid;
        this.time = Date.now();

        this.startPos = {
            x: 50,
            y: 50
        }

        this.endPos = {
            x: this.randomPos() || 50,
            y: y || 50
        }
    }


    randomPos(): number {
        return Math.floor(Math.random() * 10000) / 100;
    }
}

export {
    Channel,
    ChannelSettings
}
