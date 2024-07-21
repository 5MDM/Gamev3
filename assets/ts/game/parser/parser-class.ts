import { CubeRefractionMapping, CubeTexture, CubeTextureLoader, NearestFilter, NearestMipmapNearestFilter, RepeatWrapping, Texture } from "three";
import { BlockFinalTexture } from "../../framework/world";

const mods: {[index: string]: Mod} = {};

interface InfoInterface {
    name: string;
    description: string;
    namespace: string;
    content: {
        blocks?: {
            block_size: number;
        } 
    }
}

interface ModInterface extends InfoInterface {
    path: string;
}

interface BlockTextureInterface {
    [index: string]: string | undefined;
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
    front?: string;
    back?: string;
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

const textureLoader = new CubeTextureLoader();

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
        .then(() => callback());
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

        return mod;
    }

    #setTextureAttributes(texture: Texture): void {
        texture.magFilter = NearestFilter;
        texture.minFilter = NearestMipmapNearestFilter;
        texture.generateMipmaps = false; // set to true later
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.mapping = CubeRefractionMapping;
        texture.repeat.set(2, 2);
    }

    async #parseBlocks(o: ModInterface): Promise<BlockFinalTexture> {
        const blocks: BlockInterface[] = this.memory[o.path + "blocks.json"];
        const blockTextures: BlockFinalTexture = {};

        for(const block of blocks) {
            const texture: CubeTexture = await this.#parseSingularBlock(o.path + "blocks/", block);
            this.#setTextureAttributes(texture);
            blockTextures[block.name] = texture;
        }

        return blockTextures;
    }

    #parseSingularBlock(path: string, block: BlockInterface): Promise<CubeTexture> {
        var prRes: (value: CubeTexture) => void;
        const pr = new Promise<CubeTexture>(e => prRes = e);

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

        textureLoader.load([
            textures.front!,
            textures.back!,
            textures.top!,
            textures.bottom!,
            textures.right!,
            textures.left!,
        ], texture => {
            prRes(texture);
        }, () => undefined, err => {
            throw new Error(
                "parser-class.ts: "
            +   `Failed to load block "${block.name}"`, {
                cause: err,
            });
        });

        return pr;
    }
}

class Mod {
    name: string = "Unknown Mod";
    namespace: string = "";
    description: string = "No description";
    isFinalized: boolean = false;

    hasContent: {[index: string]: boolean} = {};

    blocks: BlockFinalTexture = {};

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

    initBlocks(blocks: BlockFinalTexture): void {
        this.#checkIfFinalized();
        this.hasContent.blocks = true;
        this.blocks = blocks;
    }
}