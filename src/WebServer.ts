import express = require('express');
import { Server } from './Server';
import https = require('https');
import http = require('http');
import { join } from 'path';
import { readFile as rf, readFileSync } from 'fs';
import { promisify } from 'util';
import { Database } from './Database';

const readFile = promisify(rf);

const MPP_HTTPS_ENABLED = process.env.MPP_HTTPS_ENABLED;
const MPP_HTTPS_PORT = process.env.MPP_HTTPS_PORT;

const MPP_HTTP_ENABLED = process.env.MPP_HTTP_ENABLED;
const MPP_HTTP_PORT = process.env.MPP_HTTP_PORT;

const MPP_KEY_PATH = process.env.MPP_KEY_PATH;
const MPP_CERT_PATH = process.env.MPP_CERT_PATH;

const MPP_START_DELAY = process.env.MPP_START_DELAY;

class WebServer {
    server: Server;
    app: express.Express;
    httpServer: http.Server;
    httpsServer: https.Server;

    constructor (server: Server) {
        this.server = server;
        this.startDelayed();
    }

    startDelayed() {
        setTimeout(() => {
            this.startServers();
        }, parseFloat(MPP_START_DELAY));
    }

    startServers() {
        this.app = express();
        this.app.use(express.static('./static'));

        let router = express.Router();
        router.use(express.static('./sounds'));

        this.app.use('/sounds', router);

        this.app.get('*', async (req, res) => {
            if (!this.server.wsServer.canConnect) return;
            res.write(await readFile(join('static', 'index.html').toString()));
            res.end();
        });

        let enableHttps = MPP_HTTPS_ENABLED == "true";
        let enableHttp = MPP_HTTP_ENABLED == "true";

        if (enableHttps) {
            this.httpsServer = https.createServer({
                key: readFileSync(MPP_KEY_PATH),
                cert: readFileSync(MPP_CERT_PATH)
            }, this.app);

            this.httpsServer.on('upgrade', (req, socket, head) => {
                if (!Database.ready) {
                    socket.end();
                }

                this.server.wsServer.handleUpgrade(req, socket, head);
            });

            this.httpsServer.listen(MPP_HTTPS_PORT);
        }

        if (enableHttp) {
            this.httpServer = http.createServer(this.app);

            this.httpServer.on('upgrade', (req, socket, head) => {
                this.server.wsServer.handleUpgrade(req, socket, head);
            });

            this.httpServer.listen(MPP_HTTP_PORT);
        }
    }
}

export {
    WebServer
}
