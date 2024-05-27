import {VNode, render} from "preact";
import {Hideable} from "../components/hideable";
import {$} from "../framework/util";

var el: VNode;
export const errorObj: any = new Promise(res => {
    el = <Hideable data-bind={res}>
        <div id="error">
            <h1 id="error-text">Loading...</h1>
            <p id="error-stack">Loading...</p>
        </div>
    </Hideable>

    render(el, $("#error-c"));
});


(await errorObj).hide();