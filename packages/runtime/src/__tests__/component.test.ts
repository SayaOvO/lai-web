import { beforeEach, expect, test, vi, describe } from 'vitest'
import { defineComponent } from '../component'
import { h, hFragment } from '../h'
import { mountDOM } from '../mount-dom'

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
  const Button = defineComponent<{ count: number }>({
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
    const Button = defineComponent<State, Props>({
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
    const Button = defineComponent<State, Props>({
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

  test('the component is not the only child of its parent', () => {
    type Props = { initialState: number }
    type State = { count: number }
    const Button = defineComponent<State, Props>({
      render() {
        const children = Array.from({ length: this.state.count }, (_, idx) =>
          h('button', {}, [`button ${idx}`])
        )
        return hFragment(children)
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
    document.body.append(document.createElement('p'))
    btn.mount(document.body)
    expect(document.body.innerHTML).toEqual(
      '<p></p><button>button 0</button><button>button 1</button>'
    )
    btn.updateState({
      count: 3,
    })
    expect(document.body.innerHTML).toEqual(
      '<p></p><button>button 0</button><button>button 1</button><button>button 2</button>'
    )
  })
})

describe('method', () => {
  test('bind event listener', () => {
    const handleClick = vi.fn()
    type Props = { initialState: number }
    type State = { count: number }
    type Methods = {
      handleClick: typeof handleClick
    }
    const Button = defineComponent<State, Props, Methods>({
      render() {
        return h(
          'button',
          {
            on: {
              click: this.handleClick,
            },
            class: 'btn',
          },
          [this.state.count]
        )
      },
      state(props?: { initialState: number }) {
        return {
          count: props?.initialState ?? 0,
        }
      },
      handleClick,
    })

    const Btn = new Button()
    Btn.mount(document.body)
    const btn = document.querySelector('.btn') as HTMLButtonElement
    btn.click()
    expect(handleClick).toBeCalledTimes(1)
  })
})

describe('nested componet', () => {
  type Props = { initialState: number }
  type State = { count: number }
  const Button = defineComponent<State, Props>({
    render() {
      const children = Array.from({ length: this.state.count }, (_, idx) =>
        h('button', { key: idx }, [`button ${idx}`])
      )
      return hFragment(children)
    },
    state(props?: { initialState: number }) {
      return {
        count: props?.initialState ?? 0,
      }
    },
  })

  test('mountDom', () => {
    const buttonVdom = h(Button, { initialState: 2 })
    const Container = defineComponent({
      render() {
        return buttonVdom
      },
    })
    const container = h(Container, {
      onClick: vi.fn(),
    })
    mountDOM(container, document.body, null)
    expect(document.body.innerHTML).toBe(
      '<button>button 0</button><button>button 1</button>'
    )
  })

  test('h', () => {
    const Container = defineComponent({
      render() {
        return h('div', {}, [h(Button)])
      },
    })
    const c = new Container()
    c.mount(document.body)

    expect(document.body.innerHTML).toBe('<div></div>')
  })

  test('key', () => {
    const Container = defineComponent({
      render() {
        return h(
          'div',
          {},
          Array.from({ length: 2 }, () => h(Button, { initialState: 2 }))
        )
      },
    })
    const c = new Container()
    c.mount(document.body)

    expect(document.body.innerHTML).toBe(
      '<div><button>button 0</button><button>button 1</button><button>button 0</button><button>button 1</button></div>'
    )
  })
})
