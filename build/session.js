"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const events_1 = require("events");
class Session {
    constructor() {
        this.events = new events_1.EventEmitter();
    }
}
exports.Session = Session;
