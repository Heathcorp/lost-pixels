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

    LoadSession() {

    }
}

export class Chunk {
    constructor() {

    }
}