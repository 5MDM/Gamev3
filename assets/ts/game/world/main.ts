import { BoxGeometry, CanvasTexture, Mesh, MeshBasicMaterial, SRGBColorSpace, Scene, Vector3, DataArrayTexture, DataTexture } from "three";
import { World } from "../../framework/world";
import { renderLoop, setScene } from "./app";
import { $ } from "../../framework/util";
import { worker } from "../worker";
import { setWorker } from "../../framework/chunk";
import "./camera";

// decrease for pixelation
const IMAGE_SIZE = 32;
export const CHUNK_SIZE = 8;

const scene = new Scene();
setScene(scene);
setWorker(worker);

($("#ui > #loading") as HTMLDivElement)!.style.display = "none";

export async function startGame() {
    /*const canvasTexture = new CanvasTexture(atlas.canvas);
    canvasTexture.colorSpace = SRGBColorSpace;

    const world = new World({
        CHUNK_SIZE,
        scene,
        textureAtlas: textureArray,
        uv: {
            size: IMAGE_SIZE,
            imageWidth: 32,
            imageHeight: 32,
        },
    });*/

    const m = new Mesh(
        new BoxGeometry(100, 1, 100),
        new MeshBasicMaterial({color: 0xfff000})
    );
    m.position.z = -10;
    scene.add(m);

    /*world.generateChunk(new Vector3(0, 0, 0));
    world.generateChunk(new Vector3(1, 0, 0));
    world.generateChunk(new Vector3(0, 0, 1));
    world.generateChunk(new Vector3(1, 0, 1));
    world.generateChunk(new Vector3(-1, 0, 0));
    world.generateChunk(new Vector3(0, 0, -1));
    world.generateChunk(new Vector3(-1, 0, -1));*/
    //world.generateChunk(new Vector3(0, 0, 0))
    renderLoop();
}