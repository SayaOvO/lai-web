export function setAttributes(
  el: HTMLElement,
  attrs: { [key: string]: unknown }
) {
  const { style, class: className, ...otherAttrs } = attrs
  setClass(className, el)
  if (style) {
    Object.entries(style).forEach(([name, value]) => {
      setStyle(name, String(value), el)
    })
  }
  Object.entries(otherAttrs).forEach(([name, value]) => {
    setAttribute(name, value, el)
  })
}

function setClass(className: unknown, el: HTMLElement) {
  if (className) {
    el.className = ''
    if (Array.isArray(className)) {
      el.classList.add(...className)
    }
    if (typeof className === 'string') {
      el.className = className
    }
  }
}

function setStyle(name: string, value: string, el: HTMLElement) {
  // eslint-disable-next-line
  ;(el.style as any)[name] = value
}

function setAttribute(name: string, value: unknown, el: HTMLElement) {
  if (value == null) {
    el.removeAttribute(name)
  } else if (typeof value === 'string' || typeof value === 'number') {
    el.setAttribute(name, String(value))
  }
}
