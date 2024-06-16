import {Vector3} from "three";
import {executeInRadius} from "./world";

export class Map3D<type> {
    #map: {[index: string]: type} = {};

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
}