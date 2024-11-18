import { VNode, h } from './h'
import { mountDOM } from './mount-dom'

interface ComponentOptions<Props, State = {}> {
  render: (this: Component<Props, State>) => VNode
  state?: (props?: Props) => State
}

export interface Component<Props, State = {}> {
  render: (this: Component<Props, State>) => VNode
  mount: (parentEl: HTMLElement, index?: number | null) => void
  state: State
}

export function defineComponent<Props, State = {}>({
  render,
  state,
}: ComponentOptions<Props, State>): new (
  props?: Props
) => Component<Props, State> {
  class UserComponent implements Component<Props, State> {
    #isMounted = false
    vdom: VNode | null = null
    state: State = {} as State

    constructor(props?: Props) {
      this.state = state ? state(props) : ({} as State)
    }

    render(): VNode {
      return render.call(this)
    }

    mount(parentEl: HTMLElement, index: number | null = null) {
      if (this.#isMounted) {
        throw new Error('The component has already mounted')
      }
      this.vdom = this.render()

      mountDOM(this.vdom, parentEl, index)
      this.#isMounted = true
    }
  }

  return UserComponent
}
