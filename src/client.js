'use strict'

const fs = require('fs-extra')
const path = require('path')
const filenamify = require('filenamify')

class Client {
  constructor (dir, options = {}) {
    this._dir = path.resolve(dir, 'cache')
    this._capacities = options.capacities
    this._totalUsedSize = 0
  }

  _cacheFilePath (name) {
    return path.resolve(this._dir, filenamify(name))
  }

  _ensureCacheDir () {
    return (
      /* TODO: JSFIX could not patch the breaking change:
      Creating a directory with fs-extra no longer returns the path 
      Suggested fix: The returned promise no longer includes the path of the new directory */
      fs.mkdirp(this._dir)
    )
  }

  async _readdirWithStats () {
    const files = await fs.readdir(this._dir)

    return Promise.all(
      files.map(async file => ({
        name: file,
        stats: await fs.stat(this._cacheFilePath(file)),
      })))
  }

  _updateMetadata (files) {
    this._totalUsedSize = files.reduce((acc, file) => acc + file.stats.size, 0)
  }

  async init () {
    await this._ensureCacheDir()
    this._updateMetadata(await this._readdirWithStats())
  }

  async get (key) {
    return fs.readJson(this._cacheFilePath(key))
  }

  async set (key, value) {
    const data = JSON.stringify(value)
    await fs.writeFile(this._cacheFilePath(key), data)
    this._totalUsedSize += data.length
    await this.purgeStaleData()
  }

  async update (key, fn) {
    await this.set(key, fn(await fs.readJson(this._cacheFilePath(key))))
  }

  async remove (key) {
    const filePath = this._cacheFilePath(key)
    try {
      const file = await fs.stat(filePath)
      await fs.remove(filePath)
      this._totalUsedSize -= file.size
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }
  }

  async removeAll () {
    await fs.remove(this._dir)
    return this.init()
  }

  keys () {
    return fs.readdir(this._dir)
  }

  has (key) {
    return fs.exists(this._cacheFilePath(key))
  }

  async purgeStaleData () {
    if (this._totalUsedSize <= this._capacities) {
      return
    }

    const files = await this._readdirWithStats()
    this._updateMetadata(files)
    files.sort((a, b) => a.stats.atimeMs - b.stats.atimeMs)

    while (files.length && this._totalUsedSize > this._capacities) {
      const file = files.shift()
      await fs.remove(this._cacheFilePath(file.name))
      this._totalUsedSize -= file.stats.size
    }
  }

  async info () {
    this._updateMetadata(await this._readdirWithStats())
    return {
      size: this._totalUsedSize,
      capacities: this._capacities,
    }
  }
}

module.exports = Client
