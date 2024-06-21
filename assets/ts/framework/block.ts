import { Object3D, BufferAttribute, Mesh, Vector3, MeshBasicMaterial, BufferGeometry, Texture, BoxGeometry, Scene } from "three";

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
    BLOCK_SIZE: number;
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
var material: MeshBasicMaterial;
export function initMaterial(opts: InitMaterialInterface) {
    material = new MeshBasicMaterial({
        fog: false,
        map: opts.atlas,
    });

    tileWidthRatio = opts.tileWidthRatio;
    tileHeightRatio = opts.tileHeightRatio;
}

const baseBeometry = new BoxGeometry(1, 1, 1);

export enum BlockType {
    stone,
}

export class Block {
    type: BlockType;
    isDeleted: boolean = false;
    isCombined: boolean = false;
    mesh?: Mesh;

    constructor(opts: BlockOpts) {
        if(material == undefined) throw new Error(
            "block.ts: material and atlas wasn't initiated"
        );

        this.type = opts.type;

        const geometry = baseBeometry.clone();
        this.#setGeometry(geometry);

        this.mesh = new Mesh(
            geometry,
            material,
        );
        console.log(opts.pos)
        this.mesh.position.setY(opts.pos.y)
        this.mesh.position.setX(Math.random() * 4 - 2)
        this.mesh.position.setZ(Math.random() * 4 - 2)
        this.mesh.geometry.computeBoundingBox();
    }

    #setGeometry(g: BoxGeometry) {
        const uvs: number[] = [];

        for(const {corners, uvRow} of faces)
            for(const p of corners) 
                uvs.push(
                    this.type + p.uv[0] * tileWidthRatio,
                    1 - (uvRow + 1 - p.uv[1]) * tileHeightRatio,
                );

        g.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2),);
    }

    addToScene(scene: Scene) {
        scene.add(this.mesh!);
    }

    delete(scene: Scene) {
        scene.remove(this.mesh!);
        this.mesh = undefined;
        this.isDeleted = true;
    }
}