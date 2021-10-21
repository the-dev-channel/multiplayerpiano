require('dotenv').config({
    debug: false,
    encoding: 'utf-8',
    path: '.env'
});

const MPP_PORT = process.env.MPP_PORT;

console.log(MPP_PORT);

const MPP = require('./build');

MPP.Server.start();
