import { create, effect } from '../dist/index.js'

export default create({
  class: 'fader',

  attrs: {
    size: 300,
    name: String,
    value: Number,
    min: Number,
    max: Number,
    lines: 10,
    symmetric: false,
  },
  props: {},

  pins: {
    faderTrack: '[part=fader-track]',
    faderTrackFill: '[part=fader-track-fill]',
    faderTip: '[part=fader-tip]',
    faderLines: '[part=fader-lines]',
    faderLinesFill: '[part=fader-lines-fill]',
  },

  component() {
    effect.once(
      () => {
        this.html = `
        <style>
          [part=fader-outer] {
            position: relative;
            width: 100%;
            height: 100%;
          }
          [part=fader-svg] {
            width: 100%;
            height: 100%;
          }
          #outer {
            position: relative;
          }
          [part=fader-track] {
            fill: #888;
            stroke: #888;
          }
          [part=fader-track-fill] {
            fill: #fff;
            stroke: #fff;
          }
          [part=fader-lines] {
            fill: #888;
            stroke: #888;
          }
          [part=fader-lines-fill] {
            fill: #fff;
            stroke: #fff;
          }
          [part=fader-tip] {
            box-sizing: border-box;
            position: absolute;
            width: 100%;
            left: 0;
            height: 10px;
            background: #000;
            fill: #000;
            stroke: #000;
          }
        </style>

        <div id="outer" part="fader-outer">
          <svg id="fader" part="fader-svg" preserveAspectRatio="none" viewBox="0 0 80 ${this.size}">
            <path part="fader-track"></path>
            <path part="fader-track-fill"></path>
            <path part="fader-lines"></path>
            <path part="fader-lines-fill"></path>
          </svg>
          <div id="fadertip" part="fader-tip"></div>
        </div>
      `
      },
      this.size,
      this.value,
    )

    effect(
      () => {
        const normal = this.value / 127

        {
          if (this.symmetric) {
            if (normal < 0.5) {
              const top = 10 + Math.max(0, (this.size - 20) * (1 - normal))
              this.faderTrack.setAttribute(
                'd',
                `M 40 10 L 40 ${top} M 40 50.5 L 40 ${this.size - 10} z`,
              )
              this.faderTrackFill.setAttribute('d', `M 40 50 L 40 ${top} z`)
            }
            else {
              const top = 10 + Math.max(0, (this.size - 20) * (1 - normal))
              this.faderTrack.setAttribute(
                'd',
                `M 40 10 L 40 ${top} M 40 50.5 L 40 ${this.size - 10} z`,
              )
              this.faderTrackFill.setAttribute('d', `M 40 ${top} L 40 50.5 z`)
            }
          }
          else {
            const top = 10 + Math.max(0, (this.size - 20) * (1 - normal))
            this.faderTrack.setAttribute('d', `M 40 10 L 40 ${top} z`)
            this.faderTrackFill.setAttribute(
              'd',
              `M 40 ${top} L 40 ${this.size - 10} z`,
            )
          }
        }

        {
          const p = []
          const b = []
          const n = this.lines
          const one = (this.size - 34) / n
          for (let i = 0; i <= n; i++) {
            const h = 14 + one / 2 + i * one
            if (
              !this.symmetric
                ? (i < n * (1 - normal) || normal === 0)
                : normal < 0.5
                ? i < n * 0.5 || i > n * (1 - normal)
                : i > n * 0.5 || i < n * (1 - normal)
            ) {
              p.push(`M 30 ${h} L ${i % 5 ? 20 : 10} ${h}`)
            }
            else {
              b.push(`M 30 ${h} L ${i % 5 ? 20 : 10} ${h}`)
            }
          }
          this.faderLines.setAttribute(
            'd',
            (p.length ? p.join(' ') + ' z' : ''),
          )
          this.faderLinesFill.setAttribute(
            'd',
            (b.length ? b.join(' ') + ' z' : ''),
          )
        }

        {
          const h = 4 + (1 - normal) * (this.size - 20)
          this.faderTip.style.top = (h * 0.8) + 'px'
          // this.faderTip.setAttribute(
          //   'd',
          //   `M 12 ${h} L 68 ${h} L 70 ${h + 10} L 10 ${h + 10} z`,
          // )
        }
      },
      this.faderTrack,
      this.faderTrackFill,
      this.faderTip,
      this.faderLines,
      this.faderLinesFill,
      this.lines,
      this.value,
      this.min,
      this.max,
    )
  },
})
