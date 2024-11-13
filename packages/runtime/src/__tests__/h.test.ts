import { describe, test, expect } from 'vitest'
import { h, hFragment, hString, VDOM_TYPE } from '../h'

describe('test VDOM creation api', () => {
  test('hString', () => {
    let vdom = hString('node')
    expect(vdom).toEqual({
      type: VDOM_TYPE.TEXT,
      value: 'node',
    })
    vdom = hString(2) // number
    expect(vdom).toEqual({
      type: VDOM_TYPE.TEXT,
      value: '2',
    })

    vdom = hString(Symbol('node')) // symbol
    expect(vdom).toEqual({
      type: VDOM_TYPE.TEXT,
      value: 'Symbol(node)',
    })
  })

  test('h', () => {
    let vdom = h('button', {}, ['a button'])
    expect(vdom).toEqual({
      type: VDOM_TYPE.ELEMENT,
      tag: 'button',
      props: {},
      children: [
        {
          type: VDOM_TYPE.TEXT,
          value: 'a button',
        },
      ],
    })
    vdom = h('button', {}, ['button', null, 'click it']) // with null child
    expect(vdom).toEqual({
      type: VDOM_TYPE.ELEMENT,
      tag: 'button',
      props: {},
      children: [
        {
          type: VDOM_TYPE.TEXT,
          value: 'button',
        },
        {
          type: VDOM_TYPE.TEXT,
          value: 'click it',
        },
      ],
    })
    const onClick = () => {}
    const props = {
      class: 'btn',
      on: { click: onClick },
    }
    vdom = h('button', props, [])
    expect(vdom).toEqual({
      type: VDOM_TYPE.ELEMENT,
      tag: 'button',
      props,
      children: [],
    })
  })

  test('fragment', () => {
    const children = ['text', h('button', { class: 'btn' }, ['click me'])]
    const fragment = hFragment(children)
    expect(fragment).toEqual({
      type: VDOM_TYPE.FRAGMENT,
      children: [
        hString('text'),
        {
          type: VDOM_TYPE.ELEMENT,
          tag: 'button',
          props: {
            class: 'btn',
          },
          children: [hString('click me')],
        },
      ],
    })
  })
})
