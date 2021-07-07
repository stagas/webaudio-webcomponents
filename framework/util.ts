// deno-lint-ignore-file no-explicit-any no-extra-semi

import { effect } from './state.ts'

export const top: any = window
top.__methods__ ??= new Map()
top.__currentObject__ ??= null

export const UID = (key?: string) => {
  return (key ? key + '_' : '') + (Math.random() * 10e6 | 0).toString(36)
}

export const patchMethod = (obj: any, method: any, key?: string) => {
  const uid = UID(key)
  top.__methods__.set(uid, method.bind(obj))
  method.toString = () => `__methods__.get('${uid}')`
  return method
}

export const patchMethods = (obj: any, methods: Record<string, any>) => {
  for (const [key, method] of Object.entries(methods)) {
    if (typeof method !== 'function') continue
    patchMethod(obj, method, key)
  }
  return methods
}

export const bind = (obj: any) =>
  (parts: string[], ...values: any[]) => {
    let str = ''
    for (let i = 0; i < parts.length; i++) {
      str += parts[i]
      const value = values[i]
      if (typeof value === 'function') {
        str += patchMethod(obj ?? top.__currentObject__, value).toString()
      }
      else if (value) {
        str += value
      }
    }
    return str
  }

export const el = (tagName: string, content: any) => {
  const uid = UID('x')
  const str = `<${tagName} id="${uid}"></${tagName.split(' ')[0]}>`
  const obj = top.__currentObject__
  effect(() => {
    const domEl = obj.get('#' + uid)
    if (domEl) {
      domEl.textContent = content.value
    }
  }, content)
  return str
}
