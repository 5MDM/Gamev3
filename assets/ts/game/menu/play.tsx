import {VNode, render} from "preact";
import {Hideable, VisibilityInterface} from "../../components/hideable";
import {BtnList} from "../../components/btn-list";
import {$} from "../../framework/util";
import {images} from "../../start/main";

var menu: VNode;
export const menuObj: Promise<VisibilityInterface> = new Promise(async res => {
    menu = <Hideable data-bind={res}>
        <img id="title-screen-img" src={images["menu/title-screen.png"]} />
        <BtnList bind={[
            {name: "Play", up: hideMenu}
        ]} id="overlay" class="btn1 auto-margin flex-column full-height good-width" animDuration="0.8" anim="btn-anim1">
        </BtnList>
    </Hideable>

    render(menu, $("#ui > #menu"));
});


async function hideMenu() {
    (await menuObj).hide();
}