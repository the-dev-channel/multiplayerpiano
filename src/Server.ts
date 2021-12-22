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
    clients: Map<string, Client>; //! urgent - this should be the ONLY place to reference clients

    constructor () {
        super();
    }

    bindEventListeners() {
        this.on('receive_userset', data => {
            let cl = this.findClientBy_ID(data.id);
            if (cl) Database.userset(cl.getOwnParticipant()._id, data.value);
        });
    }

    findClientBy_ID(_id: string) {
        let foundClient: Client;

        this.clients.forEach((cl, id) => {
            if (_id == cl.getOwnParticipant()._id) {
                foundClient = cl;
            }
        });

        return foundClient;
    }

    start() {
        this.webServer = new WebServer(this);
        this.wsServer = new WebSocketServer(this);
        this.clients = new Map<string, Client>();
        this.channels = new Map<string, Channel>();

        Database.setup(this);

        this.bindEventListeners();
    }

    destroyClient(cl: Client) { //* finished
        this.clients.delete(cl.participantID);
    }

    destroyClientByParticipantID(id: string) {
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
