import { callback, create, effect } from '../dist/index.js'

export default create({
  class: 'piano',

  attrs: { octaves: 3 },

  props: { notePressed: Number },

  pins: { outer: '#outer', keyboard: '[part=keyboard]' },

  component() {
    effect(() => {
      this.html = `
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
            height: 15vw;
            flex: 10;
            z-index: 1;
            background-color: #CBCBCB;
          }

          .black {
            z-index: 2;
            flex: 5;
            height: 9.2vw;
            background-color: #101010;
          }

          .black {
            margin: 0 -${[4, 2, 1.5, 1][this.octaves - 1]}vw;
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
        </style>

        <div id="outer">
          <div id="keyboard" part="keyboard">
            ${
        Array(12 * this.octaves).fill(0).map((_, i) => {
          const ii = i % 12
          const bw = 'wbwbwwbwbwbw'[ii] === 'b'
          const nt = 'ccddeffggaab'[ii]
          const sh = '-s-s--s-s-s-'[ii] === 's'
          return `<div data-note="${i}" part="${
            bw ? 'piano-black' : 'piano-white'
          }" class="note key ${bw ? 'black' : 'white'} ${nt}">${nt}${
            sh ? '#' : ''
          }</div>`
        }).join('')
      }
          </div>
        </div>
      `
    }, this.octaves)

    effect(() => {
      const resizeObserver = new ResizeObserver(callback(() => {
        this.octaves = Math.round(
          (this.outer.getBoundingClientRect().width / 32) / 12,
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
