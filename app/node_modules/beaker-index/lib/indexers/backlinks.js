const crypto = require('crypto')
const lexint = require('lexicographic-integer')
const markdownLinkExtractor = require('markdown-link-extractor')
const { collectStream, normalizeUrl, toKey } = require('../util')
const pumpify = require('pumpify')
const { Transform } = require('streamx')

// Lazily loaded during indexing.
var htmlLinkExtractor = null

const LINK_REGEX = /^[\S]*:\/\/[\S]*$/

module.exports = class BacklinksIndexer {
  static VERSION = 5

  constructor (db) {
    this.db = db
    this._targetRe = /.*!(.*)$/
  }

  _shouldIndex (name) {
    return name.endsWith('.md') || (name.endsWith('.html')) || name.endsWith('.goto')
  }

  _index (url, name, stat, drive) {
    for (const contentType of this._indexers.keys()) {
      if (name.startsWith(contentType)) return this._indexers.get(contentType)(url, name, stat, drive)
    }
    return []
  }

  async _extractFileLinks (name, stat, drive) {
    if (!htmlLinkExtractor) htmlLinkExtractor = require('get-urls')
    const content = await drive.promises.readFile(name, { encoding: 'utf-8' })
    const links = name.endsWith('.md') ? markdownLinkExtractor(content) : htmlLinkExtractor(content)
    if (stat.metadata) {
      for (let value of Object.values(stat.metadata)) {
        if (value) value = value.toString('utf-8')
        if (LINK_REGEX.exec(value)) links.push(value)
      }
    }
    return {
      links,
      // HTML content should not be stored in the index.
      content: name.endsWith('.md') ? content : null
    }
  }

  async _extractGotoTarget (stat) {
    return {
      links: [stat.metadata.href.toString('utf-8')],
      content: null
    } 
  }

  async process (user, drive, change) {
    if (!this._shouldIndex(change.name)) return []
    const stat = change.value
    const rtime = Date.now()
    const crtime = stat.ctime ? Math.min(stat.ctime, rtime) : rtime
    const mrtime = stat.mtime ? Math.min(stat.mtime, rtime) : rtime

    let links = null
    let content = null

    if (change.name.endsWith('.md') || change.name.endsWith('.html')) {
      ({ links, content } = await this._extractFileLinks(change.name, stat, drive));
    } else if (change.name.endsWith('.goto')) {
      ({ links, content } = await this._extractGotoTarget(stat));
    }

    if (!links) return []

    let metadata = {}
    if (stat.metadata) {
      for (const [key, value] of Object.entries(stat.metadata)) {
        metadata[key] = value && value.toString('utf-8')
      }
    }

    const source = normalizeUrl(user.url + '/' + change.name)
    const contentKey = content ? toKey('backlinks', BacklinksIndexer.VERSION, 'content', source) : null
    const value = {
      drive: user.url,
      content: contentKey,
      source,
      metadata,
      rtime,
      crtime,
      mrtime,
    }
    const records = []

    // Store the content once.
    if (contentKey) records.push({
      type: 'put',
      key: contentKey,
      value: content
    })

    // TODO: For now, the value is duplicated in all the indexes.
    // In the future, this will use a pointer.
    for (const link of links) {
      const linkUrl = new URL(link)
      const linkRecords = [
        // One record from target -> source.
        {
          type: change.type,
          key: toKey('backlinks', BacklinksIndexer.VERSION, 'by-file', normalizeUrl(link), normalizeUrl(source)),
          value
        },
        // One record from target drive key -> source.
        {
          type: change.type,
          key: toKey('backlinks', BacklinksIndexer.VERSION, 'by-drive', linkUrl.host, normalizeUrl(source)),
          value
        },
        // One record from target drive key -> source, mrtime ordered.
        {
          type: change.type,
          key: toKey('backlinks', BacklinksIndexer.VERSION, 'by-mrtime', linkUrl.host, lexint.pack(mrtime, 'hex')),
          value
        },
        // One record from target drive key -> source, crtime ordered.
        {
          type: change.type,
          key: toKey('backlinks', BacklinksIndexer.VERSION, 'by-crtime', linkUrl.host, lexint.pack(crtime, 'hex')),
          value
        }
      ]
      records.push(...linkRecords)
    }

    return records
  }

  createReadStream (url, opts = {}) {
    let indexType = 'by-drive'
    if (opts.mrtime) indexType = 'by-mrtime'
    if (opts.file) indexType = 'by-file'
    if (opts.crtime) indexType = 'by-crtime'

    url = new URL(normalizeUrl(url))
    if (!opts.file) url = url.host
    else url = url.href

    let prefix = toKey('backlinks', BacklinksIndexer.VERSION, indexType, url)
    const iterOpts = {
      gt: toKey(prefix, ''),
      lt: toKey(prefix, '~'),
      limit: opts.limit,
      reverse: opts.reverse
    }

    const stream = this.db.createReadStream(iterOpts)
    return pumpify.obj(
      stream,
      new Transform({
        transform: ({ key, value }, cb) => {
          return cb(null, {
            key: decodeURI(this._targetRe.exec(key)[1]),
            value
          })
        }
      })
    )
  }

  get (url, opts) {
    return collectStream(this.createReadStream(url, opts))
  }
}
