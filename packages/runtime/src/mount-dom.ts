import {
  ElementVNode,
  FragmentVNode,
  TEXTVNode,
  VDOM_TYPE,
  VNode,
  ElementVNodeProps,
} from './h'
import { setAttributes } from './attributes'
import { addEventListeners } from './events'

export function mountDOM(
  vdom: VNode,
  parentEl: HTMLElement,
  index: number | null
) {
  const { type } = vdom

  switch (type) {
    case VDOM_TYPE.TEXT: {
      mountTextNode(vdom, parentEl, index)
      break
    }
    case VDOM_TYPE.ELEMENT: {
      mountElementNode(vdom, parentEl, index)
      break
    }
    case VDOM_TYPE.FRAGMENT: {
      mountFragmentNodes(vdom, parentEl, index)
      break
    }
    default: {
      throw new Error('Unknown type of vdom')
    }
  }
}

function insert(
  el: HTMLElement | Text,
  parentEl: HTMLElement,
  index: number | null
) {
  if (index == null) {
    parentEl.append(el)
    return
  }
  if (index < 0) {
    throw new Error(`Index must be a positive integer, but got ${index}`)
  }
  const children = parentEl.childNodes
  if (index >= children.length) {
    parentEl.append(el)
  } else {
    parentEl.insertBefore(el, children[index])
  }
}

function mountTextNode(
  vdom: TEXTVNode,
  parentEl: HTMLElement,
  index: number | null
) {
  const text = document.createTextNode(vdom.value)
  vdom.el = text
  insert(text, parentEl, index)
}

function mountElementNode(
  vdom: ElementVNode,
  parentEl: HTMLElement,
  index: number | null
) {
  const { tag, props, children } = vdom
  const element = document.createElement(tag)
  addProps(element, vdom, props)
  vdom.el = element
  children.forEach((child) => mountDOM(child, element, null))
  insert(element, parentEl, index)
}

function mountFragmentNodes(
  vdom: FragmentVNode,
  parentEl: HTMLElement,
  index: number | null
) {
  const { children } = vdom
  children.forEach((child, i) =>
    mountDOM(child, parentEl, index ? index + i : null)
  )
  vdom.el = parentEl
}

function addProps(
  el: HTMLElement,
  vdom: ElementVNode,
  props: ElementVNodeProps
) {
  const { on: events, ...attrs } = props
  if (events) {
    vdom.listeners = addEventListeners(el, events)
  }
  if (attrs) {
    setAttributes(el, attrs)
  }
}
