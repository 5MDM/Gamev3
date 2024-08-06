import { Octree } from "./octree";
import { Mesh, Vector2, Vector3 } from "three";
import { currentScene } from "../game/world/app";
import { Block } from "./block";
import { Map3D } from "./map";
import { Box, iterateGreedyMesh } from "./greedy-mesh";
import { generateBlocks } from "./world-gen";
/*
const noise = createNoise2D();
function getRandomElevation(pos: Vector2): number {
    function smooth(intensity: number): number {
        return noise(pos.x * intensity, pos.y * intensity);
    }

    return Math.floor(smooth(0.1) * 2) / 2 + 1;
}
*/

export interface ChunkOpts {
    chunkPos: Vector3;
    CHUNK_SIZE: number;
    seed: number;
}

export class Chunk {
    maxX: number;
    minX: number;

    step: number = 0.5;
    seed: number;
    octree: Octree;
    hasPhysics: boolean = false;
    chunkPos: Vector3;
    CHUNK_SIZE: number;
    CHUNK_SIZE_H: number;
    map: Map3D<string> = new Map3D();
    blockList: Block[] = [];

    constructor(o: ChunkOpts) {
        this.seed = o.seed;
        this.octree = new Octree(o.chunkPos, o.CHUNK_SIZE);
        this.chunkPos = o.chunkPos;
        this.minX = this.chunkPos.y;
        this.maxX = this.chunkPos.y;
        this.CHUNK_SIZE = o.CHUNK_SIZE;
        this.CHUNK_SIZE_H = o.CHUNK_SIZE / 2;

        this.#init();
    }

    #init() {
        const boxArray: Box[] = generateBlocks(this.chunkPos);

        if (boxArray == undefined) return;

        iterateGreedyMesh(boxArray, 0.5, box => {
            const pos = new Vector3(box.pos.x, box.pos.y, box.pos.z);
            /*if(self.map.get(pos) != undefined) throw new Error(
                "chunk.ts: "
            +   `block at (${box.pos.x}, ${box.pos.y}, ${box.pos.z}) is `
            +   "already filled"
            );*/
            this.map.set(pos, box.type);
        });

        for (const block of boxArray) {
            const pos = new Vector3(block.pos.x, block.pos.y, block.pos.z);

            if(block.isGreedyMeshed) {
                pos.add({
                    x: block.width / 2,
                    y: block.height / 2,
                    z: block.depth / 2,
                });

                pos.sub({
                    x: this.CHUNK_SIZE_H,
                    y: 0,
                    z: this.CHUNK_SIZE_H,
                });

                const voxelBlock = new Block({
                    pos,
                    greedyMesh: {
                        width: block.width,
                        height: block.height,
                        depth: block.depth,
                    },
                    type: block.type,
                });

                this.blockList.push(voxelBlock);
            } else {
                const voxelBlock = new Block({
                    pos,
                    type: block.type,
                });

                this.blockList.push(voxelBlock);
            }
        }

        for (const block of this.blockList) {
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
    
    destroy(): void {
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

        this.blockList = [];
    }
}