const IGNORE_STRINGS = [
  'node_modules',
  '.git'
]
const SIZE_LIMIT = 1e6

module.exports = class Archiver {
  static VERSION = 1

  async process (user, drive, change) {
    for (const string of IGNORE_STRINGS) {
      if (change.name.search(string) !== -1) return []
    }
    let size = change.value && change.value.size
    if (!size || size > SIZE_LIMIT) return []
    // Reading the file will cache it on the indexer's hyperspace.
    await drive.promises.readFile(change.name)
    return []
  }
}
