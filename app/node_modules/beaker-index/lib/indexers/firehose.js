const crypto = require('crypto')
const lexint = require('lexicographic-integer')
const pumpify = require('pumpify')
const { normalizeUrl, toKey } = require('../util')
const ParallelTransform = require('parallel-transformx')

module.exports = class FirehoseIndexer {
  static VERSION = 1

  constructor (db) {
    this.db = db
    this._indexers = new Map([
      ['comments/', this._indexComment.bind(this)],
      ['microblog/', this._indexMicroblog.bind(this)],
      ['pages/', this._indexPage.bind(this)],
      ['bookmarks/', this._indexBookmark.bind(this)]
    ])
  }

  _shouldIndex (name) {
    for (const contentType of this._indexers.keys()) {
      if (name.startsWith(contentType)) return true
    }
    return false
  }

  _index (url, name, stat, drive) {
    for (const contentType of this._indexers.keys()) {
      if (name.startsWith(contentType)) return this._indexers.get(contentType)(url, name, stat, drive)
    }
    return []
  }

  async _indexComment (url, name, stat, drive) {
    const content = await drive.promises.readFile(name, { encoding: 'utf-8' })
    const subject = stat.metadata['beaker/subject']
    return {
      type: 'comment',
      source: url,
      name,
      subject: subject && subject.toString('utf-8'),
      ctime: stat.ctime,
      content
    }
  }

  async _indexBookmark (url, name, stat, drive) {
    const title = stat.metadata['beaker/title'] || stat.metadata['title']
    const href = stat.metadata['beaker/href'] || stat.metadata['href']
    return {
      type: 'bookmark',
      source: url,
      name,
      ctime: stat.ctime,
      title: title && title.toString('utf-8'),
      href: href && href.toString('utf-8')
    }
  }

  async _indexPage (url, name, stat, drive) {
    const title = stat.metadata['beaker/title'] || stat.metadata['title']
    return {
      type: 'page',
      source: url,
      name,
      ctime: stat.ctime,
      title: title && title.toString('utf-8')
    }
  }
  
  async _indexMicroblog (url, name, stat, drive) {
    const content = await drive.promises.readFile(name, { encoding: 'utf-8' })
    return {
      type: 'microblog',
      source: url,
      name,
      ctime: stat.ctime,
      content
    }
  }

  _generateId (url, name, timestamp) {
    const hash = crypto.createHash('sha256')
    hash.update(url)
    hash.update(name)
    hash.update(timestamp)
    return hash.digest('hex')
  }

  async process (user, drive, change) {
    if (!change.name || !this._shouldIndex(change.name)) return []
    const stat = change.value

    // Generate a unique hash per record.
    const timestamp = lexint.pack(stat.ctime ? Math.min(stat.ctime, Date.now()) : Date.now(), 'hex')
    const recordId = this._generateId(user.url, change.name, timestamp)

    const recordKey = toKey('records', recordId)
    // Assumes <2^32 entries per timestamp (very reasonable assumption).
    const firehoseKey = toKey('firehose', timestamp + '-' + recordId.slice(0, 8))
    const userKey = toKey('users', encodeURI(normalizeUrl(user.url)), timestamp)

    const entry = await this._index(user.url, change.name, stat, drive)

    const records = []
    if (change.type === 'put') {
      // Store the content once, keyed by the record ID.
      records.push({
        type: 'put',
        key: recordKey,
        value: entry
      })
    }
    records.push(...[
      // This is the global firehose record.
      {
        type: change.type,
        key: firehoseKey,
        value: recordKey
      },
      // This is the user-specific firehose record.
      {
        type: change.type,
        key: userKey,
        value: recordKey
      }
    ])

    return records
  }

  _createRecordFetcher () {
    return new ParallelTransform({
      transform: ({ key, value: recordKey }, cb) => {
        this.db.get(recordKey).then(
          recordNode => {
            process.nextTick(cb, null, recordNode && recordNode.value)
          },
          err => {
            process.nextTick(cb, err)
          }
        )
      }
    })
  }

  createFirehoseStream (opts = {}) {
    const recordFetcher = this._createRecordFetcher()
    opts = {
      gt: toKey('firehose', ''),
      lt: toKey('firehose', '~'),
      limit: opts.limit,
      reverse: opts.reverse
    }
    return pumpify.obj(
      this.db.createReadStream(opts),
      this._createRecordFetcher()
    )
  }

  createUserStream (url, opts = {}) {
    url = encodeURI(normalizeUrl(url))
    const recordFetcher = this._createRecordFetcher()
    opts = {
      gt: toKey('users', url, ''),
      lt: toKey('users', url, '~'),
      limit: opts.limit,
      reverse: opts.reverse
    }
    return pumpify.obj(
      this.db.createReadStream(opts),
      this._createRecordFetcher()
    )
  }
}
