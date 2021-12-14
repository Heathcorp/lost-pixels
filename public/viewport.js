const JSONb = require('json-bigint')({useNativeBigInt: true});
const { Buffer } = require('buffer');

const socket = new WebSocket('ws://192.168.0.55');

socket.onopen = (event) => {
    console.log("Connected");
    const viewport = new Viewport(socket, {x: 0n, y: 0n});

    socket.onmessage = (msg) => {
        msg = JSONb.parse(msg.data);
        data = msg.data;
    
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


const app = new PIXI.Application({
    backgroundColor: 0xffffff,
    width: window.innerWidth,
    height: window.innerHeight
});

window.onload = () => {
    document.body.appendChild(app.view);
}

window.onresize = () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
};


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

    UpdateSpritePos(viewport) {
        let pixelPos = viewport.WorldToPixel(this.worldPos);

        this.sprite.x = pixelPos.x;
        this.sprite.y = pixelPos.y;
        this.sprite.scale.set(viewport.zoom);
    }
}

class Viewport {
    constructor(socket, center, zoom = 16) {
        this.socket = socket;

        this.viewport = {a: {x: 0n, y: 0n}, b: {x: 0n, y: 0n}};

        this.center = {
            x: BigInt(center.x),
            y: BigInt(center.y)
        };
        this.zoom = Number(zoom);

        this.chunks = new Set();

        this.SetViewport();
        socket.send(JSONb.stringify({
            event: "setviewport",
            data: {
                viewport: this.viewport
            }
        }));

        this.displayContainer = new PIXI.Container();
        this.displayContainer.interactive = true;
        this.displayContainer.hitArea = new PIXI.Rectangle(0, 0, window.innerWidth, window.innerHeight);

        app.stage.addChild(this.displayContainer);

        app.renderer.on('resize', (screenWidth, screenHeight) => {
            this.SetViewport();
            this.UpdateViewport();
        });

        app.view.addEventListener('wheel', (e) => {
            this.zoom -= e.deltaY / 100;
            this.SetViewport();
            this.UpdateViewport();
        });

        app.view.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        this.mouseLeftDown = false;
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
        this.displayContainer.on('rightdown', (e) => {
            this.mouseRightDown = true;
            this.centerMoveStartPos = this.center;
            this.mouseRightStartPos = {x: e.data.global.x, y: e.data.global.y};
        });

        this.displayContainer.on('rightup', (e) => {
            this.mouseRightDown = false;
            this.UpdateViewport();
        });
    }

    DisplayChunk(chunk, image) {
        let buffer = Buffer.from(image, 'base64');
        let sprite = PIXI.Sprite.from(
            PIXI.Texture.fromBuffer(buffer, 16, 16, {
                format:PIXI.FORMATS.RGB,
                mipmap:PIXI.MIPMAP_MODES.OFF
            })
        );
    
        this.DeleteChunk(chunk);
    
        let ch = {
            x: BigInt(chunk.x),
            y: BigInt(chunk.y)
        };
    
        let newChunk = new Chunk(ch.x, ch.y, sprite, this);
        this.displayContainer.addChild(newChunk.sprite);
        this.chunks.add(newChunk);
    }

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

    SetPosition(center, zoom = this.zoom) {
        this.center = {
            x: BigInt(center.x),
            y: BigInt(center.y)
        };
        this.zoom = zoom;
        this.SetViewport();
    }

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

        console.log(this.chunks.size);
    }

    // to avoid excessive sending of viewports to server
    // so you can set the viewport without loading and unloading all the chunks
    UpdateViewport() {
        socket.send(JSONb.stringify({
            event: "moveviewport",
            data: {
                viewport: this.viewport
            }
        }));
    }

    PixelToWorld(pixelPos) {
        let position = {
            x: this.viewport.a.x + BigInt(Math.floor(Number(pixelPos.x) / this.zoom)),
            y: this.viewport.a.y + BigInt(Math.floor(Number(pixelPos.y) / this.zoom))
        };
        return position;
    }

    WorldToPixel(position) {
        let pixelPos = {
            x: Number(BigInt(position.x) - this.viewport.a.x) * this.zoom,
            y: Number(BigInt(position.y) - this.viewport.a.y) * this.zoom
        };
        return pixelPos;
    }
}