import { WorkerMessageType } from "../game/worker-enum";
import { Map3D, Map2D } from "./map";
import { Vector2, Vector3 } from "three";

interface MapInterface {
    [index: string]: Map3D<boolean>;
}

export interface GreedyMeshInterface {
    CHUNK_SIZE: number;
    chunkPos: Vector3;
    yStep: number;
    maps: MapInterface;
    minY: number;
    maxY: number;
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

    constructor(postMessage: (message: any) => void) {
        this.log = function(e: any) {
            postMessage({
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

        for(let z = o.bounds.min.z; z < o.bounds.max.z; z++) {

            // o.bounds.min.y and o.bounds.max.y are both 0
            for(let y = o.bounds.min.y; y < o.bounds.max.y; y += o.yStep) {

                for (let x = o.bounds.min.x; x < o.bounds.max.x; x++) {

                    const pos = new Vector3(x, y, z);
                    const block = o.maps[o.type].get(pos);
                    if (block == undefined) continue;

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
        const max = {
            width: o.pos.x,
            height: o.pos.y,
            depth: o.pos.z,
        };

        function iterateDimension(type: "x" | "y" | "z", f: (d: number) => any, skipFirst: boolean = false) {
            var d;
            if(skipFirst) {
                d = o.pos[type];
            } else {
                d = o.pos[type] + 1;
            }

            if(type == "y") {
                for( ; d < o.maxBounds[type]; d += o.yStep) f(d);
            } else {
                for( ; d < o.maxBounds[type]; d += 1) f(d);
            }
        }

        // Greedy meshes along x-axis
        iterateDimension("x", x => {

            const pos = new Vector3(x, o.pos.y, o.pos.z);
            const block = o.map.get(pos);
            if(block == undefined) return;

            // block of same type found
            max.width = x;
            o.map.remove(pos);
        });

        iterateDimension("y", y => {
            var end: boolean = false;

            const foundXAxisBlocks: Vector3[] = [];
            iterateDimension("x", x => {

                const pos = new Vector3(x, y, o.pos.z);
                const block = o.map.get(pos);
                if(block == undefined) return end = true;

                foundXAxisBlocks.push(pos);
            }, true);
            if(end) return;

            // # When all the blocks in the x-axis are of same type # //
            max.height = y;

            // Remove the blocks that have been greedy meshed. Die blocks
            for(const pos of foundXAxisBlocks) o.map.remove(pos);
        });

        iterateDimension("z", z => {

            var end: boolean = false;

            iterateDimension("y", y => {

                var endY: boolean = false;
                
                iterateDimension("x", x => {

                    const pos = new Vector3(x, y, z);
                    const block = o.map.get(pos);

                    if(block == undefined) return endY = true;

                    max.depth = z;

                });

                if(endY) return end = true;

            }, true);

            if(end) return;

        });

        var isGreedyMeshed: boolean = false;

        if(max.width != 1
        || max.height != 1
        || max.depth != 1) isGreedyMeshed = true;
        

        const finalBox: Box = {
            pos: o.pos,
            width: max.width,
            height: max.height,
            depth: max.depth,
            type: o.type,
            isGreedyMeshed,
        };

        return finalBox;
    }
}