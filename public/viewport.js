const JSONb = require('json-bigint')({useNativeBigInt: true});
const { Buffer } = require('buffer');

const socket = new WebSocket('ws://192.168.0.55');

// called when client connects to server
socket.onopen = (event) => {
    console.log("Connected");
    // create viewport object to keep track of graphics, user interaction and world state
    const viewport = new Viewport(socket, {x: 0n, y: 0n});

    // listen for server messages
    socket.onmessage = (msg) => {
        msg = JSONb.parse(msg.data);
        data = msg.data;
    
        // call different functions depending on event header from server
        switch(msg.event) {
            case "loadchunk":
                viewport.DisplayChunk(data.chunk, data.image);
                break;
            case "unloadchunk":
                viewport.DeleteChunk(data.chunk);
                break;
        }
    };
    
    socket.onclose = (event) => {
        console.log("Disconnected");
    };
    
    socket.onerror = (msg) => {
        console.error("Error occured:", msg);
    };
};

// create PIXI.js application
const app = new PIXI.Application({
    backgroundColor: 0xffffff,
    width: window.innerWidth,
    height: window.innerHeight
});

// add PIXI.js application once page loads
window.onload = () => {
    document.body.appendChild(app.view);
}

window.onresize = () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
};

// class to keep track of a chunk and its sprite
class Chunk {
    constructor(x, y, sprite, viewport) {
        this.x = BigInt(x);
        this.y = BigInt(y);
        this.sprite = sprite;

        this.worldPos = {
            x: this.x * 16n,
            y: this.y * 16n
        }

        this.UpdateSpritePos(viewport);
    }

    // moves and scales the sprite based on the viewport class's zoom and position
    UpdateSpritePos(viewport) {
        let pixelPos = viewport.WorldToPixel(this.worldPos);

        this.sprite.x = pixelPos.x;
        this.sprite.y = pixelPos.y;
        this.sprite.scale.set(viewport.zoom);
    }
}

// class to keep track of world state, graphics, user interaction, some server comms
class Viewport {
    constructor(socket, center, zoom = 16) {
        this.socket = socket;

        // world coordinates viewport, mainly useful for the server to know what we're looking at
        this.viewport = {a: {x: 0n, y: 0n}, b: {x: 0n, y: 0n}};

        // the center world pixel that we're looking at
        this.center = {
            x: BigInt(center.x),
            y: BigInt(center.y)
        };
        // the zoom level, objects apper this.zoom times their normal size in pixels
        this.zoom = Number(zoom);

        // set of active, rendered chunk objects
        this.chunks = new Set();

        // initialise the viewport and send to the server
        this.SetViewport();
        socket.send(JSONb.stringify({
            event: "setviewport",
            data: {
                viewport: this.viewport
            }
        }));

        // create PIXI.js container to hold all the chunk sprites and handle some interaction
        this.displayContainer = new PIXI.Container();
        // next 2 lines are required to get mouse events
        this.displayContainer.interactive = true;
        this.displayContainer.hitArea = new PIXI.Rectangle(0, 0, window.innerWidth, window.innerHeight);

        // mount the container for rendering
        app.stage.addChild(this.displayContainer);

        // update the viewport when the canvas is resized
        app.renderer.on('resize', (screenWidth, screenHeight) => {
            this.SetViewport();
            this.UpdateViewport();
        });

        // handle zooming, unfinished
        app.view.addEventListener('wheel', (e) => {
            this.zoom -= e.deltaY / 100;
            this.SetViewport();
            this.UpdateViewport();
        });

        // turn off context menu on right click
        app.view.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        this.mouseLeftDown = false;
        // places a pixel and records that the mouse is pressed
        this.displayContainer.on('mousedown', (e) => {
            this.mouseLeftDown = true;
            this.socket.send(JSONb.stringify({
                event: "setpixel", 
                data: {
                    position: this.PixelToWorld({x: e.data.global.x, y: e.data.global.y}), 
                    colour: {
                        r: Math.floor(Math.random() * 256), 
                        g: Math.floor(Math.random() * 256), 
                        b: Math.floor(Math.random() * 256)
                    }
                }
            }));
        });

        // event for when the mouse moves over the canvas
        // if the left mouse is pressed, record the pixels to write as a brush stroke
        // if the right mouse is pressed, click-and-drag navigate the world
        this.worldPixelsToDraw = [];
        this.displayContainer.on('mousemove', (e) => {
            if (this.mouseRightDown) {
                let a = this.PixelToWorld(this.mouseRightStartPos);
                let b = this.PixelToWorld({x: e.data.global.x, y: e.data.global.y});

                let delta = {x: a.x - b.x, y: a.y - b.y};
                let newCenter = {x: this.centerMoveStartPos.x + delta.x, y: this.centerMoveStartPos.y + delta.y};
                if (newCenter.x != this.center.x || newCenter.y != this.center.y) {
                    this.SetPosition(newCenter);
                }
            }
            else if (this.mouseLeftDown) {
                let last = this.worldPixelsToDraw.at(-1);
                let n = this.PixelToWorld({x: e.data.global.x, y: e.data.global.y});
                if (!last || n.x != last.x || n.y != last.y) {
                    this.worldPixelsToDraw.push(n);
                }
            }
        });

        // left mouse released, send brush stroke if not empty and resets the mouse state
        this.displayContainer.on('mouseup', (e) => {
            this.mouseLeftDown = false;
            if (this.worldPixelsToDraw.length) {
                this.socket.send(JSONb.stringify({
                    event: "setpixels", 
                    data: {
                        // need to redo the client-server comms here, it's too network intensive
                        array: this.worldPixelsToDraw.map((pos) => {
                            return {
                                position: pos,
                                colour: {
                                    r: Math.floor(Math.random() * 256), 
                                    g: Math.floor(Math.random() * 256), 
                                    b: Math.floor(Math.random() * 256)
                                }
                            };
                        })
                    }
                }));
                this.worldPixelsToDraw = [];
            }
        });

        // right-click / navigation dragging listeners:
        this.mouseRightDown = false;
        this.mouseRightStartPos = {x: 0, y: 0};
        this.centerMoveStartPos = this.center;
        // start listening for right-click dragging
        this.displayContainer.on('rightdown', (e) => {
            this.mouseRightDown = true;
            this.centerMoveStartPos = this.center;
            this.mouseRightStartPos = {x: e.data.global.x, y: e.data.global.y};
        });

        // only download new chunks when right mouse is released
        this.displayContainer.on('rightup', (e) => {
            this.mouseRightDown = false;
            this.UpdateViewport();
        });
    }

    // creates a new chunk object based on data received from the server
    DisplayChunk(chunk, image) {
        // create new sprite from image data buffer
        let buffer = Buffer.from(image, 'base64');
        let sprite = PIXI.Sprite.from(
            PIXI.Texture.fromBuffer(buffer, 16, 16, {
                format:PIXI.FORMATS.RGB,
                mipmap:PIXI.MIPMAP_MODES.OFF
            })
        );
    
        // deletes the chunk in case its already loaded and has been edited
        this.DeleteChunk(chunk);
    
        let ch = {
            x: BigInt(chunk.x),
            y: BigInt(chunk.y)
        };
    
        // add to the container and chunks set
        let newChunk = new Chunk(ch.x, ch.y, sprite, this);
        this.displayContainer.addChild(newChunk.sprite);
        this.chunks.add(newChunk);
    }

    // unloads a chunk
    DeleteChunk(chunk) {
        let ch = {
            x: BigInt(chunk.x),
            y: BigInt(chunk.y)
        };
        
        for (let c of this.chunks) {
            if (c.x == ch.x && c.y == ch.y) {
                c.sprite.destroy();
                this.chunks.delete(c);
                break;
            }
        }
    }

    // basically just a helper function for SetViewport in terms of a center position and zoom level
    SetPosition(center, zoom = this.zoom) {
        this.center = {
            x: BigInt(center.x),
            y: BigInt(center.y)
        };
        this.zoom = zoom;
        this.SetViewport();
    }

    // sets the viewport based on the zoom and center properties and updates the chunk positions
    SetViewport() {
        let width = window.innerWidth / this.zoom;
        let height = window.innerHeight / this.zoom;
        
        let w = BigInt(Math.round(width / 2));
        let h = BigInt(Math.round(height / 2));

        this.viewport = {
            a: {
                x: this.center.x - w,
                y: this.center.y - h
            },
            b: {
                x: this.center.x + w,
                y: this.center.y + h
            }
        }

        for (let chunk of this.chunks) {
            chunk.UpdateSpritePos(this);
        }

        console.log(this.chunks.size); //debug
    }

    // sends a message to the server saying we've moved and would like new chunks for that area if they exist
    // originally in SetViewport but moved to avoid excessive sending of viewports to server
    // so you can move around the viewport without loading and unloading all the chunks
    UpdateViewport() {
        socket.send(JSONb.stringify({
            event: "moveviewport",
            data: {
                viewport: this.viewport
            }
        }));
    }

    // helpful function to convert from pixel space to world space
    PixelToWorld(pixelPos) {
        let position = {
            x: this.viewport.a.x + BigInt(Math.floor(Number(pixelPos.x) / this.zoom)),
            y: this.viewport.a.y + BigInt(Math.floor(Number(pixelPos.y) / this.zoom))
        };
        return position;
    }

    // inverse of PixelToWorld
    WorldToPixel(position) {
        let pixelPos = {
            x: Number(BigInt(position.x) - this.viewport.a.x) * this.zoom,
            y: Number(BigInt(position.y) - this.viewport.a.y) * this.zoom
        };
        return pixelPos;
    }
}