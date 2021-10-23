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
exports.Channel = void 0;
var stream_1 = require("stream");
var Channel = /** @class */ (function (_super) {
    __extends(Channel, _super);
    function Channel(server, _id) {
        var _this = _super.call(this) || this;
        _this.server = server;
        _this._id = _id;
        server.channels.set(_this._id, _this);
        _this.bindEventListeners();
        return _this;
    }
    Channel.prototype.bindEventListeners = function () {
        this.on('a', function (msg) {
        });
    };
    Channel.prototype.addClient = function (cl) {
    };
    Channel.prototype.isLobby = function () {
        var reg = /^(lobby[0-9].*|test\/([A-z]{1,})|lobby$)/;
        return reg.test(this._id);
    };
    return Channel;
}(stream_1.EventEmitter));
exports.Channel = Channel;
var ChannelSettings = /** @class */ (function () {
    function ChannelSettings() {
    }
    return ChannelSettings;
}());
var Crown = /** @class */ (function () {
    function Crown(user_id, partid) {
        this._id = user_id;
        this.id = partid;
    }
    return Crown;
}());
