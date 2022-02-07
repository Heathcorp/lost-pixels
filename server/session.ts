import { EventEmitter } from 'events'
import { ObjectFlags } from 'typescript';

const JSONb = require('json-bigint')({useNativeBigInt: true});

import { Area, Point, Chunk } from './world'

export class Session {
    events: EventEmitter
    socket: any

    area: Area

    constructor(socket: any) {
        this.events = new EventEmitter()
        this.socket = socket

        // temp
        this.area = new Area(new Point(0n, 0n), new Point(0n, 0n))

        this.addListeners()
    }

    private addListeners() {
        this.socket.on('message', (msg: any) => {
            msg = <m_message>JSONb.parse(msg)
            
            // if isValid trips false at any point here then the client gets disconnected
            let isValid: boolean = false
            if (isValid = i_message(msg)) {
                switch (msg.event) {
                    case 'setpixel':
                        if (isValid = i_setpixel(msg.data)) { this.events.emit('setpixel', new Point(msg.data.position.x, msg.data.position.y), msg.data.colour) }
                        break;
                    case 'setviewport':
                        if (isValid = i_setviewport(msg.data)) {
                            this.area.Set(new Point(msg.data.a.x, msg.data.a.y), new Point(msg.data.b.x, msg.data.b.y))
                            this.events.emit('setviewport', msg.data)
                        }
                        break;
                }
            }

            if (!isValid) {
                // client sent bad message, possibly malicious, disconnect them
                this.closeSession(1003)
            }
        })

        this.socket.on('close', () => {
            this.events.emit('close')
        })
    }

    closeSession(code: Number) {
        this.socket.close(code)
        this.events.emit('close')
    }
}

// socket messages interfaces
interface m_message {
    event: string,
    data: object
}

interface m_position {
    x: bigint,
    y: bigint
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

function i_setviewport(obj: any): obj is m_setviewport {
    return (Object.entries(obj).length === 2
        && obj.a !== null && obj.a !== undefined
        && obj.b !== null && obj.b !== undefined
        && typeof obj.a === 'object' && typeof obj.b === 'object'
        && i_position(obj.a) && i_position(obj.b)
        && obj.a.x < obj.b.x && obj.a.y < obj.b.y
    )
}