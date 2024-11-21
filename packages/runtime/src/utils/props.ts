import { CustomEventListeners } from '../component'
import { ComponentVNode, ElementVNode, ElementVNodeProps, VNode } from '../h'
export function extractPropsAndEvents(vdom: ElementVNode | ComponentVNode): {
  events: CustomEventListeners
  props: Omit<ElementVNodeProps, 'on'>
} {
  const { on: events = {}, ...props } = vdom.props

  return {
    events,
    props,
  }
}
