import { destroyDOM } from './destroy-dom'
import { Dispatcher } from './dispatcher'
import { VNode } from './h'
import { mountDOM } from './mount-dom'

interface AppData<State, Actions> {
  state: State
  view: (
    state: State,
    emit: (commandName: keyof Actions, payload: Actions[keyof Actions]) => void
  ) => VNode
  reducers: { [K in keyof Actions]: Reducer<State, Actions[K]> }
}

type Reducer<State, Action> = (state: State, payload: Action) => State

export function createApp<State, Actions>({
  reducers,
  state,
  view,
}: AppData<State, Actions>) {
  let root: HTMLElement | null = null
  let vdom: VNode | null = null
  let isMounted = false
  const dispatcher = new Dispatcher<Actions, keyof Actions>()
  const unsubs = [dispatcher.afterEveryCommand(renderApp)]

  // register reducers
  for (const actionName in reducers) {
    const reducer = reducers[actionName as keyof Actions]
    unsubs.push(
      dispatcher.subscribe(actionName, (payload) => {
        state = reducer(state, payload)
      })
    )
  }

  function emit(commandName: keyof Actions, payload: Actions[keyof Actions]) {
    dispatcher.dispatch(commandName, payload)
  }

  function renderApp() {
    if (vdom) {
      destroyDOM(vdom)
    }
    vdom = view(state, emit)
    if (root) {
      mountDOM(vdom, root)
    }
  }
  return {
    mount(_root: HTMLElement) {
      if (isMounted) {
        throw new Error('The app has already mounted.')
      }
      root = _root
      renderApp()
      isMounted = true
    },
    unmount() {
      if (!isMounted) {
        throw new Error('The app has already unmounted.')
      }
      if (vdom) {
        destroyDOM(vdom)
        vdom = null
        isMounted = false
        unsubs.forEach((unsub) => unsub())
      }
    },
  }
}
