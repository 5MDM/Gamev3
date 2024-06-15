import { $, $$, hideable, HideableInterface } from "../../framework/util";
import { images } from "../../start/main";
import { btn } from "../../components/btn";
import { startGame } from "../world/main";

function start() {
    menu.hide();
    startGame;
}

const credits = hideable($$("div", {
    attrs: {
        class: "btn1"
    },
    children: [
        btn("Back", () => redir(menu)),
        $$("h2", {
            attrs: {
                class: "full-width"
            },
            style: {
                "background-color": "white"
            },
            text: "Made by 5mdm",
        }),
    ],
}));

credits.hide();
$("#ui > #menu").appendChild(credits.el);

const menu = hideable($$("div", {
    attrs: {
        id: "overlay",
    },
    children: [
        $$("div", {
            attrs: {
                class: "isAbsolute flex-column full-height good-width margin-25 btn1",
            },
            children: [
                btn("Play", () => start()),
                btn("Credits", () => redir(credits)),
            ]
        }),
        $$("img", {
            attrs: {
                id: "title-screen-img",
                src: images["menu/title-screen.png"],
                alt: "picture of floating islands above green landscape and a lake",
            },
        }),
    ],
}));

function redir(obj?: HideableInterface) {
    credits.hide();
    menu.hide();
    obj?.show();
}

$("#ui > #menu").appendChild(menu.el);
