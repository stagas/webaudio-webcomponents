import { create, effect } from '../dist/index.js'

const toRadians = angleInDegrees => (angleInDegrees - 90) * Math.PI / 180.0
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  var angleInRadians = toRadians(angleInDegrees)

  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians)),
  }
}

function describeArc(x, y, radius, startAngle, endAngle) {
  var start = polarToCartesian(x, y, radius, endAngle)
  var end = polarToCartesian(x, y, radius, startAngle)

  var largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  var d = [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(' ')

  return d
}

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
    kind: String,
  },

  props: { strokeDasharray: '', strokeDashoffset: '' },

  pins: {
    knobTrackCircle: '#knobtrackcircle',
    knobTrackPath: '#knobtrackpath',
    knobTrackFill: '#knobtrackfill',
    knobIndicator: '#knobindicator',
    knobRays: '#knobrays',
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
          }

          #knobtrackcircle {
            fill: var(--black);
          }

          #knobindicator {
            stroke: var(--white);
            stroke-width: 3.5px;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          #knobtrackpath {
            fill: none;
            stroke: var(--grey);
            stroke-width: 3.5px;
          }

          #knobtrackfill {
            fill: none;
            stroke: var(--white);
            stroke-width: 3px;
          }

          #knobrays {
            stroke: var(--grey);
          }

          #raypath {
            fill: #fff;
            stroke: #fff;
            stroke-width: 2px;
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
            box-sizing: border-box;
            position: relative;
            display: flex;
            width: ${this.size}px;
            height: 120px;
            margin-top: -20px;
            margin-bottom: -25px;
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
          ${
          this.kind === 'soft'
            ? `
          <svg id="knobtrack" viewBox="0 0 100 100">
            <circle id="knobtrackcircle" cx="50" cy="50" />
            <path id="knobtrackpath" />
            <path id="knobtrackfill" />
            <path id="knobrays" />
            <path id="knobindicator" />
          </svg>
          <div id="circle" part="knob-circle"></div>
          `
            : `
          <svg id="rays" viewBox="0 0 100 100">
            <path id="raypath" part="knob-rays"></path>
            <path id="raylightpath" part="knob-rays-lights"></path>
          </svg>
          <svg id="knob" viewBox="0 0 100 100">
            <path id="path" part="knob-svg-path"></path>
            <path id="indicator" part="knob-svg-indicator" d="M 21 50 L 19 50 z"></path>
          </svg>
          <div id="circle" part="knob-circle"></div>
          `
        }
        </div>
      `
      },
      this.size,
      this.value,
    )

    effect(
      () => {
        const symmetricGap = 4

        if (this.kind === 'soft') {
          const r = 30
          const normal = this.value / 127

          const gap = 110
          const start = gap * 2
          const end = 500
          const circle = end - start

          this.knobTrackCircle.setAttribute('r', r)
          if (this.symmetric) {
            if (normal >= 0.5) {
              const sc = Math.max(
                start + circle / 2 + symmetricGap,
                start + circle / 2 + ((circle / 2) - 10) * (normal - 0.5) * 2,
              )
              const ec = end

              this.knobTrackPath.setAttribute(
                'd',
                describeArc(
                  50,
                  50,
                  30,
                  start,
                  start + circle / 2 - symmetricGap,
                ) + ' ' + describeArc(50, 50, 30, sc, ec),
              )
            }
            else {
              const sc = start
              // Math.min(
              //   start - 10,
              //   start + circle / 2 + ((circle / 2) - 10) * (normal - 0.5) * 2,
              // )
              const ec = Math.min(
                start + circle / 2 - symmetricGap,
                start + circle / 2 - (circle / 2) * (0.5 - normal) * 2,
              )

              this.knobTrackPath.setAttribute(
                'd',
                describeArc(50, 50, 30, start + circle / 2 + symmetricGap, end)
                  + ' '
                  + describeArc(50, 50, 30, sc, ec),
              )
            }
          }
          else {
            this.knobTrackPath.setAttribute(
              'd',
              describeArc(50, 50, 30, start + circle * normal, end),
            )
          }

          const rot = toRadians(normal * circle + start)
          const indBegin = 17
          const indSize = 5
          const indStart = {
            x: 50 + Math.cos(rot) * indBegin,
            y: 50 + Math.sin(rot) * indBegin,
          }
          if (indSize === 1) {
            this.knobIndicator.setAttribute(
              'd',
              `M ${indStart.x} ${indStart.y} L ${indStart.x} ${indStart.y}`,
            )
          }
          else {
            this.knobIndicator.setAttribute(
              'd',
              `M ${indStart.x} ${indStart.y} L ${indStart.x
                + Math.cos(rot) * indSize} ${indStart.y
                + Math.sin(rot) * indSize}`,
            )
          }

          if (normal >= 0) {
            if (this.symmetric) {
              if (normal >= 0.5) {
                const sc = start + circle / 2 + symmetricGap
                const ec = start + circle / 2
                  + ((circle / 2)) * (normal - 0.5) * 2
                this.knobTrackFill.setAttribute(
                  'd',
                  (ec - sc) > 0 ? describeArc(50, 50, 30, sc, ec) : '',
                )
              }
              else {
                const sc = start + circle / 2
                  - ((circle - symmetricGap) / 2) * (0.5 - normal) * 2
                const ec = start + circle / 2 - symmetricGap
                this.knobTrackFill.setAttribute(
                  'd',
                  (ec - sc) > 0 ? describeArc(50, 50, 30, sc, ec) : '',
                )
              }
            }
            else {
              this.knobTrackFill.setAttribute(
                'd',
                describeArc(50, 50, 30, start, start + circle * normal),
              )
            }
          }
          else {
            this.knobTrackFill.setAttribute('d', '')
          }

          {
            // TODO: only need to draw once then only rotate
            const parts = ['M 50 50']
            for (let i = 0; i < Math.PI * 2; i += Math.PI / 8) {
              parts.push(
                `M 50 50 L ${50 + Math.cos(i) * 24} ${50 + Math.sin(i) * 24}`,
              )
            }
            this.knobRays.setAttribute('d', parts.join(' '))
            this.knobRays.style.transformOrigin = '50% 50%'
            this.knobRays.style.transform = `rotate(${normal * circle
              + start}deg)`
          }
          // TODO: symmetric
        }
        else {
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

          const numOfRays = 52

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
                parts.push(
                  `M ${50 + Math.sin(i) * 30} ${50 + Math.cos(i) * 30}`,
                )
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
        }
      },
      this.rays,
      this.raypath,
      this.raylightpath,
      this.knob,
      this.path,
      this.type,
      this.shape,
      this.value,
    )
  },
})
