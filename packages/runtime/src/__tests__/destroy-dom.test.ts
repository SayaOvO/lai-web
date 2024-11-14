import { beforeEach, vi, test, expect } from 'vitest'
import { hString, h, hFragment } from '../h'
import { mountDOM } from '../mount-dom'
import { destroyDOM } from '../destroy-dom'

beforeEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

test('unmount a text element in a host element', () => {
  const vdom = hString('hello')
  mountDOM(vdom, document.body)

  expect(document.body.innerHTML).toBe('hello')
  destroyDOM(vdom)
  expect(document.body.innerHTML).toBe('')
  expect(vdom.el).toBeUndefined()
})

test('unmount an element with event handlers', () => {
  const onClick = vi.fn()
  const vdom = h('div', { on: { click: onClick } })
  mountDOM(vdom, document.body)
  vdom.el?.click()
  expect(onClick).toBeCalledTimes(1)
  expect(onClick).toBeCalledWith(expect.any(MouseEvent))
  expect(vdom.listeners).toEqual({ click: expect.any(Function) })
  destroyDOM(vdom)
  expect(vdom.listeners).toBeUndefined()
})

test('unmount an element with children', () => {
  const onClick = vi.fn()
  const vBtn = h(
    'button',
    {
      on: {
        click: onClick,
      },
    },
    ['click me']
  )
  const children = [vBtn]
  const vdom = h('div', { class: ['foo', 'bar'] }, children)

  mountDOM(vdom, document.body)

  expect(document.body.innerHTML).toBe(
    '<div class="foo bar"><button>click me</button></div>'
  )
  destroyDOM(vdom)
  expect(vdom.el).toBeUndefined()
  expect(vdom.listeners).toBeUndefined()
  expect(vBtn.el).toBeUndefined()
  expect(vBtn.listeners).toBeUndefined() // should be removed
})
