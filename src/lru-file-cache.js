'use strict'

const Client = require('./client')

class LruFileCache {
  static async open (dir, options = {}) {
    const client = new Client(dir, {
      capacities: options.capacities || 1 * 1024 * 1024,
    })

    await client.init()

    return client
  }
}

module.exports = LruFileCache
