import * as fs from 'fs'
import * as path from 'path'

// load server configuration
export const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

const express = require('express');
const app = express();
require('express-ws')(app);

import { World } from './world'
import { Session } from './session'

// serve all files in ./build/client (((((temporary}}}}}
app.use(express.static('build/client'));
app.listen(3000);


const world = new World();
var sessionCount = 0;

app.ws('/', (socket: any, req: any) => {
    // client connected
    if (sessionCount >= CONFIG.maxSessions) {
        // refuse connection or place user in queue
    } else {
        sessionCount++;
        const newSession = new Session(socket);
        newSession.events.on('close', () => {
            sessionCount--;
        })
        world.LoadSession(newSession);
    }
})