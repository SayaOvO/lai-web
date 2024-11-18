import { withoutNulls } from './utils/arrays'

export enum VDOM_TYPE {
  TEXT,
  ELEMENT,
  FRAGMENT,
}

export interface TEXTVNode {
  type: VDOM_TYPE.TEXT
  value: string
  el?: Text
}

export interface ElementVNode {
  type: VDOM_TYPE.ELEMENT
  tag: string
  props: ElementVNodeProps
  children: VNode[]
  el?: HTMLElement
  listeners?: { [event: string]: EventListener }
}

export interface FragmentVNode {
  type: VDOM_TYPE.FRAGMENT
  children: VNode[]
  el?: HTMLElement
}

export interface ElementVNodeProps {
  on?: { [key: string]: EventListener }
  [key: string]: unknown
}

export type VNode = TEXTVNode | ElementVNode | FragmentVNode

export function hString(
  value: string | number | symbol | bigint | boolean
): TEXTVNode {
  return {
    type: VDOM_TYPE.TEXT,
    value: String(value),
  }
}

export function h(
  tag: string,
  props: ElementVNodeProps = {},
  children: ChildNodeType[] = []
): ElementVNode {
  return {
    type: VDOM_TYPE.ELEMENT,
    tag,
    props,
    children: mapPrimitiveToText(withoutNulls(children)),
  }
}

export function hFragment(children: ChildNodeType[] = []): FragmentVNode {
  return {
    type: VDOM_TYPE.FRAGMENT,
    children: mapPrimitiveToText(withoutNulls(children)), // null or undefined will render nothing
  }
}

export type ChildNodeType =
  | VNode
  | null
  | undefined
  | string
  | number
  | symbol
  | bigint
  | boolean

function mapPrimitiveToText(
  children: Exclude<ChildNodeType, null | undefined>[]
) {
  return children.map((child) =>
    typeof child === 'string' ||
    typeof child === 'number' ||
    typeof child === 'boolean' ||
    typeof child === 'bigint' ||
    typeof child === 'symbol'
      ? hString(child)
      : child
  )
}

export function extractChildren(vdom: ElementVNode | FragmentVNode): VNode[] {
  const children = []
  for (const child of vdom.children) {
    if (child.type === VDOM_TYPE.FRAGMENT) {
      children.push(...extractChildren(child))
    } else {
      children.push(child)
    }
  }

  return children
}
