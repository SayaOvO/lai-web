import { VDOM_TYPE, VNode } from '../h'

export function nodesEqual(oldNode: VNode, newNode: VNode): boolean {
  const { type: typeOne } = oldNode
  const { type: typeTwo } = newNode

  if (typeOne !== typeTwo) {
    return false
  }
  if (typeOne === VDOM_TYPE.ELEMENT && typeTwo === VDOM_TYPE.ELEMENT) {
    return oldNode.tag === newNode.tag
  }
  return true
}
