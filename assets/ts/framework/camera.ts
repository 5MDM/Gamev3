import { PerspectiveCamera, Quaternion, Vector3 } from "three";

function NOOP() {}

export interface ControlCameraOpts {
    threeCamera: PerspectiveCamera;
    canvas: HTMLCanvasElement;
    defaultXRotation: number;
    defaultYRotation: number;
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
    rx: number;
    ry: number;
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
        this.rx = opts.defaultXRotation;
        this.ry = opts.defaultYRotation;
        this.#addListeners();
        this.updateCamera();
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

    updateCamera() {
        const xRot = new Quaternion();
        xRot.setFromAxisAngle(new Vector3(0, 1, 0), this.rx);

        const zRot = new Quaternion()
        zRot.setFromAxisAngle(new Vector3(1, 0, 0), this.ry);

        const fullRot = new Quaternion();
        fullRot.multiply(xRot);
        fullRot.multiply(zRot);
        this.threeCamera.quaternion.copy(fullRot);
    }
}

interface MovementQueueInterface {
    type: string;
    vector: Vector3;
}

export class MovementCamera extends ControlCamera {
    #direction: Vector3 = new Vector3();

    moving;

    forwardSpeed: number = 0.1;

    constructor(o: ControlCameraOpts) {
        super(o);

        this.moving = {
            forward: false,
            backwards: false,
            left: false,
            right: false,
            up: false,
            down: false,
        };
        this.#loop();
    }

    #loop() {
        const self = this;
        const fps60 = 1000 / 60;

        var lastUpdate = Date.now();
        function ticker() {
            const now = Date.now();
            const deltaTime = (now - lastUpdate) / fps60;
            lastUpdate = now;
            
            console.log(self.moving.backwards)
            if(self.moving.forward) {
                self.#moveForward(deltaTime);
            } else if(self.moving.backwards) {
                self.#moveBackwards(deltaTime);
            }

            requestAnimationFrame(ticker);
        }

        ticker();
    }

    #moveForward(delta: number): void {
        this.threeCamera.getWorldDirection(this.#direction);
        this.#direction.y = 0;
        this.#direction.normalize();
        this.#direction.multiplyScalar(this.forwardSpeed * delta);
        this.threeCamera.position.add(this.#direction);
    }

    #moveBackwards(delta: number): void {
        this.threeCamera.getWorldDirection(this.#direction);
        this.#direction.y = 0;
        this.#direction.normalize();
        this.#direction.multiplyScalar(this.forwardSpeed * delta);
        this.threeCamera.position.sub(this.#direction);
    }

    enableMoveForward():    void {this.moving.forward = true}
    enableMoveBackwards():  void {this.moving.backwards = true}
    enableMoveLeft():       void {this.moving.left = true}
    enableMoveRight():      void {this.moving.right = true}
    enableMoveUp():         void {this.moving.up = true}
    enableMoveDown():       void {this.moving.down = true}

    disableMoveForward():   void {this.moving.forward = false}
    disableMoveBackwards():  void {this.moving.backwards = false}
}

/*
const e = new MovementCamera();

event("pointerdown", () => e.enableMoveForward());
event("pointerup", () => e.disableMoveForward());
conso*/