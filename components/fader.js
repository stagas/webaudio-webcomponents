import { create, effect } from '../dist/index.js'

export default create({
  class: 'fader',

  attrs: {
    size: 300,
    name: String,
    value: Number,
    min: Number,
    max: Number,
    symmetric: false,
  },
  props: {},

  pins: {
    faderTrack: '[part=fader-track]',
    faderTip: '[part=fader-tip]',
    faderLines: '[part=fader-lines]',
  },

  component() {
    effect.once(
      () => {
        this.html = `
        <style>
          [part=fader-outer] {
            width: 80px;
            height: 200px;
          }
          [part=fader-svg] {
            width: 80px;
            height: 100%;
          }
          #outer {
            position: relative;
          }
          [part=fader-track] {
            fill: #fff;
            stroke: #fff;
          }
          [part=fader-lines] {
            fill: #fff;
            stroke: #fff;
          }
          [part=fader-tip] {
            fill: #000;
            stroke: #000;
          }
        </style>

        <div id="outer" part="fader-outer">
          <svg id="fader" part="fader-svg" preserveAspectRatio="none" viewBox="0 0 80 ${this.size}">
            <path part="fader-track"></path>
            <path part="fader-lines"></path>
            <path part="fader-tip"></path>
          </svg>
        </div>
      `
      },
      this.size,
      this.value,
    )

    effect(
      () => {
        const normalValue = this.value / 127

        {
          this.faderTrack.setAttribute('d', `M 40 10 L 40 ${this.size - 10} z`)
        }

        {
          const p = []
          const n = 30
          const one = (this.size - 30) / n
          for (let i = 0; i <= n; i++) {
            const h = 10 + one / 2 + i * one
            p.push(`M 30 ${h} L ${i % 5 ? 20 : 10} ${h}`)
          }
          this.faderLines.setAttribute('d', p.join(' ') + 'z')
        }

        {
          const h = (1 - normalValue) * (this.size - 20)
          this.faderTip.setAttribute(
            'd',
            `M 10 ${h} L 70 ${h} L 70 ${h + 20} L 10 ${h + 20} z`,
          )
        }
      },
      this.faderTrack,
      this.faderTip,
      this.faderLines,
      this.value,
      this.min,
      this.max,
    )
  },
})
