"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Point = exports.Chunk = exports.World = void 0;
const fs = require('fs');
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
        session.events.on('resize', () => {
        });
    }
}
exports.World = World;
class Chunk {
    constructor() {
        this.exists = false;
    }
    static fromPoint(point) {
        return new Chunk(); // temp
    }
}
exports.Chunk = Chunk;
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    get chunk() {
        return Chunk.fromPoint(this);
    }
}
exports.Point = Point;
