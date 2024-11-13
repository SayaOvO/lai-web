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

export function mountDOM(vdom: VNode, parentEl: HTMLElement) {
  const { type } = vdom

  switch (type) {
    case VDOM_TYPE.TEXT: {
      mountTextNode(vdom, parentEl)
      break
    }
    case VDOM_TYPE.ELEMENT: {
      mountElementNode(vdom, parentEl)
      break
    }
    case VDOM_TYPE.FRAGMENT: {
      mountFragmentNodes(vdom, parentEl)
      break
    }
    default: {
      throw new Error('Unknown type of vdom')
    }
  }
}

function mountTextNode(vdom: TEXTVNode, parentEl: HTMLElement) {
  const text = document.createTextNode(vdom.value)
  vdom.el = text
  parentEl.append(text)
}

function mountElementNode(vdom: ElementVNode, parentEl: HTMLElement) {
  const { tag, props, children } = vdom
  const element = document.createElement(tag)
  addProps(element, vdom, props)
  vdom.el = element
  children.forEach((child) => mountDOM(child, element))
  parentEl.append(element)
}

function mountFragmentNodes(vdom: FragmentVNode, parentEl: HTMLElement) {
  const { children } = vdom
  children.forEach((child) => mountDOM(child, parentEl))
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
