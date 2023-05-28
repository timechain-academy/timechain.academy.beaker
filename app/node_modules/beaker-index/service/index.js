const BeakerIndexer = require('beaker-index')

const NAMESPACE = 'beaker-indexer'
// Singleton indexer.
var indexer = null

async function start (client) {
  if (indexer) return { key: indexer.key.toString('hex') }
  const store = client.corestore().namespace(NAMESPACE)
  const networker = client.network
  indexer = new BeakerIndexer(store, networker, null, {
    announceUserDrives: true
  })
  await indexer.ready()
  global.indexer = indexer

  indexer.on('watching-user', url => console.log(`Watching User: ${url}`))
  indexer.on('user-changed', url => console.log(` ** User Changed: ${url}`))
  indexer.on('indexing-user', url => console.log(` ** Indexing User: ${url}`))
  indexer.on('skipping-user', url => console.log(` ** Skipping User: ${url}`))
  indexer.on('indexed-user', (url, batch) => console.log(` ** Indexed User: ${url}, Batch Size: ${batch.length}`))
  indexer.on('watch-error', err => console.error(`Watch Errored: ${err}`))
  indexer.on('indexing-error', (err, url) => {
    console.error(`Could Not Index ${url}: ${err}`)
    console.error('ERR:', err)
  })
  indexer.on('fetched-users', users => console.log(` ### Fetched ${users.length} Users.`))

  console.log('Starting the Beaker indexer...')
  indexer.startIndexing()

  return { key: indexer.core.key.toString('hex') }
}

async function status () {
  if (!indexer) return { key: null }
  return { key: indexer.core.key.toString('hex') }
}

module.exports = {
  start,
  status
}
