import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'


import { EventEmitter } from 'events'

import { Session } from './session'
import { CONFIG } from './main'

export class World {

    constructor() {
        this.populateDirectories();
        this.startIdleChunkSaving();
    }

    setPixel(position: Point, colour: string) {
        const w = BigInt(CONFIG.chunkSize);
        // convert position to relative chunk position
        let x = position.x % w;
        let y = position.y % w;
        if (x < 0n) x += w;
        if (y < 0n) y += w;

        const relPos = new Point(x, y);

        position.chunk.setPixel(relPos, colour);
    }

    LoadSession(session: Session) {
        session.events.on('close', () => {
            for (let chunk of session.area.chunks) {
                chunk.removeClient(session);
            }
        })
        
        session.events.on('setviewport', () => {
            // obtain a copy of the chunks within the new user viewport
            let chunks = new Set(session.area.chunks);

            for (let prevChunk of session.loadedChunks) {
                if (!chunks.has(prevChunk)) {
                    // stop chunk from being loaded as it is outside of the new viewport
                    prevChunk.removeClient(session);
                } else {
                    // chunk already loaded, no need to send it again
                    chunks.delete(prevChunk);
                }
            }
            
            for (let chunk of chunks) {
                session.sendChunk(chunk);
                chunk.addClient(session);
            }
        })

        session.events.on('setpixel', (position: Point, colour: string) => {
            this.setPixel(position, colour)
        })
    }

    private populateDirectories() {
        if (!fs.existsSync(CONFIG.worldPath)) {
            fs.mkdirSync(CONFIG.worldPath);
        }

        const hex = "0123456789abcdef"
        for (let i = 0; i < 256; i++) {
            let p = path.join(CONFIG.worldPath, hex.charAt(Math.floor(i / 16)) + hex.charAt(i % 16));
            if (!fs.existsSync(p)) {
                fs.mkdir(p, () => null);
            }
        }
    }

    private startIdleChunkSaving() {
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

import * as legacy from './legacyWorld'

export class Chunk {
    // legacy support
    legacyChunks: Array<legacy.legacyChunk>

    loaded: boolean
    private clients: Set<Session>

    private buffer: Buffer

    coordinates: Point

    private constructor(chunkPos: Point) {
        // perhaps too memory-intensive, TODO: find a more efficient way of doing this
        this.clients = new Set<Session>();

        this.loaded = false;
        this.buffer = Buffer.from('');

        this.coordinates = chunkPos;

        this.legacyChunks = [];

        this.batchingChanges = false;
    }

    public setPixel(position: Point, colour: string)
    {
        // convert string into r g b components, here we can safely assume colour is a valid 6 digit hex rgb colour
        let cbuffer = Buffer.alloc(3);
        cbuffer[0] = parseInt(colour.substring(0, 2), 16);
        cbuffer[1] = parseInt(colour.substring(2, 4), 16);
        cbuffer[2] = parseInt(colour.substring(4, 6), 16);

        const bufferIndex = 3 * (Number(position.x) + CONFIG.chunkSize * Number(position.y));

        if (this.exists) {
            if (!this.loaded) {
                this.loadFromFile();
            }
            cbuffer.copy(this.buffer, bufferIndex);
            // yet to write back to file, do that when chunk unloads
        } else {
            this.loaded = true;
            this.doesExist = true;
            this.buffer = Buffer.alloc(CONFIG.chunkSize * CONFIG.chunkSize * 3, 0xff);
            cbuffer.copy(this.buffer, bufferIndex);
            
            this.writeToFile(); // first write to file for this new chunk
        }

        this.updateClients();
    }

    private batchingChanges: boolean
    // call this every time a pixel changes to update clients with the changes
    private updateClients() {
        // kind of like a mutex
        if (!this.batchingChanges) {
            this.batchingChanges = true;

            // wait a bit before sending the changes to the clients
            setTimeout(() => {
                for (let client of this.clients) {
                    client.sendChunk(this);
                }
                this.batchingChanges = false;
            }, 100);
        }
    }
    
    public addClient(client: Session) {
        this.clients.add(client)
    }

    public removeClient(client: Session) {
        this.clients.delete(client)
        if (this.clients.size === 0) {
            this.unload();
        }
    }

    private unload() {
        if (this.loaded) {
            this.writeToFile();
            this.loaded = false;
            this.buffer = Buffer.from('');
        }
    }

    public save() {
        if (this.loaded && this.exists) {
            this.writeToFile();
        }
    }

    private fileName: string | undefined
    get file(): string {
        if (this.fileName) { return this.fileName }

        let xs = this.coordinates.x.toString(16)
        let ys = this.coordinates.y.toString(16)
        let hash = crypto.createHash('sha1').update(xs + "," + ys).digest('hex');

        let objPath = path.join(hash.substring(0, 2), hash.substring(2))

        return (this.fileName = objPath)
    }

    public get imageData(): string {
        if (!this.loaded) {
            this.loadFromFile()
        }
        return this.buffer.toString("base64")
    }

    private doesExist: boolean | undefined
    get exists(): boolean {
        // temporary until legacy migration is complete
        if (this.doesExist) return true;
        let legacyCheck = legacy.doesChunkExist(this);
        let newCheck = fs.existsSync(path.join(CONFIG.worldPath, this.file));
        return (this.doesExist
            || (this.doesExist = legacyCheck)
            || (this.doesExist = newCheck)
        )
    }

    private loadFromFile() {
        if (this.exists) {
            this.loaded = true
            if (this.legacyChunks.length > 0) {
                this.buffer = legacy.loadFromFile(this);
                this.writeToFile();
                legacy.deleteLegacyChunks(this);
            } else {
                this.buffer = fs.readFileSync(path.join(CONFIG.worldPath, this.file));
            }
        }
    }

    private writeToFile() {
        fs.writeFileSync(path.join(CONFIG.worldPath, this.file), this.buffer)
    }

    // static members
    static allCurrentChunks: Array<Chunk> = []
    static fromPoint(point: Point): Chunk {
        const w = BigInt(CONFIG.chunkSize)
        
        let cx = point.x / w
        let cy = point.y / w
        if (point.x < 0n) {
            cx = ((1n + point.x) / w) - 1n
        }
        if (point.y < 0n) {
            cy = ((1n + point.y) / w) - 1n
        }

        let cpos = new Point(cx, cy)

        let c = this.allCurrentChunks.find((value) => value.coordinates.equals(cpos))
        
        if (c) { return c }
        
        c = new Chunk(cpos)
        this.allCurrentChunks.push(c)
        return c
    }
}

export class Point {
    x: bigint
    y: bigint

    constructor(x: bigint, y: bigint) {
        this.x = BigInt(x)
        this.y = BigInt(y)
    }

    public get chunk(): Chunk {
        return Chunk.fromPoint(this)
    }

    equals(other: Point): boolean {
        return (other.x === this.x && other.y === this.y)
    }

    toObject(): object {
        return {
            x: this.x,
            y: this.y
        }
    }
}

// defines a rectangular area of the canvas
export class Area {
    min: Point
    max: Point

    constructor(a: Point, b: Point) {        
        this.min = new Point(0n, 0n);
        this.max = new Point(0n, 0n);

        this.chunkCache = new Set<Chunk>();

        this.set(a, b);
    }

    set(a: Point, b: Point) {
        this.min.x = a.x;
        this.min.y = a.y;
        this.max.x = b.x;
        this.max.y = b.y;

        this.chunkCache.clear();
    }

    doesContain(point: Point): boolean {
        return (point.x >= this.min.x
            && point.x <= this.max.x
            && point.y >= this.min.y
            && point.y <= this.max.y
        );
    }

    private chunkCache: Set<Chunk>
    get chunks(): Set<Chunk> {
        if (this.chunkCache.size > 0) return this.chunkCache;

        const w = BigInt(CONFIG.chunkSize);
        for (let x = this.min.x; x < this.max.x + w; x += w) {
            for (let y = this.min.y; y < this.max.y + w; y += w) {
                this.chunkCache.add(new Point(x, y).chunk);
            }
        }

        return this.chunkCache;
    }
}
