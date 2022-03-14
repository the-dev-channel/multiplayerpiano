/**
 * Multiplayer Piano Server
 * Copyright (c) The Dev Channel 2020-2022
 * Licensed under the GPL v3.0 license
 * 
 * ID generator module
 */

import crypto = require('crypto');

const MPP_SALT = process.env.MPP_SALT;

class Crypto {
    static getTempID() {
        let hash = crypto.createHash('sha256');
        hash.update(Date.now().toFixed(2) + Math.random() * 25);
        return hash.digest('hex').substr(0, 24);
    }

    static getUser_ID(ipaddr: string) {
        let hash = crypto.createHash('sha256');
        hash.update(ipaddr + MPP_SALT);
        return hash.digest('hex').substr(0, 24);
    }

    static getColorFromID(_id: string) {
        let hash = crypto.createHash('sha256');
        hash.update("color" + _id);
        return "#" + hash.digest('hex').substring(0, 6);
    }
}

export {
    Crypto
}
