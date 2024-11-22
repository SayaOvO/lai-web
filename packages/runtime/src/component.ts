import equal from 'fast-deep-equal'
import { destroyDOM } from './destroy-dom'
import { VDOM_TYPE, VNode, extractChildren } from './h'
import { mountDOM } from './mount-dom'
import { patchDOM } from './patch-dom'
import { Dispatcher } from './dispatcher'

export type MethodDefinition = {
  [key: string]: (...args: any[]) => any
}

type ComponentOptions<
  State = {},
  Props = {},
  Methods extends MethodDefinition = {},
> = {
  render: (this: Component<State, Props, Methods>) => VNode
  state?: (props?: Props) => State
} & {
  [K in keyof Methods]: (
    this: Component<State, Props, Methods>,
    ...args: Parameters<Methods[K]>
  ) => ReturnType<Methods[K]>
}

export type Component<
  State = {},
  Props = {},
  Methods extends MethodDefinition = {},
> = {
  render: (this: Component<State, Props, Methods>) => VNode
  mount: (parentEl: HTMLElement, index?: number | null) => void
  state: State
  props: Props
  unmount: () => void
  updateState: (newState: Partial<State>) => void
  updateProps: (newProps: Props) => void
  offset: number
  elements: (HTMLElement | Text)[]
  firstElement: HTMLElement | Text
  emit: (commandName: string, payload?: any) => void
} & Methods

export type CustomEventListeners = {
  [key: string]: (...args: any[]) => any
}

export type ComponentClass<
  State = any,
  Props = any,
  Methods extends MethodDefinition = {},
> = new (
  props?: Props,
  events?: CustomEventListeners,
  parentComponent?: Component | null
) => Component<State, Props, Methods>

export function defineComponent<
  State = {},
  Props = {},
  Methods extends MethodDefinition = {},
>({
  render,
  state,
  ...methods
}: ComponentOptions<State, Props, Methods>): ComponentClass<
  State,
  Props,
  Methods
> {
  class UserComponent implements Component<State, Props> {
    #hostEl: HTMLElement | null = null // where the component mounted
    #isMounted = false
    vdom: VNode | null = null // vdom represent component
    state: State = {} as State
    props: Props = {} as Props
    #dispatcher = new Dispatcher()
    #eventListeners: { [key: string]: (...args: any[]) => any }
    #parentComponent: Component | null = null
    #subscriptions: VoidFunction[] = []

    // when the component is mounted, get its top-level children
    get elements(): (HTMLElement | Text)[] {
      if (!this.vdom || !this.vdom.el) return []
      if (this.vdom.type === VDOM_TYPE.FRAGMENT) {
        const children = extractChildren(this.vdom)
        return children.flatMap((child) => {
          if (child.type === VDOM_TYPE.COMPONENT) {
            if (!child.component) return []
            return child.component.elements
          }
          return [child.el!]
        })
      }
      return [this.vdom.el]
    }

    get firstElement() {
      return this.elements[0]
    }

    get offset() {
      if (!this.#hostEl) return 0
      return Array.from(this.#hostEl.childNodes).indexOf(this.firstElement)
    }

    constructor(
      props?: Props,
      events: CustomEventListeners = {},
      parentComponent: Component | null = null
    ) {
      this.state = state ? state(props) : ({} as State)
      this.props = props || ({} as Props)
      this.#eventListeners = events
      this.#parentComponent = parentComponent
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
      return render.call(this as unknown as Component<State, Props, Methods>)
    }

    updateState(state: Partial<State>) {
      this.state = { ...this.state, ...state }
      this.#patch()
    }

    updateProps(props: Props) {
      const newProps = { ...this.props, ...props }
      if (!equal(newProps, this.props)) {
        this.props = newProps
        this.#patch()
      }
    }
    emit(commandName: string, payload?: any) {
      this.#dispatcher.dispatch(commandName, payload)
    }

    // rerender
    #patch() {
      if (!this.#isMounted) {
        throw new Error('The component is not mounted yet.')
      }
      if (!this.vdom || !this.#hostEl) {
        return
      }
      const newVdom = this.render()
      this.vdom = patchDOM(
        this.vdom,
        newVdom,
        this.#hostEl,
        this as unknown as Component
      )
    }

    mount(parentEl: HTMLElement, index: number | null = null) {
      if (this.#isMounted) {
        throw new Error('The component has already mounted')
      }
      this.#hostEl = parentEl
      this.vdom = this.render()

      mountDOM(this.vdom, parentEl, index, this as unknown as Component)
      this.#wireEventHandlers()
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
        this.#subscriptions.forEach((unsub) => unsub())
      }
    }

    #wireEventHandlers() {
      Object.entries(this.#eventListeners).forEach(([eventName, handler]) => {
        this.#subscriptions.push(this.#wireEventHandler(eventName, handler))
      })
    }

    #wireEventHandler(eventName: string, handler: (...args: any[]) => any) {
      return this.#dispatcher.subscribe(eventName, (payload) => {
        if (this.#parentComponent) {
          handler.call(this.#parentComponent, payload)
        } else {
          handler(payload)
        }
      })
    }
  }

  return UserComponent as unknown as ComponentClass<State, Props, Methods>
}
