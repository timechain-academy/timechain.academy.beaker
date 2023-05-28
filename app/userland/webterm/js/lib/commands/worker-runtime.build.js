(function () {// globals
// =

var requestIdCounter = 0;
var reqPromises = {};

// exported api
// = 

function importAPI (manifest) {
  self.addEventListener('message', onMessage);
  return createApi(manifest)
}

function exportAPI (api) {
  self.addEventListener('message', async (e) => {
    var [msgType, id, path, args] = e.data;
    args = args ? JSON.parse(args) : [];
    if (msgType === 'async-call') {
      var method = lookup(api, path.split('.'));
      if (!method) {
        return reply(id, new Error(`Method ${path} not found`))
      }
      if (typeof method !== 'function') {
        return reply(id, new Error(`${path} is not a function`))
      }
      try {
        var res = await method(...args);
        reply(id, null, res);
      } catch (e) {
        reply(id, e);
      }
    }
  });
}

// internal
// =

function reply (id, err, res) {
  self.postMessage(['async-reply', id, err, res ? JSON.stringify(res) : undefined]);
}

function lookup (api, pathArr) {
  for (let key of pathArr) {
    if (!api[key]) return
    api = api[key];
  }
  return api
}

function onMessage (e) {
  var [msgType, id, err, res] = e.data;
  if (msgType === 'async-reply') {
    onAsyncReply(id, err, res ? JSON.parse(res) : undefined);
  }
}

function onAsyncReply (id, err, res) {
  var reqPromise = reqPromises[id];
  if (!reqPromise) {
    return console.warn('Received response for inactive request', id)
  }
  delete reqPromises[id];
  if (err) reqPromise.reject(err);
  else reqPromise.resolve(res);
}

function createApi (manifest, path = '') {
  var api = {};
  for (let k in manifest) {
    if (typeof manifest[k] === 'object') {
      api[k] = createApi(manifest[k], path + k + '.');
    } else if (manifest[k] === 'promise') {
      api[k] = createAsyncMethod(path + k);
    }
  }
  return api
}

function createAsyncMethod (path) {
  return function (...args) {
    let id = requestIdCounter++;
    self.postMessage(['async-call', id, path, args ? JSON.stringify(args) : undefined]);
    return new Promise((resolve, reject) => {
      reqPromises[id] = {resolve, reject};
    })
  }
}

var workerctxManifest = {
  env: {
    getAll: 'promise',
    get: 'promise',
    set: 'promise',
    goto: 'promise',
    focus: 'promise',
    resolve: 'promise',
    clearHistory: 'promise',
    reload: 'promise',
    close: 'promise'
  },
  page: {
    goto: 'promise',
    refresh: 'promise',
    focus: 'promise',
    exec: 'promise',
    inject: 'promise',
    uninject: 'promise'
  },
  panel: {
    open: 'promise',
    close: 'promise',
    focus: 'promise',
    goto: 'promise'
  },
  out: 'promise',
  prompt: 'promise'
};

var hyperdriveManifest = {
  loadDrive: 'promise',
  createDrive: 'promise',
  forkDrive: 'promise',

  getInfo: 'promise',
  configure: 'promise',
  diff: 'promise',

  stat: 'promise',
  readFile: 'promise',
  writeFile: 'promise',
  unlink: 'promise',
  copy: 'promise',
  rename: 'promise',
  updateMetadata: 'promise',
  deleteMetadata: 'promise',

  readdir: 'promise',
  mkdir: 'promise',
  rmdir: 'promise',

  symlink: 'promise',

  mount: 'promise',
  unmount: 'promise',

  query: 'promise',

  watch: 'readable',
  createNetworkActivityStream: 'readable',

  resolveName: 'promise',

  beakerDiff: 'promise',
  beakerMerge: 'promise',
  importFromFilesystem: 'promise',
  exportToFilesystem: 'promise',
  exportToDrive: 'promise'
};

const isNode = typeof window === 'undefined' && typeof self === 'undefined';
const parse = isNode ? require('url').parse : browserParse;

const SCHEME_REGEX = /[a-z]+:\/\//i;
//                   1          2      3        4
const VERSION_REGEX = /^(hyper:\/\/)?([^/]+)(\+[^/]+)(.*)$/i;
function parseDriveUrl (str, parseQS) {
  // prepend the scheme if it's missing
  if (!SCHEME_REGEX.test(str)) {
    str = 'hyper://' + str;
  }

  var parsed, version = null, match = VERSION_REGEX.exec(str);
  if (match) {
    // run typical parse with version segment removed
    parsed = parse((match[1] || '') + (match[2] || '') + (match[4] || ''), parseQS);
    version = match[3].slice(1);
  } else {
    parsed = parse(str, parseQS);
  }
  if (isNode) parsed.href = str; // overwrite href to include actual original
  else parsed.path = parsed.pathname; // to match node
  if (!parsed.query && parsed.searchParams) {
    parsed.query = Object.fromEntries(parsed.searchParams); // to match node
  }
  parsed.version = version; // add version segment
  if (!parsed.origin) parsed.origin = `hyper://${parsed.hostname}/`;
  return parsed
}

function browserParse (str) {
  return new URL(str)
}

// http://man7.org/linux/man-pages/man2/stat.2.html
// mirrored from hyperdrive/lib/stat.js

function toHex (buf) {
  return buf.reduce((memo, i) => (
    memo + ('0' + i.toString(16)).slice(-2) // pad with leading 0 if <16
  ), '')
}

const IFSOCK = 49152; // 0b1100...
const IFLNK = 40960; // 0b1010...
const IFREG = 32768; // 0b1000...
const IFBLK = 24576; // 0b0110...
const IFDIR = 16384; // 0b0100...
const IFCHR = 8192; // 0b0010...
const IFIFO = 4096; // 0b0001...

function createStat (data) {
  /*
  TODO- are the following attrs needed?
  this.dev = 0
  this.nlink = 1
  this.rdev = 0
  this.blksize = 0
  this.ino = 0
  this.uid = data ? data.uid : 0
  this.gid = data ? data.gid : 0 */

  var mode = data ? data.mode : 0;
  return {
    mode,
    size: data ? data.size : 0,
    offset: data ? data.offset : 0,
    blocks: data ? data.blocks : 0,
    downloaded: data ? data.downloaded : 0,
    atime: new Date(data ? data.mtime : 0), // we just set this to mtime ...
    mtime: new Date(data ? data.mtime : 0),
    ctime: new Date(data ? data.ctime : 0),
    mount: data && data.mount && data.mount.key ? {key: toHex(data.mount.key)} : null,
    linkname: data ? data.linkname : null,
    metadata: data ? data.metadata : {},

    isSocket: check(mode, IFSOCK),
    isSymbolicLink: check(mode, IFLNK),
    isFile: check(mode, IFREG),
    isBlockDevice: check(mode, IFBLK),
    isDirectory: check(mode, IFDIR),
    isCharacterDevice: check(mode, IFCHR),
    isFIFO: check(mode, IFIFO)
  }
}

function check (mode, mask) {
  return function () {
    return (mask & mode) === mask
  }
}

const isDriveUrlRe = /^(hyper:\/\/)?[^\/]+/i;

// exported api
// =

function createBeakerApi (rpcApi) {
  return {
    hyperdrive: Object.assign(
      rpcApi.hyperdrive,
      {
        drive (url) {
          return createScopedAPI(rpcApi.hyperdrive, url)
        }
      }
    )
  }
}

// internal
// =

function massageHyperUrl (url) {
  if (!url) url = '/';
  if (typeof url !== 'string') {
    if (typeof url.url === 'string') {
      // passed in another drive instance
      url = url.url;
    } else if (typeof url.href === 'string') {
      // passed in window.location
      url = url.href;
    } else {
      throw new Error('Invalid hyper:// URL')
    }
  }
  if (location.protocol === 'hyper:') {
    if (!isDriveUrlRe.test(url)) {
      url = joinPath('hyper://' + location.hostname, url);
    }
  } else if (!url.startsWith('hyper://')) {
    // didnt include the scheme
    url = 'hyper://' + url;
  }
  if (!isDriveUrlRe.test(url)) {
    // whoops not a valid hyper:// url
    throw new Error('Invalid URL: must be a hyper:// URL')
  }
  return url
}

function joinPath (a = '', b = '') {
[a, b] = [String(a), String(b)];
  var [aSlash, bSlash] = [a.endsWith('/'), b.startsWith('/')];
  if (!aSlash && !bSlash) return a + '/' + b
  if (aSlash && bSlash) return a + b.slice(1)
  return a + b
}

function createScopedAPI (hyperdriveRPC, url) {
  url = massageHyperUrl(url);
  const urlParsed = parseDriveUrl(url);
  url = 'hyper://' + urlParsed.hostname + (urlParsed.version ? `+${urlParsed.version}` : '') + '/';

  return {
    get url () { return url },
    get version () { return urlParsed.version },

    async getInfo (opts = {}) {
      return hyperdriveRPC.getInfo(url, opts)
    },

    async configure (info, opts = {}) {
      return hyperdriveRPC.configure(url, info, opts)
    },

    checkout (version) {
      version = version ? `+${version}` : '';
      return createScopedAPI(`hyper://${urlParsed.hostname}${version}/`)
    },

    async diff (prefix, other, opts = {}) {
      other = other && typeof other === 'object' && other.version ? other.version : other;
      var res = await hyperdriveRPC.diff(joinPath(url, prefix), other, prefix, opts);
      for (let change of res) {
        if (change.value.stat) {
          change.value.stat = createStat(change.value.stat);
        }
      }
      return res
    },

    async stat (path, opts = {}) {
      return createStat(await hyperdriveRPC.stat(joinPath(url, path), opts))
    },

    async readFile (path, opts = {}) {
      return hyperdriveRPC.readFile(joinPath(url, path), opts)
    },

    async writeFile (path, data, opts = {}) {
      return hyperdriveRPC.writeFile(joinPath(url, path), data, opts)
    },

    async unlink (path, opts = {}) {
      return hyperdriveRPC.unlink(joinPath(url, path), opts)
    },

    async copy (path, dstPath, opts = {}) {
      return hyperdriveRPC.copy(joinPath(url, path), dstPath, opts)
    },

    async rename (path, dstPath, opts = {}) {
      return hyperdriveRPC.rename(joinPath(url, path), dstPath, opts)
    },

    async updateMetadata (path, metadata, opts = {}) {
      return hyperdriveRPC.updateMetadata(joinPath(url, path), metadata, opts)
    },

    async deleteMetadata (path, keys, opts = {}) {
      return hyperdriveRPC.deleteMetadata(joinPath(url, path), keys, opts)
    },

    async readdir (path = '/', opts = {}) {
      var names = await hyperdriveRPC.readdir(joinPath(url, path), opts);
      if (opts.includeStats) {
        names.forEach(name => { name.stat = createStat(name.stat); });
      }
      return names
    },

    async mkdir (path, opts = {}) {
      return hyperdriveRPC.mkdir(joinPath(url, path), opts)
    },

    async rmdir (path, opts = {}) {
      return hyperdriveRPC.rmdir(joinPath(url, path), opts)
    },

    async symlink (path, linkname, opts = {}) {
      return hyperdriveRPC.symlink(joinPath(url, path), linkname, opts)
    },

    async mount (path, opts = {}) {
      if (opts.url) opts = opts.url;
      return hyperdriveRPC.mount(joinPath(url, path), opts)
    },

    async unmount (path, opts = {}) {
      return hyperdriveRPC.unmount(joinPath(url, path), opts)
    },

    async query (opts) {
      if (typeof opts === 'string') {
        opts = {path: [opts]};
      }
      opts.drive = [url];
      var res = await hyperdriveRPC.query(opts);
      res.forEach(item => {
        if (item.stat) item.stat = createStat(item.stat);
      });
      return res
    },

    watch (pathSpec = null, onChanged = null) {
      throw new Error('todo')
      // // usage: (onChanged)
      // if (typeof pathSpec === 'function') {
      //   onChanged = pathSpec
      //   pathSpec = null
      // }
      // var evts = fromEventStream(hyperdriveRPC.watch(url, pathSpec))
      // if (onChanged) {
      //   evts.addEventListener('changed', onChanged)
      // }
      // return evts
    }
  }
}

var cmdModule;
var api;

api = importAPI({
  ready: 'promise',
  workerctx: workerctxManifest,
  hyperdrive: hyperdriveManifest
});
self.beaker = createBeakerApi(api);

exportAPI({
  async load (url) {
    cmdModule = await import(url);
  },
  
  async callCommand (cmdPath, args = []) {
    try {
      var cmdPathParts = cmdPath.split('.'); 
      var cmdMethod = cmdModule;
      for (let part of cmdPathParts) {
        cmdMethod = cmdMethod[part];
      }
      return cmdMethod.call(api.workerctx, ...args)
    } catch (e) {
      if (e.name === 'TypeError' && e.message.includes('cmdMethod')) {
        throw new Error(`${cmdPath} is not a function`)
      } else {
        throw e
      }
    }
  }
});

api.ready();

}());