import { Octree } from "./octree";
import { CompressedTextureLoader, Group, Material, Mesh, Texture, Vector2, Vector3 } from "three";
import { currentScene } from "../game/world/app";
import { createNoise2D } from "simplex-noise";
import { Block, BlockType } from "./block";
import { Map3D } from "./map";
import { WorkerMessageInterface, WorkerMessageType } from "../game/worker-enum";
import { Box, iterateGreedyMesh } from "./greedy-mesh";
/*
const noise = createNoise2D();
function getRandomElevation(pos: Vector2): number {
    function smooth(intensity: number): number {
        return noise(pos.x * intensity, pos.y * intensity);
    }

    return Math.floor(smooth(0.1) * 2) / 2 + 1;
}
*/
var worker: Worker;
export function setWorker(e: Worker) {
    worker = e;
}

export interface ChunkOpts {
    chunkPos: Vector3;
    CHUNK_SIZE: number;
    seed: number;
}

export class Chunk {
    step: number = 0.5;
    seed: number;
    octree: Octree;
    hasPhysics: boolean = false;
    chunkPos: Vector3;
    CHUNK_SIZE: number;
    map: Map3D<BlockType> = new Map3D();
    blockList: Block[] = [];
    workerListener?: (e: MessageEvent<WorkerMessageInterface>) => void;

    constructor(o: ChunkOpts) {
        this.seed = o.seed;
        this.octree = new Octree(o.chunkPos, o.CHUNK_SIZE);
        this.chunkPos = o.chunkPos;
        this.CHUNK_SIZE = o.CHUNK_SIZE;

        /*this.loopGrid(pos => {
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
        });*/

        this.#initWorkerListener();

        /*for(const block of this.blockList) {
            block.init(this.map);
            block.addToScene(currentScene);
        }*/
    }

    #initBlocks(block: Box): void {
        const pos = new Vector3(block.pos.x, block.pos.y, block.pos.z);

        /*
        if(block.isGreedyMeshed) {
            const voxel = new Block({
                pos,
                type: block.type,
                greedyMesh: {
                    width: block.width,
                    height: block.height,
                    depth: block.depth,
                },
            });

            for(let x = block.pos.x; x <= block.pos.x + block.width; x++) {
                for(let y = block.pos.y; y <= block.pos.y + block.height - 1; y += this.step) {
                    for(let z = block.pos.z; z <= block.pos.z + block.depth; z++) {
                        const pos = new Vector3(x, y, z);

                        if(pos.x == -2
                        && pos.y == 0.5
                        && pos.z == -3) console.log(block);

                        if(this.map.get(pos) != undefined) {
                            throw new Error(
                                "chunk.ts: "
                             +  `position (${x}, ${y}, ${z}) already has a block of type "${BlockType[block.type]}"`
                            );
                        }

                        this.map.set(pos, block.type);
                    }
                }
            }

            return voxel;

        } else {
            const voxel = new Block({
                pos,
                type: block.type,
            });

            if(this.map.get(pos) != undefined) throw new Error(
                "chunk.ts: "
            +   `yk`
            );
            this.map.set(pos, block.type);

            return voxel;
        }*/
    }

    #initWorkerListener() {
        const self = this;
        this.workerListener = function(e: MessageEvent<WorkerMessageInterface>) {
            const blockArray: Box[] | undefined = e.data.payload.blockArray as Box[];
            if(blockArray == undefined) return;

            iterateGreedyMesh(blockArray, 0.5, box => {
                const pos = new Vector3(box.pos.x, box.pos.y, box.pos.z);
                if(self.map.get(pos) != undefined) throw new Error(
                    "chunk.ts: "
                +   `block at (${box.pos.x}, ${box.pos.y}, ${box.pos.z}) is `
                +   "already filled"
                );
                self.map.set(pos, box.type);
            });

            for(const block of blockArray) {
                const pos = new Vector3(block.pos.x, block.pos.y, block.pos.z);

                if(block.isGreedyMeshed) {
                    const voxelBlock = new Block({
                        pos,
                        greedyMesh: {
                            width: block.width,
                            height: block.height,
                            depth: block.depth,
                        },
                        type: block.type,
                    });

                    self.blockList.push(voxelBlock);
                } else {
                    const voxelBlock = new Block({
                        pos,
                        type: block.type,
                    });

                    self.blockList.push(voxelBlock);
                }
            }

            
            worker.removeEventListener("message", this.workerListener!);

            for(const block of self.blockList) {
                block.init(self.map, true);
                block.addToScene(currentScene);
            }
        }

        worker.addEventListener("message", this.workerListener);

        worker.postMessage({
            type: WorkerMessageType.loadChunk,
            payload: {
                chunkPos: this.chunkPos,
            },
        });
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

        this.blockList = [];
    }
}