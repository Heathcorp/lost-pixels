const path = require('path')

const express = require('express');
const app = express();
require('express-ws')(app);

import { Point, World, Chunk } from './world'
import { Session } from './session'

// serve all files in /public     (((((temporary}}}}}
app.use(express.static('public'));
app.listen(80);


const world = new World(path.join(__dirname, "../test_world"))

app.ws('/', (socket: any, req: any) => {
    // client connected
    let newSession = new Session(socket)
    world.LoadSession(newSession)
})