import { Hook } from './component'
import { removeListener } from './events'
import {
  ComponentVNode,
  ElementVNode,
  FragmentVNode,
  TEXTVNode,
  VDOM_TYPE,
  VNode,
} from './h'
import { enqueueTask } from './scheduler'

export function destroyDOM(vdom: VNode, onUnmounted?: Hook) {
  const { type } = vdom

  switch (type) {
    case VDOM_TYPE.TEXT: {
      destroyTextNode(vdom)
      break
    }
    case VDOM_TYPE.ELEMENT: {
      destroyElementNode(vdom)
      break
    }
    case VDOM_TYPE.FRAGMENT: {
      destroyFragmentNodes(vdom)
      break
    }
    case VDOM_TYPE.COMPONENT: {
      destroyComponentNode(vdom, onUnmounted)
    }
  }
  delete vdom.el
}

function destroyTextNode(vdom: TEXTVNode) {
  const { el } = vdom
  if (!el) {
    return
  }
  el.remove()
}

function destroyElementNode(vdom: ElementVNode) {
  const { children, listeners, el } = vdom
  if (!el) {
    return
  }
  if (listeners) {
    for (const eventName in listeners) {
      removeListener(eventName, listeners[eventName], el)
    }
    delete vdom.listeners
  }
  el.remove()
  children.forEach((child) => destroyDOM(child))
}

function destroyFragmentNodes(vdom: FragmentVNode) {
  const { children } = vdom
  children.forEach((child) => destroyDOM(child))
}

function destroyComponentNode(vdom: ComponentVNode, onUnmounted?: Hook) {
  const { children, component } = vdom
  if (component) {
    component.unmount()
    if (onUnmounted) {
      enqueueTask(onUnmounted)
    }
  }
  children.forEach((child) => destroyDOM(child))
}
