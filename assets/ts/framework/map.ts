import {Vector3, Vector2} from "three";

export function executeInRadius(pos: Vector3, r: number, f: (pos: Vector3) => void) {
    if(r <= 0) throw new Error(
        "world.ts: Radius can't be below a 1. "
    +   `Instead got "${r}"`
    );

    for(let dx = -r; dx < r; dx++) {
        for(let dy = -r; dy < r; dy++) {
            for(let dz = -r; dz < r; dz++) {
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if(distance <= r) {
                    const actualX = pos.x + dx;
                    const actualY = pos.y + dy;
                    const actualZ = pos.z + dz;

                    f(new Vector3(actualX, actualY, actualZ));
                }
            }
        }
    }

}

export class Map3D<type> {
    #map: {[index: string]: type} = {};

    getMap(): {[index: string]: type} {
        return this.#map;
    }

    getLength() {
        return Object.keys(this.#map).length;
    }

    getPosFromKey(s: string): Vector3 {
        const [x, y, z] = s.split(",");
        return new Vector3(Number(x), Number(y), Number(z));
    }

    get(pos: Vector3): type {
        return this.#map[`${pos.x},${pos.y},${pos.z}`];
    }

    set(pos: Vector3, value: type): void {
        this.#map[`${pos.x},${pos.y},${pos.z}`] = value;
    }

    remove(pos: Vector3): void {
        delete this.#map[`${pos.x},${pos.y},${pos.z}`];
    }

    findInRadius(pos: Vector3, r: number): {[index: string]: type} {
        const obj: {[index: string]: type} = {};
        executeInRadius(pos, r, 
            (pos: Vector3) => 
                obj[`${pos.x},${pos.y},${pos.z}`] = 
                this.get(new Vector3(pos.x, pos.y, pos.z)),
        );

        return obj;
    }

    findOutsideRadius(pos: Vector3, r: number) {
        const returnObj: {[index: string]: type} = {};

        for(const i in this.#map) {
            const obj: type = this.#map[i];
            const objPos = this.getPosFromKey(i);

            const distance = Math.sqrt(
                Math.pow(objPos.x - pos.x, 2) +
                Math.pow(objPos.y - pos.y, 2) +
                Math.pow(objPos.z - pos.z, 2)
            );

            // Return objects outside the radius
            if(distance > r)
                returnObj[i] = obj;
        }

        return returnObj;   
    }

    destroy(): void {
        this.#map = {};
    }
}

export class Map2D<T> {
    #map: {[index: string]: T} = {};

    getPosFromKey(s: string): Vector2 {
        const [x, y] = s.split(",");
        return new Vector2(Number(x), Number(y));
    }

    get(pos: Vector2): T {
        return this.#map[`${pos.x},${pos.y}`];
    }

    set(pos: Vector2, value: T): void {
        this.#map[`${pos.x},${pos.y}`] = value;
    }

    forEach(f: (x: number, yz: number, value: T) => void): void {
        for(const key in this.#map) {
            const pos = this.getPosFromKey(key);
            f(pos.x, pos.y, this.#map[key]);
        }
    }

    destroy(): void {
        this.#map = {};
    }
}