const path = require('path')
const fs = require('fs')

import { Session } from './session'

export class World {
    loadedChunks: Set<Chunk>
    activeSessions: Set<Session>

    constructor(directory: string) {
        this.loadedChunks = new Set<Chunk>();

    }

    SetPixel() {
        
    }

    LoadSession(session: Session) {
        // session.events.on()
        
        // session.onresize = () => {

        // }
    }
}

export class Chunk {
    exists: boolean

    constructor() {

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
        return new Chunk(); // temp
    }
}