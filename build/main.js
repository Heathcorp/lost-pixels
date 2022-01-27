"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require('path');
const express = require('express');
const app = express();
require('express-ws')(app);
const world_1 = require("./world");
// serve all files in /public     (((((temporary}}}}}
app.use(express.static('public'));
app.listen(80);
app.ws('/', (socket, req) => {
    console.log(typeof (socket), socket);
    // client connected
});
const world = new world_1.World(path.join(__dirname, "../test_world"));
console.log(path.join(__dirname, "../test_world"));
