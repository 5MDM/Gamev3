import { Vector2, Vector3 } from "three";
import { BaseChunkGenerator, getRandomElevation } from "../../ts/framework/world-gen";
import { biomeMap } from "../../ts/game/parser/global";

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

export function generate() {
    biomeMap.Gamev3 = [];

    biomeMap.Gamev3.push({
        name: "Grasslands",
        generate: chunkPos => new GrassLand(chunkPos),
    });    
}


