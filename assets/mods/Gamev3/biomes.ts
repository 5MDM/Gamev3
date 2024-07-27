import { Vector2, Vector3 } from "three";
import { BlockTypesInterface } from "../../ts/framework/greedy-mesh";
import { BaseChunkGenerator, Biome, BiomeGenFunctionOutput, getRandomElevation } from "../../ts/framework/world-gen";

class GrassLand extends BaseChunkGenerator {
    generate() {
        this.iterateXZAxis((x: number, z: number) => {
            const y = getRandomElevation(new Vector2(x, z));
            const pos = new Vector3(x, y, z);

            this.addBlock(pos, "Grass");
            pos.y -= 1;
            this.addBlock(pos, "Grass");
        });
    }
}

export function generateBiomeList(): Biome[] {
    return [
        {
            name: "Grass Land",
            generate: chunkPos => new GrassLand(chunkPos),
        }
    ];
}

