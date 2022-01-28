import { EventEmitter } from 'events'
import { ReadPosition } from 'fs'

const JSONb = require('json-bigint')({useNativeBigInt: true});


export class Session {
    events: EventEmitter
    socket: any

    constructor(socket: any) {
        this.events = new EventEmitter()
        this.socket = socket

        this.addListeners()
    }

    private addListeners() {
        this.socket.on('message', (msg: any) => {
            if (i_Message(JSONb.parse(msg))) console.log(true)
        })
    }
}

interface Message {
    event: string,
    data: object
}
function i_Message(msg: any): msg is Message {
    return (Object.entries(msg).length === 2
     && msg.event !== null && msg.event !== undefined
     && msg.data !== null && msg.data !== undefined
     && typeof msg.event === "string" && typeof msg.data === "object")
}

interface m_setpixel {
    position: {
        x: BigInt,
        y: BigInt
    }
    colour: string
}