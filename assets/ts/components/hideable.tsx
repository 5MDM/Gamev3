import {useImperativeHandle, useState} from "preact/hooks";

export function HideableDiv(props: {[index: string]: any; elType?: string; "data-bind": any, id?: string, class?: string}, ref: any) {
    props.elType ||= "flex";
    const hidden = "display: none";
    const shown = "display: " + props.elType;
    const [visible, setVisible] = useState(shown);
    const el = <div id={props.id} class={props.class} style={visible}>{props.children}</div>;

    props["data-bind"]({
        show: () => setVisible(shown),
        hide: () => setVisible(hidden),
        toggle: () => (visible == shown) ? setVisible(shown) : setVisible(hidden),
    });

    return el;
}
