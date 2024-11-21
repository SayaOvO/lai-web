import {
  ElementVNode,
  FragmentVNode,
  TEXTVNode,
  VDOM_TYPE,
  VNode,
  ElementVNodeProps,
  ComponentVNode,
} from './h'
import { setAttributes } from './attributes'
import { addEventListeners } from './events'
import { Component } from './component'
import { extractPropsAndEvents } from './utils/props'

export function mountDOM(
  vdom: VNode,
  parentEl: HTMLElement,
  index: number | null,
  hostComponent?: Component // for binding handler's this value
) {
  const { type } = vdom

  switch (type) {
    case VDOM_TYPE.TEXT: {
      mountTextNode(vdom, parentEl, index)
      break
    }
    case VDOM_TYPE.ELEMENT: {
      mountElementNode(vdom, parentEl, index, hostComponent)
      break
    }
    case VDOM_TYPE.FRAGMENT: {
      mountFragmentNodes(vdom, parentEl, index, hostComponent)
      break
    }
    case VDOM_TYPE.COMPONENT: {
      mountComponentNode(vdom, parentEl, index, hostComponent)
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
  index?: number | null
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
  index?: number | null
) {
  const text = document.createTextNode(vdom.value)
  vdom.el = text
  insert(text, parentEl, index)
}

function mountElementNode(
  vdom: ElementVNode,
  parentEl: HTMLElement,
  index: number | null,
  hostComponent?: Component
) {
  const { tag, children } = vdom
  const element = document.createElement(tag)
  addProps(element, vdom, hostComponent)
  vdom.el = element
  children.forEach((child) => mountDOM(child, element, null, hostComponent))
  insert(element, parentEl, index)
}

function mountComponentNode(
  vdom: ComponentVNode,
  parentEl: HTMLElement,
  index: number | null,
  hostComponent: Component | null = null
) {
  const { tag: Component } = vdom
  const { props, events } = extractPropsAndEvents(vdom)
  const component = new Component(props, events, hostComponent)
  component.mount(parentEl, index)
  vdom.component = component
  vdom.el = component.firstElement
}

function mountFragmentNodes(
  vdom: FragmentVNode,
  parentEl: HTMLElement,
  index: number | null,
  hostComponent?: Component
) {
  const { children } = vdom
  children.forEach((child, i) =>
    mountDOM(child, parentEl, index ? index + i : null, hostComponent)
  )
  vdom.el = parentEl
}

function addProps(
  el: HTMLElement,
  vdom: ElementVNode,
  hostComponent?: Component
) {
  const { events, props } = extractPropsAndEvents(vdom)
  if (events) {
    vdom.listeners = addEventListeners(el, events, hostComponent)
  }
  if (props) {
    setAttributes(el, props)
  }
}
