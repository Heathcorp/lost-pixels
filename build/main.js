"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
const path = require('path');
const fs = require('fs');
// load server configuration
exports.CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json')));
const express = require('express');
const app = express();
require('express-ws')(app);
const world_1 = require("./world");
const session_1 = require("./session");
// serve all files in /public     (((((temporary}}}}}
app.use(express.static('public'));
app.listen(80);
const world = new world_1.World(path.join(__dirname, exports.CONFIG.worldName));
var sessionCount = 0;
app.ws('/', (socket, req) => {
    // client connected
    if (sessionCount >= exports.CONFIG.maxSessions) {
        // refuse connection or place user in queue
    }
    else {
        sessionCount++;
        const newSession = new session_1.Session(socket);
        newSession.events.on('close', () => {
            sessionCount--;
        });
        world.LoadSession(newSession);
    }
});
