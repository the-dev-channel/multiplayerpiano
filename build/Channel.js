"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.ChannelSettings = exports.Channel = void 0;
var stream_1 = require("stream");
var Database_1 = require("./Database");
var RateLimit_1 = require("./RateLimit");
var Channel = /** @class */ (function (_super) {
    __extends(Channel, _super);
    function Channel(server, _id, set, p, crownX, crownY) {
        var _this = _super.call(this) || this;
        _this.server = server;
        _this.connectedClients = [];
        if (typeof _id === 'undefined' || _id == 'undefined') {
            console.log('WARNING: _id is undefined');
        }
        _this._id = _id;
        _this.settings = new ChannelSettings(set);
        if (_this.isLobby()) {
            _this.settings.lobby = true;
            var colors = Database_1.Database.getDefaultLobbySettings();
            _this.settings.color = colors.color;
            _this.settings.color2 = colors.color2;
        }
        else {
            // TODO add crown to non-lobby rooms
            _this.crown = new Crown(p._id, p.id, crownX || 50, crownY || 50);
        }
        _this.chatHistory = [];
        _this.bindEventListeners();
        server.channels.set(_this._id, _this);
        return _this;
    }
    // getClient(_id) {
    //     return this.server.findClientBy_ID(_id);
    // }
    Channel.prototype.bindEventListeners = function () {
        var _this = this;
        this.on('update', function (msg) {
            _this.sendUpdate();
            clearTimeout(_this.destroyTimeout);
            if (_this.connectedClients.length <= 0) {
                _this.destroyTimeout = setTimeout(function () {
                    _this.server.destroyChannel(_this._id);
                }, 3000);
            }
        });
    };
    Channel.prototype.getChannelProperties = function () {
        return {
            settings: this.settings,
            _id: this._id,
            id: this._id,
            count: this.connectedClients.length,
            crown: this.crown ? this.crown : undefined
        };
    };
    Channel.prototype.setSettings = function (set) {
        this.settings = new ChannelSettings(set);
        this.emit('update');
    };
    Channel.prototype.sendUpdate = function () {
        // this.server.sendChannelUpdateIncomplete([this.getChannelProperties()]);
        this.server.emit('channel_update', this.getChannelProperties());
    };
    Channel.prototype.addClient = function (cl) {
        //this.applyQuota(cl);
        if (this.hasClient(cl)) {
            // console.log('already has client');
            // this.connectedClients.set(cl.getOwnParticipant()._id, cl);
            // cl.participantID = this.server.findClientBy_ID(cl.getOwnParticipant()._id).participantID;
            // find the old client ids and update them
            this.connectedClients.find(function (c) { return c._id == cl.getOwnParticipant()._id; }).id = cl.participantID;
        }
        else {
            // console.log('does not have client');
            this.connectedClients.push({
                id: cl.participantID,
                _id: cl.getOwnParticipant()._id
            });
        }
        // console.log(this.connectedClients);
        cl.emit("bye");
        cl.currentChannelID = this._id;
        this.sendChannelMessageAll();
        cl.sendChatHistory(this.chatHistory);
        this.emit('update');
    };
    Channel.prototype.removeClient = function (cl) {
        // this.connectedClients.delete(cl.getOwnParticipant()._id);
        // this.sendChannelMessageAll();
        // this.connectedClients.splice(this.connectedClients.indexOf(cl.getOwnParticipant()._id), 1);
        // this.sendByeMessageAll(cl.participantID);
        // remove the user's _id from the array
        // remove this user's _id from the connected clients array
        this.connectedClients.splice(this.connectedClients.indexOf({ _id: cl.getOwnParticipant()._id, id: cl.participantID }), 1);
        // console.log(this.connectedClients);
        this.sendChannelMessageAll();
        this.sendByeMessageAll(cl.participantID);
        this.emit('update');
    };
    Channel.prototype.hasClient = function (cl) {
        for (var _i = 0, _a = this.connectedClients; _i < _a.length; _i++) {
            var _b = _a[_i], _id = _b._id, id = _b.id;
            if (cl.participantID == id) {
                return true;
            }
        }
        return false;
    };
    Channel.prototype.sendChat = function (p, clmsg) {
        // TODO chat quota
        var msg = {
            m: 'a',
            a: clmsg.message,
            p: p,
            t: Date.now()
        };
        this.chatHistory.push(msg);
        this.sendArray([msg]);
    };
    Channel.prototype.sendNoteMessage = function (p, clmsg) {
        // TODO channel note messages
        for (var _i = 0, _a = clmsg.n; _i < _a.length; _i++) {
            var note = _a[_i];
            note.d = note.d ? note.d : 0;
        }
        // console.log(clmsg);
        var msg = {
            m: 'n',
            t: clmsg.t,
            n: clmsg.n,
            p: p.id
        };
        // this.connectedClients.forEach(_id => {
        //     let cl = this.server.findClientBy_ID(_id);
        //     if (cl.getOwnParticipant().id !== p.id) {
        //         cl.sendArray([msg]);
        //     }
        // });
        for (var _b = 0, _c = this.connectedClients; _b < _c.length; _b++) {
            var _d = _c[_b], _id = _d._id, id = _d.id;
            var cl = this.server.findClientByID(id);
            if (cl.participantID !== p.id) {
                cl.sendArray([msg]);
            }
        }
    };
    Channel.prototype.sendCursorPosition = function (p, x, y) {
        var msg = {
            m: 'm',
            x: x,
            y: y,
            id: p.id
        };
        this.sendArray([msg]);
    };
    Channel.prototype.sendChannelMessageAll = function () {
        var _this = this;
        // console.log("This is running.")
        this.connectedClients.forEach(function (_a) {
            var _id = _a._id, id = _a.id;
            // console.log(_id);
            var cl = _this.server.findClientByID(id);
            // if (cl.currentChannelID !== this._id) {
            // console.log('sendChannelMessageAll ' + cl.participantID, cl.getOwnParticipant()._id);
            // }
            cl.sendChannelMessage(_this);
        });
    };
    Channel.prototype.sendByeMessageAll = function (id) {
        this.sendArray([{
                m: 'bye',
                p: id
            }]);
    };
    Channel.prototype.applyQuota = function (cl) {
        var q = new RateLimit_1.RateLimitChain(2500, 800);
        var msg = q;
        msg.m = 'nq';
        cl.sendArray([msg]);
    };
    Channel.prototype.isLobby = function () {
        var reg = /^(lobby[0-9].*|test\/([A-z]{1,})|lobby$)/;
        return reg.test(this._id);
    };
    Channel.prototype.sendArray = function (arr) {
        // for (let cl of this.connectedClients) {
        //     cl.sendArray(arr);
        // }
        // this.connectedClients.forEach(_id => {
        //     let cl = this.server.findClientBy_ID(_id);
        //     cl.sendArray(arr);
        // });
        for (var _i = 0, _a = this.connectedClients; _i < _a.length; _i++) {
            var _b = _a[_i], _id = _b._id, id = _b.id;
            // console.log('id: ', id);
            var cl = this.server.findClientByID(id);
            // console.log(cl);
            // console.log(cl);
            if (cl.currentChannelID !== this._id)
                continue;
            cl.sendArray(arr);
        }
    };
    Channel.prototype.sendUserUpdate = function (user, x, y) {
        // for (let cl of this.connectedClients) {
        //     cl.sendParticipantMessage(user, {x: x, y: y});
        // }
        // this.connectedClients.forEach(_id => {
        //     let cl = this.server.findClientBy_ID(_id);
        //     cl.sendParticipantMessage(user, {x: x, y: y});
        // });
        for (var _i = 0, _a = this.connectedClients; _i < _a.length; _i++) {
            var _b = _a[_i], _id = _b._id, id = _b.id;
            var cl = this.server.findClientByID(id);
            cl.sendParticipantMessage(user, { x: x, y: y });
        }
    };
    Channel.prototype.getParticipantList = function () {
        // console.log('getting participant list');
        var ppl = [];
        for (var _i = 0, _a = this.connectedClients; _i < _a.length; _i++) {
            var _b = _a[_i], _id = _b._id, id = _b.id;
            var cl = this.server.findClientByID(id);
            if (!cl.getOwnParticipant())
                return;
            ppl.push(cl.getOwnParticipant());
        }
        // this.connectedClients.forEach(_id => {
        //     let cl = this.server.findClientBy_ID(_id);
        //     if (!cl.getOwnParticipant()) return;
        //     ppl.push(cl.getOwnParticipant());
        // });
        // console.log('ppl: ', ppl);
        return ppl;
    };
    return Channel;
}(stream_1.EventEmitter));
exports.Channel = Channel;
var ChannelSettings = /** @class */ (function () {
    function ChannelSettings(set, admin) {
        if (admin === void 0) { admin = false; }
        // set defaults
        var def = Database_1.Database.getDefaultChannelSettings();
        for (var _i = 0, _a = Object.keys(def); _i < _a.length; _i++) {
            var key = _a[_i];
            this[key] = def[key];
        }
        // set values
        for (var _b = 0, _c = Object.keys(set); _b < _c.length; _b++) {
            var key = _c[_b];
            if (typeof set[key] === ChannelSettings.VALID[key]) {
                if (ChannelSettings.ADMIN_ONLY.indexOf(key) !== -1) {
                    if (!admin)
                        continue;
                }
                this[key] = set[key];
            }
        }
    }
    ChannelSettings.VALID = {
        "lobby": "boolean",
        "visible": "boolean",
        "chat": "boolean",
        "crownsolo": "boolean",
        "no cussing": "boolean",
        "lyrical notes": "boolean",
        "color": function (val) {
            return typeof val === "string" && val.match(/^#[0-9a-f]{6}$/i);
        },
        "color2": function (val) {
            return typeof val === "string" && val.match(/^#[0-9a-f]{6}$/i);
        },
        "owner_id": "string"
    };
    ChannelSettings.ADMIN_ONLY = [
        "lobby",
        "owner_id",
        "lyrical notes"
    ];
    return ChannelSettings;
}());
exports.ChannelSettings = ChannelSettings;
var Crown = /** @class */ (function () {
    function Crown(user_id, partid, x, y) {
        this.userId = user_id;
        this.participantId = partid;
        this.time = Date.now();
        this.startPos = {
            x: 50,
            y: 50
        };
        this.endPos = {
            x: this.randomPos() || 50,
            y: y || 50
        };
    }
    Crown.prototype.randomPos = function () {
        return Math.floor(Math.random() * 10000) / 100;
    };
    return Crown;
}());
