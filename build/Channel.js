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
    Channel.prototype.tick = function () {
        if (this.connectedClients.length <= 0) {
            this.server.destroyChannel(this._id);
        }
    };
    Channel.prototype.bindEventListeners = function () {
        this.on('a', function (msg) {
        });
    };
    Channel.prototype.addClient = function (cl) {
        this.applyQuota(cl);
        if (this.hasClient(cl)) {
            this.connectedClients[this.connectedClients.indexOf(this.connectedClients.find(function (c) { return c.user._id == cl.user._id; }))] = cl;
        }
        else {
            this.connectedClients.push(cl);
        }
        this.sendChannelMessageAll();
    };
    Channel.prototype.removeClient = function (cl) {
        this.connectedClients.splice(this.connectedClients.indexOf(cl), 1);
        this.sendChannelMessageAll();
    };
    Channel.prototype.hasClient = function (cl) {
        var p1 = cl.getOwnParticipant();
        for (var _i = 0, _a = this.connectedClients; _i < _a.length; _i++) {
            var c = _a[_i];
            var p2 = c.getOwnParticipant();
            if (p1._id == p2._id) {
                return true;
            }
        }
        return false;
    };
    Channel.prototype.sendChat = function (p, clmsg) {
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
        for (var _b = 0, _c = this.connectedClients; _b < _c.length; _b++) {
            var cl = _c[_b];
            if (cl.getOwnParticipant().id !== p.id) {
                cl.sendArray([msg]);
            }
        }
    };
    Channel.prototype.sendCursorPosition = function (p, x, y) {
        var msg = {
            m: 'm',
            x: x,
            y: y,
            id: p._id
        };
        this.sendArray([msg]);
    };
    Channel.prototype.sendChannelMessageAll = function () {
        // console.log(this.server.channels);
        for (var _i = 0, _a = this.connectedClients; _i < _a.length; _i++) {
            var cl = _a[_i];
            cl.sendChannelMessage(this);
        }
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
        for (var _i = 0, _a = this.connectedClients; _i < _a.length; _i++) {
            var cl = _a[_i];
            cl.sendArray(arr);
        }
    };
    Channel.prototype.sendUserUpdate = function (user, cursorX, cursorY) {
        this.sendArray([{
                m: 'p',
                _id: user._id,
                name: user.name,
                color: user.color,
                id: user._id,
                x: cursorX,
                y: cursorY
            }]);
    };
    Channel.prototype.getParticipantList = function () {
        // console.log('getting participant list');
        var ppl = [];
        for (var _i = 0, _a = this.connectedClients; _i < _a.length; _i++) {
            var cl = _a[_i];
            if (!cl.getOwnParticipant())
                continue;
            ppl.push(cl.getOwnParticipant());
        }
        // console.log('ppl: ', ppl);
        return ppl;
    };
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
        this.startPos = {
            x: x || 50,
            y: 50
        };
        this.endPos = {
            x: 50,
            y: y || 50
        };
    }
    return Crown;
}());
