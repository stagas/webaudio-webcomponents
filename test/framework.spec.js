import { create, effect } from '../dist/index.js'

const defineAndCreateElement = (Ctor, attrs, inner = '') => {
  const tagName = `x-${(Math.random() * 10e6 | 0).toString(36)}`
  customElements.define(tagName, Ctor)
  let div
  const el =
    ((div = document.createElement('div')).innerHTML = `<${tagName
      + (attrs ? ` ${attrs}` : '')}>${inner}</${tagName}>`,
      div.firstChild)
  return el
}

describe('create()', () => {
  it('should create a component class', () => {
    const Foo = create({ class: 'foo' })
    expect(typeof Foo).to.equal('function')
    const foo = defineAndCreateElement(Foo)
    expect(foo).to.be.instanceof(Foo)
    expect(foo.constructor.name).to.be.equal('Foo')
  })

  it('should create instance methods', () => {
    let called = 0
    const Foo = create({
      class: 'foo',
      method() {
        called++
      },
    })
    const foo = defineAndCreateElement(Foo)
    expect(called).to.equal(0)
    foo.method()
    expect(called).to.equal(1)
  })

  it('should inherit base methods', () => {
    const Foo = create({ class: 'foo' })
    const foo = defineAndCreateElement(Foo)
    expect(typeof foo.get).to.equal('function')
    expect(typeof foo.getAll).to.equal('function')
  })

  it('should inherit other parent methods', () => {
    let called = 0
    const Foo = create({
      class: 'foo',
      method() {
        called++
      },
    })
    const Bar = create({ class: 'bar', extends: Foo })
    const bar = defineAndCreateElement(Bar)
    expect(typeof bar.get).to.equal('function')
    expect(typeof bar.getAll).to.equal('function')
    expect(called).to.equal(0)
    bar.method()
    expect(called).to.equal(1)
  })

  it('should create local properties', () => {
    const Foo = create({ class: 'foo', some: 'prop' })
    const foo = defineAndCreateElement(Foo)
    expect(foo.some).to.equal('prop')
  })

  it('should ignore descriptor properties', () => {
    const Foo = create({ class: 'foo' })
    const foo = defineAndCreateElement(Foo)
    expect(foo.class).to.equal(undefined)
  })

  it('changing a descriptor local array should not change instance array', () => {
    const arr = [1, 2, 3]
    const Foo = create({ class: 'foo', arr })
    const foo = defineAndCreateElement(Foo)
    expect(foo.arr).to.deep.equal([1, 2, 3])
    arr[1] = 5
    expect(arr).to.deep.equal([1, 5, 3])
    expect(foo.arr).to.deep.equal([1, 2, 3])
  })
})

describe('slot=true', () => {
  it('should create slot', () => {
    const Foo = create({
      class: 'foo',
      slot: true,
      component() {
        this.html = `<slot></slot>`
      },
    })
    const foo = defineAndCreateElement(Foo)
    expect(foo).to.be.instanceof(Foo)
    expect(foo.shadowRoot).to.be.instanceof(ShadowRoot)
    expect(foo.shadowRoot.querySelector('slot')).to.be.instanceof(
      HTMLSlotElement,
    )
  })

  it('should create slotted', (done) => {
    const Foo = create({
      class: 'foo',
      slot: true,
      component() {
        this.render `<slot></slot>`
      },
    })
    const foo = defineAndCreateElement(Foo, null, '<span>hello</span>')
    expect(foo).to.be.instanceof(Foo)
    expect(foo.shadowRoot).to.be.instanceof(ShadowRoot)
    console.log(foo.shadowRoot)
    expect(foo.shadowRoot.querySelector('slot')).to.be.instanceof(
      HTMLSlotElement,
    )
    effect.once(() => {
      expect(foo.slotted[0]).to.be.instanceof(HTMLSpanElement)
      done()
    }, foo.slotted)
  })
})

describe('attrs', () => {
  it('should create attrs', () => {
    const Foo = create({ class: 'foo', attrs: { some: String } })
    const foo = defineAndCreateElement(Foo)
    expect(foo).to.be.instanceof(Foo)
    expect(foo.some.value).to.equal('')
  })

  it('should be passed in html', (done) => {
    const Foo = create({ class: 'foo', attrs: { some: String } })
    const foo = defineAndCreateElement(Foo, 'some="hello"')
    expect(foo).to.be.instanceof(Foo)
    effect(() => {
      expect(foo.some).to.equal('hello')
      done()
    }, foo.some)
  })

  it('should inherit attrs', () => {
    const Foo = create({ class: 'foo', attrs: { some: String } })
    const Bar = create({ class: 'bar', extends: Foo })
    const bar = defineAndCreateElement(Bar, 'some="hello"')
    expect(bar).to.be.instanceof(Bar)
    expect(bar.some.value).to.equal('hello')
  })

  it('should create attrs with prop name, src', () => {
    const Foo = create({ class: 'foo', attrs: { name: String, src: String } })
    const foo = defineAndCreateElement(Foo)
    expect(foo).to.be.instanceof(Foo)
    expect(foo.name.value).to.equal('')
    expect(foo.src.value).to.equal('')
  })

  it('should create attrs inherited with prop name, src', () => {
    const Bar = create({ class: 'Bar', component() {} })
    const Foo = create({
      class: 'foo',
      extends: Bar,
      attrs: { name: String, src: String },
      component() {},
    })
    const foo = defineAndCreateElement(Foo)
    expect(foo).to.be.instanceof(Foo)
    expect(foo.name.value).to.equal('')
    expect(foo.src.value).to.equal('')
  })
})

describe('props', () => {
  it('should create props', () => {
    const Foo = create({ class: 'foo', props: { some: String } })
    const foo = defineAndCreateElement(Foo)
    expect(foo).to.be.instanceof(Foo)
    expect(foo.some.value).to.equal('')
  })

  it('should trigger props', (done) => {
    const Foo = create({ class: 'foo', props: { some: String } })
    const foo = defineAndCreateElement(Foo)
    expect(foo).to.be.instanceof(Foo)
    effect(() => {
      expect(foo.some).to.equal('hello')
      done()
    }, foo.some)
    foo.some = 'hello'
  })

  it('should inherit props', (done) => {
    const Foo = create({ class: 'foo', props: { some: String } })
    const Bar = create({ class: 'bar', extends: Foo })
    const bar = defineAndCreateElement(Bar)
    expect(bar).to.be.instanceof(Bar)
    expect(bar.some.value).to.equal('')
    effect(() => {
      expect(bar.some).to.equal('hello')
      done()
    }, bar.some)
    bar.some = 'hello'
  })
})

describe('html', () => {
  it('should create html', () => {
    const html = '<span>hello</span>'
    const Foo = create({ class: 'foo', html })
    const foo = defineAndCreateElement(Foo)
    expect(foo).to.be.instanceof(Foo)
    expect(foo.shadowRoot.innerHTML).to.equal('<span>hello</span>')
  })
})

describe('pins', () => {
  it('should create pins', (done) => {
    const html = '<span>hello</span>'
    const Foo = create({ class: 'foo', html, pins: { span: 'span' } })
    const foo = defineAndCreateElement(Foo)
    expect(foo).to.be.instanceof(Foo)
    effect(() => {
      expect(foo.span).to.be.instanceof(HTMLSpanElement)
      done()
    }, foo.span)
  })
})

describe('component()', () => {
  it('should apply', () => {
    let called = 0
    const Foo = create({
      class: 'foo',
      attrs: { some: String },
      component() {
        effect(() => {
          called++
        }, this.some)
      },
    })
    const foo = defineAndCreateElement(Foo)
    expect(foo).to.be.instanceof(Foo)
    expect(called).to.equal(0)
    foo.some = 'hello'
    expect(called).to.equal(1)
  })
})
