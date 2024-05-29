import {useState} from "preact/hooks";
import {VNode, cloneElement, toChildArray} from "preact";
import {VisibilityInterface} from "./hideable";

export function BtnList(props: {
    [index: string]: any;
    up?: ((id: string) => void);
    anim: string;
    animDuration: string;
    bind: {name: string; up: () => void;}[];
}) {
    const el = <div {...props}>
        {props.bind.map(({name, up}) => {
            const [currentStyle, setStyle] = useState("");

            function f() {
                setStyle(`animation-name: ${props.anim}; animation-duration: ${props.animDuration}s`);
                setTimeout(() => {
                    up();
                }, Number(props.animDuration) * 1000);
            }

            return <button style={currentStyle} onPointerUp={f}>{name}</button>
        })}
    </div>

    return el;
}