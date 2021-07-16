import {
  bind,
  callback,
  create,
  dom,
  effect,
  getRelativeMouseCoords,
} from '../dist/index.js'

const midiMessageEvent = new MIDIMessageEvent('midimessage', {
  data: new Uint8Array([0, 0, 0]),
})

const styles = (obj) => {
  return Object.entries(obj).map(([key, value]) => `${key}:${value}`).join(';')
}

const eid = () => (Math.random() * 10e6 | 0).toString(36)

const MouseAction = { None: 0x0, Add: 0x1, Delete: 0x2, Move: 0x3, Resize: 0x4 }

export default create({
  class: 'pianoroll',

  attrs: { octaves: 5, steps: 32, startoctave: 3, height: 800, duration: 2 },

  props: {
    events: Array,
    eventFocused: Object,
    mouseAction: MouseAction.None,
    lastEventLength: 2,
    timelineStartTime: -2,
    timelineAnimation: Object,
    grabStepOffset: 0,
  },

  pins: {
    keys: '#keys',
    pianoroll: '#pianoroll',
    outer: '#outer',
    grid: '.grid',
    gridEvents: '.grid-events',
    gridTimeline: '#gridtimeline',
    timelineIndicator: '#timelineindicator',
    horizontal: '#horizontal',
  },

  noteToRow(note) {
    return this.octaves * 12 - (note - this.startoctave * 12)
  },

  addNote(row, step, length) {
    const event = {
      id: eid(),
      note: this.octaves * 12 - (row - this.startoctave * 12),
      step,
      length: length ?? this.lastEventLength,
    }
    this.lastEventLength = event.length
    this.events = [...this.events, event]
    this.dispatch('noteadd', event)
    return event
  },

  deleteEventById(id) {
    if (this.events.find) {
      const event = this.events.find(ev => ev.id === id)
      if (event) {
        this.lastEventLength = event.length
        this.events.splice(this.events.indexOf(event), 1)
        // value.splice(index, 1)[0]
        this.dispatch('notedelete', event)
        const el = this.get(`.event-note[key="${event.id}"]`)
        el.parentNode.removeChild(el)
      }
    }
  },

  gridStepDown(e, row, step) {
    if (e.button === 2) {
      this.mouseAction = MouseAction.Delete
    }
    else if (e.button === 0) {
      this.mouseAction = MouseAction.Add
      this.gridStepEnter(e, row, step)
    }
    else {
      return
    }
    window.addEventListener('mouseup', () => {
      this.mouseAction = MouseAction.None
    }, { once: true })
  },

  gridStepEnter(e, row, step) {
    if (this.mouseAction === MouseAction.Add) {
      this.addNote(row, step)
    }
    else if (this.mouseAction === MouseAction.Move) {
      if (this.eventFocused) {
        this.deleteEventById(this.eventFocused.id)
        this.eventFocused = this.addNote(
          row,
          step - this.grabStepOffset,
          this.eventFocused.length,
        )
      }
    }
    else if (this.mouseAction === MouseAction.Resize) {
      // this.eventFocused = this.resizeEventToStep(this.eventFocused, step + 1)

      // const newLength = Math.max(1, step - this.eventFocused.step)
      // if (newLength !== this.eventFocused.length) {
      //   this.deleteEventById(this.eventFocused.id)
      //   this.eventFocused = this.addNote(row, this.eventFocused.step, newLength)
      // }
    }
    else if (this.mouseAction === MouseAction.Delete) {
      //
    }
  },

  gridStepMove(e, row, step) {
    if (this.mouseAction === MouseAction.Resize) {
      if (e.offsetX > this.stepWidth() * 0.5) {
        this.eventFocused = this.resizeEventToStep(this.eventFocused, step + 1)
      }
    }
  },

  resizeEventToStep(event, step) {
    const newLength = Math.max(1, step - event.step)
    if (newLength !== event.length) {
      this.deleteEventById(event.id)
      return this.addNote(this.noteToRow(event.note), event.step, newLength)
    }
    return event
  },

  stepWidth() {
    return 1 / this.steps * this.horizontal.getBoundingClientRect().width
  },

  eventDown(e, eventId) {
    e.preventDefault()
    e.stopPropagation()
    if (e.button === 2) {
      this.mouseAction = MouseAction.Delete
      this.deleteEventById(eventId)
    }
    else if (e.button === 0) {
      const step = Math.floor(e.offsetX / this.stepWidth())
      this.grabStepOffset = step
      this.mouseAction = MouseAction.Move
      this.eventFocused = this.events.find(ev => ev.id == eventId)
      this.lastEventLength = this.eventFocused.length
    }
    else {
      return
    }
    window.addEventListener('mouseup', () => {
      this.mouseAction = MouseAction.None
    }, { once: true })
  },

  eventEnter(e, eventId) {
    if (this.mouseAction == MouseAction.Delete) {
      this.deleteEventById(eventId)
    }
  },

  resizeDown(e, eventId) {
    if (e.button === 0) {
      e.preventDefault()
      e.stopPropagation()
      this.mouseAction = MouseAction.Resize
      this.eventFocused = this.events.find(ev => ev.id == eventId)
    }
    else {
      return
    }
    window.addEventListener('mouseup', () => {
      this.mouseAction = MouseAction.None
    }, { once: true })
  },

  numberOfKeys() {
    return this.octaves * 12 - this.startoctave * 12
  },

  scrollToMiddle() {
    setTimeout(() => {
      this.scrollTop = this.scrollHeight * 0.5
    })
  },

  connectedCallback() {
    this.scrollToMiddle()
  },

  component() {
    effect(
      () => {
        this.render `
          <style>
          #outer {
            position: relative;
            user-select: none;
          }
          #pianoroll {
            display: flex;
            flex-flow: row nowrap;
            flex: 1;
          }
          #keys {
            display: flex;
          }
          w-piano {
            position: sticky;
            left: 0;
            width: 30px;
            z-index: 10000;
          }
          .inner {
            flex-flow: row nowrap;
            display: flex;
            flex: 1;
          }

          .grid {
            box-sizing: border-box;
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            z-index: 1;
            flex: 1;
            flex-flow: column nowrap;
          }

          #horizontal {
            position: absolute;
            padding-left: 30px;
            box-sizing: border-box;
            width: 100%;
            left: 0;
            top: 0;
            bottom: 0;
          }
          #gridtimeline {
            position: absolute;
            z-index: 0;
            left: 0px;
            right: 1px;
            top: 0;
            bottom: 0;
          }

          #timelineindicator {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 1px;
            background: #29f;
          }

          .grid-row {
            display: flex;
            flex: 1;
            flex-flow: row nowrap;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          }

          .grid-row:nth-of-type(12n - 10),
          .grid-row:nth-of-type(12n - 8),
          .grid-row:nth-of-type(12n - 6),
          .grid-row:nth-of-type(12n - 3),
          .grid-row:nth-of-type(12n - 1) {
            background: rgba(0, 0, 0, 0.08);
          }
          .grid-row:nth-of-type(12n) {
            border-bottom-color: rgba(0, 0, 0, 0.5);
          }
          .grid-row:hover {
            background: rgba(255, 255, 255, 0.04);
          }
          .grid-row:last-child {
            border-bottom: none;
          }

          .grid-step {
            flex: 1;
            border-right: 1px solid rgba(0, 0, 0, 0.1);
          }
          .grid-step:nth-of-type(4n) {
            border-right-width: 1px;
            border-right-color: rgba(0, 0, 0, 0.28);
          }
          .grid-step:nth-of-type(8n) {
            border-right-color: rgba(0, 0, 0, 0.5);
          }
          .grid-step:last-child {
            border-right: none;
          }

          .grid-events {
            position: absolute;
            top: 0;
            left: 30px;
            right: 0;
            bottom: 0;
          }
          .event-note {
            box-sizing: border-box;
            position: absolute;
            background: #888;
            z-index: 10;
            cursor: pointer;
          }
          #outer {
            cursor: default;
          }
          #outer.resizing {
            /* cursor: ew-resize; */
          }
          .event-note-resize-handle {
            cursor: ew-resize;
            position: absolute;
            right: -1px;
            top: -1px;
            bottom: -1px;
            width: 11px;
          }
          </style>

          <div id="outer" oncontextmenu="event.preventDefault()">
            <div id="velocity"></div>
            <div id="pianoroll" part="pianoroll-outer">
              <div class="inner" part="pianoroll-inner">
                <div id="keys" part="pianoroll-keys"></div>

                <w-piano halfoctaves="${this.octaves
          * 2}" startoctave="${this.startoctave}" vertical></w-piano>

                <div id="horizontal">
                  <div id="gridtimeline">
                    <div id="timelineindicator" part="timeline-indicator"></div>
                  </div>

                  <div class="grid-events"></div>

                  <div id="#grid-steps" class="grid">${
          Array(12 * this.octaves).fill(0).map((_, row) => `
                    <div class="grid-row">${
            Array(this.steps).fill(0).map((_, step) =>
              bind(this) `
                      <div class="grid-step"
                        onmousedown="${(e) =>
                this.gridStepDown(e, row, step)}(event)"
                        onmouseenter="${(e) =>
                this.gridStepEnter(e, row, step)}(event)"
                        onmousemove="${(e) =>
                this.gridStepMove(e, row, step)}(event)"
                      ></div>`
            ).join('')
          }       </div>`).join('')
        }       </div>
                </div>
              </div>
            </div>
          </div>
        `
        this.scrollToMiddle()
      },
      this.startoctave,
      this.octaves,
      this.steps,
      this.height,
    )

    effect(
      () => {
        const numberOfKeys = this.octaves * 12
        const stepWidth = 100 / this.steps
        const stepHeight = 100 / numberOfKeys

        // this starts becoming exponentially very slow at around 700 events
        const html = this.events.map((event) => {
          return `
            <div class="event-note"
              key="${event.id}"
              part="grid-note"
              onmousedown="eventDown(event, '${event.id}')"
              onmouseenter="eventEnter(event, '${event.id}')"
              style="${
            styles({
              'z-index': (event.step)
                + ((numberOfKeys + (this.startoctave * 12) - event.note)
                  * this.steps),
              left: event.step * stepWidth + '%',
              top:
                (numberOfKeys + (this.startoctave * 12) - event.note)
                  * stepHeight + '%',
              width: event.length * stepWidth + '%',
              height: stepHeight + '%',
            })
          }"><div class="event-note-resize-handle" onmousedown="resizeDown(event, '${event.id}')"></div></div>
        `
        }).join('')

        dom(this.gridEvents, html, this)
      },
      this.startoctave,
      this.gridEvents,
      this.events,
    )

    effect(
      () => {
        let height = this.height
        let width
        let prevHeight = height
        this.keys.style.height = height + 'px'
        const onwheel = callback((e) => {
          const numberOfKeys = this.octaves * 12
          if (e.shiftKey) {
            e.preventDefault()
            e.stopPropagation()
            prevHeight = height
            const rowHeight = height / numberOfKeys
            const layerY = e.layerY
            const pcInRow = (layerY % rowHeight) / rowHeight
            height = Math.max(8 * numberOfKeys, height - e.deltaY)
            const scrollTop = this.scrollTop
            this.keys.style.height = height + 'px'

            const mouse = getRelativeMouseCoords(this, e)
            const scaled = height / prevHeight
            const newRowHeight = height / numberOfKeys
            // const currentRow = Math.(e.layerY / rowHeight) | 0
            const topY = mouse.y // scrollTop - e.offsetY
            const diff = topY * scaled - topY
            this.scrollTop = scrollTop + diff // - (e.offsetY * scaled - e.offsetY) * scaled
              + (pcInRow * newRowHeight * scaled - rowHeight * pcInRow) * scaled
            // + (height - prevHeight) / 2
            // - pcInRow * rowHeight
            // scrollTop * scaled +
            // ((clientHeight * scaled - clientHeight) / 2) * scaled +
          }
          if (e.altKey) {
            e.preventDefault()
            e.stopPropagation()

            if (!width) width = this.gridEvents.getBoundingClientRect().width
            const ownWidth = this.getBoundingClientRect().width
            const prevWidth = width
            width -= e.deltaY
            width = Math.max(ownWidth, width)

            this.horizontal.style.width = width / ownWidth * 100 + '%'

            // const mouse = getRelativeMouseCoords(this, e)
            // const rect = this.getBoundingClientRect()
            // console.log(rect.width)
            // console.log(this.scrollLeft)
            // console.log()
            // const amt = (this.scrollLeft + rect.width - 45) / width
            // this.scrollLeft = width * amt - (rect.width - 45)
            // + (mouse.x / rect.width) * width / prevWidth
          }
          this.dispatch('change', this)
        })

        this.addEventListener('wheel', onwheel, { passive: false })
      },
      this.height,
      this.keys,
    )

    effect(
      () => {
        if (
          this.mouseAction === MouseAction.Move
          || this.mouseAction === MouseAction.Resize
        ) {
          this.gridEvents.style.pointerEvents = 'none'
        }
        else {
          this.gridEvents.style.pointerEvents = 'all'
        }
        if (this.mouseAction === MouseAction.Resize) {
          this.outer.classList.add('resizing')
        }
        else {
          // this.outer.classList.remove('resizing')
        }
      },
      this.pianoroll,
      this.mouseAction,
      this.gridEvents,
    )

    effect(
      () => {
        if (this.timelineStartTime == -2) {
          this.timelineIndicator.style.visibility = 'hidden'
        }
        else {
          this.timelineIndicator.style.visibility = 'visible'
        }

        if (this.timelineStartTime != -2) {
          if (this.timelineStartTime < 0) {
            if (this.timelineAnimation) {
              this.timelineAnimation.pause()
              this.timelineIndicator.style.left = '0'
              this.timelineAnimation = null
            }
          }
          else {
            const keyframes = new KeyframeEffect(this.timelineIndicator, [{
              left: '0%',
            }, { left: '100%' }], {
              duration: this.duration * 1000,
              iterations: Infinity,
            })
            const animation = new Animation(keyframes)
            animation.startTime = this.timelineStartTime
            animation.play()
            this.timelineAnimation = animation
          }
        }
      },
      this.duration,
      this.timelineIndicator,
      this.timelineStartTime,
    )
  },
})
