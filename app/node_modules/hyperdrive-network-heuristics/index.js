module.exports = async function applyHeuristics (drive, networker) {
  if (!drive.writable) {
    const networkConfig = await networker.status(drive.discoveryKey)
    if (!networkConfig) await networker.configure(drive.discoveryKey, { announce: false, lookup: true, remember: false })
  }
  // Lookups must be done on new mounts immediately, then apply the parent's network config if an existing config does not exist.
  const mountListener = async (trie) => {
    networker.configure(trie.feed.discoveryKey, {
      copyFrom: drive.discoveryKey,
      lookup: !trie.feed.writable,
      overwrite: false
    }).catch(() => {
      // If the configuration couldn't be overwritten, that's OK.
    })
  }
  // If this is a Hyperdrive.promise instance, get the inner drive.
  if (drive.drive) drive = drive.drive
  drive.on('mount', mountListener)
  drive.once('close', () => drive.removeListener('mount', mountListener))
}
