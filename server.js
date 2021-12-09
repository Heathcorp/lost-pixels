const path = require('path');
const crypto = require('crypto');
const { Buffer } = require('buffer');
const JSONb = require('json-bigint')({useNativeBigInt: true});

const express = require('express');
const app = express();
require('express-ws')(app);

app.use(express.static('public'));


const sessions = new Set();

app.ws('/', (socket, req) => {
    const session = new Session(socket);
    sessions.add(session);

    socket.on('message', (msg) => {
        console.log(msg);
        msg = JSONb.parse(msg);
        data = msg.data;

        switch(msg.event) {
            case "setpixel":
                SetPixel(data.position, data.colour);
            case "setpixels":
                break;
            case "setviewport":
            case "moveviewport":
                session.SetViewport(data.viewport);
        }
    });
});

const fs = require('fs');
const world_path = path.join(__dirname, 'test_world');

class Chunk {
    constructor(x, y) {
        this.x = BigInt(x);
        this.y = BigInt(y);

        let xHash = crypto.createHash('sha256').update(this.x.toString(16)).digest('hex');
        let yHash = crypto.createHash('sha256').update(this.y.toString(16)).digest('hex');
        this.hash = crypto.createHash('sha256').update(xHash + yHash).digest('hex');
    }

    toString() {
        return "(" + this.x.toString() + ", " + this.y.toString() + ")"; 
    }
}

function SetPixel(position, colour) {
    let chunk = {
        x: BigInt(position.x) / 16n,
        y: BigInt(position.y) / 16n
    }
    console.log("Pixel (%d, %d) in chunk (%d, %d) set to (%d, %d, %d).", position.x, position.y, chunk.x, chunk.y, colour.r, colour.g, colour.b);
    //stub
}

app.listen(80);

class Session {
    constructor(socket) {
        this.viewport = {a: {x: 0n, y: 0n}, b: {x: 128n, y: 128n}};
        this.loadedChunks = [];

        this.socket = socket;
    }

    SetViewport(viewport) {
        let oldmin = {x: this.viewport.a.x / 16n, y: this.viewport.a.y / 16n};
        let oldmax = {x: this.viewport.b.x / 16n, y: this.viewport.b.y / 16n};
        
        this.viewport.a.x = BigInt(viewport.a.x);
        this.viewport.a.y = BigInt(viewport.a.y);

        this.viewport.b.x = BigInt(viewport.b.x);
        this.viewport.b.y = BigInt(viewport.b.y);
        console.log("Set user's viewport to: (%d, %d) -> (%d, %d)", this.viewport.a.x, this.viewport.a.y, this.viewport.b.x, this.viewport.b.y);

        let min = {x: this.viewport.a.x / 16n, y: this.viewport.a.y / 16n};
        let max = {x: this.viewport.b.x / 16n, y: this.viewport.b.y / 16n};


        let keptChunks = [];
        for (let i = 0; i < this.loadedChunks.length; i++) {
            let c = this.loadedChunks[i]
            if (c.x < min.x || c.y < min.y || c.x > max.x || c.y > max.y) {
                this.UnloadChunk(c);
            } else {
                keptChunks.push(c);
            }
        }
        this.loadedChunks = keptChunks;
        for (let x = min.x; x <= max.x; x++) {
            for (let y = min.y; y <= max.y; y++) {
                if (x < oldmin.x || y < oldmin.y || x > oldmax.x || y > oldmax.y) {
                    this.LoadChunk(new Chunk(x, y));
                }
            }
        }
    }

    LoadChunk(chunk) {
        console.log("Attempting to load:", chunk);
        let filePath = path.join(world_path, chunk.hash)
        let exists = fs.existsSync(filePath);

        this.loadedChunks.push(chunk);

        if (exists) {
            console.log("Chunk exists, sending");
            this.SendChunk(chunk);
        } else {
            console.log("Chunk does not exist");
        }
    }

    SendChunk(chunk) {
        let filePath = path.join(world_path, chunk.hash)
        let buffer = fs.readFileSync(filePath);

        let msg = JSONb.stringify({
            event: "loadchunk",
            data: {
                chunk: {
                    x: chunk.x,
                    y: chunk.y
                },
                image: buffer.toString('base64')
            }
        });
        console.log("Sending:", msg);
        this.socket.send(msg);
    }

    UnloadChunk(chunk) {
        let msg = JSONb.stringify({
            event: "unloadchunk",
            data: {
                chunk: {
                    x: chunk.x,
                    y: chunk.y
                }
            }
        });
        this.socket.send(msg);
    }
}