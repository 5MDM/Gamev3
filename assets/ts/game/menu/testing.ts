import { Vector3 } from "three";
import { Box, GreedyMesh, iterateGreedyMesh, MapInterface } from "../../framework/greedy-mesh";
import { Map3D } from "../../framework/map";

export function greedyMeshTest(p: HTMLParagraphElement) {
    const greedyMesh = new GreedyMesh();
    const map = new Map3D<boolean>();
    const maps: MapInterface = {
        0: map,
    };

    function fill(x: number, y: number, z: number): void {
        map.set(new Vector3(x, y, z), true);
    }

    fill(0, 0, 0);

    /*
    fill(1, 0, 0);
    fill(2, 0, 0);
    // expected output: width = 3
    */

    /*
    fill(0, 1, 0);
    fill(0, 2, 0);
    // expected output: height = 3
    */

    /*
    fill(0, 0, 1);
    fill(0, 0, 2);
    // expected output: depth = 3
    */

    /*fill(1, 0, 0);
    fill(0, 1, 0);
    fill(0, 0, 1);
    fill(1, 1, 0);
    fill(1, 0, 1);
    fill(0, 0, 1);
    fill(0, 1, 1);
    fill(1, 1, 1);*/
    // expected output: width, height, and depth = 2

    fill(3, 3, 3);
    fill(3, 2, 3);

    const blocks: Box[] = greedyMesh.greedyMesh({
        CHUNK_SIZE: 4,
        yStep: 1,
        chunkPos: new Vector3(0, 0, 0),
        maps,
        minY: 0,
        maxY: 4,
        center: false,
    });

    iterateGreedyMesh(blocks, 0.5, box => {
        console.log(box);
    });

    const firstBlock = blocks[0];

    const text = `Length: ${blocks.length}\nFirst block: 
    {
        x: ${firstBlock.pos.x}
        y: ${firstBlock.pos.y}
        z: ${firstBlock.pos.z}
        width: ${firstBlock.width}
        height: ${firstBlock.height}
        depth: ${firstBlock.depth}
    }`;
    p.textContent = text;
}