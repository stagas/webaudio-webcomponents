// deno-lint-ignore-file no-explicit-any no-extra-semi

const { SHOW_DOCUMENT_FRAGMENT, SHOW_ELEMENT, SHOW_TEXT } = NodeFilter
const whitespaceTagNames = ['PRE', 'TEXTAREA']

const map = new WeakMap()

export const trim = (html: string) =>
  html.trim().replace(/(>)(\s+)|(\s+)(<\/)/g, '$1$4')

export function parse(html: string, context: any = {}) {
  const el = document.createElement('div')

  el.innerHTML = html

  const fragment = document.createDocumentFragment()
  while (el.hasChildNodes()) fragment.appendChild(el.firstChild as HTMLElement)

  const tree = document.createTreeWalker(
    fragment,
    SHOW_DOCUMENT_FRAGMENT | SHOW_ELEMENT | SHOW_TEXT,
    null,
    false,
  )

  const root: any = { tag: 'div', attrs: {}, children: [], context }

  while (tree.nextNode()) {
    const node = tree.currentNode
    const parent = map.get(node.parentNode as HTMLElement)

    let v: any

    if (node.nodeType === Node.TEXT_NODE) {
      v =
        context.trim
          && !whitespaceTagNames.includes(
            (node.parentNode as HTMLElement)?.tagName,
          )
          ? trim(node.textContent ?? '')
          : node.textContent
    }
    else {
      v = {
        tag: (node as HTMLElement).tagName,
        ...attrs(node),
        children: [],
        context,
      }

      for (const name in v.events) {
        const fn = new Function(
          'event',
          'context',
          `with (context) { ${v.events[name]} }`,
        )
        v.events[name] = function(event: Event) {
          return fn.call(this, event, v.context)
        }
      }
    }

    map.set(node, v)

    if (parent) parent.children.push(v)
    else root.children.push(v)
  }

  return root
}

const attrs = (node: any) =>
  [...node.attributes].reduce(
    (
      p,
      n,
    ) => (p[['attrs', 'events'][+(n.name.indexOf('on') === 0)]][n.name] =
      n.value,
      p),
    { attrs: {}, events: {} },
  )

const update = (node: any, v: any, parent: any, updated = v.updated) => {
  if (!v.tag) {
    return node.data !== v && (parent.updated = true) && (node.data = v)
  }

  if (v.attrs.key === node.getAttribute('key')) {
    // console.log('match', v.attrs.key)
    return false
  }

  for (const name in v.events) {
    node[name] = v.events[name], updated = true
  }

  for (const name in v.attrs) {
    if (node.getAttribute(name) !== v.attrs[name] && (updated = true)) {
      node.setAttribute(name, v.attrs[name])
    }
  }

  for (const { name } of [...node.attributes]) {
    if (!(name in v.attrs) && (updated = true)) {
      node.removeAttribute(name)
    }
  }

  return v.updated = updated
}

const create = (v: any) =>
  v.tag && (v.rendered = true)
    ? ['svg', 'path', 'rect', 'circle'].includes(v.tag)
      ? document.createElementNS('http://www.w3.org/2000/svg', v.tag)
      : document.createElement(v.tag)
    : document.createTextNode(v)

export function render(currentNode: any, v: any) {
  const prev = currentNode.childNodes
  const next = v.children

  while (prev.length > next.length) {
    currentNode.removeChild(currentNode.lastChild)
  }

  for (const [i, child] of next.entries()) {
    let node = prev[i]

    if (!node) {
      currentNode.appendChild(node = create(child))
    }
    else if (node.tagName !== child.tag) {
      currentNode.replaceChild(node = create(child), prev[i])
    }

    update(node, child, v)

    if (child.children) render(node, child)
  }

  if (v.updated) dispatch(currentNode, 'onupdate')
  if (v.rendered) dispatch(currentNode, 'onrender')
}

const dispatch = (node: any, event: string, fn = node.tagName && node[event]) =>
  fn && fn.call(node)

export function dom(parent: any, html: string, context: any) {
  render(parent, parse(html, context))
}
