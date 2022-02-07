const path = require('path')
const fs = require('fs')

// load server configuration
export const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json')))

const express = require('express');
const app = express();
require('express-ws')(app);

import { World } from './world'
import { Session } from './session'

// serve all files in /public     (((((temporary}}}}}
app.use(express.static('public'));
app.listen(80);


const world = new World(path.join(__dirname, config.world_name))
var sessionCount = 0

app.ws('/', (socket: any, req: any) => {
    // client connected
    if (sessionCount >= config.max_sessions) {
        // refuse connection or place user in queue
    } else {
        sessionCount++
        const newSession = new Session(socket)
        newSession.events.on('close', () => {
            sessionCount--
        })
        world.LoadSession(newSession)
    }
})