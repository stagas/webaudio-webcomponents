import { callback, create, effect } from '../dist/index.js'

export default create({
  class: 'param',

  slot: true,

  attrs: {
    name: String,
    value: Number,
    min: Number,
    max: Number,
    steps: 128,
    slope: 1,
    f32: false,
    precision: 3,
    group: '',
    symmetric: false,
  },
  props: {
    rangeIndex: 0,
    getValueIndex: Function,
    stepValues: Array,
    moveStep: Function,
    scale: Function,
    normalize: Function,
    applyPrecision: Function,
    mouseDown: false,
    startY: Number,
    startIndex: Number,
  },

  pins: { input: 'input[type=number]', range: 'input[type=range]' },

  didKeyDown: false,

  component() {
    effect(
      () => {
        this.render `
          <style>
            [part="param-number"] {
              box-sizing: border-box;
              padding: 3px;
              margin: 0;
            }
          </style>
          <slot></slot>
          <input part="param-number" type="number" role="slider" style="width:${Math
          .max(this.min.toFixed(1).length, this.max.toFixed(1).length) + 3}ch">
          <input part="param-range" type="range" role="slider" min="0" max="127" step="1">
          <div part="param-name">${
          this.group ? this.name.replace(this.group + ' ', '') : this.name
        }</div>
        `
      },
      this.rangeIndex,
      this.name,
      this.group,
      this.value,
      this.min,
      this.max,
    )

    effect(
      () => {
        this.input.step = 1 / (10 ** this.precision || 1)
      },
      this.input,
      this.precision,
    )

    effect(
      () => {
        this.applyPrecision = callback((value) => {
          value = Number(value)
          if (this.f32) value = Math.fround(value)
          if (this.precision != null) value = +value.toFixed(this.precision)
          return value
        })
      },
      this.f32,
      this.precision,
    )

    effect(
      () => {
        this.value = Math.min(this.max, Math.max(this.min, this.value))
        if (!this.didKeyDown) {
          this.input.value = this.value
          const index = this.getValueIndex(this.value)
          if (index != this.rangeIndex) {
            this.rangeIndex = index
          }
          this.dispatchEvent(new Event('input', { bubbles: true }))
        }
      },
      this.input,
      this.range,
      this.min,
      this.max,
      this.value,
      this.getValueIndex,
      this.applyPrecision,
    )

    effect(
      () => {
        this.scale = callback((value) => {
          const { min, max, slope, symmetric } = this
          const scale = max - min

          value = value ?? this.value

          value = symmetric
            ? value < 0.5
              ? Math.pow(value * 2, slope) * 0.5
              : 1 - Math.pow(1 - (value - 0.5) * 2, slope) * 0.5
            : Math.pow(value, 1 / slope)

          return value * scale + min
        })
      },
      this.min,
      this.max,
      this.slope,
      this.symmetric,
    )

    effect(
      () => {
        this.normalize = callback((value) => {
          const { min, max, slope, symmetric } = this
          const scale = max - min

          value = value ?? this.value
          value = (value - min) / scale

          value = symmetric
            ? value < 0.5
              ? Math.pow(value * 2, 1 / slope) * 0.5
              : 1 - Math.pow(1 - (value - 0.5) * 2, 1 / slope) * 0.5
            : Math.pow(value, slope)

          return value
        })
      },
      this.min,
      this.max,
      this.slope,
      this.symmetric,
    )

    effect(
      () => {
        this.stepValues = Array(this.steps).fill(0).map((_, i) => {
          let value = this.scale(i / (this.steps - 1))
          value = this.applyPrecision(value)
          return value
        })
      },
      this.steps,
      this.scale,
      this.applyPrecision,
    )

    effect(() => {
      this.getValueIndex = callback((value) => {
        return this.stepValues.findIndex((x) => x >= value)
      })
    }, this.stepValues)

    effect(
      () => {
        this.moveStep = callback((dir) => {
          if (dir === 0) return
          const value = this.value
          let index = this.getValueIndex(value) + dir
          while (
            index > 0
            && index < this.stepValues.length - 1
            && this.stepValues[index] === value
          ) {
            index += dir
          }
          index = Math.min(this.stepValues.length - 1, Math.max(0, index))
          this.rangeIndex = index
          this.value = this.stepValues[index]
        })
      },
      this.stepValues,
      this.getValueIndex,
    )

    effect(
      () => {
        this.input.onkeydown = callback((e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Tab') {
            return
          }
          if (e.key === 'Enter') {
            this.value = this.applyPrecision(this.input.value)
            this.input.value = this.value
            this.rangeIndex = this.getValueIndex(this.value)
            this.input.onblur()
          }
          else {
            this.didKeyDown = true
          }
        })
      },
      this.input,
      this.applyPrecision,
    )

    effect(() => {
      this.input.onkeyup = () => {
        this.didKeyDown = false
      }
    }, this.input)

    effect(
      () => {
        this.input.oninput = callback((e) => {
          if (this.didKeyDown) {
            e.stopPropagation()
            e.preventDefault()
            this.value = this.input.value || 0
            this.didKeyDown = false
            return
          }

          const value = +this.value
          if (value > Number(this.input.value)) {
            this.moveStep(-1)
          }
          else if (value < Number(this.input.value)) {
            this.moveStep(+1)
          }
        })
      },
      this.input,
      this.moveStep,
    )

    effect(
      () => {
        this.input.onblur = callback(() => {
          this.value = this.applyPrecision(this.input.value)
          this.input.value = this.value
          this.dispatchEvent(new Event('input', { bubbles: true }))
        })
      },
      this.input,
      this.applyPrecision,
    )

    effect(
      () => {
        this.range.oninput = callback(() => {
          this.value = this.stepValues[+this.range.value]
          this.input.value = this.value
        })
      },
      this.range,
      this.stepValues,
    )

    effect(
      () => {
        const onwheel = callback((e) => {
          e.preventDefault()
          this.moveStep(Math.round(e.deltaY * 0.06))
        })
        this.addEventListener('wheel', onwheel, { passive: false })
      },
      this.input,
      this.range,
      this.moveStep,
    )

    effect(() => {
      this.input.addEventListener('mousedown', (e) => {
        e.stopPropagation()
      }, { capture: true })
      this.input.addEventListener('touchstart', (e) => {
        e.stopPropagation()
      }, { capture: true })
    }, this.input)

    effect(
      () => {
        const onmousedown = callback((e) => {
          if (!this.mouseDown) {
            e.preventDefault()
            e.stopPropagation()
            this.startY = e.clientY
            this.startIndex = this.rangeIndex
            this.mouseDown = true

            const onmousemove = callback((e) => {
              e.preventDefault()
              e.stopPropagation()
              const y = this.startY - e.clientY
              this.value =
                this
                  .stepValues[
                    Math.max(
                      0,
                      Math.min(
                        this.stepValues.length - 1,
                        this.startIndex + (y * (100 / this.steps)) | 0,
                      ),
                    )
                  ]
            })

            const onmouseup = callback(e => {
              e.preventDefault()
              e.stopPropagation()
              this.mouseDown = false
              window.removeEventListener('mousemove', onmousemove, {
                capture: true,
              })
            })

            window.addEventListener('mouseup', onmouseup, { once: true })
            window.addEventListener('mousemove', onmousemove, { capture: true })
          }
        })
        const ontouchmove = callback((e) => {
          e.preventDefault()
          e.stopPropagation()
          const y = this.startY - e.touches[0].clientY
          this.value =
            this
              .stepValues[
                Math.max(
                  0,
                  Math.min(
                    this.stepValues.length - 1,
                    this.startIndex + (y * (100 / this.steps)) | 0,
                  ),
                )
              ]
        })
        const ontouchstart = callback((e) => {
          if (!this.mouseDown) {
            e.preventDefault()
            e.stopPropagation()
            this.startY = e.touches[0].clientY
            this.startIndex = this.rangeIndex
            this.mouseDown = true

            window.addEventListener('touchmove', ontouchmove, {
              passive: false,
            })

            window.addEventListener('touchend', () => {
              this.mouseDown = false
              window.removeEventListener('touchmove', ontouchmove)
            }, { once: true })

            ontouchmove(e)
          }
        })
        this.addEventListener('touchstart', ontouchstart, { passive: false })
        this.addEventListener('mousedown', onmousedown)
      },
      this.input,
      this.range,
      this.moveStep,
    )

    effect(
      () => {
        this.range.value = this.rangeIndex
        this.slotted.forEach(el => {
          if (el) {
            if ('name' in el) {
              el.min = 0
              el.max = 127
              el.value = this.rangeIndex
            }
          }
        })
      },
      this.slotted,
      this.min,
      this.max,
      this.range,
      this.rangeIndex,
    )

    effect.once(
      () => {
        this.rangeIndex = this.getValueIndex(this.value)
      },
      this.value,
      this.stepValues,
      this.getValueIndex,
    )
  },
})
