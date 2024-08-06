import { $, $$, hideable, HideableInterface } from "../../framework/util";
import { images } from "../../start/main";
import { btn } from "../../components/btn";
import { startGame } from "../world/main";
import { greedyMeshTest } from "./testing";

const menuDir = $("#ui > #menu");

function start() {
    menu.hide();
    startGame();
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
            text: "Made by 5mdm. Keyboard support and code help from DeltAndy",
        }),
    ],
}));

credits.hide();
menuDir.appendChild(credits.el);

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
                btn("Testing", () => redir(testing)),
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

console.log(images);

const testingText = $$("p", {
    attrs: {
        class: "full-width",
    },
    style: {
        color: "white",
    }
});

const testing = hideable($$("div", {
    attrs: {
        class: "btn1 flex-column",
    },
    style: {
        "white-space": "pre-wrap",
        display: "block",
    },
    children: [
        testingText,
        btn("Start greedy mesh test", () => greedyMeshTest(testingText)),
    ],
}));

testing.hide();

menuDir.appendChild(testing.el);

function redir(obj: HideableInterface) {
    credits.hide();
    menu.hide();
    obj.show();
}

menuDir.appendChild(menu.el);