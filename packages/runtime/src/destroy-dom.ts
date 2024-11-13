import { removeListener } from './events'
import { ElementVNode, FragmentVNode, TEXTVNode, VDOM_TYPE, VNode } from './h'

export function destroyDOM(vdom: VNode) {
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

  children.forEach(destroyDOM) // remove listeners of children
}

function destroyFragmentNodes(vdom: FragmentVNode) {
  const { children } = vdom
  children.forEach(destroyDOM)
}
