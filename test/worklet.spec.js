import WebAudioContext from '../components/context.js'
import WebAudioDestination from '../components/destination.js'
import WebAudioWorklet from '../components/worklet.js'
import { effect } from '../dist/index.js'

describe('worklet', () => {
  it('should create a worklet', (done) => {
    customElements.define('x-context', WebAudioContext)
    customElements.define('x-worklet', WebAudioWorklet)

    let div
    const el =
      (((div = document.createElement('div')).innerHTML =
        '<x-context latency="playback"><x-worklet src="./noise.js" name="noise"></x-worklet></x-context>'),
        div.firstChild.firstChild)

    effect(() => {
      expect(el.audioNode).to.be.instanceof(AudioWorkletNode)
      done()
    }, el.audioNode)
    expect(el.name.value).to.equal('noise')
    expect(el.src.value).to.equal('./noise.js')
  })

  it('should connect to destination', (done) => {
    customElements.define('x-destination', WebAudioDestination)

    let div
    const el =
      (((div = document.createElement('div')).innerHTML =
        '<x-context latency="playback"><x-worklet src="./noise.js" name="noise"><x-destination></x-destination></x-worklet></x-context>'),
        div.firstChild.firstChild)

    effect(() => {
      expect(el.audioNode).to.be.instanceof(AudioWorkletNode)
      done()
    }, el.audioNode)
    expect(el.name.value).to.equal('noise')
    expect(el.src.value).to.equal('./noise.js')

    // TODO: how to assert if it has connected to destination?
  })
})
