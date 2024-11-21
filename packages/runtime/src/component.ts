import equal from 'fast-deep-equal'
import { destroyDOM } from './destroy-dom'
import { ElementVNodeProps, VDOM_TYPE, VNode, extractChildren, h } from './h'
import { mountDOM } from './mount-dom'
import { patchDOM } from './patch-dom'
import { Dispatcher } from './dispatcher'

export type MethodDefinition = {
  [key: string]: (...args: any[]) => any
}

export type ComponentEvents = string
export type ComponentPayloads = Record<ComponentEvents, any>

type ComponentOptions<
  Props = {},
  State = {},
  Methods extends MethodDefinition = {},
  Events extends ComponentEvents = ComponentEvents,
  Payloads extends ComponentPayloads = ComponentPayloads,
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
  props: Props
  unmount: () => void
  updateState: (newState: Partial<State>) => void
  updateProps: (newProps: Props) => void
  offset: number
  elements: (HTMLElement | Text)[]
  firstElement: HTMLElement | Text
  emit: (commandName: string, payload: any) => void
} & Methods

export type CustomEventListeners = {
  [key: string]: (...args: any[]) => any
}

export type ComponentClass<
  Props = any,
  State = any,
  Methods extends MethodDefinition = {},
> = new (
  props?: Props,
  events?: CustomEventListeners,
  parentComponent?: Component | null
) => Component<Props, State, Methods>

export function defineComponent<
  Props,
  State = {},
  Methods extends MethodDefinition = {},
>({
  render,
  state,
  ...methods
}: ComponentOptions<Props, State, Methods>): ComponentClass<
  Props,
  State,
  Methods
> {
  class UserComponent implements Component<Props, State> {
    #hostEl: HTMLElement | null = null // where the component mounted
    #isMounted = false
    vdom: VNode | null = null // vdom represent component
    state: State = {} as State
    props: Props = {} as Props
    #dispatcher = new Dispatcher()
    #eventListeners: Pick<ElementVNodeProps, 'on'> = {}
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
      props: Props,
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
      return render.call(this as unknown as Component<Props, State, Methods>)
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
      } else {
        this.props = newProps
      }
    }
    emit(commandName: string, payload: any) {
      this.#dispatcher.dispatch(commandName, payload)
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

      mountDOM(this.vdom, parentEl, index, this as Component)
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

    #wireEventHandler(eventName, handler) {
      return this.#dispatcher.subscribe(eventName, (payload) => {
        if (this.#parentComponent) {
          handler.call(this.#parentComponent, payload)
        } else {
          handler(payload)
        }
      })
    }
  }

  return UserComponent as unknown as ComponentClass<Props, State, Methods>
}
