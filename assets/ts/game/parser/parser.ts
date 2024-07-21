import { ModParser } from "./parser-class";

const modParser = new ModParser();
await Promise.all(modParser.loadMemory());

modParser.parseAllMods();