const fs = require('fs')
const path = require('path')

import { Session } from './session'
import { config } from './main'

export class World {
    loadedChunks: Set<Chunk>
    activeSessions: Set<Session>

    constructor(directory: string) {
        this.loadedChunks = new Set<Chunk>();
        this.activeSessions = new Set<Session>();

    }

    SetPixel(position: Point, colour: string) {
        const w = BigInt(config.chunk_size)
        // convert position to relative chunk position
        let x = position.x % w
        let y = position.y % w
        if (x < 0n) { x += w }
        if (y < 0n) { y += w }

        const relPos = new Point(x, y)

        position.chunk.SetPixel(relPos, colour)
    }

    LoadSession(session: Session) {
        session.events.on('close', () => {

        })
        
        session.events.on('setviewport', () => {

        })

        session.events.on('setpixel', (position: Point, colour: string) => {
            this.SetPixel(position, colour)
        })
    }
}

export class Chunk {
    exists: boolean
    loaded: boolean

    buffer: Buffer

    coordinates: Point

    private constructor(chunkPos: Point) {
        this.exists = false
        this.loaded = false
        this.fileName = ''

        this.buffer = Buffer.from('')
        
        this.coordinates = chunkPos
    }

    public SetPixel(position: Point, colour: string)
    {
        // convert string into r g b components, here we can safely assume colour is a valid 6 digit hex rgb colour
        let cbuffer = Buffer.from([0x127, 0x127, 0x127])
        let buffer = Buffer.alloc(config.chunk_size * config.chunk_size * 3)
        buffer.fill('\0')

        if (this.loaded) {
            
        }
    }

    fileName: string
    get file(): string {
        if (this.fileName !== '') { return this.fileName }

        // not sure how to name the files just yet, tbd
        // temporarily borrowing from the old codebase's way of doing it
        
        const crypto = require('crypto');
        
        // chunk hash = sha256(sha256(x) concat sha256(y))
        let xHash = crypto.createHash('sha256').update(this.coordinates.x.toString(16)).digest('hex');
        let yHash = crypto.createHash('sha256').update(this.coordinates.y.toString(16)).digest('hex');
        let hash = crypto.createHash('sha256').update(xHash + yHash).digest('hex');

        return (this.fileName = hash)
    }

    // static members
    static allCurrentChunks: Array<Chunk> = []
    static fromPoint(point: Point): Chunk {
        const w = BigInt(config.chunk_size)
        
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
        let c = Chunk.fromPoint(this)
        return c
    }

    equals(other: Point) {
        return (other.x === this.x && other.y === this.y)
    }
}

// defines a rectangular area of the canvas
export class Area {
    // @ts-ignore
    min: Point
    // @ts-ignore
    max: Point

    constructor(a: Point, b: Point) {
        this.Set(a, b)
    }

    Set(a: Point, b: Point) {
        // maybe need some checks here but I think we can live without it for now
        this.min = a
        this.max = b
    }

    doesContain(point: Point): boolean {
        return (point.x >= this.min.x
            && point.x <= this.max.x
            && point.y >= this.min.y
            && point.y <= this.max.y
        )
    }
}