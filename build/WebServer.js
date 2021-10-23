"use strict";
exports.__esModule = true;
exports.WebServer = void 0;
var express = require("express");
var https = require("https");
var http = require("http");
var MPP_HTTPS_ENABLED = process.env.MPP_HTTPS_ENABLED;
var MPP_HTTPS_PORT = process.env.MPP_HTTPS_PORT;
var MPP_HTTP_ENABLED = process.env.MPP_HTTP_ENABLED;
var MPP_HTTP_PORT = process.env.MPP_HTTP_PORT;
var WebServer = /** @class */ (function () {
    function WebServer(server) {
        this.server = server;
        this.startServers();
    }
    WebServer.prototype.startServers = function () {
        var _this = this;
        this.app = express();
        this.app.use(express.static('./static'));
        var router = express.Router();
        router.use(express.static('./sounds'));
        this.app.use('/sounds', router);
        var enableHttps = MPP_HTTPS_ENABLED == "true";
        var enableHttp = MPP_HTTP_ENABLED == "true";
        if (enableHttps) {
            this.httpsServer = https.createServer({
                key: 'placeholder',
                cert: 'placeholder' //! TODO fix placeholders
            }, this.app);
            this.httpsServer.on('upgrade', function (req, socket, head) {
                _this.server.wsServer.handleUpgrade(req, socket, head);
            });
            this.httpsServer.listen(MPP_HTTP_PORT);
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
