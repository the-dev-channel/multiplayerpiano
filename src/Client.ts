import { IncomingMessage } from 'http';
import { AddressInfo } from 'net';
import { EventEmitter } from 'stream';
import * as WebSocket from 'ws';
import { Channel, ChannelSettings } from './Channel';
import { Crypto } from './Crypto';
import { Database, User } from './Database';
import { RateLimit, RateLimitChain } from './RateLimit';
import { Server } from './Server';

class Client extends EventEmitter {
    server: Server;
    ws: WebSocket;
    participantID: string;
    user: User;
    currentChannelID: string;
    rateLimits: ClientRateLimits;

    constructor (server: Server, ws: WebSocket, req: IncomingMessage, id: string) {
        super();
        this.server = server;
        this.participantID = id;

        let _id = Crypto.getUser_ID((req.socket.address() as AddressInfo).address);

        let user: any = Database.getDefaultUser();
        user._id = _id;
        this.user = user;
        
        Database.getUser(_id).then(val => {
            this.user = (val as User);
        });

        this.ws = ws;
        this.bindEventListeners();
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
        });

        this.once('hi', msg => { //* finished
            this.sendHiMessage();
        });

        this.on('bye', msg => { //* finished
            this.server.destroyClient(this.participantID);
        });

        this.on('ch', msg => { // TODO ch
            if (!msg._id) return;
            if (typeof msg._id !== 'string') return;
            let set: ChannelSettings = Database.getDefaultChannelSettings();
            if (msg.set) set = msg.set; // TODO chset from ch

            this.setChannel(msg._id, set);
        });

        this.on('n', (msg, admin) => { // TODO n
            
        });

        this.on('m', (msg, admin) => { // TODO m

        });

        this.on('t', msg => { //* finished
            this.sendTime();
        });

        this.on('userset', (msg, admin) => { // TODO userset
            if (!msg.set) return;
            if (typeof msg.set !== 'object') return;

            let _idToSet;

            if (admin) {
                if (msg.id) {

                }
            }

            try {

            } catch (err) {

            }
        });

        this.on('chset', (msg, admin) => { // TODO chset

        });

        this.on('admin message', msg => { // TODO admin message

        });

        this.on('subscribe to admin stream', (msg, admin) => { // TODO subscribe to admin stream

        });

        this.on('user_flag', (msg, admin) => { // TODO user_flag

        });
    }

    getOwnParticipant() { //* finished
        let u = this.user;
        delete u.flags;
        return u;
    }

    sendHiMessage() { //* finished
        this.sendArray([{
            m: 'hi',
            motd: "galvanized saga",
            u: this.getOwnParticipant(),
            v: '3.0'
        }]);
    }

    sendTime() { //* finished
        this.sendArray([{
            m: 't',
            e: Date.now()
        }]);
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

    setChannel(_id: string, set?: ChannelSettings) { // TODO setChannel
        if (this.server.channels.has(_id)) {
            this.server.channels.get(_id).addClient(this);
        } else {
            let ch = new Channel(this.server, _id, set);
        }
    }

    sendChannelMessage(ch: Channel) {
        let msg = {
            m: 'ch',
            ch: {
                settings: ch.settings,
                _id: ch._id,
                count: ch.connectedClients.length,
                crown: ch.crown
            },
            ppl: ch.getParticipantList(),
            p: this.participantID
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

    constructor () {
        let data = Database.getDefaultClientRateLimits();
        
        for (let key of Object.keys(data)) {
            this[key] = data[key];
        }
    }
}

export {
    Client
}
