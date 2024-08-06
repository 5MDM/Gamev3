import { $ } from "../../framework/util";
import { setBiomesFromMods } from "../../framework/world-gen";
import { ModParser } from "./parser-class";

import {initMods} from "../../../ts/game/world/main";
import "../menu/play";

const modParser = new ModParser();

await modParser.loadMemory();

modParser.parseAllMods()
.then(mods => {
    initMods(mods);
    setBiomesFromMods(mods);

    ($("#ui > #loading") as HTMLDivElement)!.style.display = "none";
});

