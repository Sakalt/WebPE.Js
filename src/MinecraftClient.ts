import {BinaryReader} from "./utils";
import {InboundHandler} from "./network";
import {OutBoundHandler} from "./network";
import {World} from "./world";
import {EventType} from "./event";
import EventEmitter = require("events");
import {PlayerLocation} from "./math";
import {StartGameInfo} from "./data";

export class MinecraftClient {

    private readonly _connectionString: string;
    private _websocket: WebSocket;

    private _inboundHandler: InboundHandler;
    private _outboundHandler: OutBoundHandler;

    // Events
    private eventEmitter: EventEmitter = new EventEmitter();

    private _isConnected: boolean = false;
    private _hasSpawned: boolean = false;

    private _startGameInfo: StartGameInfo;
    private _currentLocation: PlayerLocation;
    private _world: World = null;


    constructor(host?: string, port?: number) {

        host = host ? host : '0.0.0.0';
        port = port ? port : 19132;

        this._connectionString = 'ws://' + host + ':' + port;
    }

    public connect(inboundHandler?: InboundHandler, outboundHandler?: OutBoundHandler) {

        console.log('connecting to ' + this._connectionString);
        this._websocket = new WebSocket(this._connectionString);

        this._websocket.binaryType = 'arraybuffer';

        this._websocket.onopen = (ev: Event) => this.onOpen(ev);
        this._websocket.onmessage = (ev: MessageEvent) => this.onMessage(ev);
        this._websocket.onerror = (ev: ErrorEvent) => {
            console.log('onError');
            console.log(ev);
        };
        this._websocket.onclose = (ev: CloseEvent) => {
            console.log('onClose');
            console.log(ev);
            this.isConnected = false;
        };

        this._inboundHandler = inboundHandler ? inboundHandler : new InboundHandler(this);
        this._outboundHandler = outboundHandler ? outboundHandler : new OutBoundHandler(this);

    }

    private onOpen(ev: Event) {

        console.log('onOpen');
        console.log(ev);

        // send login
        this._outboundHandler.sendLogin();

        this.isConnected = true;
    }


    private onMessage(ev: MessageEvent) {

        console.log('onMessage');
        let pk = new BinaryReader(ev.data);

        this._inboundHandler.handlePacket(pk);
    }

    /**
     *
     * @param pk    packet should be recycled when necessary after calling sendPacket()
     */
    public sendPacket(pk: string | ArrayBufferLike | Blob | ArrayBufferView): void {

        // pk shouldn't be string; however, we support it ;-)

        this._websocket.send(pk);
    }

    public disconnect(serverInitiated: boolean = false, notify: boolean = true, reason?: string): void {

        if (serverInitiated) {
            // WebSocket should be closed by the server
            return;
        } else if (notify) {
            // this.outboundHandler.sendDisconnect();
            return;

        } else {
            this._websocket.close(1000, reason ? reason : 'client disconnect');
        }
    }

    /**
     * Register an event listener
     */
    public on(ev: EventType, callback: (...arg) => void) {
        this.eventEmitter.on(ev, callback);
    }

    /* *** Getters & Setters **/

    get inboundHandler(): InboundHandler {
        return this._inboundHandler;
    }

    get outboundHandler(): OutBoundHandler {
        return this._outboundHandler;
    }

    get isConnected(): boolean {
        return this._isConnected;
    }

    set isConnected(value: boolean) {
        this._isConnected = value;
        if (!value) this.eventEmitter.emit(EventType.PlayerDisconnect);
    }

    get hasSpawned(): boolean {
        return this._hasSpawned;
    }

    set hasSpawned(value: boolean) {
        this._hasSpawned = value;
        if (value) this.eventEmitter.emit(EventType.PlayerSpawn);
    }

    get startGameInfo(): StartGameInfo {
        return this._startGameInfo;
    }

    set startGameInfo(value: StartGameInfo) {
        this._startGameInfo = value;
    }

    get currentLocation(): PlayerLocation {
        return this._currentLocation;
    }

    set currentLocation(value: PlayerLocation) {
        this._currentLocation = value;
    }

    get world(): World {
        return this._world;
    }

    set world(value: World) {
        this._world = value;
    }

}
