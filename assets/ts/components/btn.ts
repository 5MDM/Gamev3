import { $$ } from "../framework/util";

export function btn(name: string, up: (() => void), styleClass?: string): HTMLButtonElement {
    return $$("button", {
        attrs: {
            class: (styleClass || ""),
        },
        text: name,
        up,
    });
}