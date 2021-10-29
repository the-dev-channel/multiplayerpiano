"use strict";
exports.__esModule = true;
exports.Crypto = void 0;
var crypto = require("crypto");
var MPP_SALT = process.env.MPP_SALT;
var Crypto = /** @class */ (function () {
    function Crypto() {
    }
    Crypto.getTempID = function () {
        var hash = crypto.createHash('sha256');
        hash.update(Date.now().toFixed(2) + Math.random() * 25);
        return hash.digest('hex').substr(0, 24);
    };
    Crypto.getUser_ID = function (ipaddr) {
        var hash = crypto.createHash('sha256');
        hash.update(ipaddr + MPP_SALT);
        return hash.digest('hex').substr(0, 24);
    };
    Crypto.getColorFromID = function (_id) {
        var hash = crypto.createHash('sha256');
        hash.update("color" + _id);
        return "#" + hash.digest('hex').substring(0, 6);
    };
    return Crypto;
}());
exports.Crypto = Crypto;
