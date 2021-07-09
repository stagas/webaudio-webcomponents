import { create, effect } from '../dist/index.js'

function createBlob(options) {
  var points = []
  var path = options.element
  var slice = (Math.PI * 2) / options.numPoints
  var startAngle = -Math.PI

  for (let i = 0; i < options.numPoints; i++) {
    const angle = startAngle + i * slice

    const point = {
      x: options.centerX
        + Math.cos(angle) * options.radius
        + Math.tanh(
            Math.cos(i * slice) * (i % 2
              ? 1
              : -1),
          ) * 3,
      y: options.centerY
        + Math.sin(angle) * options.radius
        + Math.tanh(Math.sin(i * slice) * (i % 2 ? 1 : -1)) * 3,
    }

    points.push(point)
  }

  options.points = points

  function update() {
    path.setAttribute('d', cardinal(points, true, 2))
  }

  update()
  return options
}

// Cardinal spline - a uniform Catmull-Rom spline with a tension option
function cardinal(data, closed, tension) {
  if (data.length < 1) return 'M0 0'
  if (tension == null) tension = 1

  var size = data.length - (closed ? 0 : 1)
  var path = 'M' + data[0].x + ' ' + data[0].y + ' C'

  for (let i = 0; i < size; i++) {
    let p0, p1, p2, p3

    if (closed) {
      p0 = data[(i - 1 + size) % size]
      p1 = data[i]
      p2 = data[(i + 1) % size]
      p3 = data[(i + 2) % size]
    }
    else {
      p0 = i == 0 ? data[0] : data[i - 1]
      p1 = data[i]
      p2 = data[i + 1]
      p3 = i == size - 1 ? p2 : data[i + 2]
    }

    const x1 = p1.x + ((p2.x - p0.x) / 6) * tension
    const y1 = p1.y + ((p2.y - p0.y) / 6) * tension

    const x2 = p2.x - ((p3.x - p1.x) / 6) * tension
    const y2 = p2.y - ((p3.y - p1.y) / 6) * tension

    path += ' ' + x1 + ' ' + y1 + ' ' + x2 + ' ' + y2 + ' ' + p2.x + ' ' + p2.y
  }

  return closed ? path + 'z' : path
}

export default create({
  class: 'knob',

  attrs: {
    shape: 'hexagon',
    size: 60,
    name: String,
    value: Number,
    symmetric: false,
  },
  props: {},

  pins: {
    rays: '#rays',
    raypath: '#raypath',
    raylightpath: '#raylightpath',
    knob: '#knob',
    path: '#path',
  },

  component() {
    effect.once(
      () => {
        this.html = `
        <style>
          #knob {
            position: absolute;
          }
          #rays {
            position: absolute;
            width: ${this.size}px;
            height: ${this.size}px;
          }
          #raypath {
            fill: #fff;
            stroke: #fff;
          }
          #raylightpath {
            fill: #666;
            stroke: #666;
          }
          #path {
            fill: #fff;
            stroke: #fff;
          }
          #outer {
            position: relative;
            display: inline-flex;
            width: ${this.size}px;
            height: 75px;
            align-items: center;
            justify-content: center;
          }
          #indicator {
            fill: #fff;
            stroke: #fff;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
        </style>

        <div id="outer">
          <svg id="rays" viewBox="0 0 100 100">
            <path id="raypath" part="knob-rays"></path>
            <path id="raylightpath" part="knob-rays-lights"></path>
          </svg>
          <svg id="knob" viewBox="0 0 100 100">
            <path id="path" part="knob-svg-path"></path>
            <path id="indicator" part="knob-svg-indicator" d="M 21 50 L 19 50 z"></path>
          </svg>
          <div id="circle" part="knob-circle"></div>
        </div>
      `
      },
      this.size,
      this.value,
    )

    effect(
      () => {
        const shapes = {
          hexagon: {
            numPoints: 6,
            centerX: 50,
            centerY: 50,
            radius: 30,
            minRange: 30,
            maxRange: 120,
            minRays: 62,
            maxRays: 57,
          },
          octagon: {
            numPoints: 8,
            centerX: 50,
            centerY: 50,
            radius: 30,
            minRange: 45,
            maxRange: 90,
            minRays: 42,
            maxRays: 42,
          },
          decagon: {
            numPoints: 10,
            centerX: 50,
            centerY: 50,
            radius: 30,
            minRange: 55,
            maxRange: 70,
            minRays: 34,
            maxRays: 33,
          },
          dodecagon: {
            numPoints: 12,
            centerX: 50,
            centerY: 50,
            radius: 30,
            minRange: 60,
            maxRange: 60,
            minRays: 30,
            maxRays: 30,
          },
        }

        const shape = shapes[this.shape]

        createBlob({ element: this.path, ...shapes[this.shape] })

        const normalValue = this.value / 127

        this.knob.style.transform = `rotate(${-shape.minRange
          + normalValue * (360 - shape.maxRange)}deg)`

        const numOfRays = 64

        const draw = (shape, fn) => {
          const parts = ['M 50 50']
          const gap = (shape.minRays * (Math.PI / 180))
          const rangeEnd = (shape.maxRays * Math.PI / 180)
          const circle = (Math.PI * 2 - gap) - rangeEnd
          const rangeBegin = circle + rangeEnd
          for (
            let i = rangeBegin;
            i >= rangeBegin - circle;
            i -= (2 * Math.PI / numOfRays)
          ) {
            if (fn(i, rangeBegin, circle)) {
              const x = Math.sin(i) * 38
              const y = Math.cos(i) * 38
              parts.push(`M ${50 + Math.sin(i) * 30} ${50 + Math.cos(i) * 30}`)
              parts.push('L ' + (50 + x) + ' ' + (50 + y))
            }
          }
          parts.push('z')
          return parts
        }

        const { symmetric } = this

        this.raypath.setAttribute(
          'd',
          draw(shape, (i, rangeBegin, circle) => {
            const amount = rangeBegin - circle * normalValue
            const half = rangeBegin - circle / 2
            return symmetric
              ? normalValue < 0.5
                ? i < amount && i > half
                : i > amount && i < half
              : normalValue <= 0.01
              ? false
              : i > amount
          }).join(' '),
        )

        this.raylightpath.setAttribute(
          'd',
          draw(shape, (i, rangeBegin, circle) => {
            const amount = rangeBegin - circle * normalValue
            const half = rangeBegin - circle / 2
            return !(symmetric
              ? normalValue <= 0.5
                ? i < amount && i > half
                : i > amount && i < half
              : normalValue <= 0.01
              ? false
              : i > amount)
          }).join(' '),
        )
      },
      this.rays,
      this.raypath,
      this.raylightpath,
      this.knob,
      this.path,
      this.shape,
      this.value,
    )
  },
})
