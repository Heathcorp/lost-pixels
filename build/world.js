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
const main_1 = require("./main");
class World {
    constructor() {
        this.populateDirectories();
        this.startIdleChunkSaving();
    }
    setPixel(position, colour) {
        const w = BigInt(main_1.CONFIG.chunkSize);
        // convert position to relative chunk position
        let x = position.x % w;
        let y = position.y % w;
        if (x < 0n)
            x += w;
        if (y < 0n)
            y += w;
        const relPos = new Point(x, y);
        position.chunk.setPixel(relPos, colour);
    }
    LoadSession(session) {
        session.events.on('close', () => {
            for (let chunk of session.area.chunks) {
                chunk.removeClient(session);
            }
        });
        session.events.on('setviewport', () => {
            // obtain a copy of the chunks within the new user viewport
            let chunks = new Set(session.area.chunks);
            for (let prevChunk of session.loadedChunks) {
                if (!chunks.has(prevChunk)) {
                    // stop chunk from being loaded as it is outside of the new viewport
                    prevChunk.removeClient(session);
                }
                else {
                    // chunk already loaded, no need to send it again
                    chunks.delete(prevChunk);
                }
            }
            for (let chunk of chunks) {
                session.sendChunk(chunk);
                chunk.addClient(session);
            }
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
    startIdleChunkSaving() {
        // semi-randomly save chunks just in case people don't ever leave the website and the server closes unexpectedly
        let i = 0;
        setInterval(() => {
            if (Chunk.allCurrentChunks.length > 0) {
                i = i % Chunk.allCurrentChunks.length;
                Chunk.allCurrentChunks[i].save();
                i++;
            }
        }, 100);
    }
}
exports.World = World;
const legacy = __importStar(require("./legacyWorld"));
class Chunk {
    constructor(chunkPos) {
        // perhaps too memory-intensive, TODO: find a more efficient way of doing this
        this.clients = new Set();
        this.loaded = false;
        this.buffer = Buffer.from('');
        this.coordinates = chunkPos;
        this.legacyChunks = [];
    }
    setPixel(position, colour) {
        // convert string into r g b components, here we can safely assume colour is a valid 6 digit hex rgb colour
        let cbuffer = Buffer.alloc(3);
        cbuffer[0] = parseInt(colour.substring(0, 2), 16);
        cbuffer[1] = parseInt(colour.substring(2, 4), 16);
        cbuffer[2] = parseInt(colour.substring(4, 6), 16);
        const bufferIndex = 3 * (Number(position.x) + main_1.CONFIG.chunkSize * Number(position.y));
        if (this.exists) {
            if (!this.loaded) {
                this.loadFromFile();
            }
            cbuffer.copy(this.buffer, bufferIndex);
            // yet to write back to file, do that when chunk unloads
        }
        else {
            this.loaded = true;
            this.doesExist = true;
            this.buffer = Buffer.alloc(main_1.CONFIG.chunkSize * main_1.CONFIG.chunkSize * 3, 0xff);
            cbuffer.copy(this.buffer, bufferIndex);
            this.writeToFile(); // first write to file for this new chunk
        }
        this.updateClients();
    }
    // call this every time a pixel changes to update clients with the changes
    updateClients() {
        for (let client of this.clients) {
            client.sendChunk(this);
        }
    }
    addClient(client) {
        this.clients.add(client);
    }
    removeClient(client) {
        this.clients.delete(client);
        if (this.clients.size === 0) {
            this.unload();
        }
    }
    unload() {
        if (this.loaded) {
            this.writeToFile();
            this.loaded = false;
            this.buffer = Buffer.from('');
        }
    }
    save() {
        if (this.loaded && this.exists) {
            this.writeToFile();
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
        // temporary until legacy migration is complete
        if (this.doesExist)
            return true;
        let legacyCheck = legacy.doesChunkExist(this);
        let newCheck = fs.existsSync(path.join(main_1.CONFIG.worldPath, this.file));
        return (this.doesExist
            || (this.doesExist = legacyCheck)
            || (this.doesExist = newCheck));
    }
    loadFromFile() {
        if (this.exists) {
            this.loaded = true;
            if (this.legacyChunks.length > 0) {
                this.buffer = legacy.loadFromFile(this);
                this.writeToFile();
                legacy.deleteLegacyChunks(this);
            }
            else {
                this.buffer = fs.readFileSync(path.join(main_1.CONFIG.worldPath, this.file));
            }
        }
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
        this.min = new Point(0n, 0n);
        this.max = new Point(0n, 0n);
        this.chunkCache = new Set();
        this.set(a, b);
    }
    set(a, b) {
        this.min.x = a.x;
        this.min.y = a.y;
        this.max.x = b.x;
        this.max.y = b.y;
        this.chunkCache.clear();
    }
    doesContain(point) {
        return (point.x >= this.min.x
            && point.x <= this.max.x
            && point.y >= this.min.y
            && point.y <= this.max.y);
    }
    get chunks() {
        if (this.chunkCache.size > 0)
            return this.chunkCache;
        const w = BigInt(main_1.CONFIG.chunkSize);
        for (let x = this.min.x; x < this.max.x + w; x += w) {
            for (let y = this.min.y; y < this.max.y + w; y += w) {
                this.chunkCache.add(new Point(x, y).chunk);
            }
        }
        return this.chunkCache;
    }
}
exports.Area = Area;
