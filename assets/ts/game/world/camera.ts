import { PerspectiveCamera } from "three";
import { setCamera } from "./app";

export const camera = new PerspectiveCamera(90, innerWidth / innerHeight);
camera.position.z = 2;
setCamera(camera);