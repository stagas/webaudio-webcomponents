// import { create, effect } from '../dist/index.js'
import SchedulerNode from '../vendor/scheduler.js'
import WebAudioNode, { atomic, create, effect } from './node.js'

export default create({
  class: 'scheduler',
  extends: WebAudioNode,

  attrs: { length: 2 },
  props: { scheduler: Object },

  slot: true,

  start() {
    this.scheduler.start(this.audioContext.currentTime)
    for (const el of this.slotted) {
      if (el.pianoroll) {
        el.pianoroll.timelineStartTime = performance.now()
      }
    }
  },

  stop() {
    this.scheduler.stop(0)
    for (const el of this.slotted) {
      if (el.pianoroll) {
        el.pianoroll.timelineStartTime = -1
      }
    }
  },

  component() {
    effect(
      atomic(async () => {
        const { audioContext } = this
        if (!audioContext) return
        await audioContext.audioWorklet.addModule(SchedulerNode.worklet)
        const scheduler = new SchedulerNode(audioContext)
        scheduler.stop(0)
        scheduler.loop = true
        scheduler.loopEnd = this.length
        for (const el of this.slotted.value) {
          el.scheduler = scheduler
        }
        this.scheduler = scheduler
      }),
      this.length,
      this.audioContext,
      this.slotted,
    )
  },
})
