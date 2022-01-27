const fs = require('fs')

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
        
        session.events.on('resize', () => {

        })
    }
}

export class Chunk {
    exists: boolean

    constructor() {
        this.exists = false
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