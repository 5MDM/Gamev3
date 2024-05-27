import { $ } from "../framework/util";
import {errorObj} from "./error";
import "./window";

await errorObj;
try {
    await import("../game/main");
} catch(err) {
    if(!(err instanceof Error)) {
        //alert(err);
        throw err;
    }

    $("#error-c #error-text").textContent = err.message;
    $("#error-c #error-stack").textContent = err.stack || "stack is undefined";
    (await errorObj).show();
}