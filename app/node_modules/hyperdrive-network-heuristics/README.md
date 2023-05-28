# hyperdrive-network-heuristics
Networking heuristics for announcing Hyperdrives on Hyperswarm

These heuristics are used in the [`hyperdrive-daemon-client`](https://github.com/hyperspace-org/hyperdrive-daemon-client) and [`@hyperspace/hyperdrive`](https://github.com/hyperspace-org/hyperdrive-service).

### Usage
There's only one exported method, which is used to enable the networking heuristics:

#### `applyHeuristics(drive, networker)`

Applies networking heuristics to a drive.

- `drive`: A Hyperdrive instance
- `networker`: A `@corestore/networker` or Hyperspace `RemoteNetworker`

### License
MIT
