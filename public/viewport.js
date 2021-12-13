const JSONb = require('json-bigint')({useNativeBigInt: true});
const { Buffer } = require('buffer');

const socket = new WebSocket('ws://127.0.0.1');

socket.onopen = (event) => {
    console.log("Connected");
    viewport = new Viewport({x: 0n, y: 0n});

    socket.send(JSONb.stringify({
        event: "setviewport",
        data: {
            viewport: {
                a: viewport.a,
                b: viewport.b
            }
        }
    }));

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
        console.log(msg);
    
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
    constructor(x, y, sprite) {
        this.x = BigInt(x);
        this.y = BigInt(y);
        this.sprite = sprite;

        this.sprite.x = Number(BigInt(this.x) * 16n);
        this.sprite.y = Number(BigInt(this.y) * 16n);
    }
}

class Viewport {
    constructor(center, zoom = 16) {
        this.viewport = {a: {x: 0n, y: 0n}, b: {x: 0n, y: 0n}};

        this.center = {
            x: BigInt(center.x),
            y: BigInt(center.y)
        };
        this.zoom = Number(zoom);

        this.SetViewport();

        this.chunks = new Set();

        this.displayContainer = new PIXI.Container()
            .interactive = true;

        app.stage.addChild(this.displayContainer);
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
    
        let newChunk = new Chunk(ch.x, ch.y, sprite);
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
                c.sprite.destoy();
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
        let width = Math.round(window.innerWidth / this.zoom);
        let height = Math.round(window.innerHeight / this.zoom);
        
        let w = BigInt(width / 2);
        let h = BigInt(height / 2);

        this.viewport.a.x = this.center.x - w;
        this.viewport.b.x = this.center.x + w;
        this.viewport.a.y = this.center.y - h;
        this.viewport.b.y = this.center.y + h;
    }

    PixelToWorld(pixelPos) {
        position = {
            x: this.viewport.a.x + BigInt(Number(pixelPos.x) / this.zoom),
            y: this.viewport.a.y + BigInt(Number(pixelPos.y) / this.zoom)
        };
        return position;
    }

    WorldToPixel(position) {
        pixelPos = {
            x: Math.round(Number(BigInt(position.x) - this.viewport.a.x) * this.zoom),
            y: Math.round(Number(BigInt(position.y) - this.viewport.a.x) * this.zoom)
        };
        return pixelPos;
    }
}