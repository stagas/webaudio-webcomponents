import { create, effect } from './dist/index.js'

const Counter = create({
  class: 'counter',

  attrs: { count: 0 },

  inc() {
    this.count++
  },

  component() {
    effect(() => {
      this.render `
        <style>
          * {
            font-size: 200%;
          }

          span {
            width: 4rem;
            display: inline-block;
            text-align: center;
          }

          button {
            width: 4rem;
            height: 4rem;
            border: none;
            border-radius: 10px;
            background-color: seagreen;
            color: white;
          }
        </style>

        <button onclick="count--">-</button>

        <span onclick="${() => this.count = 42}()">${this.count}</span>

        <button onclick="inc()">+</button>
      `
    }, this.count)
  },
})

customElements.define('x-counter', Counter)

document.body.innerHTML =
  '<x-counter count="42"></x-counter><x-counter count="42"></x-counter><x-counter count="42"></x-counter>'
