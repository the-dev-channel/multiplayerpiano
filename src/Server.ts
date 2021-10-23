import EventEmitter = require("events");
import { Channel } from "./Channel";
import { Client } from "./Client";
import { Database } from "./Database";
import { WebServer } from "./WebServer";
import { WebSocketServer } from "./WebSocketServer";

class Server extends EventEmitter {
    webServer: WebServer;
    wsServer: WebSocketServer;
    channels: Map<string, Channel>;
    clients: Map<string, Client>;

    constructor () {
        super();
    }

    bindEventListeners() {
        this.on('receive_userset', data => {});
    }

    findClient(_id: string) {

    }

    start() {
        this.webServer = new WebServer(this);
        this.wsServer = new WebSocketServer(this);
        this.clients = new Map<string, Client>();

        Database.setup(this);

        this.bindEventListeners();
    }

    destroyClient(id: string) {
        this.clients.delete(id);
    }
}

export {
    Server
}
