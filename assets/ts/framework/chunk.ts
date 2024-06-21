import { Octree } from "./octree";
import { Group, Material, Mesh, Texture, Vector2, Vector3 } from "three";
import { currentScene } from "../game/world/app";
import { createNoise2D } from "simplex-noise";
import { Block, BlockType } from "./block";

const noise = createNoise2D();
function getRandomElevation(pos: Vector2): number {
    function smooth(intensity: number): number {
        return noise(pos.x * intensity, pos.y * intensity);
    }

    return smooth(0.5);
}

export interface ChunkOpts {
    chunkPos: Vector3;
    CHUNK_SIZE: number;
    seed: number;
}

export class Chunk {
    seed: number;
    octree: Octree;
    group: Group = new Group();
    hasPhysics: boolean = false;
    chunkPos: Vector3;
    CHUNK_SIZE: number;

    constructor(o: ChunkOpts) {
        this.seed = o.seed;
        this.octree = new Octree(o.chunkPos, o.CHUNK_SIZE);
        this.chunkPos = o.chunkPos;
        this.CHUNK_SIZE = o.CHUNK_SIZE;

        this.loopGrid(pos => {
            const elevation = getRandomElevation(pos);
            const block = new Block({
                BLOCK_SIZE: 1,
                pos: new Vector3(pos.x, elevation, pos.y),
                type: BlockType.stone,
            });
            return block;
        });
    }

    loopGrid(f: (pos: Vector2) => Block) {
        for(let x = this.chunkPos.x; x != this.chunkPos.x + this.CHUNK_SIZE; x++) {
            for(let z = this.chunkPos.z; z != this.chunkPos.z + this.CHUNK_SIZE; z++) {
                const block: Block = f(new Vector2(x, z));
                block.addToScene(currentScene);
            }
        }
    }

    loadPhysics() {
        if(this.hasPhysics) return;
        this.hasPhysics = true;
    }
    
    delete() {
        this.octree.delete();
        for(const mesh of this.group.children) {
            if(!(mesh instanceof Mesh)) throw new Error(
                "chunk.ts: Group children isn't of type \"Mesh\". Instead got type of "
            +   `"${typeof mesh}"`
            );
            
            currentScene.remove(mesh);

            if(mesh.geometry) {
                mesh.geometry.dispose();
            } else {
                throw new Error(
                    "chunk.ts: Mesh doesn't have geometry to delete"
                );
            }

            /*if(mesh.material) {
                if(!(mesh.material instanceof Material)) throw new Error(
                    "chunk.ts: Mesh's material property isn't instance of material. "
                +   `Instead, it's a type of "${typeof mesh.material}"`
                );

                mesh.material.dispose();
            } else {
                throw new Error(
                    "chunk.ts: Mesh doesn't have material to delete"
                );
            }*/

            mesh.clear();
        }
        this.group.clear();
    }
}