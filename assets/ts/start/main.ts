import "./window";

type imgPromiseArr = [string, (() => Promise<{default: string}>)];

export const images: {
    [index: string]: string;
} = {};

(async function() {
    const fileArr: imgPromiseArr[] = 
    Object.entries(import.meta.glob<{default: string}>("../../images/game/**"))
    .map(([name, img]: imgPromiseArr) => [name.slice(18), img]);

    for(const [name, img] of fileArr) {
        const recievedImages: {default: string} = await img();
        if(typeof recievedImages == "object") {
            images[name] = recievedImages.default;
        } else {
            throw new Error(
                `main.ts: recieved type wasn't "{default: string}"`
            );
        }
    }

    await import("../../mods/main");
})();

//import "../game/main";

//try {
/*} catch(err) {
    if(!(err instanceof Error)) {
        //alert(err);
        throw err;
    } else {
        //alert(err);
        throw err;
    }
}*/