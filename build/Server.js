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
exports.Server = void 0;
var EventEmitter = require("events");
var Database_1 = require("./Database");
var WebServer_1 = require("./WebServer");
var WebSocketServer_1 = require("./WebSocketServer");
var Server = /** @class */ (function (_super) {
    __extends(Server, _super);
    function Server() {
        return _super.call(this) || this;
    }
    Server.prototype.bindEventListeners = function () {
        this.on('receive_userset', function (data) { });
    };
    Server.prototype.findClient = function (_id) {
    };
    Server.prototype.start = function () {
        this.webServer = new WebServer_1.WebServer(this);
        this.wsServer = new WebSocketServer_1.WebSocketServer(this);
        this.clients = new Map();
        Database_1.Database.setup(this);
        this.bindEventListeners();
    };
    Server.prototype.destroyClient = function (id) {
        this.clients["delete"](id);
    };
    return Server;
}(EventEmitter));
exports.Server = Server;
