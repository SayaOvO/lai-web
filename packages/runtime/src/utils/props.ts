import { CustomEventListeners } from '../component'
import { ComponentVNode, ElementVNode, ElementVNodeProps } from '../h'
export function extractPropsAndEvents(vdom: ElementVNode | ComponentVNode): {
  events: CustomEventListeners
  props: Omit<ElementVNodeProps, 'on'>
} {
  const { on: events = {}, ...props } = vdom.props
  delete props.key

  return {
    events,
    props,
  }
}
