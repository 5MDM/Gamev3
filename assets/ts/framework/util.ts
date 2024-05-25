export const UTIL_VERSION: number = 1.1;

export const RADIAN_QUARTER = 28.6479;

export function throwErr(file: string, msg: string): never {
  const err = new Error(`${file}.ts: ${msg}`);
  console.error(err);
  throw err.stack;
}

export function $(e: string): Element {
  const el = document.querySelector(e);
  if(el === null) throwErr(
    "util",
    `Can't find element "${e}"`
  );

  return el;
}

interface $$Opts {
  text?: string;
  children?: Element[];
  up?: () => void;
  down?: () => void;
  attrs?: {[key: string]: string},
  style?: {[key: string]: string},
}

export function $$
<N extends keyof HTMLElementTagNameMap>
(name: N, opts?: $$Opts): HTMLElementTagNameMap[N] {
  const el: HTMLElementTagNameMap[N] = 
  document.createElement(name) as 
  HTMLElementTagNameMap[N];

  if(!opts) return el;

  if(opts.text) el.innerText = opts.text;

  if(opts.children) 
    for(const i of opts.children)
      el.appendChild(i);

  if(opts.up)
    el.addEventListener("pointerup", opts.up);

  if(opts.down)
    el.addEventListener("pointerdown", opts.down);

  if(opts.attrs)
    for(const name in opts.attrs)
      el.setAttribute(name, opts.attrs[name]);

  if(opts.style)
    for(const name in opts.style)
      el.style.setProperty(name, opts.style[name]);

  return el;
}