import { Octree } from "./octree";
import { Group, Material, Mesh, Texture, Vector2, Vector3 } from "three";
import { currentScene } from "../game/world/app";
import { createNoise2D } from "simplex-noise";
import { Block, BlockType } from "./block";
import { Map3D } from "./map";

const noise = createNoise2D();
function getRandomElevation(pos: Vector2): number {
    function smooth(intensity: number): number {
        return noise(pos.x * intensity, pos.y * intensity);
    }

    return Math.floor(smooth(0.1) * 2) / 2 + 1;
}

export interface ChunkOpts {
    chunkPos: Vector3;
    CHUNK_SIZE: number;
    seed: number;
}

export class Chunk {
    seed: number;
    octree: Octree;
    hasPhysics: boolean = false;
    chunkPos: Vector3;
    CHUNK_SIZE: number;
    map: Map3D<BlockType> = new Map3D();
    blockList: Block[] = [];

    constructor(o: ChunkOpts) {
        this.seed = o.seed;
        this.octree = new Octree(o.chunkPos, o.CHUNK_SIZE);
        this.chunkPos = o.chunkPos;
        this.CHUNK_SIZE = o.CHUNK_SIZE;

        this.loopGrid(pos => {
            const elevation = getRandomElevation(pos);
            const type = Math.floor(Math.random() * 2);
            const newPos = new Vector3(pos.x, o.chunkPos.y * this.CHUNK_SIZE + elevation, pos.y);
            const block = new Block({
                pos: newPos,
                type,
            });
            this.map.set(newPos, type);
            this.blockList.push(block);
            //block.init(this.map);
            //block.addToScene(currentScene);

            return block;
        });

        for(const block of this.blockList) {
            block.init(this.map);
            block.addToScene(currentScene);
        }
    }

    loopGrid(f: (pos: Vector2) => Block) {
        const step = 0.5;
        const CHUNK_SIZE_HALF = this.CHUNK_SIZE / 2;
        for(let x = this.chunkPos.x * this.CHUNK_SIZE; x <= this.chunkPos.x * this.CHUNK_SIZE + this.CHUNK_SIZE; x += step) {
            for(let z = this.chunkPos.z * this.CHUNK_SIZE; z <= this.chunkPos.z * this.CHUNK_SIZE + this.CHUNK_SIZE; z += step) {
                const block: Block = f(new Vector2(x - CHUNK_SIZE_HALF, z - CHUNK_SIZE_HALF));
            }
        }
    }

    loadPhysics() {
        if(this.hasPhysics) return;
        this.hasPhysics = true;
    }
    
    delete() {
        this.octree.delete();
        this.map.destroy();
        for(const {mesh} of this.blockList) {
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
    }
}