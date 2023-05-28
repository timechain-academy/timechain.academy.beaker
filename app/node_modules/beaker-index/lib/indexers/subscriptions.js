const { collectStream, normalizeUrl, toKey } = require('../util')

module.exports = class SubscriptionsIndexer {
  static VERSION = 2

  constructor (db) {
    this.db = db
    this._targetRe = /.*!(.*)$/
  }

  _getSubscriptionKeys (fromUrl, toUrl) {
    return {
      forward: toKey('subscription', SubscriptionsIndexer.VERSION, 'forward', fromUrl, toUrl),
      backward: toKey('subscription', SubscriptionsIndexer.VERSION, 'backward', toUrl, fromUrl)
    }
  }

  async process (user, drive, change) {
    if (!change.name || !change.name.startsWith('subscriptions')) return []
    let target = change.value.metadata.href
    if (!target) return []
    if (typeof target !== 'string') target = target.toString('utf-8')
    const keys = this._getSubscriptionKeys(normalizeUrl(user.url), normalizeUrl(target))
    return [
      {
        type: change.type,
        key: keys.forward,
        value: {}
      },
      {
        type: change.type,
        key: keys.backward,
        value: {}
      }
    ]
  }

  async getSubscribers (url) {
    url = normalizeUrl(url)
    const opts = {
      gt: this._getSubscriptionKeys('', url).backward,
      lt: this._getSubscriptionKeys('~', url).backward
    }
    const subscriptions = await collectStream(this.db.createReadStream(opts))
    return subscriptions.map(({ key }) => decodeURI(this._targetRe.exec(key)[1]))
  }

  async getSubscriptions (url) {
    url = normalizeUrl(url)
    const opts = {
      gt: this._getSubscriptionKeys(url, '').forward,
      lt: this._getSubscriptionKeys(url, '~').forward
    }
    const subscriptions = await collectStream(this.db.createReadStream(opts))
    return subscriptions.map(({ key }) => decodeURI(this._targetRe.exec(key)[1]))
  }
}
