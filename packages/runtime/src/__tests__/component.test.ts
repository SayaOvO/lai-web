import { beforeEach, expect, test, vi, describe } from 'vitest'
import { defineComponent, Component } from '../component'
import { h, hFragment } from '../h'

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

  test('unmount', () => {
    const btn = new Button()
    btn.mount(document.body)
    expect(document.body.innerHTML).toBe('<button>0</button>')
    btn.unmount()
    expect(document.body.innerHTML).toBe('')
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

  test('component return fragment', () => {
    const Comp = defineComponent({
      render() {
        return hFragment([
          h('button', {}, ['button one']),
          h('button', {}, ['button two']),
        ])
      },
    })
    document.body.append(document.createElement('p'))
    const cmp = new Comp()
    cmp.mount(document.body)
    expect(document.body.innerHTML).toEqual(
      '<p></p><button>button one</button><button>button two</button>'
    )
  })
})

describe('updateState', () => {
  test('', () => {
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
    btn.mount(document.body)
    btn.updateState({
      count: 5,
    })
    expect(btn.render()).toEqual(h('button', {}, [5]))
    expect(document.body.innerHTML).toEqual('<button>5</button>')
  })
})
