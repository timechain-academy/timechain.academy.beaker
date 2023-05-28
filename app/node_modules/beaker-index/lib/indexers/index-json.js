const { collectStream, normalizeUrl, toKey } = require('../util')

module.exports = class IndexJsonIndexer {
  static VERSION = 1

  constructor (db) {
    this.db = db
  }

  async process (user, drive, change) {
    if (!change.name || !(change.name === 'index.json')) return []
    const content = await drive.promises.readFile('index.json', { encoding: 'utf-8' })
    if (!content) return []
    const parsed = JSON.parse(content)
    return [{
      type: 'put',
      key: toKey('drives', IndexJsonIndexer.VERSION, normalizeUrl(user.url)),
      value: parsed
    }]
  }

  async get (url) {
    const node = await this.db.get(toKey('drives', IndexJsonIndexer.VERSION, normalizeUrl(url)))
    if (!node) return null
    return node.value
  }
}