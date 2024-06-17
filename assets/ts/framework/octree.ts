import { Vector3, Box3 } from "three";
import { Block } from "./block";

export class Octree {
	readonly bounds: Box3;
	readonly size: number;
	readonly origin: Vector3;
	children?: Octree[];
	block?: Block;
	isLeaf: boolean = false;

	constructor(origin: Vector3, size: number) {
		this.size = size;
		this.origin = origin;
		this.bounds = new Box3(
			this.origin,
			this.origin.clone().addScalar(this.size),
		);
	}

	insert(block: Block): boolean {
		if(this.bounds.containsBox(block.mesh.geometry.boundingBox!)) return false;

		if(this.isLeaf) {
			return true;
		}
		return true;
	}

	private subdivide(): void {

	}

	delete(): void {
		if(this.children != undefined)
			for(const trees of this.children)
				trees.delete();

		if(this.isLeaf) this.block = undefined;
		this.children = undefined;
	}
}
