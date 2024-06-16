import { Texture, Scene, AmbientLight, NearestFilter, NearestMipmapNearestFilter, Vector2, Vector3 } from "three";

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

    #executeInRadius(pos: Vector3, r: number, f: (pos: Vector3) => void) {
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

    generatePhysicsWithinRadius(pos: Vector3, r: number) {
        this.#executeInRadius(pos, r, this.generatePhysics);
    }

    generateChunksWithinRadius(pos: Vector3, r: number) {
        this.#executeInRadius(pos, r, this.generateChunk);
    }

    generatePhysics(pos: Vector3) {

    }

    generateChunk(pos: Vector3) {
        
    }
}