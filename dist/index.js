// deno:file:///home/stagas/work/stagas/webaudio-webcomponents/framework/dom.ts
var { SHOW_DOCUMENT_FRAGMENT, SHOW_ELEMENT, SHOW_TEXT } = NodeFilter;
var whitespaceTagNames = ["PRE", "TEXTAREA"];
var map = new WeakMap();
var trim = (html) => html.trim().replace(/(>)(\s+)|(\s+)(<\/)/g, "$1$4");
function parse(html, context = {}) {
  const el2 = document.createElement("div");
  el2.innerHTML = html;
  const fragment = document.createDocumentFragment();
  while (el2.hasChildNodes())
    fragment.appendChild(el2.firstChild);
  const tree = document.createTreeWalker(fragment, SHOW_DOCUMENT_FRAGMENT | SHOW_ELEMENT | SHOW_TEXT, null, false);
  const root = { tag: "div", attrs: {}, children: [], context };
  while (tree.nextNode()) {
    const node = tree.currentNode;
    const parent = map.get(node.parentNode);
    let v;
    if (node.nodeType === Node.TEXT_NODE) {
      v = context.trim && !whitespaceTagNames.includes(node.parentNode?.tagName) ? trim(node.textContent ?? "") : node.textContent;
    } else {
      v = {
        tag: node.tagName,
        ...attrs(node),
        children: [],
        context
      };
      for (const name in v.events) {
        const fn = new Function("event", "context", `with (context) { ${v.events[name]} }`);
        v.events[name] = function(event) {
          return fn.call(this, event, v.context);
        };
      }
    }
    map.set(node, v);
    if (parent)
      parent.children.push(v);
    else
      root.children.push(v);
  }
  return root;
}
var attrs = (node) => [...node.attributes].reduce((p, n) => (p[["attrs", "events"][+(n.name.indexOf("on") === 0)]][n.name] = n.value, p), { attrs: {}, events: {} });
var update = (node, v, parent, updated = v.updated) => {
  if (!v.tag) {
    return node.data !== v && (parent.updated = true) && (node.data = v);
  }
  for (const name in v.events) {
    node[name] = v.events[name], updated = true;
  }
  for (const name in v.attrs) {
    if (node.getAttribute(name) !== v.attrs[name] && (updated = true)) {
      node.setAttribute(name, v.attrs[name]);
    }
  }
  for (const { name } of [...node.attributes]) {
    if (!(name in v.attrs) && (updated = true)) {
      node.removeAttribute(name);
    }
  }
  return v.updated = updated;
};
var create = (v) => v.tag && (v.rendered = true) ? document.createElement(v.tag) : document.createTextNode(v);
function render(currentNode, v) {
  const prev = currentNode.childNodes;
  const next = v.children;
  while (prev.length > next.length) {
    currentNode.removeChild(currentNode.lastChild);
  }
  for (const [i, child] of next.entries()) {
    let node = prev[i];
    if (!node) {
      currentNode.appendChild(node = create(child));
    } else if (node.tagName !== child.tag) {
      currentNode.replaceChild(node = create(child), prev[i]);
    }
    update(node, child, v);
    if (child.children)
      render(node, child);
  }
  if (v.updated)
    dispatch(currentNode, "onupdate");
  if (v.rendered)
    dispatch(currentNode, "onrender");
}
var dispatch = (node, event, fn = node.tagName && node[event]) => fn && fn.call(node);
function dom(parent, html, context) {
  render(parent, parse(html, context));
}

// deno:file:///home/stagas/work/stagas/webaudio-webcomponents/framework/util.ts
var top = window;
top.__methods__ ??= new Map();
top.__currentObject__ ??= null;
var UID = (key) => {
  return (key ? key + "_" : "") + (Math.random() * 1e7 | 0).toString(36);
};
var patchMethod = (obj, method, key) => {
  const uid = UID(key);
  top.__methods__.set(uid, method.bind(obj));
  method.toString = () => `__methods__.get('${uid}')`;
  return method;
};
var patchMethods = (obj, methods) => {
  for (const [key, method] of Object.entries(methods)) {
    if (typeof method !== "function")
      continue;
    patchMethod(obj, method, key);
  }
  return methods;
};
var bind = (obj) => (parts, ...values) => {
  let str = "";
  for (let i = 0; i < parts.length; i++) {
    str += parts[i];
    const value = values[i];
    if (typeof value === "function") {
      str += patchMethod(obj ?? top.__currentObject__, value).toString();
    } else if (value) {
      str += value;
    }
  }
  return str;
};
var el = (tagName, content) => {
  const uid = UID("x");
  const str = `<${tagName} id="${uid}"></${tagName.split(" ")[0]}>`;
  const obj = top.__currentObject__;
  effect(() => {
    const domEl = obj.get("#" + uid);
    if (domEl) {
      domEl.textContent = content.value;
    }
  }, content);
  return str;
};
var { SHOW_DOCUMENT_FRAGMENT: SHOW_DOCUMENT_FRAGMENT2, SHOW_ELEMENT: SHOW_ELEMENT2, SHOW_TEXT: SHOW_TEXT2 } = NodeFilter;
function* traverse(node) {
  if (node) {
    const tree = document.createTreeWalker(node, SHOW_DOCUMENT_FRAGMENT2 | SHOW_ELEMENT2 | SHOW_TEXT2, null, false);
    while (node = tree.nextNode()) {
      yield node;
    }
  }
}
var flatten = (node) => {
  return [...traverse(node)];
};

// deno:file:///home/stagas/work/stagas/webaudio-webcomponents/framework/state.ts
var Types = {
  array: Array,
  object: Object,
  string: String,
  number: Number,
  boolean: Boolean,
  function: Function
};
var getType = (value) => {
  return Array.isArray(value) ? Types.array : Types[typeof value];
};
var getDefaultValue = (value) => {
  return value === Boolean ? false : value === Array ? [] : value === Function ? () => {
  } : value === String ? "" : null;
};
var castTo = (type, value) => {
  return type === Boolean && value === "" ? true : type === Array ? Array.isArray(value) ? value.slice() : [] : type === Function ? typeof value === "function" ? value : () => {
  } : type(value);
};
var proxies = new WeakMap();
var _unwrap = false;
var _quiet = false;
var quiet = (fn) => {
  const prevQuiet = _quiet;
  _quiet = true;
  try {
    fn();
  } catch (e) {
    console.error(e);
  }
  _quiet = prevQuiet;
};
var state = (desc = {}) => {
  const target = {};
  const types = new Map();
  const props = new Map();
  const resolved = new Set();
  for (const [prop, value] of Object.entries(desc)) {
    if (Object.values(Types).includes(value)) {
      types.set(prop, value);
      target[prop] = getDefaultValue(value);
    } else {
      types.set(prop, getType(value));
      target[prop] = value;
      resolved.add(prop);
    }
    props.set(prop, new Set());
  }
  const proxy = new Proxy(target, {
    get(target2, prop, proxy2) {
      if (_unwrap)
        return Reflect.get(target2, prop);
      else {
        return {
          name: prop,
          proxy: proxy2,
          subscribe(fn) {
            props.get(prop).add(fn);
          },
          unsubscribe(fn) {
            props.get(prop).delete(fn);
          },
          get hasResolved() {
            return resolved.has(prop);
          },
          get value() {
            return this.valueOf();
          },
          [Symbol.toPrimitive]() {
            return this.valueOf();
          },
          valueOf() {
            return Reflect.get(target2, prop);
          }
        };
      }
    },
    set(target2, prop, value) {
      const type = types.get(prop);
      if (!type) {
        throw new ReferenceError("State has no property: " + prop.toString());
      }
      const valueToSet = castTo(type, value);
      if (valueToSet === Reflect.get(target2, prop)) {
        return true;
      }
      const result = Reflect.set(target2, prop, valueToSet);
      if (result) {
        resolved.add(prop);
        props.get(prop).forEach((fn) => triggerIfSatisfied(fn, prop));
      }
      return result;
    },
    ownKeys(target2) {
      return Reflect.ownKeys(target2);
    }
  });
  proxies.set(proxy, { target, props, types, resolved });
  return proxy;
};
var unwrapFactory = (flag) => (fn) => {
  const prevUnwrap = _unwrap;
  _unwrap = flag;
  try {
    fn();
  } catch (e) {
    console.error(e);
  }
  _unwrap = prevUnwrap;
};
var unwrap = unwrapFactory(true);
var wrap = unwrapFactory(false);
var effects = new WeakMap();
var once = new WeakSet();
var triggerIfSatisfied = (fn, _prop) => {
  const deps = [...effects.get(fn)];
  const didUpdate = deps.every((prop) => prop.hasResolved);
  if (didUpdate) {
    top.__currentObject__ = contexts.get(fn);
    unwrap(fn);
    if (once.has(fn)) {
      once.delete(fn);
      deps.forEach((dep) => dep.unsubscribe(fn));
      effects.delete(fn);
    }
  }
};
var contexts = new WeakMap();
var effect = (fn, ...deps) => {
  deps = deps.filter(Boolean);
  contexts.set(fn, top.__currentObject__);
  effects.set(fn, new Set(deps));
  try {
    wrap(() => deps.forEach((dep) => dep.subscribe(fn)));
    triggerIfSatisfied(fn);
  } catch (e) {
    console.trace(deps);
    console.error(e);
  }
  return () => {
    once.delete(fn);
    wrap(() => deps.forEach((dep) => dep.unsubscribe(fn)));
    effects.delete(fn);
  };
};
effect.once = (fn, ...deps) => {
  once.add(fn);
  return effect(fn, ...deps);
};
effect.wrap = (fn, ...deps) => {
  return effect(wrap(fn), ...deps);
};
var callback = (fn, obj) => {
  const callbackFn = (...args) => {
    let result;
    unwrap(() => {
      result = fn(...args);
    });
    return result;
  };
  if (obj) {
    patchMethod(obj, callbackFn);
  }
  return callbackFn;
};
var atomic = (fn) => {
  let next;
  let task;
  let promise;
  const run = async () => {
    if (task)
      await promise;
    task = next;
    next = null;
    if (task) {
      try {
        promise = task.fn(...task.args);
        await promise;
      } catch (e) {
        console.error(e);
      } finally {
        task = null;
      }
    }
    if (next)
      return run();
  };
  return (...args) => {
    const hadNext = next;
    next = { fn, args };
    if (!hadNext) {
      return run();
    } else {
      return promise;
    }
  };
};

// deno:file:///home/stagas/work/stagas/webaudio-webcomponents/framework/index.ts
var ComponentDescriptorProperties = [
  "class",
  "extends",
  "slot",
  "attrs",
  "props",
  "pins",
  "component"
];
var pascalCase = (s) => s.split("-").map((p) => p[0].toLocaleUpperCase() + p.slice(1)).join("");
var mergeFilter = (target, source, fn) => {
  for (const [key, value] of Object.entries(source)) {
    if (fn(key, value))
      target[key] = value;
  }
  return target;
};
var is = (type, item) => typeof item === type;
var isProp = (key) => ComponentDescriptorProperties.includes(key);
var getLocalProperties = (d) => mergeFilter({}, d, (k, v) => !is("function", v) && !isProp(k));
var getPrototypeMethods = (d) => mergeFilter({}, d, (k, v) => is("function", v) && !isProp(k));
var copy = (target, source) => {
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      target[key] = value.slice();
    } else if (typeof value === "object") {
      target[key] = Object.create(value);
    } else {
      target[key] = value;
    }
  }
};
var mergeParams = (target = {}, source = {}) => {
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      target[key] = value.slice();
    } else if (typeof value === "object") {
      target[key] = mergeParams(target[key] || {}, value);
    } else {
      target[key] = value;
    }
  }
  return target;
};
var createAccessors = (target, source = {}, accessors = {}) => {
  for (const key in source) {
    const value = target[key];
    Object.defineProperty(target, key, {
      get() {
        return accessors.get?.call(this, key) ?? Reflect.get(source, key);
      },
      set(value2) {
        accessors.set?.call(this, key, value2);
        return Reflect.set(source, key, value2);
      }
    });
    if (value != null)
      target[key] = value;
  }
};
var Base = class extends HTMLElement {
  constructor({ attrs: attrs2 = {}, props = {}, pins = {} } = {}) {
    super();
    const self = this;
    const ctor = this.constructor;
    const params = mergeParams({ attrs: attrs2, props, pins }, {
      props: { slotted: Array, html: String }
    });
    this.params = params;
    this.state ??= {
      attrs: state(params.attrs),
      props: state(params.props),
      pins: state(Object.fromEntries(Object.keys(params.pins ?? {}).map((key) => [key, Object])))
    };
    createAccessors(this, this.state.props);
    createAccessors(this, this.state.attrs, {
      set(key, value) {
        if (this.getAttribute(key) != value) {
          this.setAttribute(key, value);
          return;
        }
      }
    });
    createAccessors(this, this.state.pins);
    if (ctor.slot)
      this.createSlot();
    effect(() => {
      this.root.innerHTML = this.html;
      for (const [key, selector] of Object.entries(params.pins ?? {})) {
        const el2 = this.get(selector);
        if (el2)
          self[key] = el2;
      }
      const slot = this.root.querySelector("slot");
      if (slot) {
        this.useSlot(slot);
      }
    }, this.html);
  }
  get root() {
    if (!this.shadowRoot)
      this.attachShadow({ mode: "open" });
    return this.shadowRoot;
  }
  render(parts, ...values) {
    dom(this.root, bind(this)(parts, ...values), this);
    for (const [key, selector] of Object.entries(this.params.pins ?? {})) {
      const el2 = this.get(selector);
      if (el2)
        this[key] = el2;
    }
    const slot = this.root.querySelector("slot");
    if (slot) {
      this.useSlot(slot);
    }
  }
  useSlot(slot) {
    const elements = () => slot.assignedElements({ flatten: true }).slice().map((el2) => [el2, flatten(el2)].flat()).flat();
    if (slot.parentNode !== this.root) {
      this.root.appendChild(slot);
    }
    const get = () => {
      const newElements = elements();
      if (newElements.length) {
        this.slotted = newElements;
      }
    };
    get();
    slot.addEventListener("slotchange", get);
  }
  createSlot() {
    const slot = document.createElement("slot");
    this.useSlot(slot);
  }
  get(selector) {
    return this?.shadowRoot?.querySelector?.(selector);
  }
  getSlot(selector) {
    return this?.shadowRoot?.querySelector?.("slot")?.querySelector(selector);
  }
  getAll(selector) {
    return this?.shadowRoot?.querySelectorAll?.(selector);
  }
  getAllSlot(selector) {
    return this?.shadowRoot?.querySelector?.("slot")?.querySelectorAll(selector);
  }
  dispatch(name, payload) {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail: payload }));
  }
  attributeChangedCallback(name, _oldValue, newValue) {
    wrap(() => {
      this[name] = newValue;
    });
  }
};
var create2 = (d) => {
  const { component = () => {
  }, attrs: attrs2 = {}, props = {}, pins = {} } = d;
  const Parent = d.extends ?? Base;
  const className = pascalCase(d.class);
  const Component = {
    [className]: class extends Parent {
      constructor(params) {
        super(mergeParams(params, { attrs: attrs2, props, pins }));
        top.__currentObject__ = this;
        patchMethods(this, getPrototypeMethods(d));
        copy(this, getLocalProperties(d));
        component?.call(this);
      }
    }
  };
  Object.assign(Component[className], { slot: Parent.slot || d.slot, desc: d });
  Object.assign(Component[className].prototype, getPrototypeMethods(d));
  Object.defineProperty(Component[className], "observedAttributes", {
    get() {
      return Object.keys(d.attrs ?? []).concat((Parent ?? {}).observedAttributes || []);
    }
  });
  return Component[className];
};
export {
  Types,
  UID,
  atomic,
  bind,
  callback,
  create2 as create,
  effect,
  el,
  flatten,
  mergeParams,
  patchMethod,
  patchMethods,
  quiet,
  state,
  top,
  traverse,
  unwrap,
  wrap
};
//# sourceMappingURL=index.js.map
