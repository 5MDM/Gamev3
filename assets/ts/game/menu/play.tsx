import {VNode, render} from "preact";
import {Hideable} from "../../components/hideable";
import {$} from "../../framework/util";

var menu: VNode;
export const menuObj: any = new Promise(res => {
    menu = <Hideable data-bind={res}>
        <div class="btn1 auto-margin flex-column full-height good-width">
            <button>Play</button>
            <button>Settings</button>
        </div>
    </Hideable>

    render(menu, $("#ui > #menu"));
});
