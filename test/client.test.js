const path = require('path')
const fs = require('fs-extra')
const { assert } = require('chai')
const tmp = require('tmp-promise')
const LruFileCache = require('../src/lru-file-cache')

tmp.setGracefulCleanup()

describe('Client', () => {
  let tmpdir
  let cache
  beforeEach(async () => {
    tmpdir = await tmp.dir({ unsafeCleanup: true })
    cache = await LruFileCache.open(tmpdir.path)
  })

  afterEach(async () => {
    tmpdir.cleanup()
  })

  it('should be reopenable', async () => {
    await cache.set('key', 100)

    const cache2 = await LruFileCache.open(tmpdir.path)

    assert.strictEqual(await cache2.get('key'), 100)
  })

  describe('_cacheFilePath', () => {
    it('should return a valid filepath', () => {
      assert.strictEqual(
        cache._cacheFilePath('<foo/bar>'),
        path.join(tmpdir.path, 'cache/foo!bar'))
    })
  })

  describe('set', () => {
    it('should make a cache file', async () => {
      await cache.set('hello', { world: 'lru-file-cache' })
      assert.isOk(await fs.pathExists(path.join(path.join(tmpdir.path, 'cache/hello'))))
    })
  })

  describe('get', () => {
    it('should get a object if the key exists', async () => {
      const value = { world: 'lru-file-cache' }
      await cache.set('hello', value)
      assert.deepStrictEqual(await cache.get('hello'), value)
    })
  })

  describe('update', () => {
    it('should be able to update a part of object', async () => {
      await cache.set('user1', { name: 'Taro', age: 23 })
      await cache.update('user1', user => {
        user.age = 40
        return user
      })
      assert.deepStrictEqual(await cache.get('user1'), {
        name: 'Taro',
        age: 40,
      })
    })
  })

  describe('remove', () => {
    it('should remove a cache', async () => {
      await cache.set('key', 'val')
      await cache.remove('key')
      assert.isFalse(await cache.has('key'))
    })

    it('should be successful if the cache does not exist', async () => {
      await cache.remove('key-does-not-exist')
    })
  })

  describe('keys', () => {
    it('should return a list of keys', async () => {
      await cache.set('key1', 'val1')
      await cache.set('key2', 'val2')
      await cache.set('key3', 'val3')
      await cache.set('key4', 'val4')

      const keys = await cache.keys()
      assert.sameMembers(keys, ['key1', 'key2', 'key3', 'key4'])
    })
  })

  describe('has', () => {
    it('should return true if the key exists', async () => {
      await cache.set('key', 'aaa')
      assert.isTrue(await cache.has('key'))
    })

    it('should return false if the key does not exist', async () => {
      await cache.set('key', 'aaa')
      assert.isFalse(await cache.has('aaaa'))
    })
  })

  describe('info', () => {
    it('should return information', async () => {
      await cache.set('key1', 'val1')
      await cache.set('key2', 'val2')
      await cache.set('key3', 'val3333333333333333333333')
      await cache.set('key4', 'val4')

      await cache.get('key4')

      console.log(await cache.info())
    })
  })

  describe('purgeStaleData', () => {
    it('should purge older data depend on atime', async () => {
      cache = await LruFileCache.open(tmpdir.path, { capacities: 10 })

      await cache.set('key1', '123')
      await new Promise(resolve => setTimeout(resolve, 100))
      await cache.set('key2', '123')
      assert.sameMembers(await cache.keys(), ['key1', 'key2'])
      await cache.set('key3', '123')
      assert.sameMembers(await cache.keys(), ['key2', 'key3'])
      await new Promise(resolve => setTimeout(resolve, 100))
      await cache.get('key2')
      await cache.set('key4', '123')
      assert.sameMembers(await cache.keys(), ['key2', 'key4'])
    })
  })
})
