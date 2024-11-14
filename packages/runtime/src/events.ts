export function addEventListeners(
  el: HTMLElement,
  events: { [key: string]: EventListener }
) {
  const added: { [key: string]: EventListener } = {}
  for (const eventName in events) {
    const listener = addEventListener(eventName, events[eventName], el)
    added[eventName] = listener
  }
  return added
}

export function addEventListener(
  eventName: string,
  handler: EventListener,
  el: EventTarget
) {
  el.addEventListener(eventName, handler)
  return handler
}

export function removeListener(
  eventName: string,
  handler: EventListener,
  el: EventTarget
) {
  el.removeEventListener(eventName, handler)
}
