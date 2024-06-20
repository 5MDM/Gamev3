import { AtlasGenerator, AtlasGeneratorOutput } from "../../framework/atlas-loader";
import { BoxGeometry, CanvasTexture, Mesh, MeshBasicMaterial, SRGBColorSpace, Scene, Vector3 } from "three";
import { World } from "../../framework/world";
import { renderLoop, setScene } from "./app";
import "./camera";

const IMAGE_SIZE = 32;

const scene = new Scene();
setScene(scene);

const textureURL = await import("../../../data/blocks.json");
const atlasGenerator = new AtlasGenerator();

atlasGenerator.setTextureObj(textureURL);

export function startGame() {
    const atlas: AtlasGeneratorOutput = atlasGenerator.generateAtlas({
        size: IMAGE_SIZE,
    });

    const canvasTexture = new CanvasTexture(atlas.canvas);
    canvasTexture.colorSpace = SRGBColorSpace;

    const world = new World({
        CHUNK_SIZE: 16,
        scene,
        textureAtlas: canvasTexture,
        uv: {
            size: IMAGE_SIZE,
            imageWidth: atlas.width,
            imageHeight: atlas.height,
        },
    });

    world.generateChunksWithinRadius(new Vector3(0, 0, 0), 1);
    renderLoop();
}