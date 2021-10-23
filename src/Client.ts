import { IncomingMessage } from 'http';
import { AddressInfo } from 'net';
import { EventEmitter } from 'stream';
import * as WebSocket from 'ws';
import { Crypto } from './Crypto';
import { Database, User } from './Database';
import { Server } from './Server';

class Client extends EventEmitter {
    server: Server;
    ws: WebSocket;
    participantID: string;
    user: User;

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
            console.log(val);
        });

        this.ws = ws;
        this.bindEventListeners();
    }

    bindEventListeners() {
        this.ws.on('message', (data, isBinary) => {
            let d: any = data;

            if (isBinary) {
                d = data.toString();
            }
            
            try {
                let msgs = JSON.parse(d);
                if (typeof msgs !== 'object') return;
                for (let msg of msgs) {
                    console.log(msg.m);
                    this.emit(msg.m, msg);
                }
            } catch (err) {
                if (err) console.error(err);
            }
        });

        this.ws.on('close', () => {
            this.emit('bye');
        });

        this.once('hi', msg => { // TODO hi
            this.sendHiMessage();
        });

        this.on('bye', msg => { // TODO bye
            console.debug('deleting user ' + this.participantID);
            this.server.destroyClient(this.participantID);
        });

        this.on('ch', msg => { // TODO ch

        });

        this.on('n', (msg, admin) => { // TODO n

        });

        this.on('m', (msg, admin) => { // TODO m

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

    async getOwnParticipant() { // TODO getOwnParticipant
        return await Database.getPublicUser(this.user._id)
    }

    async sendHiMessage() {
        console.log('sending hi message');
        this.sendArray([{
            m: 'hi',
            motd: "galvanized saga",
            u: await this.getOwnParticipant(),
            v: '3.0'
        }]);
    }

    sendArray(msgarr: any[]) {
        console.log(msgarr);
        let json = JSON.stringify(msgarr);
        this.send(json);
    }

    send(json: string) {
        try {
            this.ws.send(json);
            console.log(json);
        } catch (err) {
            console.error(err);
        }
    }
}

export {
    Client
}
