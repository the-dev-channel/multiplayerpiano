import EventEmitter = require("events");
import { Channel } from "./Channel";
import { Client } from "./Client";
import { Crypto } from "./Crypto";
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

    findClientBy_ID(_id: string) {
        let foundClient: Client;

        this.clients.forEach((cl, id) => {
            if (_id == cl.user._id) {
                foundClient = cl;
            }
        });

        return foundClient;
    }

    start() {
        this.webServer = new WebServer(this);
        this.wsServer = new WebSocketServer(this);
        this.clients = new Map<string, Client>();

        Database.setup(this);

        this.bindEventListeners();
    }

    destroyClient(id: string) { //* finished
        this.clients.delete(id);
    }

    destroyChannel(_id: string) { //* finished
        this.channels.delete(_id);
    }

    generateNewUserID(cl: Client) {
        let newID = Crypto.getTempID();
        if (newID == cl.participantID) this.generateNewUserID(cl);
        this.clients.set(newID, cl);
        this.clients.delete(cl.participantID);
        cl.participantID = newID;
        return newID;
    }
}

export {
    Server
}
