# [wip] WebAudio WebComponents

![alt:knobs](./knobs.png)

## Description

This repo is two things:

1. A set of Web Components to create WebAudio graphs plus a set of GUI elements for parameter controlling and automation.
2. A Web Components hook-based reactive component framework (similar to functional React) designed to support the WebAudio components with as little surface as possible, without sacrificing usability.
Examples act as documentation: See [param.js](components/param.js) or [worklet.js](components/worklet.js).

## Usage:

### **Install:**

```sh
deno run -A esbuild.ts

# or

deno run -A esbuild.ts --minify
```

With [onchange](https://npmjs.org/package/onchange):

```sh
npm install onchange -g

onchange -i '**/*.ts' -- deno run -A esbuild.ts
```

### **Testing:**

```sh
npm install mocha-headless -g

mocha-headless

# or

mocha-headless --watch
```

### **Run the development server:**

---
**In VSCode:**

Install extension: [negokaz.live-server-preview](https://marketplace.visualstudio.com/items?itemName=negokaz.live-server-preview)

Open `example.html` then press <kbd>Ctrl</kbd>-<kbd>Shift</kbd>-<kbd>P</kbd> and type: `Show Live Server Preview`

---

Alternatively in the **shell:**

```sh
live-server .
```
Then visit http://localhost:8080/example.html

### MIT / X11
