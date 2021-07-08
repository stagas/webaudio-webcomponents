import { callback, create, effect } from '../dist/index.js'

export default create({
  class: 'piano',

  attrs: { halfOctaves: 4 },

  props: { notePressed: Number },

  pins: { outer: '#outer', keyboard: '[part=keyboard]' },

  component() {
    effect(() => {
      this.render `
        <style>
          :host {
            --pressed-white: #e44;
            --pressed-black: #e44;
          }

          #outer {
            user-select: none;
            height: 100%;
            width: 100%;
            display: inline-flex;
            margin: auto;
            justify-content: center;
            align-items: center;
          }

          .key {
            box-sizing: border-box;
            float: left;
            position: relative;
            color: #999;
            display: flex;
            flex-flow: row nowrap;
            flex: 1;
            align-items:flex-end;
            white-space: nowrap;
            text-transform: uppercase;
            font-family: sans-serif;
            font-size: 6pt;
            padding: 3px;
          }

          .white {
            height: calc(8vh + 7vw);
            flex: 10;
            z-index: 1;
            background-color: #CBCBCB;
          }

          .black {
            z-index: 2;
            flex: 5;
            height: calc(5.5vw + 4vh);
            background-color: #101010;
          }

          .black {
            margin: 0 -${[10, 4, 3, 2, 2][this.halfOctaves - 1] || 1.3}vw;
          }

          .pressed.white {
            background: var(--pressed-white) !important;
          }

          .pressed.black {
            background: var(--pressed-black) !important;
          }

          #keyboard {
            display: flex;
            flex-flow: row nowrap;
            flex: 1;
          }
          #keyboard .key:last-child {
            border-right: none !important;
          }
        </style>

        <div id="outer">
          <div id="keyboard" part="keyboard">
            ${
        Array(
          6 * this.halfOctaves + (this.halfOctaves % 2 === 0
            ? 1
            : this.halfOctaves % 1 === 0
            ? -1
            : 1),
        ).fill(0).map((_, i) => {
          const ii = i % 12
          const bw = 'wbwbwwbwbwbw'[ii] === 'b'
          const nt = 'ccddeffggaab'[ii]
          const sh = '-s-s--s-s-s-'[ii] === 's'
          return `<div data-note="${i}" part="${
            bw
              ? 'piano-black'
              : 'piano-white'
          }" class="note key ${bw ? 'black' : 'white'} ${nt}">${nt}${
            sh ? '#' : ''
          }</div>`
        }).join('')
      }
          </div>
        </div>
      `
    }, this.halfOctaves)

    effect(() => {
      const resizeObserver = new ResizeObserver(callback(() => {
        this.halfOctaves = Math.round(
          (this.outer.getBoundingClientRect().width / 28) / 6,
        )
      }))
      resizeObserver.observe(this.outer)
    }, this.outer)

    effect(() => {
      this.keyboard.addEventListener(
        'mousedown',
        callback((e) => {
          e.preventDefault()
          e.stopPropagation()

          const onmousemove = callback((e) => {
            const note = e.target.dataset.note
            if (note) {
              try {
                this.get(`[data-note="${this.notePressed}"]`).classList.remove(
                  'pressed',
                )
              }
              catch {
                //
              }
              this.notePressed = note
              e.target.classList.add('pressed')
            }
          })

          const onmouseup = callback((e) => {
            try {
              this.get(`[data-note="${this.notePressed}"]`).classList.remove(
                'pressed',
              )
            }
            catch {
              //
            }
            this.keyboard.removeEventListener('mousemove', onmousemove)
          })

          this.keyboard.addEventListener('mousemove', onmousemove)
          window.addEventListener('mouseup', onmouseup, { once: true })

          onmousemove(e)
        }),
      )
    }, this.keyboard)

    effect(() => {
    }, this.notePressed)
  },
})
