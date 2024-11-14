type DispatcherCallback<Payload> = (payload?: Payload) => void

export class Dispatcher<
  Events extends string,
  // eslint-disable-next-line
  Payloads extends Record<Events, unknown> = Record<Events, any>,
> {
  #subs = new Map<Events, DispatcherCallback<Payloads[Events]>[]>()
  #afterCommandHooks: VoidFunction[] = []

  subscribe<EventName extends Events>(
    command: EventName,
    handler: DispatcherCallback<Payloads[EventName]>
  ): VoidFunction {
    if (!this.#subs.has(command)) {
      this.#subs.set(command, [])
    }
    const handlers = this.#subs.get(command)! as DispatcherCallback<
      Payloads[EventName]
    >[]
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

  dispatch<EventName extends Events>(
    command: EventName,
    payload?: Payloads[EventName]
  ) {
    const handlers = this.#subs.get(command)
    if (!handlers) {
      console.warn(`The command: ${String(command)} has not registered`)
    } else {
      handlers.forEach((handler) => handler(payload))
    }
    this.#afterCommandHooks.forEach((hook) => hook())
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
