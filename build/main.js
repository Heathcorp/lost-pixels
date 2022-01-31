"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require('path');
const express = require('express');
const app = express();
require('express-ws')(app);
const world_1 = require("./world");
const session_1 = require("./session");
// serve all files in /public     (((((temporary}}}}}
app.use(express.static('public'));
app.listen(80);
const world = new world_1.World(path.join(__dirname, "../test_world"));
app.ws('/', (socket, req) => {
    // client connected
    let newSession = new session_1.Session(socket);
    world.LoadSession(newSession);
});
