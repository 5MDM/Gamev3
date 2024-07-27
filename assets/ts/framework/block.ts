import { Object3D, BufferAttribute, Mesh, Vector3, MeshBasicMaterial, BufferGeometry, Texture, BoxGeometry, Scene, FrontSide, MeshLambertMaterial, Material, RepeatWrapping, BoxHelper, Vector2, CanvasTexture, CubeTexture } from "three";
import { currentScene } from "../game/world/app";
import { Octree } from "./octree";
import { Map3D } from "./map";
import { GreedyMesh, iterateGreedyMesh } from "./greedy-mesh";
import { CHUNK_SIZE } from "../game/world/main";
import { depth, materialClearcoatNormal, outputStruct } from "three/examples/jsm/nodes/Nodes.js";
import { UVsDebug } from "three/examples/jsm/Addons.js";
import { BlockTextureMap } from "../game/parser/parser-class";

export interface VoxelFaceArray {
    type: string;
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
        type: "left",
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
        type: "right",
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
        type: "bottom",
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
        type: "top",
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
        type: "back",
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
        type: "front",
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

interface GreedyMeshSize {
    width: number;
    height: number;
    depth: number;
}

export interface BlockOpts {
    pos: Vector3;
    type: string;
    greedyMesh?: GreedyMeshSize;
}

interface InitMaterialInterface {
    tileSize: number;
    textures: BlockTextureMap;
    tileWidthRatio: number;
    tileHeightRatio: number;
}

var tileWidthRatio: number;
var tileHeightRatio: number;

var textures: BlockTextureMap;

export function initMaterial(opts: InitMaterialInterface) {
    textures = opts.textures;
    tileWidthRatio = opts.tileWidthRatio;
    tileHeightRatio = opts.tileHeightRatio;
}

export enum BlockType {
    stone,
    grass,
}

export class Block {
    yStep: number = 0.5;
    type: string;
    isDeleted: boolean = false;
    isGreedyMeshed: boolean = false;
    width: number = 1;
    height: number = 1;
    depth: number = 1;
    isInitialized: boolean = false;
    mesh?: Mesh;
    #startPos: Vector3;

    constructor(opts: BlockOpts) {
        if(textures == undefined) throw new Error(
            "block.ts: material and textures wasn't initiated"
        );

        this.type = opts.type;
        this.#startPos = opts.pos;

        if(opts.greedyMesh != undefined) {
            this.isGreedyMeshed = true;
            this.width = Math.abs(opts.greedyMesh.width);
            this.height = Math.abs(opts.greedyMesh.height);
            this.depth = Math.abs(opts.greedyMesh.depth);
        }
    }

    init(map: Map3D<string>) {
        this.isInitialized = true;

        const geometry = new BoxGeometry(this.width, this.height, this.depth);
        
        var t = textures[this.type];

        if(this.isGreedyMeshed) {
            t = t.clone();
            t.scaleWidth(this.width);
            t.scaleHeight(this.height);
            t.scaleDepth(this.depth);
        }

        this.#UVMap(geometry);
        geometry.computeVertexNormals();

        const materials = t.getArray(t => new MeshBasicMaterial({
            map: t,
            side: FrontSide,
        }));

        this.mesh = new Mesh(geometry, materials);
        this.mesh.position.copy(this.#startPos);
        this.mesh.geometry.computeBoundingBox();
    }

    #UVMap(g: BufferGeometry): void {
        if(this.isGreedyMeshed) {
            /*for(let x = this.#startPos.x; x <= this.#startPos.x + this.width - 1; x++) {
                for(let y = this.#startPos.y; y <= this.#startPos.y + this.height - 1; y++) {
                    for(let z = this.#startPos.z; z <= this.#startPos.z + this.depth - 1; z++) {
                        const pos = new Vector3(x, y, z);
                        this.#singularUVMap(g, pos, disableCulling);
                    }
                }
            }*/
           //this.#singularUVMap(g, this.#startPos, disableCulling);
        } else {
            //this.#singularUVMap(g, this.#startPos, disableCulling);
        }
    }

    #determineFace(type: string): [number, number] {
        if(!this.isGreedyMeshed) return [1, 1];
        var faceWidth = 1;
        var faceHeight = 1;

        switch (type) {
            case "left":
            case "right":
                faceWidth = this.depth;
                faceHeight = this.height;
                break;
            case "bottom":
            case "top":
                faceWidth = this.width;
                faceHeight = this.depth;
                break;
            case "front":
            case "back":
                faceWidth = this.width;
                faceHeight = this.height;
                break;
        }

        return [faceWidth, faceHeight];
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