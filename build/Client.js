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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.Client = void 0;
var stream_1 = require("stream");
var WebSocket = require("ws");
var Channel_1 = require("./Channel");
var Crypto_1 = require("./Crypto");
var Database_1 = require("./Database");
var Client = /** @class */ (function (_super) {
    __extends(Client, _super);
    function Client(server, ws, req, id) {
        var _this = _super.call(this) || this;
        _this.server = server;
        _this.participantID = id;
        var _id = Crypto_1.Crypto.getUser_ID(req.socket.remoteAddress.substring('::ffff:'.length));
        var user = Database_1.Database.getDefaultUser();
        user._id = _id;
        _this.user = user;
        _this.cursor = new Cursor(200, -200);
        _this.rateLimits = new ClientRateLimits();
        _this.subscribedToChannelList = false;
        Database_1.Database.getUser(_id).then(function (val) {
            _this.user = val;
            _this.ws = ws;
            _this.bindEventListeners();
        });
        return _this;
    }
    Client.prototype.bindEventListeners = function () {
        var _this = this;
        this.ws.on('message', function (data, isBinary) {
            var d = data;
            if (isBinary) {
                d = data.toString();
            }
            try {
                var msgs = JSON.parse(d);
                if (typeof msgs !== 'object')
                    return;
                for (var _i = 0, msgs_1 = msgs; _i < msgs_1.length; _i++) {
                    var msg = msgs_1[_i];
                    _this.emit(msg.m, msg);
                }
            }
            catch (err) {
            }
        });
        this.ws.on('close', function () {
            _this.emit('bye');
            _this.server.destroyClient(_this);
        });
        this.once('hi', function (msg) {
            _this.sendHiMessage();
            _this.restartIdleTimeout();
        });
        this.on('bye', function (msg) {
            var ch = _this.getChannel();
            if (ch) {
                ch.removeClient(_this);
                // ch.emit('update');
            }
        });
        this.on('ch', function (msg) {
            if (_this.ws.readyState !== WebSocket.OPEN)
                return;
            // console.log('---ch debug---');
            // console.log(msg);
            if (!msg._id)
                return;
            // console.log('has _id')
            if (typeof msg._id !== "string")
                return;
            if (msg._id == _this.currentChannelID)
                return;
            // console.log('_id is string');
            var set = Database_1.Database.getDefaultChannelSettings();
            // console.log('got default settings');
            if (msg.set)
                set = msg.set;
            // console.log("set: ");
            // console.log(set);
            _this.setChannel(msg._id, set);
        });
        this.on('n', function (msg, admin) {
            // {
            //     m: 'n',
            //     t: 128429035891,
            //     n: [
            //         {
            //             n: "c3",
            //             v: 0.75
            //         },
            //         {
            //             n: 'c3',
            //             d: 100,
            //             s: 1
            //         }
            //     ]
            // }
            if (msg.t == null)
                msg.t = Date.now();
            // console.log("note: ", msg);
            // check properties
            if (!msg.n)
                return;
            // if (!msg.t) return;
            // check types
            // if (typeof msg.t !== 'number') return;
            // if ((msg.t && typeof msg.t !== 'number') || msg.t == null) msg.t = Date.now();
            if (!Array.isArray(msg.n))
                return;
            var ch = _this.getChannel();
            var p = _this.getOwnParticipant();
            if (!ch && p._id)
                return;
            // if (!admin) {
            //     if (!this.rateLimits.nq.attempt(msg.t)) return;
            // }
            if (ch.settings.crownsolo == true) {
                if (ch.crown.userId == p._id) {
                    // console.log(msg);
                    ch.sendNoteMessage(p, msg);
                }
            }
            else {
                // console.log(msg);
                ch.sendNoteMessage(p, msg);
            }
        });
        this.on('m', function (msg, admin) {
            if (!_this.rateLimits.m.attempt())
                return;
            _this.setCursorPosition(msg.x, msg.y);
        });
        this.on('t', function (msg) {
            _this.restartIdleTimeout();
            _this.sendTimeMessage(msg);
        });
        this.on('a', function (msg) {
            if (!msg.t)
                msg.t = Date.now();
            if (!msg.message)
                return;
            if (typeof msg.message !== 'string')
                return;
            if (!_this.rateLimits.a.attempt())
                return;
            var ch = _this.server.channels.get(_this.currentChannelID);
            ch.sendChat(_this.getOwnParticipant(), msg);
        });
        this.on('userset', function (msg, admin) {
            if (!msg.set)
                return;
            if (!msg.set.name && !msg.set.color)
                return;
            if (typeof msg.set.name !== 'string')
                return;
            if (msg.color && typeof msg.color !== 'string')
                return;
            if (msg.set.name.length > 40)
                return;
            var colorEnabled = false;
            var isAdmin = admin;
            if (colorEnabled && msg.set.color) {
                // check color regex
                if (!/^#[0-9a-f]{6}$/i.test(msg.set.color))
                    return;
            }
            _this.userset({ name: msg.set.name, color: msg.set.color }, isAdmin);
        });
        this.on('chset', function (msg, admin) {
            var _a;
            if (!msg.set)
                return;
            var ch = _this.getChannel();
            if (!admin && (((_a = ch.crown) === null || _a === void 0 ? void 0 : _a.userId) !== _this.getOwnParticipant()._id))
                return;
            ch.setSettings(msg.set, admin);
        });
        this.on('chown', function (msg, admin) {
            if (msg.id && typeof msg.id !== 'string')
                delete msg.id;
            var ch = _this.getChannel();
            ch.setCrown(_this.getOwnParticipant(), msg.id, admin);
        });
        this.on('+ls', function (msg, admin) {
            // this.subscribeToChannelList();
            _this.subscribedToChannelList = true;
            // console.log('subsribe to channel list');
            var chinfos = _this.server.getChannelInfos();
            _this.sendChannelListUpdate(true, chinfos);
        });
        this.on('-ls', function (msg, admin) {
            // this.unsubscribeFromChannelList();
            _this.subscribedToChannelList = false;
            // console.log('unsubscribe from channel list');
        });
        this.on('admin message', function (msg) {
            if (!msg.msg)
                return;
            if (!msg.password)
                return;
            if (msg.password !== Database_1.Database.adminPassword)
                return;
            if (typeof msg.msg !== 'object')
                return;
            _this.emit(msg.msg.m, msg.msg, true);
        });
        this.on('subscribe to admin stream', function (msg, admin) {
            if (!admin)
                return;
        });
        this.on('unsubscribe from admin stream', function (msg, admin) {
            if (!admin)
                return;
        });
        this.on('user_flag', function (msg, admin) {
            if (!admin)
                return;
        });
        this.on('color', function (msg, admin) {
            if (!admin)
                return;
            if (!msg.color)
                return;
            if (typeof msg.color !== 'string')
                return;
            if (!/^#[0-9a-f]{6}$/i.test(msg.color))
                return;
            var cl = msg._id ? _this.server.findClientBy_ID(msg._id) : _this;
            cl.userset({ color: msg.color }, admin);
        });
    };
    Client.prototype.getOwnParticipant = function () {
        var u = this.user;
        // remember to 'clean' the user object
        delete u.flags;
        u.id = this.participantID;
        return u;
    };
    Client.prototype.getChannel = function () {
        return this.server.channels.get(this.currentChannelID);
    };
    Client.prototype.sendHiMessage = function () {
        this.sendArray([{
                m: 'hi',
                motd: "galvanized saga",
                u: this.getOwnParticipant(),
                v: '3.0',
                t: Date.now()
            }]);
    };
    Client.prototype.sendTimeMessage = function (msg) {
        this.sendArray([{
                m: 't',
                t: Date.now(),
                e: msg ? msg.t ? msg.t : undefined : undefined
            }]);
    };
    Client.prototype.restartIdleTimeout = function () {
        // console.log('restarting idle timeout for ' + this.participantID);
        // clearTimeout(this.idleTimeout);
        // this.idleTimeout = setTimeout(() => {
        //     // console.log('idle timeout reached for ' + this.participantID);
        //     this.emit('bye');
        // }, 30000);
    };
    Client.prototype.sendArray = function (msgarr) {
        var json = JSON.stringify(msgarr);
        this.send(json);
    };
    Client.prototype.send = function (json) {
        try {
            this.ws.send(json);
        }
        catch (err) {
        }
    };
    Client.prototype.sendChannelListUpdate = function (complete, chinfos) {
        this.sendArray([{
                m: 'ls',
                c: complete,
                u: chinfos
            }]);
    };
    Client.prototype.setCursorPosition = function (x, y) {
        if (typeof x !== 'number' || typeof y !== 'number') {
            if (typeof x == 'string') {
                x = parseInt(x);
                if (isNaN(x))
                    return;
            }
            else {
                return;
            }
            if (typeof y == 'string') {
                y = parseInt(y);
                if (isNaN(y))
                    return;
            }
            else {
                return;
            }
        }
        this.cursor.x = x;
        this.cursor.y = y;
        var ch = this.server.channels.get(this.currentChannelID);
        if (ch) {
            ch.sendCursorPosition(this.getOwnParticipant(), x, y);
        }
    };
    Client.prototype.sendChatHistory = function (c) {
        this.sendArray([{
                m: 'c',
                c: c
            }]);
    };
    Client.prototype.userset = function (set, admin, _id) {
        if (admin === void 0) { admin = false; }
        return __awaiter(this, void 0, void 0, function () {
            var _idToGet, user, ch;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _idToGet = this.getOwnParticipant()._id;
                        if (admin && _id)
                            _idToGet = _id;
                        return [4 /*yield*/, Database_1.Database.getUser(_idToGet)];
                    case 1:
                        user = _a.sent();
                        if (!user)
                            return [2 /*return*/];
                        if (set.name)
                            user.name = set.name;
                        if (set.color && admin)
                            user.color = set.color;
                        return [4 /*yield*/, Database_1.Database.updateUser(_idToGet, user)];
                    case 2:
                        _a.sent();
                        this.user.name = user.name;
                        this.user.color = user.color;
                        ch = this.server.channels.get(this.currentChannelID);
                        if (ch) {
                            ch.sendUserUpdate(this.getOwnParticipant(), this.cursor.x, this.cursor.y);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    Client.prototype.setChannel = function (_id, set) {
        // console.log('set channel called', this.server.channels);
        // check if server has channel
        if (!this.server.channels.get(_id)) {
            //console.log('channel does not exist, creating new channel');
            var ch = new Channel_1.Channel(this.server, _id, set, this.getOwnParticipant(), 50, this.cursor.y);
            //console.log('channel debug'):;
            //console.log(ch);
            if (this.currentChannelID == ch._id)
                this.emit("bye");
            ch.addClient(this);
            this.server.channels.set(_id, ch);
            return;
        }
        // console.log('channel exists');
        this.emit("bye");
        this.server.channels.get(_id).addClient(this);
    };
    Client.prototype.sendChannelMessage = function (ch) {
        // console.log('sending channel message');
        var ppl = ch.getParticipantList();
        // console.log('ppl: ', ppl);
        var msg = {
            m: 'ch',
            ch: {
                settings: ch.settings,
                _id: ch._id,
                count: ch.connectedClients.length,
                crown: ch.crown
            },
            ppl: ppl,
            p: this.participantID
        };
        // console.log(msg);
        this.sendArray([msg]);
    };
    // subscribeToChannelList() { // TODO channel listing and subscribing
    //     this.server.setChannelListSubscriber(this.getOwnParticipant()._id);
    // }
    // unsubscribeFromChannelList() { // TODO channel listing and subscribing
    //     this.server.unsetChannelListSubscriber(this.getOwnParticipant()._id);
    // }
    Client.prototype.sendParticipantMessage = function (p, cursor) {
        var msg = {
            m: 'p',
            _id: p._id,
            name: p.name,
            color: p.color,
            id: p.id,
            x: cursor.x,
            y: cursor.y
        };
        this.sendArray([msg]);
    };
    Client.prototype.sendData = function (data) {
        data.m = 'data';
        this.sendArray([data]);
    };
    return Client;
}(stream_1.EventEmitter));
exports.Client = Client;
var ClientRateLimits = /** @class */ (function () {
    function ClientRateLimits() {
        var data = Database_1.Database.getDefaultClientRateLimits();
        for (var _i = 0, _a = Object.keys(data); _i < _a.length; _i++) {
            var key = _a[_i];
            this[key] = data[key];
        }
        // console.log('rate limit debug -----');
        // console.log(this);
    }
    return ClientRateLimits;
}());
var Cursor = /** @class */ (function () {
    function Cursor(x, y) {
        this.x = x;
        this.y = y;
    }
    return Cursor;
}());
