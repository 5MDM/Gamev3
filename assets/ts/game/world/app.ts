import {Camera, Scene, WebGLRenderer} from "three";
import { $ } from "../../framework/util";
import { gameState } from "../../start/window";

export const app = new WebGLRenderer({
    canvas: $("#c"),
    precision: "lowp",
    powerPreference: "high-performance",
});

if(!gameState.devMode) app.debug.checkShaderErrors = false;

app.shadowMap.autoUpdate = false;

export var currentScene: Scene;
export var currentCamera: Camera;

export function setScene(e: Scene) {
    currentScene = e;
}

export function setCamera(e: Camera) {
    currentCamera = e;
}

export function renderLoop() {
    app.render(currentScene, currentCamera);
    requestAnimationFrame(renderLoop);
}

// app.setPixelRatio(window.devicePixelRatio);
app.setSize(gameState.canvas.width, gameState.canvas.height);