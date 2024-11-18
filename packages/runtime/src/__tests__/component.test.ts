import { beforeEach, expect, test, vi, describe } from 'vitest'
import { defineComponent, Component } from '../component'
import { h } from '../h'

beforeEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('test static component', () => {
  const Button = defineComponent({
    render() {
      return h('button', {}, ['a button'])
    },
  })

  test('render method', () => {
    const btn = new Button()
    expect(btn.render()).toEqual(h('button', {}, ['a button']))
  })

  test('mount method', () => {
    const btn = new Button()
    btn.mount(document.body)
    expect(document.body.innerHTML).toBe('<button>a button</button>')
  })
})

describe('a stateful component', () => {
  const Button = defineComponent<{}, { count: number }>({
    render() {
      return h('button', {}, [this.state.count])
    },
    state() {
      return { count: 0 }
    },
  })

  test('render method', () => {
    const btn = new Button()
    expect(btn.render()).toEqual(h('button', {}, [0]))
  })

  test('mount method', () => {
    const btn = new Button()
    btn.mount(document.body)
    expect(document.body.innerHTML).toBe('<button>0</button>')
  })

  test('component with props', () => {
    type Props = { initialState: number }
    type State = { count: number }
    const Button = defineComponent<Props, State>({
      render() {
        return h('button', {}, [this.state.count])
      },
      state(props?: { initialState: number }) {
        return {
          count: props?.initialState ?? 0,
        }
      },
    })

    const btn = new Button({
      initialState: 2,
    })
    expect(btn.render()).toEqual(h('button', {}, [2]))
  })
})
