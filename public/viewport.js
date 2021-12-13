const JSONb = require('json-bigint')({useNativeBigInt: true});
const { Buffer } = require('buffer');

const socket = new WebSocket('ws://127.0.0.1');

socket.onopen = (event) => {
    console.log("Connected");
    const viewport = new Viewport(socket, {x: 0n, y: 0n});

    // socket.send(JSONb.stringify({
    //     event: "setpixel", 
    //     data: {
    //         position: {
    //             x: 0n, 
    //             y: 0n
    //         }, 
    //         colour: {
    //             r: 255, 
    //             g: 127, 
    //             b: 0
    //         }
    //     }
    // }));

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

        this.displayContainer = new PIXI.Container();
        this.displayContainer.interactive = true;
        this.displayContainer.hitArea = new PIXI.Rectangle(0, 0, window.innerWidth, window.innerHeight);

        app.stage.addChild(this.displayContainer);

        app.renderer.on('resize', (screenWidth, screenHeight) => {
            this.SetViewport();
        });

        app.view.addEventListener('wheel', (e) => {
            this.zoom -= e.deltaY / 1000;
            this.SetViewport();
        });

        this.displayContainer.on('mousedown', (e) => {
            this.socket.send(JSONb.stringify({
                event: "setpixel", 
                data: {
                    position: this.PixelToWorld({x: e.data.global.x, y: e.data.global.y}), 
                    colour: {
                        r: 0, 
                        g: 0, 
                        b: 0
                    }
                }
            }));
        });

        this.displayContainer.on('mousemove', (e) => {
            
        });

        this.displayContainer.on('mouseup', (e) => {
            
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

        this.viewport.a.x = this.center.x - w;
        this.viewport.b.x = this.center.x + w;
        this.viewport.a.y = this.center.y - h;
        this.viewport.b.y = this.center.y + h;

        socket.send(JSONb.stringify({
            event: "setviewport",
            data: {
                viewport: this.viewport
            }
        }));

        for (let chunk of this.chunks) {
            chunk.UpdateSpritePos(this);
        }
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
            x: Math.round(Number(BigInt(position.x) - this.viewport.a.x) * this.zoom),
            y: Math.round(Number(BigInt(position.y) - this.viewport.a.y) * this.zoom)
        };
        return pixelPos;
    }
}