import { EventEmitter } from "stream";
import { Client } from "./Client";
import { Server } from "./Server";

class Channel extends EventEmitter { // TODO channel
    server: Server;
    _id: string;
    settings: ChannelSettings;
    connectedClients: Client[];

    constructor (server: Server, _id: string) {
        super();

        this.server = server;

        this._id = _id;
        server.channels.set(this._id, this);

        this.bindEventListeners();
    }

    bindEventListeners() {
        this.on('a', msg => {

        });
    }

    addClient(cl: Client) {
        
    }

    isLobby(): boolean {
        let reg = /^(lobby[0-9].*|test\/([A-z]{1,})|lobby$)/;

        return reg.test(this._id);
    }
}

class ChannelSettings {
    crownsolo?: boolean;
    lobby: boolean;
    color: string;
    color2: string;
    "owner_id": string;
    "lyrical notes": boolean;

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

    constructor () {

    }

    static verify(settings) {
        let good = false;
        for (let i of Object.keys(settings)) {
            if (typeof settings[i] === ChannelSettings.VALID[i]) {
                
            }
        }
    }
}

class Crown {
    _id: string;
    id: string;
    
    constructor (user_id: string, partid: string) {
        this._id = user_id;
        this.id = partid;
    }
}

export {
    Channel,
    ChannelSettings
}
