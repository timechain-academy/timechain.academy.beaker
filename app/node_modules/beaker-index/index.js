const { NanoresourcePromise: Nanoresource } = require('nanoresource-promise/emitter')
const hyperdrive = require('hyperdrive')
const HyperBee = require('hyperbee')
const Corestore = require('corestore')
const CorestoreNetworker = require('@corestore/networker')
const registerCoreTimeouts = require('hypercore-networking-timeouts')
const got = require('got')

const TaskQueue = require('./lib/queue')
const FirehoseIndexer = require('./lib/indexers/firehose')
const SubscriptionsIndexer = require('./lib/indexers/subscriptions')
const BacklinksIndexer = require('./lib/indexers/backlinks')
const IndexJsonIndexer = require('./lib/indexers/index-json')
const Archiver = require('./lib/indexers/archiver')
const { dbBatch, toKey, normalizeUrl, collectStream } = require('./lib/util')

const NAMESPACE = 'beaker-index'
const NEW_USER_CHECK_INTERVAL = 1000 * 60 * 2
const CONCURRENT_TASK_LIMIT = 100

const INDEX_KEYS_PREFIX = 'index-keys'

module.exports = class BeakerIndexer extends Nanoresource {
  constructor (store, networker, key, opts = {}) {
    super()
    this.store = store
    this.networker = networker
    this.key = key

    // Set in _open.
    this.core = null
    this.db = null
    this.firehose = null
    this.subscriptions = null
    this.archiver = null

    this._queue = new TaskQueue({
      maxConcurrent: CONCURRENT_TASK_LIMIT,
      ...opts
    })
    this._queue.on('task-error', err => this.emit('indexing-error', err))
    this._watchTimer = null
    this._watching = new Set()
    this._watchers = []
    this._indexers = null
    this._announceUserDrives = !!opts.announceUserDrives

    this.indexerVersion = getIndexerVersion()
    this.ready = this.open.bind(this)
  }

  // Nanoresource Methods

  async _open () {
    if (!this.store) this.store = new Corestore('./data', {
      cacheSize: 10000,
      ifAvailable: true
    })
    this.store = this.store.namespace(NAMESPACE)
    await this.store.ready()

    if (!this.networker) {
      this.networker = new CorestoreNetworker(this.store, {
        // When running on a cloud instance, there can be lots of persistent connections.
        maxPeers: 10000
      })
      await this.networker.listen()
      registerCoreTimeouts(this.networker, this.store)
    }

    this.core = this.key ? this.store.get(this.key) : this.store.default()
    this.db = new HyperBee(this.core, {
      keyEncoding: 'utf8',
      valueEncoding: 'json'
    })
    await this.db.ready()

    const announce = this.core.writable
    await this.networker.configure(this.core.discoveryKey, {
      announce,
      lookup: !announce,
      remember: true
    })
    if (announce) {
      // TODO: This won't work with hyperspace.
      /*
      const dht = this.networker.swarm.network.discovery.dht
      dht.concurrency = 51
      dht.concurrencyRPS = 100
      */
    }

    this.firehose = new FirehoseIndexer(this.db)
    this.subscriptions = new SubscriptionsIndexer(this.db)
    this.backlinks = new BacklinksIndexer(this.db)
    this.drives = new IndexJsonIndexer(this.db)
    this.archiver = new Archiver()
    this._indexers = [
      // this.firehose,
      this.subscriptions,
      this.archiver,
      this.backlinks,
      this.drives
    ]
  }

  async _close () {
    if (this._watchTimer) clearInterval(this._watchTimer)
    for (const watcher of this._watchers) watcher.destroy()
    await this.networker.close()
    await this.store.close()
  }

  // Indexing-Mode Methods

  _lastVersionKey (url) {
    return toKey('last-version', url)
  }

  async _getLastVersions (url) {
    let versionRecord = await this.db.get(this._lastVersionKey(url))
    if (!versionRecord) return null
    return versionRecord.value
  } 
 
  async _loadDrive (url) {
    const key = urlToKey(url)
    const userDrive = hyperdrive(this.store, key)
    await userDrive.promises.ready()
    this.networker.configure(userDrive.discoveryKey, {
      announce: this._announceUserDrives,
      remember: this._announceUserDrives,
      lookup: true,
      flush: true
    })
    return userDrive
  }

  async _getUsersList () {
    try {
      var res = await got('https://userlist.beakerbrowser.com/list.json', {responseType: 'json'})
    } catch (e) {
      console.error(e)
      throw new Error('Failed to fetch users')
    }
    this.emit('fetched-user-list', res.body.users)
    return res.body.users.map(user => ({
      url: normalizeUrl(user.driveUrl),
      title: user.title,
      description: user.description
    }))
  }

  _createIndexKeysRecord (path, newRecords) {
    return {
      type: 'put',
      key: toKey(INDEX_KEYS_PREFIX, path),
      value: newRecords.map(r => r.key)
    }
  }

  async _getDeletionRecords (path) {
    const keysRecord = await this.db.get(toKey(INDEX_KEYS_PREFIX, path))
    if (!keysRecord) return null
    return keysRecord.value.map(key => {
      return {
        type: 'del',
        key,
      }
    })
  }

  async _indexChanges (user, drive) {
    this.emit('indexing-user', user.url)
    const currentDriveVersion = drive.version
    let lastVersions = await this._getLastVersions(user.url)
    let sameIndexerVersion = false
    if (lastVersions) {
      const sameDriveVersion = currentDriveVersion === lastVersions.drive
      sameIndexerVersion = this.indexerVersion === lastVersions.indexer
      // TODO: Support incrementally updating each index individually.
      if (sameDriveVersion && sameIndexerVersion) {
        this.emit('skipping-user', user.url)
        return null
      }
    }

    let lastDriveVersion = sameIndexerVersion ? (lastVersions && lastVersions.drive) : 0
    lastDriveVersion = lastDriveVersion || 0

    const diffStream = drive.createDiffStream(lastDriveVersion, '/', { noMounts: true })

    const batch = []
    var changes = null

    try {
      changes = await collectStream(diffStream, drive, { lastDriveVersion })
    } catch (err) {
      // If the diff stream could not complete. Do not proceed.
      this.emit('indexing-error', err, user.url)
    }
    if (!changes) return null

    for (const change of changes) {
      if (!change.name) continue
      const path = normalizeUrl(user.url + '/' + change.name)
      console.log('indexing:', path)
      if (change.type === 'del') {
        // Get the last index record keys, and delete them all.
        const delRecords = await this._getDeletionRecords(path)
        if (delRecords) batch.push(...delRecords)
      } else if (change.type === 'put') {
        for (const indexer of this._indexers) {
          var newRecords = []
          try {
            newRecords = await indexer.process(user, drive, change)
          } catch (err) {
            this.emit('indexing-error', err, user.url)
          }
          console.log('new records:', newRecords)
          batch.push(...newRecords)
          // Save the keys of the last indexes for future deletion.
          batch.push(this._createIndexKeysRecord(path, newRecords))
        }
      } else {
        // Don't index mount change types.
        continue
      }
    }

    // Record the last drive version that was indexed successfully.
    batch.push({ type: 'put', key: this._lastVersionKey(user.url), value: {
      drive: currentDriveVersion,
      indexer: this.indexerVersion
    }})

    await dbBatch(this.db, batch)
    this.emit('indexed-user', user.url, batch)
  }

  // Public Methods

  startIndexing () {
    const tick = async () => {
      try {
        const users = await this._getUsersList()
        this.emit('fetched-users', users)
        for (const user of users) {
          if (this._watching.has(user.url)) continue
          this._watching.add(user.url)
          this.emit('watching-user', user.url)
          const drive = await this._loadDrive(user.url)
          // Watch the top-level trie only so that we don't get triggered by mounts.
          const watcher = drive.db.trie.watch(() => {
            this.emit('user-changed', user.url)
            this._queue.push(() => this._indexChanges(user, drive))
          })
          this._watchers.push(watcher)
        }
      } catch (err) {
        this.emit('watch-error', err)
      }
    }
    this._watchTimer = setInterval(tick, NEW_USER_CHECK_INTERVAL)
    tick()
  }
}

function getIndexerVersion () {
  return [
    SubscriptionsIndexer.VERSION,
    FirehoseIndexer.VERSION,
    BacklinksIndexer.VERSION,
    IndexJsonIndexer.VERSION,
    Archiver.VERSION
  ].join()
}

function urlToKey (url) {
  return Buffer.from(/([0-9a-f]{64})/i.exec(url)[1], 'hex')
}
