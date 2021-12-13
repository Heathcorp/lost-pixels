const path = require('path');
const crypto = require('crypto');
const { Buffer } = require('buffer');
const JSONb = require('json-bigint')({useNativeBigInt: true});

const fs = require('fs');

const express = require('express');
const app = express();
require('express-ws')(app);

// serve all files in /public
app.use(express.static('public'));
app.listen(80);

const world_path = path.join(__dirname, 'test_world');

// set of connected users
const sessions = new Set();

app.ws('/', (socket, req) => {
    // add connected user to sessions set
    const session = new Session(socket);
    sessions.add(session);

    socket.on('message', (msg) => {
        // each message should be a JSON object consisting of an 'event' entry corresponding to the name of the event
        // and a 'data' entry containing a JSON object with any data associated with the event
        
        msg = JSONb.parse(msg);
        data = msg.data;

        // possible client -> server events listed and handled here:
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
        // delete connected user when connection closes
        sessions.delete(session);
    });
});

// class consisting of a coordinate for a chunk
// it will automatically determine its hashed filename when constructed
class Chunk {
    constructor(x, y) {
        this.x = BigInt(x);
        this.y = BigInt(y);

        // chunk hash = sha256(sha256(x) concat sha256(y))
        let xHash = crypto.createHash('sha256').update(this.x.toString(16)).digest('hex');
        let yHash = crypto.createHash('sha256').update(this.y.toString(16)).digest('hex');
        this.hash = crypto.createHash('sha256').update(xHash + yHash).digest('hex');
    }

    toString() {
        return "(" + this.x.toString() + ", " + this.y.toString() + ")"; 
    }

    // sends chunk to any connected sessions within view
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

// sets a pixel given by its position and colour
function SetPixel(position, colour) {
    position = {
        x: BigInt(position.x),
        y: BigInt(position.y)
    }

    let chunk = new Chunk(BigInt(position.x) / 16n, BigInt(position.y) / 16n);

    console.log("Setting pixel (%d, %d) in chunk (%d, %d) to (%d, %d, %d).", position.x, position.y, chunk.x, chunk.y, colour.r, colour.g, colour.b);

    let filePath = path.join(world_path, chunk.hash)
    let exists = fs.existsSync(filePath);
    let buffer;

    // checks if the chunk has been written to file already
    // if so, buffer = the file contents
    // else, buffer = blank white 16*16 square
    if (exists) {
        buffer = fs.readFileSync(filePath);
    } else {
        buffer = Buffer.alloc(16*16*3);
        buffer.fill(0xff);
    }

    // get the position relative to the chunk, funky modulo irons out negatives
    let x = ((position.x % 16n) + 16n) % 16n;
    let y = ((position.y % 16n) + 16n) % 16n;
    // compute index of the first byte of the pixel
    let i = (x + y * 16n) * 3n;

    // update buffer with new pixel colour
    buffer[i] = colour.r;
    i++;
    buffer[i] = colour.g;
    i++;
    buffer[i] = colour.b;

    // write buffer back to file
    // if this is a new chunk, this is when the file is created
    fs.writeFileSync(filePath, buffer);

    // since chunk has been edited, update all sessions so they get realtime updates
    chunk.UpdateSessions();
}

// class to keep track of connected user sessions
class Session {
    constructor(socket) {
        this.viewport = {a: {x: 0n, y: 0n}, b: {x: 0n, y: 0n}};

        this.socket = socket;
    }

    // ChangeViewport but for first connection, probably needs a rethink
    SetViewport(viewport) {
        // hacky stuff please don't look
        this.viewport.a.x = BigInt(viewport.a.x) - 16n;
        this.viewport.a.y = BigInt(viewport.a.y) - 16n;

        this.viewport.b.x = this.viewport.a.x;
        this.viewport.b.y = this.viewport.a.y;

        this.ChangeViewport(viewport);
    }

    // change the user's viewport and load/unload/reload any chunks as needed
    ChangeViewport(viewport) {
        // get the old chunk viewport to compare with new one
        let oldmin = {x: this.viewport.a.x / 16n, y: this.viewport.a.y / 16n};
        let oldmax = {x: this.viewport.b.x / 16n, y: this.viewport.b.y / 16n};
        
        this.viewport.a.x = BigInt(viewport.a.x);
        this.viewport.a.y = BigInt(viewport.a.y);

        this.viewport.b.x = BigInt(viewport.b.x);
        this.viewport.b.y = BigInt(viewport.b.y);

        console.log("Set a user's viewport to: (%d, %d) -> (%d, %d)", this.viewport.a.x, this.viewport.a.y, this.viewport.b.x, this.viewport.b.y);

        // get the new chunk viewport
        let min = {x: this.viewport.a.x / 16n, y: this.viewport.a.y / 16n};
        let max = {x: this.viewport.b.x / 16n, y: this.viewport.b.y / 16n};

        // iterate over chunk coordinates within new viewport
        // loads new chunks and unloads old ones, depending on which viewports they're within
        for (let x = oldmin.x; x <= oldmax.x; x++) {
            for (let y = oldmin.y; y <= oldmax.y; y++) {
                if (x < min.x || y < min.y || x > max.x || y > max.y) {
                    let chunk = new Chunk(x, y);
                    this.UnloadChunk(chunk);
                }
            }
        }
        for (let x = min.x; x <= max.x; x++) {
            for (let y = min.y; y <= max.y; y++) {
                if (x < oldmin.x || y < oldmin.y || x > oldmax.x || y > oldmax.y) {
                    let chunk = new Chunk(x, y);
                    this.SendChunk(chunk);
                }
            }
        }
    }

    // send a chunk and its data to user session
    SendChunk(chunk) {
        let filePath = path.join(world_path, chunk.hash)
        let exists = fs.existsSync(filePath);

        // if chunk doesn't exist, ignore
        if (exists) {
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
        }
    }

    // send a message informing the user session that a chunk is no longer loaded
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