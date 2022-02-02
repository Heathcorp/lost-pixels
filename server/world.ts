const fs = require('fs')
const crypto = require('crypto');

import { Session } from './session'

export class World {
    loadedChunks: Set<Chunk>
    activeSessions: Set<Session>

    constructor(directory: string) {
        this.loadedChunks = new Set<Chunk>();
        this.activeSessions = new Set<Session>();

    }

    SetPixel() {
        
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

    constructor() {
        this.exists = false
        this.loaded = false
    }

    // static members
    static allCurrentChunks: Set<Chunk>
    static fromPoint(point: Point): Chunk {
        return new Chunk(); // temp
    }
}

export class Point {
    x: BigInt
    y: BigInt

    constructor(x: BigInt, y: BigInt) {
        this.x = x
        this.y = y
    }

    get chunk(): Chunk {
        return Chunk.fromPoint(this);
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