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
        Database_1.Database.getUser(_id).then(function (val) {
            _this.user = val;
        });
        _this.ws = ws;
        _this.bindEventListeners();
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
        });
        this.on('bye', function (msg) {
            _this.server.destroyClient(_this.participantID);
        });
        this.on('ch', function (msg) {
            console.log('---ch debug---');
            console.log(msg);
            if (!msg._id)
                return;
            if (typeof msg._id !== 'string')
                return;
            var set = Database_1.Database.getDefaultChannelSettings();
            if (msg.set)
                set = msg.set; // TODO chset from ch
            _this.setChannel(msg._id, set);
        });
        this.on('n', function (msg, admin) {
        });
        this.on('m', function (msg, admin) {
        });
        this.on('t', function (msg) {
            _this.sendTime();
        });
        this.on('userset', function (msg, admin) {
            if (!msg.set)
                return;
            if (typeof msg.set !== 'object')
                return;
            var _idToSet;
            if (admin) {
                if (msg.id) {
                }
            }
            try {
            }
            catch (err) {
            }
        });
        this.on('chset', function (msg, admin) {
        });
        this.on('admin message', function (msg) {
        });
        this.on('subscribe to admin stream', function (msg, admin) {
        });
        this.on('user_flag', function (msg, admin) {
        });
    };
    Client.prototype.getOwnParticipant = function () {
        var u = this.user;
        delete u.flags;
        return u;
    };
    Client.prototype.sendHiMessage = function () {
        this.sendArray([{
                m: 'hi',
                motd: "galvanized saga",
                u: this.getOwnParticipant(),
                v: '3.0'
            }]);
    };
    Client.prototype.sendTime = function () {
        this.sendArray([{
                m: 't',
                e: Date.now()
            }]);
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
    Client.prototype.setChannel = function (_id, set) {
        console.log('set channel called');
        if (this.server.channels.has(_id)) {
            this.server.channels.get(_id).addClient(this);
        }
        else {
            var ch = new Channel_1.Channel(this.server, _id, set);
            ch.addClient(this);
        }
    };
    Client.prototype.sendChannelMessage = function (ch) {
        console.log('sending channel message');
        var msg = {
            m: 'ch',
            ch: {
                settings: ch.settings,
                _id: ch._id,
                count: ch.connectedClients.length,
                crown: ch.crown
            },
            ppl: ch.getParticipantList(),
            p: this.participantID
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
    }
    return ClientRateLimits;
}());
