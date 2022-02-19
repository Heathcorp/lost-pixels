"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Area = exports.Point = exports.Chunk = exports.World = void 0;
const fs = require('fs');
const path = require('path');
const events_1 = require("events");
const main_1 = require("./main");
class World {
    constructor(directory) {
        this.loadedChunks = [];
        this.activeSessions = [];
    }
    setPixel(position, colour) {
        const w = BigInt(main_1.CONFIG.chunkSize);
        // convert position to relative chunk position
        let x = position.x % w;
        let y = position.y % w;
        if (x < 0n) {
            x += w;
        }
        if (y < 0n) {
            y += w;
        }
        const relPos = new Point(x, y);
        position.chunk.setPixel(relPos, colour);
    }
    LoadSession(session) {
        session.events.on('close', () => {
        });
        session.events.on('setviewport', () => {
        });
        session.events.on('setpixel', (position, colour) => {
            this.setPixel(position, colour);
        });
    }
}
exports.World = World;
class Chunk {
    constructor(chunkPos) {
        this.loaded = false;
        this.buffer = Buffer.from('');
        this.coordinates = chunkPos;
    }
    setPixel(position, colour) {
        // convert string into r g b components, here we can safely assume colour is a valid 6 digit hex rgb colour
        let cbuffer = Buffer.from([0x127, 0x127, 0x127]);
        let buffer = Buffer.alloc(main_1.CONFIG.chunkSize * main_1.CONFIG.chunkSize * 3);
        buffer.fill('\0');
        if (this.exists) {
        }
    }
    get file() {
        if (this.fileName) {
            return this.fileName;
        }
        // not sure how to name the files just yet, tbd
        // temporarily borrowing from the old codebase's way of doing it
        const crypto = require('crypto');
        // chunk hash = sha256(sha256(x) concat sha256(y))
        let xHash = crypto.createHash('sha256').update(this.coordinates.x.toString(16)).digest('hex');
        let yHash = crypto.createHash('sha256').update(this.coordinates.y.toString(16)).digest('hex');
        let hash = crypto.createHash('sha256').update(xHash + yHash).digest('hex');
        return (this.fileName = hash);
    }
    get exists() {
        return this.doesExist || (this.doesExist = fs.existsFileSync(this.file));
    }
    static fromPoint(point) {
        const w = BigInt(main_1.CONFIG.chunkSize);
        let cx = point.x / w;
        let cy = point.y / w;
        if (point.x < 0n) {
            cx = ((1n + point.x) / w) - 1n;
        }
        if (point.y < 0n) {
            cy = ((1n + point.y) / w) - 1n;
        }
        let cpos = new Point(cx, cy);
        let c = this.allCurrentChunks.find((value) => value.coordinates.equals(cpos));
        if (c) {
            return c;
        }
        c = new Chunk(cpos);
        this.allCurrentChunks.push(c);
        return c;
    }
}
exports.Chunk = Chunk;
// static members
Chunk.allCurrentChunks = [];
class Point {
    constructor(x, y) {
        this.x = BigInt(x);
        this.y = BigInt(y);
    }
    get chunk() {
        let c = Chunk.fromPoint(this);
        return c;
    }
    equals(other) {
        return (other.x === this.x && other.y === this.y);
    }
}
exports.Point = Point;
// defines a rectangular area of the canvas
class Area {
    constructor(a, b) {
        this.events = new events_1.EventEmitter();
        this.min = new Point(0n, 0n);
        this.max = new Point(0n, 0n);
        this.set(a, b);
    }
    set(a, b) {
        this.min.x = a.x;
        this.min.y = a.y;
        this.max.x = b.x;
        this.max.y = b.y;
    }
    doesContain(point) {
        return (point.x >= this.min.x
            && point.x <= this.max.x
            && point.y >= this.min.y
            && point.y <= this.max.y);
    }
}
exports.Area = Area;
