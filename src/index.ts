/**
 * Multiplayer Piano Server
 * Copyright (c) The Dev Channel 2020-2022
 * Licensed under the GPL v3.0 license
 * 
 * Export definition module
 */

module.exports = {
    Server: require('./Server').Server,
    Channel: require('./Channel').Channel,
    WebServer: require('./WebServer').WebServer,
    WebSocketServer: require("./WebSocketServer").WebSocketServer
}
