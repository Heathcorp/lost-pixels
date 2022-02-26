import * as fs from 'fs'
import * as crypto from 'crypto'
import * as path from 'path'

import { Area, Point, Chunk } from './world'
import { CONFIG } from './main'

export function doesChunkExist(chunk: Chunk): boolean {
    let subChunks = new Array<legacyChunk>();

    // old chunks were 16x16, so we need to iterate over a 4x4 grid to find them all
    for (let dx = 0n; dx < 4n; dx++) {
        for (let dy = 0n; dy < 4n; dy++) {
            let x = 4n * chunk.coordinates.x + dx;
            let y = 4n * chunk.coordinates.y + dy;

            let fileName = getHash(x, y);
            // console.log(x, y, fileName, chunk.coordinates);

            if (fs.existsSync(path.join(CONFIG.legacy.worldPath, fileName))) {
                subChunks.push({
                    dx: dx,
                    dy: dy,
                    hash: fileName
                })
            }
        }
    }

    // store file names for when the chunk accesses the file system later
    chunk.legacyChunks = subChunks;

    return subChunks.length > 0;
}

export function loadFromFile(chunk: Chunk): Buffer {
    let buf = Buffer.alloc(CONFIG.chunkSize * CONFIG.chunkSize * 3, 0xff);

    for (let ch of chunk.legacyChunks) {
        let chbuf = fs.readFileSync(path.join(CONFIG.legacy.worldPath, ch.hash));

        // 2d memcopy
        let startOffset = Number(16n * ch.dx + 64n * 16n * ch.dy);
        for (let row = 0; row < 16; row++) {
            let rowOffset = startOffset + row * 64;
            let srcOffset = row * 16;
            chbuf.copy(buf, 3*rowOffset, 3*srcOffset, 3*(srcOffset + 16));
        }
    }

    return buf;
}

export function deleteLegacyChunks(chunk: Chunk) {
    chunk.legacyChunks.map((ch) => {
        fs.unlinkSync(path.join(CONFIG.legacy.worldPath, ch.hash))
    })
    chunk.legacyChunks = [];
}

function getHash(x: bigint, y: bigint): string {
    let xHash = crypto.createHash('sha256').update(x.toString(16)).digest('hex');
    let yHash = crypto.createHash('sha256').update(y.toString(16)).digest('hex');
    let hash = crypto.createHash('sha256').update(xHash + yHash).digest('hex');

    return hash;
}

export interface legacyChunk {
    dx: bigint,
    dy: bigint,
    hash: string
}