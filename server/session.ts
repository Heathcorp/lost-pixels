import { EventEmitter } from 'events'
import { ReadPosition } from 'fs'
import { isParenthesizedTypeNode } from 'typescript';

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

interface m_position {
    x: BigInt,
    y: BigInt
}

interface m_setpixel {
    position: m_position,
    colour: string
}

// type guards:
function i_Message(msg: any): msg is Message {
    return (Object.entries(msg).length === 2
        && msg.event !== null && msg.event !== undefined
        && msg.data !== null && msg.data !== undefined
        && typeof msg.event === 'string' && typeof msg.data === 'object'
    )
}

function i_Position(pos: any): pos is m_position {
    return (Object.entries(pos).length === 2
        && pos.x !== null && pos.x !== undefined
        && pos.x !== null && pos.x !== undefined
        && (typeof pos.x === 'bigint' || (typeof pos.x === 'number' && Number.isInteger(pos.x)))
        && (typeof pos.y === 'bigint' || (typeof pos.y === 'number' && Number.isInteger(pos.y)))
    )
}

const regex = new RegExp('^[0-9a-f]{6}$') // string must be exactly 6 digits of lowercase hex
function i_Colour(col: string): boolean {
    return (col !== null && col !== undefined
        && typeof col === 'string'
        && regex.test(col)
    )
}