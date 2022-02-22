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
exports.Area = exports.Point = exports.Chunk = exports.World = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const events_1 = require("events");
const main_1 = require("./main");
class World {
    constructor() {
        this.loadedChunks = [];
        this.activeSessions = [];
        this.populateDirectories();
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
    populateDirectories() {
        if (!fs.existsSync(main_1.CONFIG.worldPath)) {
            fs.mkdirSync(main_1.CONFIG.worldPath);
        }
        const hex = "0123456789abcdef";
        for (let i = 0; i < 256; i++) {
            let p = path.join(main_1.CONFIG.worldPath, hex.charAt(Math.floor(i / 16)) + hex.charAt(i % 16));
            if (!fs.existsSync(p)) {
                fs.mkdir(p, () => null);
            }
        }
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
        let cbuffer = Buffer.alloc(3);
        cbuffer[0] = parseInt(colour.substring(0, 2), 16);
        cbuffer[1] = parseInt(colour.substring(2, 4), 16);
        cbuffer[2] = parseInt(colour.substring(4, 6), 16);
        const bufferIndex = Number(position.x) + main_1.CONFIG.chunkSize * Number(position.y);
        if (this.exists) {
            if (!this.loaded) {
                this.loadFromFile();
            }
            cbuffer.copy(this.buffer, bufferIndex);
            // yet to write back to file, do that when chunk unloads
        }
        else {
            this.loaded = true;
            this.buffer = Buffer.alloc(main_1.CONFIG.chunkSize * main_1.CONFIG.chunkSize * 3, 0xff);
            cbuffer.copy(this.buffer, bufferIndex);
            this.writeToFile(); // first write to file for this new chunk
        }
    }
    get file() {
        if (this.fileName) {
            return this.fileName;
        }
        let xs = this.coordinates.x.toString(16);
        let ys = this.coordinates.y.toString(16);
        let hash = crypto.createHash('sha1').update(xs + "," + ys).digest('hex');
        let objPath = path.join(hash.substring(0, 2), hash.substring(2));
        return (this.fileName = objPath);
    }
    get imageData() {
        if (!this.loaded) {
            this.loadFromFile();
        }
        return this.buffer.toString("base64");
    }
    get exists() {
        return this.doesExist || (this.doesExist = fs.existsSync(this.file));
    }
    loadFromFile() {
        this.loaded = true;
        this.buffer = fs.readFileSync(path.join(main_1.CONFIG.worldPath, this.file));
    }
    writeToFile() {
        fs.writeFileSync(path.join(main_1.CONFIG.worldPath, this.file), this.buffer);
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
        return Chunk.fromPoint(this);
    }
    equals(other) {
        return (other.x === this.x && other.y === this.y);
    }
    toObject() {
        return {
            x: this.x,
            y: this.y
        };
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
    get chunks() {
        const arr = [];
        const w = BigInt(main_1.CONFIG.chunkSize);
        for (let x = this.min.x; x < this.max.x; x += w) {
            for (let y = this.min.y; y < this.max.y; y += w) {
                arr.push(new Point(x, y).chunk);
            }
        }
        return arr;
    }
}
exports.Area = Area;
