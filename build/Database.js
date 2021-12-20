"use strict";
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
exports.Database = void 0;
var mongodb_1 = require("mongodb");
var Crypto_1 = require("./Crypto");
var Color_1 = require("./Color");
var RateLimit_1 = require("./RateLimit");
var MPP_DEFAULT_USERNAME = process.env.MPP_DEFAULT_USERNAME || 'Anonymous';
var MPP_MONGO_URI = process.env.MPP_MONGO_URI;
var MPP_ADMIN_PASSWORD = process.env.MPP_ADMIN_PASSWORD;
var Database = /** @class */ (function () {
    function Database() {
    }
    Database.setup = function (server) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.server = server;
                        return [4 /*yield*/, this.client.connect()];
                    case 1:
                        _a.sent();
                        console.log('database connected');
                        this.db = this.client.db('multiplayerpiano');
                        this.userCollection = this.db.collection('users');
                        // this.changeStream = this.userCollection.watch({
                        //     fullDocument: 'updateLookup'
                        // } as any);
                        // this.changeStream.on('change', next => {
                        //     if (next.operationType == 'update') {
                        //         this.server.emit('receive_userset', next.updateDescription.updatedFields);
                        //     }
                        // });
                        this.ready = true;
                        return [2 /*return*/];
                }
            });
        });
    };
    Database.getUser = function (_id) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.ready)
                            return [2 /*return*/, {
                                    color: '#ffffff',
                                    name: MPP_DEFAULT_USERNAME,
                                    _id: _id,
                                    flags: {}
                                }];
                        return [4 /*yield*/, this.userExists(_id)];
                    case 1:
                        if (!((_a.sent()) == false)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.createUser(_id)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.userCollection.findOne({ _id: _id })];
                    case 4:
                        user = (_a.sent());
                        // console.log(user);
                        return [2 /*return*/, user];
                }
            });
        });
    };
    Database.getPublicUser = function (_id) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUser(_id)];
                    case 1:
                        user = (_a.sent());
                        // console.log(user);
                        return [2 /*return*/, {
                                name: user.name,
                                _id: user._id,
                                color: user.color
                            }];
                }
            });
        });
    };
    Database.userExists = function (_id) {
        return __awaiter(this, void 0, void 0, function () {
            var exists;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.userCollection.findOne({ _id: _id })];
                    case 1:
                        exists = (_a.sent()) !== null;
                        return [2 /*return*/, exists];
                }
            });
        });
    };
    Database.createUser = function (_id) {
        return __awaiter(this, void 0, void 0, function () {
            var color, user;
            return __generator(this, function (_a) {
                color = Crypto_1.Crypto.getColorFromID(_id);
                user = {
                    _id: _id,
                    name: MPP_DEFAULT_USERNAME,
                    color: color,
                    flags: {
                        "no chat rate limit": false
                    }
                };
                this.userCollection.insertOne(user);
                return [2 /*return*/];
            });
        });
    };
    Database.updateUser = function (_id, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.userCollection.updateOne({ _id: _id }, {
                    $set: data
                });
                this.server.emit('receive_userset', data);
                return [2 /*return*/];
            });
        });
    };
    Database.userset = function (_id, set) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.updateUser(_id, {
                    name: set.name
                });
                return [2 /*return*/];
            });
        });
    };
    Database.getDefaultUser = function () {
        return {
            name: MPP_DEFAULT_USERNAME,
            color: "#777"
        };
    };
    Database.getMOTD = function () {
        // let motd = "test";
        // return motd;
    };
    Database.getDefaultChannelSettings = function () {
        // console.log('getting default channel settings');
        var color = new Color_1.Color(59, 80, 84);
        // console.log('color1 got');
        var color2 = new Color_1.Color(color.toHexa());
        // console.log('color2 got');
        color2.add(-64, -64, -64);
        // console.log('color2 added');
        return {
            crownsolo: false,
            lobby: false,
            visible: true,
            color: color.toHexa(),
            color2: color2.toHexa(),
            chat: true
        };
    };
    Database.getDefaultLobbySettings = function () {
        var set = this.getDefaultChannelSettings();
        set.lobby = true;
        set.color = '#73b3cc';
        // set.color = "#677586";
        // let color2 = new Color(set.color);
        // color2.add(-64, -64, -64);
        // set.color2 = color2.toHexa();
        set.color2 = "#273546";
        return set;
    };
    Database.getDefaultClientRateLimits = function () {
        return {
            nq: new RateLimit_1.RateLimitChain(8000, 24000),
            m: new RateLimit_1.RateLimit(1000 / 20),
            ch: new RateLimit_1.RateLimit(1000),
            chset: new RateLimit_1.RateLimit(1500),
            t: new RateLimit_1.RateLimit(20)
        };
    };
    Database.client = new mongodb_1.MongoClient(MPP_MONGO_URI);
    Database.ready = false;
    Database.adminPassword = MPP_ADMIN_PASSWORD;
    return Database;
}());
exports.Database = Database;
