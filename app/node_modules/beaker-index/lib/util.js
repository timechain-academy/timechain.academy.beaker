const normalize = require('normalize-url')
const SEP = '!'

const streams = new Set()
async function collectStream (stream, drive, opts) {
  const bufs = []
  streams.add(stream)
  setTimeout(() => {
    if (streams.has(stream)) {
      console.log('STREAM STILL PENDING', drive.key.toString('hex'), opts)
    }
  }, 1000 * 60 * 3)
  return new Promise((resolve, reject) => {
    stream.once('end', () => {
      streams.delete(stream)
      return resolve(bufs)
    })
    stream.once('error', err => {
      streams.delete(stream)
      return reject(err)
    })
    stream.on('data', d => bufs.push(d))
  })
}

function toKey (...components) {
  return components.join(SEP)
}

function normalizeUrl (url) {
  return encodeURI(normalize(url))
}

const DB_LOCK = Symbol('db-lock')
const mutexify = require('mutexify/promise')
async function dbBatch (db, batch) {
  if (!db[DB_LOCK]) {
    db[DB_LOCK] = mutexify()
  }
  const release = await db[DB_LOCK]()
  try {
    const b = db.batch()
    for (const entry of batch) {
      if (entry.type === 'put') {
        await b.put(entry.key, entry.value)
      } else if (entry.type === 'del') {
        await b.del(entry.key, entry.value)
      }
    }
    await b.flush()
  } finally {
    release()
  }
}

module.exports = {
  collectStream,
  toKey,
  normalizeUrl,
  dbBatch
}
