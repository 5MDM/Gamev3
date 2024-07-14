import { WorkerMessageType } from "../game/worker-enum";
import { Block, BlockType } from "./block";
import { Map3D, Map2D } from "./map";
import { Vector2, Vector3 } from "three";

export interface MapInterface {
    [index: string]: Map3D<boolean>;
}

export interface GreedyMeshInterface {
    CHUNK_SIZE: number;
    chunkPos: Vector3;
    yStep: number;
    maps: MapInterface;
    minY: number;
    maxY: number;
    center: boolean;
}

interface BoundsInterface {
    max: Vector3;
    min: Vector3;
}

interface IndividualMeshInterface {
    yStep: number;
    bounds: BoundsInterface;
    boxArray: Box[];
    type: number;
    maps: MapInterface;
}

export interface Box {
    pos: {
        x: number;
        y: number;
        z: number;
    };
    width: number;
    height: number;
    depth: number;
    type: number;
    isGreedyMeshed: boolean;
}

interface zSliceInterface {
    x: number;
    y: number;
    minZ: number;
    maxZ: number;
}

interface MergeMeshInterface {
    pos: Vector3;
    maxBounds: Vector3;
    map: Map3D<boolean>;
    yStep: number;
    type: number;
}

export class GreedyMesh {
    log: (e: any) => void;

    constructor(postMessage?: (message: any) => void) {
        this.log = function(e: any) {
            postMessage?.({
                type: WorkerMessageType.log,
                payload: e,
            });
        };
    }

    #calculateXZBounds(chunkPos: Vector3, CHUNK_SIZE: number): BoundsInterface {
        const min = new Vector3(
            chunkPos.x * CHUNK_SIZE,
            0,
            chunkPos.z * CHUNK_SIZE,
        );
        
        const max = new Vector3(
            min.x + CHUNK_SIZE,
            0,
            min.z + CHUNK_SIZE,
        );

        return {min, max};
    }

    greedyMesh(o: GreedyMeshInterface): Box[] {
        const bounds: BoundsInterface = this.#calculateXZBounds(o.chunkPos, o.CHUNK_SIZE);
        const boxArray: Box[] = [];

        if(o.center) {
            const half = o.CHUNK_SIZE / 2;
            bounds.min.x -= half;
            bounds.min.z -= half;
            bounds.max.x -= half;
            bounds.max.z -= half;
        }

        bounds.max.y = o.maxY;
        bounds.min.y = o.minY;
        if(bounds.max.y == bounds.min.y) throw new Error(
            "greedy-mesh.ts: "
        +   `max Y and min Y can't be the same (both values are: ${bounds.max.y})`
        );

        for(const type in o.maps) {
            const boxes = this.#individualMesh({
                yStep: o.yStep,
                bounds,
                boxArray,
                type: Number(type),
                maps: o.maps,
            });

            boxArray.push(...boxes);
        }

        return boxArray;
    }

    #individualMesh(o: IndividualMeshInterface): Box[] {
        var time = 1;
        const boxArray: Box[] = [];

        for(let z = o.bounds.min.z; z <= o.bounds.max.z; z++) {

            // o.bounds.min.y and o.bounds.max.y are both 0
            for(let y = o.bounds.min.y; y <= o.bounds.max.y; y += o.yStep) {

                for (let x = o.bounds.min.x; x <= o.bounds.max.x; x++) {

                    const pos = new Vector3(x, y, z);
                    const block = o.maps[o.type].get(pos);
                    if(block == undefined) continue;

                    // block found
                    const box: Box = this.#mergeMesh({
                        pos,
                        maxBounds: o.bounds.max,
                        map: o.maps[o.type],
                        yStep: o.yStep,
                        type: o.type,
                    });

                    boxArray.push(box);
                }
            }
        }

        return boxArray;
    }

    #mergeMesh(o: MergeMeshInterface): Box {
        const maxBounds = {
            x: o.maxBounds.x,
            y: o.maxBounds.y,
            z: o.maxBounds.z,
        };

        function iterateDimension(type: "x" | "y" | "z", f: (d: number, end: () => void) => void) {
            var hasEnded = false;
            function end() {
                hasEnded = true
            }

            var d = o.pos[type];
            const max = maxBounds[type];

            if(type == "y") {
                for( ; d <= max; d += o.yStep) {
                    f(d, end);

                    if(hasEnded) return;
                }
            } else {
                for( ; d <= max; d++) {
                    f(d, end);

                    if(hasEnded) return;
                }
            }
        }

        const box: Box = {
            pos: o.pos,
            width: 1,
            height: 1,
            depth: 1,
            type: BlockType.grass,
            isGreedyMeshed: true,
        };
        
        const cursor = new Vector3(box.pos.x, box.pos.y, box.pos.z);
        const firstYLayer = box.pos.y;
        const firstZLayer = box.pos.z;

        iterateDimension("x", (x, end) => {
            cursor.x = x;
            const block = o.map.get(cursor);

            box.width = x;
            if(block == undefined) return end();

            o.map.remove(cursor);
        });

        maxBounds.x = box.width-1;

        iterateDimension("y", (y, endY) => {
            if(y == firstYLayer) return;
            var hasEnded: boolean = false;
            cursor.y = y;

            const toBeRemoved: Vector3[] = [];
            iterateDimension("x", (x, endX) => {
                cursor.x = x;
                const block = o.map.get(cursor);

                if(block == undefined) {
                    hasEnded = true;
                    return endX();
                }

                toBeRemoved.push(cursor.clone());
            });

            box.height = y;
            if(hasEnded) return endY();

            for(const pos of toBeRemoved) o.map.remove(pos);
        });

        maxBounds.y = box.height-1;

        iterateDimension("z", (z, endZ) => {
            if(z == firstZLayer) return;
            var hasEnded = false;

            cursor.z = z;

            const toBeRemoved: Vector3[] = [];
            iterateDimension("y", (y, endY) => {

                cursor.y = y;

                iterateDimension("x", (x, endX) => {

                    cursor.x = x;
                    const block = o.map.get(cursor);

                    if(block == undefined) {
                        hasEnded = true;
                        endY();
                        return endX();
                    }

                    toBeRemoved.push(cursor.clone());
                });

            });

            box.depth = z;
            if(hasEnded) return endZ();

            for(const pos of toBeRemoved) o.map.remove(pos);
        });

        // width, height, depth is min
        // o.pos is max
        box.width -= o.pos.x;
        box.height -= o.pos.y;
        box.depth -= o.pos.z;

        if(box.width == 1
        && box.height == 1
        && box.depth == 1) box.isGreedyMeshed = false;

        return box;
    }
}