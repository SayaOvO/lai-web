import {
  removeAttribute,
  removeStyle,
  setAttribute,
  setStyle,
} from './attributes'
import { destroyDOM } from './destroy-dom'
import { addEventListener } from './events'
import { VDOM_TYPE, TEXTVNode, VNode, ElementVNode, FragmentVNode } from './h'
import { mountDOM } from './mount-dom'
import {
  ARRAY_DIFF_OP,
  arraysDiff,
  arraysDiffSequence,
  MoveOperation,
  NoopOperation,
} from './utils/arrays'
import { nodesEqual } from './utils/nodes-equal'
import { objectsDiff } from './utils/objects'

export function patchDOM(
  oldVdom: VNode,
  newVdom: VNode,
  parentEl: HTMLElement
): VNode {
  // when two vdoms are different type, unmount old, mount new
  if (!nodesEqual(oldVdom, newVdom)) {
    if (oldVdom.el) {
      const index = findIndexInParent(oldVdom.el, parentEl)
      destroyDOM(oldVdom)
      mountDOM(newVdom, parentEl, index)
      return newVdom
    }
  }
  newVdom.el = oldVdom.el
  const { type } = oldVdom
  switch (type) {
    case VDOM_TYPE.TEXT: {
      patchText(oldVdom, newVdom as TEXTVNode)
      return newVdom
    }
    case VDOM_TYPE.ELEMENT: {
      patchElement(oldVdom, newVdom as ElementVNode)
    }
  }

  patchChildren(oldVdom, newVdom as ElementVNode | FragmentVNode)
  return newVdom
}

function findIndexInParent(parentEl: HTMLElement | Text, el: HTMLElement) {
  const index = Array.from(parentEl.childNodes).indexOf(el)
  if (index < 0) {
    return null
  }
  return index
}

function patchText(oldVdom: TEXTVNode, newVdom: TEXTVNode) {
  const { el } = oldVdom
  if (!el) {
    return
  }
  el.textContent = newVdom.value
}

function patchElement(oldVdom: ElementVNode, newVdom: ElementVNode) {
  const { el } = oldVdom
  if (!el) {
    return
  }
  const {
    class: oldClass,
    style: oldStyle,
    on: oldEvents,
    ...oldAttrs
  } = oldVdom.props
  const {
    class: newClass,
    style: newStyle,
    on: newEvents,
    ...newAttrs
  } = newVdom.props
  patchClasses(oldClass, newClass, el)
  patchStyles(oldStyle, newStyle, el)
  patchAttrs(oldAttrs, newAttrs, el)
  const { listeners } = oldVdom
  newVdom.listeners = patchEvents(listeners, oldEvents, newEvents, el)
}

function patchChildren(
  oldVdom: ElementVNode | FragmentVNode,
  newVdom: ElementVNode | FragmentVNode
) {
  const oldChildren = oldVdom.children
  const newChildren = newVdom.children
  const parentEl = oldVdom.el
  if (!parentEl) {
    return
  }
  const diffSeq = arraysDiffSequence(oldChildren, newChildren, nodesEqual)

  for (const operation of diffSeq) {
    const { index, item, op } = operation
    switch (op) {
      case ARRAY_DIFF_OP.ADD: {
        mountDOM(item, parentEl, index)
        break
      }
      case ARRAY_DIFF_OP.REMOVE: {
        destroyDOM(item)
        break
      }
      case ARRAY_DIFF_OP.MOVE: {
        const { from } = operation as MoveOperation<VNode>
        const oldChild = oldChildren[from]
        const newChild = newChildren[index]
        const el = oldChild.el
        if (!el) {
          return
        }
        const elAtTargetIndex = parentEl.childNodes[index]
        parentEl.insertBefore(el, elAtTargetIndex)
        patchDOM(oldChild, newChild, parentEl)
        break
      }
      case ARRAY_DIFF_OP.NOOP: {
        const { originalIndex } = operation as NoopOperation<VNode>
        patchDOM(oldChildren[originalIndex], newChildren[index], parentEl)
        break
      }
    }
  }
}

function patchClasses(oldClass: unknown, newClass: unknown, el: HTMLElement) {
  const oldClasses = toClassList(oldClass)
  const newClasses = toClassList(newClass)
  const { added, removed } = arraysDiff(oldClasses, newClasses)
  if (added.length > 0) {
    el.classList.add(...added)
  }
  if (removed.length > 0) {
    el.classList.remove(...removed)
  }
}

function toClassList(className: unknown): string[] {
  if (Array.isArray(className)) {
    return (className as string[]).filter((item) => item.trim() !== '')
  }
  if (typeof className === 'string') {
    return className.trim().split(/\s+/)
  }

  return []
}

function patchStyles(oldStyle: unknown, newStyle: unknown, el: HTMLElement) {
  if (isStringObject(oldStyle) && isStringObject(newStyle)) {
    const { added, updated, removed } = objectsDiff(oldStyle, newStyle)
    added.forEach((item) => setStyle(item, newStyle[item], el))
    updated.forEach((item) => setStyle(item, newStyle[item], el))
    removed.forEach((item) => removeStyle(item, el))
  }
}

function patchAttrs(oldAttrs: unknown, newAttrs: unknown, el: HTMLElement) {
  if (
    typeof oldAttrs === 'object' &&
    typeof newAttrs === 'object' &&
    oldAttrs !== null &&
    newAttrs !== null
  ) {
    const { added, updated, removed } = objectsDiff(
      oldAttrs as Record<string, unknown>,
      newAttrs as Record<string, unknown>
    )
    added.forEach((attr) =>
      setAttribute(attr, (newAttrs as Record<string, unknown>)[attr], el)
    )
    updated.forEach((attr) =>
      setAttribute(attr, (newAttrs as Record<string, unknown>)[attr], el)
    )

    removed.forEach((attr) => removeAttribute(attr, el))
  }
}

function patchEvents(
  oldListeners: { [event: string]: EventListener } = {},
  oldEvents: { [key: string]: EventListener } = {},
  newEvents: { [key: string]: EventListener } = {},
  el: HTMLElement
) {
  const { added, removed, updated } = objectsDiff(oldEvents, newEvents)
  // remove old
  for (const eventName of removed.concat(updated)) {
    el.removeEventListener(eventName, oldListeners[eventName])
  }
  const addedListeners: { [key: string]: EventListener } = {}
  for (const eventName of added.concat(updated)) {
    const listener = addEventListener(eventName, newEvents[eventName], el)
    addedListeners[eventName] = listener
  }
  return addedListeners
}

// I dont know whether its necesarry
function isStringObject(obj: unknown): obj is Record<string, string> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    Object.values(obj).every((val) => typeof val === 'string')
  )
}