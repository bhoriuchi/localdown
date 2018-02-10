'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var LocalStorage = _interopDefault(require('node-localstorage'));
var util = _interopDefault(require('util'));
var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));
var abstractLeveldown = require('abstract-leveldown');

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();









var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

/**
 * LocalDOWN
 * @description A localStorage implementation of the LevelDOWN API
 * @author Branden Horiuchi <bhoriuchi@gmail.com>
 */
// property values
var PUT_OPERATION = 'put';
var DEL_OPERATION = 'del';

// Error messages
var ERR_INVALID_BATCH_OP = 'Invalid batch operation. Valid operations are "put" and "del"';
var ERR_INVALID_PARAM = 'Invalid parameter %s must be type %s with valid value';
var ERR_FILE_EXISTS = 'FileExists';
var ERR_REQUIRES_CALLBACK = '%s() requires a callback argument';

/**
 * Gets an error object, for rethinkdb errors use the msg field
 * @param error
 * @return {Error}
 */
function DOWNError(error) {
  if (error instanceof Error) {
    return error.msg ? new Error(error.msg) : error;
  } else if ((typeof error === 'undefined' ? 'undefined' : _typeof(error)) === 'object') {
    try {
      return new Error(JSON.stringify(error));
    } catch (err) {
      return new Error(String(error));
    }
  }
  return new Error(String(error));
}

/**
 * Ensures that the value is a buffer or string
 * @param value
 * @param ensureBuffer
 * @return {Buffer}
 */
function asBuffer(value) {
  var ensureBuffer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

  return ensureBuffer && !Buffer.isBuffer(value) ? new Buffer(value) : Buffer.isBuffer(value) ? value.toString() : value;
}

/**
 * finds the first index in an array the fn returns true for
 * @param array
 * @param fn
 * @returns {*}
 */
function findIndex(array, fn) {
  var defaultValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

  var idx = 0;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = array[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var value = _step.value;

      if (fn(value, idx)) return idx;
      idx++;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return defaultValue;
}

function $gte(array, value, defaultValue) {
  return findIndex(array, function (v) {
    return v >= value;
  }, defaultValue);
}
function $gt(array, value, defaultValue) {
  return findIndex(array, function (v) {
    return v > value;
  }, defaultValue);
}
function $lte(array, value, defaultValue) {
  return findIndex(array, function (v) {
    return v <= value;
  }, defaultValue);
}
function $lt(array, value, defaultValue) {
  return findIndex(array, function (v) {
    return v < value;
  }, defaultValue);
}

/**
 * Chained Batch class
 * @extends AbstractChainedBatch
 */

var LocalChainedBatch = function (_AbstractChainedBatch) {
  inherits(LocalChainedBatch, _AbstractChainedBatch);

  /**
   * Creates a new LocalChainedBatch
   * @param {object} db - localdown instance
   */
  function LocalChainedBatch(db) {
    classCallCheck(this, LocalChainedBatch);
    return possibleConstructorReturn(this, (LocalChainedBatch.__proto__ || Object.getPrototypeOf(LocalChainedBatch)).call(this, db));
  }

  return LocalChainedBatch;
}(abstractLeveldown.AbstractChainedBatch);

/**
 * local Iterator
 * @extends AbstractIterator
 */


var LocalIterator = function (_AbstractIterator) {
  inherits(LocalIterator, _AbstractIterator);

  /**
   * Creates a new Iterator
   * @param {object} db - LocalDOWN instance
   * @param {object} [options]
   */
  function LocalIterator(db) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    classCallCheck(this, LocalIterator);

    var _this2 = possibleConstructorReturn(this, (LocalIterator.__proto__ || Object.getPrototypeOf(LocalIterator)).call(this, db));

    _this2.$keys = db.$keys.sort();

    var gt = options.gt,
        gte = options.gte,
        lt = options.lt,
        lte = options.lte,
        start = options.start,
        end = options.end,
        reverse = options.reverse,
        keys = options.keys,
        values = options.values,
        limit = options.limit,
        keyAsBuffer = options.keyAsBuffer,
        valueAsBuffer = options.valueAsBuffer;

    _this2._keyAsBuffer = keyAsBuffer !== false;
    _this2._valueAsBuffer = valueAsBuffer !== false;
    _this2.$reverse = reverse;
    _this2.$iterations = 0;

    // init start and end
    _this2[reverse ? '$end' : '$start'] = 0;
    _this2[reverse ? '$start' : '$end'] = _this2.$keys.length - 1;

    if (reverse) {
      _this2.$start = start ? $lte(_this2.$keys, start, _this2.$start) : _this2.$start;
      _this2.$end = end ? $gte(_this2.$keys, end, _this2.$end) : _this2.$end;
      _this2.$start = gt ? $lt(_this2.$keys, gt, _this2.$start) : _this2.$start;
      _this2.$start = gte ? $lte(_this2.$keys, gte, _this2.$start) : _this2.$start;
      _this2.$end = lt ? $gt(_this2.$keys, lt, _this2.$end) : _this2.$end;
      _this2.$end = lte ? $gte(_this2.$keys, lte, _this2.$end) : _this2.$end;
    } else {
      _this2.$start = start ? $gte(_this2.$keys, start, _this2.$start) : _this2.$start;
      _this2.$end = end ? $lte(_this2.$keys, end, _this2.$end) : _this2.$end;
      _this2.$start = gt ? $gt(_this2.$keys, gt, _this2.$start) : _this2.$start;
      _this2.$start = gte ? $gte(_this2.$keys, gte, _this2.$start) : _this2.$start;
      _this2.$end = lt ? $lt(_this2.$keys, lt, _this2.$end) : _this2.$end;
      _this2.$end = lte ? $lte(_this2.$keys, lte, _this2.$end) : _this2.$end;
    }

    // set limit
    _this2.$limit = typeof limit === 'number' && limit >= 0 ? limit : null;
    _this2.$current = _this2.$start;
    return _this2;
  }

  /**
   * Gets the next key in the iterator results
   * @callback callback
   * @return {*}
   * @private
   */


  createClass(LocalIterator, [{
    key: '_next',
    value: function _next(callback) {
      try {
        // check limits
        if (this.$limit && this.$iterations > this.$limit) return callback();
        if (this.$reverse && this.$current < this.$end) return callback();
        if (!this.$reverse && this.$current > this.$end) return callback();

        // get/convert key and value
        var key = asBuffer(this.$keys[this.$current], this._keyAsBuffer);
        var value = asBuffer(this.db.$store.getItem(key), this._valueAsBuffer);

        // increment the current and iterations counters
        this.$current = this.$reverse ? this.$current - 1 : this.$current + 1;
        this.$iterations += 1;

        return callback(null, key, value);
      } catch (error) {
        return callback(DOWNError(error));
      }
    }

    /**
     * symbolic
     * @callback callback
     * @private
     */

  }, {
    key: '_end',
    value: function _end(callback) {
      return callback();
    }

    // not implemented in abstract?

  }, {
    key: 'seek',
    value: function seek(key) {
      throw DOWNError('seek is not implemented');
    }
  }]);
  return LocalIterator;
}(abstractLeveldown.AbstractIterator);

var LocalDOWN = function (_AbstractLevelDOWN) {
  inherits(LocalDOWN, _AbstractLevelDOWN);

  function LocalDOWN(location, quota) {
    classCallCheck(this, LocalDOWN);

    var _this3 = possibleConstructorReturn(this, (LocalDOWN.__proto__ || Object.getPrototypeOf(LocalDOWN)).call(this, path.resolve(location)));

    _this3.quota = quota;

    // validate that the location is a string and replace any invalid characters with _
    if (typeof location !== 'string') throw DOWNError(util.format(ERR_INVALID_PARAM, 'location', 'String'));
    return _this3;
  }

  /**
   * gets all keys in the current store
   * @returns {Array}
   */


  createClass(LocalDOWN, [{
    key: '_open',


    /**
     * opens a database connection and optionally creates the database and/or table
     * @param {object} [options]
     * @callback callback
     * @returns {*}
     * @private
     */
    value: function _open(options, callback) {
      var _this4 = this;

      try {
        // support some of the open options
        var errorIfExists = options.errorIfExists;


        errorIfExists = typeof errorIfExists === 'boolean' ? errorIfExists : false;

        return fs.stat(this.location, function (error) {
          if (!error && errorIfExists) return callback(DOWNError(ERR_FILE_EXISTS));
          _this4.$store = new LocalStorage.LocalStorage(_this4.location, _this4.quota);
          return callback();
        });
      } catch (error) {
        return callback(DOWNError(error));
      }
    }

    /**
     * close
     * @callback callback
     * @returns {*}
     * @private
     */

  }, {
    key: '_close',
    value: function _close(callback) {
      return callback();
    }

    /**
     * gets a value by key
     * @param {string|buffer} key
     * @param {object} [options]
     * @callback callback
     * @return {*}
     * @private
     */

  }, {
    key: '_get',
    value: function _get(key, options, callback) {
      try {
        return callback(null, asBuffer(this.$store.getItem(key), options.asBuffer !== false));
      } catch (error) {
        return callback(DOWNError(error));
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

  }, {
    key: '_put',
    value: function _put(key, value, options, callback) {
      try {
        this.$store.setItem(key, value);
        return callback();
      } catch (error) {
        return callback(DOWNError(error));
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

  }, {
    key: '_del',
    value: function _del(key, options, callback) {
      try {
        this.$store.removeItem(key);
        return callback();
      } catch (error) {
        return callback(DOWNError(error));
      }
    }

    /**
     * Performs batch operations of put and/or delete
     * @param {array} operations
     * @param {object} [options]
     * @callback callback
     * @private
     */

  }, {
    key: '_batch',
    value: function _batch(operations, options, callback) {
      try {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = operations[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var operation = _step2.value;
            var type = operation.type,
                key = operation.key,
                value = operation.value;

            // determine the operation type and create an operation object

            switch (type) {
              case PUT_OPERATION:
                // coerce the value into a valid value
                value = this._serializeValue(value);
                this.$store.setItem(key, value);
                break;

              case DEL_OPERATION:
                this.$store.removeItem(key);
                break;

              default:
                return callback(DOWNError(ERR_INVALID_BATCH_OP));
            }
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        return callback();
      } catch (error) {
        return callback(DOWNError(error));
      }
    }

    /**
     * Returns a new chained batch
     * @return {LocalChainedBatch}
     * @private
     */

  }, {
    key: '_chainedBatch',
    value: function _chainedBatch() {
      return new LocalChainedBatch(this);
    }

    /**
     * Gets count of records, doesnt really apply/work with rethinkdb
     * @param {string|buffer} start
     * @param {string|buffer} end
     * @callback callback
     * @return {number}
     * @private
     */

  }, {
    key: '_approximateSize',
    value: function _approximateSize(start, end, callback) {
      var keys = this.$keys;
      var _start = $gte(keys, start, 0);
      var _end = $lte(keys, end, keys.length);
      return callback(null, Math.abs(_end - _start));
    }

    /**
     * Returns a new iterator
     * @param options
     * @return {LocalIterator}
     * @private
     */

  }, {
    key: '_iterator',
    value: function _iterator(options) {
      return new LocalIterator(this, options);
    }
  }, {
    key: '$keys',
    get: function get$$1() {
      var keys = [];
      for (var i = 0; i < this.$store.length; i++) {
        keys.push(this.$store.key(i));
      }
      return keys;
    }
  }]);
  return LocalDOWN;
}(abstractLeveldown.AbstractLevelDOWN);

/**
 * creates a new LocalDOWN instance
 * @param location
 * @returns {LocalDOWN}
 * @constructor
 */


function DOWN(location) {
  return new LocalDOWN(location);
}

/**
 * Destroys the file specified by the location
 * @param {string} location - connection string
 * @callback callback
 * @return {*}
 */
DOWN.destroy = function (location, callback) {
  if (typeof callback !== 'function') throw DOWNError(util.format(ERR_REQUIRES_CALLBACK, 'destroy'));
  if (typeof location !== 'string') throw DOWNError(util.format(ERR_INVALID_PARAM, 'db', 'String'));
  try {
    return fs.unlink(path.resolve(location), callback);
  } catch (error) {
    return callback(DOWNError(error));
  }
};

DOWN.repair = function (location, callback) {
  if (typeof callback !== 'function') throw DOWNError(util.format(ERR_REQUIRES_CALLBACK, 'repair'));
  return callback(DOWNError('repair not implemented'));
};

module.exports = DOWN;
