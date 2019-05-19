const { assert } = require('chai')
const tmp = require('tmp-promise')
const LruFileCache = require('../src/lru-file-cache')
const Client = require('../src/client')

tmp.setGracefulCleanup()

describe('LruFileCache', () => {
  let tmpdir
  beforeEach(async () => {
    tmpdir = await tmp.dir({ unsafeCleanup: true })
  })

  afterEach(async () => {
    tmpdir.cleanup()
  })

  describe('open', () => {
    it('should return a Client object', async () => {
      const client = await LruFileCache.open(tmpdir.path)
      assert.instanceOf(client, Client)
    })
  })
})
