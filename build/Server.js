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
var Crypto_1 = require("./Crypto");
var Database_1 = require("./Database");
var WebServer_1 = require("./WebServer");
var WebSocketServer_1 = require("./WebSocketServer");
var Server = /** @class */ (function (_super) {
    __extends(Server, _super);
    function Server() {
        return _super.call(this) || this;
    }
    Server.prototype.bindEventListeners = function () {
        var _this = this;
        this.on('receive_userset', function (data) {
            var cl = _this.findClientBy_ID(data.id);
            if (cl)
                Database_1.Database.userset(cl.getOwnParticipant()._id, data.value);
        });
    };
    Server.prototype.findClientBy_ID = function (_id) {
        var foundClient;
        this.clients.forEach(function (cl, id) {
            if (_id == cl.getOwnParticipant()._id) {
                foundClient = cl;
            }
        });
        return foundClient;
    };
    Server.prototype.start = function () {
        this.webServer = new WebServer_1.WebServer(this);
        this.wsServer = new WebSocketServer_1.WebSocketServer(this);
        this.clients = new Map();
        this.channels = new Map();
        Database_1.Database.setup(this);
        this.bindEventListeners();
    };
    Server.prototype.destroyClient = function (cl) {
        this.clients["delete"](cl.participantID);
    };
    Server.prototype.destroyClientByParticipantID = function (id) {
        this.clients["delete"](id);
    };
    Server.prototype.destroyChannel = function (_id) {
        this.channels["delete"](_id);
    };
    Server.prototype.generateNewUserID = function (cl) {
        var newID = Crypto_1.Crypto.getTempID();
        if (newID == cl.participantID)
            this.generateNewUserID(cl);
        this.clients.set(newID, cl);
        this.clients["delete"](cl.participantID);
        cl.participantID = newID;
        return newID;
    };
    return Server;
}(EventEmitter));
exports.Server = Server;
