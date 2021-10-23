require('dotenv').config({
    encoding: 'utf-8',
    path: '.env'
});

const { Server } = require('./build');

const server = new Server();
server.start();
