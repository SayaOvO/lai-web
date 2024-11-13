type DispatcherCallback<Payload> = (payload: Payload) => void

export class Dispatcher<Actions, Command extends keyof Actions> {
  #subs = new Map<Command, Array<(payload: Actions[Command]) => void>>()
  #afterCommandHooks: VoidFunction[] = []

  subscribe(
    command: Command,
    handler: DispatcherCallback<Actions[Command]>
  ): VoidFunction {
    if (!this.#subs.has(command)) {
      this.#subs.set(command, [])
    }
    const handlers = this.#subs.get(command)!
    if (handlers.includes(handler)) {
      return () => {}
    }
    handlers.push(handler)
    return () => {
      const idx = handlers.indexOf(handler)
      if (idx > -1) {
        handlers.splice(idx, 1)
      }
    }
  }

  dispatch(command: Command, payload: Actions[Command]) {
    const handlers = this.#subs.get(command)
    if (!handlers) {
      console.warn(`The command: ${String(command)} has not registered`)
    } else {
      handlers.forEach((handler) => handler(payload))
    }
  }

  afterEveryCommand(hook: () => void) {
    this.#afterCommandHooks.push(hook)
    return () => {
      const idx = this.#afterCommandHooks.indexOf(hook)
      if (idx > -1) {
        this.#afterCommandHooks.splice(idx, 1)
      }
    }
  }
}
