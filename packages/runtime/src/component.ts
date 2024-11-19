import { destroyDOM } from './destroy-dom'
import { VNode, h } from './h'
import { mountDOM } from './mount-dom'
import { patchDOM } from './patch-dom'

interface ComponentOptions<Props, State = {}> {
  render: (this: Component<Props, State>) => VNode
  state?: (props?: Props) => State
}

export interface Component<Props, State = {}> {
  render: (this: Component<Props, State>) => VNode
  mount: (parentEl: HTMLElement, index?: number | null) => void
  state: State
  unmount: () => void
  updateState: (newState: Partial<State>) => void
}

export function defineComponent<Props, State = {}>({
  render,
  state,
}: ComponentOptions<Props, State>): new (
  props?: Props
) => Component<Props, State> {
  class UserComponent implements Component<Props, State> {
    #hostEl: HTMLElement | null = null
    #isMounted = false
    vdom: VNode | null = null
    state: State = {} as State

    constructor(props?: Props) {
      this.state = state ? state(props) : ({} as State)
    }
    render(): VNode {
      return render.call(this)
    }

    updateState(state: Partial<State>) {
      this.state = { ...this.state, ...state }
      this.#patch()
    }

    // rerender
    #patch() {
      if (!this.vdom || !this.#hostEl) {
        return
      }
      const newVdom = this.render()
      console.log('newVdom:', newVdom)
      this.vdom = patchDOM(this.vdom, newVdom, this.#hostEl)
    }

    mount(parentEl: HTMLElement, index: number | null = null) {
      if (this.#isMounted) {
        throw new Error('The component has already mounted')
      }
      this.#hostEl = parentEl
      this.vdom = this.render()

      mountDOM(this.vdom, parentEl, index)
      this.#isMounted = true
    }

    unmount() {
      if (!this.#isMounted) {
        throw new Error('The component is not mounted.')
      }
      if (this.vdom) {
        // there are more need to do
        destroyDOM(this.vdom)
        this.vdom = null
        this.#isMounted = false
        this.state = {} as State
      }
    }
  }

  return UserComponent
}
