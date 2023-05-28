module.exports =  function registerCoreTimeouts (networker, corestore) {
  const flushSets = new Map()

  networker.on('flushed', dkey => {
    const keyString = dkey.toString('hex')
    if (!flushSets.has(keyString)) return
    const { flushSet, peerAddSet } = flushSets.get(keyString)
    callAllInSet(flushSet)
    callAllInSet(peerAddSet)
  })

  corestore.on('feed', core => {
    const discoveryKey = core.discoveryKey
    const peerAddSet = new Set()
    const flushSet = new Set()
    var globalFlushed = false

    if (!networker.swarm || networker.swarm.destroyed) return
    networker.swarm.flush(() => {
      if (networker.joined(discoveryKey)) return
      globalFlushed = true
      callAllInSet(flushSet)
      callAllInSet(peerAddSet)
    })

    flushSets.set(discoveryKey.toString('hex'), { flushSet, peerAddSet })
    core.once('peer-add', () => {
      callAllInSet(peerAddSet)
    })

    const timeouts = {
      get: (cb) => {
        if (networker.joined(discoveryKey)) {
          if (networker.flushed(discoveryKey)) return cb()
          return flushSet.add(cb)
        }
        if (globalFlushed) return cb()
        return flushSet.add(cb)
      },
      update: (cb) => {
        const oldCb = cb
        cb = (...args) => {
          oldCb(...args)
        }
        if (core.peers.length) return cb()
        if (networker.joined(discoveryKey)) {
          if (networker.flushed(discoveryKey) && !core.peers.length) return cb()
          return peerAddSet.add(cb)
        }
        if (globalFlushed) return cb()
        return peerAddSet.add(cb)
      }
    }
    core.timeouts = timeouts
  })
}

function callAllInSet (set) {
  for (const cb of set) {
    cb()
  }
  set.clear()
}
