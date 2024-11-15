import { destroyDOM } from './destroy-dom'
import { Dispatcher } from './dispatcher'
import { VNode, h } from './h'
import { mountDOM } from './mount-dom'
import { patchDOM } from './patch-dom'

type StringKey<Obj> = keyof Obj & string
interface AppData<State, Actions> {
  state: State
  view: (
    state: State,
    emit: (
      commandName: StringKey<Actions>,
      payload?: Actions[StringKey<Actions>]
    ) => void
  ) => VNode
  reducers: { [K in keyof Actions]: Reducer<State, Actions[K] | undefined> }
}

type Reducer<State, Action> = (state: State, payload?: Action) => State

export function createApp<State, Actions>({
  reducers,
  state,
  view,
}: AppData<State, Actions>) {
  let root: HTMLElement | null = null
  let vdom: VNode | null = null
  let isMounted = false
  const dispatcher = new Dispatcher<StringKey<Actions>, Actions>()
  const unsubs = [dispatcher.afterEveryCommand(renderApp)]

  // register reducers
  for (const actionName in reducers) {
    const reducer = reducers[actionName]
    unsubs.push(
      dispatcher.subscribe(actionName, (payload) => {
        state = reducer(state, payload)
      })
    )
  }

  function emit(
    commandName: StringKey<Actions>,
    payload?: Actions[StringKey<Actions>]
  ) {
    dispatcher.dispatch(commandName, payload)
  }

  function renderApp() {
    if (vdom && root) {
      const newVdom = view(state, emit)
      vdom = patchDOM(vdom, newVdom, root)
    }
  }
  return {
    mount(_root: HTMLElement) {
      if (isMounted) {
        throw new Error('The app has already mounted.')
      }
      root = _root
      vdom = view(state, emit)
      mountDOM(vdom, root, null)
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
