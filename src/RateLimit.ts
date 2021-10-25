class RateLimit {
    _interval_ms: number;
    _after: number;

    constructor (interval_ms?: number) {
        this._interval_ms = interval_ms || 0;
        this._after = 0;
    }

    attempt(time: number) {
        time = time || Date.now();
        if (time < this._after) return false;
        this._after = time + this._interval_ms;
        return true;
    }

    setInterval(interval_ms: number) {
        this._after += interval_ms - this._interval_ms;
        this._interval_ms = interval_ms;
    }
}

class RateLimitChain {
    _chain: RateLimit[];

    constructor (num: number, interval_ms: number) {
        this.setNumAndInterval(num, interval_ms);
    }

    attempt(time: number) {
        time = time || Date.now();

        for (let i = 0; i < this._chain.length; i++) {
            if (this._chain[i].attempt(time)) return true;
        }

        return false;
    }
    
    setNumAndInterval(num: number, interval_ms: number) {
        this._chain = [];
        for (let i = 0; i < num; i++) {
            this._chain.push(new RateLimit(interval_ms));
        }
    }
}

class DataRateLimit {
    _limit: number;
    _interval_ms: number;
    _after: number;
    _size: number;

    constructor (limit: number, interval_ms: number) {
        this._limit = limit;
        this._interval_ms = interval_ms || 0;
        this._after = 0;
        this._size = 0;
    }

    attempt (size: number, time: number) {
        time = time || Date.now();

        if (time >= this._after) {
            this._size = 0;
            this._after = time + this._interval_ms;
        }

        if (this._size + size <= this._limit) {
            this._size += size;
            return true;
        } else {
            return false;
        }
    }
}

export {
    RateLimit,
    RateLimitChain,
    DataRateLimit
}
