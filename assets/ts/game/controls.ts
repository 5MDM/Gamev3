import { $ } from "../framework/util";
import { MovementCamera } from "../framework/camera";

export const movementControlsDiv = <HTMLDivElement>$("#ui > #controls");
const forward = <HTMLImageElement>$("#ui > #controls #arrow-forward");
const left = <HTMLImageElement>$("#ui > #controls #arrow-left");
const backwards = <HTMLImageElement>$("#ui > #controls #arrow-backwards");
const right = <HTMLImageElement>$("#ui > #controls #arrow-right");

if(!forward || !left || !backwards || !right) throw new Error(
    "controls.ts: "
+   `One of the movement control buttons are undefined`
);

movementControlsDiv.addEventListener("dragstart", e => e.preventDefault());
movementControlsDiv.style.display = "none";

function down(a: HTMLImageElement, f: () => void): void {
    a.addEventListener("pointerdown", f);
}

function up(a: HTMLImageElement, f: () => void): void {
    a.addEventListener("pointerup", f);
}

export function bindMovement(o: MovementCamera) {
    movementControlsDiv.addEventListener("touchend", e => e.preventDefault());

    forward.style.pointerEvents = "auto";
    down(forward, () => o.enableMoveForward());
    up(forward, () => o.disableMoveForward());

    backwards.style.pointerEvents = "auto";
    down(backwards, () => o.enableMoveBackwards());
    up(backwards, () => o.disableMoveBackwards());

    left.style.pointerEvents = "auto";
    down(left, () => o.enableMoveLeft());
    up(left, () => o.disableMoveLeft());

    right.style.pointerEvents = "auto";
    down(right, () => o.enableMoveRight());
    up(right, () => o.disableMoveRight())

    addEventListener("keydown", e => {
        switch(e.key) {
            case "w": o.enableMoveForward(); break;
            case "s": o.enableMoveBackwards(); break;
            case "a": o.enableMoveLeft(); break;
            case "d": o.enableMoveRight(); break;
        }
    });

    addEventListener("keyup", e => {
        switch(e.key) {
            case "w": o.disableMoveForward(); break;
            case "s": o.disableMoveBackwards(); break;
            case "a": o.disableMoveLeft(); break;
            case "d": o.disableMoveRight(); break;
        }
    });
}