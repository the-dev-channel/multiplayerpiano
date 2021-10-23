import { IncomingMessage } from "http";
import { Duplex } from "stream";
import { Server } from "./Server";
import WebSocket = require('ws');
import { Client } from './Client';
import { Crypto } from "./Crypto";
import { Socket } from "net";

class WebSocketServer {
    server: Server;
    wss: WebSocket.Server;

    constructor (server: Server) {
        this.server = server;

        this.wss = new WebSocket.Server({
            noServer: true
        });

        this.bindEventListeners();
    }

    handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer) {
        this.wss.handleUpgrade(req, (socket as Socket), head, (ws, req) => {
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
