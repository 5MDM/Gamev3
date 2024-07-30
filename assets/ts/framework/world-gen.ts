import {createNoise2D} from "simplex-noise";
import {Vector2, Vector3} from "three";
import { ModList } from "../game/parser/parser-class";
import { BlockTypesInterface, Box, GreedyMesh } from "./greedy-mesh";
import { CHUNK_SIZE } from "../game/world/main";
import { Map3D } from "./map";
import { Biome, biomeList } from "../game/parser/global-mods";

export interface BiomeGenFunctionOutput {
    blockTypes: BlockTypesInterface;
    minY: number;
    maxY: number;
}

export abstract class BaseChunkGenerator {
    protected CHUNK_SIZE: number = CHUNK_SIZE;
    protected minY: number = 0;
    protected maxY: number = 0;
    protected chunkPos: Vector3;
    protected globalPos: Vector3;
    private blockTypes: BlockTypesInterface = {};

    constructor(chunkPos: Vector3) {
        this.chunkPos = chunkPos;
        this.globalPos = this.chunkPos.clone().multiplyScalar(CHUNK_SIZE);
    }

    iterateXZAxis(f: (x: number, z: number) => void): void {
        for(let x = this.chunkPos.x; x != this.chunkPos.x + this.CHUNK_SIZE; x++)
            for(let z = this.chunkPos.z; z != this.chunkPos.z + this.CHUNK_SIZE; z++) f(x, z);
    }

    addBlock(pos: Vector3, type: string): void {
        if(this.minY > pos.y) this.minY = pos.y;
        if(this.maxY < pos.y) this.maxY = pos.y;

        if(this.blockTypes[type] == undefined) this.blockTypes[type] = new Map3D<true>;
        this.blockTypes[type].set(pos, true);
    }

    init(): BiomeGenFunctionOutput {
        if(this.generate == undefined) throw new Error(
            "world-gen.ts: "
        +   "generate method in generator class is undefined. Please define it in the mod"
        );
        this.generate();

        return {
            blockTypes: this.blockTypes,
            minY: this.minY,
            maxY: this.maxY,
        };
    }

    destroy() {
        this.blockTypes = {};
    }

    protected abstract generate(): void;
}

function getRndBiome(): Biome {
    return biomeList[Math.floor(Math.random() * biomeList.length)];
}

export function setBiomesFromMods(mods: ModList) {
    for(const modName in mods) {
        biomeList.push(...mods[modName].biomes);
    }
}

const seed = 0;
const noise = createNoise2D(() => seed);
export function getRandomElevation(pos: Vector2): number {
    function smooth(intensity: number): number {
        return noise(pos.x * intensity, pos.y * intensity);
    }

    return Math.floor(smooth(0.1) * 5) / 2 + 4;
}

var greedyMesh: GreedyMesh;

export function initWorldGen(CHUNK_SIZE: number) {
    greedyMesh = new GreedyMesh({
        CHUNK_SIZE,
        yStep: 0.5,
    });
}

export function generateBlocks(chunkPos: Vector3): Box[] {
    const rnd = getRndBiome();

    const generator = rnd.generate(chunkPos);
    const e = generator.init();

    generator.destroy();

    if(typeof e.blockTypes != "object"
    || typeof e.minY != "number"
    || typeof e.maxY != "number"
    ) throw new Error(
        "world-gen.ts: "
    +   "Mod biome function returned wrong types"
    );

    return greedyMesh.greedyMesh(chunkPos, e.blockTypes, e.minY, e.maxY);
}
