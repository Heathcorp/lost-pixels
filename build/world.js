"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.World = void 0;
const fs = require('fs');
const crypto = require('crypto');
class World {
    constructor(directory) {
        this.loadedChunks = new Set();
        this.activeSessions = new Set();
    }
    SetPixel() {
    }
    LoadSession(session) {
        session.events.on('close', () => {
        });
        session.events.on('setviewport', () => {
        });
        session.events.on('setpixel', () => {
        });
    }
}
exports.World = World;
class Chunk {
    constructor() {
        this.exists = false;
        this.loaded = false;
    }
    static fromPoint(point) {
        return new Chunk(); // temp
    }
}
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    get chunk() {
        return Chunk.fromPoint(this);
    }
}
// defines a rectangular area of the canvas
class Area {
    constructor(a, b) {
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
