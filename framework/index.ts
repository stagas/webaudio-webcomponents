// deno-lint-ignore-file no-explicit-any no-extra-semi

import { dom } from './dom.ts'
import { effect, quiet, state, Types, unwrap, wrap } from './state.ts'
import { bind, flatten, patchMethods, top } from './util.ts'

export { dom }
export * from './state.ts'
export * from './util.ts'

type ComponentDescriptor = {
  class: string
  extends: typeof Base
  slot: boolean
} & ComponentParams

const ComponentDescriptorProperties = [
  'class',
  'extends',
  'slot',
  'attrs',
  'props',
  'pins',
  'component',
]

const pascalCase = (s: string) =>
  s.split('-').map((p: string) => p[0].toLocaleUpperCase() + p.slice(1)).join(
    '',
  )

const mergeFilter = (
  target: Record<string, any>,
  source: Record<string, any>,
  fn: (key: string, value: any) => boolean,
) => {
  for (const [key, value] of Object.entries(source)) {
    if (fn(key, value)) target[key] = value
  }
  return target
}

// deno-lint-ignore valid-typeof
const is = (type: any, item: any) => typeof item === type
const isType = (item: any) => Object.values(Types).includes(item)
const isProp = (key: string) => ComponentDescriptorProperties.includes(key)

const getLocalProperties = (d: ComponentDescriptor) =>
  mergeFilter({}, d, (k, v) => !is('function', v) && !isProp(k))
const getPrototypeMethods = (d: ComponentDescriptor) =>
  mergeFilter({}, d, (k, v) => is('function', v) && !isProp(k))

const copy = (target: Record<string, any>, source: Record<string, any>) => {
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      target[key] = value.slice()
    }
    else if (typeof value === 'object') {
      target[key] = Object.create(value)
    }
    else {
      target[key] = value
    }
  }
}

export const mergeParams = (target: any = {}, source: any = {}) => {
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      target[key] = value.slice()
    }
    else if (typeof value === 'object') {
      target[key] = mergeParams(target[key] || {}, value)
    }
    else {
      target[key] = value
    }
  }
  return target
}

const createAccessors = (
  target: any,
  source: any = {},
  accessors: any = {},
) => {
  for (const key in source) {
    // save the instance value
    const value = target[key]
    Object.defineProperty(target, key, {
      get() {
        return accessors.get?.call(this, key) ?? Reflect.get(source, key)
      },
      set(value: any) {
        accessors.set?.call(this, key, value)
        return Reflect.set(source, key, value)
      },
    })
    // re-apply value to trigger setter
    if (value != null) target[key] = value
  }
}

class Base extends HTMLElement {
  static slot: boolean | 'shallow'
  static observedAttributes: string[]

  html!: string
  slotted!: Node[]
  params: ComponentParams
  state: ComponentParams
  shallow!: boolean

  constructor({ attrs = {}, props = {}, pins = {} }: ComponentParams = {}) {
    super()

    const self = this as any
    const ctor = this.constructor as typeof Base

    const params: ComponentParams = mergeParams({ attrs, props, pins }, {
      props: { slotted: Array, html: String },
    })

    this.params = params

    this.state ??= {
      attrs: state(params.attrs),
      props: state(params.props),
      pins: state(
        Object.fromEntries(
          Object.keys(params.pins ?? {}).map(key => [key, Object]),
        ),
      ),
    }

    createAccessors(this, this.state.props)
    createAccessors(this, this.state.attrs, {
      set(key: string, value: any) {
        wrap(() => {
          const attr = this.getAttribute(key)
          if (attr != value) {
            // this will trigger the observed attributes
            // and this function will run again, so we
            // return and let the observed fn to proceed
            const type = this.state.attrs[key].type
            if (type === Boolean) {
              if (attr == null) {
                this.removeAttribute(key)
                return
              }
            }
            this.setAttribute(key, value)
          }
        })
      },
    })
    createAccessors(this, this.state.pins)

    if (ctor.slot) {
      if (ctor.slot === 'shallow') {
        this.shallow = true
      }

      this.render `<slot></slot>`
    }

    effect(() => {
      if (this.html.trim().length == 0) return

      this.root.innerHTML = this.html
      // render(html(this.html), this.root)

      for (const [key, selector] of Object.entries(this.params.pins ?? {})) {
        const el = this.get(selector as string)
        if (el) self[key] = el
      }

      const slot = this.root.querySelector('slot')
      if (slot) {
        this.useSlot(slot)
      }
      else {
        this.createSlot()
      }
    }, this.html)
  }

  get root() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' })
    return this.shadowRoot as ShadowRoot
  }

  getCommonStyleTag() {
    return `<style>
      ${(document.styleSheets?.[0]?.ownerNode as HTMLElement)?.innerHTML ?? ''}
    </style>`
  }

  render(parts: TemplateStringsArray, ...values: any[]) {
    dom(
      this.root,
      this.getCommonStyleTag()
        + bind(this)(parts as unknown as string[], ...values),
      this,
    )

    for (const [key, selector] of Object.entries(this.params.pins ?? {})) {
      const el = this.get(selector as string)
      if (el) (this as any)[key] = el
    }

    const slot = this.root.querySelector('slot')
    if (slot) {
      this.useSlot(slot)
    }
    else {
      this.createSlot()
    }
  }

  useSlot(slot: HTMLSlotElement) {
    const elements = () =>
      this.shallow
        ? slot.assignedElements({ flatten: true })
        : slot.assignedElements({ flatten: true }).slice().map(el =>
          [el, flatten(el)].flat()
        ).flat()

    // if (this.root.querySelector('slot') !== slot) {
    //   this.root.appendChild(slot)
    // }

    const get = () => {
      const newElements = elements()
      if (newElements.length) {
        this.slotted = newElements
      }
    }

    get()

    slot.addEventListener('slotchange', get)
  }

  createSlot() {
    const slot = document.createElement('slot')
    this.useSlot(slot)
  }

  get(selector: string) {
    return this?.shadowRoot?.querySelector?.(selector)
  }

  getSlot(selector: string) {
    return this?.shadowRoot?.querySelector?.('slot')?.querySelector(selector)
  }

  getAll(selector: string) {
    return this?.shadowRoot?.querySelectorAll?.(selector)
  }

  getAllSlot(selector: string) {
    return this?.shadowRoot?.querySelector?.('slot')?.querySelectorAll(selector)
  }

  dispatch(name: string, payload: any) {
    this.dispatchEvent(
      new CustomEvent(name, { bubbles: true, composed: true, detail: payload }),
    )
  }

  attributeChangedCallback(
    this: any,
    name: string,
    _oldValue: any,
    newValue: any,
  ) {
    wrap(() => {
      this[name] = newValue
    })
  }
}

type ComponentParams = {
  component?: () => void
  attrs?: Record<string, any>
  props?: Record<string, any>
  pins?: Record<string, string>
}

export const create = (d: ComponentDescriptor) => {
  const { component = () => {}, attrs = {}, props = {}, pins = {} } = d
  const Parent = d.extends ?? Base
  const className = pascalCase(d.class)
  const Component = {
    [className]: class extends Parent {
      constructor(params: ComponentParams) {
        super(mergeParams(params, { attrs, props, pins }))
        top.__currentObject__ = this
        patchMethods(this, getPrototypeMethods(d))
        copy(this, getLocalProperties(d))
        wrap(() => component?.call(this))
      }
    },
  }

  Object.assign(Component[className], { slot: Parent.slot || d.slot, desc: d })
  Object.assign(Component[className].prototype, getPrototypeMethods(d))
  Object.defineProperty(Component[className], 'observedAttributes', {
    get() {
      return Object.keys(d.attrs ?? []).concat(
        (Parent ?? {}).observedAttributes || [],
      )
    },
  })

  return Component[className]
}
