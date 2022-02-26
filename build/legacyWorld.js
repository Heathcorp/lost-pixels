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
exports.deleteLegacyChunks = exports.loadFromFile = exports.doesChunkExist = void 0;
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
const path = __importStar(require("path"));
const main_1 = require("./main");
function doesChunkExist(chunk) {
    let subChunks = new Array();
    // old chunks were 16x16, so we need to iterate over a 4x4 grid to find them all
    for (let dx = 0n; dx < 4n; dx++) {
        for (let dy = 0n; dy < 4n; dy++) {
            let x = 4n * chunk.coordinates.x + dx;
            let y = 4n * chunk.coordinates.y + dy;
            let fileName = getHash(x, y);
            // console.log(x, y, fileName, chunk.coordinates);
            if (fs.existsSync(path.join(main_1.CONFIG.legacy.worldPath, fileName))) {
                subChunks.push({
                    dx: dx,
                    dy: dy,
                    hash: fileName
                });
            }
        }
    }
    // store file names for when the chunk accesses the file system later
    chunk.legacyChunks = subChunks;
    return subChunks.length > 0;
}
exports.doesChunkExist = doesChunkExist;
function loadFromFile(chunk) {
    let buf = Buffer.alloc(main_1.CONFIG.chunkSize * main_1.CONFIG.chunkSize * 3, 0xff);
    for (let ch of chunk.legacyChunks) {
        let chbuf = fs.readFileSync(path.join(main_1.CONFIG.legacy.worldPath, ch.hash));
        // 2d memcopy
        let startOffset = Number(16n * ch.dx + 64n * 16n * ch.dy);
        for (let row = 0; row < 16; row++) {
            let rowOffset = startOffset + row * 64;
            let srcOffset = row * 16;
            chbuf.copy(buf, 3 * rowOffset, 3 * srcOffset, 3 * (srcOffset + 16));
        }
    }
    return buf;
}
exports.loadFromFile = loadFromFile;
function deleteLegacyChunks(chunk) {
    chunk.legacyChunks.map((ch) => {
        fs.unlinkSync(path.join(main_1.CONFIG.legacy.worldPath, ch.hash));
    });
    chunk.legacyChunks = [];
}
exports.deleteLegacyChunks = deleteLegacyChunks;
function getHash(x, y) {
    let xHash = crypto.createHash('sha256').update(x.toString(16)).digest('hex');
    let yHash = crypto.createHash('sha256').update(y.toString(16)).digest('hex');
    let hash = crypto.createHash('sha256').update(xHash + yHash).digest('hex');
    return hash;
}
