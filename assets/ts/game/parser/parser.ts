import { $ } from "../../framework/util";
import { ModParser } from "./parser-class";

const modParser = new ModParser();
await Promise.all(modParser.loadMemory());

export const mods = await modParser.parseAllMods();

($("#ui > #loading") as HTMLDivElement)!.style.display = "none";