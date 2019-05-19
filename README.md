# @range3/lru-file-cache

> A LRU cache storage persists on local files

## Install

```bash
$ yarn add @range3/lru-file-cache
```

## Usage

```js
const LruFileCache = require("@range3/lru-file-cache");

(async () => {
  cache = await LruFileCache.open("/tmp/my-lru-cache", {
    capacities: 1024 * 1024 // default 1MiB
  });

  await cache.set("key1", { hello: "LRU cahce" });
  await cache.set("key2", { hoge: 100 });
  await cache.set("key3", "val3");

  await cache.get("key1");

  await cache.keys()

  await cache.set('user1', {name: 'Ichiro', age: 10})
  await cache.update('key1', user => {
    user.age = 20
    return user
  })

  await cache.remove('key2')


})();
```

See also: ./test/
