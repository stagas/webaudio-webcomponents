import { effect, mergeParams, state } from '../dist/index.js'

describe('mergeParams()', () => {
  it('should merge level 1 a<-b returning a', () => {
    const merged = mergeParams({ foo: 'bar' }, { other: 'prop' })
    expect(Object.keys(merged).join()).to.equal('foo,other')
  })

  it('should merge level 2 a.a<-b.a returning a', () => {
    const merged = mergeParams({ a: { foo: 'bar' } }, { a: { other: 'prop' } })
    expect(Object.keys(merged.a).join()).to.equal('foo,other')
  })
})
describe('state()', () => {
  it('should create a state object', () => {
    const s = state({})
    expect(s).to.be.an('object')
  })

  it('should wrap keys', () => {
    const s = state({ foo: 'bar' })
    expect(s.foo).to.be.an('object')
    expect(s.foo.value).to.equal('bar')
    expect(s.foo + ' zoo').to.equal('bar zoo')
  })
})

describe('effect()', () => {
  it('should create effect', () => {
    const s = state({ foo: 'bar' })
    let times = 0
    let res = ''
    effect(() => {
      res += s.foo
      times++
    }, s.foo)
    expect(times).to.equal(1)
    expect(res).to.equal('bar')
    s.foo = 'zoo'
    expect(times).to.equal(2)
    expect(res).to.equal('barzoo')
  })

  it('should trigger when satisfied', () => {
    const s = state({ foo: 'bar', other: String })
    let times = 0
    let res = ''
    effect(
      () => {
        res += s.foo
        times++
      },
      s.foo,
      s.other,
    )
    expect(times).to.equal(0)
    expect(res).to.equal('')
    s.foo = 'zoo'
    expect(times).to.equal(0)
    s.other = 'yes'
    expect(times).to.equal(1)
    expect(res).to.equal('zoo')
  })

  it('should cast to type', () => {
    const s = state({ foo: String, value: Number, flag: Boolean })
    let times = 0
    let res = ''
    effect(
      () => {
        res += s.foo
        times++
      },
      s.foo,
      s.value,
      s.flag,
    )
    s.foo = 'zoo'
    s.value = '5'
    s.flag = ''
    expect(s.foo.value).to.equal('zoo')
    expect(s.value.value).to.equal(5)
    expect(s.flag.value).to.equal(true)
  })
})

describe('in web component', () => {
  it('should fill the values properly', () => {
    let times = 0
    class Foo extends HTMLElement {
      static get observedAttributes() {
        return ['foo', 'value', 'flag']
      }

      constructor() {
        super()
        this.state = state({ foo: String, value: Number, flag: Boolean })

        effect(
          () => {
            times++
          },
          this.state.foo,
          this.state.value,
          this.state.flag,
        )
      }

      attributeChangedCallback(name, oldValue, newValue) {
        this.state[name] = newValue
      }
    }

    customElements.define('x-foo-state', Foo)
    const div = document.createElement('div')
    div.innerHTML = '<x-foo-state foo="zoo" value="10" flag></x-foo-state>'
    const foo = div.firstChild
    document.body.appendChild(div)
    expect(times).to.equal(1)
    expect(foo.state.foo.value).to.equal('zoo')
    expect(foo.state.value.value).to.equal(10)
    expect(foo.state.flag.value).to.equal(true)
    foo.removeAttribute('flag')
    expect(foo.state.flag.value).to.equal(false)
    expect(times).to.equal(2)
  })
})
