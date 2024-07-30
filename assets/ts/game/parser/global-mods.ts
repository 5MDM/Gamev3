import { Vector3 } from "three";
import { BaseChunkGenerator } from "../../framework/world-gen";

export interface Biome {
    name: string;
    generate: (pos: Vector3) => BaseChunkGenerator;
}

export const biomeMap: BiomeMap = {};

export const biomeList: Biome[] = [];

export interface BiomeMap {
    [index: string]: Biome[];
}