import { destroyDOM } from './destroy-dom'
import { VDOM_TYPE, VNode, extractChildren, h } from './h'
import { mountDOM } from './mount-dom'
import { patchDOM } from './patch-dom'

type MethodDefinition = {
  [key: string]: (...args: any[]) => any
}

type ComponentOptions<
  Props,
  State = {},
  Methods extends MethodDefinition = {},
> = {
  render: (this: Component<Props, State, Methods>) => VNode
  state?: (props?: Props) => State
} & {
  [K in keyof Methods]: (
    this: Component<Props, State, Methods>,
    ...args: Parameters<Methods[K]>
  ) => ReturnType<Methods[K]>
}

export type Component<
  Props = {},
  State = {},
  Methods extends MethodDefinition = {},
> = {
  render: (this: Component<Props, State, Methods>) => VNode
  mount: (parentEl: HTMLElement, index?: number | null) => void
  state: State
  unmount: () => void
  updateState: (newState: Partial<State>) => void
  offset: number
} & Methods

export function defineComponent<
  Props,
  State = {},
  Methods extends MethodDefinition = {},
>({
  render,
  state,
  ...methods
}: ComponentOptions<Props, State, Methods>): new (
  props?: Props
) => Component<Props, State, Methods> {
  class UserComponent implements Component<Props, State> {
    #hostEl: HTMLElement | null = null
    #isMounted = false
    vdom: VNode | null = null
    state: State = {} as State

    // when the component is mounted, get its top-level children
    get #elements() {
      if (!this.vdom || !this.vdom.el) return []
      if (this.vdom.type === VDOM_TYPE.FRAGMENT) {
        const children = extractChildren(this.vdom)
        return children.map((child) => child.el!)
      }
      return [this.vdom.el]
    }

    get offset() {
      if (!this.#hostEl) return 0
      const firstElement = this.#elements[0]
      return Array.from(this.#hostEl.childNodes).indexOf(firstElement)
    }

    constructor(props?: Props) {
      this.state = state ? state(props) : ({} as State)
      Object.entries(methods).forEach(([key, method]) => {
        if (
          Object.prototype.hasOwnProperty.call(UserComponent.prototype, key)
        ) {
          console.error(`The method: ${method} is reserved.`)
          return
        }
        ;(this as any)[key] = method.bind(this)
      })
    }

    render(): VNode {
      return render.call(this as unknown as Component<Props, State, Methods>)
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
      this.vdom = patchDOM(this.vdom, newVdom, this.#hostEl, this as Component)
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

  return UserComponent as unknown as new (
    props?: Props
  ) => Component<Props, State, Methods>
}
