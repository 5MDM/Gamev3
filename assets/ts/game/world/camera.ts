import { PerspectiveCamera } from "three";
import { setCamera } from "./app";
import { ControlCamera } from "../../framework/camera";
import { $ } from "../../framework/util";

export const camera = new PerspectiveCamera(90, innerWidth / innerHeight);
camera.position.z = 2;
setCamera(camera);

const controlCam = new ControlCamera({
    threeCamera: camera,
    canvas: $("#c") as HTMLCanvasElement,
});