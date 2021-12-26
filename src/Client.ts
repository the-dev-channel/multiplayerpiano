import { IncomingMessage } from 'http';
import { AddressInfo } from 'net';
import { EventEmitter } from 'stream';
import * as WebSocket from 'ws';
import { Channel, ChannelSettings } from './Channel';
import { Crypto } from './Crypto';
import { Database, User } from './Database';
import { PublicUser } from './models/User';
import { RateLimit, RateLimitChain } from './RateLimit';
import { Server } from './Server';

class Client extends EventEmitter {
    server: Server;
    ws: WebSocket;
    participantID: string;
    user: User;
    currentChannelID: string;
    rateLimits: ClientRateLimits;
    cursor: Cursor;
    idleTimeout: any;
    subscribedToChannelList: boolean;

    constructor (server: Server, ws: WebSocket, req: IncomingMessage, id: string) {
        super();
        this.server = server;
        this.participantID = id;

        let _id = Crypto.getUser_ID(req.socket.remoteAddress.substring('::ffff:'.length));

        let user: any = Database.getDefaultUser();
        user._id = _id;
        this.user = user;
        this.cursor = new Cursor(200, -200);

        this.rateLimits = new ClientRateLimits();
        this.subscribedToChannelList = false;
        
        Database.getUser(_id).then(val => {
            this.user = (val as User);
            this.ws = ws;
            this.bindEventListeners();
        });
    }

    bindEventListeners() { // TODO all event listeners
        this.ws.on('message', (data, isBinary) => {
            let d: any = data;

            if (isBinary) {
                d = data.toString();
            }
            
            try {
                let msgs = JSON.parse(d);
                if (typeof msgs !== 'object') return;
                for (let msg of msgs) {
                    this.emit(msg.m, msg);
                }
            } catch (err) {

            }
        });

        this.ws.on('close', () => { //* finshed
            this.emit('bye');
            this.server.destroyClient(this);
        });

        this.once('hi', msg => { //* finished
            this.sendHiMessage();
            this.restartIdleTimeout();
        });
        
        this.on('bye', msg => { //* finished
            let ch = this.getChannel();
            
            if (ch) {
                ch.removeClient(this);
                // ch.emit('update');
            }
        });

        this.on('ch', msg => { // TODO ch
            if (this.ws.readyState !== WebSocket.OPEN) return;
            // console.log('---ch debug---');
            // console.log(msg);
            if (!msg._id) return;
            // console.log('has _id')
            if (typeof msg._id !== "string") return;
            if (msg._id == this.currentChannelID) return;
            // console.log('_id is string');
            let set: ChannelSettings = Database.getDefaultChannelSettings();
            // console.log('got default settings');
            if (msg.set) set = msg.set; // TODO chset from ch
            // console.log("set: ");
            // console.log(set);
            this.setChannel(msg._id, set);
        });

        this.on('n', (msg, admin) => { // TODO n
            // {
            //     m: 'n',
            //     t: 128429035891,
            //     n: [
            //         {
            //             n: "c3",
            //             v: 0.75
            //         },
            //         {
            //             n: 'c3',
            //             d: 100,
            //             s: 1
            //         }
            //     ]
            // }

            
            if (msg.t == null) msg.t = Date.now();
            // console.log("note: ", msg);
            
            // check properties
            if (!msg.n) return;
            // if (!msg.t) return;
            
            // check types
            // if (typeof msg.t !== 'number') return;
            // if ((msg.t && typeof msg.t !== 'number') || msg.t == null) msg.t = Date.now();
            if (!Array.isArray(msg.n)) return;
            let ch: Channel = this.getChannel();
            
            let p = this.getOwnParticipant();
            
            if (!ch && p._id) return;

            // if (!admin) {
            //     if (!this.rateLimits.nq.attempt(msg.t)) return;
            // }

            if (ch.settings.crownsolo == true) {
                if (ch.crown.userId == p._id) {
                    // console.log(msg);
                    ch.sendNoteMessage(p, msg);
                }
            } else {
                // console.log(msg);
                ch.sendNoteMessage(p, msg);
            }
        });

        this.on('m', (msg, admin) => { // TODO m
            if (!this.rateLimits.m.attempt()) return;
            this.setCursorPosition(msg.x, msg.y);
        });

        this.on('t', msg => { //* finished
            this.restartIdleTimeout();
            this.sendTimeMessage(msg);
        });

        this.on('a', msg => { // TODO chat
            if (!msg.t) msg.t = Date.now();
            if (!msg.message) return;
            
            if (typeof msg.message !== 'string') return;

            if (!this.rateLimits.a.attempt()) return;

            let ch = this.server.channels.get(this.currentChannelID);
            ch.sendChat(this.getOwnParticipant(), msg);
        });

        this.on('userset', (msg, admin) => { // TODO userset
            if (!msg.set) return;
            if (!msg.set.name && !msg.set.color) return;
            if (typeof msg.set.name !== 'string') return;
            if (msg.color && typeof msg.color !== 'string') return;
            if (msg.set.name.length > 40) return;
            
            let colorEnabled = false;
            let isAdmin = false;
            if (colorEnabled && msg.set.color) {
                // check color regex
                if (!/^#[0-9a-f]{6}$/i.test(msg.set.color)) return;
            }

            this.userset({name: msg.set.name, color: msg.set.color}, isAdmin);
        });

        this.on('chset', (msg, admin) => { // TODO chset

        });

        this.on('+ls', (msg, admin) => { // TODO +ls
            // this.subscribeToChannelList();
            this.subscribedToChannelList = true;
            // console.log('subsribe to channel list');
            let chinfos = this.server.getChannelInfos();
            this.sendChannelListUpdate(true, chinfos);
        });
        
        this.on('-ls', (msg, admin) => { // TODO -ls
            // this.unsubscribeFromChannelList();
            this.subscribedToChannelList = false;
            // console.log('unsubscribe from channel list');
        });

        this.on('admin message', msg => { // TODO admin message
            if (!msg.msg) return;
            if (!msg.password) return;
            if (msg.password !== Database.adminPassword) return;
            if (typeof msg.msg !== 'object') return;
            this.emit(msg.msg.m, msg.msg, true);
        });

        this.on('subscribe to admin stream', (msg, admin) => { // TODO subscribe to admin stream
            if (!admin) return;
        });

        this.on('unsubscribe from admin stream', (msg, admin) => { // TODO unsubscribe from admin stream
            if (!admin) return;
        });

        this.on('user_flag', (msg, admin) => { // TODO user_flag
            if (!admin) return;

        });

        this.on('color', (msg, admin) => {
            if (!admin) return;
            if (!msg.color) return;
            if (typeof msg.color !== 'string') return;
            if (!/^#[0-9a-f]{6}$/i.test(msg.color)) return;
            let cl = msg._id ? this.server.findClientBy_ID(msg._id) : this;
            cl.userset({color: msg.color}, admin);
        });

        this.on('debug', () => { // TODO remove this
            // console.log(this.getChannel());
        });
    }

    getOwnParticipant(): PublicUser { //* finished
        let u = this.user;
        // remember to 'clean' the user object
        delete u.flags;
        u.id = this.participantID;
        return u;
    }

    getChannel(): Channel {
        return this.server.channels.get(this.currentChannelID);
    }

    sendHiMessage(): void { //* finished
        this.sendArray([{
            m: 'hi',
            motd: "galvanized saga",
            u: this.getOwnParticipant(),
            v: '3.0',
            t: Date.now()
        }]);
    }

    sendTimeMessage(msg?: any): void { //* finished
        this.sendArray([{
            m: 't',
            t: Date.now(),
            e: msg ? msg.t ? msg.t : undefined : undefined
        }]);
    }

    restartIdleTimeout() {
        // console.log('restarting idle timeout for ' + this.participantID);
        // clearTimeout(this.idleTimeout);
        // this.idleTimeout = setTimeout(() => {
        //     // console.log('idle timeout reached for ' + this.participantID);
        //     this.emit('bye');
        // }, 30000);
    }

    sendArray(msgarr: any[]) { //* finished
        let json = JSON.stringify(msgarr);
        this.send(json);
    }

    send(json: string) { //* finished
        try {
            this.ws.send(json);
        } catch (err) {
            
        }
    }

    sendChannelListUpdate(complete, chinfos) {
        this.sendArray([{
            m: 'ls',
            c: complete,
            u: chinfos
        }]);
    }

    setCursorPosition(x: number, y: number) {
        if (typeof x !== 'number' || typeof y !== 'number') {
            if (typeof x == 'string') {
                x = parseInt(x);
                if (isNaN(x)) return;
            } else {
                return;
            }
            if (typeof y == 'string') {
                y = parseInt(y);
                if (isNaN(y)) return;
            } else {
                return;
            }
        }

        this.cursor.x = x;
        this.cursor.y = y;
        
        let ch = this.server.channels.get(this.currentChannelID);
        if (ch) {
            ch.sendCursorPosition(this.getOwnParticipant(), x, y);
        }
    }

    sendChatHistory(c: any[]) {
        this.sendArray([{
            m: 'c',
            c: c
        }]);
    }

    async userset(set: any, admin: boolean = false, _id?: string) {
        let _idToGet = this.getOwnParticipant()._id;
        if (admin && _id) _idToGet = _id;
        let user = await Database.getUser(_idToGet);
        if (!user) return;
        if (set.name) user.name = set.name;
        if (set.color && admin) user.color = set.color;

        await Database.updateUser(_idToGet, user);

        this.user.name = user.name;
        this.user.color = user.color;

        let ch = this.server.channels.get(this.currentChannelID);
        if (ch) {
            ch.sendUserUpdate(this.getOwnParticipant(), this.cursor.x, this.cursor.y);
        }
    }

    setChannel(_id: string, set?: ChannelSettings) { // TODO setChannel
        // console.log('set channel called', this.server.channels);
        // check if server has channel
        if (!this.server.channels.get(_id)) {
            //console.log('channel does not exist, creating new channel');
            let ch = new Channel(this.server, _id, set, this.getOwnParticipant(), 50, this.cursor.y);
            //console.log('channel debug'):;
            //console.log(ch);
            if (this.currentChannelID == ch._id) this.emit("bye");
            ch.addClient(this);
            this.server.channels.set(_id, ch);
            return;
        }
        // console.log('channel exists');
        this.emit("bye");
        this.server.channels.get(_id).addClient(this);
    }

    sendChannelMessage(ch: Channel) {
        // console.log('sending channel message');
        let ppl = ch.getParticipantList();
        // console.log('ppl: ', ppl);
        let msg = {
            m: 'ch',
            ch: {
                settings: ch.settings,
                _id: ch._id,
                count: ch.connectedClients.length,
                crown: ch.crown
            },
            ppl: ppl,
            p: this.participantID
        }
        
        // console.log(msg);

        this.sendArray([msg]);
    }

    // subscribeToChannelList() { // TODO channel listing and subscribing
    //     this.server.setChannelListSubscriber(this.getOwnParticipant()._id);
    // }

    // unsubscribeFromChannelList() { // TODO channel listing and subscribing
    //     this.server.unsetChannelListSubscriber(this.getOwnParticipant()._id);
    // }

    sendParticipantMessage(p, cursor) {
        let msg = {
            m: 'p',
            _id: p._id,
            name: p.name,
            color: p.color,
            id: p.id,
            x: cursor.x,
            y: cursor.y
        }

        this.sendArray([msg]);
    }

    sendData(data) { // TODO admin data
        data.m = 'data';
        this.sendArray([data]);
    }
}

class ClientRateLimits {
    m: RateLimit;
    ch: RateLimit;
    chset: RateLimit;
    nq: RateLimitChain;
    t: RateLimit;
    a: RateLimitChain;

    constructor () {
        let data = Database.getDefaultClientRateLimits();

        for (let key of Object.keys(data)) {
            this[key] = data[key];
        }

        // console.log('rate limit debug -----');
        // console.log(this);
    }
}

class Cursor {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

interface Userset {
    name?: string;
    color?: string;
}

export {
    Client
}
