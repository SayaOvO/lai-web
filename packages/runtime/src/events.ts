export function addEventListeners(
  el: HTMLElement,
  events: { [key: string]: EventListener }
) {
  const added: EventListener[] = []
  for (const eventName in events) {
    const listener = addEventListener(eventName, events[eventName], el)
    added.push(listener)
  }
  return added
}

function addEventListener(
  eventName: string,
  handler: EventListener,
  el: EventTarget
) {
  el.addEventListener(eventName, handler)
  return handler
}
