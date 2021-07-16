// deno-lint-ignore-file no-explicit-any no-extra-semi

import { arrayEqual, patchMethod, top } from './util.ts'

export type Constructor =
  | ArrayConstructor
  | ObjectConstructor
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | FunctionConstructor

export type StateTypes = Record<string, Constructor>

export const Types: StateTypes = {
  array: Array,
  object: Object,
  string: String,
  number: Number,
  boolean: Boolean,
  function: Function,
}

const getType = (value: any) => {
  return Array.isArray(value) ? Types.array : Types[typeof value]
}

const getDefaultValue = (value: any) => {
  // dprint-ignore
  return value === Boolean  ? false
       : value === Array    ? []
       : value === Function ? () => {}
       : value === String   ? ''
       : null
}

const castTo = (type: any, value: any) => {
  // dprint-ignore
  return type === Boolean && value === ''                 ? true
       : type === Array    ? (Array.isArray(value)        ? value.slice() : [])
       : type === Function ? (typeof value === 'function' ? value : () => {})
       : type(value)
}

const proxies = new WeakMap()

let _unwrap = false
let _quiet = false

export const quiet = (fn: () => void) => {
  const prevQuiet = _quiet
  _quiet = true
  try {
    fn()
  }
  catch (e) {
    console.error(e)
  }
  _quiet = prevQuiet
}

type StateDescription = Record<string, any>

export const state = (desc: StateDescription = {}) => {
  const target: Record<string, any> = {}
  const types = new Map()
  const props = new Map()
  const resolved = new Set()

  for (const [prop, value] of Object.entries(desc)) {
    if (Object.values(Types).includes(value)) {
      types.set(prop, value)
      target[prop] = getDefaultValue(value)
    }
    else {
      types.set(prop, getType(value))
      target[prop] = value
      resolved.add(prop)
    }
    props.set(prop, new Set())
  }

  const proxy = new Proxy(target, {
    get(target, prop, proxy) {
      if (_unwrap) return Reflect.get(target, prop)
      else {
        return {
          name: prop,
          proxy,
          subscribe(fn: () => void) {
            props.get(prop).add(fn)
          },
          unsubscribe(fn: () => void) {
            props.get(prop).delete(fn)
          },
          get hasResolved() {
            return resolved.has(prop)
          },
          get value() {
            return this.valueOf()
          },
          get type() {
            return types.get(prop)
          },
          [Symbol.toPrimitive]() {
            return this.valueOf()
          },
          valueOf() {
            return Reflect.get(target, prop)
          },
        }
      }
    },

    set(target, prop, value) {
      // if (_quiet) {
      //   return Reflect.set(target, prop, value)
      // }
      const type = types.get(prop)

      if (!type) {
        throw new ReferenceError('State has no property: ' + prop.toString())
      }

      const valueToSet = castTo(type, value)

      const existingValue = Reflect.get(target, prop)
      // if value is the same as before, don't trigger
      if (valueToSet === existingValue) {
        // console.log('value to set', valueToSet, Reflect.get(target, prop))
        return true
      }

      if (Array.isArray(existingValue) && Array.isArray(valueToSet)) {
        if (arrayEqual(valueToSet, existingValue)) {
          return true
        }
      }

      const result = Reflect.set(target, prop, valueToSet)

      if (result) {
        resolved.add(prop)

        // TODO: microtask fn triggers
        props.get(prop).forEach((fn: () => void) =>
          triggerIfSatisfied(fn, prop)
        )
      }

      return result
    },

    ownKeys(target) {
      return Reflect.ownKeys(target)
    },
  })

  proxies.set(proxy, { target, props, types, resolved })

  return proxy
}

const unwrapFactory = (flag: boolean) =>
  (fn: () => void) => {
    const prevUnwrap = _unwrap
    _unwrap = flag
    try {
      fn()
    }
    catch (e) {
      console.error(e)
    }
    _unwrap = prevUnwrap
  }

export const unwrap = unwrapFactory(true)
export const wrap = unwrapFactory(false)

const effects = new WeakMap()
const once = new WeakSet()

const triggerIfSatisfied = (fn: () => void, _prop?: string | symbol) => {
  const deps = [...effects.get(fn)]
  const didUpdate = deps.every((prop) => prop.hasResolved)
  if (didUpdate) {
    top.__currentObject__ = contexts.get(fn)
    unwrap(fn)
    if (once.has(fn)) {
      once.delete(fn)
      deps.forEach((dep) => dep.unsubscribe(fn))
      effects.delete(fn)
    }
  }
}

const contexts = new WeakMap()

export const effect = (fn: () => void, ...deps: any[]) => {
  deps = deps.filter(Boolean)
  contexts.set(fn, top.__currentObject__)
  effects.set(fn, new Set(deps))
  try {
    wrap(() => deps.forEach((dep) => dep.subscribe(fn)))
    triggerIfSatisfied(fn)
  }
  catch (e) {
    console.trace(deps)
    console.error(e)
  }
  return () => {
    once.delete(fn)
    wrap(() => deps.forEach((dep) => dep.unsubscribe(fn)))
    effects.delete(fn)
  }
}

effect.once = (fn: () => void, ...deps: any[]) => {
  once.add(fn)
  return effect(fn, ...deps)
}

effect.wrap = (fn: () => void, ...deps: any[]) => {
  return effect(wrap(fn) as any, ...deps)
}

export const callback = (fn: (...args: any[]) => void, obj?: any) => {
  const callbackFn = (...args: any[]) => {
    let result
    unwrap(() => {
      result = fn.call(obj, ...args)
    })
    return result
  }
  if (obj) {
    patchMethod(obj, callbackFn)
  }
  return callbackFn
}

type Task = { fn: (...args: any[]) => Promise<void>; args: any[] }

export const atomic = (fn: (...args: any[]) => Promise<void>) => {
  let next: Task | null
  let task: Task | null
  let promise: Promise<void> | null

  const run = async (): Promise<void> => {
    if (task) await promise
    task = next

    next = null

    if (task) {
      try {
        unwrap(() => {
          promise = (task as Task).fn(...(task as Task).args)
        })
        await promise
      }
      catch (e) {
        console.error(e)
      }
      finally {
        task = null
      }
    }

    if (next) return run()
  }

  return (...args: any[]) => {
    const hadNext = next
    next = { fn, args }
    if (!hadNext) {
      return run()
    }
    else {
      return promise
    }
  }
}
