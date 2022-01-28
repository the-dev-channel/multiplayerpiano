import { IncomingMessage } from "http";
import { Duplex } from "stream";
import { Server } from "./Server";
import WebSocket = require('ws');
import { Client } from './Client';
import { Crypto } from "./Crypto";
import { Socket } from "net";

const MPP_START_DELAY = process.env.MPP_START_DELAY;

class WebSocketServer {
    server: Server;
    wss: WebSocket.Server;
    canConnect: boolean;
    delayTime: number;

    constructor (server: Server) {
        this.server = server;
        this.canConnect = false;

        this.wss = new WebSocket.Server({
            noServer: true
        });

        this.bindEventListeners();
        this.startDelayed();
    }

    startDelayed() {
        setTimeout(() => {
            this.start();
        }, parseFloat(MPP_START_DELAY));
    }

    start() {
        this.canConnect = true;
    }

    handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer) {
        // if (!this.canConnect) {
        //     socket.end(() => {
        //         socket.destroy();
        //     });
        // }
        this.wss.handleUpgrade(req, (socket as Socket), head, (ws, req) => {
            if (!this.canConnect) {
                ws.close();
                return;
            }
            this.wss.emit('connection', ws, req);
        });
    }

    bindEventListeners() {
        this.wss.on('connection', (ws, req) => {
            let id = Crypto.getTempID();
            let cl = new Client(this.server, ws, req, id);
            this.server.clients.set(Crypto.getTempID(), cl);
        });
    }
}

export {
    WebSocketServer
}
