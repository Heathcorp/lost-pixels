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
            if (i_message(JSONb.parse(msg))) console.log(true)
        })
    }
}

// socket messages interfaces
interface m_message {
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

interface m_setviewport {
    a: m_position,
    b: m_position
}

// type guards:
function i_message(msg: any): msg is m_message {
    return (Object.entries(msg).length === 2
        && msg.event !== null && msg.event !== undefined
        && msg.data !== null && msg.data !== undefined
        && typeof msg.event === 'string' && typeof msg.data === 'object'
    )
}

function i_position(pos: any): pos is m_position {
    return (Object.entries(pos).length === 2
        && pos.x !== null && pos.x !== undefined
        && pos.x !== null && pos.x !== undefined
        && (typeof pos.x === 'bigint' || (typeof pos.x === 'number' && Number.isInteger(pos.x)))
        && (typeof pos.y === 'bigint' || (typeof pos.y === 'number' && Number.isInteger(pos.y)))
    )
}

const regex = new RegExp('^[0-9a-f]{6}$') // string must be exactly 6 digits of lowercase hex
function i_colour(col: string): boolean {
    return (col !== null && col !== undefined
        && typeof col === 'string'
        && regex.test(col)
    )
}

function i_setpixel(obj: any): obj is m_setpixel {
    return (Object.entries(obj).length === 2
        && obj.position !== null && obj.position !== undefined
        && typeof obj.position === 'object'
        && i_position(obj.position)
        && i_colour(obj.colour)
    )
}

function i_viewport(obj: any): obj is m_setviewport {
    return (Object.entries(obj).length === 2
        && obj.a !== null && obj.a !== undefined
        && obj.b !== null && obj.b !== undefined
        && typeof obj.a === 'object' && typeof obj.b === 'object'
        && i_position(obj.a) && i_position(obj.b)
    )
}