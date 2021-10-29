"use strict";
exports.__esModule = true;
exports.WebSocketServer = void 0;
var WebSocket = require("ws");
var Client_1 = require("./Client");
var Crypto_1 = require("./Crypto");
var WebSocketServer = /** @class */ (function () {
    function WebSocketServer(server) {
        this.server = server;
        this.wss = new WebSocket.Server({
            noServer: true
        });
        this.bindEventListeners();
    }
    WebSocketServer.prototype.handleUpgrade = function (req, socket, head) {
        var _this = this;
        this.wss.handleUpgrade(req, socket, head, function (ws, req) {
            _this.wss.emit('connection', ws, req);
        });
    };
    WebSocketServer.prototype.bindEventListeners = function () {
        var _this = this;
        this.wss.on('connection', function (ws, req) {
            var id = Crypto_1.Crypto.getTempID();
            var cl = new Client_1.Client(_this.server, ws, req, id);
            _this.server.clients.set(Crypto_1.Crypto.getTempID(), cl);
        });
    };
    return WebSocketServer;
}());
exports.WebSocketServer = WebSocketServer;
