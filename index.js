/**
 * Multiplayer Piano Server
 * Copyright (c) The Dev Channel 2020-2022
 * Licensed under the GPL v3.0 license
 * 
 * Entry point module
 */

require('dotenv').config({
    encoding: 'utf-8',
    path: '.env'
});

const { Server } = require('./build');

const server = new Server();
server.start();
