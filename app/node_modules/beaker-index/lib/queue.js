const { EventEmitter } = require('events')

module.exports = class TaskQueue extends EventEmitter {
  constructor (opts = {}) {
    super()
    this.queue = []
    this._running = 0
    this._maxConcurrent = opts.maxConcurrent || 20
  }
  _call (task) {
    const exec = err => process.nextTick(this._exec.bind(this), err)
    task().then(exec, exec)
  }
  async _exec (err, notFinished) {
    if (err) this.emit('task-error', err)
    if (!notFinished) this._running--
    while (this.queue.length && this._running < this._maxConcurrent) {
      const next = this.queue.pop()
      this._running++
      this._call(next)
    }
  }
  push (task) {
    this.queue.unshift(task)
    this._exec(null, true)
  }
}
