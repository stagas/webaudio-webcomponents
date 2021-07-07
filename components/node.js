import { atomic, create, effect, wrap } from '../dist/index.js'
export * from '../dist/index.js'

export const WebAudioNode = create({
  class: 'node',

  slot: true,

  props: { audioNode: Object, audioContext: Object },

  connectedInputs: [],

  component() {
    effect(
      atomic(async () => {
        this.connectInputs()
        await this.connect()
      }),
      this.slotted,
      this.audioNode,
      this.audioContext,
    )
  },

  async connect() {
    const targets = this.slotted

    let node = this.audioNode

    for (const target of targets) {
      if (!(target instanceof WebAudioNode)) continue

      target.audioContext = this.audioContext

      await new Promise((resolve) => {
        wrap(() => {
          effect.once(() => {
            if (target.audioNode) {
              node = node.connect(target.audioNode)
              resolve()
            }
          }, target.audioNode)
        })
      })
    }

    this.dispatch('connect', this)
  },

  connectInputs() {
    for (const [, target, handler] of this.connectedInputs.splice(0)) {
      target.removeEventListener('input', handler)
    }
    const targets = this.slotted
    const params = this.audioNode.parameters
    const context = this.audioContext

    if (params) {
      for (const target of targets) {
        const p = params.get(target.name)
        if (!p) continue

        Object.assign(target, {
          step: (p.maxValue - p.minValue) / 128,
          min: p.minValue,
          max: p.maxValue,
          value: p.value,
        })

        const handler = () => {
          const value = target.value
          p.setValueAtTime(value, context.currentTime + 0.05)
          this.connectedInputs.filter(([param, input]) =>
            param.name === p.name && input !== target
          ).forEach(([, input]) => (input.value = value))
        }

        target.addEventListener('input', handler)

        this.connectedInputs.push([p, target, handler])
      }
    }
  },
})

export default WebAudioNode
