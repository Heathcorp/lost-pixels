"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Area = exports.Point = exports.Chunk = exports.World = void 0;
const fs = require('fs');
const path = require('path');
const main_1 = require("./main");
class World {
    constructor(directory) {
        this.loadedChunks = new Set();
        this.activeSessions = new Set();
    }
    SetPixel(position, colour) {
        const w = BigInt(main_1.config.chunk_size);
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
        position.chunk.SetPixel(relPos, colour);
    }
    LoadSession(session) {
        session.events.on('close', () => {
        });
        session.events.on('setviewport', () => {
        });
        session.events.on('setpixel', (position, colour) => {
            this.SetPixel(position, colour);
        });
    }
}
exports.World = World;
class Chunk {
    constructor(chunkPos) {
        this.exists = false;
        this.loaded = false;
        this.fileName = '';
        this.buffer = Buffer.from('');
        this.coordinates = chunkPos;
    }
    SetPixel(position, colour) {
        // convert string into r g b components, here we can safely assume colour is a valid 6 digit hex rgb colour
        let cbuffer = Buffer.from([0x127, 0x127, 0x127]);
        let buffer = Buffer.alloc(main_1.config.chunk_size * main_1.config.chunk_size * 3);
        buffer.fill('\0');
        if (this.loaded) {
        }
    }
    get file() {
        if (this.fileName !== '') {
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
    static fromPoint(point) {
        const w = BigInt(main_1.config.chunk_size);
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
        this.Set(a, b);
    }
    Set(a, b) {
        // maybe need some checks here but I think we can live without it for now
        this.min = a;
        this.max = b;
    }
    doesContain(point) {
        return (point.x >= this.min.x
            && point.x <= this.max.x
            && point.y >= this.min.y
            && point.y <= this.max.y);
    }
}
exports.Area = Area;
