import { Map3D } from "./map";
import { Vector3 } from "three";

export interface BlockTypesInterface {
    [blockName: string]: Map3D<true>;
}

export interface GreedyMeshInterface {
    chunkPos: Vector3;
    maps: BlockTypesInterface;
}

interface XYZ {
    x: number;
    y: number;
    z: number;
}

export interface Box {
    pos: XYZ;
    width: number;
    height: number;
    depth: number;
    type: string;
    isGreedyMeshed: boolean;
}

export function iterateGreedyMesh(blocks: Box[], yStep: number, f: (box: Box) => void) {
    function iterateGreedyBoxes(block: Box) {
        for(let x = block.pos.x; x <= block.pos.x + block.width - 1; x++) {
            for(let y = block.pos.y; y <= block.pos.y + block.height - 1; y += yStep) {
                for(let z = block.pos.z; z <= block.pos.z + block.depth - 1; z++) {
                    f({
                        pos: { x, y, z },
                        isGreedyMeshed: false,
                        width: 1,
                        height: 1,
                        depth: 1,
                        type: block.type,
                    });
                }
            }
        }
    }

    for(const block of blocks) {
        if(block.isGreedyMeshed) {
            iterateGreedyBoxes(block);
        } else {
            f(block);
        }
    }
}

interface GreedyMeshInit {
    CHUNK_SIZE: number;
    yStep: number;
}

interface MergeMeshOpts {
    readonly pos: Vector3;
    readonly max: Readonly<XYZ>;
    readonly min: Readonly<XYZ>;
    readonly type: string;
    blockMap: Map3D<true>;
}

// i, j, k are chunk relative positions

export class GreedyMesh {
    CHUNK_SIZE: number;
    CHUNK_SIZE_SQUARED: number;
    CHUNK_SIZE_CUBED: number;
    CHUNK_SIZE_I: number;
    yStep: number;

    constructor(o: GreedyMeshInit) {
        this.CHUNK_SIZE = o.CHUNK_SIZE;
        this.CHUNK_SIZE_I = this.CHUNK_SIZE-1;
        this.CHUNK_SIZE_SQUARED = this.CHUNK_SIZE ** 2;
        this.CHUNK_SIZE_CUBED = this.CHUNK_SIZE ** 3;
        this.yStep = o.yStep;
    }

    greedyMesh(chunkPos: Vector3, blockTypes: BlockTypesInterface, minY?: number, maxY?: number): Box[] {
        minY ||= chunkPos.y * this.CHUNK_SIZE;
        maxY ||= minY + this.CHUNK_SIZE_I;

        const minZ = chunkPos.z * this.CHUNK_SIZE;
        const maxZ = minZ + this.CHUNK_SIZE_I;

        const minX = chunkPos.x * this.CHUNK_SIZE;
        const maxX = minX + this.CHUNK_SIZE_I;

        const blocks: Box[] = [];

        for(const blockName in blockTypes) {
            const blockMap: Map3D<true> = blockTypes[blockName];

            for(let z = minZ; z <= maxZ; z++) {
                for(let y = minY; y <= maxY; y += this.yStep) {
                    for(let x = minX; x <= maxX; x++) {
                        const pos = new Vector3(x, y, z);
                        const block: true | undefined = blockMap.get(pos);

                        if(block == undefined) continue;
                        const mergedBlock: Box = this.#mergeMesh({
                            pos,
                            type: "Grass",
                            blockMap,
                            min: {
                                x: pos.x,
                                y: pos.y,
                                z: pos.z,
                            },
                            max: {
                                x: maxX,
                                y: maxY,
                                z: maxZ,
                            },
                        });

                        blocks.push(mergedBlock);
                    }
                }
            }
        }

        return blocks;
    }

    #mergeMesh(o: Readonly<MergeMeshOpts>): Box {
        const min: XYZ = {
            x: o.min.x,
            y: o.min.y,
            z: o.min.z,
        };

        const max: XYZ = {
            x: o.max.x,
            y: o.max.y,
            z: o.max.z,
        };

        function checkNegative(n: number, type: "width" | "height" | "depth"): void | never {
            if(n <= 0) throw new Error(
                "greedy-mesh.ts: "
            +   `${type} is negative or 0. Here's the value: ${n}. Debug: ${min.x}, ${max.x}`
            );
        }

        function iterate(type: "x" | "y" | "z", f: (d: number, end: () => void) => void) {
            const min2 = min[type];
            const max2 = max[type];

            var hasEnded: boolean = false;
            function end(): void {
                hasEnded = true;
            }

            for(let i = min2; i <= max2; i++) {
                f(i, end);
                if(hasEnded) return;
            }
        }

        const box: Partial<Box> = {
            width: 1,
            height: 1,
            depth: 1,
            isGreedyMeshed: true,
        };

        const cursor = new Vector3(o.min.x, o.min.y, o.min.z);
        const firstYLayer = cursor.y;
        const firstXLayer = cursor.x;

        iterate("z", (z: number, end: () => void) => {
            cursor.z = z;

            const block: boolean | undefined = o.blockMap.get(cursor);

            if(!block) return end();

            max.z = z;
            o.blockMap.remove(cursor);
        });

        box.depth = max.z - min.z + 1;

        checkNegative(box.depth, "depth");

        iterate("y", (y, endY) => {
            if(y == firstYLayer) return;

            const blocksToRemove: Vector3[] = [];
            var hasEnded: boolean = false;

            cursor.y = y;

            iterate("z", (z, endZ) => {
                cursor.z = z;

                const block: boolean | undefined = o.blockMap.get(cursor);
                if(!block) {
                    hasEnded = true;
                    return endZ();
                }

                blocksToRemove.push(cursor.clone());
            });

            if(hasEnded) return endY();

            max.y = y;
            for(const vectors of blocksToRemove) o.blockMap.remove(vectors);
        });

        box.height = max.y - min.y + 1;
        checkNegative(box.height, "height");

        iterate("x", (x, endX) => {
            if(x == firstXLayer) return;
            const blocksToRemove: Vector3[] = [];
            var hasEnded: boolean = false;

            cursor.x = x;
            max.x = x;

            iterate("y", (y, endY) => {
                cursor.y = y;

                iterate("z", (z, endZ) => {
                    cursor.z = z;

                    const block: true | undefined = o.blockMap.get(cursor);
                    if(!block) {
                        hasEnded = true;
                        endY();
                        endZ();
                        return;
                    }

                    blocksToRemove.push(cursor.clone());
                });
            });

            if(hasEnded) return endX();

            max.x = x;
            for(const vectors of blocksToRemove) o.blockMap.remove(vectors);
        });

        box.width = max.x - min.x + 1;
        checkNegative(box.width, "width");

        box.pos = {
            x: o.pos.x,
            y: o.pos.y,
            z: o.pos.z,
        } as XYZ;

        box.type = o.type;
        if(box.width == 1
        && box.height == 1
        && box.depth == 1) box.isGreedyMeshed = false;

        return box as Box;
    }
}