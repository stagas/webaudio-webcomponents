// deno-lint-ignore-file no-explicit-any no-extra-semi

import { callback, effect } from './state.ts'

export const top: any = window
top.__methods__ ??= new Map()
top.__currentObject__ ??= null

export const UID = (key?: string) => {
  return (key ? key + '_' : '') + (Math.random() * 10e6 | 0).toString(36)
}

export const patchMethod = (obj: any, method: any, key?: string) => {
  const uid = UID(key)
  const fn = method.bind(obj)
  if (key) obj[key] = callback(fn)
  top.__methods__.set(uid, callback(fn))
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

const { SHOW_DOCUMENT_FRAGMENT, SHOW_ELEMENT, SHOW_TEXT } = NodeFilter

export function* traverse(node: Node | null) {
  if (node) {
    const tree = document.createTreeWalker(
      node,
      SHOW_DOCUMENT_FRAGMENT | SHOW_ELEMENT | SHOW_TEXT,
      null,
      false,
    )

    // deno-lint-ignore no-cond-assign
    while (node = tree.nextNode()) {
      yield node
    }
  }
}

export const flatten = (node: Node | null) => {
  return [...traverse(node)]
}

export const arrayEqual = (a: any[], b: any[]) => a.every((x, i) => x === b[i])

export const slug = (s: string) => {
  return s.toLowerCase().replace(/[^a-z]/, '')
}

export function getOffset(el) {
  let x = 0
  let y = 0
  do {
    x += el.offsetLeft - el.scrollLeft
    y += el.offsetTop - el.scrollTop
  } while ((el = el.offsetParent))
  return { x, y }
}

export function getRelativeMouseCoords(el, event) {
  let x = 0
  let y = 0
  const { x: offsetX, y: offsetY } = getOffset(el)
  // when moving cursor outside the window it very weirdly wraps
  // its coordinates so this is correcting it (on Chrome/Linux)
  let pageY = event.pageY
  if (pageY > 16384) pageY -= 32768
  x = event.pageX - offsetX
  y = pageY - offsetY
  x = Math.round(x)
  y = Math.round(y)
  return { x, y }
}
