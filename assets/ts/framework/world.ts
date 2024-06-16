import { Texture, Scene, AmbientLight, NearestFilter, NearestMipmapNearestFilter, Vector2, Vector3 } from "three";
import {Map3D} from "./map";
import { Group } from "three/examples/jsm/libs/tween.module.js";
import { Octree } from "./octree";
import { OctreeHelper } from "three/examples/jsm/Addons.js";
import {Chunk} from "./chunk";

export function executeInRadius(pos: Vector3, r: number, f: (pos: Vector3) => void) {
    if(r <= 0) throw new Error(
        "world.ts: Radius can't be below a 1. "
    +   `Instead got "${r}"`
    );

    for(let dx = -r; dx <= r; dx++) {
        for(let dy = -r; dy <= r; dy++) {
            for(let dz = -r; dz <= r; dz++) {
                // Calculate the actual distance from the center
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if(distance <= r) {
                    const actualX = pos.x + dx;
                    const actualY = pos.y + dy;
                    const actualZ = pos.z + dz;

                    // Call the callback function with the calculated coordinates
                    f(new Vector3(actualX, actualY, actualZ));
                }
            }
        }
    }

}

interface WorldOpts {
    scene: Scene;
    CHUNK_SIZE: number;
    textureAtlas: Texture;
    uv: {
        size: number;
        imageWidth: number;
        imageHeight: number;
    };
}

export class World {
    scene: Scene;
    CHUNK_SIZE: number;
    textureAtlas: Texture;
    tileWidthRatio: number;
    tileHeightRatio: number;
    map: Map3D<Chunk> = new Map3D();

    constructor(opts: WorldOpts) {
        this.CHUNK_SIZE = opts.CHUNK_SIZE;
        this.textureAtlas = opts.textureAtlas;
        this.tileWidthRatio = opts.uv.size / opts.uv.imageWidth;
        this.tileHeightRatio = opts.uv.size / opts.uv.imageHeight;
        this.scene = opts.scene;

        this.scene.add(new AmbientLight(0x404040, 50));

        this.textureAtlas.magFilter = NearestFilter;
        this.textureAtlas.minFilter = NearestMipmapNearestFilter;
        this.textureAtlas.generateMipmaps = false;
    }

    generatePhysicsWithinRadius(pos: Vector3, r: number) {
        pos.divideScalar(this.CHUNK_SIZE);
        pos.floor();
        executeInRadius(pos, r, this.generatePhysics);
    }

    generateChunksWithinRadius(pos: Vector3, r: number) {
        pos.divideScalar(this.CHUNK_SIZE);
        pos.floor();
        executeInRadius(pos, r, this.generateChunk);
    }

    generatePhysics(chunkPos: Vector3) {

    }

    generateChunk(chunkPos: Vector3) {
        
    }
}