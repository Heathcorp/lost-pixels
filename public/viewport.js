const JSONb = require('json-bigint')({useNativeBigInt: true});
const { Buffer } = require('buffer');

const socket = new WebSocket('ws://192.168.0.55');

// misc reactive html scripts that need to run after the page has loaded
window.addEventListener("load", (e) => {
    // get primary and secondary colour selectors
    let pcs = document.getElementById("primary-colour-selector");
    let scs = document.getElementById("secondary-colour-selector");
    
    // update background colour as user changes colours (fancy css wouldn't cut it)
    pcs.addEventListener("input", (ev) => {
        let hex = ev.target.value;
        ev.target.parentElement.style.backgroundColor = hex;
    });
    // same with the secondary
    scs.addEventListener("input", (ev) => {
        let hex = ev.target.value;
        ev.target.parentElement.style.backgroundColor = hex;
    });

    // get old colours from local storage
    pcs.value = window.localStorage.getItem("primary-colour") || "#000000";
    scs.value = window.localStorage.getItem("secondary-colour") || "#ffffff";
    
    // need to add palette here

    // finally initialise background colours for the main colour selectors
    scs.parentElement.style.backgroundColor = scs.value;
    pcs.parentElement.style.backgroundColor = pcs.value;

    // store colours to local storage when page unloads
    window.addEventListener("beforeunload", (e) => {
        window.localStorage.setItem("primary-colour", document.getElementById("primary-colour-selector").value);
        window.localStorage.setItem("secondary-colour", document.getElementById("secondary-colour-selector").value);

        // need to store palette also
    });
});

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
    constructor(socket, center, zoom = 8) {
        this.socket = socket;

        // world coordinates viewport, mainly useful for the server to know what we're looking at
        this.viewport = {a: {x: 0n, y: 0n}, b: {x: 0n, y: 0n}};

        // the center world pixel that we're looking at
        this.center = {
            x: BigInt(center.x),
            y: BigInt(center.y)
        };
        // the zoom level, objects appear this.zoom times their normal size in pixels
        this.zoom = Number(zoom);
        this.zoomScale = 1.1; // number to multiply or divide zoom by when scrolling

        // set of active, rendered chunk objects
        this.chunks = new Set();

        // current brush colour
        this.brushColour = {
            r: 0,
            g: 0,
            b: 0
        };

        // initialise the viewport and send to the server
        this.SetViewport();
        socket.send(JSONb.stringify({
            event: "setviewport",
            data: {
                viewport: this.viewport
            }
        }));

        // create PIXI.js application
        this.app = new PIXI.Application({
            backgroundColor: 0xffffff,
            width: window.innerWidth,
            height: window.innerHeight,
            view: document.getElementById('viewport-canvas')
        });

        document.getElementById("primary-colour-selector").addEventListener("change", (ev) => {
            // change current brush colour
            let hex = ev.target.value;

            this.brushColour.r = parseInt(hex.substring(1, 3), 16);
            this.brushColour.g = parseInt(hex.substring(3, 5), 16);
            this.brushColour.b = parseInt(hex.substring(5, 7), 16);
        }, false);

        window.onresize = () => {
            this.app.renderer.resize(window.innerWidth, window.innerHeight);
        };

        // create PIXI.js container to hold all the chunk sprites and handle some interaction
        this.displayContainer = new PIXI.Container();
        // next 2 lines are required to get mouse events
        this.displayContainer.interactive = true;
        this.displayContainer.hitArea = new PIXI.Rectangle(0, 0, window.innerWidth, window.innerHeight);

        // mount the container for rendering
        this.app.stage.addChild(this.displayContainer);

        // update the viewport when the canvas is resized
        this.app.renderer.on('resize', (screenWidth, screenHeight) => {
            this.displayContainer.hitArea = new PIXI.Rectangle(0, 0, screenWidth, screenHeight);
            this.SetViewport();
            this.UpdateViewport();
        });

        // handle zooming, unfinished
        this.app.view.addEventListener('wheel', (e) => {
            let oldZoom = this.zoom;
            if (e.deltaY < 0) {
                this.zoom *= this.zoomScale;
            }
            else if (e.deltaY > 0) {
                this.zoom /= this.zoomScale;
            }
            else {
                return;
            }

            if (this.zoom < 4) {
                this.zoom = 4;
            }
            else if (this.zoom > 128) {
                this.zoom = 128;
            }
            
            if (this.zoom != oldZoom) {
                this.SetViewport();
                this.UpdateViewport();
            }
        });

        // turn off context menu on right click
        this.app.view.addEventListener('contextmenu', (e) => {
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
                    colour: this.brushColour
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
                    this.socket.send(JSONb.stringify({
                        event: "setpixel", 
                        data: {
                            position: n, 
                            colour: this.brushColour
                        }
                    }));
                    //this.worldPixelsToDraw.push(n);
                }
            }
        });

        // left mouse released, send brush stroke if not empty and resets the mouse state
        this.displayContainer.on('mouseup', (e) => {
            this.mouseLeftDown = false;
            // if (this.worldPixelsToDraw.length) {
            //     this.socket.send(JSONb.stringify({
            //         event: "setpixels", 
            //         data: {
            //             // need to redo the client-server comms here, it's too network intensive
            //             array: this.worldPixelsToDraw.map((pos) => {
            //                 return {
            //                     position: pos,
            //                     colour: this.brushColour
            //                 };
            //             })
            //         }
            //     }));
            //     this.worldPixelsToDraw = [];
            // }
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