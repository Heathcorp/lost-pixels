"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const events_1 = require("events");
const JSONb = require('json-bigint')({ useNativeBigInt: true });
const world_1 = require("./world");
class Session {
    constructor(socket) {
        this.events = new events_1.EventEmitter();
        this.socket = socket;
        // temp
        this.area = new world_1.Area(new world_1.Point(0n, 0n), new world_1.Point(0n, 0n));
        this.addListeners();
    }
    addListeners() {
        this.socket.on('message', (msg) => {
            msg = JSONb.parse(msg);
            // if isValid trips false at any point here then the client gets disconnected
            let isValid = false;
            if (isValid = i_message(msg)) {
                switch (msg.event) {
                    case 'setpixel':
                        if (isValid = i_setpixel(msg.data)) {
                            this.events.emit('setpixel', new world_1.Point(msg.data.position.x, msg.data.position.y), msg.data.colour);
                        }
                        break;
                    case 'setviewport':
                        if (isValid = i_setviewport(msg.data)) {
                            this.area.set(new world_1.Point(msg.data.a.x, msg.data.a.y), new world_1.Point(msg.data.b.x, msg.data.b.y));
                            this.events.emit('setviewport');
                        }
                        break;
                }
            }
            if (!isValid) {
                // client sent bad message, possibly malicious, disconnect them
                this.closeSession(1003);
            }
        });
        this.socket.on('close', () => {
            this.events.emit('close');
        });
    }
    closeSession(code) {
        this.socket.close(code);
        this.events.emit('close');
    }
    sendChunk(chunk) {
        this.socket.send(JSONb.stringify({
            event: "chunk",
            data: {
                position: chunk.coordinates.toObject(),
                image: chunk.imageData
            }
        }));
    }
}
exports.Session = Session;
// type guards:
function i_event(evt) {
    return (evt !== null && evt !== undefined
        && typeof evt === 'string'
        && (evt === "setpixel"
            || evt === "setviewport"
        // || evt === "" // add more here as API grows
        ));
}
function i_message(msg) {
    return (Object.entries(msg).length === 2
        && i_event(msg.event)
        && msg.data !== null && msg.data !== undefined
        && typeof msg.data === 'object');
}
function i_position(pos) {
    return (Object.entries(pos).length === 2
        && pos.x !== null && pos.x !== undefined
        && pos.x !== null && pos.x !== undefined
        && (typeof pos.x === 'bigint' || (typeof pos.x === 'number' && Number.isInteger(pos.x)))
        && (typeof pos.y === 'bigint' || (typeof pos.y === 'number' && Number.isInteger(pos.y))));
}
const regex = new RegExp('^[0-9a-f]{6}$'); // string must be exactly 6 digits of lowercase hex
function i_colour(col) {
    return (col !== null && col !== undefined
        && typeof col === 'string'
        && regex.test(col));
}
function i_setpixel(obj) {
    return (Object.entries(obj).length === 2
        && obj.position !== null && obj.position !== undefined
        && typeof obj.position === 'object'
        && i_position(obj.position)
        && i_colour(obj.colour));
}
function i_setviewport(obj) {
    return (Object.entries(obj).length === 2
        && obj.a !== null && obj.a !== undefined
        && obj.b !== null && obj.b !== undefined
        && typeof obj.a === 'object' && typeof obj.b === 'object'
        && i_position(obj.a) && i_position(obj.b)
        && obj.a.x < obj.b.x && obj.a.y < obj.b.y);
}
