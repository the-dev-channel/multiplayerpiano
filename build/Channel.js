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
        _this.connectedClients = new Map();
        server.channels.set(_this._id, _this);
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
        return _this;
    }
    Channel.updateSubscribers = function () {
        this.subscribers.forEach(function (cl, participantId, map) {
            var list = [];
            cl.server.channels.forEach(function (channel, channelId, map) {
                list.push(channel.getChannelProperties());
            });
            console.log(list);
            cl.sendArray([{
                    m: 'ls',
                    c: true,
                    u: list
                }]);
        });
    };
    Channel.prototype.tick = function () {
        if (this.connectedClients.size <= 0) {
            this.server.destroyChannel(this._id);
        }
    };
    Channel.prototype.bindEventListeners = function () {
        this.on('a', function (msg) {
        });
    };
    Channel.prototype.getChannelProperties = function () {
        return {
            settings: this.settings,
            _id: this._id,
            id: this._id,
            count: this.connectedClients.size,
            crown: this.crown ? this.crown : undefined
        };
    };
    Channel.prototype.addClient = function (cl) {
        this.applyQuota(cl);
        if (this.hasClient(cl)) {
            // this.connectedClients.set(cl.getOwnParticipant()._id, cl);
            cl.participantID = this.connectedClients.get(cl.getOwnParticipant()._id).participantID;
        }
        else {
            this.connectedClients.set(cl.getOwnParticipant()._id, cl);
        }
        this.sendChannelMessageAll();
        cl.sendChatHistory(this.chatHistory);
    };
    Channel.prototype.removeClient = function (cl) {
        this.connectedClients["delete"](cl.getOwnParticipant()._id);
        // this.sendChannelMessageAll();
        this.sendByeMessageAll(cl.participantID);
    };
    Channel.prototype.hasClient = function (cl) {
        var p1 = cl.getOwnParticipant();
        var entries = this.connectedClients.entries();
        // for (let c of entries.next().value) {
        //     let p2 = c.getOwnParticipant();
        //     if (p1._id == p2._id) {
        //         return true;
        //     }
        // }
        this.connectedClients.forEach(function (cl, _id, map) {
            if (cl.user._id == _id) {
                return true;
            }
        });
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
        this.connectedClients.forEach(function (cl, _id, map) {
            if (cl.getOwnParticipant().id !== p.id) {
                cl.sendArray([msg]);
            }
        });
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
        // console.log(this.server.channels);
        this.connectedClients.forEach(function (cl, _id, map) {
            console.log('sendChannelMessageAllL ' + cl.participantID);
            cl.sendChannelMessage(_this);
        });
    };
    Channel.prototype.sendByeMessageAll = function (id) {
        this.sendArray([{
                m: 'bye',
                id: id
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
        this.connectedClients.forEach(function (cl, _id, map) {
            cl.sendArray(arr);
        });
    };
    Channel.prototype.sendUserUpdate = function (user, x, y) {
        // for (let cl of this.connectedClients) {
        //     cl.sendParticipantMessage(user, {x: x, y: y});
        // }
        this.connectedClients.forEach(function (cl, _id, map) {
            cl.sendParticipantMessage(user, { x: x, y: y });
        });
    };
    Channel.prototype.getParticipantList = function () {
        // console.log('getting participant list');
        var ppl = [];
        this.connectedClients.forEach(function (cl, _id, map) {
            if (!cl.getOwnParticipant())
                return;
            ppl.push(cl.getOwnParticipant());
        });
        // console.log('ppl: ', ppl);
        return ppl;
    };
    Channel.subscribers = new Map();
    return Channel;
}(stream_1.EventEmitter));
exports.Channel = Channel;
var ChannelSettings = /** @class */ (function () {
    function ChannelSettings(set) {
        var def = Database_1.Database.getDefaultChannelSettings();
        for (var _i = 0, _a = Object.keys(def); _i < _a.length; _i++) {
            var key = _a[_i];
            this[key] = def[key];
        }
        for (var _b = 0, _c = Object.keys(set); _b < _c.length; _b++) {
            var key = _c[_b];
            if (typeof set[key] === ChannelSettings.VALID[key]) {
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
