import { PerspectiveCamera } from "three";
import { setCamera } from "./app";
import { ControlCamera, MovementCamera } from "../../framework/camera";
import { $, clamp } from "../../framework/util";
import { bindMovement } from "../controls";

export const camera = new PerspectiveCamera(90, innerWidth / innerHeight, 0.1, 5 * 1000);
camera.position.y = 10;
setCamera(camera);

export const controlCam = new MovementCamera({
    threeCamera: camera,
    canvas: $("#c") as HTMLCanvasElement,
    defaultXRotation: -1.570796,
    defaultYRotation: 0,
});

bindMovement(controlCam);

controlCam.onTouchMove = function(x: number, y: number) {
    controlCam.rx += x * 0.01;
    controlCam.ry = clamp(
      -Math.PI / 2 + 0.1,
      controlCam.ry + (y * 0.01),
      Math.PI / 3,
    );
    
    this.updateCamera();
};

controlCam.onMouseMove = function(e: MouseEvent) {
    const dx = e.movementX;
    const dy = e.movementY;

    this.rx -= dx * 0.005;
    this.ry = clamp(
      -Math.PI / 2 + 0.1,
      this.ry - dy * 0.005,
      Math.PI / 3,
    );

    this.updateCamera();
}