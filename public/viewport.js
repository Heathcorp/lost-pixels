const JSONb = require('json-bigint')({useNativeBigInt: true});

const socket = new WebSocket('ws://127.0.0.1');

socket.onopen = (event) => {
    console.log("Connected");

    socket.send(JSONb.stringify({
        event: "setviewport",
        data: {
            viewport: {
                a: {
                    x: 0n,
                    y: 0n
                },
                b: {
                    x: 128n,
                    y: 128n
                }
            }
        }
    }));

    socket.send(JSONb.stringify({
        event: "setpixel", 
        data: {
            position: {
                x: 0n, 
                y: 0n
            }, 
            colour: {
                r: 0, 
                g: 0, 
                b: 0
            }
        }
    }));
};

socket.onmessage = (msg) => {
    console.log("Received message:", msg);
};

socket.onclose = (event) => {
    console.log("Disconnected");
};

socket.onerror = (msg) => {
    console.error("Error occured:", msg);
};