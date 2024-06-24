import { Object3D, BufferAttribute, Mesh, Vector3, MeshBasicMaterial, BufferGeometry, Texture, BoxGeometry, Scene, FrontSide, MeshLambertMaterial, Material } from "three";
import { currentScene } from "../game/world/app";
import { Octree } from "./octree";
import { Map3D } from "./map";

export interface VoxelFaceArray {
    uvRow: number;
    dir: [number, number, number],
    corners: [
        { pos: [number, number, number], uv: [number, number] },
        { pos: [number, number, number], uv: [number, number] },
        { pos: [number, number, number], uv: [number, number] },
        { pos: [number, number, number], uv: [number, number] },
    ],
};

export const faces: VoxelFaceArray[] = [
    { // left
        uvRow: 0,
        dir: [-1, 0, 0,],
        corners: [
            { pos: [0, 1, 0], uv: [0, 1], },
            { pos: [0, 0, 0], uv: [0, 0], },
            { pos: [0, 1, 1], uv: [1, 1], },
            { pos: [0, 0, 1], uv: [1, 0], },
        ],
    },
    { // right
        uvRow: 0,
        dir: [1, 0, 0,],
        corners: [
            { pos: [1, 1, 1], uv: [0, 1], },
            { pos: [1, 0, 1], uv: [0, 0], },
            { pos: [1, 1, 0], uv: [1, 1], },
            { pos: [1, 0, 0], uv: [1, 0], },
        ],
    },
    { // bottom
        uvRow: 1,
        dir: [0, -1, 0,],
        corners: [
            { pos: [1, 0, 1], uv: [1, 0], },
            { pos: [0, 0, 1], uv: [0, 0], },
            { pos: [1, 0, 0], uv: [1, 1], },
            { pos: [0, 0, 0], uv: [0, 1], },
        ],
    },
    { // top
        uvRow: 2,
        dir: [0, 1, 0,],
        corners: [
            { pos: [0, 1, 1], uv: [1, 1], },
            { pos: [1, 1, 1], uv: [0, 1], },
            { pos: [0, 1, 0], uv: [1, 0], },
            { pos: [1, 1, 0], uv: [0, 0], },
        ],
    },
    { // back
        uvRow: 0,
        dir: [0, 0, -1,],
        corners: [
            { pos: [1, 0, 0], uv: [0, 0], },
            { pos: [0, 0, 0], uv: [1, 0], },
            { pos: [1, 1, 0], uv: [0, 1], },
            { pos: [0, 1, 0], uv: [1, 1], },
        ],
    },
    { // front
        uvRow: 0,
        dir: [0, 0, 1,],
        corners: [
            { pos: [0, 0, 1], uv: [0, 0], },
            { pos: [1, 0, 1], uv: [1, 0], },
            { pos: [0, 1, 1], uv: [0, 1], },
            { pos: [1, 1, 1], uv: [1, 1], },
        ],
    },
];

export interface BlockOpts {
    pos: Vector3;
    type: BlockType;
}

interface InitMaterialInterface {
    tileSize: number;
    atlas: Texture;
    tileWidthRatio: number;
    tileHeightRatio: number;
}

var tileWidthRatio: number;
var tileHeightRatio: number;
var material: Material;
export function initMaterial(opts: InitMaterialInterface) {
    material = new MeshBasicMaterial({
        side: FrontSide,
        map: opts.atlas,
    });

    tileWidthRatio = opts.tileWidthRatio;
    tileHeightRatio = opts.tileHeightRatio;
}

export enum BlockType {
    stone,
    grass,
}

export class Block {
    type: BlockType;
    isDeleted: boolean = false;
    isCombined: boolean = false;
    isInitialized: boolean = false;
    mesh?: Mesh;
    #startPos: Vector3;

    constructor(opts: BlockOpts) {
        if(material == undefined) throw new Error(
            "block.ts: material and atlas wasn't initiated"
        );

        this.type = opts.type;
        this.#startPos = opts.pos;

        /*const geometry = new BufferGeometry();
        this.#setGeometry(geometry, opts.pos);

        geometry.computeVertexNormals();

        this.mesh = new Mesh(
            geometry,
            material,
        );
        this.mesh.position.copy(opts.pos);
        this.mesh.geometry.computeBoundingBox();*/
    }

    init(map: Map3D<BlockType>) {
        this.isInitialized = true;

        const geometry = new BufferGeometry();
        this.#setGeometry(geometry, this.#startPos, map);
        geometry.computeVertexNormals();

        this.mesh = new Mesh(geometry, material);
        this.mesh.position.copy(this.#startPos);
        this.mesh.geometry.computeBoundingBox();
    }

    #setGeometry(g: BufferGeometry, pos: Vector3, map: Map3D<BlockType>): void {
        const uvs: number[] = [];
        const normals: number[] = [];
        const indexes: number[] = [];
        const positions: number[] = [];

        /*for(const {dir, corners, uvRow} of faces) {
            const neighbor = this.voxelFaceMap.get(
              pos.x + dir[0],
              pos.y + dir[1],
              pos.z + dir[2],
            );
            
            if(neighbor == undefined) {
              // make face
              const ndx = positions.length / 3;
              for(const p of corners) {
                positions.push(
                  p.pos[0] + pos.x, 
                  p.pos[1] + pos.y,
                  p.pos[2] + pos.z,
                );
                normals.push(...dir);
                
                uvs.push(
                  (uvVoxel + p.uv[0]) * this.tileWidthRatio,
                  1 - (uvRow + 1 - p.uv[1]) * this.tileHeightRatio,
                );
              }
              
              indices.push(
                ndx    , ndx + 1, ndx + 2,
                ndx + 2, ndx + 1, ndx + 3,
              );   
            }
          }*/
        const size = 1;
        for (const { corners, uvRow, dir } of faces) {
            const neighbor = map.get(new Vector3(
                pos.x + dir[0],
                pos.y + dir[1],
                pos.z + dir[2],
            ));
            
            if(neighbor != undefined) continue;

            const ndx = positions.length / 3;
            for (const p of corners) {
                positions.push(
                    p.pos[0] + pos.x + size,
                    p.pos[1] + pos.y + size,
                    p.pos[2] + pos.z + size,
                );

                uvs.push(
                    (this.type + p.uv[0]) * tileWidthRatio,
                    1 - (uvRow + 1 - p.uv[1]) * tileHeightRatio,
                );

                normals.push(...dir);
            }


            indexes.push(
                ndx, ndx + 1, ndx + 2,
                ndx + 2, ndx + 1, ndx + 3,
            );
        }

        g.setAttribute(
            "position",
            new BufferAttribute(new Float32Array(positions), 3),
        );
        g.setAttribute("normal",
            new BufferAttribute(new Float32Array(normals), 3),
        );
        g.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
        g.setIndex(indexes);
    }

    addToScene(scene: Scene) {
        scene.add(this.mesh!)
        //setTimeout(() => scene.add(this.mesh!), 500);
    }

    delete(scene: Scene) {
        scene.remove(this.mesh!);
        this.mesh = undefined;
        this.isDeleted = true;
    }
}