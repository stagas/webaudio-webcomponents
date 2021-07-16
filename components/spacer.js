import { callback, create, effect } from '../dist/index.js'

const Sum = (p, n) => p + n

export default create({
  class: 'spacer',
  slot: 'shallow',
  attrs: { vertical: false, horizontal: Boolean },
  props: { map: [], orientation: Boolean },
  pins: { spacer: '[part=spacer-wrap]' },
  resizeTo(index, size) {
    const ownSize = this.ownSize()

    const diff = this.map[index] - size

    if (this.map[index + 1] && this.map[index + 1] + diff < 20) {
      return false
    }

    if (this.map[index] > diff + 20) {
      this.map[index] -= diff
      this.map[index + 1] += diff
    }

    const handles = [...this.getAll('[part=spacer-handle]')]

    let sum = 0
    for (const [i, el] of this.slotted.entries()) {
      const size = this.map[i]
      sum += size
      el.style[this.vertical ? 'height' : 'width'] = size / ownSize * 100 + '%'
      if (handles[i]) {
        handles[i].style[this.vertical ? 'top' : 'left'] = sum / ownSize * 100
          + '%'
      }
    }

    return true
  },

  ownSize() {
    return this.getBoundingClientRect()[this.vertical ? 'height' : 'width']
  },

  updateOrientation() {
    this.spacer.classList.add(this.vertical ? 'vertical' : 'horizontal')
    this.spacer.classList.remove(this.vertical ? 'horizontal' : 'vertical')
  },

  handleDown(e, index) {
    const sumRest = this.map.slice(0, index).reduce(Sum, 0)
    let size = sumRest + this.map[index]

    e.preventDefault()
    e.stopPropagation()

    let pos = e[this.vertical ? 'pageY' : 'pageX']

    const moveHandler = callback((e) => {
      const newSize = Math.max(
        20,
        Math.min(
          this.ownSize() - 20,
          size - (pos - e[
            this.vertical
              ? 'pageY'
              : 'pageX'
          ]),
        ),
      )
      if (newSize - sumRest != this.map[index]) {
        if (this.resizeTo(index, newSize - sumRest)) {
          pos = e[this.vertical ? 'pageY' : 'pageX']
          size = newSize
        }
      }
    })

    window.addEventListener('mousemove', moveHandler)

    window.addEventListener(
      'mouseup',
      callback(() => {
        window.removeEventListener('mousemove', moveHandler)
      }),
      { once: true },
    )
  },

  resize() {
    const ownSize = this.ownSize()

    const handles = this.getAll('[part=spacer-handle]')
    let sum = 0
    for (const [i, el] of this.slotted.entries()) {
      const size = this.map[i] = el.getBoundingClientRect()[
        this.vertical
          ? 'height'
          : 'width'
      ]
      sum += size
      if (handles[i]) {
        handles[i].style[this.vertical ? 'top' : 'left'] = sum / ownSize * 100
          + '%'
      }
    }
  },

  component() {
    this.render `
    <style></style>

    <div part="spacer-wrap">
      <slot></slot>
    </div>`

    effect(
      () => {
        if (this.horizontal) {
          this.vertical = false
          this.orientation = true
        }
        this.updateOrientation()
      },
      this.horizontal,
      this.spacer,
    )

    effect(
      () => {
        if (this.vertical) {
          this.horizontal = false
          this.orientation = true
        }
        this.updateOrientation()
      },
      this.vertical,
      this.spacer,
    )

    effect(
      () => {
        this.render `
          <style>
            :host {
              width: 100%;
              height: 100%;
            }

            [part=spacer-wrap] {
              position: relative;
              display: flex;
              width: 100%;
              height: 100%;
            }
            .horizontal[part=spacer-wrap] {
              flex-flow: row nowrap;
            }
            .horizontal[part=spacer-wrap] {
              width: 100%;
            }
            .vertical[part=spacer-wrap] {
              flex-flow: column nowrap;
            }

            [part=spacer-handle] {
              position: absolute;
              left: 0;
              top: 0;
              width: 11px;
              height: 100%;
              background: #000;
              z-index: 1;
            }

            .vertical div[part=spacer-handle] {
              width: 100%;
              height: 11px;
            }
          </style>

          <div part="spacer-wrap" class="${
          this.vertical ? 'vertical' : 'horizontal'
        }">
            <slot></slot>
          ${
          Array(Math.max(0, this.slotted.length - 1)).fill(0).map((_, i) => `
            <div part="spacer-handle" onmousedown="handleDown(event, ${i})"></div>
            `).join('')
        } </div>
        `

        this.resize()

        const resizeObserver = new ResizeObserver((e) => this.resize(e))
        resizeObserver.observe(this.spacer)
      },
      this.orientation,
      this.slotted,
    )
  },
})
