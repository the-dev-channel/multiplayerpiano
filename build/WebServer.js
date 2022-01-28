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
exports.WebServer = void 0;
var express = require("express");
var https = require("https");
var http = require("http");
var path_1 = require("path");
var fs_1 = require("fs");
var util_1 = require("util");
var Database_1 = require("./Database");
var readFile = (0, util_1.promisify)(fs_1.readFile);
var MPP_HTTPS_ENABLED = process.env.MPP_HTTPS_ENABLED;
var MPP_HTTPS_PORT = process.env.MPP_HTTPS_PORT;
var MPP_HTTP_ENABLED = process.env.MPP_HTTP_ENABLED;
var MPP_HTTP_PORT = process.env.MPP_HTTP_PORT;
var MPP_KEY_PATH = process.env.MPP_KEY_PATH;
var MPP_CERT_PATH = process.env.MPP_CERT_PATH;
var MPP_START_DELAY = process.env.MPP_START_DELAY;
var WebServer = /** @class */ (function () {
    function WebServer(server) {
        this.server = server;
        this.startDelayed();
    }
    WebServer.prototype.startDelayed = function () {
        var _this = this;
        setTimeout(function () {
            _this.startServers();
        }, parseFloat(MPP_START_DELAY));
    };
    WebServer.prototype.startServers = function () {
        var _this = this;
        this.app = express();
        this.app.use(express.static('./static'));
        var router = express.Router();
        router.use(express.static('./sounds'));
        this.app.use('/sounds', router);
        this.app.get('*', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.server.wsServer.canConnect)
                            return [2 /*return*/];
                        _b = (_a = res).write;
                        return [4 /*yield*/, readFile((0, path_1.join)('static', 'index.html').toString())];
                    case 1:
                        _b.apply(_a, [_c.sent()]);
                        res.end();
                        return [2 /*return*/];
                }
            });
        }); });
        var enableHttps = MPP_HTTPS_ENABLED == "true";
        var enableHttp = MPP_HTTP_ENABLED == "true";
        if (enableHttps) {
            this.httpsServer = https.createServer({
                key: (0, fs_1.readFileSync)(MPP_KEY_PATH),
                cert: (0, fs_1.readFileSync)(MPP_CERT_PATH)
            }, this.app);
            this.httpsServer.on('upgrade', function (req, socket, head) {
                if (!Database_1.Database.ready) {
                    socket.end();
                }
                _this.server.wsServer.handleUpgrade(req, socket, head);
            });
            this.httpsServer.listen(MPP_HTTPS_PORT);
        }
        if (enableHttp) {
            this.httpServer = http.createServer(this.app);
            this.httpServer.on('upgrade', function (req, socket, head) {
                _this.server.wsServer.handleUpgrade(req, socket, head);
            });
            this.httpServer.listen(MPP_HTTP_PORT);
        }
    };
    return WebServer;
}());
exports.WebServer = WebServer;
