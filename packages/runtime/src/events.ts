import { Component } from './component'
export function addEventListeners(
  el: HTMLElement,
  events: { [key: string]: EventListener },
  hostComponent?: Component
) {
  const added: { [key: string]: EventListener } = {}
  for (const eventName in events) {
    const listener = addEventListener(
      eventName,
      events[eventName],
      el,
      hostComponent
    )
    added[eventName] = listener
  }
  return added
}

export function addEventListener(
  eventName: string,
  handler: EventListener,
  el: EventTarget,
  hostComponent?: Component
) {
  const boundHandler = hostComponent ? handler.bind(hostComponent) : handler

  el.addEventListener(eventName, boundHandler)
  return handler
}

export function removeListener(
  eventName: string,
  handler: EventListener,
  el: EventTarget
) {
  el.removeEventListener(eventName, handler)
}
