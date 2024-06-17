import { Object3D, Mesh, Vector3, MeshBasicMaterial, BufferGeometry, Texture } from "three";

export interface BlockOpts {
    pos: Vector3;
    atlas: Texture;
}

export class Block {
    mesh: Mesh;
    constructor(opts: BlockOpts) {
        const geometry = new BufferGeometry();

        this.mesh = new Mesh(
            geometry,
            new MeshBasicMaterial({
                color: 0xfff000,
                fog: false,
                map: opts.atlas,
            }),
        );
        this.mesh.geometry.computeBoundingBox();
    }
}