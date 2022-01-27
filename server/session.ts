import { EventEmitter } from 'events'

export class Session {
    events: EventEmitter
    socket: any

    constructor(socket: any) {
        this.events = new EventEmitter()
        this.socket = socket

        
    }
}

export interface message {
    event: string,
    data: object
}
