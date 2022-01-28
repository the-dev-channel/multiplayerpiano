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
        this.on('receive_userset', data => {
            let cl = this.findClientBy_ID(data.id);
            if (cl) Database.userset(cl.getOwnParticipant()._id, data.value);
        });

        this.on('channel_update', data => {
            // get subscribed client ids
            this.clients.forEach((cl, id) => {
                if (cl.subscribedToChannelList) {
                    cl.sendChannelListUpdate(false, [data]);
                }
            });
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

    findClientByID(id: string) {
        let foundClient: Client;

        this.clients.forEach((cl) => {
            if (id == cl.participantID) {
                foundClient = cl;
            }
        });

        return foundClient;
    }

    getChannelInfos() {
        let infos: any[] = [];
        this.channels.forEach((ch, id) => {
            infos.push(ch.getChannelProperties());
        });
        return infos;
    }

    start() {
        this.webServer = new WebServer(this);
        this.wsServer = new WebSocketServer(this);
        this.clients = new Map<string, Client>();
        this.channels = new Map<string, Channel>();
        // this.channelListSubscribers = [];

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
