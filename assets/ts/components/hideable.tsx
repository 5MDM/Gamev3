import {useImperativeHandle, useState} from "preact/hooks";

export function Hideable(props: {[index: string]: any; elType?: string; "data-bind": any}, ref: any) {
    props.elType ||= "flex";
    const [visible, setVisible] = useState(true);
    const el = <>
        {visible && props.children}
    </>;

    props["data-bind"]({
        show: () => setVisible(true),
        hide: () => setVisible(false),
        toggle: () => (visible) ? setVisible(true) : setVisible(false),
    });

    return el;
}
