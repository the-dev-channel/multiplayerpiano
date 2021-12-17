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
exports.Client = void 0;
var stream_1 = require("stream");
var Channel_1 = require("./Channel");
var Crypto_1 = require("./Crypto");
var Database_1 = require("./Database");
var Client = /** @class */ (function (_super) {
    __extends(Client, _super);
    function Client(server, ws, req, id) {
        var _this = _super.call(this) || this;
        _this.server = server;
        _this.participantID = id;
        var _id = Crypto_1.Crypto.getUser_ID(req.socket.address().address);
        var user = Database_1.Database.getDefaultUser();
        user._id = _id;
        _this.user = user;
        _this.cursor = new Cursor(200, -200);
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
        });
        this.once('hi', function (msg) {
            _this.sendHiMessage();
            _this.restartIdleTimeout();
        });
        this.on('bye', function (msg) {
            var ch = _this.server.channels.get(_this.currentChannelID);
            if (ch) {
                ch.removeClient(_this);
            }
            _this.server.destroyClient(_this);
        });
        this.on('ch', function (msg) {
            // console.log('---ch debug---');
            // console.log(msg);
            if (!msg._id)
                return;
            // console.log('has _id')
            if (typeof msg._id !== 'string')
                return;
            // console.log('_id is string');
            var set = Database_1.Database.getDefaultChannelSettings();
            // console.log('got default settings');
            if (msg.set)
                set = msg.set; // TODO chset from ch
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
            var ch = _this.server.channels.get(_this.currentChannelID);
            var p = _this.getOwnParticipant();
            if (!ch && p._id)
                return;
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
            var ch = _this.server.channels.get(_this.currentChannelID);
            ch.sendChat(_this.getOwnParticipant(), msg);
        });
        this.on('userset', function (msg, admin) {
            if (!msg.set)
                return;
            if (typeof msg.set !== 'object')
                return;
            var _idToSet = _this.getOwnParticipant()._id;
            var ch = _this.server.channels.get(_this.currentChannelID);
            if (admin) {
                if (msg._id) {
                    if (typeof msg._id == 'string')
                        _idToSet = msg._id;
                }
            }
            try {
                Database_1.Database.getUser(_idToSet).then(function (user) {
                    if (msg.set.name) {
                        if (typeof msg.set.name == 'string')
                            user.name = msg.set.name;
                    }
                    // check color regex
                    if (msg.set.color) {
                        if (typeof msg.set.color == 'string') {
                            if (msg.set.color.match(/^#[0-9a-f]{6}$/i)) {
                                user.color = msg.set.color;
                            }
                        }
                    }
                    user.color = msg.set.color;
                    Database_1.Database.updateUser(_idToSet, user).then(function () {
                        var user = _this.getOwnParticipant();
                        ch.sendUserUpdate(user, _this.cursor.x, _this.cursor.y);
                    });
                });
            }
            catch (err) {
            }
        });
        this.on('chset', function (msg, admin) {
        });
        this.on('+ls', function (msg, admin) {
        });
        this.on('-ls', function (msg, admin) {
        });
        this.on('admin message', function (msg) {
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
    };
    Client.prototype.getOwnParticipant = function () {
        var u = this.user;
        // remember to 'clean' the user object
        delete u.flags;
        u.id = this.participantID;
        return u;
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
        var _this = this;
        // console.log('restarting idle timeout for ' + this.participantID);
        clearTimeout(this.idleTimeout);
        this.idleTimeout = setTimeout(function () {
            // console.log('idle timeout reached for ' + this.participantID);
            _this.emit('bye');
        }, 30000);
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
    Client.prototype.setChannel = function (_id, set) {
        // console.log('set channel called', this.server.channels);
        // check if server has channel
        if (!this.server.channels.get(_id)) {
            // console.log('channel does not exist, creating new channel');
            var ch = new Channel_1.Channel(this.server, _id, set, this.getOwnParticipant(), 50, this.cursor.y);
            ch.addClient(this);
            this.server.channels.set(_id, ch);
            return;
        }
        else {
            // console.log('channel exists');
            this.server.channels.get(_id).addClient(this);
        }
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
