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
        
    }

    LoadSession(session: Session) {
        session.events.on('close', () => {

        })
        
        session.events.on('setviewport', () => {

        })

        session.events.on('setpixel', () => {

        })
    }
}

export class Chunk {
    exists: boolean
    loaded: boolean

    coordinates: Point

    constructor(chunkPos: Point) {
        this.exists = false
        this.loaded = false
        this.fileName = ''
        
        this.coordinates = chunkPos
    }

    public SetPixel(position: Point, colour: string)
    {

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
    static allCurrentChunks: Array<Chunk>
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

        let c: any

        if (c = this.allCurrentChunks.find((value) => value.coordinates.equals(cpos))) { return c }

        c = new Chunk(cpos)
        this.allCurrentChunks.push(c)
        return c
    }
}

export class Point {
    x: bigint
    y: bigint

    constructor(x: bigint, y: bigint) {
        this.x = x
        this.y = y
    }

    get chunk(): Chunk {
        return Chunk.fromPoint(this);
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