import { withoutNulls } from './utils/arrays'
import { Component, ComponentClass } from './component'

export enum VDOM_TYPE {
  TEXT,
  ELEMENT,
  FRAGMENT,
  COMPONENT,
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

export interface ComponentVNode {
  type: VDOM_TYPE.COMPONENT
  tag: ComponentClass
  props: ElementVNodeProps
  children: VNode[]
  component?: Component
  el?: HTMLElement | Text
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

export type VNode = TEXTVNode | ElementVNode | FragmentVNode | ComponentVNode

export function hString(
  value: string | number | symbol | bigint | boolean
): TEXTVNode {
  return {
    type: VDOM_TYPE.TEXT,
    value: String(value),
  }
}

export function h(
  tag: string | ComponentClass,
  props: ElementVNodeProps = {},
  children: ChildNodeType[] = []
): ElementVNode | ComponentVNode {
  if (typeof tag === 'string') {
    return {
      type: VDOM_TYPE.ELEMENT,
      tag: tag,
      props,
      children: mapPrimitiveToText(withoutNulls(children)),
    }
  }
  return {
    type: VDOM_TYPE.COMPONENT,
    tag: tag,
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

export function extractChildren(
  vdom: ElementVNode | FragmentVNode | ComponentVNode
): VNode[] {
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
