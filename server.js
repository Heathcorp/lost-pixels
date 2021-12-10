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
        //console.log(msg);
        msg = JSONb.parse(msg);
        data = msg.data;

        switch(msg.event) {
            case "setpixel":
                SetPixel(data.position, data.colour);
                break;
            case "setpixels":
                break;
            case "setviewport":
                session.SetViewport(data.viewport);
                break;
            case "moveviewport":
                session.ChangeViewport(data.viewport);
                break;
        }
    });

    socket.on('close', (msg) => {
        sessions.delete(session);
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

    UpdateSessions() {
        for (let session of sessions) {
            let min = {x: session.viewport.a.x / 16n, y: session.viewport.a.y / 16n};
            let max = {x: session.viewport.b.x / 16n, y: session.viewport.b.y / 16n};

            if (this.x >= min.x && this.y >= min.y && this.x <= max.x && this.y <= max.y) {
                session.SendChunk(this);
            }
        }
    }
}

function SetPixel(position, colour) {
    position = {
        x: BigInt(position.x),
        y: BigInt(position.y)
    }
    let chunk = new Chunk(BigInt(position.x) / 16n, BigInt(position.y) / 16n);

    console.log("Setting pixel (%d, %d) in chunk (%d, %d) to (%d, %d, %d).", position.x, position.y, chunk.x, chunk.y, colour.r, colour.g, colour.b);
    
    //console.log("Attempting to load:", chunk);

    let filePath = path.join(world_path, chunk.hash)
    let exists = fs.existsSync(filePath);
    let buffer;

    if (exists) {
        //console.log("Chunk exists, updating");
        buffer = fs.readFileSync(filePath);
    } else {
        //console.log("Chunk does not exist, creating");

        buffer = Buffer.alloc(16*16*3);
        buffer.fill(0xff);
    }

    // edit pixel buffer
    let x = ((position.x % 16n) + 16n) % 16n;
    let y = ((position.y % 16n) + 16n) % 16n;
    let i = (x + y * 16n) * 3n;

    buffer[i] = colour.r;
    i++;
    buffer[i] = colour.g;
    i++;
    buffer[i] = colour.b;

    // write back to file
    fs.writeFileSync(filePath, buffer);

    chunk.UpdateSessions();
}

app.listen(80);

class Session {
    constructor(socket) {
        this.viewport = {a: {x: 0n, y: 0n}, b: {x: 128n, y: 128n}};
        this.loadedChunks = [];

        this.socket = socket;
    }

    SetViewport(viewport) {
        // hacky stuff please don't look
        this.viewport.a.x = BigInt(viewport.a.x) - 16n;
        this.viewport.a.y = BigInt(viewport.a.y) - 16n;

        this.viewport.b.x = this.viewport.a.x;
        this.viewport.b.y = this.viewport.a.y;

        this.ChangeViewport(viewport);
    }

    ChangeViewport(viewport) {
        let oldmin = {x: this.viewport.a.x / 16n, y: this.viewport.a.y / 16n};
        let oldmax = {x: this.viewport.b.x / 16n, y: this.viewport.b.y / 16n};
        
        this.viewport.a.x = BigInt(viewport.a.x);
        this.viewport.a.y = BigInt(viewport.a.y);

        this.viewport.b.x = BigInt(viewport.b.x);
        this.viewport.b.y = BigInt(viewport.b.y);
        console.log("Set a user's viewport to: (%d, %d) -> (%d, %d)", this.viewport.a.x, this.viewport.a.y, this.viewport.b.x, this.viewport.b.y);

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
                    let chunk = new Chunk(x, y);
                    this.loadedChunks.push(chunk);
                    this.SendChunk(chunk);
                }
            }
        }
    }

    SendChunk(chunk) {
        //console.log("Attempting to load:", chunk);
        let filePath = path.join(world_path, chunk.hash)
        let exists = fs.existsSync(filePath);

        if (exists) {
            //console.log("Chunk exists, sending");
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
            this.socket.send(msg);

        } else {
            //console.log("Chunk does not exist, ignoring");
        }
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