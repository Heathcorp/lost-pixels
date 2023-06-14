"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// load server configuration
exports.CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const express = require('express');
const app = express();
require('express-ws')(app);
const world_1 = require("./world");
const session_1 = require("./session");
// serve all files in /public     (((((temporary}}}}}
app.use(express.static('public'));
app.listen(3000);
const world = new world_1.World();
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
