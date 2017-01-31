/**
 * LocalDOWN
 * @description A localStorage implementation of the LevelDOWN API
 * @author Branden Horiuchi <bhoriuchi@gmail.com>
 */
import LocalStorage from 'node-localstorage'
import util from 'util'
import fs from 'fs'
import path from 'path'
import {
  AbstractLevelDOWN,
  AbstractIterator,
  AbstractChainedBatch
} from 'abstract-leveldown'

// property values
const PUT_OPERATION = 'put'
const DEL_OPERATION = 'del'

// Error messages
const ERR_INVALID_BATCH_OP = 'Invalid batch operation. Valid operations are "put" and "del"'
const ERR_INVALID_PARAM = 'Invalid parameter %s must be type %s with valid value'
const ERR_FILE_EXISTS = 'FileExists'
const ERR_REQUIRES_CALLBACK = '%s() requires a callback argument'

/**
 * Gets an error object, for rethinkdb errors use the msg field
 * @param error
 * @return {Error}
 */
function DOWNError (error) {
  if (error instanceof Error) {
    return error.msg
      ? new Error(error.msg)
      : error
  } else if (typeof error === 'object') {
    try {
      return new Error(JSON.stringify(error))
    } catch (err) {
      return new Error(String(error))
    }
  }
  return new Error(String(error))
}

/**
 * Ensures that the value is a buffer or string
 * @param value
 * @param ensureBuffer
 * @return {Buffer}
 */
function asBuffer(value, ensureBuffer = true) {
  return (ensureBuffer && !Buffer.isBuffer(value))
    ? new Buffer(value)
    : Buffer.isBuffer(value )
    ? value.toString()
    : value
}

/**
 * finds the first index in an array the fn returns true for
 * @param array
 * @param fn
 * @returns {*}
 */
function findIndex (array, fn, defaultValue = null) {
  let idx = 0
  for (const value of array) {
    if (fn(value, idx)) return idx
    idx++
  }
  return defaultValue
}

function $gte (array, value, defaultValue) {
  return findIndex(array, v => v >= value, defaultValue)
}
function $gt (array, value, defaultValue) {
  return findIndex(array, v => v > value, defaultValue)
}
function $lte (array, value, defaultValue) {
  return findIndex(array, v => v <= value, defaultValue)
}
function $lt (array, value, defaultValue) {
  return findIndex(array, v => v < value, defaultValue)
}

/**
 * Chained Batch class
 * @extends AbstractChainedBatch
 */
class LocalChainedBatch extends AbstractChainedBatch {
  /**
   * Creates a new LocalChainedBatch
   * @param {object} db - localdown instance
   */
  constructor (db) {
    super(db)
  }
}

/**
 * local Iterator
 * @extends AbstractIterator
 */
class LocalIterator extends AbstractIterator {
  /**
   * Creates a new Iterator
   * @param {object} db - LocalDOWN instance
   * @param {object} [options]
   */
  constructor (db, options = {}) {
    super(db)
    this.$keys = db.$keys.sort()

    let { gt, gte, lt, lte, start, end, reverse, keys, values, limit, keyAsBuffer, valueAsBuffer } = options
    this._keyAsBuffer = keyAsBuffer !== false
    this._valueAsBuffer = valueAsBuffer !== false
    this.$reverse = reverse
    this.$iterations = 0

    // init start and end
    this[reverse ? '$end' : '$start'] = 0
    this[reverse ? '$start' : '$end'] = this.$keys.length - 1

    if (reverse) {
      this.$start = start ? $lte(this.$keys, start, this.$start) : this.$start
      this.$end = end ? $gte(this.$keys, end, this.$end) : this.$end
      this.$start = gt ? $lt(this.$keys, gt, this.$start) : this.$start
      this.$start = gte ? $lte(this.$keys, gte, this.$start) : this.$start
      this.$end = lt ? $gt(this.$keys, lt, this.$end) : this.$end
      this.$end = lte ? $gte(this.$keys, lte, this.$end) : this.$end
    } else {
      this.$start = start ? $gte(this.$keys, start, this.$start) : this.$start
      this.$end = end ? $lte(this.$keys, end, this.$end) : this.$end
      this.$start = gt ? $gt(this.$keys, gt, this.$start) : this.$start
      this.$start = gte ? $gte(this.$keys, gte, this.$start) : this.$start
      this.$end = lt ? $lt(this.$keys, lt, this.$end) : this.$end
      this.$end = lte ? $lte(this.$keys, lte, this.$end) : this.$end
    }

    // set limit
    this.$limit = (typeof limit === 'number' && limit >= 0) ? limit : null
    this.$current = this.$start
  }

  /**
   * Gets the next key in the iterator results
   * @callback callback
   * @return {*}
   * @private
   */
  _next (callback) {
    try {
      // check limits
      if (this.$limit && this.$iterations > this.$limit) return callback()
      if (this.$reverse && this.$current < this.$end) return callback()
      if (!this.$reverse && this.$current > this.$end) return callback()

      // get/convert key and value
      let key = asBuffer(this.$keys[this.$current], this._keyAsBuffer)
      let value = asBuffer(this.db.$store.getItem(key), this._valueAsBuffer)

      // increment the current and iterations counters
      this.$current = this.$reverse ? this.$current - 1 : this.$current + 1
      this.$iterations += 1

      return callback(null, key, value)
    } catch (error) {
      return callback(DOWNError(error))
    }
  }

  /**
   * symbolic
   * @callback callback
   * @private
   */
  _end (callback) {
    return callback()
  }

  // not implemented in abstract?
  seek (key) {
    throw DOWNError('seek is not implemented')
  }
}


class LocalDOWN extends AbstractLevelDOWN {
  constructor (location) {
    super(path.resolve(location))

    // validate that the location is a string and replace any invalid characters with _
    if (typeof location !== 'string') throw DOWNError(util.format(ERR_INVALID_PARAM, 'location', 'String'))
  }

  /**
   * gets all keys in the current store
   * @returns {Array}
   */
  get $keys () {
    let keys = []
    for (let i = 0; i < this.$store.length; i++) {
      keys.push(this.$store.key(i))
    }
    return keys
  }

  /**
   * opens a database connection and optionally creates the database and/or table
   * @param {object} [options]
   * @callback callback
   * @returns {*}
   * @private
   */
  _open (options, callback) {
    try {
      // support some of the open options
      let { errorIfExists } = options

      errorIfExists = typeof errorIfExists === 'boolean'
        ? errorIfExists
        : false

      return fs.stat(this.location, (error) => {
        if (!error && errorIfExists) return callback(DOWNError(ERR_FILE_EXISTS))
        this.$store = new LocalStorage.LocalStorage(this.location)
        return callback()
      })
    } catch (error) {
      return callback(DOWNError(error))
    }
  }

  /**
   * close
   * @callback callback
   * @returns {*}
   * @private
   */
  _close (callback) {
    return callback()
  }

  /**
   * gets a value by key
   * @param {string|buffer} key
   * @param {object} [options]
   * @callback callback
   * @return {*}
   * @private
   */
  _get (key, options, callback) {
    try {
      return callback(null, asBuffer(this.$store.getItem(key), options.asBuffer !== false))
    } catch (error) {
      return callback(DOWNError(error))
    }
  }

  /**
   * adds a value at a specific key
   * @param {string|buffer} key
   * @param {string|buffer} value
   * @param {object} [options]
   * @callback callback
   * @return {*}
   * @private
   */
  _put (key, value, options, callback) {
    try {
      this.$store.setItem(key, value)
      return callback()
    } catch (error) {
      return callback(DOWNError(error))
    }
  }

  /**
   * Deletes a key
   * @param {string|buffer} key
   * @param {object} [options]
   * @callback callback
   * @return {*}
   * @private
   */
  _del (key, options, callback) {
    try {
      this.$store.removeItem(key)
      return callback()
    } catch (error) {
      return callback(DOWNError(error))
    }
  }

  /**
   * Performs batch operations of put and/or delete
   * @param {array} operations
   * @param {object} [options]
   * @callback callback
   * @private
   */
  _batch (operations, options, callback) {
    try {
      for (const operation of operations) {
        let { type, key, value } = operation

        // determine the operation type and create an operation object
        switch (type) {
          case PUT_OPERATION:
            // coerce the value into a valid value
            value = this._serializeValue(value)
            this.$store.setItem(key, value)
            break

          case DEL_OPERATION:
            this.$store.removeItem(key)
            break

          default:
            return callback(DOWNError(ERR_INVALID_BATCH_OP))
        }
      }
      return callback()
    } catch (error) {
      return callback(DOWNError(error))
    }
  }

  /**
   * Returns a new chained batch
   * @return {LocalChainedBatch}
   * @private
   */
  _chainedBatch () {
    return new LocalChainedBatch(this)
  }

  /**
   * Gets count of records, doesnt really apply/work with rethinkdb
   * @param {string|buffer} start
   * @param {string|buffer} end
   * @callback callback
   * @return {number}
   * @private
   */
  _approximateSize (start, end, callback) {
    let keys = this.$keys
    let _start = $gte(keys, start, 0)
    let _end = $lte(keys, end, keys.length)
    return callback(null, Math.abs(_end - _start))
  }

  /**
   * Returns a new iterator
   * @param options
   * @return {LocalIterator}
   * @private
   */
  _iterator (options) {
    return new LocalIterator(this, options)
  }
}

/**
 * creates a new LocalDOWN instance
 * @param location
 * @returns {LocalDOWN}
 * @constructor
 */
function DOWN (location) {
  return new LocalDOWN(location)
}

/**
 * Destroys the file specified by the location
 * @param {string} location - connection string
 * @callback callback
 * @return {*}
 */
DOWN.destroy = (location, callback) => {
  if (typeof callback !== 'function') throw DOWNError(util.format(ERR_REQUIRES_CALLBACK, 'destroy'))
  if (typeof location !== 'string') throw DOWNError(util.format(ERR_INVALID_PARAM, 'db', 'String'))
  try {
    return fs.unlink(path.resolve(location), callback)
  } catch (error) {
    return callback(DOWNError(error))
  }
}

DOWN.repair = (location, callback) => {
  if (typeof callback !== 'function') throw DOWNError(util.format(ERR_REQUIRES_CALLBACK, 'repair'))
  return callback(DOWNError('repair not implemented'))
}

export default DOWN