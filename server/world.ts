import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'


import { EventEmitter } from 'events'

import { Session } from './session'
import { CONFIG } from './main'

export class World {
    loadedChunks: Array<Chunk>
    activeSessions: Array<Session>

    constructor(directory: string) {
        this.loadedChunks = []
        this.activeSessions = []
    }

    setPixel(position: Point, colour: string) {
        const w = BigInt(CONFIG.chunkSize)
        // convert position to relative chunk position
        let x = position.x % w
        let y = position.y % w
        if (x < 0n) { x += w }
        if (y < 0n) { y += w }

        const relPos = new Point(x, y)

        position.chunk.setPixel(relPos, colour)
    }

    LoadSession(session: Session) {
        session.events.on('close', () => {

        })
        
        session.events.on('setviewport', () => {
            
        })

        session.events.on('setpixel', (position: Point, colour: string) => {
            this.setPixel(position, colour)
        })
    }
}

export class Chunk {
    loaded: boolean

    private buffer: Buffer

    coordinates: Point

    private constructor(chunkPos: Point) {
        this.loaded = false
        this.buffer = Buffer.from('')

        this.coordinates = chunkPos
    }

    public setPixel(position: Point, colour: string)
    {
        // convert string into r g b components, here we can safely assume colour is a valid 6 digit hex rgb colour
        let cbuffer = Buffer.from([0x7f, 0x7f, 0x7f]) // temporary

        const bufferIndex = Number(position.x + CONFIG.chunkSize * position.y)

        if (this.exists) {
            if (!this.loaded) {
                this.loadFromFile()
            }
            cbuffer.copy(this.buffer, bufferIndex)
            // yet to write back to file, do that when chunk unloads
        } else {
            this.loaded = true
            this.buffer = Buffer.alloc(CONFIG.chunkSize * CONFIG.chunkSize * 3, 0xff)
            cbuffer.copy(this.buffer, bufferIndex)
            
            this.writeToFile() // first write to file for this new chunk
        }
    }

    private fileName: string | undefined
    get file(): string {
        if (this.fileName) { return this.fileName }

        let xs = this.coordinates.x.toString(16)
        let ys = this.coordinates.y.toString(16)
        let hash = crypto.createHash('sha1').update(xs + "," + ys).digest('hex');

        let objPath = path.join(hash.substring(0, 3), hash.substring(3))

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
        return this.doesExist || (this.doesExist = fs.existsSync(this.file))
    }

    private loadFromFile() {
        this.loaded = true
        this.buffer = fs.readFileSync(this.file)
    }

    private writeToFile() {
        fs.writeFileSync(this.file, this.buffer)
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
    events: EventEmitter

    min: Point
    max: Point

    constructor(a: Point, b: Point) {
        this.events = new EventEmitter()
        
        this.min = new Point(0n, 0n)
        this.max = new Point(0n, 0n)
        this.set(a, b)
    }

    set(a: Point, b: Point) {
        this.min.x = a.x
        this.min.y = a.y
        this.max.x = b.x
        this.max.y = b.y
    }

    doesContain(point: Point): boolean {
        return (point.x >= this.min.x
            && point.x <= this.max.x
            && point.y >= this.min.y
            && point.y <= this.max.y
        )
    }

    get chunks(): Array<Chunk> {
        const arr: Array<Chunk> = []

        const w = BigInt(CONFIG.chunkSize)
        for (let x = this.min.x; x < this.max.x; x += w) {
            for (let y = this.min.y; y < this.max.y; y += w) {
                arr.push(new Point(x, y).chunk)
            }
        }

        return arr
    }
}