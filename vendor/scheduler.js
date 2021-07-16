// src/typescript/messagequeue/index.ts
var MessageQueue = class {
  constructor(buffer) {
    this.buffer = buffer
  }
  get readPtr() {
    return this.buffer[0]
  }
  set readPtr(index) {
    this.buffer[0] = index
  }
  get writePtr() {
    return this.buffer[1]
  }
  set writePtr(index) {
    this.buffer[1] = index
  }
  clear() {
    this.buffer.fill(-Infinity)
    this.readPtr = 2
    this.writePtr = 2
    return this
  }
  push(...values) {
    const buffer = this.buffer
    const ptr = this.writePtr
    buffer.set(values, ptr)
    this.writePtr = ptr + values.length
  }
  shift() {
    const buffer = this.buffer
    const ptr = this.readPtr
    const value = buffer[ptr]
    if (!isFinite(value)) {
      this.readPtr = this.writePtr = 2
      return void 0
    }
    buffer[ptr] = -Infinity
    this.readPtr = ptr + 1
    return value
  }
  slice(length) {
    const buffer = this.buffer
    const ptr = this.readPtr
    const slice = buffer.subarray(ptr, ptr + length)
    if (!isFinite(slice[0])) {
      this.buffer.fill(-Infinity, 2, 2 + ptr)
      this.readPtr = this.writePtr = 2
      return void 0
    }
    this.readPtr = ptr + length
    return slice
  }
}
var messagequeue_default = MessageQueue

// src/typescript/scheduler/event.ts
var globalEventId = 0
var SchedulerEvent = class {
  constructor(payload) {
    this.id = globalEventId++
    this.targets = new Set()
    this.payload = payload
  }
}
var event_default = SchedulerEvent

// scheduler-worklet:/home/stagas/work/kstrukt/audioplugin/src/typescript/scheduler/worklet
var worklet_default =
  'data:text/javascript,(()%20%3D%3E%20%7B%0A%20%20%2F%2F%20src%2Ftypescript%2Fmessagequeue%2Findex.ts%0A%20%20var%20MessageQueue%20%3D%20class%20%7B%0A%20%20%20%20constructor(buffer)%20%7B%0A%20%20%20%20%20%20this.buffer%20%3D%20buffer%3B%0A%20%20%20%20%7D%0A%20%20%20%20get%20readPtr()%20%7B%0A%20%20%20%20%20%20return%20this.buffer%5B0%5D%3B%0A%20%20%20%20%7D%0A%20%20%20%20set%20readPtr(index)%20%7B%0A%20%20%20%20%20%20this.buffer%5B0%5D%20%3D%20index%3B%0A%20%20%20%20%7D%0A%20%20%20%20get%20writePtr()%20%7B%0A%20%20%20%20%20%20return%20this.buffer%5B1%5D%3B%0A%20%20%20%20%7D%0A%20%20%20%20set%20writePtr(index)%20%7B%0A%20%20%20%20%20%20this.buffer%5B1%5D%20%3D%20index%3B%0A%20%20%20%20%7D%0A%20%20%20%20clear()%20%7B%0A%20%20%20%20%20%20this.buffer.fill(-Infinity)%3B%0A%20%20%20%20%20%20this.readPtr%20%3D%202%3B%0A%20%20%20%20%20%20this.writePtr%20%3D%202%3B%0A%20%20%20%20%20%20return%20this%3B%0A%20%20%20%20%7D%0A%20%20%20%20push(...values)%20%7B%0A%20%20%20%20%20%20const%20buffer%20%3D%20this.buffer%3B%0A%20%20%20%20%20%20const%20ptr%20%3D%20this.writePtr%3B%0A%20%20%20%20%20%20buffer.set(values%2C%20ptr)%3B%0A%20%20%20%20%20%20this.writePtr%20%3D%20ptr%20%2B%20values.length%3B%0A%20%20%20%20%7D%0A%20%20%20%20shift()%20%7B%0A%20%20%20%20%20%20const%20buffer%20%3D%20this.buffer%3B%0A%20%20%20%20%20%20const%20ptr%20%3D%20this.readPtr%3B%0A%20%20%20%20%20%20const%20value%20%3D%20buffer%5Bptr%5D%3B%0A%20%20%20%20%20%20if%20(!isFinite(value))%20%7B%0A%20%20%20%20%20%20%20%20this.readPtr%20%3D%20this.writePtr%20%3D%202%3B%0A%20%20%20%20%20%20%20%20return%20void%200%3B%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20buffer%5Bptr%5D%20%3D%20-Infinity%3B%0A%20%20%20%20%20%20this.readPtr%20%3D%20ptr%20%2B%201%3B%0A%20%20%20%20%20%20return%20value%3B%0A%20%20%20%20%7D%0A%20%20%20%20slice(length)%20%7B%0A%20%20%20%20%20%20const%20buffer%20%3D%20this.buffer%3B%0A%20%20%20%20%20%20const%20ptr%20%3D%20this.readPtr%3B%0A%20%20%20%20%20%20const%20slice%20%3D%20buffer.subarray(ptr%2C%20ptr%20%2B%20length)%3B%0A%20%20%20%20%20%20if%20(!isFinite(slice%5B0%5D))%20%7B%0A%20%20%20%20%20%20%20%20this.buffer.fill(-Infinity%2C%202%2C%202%20%2B%20ptr)%3B%0A%20%20%20%20%20%20%20%20this.readPtr%20%3D%20this.writePtr%20%3D%202%3B%0A%20%20%20%20%20%20%20%20return%20void%200%3B%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20this.readPtr%20%3D%20ptr%20%2B%20length%3B%0A%20%20%20%20%20%20return%20slice%3B%0A%20%20%20%20%7D%0A%20%20%7D%3B%0A%20%20var%20messagequeue_default%20%3D%20MessageQueue%3B%0A%0A%20%20%2F%2F%20src%2Ftypescript%2Fscheduler%2Fworklet.ts%0A%20%20var%20bufferSize%20%3D%20128%3B%0A%20%20var%20timePerSample%20%3D%201%20%2F%20sampleRate%3B%0A%20%20var%20quantumDurationTime%20%3D%20bufferSize%20*%20timePerSample%3B%0A%20%20var%20MIDIEventScheduler%20%3D%20class%20extends%20AudioWorkletProcessor%20%7B%0A%20%20%20%20constructor(options)%20%7B%0A%20%20%20%20%20%20super(options)%3B%0A%20%20%20%20%20%20this.queues%20%3D%20new%20Map()%3B%0A%20%20%20%20%20%20this.events%20%3D%20new%20Map()%3B%0A%20%20%20%20%20%20this.offsetTime%20%3D%200%3B%0A%20%20%20%20%20%20this.playbackStartTime%20%3D%200%3B%0A%20%20%20%20%20%20this.running%20%3D%20true%3B%0A%20%20%20%20%20%20this.loopPoints%20%3D%20options.processorOptions.loopPoints%3B%0A%20%20%20%20%20%20this.port.onmessage%20%3D%20(%7Bdata%3A%20%7Bevent%2C%20payload%7D%7D)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20switch%20(event)%20%7B%0A%20%20%20%20%20%20%20%20%20%20case%20%22start%22%3A%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20this.start(payload)%3B%0A%20%20%20%20%20%20%20%20%20%20case%20%22stop%22%3A%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20this.stop()%3B%0A%20%20%20%20%20%20%20%20%20%20case%20%22addTarget%22%3A%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20this.queues.set(payload.targetId%2C%20new%20messagequeue_default(payload.buffer))%3B%0A%20%20%20%20%20%20%20%20%20%20case%20%22removeTarget%22%3A%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20this.queues.delete(payload.targetId)%3B%0A%20%20%20%20%20%20%20%20%20%20case%20%22addEvent%22%3A%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20this.events.set(payload.event.id%2C%20payload.event)%3B%0A%20%20%20%20%20%20%20%20%20%20case%20%22removeEvent%22%3A%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20this.events.delete(payload.eventId)%3B%0A%20%20%20%20%20%20%20%20%20%20case%20%22addEventTarget%22%3A%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20this.events.get(payload.eventId).targets.add(payload.targetId)%3B%0A%20%20%20%20%20%20%20%20%20%20case%20%22removeEventTarget%22%3A%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20this.events.get(payload.eventId).targets.delete(payload.targetId)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%7D%3B%0A%20%20%20%20%7D%0A%20%20%20%20get%20loop()%20%7B%0A%20%20%20%20%20%20return%20!!this.loopPoints%5B0%5D%3B%0A%20%20%20%20%7D%0A%20%20%20%20get%20loopStart()%20%7B%0A%20%20%20%20%20%20return%20this.loopPoints%5B1%5D%3B%0A%20%20%20%20%7D%0A%20%20%20%20get%20loopEnd()%20%7B%0A%20%20%20%20%20%20return%20this.loopPoints%5B2%5D%3B%0A%20%20%20%20%7D%0A%20%20%20%20start(%7BplaybackStartTime%20%3D%20currentTime%7D%20%3D%20%7B%7D)%20%7B%0A%20%20%20%20%20%20this.running%20%3D%20true%3B%0A%20%20%20%20%20%20this.playbackStartTime%20%3D%20playbackStartTime%3B%0A%20%20%20%20%7D%0A%20%20%20%20stop()%20%7B%0A%20%20%20%20%20%20this.running%20%3D%20false%3B%0A%20%20%20%20%7D%0A%20%20%20%20process()%20%7B%0A%20%20%20%20%20%20if%20(!this.running)%0A%20%20%20%20%20%20%20%20return%20true%3B%0A%20%20%20%20%20%20let%20startTime%3B%0A%20%20%20%20%20%20let%20endTime%3B%0A%20%20%20%20%20%20let%20offsetTime%20%3D%200%3B%0A%20%20%20%20%20%20const%20loop%20%3D%20this.loop%3B%0A%20%20%20%20%20%20let%20loopStart%20%3D%200%3B%0A%20%20%20%20%20%20let%20loopEnd%20%3D%200%3B%0A%20%20%20%20%20%20let%20loopDuration%20%3D%200%3B%0A%20%20%20%20%20%20const%20playbackStartTime%20%3D%20this.playbackStartTime%3B%0A%20%20%20%20%20%20if%20(loop)%20%7B%0A%20%20%20%20%20%20%20%20loopStart%20%3D%20this.loopStart%3B%0A%20%20%20%20%20%20%20%20loopEnd%20%3D%20this.loopEnd%3B%0A%20%20%20%20%20%20%20%20loopDuration%20%3D%20loopEnd%20-%20loopStart%3B%0A%20%20%20%20%20%20%20%20offsetTime%20%3D%20currentTime%20-%20playbackStartTime%20-%20loopStart%3B%0A%20%20%20%20%20%20%20%20startTime%20%3D%20offsetTime%20%25%20loopDuration%3B%0A%20%20%20%20%20%20%20%20endTime%20%3D%20(startTime%20%2B%20quantumDurationTime)%20%25%20loopDuration%3B%0A%20%20%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20startTime%20%3D%20currentTime%20-%20playbackStartTime%3B%0A%20%20%20%20%20%20%20%20endTime%20%3D%20startTime%20%2B%20quantumDurationTime%3B%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20for%20(const%20event%20of%20this.events.values())%20%7B%0A%20%20%20%20%20%20%20%20const%20eventTime%20%3D%20event.payload.receivedTime%20*%201e-3%3B%0A%20%20%20%20%20%20%20%20const%20isPast%20%3D%20endTime%20%3C%20startTime%3B%0A%20%20%20%20%20%20%20%20if%20(isPast%20%3F%20eventTime%20%3E%3D%20loopStart%20%26%26%20eventTime%20%3C%20endTime%20%3A%20eventTime%20%3E%3D%20startTime%20%26%26%20eventTime%20%3C%20endTime)%20%7B%0A%20%20%20%20%20%20%20%20%20%20let%20receivedTime%3B%0A%20%20%20%20%20%20%20%20%20%20if%20(loop)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20receivedTime%20%3D%20eventTime%20%2B%20Math%5BisPast%20%3F%20%22ceil%22%20%3A%20%22floor%22%5D(offsetTime%20%2F%20loopDuration)%20*%20loopDuration%20%2B%20playbackStartTime%3B%0A%20%20%20%20%20%20%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20receivedTime%20%3D%20eventTime%20%2B%20playbackStartTime%3B%0A%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20receivedTime%20*%3D%201e3%3B%0A%20%20%20%20%20%20%20%20%20%20for%20(const%20targetId%20of%20event.targets)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20const%20target%20%3D%20this.queues.get(targetId)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20if%20(target)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20target.push(receivedTime%2C%20...event.payload.data)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20return%20true%3B%0A%20%20%20%20%7D%0A%20%20%7D%3B%0A%20%20registerProcessor(%22MIDIEventScheduler%22%2C%20MIDIEventScheduler)%3B%0A%7D)()%3B%0A'

// src/typescript/scheduler/index.ts
var globalTargetId = 0
var MessageQueueTarget = class {
  constructor() {
    this.id = globalTargetId++
    this.queue = new messagequeue_default(
      new Float64Array(
        new SharedArrayBuffer(128 * Float64Array.BYTES_PER_ELEMENT),
      ),
    ).clear()
  }
}
var MIDIOp
;(function(MIDIOp2) {
  MIDIOp2[MIDIOp2['NoteOff'] = 128] = 'NoteOff'
  MIDIOp2[MIDIOp2['NoteOn'] = 144] = 'NoteOn'
})(MIDIOp || (MIDIOp = {}))
function createMIDIMessageEvent(time, data) {
  const midiMessageEvent = new MIDIMessageEvent('midimessage', {
    data: new Uint8Array(data),
  })
  midiMessageEvent.receivedTime = time * 1e3
  return midiMessageEvent
}
var SchedulerNode = class {
  constructor(context) {
    this.targets = new Map()
    this.loopPoints = new Float64Array(
      new SharedArrayBuffer(3 * Float64Array.BYTES_PER_ELEMENT),
    )
    this.start = (playbackStartTime) => {
      this.node.port.postMessage({
        event: 'start',
        payload: { playbackStartTime },
      })
    }
    this.stop = () => {
      this.node.port.postMessage({ event: 'stop' })
    }
    this.context = context
    try {
      this.node = new AudioWorkletNode(this.context, 'MIDIEventScheduler', {
        processorOptions: { loopPoints: this.loopPoints },
      })
    }
    catch (error) {
      console.error(error)
      throw new Error(
        'Error initializing SchedulerNode AudioWorkletNode. Be sure to run: `await context.audioWorklet.addModule(SchedulerNode.worklet)` before creating a SchedulerNode.',
      )
    }
    this.loopEnd = Infinity
  }
  get loop() {
    return !!this.loopPoints[0]
  }
  set loop(value) {
    this.loopPoints[0] = +value
  }
  get loopStart() {
    return this.loopPoints[1]
  }
  set loopStart(seconds) {
    this.loopPoints[1] = seconds
  }
  get loopEnd() {
    return this.loopPoints[2]
  }
  set loopEnd(seconds) {
    this.loopPoints[2] = seconds
  }
  createEvent(midiMessageEvent) {
    const event = new event_default(midiMessageEvent)
    this.node.port.postMessage({
      event: 'addEvent',
      payload: {
        event: {
          id: event.id,
          targets: event.targets,
          payload: {
            receivedTime: midiMessageEvent.receivedTime,
            data: midiMessageEvent.data,
          },
        },
      },
    })
    return event
  }
  removeEvent(event) {
    this.node.port.postMessage({
      event: 'removeEvent',
      payload: { eventId: event.id },
    })
  }
  attachEvent(event, otherNode) {
    if (!this.targets.has(otherNode)) {
      throw new Error(
        'Not connected to node. Connect first using: schedulerNode.connect(audioWorkletNode)',
      )
    }
    this.node.port.postMessage({
      event: 'addEventTarget',
      payload: { eventId: event.id, targetId: this.targets.get(otherNode).id },
    })
  }
  detachEvent(event, otherNode) {
    if (!this.targets.has(otherNode)) {
      throw new Error(
        'Not connected to node. Connect first using: schedulerNode.connect(audioWorkletNode)',
      )
    }
    this.node.port.postMessage({
      event: 'removeEventTarget',
      payload: { eventId: event.id, targetId: this.targets.get(otherNode).id },
    })
  }
  addNote(time, note, velocity, length) {
    const events = []
    {
      const midiMessageEvent = createMIDIMessageEvent(time, [
        144,
        note,
        velocity,
      ])
      const event = this.createEvent(midiMessageEvent)
      events.push(event)
    }
    {
      const midiMessageEvent = createMIDIMessageEvent(time + length, [
        128,
        note,
        0,
      ])
      const event = this.createEvent(midiMessageEvent)
      events.push(event)
    }
    return events
  }
  connect(otherNode) {
    this.node.connect(otherNode, 0, otherNode.numberOfInputs - 1)
    const target = new MessageQueueTarget()
    this.targets.set(otherNode, target)
    this.node.port.postMessage({
      event: 'addTarget',
      payload: { targetId: target.id, buffer: target.queue.buffer },
    })
    otherNode.port.postMessage({
      event: 'initMIDIMessageEventQueue',
      payload: { buffer: target.queue.buffer },
    })
    return otherNode
  }
  disconnect(otherNode) {
    this.node.disconnect(otherNode, 0, otherNode.numberOfInputs - 1)
    const target = this.targets.get(otherNode)
    this.targets.delete(otherNode)
    this.node.port.postMessage({
      event: 'removeTarget',
      payload: { targetId: target.id },
    })
  }
}
SchedulerNode.worklet = worklet_default
var scheduler_default = SchedulerNode
export { event_default as SchedulerEvent, scheduler_default as default }
