import { Vector3, Box3 } from "three";
import { Block } from "./block";

export class Octree {
	readonly bounds: Box3;
	readonly size: number;
	readonly halfSize: number;
	readonly dimensions = new Vector3();
	readonly origin: Vector3;
	isDeleted = false;
	children: Octree[] = [];
	block?: Block;
	isLeaf: boolean = false;

	constructor(origin: Vector3, size: number) {
		this.size = size;
		if(size == 1) this.isLeaf = true;

		this.halfSize = size /2;
		this.origin = origin;
		this.bounds = new Box3(
			this.origin,
			this.origin.clone().addScalar(this.size),
		);

		this.bounds.getSize(this.dimensions);
		if((this.size % 2) != 0) {
			this.delete();
			throw new Error(
				"octree.ts: Size isn't divisible by 2"
			);
		}
	}

	insert(block: Block): boolean {
		if(!this.bounds.containsBox(block.mesh.geometry.boundingBox!)) return false;
		if(this.isLeaf) {
			this.block = block;
			return true;
		}
		if(this.children.length == 0) this.#subdivide();

		for(const tree of this.children)
			if(tree.insert(block)) return true;

		return false;
	}

	get(bounds: Box3): false | Block {
		if(!this.bounds.containsBox(bounds)) return false;
		if(this.isLeaf) {
			if(this.block == undefined) {
				throw new Error(
					"octree.ts: block is undefined even though it's a leaf node"
				);
			} else {
				return this.block;
			}
		}

		for(const tree of this.children) {
			const status: false | Block = tree.get(bounds);

			// if the status is not false, then a block was found
			if(status != false) return status;
		}

		return false;
	}

	#subdivide(): void {
		const { x, y, z } = this.origin;

		const o1 =
		new Octree(new Vector3(x, y, z), this.halfSize);
		
		const o2 =
		new Octree(new Vector3(x + this.halfSize, y, z), this.halfSize);
		
		const o3 =
		new Octree(new Vector3(x, y + this.halfSize, z), this.halfSize);

		const o4 =
		new Octree(new Vector3(x + this.halfSize, y + this.halfSize, z), this.halfSize);

		const o5 =
		new Octree(new Vector3(x, y, z + this.halfSize), this.halfSize);

		const o6 =
		new Octree(new Vector3(x + this.halfSize, y, z + this.halfSize), this.halfSize);

		const o7 =
		new Octree(new Vector3(x, y + this.halfSize, z + this.halfSize), this.halfSize);
		
		const o8 =
		new Octree(new Vector3(x + this.halfSize, y + this.halfSize, z + this.halfSize), this.halfSize);

		this.children.push(o1);
		this.children.push(o2);
		this.children.push(o3);
		this.children.push(o4);
		this.children.push(o5);
		this.children.push(o6);
		this.children.push(o7);
		this.children.push(o8);
	}

	delete(): void {
		if(this.children != undefined)
			for(const trees of this.children)
				trees.delete();

		if(this.isLeaf) this.block = undefined;
		this.children = [];
		this.bounds.makeEmpty();
		this.isDeleted = true;
	}
}
