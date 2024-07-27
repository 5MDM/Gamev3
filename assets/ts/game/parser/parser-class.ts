import { CubeRefractionMapping, CubeTexture, CubeTextureLoader, Material, NearestFilter, NearestMipmapNearestFilter, RepeatWrapping, SRGBColorSpace, Texture, TextureLoader } from "three";
import { Biome } from "../../framework/world-gen";

var modsLoadedRes: () => void;
export const modsLoadedPr = new Promise<void>(res => modsLoadedRes = res);
export const biomeList: Biome[] = [];

export interface BlockTextureMap {
    [blockName: string]: ScalableTexture;
}

type MaterialSidesArray = [Material, Material, Material, Material, Material, Material];

type BlockSideType = "top" | "bottom" | "left" | "right" | "front" | "back";

type BlockTextureSides = {
    [key in BlockSideType]: Texture;
    /*top: Texture;
    bottom: Texture;
    left: Texture;
    right: Texture;
    front: Texture;
    back: Texture;*/
}

const mods: {[index: string]: Mod} = {};

interface InfoInterface {
    name: string;
    description: string;
    namespace: string;
    content: {
        blocks?: {
            block_size: number;
        },
        biomes: {},
    }
}

interface ModInterface extends InfoInterface {
    path: string;
}

interface BlockTextureInterface {
    [index: string]: string | undefined;
    top: string;
    bottom: string;
    left: string;
    right: string;
    front: string;
    back: string;
}

interface BlockInterface {
    name: string;
    texture?: string;
    textures?: BlockTextureInterface;
}

interface globDefault<T = any> {
    default: T;
}

type PathList = Record<string, () => Promise<globDefault>>;

const textureLoader = new TextureLoader();

function ld(url: string): Promise<Texture> {
    const pr = new Promise<Texture>(res => {
        textureLoader.load(url, texture => {
            texture.magFilter = NearestFilter;
            texture.minFilter = NearestMipmapNearestFilter;
            texture.generateMipmaps = false; // set to true later
            texture.wrapS = RepeatWrapping;
            texture.wrapT = RepeatWrapping;
            texture.mapping = CubeRefractionMapping;
            texture.colorSpace = SRGBColorSpace;
            res(texture);
        });
    });

    return pr;
}

export class ModParser {
    modPath = import.meta.glob<globDefault>("../../../mods/**");
    memoryisLoaded: boolean = false;
    memory: {[index: string]: any} = {};
    registeredMods: {[index: string]: ModInterface} = {};

    loadMemory() {
        const prArray: Promise<any>[] = [];
        for(const key in this.modPath) {
            const pr = this.modPath[key]();
            prArray.push(pr);

            pr.then(e => this.memory[key] = e.default);
        }

        Promise.all(prArray)
        .then(e => this.memoryisLoaded = true);

        return prArray;
    }

    async #iteratePaths<T = any>(paths: PathList, f: (path: T) => void, callback: () => void) {
        const promises: Promise<globDefault>[] = [];

        for(const path in paths) {
            const pr = (paths[path]());
            promises.push(pr);
            f((await pr).default);
        }

        Promise
        .all(promises)
        .then(() => {
            callback();
            modsLoadedRes();
        });
    }

    parseAllMods(): Promise<{[modName: string]: Mod}> {
        var prRes: (mods: {[modName: string]: Mod}) => void;
        const pr = new Promise<{[modName: string]: Mod}>(res => prRes = res);

        const paths: PathList = import.meta.glob<globDefault<InfoInterface>>("../../../mods/*/info.json");

        if(Object.keys(paths).length == 0) throw new Error(
            "parser-class.ts: "
        +   `path of "${paths}" doesn't have any folders or files`
        );

        this.#iteratePaths(paths, path => this.#registerMods(path), async () => {
            const mods: {[modName: string]: Mod} = {};
            for(const modName in this.registeredMods) {
                const mod = await this.#parseMod(this.registeredMods[modName]);
                mod.finalize();
                mods[modName] = mod;
            }

            prRes(mods);
        });

        return pr;
    }

    #registerMods(o: InfoInterface) {
        (o as ModInterface).path = `../../../mods/${o.name}/`;
        this.registeredMods[o.name] = o as ModInterface;
    }

    async #parseMod(o: ModInterface): Promise<Mod> {
        const mod = new Mod();

        if(o.content.blocks) {
            const blocks = await this.#parseBlocks(o);
            mod.initBlocks(blocks);
        }

        if(o.content.biomes) {
            const biomes: Biome[] = await this.#parseBiomes(o);
            mod.initBiomes(biomes);
        }

        return mod;
    }

    async #parseBiomes(o: ModInterface): Promise<Biome[]> {
        const im: any = await import(`../../../mods/${o.name}/biomes.ts`);

        if(typeof im.generateBiomeList != "function") throw new Error(
            "parser-class.ts: "
        +   `"biomes.ts" file in mod "${o.name}" doesn't export "generateBiomeList()" function`
        );

        const blocks: unknown | Biome[] = im.generateBiomeList();

        if(!Array.isArray(blocks)) throw new Error(
            "parser-class.ts: "
        +   `Error with mod "${o.name}". The exported function "generateBiomeList()" did not return an array. `
        +   `It instead returned "${blocks}" with type of "${typeof blocks}`
        );

        return blocks;
    }

    async #parseBlocks(o: ModInterface): Promise<BlockTextureMap> {
        const blocks: BlockInterface[] = this.memory[o.path + "blocks.json"];
        const blockTextures: BlockTextureMap = {};

        for(const block of blocks) {
            const st: ScalableTexture = await this.#parseSingularBlock(o.path + "blocks/", block);
            blockTextures[block.name] = st;
        }

        return blockTextures;
    }

    async #parseSingularBlock(path: string, block: BlockInterface): Promise<ScalableTexture> {
        block.texture ||= "";

        const textures: BlockTextureInterface = {
            top: block.textures?.top || block.texture,
            bottom: block.textures?.bottom || block.texture,
            left: block.textures?.left || block.texture,
            right: block.textures?.right || block.texture,
            front: block.textures?.front || block.texture,
            back: block.textures?.back || block.texture,
        };
        
        for(const texture in textures) {
            if(textures[texture] == undefined) throw new Error(
                "parser-class.ts: "
            +   `Texture of "${texture}" is undefined in block "${block.name}". `
            +   `Please define the "texture" key if you want to use it as default`
            );

            textures[texture] = this.memory[path + textures[texture]];
        }

        const stOpts: {[val in BlockSideType]?: Texture} = {};

        const map: {[path: string]: Texture} = {};

        for(const key in textures) {
            const val = textures[key as BlockSideType];

            if(map[val] == undefined) map[val] = await ld(val);
            stOpts[key as BlockSideType] = map[val];
        }

        const st = new ScalableTexture(stOpts as {[val in BlockSideType]: Texture});

        return st;
    }
}

export class Mod {
    name: string = "Unknown Mod";
    namespace: string = "";
    description: string = "No description";
    isFinalized: boolean = false;

    biomes: Biome[] = [];

    hasContent: {[index: string]: boolean} = {};

    blocks: BlockTextureMap = {};

    textures: {[blockName: string]: Texture} = {};

    #checkIfFinalized(): void | never {
        if(this.isFinalized) throw new Error(
            `parser-class.ts: mod was already finalized`
        );
    }

    finalize(): void | never {
        this.#checkIfFinalized();
        this.isFinalized = true;
    }

    initBlocks(blocks: BlockTextureMap): void {
        this.#checkIfFinalized();
        this.hasContent.blocks = true;
        this.blocks = blocks;
    }

    initBiomes(recievedBiomes: Biome[]): void {
        this.biomes = recievedBiomes;
        biomeList.push(...recievedBiomes);
    }
}

export interface ModList {
    [modName: string]: Mod;
}

export class ScalableTexture {
    t: BlockTextureSides;
    isScaled: boolean = false;

    constructor(o: BlockTextureSides) {
        this.t = o;
        //for(const e in o) console.log(o[e as BlockSideType].uuid);
    }

    iterateTextures(f: (t: Texture) => void) {
        for(const name in this.t) f(this.t[name as BlockSideType]);
    }

    clone(): ScalableTexture {
        const newTextures: Partial<BlockTextureSides> = {};

        for(const t in this.t) newTextures[t as BlockSideType] = this.t[t as BlockSideType].clone();

        return new ScalableTexture(newTextures as BlockTextureSides);
    }

    scaleWidth(m: number): void {
        this.isScaled = true;
        this.t.bottom.repeat.x = m;
        this.t.back.repeat.x = m;
        this.t.left.repeat.x = m;
        this.t.top.repeat.x = m;
    }

    scaleHeight(m: number): void {
        this.isScaled = true;
        this.t.bottom.repeat.y = m;
        this.t.back.repeat.y = m;
        this.t.top.repeat.y = m;
        this.t.right.repeat.y = m;
    }

    scaleDepth(m: number): void {
        this.isScaled = true;
        this.t.top.repeat.y = m;
        this.t.right.repeat.x = m;
        this.t.left.repeat.x = m;
        this.t.front.repeat.x = m;
    }

    getArray(f: (t: Texture) => Material): MaterialSidesArray {
        const o: {[sideName: string]: Material} = {};
        for(const t in this.t) o[t] = (f(this.t[t as BlockSideType]));

        return [o.left, o.front, o.top, o.right, o.back, o.bottom] as MaterialSidesArray;
    }

    destroy(): void {
        if(!this.isScaled) throw new Error(
            "parser-class.ts: "
        +   "1x1x1 blocks can't be destroyed"
        );

        for(const t in this.t) {
            this.t[t as BlockSideType].dispose();
            this.t[t as BlockSideType] = undefined!;
        }
    }
}