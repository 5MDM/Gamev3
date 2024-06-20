import { PerspectiveCamera } from "three";


function NOOP() {}

export interface ControlCameraOpts {
    threeCamera: PerspectiveCamera;
    canvas: HTMLCanvasElement;
}

interface TouchInterface {
    x: number;
    y: number;
    lx: number;
    ly: number;
    id: number;
    down: boolean;
}

export class ControlCamera {
    threeCamera: PerspectiveCamera;
    canPan: boolean = true;
    c: HTMLCanvasElement;

    onTouchMove: ((x: number, y: number) => void) = NOOP;
    onMouseMove: ((evt: MouseEvent) => void) = NOOP;
    onPointerUnlock: (() => void) = NOOP;

    touch: TouchInterface = {
        x: 0,
        y: 0,
        lx: 0,
        ly: 0,
        id: NaN,
        down: false,
    };

    constructor(opts: ControlCameraOpts) {
        this.threeCamera = opts.threeCamera;
        this.c = opts.canvas;
        this.#addListeners();
    }

    #addListeners(): void {
        this.c.addEventListener("pointerup", e => {
            if(this.touch.down) {
                this.touch.down = false;
                this.touch.id = NaN;
            }
        });

        this.c.addEventListener("pointerdown", e => {
            if(!this.touch.down) {
                this.touch.down = true;
                this.touch.id = e.pointerId;
                this.touch.lx = e.pageX;
                this.touch.ly = e.pageY;
            }
        });

        this.c.addEventListener("touchmove", e => {
            e.preventDefault();
            if(!this.canPan) return;
            const touch: Touch = e.targetTouches[e.targetTouches.length - 1];

            if(touch.identifier == this.touch.id) {
                this.touch.x = this.touch.lx - touch.pageX;
                this.touch.y = this.touch.ly - touch.pageY;
                this.touch.lx = touch.pageX;
                this.touch.ly = touch.pageY;
          
                this.onTouchMove(this.touch.x, this.touch.y);
            }
        });

        this.c.addEventListener("mousemove", (e: MouseEvent) => {
            if(document.pointerLockElement != this.c) return;
            if(!this.canPan) return;
            this.onMouseMove(e);
        });

        document.addEventListener("pointerlockchange", () => {
            if(document.pointerLockElement == this.c) return;
            this.canPan = false;
            this.onPointerUnlock();
        });
    }
}