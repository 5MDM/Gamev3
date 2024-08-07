import { Scene, AmbientLight, Vector3 } from "three";
import { Map3D } from "./map";
import { Chunk } from "./chunk";
import { initMaterial } from "./block";
import { executeInRadius } from "./map";
import { BlockTextureMap } from "../game/parser/parser-class";

interface WorldOpts {
    scene: Scene;
    CHUNK_SIZE: number;
    textureObj: BlockTextureMap;
    uv: {
        size: number;
        imageWidth: number;
        imageHeight: number;
    };
}

export class World {
    scene: Scene;
    CHUNK_SIZE: number;
    tileWidthRatio: number;
    tileHeightRatio: number;
    chunkMap: Map3D<Chunk> = new Map3D();

    constructor(opts: WorldOpts) {
        this.CHUNK_SIZE = opts.CHUNK_SIZE;
        this.tileWidthRatio = opts.uv.size / opts.uv.imageWidth;
        this.tileHeightRatio = opts.uv.size / opts.uv.imageHeight;
        this.scene = opts.scene;

        this.scene.add(new AmbientLight(0xffffff, 50));

        initMaterial({
            textures: opts.textureObj,
            tileSize: opts.uv.size,
            tileWidthRatio: this.tileWidthRatio,
            tileHeightRatio: this.tileHeightRatio,
        });
    }

    generatePhysicsWithinRadius(pos: Vector3, r: number) {
        pos.divideScalar(this.CHUNK_SIZE);
        pos.floor();
        executeInRadius(pos, r, newPos => this.generatePhysics(newPos));
    }

    generateChunksWithinRadius(pos: Vector3, r: number) {
        pos.divideScalar(this.CHUNK_SIZE);
        pos.floor();
        executeInRadius(pos, r, newPos => {
            setTimeout(() => this.generateChunk(newPos), Math.round(Math.random() * 10_000));
        });
    }

    generatePhysics(chunkPos: Vector3) {
        const chunk = this.chunkMap.get(chunkPos);
        if(chunk == undefined) throw new Error(
            "world.ts: chunk wasn't loaded"
        );

        chunk.loadPhysics();
    }

    generateChunk(chunkPos: Vector3) {
        if(this.chunkMap.get(chunkPos) != undefined) return;

        const chunk = new Chunk({
            seed: Math.round(Math.random() * 100),
            chunkPos, 
            CHUNK_SIZE: this.CHUNK_SIZE,
        });

        this.chunkMap.set(chunkPos, chunk);
    }
}