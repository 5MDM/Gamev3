import { Vector3, Vector2 } from "three";
import {createNoise2D} from "simplex-noise";
import { Map3D } from "./assets/ts/framework/map";
import { GreedyMesh } from "./assets/ts/framework/greedy-mesh";
import { WorkerMessageType, WorkerMessageInterface } from "./assets/ts/game/worker-enum";
import { Box } from "./assets/ts/framework/greedy-mesh";

const greedyMesh = new GreedyMesh(postMessage);
const CHUNK_SIZE = 8;

const noise = createNoise2D();
function getRandomElevation(pos: Vector2): number {
    function smooth(intensity: number): number {
        return noise(pos.x * intensity, pos.y * intensity);
    }

    return Math.floor(smooth(0.1) * 2) / 2 + 1;
}

onmessage = function(e: MessageEvent<WorkerMessageInterface>) {
    const {type, payload} = e.data;
    if(type == WorkerMessageType.loadChunk) loadChunk(payload.chunkPos);
};

interface MapInterface {
    [index: string]: Map3D<boolean>;
}

function loadChunk(chunkPos: Vector3) {
    const yStep = 0.5;
    const CHUNK_SIZE_HALF = CHUNK_SIZE / 2;

    const blockMap: {[index: string]: Map3D<boolean>} = {};
    const chunkMin = {
        x: chunkPos.x * CHUNK_SIZE,
        y: 0,
        z: chunkPos.z * CHUNK_SIZE,
    };
    
    const chunkMax = {
        x: chunkMin.x + CHUNK_SIZE,
        y: 0,
        z: chunkMin.z + CHUNK_SIZE,
    };

    const normalBlocks: Box[] = [];
    for(let x = chunkPos.x * CHUNK_SIZE; x <= chunkPos.x * CHUNK_SIZE + CHUNK_SIZE; x++) {
        for(let z = chunkPos.z * CHUNK_SIZE; z <= chunkPos.z * CHUNK_SIZE + CHUNK_SIZE; z++) {
            const pos2D = new Vector2(x - CHUNK_SIZE_HALF, z - CHUNK_SIZE_HALF);
            const elevation = getRandomElevation(pos2D);
            const type = 1;

            const pos = new Vector3(pos2D.x, chunkPos.y * CHUNK_SIZE + elevation, pos2D.y);
            if(blockMap[type] == undefined) blockMap[type] = new Map3D<boolean>();
            blockMap[type].set(pos, true);
            /*normalBlocks.push({
                pos: {
                    x: pos.x,
                    y: pos.y,
                    z: pos.z,
                },
                width: 1,
                height: 1,
                depth: 1,
                isGreedyMeshed: false,
                type,
            });*/

            if(elevation > chunkMax.y) chunkMax.y = elevation;
            if(elevation < chunkMin.y) chunkMin.y = elevation;
        }
    }

    const newBlocks = greedyMesh.greedyMesh({
        CHUNK_SIZE,
        chunkPos,
        yStep,
        maps: blockMap,
        minY: chunkMin.y,
        maxY: chunkMax.y,
    });
    
    postMessage({
        type: WorkerMessageType.loadChunk,
        payload: {
            blockArray: newBlocks,
            chunkPos,
        },
    });

}
