import {VNode, render} from "preact";
import {HideableDiv} from "../components/hideable";
import {$} from "../framework/util";

var el: VNode;
const errorObj: any = new Promise(res => {
    el = <HideableDiv data-bind={res} id="error">
        <h1 id="error-text">Loading...</h1>
        <p id="error-stack">Loading...</p>
    </HideableDiv>

    render(el, $("#error-c"));
});


(await errorObj).hide();