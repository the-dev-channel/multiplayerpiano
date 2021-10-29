"use strict";
exports.__esModule = true;
exports.DataRateLimit = exports.RateLimitChain = exports.RateLimit = void 0;
var RateLimit = /** @class */ (function () {
    function RateLimit(interval_ms) {
        this._interval_ms = interval_ms || 0;
        this._after = 0;
    }
    RateLimit.prototype.attempt = function (time) {
        time = time || Date.now();
        if (time < this._after)
            return false;
        this._after = time + this._interval_ms;
        return true;
    };
    RateLimit.prototype.setInterval = function (interval_ms) {
        this._after += interval_ms - this._interval_ms;
        this._interval_ms = interval_ms;
    };
    return RateLimit;
}());
exports.RateLimit = RateLimit;
var RateLimitChain = /** @class */ (function () {
    function RateLimitChain(num, interval_ms) {
        this.setNumAndInterval(num, interval_ms);
    }
    RateLimitChain.prototype.attempt = function (time) {
        time = time || Date.now();
        for (var i = 0; i < this._chain.length; i++) {
            if (this._chain[i].attempt(time))
                return true;
        }
        return false;
    };
    RateLimitChain.prototype.setNumAndInterval = function (num, interval_ms) {
        this._chain = [];
        for (var i = 0; i < num; i++) {
            this._chain.push(new RateLimit(interval_ms));
        }
    };
    return RateLimitChain;
}());
exports.RateLimitChain = RateLimitChain;
var DataRateLimit = /** @class */ (function () {
    function DataRateLimit(limit, interval_ms) {
        this._limit = limit;
        this._interval_ms = interval_ms || 0;
        this._after = 0;
        this._size = 0;
    }
    DataRateLimit.prototype.attempt = function (size, time) {
        time = time || Date.now();
        if (time >= this._after) {
            this._size = 0;
            this._after = time + this._interval_ms;
        }
        if (this._size + size <= this._limit) {
            this._size += size;
            return true;
        }
        else {
            return false;
        }
    };
    return DataRateLimit;
}());
exports.DataRateLimit = DataRateLimit;
