import { Octree } from "./octree";
import { Group, Material, Mesh, Vector3 } from "three";
import { currentScene } from "../game/world/app";

export interface ChunkOpts {
    chunkPos: Vector3;
    CHUNK_SIZE: number;
}

export class Chunk {
    octree: Octree;
    group: Group = new Group();
    hasPhysics: boolean = false;

    constructor(o: ChunkOpts) {
        this.octree = new Octree(o.chunkPos, o.CHUNK_SIZE);
    }

    loadPhysics() {
        if(this.hasPhysics) return;
        this.hasPhysics = true;
    }
    
    delete() {
        this.octree.delete();
        for(const mesh of this.group.children) {
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
        this.group.clear();
    }
}