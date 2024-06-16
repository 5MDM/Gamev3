import { images } from "../start/main";
import { $$ } from "./util";

console.log(images);
const FACES_Y = 3;

export type TextureObj = {
    name: string;
    texture: string;
}[];

export interface AtlasGeneratorOutput {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
}

export class AtlasGenerator {
    textures?: TextureObj;
    c: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D | null;

    constructor() {
        this.c = $$("canvas");
        this.ctx = this.c.getContext("2d");
        if(this.ctx == null) throw new Error(
            "atlas-loader.ts: context is undefined"
        );
    }

    setTextureObj(o: TextureObj): this {
        this.textures = o;
        return this;
    }

    generateAtlas(o: {
        size: number;
    }): AtlasGeneratorOutput {
        if(this.textures == undefined) throw new Error(
            "atlas-loader.ts: You didn't call "
        + `".setTextureObj(o: TextureObj)"`
        );

        const width = o.size * this.textures.length;
        const height = (FACES_Y + 1) * o.size;

        this.c.setAttribute(
            "width", 
            width.toString(),
          );
          
        this.c.setAttribute(
            "height",
            height.toString(),
        );

        for(const block of this.textures) 
            this.generateUVMap(block, o.size);
          
        return {
            canvas: this.c,
            width,
            height,
        };
    }

    #currentX = 0;
    #currentY = 0;

    generateUVMap({name, texture}: {name: string; texture: string}, size: number) {
        if(typeof texture == "string") {
            this.#generateUVSide(name, texture, size);
        } else {
            throw new Error(
                "atlas-loader.ts: multiple side support coming soon"
            );
        }
    }

    #generateUVSide(name: string, texture: string, size: number): void {
        const img = new Image();
        const imgURL = images[`blocks/${texture}`];
        const self = this;

        if(imgURL == undefined) throw new Error(
            `atlas-loader.ts: "blocks/${texture}" has undefined texture`
        );

        img.src = imgURL;
        img.onload = function() {
            for(let i = 0; i != FACES_Y; i++) {
                self.ctx!.drawImage(
                  img,
                  self.#currentX,
                  self.#currentY,
                  size,
                  size,
                );

                self.#currentY += size;
              }
              
            self.#currentY = 0;
            self.#currentX += size;
        };

        img.onerror = function(e) {            
            throw new Error(
                `atlas-loader.ts: failed to load image "${name}"`
            );
        }
    }
}