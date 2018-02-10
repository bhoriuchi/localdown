# localdown
A localStorage implementation of the LevelDOWN API

### About

**LocalDOWN** is a drop-in replacement for [`LevelDOWN`](https://github.com/Level/leveldown) that uses [`node-localstorage`](https://github.com/lmaccherone/node-localstorage) to persist changes.

#### Example (ES6)

```js
import localdown from 'localdown'

let db = localdown('/path/to/store/file')

db.open((error) => {
  db.put('1', 'one', (error) => {
    db.get('one', { asBuffer: false }, (error, value) => {
      console.log(value)
      // > one
      db.close((error) => {
        // ...
      })
    })
  })
})
```

### Constructor

#### `localdown(location[,quota])`

* location - file path
* quota - storage quota, optional
