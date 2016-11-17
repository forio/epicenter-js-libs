(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

function init () {
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i]
    revLookup[code.charCodeAt(i)] = i
  }

  revLookup['-'.charCodeAt(0)] = 62
  revLookup['_'.charCodeAt(0)] = 63
}

init()

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"base64-js":1,"ieee754":3,"isarray":4}],3:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],5:[function(require,module,exports){
'use strict';
/* eslint-disable no-unused-vars */
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (e) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (Object.getOwnPropertySymbols) {
			symbols = Object.getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],6:[function(require,module,exports){
module.exports={
    "version": "v2"
}

},{}],7:[function(require,module,exports){
(function (global){
/**
 * Epicenter Javascript libraries
 * v2.0.0
 * https://github.com/forio/epicenter-js-libs
 */

var F = {
    util: {},
    factory: {},
    transport: {},
    store: {},
    service: {},
    manager: {
        strategy: {}
    },

};

F.load = require('./env-load');
F.load();

F.util.query = require('./util/query-util');
F.util.run = require('./util/run-util');
F.util.classFrom = require('./util/inherit');

F.factory.Transport = require('./transport/http-transport-factory');
F.transport.Ajax = require('./transport/ajax-http-transport');

F.service.URL = require('./service/url-config-service');
F.service.Config = require('./service/configuration-service');
F.service.Run = require('./service/run-api-service');
F.service.File = require('./service/admin-file-service');
F.service.Variables = require('./service/variables-api-service');
F.service.Data = require('./service/data-api-service');
F.service.Auth = require('./service/auth-api-service');
F.service.World = require('./service/world-api-adapter');
F.service.State = require('./service/state-api-adapter');
F.service.User = require('./service/user-api-adapter');
F.service.Member = require('./service/member-api-adapter');
F.service.Asset = require('./service/asset-api-adapter');
F.service.Group = require('./service/group-api-service');
F.service.Introspect = require('./service/introspection-api-service');

F.store.Cookie = require('./store/cookie-store');
F.factory.Store = require('./store/store-factory');

F.manager.ScenarioManager = require('./managers/scenario-manager');
F.manager.RunManager = require('./managers/run-manager');
F.manager.AuthManager = require('./managers/auth-manager');
F.manager.WorldManager = require('./managers/world-manager');

F.manager.strategy['always-new'] = require('./managers/run-strategies/always-new-strategy');
F.manager.strategy['conditional-creation'] = require('./managers/run-strategies/conditional-creation-strategy');
F.manager.strategy.identity = require('./managers/run-strategies/identity-strategy');
F.manager.strategy['new-if-missing'] = require('./managers/run-strategies/new-if-missing-strategy');
F.manager.strategy['new-if-missing'] = require('./managers/run-strategies/new-if-missing-strategy');
F.manager.strategy['new-if-persisted'] = require('./managers/run-strategies/new-if-persisted-strategy');
F.manager.strategy['new-if-initialized'] = require('./managers/run-strategies/new-if-initialized-strategy');

F.manager.ChannelManager = require('./managers/epicenter-channel-manager');
F.service.Channel = require('./service/channel-service');

F.version = '2.0.0';
F.api = require('./api-version.json');

global.F = F;
module.exports = F;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./api-version.json":6,"./env-load":8,"./managers/auth-manager":9,"./managers/epicenter-channel-manager":11,"./managers/run-manager":13,"./managers/run-strategies/always-new-strategy":14,"./managers/run-strategies/conditional-creation-strategy":15,"./managers/run-strategies/identity-strategy":16,"./managers/run-strategies/new-if-initialized-strategy":18,"./managers/run-strategies/new-if-missing-strategy":19,"./managers/run-strategies/new-if-persisted-strategy":20,"./managers/scenario-manager":23,"./managers/world-manager":25,"./service/admin-file-service":26,"./service/asset-api-adapter":27,"./service/auth-api-service":28,"./service/channel-service":29,"./service/configuration-service":30,"./service/data-api-service":31,"./service/group-api-service":32,"./service/introspection-api-service":33,"./service/member-api-adapter":34,"./service/run-api-service":35,"./service/state-api-adapter":37,"./service/url-config-service":38,"./service/user-api-adapter":39,"./service/variables-api-service":40,"./service/world-api-adapter":41,"./store/cookie-store":42,"./store/store-factory":44,"./transport/ajax-http-transport":45,"./transport/http-transport-factory":46,"./util/inherit":47,"./util/query-util":50,"./util/run-util":51}],8:[function(require,module,exports){
'use strict';

var urlConfigService = require('./service/url-config-service');

var envLoad = function (callback) {
    var envPromise;
    var host;
    var urlService = urlConfigService();
    var envPath = '/epicenter/v1/config';
    if (urlService.isLocalhost()) {
        host = 'https://forio.com';
    } else {
        host = '';
    }
    var infoUrl = host + envPath;
    envPromise = $.ajax({ url: infoUrl, async: false });
    envPromise.then(function (res) {
        var overrides = res.api;
        urlConfigService.defaults = $.extend(urlConfigService.defaults, overrides);
    }).fail(function (res) {
        // Epicenter/webserver not properly configured
        // fallback to api.forio.com
        urlConfigService.defaults = $.extend(urlConfigService.defaults, { protocol: 'https', host: 'api.forio.com' });
    });
    return envPromise.then(callback).fail(callback);
};

module.exports = envLoad;

},{"./service/url-config-service":38}],9:[function(require,module,exports){
/**
* ## Authorization Manager
*
* The Authorization Manager provides an easy way to manage user authentication (logging in and out) and authorization (keeping track of tokens, sessions, and groups) for projects.
*
* The Authorization Manager is most useful for [team projects](../../../glossary/#team) with an access level of [Authenticated](../../../glossary/#access). These projects are accessed by [end users](../../../glossary/#users) who are members of one or more [groups](../../../glossary/#groups).
*
* #### Using the Authorization Manager
*
* To use the Authorization Manager, instantiate it. Then, make calls to any of the methods you need:
*
*       var authMgr = new F.manager.AuthManager({
*           account: 'acme-simulations',
*           userName: 'enduser1',
*           password: 'passw0rd'
*       });
*       authMgr.login().then(function () {
*           authMgr.getCurrentUserSessionInfo();
*       });
*
*
* The `options` object passed to the `F.manager.AuthManager()` call can include:
*
*   * `account`: The account id for this `userName`. In the Epicenter UI, this is the **Team ID** (for team projects) or the **User ID** (for personal projects).
*   * `userName`: Email or username to use for logging in.
*   * `password`: Password for specified `userName`.
*   * `project`: The **Project ID** for the project to log this user into. Optional.
*   * `groupId`: Id of the group to which `userName` belongs. Required for end users if the `project` is specified.
*
* If you prefer starting from a template, the Epicenter JS Libs [Login Component](../../#components) uses the Authorization Manager as well. This sample HTML page (and associated CSS and JS files) provides a login form for team members and end users of your project. It also includes a group selector for end users that are members of multiple groups.
*/

'use strict';
var AuthAdapter = require('../service/auth-api-service');
var MemberAdapter = require('../service/member-api-adapter');
var GroupService = require('../service/group-api-service');
var SessionManager = require('../store/session-manager');
var Buffer = require('buffer').Buffer;
var _pick = require('../util/object-util')._pick;
var objectAssign = require('object-assign');

var defaults = {
    requiresGroup: true
};

function AuthManager(options) {
    options = $.extend(true, {}, defaults, options);
    this.sessionManager = new SessionManager(options);
    this.options = this.sessionManager.getMergedOptions();

    this.authAdapter = new AuthAdapter(this.options);
}

var _findUserInGroup = function (members, id) {
    for (var j = 0; j < members.length; j++) {
        if (members[j].userId === id) {
            return members[j];
        }
    }
    return null;
};

AuthManager.prototype = $.extend(AuthManager.prototype, {

    /**
    * Logs user in.
    *
    * **Example**
    *
    *       authMgr.login({
    *           account: 'acme-simulations',
    *           project: 'supply-chain-game',
    *           userName: 'enduser1',
    *           password: 'passw0rd'
    *       })
    *           .then(function(statusObj) {
    *               // if enduser1 belongs to exactly one group
    *               // (or if the login() call is modified to include the group id)
    *               // continue here
    *           })
    *           .fail(function(statusObj) {
    *               // if enduser1 belongs to multiple groups,
    *               // the login() call fails
    *               // and returns all groups of which the user is a member
    *               for (var i=0; i < statusObj.userGroups.length; i++) {
    *                   console.log(statusObj.userGroups[i].name, statusObj.userGroups[i].groupId);
    *               }
    *           });
    *
    * **Parameters**
    *
    * @param {Object} options (Optional) Overrides for configuration options. If not passed in when creating an instance of the manager (`F.manager.AuthManager()`), these options should include:
    * @param {string} options.account The account id for this `userName`. In the Epicenter UI, this is the **Team ID** (for team projects) or the **User ID** (for personal projects).
    * @param {string} options.userName Email or username to use for logging in.
    * @param {string} options.password Password for specified `userName`.
    * @param {string} options.project (Optional) The **Project ID** for the project to log this user into.
    * @param {string} options.groupId The id of the group to which `userName` belongs. Required for [end users](../../../glossary/#users) if the `project` is specified and if the end users are members of multiple [groups](../../../glossary/#groups), otherwise optional.
    * @return {Promise}
    */
    login: function (options) {
        var me = this;
        var $d = $.Deferred();
        var sessionManager = this.sessionManager;
        var adapterOptions = sessionManager.getMergedOptions({ success: $.noop, error: $.noop }, options);
        var outSuccess = adapterOptions.success;
        var outError = adapterOptions.error;
        var groupId = adapterOptions.groupId;

        var decodeToken = function (token) {
            var encoded = token.split('.')[1];
            while (encoded.length % 4 !== 0) { //eslint-disable-line
                encoded += '=';
            }
            var decode = window.atob ? window.atob : function (encoded) { return new Buffer(encoded, 'base64').toString('ascii'); };

            return JSON.parse(decode(encoded));
        };

        var handleGroupError = function (message, statusCode, data) {
            // logout the user since it's in an invalid state with no group selected
            me.logout().then(function () {
                var error = $.extend(true, {}, data, { statusText: message, status: statusCode });
                $d.reject(error);
            });
        };

        var handleSuccess = function (response) {
            //jshint camelcase: false
            //jscs:disable
            var token = response.access_token;
            var userInfo = decodeToken(token);
            var oldGroups = sessionManager.getSession(adapterOptions).groups || {};
            var userGroupOpts = $.extend(true, {}, adapterOptions, { success: $.noop });
            var data = { auth: response, user: userInfo };
            var project = adapterOptions.project;
            var isTeamMember = userInfo.parent_account_id === null;
            var requiresGroup = adapterOptions.requiresGroup && project;

            var sessionInfo = {
                auth_token: token,
                account: adapterOptions.account,
                project: project,
                userId: userInfo.user_id,
                groups: oldGroups,
                isTeamMember: isTeamMember
            };
            // The group is not required if the user is not logging into a project
            if (!requiresGroup) {
                sessionManager.saveSession(sessionInfo);
                outSuccess.apply(this, [data]);
                $d.resolve(data);
                return;
            }

            var handleGroupList = function (groupList) {
                data.userGroups = groupList;

                var group = null;
                if (groupList.length === 0) {
                    handleGroupError('The user has no groups associated in this account', 401, data);
                    return;
                } else if (groupList.length === 1) {
                    // Select the only group
                    group = groupList[0];
                } else if (groupList.length > 1) {
                    if (groupId) {
                        var filteredGroups = $.grep(groupList, function (resGroup) {
                            return resGroup.groupId === groupId;
                        });
                        group = filteredGroups.length === 1 ? filteredGroups[0] : null;
                    }
                }

                if (group) {
                    // A team member does not get the group members because is calling the Group API
                    // but it's automatically a fac user
                    var isFac = isTeamMember ? true : _findUserInGroup(group.members, userInfo.user_id).role === 'facilitator';
                    var groupData = {
                        groupId: group.groupId,
                        groupName: group.name,
                        isFac: isFac
                    };
                    var sessionInfoWithGroup = objectAssign({}, sessionInfo, groupData);
                    sessionInfo.groups[project] = groupData;
                    me.sessionManager.saveSession(sessionInfoWithGroup, adapterOptions);
                    outSuccess.apply(this, [data]);
                    $d.resolve(data);
                } else {
                    handleGroupError('This user is associated with more than one group. Please specify a group id to log into and try again', 403, data);
                }
            };

            if (!isTeamMember) {
                me.getUserGroups({ userId: userInfo.user_id, token: token }, userGroupOpts)
                    .then(handleGroupList, $d.reject);
            } else {
                var opts = objectAssign({}, userGroupOpts, { token: token });
                var groupService = new GroupService(opts);
                groupService.getGroups({ account: adapterOptions.account, project: project })
                    .then(function (groups) {
                        // Group API returns id instead of groupId
                        groups.forEach(function (group) {
                            group.groupId = group.id;
                        });
                        handleGroupList(groups);
                    }, $d.reject);
            }
        };

        adapterOptions.success = handleSuccess;
        adapterOptions.error = function (response) {
            if (adapterOptions.account) {
                // Try to login as a system user
                adapterOptions.account = null;
                adapterOptions.error = function () {
                    outError.apply(this, arguments);
                    $d.reject(response);
                };

                me.authAdapter.login(adapterOptions);
                return;
            }

            outError.apply(this, arguments);
            $d.reject(response);
        };

        this.authAdapter.login(adapterOptions);
        return $d.promise();
    },

    /**
    * Logs user out by clearing all session information.
    *
    * **Example**
    *
    *       authMgr.logout();
    *
    * **Parameters**
    *
    * @param {Object} options (Optional) Overrides for configuration options.
    * @return {Promise}
    */
    logout: function (options) {
        var me = this;
        var adapterOptions = this.sessionManager.getMergedOptions(options);

        var removeCookieFn = function (response) {
            me.sessionManager.removeSession();
        };

        return this.authAdapter.logout(adapterOptions).then(removeCookieFn);
    },

    /**
     * Returns the existing user access token if the user is already logged in. Otherwise, logs the user in, creating a new user access token, and returns the new token. (See [more background on access tokens](../../../project_access/)).
     *
     * **Example**
     *
     *      authMgr.getToken()
     *          .then(function (token) {
     *              console.log('My token is ', token);
     *          });
     *
     * **Parameters**
     * @param {Object} options (Optional) Overrides for configuration options.
     * @return {Promise}
     */
    getToken: function (options) {
        var httpOptions = this.sessionManager.getMergedOptions(options);

        var session = this.sessionManager.getSession(httpOptions);
        var $d = $.Deferred();
        //jshint camelcase: false
        //jscs:disable
        if (session.auth_token) {
            $d.resolve(session.auth_token);
        } else {
            this.login(httpOptions).then($d.resolve);
        }
        return $d.promise();
    },

    /**
     * Returns an array of group records, one for each group of which the current user is a member. Each group record includes the group `name`, `account`, `project`, and `groupId`.
     *
     * If some end users in your project are members of multiple groups, this is a useful method to call on your project's login page. When the user attempts to log in, you can use this to display the groups of which the user is member, and have the user select the correct group to log in to for this session.
     *
     * **Example**
     *
     *      // get groups for current user
     *      var sessionObj = authMgr.getCurrentUserSessionInfo();
     *      authMgr.getUserGroups({ userId: sessionObj.userId, token: sessionObj.auth_token })
     *          .then(function (groups) {
     *              for (var i=0; i < groups.length; i++)
     *                  { console.log(groups[i].name); }
     *          });
     *
     *      // get groups for particular user
     *      authMgr.getUserGroups({userId: 'b1c19dda-2d2e-4777-ad5d-3929f17e86d3', token: savedProjAccessToken });
     *
     * **Parameters**
     * @param {Object} params Object with a userId and token properties.
     * @param {String} params.userId The userId. If looking up groups for the currently logged in user, this is in the session information. Otherwise, pass a string.
     * @param {String} params.token The authorization credentials (access token) to use for checking the groups for this user. If looking up groups for the currently logged in user, this is in the session information. A team member's token or a project access token can access all the groups for all end users in the team or project.
     * @param {Object} options (Optional) Overrides for configuration options.
     * @return {Promise}
     */
    getUserGroups: function (params, options) {
        var adapterOptions = this.sessionManager.getMergedOptions({ success: $.noop }, options);
        var $d = $.Deferred();
        var outSuccess = adapterOptions.success;

        adapterOptions.success = function (memberInfo) {
            // The member API is at the account scope, we filter by project
            if (adapterOptions.project) {
                memberInfo = $.grep(memberInfo, function (group) {
                    return group.project === adapterOptions.project;
                });
            }

            outSuccess.apply(this, [memberInfo]);
            $d.resolve(memberInfo);
        };

        var memberAdapter = new MemberAdapter({ token: params.token });
        memberAdapter.getGroupsForUser(params, adapterOptions).fail($d.reject);
        return $d.promise();
    },

    /**
     * Returns session information for the current user, including the `userId`, `account`, `project`, `groupId`, `groupName`, `isFac` (whether the end user is a facilitator of this group), and `auth_token` (user access token).
     *
     * *Important*: This method is synchronous. The session information is returned immediately in an object; no callbacks or promises are needed.
     *
     * Session information is stored in a cookie in the browser.
     *
     * **Example**
     *
     *      var sessionObj = authMgr.getCurrentUserSessionInfo();
     *
     * **Parameters**
     * @param {Object} options (Optional) Overrides for configuration options.
     * @return {Object} session information
     */
    getCurrentUserSessionInfo: function (options) {
        var adapterOptions = this.sessionManager.getMergedOptions({ success: $.noop }, options);
        return this.sessionManager.getSession(adapterOptions);
    },

    /*
     * Adds one or more groups to the current session. 
     *
     * This method assumes that the project and group exist and the user specified in the session is part of this project and group.
     *
     * Returns the new session object.
     *
     * **Example**
     *
     *      authMgr.addGroups({ project: 'hello-world', groupName: 'groupName', groupId: 'groupId' });
     *      authMgr.addGroups([{ project: 'hello-world', groupName: 'groupName', groupId: 'groupId' }, { project: 'hello-world', groupName: '...' }]);
     *
     * **Parameters**
     * @param {object|array} groups (Required) The group object must contain the `project` (**Project ID**) and `groupName` properties. If passing an array of such objects, all of the objects must contain *different* `project` (**Project ID**) values: although end users may be logged in to multiple projects at once, they may only be logged in to one group per project at a time.
     * @param {string} group.isFac (optional) Defaults to `false`. Set to `true` if the user in the session should be a facilitator in this group.
     * @param {string} group.groupId (optional) Defaults to undefined. Needed mostly for the Members API.
     * @return {Object} session information
    */
    addGroups: function (groups) {
        var session = this.getCurrentUserSessionInfo();
        var isArray = Array.isArray(groups);
        groups = isArray ? groups : [groups];

        $.each(groups, function (index, group) {
            var extendedGroup = $.extend({}, { isFac: false }, group);
            var project = extendedGroup.project;
            var validProps = ['groupName', 'groupId', 'isFac'];
            if (!project || !extendedGroup.groupName) {
                throw new Error('No project or groupName specified.');
            }
            // filter object
            extendedGroup = _pick(extendedGroup, validProps);
            session.groups[project] = extendedGroup;
        });
        this.sessionManager.saveSession(session);
        return session;
    }
});

module.exports = AuthManager;

},{"../service/auth-api-service":28,"../service/group-api-service":32,"../service/member-api-adapter":34,"../store/session-manager":43,"../util/object-util":48,"buffer":2,"object-assign":5}],10:[function(require,module,exports){
'use strict';

/**
 * ## Channel Manager
 *
 * There are two main use cases for the channel: event notifications and chat messages.
 *
 * The Channel Manager is a wrapper around the default [cometd JavaScript library](http://docs.cometd.org/2/reference/javascript.html), `$.cometd`. It provides a few nice features that `$.cometd` doesn't, including:
 *
 * * Automatic re-subscription to channels if you lose your connection
 * * Online / Offline notifications
 * * 'Events' for cometd notifications (instead of having to listen on specific meta channels)
 *
 * While you can work directly with the Channel Manager through Node.js (for example, `require('manager/channel-manager')`) -- or even work directly with `$.cometd` and Epicenter's underlying [Push Channel API](../../../rest_apis/multiplayer/channel/) -- most often it will be easiest to work with the [Epicenter Channel Manager](../epicenter-channel-manager/). The Epicenter Channel Manager is a wrapper that instantiates a Channel Manager with Epicenter-specific defaults.
 *
 * You'll need to include the `epicenter-multiplayer-dependencies.js` library in addition to the `epicenter.js` library in your project to use the Channel Manager. (See [Including Epicenter.js](../../#include).)
 *
 * To use the Channel Manager in client-side JavaScript, instantiate the [Epicenter Channel Manager](../epicenter-channel-manager/), get the channel, then use the channel's `subscribe()` and `publish()` methods to subscribe to topics or publish data to topics.
 *
 *        var cm = new F.manager.ChannelManager();
 *        var channel = cm.getChannel();
 *
 *        channel.subscribe('topic', callback);
 *        channel.publish('topic', { myData: 100 });
 *
 * The parameters for instantiating a Channel Manager include:
 *
 * * `options` The options object to configure the Channel Manager. Besides the common options listed here, see http://docs.cometd.org/reference/javascript.html for other supported options.
 * * `options.url` The Cometd endpoint URL.
 * * `options.websocketEnabled` Whether websocket support is active (boolean).
 * * `options.channel` Other defaults to pass on to instances of the underlying Channel Service. See [Channel Service](../channel-service/) for details.
 *
 */

var Channel = require('../service/channel-service');
var SessionManager = require('../store/session-manager');

var ChannelManager = function (options) {
    if (!$.cometd) {
        throw new Error('Cometd library not found. Please include epicenter-multiplayer-dependencies.js');
    }
    if (!options || !options.url) {
        throw new Error('Please provide an url for the cometd server');
    }

    var defaults = {
        /**
         * The Cometd endpoint URL.
         * @type {string}
         */
        url: '',

        /**
         * The log level for the channel (logs to console).
         * @type {string}
         */
        logLevel: 'info',

        /**
         * Whether websocket support is active. Defaults to `false`; Epicenter doesn't currently support communication through websockets.
         * @type {boolean}
         */
        websocketEnabled: false,

        /**
         * If false each instance of Channel will have a separate cometd connection to server, which could be noisy. Set to true to re-use the same connection across instances.
         * @type {boolean}
         */
        shareConnection: false,

        /**
         * Other defaults to pass on to instances of the underlying [Channel Service](../channel-service/), which are created through `getChannel()`.
         * @type {object}
         */
        channel: {

        },

        /**
         * Options to pass to the channel handshake.
         *
         * For example, the [Epicenter Channel Manager](../epicenter-channel-manager/) passes `ext` and authorization information. More information on possible options is in the details of the underlying [Push Channel API](../../../rest_apis/multiplayer/channel/).
         *
         * @type {object}
         */
        handshake: undefined
    };
    this.sessionManager = new SessionManager();
    var defaultCometOptions = this.sessionManager.getMergedOptions(defaults, options);
    this.currentSubscriptions = [];
    this.options = defaultCometOptions;

    if (defaultCometOptions.shareConnection && ChannelManager.prototype._cometd) {
        this.cometd = ChannelManager.prototype._cometd;
        return this;
    }
    var cometd = new $.Cometd();
    ChannelManager.prototype._cometd = cometd;

    cometd.websocketEnabled = defaultCometOptions.websocketEnabled;

    this.isConnected = false;
    var connectionBroken = function (message) {
        $(this).trigger('disconnect', message);
    };
    var connectionSucceeded = function (message) {
        $(this).trigger('connect', message);
    };
    var me = this;

    cometd.configure(defaultCometOptions);

    cometd.addListener('/meta/connect', function (message) {
        var wasConnected = this.isConnected;
        this.isConnected = (message.successful === true);
        if (!wasConnected && this.isConnected) { //Connecting for the first time
            connectionSucceeded.call(this, message);
        } else if (wasConnected && !this.isConnected) { //Only throw disconnected message fro the first disconnect, not once per try
            connectionBroken.call(this, message);
        }
    }.bind(this));

    cometd.addListener('/meta/disconnect', connectionBroken);

    cometd.addListener('/meta/handshake', function (message) {
        if (message.successful) {
            //http://docs.cometd.org/reference/javascript_subscribe.html#javascript_subscribe_meta_channels
            // ^ "dynamic subscriptions are cleared (like any other subscription) and the application needs to figure out which dynamic subscription must be performed again"
            cometd.batch(function () {
                $(me.currentSubscriptions).each(function (index, subs) {
                    cometd.resubscribe(subs);
                });
            });
        }
    });

    //Other interesting events for reference
    cometd.addListener('/meta/subscribe', function (message) {
        $(me).trigger('subscribe', message);
    });
    cometd.addListener('/meta/unsubscribe', function (message) {
        $(me).trigger('unsubscribe', message);
    });
    cometd.addListener('/meta/publish', function (message) {
        $(me).trigger('publish', message);
    });
    cometd.addListener('/meta/unsuccessful', function (message) {
        $(me).trigger('error', message);
    });

    cometd.handshake(defaultCometOptions.handshake);

    this.cometd = cometd;
};


ChannelManager.prototype = $.extend(ChannelManager.prototype, {

    /**
     * Creates and returns a channel, that is, an instance of a [Channel Service](../channel-service/).
     *
     * **Example**
     *
     *      var cm = new F.manager.ChannelManager();
     *      var channel = cm.getChannel();
     *
     *      channel.subscribe('topic', callback);
     *      channel.publish('topic', { myData: 100 });
     *
     * **Parameters**
     * @param {Object|String} options (Optional) If string, assumed to be the base channel url. If object, assumed to be configuration options for the constructor.
     * @return {Channel} Channel instance
     */
    getChannel: function (options) {
        //If you just want to pass in a string
        if (options && !$.isPlainObject(options)) {
            options = {
                base: options
            };
        }
        var defaults = {
            transport: this.cometd
        };
        var channel = new Channel($.extend(true, {}, this.options.channel, defaults, options));


        //Wrap subs and unsubs so we can use it to re-attach handlers after being disconnected
        var subs = channel.subscribe;
        channel.subscribe = function () {
            var subid = subs.apply(channel, arguments);
            this.currentSubscriptions = this.currentSubscriptions.concat(subid);
            return subid;
        }.bind(this);


        var unsubs = channel.unsubscribe;
        channel.unsubscribe = function () {
            var removed = unsubs.apply(channel, arguments);
            for (var i = 0; i < this.currentSubscriptions.length; i++) {
                if (this.currentSubscriptions[i].id === removed.id) {
                    this.currentSubscriptions.splice(i, 1);
                }
            }
            return removed;
        }.bind(this);

        return channel;
    },

    /**
     * Start listening for events on this instance. Signature is same as for jQuery Events: http://api.jquery.com/on/.
     *
     * Supported events are: `connect`, `disconnect`, `subscribe`, `unsubscribe`, `publish`, `error`.
     *
     * **Parameters**
     *
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/on/.
     */
    on: function (event) {
        $(this).on.apply($(this), arguments);
    },

    /**
     * Stop listening for events on this instance. Signature is same as for jQuery Events: http://api.jquery.com/off/.
     *
     * **Parameters**
     *
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/off/.
     */
    off: function (event) {
        $(this).off.apply($(this), arguments);
    },

    /**
     * Trigger events and execute handlers. Signature is same as for jQuery Events: http://api.jquery.com/trigger/.
     *
     * **Parameters**
     *
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/trigger/.
     */
    trigger: function (event) {
        $(this).trigger.apply($(this), arguments);
    }
});

module.exports = ChannelManager;

},{"../service/channel-service":29,"../store/session-manager":43}],11:[function(require,module,exports){
'use strict';

/**
 * ## Epicenter Channel Manager
 *
 * The Epicenter platform provides a push channel, which allows you to publish and subscribe to messages within a [project](../../../glossary/#projects), [group](../../../glossary/#groups), or [multiplayer world](../../../glossary/#world). There are two main use cases for the channel: event notifications and chat messages.
 *
 * The Epicenter Channel Manager is a wrapper around the (more generic) [Channel Manager](../channel-manager/), to instantiate it with Epicenter-specific defaults. If you are interested in including a notification or chat feature in your project, using an Epicenter Channel Manager is probably the easiest way to get started.
 *
 * You'll need to include the `epicenter-multiplayer-dependencies.js` library in addition to the `epicenter.js` library in your project to use the Epicenter Channel Manager. See [Including Epicenter.js](../../#include).
 *
 * To use the Epicenter Channel Manager: instantiate it, get the channel of the scope you want ([user](../../../glossary/#users), [world](../../../glossary/#world), or [group](../../../glossary/#groups)), then use the channel's `subscribe()` and `publish()` methods to subscribe to topics or publish data to topics.
 *
 *     var cm = new F.manager.ChannelManager();
 *     var gc = cm.getGroupChannel();
 *     gc.subscribe('broadcasts', callback);
 *
 * For additional background on Epicenter's push channel, see the introductory notes on the [Push Channel API](../../../rest_apis/multiplayer/channel/) page.
 *
 * The parameters for instantiating an Epicenter Channel Manager include:
 *
 * * `options` Object with details about the Epicenter project for this Epicenter Channel Manager instance.
 * * `options.account` The Epicenter account id (**Team ID** for team projects, **User ID** for personal projects).
 * * `options.project` Epicenter project id.
 * * `options.userName` Epicenter userName used for authentication.
 * * `options.userId` Epicenter user id used for authentication. Optional; `options.userName` is preferred.
 * * `options.token` Epicenter token used for authentication. (You can retrieve this using `authManager.getToken()` from the [Authorization Manager](../auth-manager/).)
 * * `options.allowAllChannels` If not included or if set to `false`, all channel paths are validated; if your project requires [Push Channel Authorization](../../../updating_your_settings/), you should use this option. If you want to allow other channel paths, set to `true`; this is not common.
 */

var ChannelManager = require('./channel-manager');
var classFrom = require('../util/inherit');
var urlService = require('../service/url-config-service');
var SessionManager = require('../store/session-manager');

var AuthManager = require('./auth-manager');

var validTypes = {
    project: true,
    group: true,
    world: true,
    user: true,
    data: true,
    general: true,
    chat: true
};
var session = new AuthManager();
var getFromSettingsOrSessionOrError = function (value, sessionKeyName, settings) {
    if (!value) {
        var userInfo = session.getCurrentUserSessionInfo();
        if (settings && settings[sessionKeyName]) {
            value = settings[sessionKeyName];
        } else if (userInfo[sessionKeyName]) {
            value = userInfo[sessionKeyName];
        } else {
            throw new Error(sessionKeyName + ' not found. Please log-in again, or specify ' + sessionKeyName + ' explicitly');
        }
    }
    return value;
};
var __super = ChannelManager.prototype;
var EpicenterChannelManager = classFrom(ChannelManager, {
    constructor: function (options) {
        this.sessionManager = new SessionManager();
        var defaultCometOptions = this.sessionManager.getMergedOptions(options);

        var urlOpts = urlService(defaultCometOptions.server);
        if (!defaultCometOptions.url) {
            //Default epicenter cometd endpoint
            defaultCometOptions.url = urlOpts.protocol + '://' + urlOpts.host + '/channel/subscribe';
        }

        if (defaultCometOptions.handshake === undefined) {
            var userName = defaultCometOptions.userName;
            var userId = defaultCometOptions.userId;
            var token = defaultCometOptions.token;
            if ((userName || userId) && token) {
                var userProp = userName ? 'userName' : 'userId';
                var ext = {
                    authorization: 'Bearer ' + token
                };
                ext[userProp] = userName ? userName : userId;

                defaultCometOptions.handshake = {
                    ext: ext
                };
            }
        }

        this.options = defaultCometOptions;
        return __super.constructor.call(this, defaultCometOptions);
    },

    /**
     * Creates and returns a channel, that is, an instance of a [Channel Service](../channel-service/).
     *
     * This method enforces Epicenter-specific channel naming: all channels requested must be in the form `/{type}/{account id}/{project id}/{...}`, where `type` is one of `run`, `data`, `user`, `world`, or `chat`.
     *
     * **Example**
     *
     *      var cm = new F.manager.EpicenterChannelManager();
     *      var channel = cm.getChannel('/group/acme/supply-chain-game/');
     *
     *      channel.subscribe('topic', callback);
     *      channel.publish('topic', { myData: 100 });
     *
     * **Parameters**
     * @param {Object|String} options (Optional) If string, assumed to be the base channel url. If object, assumed to be configuration options for the constructor.
     * @return {Channel} Channel instance
     */
    getChannel: function (options) {
        if (options && typeof options !== 'object') {
            options = {
                base: options
            };
        }
        var channelOpts = $.extend({}, this.options, options);
        var base = channelOpts.base;
        if (!base) {
            throw new Error('No base topic was provided');
        }

        if (!channelOpts.allowAllChannels) {
            var baseParts = base.split('/');
            var channelType = baseParts[1];
            if (baseParts.length < 4) { //eslint-disable-line
                throw new Error('Invalid channel base name, it must be in the form /{type}/{account id}/{project id}/{...}');
            }
            if (!validTypes[channelType]) {
                throw new Error('Invalid channel type');
            }
        }
        return __super.getChannel.apply(this, arguments);
    },

    /**
     * Create and return a publish/subscribe channel (from the underlying [Channel Manager](../channel-manager/)) for the given [group](../../../glossary/#groups). The group must exist in the account (team) and project provided.
     *
     * There are no notifications from Epicenter on this channel; all messages are user-originated.
     *
     * **Example**
     *
     *     var cm = new F.manager.ChannelManager();
     *     var gc = cm.getGroupChannel();
     *     gc.subscribe('broadcasts', callback);
     *
     * **Return Value**
     *
     * * *Channel* Returns the channel (an instance of the [Channel Service](../channel-service/)).
     *
     * **Parameters**
     *
     * @param  {String} groupName (Optional) Group to broadcast to. If not provided, picks up group from current session if end user is logged in.
     * @return {Channel} Channel instance
     */
    getGroupChannel: function (groupName) {
        groupName = getFromSettingsOrSessionOrError(groupName, 'groupName', this.options);
        var account = getFromSettingsOrSessionOrError('', 'account', this.options);
        var project = getFromSettingsOrSessionOrError('', 'project', this.options);

        var baseTopic = ['/group', account, project, groupName].join('/');
        return __super.getChannel.call(this, { base: baseTopic });
    },

    /**
     * Create and return a publish/subscribe channel (from the underlying [Channel Manager](../channel-manager/)) for the given [world](../../../glossary/#world).
     *
     * This is typically used together with the [World Manager](../world-manager).
     *
     * **Example**
     *
     *     var cm = new F.manager.ChannelManager();
     *     var worldManager = new F.manager.WorldManager({
     *         account: 'acme-simulations',
     *         project: 'supply-chain-game',
     *         group: 'team1',
     *         run: { model: 'model.eqn' }
     *     });
     *     worldManager.getCurrentWorld().then(function (worldObject, worldAdapter) {
     *         var worldChannel = cm.getWorldChannel(worldObject);
     *         worldChannel.subscribe('', function (data) {
     *             console.log(data);
     *         });
     *      });
     *
     * **Return Value**
     *
     * * *Channel* Returns the channel (an instance of the [Channel Service](../channel-service/)).
     *
     * **Parameters**
     *
     * @param  {String|Object} world The world object or id.
     * @param  {String} groupName (Optional) Group the world exists in. If not provided, picks up group from current session if end user is logged in.
     * @return {Channel} Channel instance
     */
    getWorldChannel: function (world, groupName) {
        var worldid = ($.isPlainObject(world) && world.id) ? world.id : world;
        if (!worldid) {
            throw new Error('Please specify a world id');
        }
        groupName = getFromSettingsOrSessionOrError(groupName, 'groupName', this.options);
        var account = getFromSettingsOrSessionOrError('', 'account', this.options);
        var project = getFromSettingsOrSessionOrError('', 'project', this.options);

        var baseTopic = ['/world', account, project, groupName, worldid].join('/');
        return __super.getChannel.call(this, { base: baseTopic });
    },

    /**
     * Create and return a publish/subscribe channel (from the underlying [Channel Manager](../channel-manager/)) for the current [end user](../../../glossary/#users) in that user's current [world](../../../glossary/#world).
     *
     * This is typically used together with the [World Manager](../world-manager). Note that this channel only gets notifications for worlds currently in memory. (See more background on [persistence](../../../run_persistence).)
     *
     * **Example**
     *
     *     var cm = new F.manager.ChannelManager();
     *     var worldManager = new F.manager.WorldManager({
     *         account: 'acme-simulations',
     *         project: 'supply-chain-game',
     *         group: 'team1',
     *         run: { model: 'model.eqn' }
     *     });
     *     worldManager.getCurrentWorld().then(function (worldObject, worldAdapter) {
     *         var userChannel = cm.getUserChannel(worldObject);
     *         userChannel.subscribe('', function (data) {
     *             console.log(data);
     *         });
     *      });
     *
     *
     * **Return Value**
     *
     * * *Channel* Returns the channel (an instance of the [Channel Service](../channel-service/)).
     *
     * **Parameters**
     *
     * @param  {String|Object} world World object or id.
     * @param  {String|Object} user (Optional) User object or id. If not provided, picks up user id from current session if end user is logged in.
     * @param  {String} groupName (Optional) Group the world exists in. If not provided, picks up group from current session if end user is logged in.
     * @return {Channel} Channel instance
     */
    getUserChannel: function (world, user, groupName) {
        var worldid = ($.isPlainObject(world) && world.id) ? world.id : world;
        if (!worldid) {
            throw new Error('Please specify a world id');
        }
        var userid = ($.isPlainObject(user) && user.id) ? user.id : user;
        userid = getFromSettingsOrSessionOrError(userid, 'userId', this.options);
        groupName = getFromSettingsOrSessionOrError(groupName, 'groupName', this.options);

        var account = getFromSettingsOrSessionOrError('', 'account', this.options);
        var project = getFromSettingsOrSessionOrError('', 'project', this.options);

        var baseTopic = ['/user', account, project, groupName, worldid, userid].join('/');
        return __super.getChannel.call(this, { base: baseTopic });
    },

    /**
     * Create and return a publish/subscribe channel (from the underlying [Channel Manager](../channel-manager/)) that automatically tracks the presence of an [end user](../../../glossary/#users), that is, whether the end user is currently online in this group and world. Notifications are automatically sent when the end user comes online, and when the end user goes offline (not present for more than 2 minutes). Useful in multiplayer games for letting each end user know whether other users in their shared world are also online.
     *
     * **Example**
     *
     *     var cm = new F.manager.ChannelManager();
     *     var worldManager = new F.manager.WorldManager({
     *         account: 'acme-simulations',
     *         project: 'supply-chain-game',
     *         model: 'model.eqn'
     *     });
     *     worldManager.getCurrentWorld().then(function (worldObject, worldService) {
     *         var presenceChannel = cm.getPresenceChannel(worldObject);
     *         presenceChannel.on('presence', function (evt, notification) {
     *              console.log(notification.online, notification.userId);
     *          });
     *      });
     *
     *
     * **Return Value**
     *
     * * *Channel* Returns the channel (an instance of the [Channel Service](../channel-service/)).
     *
     * **Parameters**
     *
     * @param  {String|Object} world World object or id.
     * @param  {String|Object} userid (Optional) User object or id. If not provided, picks up user id from current session if end user is logged in.
     * @param  {String} groupName (Optional) Group the world exists in. If not provided, picks up group from current session if end user is logged in.
     * @return {Channel} Channel instance
     */
    getPresenceChannel: function (world, userid, groupName) {
        var worldid = ($.isPlainObject(world) && world.id) ? world.id : world;
        if (!worldid) {
            throw new Error('Please specify a world id');
        }
        userid = getFromSettingsOrSessionOrError(userid, 'userId', this.options);
        groupName = getFromSettingsOrSessionOrError(groupName, 'groupName', this.options);

        var account = getFromSettingsOrSessionOrError('', 'account', this.options);
        var project = getFromSettingsOrSessionOrError('', 'project', this.options);

        var baseTopic = ['/user', account, project, groupName, worldid].join('/');
        var channel = __super.getChannel.call(this, { base: baseTopic });

        var lastPingTime = { };

        var PING_INTERVAL = 6000;
        channel.subscribe('internal-ping-channel', function (notification) {
            var incomingUserId = notification.data.user;
            if (!lastPingTime[incomingUserId] && incomingUserId !== userid) {
                channel.trigger('presence', { userId: incomingUserId, online: true });
            }
            lastPingTime[incomingUserId] = (new Date()).valueOf();
        });

        setInterval(function () {
            channel.publish('internal-ping-channel', { user: userid });

            $.each(lastPingTime, function (key, value) {
                var now = (new Date()).valueOf();
                if (value && value + (PING_INTERVAL * 2) < now) {
                    lastPingTime[key] = null;
                    channel.trigger('presence', { userId: key, online: false });
                }
            });
        }, PING_INTERVAL);

        return channel;
    },

    /**
     * Create and return a publish/subscribe channel (from the underlying [Channel Manager](../channel-manager/)) for the given collection. (The collection name is specified in the `root` argument when the [Data Service](../data-api-service/) is instantiated.) Must be one of the collections in this account (team) and project.
     *
     * There are automatic notifications from Epicenter on this channel when data is created, updated, or deleted in this collection. See more on [automatic messages to the data channel](../../../rest_apis/multiplayer/channel/#data-messages).
     *
     * **Example**
     *
     *     var cm = new F.manager.ChannelManager();
     *     var dc = cm.getDataChannel('survey-responses');
     *     dc.subscribe('', function(data, meta) {
     *          console.log(data);
     *
     *          // meta.date is time of change,
     *          // meta.subType is the kind of change: new, update, or delete
     *          // meta.path is the full path to the changed data
     *          console.log(meta);
     *     });
     *
     * **Return Value**
     *
     * * *Channel* Returns the channel (an instance of the [Channel Service](../channel-service/)).
     *
     * **Parameters**
     *
     * @param  {String} collection Name of collection whose automatic notifications you want to receive.
     * @return {Channel} Channel instance
     */
    getDataChannel: function (collection) {
        if (!collection) {
            throw new Error('Please specify a collection to listen on.');
        }
        var account = getFromSettingsOrSessionOrError('', 'account', this.options);
        var project = getFromSettingsOrSessionOrError('', 'project', this.options);
        var baseTopic = ['/data', account, project, collection].join('/');
        var channel = __super.getChannel.call(this, { base: baseTopic });

        //TODO: Fix after Epicenter bug is resolved
        var oldsubs = channel.subscribe;
        channel.subscribe = function (topic, callback, context, options) {
            var callbackWithCleanData = function (payload) {
                var meta = {
                    path: payload.channel,
                    subType: payload.data.subType,
                    date: payload.data.date
                };
                var actualData = payload.data.data;
                if (actualData.data) { //Delete notifications are one data-level behind of course
                    actualData = actualData.data;
                }

                callback.call(context, actualData, meta);
            };
            return oldsubs.call(channel, topic, callbackWithCleanData, context, options);
        };

        return channel;
    }
});

module.exports = EpicenterChannelManager;

},{"../service/url-config-service":38,"../store/session-manager":43,"../util/inherit":47,"./auth-manager":9,"./channel-manager":10}],12:[function(require,module,exports){
'use strict';

module.exports = {
    EPI_SESSION_KEY: 'epicenterjs.session',
    STRATEGY_SESSION_KEY: 'epicenter-scenario'
};
},{}],13:[function(require,module,exports){
/**
* ## Run Manager
*
* The Run Manager gives you access to runs for your project. This allows you to read and update variables, call operations, etc. Additionally, the Run Manager gives you control over run creation depending on run states. Specifically, you can select [run creation strategies (rules)](../../strategy/) for which runs end users of your project work with when they log in to your project.
*
* There are many ways to create new runs, including the Epicenter.js [Run Service](../run-api-service/), the RESFTful [Run API](../../../rest_apis/aggregate_run_api) and the [Model Run API](../../../rest_apis/other_apis/model_apis/run/). However, for some projects it makes more sense to pick up where the user left off, using an existing run. And in some projects, whether to create a new run or use an existing one is conditional, for example based on characteristics of the existing run or your own knowledge about the model. The Run Manager provides this level of control: your call to `getRun()`, rather than always returning a new run, returns a run based on the strategy you've specified. (Note that many of the Epicenter sample projects use a Run Service directly, because generally the sample projects are played in one end user session and don't care about run states or run strategies.)
*
*
* ### Using the Run Manager to create and access runs
*
* To use the Run Manager, instantiate it by passing in:
*
*   * `run`: (required) Run object. Must contain:
*       * `account`: Epicenter account id (**Team ID** for team projects, **User ID** for personal projects).
*       * `project`: Epicenter project id.
*       * `model`: The name of your primary model file. (See more on [Writing your Model](../../../writing_your_model/).)
*       * `scope`: (optional) Scope object for the run, for example `scope.group` with value of the name of the group.
*       * `server`: (optional) An object with one field, `host`. The value of `host` is the string `api.forio.com`, the URI of the Forio server. This is automatically set, but you can pass it explicitly if desired. It is most commonly used for clarity when you are [hosting an Epicenter project on your own server](../../../how_to/self_hosting/).
*       * `files`: (optional) If and only if you are using a Vensim model and you have additional data to pass in to your model, you can pass a `files` object with the names of the files, for example: `"files": {"data": "myExtraData.xls"}`. (Note that you'll also need to add this same files object to your Vensim [configuration file](../../../model_code/vensim/).) See the [underlying Model Run API](../../../rest_apis/other_apis/model_apis/run/#post-creating-a-new-run-for-this-project) for additional information.
*
*   * `strategy`: (optional) Run creation strategy for when to create a new run and when to reuse an end user's existing run. See [Run Manager Strategies](../../strategy/) for details. Defaults to `new-if-initialized`.
*
*   * `sessionKey`: (optional) Name of browser cookie in which to store run information, including run id. Many conditional strategies, including the provided strategies, rely on this browser cookie to store the run id and help make the decision of whether to create a new run or use an existing one. The name of this cookie defaults to `epicenter-scenario` and can be set with the `sessionKey` parameter.
*
*
* After instantiating a Run Manager, make a call to `getRun()` whenever you need to access a run for this end user. The `RunManager.run` contains the instantiated [Run Service](../run-api-service/). The Run Service allows you to access variables, call operations, etc.
*
* **Example**
*
*       var rm = new F.manager.RunManager({
*           run: {
*               account: 'acme-simulations',
*               project: 'supply-chain-game',
*               model: 'supply-chain-model.jl',
*               server: { host: 'api.forio.com' }
*           },
*           strategy: 'always-new',
*           sessionKey: 'epicenter-session'
*       });
*       rm.getRun()
*           .then(function(run) {
*               // the return value of getRun() is a run object
*               var thisRunId = run.id;
*               // the RunManager.run also contains the instantiated Run Service,
*               // so any Run Service method is valid here
*               rm.run.do('runModel');
*       })
*
*/

'use strict';
var strategiesMap = require('./run-strategies/strategies-map');
var specialOperations = require('./special-operations');
var RunService = require('../service/run-api-service');


function patchRunService(service, manager) {
    if (service.patched) {
        return service;
    }

    var orig = service.do;
    service.do = function (operation, params, options) {
        var reservedOps = Object.keys(specialOperations);
        if (reservedOps.indexOf(operation) === -1) {
            return orig.apply(service, arguments);
        } else {
            return specialOperations[operation].call(service, params, options, manager);
        }
    };

    service.patched = true;

    return service;
}


var defaults = {
    /**
     * Run creation strategy for when to create a new run and when to reuse an end user's existing run. See [Run Manager Strategies](../../strategy/) for details. Defaults to `new-if-initialized`.
     * @type {String}
     */

    strategy: 'new-if-initialized'
};

function RunManager(options) {
    this.options = $.extend(true, {}, defaults, options);

    if (this.options.run instanceof RunService) {
        this.run = this.options.run;
    } else {
        this.run = new RunService(this.options.run);
    }

    patchRunService(this.run, this);

    var StrategyCtor = typeof this.options.strategy === 'function' ? this.options.strategy : strategiesMap[this.options.strategy];

    if (!StrategyCtor) {
        throw new Error('Specified run creation strategy was invalid:', this.options.strategy);
    }

    this.strategy = new StrategyCtor(this.run, this.options);
}

RunManager.prototype = {
    /**
     * Returns the run object for a 'good' run.
     *
     * A good run is defined by the strategy. For example, if the strategy is `always-new`, the call
     * to `getRun()` always returns a newly created run; if the strategy is `new-if-persisted`,
     * `getRun()` creates a new run if the previous run is in a persisted state, otherwise
     * it returns the previous run. See [Run Manager Strategies](../../strategy/) for more on strategies.
     *
     *  **Example**
     *
     *      rm.getRun().then(function (run) {
     *          // use the run object
     *          var thisRunId = run.id;
     *
     *          // use the Run Service object
     *          rm.run.do('runModel');
     *      });
     *
     * @return {$promise} Promise to complete the call.
     */
    getRun: function () {
        return this.strategy
                .getRun();
    },

    /**
     * Returns the run object for a new run, regardless of strategy: force creation of a new run.
     *
     *  **Example**
     *
     *      rm.reset().then(function (run) {
     *          // use the (new) run object
     *          var thisRunId = run.id;
     *
     *          // use the Run Service object
     *          rm.run.do('runModel');
     *      });
     *
     * **Parameters**
     * @param {Object} runServiceOptions The options object to configure the Run Service. See [Run API Service](../run-api-service/) for more.
     * @return {Promise}
     */
    reset: function (runServiceOptions) {
        return this.strategy.reset(runServiceOptions);
    }
};

module.exports = RunManager;

},{"../service/run-api-service":35,"./run-strategies/strategies-map":22,"./special-operations":24}],14:[function(require,module,exports){
'use strict';

var classFrom = require('../../util/inherit');
var ConditionalStrategy = require('./conditional-creation-strategy');

var __super = ConditionalStrategy.prototype;

var Strategy = classFrom(ConditionalStrategy, {
    constructor: function (runService, options) {
        __super.constructor.call(this, runService, this.createIf, options);
    },

    createIf: function (run, headers) {
        // always create a new run!
        return true;
    }
});

module.exports = Strategy;

},{"../../util/inherit":47,"./conditional-creation-strategy":15}],15:[function(require,module,exports){
'use strict';

var Base = require('./identity-strategy');
var SessionManager = require('../../store/session-manager');
var classFrom = require('../../util/inherit');
var AuthManager = require('../auth-manager');

var keyNames = require('../key-names');

var defaults = {
    sessionKey: keyNames.STRATEGY_SESSION_KEY,
    path: ''
};

function setRunInSession(sessionKey, run, sessionManager) {
    sessionManager.getStore().set(sessionKey, JSON.stringify({ runId: run.id }));
}

/**
* Conditional Creation Strategy
* This strategy will try to get the run stored in the cookie and
* evaluate if needs to create a new run by calling the 'condition' function
*/

/* jshint eqnull: true */
var Strategy = classFrom(Base, {
    constructor: function Strategy(runService, condition, options) {
        if (condition === null) {
            throw new Error('Conditional strategy needs a condition to create a run');
        }

        this._auth = new AuthManager();
        this.run = runService;
        this.condition = typeof condition !== 'function' ? function () { return condition; } : condition;
        this.options = $.extend(true, {}, defaults, options);
        this.sessionManager = new SessionManager(options);
        this.runOptions = this.options.run;
    },

    runOptionsWithScope: function () {
        var userSession = this._auth.getCurrentUserSessionInfo();
        return $.extend({
            scope: { group: userSession.groupName }
        }, this.runOptions);
    },

    reset: function (runServiceOptions) {
        var me = this;
        var opt = this.runOptionsWithScope();

        return this.run
                .create(opt, runServiceOptions)
            .then(function (run) {
                setRunInSession(me.options.sessionKey, run, me.sessionManager);
                run.freshlyCreated = true;
                return run;
            });
    },

    getRun: function () {
        var sessionStore = this.sessionManager.getStore();
        var runSession = JSON.parse(sessionStore.get(this.options.sessionKey));
        var me = this;
        if (runSession && runSession.runId) {
            return this._loadAndCheck(runSession).fail(function () {
                return me.reset(); //if it got the wrong cookie for e.g.
            });
        } else {
            return this.reset();
        }
    },

    _loadAndCheck: function (runSession) {
        var shouldCreate = false;
        var me = this;

        return this.run
            .load(runSession.runId, null, {
                success: function (run, msg, headers) {
                    shouldCreate = me.condition(run, headers);
                }
            })
            .then(function (run) {
                if (shouldCreate) {
                    var opt = me.runOptionsWithScope();
                    return me.run.create(opt)
                    .then(function (run) {
                        setRunInSession(me.options.sessionKey, run, me.sessionManager);
                        run.freshlyCreated = true;
                        return run;
                    });
                }
                return run;
            });
    }
});

module.exports = Strategy;

},{"../../store/session-manager":43,"../../util/inherit":47,"../auth-manager":9,"../key-names":12,"./identity-strategy":16}],16:[function(require,module,exports){
'use strict';

var classFrom = require('../../util/inherit');
var Base = {};

// Interface that all strategies need to implement
module.exports = classFrom(Base, {
    constructor: function (runService, options) {
        this.runService = runService;
    },

    reset: function () {
        // return a newly created run
        return $.Deferred().resolve().promise();
    },

    getRun: function () {
        // return a usable run
        return $.Deferred().resolve(this.runService).promise();
    }
});

},{"../../util/inherit":47}],17:[function(require,module,exports){
'use strict';

var classFrom = require('../../util/inherit');

var IdentityStrategy = require('./identity-strategy');
var WorldApiAdapter = require('../../service/world-api-adapter');
var AuthManager = require('../auth-manager');

var defaults = {
    store: {
        synchronous: true
    }
};

var Strategy = classFrom(IdentityStrategy, {

    constructor: function (runService, options) {
        this.runService = runService;
        this.options = $.extend(true, {}, defaults, options);
        this._auth = new AuthManager();
        this._loadRun = this._loadRun.bind(this);
        this.worldApi = new WorldApiAdapter(this.options.run);
    },

    reset: function () {
        var session = this._auth.getCurrentUserSessionInfo();
        var curUserId = session.userId;
        var curGroupName = session.groupName;

        return this.worldApi
            .getCurrentWorldForUser(curUserId, curGroupName)
            .then(function (world) {
                return this.worldApi.newRunForWorld(world.id);
            }.bind(this));
    },

    getRun: function () {
        var session = this._auth.getCurrentUserSessionInfo();
        var curUserId = session.userId;
        var curGroupName = session.groupName;
        var worldApi = this.worldApi;
        var model = this.options.model;
        var me = this;
        var dtd = $.Deferred();

        if (!curUserId) {
            return dtd.reject({ statusCode: 400, error: 'We need an authenticated user to join a multiplayer world. (ERR: no userId in session)' }, session).promise();
        }

        var loadRunFromWorld = function (world) {
            if (!world) {
                return dtd.reject({ statusCode: 404, error: 'The user is not in any world.' }, { options: me.options, session: session });
            }

            return worldApi.getCurrentRunId({ model: model, filter: world.id })
                .then(me._loadRun)
                .then(dtd.resolve)
                .fail(dtd.reject);
        };

        var serverError = function (error) {
            // is this possible?
            dtd.reject(error, session, me.options);
        };

        this.worldApi
            .getCurrentWorldForUser(curUserId, curGroupName)
            .then(loadRunFromWorld)
            .fail(serverError);

        return dtd.promise();
    },

    _loadRun: function (id, options) {
        return this.runService.load(id, null, options);
    }
});

module.exports = Strategy;

},{"../../service/world-api-adapter":41,"../../util/inherit":47,"../auth-manager":9,"./identity-strategy":16}],18:[function(require,module,exports){
'use strict';
var classFrom = require('../../util/inherit');
var ConditionalStrategy = require('./conditional-creation-strategy');

var __super = ConditionalStrategy.prototype;

var Strategy = classFrom(ConditionalStrategy, {
    constructor: function (runService, options) {
        __super.constructor.call(this, runService, this.createIf, options);
    },

    createIf: function (run, headers) {
        return headers.getResponseHeader('pragma') === 'persistent' || run.initialized;
    }
});

module.exports = Strategy;

},{"../../util/inherit":47,"./conditional-creation-strategy":15}],19:[function(require,module,exports){
'use strict';

var classFrom = require('../../util/inherit');
var ConditionalStrategy = require('./conditional-creation-strategy');

var __super = ConditionalStrategy.prototype;

/*
*  create a new run only if nothing is stored in the cookie
*  this is useful for baseRuns.
*/
var Strategy = classFrom(ConditionalStrategy, {
    constructor: function (runService, options) {
        __super.constructor.call(this, runService, this.createIf, options);
    },

    createIf: function (run, headers) {
        // if we are here, it means that the run exists... so we don't need a new one
        return false;
    }
});

module.exports = Strategy;

},{"../../util/inherit":47,"./conditional-creation-strategy":15}],20:[function(require,module,exports){
'use strict';
var classFrom = require('../../util/inherit');
var ConditionalStrategy = require('./conditional-creation-strategy');

var __super = ConditionalStrategy.prototype;

var Strategy = classFrom(ConditionalStrategy, {
    constructor: function (runService, options) {
        __super.constructor.call(this, runService, this.createIf, options);
    },

    createIf: function (run, headers) {
        return headers.getResponseHeader('pragma') === 'persistent';
    }
});

module.exports = Strategy;

},{"../../util/inherit":47,"./conditional-creation-strategy":15}],21:[function(require,module,exports){
'use strict';

var classFrom = require('../../util/inherit');
var IdentityStrategy = require('./identity-strategy');
var StorageFactory = require('../../store/store-factory');
var StateApi = require('../../service/state-api-adapter');
var AuthManager = require('../auth-manager');

var keyNames = require('../key-names');

var defaults = {
    store: {
        synchronous: true
    }
};

var Strategy = classFrom(IdentityStrategy, {
    constructor: function Strategy(runService, options) {
        this.run = runService;
        this.options = $.extend(true, {}, defaults, options);
        this.runOptions = this.options.run;
        this._store = new StorageFactory(this.options.store);
        this.stateApi = new StateApi();
        this._auth = new AuthManager();

        this._loadAndCheck = this._loadAndCheck.bind(this);
        this._restoreRun = this._restoreRun.bind(this);
        this._getAllRuns = this._getAllRuns.bind(this);
        this._loadRun = this._loadRun.bind(this);
    },

    reset: function (runServiceOptions) {
        var session = this._auth.getCurrentUserSessionInfo();
        var opt = $.extend({
            scope: { group: session.groupName }
        }, this.runOptions);

        return this.run
            .create(opt, runServiceOptions)
            .then(function (run) {
                run.freshlyCreated = true;
                return run;
            });
    },

    getRun: function () {
        return this._getAllRuns()
            .then(this._loadAndCheck);
    },

    _getAllRuns: function () {
        var session = JSON.parse(this._store.get(keyNames.EPI_SESSION_KEY) || '{}');
        return this.run.query({
            'user.id': session.userId || '0000',
            'scope.group': session.groupName
        });
    },

    _loadAndCheck: function (runs) {
        if (!runs || !runs.length) {
            return this.reset();
        }

        var dateComp = function (a, b) { return new Date(b.date) - new Date(a.date); };
        var latestRun = runs.sort(dateComp)[0];
        var me = this;
        var shouldReplay = false;

        return this.run.load(latestRun.id, null, {
            success: function (run, msg, headers) {
                shouldReplay = headers.getResponseHeader('pragma') === 'persistent';
            }
        }).then(function (run) {
            return shouldReplay ? me._restoreRun(run.id) : run;
        });
    },

    _restoreRun: function (runId) {
        var me = this;
        return this.stateApi.replay({ runId: runId })
            .then(function (resp) {
                return me._loadRun(resp.run);
            });
    },

    _loadRun: function (id, options) {
        return this.run.load(id, null, options);
    }

});

module.exports = Strategy;

},{"../../service/state-api-adapter":37,"../../store/store-factory":44,"../../util/inherit":47,"../auth-manager":9,"../key-names":12,"./identity-strategy":16}],22:[function(require,module,exports){
module.exports = {
    'new-if-initialized': require('./new-if-initialized-strategy'),
    'new-if-persisted': require('./new-if-persisted-strategy'),
    'new-if-missing': require('./new-if-missing-strategy'),
    'always-new': require('./always-new-strategy'),
    multiplayer: require('./multiplayer-strategy'),
    'persistent-single-player': require('./persistent-single-player-strategy'),
    none: require('./identity-strategy')
};

},{"./always-new-strategy":14,"./identity-strategy":16,"./multiplayer-strategy":17,"./new-if-initialized-strategy":18,"./new-if-missing-strategy":19,"./new-if-persisted-strategy":20,"./persistent-single-player-strategy":21}],23:[function(require,module,exports){
'use strict';
var RunService = require('../service/run-api-service');

var defaults = {
    validFilter: { saved: true }
};

function ScenarioManager(options) {
    this.options = $.extend(true, {}, defaults, options);
    this.runService = this.options.run || new RunService(this.options);
}

ScenarioManager.prototype = {
    getRuns: function (filter) {
        this.filter = $.extend(true, {}, this.options.validFilter, filter);
        return this.runService.query(this.filter);
    },

    loadVariables: function (vars) {
        return this.runService.query(this.filter, { include: vars });
    },

    save: function (run, meta) {
        return this._getService(run).save($.extend(true, {}, { saved: true }, meta));
    },

    archive: function (run) {
        return this._getService(run).save({ saved: false });
    },

    _getService: function (run) {
        if (typeof run === 'string') {
            return new RunService($.extend(true, {}, this.options, { filter: run }));
        }

        if (typeof run === 'object' && run instanceof RunService) {
            return run;
        }

        throw new Error('Save method requires a run service or a runId');
    },

    getRun: function (runId) {
        return new RunService($.extend(true, {}, this.options, { filter: runId }));
    }
};

module.exports = ScenarioManager;


},{"../service/run-api-service":35}],24:[function(require,module,exports){
'use strict';


module.exports = {
    reset: function (params, options, manager) {
        return manager.reset(options);
    }
};

},{}],25:[function(require,module,exports){
/**
* ## World Manager
*
* As discussed under the [World API Adapter](../world-api-adapter/), a [run](../../../glossary/#run) is a collection of end user interactions with a project and its model. For building multiplayer simulations you typically want multiple end users to share the same set of interactions, and work within a common state. Epicenter allows you to create "worlds" to handle such cases.
*
* The World Manager provides an easy way to track and access the current world and run for particular end users. It is typically used in pages that end users will interact with. (The related [World API Adapter](../world-api-adapter/) handles creating multiplayer worlds, and adding and removing end users and runs from a world. Because of this, typically the World Adapter is used for facilitator pages in your project.)
*
* ### Using the World Manager
*
* To use the World Manager, instantiate it. Then, make calls to any of the methods you need.
*
* When you instantiate a World Manager, the world's account id, project id, and group are automatically taken from the session (thanks to the [Authentication Service](../auth-api-service)).
*
* Note that the World Manager does *not* create worlds automatically. (This is different than the [Run Manager](../run-manager).) However, you can pass in specific options to any runs created by the manager, using a `run` object.
*
* The parameters for creating a World Manager are:
*
*   * `account`: The **Team ID** in the Epicenter user interface for this project.
*   * `project`: The **Project ID** for this project.
*   * `group`: The **Group Name** for this world.
*   * `run`: Options to use when creating new runs with the manager, e.g. `run: { files: ['data.xls'] }`.
*   * `run.model`: The name of the primary model file for this project. Required if you have not already passed it in as part of the `options` parameter for an enclosing call.
*
* For example:
*
*       var wMgr = new F.manager.WorldManager({
*          account: 'acme-simulations',
*          project: 'supply-chain-game',
*          run: { model: 'supply-chain.py' },
*          group: 'team1'
*       });
*
*       wMgr.getCurrentRun();
*/

'use strict';

var WorldApi = require('../service/world-api-adapter');
var RunManager = require('./run-manager');
var AuthManager = require('./auth-manager');
var worldApi;

function buildStrategy(worldId, dtd) {

    return function Ctor(runService, options) {
        this.runService = runService;
        this.options = options;

        $.extend(this, {
            reset: function () {
                throw new Error('not implementd. Need api changes');
            },

            getRun: function () {
                var me = this;
                //get or create!
                // Model is required in the options
                var model = this.options.run.model || this.options.model;
                return worldApi.getCurrentRunId({ model: model, filter: worldId })
                    .then(function (runId) {
                        return me.runService.load(runId);
                    })
                    .then(function (run) {
                        dtd.resolveWith(me, [run]);
                    })
                    .fail(dtd.reject);
            }
        }
        );
    };
}


module.exports = function (options) {
    this.options = options || { run: {}, world: {} };

    $.extend(true, this.options, this.options.run);
    $.extend(true, this.options, this.options.world);

    worldApi = new WorldApi(this.options);
    this._auth = new AuthManager();
    var me = this;

    var api = {

        /**
        * Returns the current world (object) and an instance of the [World API Adapter](../world-api-adapter/).
        *
        * **Example**
        *
        *       wMgr.getCurrentWorld()
        *           .then(function(world, worldAdapter) {
        *               console.log(world.id);
        *               worldAdapter.getCurrentRunId();
        *           });
        *
        * **Parameters**
        * @param {string} userId (Optional) The id of the user whose world is being accessed. Defaults to the user in the current session.
        * @param {string} groupName (Optional) The name of the group whose world is being accessed. Defaults to the group for the user in the current session.
        * @return {Promise}
        */
        getCurrentWorld: function (userId, groupName) {
            var session = this._auth.getCurrentUserSessionInfo();
            if (!userId) {
                userId = session.userId;
            }
            if (!groupName) {
                groupName = session.groupName;
            }
            return worldApi.getCurrentWorldForUser(userId, groupName);
        },

        /**
        * Returns the current run (object) and an instance of the [Run API Service](../run-api-service/).
        *
        * **Example**
        *
        *       wMgr.getCurrentRun({model: 'myModel.py'})
        *           .then(function(run, runService) {
        *               console.log(run.id);
        *               runService.do('startGame');
        *           });
        *
        * **Parameters**
        * @param {string} model (Optional) The name of the model file. Required if not already passed in as `run.model` when the World Manager is created.
        * @return {Promise}
        */
        getCurrentRun: function (model) {
            var dtd = $.Deferred();
            var session = this._auth.getCurrentUserSessionInfo();
            var curUserId = session.userId;
            var curGroupName = session.groupName;

            function getAndRestoreLatestRun(world) {
                if (!world) {
                    return dtd.reject({ error: 'The user is not part of any world!' });
                }

                var currentWorldId = world.id;
                var runOpts = $.extend(true, me.options, { model: model });
                var strategy = buildStrategy(currentWorldId, dtd);
                var opt = $.extend(true, {}, {
                    strategy: strategy,
                    run: runOpts
                });
                var rm = new RunManager(opt);

                return rm.getRun()
                    .then(function (run) {
                        dtd.resolve(run, rm.runService, rm);
                    });
            }

            this.getCurrentWorld(curUserId, curGroupName)
                .then(getAndRestoreLatestRun);

            return dtd.promise();
        }
    };

    $.extend(this, api);
};

},{"../service/world-api-adapter":41,"./auth-manager":9,"./run-manager":13}],26:[function(require,module,exports){
/**
 * ## File API Service
 *
 * The File API Service allows you to upload and download files directly onto Epicenter, analogous to using the File Manager UI in Epicenter directly or SFTPing files in. It is based on the Epicenter File API.
 *
 * The Asset API Service (https://forio.com/epicenter/docs/public/api_adapters/generated/asset-api-adapter/) is typically used for all project use cases, and it's unlikely this File Service will be used directly except by Admin tools (e.g. Flow Inspector).
 *
 * Partially implemented.
 */

'use strict';

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var SessionManager = require('../store/session-manager');

module.exports = function (config) {
    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: undefined,

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to undefined.
         * @type {String}
         */
        account: undefined,

        /**
         * The project id. Defaults to undefined.
         * @type {String}
         */
        project: undefined,

        /**
         * The folder type.  One of `model` | `static` | `node`.
         * @type {String}
         */
        folderType: 'static',


        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {Object}
         */
        transport: {}
    };

    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }

    var httpOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath('file')
    });

    if (serviceOptions.token) {
        httpOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(httpOptions);

    function uploadBody(fileName, contents) {
        var boundary = '---------------------------7da24f2e50046';

        return {
            body: '--' + boundary + '\r\n' +
                    'Content-Disposition: form-data; name="file";' +
                    'filename="' + fileName + '"\r\n' +
                    'Content-type: text/html\r\n\r\n' +
                    contents + '\r\n' +
                    '--' + boundary + '--',
            boundary: boundary
        };
    }

    function uploadFileOptions(filePath, contents, options) {
        filePath = filePath.split('/');
        var fileName = filePath.pop();
        filePath = filePath.join('/');
        var path = serviceOptions.folderType + '/' + filePath;
        var upload = uploadBody(fileName, contents);

        return $.extend(true, {}, serviceOptions, options, {
            url: urlConfig.getAPIPath('file') + path,
            data: upload.body,
            contentType: 'multipart/form-data; boundary=' + upload.boundary
        });
    }

    var publicAsyncAPI = {
        /**
         * Get a directory listing, or contents of a file.
         * @param {String} filePath  Path to the file
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        getContents: function (filePath, options) {
            var path = serviceOptions.folderType + '/' + filePath;
            var httpOptions = $.extend(true, {}, serviceOptions, options, {
                url: urlConfig.getAPIPath('file') + path
            });
            return http.get('', httpOptions);
        },

        /**
         * Replaces the file at the given file path.
         * @param  {String} filePath Path to the file
         * @param  {String} contents Contents to write to file
         * @param  {Object} options  (Optional) Overrides for configuration options
         * @return {Promise}
         */
        replace: function (filePath, contents, options) {
            var httpOptions = uploadFileOptions(filePath, contents, options);

            return http.put(httpOptions.data, httpOptions);
        },

        /**
         * Creates a file in the given file path.
         * @param  {String} filePath Path to the file
         * @param  {String} contents Contents to write to file
         * @param  {Boolean} replaceExisting Replace file if it already exists; defaults to false
         * @param  {Object} options (Optional) Overrides for configuration options
         * @return {Promise}
         */
        create: function (filePath, contents, replaceExisting, options) {
            var httpOptions = uploadFileOptions(filePath, contents, options);
            var prom = http.post(httpOptions.data, httpOptions);
            var me = this;
            if (replaceExisting === true) {
                prom = prom.then(null, function (xhr) {
                    var conflictStatus = 409;
                    if (xhr.status === conflictStatus) {
                        return me.replace(filePath, contents, options);
                    }
                });
            }
            return prom;
        },

        /**
         * Removes the file.
         * @param  {String} filePath Path to the file
         * @param  {Object} options  (Optional) Overrides for configuration options
         * @return {Promise}
         */
        remove: function (filePath, options) {
            var path = serviceOptions.folderType + '/' + filePath;
            var httpOptions = $.extend(true, {}, serviceOptions, options, {
                url: urlConfig.getAPIPath('file') + path
            });
            return http.delete(null, httpOptions);
        },

        /**
         * Renames the file.
         * @param  {String} filePath Path to the file
         * @param  {String} newName  New name of file
         * @param  {Object} options  (Optional) Overrides for configuration options
         * @return {Promise}
         */
        rename: function (filePath, newName, options) {
            var path = serviceOptions.folderType + '/' + filePath;
            var httpOptions = $.extend(true, {}, serviceOptions, options, {
                url: urlConfig.getAPIPath('file') + path
            });
            return http.patch({ name: newName }, httpOptions);
        }
    };

    $.extend(this, publicAsyncAPI);
};

},{"../store/session-manager":43,"../transport/http-transport-factory":46,"./configuration-service":30}],27:[function(require,module,exports){
/**
 * ## Asset API Adapter
 *
 * The Asset API Adapter allows you to store assets -- resources or files of any kind -- used by a project with a scope that is specific to project, group, or end user.
 *
 * Assets are used with [team projects](../../../project_admin/#team). One common use case is having end users in a [group](../../../glossary/#groups) or in a [multiplayer world](../../../glossary/#world) upload data -- videos created during game play, profile pictures for customizing their experience, etc. -- as part of playing through the project.
 *
 * Resources created using the Asset Adapter are scoped:
 *
 *  * Project assets are writable only by [team members](../../../glossary/#team), that is, Epicenter authors.
 *  * Group assets are writable by anyone with access to the project that is part of that particular [group](../../../glossary/#groups). This includes all [team members](../../../glossary/#team) (Epicenter authors) and any [end users](../../../glossary/#users) who are members of the group -- both facilitators and standard end users.
 *  * User assets are writable by the specific end user, and by the facilitator of the group.
 *  * All assets are readable by anyone with the exact URI.
 *
 * To use the Asset Adapter, instantiate it and then access the methods provided. Instantiating requires the account id (**Team ID** in the Epicenter user interface) and project id (**Project ID**). The group name is required for assets with a group scope, and the group name and userId are required for assets with a user scope. If not included, they are taken from the logged in user's session information if needed.
 *
 * When creating an asset, you can pass in text (encoded data) to the `create()` call. Alternatively, you can make the `create()` call as part of an HTML form and pass in a file uploaded via the form.
 *
 *       // instantiate the Asset Adapter
 *       var aa = new F.service.Asset({
 *          account: 'acme-simulations',
 *          project: 'supply-chain-game',
 *          group: 'team1',
 *          userId: '12345'
 *       });
 *
 *       // create a new asset using encoded text
 *       aa.create('test.txt', {
 *           encoding: 'BASE_64',
 *           data: 'VGhpcyBpcyBhIHRlc3QgZmlsZS4=',
 *           contentType: 'text/plain'
 *       }, { scope: 'user' });
 *
 *       // alternatively, create a new asset using a file uploaded through a form
 *       // this sample code goes with an html form that looks like this:
 *       //
 *       // <form id="upload-file">
 *       //   <input id="file" type="file">
 *       //   <input id="filename" type="text" value="myFile.txt">
 *       //   <button type="submit">Upload myFile</button>
 *       // </form>
 *       //
 *       $('#upload-file').on('submit', function (e) {
 *          e.preventDefault();
 *          var filename = $('#filename').val();
 *          var data = new FormData();
 *          var inputControl = $('#file')[0];
 *          data.append('file', inputControl.files[0], filename);
 *
 *          aa.create(filename, data, { scope: 'user' });
 *       });
 *
 */

'use strict';

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var _pick = require('../util/object-util')._pick;
var SessionManager = require('../store/session-manager');

var apiEndpoint = 'asset';

module.exports = function (config) {
    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: undefined,
        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects). If left undefined, taken from the URL.
         * @type {String}
         */
        account: undefined,
        /**
         * The project id. If left undefined, taken from the URL.
         * @type {String}
         */
        project: undefined,
        /**
         * The group name. Defaults to session's `groupName`.
         * @type {String}
         */
        group: undefined,
        /**
         * The user id. Defaults to session's `userId`.
         * @type {String}
         */
        userId: undefined,
        /**
         * The scope for the asset. Valid values are: `user`, `group`, and `project`. See above for the required permissions to write to each scope. Defaults to `user`, meaning the current end user or a facilitator in the end user's group can edit the asset.
         * @type {String}
         */
        scope: 'user',
        /**
         * Determines if a request to list the assets in a scope includes the complete URL for each asset (`true`), or only the file names of the assets (`false`). Defaults to `true`.
         * @type {boolean}
         */
        fullUrl: true,
        /**
         * The transport object contains the options passed to the XHR request.
         * @type {object}
         */
        transport: {
            processData: false
        }
    };
    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');

    if (!serviceOptions.account) {
        serviceOptions.account = urlConfig.accountPath;
    }

    if (!serviceOptions.project) {
        serviceOptions.project = urlConfig.projectPath;
    }

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }

    var http = new TransportFactory(transportOptions);

    var assetApiParams = ['encoding', 'data', 'contentType'];
    var scopeConfig = {
        user: ['scope', 'account', 'project', 'group', 'userId'],
        group: ['scope', 'account', 'project', 'group'],
        project: ['scope', 'account', 'project'],
    };

    var validateFilename = function (filename) {
        if (!filename) {
            throw new Error('filename is needed.');
        }
    };

    var validateUrlParams = function (options) {
        var partKeys = scopeConfig[options.scope];
        if (!partKeys) {
            throw new Error('scope parameter is needed.');
        }

        $.each(partKeys, function () {
            if (!options[this]) {
                throw new Error(this + ' parameter is needed.');
            }
        });
    };

    var buildUrl = function (filename, options) {
        validateUrlParams(options);
        var partKeys = scopeConfig[options.scope];
        var parts = $.map(partKeys, function (key) {
            return options[key];
        });
        if (filename) {
            // This prevents adding a trailing / in the URL as the Asset API
            // does not work correctly with it
            filename = '/' + filename;
        }
        return urlConfig.getAPIPath(apiEndpoint) + parts.join('/') + filename;
    };

    // Private function, all requests follow a more or less same approach to
    // use the Asset API and the difference is the HTTP verb
    //
    // @param {string} method` (Required) HTTP verb
    // @param {string} filename` (Required) Name of the file to delete/replace/create
    // @param {object} params` (Optional) Body parameters to send to the Asset API
    // @param {object} options` (Optional) Options object to override global options.
    var upload = function (method, filename, params, options) {
        validateFilename(filename);
        // make sure the parameter is clean
        method = method.toLowerCase();
        var contentType = params instanceof FormData === true ? false : 'application/json';
        if (contentType === 'application/json') {
            // whitelist the fields that we actually can send to the api
            params = _pick(params, assetApiParams);
        } else { // else we're sending form data which goes directly in request body
            // For multipart/form-data uploads the filename is not set in the URL,
            // it's getting picked by the FormData field filename.
            filename = method === 'post' || method === 'put' ? '' : filename;
        }
        var urlOptions = $.extend({}, serviceOptions, options);
        var url = buildUrl(filename, urlOptions);
        var createOptions = $.extend(true, {}, urlOptions, { url: url, contentType: contentType });

        return http[method](params, createOptions);
    };

    var publicAPI = {
        /**
        * Creates a file in the Asset API. The server returns an error (status code `409`, conflict) if the file already exists, so
        * check first with a `list()` or a `get()`.
        *
        *  **Example**
        *
        *       var aa = new F.service.Asset({
        *          account: 'acme-simulations',
        *          project: 'supply-chain-game',
        *          group: 'team1',
        *          userId: ''
        *       });
        *
        *       // create a new asset using encoded text
        *       aa.create('test.txt', {
        *           encoding: 'BASE_64',
        *           data: 'VGhpcyBpcyBhIHRlc3QgZmlsZS4=',
        *           contentType: 'text/plain'
        *       }, { scope: 'user' });
        *
        *       // alternatively, create a new asset using a file uploaded through a form
        *       // this sample code goes with an html form that looks like this:
        *       //
        *       // <form id="upload-file">
        *       //   <input id="file" type="file">
        *       //   <input id="filename" type="text" value="myFile.txt">
        *       //   <button type="submit">Upload myFile</button>
        *       // </form>
        *       //
        *       $('#upload-file').on('submit', function (e) {
        *          e.preventDefault();
        *          var filename = $('#filename').val();
        *          var data = new FormData();
        *          var inputControl = $('#file')[0];
        *          data.append('file', inputControl.files[0], filename);
        *
        *          aa.create(filename, data, { scope: 'user' });
        *       });
        *
        *
        *  **Parameters**
        * @param {string} filename (Required) Name of the file to create.
        * @param {object} params (Optional) Body parameters to send to the Asset API. Required if the `options.transport.contentType` is `application/json`, otherwise ignored.
        * @param {string} params.encoding Either `HEX` or `BASE_64`. Required if `options.transport.contentType` is `application/json`.
        * @param {string} params.data The encoded data for the file. Required if `options.transport.contentType` is `application/json`.
        * @param {string} params.contentType The mime type of the file. Optional.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        create: function (filename, params, options) {
            return upload('post', filename, params, options);
        },

        /**
        * Gets a file from the Asset API, fetching the asset content. (To get a list
        * of the assets in a scope, use `list()`.)
        *
        *  **Parameters**
        * @param {string} filename (Required) Name of the file to retrieve.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        get: function (filename, options) {
            var getServiceOptions = _pick(serviceOptions, ['scope', 'account', 'project', 'group', 'userId']);
            var urlOptions = $.extend({}, getServiceOptions, options);
            var url = buildUrl(filename, urlOptions);
            var getOptions = $.extend(true, {}, urlOptions, { url: url });

            return http.get({}, getOptions);
        },

        /**
        * Gets the list of the assets in a scope.
        *
        * **Example**
        *
        *       aa.list({ fullUrl: true }).then(function(fileList){
        *           console.log('array of files = ', fileList);
        *       });
        *
        *  **Parameters**
        * @param {object} options (Optional) Options object to override global options.
        * @param {string} options.scope (Optional) The scope (`user`, `group`, `project`).
        * @param {boolean} options.fullUrl (Optional) Determines if the list of assets in a scope includes the complete URL for each asset (`true`), or only the file names of the assets (`false`).
        * @return {Promise}
        */
        list: function (options) {
            var dtd = $.Deferred();
            var me = this;
            var urlOptions = $.extend({}, serviceOptions, options);
            var url = buildUrl('', urlOptions);
            var getOptions = $.extend(true, {}, urlOptions, { url: url });
            var fullUrl = getOptions.fullUrl;

            if (!fullUrl) {
                return http.get({}, getOptions);
            }

            http.get({}, getOptions)
                .then(function (files) {
                    var fullPathFiles = $.map(files, function (file) {
                        return buildUrl(file, urlOptions);
                    });
                    dtd.resolveWith(me, [fullPathFiles]);
                })
                .fail(dtd.reject);

            return dtd.promise();
        },

        /**
        * Replaces an existing file in the Asset API.
        *
        * **Example**
        *
        *       // replace an asset using encoded text
        *       aa.replace('test.txt', {
        *           encoding: 'BASE_64',
        *           data: 'VGhpcyBpcyBhIHNlY29uZCB0ZXN0IGZpbGUu',
        *           contentType: 'text/plain'
        *       }, { scope: 'user' });
        *
        *       // alternatively, replace an asset using a file uploaded through a form
        *       // this sample code goes with an html form that looks like this:
        *       //
        *       // <form id="replace-file">
        *       //   <input id="file" type="file">
        *       //   <input id="replace-filename" type="text" value="myFile.txt">
        *       //   <button type="submit">Replace myFile</button>
        *       // </form>
        *       //
        *       $('#replace-file').on('submit', function (e) {
        *          e.preventDefault();
        *          var filename = $('#replace-filename').val();
        *          var data = new FormData();
        *          var inputControl = $('#file')[0];
        *          data.append('file', inputControl.files[0], filename);
        *
        *          aa.replace(filename, data, { scope: 'user' });
        *       });
        *
        *  **Parameters**
        * @param {string} filename (Required) Name of the file being replaced.
        * @param {object} params (Optional) Body parameters to send to the Asset API. Required if the `options.transport.contentType` is `application/json`, otherwise ignored.
        * @param {string} params.encoding Either `HEX` or `BASE_64`. Required if `options.transport.contentType` is `application/json`.
        * @param {string} params.data The encoded data for the file. Required if `options.transport.contentType` is `application/json`.
        * @param {string} params.contentType The mime type of the file. Optional.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        replace: function (filename, params, options) {
            return upload('put', filename, params, options);
        },

        /**
        * Deletes a file from the Asset API.
        *
        * **Example**
        *
        *       aa.delete(sampleFileName);
        *
        *  **Parameters**
        * @param {string} filename (Required) Name of the file to delete.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        delete: function (filename, options) {
            return upload('delete', filename, {}, options);
        },

        assetUrl: function (filename, options) {
            var urlOptions = $.extend({}, serviceOptions, options);
            return buildUrl(filename, urlOptions);
        }
    };
    $.extend(this, publicAPI);
};

},{"../store/session-manager":43,"../transport/http-transport-factory":46,"../util/object-util":48,"./configuration-service":30}],28:[function(require,module,exports){
/**
 *
 * ## Authentication API Service
 *
 * The Authentication API Service provides a method for logging in, which creates and returns a user access token.
 *
 * User access tokens are required for each call to Epicenter. (See [Project Access](../../../project_access/) for more information.)
 *
 * If you need additional functionality -- such as tracking session information, easily retrieving the user token, or getting the groups to which an end user belongs -- consider using the [Authorization Manager](../auth-manager/) instead.
 *
 *      var auth = new F.service.Auth();
 *      auth.login({ userName: 'jsmith@acmesimulations.com',
 *                  password: 'passw0rd' });
 */

'use strict';

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');

module.exports = function (config) {
    var defaults = {
        /**
         * Email or username to use for logging in. Defaults to empty string.
         * @type {String}
         */
        userName: '',

        /**
         * Password for specified `userName`. Defaults to empty string.
         * @type {String}
         */
        password: '',

        /**
         * The account id for this `userName`. In the Epicenter UI, this is the **Team ID** (for team projects) or the **User ID** (for personal projects). Required if the `userName` is for an [end user](../../../glossary/#users). Defaults to empty string.
         * @type {String}
         */
        account: '',

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {Object}
         */
        transport: {}
    };
    var serviceOptions = $.extend({}, defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath('authentication')
    });
    var http = new TransportFactory(transportOptions);

    var publicAPI = {

        /**
         * Logs user in, returning the user access token.
         *
         * If no `userName` or `password` were provided in the initial configuration options, they are required in the `options` here. If no `account` was provided in the initial configuration options and the `userName` is for an [end user](../../../glossary/#users), the `account` is required as well.
         *
         * **Example**
         *
         *      auth.login({
         *          userName: 'jsmith',
         *          password: 'passw0rd',
         *          account: 'acme-simulations' })
         *      .then(function (token) {
         *          console.log("user access token is: ", token.access_token);
         *      });
         *
         * **Parameters**
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        login: function (options) {
            var httpOptions = $.extend(true, { success: $.noop }, serviceOptions, options);
            if (!httpOptions.userName || !httpOptions.password) {
                var resp = { status: 401, statusMessage: 'No username or password specified.' };
                if (options.error) {
                    options.error.call(this, resp);
                }

                return $.Deferred().reject(resp).promise();
            }

            var postParams = {
                userName: httpOptions.userName,
                password: httpOptions.password,
            };
            if (httpOptions.account) {
                //pass in null for account under options if you don't want it to be sent
                postParams.account = httpOptions.account;
            }

            return http.post(postParams, httpOptions);
        },

        // (replace with /* */ comment block, to make visible in docs, once this is more than a noop)
        //
        // Logs user out from specified accounts.
        //
        // Epicenter logout is not implemented yet, so for now this is a dummy promise that gets automatically resolved.
        //
        // **Example**
        //
        //      auth.logout();
        //
        // **Parameters**
        // @param {Object} `options` (Optional) Overrides for configuration options.
        //
        logout: function (options) {
            var dtd = $.Deferred();
            dtd.resolve();
            return dtd.promise();
        }
    };

    $.extend(this, publicAPI);
};

},{"../transport/http-transport-factory":46,"./configuration-service":30}],29:[function(require,module,exports){
/**
 * ## Channel Service
 *
 * The Epicenter platform provides a push channel, which allows you to publish and subscribe to messages within a [project](../../../glossary/#projects), [group](../../../glossary/#groups), or [multiplayer world](../../../glossary/#world). There are two main use cases for the channel: event notifications and chat messages.
 *
 * The Channel Service is a building block for this functionality. It creates a publish-subscribe object, allowing you to publish messages, subscribe to messages, or unsubscribe from messages for a given 'topic' on a `$.cometd` transport instance.
 *
 * Typically, you use the [Epicenter Channel Manager](../epicenter-channel-manager/) to create or retrieve channels, then use the Channel Service `subscribe()` and `publish()` methods to listen to or update data. (For additional background on Epicenter's push channel, see the introductory notes on the [Push Channel API](../../../rest_apis/multiplayer/channel/) page.)
 *
 * You'll need to include the `epicenter-multiplayer-dependencies.js` library in addition to the `epicenter.js` library in your project to use the Channel Service. See [Including Epicenter.js](../../#include).
 *
 * To use the Channel Service, instantiate it, then make calls to any of the methods you need.
 *
 *        var cs = new F.service.Channel();
 *        cs.publish('/acme-simulations/supply-chain-game/fall-seminar/run/variables', { price: 50 });
 *
 * The parameters for instantiating a Channel Service include:
 *
 * * `options` The options object to configure the Channel Service.
 * * `options.base` The base topic. This is added as a prefix to all further topics you publish or subscribe to while working with this Channel Service.
 * * `options.topicResolver` A function that processes all 'topics' passed into the `publish` and `subscribe` methods. This is useful if you want to implement your own serialize functions for converting custom objects to topic names. Returns a String. By default, it just echoes the topic.
 * * `options.transport` The instance of `$.cometd` to hook onto. See http://docs.cometd.org/reference/javascript.html for additional background on cometd.
 */

'use strict';
var Channel = function (options) {
    var defaults = {

        /**
         * The base topic. This is added as a prefix to all further topics you publish or subscribe to while working with this Channel Service.
         * @type {string}
         */
        base: '',

        /**
         * A function that processes all 'topics' passed into the `publish` and `subscribe` methods. This is useful if you want to implement your own serialize functions for converting custom objects to topic names. By default, it just echoes the topic.
         *
         * **Parameters**
         *
         * * `topic` Topic to parse.
         *
         * **Return Value**
         *
         * * *String*: This function should return a string topic.
         *
         * @type {function}
         * @param {String} topic topic to resolve
         * @return {String}
         */
        topicResolver: function (topic) {
            return topic;
        },

        /**
         * The instance of `$.cometd` to hook onto.
         * @type {object}
         */
        transport: null
    };
    this.channelOptions = $.extend(true, {}, defaults, options);
};

var makeName = function (channelName, topic) {
    //Replace trailing/double slashes
    var newName = (channelName ? (channelName + '/' + topic) : topic).replace(/\/\//g, '/').replace(/\/$/, '');
    return newName;
};


Channel.prototype = $.extend(Channel.prototype, {

    // future functionality:
    //      // Set the context for the callback
    //      cs.subscribe('run', function () { this.innerHTML = 'Triggered'}, document.body);
     //
     //      // Control the order of operations by setting the `priority`
     //      cs.subscribe('run', cb, this, {priority: 9});
     //
     //      // Only execute the callback, `cb`, if the value of the `price` variable is 50
     //      cs.subscribe('run/variables/price', cb, this, {priority: 30, value: 50});
     //
     //      // Only execute the callback, `cb`, if the value of the `price` variable is greater than 50
     //      subscribe('run/variables/price', cb, this, {priority: 30, value: '>50'});
     //
     //      // Only execute the callback, `cb`, if the value of the `price` variable is even
     //      subscribe('run/variables/price', cb, this, {priority: 30, value: function (val) {return val % 2 === 0}});


    /**
     * Subscribe to changes on a topic.
     *
     * The topic should include the full path of the account id (**Team ID** for team projects), project id, and group name. (In most cases, it is simpler to use the [Epicenter Channel Manager](../epicenter-channel-manager/) instead, in which case this is configured for you.)
     *
     *  **Examples**
     *
     *      var cb = function(val) { console.log(val.data); };
     *
     *      // Subscribe to changes on a top-level 'run' topic
     *      cs.subscribe('/acme-simulations/supply-chain-game/fall-seminar/run', cb);
     *
     *      // Subscribe to changes on children of the 'run' topic. Note this will also be triggered for changes to run.x.y.z.
     *      cs.subscribe('/acme-simulations/supply-chain-game/fall-seminar/run/*', cb);
     *
     *      // Subscribe to changes on both the top-level 'run' topic and its children
     *      cs.subscribe(['/acme-simulations/supply-chain-game/fall-seminar/run',
     *          '/acme-simulations/supply-chain-game/fall-seminar/run/*'], cb);
     *
     *      // Subscribe to changes on a particular variable
     *      subscribe('/acme-simulations/supply-chain-game/fall-seminar/run/variables/price', cb);
     *
     *
     * **Return Value**
     *
     * * *String* Returns a token you can later use to unsubscribe.
     *
     * **Parameters**
     * @param  {String|Array}   topic    List of topics to listen for changes on.
     * @param  {Function} callback Callback function to execute. Callback is called with signature `(evt, payload, metadata)`.
     * @param  {Object}   context  Context in which the `callback` is executed.
     * @param  {Object}   options  (Optional) Overrides for configuration options.
     * @param  {Number}   options.priority  Used to control order of operations. Defaults to 0. Can be any +ve or -ve number.
     * @param  {String|Number|Function}   options.value The `callback` is only triggered if this condition matches. See examples for details.
     * @return {string} Subscription ID
     */
    subscribe: function (topic, callback, context, options) {

        var topics = [].concat(topic);
        var me = this;
        var subscriptionIds = [];
        var opts = me.channelOptions;

        opts.transport.batch(function () {
            $.each(topics, function (index, topic) {
                topic = makeName(opts.base, opts.topicResolver(topic));
                subscriptionIds.push(opts.transport.subscribe(topic, callback));
            });
        });
        return (subscriptionIds[1] ? subscriptionIds : subscriptionIds[0]);
    },

    /**
     * Publish data to a topic.
     *
     * **Examples**
     *
     *      // Send data to all subscribers of the 'run' topic
     *      cs.publish('/acme-simulations/supply-chain-game/fall-seminar/run', { completed: false });
     *
     *      // Send data to all subscribers of the 'run/variables' topic
     *      cs.publish('/acme-simulations/supply-chain-game/fall-seminar/run/variables', { price: 50 });
     *
     * **Parameters**
     *
     * @param  {String} topic Topic to publish to.
     * @param  {*} data  Data to publish to topic.
     * @return {Array | Object} Responses to published data
     *
     */
    publish: function (topic, data) {
        var topics = [].concat(topic);
        var me = this;
        var returnObjs = [];
        var opts = me.channelOptions;


        opts.transport.batch(function () {
            $.each(topics, function (index, topic) {
                topic = makeName(opts.base, opts.topicResolver(topic));
                if (topic.charAt(topic.length - 1) === '*') {
                    topic = topic.replace(/\*+$/, '');
                    console.warn('You can cannot publish to channels with wildcards. Publishing to ', topic, 'instead');
                }
                returnObjs.push(opts.transport.publish(topic, data));
            });
        });
        return (returnObjs[1] ? returnObjs : returnObjs[0]);
    },

    /**
     * Unsubscribe from changes to a topic.
     *
     * **Example**
     *
     *      cs.unsubscribe('sampleToken');
     *
     * **Parameters**
     * @param  {String} token The token for topic is returned when you initially subscribe. Pass it here to unsubscribe from that topic.
     * @return {Object} reference to current instance
     */
    unsubscribe: function (token) {
        this.channelOptions.transport.unsubscribe(token);
        return this;
    },

    /**
     * Start listening for events on this instance. Signature is same as for jQuery Events: http://api.jquery.com/on/.
     *
     * Supported events are: `connect`, `disconnect`, `subscribe`, `unsubscribe`, `publish`, `error`.
     *
     * **Parameters**
     *
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/on/.
     */
    on: function (event) {
        $(this).on.apply($(this), arguments);
    },

    /**
     * Stop listening for events on this instance. Signature is same as for jQuery Events: http://api.jquery.com/off/.
     *
     * **Parameters**
     *
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/off/.
     */
    off: function (event) {
        $(this).off.apply($(this), arguments);
    },

    /**
     * Trigger events and execute handlers. Signature is same as for jQuery Events: http://api.jquery.com/trigger/.
     *
     * **Parameters**
     *
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/trigger/.
     */
    trigger: function (event) {
        $(this).trigger.apply($(this), arguments);
    }

});

module.exports = Channel;

},{}],30:[function(require,module,exports){
/**
 * @class ConfigurationService
 *
 * All services take in a configuration settings object to configure themselves. A JS hash {} is a valid configuration object, but optionally you can use the configuration service to toggle configs based on the environment
 *
 * @example
 *     var cs = require('configuration-service')({
 *          dev: { //environment
                port: 3000,
                host: 'localhost',
            },
            prod: {
                port: 8080,
                host: 'api.forio.com',
                logLevel: 'none'
            },
            logLevel: 'DEBUG' //global
 *     });
 *
 *      cs.get('logLevel'); //returns 'DEBUG'
 *
 *      cs.setEnv('dev');
 *      cs.get('logLevel'); //returns 'DEBUG'
 *
 *      cs.setEnv('prod');
 *      cs.get('logLevel'); //returns 'none'
 *
 */

'use strict';
var urlService = require('./url-config-service');

module.exports = function (config) {
    //TODO: Environments
    var defaults = {
        logLevel: 'NONE'
    };
    var serviceOptions = $.extend({}, defaults, config);
    serviceOptions.server = urlService(serviceOptions.server);

    return {

        data: serviceOptions,

        /**
         * Set the environment key to get configuration options from
         * @param { string} env
         */
        setEnv: function (env) {

        },

        /**
         * Get configuration.
         * @param  { string} property optional
         * @return {*}          Value of property if specified, the entire config object otherwise
         */
        get: function (property) {
            return serviceOptions[property];
        },

        /**
         * Set configuration.
         * @param  { string|Object} key if a key is provided, set a key to that value. Otherwise merge object with current config
         * @param  {*} value  value for provided key
         */
        set: function (key, value) {
            serviceOptions[key] = value;
        }
    };
};


},{"./url-config-service":38}],31:[function(require,module,exports){
/**
 * ## Data API Service
 *
 * The Data API Service allows you to create, access, and manipulate data related to any of your projects. Data are organized in collections. Each collection contains a document; each element of this top-level document is a JSON object. (See additional information on the underlying [Data API](../../../rest_apis/data_api/).)
 *
 * All API calls take in an "options" object as the last parameter. The options can be used to extend/override the Data API Service defaults. In particular, there are three required parameters when you instantiate the Data Service:
 *
 * * `account`: Epicenter account id (**Team ID** for team projects, **User ID** for personal projects).
 * * `project`: Epicenter project id.
 * * `root`: The the name of the collection. If you have multiple collections within each of your projects, you can also pass the collection name as an option for each call.
 *
 *       var ds = new F.service.Data({
 *          account: 'acme-simulations',
 *          project: 'supply-chain-game',
 *          root: 'survey-responses',
 *          server: { host: 'api.forio.com' }
 *       });
 *       ds.saveAs('user1',
 *          { 'question1': 2, 'question2': 10,
 *          'question3': false, 'question4': 'sometimes' } );
 *       ds.saveAs('user2',
 *          { 'question1': 3, 'question2': 8,
 *          'question3': true, 'question4': 'always' } );
 *       ds.query('',{ 'question2': { '$gt': 9} });
 *
 * Note that in addition to the `account`, `project`, and `root`, the Data Service parameters optionally include a `server` object, whose `host` field contains the URI of the Forio server. This is automatically set, but you can pass it explicitly if desired. It is most commonly used for clarity when you are [hosting an Epicenter project on your own server](../../../how_to/self_hosting/).
 */

'use strict';

var ConfigService = require('./configuration-service');
var qutil = require('../util/query-util');
var TransportFactory = require('../transport/http-transport-factory');
var SessionManager = require('../store/session-manager');

module.exports = function (config) {
    var defaults = {
        /**
         * Name of collection. Defaults to `/`, that is, the root level of your project at `forio.com/app/your-account-id/your-project-id/`. Required.
         * @type {String}
         */
        root: '/',

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string. If left undefined, taken from the URL.
         * @type {String}
         */
        account: undefined,

        /**
         * The project id. Defaults to empty string. If left undefined, taken from the URL.
         * @type {String}
         */
        project: undefined,

        /**
         * For operations that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: undefined,

        //Options to pass on to the underlying transport layer
        transport: {}
    };
    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);

    var urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }

    var getURL = function (key, root) {
        if (!root) {
            root = serviceOptions.root;
        }
        var url = urlConfig.getAPIPath('data') + qutil.addTrailingSlash(root);
        if (key) {
            url += qutil.addTrailingSlash(key);
        }
        return url;
    };

    var httpOptions = $.extend(true, {}, serviceOptions.transport, {
        url: getURL
    });
    if (serviceOptions.token) {
        httpOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(httpOptions);

    var publicAPI = {

        /**
         * Search for data within a collection.
         *
         * Searching using comparison or logical operators (as opposed to exact matches) requires MongoDB syntax. See the underlying [Data API](../../../rest_apis/data_api/#searching) for additional details.
         *
         * **Examples**
         *
         *      // request all data associated with document 'user1'
         *      ds.query('user1');
         *
         *      // exact matching:
         *      // request all documents in collection where 'question2' is 9
         *      ds.query('', { 'question2': 9});
         *
         *      // comparison operators:
         *      // request all documents in collection
         *      // where 'question2' is greater than 9
         *      ds.query('', { 'question2': { '$gt': 9} });
         *
         *      // logical operators:
         *      // request all documents in collection
         *      // where 'question2' is less than 10, and 'question3' is false
         *      ds.query('', { '$and': [ { 'question2': { '$lt':10} }, { 'question3': false }] });
         *
         *      // regular expresssions: use any Perl-compatible regular expressions
         *      // request all documents in collection
         *      // where 'question5' contains the string '.*day'
         *      ds.query('', { 'question5': { '$regex': '.*day' } });
         *
         * **Parameters**
         * @param {String} key The name of the document to search. Pass the empty string ('') to search the entire collection.
         * @param {Object} query The query object. For exact matching, this object contains the field name and field value to match. For matching based on comparison, this object contains the field name and the comparison expression. For matching based on logical operators, this object contains an expression using MongoDB syntax. See the underlying [Data API](../../../rest_apis/data_api/#searching) for additional examples.
         * @param {Object} outputModifier (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise} 
         */
        query: function (key, query, outputModifier, options) {
            var params = $.extend(true, { q: query }, outputModifier);
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions.url = getURL(key, httpOptions.root);
            return http.get(params, httpOptions);
        },

        /**
         * Save data to an anonymous document within the collection.
         *
         * (Documents are top-level elements within a collection. Collections must be unique within this account (team or personal account) and project and are set with the `root` field in the `option` parameter. See the underlying [Data API](../../../rest_apis/data_api/) for additional background.)
         *
         * **Example**
         *
         *      ds.save('question1', 'yes');
         *      ds.save({question1:'yes', question2: 32 });
         *      ds.save({ name:'John', className: 'CS101' }, { root: 'students' });
         *
         * **Parameters**
         *
         * @param {String|Object} key If `key` is a string, it is the id of the element to save (create) in this document. If `key` is an object, the object is the data to save (create) in this document. In both cases, the id for the document is generated automatically.
         * @param {Object} value (Optional) The data to save. If `key` is a string, this is the value to save. If `key` is an object, the value(s) to save are already part of `key` and this argument is not required.
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise} 
         */
        save: function (key, value, options) {
            var attrs;
            if (typeof key === 'object') {
                attrs = key;
                options = value;
            } else {
                (attrs = {})[key] = value;
            }
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions.url = getURL('', httpOptions.root);

            return http.post(attrs, httpOptions);
        },

        /**
         * Save data to a named document or element within the collection. The `root` of the collection must be specified separately in configuration options, either as part of the call or as part of the initialization of ds.
         *
         * (Documents are top-level elements within a collection. Collections must be unique within this account (team or personal account) and project and are set with the `root` field in the `option` parameter. See the underlying [Data API](../../../rest_apis/data_api/) for additional background.)
         *
         * **Example**
         *
         *      ds.saveAs('user1',
         *          { 'question1': 2, 'question2': 10,
         *           'question3': false, 'question4': 'sometimes' } );
         *      ds.saveAs('student1',
         *          { firstName: 'john', lastName: 'smith' },
         *          { root: 'students' });
         *      ds.saveAs('mgmt100/groupB',
         *          { scenarioYear: '2015' },
         *          { root: 'myclasses' });
         *
         * **Parameters**
         *
         * @param {String} key Id of the document.
         * @param {Object} value (Optional) The data to save, in key:value pairs.
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise} 
         */
        saveAs: function (key, value, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions.url = getURL(key, httpOptions.root);

            return http.put(value, httpOptions);
        },

        /**
         * Get data for a specific document or field.
         *
         * **Example**
         *
         *      ds.load('user1');
         *      ds.load('user1/question3');
         *
         * **Parameters**
         * @param  {String|Object} key The id of the data to return. Can be the id of a document, or a path to data within that document.
         * @param {Object} outputModifier (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} options Overrides for configuration options.
         * @return {Promise} 
         */
        load: function (key, outputModifier, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions.url = getURL(key, httpOptions.root);
            return http.get(outputModifier, httpOptions);
        },

        /**
         * Removes data from collection. Only documents (top-level elements in each collection) can be deleted.
         *
         * **Example**
         *
         *     ds.remove('user1');
         *
         *
         * **Parameters**
         *
         * @param {String|Array} keys The id of the document to remove from this collection, or an array of such ids.
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise} 
         */
        remove: function (keys, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            var params;
            if ($.isArray(keys)) {
                params = { id: keys };
            } else {
                params = '';
                httpOptions.url = getURL(keys, httpOptions.root);
            }
            return http.delete(params, httpOptions);
        }

        // Epicenter doesn't allow nuking collections
        //     /**
        //      * Removes collection being referenced
        //      * @return null
        //      */
        //     destroy: function (options) {
        //         return this.remove('', options);
        //     }
    };

    $.extend(this, publicAPI);
};

},{"../store/session-manager":43,"../transport/http-transport-factory":46,"../util/query-util":50,"./configuration-service":30}],32:[function(require,module,exports){
/**
 *
 * ## Group API Adapter
 *
 * The Group API Adapter provides methods to look up, create, change or remove information about groups in a project. It is based on query capabilities of the underlying RESTful [Group API](../../../rest_apis/user_management/group/).
 *
 * This is only needed for Authenticated projects, that is, team projects with [end users and groups](../../../groups_and_end_users/).
 *
 *      var ma = new F.service.Group({ token: 'user-or-project-access-token' });
 *      ma.getGroupsForProject({ account: 'acme', project: 'sample' });
 */

'use strict';

var serviceUtils = require('./service-utils');
var TransportFactory = require('../transport/http-transport-factory');
var objectAssign = require('object-assign');

var apiEndpoint = 'group/local';

var GroupService = function (config) {
    var defaults = {
        /**
         * Epicenter account name. Defaults to undefined.
         * @type {string}
         */
        account: undefined,

        /**
         * Epicenter project name. Defaults to undefined.
         * @type {string}
         */
        project: undefined,

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {object}
         */
        transport: {}
    };
    var serviceOptions = serviceUtils.getDefaultOptions(defaults, config, { apiEndpoint: apiEndpoint });
    var transportOptions = serviceOptions.transport;
    delete serviceOptions.transport;
    var http = new TransportFactory(transportOptions, serviceOptions);
    var publicAPI = {
        /**
        * Gets information for a group or multiple groups.
        * @param {Object} params object with query parameters
        * @patam {string} params.q partial match for name, organization or event.
        * @patam {string} params.account Epicenter's Team ID
        * @patam {string} params.project Epicenter's Project ID
        * @patam {string} params.name Epicenter's Group Name
        * @param {Object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */
        getGroups: function (params, options) {
            //groupID is part of the URL
            //q, account and project are part of the query string
            var finalOpts = objectAssign({}, serviceOptions, options);
            var finalParams;
            if (typeof params === 'string') {
                finalOpts.url = serviceUtils.getApiUrl(apiEndpoint + '/' + params, finalOpts);
            } else {
                finalParams = params;
            }
            return http.get(finalParams, finalOpts);
        }
    };
    objectAssign(this, publicAPI);
};

module.exports = GroupService;

},{"../transport/http-transport-factory":46,"./service-utils":36,"object-assign":5}],33:[function(require,module,exports){
/**
 *
 * ## Introspection API Service
 *
 * The Introspection API Service allows you to view a list of the variables and operations in a model. Typically used in conjunction with the [Run API Service](../run-api-service/).
 *
 * The Introspection API Service is not available for Forio SimLang.
 *
 *       var intro = new F.service.Introspect({
 *               account: 'acme-simulations',
 *               project: 'supply-chain-game'
 *       });
 *       intro.byModel('supply-chain.py').then(function(data){ ... });
 *       intro.byRunID('2b4d8f71-5c34-435a-8c16-9de674ab72e6').then(function(data){ ... });
 *
 */

'use strict';

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var SessionManager = require('../store/session-manager');

var apiEndpoint = 'model/introspect';

module.exports = function (config) {
    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: undefined,

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string. If left undefined, taken from the URL.
         * @type {String}
         */
        account: undefined,

        /**
         * The project id. Defaults to empty string. If left undefined, taken from the URL.
         * @type {String}
         */
        project: undefined,

    };

    var sessionManager = new SessionManager();
    var serviceOptions = sessionManager.getMergedOptions(defaults, config);

    var urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });
    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(transportOptions);

    var publicAPI = {
        /**
         * Get the available variables and operations for a given model file.
         *
         * Note: This does not work for any model which requires additional parameters, such as `files`.
         *
         * **Example**
         *
         *      intro.byModel('abc.vmf')
         *          .then(function(data) {
         *              // data contains an object with available functions (used with operations API) and available variables (used with variables API)
         *              console.log(data.functions);
         *              console.log(data.variables);
         *          });
         *
         * **Parameters**
         * @param  {String} modelFile Name of the model file to introspect.
         * @param  {Object} options (Optional) Overrides for configuration options.
         * @return {Promise} 
         */
        byModel: function (modelFile, options) {
            var opts = $.extend(true, {}, serviceOptions, options);
            if (!opts.account || !opts.project) {
                throw new Error('Account and project are required when using introspect#byModel');
            }
            if (!modelFile) {
                throw new Error('modelFile is required when using introspect#byModel');
            }
            var url = { url: urlConfig.getAPIPath(apiEndpoint) + [opts.account, opts.project, modelFile].join('/') };
            var httpOptions = $.extend(true, {}, serviceOptions, options, url);
            return http.get('', httpOptions);
        },

        /**
         * Get the available variables and operations for a given model file.
         *
         * Note: This does not work for any model which requires additional parameters such as `files`.
         *
         * **Example**
         *
         *      intro.byRunID('2b4d8f71-5c34-435a-8c16-9de674ab72e6')
         *          .then(function(data) {
         *              // data contains an object with available functions (used with operations API) and available variables (used with variables API)
         *              console.log(data.functions);
         *              console.log(data.variables);
         *          });
         *
         * **Parameters**
         * @param  {String} runID Id of the run to introspect.
         * @param  {Object} options (Optional) Overrides for configuration options.
         * @return {Promise} 
         */
        byRunID: function (runID, options) {
            if (!runID) {
                throw new Error('runID is required when using introspect#byModel');
            }
            var url = { url: urlConfig.getAPIPath(apiEndpoint) + runID };
            var httpOptions = $.extend(true, {}, serviceOptions, options, url);
            return http.get('', httpOptions);
        }
    };
    $.extend(this, publicAPI);
};

},{"../store/session-manager":43,"../transport/http-transport-factory":46,"./configuration-service":30}],34:[function(require,module,exports){
/**
 *
 * ## Member API Adapter
 *
 * The Member API Adapter provides methods to look up information about end users for your project and how they are divided across groups. It is based on query capabilities of the underlying RESTful [Member API](../../../rest_apis/user_management/member/).
 *
 * This is only needed for Authenticated projects, that is, team projects with [end users and groups](../../../groups_and_end_users/). For example, if some of your end users are facilitators, or if your end users should be treated differently based on which group they are in, use the Member API to find that information.
 *
 *      var ma = new F.service.Member({ token: 'user-or-project-access-token' });
 *      ma.getGroupsForUser({ userId: 'b6b313a3-ab84-479c-baea-206f6bff337' });
 *      ma.getGroupDetails({ groupId: '00b53308-9833-47f2-b21e-1278c07d53b8' });
 */

'use strict';

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var SessionManager = require('../store/session-manager');
var _pick = require('../util/object-util')._pick;
var apiEndpoint = 'member/local';

module.exports = function (config) {
    var defaults = {
        /**
         * Epicenter user id. Defaults to a blank string.
         * @type {string}
         */
        userId: undefined,

        /**
         * Epicenter group id. Defaults to a blank string. Note that this is the group *id*, not the group *name*.
         * @type {string}
         */
        groupId: undefined,

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {object}
         */
        transport: {}
    };
    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(transportOptions, serviceOptions);

    var getFinalParams = function (params) {
        if (typeof params === 'object') {
            return $.extend(true, serviceOptions, params);
        }
        return serviceOptions;
    };

    var patchUserActiveField = function (params, active, options) {
        var httpOptions = $.extend(true, serviceOptions, options, {
            url: urlConfig.getAPIPath(apiEndpoint) + params.groupId + '/' + params.userId
        });

        return http.patch({ active: active }, httpOptions);
    };

    var publicAPI = {

        /**
        * Retrieve details about all of the group memberships for one end user. The membership details are returned in an array, with one element (group record) for each group to which the end user belongs.
        *
        * In the membership array, each group record includes the group id, project id, account (team) id, and an array of members. However, only the user whose userId is included in the call is listed in the members array (regardless of whether there are other members in this group).
        *
        * **Example**
        *
        *       var ma = new F.service.Member({ token: 'user-or-project-access-token' });
        *       ma.getGroupsForUser('42836d4b-5b61-4fe4-80eb-3136e956ee5c')
        *           .then(function(memberships){
        *               for (var i=0; i<memberships.length; i++) {
        *                   console.log(memberships[i].groupId);
        *               }
        *           });
        *
        *       ma.getGroupsForUser({ userId: '42836d4b-5b61-4fe4-80eb-3136e956ee5c' });
        *
        * **Parameters**
        * @param {string|object} params The user id for the end user. Alternatively, an object with field `userId` and value the user id.
        * @param {object} options (Optional) Overrides for configuration options.
        */

        getGroupsForUser: function (params, options) {
            options = options || {};
            var httpOptions = $.extend(true, serviceOptions, options);
            var isString = typeof params === 'string';
            var objParams = getFinalParams(params);
            if (!isString && !objParams.userId) {
                throw new Error('No userId specified.');
            }

            var getParms = isString ? { userId: params } : _pick(objParams, 'userId');
            return http.get(getParms, httpOptions);
        },

        /**
        * Retrieve details about one group, including an array of all its members.
        *
        * **Example**
        *
        *       var ma = new F.service.Member({ token: 'user-or-project-access-token' });
        *       ma.getGroupDetails('80257a25-aa10-4959-968b-fd053901f72f')
        *           .then(function(group){
        *               for (var i=0; i<group.members.length; i++) {
        *                   console.log(group.members[i].userName);
        *               }
        *           });
        *
        *       ma.getGroupDetails({ groupId: '80257a25-aa10-4959-968b-fd053901f72f' });
        *
        * **Parameters**
        * @param {string|object} params The group id. Alternatively, an object with field `groupId` and value the group id.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */
        getGroupDetails: function (params, options) {
            options = options || {};
            var isString = typeof params === 'string';
            var objParams = getFinalParams(params);
            if (!isString && !objParams.groupId) {
                throw new Error('No groupId specified.');
            }

            var groupId = isString ? params : objParams.groupId;
            var httpOptions = $.extend(true, serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + groupId }
            );

            return http.get({}, httpOptions);
        },

        /**
        * Set a particular end user as `active`. Active end users can be assigned to [worlds](../world-manager/) in multiplayer games during automatic assignment.
        *
        * **Example**
        *
        *       var ma = new F.service.Member({ token: 'user-or-project-access-token' });
        *       ma.makeUserActive({ userId: '42836d4b-5b61-4fe4-80eb-3136e956ee5c',
        *                           groupId: '80257a25-aa10-4959-968b-fd053901f72f' });
        *
        * **Parameters**
        * @param {object} params The end user and group information.
        * @param {string} params.userId The id of the end user to make active.
        * @param {string} params.groupId The id of the group to which this end user belongs, and in which the end user should become active.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */
        makeUserActive: function (params, options) {
            return patchUserActiveField(params, true, options);
        },

        /**
        * Set a particular end user as `inactive`. Inactive end users are not assigned to [worlds](../world-manager/) in multiplayer games during automatic assignment.
        *
        * **Example**
        *
        *       var ma = new F.service.Member({ token: 'user-or-project-access-token' });
        *       ma.makeUserInactive({ userId: '42836d4b-5b61-4fe4-80eb-3136e956ee5c',
        *                           groupId: '80257a25-aa10-4959-968b-fd053901f72f' });
        *
        * **Parameters**
        * @param {object} params The end user and group information.
        * @param {string} params.userId The id of the end user to make inactive.
        * @param {string} params.groupId The id of the group to which this end user belongs, and in which the end user should become inactive.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */
        makeUserInactive: function (params, options) {
            return patchUserActiveField(params, false, options);
        }
    };

    $.extend(this, publicAPI);
};

},{"../store/session-manager":43,"../transport/http-transport-factory":46,"../util/object-util":48,"./configuration-service":30}],35:[function(require,module,exports){
/**
 *
 * ## Run API Service
 *
 * The Run API Service allows you to perform common tasks around creating and updating runs, variables, and data.
 *
 * When building interfaces to show run one at a time (as for standard end users), typically you first instantiate a [Run Manager](../run-manager/) and then access the Run Service that is automatically part of the manager, rather than instantiating the Run Service directly. This is because the Run Manager gives you control over run creation depending on run states.
 *
 * However, many of the Epicenter sample projects use a Run Service, because generally the sample projects are played in one end user session and don't care about run states or [run strategies](../../strategy/). The Run API Service is also useful for building an interface for a facilitator, because it makes it easy to list data across multiple runs (using the `filter()` and `query()` methods).
 *
 * To use the Run API Service, instantiate it by passing in:
 *
 * * `account`: Epicenter account id (**Team ID** for team projects, **User ID** for personal projects).
 * * `project`: Epicenter project id.
 *
 * For example,
 *
 *       var rs = new F.service.Run({
 *            account: 'acme-simulations',
 *            project: 'supply-chain-game',
 *      });
 *      rs.create('supply_chain_game.py').then(function(run) {
 *             rs.do('someOperation');
 *      });
 *
 *
 * Additionally, all API calls take in an "options" object as the last parameter. The options can be used to extend/override the Run API Service defaults listed below.
 *
 * Note that in addition to the `account`, `project`, and `model`, the Run Service parameters optionally include a `server` object, whose `host` field contains the URI of the Forio server. This is automatically set, but you can pass it explicitly if desired. It is most commonly used for clarity when you are [hosting an Epicenter project on your own server](../../../how_to/self_hosting/).
 *
 *       var rm = new F.manager.RunManager({
 *           run: {
 *               account: 'acme-simulations',
 *               project: 'supply-chain-game',
 *               model: 'supply_chain_game.py',
 *               server: { host: 'api.forio.com' }
 *           }
 *       });
 *       rm.getRun()
 *           .then(function(run) {
 *               // the RunManager.run contains the instantiated Run Service,
 *               // so any Run Service method is valid here
 *               var rs = rm.run;
 *               rs.do('someOperation');
 *       })
 *
 */

'use strict';

var ConfigService = require('./configuration-service');
var qutil = require('../util/query-util');
var rutil = require('../util/run-util');
var _pick = require('../util/object-util')._pick;
var TransportFactory = require('../transport/http-transport-factory');
var VariablesService = require('./variables-api-service');
var IntrospectionService = require('./introspection-api-service');
var SessionManager = require('../store/session-manager');

module.exports = function (config) {
    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: undefined,

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string. If left undefined, taken from the URL.
         * @type {String}
         */
        account: undefined,

        /**
         * The project id. Defaults to empty string. If left undefined, taken from the URL.
         * @type {String}
         */
        project: undefined,

        /**
         * Criteria by which to filter runs. Defaults to empty string.
         * @type {String}
         */
        filter: '',

        /**
         * Convenience alias for filter.
         * @type {String}
         */
        id: '',

        /**
         * Flag determines if `X-AutoRestore: true` header is sent to Epicenter. Defaults to `true`.
         * @type {boolean}
         */
        autoRestore: true,

        /**
         * Called when the call completes successfully. Defaults to `$.noop`.
         * @type {function}
         */
        success: $.noop,

        /**
         * Called when the call fails. Defaults to `$.noop`.
         * @type {function}
         */
        error: $.noop,

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {Object}
         */
        transport: {}
    };

    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    if (serviceOptions.id) {
        serviceOptions.filter = serviceOptions.id;
    }

    var urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }

    urlConfig.filter = ';';
    urlConfig.getFilterURL = function () {
        var url = urlConfig.getAPIPath('run');
        var filter = qutil.toMatrixFormat(serviceOptions.filter);

        if (filter) {
            url += filter + '/';
        }
        return url;
    };

    urlConfig.addAutoRestoreHeader = function (options) {
        var filter = serviceOptions.filter;
        // The semicolon separated filter is used when filter is an object
        var isFilterRunId = filter && $.type(filter) === 'string';
        if (serviceOptions.autoRestore && isFilterRunId) {
            // By default autoreplay the run by sending this header to epicenter
            // https://forio.com/epicenter/docs/public/rest_apis/aggregate_run_api/#retrieving
            var autorestoreOpts = {
                headers: {
                    'X-AutoRestore': true
                }
            };
            return $.extend(true, autorestoreOpts, options);
        }

        return options;
    };

    var httpOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getFilterURL
    });

    if (serviceOptions.token) {
        httpOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(httpOptions);
    http.splitGet = rutil.splitGetFactory(httpOptions);

    var setFilterOrThrowError = function (options) {
        if (options.id) {
            serviceOptions.filter = options.id;
        }
        if (options.filter) {
            serviceOptions.filter = options.filter;
        }
        if (!serviceOptions.filter) {
            throw new Error('No filter specified to apply operations against');
        }
    };

    var publicAsyncAPI = {
        urlConfig: urlConfig,

        /**
         * Create a new run.
         *
         * NOTE: Typically this is not used! Use `RunManager.getRun()` with a `strategy` of `always-new`, or use `RunManager.reset()`. See [Run Manager](../run-manager/) for more details.
         *
         *  **Example**
         *
         *      rs.create('hello_world.jl');
         *
         *  **Parameters**
         * @param {String|Object} params If a string, the name of the primary [model file](../../../writing_your_model/). This is the one file in the project that explicitly exposes variables and methods, and it must be stored in the Model folder of your Epicenter project. If an object, may include `model`, `scope`, and `files`. (See the [Run Manager](../run_manager/) for more information on `scope` and `files`.)
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        create: function (params, options) {
            var createOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath('run') });
            var runApiParams = ['model', 'scope', 'files'];
            if (typeof params === 'string') {
                // this is just the model name
                params = { model: params };
            } else {
                // whitelist the fields that we actually can send to the api
                params = _pick(params, runApiParams);
            }

            var oldSuccess = createOptions.success;
            createOptions.success = function (response) {
                serviceOptions.filter = response.id; //all future chained calls to operate on this id
                serviceOptions.id = response.id;
                return oldSuccess.apply(this, arguments);
            };

            return http.post(params, createOptions);
        },

        /**
         * Returns particular runs, based on conditions specified in the `qs` object.
         *
         * The elements of the `qs` object are ANDed together within a single call to `.query()`.
         *
         * **Example**
         *
         *      // returns runs with saved = true and variables.price > 1,
         *      // where variables.price has been persisted (recorded)
         *      // in the model.
         *     rs.query({
         *          'saved': 'true',
         *          '.price': '>1'
         *       },
         *       {
         *          startrecord: 2,
         *          endrecord: 5
         *       });
         *
         * **Parameters**
         * @param {Object} qs Query object. Each key can be a property of the run or the name of variable that has been saved in the run (prefaced by `variables.`). Each value can be a literal value, or a comparison operator and value. (See [more on filtering](../../../rest_apis/aggregate_run_api/#filters) allowed in the underlying Run API.) Querying for variables is available for runs [in memory](../../../run_persistence/#runs-in-memory) and for runs [in the database](../../../run_persistence/#runs-in-memory) if the variables are persisted (e.g. that have been `record`ed in your Julia model).
         * @param {Object} outputModifier (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        query: function (qs, outputModifier, options) {
            serviceOptions.filter = qs; //shouldn't be able to over-ride
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions = urlConfig.addAutoRestoreHeader(httpOptions);

            return http.splitGet(outputModifier, httpOptions);
        },

        /**
         * Returns particular runs, based on conditions specified in the `qs` object.
         *
         * Similar to `.query()`.
         *
         * **Parameters**
         * @param {Object} filter Filter object. Each key can be a property of the run or the name of variable that has been saved in the run (prefaced by `variables.`). Each value can be a literal value, or a comparison operator and value. (See [more on filtering](../../../rest_apis/aggregate_run_api/#filters) allowed in the underlying Run API.) Filtering for variables is available for runs [in memory](../../../run_persistence/#runs-in-memory) and for runs [in the database](../../../run_persistence/#runs-in-memory) if the variables are persisted (e.g. that have been `record`ed in your Julia model).
         * @param {Object} outputModifier (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        filter: function (filter, outputModifier, options) {
            if ($.isPlainObject(serviceOptions.filter)) {
                $.extend(serviceOptions.filter, filter);
            } else {
                serviceOptions.filter = filter;
            }
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions = urlConfig.addAutoRestoreHeader(httpOptions);
            return http.splitGet(outputModifier, httpOptions);
        },

        /**
         * Get data for a specific run. This includes standard run data such as the account, model, project, and created and last modified dates. To request specific model variables, pass them as part of the `filters` parameter.
         *
         * Note that if the run is [in memory](../../../run_persistence/#runs-in-memory), any model variables are available; if the run is [in the database](../../../run_persistence/#runs-in-db), only model variables that have been persisted &mdash; that is, `record`ed in your Julia model &mdash; are available.
         *
         * **Example**
         *
         *     rs.load('bb589677-d476-4971-a68e-0c58d191e450', { include: ['.price', '.sales'] });
         *
         * **Parameters**
         * @param {String} runID The run id.
         * @param {Object} filters (Optional) Object containing filters and operation modifiers. Use key `include` to list model variables that you want to include in the response. Other available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        load: function (runID, filters, options) {
            if (runID) {
                serviceOptions.filter = runID; //shouldn't be able to over-ride
            }
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            httpOptions = urlConfig.addAutoRestoreHeader(httpOptions);
            return http.get(filters, httpOptions);
        },


        /**
         * Save attributes (data, model variables) of the run.
         *
         * **Examples**
         *
         *     // add 'completed' field to run record
         *     rs.save({ completed: true });
         *
         *     // update 'saved' field of run record, and update values of model variables for this run
         *     rs.save({ saved: true, variables: { a: 23, b: 23 } });
         *
         * **Parameters**
         * @param {Object} attributes The run data and variables to save.
         * @param {Object} attributes.variables Model variables must be included in a `variables` field within the `attributes` object. (Otherwise they are treated as run data and added to the run record directly.)
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        save: function (attributes, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            setFilterOrThrowError(httpOptions);
            return http.patch(attributes, httpOptions);
        },

        /**
         * Call a method from the model.
         *
         * Depending on the language in which you have written your model, the method may need to be exposed (e.g. `export` for a Julia model) in the model file in order to be called through the API. See [Writing your Model](../../../writing_your_model/)).
         *
         * The params argument is normally an array of arguments to the `operation`. In the special case where `operation` only takes one argument, you are not required to put that argument into an array.
         *
         * Note that you can combine the `operation` and params arguments into a single object if you prefer, as in the last example.
         *
         * **Examples**
         *
         *      // method "solve" takes no arguments
         *     rs.do('solve');
         *      // method "echo" takes one argument, a string
         *     rs.do('echo', ['hello']);
         *      // method "echo" takes one argument, a string
         *     rs.do('echo', 'hello');
         *      // method "sumArray" takes one argument, an array
         *     rs.do('sumArray', [[4,2,1]]);
         *      // method "add" takes two arguments, both integers
         *     rs.do({ name:'add', params:[2,4] });
         *
         * **Parameters**
         * @param {String} operation Name of method.
         * @param {Array} params (Optional) Any parameters the operation takes, passed as an array. In the special case where `operation` only takes one argument, you are not required to put that argument into an array, and can just pass it directly.
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        do: function (operation, params, options) {
            // console.log('do', operation, params);
            var opsArgs;
            var postOptions;
            if (options) {
                opsArgs = params;
                postOptions = options;
            } else if ($.isPlainObject(params)) {
                opsArgs = null;
                postOptions = params;
            } else {
                opsArgs = params;
            }
            var result = rutil.normalizeOperations(operation, opsArgs);
            var httpOptions = $.extend(true, {}, serviceOptions, postOptions);

            setFilterOrThrowError(httpOptions);

            var prms = (result.args[0].length && (result.args[0] !== null && result.args[0] !== undefined)) ? result.args[0] : [];
            return http.post({ arguments: prms }, $.extend(true, {}, httpOptions, {
                url: urlConfig.getFilterURL() + 'operations/' + result.ops[0] + '/'
            }));
        },

        /**
         * Call several methods from the model, sequentially.
         *
         * Depending on the language in which you have written your model, the methods may need to be exposed (e.g. `export` for a Julia model) in the model file in order to be called through the API. See [Writing your Model](../../../writing_your_model/)).
         *
         * **Examples**
         *
         *      // methods "initialize" and "solve" do not take any arguments
         *     rs.serial(['initialize', 'solve']);
         *      // methods "init" and "reset" take two arguments each
         *     rs.serial([  { name: 'init', params: [1,2] },
         *                  { name: 'reset', params: [2,3] }]);
         *      // method "init" takes two arguments,
         *      // method "runmodel" takes none
         *     rs.serial([  { name: 'init', params: [1,2] },
         *                  { name: 'runmodel', params: [] }]);
         *
         * **Parameters**
         * @param {Array} operations If none of the methods take parameters, pass an array of the method names (strings). If any of the methods do take parameters, pass an array of objects, each of which contains a method name and its own (possibly empty) array of parameters.
         * @param {*} params Parameters to pass to operations.
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        serial: function (operations, params, options) {
            var opParams = rutil.normalizeOperations(operations, params);
            var ops = opParams.ops;
            var args = opParams.args;
            var me = this;

            var $d = $.Deferred();
            var postOptions = $.extend(true, {}, serviceOptions, options);

            var doSingleOp = function () {
                var op = ops.shift();
                var arg = args.shift();

                me.do(op, arg, {
                    success: function () {
                        if (ops.length) {
                            doSingleOp();
                        } else {
                            $d.resolve.apply(this, arguments);
                            postOptions.success.apply(this, arguments);
                        }
                    },
                    error: function () {
                        $d.reject.apply(this, arguments);
                        postOptions.error.apply(this, arguments);
                    }
                });
            };

            doSingleOp();

            return $d.promise();
        },

        /**
         * Call several methods from the model, executing them in parallel.
         *
         * Depending on the language in which you have written your model, the methods may need to be exposed (e.g. `export` for a Julia model) in the model file in order to be called through the API. See [Writing your Model](../../../writing_your_model/)).
         *
         * **Example**
         *
         *      // methods "solve" and "reset" do not take any arguments
         *     rs.parallel(['solve', 'reset']);
         *      // methods "add" and "subtract" take two arguments each
         *     rs.parallel([ { name: 'add', params: [1,2] },
         *                   { name: 'subtract', params:[2,3] }]);
         *      // methods "add" and "subtract" take two arguments each
         *     rs.parallel({ add: [1,2], subtract: [2,4] });
         *
         * **Parameters**
         * @param {Array|Object} operations If none of the methods take parameters, pass an array of the method names (as strings). If any of the methods do take parameters, you have two options. You can pass an array of objects, each of which contains a method name and its own (possibly empty) array of parameters. Alternatively, you can pass a single object with the method name and a (possibly empty) array of parameters.
         * @param {*} params Parameters to pass to operations.
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        parallel: function (operations, params, options) {
            var $d = $.Deferred();

            var opParams = rutil.normalizeOperations(operations, params);
            var ops = opParams.ops;
            var args = opParams.args;
            var postOptions = $.extend(true, {}, serviceOptions, options);

            var queue = [];
            for (var i = 0; i < ops.length; i++) {
                queue.push(
                    this.do(ops[i], args[i])
                );
            }
            $.when.apply(this, queue)
                .then(function () {
                    $d.resolve.apply(this, arguments);
                    postOptions.success.apply(this.arguments);
                })
                .fail(function () {
                    $d.reject.apply(this, arguments);
                    postOptions.error.apply(this.arguments);
                });

            return $d.promise();
        },

        /**
         * Shortcut to using the [Introspection API Service](../introspection-api-service/). Allows you to view a list of the variables and operations in a model.
         *
         * **Example**
         *
         *     rs.introspect({ runID: 'cbf85437-b539-4977-a1fc-23515cf071bb' }).then(function (data) {
         *          console.log(data.functions);
         *          console.log(data.variables);
         *     });
         *
         * **Parameters**
         * @param  {Object} options Options can either be of the form `{ runID: <runid> }` or `{ model: <modelFileName> }`.
         * @param  {Object} introspectionConfig (Optional) Service options for Introspection Service
         * @return {Promise}
         */
        introspect: function (options, introspectionConfig) {
            var introspection = new IntrospectionService($.extend(true, {}, serviceOptions, introspectionConfig));
            if (options) {
                if (options.runID) {
                    return introspection.byRunID(options.runID);
                } else if (options.model) {
                    return introspection.byModel(options.model);
                }
            } else if (serviceOptions.id) {
                return introspection.byRunID(serviceOptions.id);
            } else {
                throw new Error('Please specify either the model or runid to introspect');
            }
        }
    };

    var publicSyncAPI = {
        getCurrentConfig: function () {
            return serviceOptions;
        },
        /**
          * Returns a Variables Service instance. Use the variables instance to load, save, and query for specific model variables. See the [Variable API Service](../variables-api-service/) for more information.
          *
          * **Example**
          *
          *      var vs = rs.variables();
          *      vs.save({ sample_int: 4 });
          *
          * **Parameters**
          * @param {Object} config (Optional) Overrides for configuration options.
          * @return {Object} variablesService Instance
          */
        variables: function (config) {
            var vs = new VariablesService($.extend(true, {}, serviceOptions, config, {
                runService: this
            }));
            return vs;
        }
    };

    $.extend(this, publicAsyncAPI);
    $.extend(this, publicSyncAPI);
};

},{"../store/session-manager":43,"../transport/http-transport-factory":46,"../util/object-util":48,"../util/query-util":50,"../util/run-util":51,"./configuration-service":30,"./introspection-api-service":33,"./variables-api-service":40}],36:[function(require,module,exports){
'use strict';

var ConfigService = require('./configuration-service');
var SessionManager = require('../store/session-manager');
var objectAssign = require('object-assign');

var serviceUtils = {
    /*
    * Gets the default options for a api service.
    * It will merge:
    * - The Session options (Using the Session Manager)
    * - The Authorization Header from the token option
    * - The full url from the endpoint option
    * With the supplied overrides and defaults
    *
    */
    getDefaultOptions: function (defaults) {
        var rest = Array.prototype.slice.call(arguments, 1);
        var sessionManager = new SessionManager();
        var serviceOptions = sessionManager.getMergedOptions.apply(sessionManager, [defaults].concat(rest));

        serviceOptions.transport = objectAssign({}, serviceOptions.transport, {
            url: this.getApiUrl(serviceOptions.apiEndpoint, serviceOptions)
        });

        if (serviceOptions.token) {
            serviceOptions.transport.headers = {
                Authorization: 'Bearer ' + serviceOptions.token
            };
        }
        return serviceOptions;
    },

    getApiUrl: function (apiEndpoint, serviceOptions) {
        var urlConfig = new ConfigService(serviceOptions).get('server');
        return urlConfig.getAPIPath(apiEndpoint);
    }
};

module.exports = serviceUtils;
},{"../store/session-manager":43,"./configuration-service":30,"object-assign":5}],37:[function(require,module,exports){
'use strict';
/**
 * ## State API Adapter
 *
 * The State API Adapter allows you to replay or clone runs. It brings existing, persisted run data from the database back into memory, using the same run id (`replay`) or a new run id (`clone`). Runs must be in memory in order for you to update variables or call operations on them.
 *
 * Specifically, the State API Adapter works by "re-running" the run (user interactions) from the creation of the run up to the time it was last persisted in the database. This process uses the current version of the run's model. Therefore, if the model has changed since the original run was created, the retrieved run will use the new model — and may end up having different values or behavior as a result. Use with care!
 *
 * To use the State API Adapter, instantiate it and then call its methods:
 *
 *      var sa = new F.service.State();
 *      sa.replay({runId: '1842bb5c-83ad-4ba8-a955-bd13cc2fdb4f'});
 *
 * The constructor takes an optional `options` parameter in which you can specify the `account` and `project` if they are not already available in the current context.
 *
 */

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var _pick = require('../util/object-util')._pick;
var SessionManager = require('../store/session-manager');
var apiEndpoint = 'model/state';

module.exports = function (config) {

    var defaults = {

    };

    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }

    var http = new TransportFactory(transportOptions);
    var parseRunIdOrError = function (params) {
        if ($.isPlainObject(params) && params.runId) {
            return params.runId;
        } else {
            throw new Error('Please pass in a run id');
        }
    };

    var publicAPI = {
        /**
        * Replay a run. After this call, the run, with its original run id, is now available [in memory](../../../run_persistence/#runs-in-memory). (It continues to be persisted into the Epicenter database at regular intervals.)
        *
        *  **Example**
        *
        *      var sa = new F.service.State();
        *      sa.replay({runId: '1842bb5c-83ad-4ba8-a955-bd13cc2fdb4f', stopBefore: 'calculateScore'});
        *
        *  **Parameters**
        * @param {object} params Parameters object.
        * @param {string} params.runId The id of the run to bring back to memory.
        * @param {string} params.stopBefore (Optional) The run is advanced only up to the first occurrence of this method.
        * @param {array} params.exclude (Optional) Array of methods to exclude when advancing the run.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */
        replay: function (params, options) {
            var runId = parseRunIdOrError(params);

            var replayOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + runId }
            );

            params = $.extend(true, { action: 'replay' }, _pick(params, ['stopBefore', 'exclude']));

            return http.post(params, replayOptions);
        },

        /**
        * Clone a given run and return a new run in the same state as the given run.
        *
        * The new run id is now available [in memory](../../../run_persistence/#runs-in-memory). The new run includes a copy of all of the data from the original run, EXCEPT:
        *
        * * The `saved` field in the new run record is not copied from the original run record. It defaults to `false`.
        * * The `initialized` field in the new run record is not copied from the original run record. It defaults to `false` but may change to `true` as the new run is advanced. For example, if there has been a call to the `step` function (for Vensim models), the `initialized` field is set to `true`.
        * * The `created` field in the new run record is the date and time at which the clone was created (not the time that the original run was created.)
        *
        * The original run remains only [in the database](../../../run_persistence/#runs-in-db).
        *
        *  **Example**
        *
        *      var sa = new F.service.State();
        *      sa.clone({runId: '1842bb5c-83ad-4ba8-a955-bd13cc2fdb4f', stopBefore: 'calculateScore', exclude: ['interimCalculation'] });
        *
        *  **Parameters**
        * @param {object} params Parameters object.
        * @param {string} params.runId The id of the run to clone from memory.
        * @param {string} params.stopBefore (Optional) The newly cloned run is advanced only up to the first occurrence of this method.
        * @param {array} params.exclude (Optional) Array of methods to exclude when advancing the newly cloned run.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */
        clone: function (params, options) {
            var runId = parseRunIdOrError(params);

            var replayOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + runId }
            );

            params = $.extend(true, { action: 'clone' }, _pick(params, ['stopBefore', 'exclude']));

            return http.post(params, replayOptions);
        }
    };

    $.extend(this, publicAPI);
};

},{"../store/session-manager":43,"../transport/http-transport-factory":46,"../util/object-util":48,"./configuration-service":30}],38:[function(require,module,exports){
'use strict';

var epiVersion = require('../api-version.json');

//TODO: urlutils to get host, since no window on node
var defaults = {
    host: window.location.host,
    pathname: window.location.pathname
};

var UrlConfigService = function (config) {
    var options = $.extend({}, defaults, config);
    var actingHost = options.host;

    function isLocalhost() {
        var isLocal = !options.host || //phantomjs
            options.host === '127.0.0.1' || 
            options.host.indexOf('local.') === 0 || 
            options.host.indexOf('localhost') === 0;
        return isLocal;
    }
    
    // console.log(isLocalhost(), '___________');
    if (!actingHost && isLocalhost()) {
        actingHost = 'forio.com';
    }

    var API_PROTOCOL = 'https';
    var HOST_API_MAPPING = {
        'forio.com': 'api.forio.com',
        'foriodev.com': 'api.epicenter.foriodev.com'
    };

    var publicExports = {
        protocol: API_PROTOCOL,

        api: '',

        //TODO: this should really be called 'apihost', but can't because that would break too many things
        host: (function () {
            var apiHost = (HOST_API_MAPPING[actingHost]) ? HOST_API_MAPPING[actingHost] : actingHost;
            return apiHost;
        }()),

        isCustomDomain: (function () {
            var path = options.pathname.split('\/');
            var pathHasApp = path && path[1] === 'app';
            return (!isLocalhost() && !pathHasApp);
        }()),

        appPath: (function () {
            var path = options.pathname.split('\/');

            return path && path[1] || '';
        }()),

        accountPath: (function () {
            var accnt = '';
            var path = options.pathname.split('\/');
            if (path && path[1] === 'app') {
                accnt = path[2];
            }
            return accnt;
        }()),

        projectPath: (function () {
            var prj = '';
            var path = options.pathname.split('\/');
            if (path && path[1] === 'app') {
                prj = path[3]; //eslint-disable-line no-magic-numbers
            }
            return prj;
        }()),

        versionPath: (function () {
            var version = epiVersion.version ? epiVersion.version + '/' : '';
            return version;
        }()),

        isLocalhost: isLocalhost,

        getAPIPath: function (api) {
            var PROJECT_APIS = ['run', 'data', 'file'];

            var apiPath = this.protocol + '://' + this.host + '/' + this.versionPath + api + '/';

            if ($.inArray(api, PROJECT_APIS) !== -1) {
                apiPath += this.accountPath + '/' + this.projectPath + '/';
            }
            return apiPath;
        }
    };

    var envConf = UrlConfigService.defaults;

    $.extend(publicExports, envConf, config);
    return publicExports;
};
// This data can be set by external scripts, for loading from an env server for eg;
UrlConfigService.defaults = {};

module.exports = UrlConfigService;

},{"../api-version.json":6}],39:[function(require,module,exports){
'use strict';
/**
* ## User API Adapter
*
* The User API Adapter allows you to retrieve details about end users in your team (account). It is based on the querying capabilities of the underlying RESTful [User API](../../../rest_apis/user_management/user/).
*
* To use the User API Adapter, instantiate it and then call its methods.
*
*       var ua = new F.service.User({
*           account: 'acme-simulations',
*           token: 'user-or-project-access-token'
*       });
*       ua.getById('42836d4b-5b61-4fe4-80eb-3136e956ee5c');
*       ua.get({ userName: 'jsmith' });
*       ua.get({ id: ['42836d4b-5b61-4fe4-80eb-3136e956ee5c',
*                   '4ea75631-4c8d-4872-9d80-b4600146478e'] });
*
* The constructor takes an optional options parameter in which you can specify the `account` and `token` if they are not already available in the current context.
*/

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var SessionManager = require('../store/session-manager');
var qutil = require('../util/query-util');

module.exports = function (config) {
    var defaults = {

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string.
         * @type {String}
         */
        account: undefined,

        /**
         * The access token to use when searching for end users. (See [more background on access tokens](../../../project_access/)).
         * @type {String}
         */
        token: undefined,

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {Object}
         */
        transport: {}
    };

    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');
    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath('user')
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }

    var http = new TransportFactory(transportOptions);

    var publicAPI = {

        /**
        * Retrieve details about particular end users in your team, based on user name or user id.
        *
        * **Example**
        *
        *       var ua = new F.service.User({
        *           account: 'acme-simulations',
        *           token: 'user-or-project-access-token'
        *       });
        *       ua.get({ userName: 'jsmith' });
        *       ua.get({ id: ['42836d4b-5b61-4fe4-80eb-3136e956ee5c',
        *                   '4ea75631-4c8d-4872-9d80-b4600146478e'] });
        *
        * **Parameters**
        * @param {object} filter Object with field `userName` and value of the username. Alternatively, object with field `id` and value of an array of user ids.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */

        get: function (filter, options) {
            options = options || {};
            filter = filter || {};

            var getOptions = $.extend(true, {},
                serviceOptions,
                options
            );

            var toQFilter = function (filter) {
                var res = {};

                // API only supports filtering by username for now
                if (filter.userName) {
                    res.q = filter.userName;
                }

                return res;
            };

            var toIdFilters = function (id) {
                if (!id) {
                    return '';
                }

                id = $.isArray(id) ? id : [id];
                return 'id=' + id.join('&id=');
            };

            var getFilters = [
                'account=' + getOptions.account,
                toIdFilters(filter.id),
                qutil.toQueryFormat(toQFilter(filter))
            ].join('&');

            // special case for queries with large number of ids
            // make it as a post with GET semantics
            var threshold = 30;
            if (filter.id && $.isArray(filter.id) && filter.id.length >= threshold) {
                getOptions.url = urlConfig.getAPIPath('user') + '?_method=GET';
                return http.post({ id: filter.id }, getOptions);
            } else {
                return http.get(getFilters, getOptions);
            }
        },

        /**
        * Retrieve details about a single end user in your team, based on user id.
        *
        * **Example**
        *
        *       var ua = new F.service.User({
        *           account: 'acme-simulations',
        *           token: 'user-or-project-access-token'
        *       });
        *       ua.getById('42836d4b-5b61-4fe4-80eb-3136e956ee5c');
        *
        * **Parameters**
        * @param {string} userId The user id for the end user in your team.
        * @param {object} options (Optional) Overrides for configuration options.
        * @return {Promise}
        */

        getById: function (userId, options) {
            return publicAPI.get({ id: userId }, options);
        }
    };

    $.extend(this, publicAPI);
};



},{"../store/session-manager":43,"../transport/http-transport-factory":46,"../util/query-util":50,"./configuration-service":30}],40:[function(require,module,exports){
/**
 *
 * ## Variables API Service
 *
 * Used in conjunction with the [Run API Service](../run-api-service/) to read, write, and search for specific model variables.
 *
 *     var rm = new F.manager.RunManager({
 *           run: {
 *               account: 'acme-simulations',
 *               project: 'supply-chain-game',
 *               model: 'supply-chain-model.jl'
 *           }
 *      });
 *     rm.getRun()
 *       .then(function() {
 *          var vs = rm.run.variables();
 *          vs.save({sample_int: 4});
 *        });
 *
 */


 'use strict';

 var TransportFactory = require('../transport/http-transport-factory');
 var rutil = require('../util/run-util');

 module.exports = function (config) {
     var defaults = {
        /**
         * The runs object to which the variable filters apply. Defaults to null.
         * @type {runService}
         */
         runService: null
     };
     var serviceOptions = $.extend({}, defaults, config);

     var getURL = function () {
         return serviceOptions.runService.urlConfig.getFilterURL() + 'variables/';
     };

     var addAutoRestoreHeader = function (options) {
         return serviceOptions.runService.urlConfig.addAutoRestoreHeader(options);
     };

     var httpOptions = {
         url: getURL
     };
     if (serviceOptions.token) {
         httpOptions.headers = {
             Authorization: 'Bearer ' + serviceOptions.token
         };
     }
     var http = new TransportFactory(httpOptions);
     http.splitGet = rutil.splitGetFactory(httpOptions);

     var publicAPI = {

        /**
         * Get values for a variable.
         *
         * **Example**
         *
         *      vs.load('sample_int')
         *          .then(function(val){
         *              // val contains the value of sample_int
         *          });
         *
         * **Parameters**
         * @param {String} variable Name of variable to load.
         * @param {Object} outputModifier (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
         load: function (variable, outputModifier, options) {
             var httpOptions = $.extend(true, {}, serviceOptions, options);
             httpOptions = addAutoRestoreHeader(httpOptions);
             return http.get(outputModifier, $.extend({}, httpOptions, {
                 url: getURL() + variable + '/'
             }));
         },

        /**
         * Returns particular variables, based on conditions specified in the `query` object.
         *
         * **Example**
         *
         *      vs.query(['price', 'sales'])
         *          .then(function(val) {
         *              // val is an object with the values of the requested variables: val.price, val.sales
         *          });
         *
         *      vs.query({ include:['price', 'sales'] });
         *
         * **Parameters**
         * @param {Object|Array} query The names of the variables requested.
         * @param {Object} outputModifier (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
         query: function (query, outputModifier, options) {
            //Query and outputModifier are both querystrings in the url; only calling them out separately here to be consistent with the other calls
             var httpOptions = $.extend(true, {}, serviceOptions, options);
             httpOptions = addAutoRestoreHeader(httpOptions);

             if ($.isArray(query)) {
                 query = { include: query };
             }
             $.extend(query, outputModifier);
             return http.splitGet(query, httpOptions);
         },

        /**
         * Save values to model variables. Overwrites existing values. Note that you can only update model variables if the run is [in memory](../../../run_persistence/#runs-in-memory). (An alternate way to update model variables is to call a method from the model and make sure that the method persists the variables. See `do`, `serial`, and `parallel` in the [Run API Service](../run-api-service/) for calling methods from the model.)
         *
         * **Example**
         *
         *      vs.save('price', 4);
         *      vs.save({ price: 4, quantity: 5, products: [2,3,4] });
         *
         * **Parameters**
         * @param {Object|String} variable An object composed of the model variables and the values to save. Alternatively, a string with the name of the variable.
         * @param {Object} val (Optional) If passing a string for `variable`, use this argument for the value to save.
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
         save: function (variable, val, options) {
             var attrs;
             if (typeof variable === 'object') {
                 attrs = variable;
                 options = val;
             } else {
                 (attrs = {})[variable] = val;
             }
             var httpOptions = $.extend(true, {}, serviceOptions, options);

             return http.patch.call(this, attrs, httpOptions);
         }

        // Not Available until underlying API supports PUT. Otherwise save would be PUT and merge would be PATCH
        // *
        //  * Save values to the api. Merges arrays, but otherwise same as save
        //  * @param {Object|String} variable Object with attributes, or string key
        //  * @param {Object} val Optional if prev parameter was a string, set value here
        //  * @param {Object} options Overrides for configuration options
        //  *
        //  * @example
        //  *     vs.merge({ price: 4, quantity: 5, products: [2,3,4] })
        //  *     vs.merge('price', 4);

        // merge: function (variable, val, options) {
        //     var attrs;
        //     if (typeof variable === 'object') {
        //       attrs = variable;
        //       options = val;
        //     } else {
        //       (attrs = {})[variable] = val;
        //     }
        //     var httpOptions = $.extend(true, {}, serviceOptions, options);

        //     return http.patch.call(this, attrs, httpOptions);
        // }
     };
     $.extend(this, publicAPI);
 };

},{"../transport/http-transport-factory":46,"../util/run-util":51}],41:[function(require,module,exports){
/**
 * ## World API Adapter
 *
 * A [run](../../../glossary/#run) is a collection of end user interactions with a project and its model -- including setting variables, making decisions, and calling operations. For building multiplayer simulations you typically want multiple end users to share the same set of interactions, and work within a common state. Epicenter allows you to create "worlds" to handle such cases. Only [team projects](../../../glossary/#team) can be multiplayer.
 *
 * The World API Adapter allows you to create, access, and manipulate multiplayer worlds within your Epicenter project. You can use this to add and remove end users from the world, and to create, access, and remove their runs. Because of this, typically the World Adapter is used for facilitator pages in your project. (The related [World Manager](../world-manager/) provides an easy way to access runs and worlds for particular end users, so is typically used in pages that end users will interact with.)
 *
 * As with all the other [API Adapters](../../), all methods take in an "options" object as the last parameter. The options can be used to extend/override the World API Service defaults.
 *
 * To use the World Adapter, instantiate it and then access the methods provided. Instantiating requires the account id (**Team ID** in the Epicenter user interface), project id (**Project ID**), and group (**Group Name**).
 *
 *       var wa = new F.service.World({
 *          account: 'acme-simulations',
 *          project: 'supply-chain-game',
 *          group: 'team1' });
 *       wa.create()
 *          .then(function(world) {
 *              // call methods, e.g. wa.addUsers()
 *          });
 */

'use strict';

var ConfigService = require('./configuration-service');
// var qutil = require('../util/query-util');
var TransportFactory = require('../transport/http-transport-factory');
var SessionManager = require('../store/session-manager');
var _pick = require('../util/object-util')._pick;

var apiBase = 'multiplayer/';
var assignmentEndpoint = apiBase + 'assign';
var apiEndpoint = apiBase + 'world';
var projectEndpoint = apiBase + 'project';

module.exports = function (config) {
    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: undefined,

        /**
         * The project id. If left undefined, taken from the URL.
         * @type {String}
         */
        project: undefined,

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects). If left undefined, taken from the URL.
         * @type {String}
         */
        account: undefined,

        /**
         * The group name. Defaults to undefined.
         * @type {String}
         */
        group: undefined,

       /**
         * The model file to use to create runs in this world. Defaults to undefined.
         * @type {String}
         */
        model: undefined,

        /**
         * Criteria by which to filter world. Currently only supports world-ids as filters.
         * @type {String}
         */
        filter: '',

        /**
         * Convenience alias for filter
         * @type {String}
         */
        id: '',

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {Object}
         */
        transport: {},

        /**
         * Called when the call completes successfully. Defaults to `$.noop`.
         * @type {function}
         */
        success: $.noop,

        /**
         * Called when the call fails. Defaults to `$.noop`.
         * @type {function}
         */
        error: $.noop
    };

    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    if (serviceOptions.id) {
        serviceOptions.filter = serviceOptions.id;
    }

    var urlConfig = new ConfigService(serviceOptions).get('server');

    if (!serviceOptions.account) {
        serviceOptions.account = urlConfig.accountPath;
    }

    if (!serviceOptions.project) {
        serviceOptions.project = urlConfig.projectPath;
    }

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }

    var http = new TransportFactory(transportOptions);

    var setIdFilterOrThrowError = function (options) {
        if (options.id) {
            serviceOptions.filter = options.id;
        }
        if (options.filter) {
            serviceOptions.filter = options.filter;
        }
        if (!serviceOptions.filter) {
            throw new Error('No world id specified to apply operations against. This could happen if the user is not assigned to a world and is trying to work with runs from that world.');
        }
    };

    var validateModelOrThrowError = function (options) {
        if (!options.model) {
            throw new Error('No model specified to get the current run');
        }
    };

    var publicAPI = {

        /**
        * Creates a new World.
        *
        * Using this method is rare. It is more common to create worlds automatically while you `autoAssign()` end users to worlds. (In this case, configuration data for the world, such as the roles, are read from the project-level world configuration information, for example by `getProjectSettings()`.)
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create({
        *           roles: ['VP Marketing', 'VP Sales', 'VP Engineering']
        *       });
        *
        *  **Parameters**
        * @param {object} params Parameters to create the world.
        * @param {string} params.group (Optional) The **Group Name** to create this world under. Only end users in this group are eligible to join the world. Optional here; required when instantiating the service (`new F.service.World()`).
        * @param {object} params.roles (Optional) The list of roles (strings) for this world. Some worlds have specific roles that **must** be filled by end users. Listing the roles allows you to autoassign users to worlds and ensure that all roles are filled in each world.
        * @param {object} params.optionalRoles (Optional) The list of optional roles (strings) for this world. Some worlds have specific roles that **may** be filled by end users. Listing the optional roles as part of the world object allows you to autoassign users to worlds and ensure that all roles are filled in each world.
        * @param {integer} params.minUsers (Optional) The minimum number of users for the world. Including this number allows you to autoassign end users to worlds and ensure that the correct number of users are in each world.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        create: function (params, options) {
            var createOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) });
            var worldApiParams = ['scope', 'files', 'roles', 'optionalRoles', 'minUsers', 'group', 'name'];
            var validParams = _pick(serviceOptions, ['account', 'project', 'group']);
            // whitelist the fields that we actually can send to the api
            params = _pick(params, worldApiParams);

            // account and project go in the body, not in the url
            params = $.extend({}, validParams, params);

            var oldSuccess = createOptions.success;
            createOptions.success = function (response) {
                serviceOptions.filter = response.id; //all future chained calls to operate on this id
                return oldSuccess.apply(this, arguments);
            };

            return http.post(params, createOptions);
        },

        /**
        * Updates a World, for example to replace the roles in the world.
        *
        * Typically, you complete world configuration at the project level, rather than at the world level. For example, each world in your project probably has the same roles for end users. And your project is probably either configured so that all end users share the same world (and run), or smaller sets of end users share worlds — but not both. However, this method is available if you need to update the configuration of a particular world.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               wa.update({ roles: ['VP Marketing', 'VP Sales', 'VP Engineering'] });
        *           });
        *
        *  **Parameters**
        * @param {object} params Parameters to update the world.
        * @param {string} params.name A string identifier for the linked end users, for example, "name": "Our Team".
        * @param {object} params.roles (Optional) The list of roles (strings) for this world. Some worlds have specific roles that **must** be filled by end users. Listing the roles allows you to autoassign users to worlds and ensure that all roles are filled in each world.
        * @param {object} params.optionalRoles (Optional) The list of optional roles (strings) for this world. Some worlds have specific roles that **may** be filled by end users. Listing the optional roles as part of the world object allows you to autoassign users to worlds and ensure that all roles are filled in each world.
        * @param {integer} params.minUsers (Optional) The minimum number of users for the world. Including this number allows you to autoassign end users to worlds and ensure that the correct number of users are in each world.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        update: function (params, options) {
            var whitelist = ['roles', 'optionalRoles', 'minUsers'];
            options = options || {};
            setIdFilterOrThrowError(options);

            var updateOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter }
            );

            params = _pick(params || {}, whitelist);

            return http.patch(params, updateOptions);
        },

        /**
        * Deletes an existing world.
        *
        * This function optionally takes one argument. If the argument is a string, it is the id of the world to delete. If the argument is an object, it is the override for global options.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               wa.delete();
        *           });
        *
        *  **Parameters**
        * @param {String|Object} options (Optional) The id of the world to delete, or options object to override global options.
        * @return {Promise}
        */
        delete: function (options) {
            options = (options && (typeof options === 'string')) ? { filter: options } : {};
            setIdFilterOrThrowError(options);

            var deleteOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter }
            );

            return http.delete(null, deleteOptions);
        },

        /**
        * Updates the configuration for the current instance of the World API Adapter (including all subsequent function calls, until the configuration is updated again).
        *
        * **Example**
        *
        *      var wa = new F.service.World({...}).updateConfig({ filter: '123' }).addUser({ userId: '123' });
        *
        * **Parameters**
        * @param {object} config The configuration object to use in updating existing configuration.
        * @return {Object} reference to current instance
        */
        updateConfig: function (config) {
            $.extend(serviceOptions, config);

            return this;
        },

        /**
        * Lists all worlds for a given account, project, and group. All three are required, and if not specified as parameters, are read from the service.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               // lists all worlds in group "team1"
        *               wa.list();
        *
        *               // lists all worlds in group "other-group-name"
        *               wa.list({ group: 'other-group-name' });
        *           });
        *
        *  **Parameters**
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        list: function (options) {
            options = options || {};

            var getOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) }
            );

            var filters = _pick(getOptions, ['account', 'project', 'group']);

            return http.get(filters, getOptions);
        },

        /**
        * Gets all worlds that an end user belongs to for a given account (team), project, and group.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               wa.getWorldsForUser('b1c19dda-2d2e-4777-ad5d-3929f17e86d3')
        *           });
        *
        * ** Parameters **
        * @param {string} userId The `userId` of the user whose worlds are being retrieved.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        getWorldsForUser: function (userId, options) {
            options = options || {};

            var getOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) }
            );

            var filters = $.extend(
                _pick(getOptions, ['account', 'project', 'group']),
                { userId: userId }
            );

            return http.get(filters, getOptions);
        },

        /**
         * Load information for a specific world. All further calls to the world service will use the id provided.
         *
         * **Parameters**
         * @param {String} worldId The id of the world to load.
         * @param {Object} options (Optional) Options object to override global options.
         * @return {Promise}
         */
        load: function (worldId, options) {
            if (worldId) {
                serviceOptions.filter = worldId;
            }
            if (!serviceOptions.filter) {
                throw new Error('Please provide a worldid to load');
            }
            var httpOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/' });
            return http.get('', httpOptions);
        },

        /**
        * Adds an end user or list of end users to a given world. The end user must be a member of the `group` that is associated with this world.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               // add one user
        *               wa.addUsers('b1c19dda-2d2e-4777-ad5d-3929f17e86d3');
        *               wa.addUsers(['b1c19dda-2d2e-4777-ad5d-3929f17e86d3']);
        *               wa.addUsers({ userId: 'b1c19dda-2d2e-4777-ad5d-3929f17e86d3', role: 'VP Sales' });
        *
        *               // add several users
        *               wa.addUsers([
        *                   { userId: 'a6fe0c1e-f4b8-4f01-9f5f-01ccf4c2ed44',
        *                     role: 'VP Marketing' },
        *                   { userId: '8f2604cf-96cd-449f-82fa-e331530734ee',
        *                     role: 'VP Engineering' }
        *               ]);
        *
        *               // add one user to a specific world
        *               wa.addUsers('b1c19dda-2d2e-4777-ad5d-3929f17e86d3', world.id);
        *               wa.addUsers('b1c19dda-2d2e-4777-ad5d-3929f17e86d3', { filter: world.id });
        *           });
        *
        * ** Parameters **
        * @param {string|object|array} users User id, array of user ids, object, or array of objects of the users to add to this world.
        * @param {string} users.role The `role` the user should have in the world. It is up to the caller to ensure, if needed, that the `role` passed in is one of the `roles` or `optionalRoles` of this world.
        * @param {string} worldId The world to which the users should be added. If not specified, the filter parameter of the `options` object is used.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        addUsers: function (users, worldId, options) {

            if (!users) {
                throw new Error('Please provide a list of users to add to the world');
            }

            // normalize the list of users to an array of user objects
            users = $.map([].concat(users), function (u) {
                var isObject = $.isPlainObject(u);

                if (typeof u !== 'string' && !isObject) {
                    throw new Error('Some of the users in the list are not in the valid format: ' + u);
                }

                return isObject ? u : { userId: u };
            });

            // check if options were passed as the second parameter
            if ($.isPlainObject(worldId) && !options) {
                options = worldId;
                worldId = null;
            }

            options = options || {};

            // we must have options by now
            if (typeof worldId === 'string') {
                options.filter = worldId;
            }

            setIdFilterOrThrowError(options);

            var updateOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/users' }
            );

            return http.post(users, updateOptions);
        },

        /**
        * Updates the role of an end user in a given world. (You can only update one end user at a time.)
        *
        * **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *
        *      wa.create().then(function(world) {
        *           wa.addUsers('b1c19dda-2d2e-4777-ad5d-3929f17e86d3');
        *           wa.updateUser({ userId: 'b1c19dda-2d2e-4777-ad5d-3929f17e86d3', role: 'leader' });
        *      });
        *
        * **Parameters**
        * @param {object} user User object with `userId` and the new `role`.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        updateUser: function (user, options) {
            options = options || {};

            if (!user || !user.userId) {
                throw new Error('You need to pass a userId to update from the world');
            }

            setIdFilterOrThrowError(options);

            var patchOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/users/' + user.userId }
            );

            return http.patch(_pick(user, 'role'), patchOptions);
        },

        /**
        * Removes an end user from a given world.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               wa.addUsers(['a6fe0c1e-f4b8-4f01-9f5f-01ccf4c2ed44', '8f2604cf-96cd-449f-82fa-e331530734ee']);
        *               wa.removeUser('a6fe0c1e-f4b8-4f01-9f5f-01ccf4c2ed44');
        *               wa.removeUser({ userId: '8f2604cf-96cd-449f-82fa-e331530734ee' });
        *           });
        *
        * ** Parameters **
        * @param {object|string} user The `userId` of the user to remove from the world, or an object containing the `userId` field.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        removeUser: function (user, options) {
            options = options || {};

            if (typeof user === 'string') {
                user = { userId: user };
            }

            if (!user.userId) {
                throw new Error('You need to pass a userId to remove from the world');
            }

            setIdFilterOrThrowError(options);

            var getOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/users/' + user.userId }
            );

            return http.delete(null, getOptions);
        },

        /**
        * Gets the run id of current run for the given world. If the world does not have a run, creates a new one and returns the run id.
        *
        * Remember that a [run](../../glossary/#run) is a collection of interactions with a project and its model. In the case of multiplayer projects, the run is shared by all end users in the world.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.create()
        *           .then(function(world) {
        *               wa.getCurrentRunId({ model: 'model.py' });
        *           });
        *
        * ** Parameters **
        * @param {object} options (Optional) Options object to override global options.
        * @param {object} options.model The model file to use to create a run if needed.
        * @return {Promise}
        */
        getCurrentRunId: function (options) {
            options = options || {};

            setIdFilterOrThrowError(options);

            var getOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/run' }
            );

            validateModelOrThrowError(getOptions);
            return http.post(_pick(getOptions, 'model'), getOptions);
        },

        /**
        * Gets the current (most recent) world for the given end user in the given group. Brings this most recent world into memory if needed.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *      wa.getCurrentWorldForUser('8f2604cf-96cd-449f-82fa-e331530734ee')
        *           .then(function(world) {
        *               // use data from world
        *           });
        *
        * ** Parameters **
        * @param {string} userId The `userId` of the user whose current (most recent) world is being retrieved.
        * @param {string} groupName (Optional) The name of the group. If not provided, defaults to the group used to create the service.
        * @return {Promise}
        */
        getCurrentWorldForUser: function (userId, groupName) {
            var dtd = $.Deferred();
            var me = this;
            this.getWorldsForUser(userId, { group: groupName })
                .then(function (worlds) {
                    // assume the most recent world as the 'active' world
                    worlds.sort(function (a, b) { return new Date(b.lastModified) - new Date(a.lastModified); });
                    var currentWorld = worlds[0];

                    if (currentWorld) {
                        serviceOptions.filter = currentWorld.id;
                    }

                    dtd.resolveWith(me, [currentWorld]);
                })
                .fail(dtd.reject);

            return dtd.promise();
        },

        /**
        * Deletes the current run from the world.
        *
        * (Note that the world id remains part of the run record, indicating that the run was formerly an active run for the world.)
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *
        *      wa.deleteRun('sample-world-id');
        *
        *  **Parameters**
        * @param {string} worldId The `worldId` of the world from which the current run is being deleted.
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        deleteRun: function (worldId, options) {
            options = options || {};

            if (worldId) {
                options.filter = worldId;
            }

            setIdFilterOrThrowError(options);

            var deleteOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/run' }
            );

            return http.delete(null, deleteOptions);
        },

        /**
        * Creates a new run for the world.
        *
        *  **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *
        *      wa.getCurrentWorldForUser('8f2604cf-96cd-449f-82fa-e331530734ee')
        *           .then(function (world) {
        *                   wa.newRunForWorld(world.id);
        *           });
        *
        *  **Parameters**
        * @param {string} worldId worldId in which we create the new run.
        * @param {object} options (Optional) Options object to override global options.
        * @param {object} options.model The model file to use to create a run if needed.
        * @return {Promise}
        */
        newRunForWorld: function (worldId, options) {
            var currentRunOptions = $.extend(true, {},
                options,
                { filter: worldId || serviceOptions.filter }
            );
            var me = this;

            validateModelOrThrowError(currentRunOptions);

            return this.deleteRun(worldId, options)
                .then(function () {
                    return me.getCurrentRunId(currentRunOptions);
                });
        },

        /**
        * Assigns end users to worlds, creating new worlds as appropriate, automatically. Assigns all end users in the group, and creates new worlds as needed based on the project-level world configuration (roles, optional roles, and minimum end users per world).
        *
        * **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *
        *      wa.autoAssign();
        *
        * **Parameters**
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        *
        */
        autoAssign: function (options) {
            options = options || {};

            var opt = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(assignmentEndpoint) }
            );

            var params = {
                account: opt.account,
                project: opt.project,
                group: opt.group
            };

            if (opt.maxUsers) {
                params.maxUsers = opt.maxUsers;
            }

            return http.post(params, opt);
        },

        /**
        * Gets the project's world configuration.
        *
        * Typically, every interaction with your project uses the same configuration of each world. For example, each world in your project probably has the same roles for end users. And your project is probably either configured so that all end users share the same world (and run), or smaller sets of end users share worlds — but not both.
        *
        * (The [Multiplayer Project REST API](../../../rest_apis/multiplayer/multiplayer_project/) allows you to set these project-level world configurations. The World Adapter simply retrieves them, for example so they can be used in auto-assignment of end users to worlds.)
        *
        * **Example**
        *
        *      var wa = new F.service.World({
        *           account: 'acme-simulations',
        *           project: 'supply-chain-game',
        *           group: 'team1' });
        *
        *      wa.getProjectSettings()
        *           .then(function(settings) {
        *               console.log(settings.roles);
        *               console.log(settings.optionalRoles);
        *           });
        *
        * **Parameters**
        * @param {object} options (Optional) Options object to override global options.
        * @return {Promise}
        */
        getProjectSettings: function (options) {
            options = options || {};

            var opt = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(projectEndpoint) }
            );

            opt.url += [opt.account, opt.project].join('/');
            return http.get(null, opt);
        }

    };

    $.extend(this, publicAPI);
};

},{"../store/session-manager":43,"../transport/http-transport-factory":46,"../util/object-util":48,"./configuration-service":30}],42:[function(require,module,exports){
/**
 * @class Cookie Storage Service
 *
 * @example
 *      var people = require('cookie-store')({ root: 'people' });
        people
            .save({lastName: 'smith' })

 */


'use strict';

// Thin document.cookie wrapper to allow unit testing
var Cookie = function () {
    this.get = function () {
        return document.cookie;
    };

    this.set = function (newCookie) {
        document.cookie = newCookie;
    };
};

module.exports = function (config) {
    var host = window.location.hostname;
    var validHost = host.split('.').length > 1;
    var domain = validHost ? '.' + host : null;

    var defaults = {
        /**
         * Name of collection
         * @type { string}
         */
        root: '/',

        domain: domain,
        cookie: new Cookie()
    };
    this.serviceOptions = $.extend({}, defaults, config);

    var publicAPI = {
        // * TBD
        //  * Query collection; uses MongoDB syntax
        //  * @see  <TBD: Data API URL>
        //  *
        //  * @param { string} qs Query Filter
        //  * @param { string} limiters @see <TBD: url for limits, paging etc>
        //  *
        //  * @example
        //  *     cs.query(
        //  *      { name: 'John', className: 'CSC101' },
        //  *      {limit: 10}
        //  *     )

        // query: function (qs, limiters) {

        // },

        /**
         * Save cookie value
         * @param  { string|Object} key   If given a key save values under it, if given an object directly, save to top-level api
         * @param  {Object} value (Optional)
         * @param {Object} options Overrides for service options
         *
         * @return {*} The saved value
         *
         * @example
         *     cs.set('person', { firstName: 'john', lastName: 'smith' });
         *     cs.set({ name:'smith', age:'32' });
         */
        set: function (key, value, options) {
            var setOptions = $.extend(true, {}, this.serviceOptions, options);

            var domain = setOptions.domain;
            var path = setOptions.root;
            var cookie = setOptions.cookie;

            cookie.set(encodeURIComponent(key) + '=' +
                                encodeURIComponent(value) +
                                (domain ? '; domain=' + domain : '') +
                                (path ? '; path=' + path : '')
            );

            return value;
        },

        /**
         * Load cookie value
         * @param  { string|Object} key   If given a key save values under it, if given an object directly, save to top-level api
         * @return {*} The value stored
         *
         * @example
         *     cs.get('person');
         */
        get: function (key) {
            var cookie = this.serviceOptions.cookie;
            var cookieReg = new RegExp('(?:^|;)\\s*' + encodeURIComponent(key).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$');
            var res = cookieReg.exec(cookie.get());
            var val = res ? decodeURIComponent(res[1]) : null;
            return val;
        },

        /**
         * Removes key from collection
         * @param { string} key key to remove
         * @param {object} options (optional) overrides for service options
         * @return { string} key The key removed
         *
         * @example
         *     cs.remove('person');
         */
        remove: function (key, options) {
            var remOptions = $.extend(true, {}, this.serviceOptions, options);

            var domain = remOptions.domain;
            var path = remOptions.root;
            var cookie = remOptions.cookie;

            cookie.set(encodeURIComponent(key) +
                            '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' +
                            (domain ? '; domain=' + domain : '') +
                            (path ? '; path=' + path : '')
            );
            return key;
        },

        /**
         * Removes collection being referenced
         * @return { array} keys All the keys removed
         */
        destroy: function () {
            var cookie = this.serviceOptions.cookie;
            var aKeys = cookie.get().replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, '').split(/\s*(?:\=[^;]*)?;\s*/);
            for (var nIdx = 0; nIdx < aKeys.length; nIdx++) {
                var cookieKey = decodeURIComponent(aKeys[nIdx]);
                this.remove(cookieKey);
            }
            return aKeys;
        }
    };

    $.extend(this, publicAPI);
};

},{}],43:[function(require,module,exports){
'use strict';

var keyNames = require('../managers/key-names');
var StorageFactory = require('./store-factory');
var optionUtils = require('../util/option-utils');

var EPI_SESSION_KEY = keyNames.EPI_SESSION_KEY;
var defaults = {
    /**
     * Where to store user access tokens for temporary access. Defaults to storing in a cookie in the browser.
     * @type {string}
     */
    store: { synchronous: true }
};

var SessionManager = function (managerOptions) {
    managerOptions = managerOptions || {};
    function getBaseOptions(overrides) {
        overrides = overrides || {};
        var libOptions = optionUtils.getOptions();
        var finalOptions = $.extend(true, {}, defaults, libOptions, managerOptions, overrides);
        return finalOptions;
    }

    function getStore(overrides) {
        var baseOptions = getBaseOptions(overrides);
        var storeOpts = baseOptions.store || {};
        var isEpicenterDomain = !baseOptions.isLocal && !baseOptions.isCustomDomain;
        if (storeOpts.root === undefined && baseOptions.account && baseOptions.project && isEpicenterDomain) {
            storeOpts.root = '/app/' + baseOptions.account + '/' + baseOptions.project;
        }
        return new StorageFactory(storeOpts);
    }

    var publicAPI = {
        saveSession: function (userInfo, options) {
            var serialized = JSON.stringify(userInfo);
            getStore(options).set(EPI_SESSION_KEY, serialized);
        },
        getSession: function (options) {
            // var session = getStore(options).get(EPI_SESSION_KEY) || '{}';
            // return JSON.parse(session);
            var store = getStore(options);
            var finalOpts = store.serviceOptions;
            var serialized = store.get(EPI_SESSION_KEY) || '{}';
            var session = JSON.parse(serialized);
            // If the url contains the project and account
            // validate the account and project in the session
            // and override project, groupName, groupId and isFac
            // Otherwise (i.e. localhost) use the saved session values
            var account = finalOpts.account;
            var project = finalOpts.project;
            if (account && session.account !== account) {
                // This means that the token was not used to login to the same account
                return {};
            }
            if (session.groups && account && project) {
                var group = session.groups[project] || { groupId: '', groupName: '', isFac: false };
                $.extend(session, { project: project }, group);
            }
            return session;
        },
        removeSession: function (options) {
            var store = getStore(options);
            Object.keys(keyNames).forEach(function (cookieKey) {
                var cookieName = keyNames[cookieKey];
                store.remove(cookieName);
            });
            return true;
        },
        getStore: function (options) {
            return getStore(options);
        },

        getMergedOptions: function () {
            var args = Array.prototype.slice.call(arguments);
            var overrides = $.extend.apply($, [true, {}].concat(args));
            var baseOptions = getBaseOptions(overrides);
            var session = this.getSession(overrides);

            var sessionDefaults = {
                /**
                 * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
                 * @see [Authentication API Service](../auth-api-service/) for getting tokens.
                 * @type {String}
                 */
                //jshint camelcase: false
                //jscs:disable
                token: session.auth_token,
                /**
                 * The group name. If left undefined, taken from the cookie session.
                 * @type {String}
                 */
                group: session.groupName,
                /**
                 * The group id. If left undefined, taken from the cookie session.
                 * @type {String}
                 */
                groupId: session.groupId,
                userId: session.userId
            };
            return $.extend(true, sessionDefaults, baseOptions);
        }
    };
    $.extend(this, publicAPI);
};

module.exports = SessionManager;
},{"../managers/key-names":12,"../util/option-utils":49,"./store-factory":44}],44:[function(require,module,exports){
/**
    Decides type of store to provide
*/

'use strict';
// var isNode = false; FIXME: Browserify/minifyify has issues with the next link
// var store = (isNode) ? require('./session-store') : require('./cookie-store');
var store = require('./cookie-store');

module.exports = store;

},{"./cookie-store":42}],45:[function(require,module,exports){
'use strict';

var qutils = require('../util/query-util');

module.exports = function (config) {

    var defaults = {
        url: '',

        contentType: 'application/json',
        headers: {},
        statusCode: {
            404: $.noop
        },

        /**
         * ONLY for strings in the url. All GET & DELETE params are run through this
         * @type {[type] }
         */
        parameterParser: qutils.toQueryFormat,

        // To allow epicenter.token and other session cookies to be passed
        // with the requests
        xhrFields: {
            withCredentials: true
        }
    };

    var transportOptions = $.extend({}, defaults, config);

    var result = function (d) {
        return ($.isFunction(d)) ? d() : d;
    };

    var connect = function (method, params, connectOptions) {
        params = result(params);
        params = ($.isPlainObject(params) || $.isArray(params)) ? JSON.stringify(params) : params;

        var options = $.extend(true, {}, transportOptions, connectOptions, {
            type: method,
            data: params
        });
        var ALLOWED_TO_BE_FUNCTIONS = ['data', 'url'];
        $.each(options, function (key, value) {
            if ($.isFunction(value) && $.inArray(key, ALLOWED_TO_BE_FUNCTIONS) !== -1) {
                options[key] = value();
            }
        });

        if (options.logLevel && options.logLevel === 'DEBUG') {
            console.log(options.url);
            var oldSuccessFn = options.success || $.noop;
            options.success = function (response, ajaxStatus, ajaxReq) {
                console.log(response);
                oldSuccessFn.apply(this, arguments);
            };
        }

        var beforeSend = options.beforeSend;
        options.beforeSend = function (xhr, settings) {
            xhr.requestUrl = (connectOptions || {}).url;
            if (beforeSend) {
                beforeSend.apply(this, arguments);
            }
        };

        return $.ajax(options);
    };

    var publicAPI = {
        get: function (params, ajaxOptions) {
            var options = $.extend({}, transportOptions, ajaxOptions);
            params = options.parameterParser(result(params));
            return connect.call(this, 'GET', params, options);
        },
        splitGet: function () {

        },
        post: function () {
            return connect.apply(this, ['post'].concat([].slice.call(arguments)));
        },
        patch: function () {
            return connect.apply(this, ['patch'].concat([].slice.call(arguments)));
        },
        put: function () {
            return connect.apply(this, ['put'].concat([].slice.call(arguments)));
        },
        delete: function (params, ajaxOptions) {
            //DELETE doesn't support body params, but jQuery thinks it does.
            var options = $.extend({}, transportOptions, ajaxOptions);
            params = options.parameterParser(result(params));
            if ($.trim(params)) {
                var delimiter = (result(options.url).indexOf('?') === -1) ? '?' : '&';
                options.url = result(options.url) + delimiter + params;
            }
            return connect.call(this, 'DELETE', null, options);
        },
        head: function () {
            return connect.apply(this, ['head'].concat([].slice.call(arguments)));
        },
        options: function () {
            return connect.apply(this, ['options'].concat([].slice.call(arguments)));
        }
    };

    return $.extend(this, publicAPI);
};

},{"../util/query-util":50}],46:[function(require,module,exports){
'use strict';

// var isNode = false; FIXME: Browserify/minifyify has issues with the next link
// var transport = (isNode) ? require('./node-http-transport') : require('./ajax-http-transport');
var transport = require('./ajax-http-transport');
module.exports = transport;

},{"./ajax-http-transport":45}],47:[function(require,module,exports){
/**
/* Inherit from a class (using prototype borrowing)
*/
'use strict';

function inherit(C, P) {
    var F = function () {};
    F.prototype = P.prototype;
    C.prototype = new F();
    C.__super = P.prototype;
    C.prototype.constructor = C;
}

/**
* Shallow copy of an object
* @param {Object} dest object to extend
* @return {Object} extended object
*/
var extend = function (dest /*, var_args*/) {
    var obj = Array.prototype.slice.call(arguments, 1);
    var current;
    for (var j = 0; j < obj.length; j++) {
        if (!(current = obj[j])) { //eslint-disable-line
            continue;
        }

        // do not wrap inner in dest.hasOwnProperty or bad things will happen
        for (var key in current) { //eslint-disable-line
            dest[key] = current[key];
        }
    }

    return dest;
};

module.exports = function (base, props, staticProps) {
    var parent = base;
    var child;

    child = props && props.hasOwnProperty('constructor') ? props.constructor : function () { return parent.apply(this, arguments); };

    // add static properties to the child constructor function
    extend(child, parent, staticProps);

    // associate prototype chain
    inherit(child, parent);

    // add instance properties
    if (props) {
        extend(child.prototype, props);
    }

    // done
    return child;
};

},{}],48:[function(require,module,exports){
'use strict';

module.exports = {
    _pick: function (obj, props) {
        var res = {};
        for (var p in obj) {
            if (props.indexOf(p) !== -1) {
                res[p] = obj[p];
            }
        }

        return res;
    }
};

},{}],49:[function(require,module,exports){
'use strict';

var ConfigService = require('../service/configuration-service');

var urlConfig = new ConfigService().get('server');
var customDefaults = {};
var libDefaults = {
    /**
     * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string. If left undefined, taken from the URL.
     * @type {String}
     */
    account: urlConfig.accountPath,
    /**
     * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string. If left undefined, taken from the URL.
     * @type {String}
     */
    project: urlConfig.projectPath,
    isLocal: urlConfig.isLocalhost(),
    isCustomDomain: urlConfig.isCustomDomain,
    store: {}
};

var optionUtils = {
    /**
     * Gets the final options by overriding the global options set with
     * optionUtils#setDefaults() and the lib defaults.
     * @param {object} options The final options object.
     * @return {object} Extended object
     */
    getOptions: function (options) {
        return $.extend(true, {}, libDefaults, customDefaults, options);
    },
    /**
     * Sets the global defaults for the optionUtils#getOptions() method.
     * @param {object} defaults The defaults object.
     */
    setDefaults: function (defaults) {
        customDefaults = defaults;
    }
};
module.exports = optionUtils;

},{"../service/configuration-service":30}],50:[function(require,module,exports){
/**
 * Utilities for working with query strings
*/
'use strict';

module.exports = (function () {

    return {
        /**
         * Converts to matrix format
         * @param  {Object} qs Object to convert to query string
         * @return { string}    Matrix-format query parameters
         */
        toMatrixFormat: function (qs) {
            if (qs === null || qs === undefined || qs === '') {
                return ';';
            }
            if (typeof qs === 'string' || qs instanceof String) {
                return qs;
            }

            var returnArray = [];
            var OPERATORS = ['<', '>', '!'];
            $.each(qs, function (key, value) {
                if (typeof value !== 'string' || $.inArray($.trim(value).charAt(0), OPERATORS) === -1) {
                    value = '=' + value;
                }
                returnArray.push(key + value);
            });

            var mtrx = ';' + returnArray.join(';');
            return mtrx;
        },

        /**
         * Converts strings/arrays/objects to type 'a=b&b=c'
         * @param  { string|Array|Object} qs
         * @return { string}
         */
        toQueryFormat: function (qs) {
            if (qs === null || qs === undefined) {
                return '';
            }
            if (typeof qs === 'string' || qs instanceof String) {
                return qs;
            }

            var returnArray = [];
            $.each(qs, function (key, value) {
                if ($.isArray(value)) {
                    value = value.join(',');
                }
                if ($.isPlainObject(value)) {
                    //Mostly for data api
                    value = JSON.stringify(value);
                }
                returnArray.push(key + '=' + value);
            });

            var result = returnArray.join('&');
            return result;
        },

        /**
         * Converts strings of type 'a=b&b=c' to { a:b, b:c}
         * @param  { string} qs
         * @return {object}
         */
        qsToObject: function (qs) {
            if (qs === null || qs === undefined || qs === '') {
                return {};
            }

            var qsArray = qs.split('&');
            var returnObj = {};
            $.each(qsArray, function (index, value) {
                var qKey = value.split('=')[0];
                var qVal = value.split('=')[1];

                if (qVal.indexOf(',') !== -1) {
                    qVal = qVal.split(',');
                }

                returnObj[qKey] = qVal;
            });

            return returnObj;
        },

        /**
         * Normalizes and merges strings of type 'a=b', { b:c} to { a:b, b:c}
         * @param  { string|Array|Object} qs1
         * @param  { string|Array|Object} qs2
         * @return {Object}
         */
        mergeQS: function (qs1, qs2) {
            var obj1 = this.qsToObject(this.toQueryFormat(qs1));
            var obj2 = this.qsToObject(this.toQueryFormat(qs2));
            return $.extend(true, {}, obj1, obj2);
        },

        addTrailingSlash: function (url) {
            if (!url) {
                return '';
            }
            return (url.charAt(url.length - 1) === '/') ? url : (url + '/');
        }
    };
}());



},{}],51:[function(require,module,exports){
/**
 * Utilities for working with the run service
*/
'use strict';
var qutil = require('./query-util');
var MAX_URL_LENGTH = 2048;

module.exports = (function () {
    return {
        /**
         * returns operations of the form `[[op1,op2], [arg1, arg2]]`
         * @param  {Object|Array|String} operations operations to perform
         * @param  {Array} args arguments for operation
         * @return {String}    Matrix-format query parameters
         */
        normalizeOperations: function (operations, args) {
            if (!args) {
                args = [];
            }
            var returnList = {
                ops: [],
                args: []
            };

            var _concat = function (arr) {
                return (arr !== null && arr !== undefined) ? [].concat(arr) : [];
            };

            //{ add: [1,2], subtract: [2,4] }
            var _normalizePlainObjects = function (operations, returnList) {
                if (!returnList) {
                    returnList = { ops: [], args: [] };
                }
                $.each(operations, function (opn, arg) {
                    returnList.ops.push(opn);
                    returnList.args.push(_concat(arg));
                });
                return returnList;
            };
            //{ name: 'add', params: [1] }
            var _normalizeStructuredObjects = function (operation, returnList) {
                if (!returnList) {
                    returnList = { ops: [], args: [] };
                }
                returnList.ops.push(operation.name);
                returnList.args.push(_concat(operation.params));
                return returnList;
            };

            var _normalizeObject = function (operation, returnList) {
                return ((operation.name) ? _normalizeStructuredObjects : _normalizePlainObjects)(operation, returnList);
            };

            var _normalizeLiterals = function (operation, args, returnList) {
                if (!returnList) {
                    returnList = { ops: [], args: [] };
                }
                returnList.ops.push(operation);
                returnList.args.push(_concat(args));
                return returnList;
            };


            var _normalizeArrays = function (operations, arg, returnList) {
                if (!returnList) {
                    returnList = { ops: [], args: [] };
                }
                $.each(operations, function (index, opn) {
                    if ($.isPlainObject(opn)) {
                        _normalizeObject(opn, returnList);
                    } else {
                        _normalizeLiterals(opn, args[index], returnList);
                    }
                });
                return returnList;
            };

            if ($.isPlainObject(operations)) {
                _normalizeObject(operations, returnList);
            } else if ($.isArray(operations)) {
                _normalizeArrays(operations, args, returnList);
            } else {
                _normalizeLiterals(operations, args, returnList);
            }

            return returnList;
        },

        splitGetFactory: function (httpOptions) {
            return function (params, options) {
                var http = this; //eslint-disable-line
                var getValue = function (name) {
                    var value = options[name] || httpOptions[name];
                    if (typeof value === 'function') {
                        value = value();
                    }
                    return value;
                };
                var getFinalUrl = function (params) {
                    var url = getValue('url', options);
                    var data = params;
                    // There is easy (or known) way to get the final URL jquery is going to send so
                    // we're replicating it. The process might change at some point but it probably will not.
                    // 1. Remove hash
                    url = url.replace(/#.*$/, '');
                    // 1. Append query string
                    var queryParams = qutil.toQueryFormat(data);
                    var questionIdx = url.indexOf('?');
                    if (queryParams && questionIdx > -1) {
                        return url + '&' + queryParams;
                    } else if (queryParams) {
                        return url + '?' + queryParams;
                    }
                    return url;
                };
                var url = getFinalUrl(params);
                // We must split the GET in multiple short URL's
                // The only property allowed to be split is "include"
                if (params && params.include && encodeURI(url).length > MAX_URL_LENGTH) {
                    var dtd = $.Deferred();
                    var paramsCopy = $.extend(true, {}, params);
                    delete paramsCopy.include;
                    var urlNoIncludes = getFinalUrl(paramsCopy);
                    var diff = MAX_URL_LENGTH - urlNoIncludes.length;
                    var oldSuccess = options.success || httpOptions.success || $.noop;
                    var oldError = options.error || httpOptions.error || $.noop;
                    // remove the original success and error callbacks
                    options.success = $.noop;
                    options.error = $.noop;

                    var include = params.include;
                    var currIncludes = [];
                    var includeOpts = [currIncludes];
                    var currLength = encodeURIComponent('?include=').length;
                    var variable = include.pop();
                    while (variable) {
                        var varLenght = encodeURIComponent(variable).length;
                        // Use a greedy approach for now, can be optimized to be solved in a more
                        // efficient way
                        // + 1 is the comma
                        if (currLength + varLenght + 1 < diff) {
                            currIncludes.push(variable);
                            currLength += varLenght + 1;
                        } else {
                            currIncludes = [variable];
                            includeOpts.push(currIncludes);
                            currLength = '?include='.length + varLenght;
                        }
                        variable = include.pop();
                    }
                    var reqs = $.map(includeOpts, function (include) {
                        var reqParams = $.extend({}, params, { include: include });
                        return http.get(reqParams, options);
                    });
                    $.when.apply($, reqs).then(function () {
                        // Each argument are arrays of the arguments of each done request
                        // So the first argument of the first array of arguments is the data
                        var isValid = arguments[0] && arguments[0][0];
                        if (!isValid) {
                            // Should never happen...
                            oldError();
                            return dtd.reject();
                        }
                        var firstResponse = arguments[0][0];
                        var isObject = $.isPlainObject(firstResponse);
                        var isRunAPI = (isObject && $.isPlainObject(firstResponse.variables)) || !isObject;
                        if (isRunAPI) {
                            if (isObject) {
                                // aggregate the variables property only
                                var aggregateRun = arguments[0][0];
                                $.each(arguments, function (idx, args) {
                                    var run = args[0];
                                    $.extend(true, aggregateRun.variables, run.variables);
                                });
                                oldSuccess(aggregateRun, arguments[0][1], arguments[0][2]);
                                dtd.resolve(aggregateRun, arguments[0][1], arguments[0][2]);
                            } else {
                                // array of runs
                                // Agregate variables in each run
                                var aggregatedRuns = {};
                                $.each(arguments, function (idx, args) {
                                    var runs = args[0];
                                    if (!$.isArray(runs)) {
                                        return;
                                    }
                                    $.each(runs, function (idxRun, run) {
                                        if (run.id && !aggregatedRuns[run.id]) {
                                            run.variables = run.variables || {};
                                            aggregatedRuns[run.id] = run;
                                        } else if (run.id) {
                                            $.extend(true, aggregatedRuns[run.id].variables, run.variables);
                                        }
                                    });
                                });
                                // turn it into an array
                                aggregatedRuns = $.map(aggregatedRuns, function (run) { return run; });
                                oldSuccess(aggregatedRuns, arguments[0][1], arguments[0][2]);
                                dtd.resolve(aggregatedRuns, arguments[0][1], arguments[0][2]);
                            }
                        } else {
                            // is variables API
                            // aggregate the response
                            var aggregatedVariables = {};
                            $.each(arguments, function (idx, args) {
                                var vars = args[0];
                                $.extend(true, aggregatedVariables, vars);
                            });
                            oldSuccess(aggregatedVariables, arguments[0][1], arguments[0][2]);
                            dtd.resolve(aggregatedVariables, arguments[0][1], arguments[0][2]);
                        }
                    }, function () {
                        oldError.apply(http, arguments);
                        dtd.reject.apply(dtd, arguments);
                    });
                    return dtd.promise();
                } else {
                    return http.get(params, options);
                }
            };
        }
    };
}());

},{"./query-util":50}]},{},[7])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCJub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2llZWU3NTQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9vYmplY3QtYXNzaWduL2luZGV4LmpzIiwic3JjL2FwaS12ZXJzaW9uLmpzb24iLCJzcmMvYXBwLmpzIiwic3JjL2Vudi1sb2FkLmpzIiwic3JjL21hbmFnZXJzL2F1dGgtbWFuYWdlci5qcyIsInNyYy9tYW5hZ2Vycy9jaGFubmVsLW1hbmFnZXIuanMiLCJzcmMvbWFuYWdlcnMvZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlci5qcyIsInNyYy9tYW5hZ2Vycy9rZXktbmFtZXMuanMiLCJzcmMvbWFuYWdlcnMvcnVuLW1hbmFnZXIuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvYWx3YXlzLW5ldy1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9jb25kaXRpb25hbC1jcmVhdGlvbi1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9pZGVudGl0eS1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9tdWx0aXBsYXllci1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9uZXctaWYtaW5pdGlhbGl6ZWQtc3RyYXRlZ3kuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvbmV3LWlmLW1pc3Npbmctc3RyYXRlZ3kuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvbmV3LWlmLXBlcnNpc3RlZC1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9wZXJzaXN0ZW50LXNpbmdsZS1wbGF5ZXItc3RyYXRlZ3kuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvc3RyYXRlZ2llcy1tYXAuanMiLCJzcmMvbWFuYWdlcnMvc2NlbmFyaW8tbWFuYWdlci5qcyIsInNyYy9tYW5hZ2Vycy9zcGVjaWFsLW9wZXJhdGlvbnMuanMiLCJzcmMvbWFuYWdlcnMvd29ybGQtbWFuYWdlci5qcyIsInNyYy9zZXJ2aWNlL2FkbWluLWZpbGUtc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL2Fzc2V0LWFwaS1hZGFwdGVyLmpzIiwic3JjL3NlcnZpY2UvYXV0aC1hcGktc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL2NoYW5uZWwtc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL2NvbmZpZ3VyYXRpb24tc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL2RhdGEtYXBpLXNlcnZpY2UuanMiLCJzcmMvc2VydmljZS9ncm91cC1hcGktc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL2ludHJvc3BlY3Rpb24tYXBpLXNlcnZpY2UuanMiLCJzcmMvc2VydmljZS9tZW1iZXItYXBpLWFkYXB0ZXIuanMiLCJzcmMvc2VydmljZS9ydW4tYXBpLXNlcnZpY2UuanMiLCJzcmMvc2VydmljZS9zZXJ2aWNlLXV0aWxzLmpzIiwic3JjL3NlcnZpY2Uvc3RhdGUtYXBpLWFkYXB0ZXIuanMiLCJzcmMvc2VydmljZS91cmwtY29uZmlnLXNlcnZpY2UuanMiLCJzcmMvc2VydmljZS91c2VyLWFwaS1hZGFwdGVyLmpzIiwic3JjL3NlcnZpY2UvdmFyaWFibGVzLWFwaS1zZXJ2aWNlLmpzIiwic3JjL3NlcnZpY2Uvd29ybGQtYXBpLWFkYXB0ZXIuanMiLCJzcmMvc3RvcmUvY29va2llLXN0b3JlLmpzIiwic3JjL3N0b3JlL3Nlc3Npb24tbWFuYWdlci5qcyIsInNyYy9zdG9yZS9zdG9yZS1mYWN0b3J5LmpzIiwic3JjL3RyYW5zcG9ydC9hamF4LWh0dHAtdHJhbnNwb3J0LmpzIiwic3JjL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5LmpzIiwic3JjL3V0aWwvaW5oZXJpdC5qcyIsInNyYy91dGlsL29iamVjdC11dGlsLmpzIiwic3JjL3V0aWwvb3B0aW9uLXV0aWxzLmpzIiwic3JjL3V0aWwvcXVlcnktdXRpbC5qcyIsInNyYy91dGlsL3J1bi11dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM3dkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTs7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0WUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25ZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3J2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCdcblxuZXhwb3J0cy50b0J5dGVBcnJheSA9IHRvQnl0ZUFycmF5XG5leHBvcnRzLmZyb21CeXRlQXJyYXkgPSBmcm9tQnl0ZUFycmF5XG5cbnZhciBsb29rdXAgPSBbXVxudmFyIHJldkxvb2t1cCA9IFtdXG52YXIgQXJyID0gdHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnID8gVWludDhBcnJheSA6IEFycmF5XG5cbmZ1bmN0aW9uIGluaXQgKCkge1xuICB2YXIgY29kZSA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJ1xuICBmb3IgKHZhciBpID0gMCwgbGVuID0gY29kZS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGxvb2t1cFtpXSA9IGNvZGVbaV1cbiAgICByZXZMb29rdXBbY29kZS5jaGFyQ29kZUF0KGkpXSA9IGlcbiAgfVxuXG4gIHJldkxvb2t1cFsnLScuY2hhckNvZGVBdCgwKV0gPSA2MlxuICByZXZMb29rdXBbJ18nLmNoYXJDb2RlQXQoMCldID0gNjNcbn1cblxuaW5pdCgpXG5cbmZ1bmN0aW9uIHRvQnl0ZUFycmF5IChiNjQpIHtcbiAgdmFyIGksIGosIGwsIHRtcCwgcGxhY2VIb2xkZXJzLCBhcnJcbiAgdmFyIGxlbiA9IGI2NC5sZW5ndGhcblxuICBpZiAobGVuICUgNCA+IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuICB9XG5cbiAgLy8gdGhlIG51bWJlciBvZiBlcXVhbCBzaWducyAocGxhY2UgaG9sZGVycylcbiAgLy8gaWYgdGhlcmUgYXJlIHR3byBwbGFjZWhvbGRlcnMsIHRoYW4gdGhlIHR3byBjaGFyYWN0ZXJzIGJlZm9yZSBpdFxuICAvLyByZXByZXNlbnQgb25lIGJ5dGVcbiAgLy8gaWYgdGhlcmUgaXMgb25seSBvbmUsIHRoZW4gdGhlIHRocmVlIGNoYXJhY3RlcnMgYmVmb3JlIGl0IHJlcHJlc2VudCAyIGJ5dGVzXG4gIC8vIHRoaXMgaXMganVzdCBhIGNoZWFwIGhhY2sgdG8gbm90IGRvIGluZGV4T2YgdHdpY2VcbiAgcGxhY2VIb2xkZXJzID0gYjY0W2xlbiAtIDJdID09PSAnPScgPyAyIDogYjY0W2xlbiAtIDFdID09PSAnPScgPyAxIDogMFxuXG4gIC8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuICBhcnIgPSBuZXcgQXJyKGxlbiAqIDMgLyA0IC0gcGxhY2VIb2xkZXJzKVxuXG4gIC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcbiAgbCA9IHBsYWNlSG9sZGVycyA+IDAgPyBsZW4gLSA0IDogbGVuXG5cbiAgdmFyIEwgPSAwXG5cbiAgZm9yIChpID0gMCwgaiA9IDA7IGkgPCBsOyBpICs9IDQsIGogKz0gMykge1xuICAgIHRtcCA9IChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDE4KSB8IChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA8PCAxMikgfCAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPDwgNikgfCByZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDMpXVxuICAgIGFycltMKytdID0gKHRtcCA+PiAxNikgJiAweEZGXG4gICAgYXJyW0wrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltMKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgaWYgKHBsYWNlSG9sZGVycyA9PT0gMikge1xuICAgIHRtcCA9IChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDIpIHwgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldID4+IDQpXG4gICAgYXJyW0wrK10gPSB0bXAgJiAweEZGXG4gIH0gZWxzZSBpZiAocGxhY2VIb2xkZXJzID09PSAxKSB7XG4gICAgdG1wID0gKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTApIHwgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDQpIHwgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMildID4+IDIpXG4gICAgYXJyW0wrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltMKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIGFyclxufVxuXG5mdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuICByZXR1cm4gbG9va3VwW251bSA+PiAxOCAmIDB4M0ZdICsgbG9va3VwW251bSA+PiAxMiAmIDB4M0ZdICsgbG9va3VwW251bSA+PiA2ICYgMHgzRl0gKyBsb29rdXBbbnVtICYgMHgzRl1cbn1cblxuZnVuY3Rpb24gZW5jb2RlQ2h1bmsgKHVpbnQ4LCBzdGFydCwgZW5kKSB7XG4gIHZhciB0bXBcbiAgdmFyIG91dHB1dCA9IFtdXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSArPSAzKSB7XG4gICAgdG1wID0gKHVpbnQ4W2ldIDw8IDE2KSArICh1aW50OFtpICsgMV0gPDwgOCkgKyAodWludDhbaSArIDJdKVxuICAgIG91dHB1dC5wdXNoKHRyaXBsZXRUb0Jhc2U2NCh0bXApKVxuICB9XG4gIHJldHVybiBvdXRwdXQuam9pbignJylcbn1cblxuZnVuY3Rpb24gZnJvbUJ5dGVBcnJheSAodWludDgpIHtcbiAgdmFyIHRtcFxuICB2YXIgbGVuID0gdWludDgubGVuZ3RoXG4gIHZhciBleHRyYUJ5dGVzID0gbGVuICUgMyAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuICB2YXIgb3V0cHV0ID0gJydcbiAgdmFyIHBhcnRzID0gW11cbiAgdmFyIG1heENodW5rTGVuZ3RoID0gMTYzODMgLy8gbXVzdCBiZSBtdWx0aXBsZSBvZiAzXG5cbiAgLy8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuICBmb3IgKHZhciBpID0gMCwgbGVuMiA9IGxlbiAtIGV4dHJhQnl0ZXM7IGkgPCBsZW4yOyBpICs9IG1heENodW5rTGVuZ3RoKSB7XG4gICAgcGFydHMucHVzaChlbmNvZGVDaHVuayh1aW50OCwgaSwgKGkgKyBtYXhDaHVua0xlbmd0aCkgPiBsZW4yID8gbGVuMiA6IChpICsgbWF4Q2h1bmtMZW5ndGgpKSlcbiAgfVxuXG4gIC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcbiAgaWYgKGV4dHJhQnl0ZXMgPT09IDEpIHtcbiAgICB0bXAgPSB1aW50OFtsZW4gLSAxXVxuICAgIG91dHB1dCArPSBsb29rdXBbdG1wID4+IDJdXG4gICAgb3V0cHV0ICs9IGxvb2t1cFsodG1wIDw8IDQpICYgMHgzRl1cbiAgICBvdXRwdXQgKz0gJz09J1xuICB9IGVsc2UgaWYgKGV4dHJhQnl0ZXMgPT09IDIpIHtcbiAgICB0bXAgPSAodWludDhbbGVuIC0gMl0gPDwgOCkgKyAodWludDhbbGVuIC0gMV0pXG4gICAgb3V0cHV0ICs9IGxvb2t1cFt0bXAgPj4gMTBdXG4gICAgb3V0cHV0ICs9IGxvb2t1cFsodG1wID4+IDQpICYgMHgzRl1cbiAgICBvdXRwdXQgKz0gbG9va3VwWyh0bXAgPDwgMikgJiAweDNGXVxuICAgIG91dHB1dCArPSAnPSdcbiAgfVxuXG4gIHBhcnRzLnB1c2gob3V0cHV0KVxuXG4gIHJldHVybiBwYXJ0cy5qb2luKCcnKVxufVxuIiwiLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8ZmVyb3NzQGZlcm9zcy5vcmc+IDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuLyogZXNsaW50LWRpc2FibGUgbm8tcHJvdG8gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbnZhciBiYXNlNjQgPSByZXF1aXJlKCdiYXNlNjQtanMnKVxudmFyIGllZWU3NTQgPSByZXF1aXJlKCdpZWVlNzU0JylcbnZhciBpc0FycmF5ID0gcmVxdWlyZSgnaXNhcnJheScpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcblxuLyoqXG4gKiBJZiBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgVXNlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiAobW9zdCBjb21wYXRpYmxlLCBldmVuIElFNilcbiAqXG4gKiBCcm93c2VycyB0aGF0IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssIENocm9tZSA3KywgU2FmYXJpIDUuMSssXG4gKiBPcGVyYSAxMS42KywgaU9TIDQuMisuXG4gKlxuICogRHVlIHRvIHZhcmlvdXMgYnJvd3NlciBidWdzLCBzb21ldGltZXMgdGhlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiB3aWxsIGJlIHVzZWQgZXZlblxuICogd2hlbiB0aGUgYnJvd3NlciBzdXBwb3J0cyB0eXBlZCBhcnJheXMuXG4gKlxuICogTm90ZTpcbiAqXG4gKiAgIC0gRmlyZWZveCA0LTI5IGxhY2tzIHN1cHBvcnQgZm9yIGFkZGluZyBuZXcgcHJvcGVydGllcyB0byBgVWludDhBcnJheWAgaW5zdGFuY2VzLFxuICogICAgIFNlZTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4LlxuICpcbiAqICAgLSBDaHJvbWUgOS0xMCBpcyBtaXNzaW5nIHRoZSBgVHlwZWRBcnJheS5wcm90b3R5cGUuc3ViYXJyYXlgIGZ1bmN0aW9uLlxuICpcbiAqICAgLSBJRTEwIGhhcyBhIGJyb2tlbiBgVHlwZWRBcnJheS5wcm90b3R5cGUuc3ViYXJyYXlgIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYXJyYXlzIG9mXG4gKiAgICAgaW5jb3JyZWN0IGxlbmd0aCBpbiBzb21lIHNpdHVhdGlvbnMuXG5cbiAqIFdlIGRldGVjdCB0aGVzZSBidWdneSBicm93c2VycyBhbmQgc2V0IGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGAgdG8gYGZhbHNlYCBzbyB0aGV5XG4gKiBnZXQgdGhlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiwgd2hpY2ggaXMgc2xvd2VyIGJ1dCBiZWhhdmVzIGNvcnJlY3RseS5cbiAqL1xuQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgPSBnbG9iYWwuVFlQRURfQVJSQVlfU1VQUE9SVCAhPT0gdW5kZWZpbmVkXG4gID8gZ2xvYmFsLlRZUEVEX0FSUkFZX1NVUFBPUlRcbiAgOiB0eXBlZEFycmF5U3VwcG9ydCgpXG5cbi8qXG4gKiBFeHBvcnQga01heExlbmd0aCBhZnRlciB0eXBlZCBhcnJheSBzdXBwb3J0IGlzIGRldGVybWluZWQuXG4gKi9cbmV4cG9ydHMua01heExlbmd0aCA9IGtNYXhMZW5ndGgoKVxuXG5mdW5jdGlvbiB0eXBlZEFycmF5U3VwcG9ydCAoKSB7XG4gIHRyeSB7XG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KDEpXG4gICAgYXJyLl9fcHJvdG9fXyA9IHtfX3Byb3RvX186IFVpbnQ4QXJyYXkucHJvdG90eXBlLCBmb286IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH19XG4gICAgcmV0dXJuIGFyci5mb28oKSA9PT0gNDIgJiYgLy8gdHlwZWQgYXJyYXkgaW5zdGFuY2VzIGNhbiBiZSBhdWdtZW50ZWRcbiAgICAgICAgdHlwZW9mIGFyci5zdWJhcnJheSA9PT0gJ2Z1bmN0aW9uJyAmJiAvLyBjaHJvbWUgOS0xMCBsYWNrIGBzdWJhcnJheWBcbiAgICAgICAgYXJyLnN1YmFycmF5KDEsIDEpLmJ5dGVMZW5ndGggPT09IDAgLy8gaWUxMCBoYXMgYnJva2VuIGBzdWJhcnJheWBcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbmZ1bmN0aW9uIGtNYXhMZW5ndGggKCkge1xuICByZXR1cm4gQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRcbiAgICA/IDB4N2ZmZmZmZmZcbiAgICA6IDB4M2ZmZmZmZmZcbn1cblxuZnVuY3Rpb24gY3JlYXRlQnVmZmVyICh0aGF0LCBsZW5ndGgpIHtcbiAgaWYgKGtNYXhMZW5ndGgoKSA8IGxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbnZhbGlkIHR5cGVkIGFycmF5IGxlbmd0aCcpXG4gIH1cbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2UsIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgdGhhdCA9IG5ldyBVaW50OEFycmF5KGxlbmd0aClcbiAgICB0aGF0Ll9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgfSBlbHNlIHtcbiAgICAvLyBGYWxsYmFjazogUmV0dXJuIGFuIG9iamVjdCBpbnN0YW5jZSBvZiB0aGUgQnVmZmVyIGNsYXNzXG4gICAgaWYgKHRoYXQgPT09IG51bGwpIHtcbiAgICAgIHRoYXQgPSBuZXcgQnVmZmVyKGxlbmd0aClcbiAgICB9XG4gICAgdGhhdC5sZW5ndGggPSBsZW5ndGhcbiAgfVxuXG4gIHJldHVybiB0aGF0XG59XG5cbi8qKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBoYXZlIHRoZWlyXG4gKiBwcm90b3R5cGUgY2hhbmdlZCB0byBgQnVmZmVyLnByb3RvdHlwZWAuIEZ1cnRoZXJtb3JlLCBgQnVmZmVyYCBpcyBhIHN1YmNsYXNzIG9mXG4gKiBgVWludDhBcnJheWAsIHNvIHRoZSByZXR1cm5lZCBpbnN0YW5jZXMgd2lsbCBoYXZlIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBtZXRob2RzXG4gKiBhbmQgdGhlIGBVaW50OEFycmF5YCBtZXRob2RzLiBTcXVhcmUgYnJhY2tldCBub3RhdGlvbiB3b3JrcyBhcyBleHBlY3RlZCAtLSBpdFxuICogcmV0dXJucyBhIHNpbmdsZSBvY3RldC5cbiAqXG4gKiBUaGUgYFVpbnQ4QXJyYXlgIHByb3RvdHlwZSByZW1haW5zIHVubW9kaWZpZWQuXG4gKi9cblxuZnVuY3Rpb24gQnVmZmVyIChhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmICEodGhpcyBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcihhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIC8vIENvbW1vbiBjYXNlLlxuICBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHtcbiAgICBpZiAodHlwZW9mIGVuY29kaW5nT3JPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdJZiBlbmNvZGluZyBpcyBzcGVjaWZpZWQgdGhlbiB0aGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBhIHN0cmluZydcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIGFsbG9jVW5zYWZlKHRoaXMsIGFyZylcbiAgfVxuICByZXR1cm4gZnJvbSh0aGlzLCBhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbn1cblxuQnVmZmVyLnBvb2xTaXplID0gODE5MiAvLyBub3QgdXNlZCBieSB0aGlzIGltcGxlbWVudGF0aW9uXG5cbi8vIFRPRE86IExlZ2FjeSwgbm90IG5lZWRlZCBhbnltb3JlLiBSZW1vdmUgaW4gbmV4dCBtYWpvciB2ZXJzaW9uLlxuQnVmZmVyLl9hdWdtZW50ID0gZnVuY3Rpb24gKGFycikge1xuICBhcnIuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gYXJyXG59XG5cbmZ1bmN0aW9uIGZyb20gKHRoYXQsIHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcInZhbHVlXCIgYXJndW1lbnQgbXVzdCBub3QgYmUgYSBudW1iZXInKVxuICB9XG5cbiAgaWYgKHR5cGVvZiBBcnJheUJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcgJiYgdmFsdWUgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgIHJldHVybiBmcm9tQXJyYXlCdWZmZXIodGhhdCwgdmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGZyb21TdHJpbmcodGhhdCwgdmFsdWUsIGVuY29kaW5nT3JPZmZzZXQpXG4gIH1cblxuICByZXR1cm4gZnJvbU9iamVjdCh0aGF0LCB2YWx1ZSlcbn1cblxuLyoqXG4gKiBGdW5jdGlvbmFsbHkgZXF1aXZhbGVudCB0byBCdWZmZXIoYXJnLCBlbmNvZGluZykgYnV0IHRocm93cyBhIFR5cGVFcnJvclxuICogaWYgdmFsdWUgaXMgYSBudW1iZXIuXG4gKiBCdWZmZXIuZnJvbShzdHJbLCBlbmNvZGluZ10pXG4gKiBCdWZmZXIuZnJvbShhcnJheSlcbiAqIEJ1ZmZlci5mcm9tKGJ1ZmZlcilcbiAqIEJ1ZmZlci5mcm9tKGFycmF5QnVmZmVyWywgYnl0ZU9mZnNldFssIGxlbmd0aF1dKVxuICoqL1xuQnVmZmVyLmZyb20gPSBmdW5jdGlvbiAodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gZnJvbShudWxsLCB2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxufVxuXG5pZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgQnVmZmVyLnByb3RvdHlwZS5fX3Byb3RvX18gPSBVaW50OEFycmF5LnByb3RvdHlwZVxuICBCdWZmZXIuX19wcm90b19fID0gVWludDhBcnJheVxuICBpZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnNwZWNpZXMgJiZcbiAgICAgIEJ1ZmZlcltTeW1ib2wuc3BlY2llc10gPT09IEJ1ZmZlcikge1xuICAgIC8vIEZpeCBzdWJhcnJheSgpIGluIEVTMjAxNi4gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzk3XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlciwgU3ltYm9sLnNwZWNpZXMsIHtcbiAgICAgIHZhbHVlOiBudWxsLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSlcbiAgfVxufVxuXG5mdW5jdGlvbiBhc3NlcnRTaXplIChzaXplKSB7XG4gIGlmICh0eXBlb2Ygc2l6ZSAhPT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcInNpemVcIiBhcmd1bWVudCBtdXN0IGJlIGEgbnVtYmVyJylcbiAgfSBlbHNlIGlmIChzaXplIDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcInNpemVcIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBuZWdhdGl2ZScpXG4gIH1cbn1cblxuZnVuY3Rpb24gYWxsb2MgKHRoYXQsIHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgaWYgKHNpemUgPD0gMCkge1xuICAgIHJldHVybiBjcmVhdGVCdWZmZXIodGhhdCwgc2l6ZSlcbiAgfVxuICBpZiAoZmlsbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gT25seSBwYXkgYXR0ZW50aW9uIHRvIGVuY29kaW5nIGlmIGl0J3MgYSBzdHJpbmcuIFRoaXNcbiAgICAvLyBwcmV2ZW50cyBhY2NpZGVudGFsbHkgc2VuZGluZyBpbiBhIG51bWJlciB0aGF0IHdvdWxkXG4gICAgLy8gYmUgaW50ZXJwcmV0dGVkIGFzIGEgc3RhcnQgb2Zmc2V0LlxuICAgIHJldHVybiB0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnXG4gICAgICA/IGNyZWF0ZUJ1ZmZlcih0aGF0LCBzaXplKS5maWxsKGZpbGwsIGVuY29kaW5nKVxuICAgICAgOiBjcmVhdGVCdWZmZXIodGhhdCwgc2l6ZSkuZmlsbChmaWxsKVxuICB9XG4gIHJldHVybiBjcmVhdGVCdWZmZXIodGhhdCwgc2l6ZSlcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiBhbGxvYyhzaXplWywgZmlsbFssIGVuY29kaW5nXV0pXG4gKiovXG5CdWZmZXIuYWxsb2MgPSBmdW5jdGlvbiAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGFsbG9jKG51bGwsIHNpemUsIGZpbGwsIGVuY29kaW5nKVxufVxuXG5mdW5jdGlvbiBhbGxvY1Vuc2FmZSAodGhhdCwgc2l6ZSkge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIHRoYXQgPSBjcmVhdGVCdWZmZXIodGhhdCwgc2l6ZSA8IDAgPyAwIDogY2hlY2tlZChzaXplKSB8IDApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNpemU7ICsraSkge1xuICAgICAgdGhhdFtpXSA9IDBcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIEJ1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZSA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShudWxsLCBzaXplKVxufVxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIFNsb3dCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlU2xvdyA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShudWxsLCBzaXplKVxufVxuXG5mdW5jdGlvbiBmcm9tU3RyaW5nICh0aGF0LCBzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnIHx8IGVuY29kaW5nID09PSAnJykge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gIH1cblxuICBpZiAoIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiZW5jb2RpbmdcIiBtdXN0IGJlIGEgdmFsaWQgc3RyaW5nIGVuY29kaW5nJylcbiAgfVxuXG4gIHZhciBsZW5ndGggPSBieXRlTGVuZ3RoKHN0cmluZywgZW5jb2RpbmcpIHwgMFxuICB0aGF0ID0gY3JlYXRlQnVmZmVyKHRoYXQsIGxlbmd0aClcblxuICB2YXIgYWN0dWFsID0gdGhhdC53cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuXG4gIGlmIChhY3R1YWwgIT09IGxlbmd0aCkge1xuICAgIC8vIFdyaXRpbmcgYSBoZXggc3RyaW5nLCBmb3IgZXhhbXBsZSwgdGhhdCBjb250YWlucyBpbnZhbGlkIGNoYXJhY3RlcnMgd2lsbFxuICAgIC8vIGNhdXNlIGV2ZXJ5dGhpbmcgYWZ0ZXIgdGhlIGZpcnN0IGludmFsaWQgY2hhcmFjdGVyIHRvIGJlIGlnbm9yZWQuIChlLmcuXG4gICAgLy8gJ2FieHhjZCcgd2lsbCBiZSB0cmVhdGVkIGFzICdhYicpXG4gICAgdGhhdCA9IHRoYXQuc2xpY2UoMCwgYWN0dWFsKVxuICB9XG5cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5TGlrZSAodGhhdCwgYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCA8IDAgPyAwIDogY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB0aGF0ID0gY3JlYXRlQnVmZmVyKHRoYXQsIGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUJ1ZmZlciAodGhhdCwgYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aCkge1xuICBhcnJheS5ieXRlTGVuZ3RoIC8vIHRoaXMgdGhyb3dzIGlmIGBhcnJheWAgaXMgbm90IGEgdmFsaWQgQXJyYXlCdWZmZXJcblxuICBpZiAoYnl0ZU9mZnNldCA8IDAgfHwgYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXFwnb2Zmc2V0XFwnIGlzIG91dCBvZiBib3VuZHMnKVxuICB9XG5cbiAgaWYgKGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0ICsgKGxlbmd0aCB8fCAwKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcXCdsZW5ndGhcXCcgaXMgb3V0IG9mIGJvdW5kcycpXG4gIH1cblxuICBpZiAoYnl0ZU9mZnNldCA9PT0gdW5kZWZpbmVkICYmIGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYXJyYXkgPSBuZXcgVWludDhBcnJheShhcnJheSlcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQpXG4gIH0gZWxzZSB7XG4gICAgYXJyYXkgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2UsIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgdGhhdCA9IGFycmF5XG4gICAgdGhhdC5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBhbiBvYmplY3QgaW5zdGFuY2Ugb2YgdGhlIEJ1ZmZlciBjbGFzc1xuICAgIHRoYXQgPSBmcm9tQXJyYXlMaWtlKHRoYXQsIGFycmF5KVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKHRoYXQsIG9iaikge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iaikpIHtcbiAgICB2YXIgbGVuID0gY2hlY2tlZChvYmoubGVuZ3RoKSB8IDBcbiAgICB0aGF0ID0gY3JlYXRlQnVmZmVyKHRoYXQsIGxlbilcblxuICAgIGlmICh0aGF0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRoYXRcbiAgICB9XG5cbiAgICBvYmouY29weSh0aGF0LCAwLCAwLCBsZW4pXG4gICAgcmV0dXJuIHRoYXRcbiAgfVxuXG4gIGlmIChvYmopIHtcbiAgICBpZiAoKHR5cGVvZiBBcnJheUJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgb2JqLmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB8fCAnbGVuZ3RoJyBpbiBvYmopIHtcbiAgICAgIGlmICh0eXBlb2Ygb2JqLmxlbmd0aCAhPT0gJ251bWJlcicgfHwgaXNuYW4ob2JqLmxlbmd0aCkpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcih0aGF0LCAwKVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZyb21BcnJheUxpa2UodGhhdCwgb2JqKVxuICAgIH1cblxuICAgIGlmIChvYmoudHlwZSA9PT0gJ0J1ZmZlcicgJiYgaXNBcnJheShvYmouZGF0YSkpIHtcbiAgICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKHRoYXQsIG9iai5kYXRhKVxuICAgIH1cbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50IG11c3QgYmUgYSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCBvciBhcnJheS1saWtlIG9iamVjdC4nKVxufVxuXG5mdW5jdGlvbiBjaGVja2VkIChsZW5ndGgpIHtcbiAgLy8gTm90ZTogY2Fubm90IHVzZSBgbGVuZ3RoIDwga01heExlbmd0aCgpYCBoZXJlIGJlY2F1c2UgdGhhdCBmYWlscyB3aGVuXG4gIC8vIGxlbmd0aCBpcyBOYU4gKHdoaWNoIGlzIG90aGVyd2lzZSBjb2VyY2VkIHRvIHplcm8uKVxuICBpZiAobGVuZ3RoID49IGtNYXhMZW5ndGgoKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIGFsbG9jYXRlIEJ1ZmZlciBsYXJnZXIgdGhhbiBtYXhpbXVtICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICdzaXplOiAweCcgKyBrTWF4TGVuZ3RoKCkudG9TdHJpbmcoMTYpICsgJyBieXRlcycpXG4gIH1cbiAgcmV0dXJuIGxlbmd0aCB8IDBcbn1cblxuZnVuY3Rpb24gU2xvd0J1ZmZlciAobGVuZ3RoKSB7XG4gIGlmICgrbGVuZ3RoICE9IGxlbmd0aCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcVxuICAgIGxlbmd0aCA9IDBcbiAgfVxuICByZXR1cm4gQnVmZmVyLmFsbG9jKCtsZW5ndGgpXG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIGlzQnVmZmVyIChiKSB7XG4gIHJldHVybiAhIShiICE9IG51bGwgJiYgYi5faXNCdWZmZXIpXG59XG5cbkJ1ZmZlci5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYSwgYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhKSB8fCAhQnVmZmVyLmlzQnVmZmVyKGIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIG11c3QgYmUgQnVmZmVycycpXG4gIH1cblxuICBpZiAoYSA9PT0gYikgcmV0dXJuIDBcblxuICB2YXIgeCA9IGEubGVuZ3RoXG4gIHZhciB5ID0gYi5sZW5ndGhcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gTWF0aC5taW4oeCwgeSk7IGkgPCBsZW47ICsraSkge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICB4ID0gYVtpXVxuICAgICAgeSA9IGJbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIGlzRW5jb2RpbmcgKGVuY29kaW5nKSB7XG4gIHN3aXRjaCAoU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5CdWZmZXIuY29uY2F0ID0gZnVuY3Rpb24gY29uY2F0IChsaXN0LCBsZW5ndGgpIHtcbiAgaWYgKCFpc0FycmF5KGxpc3QpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgfVxuXG4gIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBCdWZmZXIuYWxsb2MoMClcbiAgfVxuXG4gIHZhciBpXG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGxlbmd0aCA9IDBcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7ICsraSkge1xuICAgICAgbGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZmZlciA9IEJ1ZmZlci5hbGxvY1Vuc2FmZShsZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGJ1ZiA9IGxpc3RbaV1cbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICAgIH1cbiAgICBidWYuY29weShidWZmZXIsIHBvcylcbiAgICBwb3MgKz0gYnVmLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZmZXJcbn1cblxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHN0cmluZykpIHtcbiAgICByZXR1cm4gc3RyaW5nLmxlbmd0aFxuICB9XG4gIGlmICh0eXBlb2YgQXJyYXlCdWZmZXIgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBBcnJheUJ1ZmZlci5pc1ZpZXcgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgIChBcnJheUJ1ZmZlci5pc1ZpZXcoc3RyaW5nKSB8fCBzdHJpbmcgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikpIHtcbiAgICByZXR1cm4gc3RyaW5nLmJ5dGVMZW5ndGhcbiAgfVxuICBpZiAodHlwZW9mIHN0cmluZyAhPT0gJ3N0cmluZycpIHtcbiAgICBzdHJpbmcgPSAnJyArIHN0cmluZ1xuICB9XG5cbiAgdmFyIGxlbiA9IHN0cmluZy5sZW5ndGhcbiAgaWYgKGxlbiA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBVc2UgYSBmb3IgbG9vcCB0byBhdm9pZCByZWN1cnNpb25cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGVuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuXG5mdW5jdGlvbiBzbG93VG9TdHJpbmcgKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG5cbiAgLy8gTm8gbmVlZCB0byB2ZXJpZnkgdGhhdCBcInRoaXMubGVuZ3RoIDw9IE1BWF9VSU5UMzJcIiBzaW5jZSBpdCdzIGEgcmVhZC1vbmx5XG4gIC8vIHByb3BlcnR5IG9mIGEgdHlwZWQgYXJyYXkuXG5cbiAgLy8gVGhpcyBiZWhhdmVzIG5laXRoZXIgbGlrZSBTdHJpbmcgbm9yIFVpbnQ4QXJyYXkgaW4gdGhhdCB3ZSBzZXQgc3RhcnQvZW5kXG4gIC8vIHRvIHRoZWlyIHVwcGVyL2xvd2VyIGJvdW5kcyBpZiB0aGUgdmFsdWUgcGFzc2VkIGlzIG91dCBvZiByYW5nZS5cbiAgLy8gdW5kZWZpbmVkIGlzIGhhbmRsZWQgc3BlY2lhbGx5IGFzIHBlciBFQ01BLTI2MiA2dGggRWRpdGlvbixcbiAgLy8gU2VjdGlvbiAxMy4zLjMuNyBSdW50aW1lIFNlbWFudGljczogS2V5ZWRCaW5kaW5nSW5pdGlhbGl6YXRpb24uXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkIHx8IHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIC8vIFJldHVybiBlYXJseSBpZiBzdGFydCA+IHRoaXMubGVuZ3RoLiBEb25lIGhlcmUgdG8gcHJldmVudCBwb3RlbnRpYWwgdWludDMyXG4gIC8vIGNvZXJjaW9uIGZhaWwgYmVsb3cuXG4gIGlmIChzdGFydCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBpZiAoZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKGVuZCA8PSAwKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICAvLyBGb3JjZSBjb2Vyc2lvbiB0byB1aW50MzIuIFRoaXMgd2lsbCBhbHNvIGNvZXJjZSBmYWxzZXkvTmFOIHZhbHVlcyB0byAwLlxuICBlbmQgPj4+PSAwXG4gIHN0YXJ0ID4+Pj0gMFxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxhdGluMVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdXRmMTZsZVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9IChlbmNvZGluZyArICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG4vLyBUaGUgcHJvcGVydHkgaXMgdXNlZCBieSBgQnVmZmVyLmlzQnVmZmVyYCBhbmQgYGlzLWJ1ZmZlcmAgKGluIFNhZmFyaSA1LTcpIHRvIGRldGVjdFxuLy8gQnVmZmVyIGluc3RhbmNlcy5cbkJ1ZmZlci5wcm90b3R5cGUuX2lzQnVmZmVyID0gdHJ1ZVxuXG5mdW5jdGlvbiBzd2FwIChiLCBuLCBtKSB7XG4gIHZhciBpID0gYltuXVxuICBiW25dID0gYlttXVxuICBiW21dID0gaVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAxNiA9IGZ1bmN0aW9uIHN3YXAxNiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgMiAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMTYtYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gMikge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDEpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwMzIgPSBmdW5jdGlvbiBzd2FwMzIgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDQgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDMyLWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyAzKVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyAyKVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDY0ID0gZnVuY3Rpb24gc3dhcDY0ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSA4ICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA2NC1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSA4KSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgNylcbiAgICBzd2FwKHRoaXMsIGkgKyAxLCBpICsgNilcbiAgICBzd2FwKHRoaXMsIGkgKyAyLCBpICsgNSlcbiAgICBzd2FwKHRoaXMsIGkgKyAzLCBpICsgNClcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGggfCAwXG4gIGlmIChsZW5ndGggPT09IDApIHJldHVybiAnJ1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCAwLCBsZW5ndGgpXG4gIHJldHVybiBzbG93VG9TdHJpbmcuYXBwbHkodGhpcywgYXJndW1lbnRzKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIGVxdWFscyAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gaW5zcGVjdCAoKSB7XG4gIHZhciBzdHIgPSAnJ1xuICB2YXIgbWF4ID0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFU1xuICBpZiAodGhpcy5sZW5ndGggPiAwKSB7XG4gICAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5tYXRjaCgvLnsyfS9nKS5qb2luKCcgJylcbiAgICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIH1cbiAgcmV0dXJuICc8QnVmZmVyICcgKyBzdHIgKyAnPidcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAodGFyZ2V0LCBzdGFydCwgZW5kLCB0aGlzU3RhcnQsIHRoaXNFbmQpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGFyZ2V0KSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICB9XG5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICBzdGFydCA9IDBcbiAgfVxuICBpZiAoZW5kID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmQgPSB0YXJnZXQgPyB0YXJnZXQubGVuZ3RoIDogMFxuICB9XG4gIGlmICh0aGlzU3RhcnQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNTdGFydCA9IDBcbiAgfVxuICBpZiAodGhpc0VuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpc0VuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoc3RhcnQgPCAwIHx8IGVuZCA+IHRhcmdldC5sZW5ndGggfHwgdGhpc1N0YXJ0IDwgMCB8fCB0aGlzRW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmICh0aGlzU3RhcnQgPj0gdGhpc0VuZCAmJiBzdGFydCA+PSBlbmQpIHtcbiAgICByZXR1cm4gMFxuICB9XG4gIGlmICh0aGlzU3RhcnQgPj0gdGhpc0VuZCkge1xuICAgIHJldHVybiAtMVxuICB9XG4gIGlmIChzdGFydCA+PSBlbmQpIHtcbiAgICByZXR1cm4gMVxuICB9XG5cbiAgc3RhcnQgPj4+PSAwXG4gIGVuZCA+Pj49IDBcbiAgdGhpc1N0YXJ0ID4+Pj0gMFxuICB0aGlzRW5kID4+Pj0gMFxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQpIHJldHVybiAwXG5cbiAgdmFyIHggPSB0aGlzRW5kIC0gdGhpc1N0YXJ0XG4gIHZhciB5ID0gZW5kIC0gc3RhcnRcbiAgdmFyIGxlbiA9IE1hdGgubWluKHgsIHkpXG5cbiAgdmFyIHRoaXNDb3B5ID0gdGhpcy5zbGljZSh0aGlzU3RhcnQsIHRoaXNFbmQpXG4gIHZhciB0YXJnZXRDb3B5ID0gdGFyZ2V0LnNsaWNlKHN0YXJ0LCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgIGlmICh0aGlzQ29weVtpXSAhPT0gdGFyZ2V0Q29weVtpXSkge1xuICAgICAgeCA9IHRoaXNDb3B5W2ldXG4gICAgICB5ID0gdGFyZ2V0Q29weVtpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbi8vIEZpbmRzIGVpdGhlciB0aGUgZmlyc3QgaW5kZXggb2YgYHZhbGAgaW4gYGJ1ZmZlcmAgYXQgb2Zmc2V0ID49IGBieXRlT2Zmc2V0YCxcbi8vIE9SIHRoZSBsYXN0IGluZGV4IG9mIGB2YWxgIGluIGBidWZmZXJgIGF0IG9mZnNldCA8PSBgYnl0ZU9mZnNldGAuXG4vL1xuLy8gQXJndW1lbnRzOlxuLy8gLSBidWZmZXIgLSBhIEJ1ZmZlciB0byBzZWFyY2hcbi8vIC0gdmFsIC0gYSBzdHJpbmcsIEJ1ZmZlciwgb3IgbnVtYmVyXG4vLyAtIGJ5dGVPZmZzZXQgLSBhbiBpbmRleCBpbnRvIGBidWZmZXJgOyB3aWxsIGJlIGNsYW1wZWQgdG8gYW4gaW50MzJcbi8vIC0gZW5jb2RpbmcgLSBhbiBvcHRpb25hbCBlbmNvZGluZywgcmVsZXZhbnQgaXMgdmFsIGlzIGEgc3RyaW5nXG4vLyAtIGRpciAtIHRydWUgZm9yIGluZGV4T2YsIGZhbHNlIGZvciBsYXN0SW5kZXhPZlxuZnVuY3Rpb24gYmlkaXJlY3Rpb25hbEluZGV4T2YgKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKSB7XG4gIC8vIEVtcHR5IGJ1ZmZlciBtZWFucyBubyBtYXRjaFxuICBpZiAoYnVmZmVyLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xXG5cbiAgLy8gTm9ybWFsaXplIGJ5dGVPZmZzZXRcbiAgaWYgKHR5cGVvZiBieXRlT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gYnl0ZU9mZnNldFxuICAgIGJ5dGVPZmZzZXQgPSAwXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA+IDB4N2ZmZmZmZmYpIHtcbiAgICBieXRlT2Zmc2V0ID0gMHg3ZmZmZmZmZlxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAtMHg4MDAwMDAwMCkge1xuICAgIGJ5dGVPZmZzZXQgPSAtMHg4MDAwMDAwMFxuICB9XG4gIGJ5dGVPZmZzZXQgPSArYnl0ZU9mZnNldCAgLy8gQ29lcmNlIHRvIE51bWJlci5cbiAgaWYgKGlzTmFOKGJ5dGVPZmZzZXQpKSB7XG4gICAgLy8gYnl0ZU9mZnNldDogaXQgaXQncyB1bmRlZmluZWQsIG51bGwsIE5hTiwgXCJmb29cIiwgZXRjLCBzZWFyY2ggd2hvbGUgYnVmZmVyXG4gICAgYnl0ZU9mZnNldCA9IGRpciA/IDAgOiAoYnVmZmVyLmxlbmd0aCAtIDEpXG4gIH1cblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldDogbmVnYXRpdmUgb2Zmc2V0cyBzdGFydCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICBpZiAoYnl0ZU9mZnNldCA8IDApIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoICsgYnl0ZU9mZnNldFxuICBpZiAoYnl0ZU9mZnNldCA+PSBidWZmZXIubGVuZ3RoKSB7XG4gICAgaWYgKGRpcikgcmV0dXJuIC0xXG4gICAgZWxzZSBieXRlT2Zmc2V0ID0gYnVmZmVyLmxlbmd0aCAtIDFcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgMCkge1xuICAgIGlmIChkaXIpIGJ5dGVPZmZzZXQgPSAwXG4gICAgZWxzZSByZXR1cm4gLTFcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSB2YWxcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsID0gQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgfVxuXG4gIC8vIEZpbmFsbHksIHNlYXJjaCBlaXRoZXIgaW5kZXhPZiAoaWYgZGlyIGlzIHRydWUpIG9yIGxhc3RJbmRleE9mXG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsKSkge1xuICAgIC8vIFNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nL2J1ZmZlciBhbHdheXMgZmFpbHNcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpXG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAweEZGIC8vIFNlYXJjaCBmb3IgYSBieXRlIHZhbHVlIFswLTI1NV1cbiAgICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgJiZcbiAgICAgICAgdHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGlmIChkaXIpIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKGJ1ZmZlciwgWyB2YWwgXSwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbCBtdXN0IGJlIHN0cmluZywgbnVtYmVyIG9yIEJ1ZmZlcicpXG59XG5cbmZ1bmN0aW9uIGFycmF5SW5kZXhPZiAoYXJyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgdmFyIGluZGV4U2l6ZSA9IDFcbiAgdmFyIGFyckxlbmd0aCA9IGFyci5sZW5ndGhcbiAgdmFyIHZhbExlbmd0aCA9IHZhbC5sZW5ndGhcblxuICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgaWYgKGVuY29kaW5nID09PSAndWNzMicgfHwgZW5jb2RpbmcgPT09ICd1Y3MtMicgfHxcbiAgICAgICAgZW5jb2RpbmcgPT09ICd1dGYxNmxlJyB8fCBlbmNvZGluZyA9PT0gJ3V0Zi0xNmxlJykge1xuICAgICAgaWYgKGFyci5sZW5ndGggPCAyIHx8IHZhbC5sZW5ndGggPCAyKSB7XG4gICAgICAgIHJldHVybiAtMVxuICAgICAgfVxuICAgICAgaW5kZXhTaXplID0gMlxuICAgICAgYXJyTGVuZ3RoIC89IDJcbiAgICAgIHZhbExlbmd0aCAvPSAyXG4gICAgICBieXRlT2Zmc2V0IC89IDJcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFkIChidWYsIGkpIHtcbiAgICBpZiAoaW5kZXhTaXplID09PSAxKSB7XG4gICAgICByZXR1cm4gYnVmW2ldXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBidWYucmVhZFVJbnQxNkJFKGkgKiBpbmRleFNpemUpXG4gICAgfVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGRpcikge1xuICAgIHZhciBmb3VuZEluZGV4ID0gLTFcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpIDwgYXJyTGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChyZWFkKGFyciwgaSkgPT09IHJlYWQodmFsLCBmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleCkpIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSBmb3VuZEluZGV4ID0gaVxuICAgICAgICBpZiAoaSAtIGZvdW5kSW5kZXggKyAxID09PSB2YWxMZW5ndGgpIHJldHVybiBmb3VuZEluZGV4ICogaW5kZXhTaXplXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZm91bmRJbmRleCAhPT0gLTEpIGkgLT0gaSAtIGZvdW5kSW5kZXhcbiAgICAgICAgZm91bmRJbmRleCA9IC0xXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChieXRlT2Zmc2V0ICsgdmFsTGVuZ3RoID4gYXJyTGVuZ3RoKSBieXRlT2Zmc2V0ID0gYXJyTGVuZ3RoIC0gdmFsTGVuZ3RoXG4gICAgZm9yIChpID0gYnl0ZU9mZnNldDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHZhciBmb3VuZCA9IHRydWVcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsTGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKHJlYWQoYXJyLCBpICsgaikgIT09IHJlYWQodmFsLCBqKSkge1xuICAgICAgICAgIGZvdW5kID0gZmFsc2VcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoZm91bmQpIHJldHVybiBpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5jbHVkZXMgPSBmdW5jdGlvbiBpbmNsdWRlcyAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gdGhpcy5pbmRleE9mKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpICE9PSAtMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiBpbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiBiaWRpcmVjdGlvbmFsSW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCB0cnVlKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmxhc3RJbmRleE9mID0gZnVuY3Rpb24gbGFzdEluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGZhbHNlKVxufVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIC8vIG11c3QgYmUgYW4gZXZlbiBudW1iZXIgb2YgZGlnaXRzXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGlmIChzdHJMZW4gJSAyICE9PSAwKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGhleCBzdHJpbmcnKVxuXG4gIGlmIChsZW5ndGggPiBzdHJMZW4gLyAyKSB7XG4gICAgbGVuZ3RoID0gc3RyTGVuIC8gMlxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgcGFyc2VkID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGlmIChpc05hTihwYXJzZWQpKSByZXR1cm4gaVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IHBhcnNlZFxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIHV0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjhUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGFzY2lpV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gbGF0aW4xV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJhc2U2NFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiB1Y3MyV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gd3JpdGUgKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcpXG4gIGlmIChvZmZzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgb2Zmc2V0WywgbGVuZ3RoXVssIGVuY29kaW5nXSlcbiAgfSBlbHNlIGlmIChpc0Zpbml0ZShvZmZzZXQpKSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICAgIGlmIChpc0Zpbml0ZShsZW5ndGgpKSB7XG4gICAgICBsZW5ndGggPSBsZW5ndGggfCAwXG4gICAgICBpZiAoZW5jb2RpbmcgPT09IHVuZGVmaW5lZCkgZW5jb2RpbmcgPSAndXRmOCdcbiAgICB9IGVsc2Uge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgLy8gbGVnYWN5IHdyaXRlKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldCwgbGVuZ3RoKSAtIHJlbW92ZSBpbiB2MC4xM1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdCdWZmZXIud3JpdGUoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0WywgbGVuZ3RoXSkgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCdcbiAgICApXG4gIH1cblxuICB2YXIgcmVtYWluaW5nID0gdGhpcy5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA+IHJlbWFpbmluZykgbGVuZ3RoID0gcmVtYWluaW5nXG5cbiAgaWYgKChzdHJpbmcubGVuZ3RoID4gMCAmJiAobGVuZ3RoIDwgMCB8fCBvZmZzZXQgPCAwKSkgfHwgb2Zmc2V0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byB3cml0ZSBvdXRzaWRlIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsYXRpbjFXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICAvLyBXYXJuaW5nOiBtYXhMZW5ndGggbm90IHRha2VuIGludG8gYWNjb3VudCBpbiBiYXNlNjRXcml0ZVxuICAgICAgICByZXR1cm4gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHVjczJXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG4gIHZhciByZXMgPSBbXVxuXG4gIHZhciBpID0gc3RhcnRcbiAgd2hpbGUgKGkgPCBlbmQpIHtcbiAgICB2YXIgZmlyc3RCeXRlID0gYnVmW2ldXG4gICAgdmFyIGNvZGVQb2ludCA9IG51bGxcbiAgICB2YXIgYnl0ZXNQZXJTZXF1ZW5jZSA9IChmaXJzdEJ5dGUgPiAweEVGKSA/IDRcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4REYpID8gM1xuICAgICAgOiAoZmlyc3RCeXRlID4gMHhCRikgPyAyXG4gICAgICA6IDFcblxuICAgIGlmIChpICsgYnl0ZXNQZXJTZXF1ZW5jZSA8PSBlbmQpIHtcbiAgICAgIHZhciBzZWNvbmRCeXRlLCB0aGlyZEJ5dGUsIGZvdXJ0aEJ5dGUsIHRlbXBDb2RlUG9pbnRcblxuICAgICAgc3dpdGNoIChieXRlc1BlclNlcXVlbmNlKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBpZiAoZmlyc3RCeXRlIDwgMHg4MCkge1xuICAgICAgICAgICAgY29kZVBvaW50ID0gZmlyc3RCeXRlXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4MUYpIDw8IDB4NiB8IChzZWNvbmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3Rikge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweEMgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4NiB8ICh0aGlyZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGRiAmJiAodGVtcENvZGVQb2ludCA8IDB4RDgwMCB8fCB0ZW1wQ29kZVBvaW50ID4gMHhERkZGKSkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBmb3VydGhCeXRlID0gYnVmW2kgKyAzXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAoZm91cnRoQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHgxMiB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHhDIHwgKHRoaXJkQnl0ZSAmIDB4M0YpIDw8IDB4NiB8IChmb3VydGhCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHhGRkZGICYmIHRlbXBDb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb2RlUG9pbnQgPT09IG51bGwpIHtcbiAgICAgIC8vIHdlIGRpZCBub3QgZ2VuZXJhdGUgYSB2YWxpZCBjb2RlUG9pbnQgc28gaW5zZXJ0IGFcbiAgICAgIC8vIHJlcGxhY2VtZW50IGNoYXIgKFUrRkZGRCkgYW5kIGFkdmFuY2Ugb25seSAxIGJ5dGVcbiAgICAgIGNvZGVQb2ludCA9IDB4RkZGRFxuICAgICAgYnl0ZXNQZXJTZXF1ZW5jZSA9IDFcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA+IDB4RkZGRikge1xuICAgICAgLy8gZW5jb2RlIHRvIHV0ZjE2IChzdXJyb2dhdGUgcGFpciBkYW5jZSlcbiAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwXG4gICAgICByZXMucHVzaChjb2RlUG9pbnQgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApXG4gICAgICBjb2RlUG9pbnQgPSAweERDMDAgfCBjb2RlUG9pbnQgJiAweDNGRlxuICAgIH1cblxuICAgIHJlcy5wdXNoKGNvZGVQb2ludClcbiAgICBpICs9IGJ5dGVzUGVyU2VxdWVuY2VcbiAgfVxuXG4gIHJldHVybiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkocmVzKVxufVxuXG4vLyBCYXNlZCBvbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMjc0NzI3Mi82ODA3NDIsIHRoZSBicm93c2VyIHdpdGhcbi8vIHRoZSBsb3dlc3QgbGltaXQgaXMgQ2hyb21lLCB3aXRoIDB4MTAwMDAgYXJncy5cbi8vIFdlIGdvIDEgbWFnbml0dWRlIGxlc3MsIGZvciBzYWZldHlcbnZhciBNQVhfQVJHVU1FTlRTX0xFTkdUSCA9IDB4MTAwMFxuXG5mdW5jdGlvbiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkgKGNvZGVQb2ludHMpIHtcbiAgdmFyIGxlbiA9IGNvZGVQb2ludHMubGVuZ3RoXG4gIGlmIChsZW4gPD0gTUFYX0FSR1VNRU5UU19MRU5HVEgpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNvZGVQb2ludHMpIC8vIGF2b2lkIGV4dHJhIHNsaWNlKClcbiAgfVxuXG4gIC8vIERlY29kZSBpbiBjaHVua3MgdG8gYXZvaWQgXCJjYWxsIHN0YWNrIHNpemUgZXhjZWVkZWRcIi5cbiAgdmFyIHJlcyA9ICcnXG4gIHZhciBpID0gMFxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFxuICAgICAgU3RyaW5nLFxuICAgICAgY29kZVBvaW50cy5zbGljZShpLCBpICs9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKVxuICAgIClcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldICYgMHg3RilcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGxhdGluMVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGhleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyBieXRlc1tpICsgMV0gKiAyNTYpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZlxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBuZXdCdWYgPSB0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpXG4gICAgbmV3QnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2xpY2VMZW4gPSBlbmQgLSBzdGFydFxuICAgIG5ld0J1ZiA9IG5ldyBCdWZmZXIoc2xpY2VMZW4sIHVuZGVmaW5lZClcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWNlTGVuOyArK2kpIHtcbiAgICAgIG5ld0J1ZltpXSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZXdCdWZcbn1cblxuLypcbiAqIE5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgYnVmZmVyIGlzbid0IHRyeWluZyB0byB3cml0ZSBvdXQgb2YgYm91bmRzLlxuICovXG5mdW5jdGlvbiBjaGVja09mZnNldCAob2Zmc2V0LCBleHQsIGxlbmd0aCkge1xuICBpZiAoKG9mZnNldCAlIDEpICE9PSAwIHx8IG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVHJ5aW5nIHRvIGFjY2VzcyBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRMRSA9IGZ1bmN0aW9uIHJlYWRVSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRCRSA9IGZ1bmN0aW9uIHJlYWRVSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG4gIH1cblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiByZWFkVUludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiByZWFkVUludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICgodGhpc1tvZmZzZXRdKSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikpICtcbiAgICAgICh0aGlzW29mZnNldCArIDNdICogMHgxMDAwMDAwKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludExFID0gZnVuY3Rpb24gcmVhZEludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludEJFID0gZnVuY3Rpb24gcmVhZEludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoXG4gIHZhciBtdWwgPSAxXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0taV1cbiAgd2hpbGUgKGkgPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1pXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiByZWFkSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSkgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gcmVhZEludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIDFdIHwgKHRoaXNbb2Zmc2V0XSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiByZWFkSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDI0KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiByZWFkRmxvYXRMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0QkUgPSBmdW5jdGlvbiByZWFkRmxvYXRCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gcmVhZERvdWJsZUJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgNTIsIDgpXG59XG5cbmZ1bmN0aW9uIGNoZWNrSW50IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJidWZmZXJcIiBhcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyIGluc3RhbmNlJylcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJ2YWx1ZVwiIGFyZ3VtZW50IGlzIG91dCBvZiBib3VuZHMnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uIHdyaXRlVUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHhmZiwgMClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkgdmFsdWUgPSBNYXRoLmZsb29yKHZhbHVlKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5mdW5jdGlvbiBvYmplY3RXcml0ZVVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4pIHtcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmYgKyB2YWx1ZSArIDFcbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihidWYubGVuZ3RoIC0gb2Zmc2V0LCAyKTsgaSA8IGo7ICsraSkge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9ICh2YWx1ZSAmICgweGZmIDw8ICg4ICogKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkpKSkgPj4+XG4gICAgICAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSAqIDhcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5mdW5jdGlvbiBvYmplY3RXcml0ZVVJbnQzMiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4pIHtcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4oYnVmLmxlbmd0aCAtIG9mZnNldCwgNCk7IGkgPCBqOyArK2kpIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSAodmFsdWUgPj4+IChsaXR0bGVFbmRpYW4gPyBpIDogMyAtIGkpICogOCkgJiAweGZmXG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50TEUgPSBmdW5jdGlvbiB3cml0ZUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gMFxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgLSAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50QkUgPSBmdW5jdGlvbiB3cml0ZUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgKyAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweDdmLCAtMHg4MClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkgdmFsdWUgPSBNYXRoLmZsb29yKHZhbHVlKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuZnVuY3Rpb24gY2hlY2tJRUVFNzU0IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAob2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgNCwgMy40MDI4MjM0NjYzODUyODg2ZSszOCwgLTMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgMjMsIDQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdExFID0gZnVuY3Rpb24gd3JpdGVGbG9hdExFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0QkUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gd3JpdGVEb3VibGUgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgOCwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbiAgcmV0dXJuIG9mZnNldCArIDhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiBjb3B5ICh0YXJnZXQsIHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXRTdGFydCA+PSB0YXJnZXQubGVuZ3RoKSB0YXJnZXRTdGFydCA9IHRhcmdldC5sZW5ndGhcbiAgaWYgKCF0YXJnZXRTdGFydCkgdGFyZ2V0U3RhcnQgPSAwXG4gIGlmIChlbmQgPiAwICYmIGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuIDBcbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAwXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBpZiAodGFyZ2V0U3RhcnQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3RhcmdldFN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICB9XG4gIGlmIChzdGFydCA8IDAgfHwgc3RhcnQgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdzb3VyY2VTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgaWYgKGVuZCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0IDwgZW5kIC0gc3RhcnQpIHtcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgKyBzdGFydFxuICB9XG5cbiAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0XG4gIHZhciBpXG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCAmJiBzdGFydCA8IHRhcmdldFN0YXJ0ICYmIHRhcmdldFN0YXJ0IDwgZW5kKSB7XG4gICAgLy8gZGVzY2VuZGluZyBjb3B5IGZyb20gZW5kXG4gICAgZm9yIChpID0gbGVuIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0U3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2UgaWYgKGxlbiA8IDEwMDAgfHwgIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gYXNjZW5kaW5nIGNvcHkgZnJvbSBzdGFydFxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgVWludDhBcnJheS5wcm90b3R5cGUuc2V0LmNhbGwoXG4gICAgICB0YXJnZXQsXG4gICAgICB0aGlzLnN1YmFycmF5KHN0YXJ0LCBzdGFydCArIGxlbiksXG4gICAgICB0YXJnZXRTdGFydFxuICAgIClcbiAgfVxuXG4gIHJldHVybiBsZW5cbn1cblxuLy8gVXNhZ2U6XG4vLyAgICBidWZmZXIuZmlsbChudW1iZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKGJ1ZmZlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoc3RyaW5nWywgb2Zmc2V0WywgZW5kXV1bLCBlbmNvZGluZ10pXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiBmaWxsICh2YWwsIHN0YXJ0LCBlbmQsIGVuY29kaW5nKSB7XG4gIC8vIEhhbmRsZSBzdHJpbmcgY2FzZXM6XG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIGlmICh0eXBlb2Ygc3RhcnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IHN0YXJ0XG4gICAgICBzdGFydCA9IDBcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZW5kID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBlbmRcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfVxuICAgIGlmICh2YWwubGVuZ3RoID09PSAxKSB7XG4gICAgICB2YXIgY29kZSA9IHZhbC5jaGFyQ29kZUF0KDApXG4gICAgICBpZiAoY29kZSA8IDI1Nikge1xuICAgICAgICB2YWwgPSBjb2RlXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2VuY29kaW5nIG11c3QgYmUgYSBzdHJpbmcnKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJyAmJiAhQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgdmFsID0gdmFsICYgMjU1XG4gIH1cblxuICAvLyBJbnZhbGlkIHJhbmdlcyBhcmUgbm90IHNldCB0byBhIGRlZmF1bHQsIHNvIGNhbiByYW5nZSBjaGVjayBlYXJseS5cbiAgaWYgKHN0YXJ0IDwgMCB8fCB0aGlzLmxlbmd0aCA8IHN0YXJ0IHx8IHRoaXMubGVuZ3RoIDwgZW5kKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ091dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHN0YXJ0ID0gc3RhcnQgPj4+IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyB0aGlzLmxlbmd0aCA6IGVuZCA+Pj4gMFxuXG4gIGlmICghdmFsKSB2YWwgPSAwXG5cbiAgdmFyIGlcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgICAgdGhpc1tpXSA9IHZhbFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSBCdWZmZXIuaXNCdWZmZXIodmFsKVxuICAgICAgPyB2YWxcbiAgICAgIDogdXRmOFRvQnl0ZXMobmV3IEJ1ZmZlcih2YWwsIGVuY29kaW5nKS50b1N0cmluZygpKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBmb3IgKGkgPSAwOyBpIDwgZW5kIC0gc3RhcnQ7ICsraSkge1xuICAgICAgdGhpc1tpICsgc3RhcnRdID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXitcXC8wLTlBLVphLXotX10vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHJpbmd0cmltKHN0cikucmVwbGFjZShJTlZBTElEX0JBU0U2NF9SRSwgJycpXG4gIC8vIE5vZGUgY29udmVydHMgc3RyaW5ncyB3aXRoIGxlbmd0aCA8IDIgdG8gJydcbiAgaWYgKHN0ci5sZW5ndGggPCAyKSByZXR1cm4gJydcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gc3RyaW5ndHJpbSAoc3RyKSB7XG4gIGlmIChzdHIudHJpbSkgcmV0dXJuIHN0ci50cmltKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyaW5nLCB1bml0cykge1xuICB1bml0cyA9IHVuaXRzIHx8IEluZmluaXR5XG4gIHZhciBjb2RlUG9pbnRcbiAgdmFyIGxlbmd0aCA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIGxlYWRTdXJyb2dhdGUgPSBudWxsXG4gIHZhciBieXRlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpXG5cbiAgICAvLyBpcyBzdXJyb2dhdGUgY29tcG9uZW50XG4gICAgaWYgKGNvZGVQb2ludCA+IDB4RDdGRiAmJiBjb2RlUG9pbnQgPCAweEUwMDApIHtcbiAgICAgIC8vIGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoIWxlYWRTdXJyb2dhdGUpIHtcbiAgICAgICAgLy8gbm8gbGVhZCB5ZXRcbiAgICAgICAgaWYgKGNvZGVQb2ludCA+IDB4REJGRikge1xuICAgICAgICAgIC8vIHVuZXhwZWN0ZWQgdHJhaWxcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKGkgKyAxID09PSBsZW5ndGgpIHtcbiAgICAgICAgICAvLyB1bnBhaXJlZCBsZWFkXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbGlkIGxlYWRcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIDIgbGVhZHMgaW4gYSByb3dcbiAgICAgIGlmIChjb2RlUG9pbnQgPCAweERDMDApIHtcbiAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gdmFsaWQgc3Vycm9nYXRlIHBhaXJcbiAgICAgIGNvZGVQb2ludCA9IChsZWFkU3Vycm9nYXRlIC0gMHhEODAwIDw8IDEwIHwgY29kZVBvaW50IC0gMHhEQzAwKSArIDB4MTAwMDBcbiAgICB9IGVsc2UgaWYgKGxlYWRTdXJyb2dhdGUpIHtcbiAgICAgIC8vIHZhbGlkIGJtcCBjaGFyLCBidXQgbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgIH1cblxuICAgIGxlYWRTdXJyb2dhdGUgPSBudWxsXG5cbiAgICAvLyBlbmNvZGUgdXRmOFxuICAgIGlmIChjb2RlUG9pbnQgPCAweDgwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDEpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goY29kZVBvaW50KVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHg4MDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiB8IDB4QzAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDMpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgfCAweEUwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSA0KSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHgxMiB8IDB4RjAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludCcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7ICsraSkge1xuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVUb0J5dGVzIChzdHIsIHVuaXRzKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG5cbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBoaSA9IGMgPj4gOFxuICAgIGxvID0gYyAlIDI1NlxuICAgIGJ5dGVBcnJheS5wdXNoKGxvKVxuICAgIGJ5dGVBcnJheS5wdXNoKGhpKVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzIChzdHIpIHtcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShiYXNlNjRjbGVhbihzdHIpKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSkgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiBpc25hbiAodmFsKSB7XG4gIHJldHVybiB2YWwgIT09IHZhbCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZVxufVxuIiwiZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24gKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG1cbiAgdmFyIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBuQml0cyA9IC03XG4gIHZhciBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDBcbiAgdmFyIGQgPSBpc0xFID8gLTEgOiAxXG4gIHZhciBzID0gYnVmZmVyW29mZnNldCArIGldXG5cbiAgaSArPSBkXG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgcyA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gZUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gZSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIGUgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IG1MZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IG0gKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXNcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpXG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKVxuICAgIGUgPSBlIC0gZUJpYXNcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKVxufVxuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24gKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjXG4gIHZhciBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApXG4gIHZhciBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSlcbiAgdmFyIGQgPSBpc0xFID8gMSA6IC0xXG4gIHZhciBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwXG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSlcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMFxuICAgIGUgPSBlTWF4XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpXG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tXG4gICAgICBjICo9IDJcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpXG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrXG4gICAgICBjIC89IDJcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwXG4gICAgICBlID0gZU1heFxuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAodmFsdWUgKiBjIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IGUgKyBlQmlhc1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSAwXG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCkge31cblxuICBlID0gKGUgPDwgbUxlbikgfCBtXG4gIGVMZW4gKz0gbUxlblxuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpIHt9XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4XG59XG4iLCJ2YXIgdG9TdHJpbmcgPSB7fS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChhcnIpIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwoYXJyKSA9PSAnW29iamVjdCBBcnJheV0nO1xufTtcbiIsIid1c2Ugc3RyaWN0Jztcbi8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC12YXJzICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHByb3BJc0VudW1lcmFibGUgPSBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG5mdW5jdGlvbiB0b09iamVjdCh2YWwpIHtcblx0aWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ09iamVjdC5hc3NpZ24gY2Fubm90IGJlIGNhbGxlZCB3aXRoIG51bGwgb3IgdW5kZWZpbmVkJyk7XG5cdH1cblxuXHRyZXR1cm4gT2JqZWN0KHZhbCk7XG59XG5cbmZ1bmN0aW9uIHNob3VsZFVzZU5hdGl2ZSgpIHtcblx0dHJ5IHtcblx0XHRpZiAoIU9iamVjdC5hc3NpZ24pIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBEZXRlY3QgYnVnZ3kgcHJvcGVydHkgZW51bWVyYXRpb24gb3JkZXIgaW4gb2xkZXIgVjggdmVyc2lvbnMuXG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD00MTE4XG5cdFx0dmFyIHRlc3QxID0gbmV3IFN0cmluZygnYWJjJyk7ICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG5cdFx0dGVzdDFbNV0gPSAnZGUnO1xuXHRcdGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0ZXN0MSlbMF0gPT09ICc1Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTMwNTZcblx0XHR2YXIgdGVzdDIgPSB7fTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IDEwOyBpKyspIHtcblx0XHRcdHRlc3QyWydfJyArIFN0cmluZy5mcm9tQ2hhckNvZGUoaSldID0gaTtcblx0XHR9XG5cdFx0dmFyIG9yZGVyMiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRlc3QyKS5tYXAoZnVuY3Rpb24gKG4pIHtcblx0XHRcdHJldHVybiB0ZXN0MltuXTtcblx0XHR9KTtcblx0XHRpZiAob3JkZXIyLmpvaW4oJycpICE9PSAnMDEyMzQ1Njc4OScpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0zMDU2XG5cdFx0dmFyIHRlc3QzID0ge307XG5cdFx0J2FiY2RlZmdoaWprbG1ub3BxcnN0Jy5zcGxpdCgnJykuZm9yRWFjaChmdW5jdGlvbiAobGV0dGVyKSB7XG5cdFx0XHR0ZXN0M1tsZXR0ZXJdID0gbGV0dGVyO1xuXHRcdH0pO1xuXHRcdGlmIChPYmplY3Qua2V5cyhPYmplY3QuYXNzaWduKHt9LCB0ZXN0MykpLmpvaW4oJycpICE9PVxuXHRcdFx0XHQnYWJjZGVmZ2hpamtsbW5vcHFyc3QnKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHQvLyBXZSBkb24ndCBleHBlY3QgYW55IG9mIHRoZSBhYm92ZSB0byB0aHJvdywgYnV0IGJldHRlciB0byBiZSBzYWZlLlxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNob3VsZFVzZU5hdGl2ZSgpID8gT2JqZWN0LmFzc2lnbiA6IGZ1bmN0aW9uICh0YXJnZXQsIHNvdXJjZSkge1xuXHR2YXIgZnJvbTtcblx0dmFyIHRvID0gdG9PYmplY3QodGFyZ2V0KTtcblx0dmFyIHN5bWJvbHM7XG5cblx0Zm9yICh2YXIgcyA9IDE7IHMgPCBhcmd1bWVudHMubGVuZ3RoOyBzKyspIHtcblx0XHRmcm9tID0gT2JqZWN0KGFyZ3VtZW50c1tzXSk7XG5cblx0XHRmb3IgKHZhciBrZXkgaW4gZnJvbSkge1xuXHRcdFx0aWYgKGhhc093blByb3BlcnR5LmNhbGwoZnJvbSwga2V5KSkge1xuXHRcdFx0XHR0b1trZXldID0gZnJvbVtrZXldO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG5cdFx0XHRzeW1ib2xzID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhmcm9tKTtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgc3ltYm9scy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAocHJvcElzRW51bWVyYWJsZS5jYWxsKGZyb20sIHN5bWJvbHNbaV0pKSB7XG5cdFx0XHRcdFx0dG9bc3ltYm9sc1tpXV0gPSBmcm9tW3N5bWJvbHNbaV1dO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHRvO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzPXtcbiAgICBcInZlcnNpb25cIjogXCJ2MlwiXG59XG4iLCIvKipcbiAqIEVwaWNlbnRlciBKYXZhc2NyaXB0IGxpYnJhcmllc1xuICogdjwlPSB2ZXJzaW9uICU+XG4gKiBodHRwczovL2dpdGh1Yi5jb20vZm9yaW8vZXBpY2VudGVyLWpzLWxpYnNcbiAqL1xuXG52YXIgRiA9IHtcbiAgICB1dGlsOiB7fSxcbiAgICBmYWN0b3J5OiB7fSxcbiAgICB0cmFuc3BvcnQ6IHt9LFxuICAgIHN0b3JlOiB7fSxcbiAgICBzZXJ2aWNlOiB7fSxcbiAgICBtYW5hZ2VyOiB7XG4gICAgICAgIHN0cmF0ZWd5OiB7fVxuICAgIH0sXG5cbn07XG5cbkYubG9hZCA9IHJlcXVpcmUoJy4vZW52LWxvYWQnKTtcbkYubG9hZCgpO1xuXG5GLnV0aWwucXVlcnkgPSByZXF1aXJlKCcuL3V0aWwvcXVlcnktdXRpbCcpO1xuRi51dGlsLnJ1biA9IHJlcXVpcmUoJy4vdXRpbC9ydW4tdXRpbCcpO1xuRi51dGlsLmNsYXNzRnJvbSA9IHJlcXVpcmUoJy4vdXRpbC9pbmhlcml0Jyk7XG5cbkYuZmFjdG9yeS5UcmFuc3BvcnQgPSByZXF1aXJlKCcuL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG5GLnRyYW5zcG9ydC5BamF4ID0gcmVxdWlyZSgnLi90cmFuc3BvcnQvYWpheC1odHRwLXRyYW5zcG9ydCcpO1xuXG5GLnNlcnZpY2UuVVJMID0gcmVxdWlyZSgnLi9zZXJ2aWNlL3VybC1jb25maWctc2VydmljZScpO1xuRi5zZXJ2aWNlLkNvbmZpZyA9IHJlcXVpcmUoJy4vc2VydmljZS9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbkYuc2VydmljZS5SdW4gPSByZXF1aXJlKCcuL3NlcnZpY2UvcnVuLWFwaS1zZXJ2aWNlJyk7XG5GLnNlcnZpY2UuRmlsZSA9IHJlcXVpcmUoJy4vc2VydmljZS9hZG1pbi1maWxlLXNlcnZpY2UnKTtcbkYuc2VydmljZS5WYXJpYWJsZXMgPSByZXF1aXJlKCcuL3NlcnZpY2UvdmFyaWFibGVzLWFwaS1zZXJ2aWNlJyk7XG5GLnNlcnZpY2UuRGF0YSA9IHJlcXVpcmUoJy4vc2VydmljZS9kYXRhLWFwaS1zZXJ2aWNlJyk7XG5GLnNlcnZpY2UuQXV0aCA9IHJlcXVpcmUoJy4vc2VydmljZS9hdXRoLWFwaS1zZXJ2aWNlJyk7XG5GLnNlcnZpY2UuV29ybGQgPSByZXF1aXJlKCcuL3NlcnZpY2Uvd29ybGQtYXBpLWFkYXB0ZXInKTtcbkYuc2VydmljZS5TdGF0ZSA9IHJlcXVpcmUoJy4vc2VydmljZS9zdGF0ZS1hcGktYWRhcHRlcicpO1xuRi5zZXJ2aWNlLlVzZXIgPSByZXF1aXJlKCcuL3NlcnZpY2UvdXNlci1hcGktYWRhcHRlcicpO1xuRi5zZXJ2aWNlLk1lbWJlciA9IHJlcXVpcmUoJy4vc2VydmljZS9tZW1iZXItYXBpLWFkYXB0ZXInKTtcbkYuc2VydmljZS5Bc3NldCA9IHJlcXVpcmUoJy4vc2VydmljZS9hc3NldC1hcGktYWRhcHRlcicpO1xuRi5zZXJ2aWNlLkdyb3VwID0gcmVxdWlyZSgnLi9zZXJ2aWNlL2dyb3VwLWFwaS1zZXJ2aWNlJyk7XG5GLnNlcnZpY2UuSW50cm9zcGVjdCA9IHJlcXVpcmUoJy4vc2VydmljZS9pbnRyb3NwZWN0aW9uLWFwaS1zZXJ2aWNlJyk7XG5cbkYuc3RvcmUuQ29va2llID0gcmVxdWlyZSgnLi9zdG9yZS9jb29raWUtc3RvcmUnKTtcbkYuZmFjdG9yeS5TdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmUvc3RvcmUtZmFjdG9yeScpO1xuXG5GLm1hbmFnZXIuU2NlbmFyaW9NYW5hZ2VyID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9zY2VuYXJpby1tYW5hZ2VyJyk7XG5GLm1hbmFnZXIuUnVuTWFuYWdlciA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvcnVuLW1hbmFnZXInKTtcbkYubWFuYWdlci5BdXRoTWFuYWdlciA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvYXV0aC1tYW5hZ2VyJyk7XG5GLm1hbmFnZXIuV29ybGRNYW5hZ2VyID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy93b3JsZC1tYW5hZ2VyJyk7XG5cbkYubWFuYWdlci5zdHJhdGVneVsnYWx3YXlzLW5ldyddID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9hbHdheXMtbmV3LXN0cmF0ZWd5Jyk7XG5GLm1hbmFnZXIuc3RyYXRlZ3lbJ2NvbmRpdGlvbmFsLWNyZWF0aW9uJ10gPSByZXF1aXJlKCcuL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL2NvbmRpdGlvbmFsLWNyZWF0aW9uLXN0cmF0ZWd5Jyk7XG5GLm1hbmFnZXIuc3RyYXRlZ3kuaWRlbnRpdHkgPSByZXF1aXJlKCcuL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL2lkZW50aXR5LXN0cmF0ZWd5Jyk7XG5GLm1hbmFnZXIuc3RyYXRlZ3lbJ25ldy1pZi1taXNzaW5nJ10gPSByZXF1aXJlKCcuL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL25ldy1pZi1taXNzaW5nLXN0cmF0ZWd5Jyk7XG5GLm1hbmFnZXIuc3RyYXRlZ3lbJ25ldy1pZi1taXNzaW5nJ10gPSByZXF1aXJlKCcuL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL25ldy1pZi1taXNzaW5nLXN0cmF0ZWd5Jyk7XG5GLm1hbmFnZXIuc3RyYXRlZ3lbJ25ldy1pZi1wZXJzaXN0ZWQnXSA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvbmV3LWlmLXBlcnNpc3RlZC1zdHJhdGVneScpO1xuRi5tYW5hZ2VyLnN0cmF0ZWd5WyduZXctaWYtaW5pdGlhbGl6ZWQnXSA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvbmV3LWlmLWluaXRpYWxpemVkLXN0cmF0ZWd5Jyk7XG5cbkYubWFuYWdlci5DaGFubmVsTWFuYWdlciA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlcicpO1xuRi5zZXJ2aWNlLkNoYW5uZWwgPSByZXF1aXJlKCcuL3NlcnZpY2UvY2hhbm5lbC1zZXJ2aWNlJyk7XG5cbkYudmVyc2lvbiA9ICc8JT0gdmVyc2lvbiAlPic7XG5GLmFwaSA9IHJlcXVpcmUoJy4vYXBpLXZlcnNpb24uanNvbicpO1xuXG5nbG9iYWwuRiA9IEY7XG5tb2R1bGUuZXhwb3J0cyA9IEY7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1cmxDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9zZXJ2aWNlL3VybC1jb25maWctc2VydmljZScpO1xuXG52YXIgZW52TG9hZCA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIHZhciBlbnZQcm9taXNlO1xuICAgIHZhciBob3N0O1xuICAgIHZhciB1cmxTZXJ2aWNlID0gdXJsQ29uZmlnU2VydmljZSgpO1xuICAgIHZhciBlbnZQYXRoID0gJy9lcGljZW50ZXIvdjEvY29uZmlnJztcbiAgICBpZiAodXJsU2VydmljZS5pc0xvY2FsaG9zdCgpKSB7XG4gICAgICAgIGhvc3QgPSAnaHR0cHM6Ly9mb3Jpby5jb20nO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGhvc3QgPSAnJztcbiAgICB9XG4gICAgdmFyIGluZm9VcmwgPSBob3N0ICsgZW52UGF0aDtcbiAgICBlbnZQcm9taXNlID0gJC5hamF4KHsgdXJsOiBpbmZvVXJsLCBhc3luYzogZmFsc2UgfSk7XG4gICAgZW52UHJvbWlzZS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgdmFyIG92ZXJyaWRlcyA9IHJlcy5hcGk7XG4gICAgICAgIHVybENvbmZpZ1NlcnZpY2UuZGVmYXVsdHMgPSAkLmV4dGVuZCh1cmxDb25maWdTZXJ2aWNlLmRlZmF1bHRzLCBvdmVycmlkZXMpO1xuICAgIH0pLmZhaWwoZnVuY3Rpb24gKHJlcykge1xuICAgICAgICAvLyBFcGljZW50ZXIvd2Vic2VydmVyIG5vdCBwcm9wZXJseSBjb25maWd1cmVkXG4gICAgICAgIC8vIGZhbGxiYWNrIHRvIGFwaS5mb3Jpby5jb21cbiAgICAgICAgdXJsQ29uZmlnU2VydmljZS5kZWZhdWx0cyA9ICQuZXh0ZW5kKHVybENvbmZpZ1NlcnZpY2UuZGVmYXVsdHMsIHsgcHJvdG9jb2w6ICdodHRwcycsIGhvc3Q6ICdhcGkuZm9yaW8uY29tJyB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gZW52UHJvbWlzZS50aGVuKGNhbGxiYWNrKS5mYWlsKGNhbGxiYWNrKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZW52TG9hZDtcbiIsIi8qKlxuKiAjIyBBdXRob3JpemF0aW9uIE1hbmFnZXJcbipcbiogVGhlIEF1dGhvcml6YXRpb24gTWFuYWdlciBwcm92aWRlcyBhbiBlYXN5IHdheSB0byBtYW5hZ2UgdXNlciBhdXRoZW50aWNhdGlvbiAobG9nZ2luZyBpbiBhbmQgb3V0KSBhbmQgYXV0aG9yaXphdGlvbiAoa2VlcGluZyB0cmFjayBvZiB0b2tlbnMsIHNlc3Npb25zLCBhbmQgZ3JvdXBzKSBmb3IgcHJvamVjdHMuXG4qXG4qIFRoZSBBdXRob3JpemF0aW9uIE1hbmFnZXIgaXMgbW9zdCB1c2VmdWwgZm9yIFt0ZWFtIHByb2plY3RzXSguLi8uLi8uLi9nbG9zc2FyeS8jdGVhbSkgd2l0aCBhbiBhY2Nlc3MgbGV2ZWwgb2YgW0F1dGhlbnRpY2F0ZWRdKC4uLy4uLy4uL2dsb3NzYXJ5LyNhY2Nlc3MpLiBUaGVzZSBwcm9qZWN0cyBhcmUgYWNjZXNzZWQgYnkgW2VuZCB1c2Vyc10oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKSB3aG8gYXJlIG1lbWJlcnMgb2Ygb25lIG9yIG1vcmUgW2dyb3Vwc10oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3VwcykuXG4qXG4qICMjIyMgVXNpbmcgdGhlIEF1dGhvcml6YXRpb24gTWFuYWdlclxuKlxuKiBUbyB1c2UgdGhlIEF1dGhvcml6YXRpb24gTWFuYWdlciwgaW5zdGFudGlhdGUgaXQuIFRoZW4sIG1ha2UgY2FsbHMgdG8gYW55IG9mIHRoZSBtZXRob2RzIHlvdSBuZWVkOlxuKlxuKiAgICAgICB2YXIgYXV0aE1nciA9IG5ldyBGLm1hbmFnZXIuQXV0aE1hbmFnZXIoe1xuKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuKiAgICAgICAgICAgdXNlck5hbWU6ICdlbmR1c2VyMScsXG4qICAgICAgICAgICBwYXNzd29yZDogJ3Bhc3N3MHJkJ1xuKiAgICAgICB9KTtcbiogICAgICAgYXV0aE1nci5sb2dpbigpLnRoZW4oZnVuY3Rpb24gKCkge1xuKiAgICAgICAgICAgYXV0aE1nci5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4qICAgICAgIH0pO1xuKlxuKlxuKiBUaGUgYG9wdGlvbnNgIG9iamVjdCBwYXNzZWQgdG8gdGhlIGBGLm1hbmFnZXIuQXV0aE1hbmFnZXIoKWAgY2FsbCBjYW4gaW5jbHVkZTpcbipcbiogICAqIGBhY2NvdW50YDogVGhlIGFjY291bnQgaWQgZm9yIHRoaXMgYHVzZXJOYW1lYC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKSBvciB0aGUgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuXG4qICAgKiBgdXNlck5hbWVgOiBFbWFpbCBvciB1c2VybmFtZSB0byB1c2UgZm9yIGxvZ2dpbmcgaW4uXG4qICAgKiBgcGFzc3dvcmRgOiBQYXNzd29yZCBmb3Igc3BlY2lmaWVkIGB1c2VyTmFtZWAuXG4qICAgKiBgcHJvamVjdGA6IFRoZSAqKlByb2plY3QgSUQqKiBmb3IgdGhlIHByb2plY3QgdG8gbG9nIHRoaXMgdXNlciBpbnRvLiBPcHRpb25hbC5cbiogICAqIGBncm91cElkYDogSWQgb2YgdGhlIGdyb3VwIHRvIHdoaWNoIGB1c2VyTmFtZWAgYmVsb25ncy4gUmVxdWlyZWQgZm9yIGVuZCB1c2VycyBpZiB0aGUgYHByb2plY3RgIGlzIHNwZWNpZmllZC5cbipcbiogSWYgeW91IHByZWZlciBzdGFydGluZyBmcm9tIGEgdGVtcGxhdGUsIHRoZSBFcGljZW50ZXIgSlMgTGlicyBbTG9naW4gQ29tcG9uZW50XSguLi8uLi8jY29tcG9uZW50cykgdXNlcyB0aGUgQXV0aG9yaXphdGlvbiBNYW5hZ2VyIGFzIHdlbGwuIFRoaXMgc2FtcGxlIEhUTUwgcGFnZSAoYW5kIGFzc29jaWF0ZWQgQ1NTIGFuZCBKUyBmaWxlcykgcHJvdmlkZXMgYSBsb2dpbiBmb3JtIGZvciB0ZWFtIG1lbWJlcnMgYW5kIGVuZCB1c2VycyBvZiB5b3VyIHByb2plY3QuIEl0IGFsc28gaW5jbHVkZXMgYSBncm91cCBzZWxlY3RvciBmb3IgZW5kIHVzZXJzIHRoYXQgYXJlIG1lbWJlcnMgb2YgbXVsdGlwbGUgZ3JvdXBzLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xudmFyIEF1dGhBZGFwdGVyID0gcmVxdWlyZSgnLi4vc2VydmljZS9hdXRoLWFwaS1zZXJ2aWNlJyk7XG52YXIgTWVtYmVyQWRhcHRlciA9IHJlcXVpcmUoJy4uL3NlcnZpY2UvbWVtYmVyLWFwaS1hZGFwdGVyJyk7XG52YXIgR3JvdXBTZXJ2aWNlID0gcmVxdWlyZSgnLi4vc2VydmljZS9ncm91cC1hcGktc2VydmljZScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG52YXIgQnVmZmVyID0gcmVxdWlyZSgnYnVmZmVyJykuQnVmZmVyO1xudmFyIF9waWNrID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QtdXRpbCcpLl9waWNrO1xudmFyIG9iamVjdEFzc2lnbiA9IHJlcXVpcmUoJ29iamVjdC1hc3NpZ24nKTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHJlcXVpcmVzR3JvdXA6IHRydWVcbn07XG5cbmZ1bmN0aW9uIEF1dGhNYW5hZ2VyKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKG9wdGlvbnMpO1xuICAgIHRoaXMub3B0aW9ucyA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucygpO1xuXG4gICAgdGhpcy5hdXRoQWRhcHRlciA9IG5ldyBBdXRoQWRhcHRlcih0aGlzLm9wdGlvbnMpO1xufVxuXG52YXIgX2ZpbmRVc2VySW5Hcm91cCA9IGZ1bmN0aW9uIChtZW1iZXJzLCBpZCkge1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgbWVtYmVycy5sZW5ndGg7IGorKykge1xuICAgICAgICBpZiAobWVtYmVyc1tqXS51c2VySWQgPT09IGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gbWVtYmVyc1tqXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn07XG5cbkF1dGhNYW5hZ2VyLnByb3RvdHlwZSA9ICQuZXh0ZW5kKEF1dGhNYW5hZ2VyLnByb3RvdHlwZSwge1xuXG4gICAgLyoqXG4gICAgKiBMb2dzIHVzZXIgaW4uXG4gICAgKlxuICAgICogKipFeGFtcGxlKipcbiAgICAqXG4gICAgKiAgICAgICBhdXRoTWdyLmxvZ2luKHtcbiAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgKiAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAqICAgICAgICAgICB1c2VyTmFtZTogJ2VuZHVzZXIxJyxcbiAgICAqICAgICAgICAgICBwYXNzd29yZDogJ3Bhc3N3MHJkJ1xuICAgICogICAgICAgfSlcbiAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbihzdGF0dXNPYmopIHtcbiAgICAqICAgICAgICAgICAgICAgLy8gaWYgZW5kdXNlcjEgYmVsb25ncyB0byBleGFjdGx5IG9uZSBncm91cFxuICAgICogICAgICAgICAgICAgICAvLyAob3IgaWYgdGhlIGxvZ2luKCkgY2FsbCBpcyBtb2RpZmllZCB0byBpbmNsdWRlIHRoZSBncm91cCBpZClcbiAgICAqICAgICAgICAgICAgICAgLy8gY29udGludWUgaGVyZVxuICAgICogICAgICAgICAgIH0pXG4gICAgKiAgICAgICAgICAgLmZhaWwoZnVuY3Rpb24oc3RhdHVzT2JqKSB7XG4gICAgKiAgICAgICAgICAgICAgIC8vIGlmIGVuZHVzZXIxIGJlbG9uZ3MgdG8gbXVsdGlwbGUgZ3JvdXBzLFxuICAgICogICAgICAgICAgICAgICAvLyB0aGUgbG9naW4oKSBjYWxsIGZhaWxzXG4gICAgKiAgICAgICAgICAgICAgIC8vIGFuZCByZXR1cm5zIGFsbCBncm91cHMgb2Ygd2hpY2ggdGhlIHVzZXIgaXMgYSBtZW1iZXJcbiAgICAqICAgICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpIDwgc3RhdHVzT2JqLnVzZXJHcm91cHMubGVuZ3RoOyBpKyspIHtcbiAgICAqICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHN0YXR1c09iai51c2VyR3JvdXBzW2ldLm5hbWUsIHN0YXR1c09iai51c2VyR3JvdXBzW2ldLmdyb3VwSWQpO1xuICAgICogICAgICAgICAgICAgICB9XG4gICAgKiAgICAgICAgICAgfSk7XG4gICAgKlxuICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAqXG4gICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLiBJZiBub3QgcGFzc2VkIGluIHdoZW4gY3JlYXRpbmcgYW4gaW5zdGFuY2Ugb2YgdGhlIG1hbmFnZXIgKGBGLm1hbmFnZXIuQXV0aE1hbmFnZXIoKWApLCB0aGVzZSBvcHRpb25zIHNob3VsZCBpbmNsdWRlOlxuICAgICogQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuYWNjb3VudCBUaGUgYWNjb3VudCBpZCBmb3IgdGhpcyBgdXNlck5hbWVgLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpIG9yIHRoZSAqKlVzZXIgSUQqKiAoZm9yIHBlcnNvbmFsIHByb2plY3RzKS5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnVzZXJOYW1lIEVtYWlsIG9yIHVzZXJuYW1lIHRvIHVzZSBmb3IgbG9nZ2luZyBpbi5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnBhc3N3b3JkIFBhc3N3b3JkIGZvciBzcGVjaWZpZWQgYHVzZXJOYW1lYC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnByb2plY3QgKE9wdGlvbmFsKSBUaGUgKipQcm9qZWN0IElEKiogZm9yIHRoZSBwcm9qZWN0IHRvIGxvZyB0aGlzIHVzZXIgaW50by5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmdyb3VwSWQgVGhlIGlkIG9mIHRoZSBncm91cCB0byB3aGljaCBgdXNlck5hbWVgIGJlbG9uZ3MuIFJlcXVpcmVkIGZvciBbZW5kIHVzZXJzXSguLi8uLi8uLi9nbG9zc2FyeS8jdXNlcnMpIGlmIHRoZSBgcHJvamVjdGAgaXMgc3BlY2lmaWVkIGFuZCBpZiB0aGUgZW5kIHVzZXJzIGFyZSBtZW1iZXJzIG9mIG11bHRpcGxlIFtncm91cHNdKC4uLy4uLy4uL2dsb3NzYXJ5LyNncm91cHMpLCBvdGhlcndpc2Ugb3B0aW9uYWwuXG4gICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICovXG4gICAgbG9naW46IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgIHZhciAkZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgdmFyIHNlc3Npb25NYW5hZ2VyID0gdGhpcy5zZXNzaW9uTWFuYWdlcjtcbiAgICAgICAgdmFyIGFkYXB0ZXJPcHRpb25zID0gc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyh7IHN1Y2Nlc3M6ICQubm9vcCwgZXJyb3I6ICQubm9vcCB9LCBvcHRpb25zKTtcbiAgICAgICAgdmFyIG91dFN1Y2Nlc3MgPSBhZGFwdGVyT3B0aW9ucy5zdWNjZXNzO1xuICAgICAgICB2YXIgb3V0RXJyb3IgPSBhZGFwdGVyT3B0aW9ucy5lcnJvcjtcbiAgICAgICAgdmFyIGdyb3VwSWQgPSBhZGFwdGVyT3B0aW9ucy5ncm91cElkO1xuXG4gICAgICAgIHZhciBkZWNvZGVUb2tlbiA9IGZ1bmN0aW9uICh0b2tlbikge1xuICAgICAgICAgICAgdmFyIGVuY29kZWQgPSB0b2tlbi5zcGxpdCgnLicpWzFdO1xuICAgICAgICAgICAgd2hpbGUgKGVuY29kZWQubGVuZ3RoICUgNCAhPT0gMCkgeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgICAgICAgICBlbmNvZGVkICs9ICc9JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBkZWNvZGUgPSB3aW5kb3cuYXRvYiA/IHdpbmRvdy5hdG9iIDogZnVuY3Rpb24gKGVuY29kZWQpIHsgcmV0dXJuIG5ldyBCdWZmZXIoZW5jb2RlZCwgJ2Jhc2U2NCcpLnRvU3RyaW5nKCdhc2NpaScpOyB9O1xuXG4gICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShkZWNvZGUoZW5jb2RlZCkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBoYW5kbGVHcm91cEVycm9yID0gZnVuY3Rpb24gKG1lc3NhZ2UsIHN0YXR1c0NvZGUsIGRhdGEpIHtcbiAgICAgICAgICAgIC8vIGxvZ291dCB0aGUgdXNlciBzaW5jZSBpdCdzIGluIGFuIGludmFsaWQgc3RhdGUgd2l0aCBubyBncm91cCBzZWxlY3RlZFxuICAgICAgICAgICAgbWUubG9nb3V0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVycm9yID0gJC5leHRlbmQodHJ1ZSwge30sIGRhdGEsIHsgc3RhdHVzVGV4dDogbWVzc2FnZSwgc3RhdHVzOiBzdGF0dXNDb2RlIH0pO1xuICAgICAgICAgICAgICAgICRkLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaGFuZGxlU3VjY2VzcyA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgLy9qc2hpbnQgY2FtZWxjYXNlOiBmYWxzZVxuICAgICAgICAgICAgLy9qc2NzOmRpc2FibGVcbiAgICAgICAgICAgIHZhciB0b2tlbiA9IHJlc3BvbnNlLmFjY2Vzc190b2tlbjtcbiAgICAgICAgICAgIHZhciB1c2VySW5mbyA9IGRlY29kZVRva2VuKHRva2VuKTtcbiAgICAgICAgICAgIHZhciBvbGRHcm91cHMgPSBzZXNzaW9uTWFuYWdlci5nZXRTZXNzaW9uKGFkYXB0ZXJPcHRpb25zKS5ncm91cHMgfHwge307XG4gICAgICAgICAgICB2YXIgdXNlckdyb3VwT3B0cyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBhZGFwdGVyT3B0aW9ucywgeyBzdWNjZXNzOiAkLm5vb3AgfSk7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHsgYXV0aDogcmVzcG9uc2UsIHVzZXI6IHVzZXJJbmZvIH07XG4gICAgICAgICAgICB2YXIgcHJvamVjdCA9IGFkYXB0ZXJPcHRpb25zLnByb2plY3Q7XG4gICAgICAgICAgICB2YXIgaXNUZWFtTWVtYmVyID0gdXNlckluZm8ucGFyZW50X2FjY291bnRfaWQgPT09IG51bGw7XG4gICAgICAgICAgICB2YXIgcmVxdWlyZXNHcm91cCA9IGFkYXB0ZXJPcHRpb25zLnJlcXVpcmVzR3JvdXAgJiYgcHJvamVjdDtcblxuICAgICAgICAgICAgdmFyIHNlc3Npb25JbmZvID0ge1xuICAgICAgICAgICAgICAgIGF1dGhfdG9rZW46IHRva2VuLFxuICAgICAgICAgICAgICAgIGFjY291bnQ6IGFkYXB0ZXJPcHRpb25zLmFjY291bnQsXG4gICAgICAgICAgICAgICAgcHJvamVjdDogcHJvamVjdCxcbiAgICAgICAgICAgICAgICB1c2VySWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICAgICAgZ3JvdXBzOiBvbGRHcm91cHMsXG4gICAgICAgICAgICAgICAgaXNUZWFtTWVtYmVyOiBpc1RlYW1NZW1iZXJcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvLyBUaGUgZ3JvdXAgaXMgbm90IHJlcXVpcmVkIGlmIHRoZSB1c2VyIGlzIG5vdCBsb2dnaW5nIGludG8gYSBwcm9qZWN0XG4gICAgICAgICAgICBpZiAoIXJlcXVpcmVzR3JvdXApIHtcbiAgICAgICAgICAgICAgICBzZXNzaW9uTWFuYWdlci5zYXZlU2Vzc2lvbihzZXNzaW9uSW5mbyk7XG4gICAgICAgICAgICAgICAgb3V0U3VjY2Vzcy5hcHBseSh0aGlzLCBbZGF0YV0pO1xuICAgICAgICAgICAgICAgICRkLnJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgaGFuZGxlR3JvdXBMaXN0ID0gZnVuY3Rpb24gKGdyb3VwTGlzdCkge1xuICAgICAgICAgICAgICAgIGRhdGEudXNlckdyb3VwcyA9IGdyb3VwTGlzdDtcblxuICAgICAgICAgICAgICAgIHZhciBncm91cCA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKGdyb3VwTGlzdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlR3JvdXBFcnJvcignVGhlIHVzZXIgaGFzIG5vIGdyb3VwcyBhc3NvY2lhdGVkIGluIHRoaXMgYWNjb3VudCcsIDQwMSwgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGdyb3VwTGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gU2VsZWN0IHRoZSBvbmx5IGdyb3VwXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwID0gZ3JvdXBMaXN0WzBdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZ3JvdXBMaXN0Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdyb3VwSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmaWx0ZXJlZEdyb3VwcyA9ICQuZ3JlcChncm91cExpc3QsIGZ1bmN0aW9uIChyZXNHcm91cCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNHcm91cC5ncm91cElkID09PSBncm91cElkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cCA9IGZpbHRlcmVkR3JvdXBzLmxlbmd0aCA9PT0gMSA/IGZpbHRlcmVkR3JvdXBzWzBdIDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChncm91cCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBIHRlYW0gbWVtYmVyIGRvZXMgbm90IGdldCB0aGUgZ3JvdXAgbWVtYmVycyBiZWNhdXNlIGlzIGNhbGxpbmcgdGhlIEdyb3VwIEFQSVxuICAgICAgICAgICAgICAgICAgICAvLyBidXQgaXQncyBhdXRvbWF0aWNhbGx5IGEgZmFjIHVzZXJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlzRmFjID0gaXNUZWFtTWVtYmVyID8gdHJ1ZSA6IF9maW5kVXNlckluR3JvdXAoZ3JvdXAubWVtYmVycywgdXNlckluZm8udXNlcl9pZCkucm9sZSA9PT0gJ2ZhY2lsaXRhdG9yJztcbiAgICAgICAgICAgICAgICAgICAgdmFyIGdyb3VwRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwSWQ6IGdyb3VwLmdyb3VwSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cE5hbWU6IGdyb3VwLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0ZhYzogaXNGYWNcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlc3Npb25JbmZvV2l0aEdyb3VwID0gb2JqZWN0QXNzaWduKHt9LCBzZXNzaW9uSW5mbywgZ3JvdXBEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgc2Vzc2lvbkluZm8uZ3JvdXBzW3Byb2plY3RdID0gZ3JvdXBEYXRhO1xuICAgICAgICAgICAgICAgICAgICBtZS5zZXNzaW9uTWFuYWdlci5zYXZlU2Vzc2lvbihzZXNzaW9uSW5mb1dpdGhHcm91cCwgYWRhcHRlck9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICBvdXRTdWNjZXNzLmFwcGx5KHRoaXMsIFtkYXRhXSk7XG4gICAgICAgICAgICAgICAgICAgICRkLnJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlR3JvdXBFcnJvcignVGhpcyB1c2VyIGlzIGFzc29jaWF0ZWQgd2l0aCBtb3JlIHRoYW4gb25lIGdyb3VwLiBQbGVhc2Ugc3BlY2lmeSBhIGdyb3VwIGlkIHRvIGxvZyBpbnRvIGFuZCB0cnkgYWdhaW4nLCA0MDMsIGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmICghaXNUZWFtTWVtYmVyKSB7XG4gICAgICAgICAgICAgICAgbWUuZ2V0VXNlckdyb3Vwcyh7IHVzZXJJZDogdXNlckluZm8udXNlcl9pZCwgdG9rZW46IHRva2VuIH0sIHVzZXJHcm91cE9wdHMpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGhhbmRsZUdyb3VwTGlzdCwgJGQucmVqZWN0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wdHMgPSBvYmplY3RBc3NpZ24oe30sIHVzZXJHcm91cE9wdHMsIHsgdG9rZW46IHRva2VuIH0pO1xuICAgICAgICAgICAgICAgIHZhciBncm91cFNlcnZpY2UgPSBuZXcgR3JvdXBTZXJ2aWNlKG9wdHMpO1xuICAgICAgICAgICAgICAgIGdyb3VwU2VydmljZS5nZXRHcm91cHMoeyBhY2NvdW50OiBhZGFwdGVyT3B0aW9ucy5hY2NvdW50LCBwcm9qZWN0OiBwcm9qZWN0IH0pXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChncm91cHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdyb3VwIEFQSSByZXR1cm5zIGlkIGluc3RlYWQgb2YgZ3JvdXBJZFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGdyb3VwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXAuZ3JvdXBJZCA9IGdyb3VwLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVHcm91cExpc3QoZ3JvdXBzKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgJGQucmVqZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBhZGFwdGVyT3B0aW9ucy5zdWNjZXNzID0gaGFuZGxlU3VjY2VzcztcbiAgICAgICAgYWRhcHRlck9wdGlvbnMuZXJyb3IgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGlmIChhZGFwdGVyT3B0aW9ucy5hY2NvdW50KSB7XG4gICAgICAgICAgICAgICAgLy8gVHJ5IHRvIGxvZ2luIGFzIGEgc3lzdGVtIHVzZXJcbiAgICAgICAgICAgICAgICBhZGFwdGVyT3B0aW9ucy5hY2NvdW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgICBhZGFwdGVyT3B0aW9ucy5lcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0RXJyb3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgJGQucmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgbWUuYXV0aEFkYXB0ZXIubG9naW4oYWRhcHRlck9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3V0RXJyb3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICRkLnJlamVjdChyZXNwb25zZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5hdXRoQWRhcHRlci5sb2dpbihhZGFwdGVyT3B0aW9ucyk7XG4gICAgICAgIHJldHVybiAkZC5wcm9taXNlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICogTG9ncyB1c2VyIG91dCBieSBjbGVhcmluZyBhbGwgc2Vzc2lvbiBpbmZvcm1hdGlvbi5cbiAgICAqXG4gICAgKiAqKkV4YW1wbGUqKlxuICAgICpcbiAgICAqICAgICAgIGF1dGhNZ3IubG9nb3V0KCk7XG4gICAgKlxuICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAqXG4gICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAqL1xuICAgIGxvZ291dDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgdmFyIGFkYXB0ZXJPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKG9wdGlvbnMpO1xuXG4gICAgICAgIHZhciByZW1vdmVDb29raWVGbiA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgbWUuc2Vzc2lvbk1hbmFnZXIucmVtb3ZlU2Vzc2lvbigpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB0aGlzLmF1dGhBZGFwdGVyLmxvZ291dChhZGFwdGVyT3B0aW9ucykudGhlbihyZW1vdmVDb29raWVGbik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGV4aXN0aW5nIHVzZXIgYWNjZXNzIHRva2VuIGlmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluLiBPdGhlcndpc2UsIGxvZ3MgdGhlIHVzZXIgaW4sIGNyZWF0aW5nIGEgbmV3IHVzZXIgYWNjZXNzIHRva2VuLCBhbmQgcmV0dXJucyB0aGUgbmV3IHRva2VuLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICBhdXRoTWdyLmdldFRva2VuKClcbiAgICAgKiAgICAgICAgICAudGhlbihmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgKiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ015IHRva2VuIGlzICcsIHRva2VuKTtcbiAgICAgKiAgICAgICAgICB9KTtcbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGdldFRva2VuOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMob3B0aW9ucyk7XG5cbiAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldFNlc3Npb24oaHR0cE9wdGlvbnMpO1xuICAgICAgICB2YXIgJGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgIC8vanNoaW50IGNhbWVsY2FzZTogZmFsc2VcbiAgICAgICAgLy9qc2NzOmRpc2FibGVcbiAgICAgICAgaWYgKHNlc3Npb24uYXV0aF90b2tlbikge1xuICAgICAgICAgICAgJGQucmVzb2x2ZShzZXNzaW9uLmF1dGhfdG9rZW4pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sb2dpbihodHRwT3B0aW9ucykudGhlbigkZC5yZXNvbHZlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJGQucHJvbWlzZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGdyb3VwIHJlY29yZHMsIG9uZSBmb3IgZWFjaCBncm91cCBvZiB3aGljaCB0aGUgY3VycmVudCB1c2VyIGlzIGEgbWVtYmVyLiBFYWNoIGdyb3VwIHJlY29yZCBpbmNsdWRlcyB0aGUgZ3JvdXAgYG5hbWVgLCBgYWNjb3VudGAsIGBwcm9qZWN0YCwgYW5kIGBncm91cElkYC5cbiAgICAgKlxuICAgICAqIElmIHNvbWUgZW5kIHVzZXJzIGluIHlvdXIgcHJvamVjdCBhcmUgbWVtYmVycyBvZiBtdWx0aXBsZSBncm91cHMsIHRoaXMgaXMgYSB1c2VmdWwgbWV0aG9kIHRvIGNhbGwgb24geW91ciBwcm9qZWN0J3MgbG9naW4gcGFnZS4gV2hlbiB0aGUgdXNlciBhdHRlbXB0cyB0byBsb2cgaW4sIHlvdSBjYW4gdXNlIHRoaXMgdG8gZGlzcGxheSB0aGUgZ3JvdXBzIG9mIHdoaWNoIHRoZSB1c2VyIGlzIG1lbWJlciwgYW5kIGhhdmUgdGhlIHVzZXIgc2VsZWN0IHRoZSBjb3JyZWN0IGdyb3VwIHRvIGxvZyBpbiB0byBmb3IgdGhpcyBzZXNzaW9uLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgLy8gZ2V0IGdyb3VwcyBmb3IgY3VycmVudCB1c2VyXG4gICAgICogICAgICB2YXIgc2Vzc2lvbk9iaiA9IGF1dGhNZ3IuZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbygpO1xuICAgICAqICAgICAgYXV0aE1nci5nZXRVc2VyR3JvdXBzKHsgdXNlcklkOiBzZXNzaW9uT2JqLnVzZXJJZCwgdG9rZW46IHNlc3Npb25PYmouYXV0aF90b2tlbiB9KVxuICAgICAqICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChncm91cHMpIHtcbiAgICAgKiAgICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpIDwgZ3JvdXBzLmxlbmd0aDsgaSsrKVxuICAgICAqICAgICAgICAgICAgICAgICAgeyBjb25zb2xlLmxvZyhncm91cHNbaV0ubmFtZSk7IH1cbiAgICAgKiAgICAgICAgICB9KTtcbiAgICAgKlxuICAgICAqICAgICAgLy8gZ2V0IGdyb3VwcyBmb3IgcGFydGljdWxhciB1c2VyXG4gICAgICogICAgICBhdXRoTWdyLmdldFVzZXJHcm91cHMoe3VzZXJJZDogJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMycsIHRva2VuOiBzYXZlZFByb2pBY2Nlc3NUb2tlbiB9KTtcbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyBPYmplY3Qgd2l0aCBhIHVzZXJJZCBhbmQgdG9rZW4gcHJvcGVydGllcy5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGFyYW1zLnVzZXJJZCBUaGUgdXNlcklkLiBJZiBsb29raW5nIHVwIGdyb3VwcyBmb3IgdGhlIGN1cnJlbnRseSBsb2dnZWQgaW4gdXNlciwgdGhpcyBpcyBpbiB0aGUgc2Vzc2lvbiBpbmZvcm1hdGlvbi4gT3RoZXJ3aXNlLCBwYXNzIGEgc3RyaW5nLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYXJhbXMudG9rZW4gVGhlIGF1dGhvcml6YXRpb24gY3JlZGVudGlhbHMgKGFjY2VzcyB0b2tlbikgdG8gdXNlIGZvciBjaGVja2luZyB0aGUgZ3JvdXBzIGZvciB0aGlzIHVzZXIuIElmIGxvb2tpbmcgdXAgZ3JvdXBzIGZvciB0aGUgY3VycmVudGx5IGxvZ2dlZCBpbiB1c2VyLCB0aGlzIGlzIGluIHRoZSBzZXNzaW9uIGluZm9ybWF0aW9uLiBBIHRlYW0gbWVtYmVyJ3MgdG9rZW4gb3IgYSBwcm9qZWN0IGFjY2VzcyB0b2tlbiBjYW4gYWNjZXNzIGFsbCB0aGUgZ3JvdXBzIGZvciBhbGwgZW5kIHVzZXJzIGluIHRoZSB0ZWFtIG9yIHByb2plY3QuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGdldFVzZXJHcm91cHM6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGFkYXB0ZXJPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKHsgc3VjY2VzczogJC5ub29wIH0sIG9wdGlvbnMpO1xuICAgICAgICB2YXIgJGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgIHZhciBvdXRTdWNjZXNzID0gYWRhcHRlck9wdGlvbnMuc3VjY2VzcztcblxuICAgICAgICBhZGFwdGVyT3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24gKG1lbWJlckluZm8pIHtcbiAgICAgICAgICAgIC8vIFRoZSBtZW1iZXIgQVBJIGlzIGF0IHRoZSBhY2NvdW50IHNjb3BlLCB3ZSBmaWx0ZXIgYnkgcHJvamVjdFxuICAgICAgICAgICAgaWYgKGFkYXB0ZXJPcHRpb25zLnByb2plY3QpIHtcbiAgICAgICAgICAgICAgICBtZW1iZXJJbmZvID0gJC5ncmVwKG1lbWJlckluZm8sIGZ1bmN0aW9uIChncm91cCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ3JvdXAucHJvamVjdCA9PT0gYWRhcHRlck9wdGlvbnMucHJvamVjdDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3V0U3VjY2Vzcy5hcHBseSh0aGlzLCBbbWVtYmVySW5mb10pO1xuICAgICAgICAgICAgJGQucmVzb2x2ZShtZW1iZXJJbmZvKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgbWVtYmVyQWRhcHRlciA9IG5ldyBNZW1iZXJBZGFwdGVyKHsgdG9rZW46IHBhcmFtcy50b2tlbiB9KTtcbiAgICAgICAgbWVtYmVyQWRhcHRlci5nZXRHcm91cHNGb3JVc2VyKHBhcmFtcywgYWRhcHRlck9wdGlvbnMpLmZhaWwoJGQucmVqZWN0KTtcbiAgICAgICAgcmV0dXJuICRkLnByb21pc2UoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBzZXNzaW9uIGluZm9ybWF0aW9uIGZvciB0aGUgY3VycmVudCB1c2VyLCBpbmNsdWRpbmcgdGhlIGB1c2VySWRgLCBgYWNjb3VudGAsIGBwcm9qZWN0YCwgYGdyb3VwSWRgLCBgZ3JvdXBOYW1lYCwgYGlzRmFjYCAod2hldGhlciB0aGUgZW5kIHVzZXIgaXMgYSBmYWNpbGl0YXRvciBvZiB0aGlzIGdyb3VwKSwgYW5kIGBhdXRoX3Rva2VuYCAodXNlciBhY2Nlc3MgdG9rZW4pLlxuICAgICAqXG4gICAgICogKkltcG9ydGFudCo6IFRoaXMgbWV0aG9kIGlzIHN5bmNocm9ub3VzLiBUaGUgc2Vzc2lvbiBpbmZvcm1hdGlvbiBpcyByZXR1cm5lZCBpbW1lZGlhdGVseSBpbiBhbiBvYmplY3Q7IG5vIGNhbGxiYWNrcyBvciBwcm9taXNlcyBhcmUgbmVlZGVkLlxuICAgICAqXG4gICAgICogU2Vzc2lvbiBpbmZvcm1hdGlvbiBpcyBzdG9yZWQgaW4gYSBjb29raWUgaW4gdGhlIGJyb3dzZXIuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICB2YXIgc2Vzc2lvbk9iaiA9IGF1dGhNZ3IuZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbygpO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gc2Vzc2lvbiBpbmZvcm1hdGlvblxuICAgICAqL1xuICAgIGdldEN1cnJlbnRVc2VyU2Vzc2lvbkluZm86IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciBhZGFwdGVyT3B0aW9ucyA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyh7IHN1Y2Nlc3M6ICQubm9vcCB9LCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0U2Vzc2lvbihhZGFwdGVyT3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qXG4gICAgICogQWRkcyBvbmUgb3IgbW9yZSBncm91cHMgdG8gdGhlIGN1cnJlbnQgc2Vzc2lvbi4gXG4gICAgICpcbiAgICAgKiBUaGlzIG1ldGhvZCBhc3N1bWVzIHRoYXQgdGhlIHByb2plY3QgYW5kIGdyb3VwIGV4aXN0IGFuZCB0aGUgdXNlciBzcGVjaWZpZWQgaW4gdGhlIHNlc3Npb24gaXMgcGFydCBvZiB0aGlzIHByb2plY3QgYW5kIGdyb3VwLlxuICAgICAqXG4gICAgICogUmV0dXJucyB0aGUgbmV3IHNlc3Npb24gb2JqZWN0LlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgYXV0aE1nci5hZGRHcm91cHMoeyBwcm9qZWN0OiAnaGVsbG8td29ybGQnLCBncm91cE5hbWU6ICdncm91cE5hbWUnLCBncm91cElkOiAnZ3JvdXBJZCcgfSk7XG4gICAgICogICAgICBhdXRoTWdyLmFkZEdyb3VwcyhbeyBwcm9qZWN0OiAnaGVsbG8td29ybGQnLCBncm91cE5hbWU6ICdncm91cE5hbWUnLCBncm91cElkOiAnZ3JvdXBJZCcgfSwgeyBwcm9qZWN0OiAnaGVsbG8td29ybGQnLCBncm91cE5hbWU6ICcuLi4nIH1dKTtcbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICogQHBhcmFtIHtvYmplY3R8YXJyYXl9IGdyb3VwcyAoUmVxdWlyZWQpIFRoZSBncm91cCBvYmplY3QgbXVzdCBjb250YWluIHRoZSBgcHJvamVjdGAgKCoqUHJvamVjdCBJRCoqKSBhbmQgYGdyb3VwTmFtZWAgcHJvcGVydGllcy4gSWYgcGFzc2luZyBhbiBhcnJheSBvZiBzdWNoIG9iamVjdHMsIGFsbCBvZiB0aGUgb2JqZWN0cyBtdXN0IGNvbnRhaW4gKmRpZmZlcmVudCogYHByb2plY3RgICgqKlByb2plY3QgSUQqKikgdmFsdWVzOiBhbHRob3VnaCBlbmQgdXNlcnMgbWF5IGJlIGxvZ2dlZCBpbiB0byBtdWx0aXBsZSBwcm9qZWN0cyBhdCBvbmNlLCB0aGV5IG1heSBvbmx5IGJlIGxvZ2dlZCBpbiB0byBvbmUgZ3JvdXAgcGVyIHByb2plY3QgYXQgYSB0aW1lLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBncm91cC5pc0ZhYyAob3B0aW9uYWwpIERlZmF1bHRzIHRvIGBmYWxzZWAuIFNldCB0byBgdHJ1ZWAgaWYgdGhlIHVzZXIgaW4gdGhlIHNlc3Npb24gc2hvdWxkIGJlIGEgZmFjaWxpdGF0b3IgaW4gdGhpcyBncm91cC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZ3JvdXAuZ3JvdXBJZCAob3B0aW9uYWwpIERlZmF1bHRzIHRvIHVuZGVmaW5lZC4gTmVlZGVkIG1vc3RseSBmb3IgdGhlIE1lbWJlcnMgQVBJLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gc2Vzc2lvbiBpbmZvcm1hdGlvblxuICAgICovXG4gICAgYWRkR3JvdXBzOiBmdW5jdGlvbiAoZ3JvdXBzKSB7XG4gICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICAgIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheShncm91cHMpO1xuICAgICAgICBncm91cHMgPSBpc0FycmF5ID8gZ3JvdXBzIDogW2dyb3Vwc107XG5cbiAgICAgICAgJC5lYWNoKGdyb3VwcywgZnVuY3Rpb24gKGluZGV4LCBncm91cCkge1xuICAgICAgICAgICAgdmFyIGV4dGVuZGVkR3JvdXAgPSAkLmV4dGVuZCh7fSwgeyBpc0ZhYzogZmFsc2UgfSwgZ3JvdXApO1xuICAgICAgICAgICAgdmFyIHByb2plY3QgPSBleHRlbmRlZEdyb3VwLnByb2plY3Q7XG4gICAgICAgICAgICB2YXIgdmFsaWRQcm9wcyA9IFsnZ3JvdXBOYW1lJywgJ2dyb3VwSWQnLCAnaXNGYWMnXTtcbiAgICAgICAgICAgIGlmICghcHJvamVjdCB8fCAhZXh0ZW5kZWRHcm91cC5ncm91cE5hbWUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHByb2plY3Qgb3IgZ3JvdXBOYW1lIHNwZWNpZmllZC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGZpbHRlciBvYmplY3RcbiAgICAgICAgICAgIGV4dGVuZGVkR3JvdXAgPSBfcGljayhleHRlbmRlZEdyb3VwLCB2YWxpZFByb3BzKTtcbiAgICAgICAgICAgIHNlc3Npb24uZ3JvdXBzW3Byb2plY3RdID0gZXh0ZW5kZWRHcm91cDtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIuc2F2ZVNlc3Npb24oc2Vzc2lvbik7XG4gICAgICAgIHJldHVybiBzZXNzaW9uO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEF1dGhNYW5hZ2VyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqICMjIENoYW5uZWwgTWFuYWdlclxuICpcbiAqIFRoZXJlIGFyZSB0d28gbWFpbiB1c2UgY2FzZXMgZm9yIHRoZSBjaGFubmVsOiBldmVudCBub3RpZmljYXRpb25zIGFuZCBjaGF0IG1lc3NhZ2VzLlxuICpcbiAqIFRoZSBDaGFubmVsIE1hbmFnZXIgaXMgYSB3cmFwcGVyIGFyb3VuZCB0aGUgZGVmYXVsdCBbY29tZXRkIEphdmFTY3JpcHQgbGlicmFyeV0oaHR0cDovL2RvY3MuY29tZXRkLm9yZy8yL3JlZmVyZW5jZS9qYXZhc2NyaXB0Lmh0bWwpLCBgJC5jb21ldGRgLiBJdCBwcm92aWRlcyBhIGZldyBuaWNlIGZlYXR1cmVzIHRoYXQgYCQuY29tZXRkYCBkb2Vzbid0LCBpbmNsdWRpbmc6XG4gKlxuICogKiBBdXRvbWF0aWMgcmUtc3Vic2NyaXB0aW9uIHRvIGNoYW5uZWxzIGlmIHlvdSBsb3NlIHlvdXIgY29ubmVjdGlvblxuICogKiBPbmxpbmUgLyBPZmZsaW5lIG5vdGlmaWNhdGlvbnNcbiAqICogJ0V2ZW50cycgZm9yIGNvbWV0ZCBub3RpZmljYXRpb25zIChpbnN0ZWFkIG9mIGhhdmluZyB0byBsaXN0ZW4gb24gc3BlY2lmaWMgbWV0YSBjaGFubmVscylcbiAqXG4gKiBXaGlsZSB5b3UgY2FuIHdvcmsgZGlyZWN0bHkgd2l0aCB0aGUgQ2hhbm5lbCBNYW5hZ2VyIHRocm91Z2ggTm9kZS5qcyAoZm9yIGV4YW1wbGUsIGByZXF1aXJlKCdtYW5hZ2VyL2NoYW5uZWwtbWFuYWdlcicpYCkgLS0gb3IgZXZlbiB3b3JrIGRpcmVjdGx5IHdpdGggYCQuY29tZXRkYCBhbmQgRXBpY2VudGVyJ3MgdW5kZXJseWluZyBbUHVzaCBDaGFubmVsIEFQSV0oLi4vLi4vLi4vcmVzdF9hcGlzL211bHRpcGxheWVyL2NoYW5uZWwvKSAtLSBtb3N0IG9mdGVuIGl0IHdpbGwgYmUgZWFzaWVzdCB0byB3b3JrIHdpdGggdGhlIFtFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyXSguLi9lcGljZW50ZXItY2hhbm5lbC1tYW5hZ2VyLykuIFRoZSBFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyIGlzIGEgd3JhcHBlciB0aGF0IGluc3RhbnRpYXRlcyBhIENoYW5uZWwgTWFuYWdlciB3aXRoIEVwaWNlbnRlci1zcGVjaWZpYyBkZWZhdWx0cy5cbiAqXG4gKiBZb3UnbGwgbmVlZCB0byBpbmNsdWRlIHRoZSBgZXBpY2VudGVyLW11bHRpcGxheWVyLWRlcGVuZGVuY2llcy5qc2AgbGlicmFyeSBpbiBhZGRpdGlvbiB0byB0aGUgYGVwaWNlbnRlci5qc2AgbGlicmFyeSBpbiB5b3VyIHByb2plY3QgdG8gdXNlIHRoZSBDaGFubmVsIE1hbmFnZXIuIChTZWUgW0luY2x1ZGluZyBFcGljZW50ZXIuanNdKC4uLy4uLyNpbmNsdWRlKS4pXG4gKlxuICogVG8gdXNlIHRoZSBDaGFubmVsIE1hbmFnZXIgaW4gY2xpZW50LXNpZGUgSmF2YVNjcmlwdCwgaW5zdGFudGlhdGUgdGhlIFtFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyXSguLi9lcGljZW50ZXItY2hhbm5lbC1tYW5hZ2VyLyksIGdldCB0aGUgY2hhbm5lbCwgdGhlbiB1c2UgdGhlIGNoYW5uZWwncyBgc3Vic2NyaWJlKClgIGFuZCBgcHVibGlzaCgpYCBtZXRob2RzIHRvIHN1YnNjcmliZSB0byB0b3BpY3Mgb3IgcHVibGlzaCBkYXRhIHRvIHRvcGljcy5cbiAqXG4gKiAgICAgICAgdmFyIGNtID0gbmV3IEYubWFuYWdlci5DaGFubmVsTWFuYWdlcigpO1xuICogICAgICAgIHZhciBjaGFubmVsID0gY20uZ2V0Q2hhbm5lbCgpO1xuICpcbiAqICAgICAgICBjaGFubmVsLnN1YnNjcmliZSgndG9waWMnLCBjYWxsYmFjayk7XG4gKiAgICAgICAgY2hhbm5lbC5wdWJsaXNoKCd0b3BpYycsIHsgbXlEYXRhOiAxMDAgfSk7XG4gKlxuICogVGhlIHBhcmFtZXRlcnMgZm9yIGluc3RhbnRpYXRpbmcgYSBDaGFubmVsIE1hbmFnZXIgaW5jbHVkZTpcbiAqXG4gKiAqIGBvcHRpb25zYCBUaGUgb3B0aW9ucyBvYmplY3QgdG8gY29uZmlndXJlIHRoZSBDaGFubmVsIE1hbmFnZXIuIEJlc2lkZXMgdGhlIGNvbW1vbiBvcHRpb25zIGxpc3RlZCBoZXJlLCBzZWUgaHR0cDovL2RvY3MuY29tZXRkLm9yZy9yZWZlcmVuY2UvamF2YXNjcmlwdC5odG1sIGZvciBvdGhlciBzdXBwb3J0ZWQgb3B0aW9ucy5cbiAqICogYG9wdGlvbnMudXJsYCBUaGUgQ29tZXRkIGVuZHBvaW50IFVSTC5cbiAqICogYG9wdGlvbnMud2Vic29ja2V0RW5hYmxlZGAgV2hldGhlciB3ZWJzb2NrZXQgc3VwcG9ydCBpcyBhY3RpdmUgKGJvb2xlYW4pLlxuICogKiBgb3B0aW9ucy5jaGFubmVsYCBPdGhlciBkZWZhdWx0cyB0byBwYXNzIG9uIHRvIGluc3RhbmNlcyBvZiB0aGUgdW5kZXJseWluZyBDaGFubmVsIFNlcnZpY2UuIFNlZSBbQ2hhbm5lbCBTZXJ2aWNlXSguLi9jaGFubmVsLXNlcnZpY2UvKSBmb3IgZGV0YWlscy5cbiAqXG4gKi9cblxudmFyIENoYW5uZWwgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL2NoYW5uZWwtc2VydmljZScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG5cbnZhciBDaGFubmVsTWFuYWdlciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgaWYgKCEkLmNvbWV0ZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbWV0ZCBsaWJyYXJ5IG5vdCBmb3VuZC4gUGxlYXNlIGluY2x1ZGUgZXBpY2VudGVyLW11bHRpcGxheWVyLWRlcGVuZGVuY2llcy5qcycpO1xuICAgIH1cbiAgICBpZiAoIW9wdGlvbnMgfHwgIW9wdGlvbnMudXJsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHByb3ZpZGUgYW4gdXJsIGZvciB0aGUgY29tZXRkIHNlcnZlcicpO1xuICAgIH1cblxuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBDb21ldGQgZW5kcG9pbnQgVVJMLlxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdXJsOiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGxvZyBsZXZlbCBmb3IgdGhlIGNoYW5uZWwgKGxvZ3MgdG8gY29uc29sZSkuXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBsb2dMZXZlbDogJ2luZm8nLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHdlYnNvY2tldCBzdXBwb3J0IGlzIGFjdGl2ZS4gRGVmYXVsdHMgdG8gYGZhbHNlYDsgRXBpY2VudGVyIGRvZXNuJ3QgY3VycmVudGx5IHN1cHBvcnQgY29tbXVuaWNhdGlvbiB0aHJvdWdoIHdlYnNvY2tldHMuXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgd2Vic29ja2V0RW5hYmxlZDogZmFsc2UsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIGZhbHNlIGVhY2ggaW5zdGFuY2Ugb2YgQ2hhbm5lbCB3aWxsIGhhdmUgYSBzZXBhcmF0ZSBjb21ldGQgY29ubmVjdGlvbiB0byBzZXJ2ZXIsIHdoaWNoIGNvdWxkIGJlIG5vaXN5LiBTZXQgdG8gdHJ1ZSB0byByZS11c2UgdGhlIHNhbWUgY29ubmVjdGlvbiBhY3Jvc3MgaW5zdGFuY2VzLlxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHNoYXJlQ29ubmVjdGlvbjogZmFsc2UsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE90aGVyIGRlZmF1bHRzIHRvIHBhc3Mgb24gdG8gaW5zdGFuY2VzIG9mIHRoZSB1bmRlcmx5aW5nIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pLCB3aGljaCBhcmUgY3JlYXRlZCB0aHJvdWdoIGBnZXRDaGFubmVsKClgLlxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgY2hhbm5lbDoge1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyB0byB0aGUgY2hhbm5lbCBoYW5kc2hha2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEZvciBleGFtcGxlLCB0aGUgW0VwaWNlbnRlciBDaGFubmVsIE1hbmFnZXJdKC4uL2VwaWNlbnRlci1jaGFubmVsLW1hbmFnZXIvKSBwYXNzZXMgYGV4dGAgYW5kIGF1dGhvcml6YXRpb24gaW5mb3JtYXRpb24uIE1vcmUgaW5mb3JtYXRpb24gb24gcG9zc2libGUgb3B0aW9ucyBpcyBpbiB0aGUgZGV0YWlscyBvZiB0aGUgdW5kZXJseWluZyBbUHVzaCBDaGFubmVsIEFQSV0oLi4vLi4vLi4vcmVzdF9hcGlzL211bHRpcGxheWVyL2NoYW5uZWwvKS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIGhhbmRzaGFrZTogdW5kZWZpbmVkXG4gICAgfTtcbiAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKCk7XG4gICAgdmFyIGRlZmF1bHRDb21ldE9wdGlvbnMgPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoZGVmYXVsdHMsIG9wdGlvbnMpO1xuICAgIHRoaXMuY3VycmVudFN1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICB0aGlzLm9wdGlvbnMgPSBkZWZhdWx0Q29tZXRPcHRpb25zO1xuXG4gICAgaWYgKGRlZmF1bHRDb21ldE9wdGlvbnMuc2hhcmVDb25uZWN0aW9uICYmIENoYW5uZWxNYW5hZ2VyLnByb3RvdHlwZS5fY29tZXRkKSB7XG4gICAgICAgIHRoaXMuY29tZXRkID0gQ2hhbm5lbE1hbmFnZXIucHJvdG90eXBlLl9jb21ldGQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICB2YXIgY29tZXRkID0gbmV3ICQuQ29tZXRkKCk7XG4gICAgQ2hhbm5lbE1hbmFnZXIucHJvdG90eXBlLl9jb21ldGQgPSBjb21ldGQ7XG5cbiAgICBjb21ldGQud2Vic29ja2V0RW5hYmxlZCA9IGRlZmF1bHRDb21ldE9wdGlvbnMud2Vic29ja2V0RW5hYmxlZDtcblxuICAgIHRoaXMuaXNDb25uZWN0ZWQgPSBmYWxzZTtcbiAgICB2YXIgY29ubmVjdGlvbkJyb2tlbiA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICQodGhpcykudHJpZ2dlcignZGlzY29ubmVjdCcsIG1lc3NhZ2UpO1xuICAgIH07XG4gICAgdmFyIGNvbm5lY3Rpb25TdWNjZWVkZWQgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAkKHRoaXMpLnRyaWdnZXIoJ2Nvbm5lY3QnLCBtZXNzYWdlKTtcbiAgICB9O1xuICAgIHZhciBtZSA9IHRoaXM7XG5cbiAgICBjb21ldGQuY29uZmlndXJlKGRlZmF1bHRDb21ldE9wdGlvbnMpO1xuXG4gICAgY29tZXRkLmFkZExpc3RlbmVyKCcvbWV0YS9jb25uZWN0JywgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgdmFyIHdhc0Nvbm5lY3RlZCA9IHRoaXMuaXNDb25uZWN0ZWQ7XG4gICAgICAgIHRoaXMuaXNDb25uZWN0ZWQgPSAobWVzc2FnZS5zdWNjZXNzZnVsID09PSB0cnVlKTtcbiAgICAgICAgaWYgKCF3YXNDb25uZWN0ZWQgJiYgdGhpcy5pc0Nvbm5lY3RlZCkgeyAvL0Nvbm5lY3RpbmcgZm9yIHRoZSBmaXJzdCB0aW1lXG4gICAgICAgICAgICBjb25uZWN0aW9uU3VjY2VlZGVkLmNhbGwodGhpcywgbWVzc2FnZSk7XG4gICAgICAgIH0gZWxzZSBpZiAod2FzQ29ubmVjdGVkICYmICF0aGlzLmlzQ29ubmVjdGVkKSB7IC8vT25seSB0aHJvdyBkaXNjb25uZWN0ZWQgbWVzc2FnZSBmcm8gdGhlIGZpcnN0IGRpc2Nvbm5lY3QsIG5vdCBvbmNlIHBlciB0cnlcbiAgICAgICAgICAgIGNvbm5lY3Rpb25Ccm9rZW4uY2FsbCh0aGlzLCBtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICBjb21ldGQuYWRkTGlzdGVuZXIoJy9tZXRhL2Rpc2Nvbm5lY3QnLCBjb25uZWN0aW9uQnJva2VuKTtcblxuICAgIGNvbWV0ZC5hZGRMaXN0ZW5lcignL21ldGEvaGFuZHNoYWtlJywgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgaWYgKG1lc3NhZ2Uuc3VjY2Vzc2Z1bCkge1xuICAgICAgICAgICAgLy9odHRwOi8vZG9jcy5jb21ldGQub3JnL3JlZmVyZW5jZS9qYXZhc2NyaXB0X3N1YnNjcmliZS5odG1sI2phdmFzY3JpcHRfc3Vic2NyaWJlX21ldGFfY2hhbm5lbHNcbiAgICAgICAgICAgIC8vIF4gXCJkeW5hbWljIHN1YnNjcmlwdGlvbnMgYXJlIGNsZWFyZWQgKGxpa2UgYW55IG90aGVyIHN1YnNjcmlwdGlvbikgYW5kIHRoZSBhcHBsaWNhdGlvbiBuZWVkcyB0byBmaWd1cmUgb3V0IHdoaWNoIGR5bmFtaWMgc3Vic2NyaXB0aW9uIG11c3QgYmUgcGVyZm9ybWVkIGFnYWluXCJcbiAgICAgICAgICAgIGNvbWV0ZC5iYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJChtZS5jdXJyZW50U3Vic2NyaXB0aW9ucykuZWFjaChmdW5jdGlvbiAoaW5kZXgsIHN1YnMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tZXRkLnJlc3Vic2NyaWJlKHN1YnMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vT3RoZXIgaW50ZXJlc3RpbmcgZXZlbnRzIGZvciByZWZlcmVuY2VcbiAgICBjb21ldGQuYWRkTGlzdGVuZXIoJy9tZXRhL3N1YnNjcmliZScsIGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICQobWUpLnRyaWdnZXIoJ3N1YnNjcmliZScsIG1lc3NhZ2UpO1xuICAgIH0pO1xuICAgIGNvbWV0ZC5hZGRMaXN0ZW5lcignL21ldGEvdW5zdWJzY3JpYmUnLCBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAkKG1lKS50cmlnZ2VyKCd1bnN1YnNjcmliZScsIG1lc3NhZ2UpO1xuICAgIH0pO1xuICAgIGNvbWV0ZC5hZGRMaXN0ZW5lcignL21ldGEvcHVibGlzaCcsIGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICQobWUpLnRyaWdnZXIoJ3B1Ymxpc2gnLCBtZXNzYWdlKTtcbiAgICB9KTtcbiAgICBjb21ldGQuYWRkTGlzdGVuZXIoJy9tZXRhL3Vuc3VjY2Vzc2Z1bCcsIGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICQobWUpLnRyaWdnZXIoJ2Vycm9yJywgbWVzc2FnZSk7XG4gICAgfSk7XG5cbiAgICBjb21ldGQuaGFuZHNoYWtlKGRlZmF1bHRDb21ldE9wdGlvbnMuaGFuZHNoYWtlKTtcblxuICAgIHRoaXMuY29tZXRkID0gY29tZXRkO1xufTtcblxuXG5DaGFubmVsTWFuYWdlci5wcm90b3R5cGUgPSAkLmV4dGVuZChDaGFubmVsTWFuYWdlci5wcm90b3R5cGUsIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW5kIHJldHVybnMgYSBjaGFubmVsLCB0aGF0IGlzLCBhbiBpbnN0YW5jZSBvZiBhIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGNtID0gbmV3IEYubWFuYWdlci5DaGFubmVsTWFuYWdlcigpO1xuICAgICAqICAgICAgdmFyIGNoYW5uZWwgPSBjbS5nZXRDaGFubmVsKCk7XG4gICAgICpcbiAgICAgKiAgICAgIGNoYW5uZWwuc3Vic2NyaWJlKCd0b3BpYycsIGNhbGxiYWNrKTtcbiAgICAgKiAgICAgIGNoYW5uZWwucHVibGlzaCgndG9waWMnLCB7IG15RGF0YTogMTAwIH0pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0ge09iamVjdHxTdHJpbmd9IG9wdGlvbnMgKE9wdGlvbmFsKSBJZiBzdHJpbmcsIGFzc3VtZWQgdG8gYmUgdGhlIGJhc2UgY2hhbm5lbCB1cmwuIElmIG9iamVjdCwgYXNzdW1lZCB0byBiZSBjb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBjb25zdHJ1Y3Rvci5cbiAgICAgKiBAcmV0dXJuIHtDaGFubmVsfSBDaGFubmVsIGluc3RhbmNlXG4gICAgICovXG4gICAgZ2V0Q2hhbm5lbDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgLy9JZiB5b3UganVzdCB3YW50IHRvIHBhc3MgaW4gYSBzdHJpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMgJiYgISQuaXNQbGFpbk9iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICBiYXNlOiBvcHRpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgICAgIHRyYW5zcG9ydDogdGhpcy5jb21ldGRcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGNoYW5uZWwgPSBuZXcgQ2hhbm5lbCgkLmV4dGVuZCh0cnVlLCB7fSwgdGhpcy5vcHRpb25zLmNoYW5uZWwsIGRlZmF1bHRzLCBvcHRpb25zKSk7XG5cblxuICAgICAgICAvL1dyYXAgc3VicyBhbmQgdW5zdWJzIHNvIHdlIGNhbiB1c2UgaXQgdG8gcmUtYXR0YWNoIGhhbmRsZXJzIGFmdGVyIGJlaW5nIGRpc2Nvbm5lY3RlZFxuICAgICAgICB2YXIgc3VicyA9IGNoYW5uZWwuc3Vic2NyaWJlO1xuICAgICAgICBjaGFubmVsLnN1YnNjcmliZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBzdWJpZCA9IHN1YnMuYXBwbHkoY2hhbm5lbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFN1YnNjcmlwdGlvbnMgPSB0aGlzLmN1cnJlbnRTdWJzY3JpcHRpb25zLmNvbmNhdChzdWJpZCk7XG4gICAgICAgICAgICByZXR1cm4gc3ViaWQ7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuXG4gICAgICAgIHZhciB1bnN1YnMgPSBjaGFubmVsLnVuc3Vic2NyaWJlO1xuICAgICAgICBjaGFubmVsLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHJlbW92ZWQgPSB1bnN1YnMuYXBwbHkoY2hhbm5lbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jdXJyZW50U3Vic2NyaXB0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRTdWJzY3JpcHRpb25zW2ldLmlkID09PSByZW1vdmVkLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFN1YnNjcmlwdGlvbnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZW1vdmVkO1xuICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIGNoYW5uZWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IGxpc3RlbmluZyBmb3IgZXZlbnRzIG9uIHRoaXMgaW5zdGFuY2UuIFNpZ25hdHVyZSBpcyBzYW1lIGFzIGZvciBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vb24vLlxuICAgICAqXG4gICAgICogU3VwcG9ydGVkIGV2ZW50cyBhcmU6IGBjb25uZWN0YCwgYGRpc2Nvbm5lY3RgLCBgc3Vic2NyaWJlYCwgYHVuc3Vic2NyaWJlYCwgYHB1Ymxpc2hgLCBgZXJyb3JgLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgdHlwZS4gU2VlIG1vcmUgZGV0YWlsIGF0IGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9vbi8uXG4gICAgICovXG4gICAgb246IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAkKHRoaXMpLm9uLmFwcGx5KCQodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0b3AgbGlzdGVuaW5nIGZvciBldmVudHMgb24gdGhpcyBpbnN0YW5jZS4gU2lnbmF0dXJlIGlzIHNhbWUgYXMgZm9yIGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9vZmYvLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgdHlwZS4gU2VlIG1vcmUgZGV0YWlsIGF0IGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9vZmYvLlxuICAgICAqL1xuICAgIG9mZjogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICQodGhpcykub2ZmLmFwcGx5KCQodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRyaWdnZXIgZXZlbnRzIGFuZCBleGVjdXRlIGhhbmRsZXJzLiBTaWduYXR1cmUgaXMgc2FtZSBhcyBmb3IgalF1ZXJ5IEV2ZW50czogaHR0cDovL2FwaS5qcXVlcnkuY29tL3RyaWdnZXIvLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgdHlwZS4gU2VlIG1vcmUgZGV0YWlsIGF0IGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS90cmlnZ2VyLy5cbiAgICAgKi9cbiAgICB0cmlnZ2VyOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgJCh0aGlzKS50cmlnZ2VyLmFwcGx5KCQodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhbm5lbE1hbmFnZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogIyMgRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlclxuICpcbiAqIFRoZSBFcGljZW50ZXIgcGxhdGZvcm0gcHJvdmlkZXMgYSBwdXNoIGNoYW5uZWwsIHdoaWNoIGFsbG93cyB5b3UgdG8gcHVibGlzaCBhbmQgc3Vic2NyaWJlIHRvIG1lc3NhZ2VzIHdpdGhpbiBhIFtwcm9qZWN0XSguLi8uLi8uLi9nbG9zc2FyeS8jcHJvamVjdHMpLCBbZ3JvdXBdKC4uLy4uLy4uL2dsb3NzYXJ5LyNncm91cHMpLCBvciBbbXVsdGlwbGF5ZXIgd29ybGRdKC4uLy4uLy4uL2dsb3NzYXJ5LyN3b3JsZCkuIFRoZXJlIGFyZSB0d28gbWFpbiB1c2UgY2FzZXMgZm9yIHRoZSBjaGFubmVsOiBldmVudCBub3RpZmljYXRpb25zIGFuZCBjaGF0IG1lc3NhZ2VzLlxuICpcbiAqIFRoZSBFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyIGlzIGEgd3JhcHBlciBhcm91bmQgdGhlIChtb3JlIGdlbmVyaWMpIFtDaGFubmVsIE1hbmFnZXJdKC4uL2NoYW5uZWwtbWFuYWdlci8pLCB0byBpbnN0YW50aWF0ZSBpdCB3aXRoIEVwaWNlbnRlci1zcGVjaWZpYyBkZWZhdWx0cy4gSWYgeW91IGFyZSBpbnRlcmVzdGVkIGluIGluY2x1ZGluZyBhIG5vdGlmaWNhdGlvbiBvciBjaGF0IGZlYXR1cmUgaW4geW91ciBwcm9qZWN0LCB1c2luZyBhbiBFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyIGlzIHByb2JhYmx5IHRoZSBlYXNpZXN0IHdheSB0byBnZXQgc3RhcnRlZC5cbiAqXG4gKiBZb3UnbGwgbmVlZCB0byBpbmNsdWRlIHRoZSBgZXBpY2VudGVyLW11bHRpcGxheWVyLWRlcGVuZGVuY2llcy5qc2AgbGlicmFyeSBpbiBhZGRpdGlvbiB0byB0aGUgYGVwaWNlbnRlci5qc2AgbGlicmFyeSBpbiB5b3VyIHByb2plY3QgdG8gdXNlIHRoZSBFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyLiBTZWUgW0luY2x1ZGluZyBFcGljZW50ZXIuanNdKC4uLy4uLyNpbmNsdWRlKS5cbiAqXG4gKiBUbyB1c2UgdGhlIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXI6IGluc3RhbnRpYXRlIGl0LCBnZXQgdGhlIGNoYW5uZWwgb2YgdGhlIHNjb3BlIHlvdSB3YW50IChbdXNlcl0oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKSwgW3dvcmxkXSguLi8uLi8uLi9nbG9zc2FyeS8jd29ybGQpLCBvciBbZ3JvdXBdKC4uLy4uLy4uL2dsb3NzYXJ5LyNncm91cHMpKSwgdGhlbiB1c2UgdGhlIGNoYW5uZWwncyBgc3Vic2NyaWJlKClgIGFuZCBgcHVibGlzaCgpYCBtZXRob2RzIHRvIHN1YnNjcmliZSB0byB0b3BpY3Mgb3IgcHVibGlzaCBkYXRhIHRvIHRvcGljcy5cbiAqXG4gKiAgICAgdmFyIGNtID0gbmV3IEYubWFuYWdlci5DaGFubmVsTWFuYWdlcigpO1xuICogICAgIHZhciBnYyA9IGNtLmdldEdyb3VwQ2hhbm5lbCgpO1xuICogICAgIGdjLnN1YnNjcmliZSgnYnJvYWRjYXN0cycsIGNhbGxiYWNrKTtcbiAqXG4gKiBGb3IgYWRkaXRpb25hbCBiYWNrZ3JvdW5kIG9uIEVwaWNlbnRlcidzIHB1c2ggY2hhbm5lbCwgc2VlIHRoZSBpbnRyb2R1Y3Rvcnkgbm90ZXMgb24gdGhlIFtQdXNoIENoYW5uZWwgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvbXVsdGlwbGF5ZXIvY2hhbm5lbC8pIHBhZ2UuXG4gKlxuICogVGhlIHBhcmFtZXRlcnMgZm9yIGluc3RhbnRpYXRpbmcgYW4gRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlciBpbmNsdWRlOlxuICpcbiAqICogYG9wdGlvbnNgIE9iamVjdCB3aXRoIGRldGFpbHMgYWJvdXQgdGhlIEVwaWNlbnRlciBwcm9qZWN0IGZvciB0aGlzIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXIgaW5zdGFuY2UuXG4gKiAqIGBvcHRpb25zLmFjY291bnRgIFRoZSBFcGljZW50ZXIgYWNjb3VudCBpZCAoKipUZWFtIElEKiogZm9yIHRlYW0gcHJvamVjdHMsICoqVXNlciBJRCoqIGZvciBwZXJzb25hbCBwcm9qZWN0cykuXG4gKiAqIGBvcHRpb25zLnByb2plY3RgIEVwaWNlbnRlciBwcm9qZWN0IGlkLlxuICogKiBgb3B0aW9ucy51c2VyTmFtZWAgRXBpY2VudGVyIHVzZXJOYW1lIHVzZWQgZm9yIGF1dGhlbnRpY2F0aW9uLlxuICogKiBgb3B0aW9ucy51c2VySWRgIEVwaWNlbnRlciB1c2VyIGlkIHVzZWQgZm9yIGF1dGhlbnRpY2F0aW9uLiBPcHRpb25hbDsgYG9wdGlvbnMudXNlck5hbWVgIGlzIHByZWZlcnJlZC5cbiAqICogYG9wdGlvbnMudG9rZW5gIEVwaWNlbnRlciB0b2tlbiB1c2VkIGZvciBhdXRoZW50aWNhdGlvbi4gKFlvdSBjYW4gcmV0cmlldmUgdGhpcyB1c2luZyBgYXV0aE1hbmFnZXIuZ2V0VG9rZW4oKWAgZnJvbSB0aGUgW0F1dGhvcml6YXRpb24gTWFuYWdlcl0oLi4vYXV0aC1tYW5hZ2VyLykuKVxuICogKiBgb3B0aW9ucy5hbGxvd0FsbENoYW5uZWxzYCBJZiBub3QgaW5jbHVkZWQgb3IgaWYgc2V0IHRvIGBmYWxzZWAsIGFsbCBjaGFubmVsIHBhdGhzIGFyZSB2YWxpZGF0ZWQ7IGlmIHlvdXIgcHJvamVjdCByZXF1aXJlcyBbUHVzaCBDaGFubmVsIEF1dGhvcml6YXRpb25dKC4uLy4uLy4uL3VwZGF0aW5nX3lvdXJfc2V0dGluZ3MvKSwgeW91IHNob3VsZCB1c2UgdGhpcyBvcHRpb24uIElmIHlvdSB3YW50IHRvIGFsbG93IG90aGVyIGNoYW5uZWwgcGF0aHMsIHNldCB0byBgdHJ1ZWA7IHRoaXMgaXMgbm90IGNvbW1vbi5cbiAqL1xuXG52YXIgQ2hhbm5lbE1hbmFnZXIgPSByZXF1aXJlKCcuL2NoYW5uZWwtbWFuYWdlcicpO1xudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIHVybFNlcnZpY2UgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL3VybC1jb25maWctc2VydmljZScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG5cbnZhciBBdXRoTWFuYWdlciA9IHJlcXVpcmUoJy4vYXV0aC1tYW5hZ2VyJyk7XG5cbnZhciB2YWxpZFR5cGVzID0ge1xuICAgIHByb2plY3Q6IHRydWUsXG4gICAgZ3JvdXA6IHRydWUsXG4gICAgd29ybGQ6IHRydWUsXG4gICAgdXNlcjogdHJ1ZSxcbiAgICBkYXRhOiB0cnVlLFxuICAgIGdlbmVyYWw6IHRydWUsXG4gICAgY2hhdDogdHJ1ZVxufTtcbnZhciBzZXNzaW9uID0gbmV3IEF1dGhNYW5hZ2VyKCk7XG52YXIgZ2V0RnJvbVNldHRpbmdzT3JTZXNzaW9uT3JFcnJvciA9IGZ1bmN0aW9uICh2YWx1ZSwgc2Vzc2lvbktleU5hbWUsIHNldHRpbmdzKSB7XG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICB2YXIgdXNlckluZm8gPSBzZXNzaW9uLmdldEN1cnJlbnRVc2VyU2Vzc2lvbkluZm8oKTtcbiAgICAgICAgaWYgKHNldHRpbmdzICYmIHNldHRpbmdzW3Nlc3Npb25LZXlOYW1lXSkge1xuICAgICAgICAgICAgdmFsdWUgPSBzZXR0aW5nc1tzZXNzaW9uS2V5TmFtZV07XG4gICAgICAgIH0gZWxzZSBpZiAodXNlckluZm9bc2Vzc2lvbktleU5hbWVdKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHVzZXJJbmZvW3Nlc3Npb25LZXlOYW1lXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihzZXNzaW9uS2V5TmFtZSArICcgbm90IGZvdW5kLiBQbGVhc2UgbG9nLWluIGFnYWluLCBvciBzcGVjaWZ5ICcgKyBzZXNzaW9uS2V5TmFtZSArICcgZXhwbGljaXRseScpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn07XG52YXIgX19zdXBlciA9IENoYW5uZWxNYW5hZ2VyLnByb3RvdHlwZTtcbnZhciBFcGljZW50ZXJDaGFubmVsTWFuYWdlciA9IGNsYXNzRnJvbShDaGFubmVsTWFuYWdlciwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKCk7XG4gICAgICAgIHZhciBkZWZhdWx0Q29tZXRPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKG9wdGlvbnMpO1xuXG4gICAgICAgIHZhciB1cmxPcHRzID0gdXJsU2VydmljZShkZWZhdWx0Q29tZXRPcHRpb25zLnNlcnZlcik7XG4gICAgICAgIGlmICghZGVmYXVsdENvbWV0T3B0aW9ucy51cmwpIHtcbiAgICAgICAgICAgIC8vRGVmYXVsdCBlcGljZW50ZXIgY29tZXRkIGVuZHBvaW50XG4gICAgICAgICAgICBkZWZhdWx0Q29tZXRPcHRpb25zLnVybCA9IHVybE9wdHMucHJvdG9jb2wgKyAnOi8vJyArIHVybE9wdHMuaG9zdCArICcvY2hhbm5lbC9zdWJzY3JpYmUnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRlZmF1bHRDb21ldE9wdGlvbnMuaGFuZHNoYWtlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHZhciB1c2VyTmFtZSA9IGRlZmF1bHRDb21ldE9wdGlvbnMudXNlck5hbWU7XG4gICAgICAgICAgICB2YXIgdXNlcklkID0gZGVmYXVsdENvbWV0T3B0aW9ucy51c2VySWQ7XG4gICAgICAgICAgICB2YXIgdG9rZW4gPSBkZWZhdWx0Q29tZXRPcHRpb25zLnRva2VuO1xuICAgICAgICAgICAgaWYgKCh1c2VyTmFtZSB8fCB1c2VySWQpICYmIHRva2VuKSB7XG4gICAgICAgICAgICAgICAgdmFyIHVzZXJQcm9wID0gdXNlck5hbWUgPyAndXNlck5hbWUnIDogJ3VzZXJJZCc7XG4gICAgICAgICAgICAgICAgdmFyIGV4dCA9IHtcbiAgICAgICAgICAgICAgICAgICAgYXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rZW5cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGV4dFt1c2VyUHJvcF0gPSB1c2VyTmFtZSA/IHVzZXJOYW1lIDogdXNlcklkO1xuXG4gICAgICAgICAgICAgICAgZGVmYXVsdENvbWV0T3B0aW9ucy5oYW5kc2hha2UgPSB7XG4gICAgICAgICAgICAgICAgICAgIGV4dDogZXh0XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IGRlZmF1bHRDb21ldE9wdGlvbnM7XG4gICAgICAgIHJldHVybiBfX3N1cGVyLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgZGVmYXVsdENvbWV0T3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW5kIHJldHVybnMgYSBjaGFubmVsLCB0aGF0IGlzLCBhbiBpbnN0YW5jZSBvZiBhIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pLlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgZW5mb3JjZXMgRXBpY2VudGVyLXNwZWNpZmljIGNoYW5uZWwgbmFtaW5nOiBhbGwgY2hhbm5lbHMgcmVxdWVzdGVkIG11c3QgYmUgaW4gdGhlIGZvcm0gYC97dHlwZX0ve2FjY291bnQgaWR9L3twcm9qZWN0IGlkfS97Li4ufWAsIHdoZXJlIGB0eXBlYCBpcyBvbmUgb2YgYHJ1bmAsIGBkYXRhYCwgYHVzZXJgLCBgd29ybGRgLCBvciBgY2hhdGAuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkVwaWNlbnRlckNoYW5uZWxNYW5hZ2VyKCk7XG4gICAgICogICAgICB2YXIgY2hhbm5lbCA9IGNtLmdldENoYW5uZWwoJy9ncm91cC9hY21lL3N1cHBseS1jaGFpbi1nYW1lLycpO1xuICAgICAqXG4gICAgICogICAgICBjaGFubmVsLnN1YnNjcmliZSgndG9waWMnLCBjYWxsYmFjayk7XG4gICAgICogICAgICBjaGFubmVsLnB1Ymxpc2goJ3RvcGljJywgeyBteURhdGE6IDEwMCB9KTtcbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSBvcHRpb25zIChPcHRpb25hbCkgSWYgc3RyaW5nLCBhc3N1bWVkIHRvIGJlIHRoZSBiYXNlIGNoYW5uZWwgdXJsLiBJZiBvYmplY3QsIGFzc3VtZWQgdG8gYmUgY29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgY29uc3RydWN0b3IuXG4gICAgICogQHJldHVybiB7Q2hhbm5lbH0gQ2hhbm5lbCBpbnN0YW5jZVxuICAgICAqL1xuICAgIGdldENoYW5uZWw6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zICYmIHR5cGVvZiBvcHRpb25zICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICBiYXNlOiBvcHRpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBjaGFubmVsT3B0cyA9ICQuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICB2YXIgYmFzZSA9IGNoYW5uZWxPcHRzLmJhc2U7XG4gICAgICAgIGlmICghYmFzZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBiYXNlIHRvcGljIHdhcyBwcm92aWRlZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjaGFubmVsT3B0cy5hbGxvd0FsbENoYW5uZWxzKSB7XG4gICAgICAgICAgICB2YXIgYmFzZVBhcnRzID0gYmFzZS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgdmFyIGNoYW5uZWxUeXBlID0gYmFzZVBhcnRzWzFdO1xuICAgICAgICAgICAgaWYgKGJhc2VQYXJ0cy5sZW5ndGggPCA0KSB7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjaGFubmVsIGJhc2UgbmFtZSwgaXQgbXVzdCBiZSBpbiB0aGUgZm9ybSAve3R5cGV9L3thY2NvdW50IGlkfS97cHJvamVjdCBpZH0vey4uLn0nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdmFsaWRUeXBlc1tjaGFubmVsVHlwZV0pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY2hhbm5lbCB0eXBlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9fc3VwZXIuZ2V0Q2hhbm5lbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYW5kIHJldHVybiBhIHB1Ymxpc2gvc3Vic2NyaWJlIGNoYW5uZWwgKGZyb20gdGhlIHVuZGVybHlpbmcgW0NoYW5uZWwgTWFuYWdlcl0oLi4vY2hhbm5lbC1tYW5hZ2VyLykpIGZvciB0aGUgZ2l2ZW4gW2dyb3VwXSguLi8uLi8uLi9nbG9zc2FyeS8jZ3JvdXBzKS4gVGhlIGdyb3VwIG11c3QgZXhpc3QgaW4gdGhlIGFjY291bnQgKHRlYW0pIGFuZCBwcm9qZWN0IHByb3ZpZGVkLlxuICAgICAqXG4gICAgICogVGhlcmUgYXJlIG5vIG5vdGlmaWNhdGlvbnMgZnJvbSBFcGljZW50ZXIgb24gdGhpcyBjaGFubmVsOyBhbGwgbWVzc2FnZXMgYXJlIHVzZXItb3JpZ2luYXRlZC5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgdmFyIGNtID0gbmV3IEYubWFuYWdlci5DaGFubmVsTWFuYWdlcigpO1xuICAgICAqICAgICB2YXIgZ2MgPSBjbS5nZXRHcm91cENoYW5uZWwoKTtcbiAgICAgKiAgICAgZ2Muc3Vic2NyaWJlKCdicm9hZGNhc3RzJywgY2FsbGJhY2spO1xuICAgICAqXG4gICAgICogKipSZXR1cm4gVmFsdWUqKlxuICAgICAqXG4gICAgICogKiAqQ2hhbm5lbCogUmV0dXJucyB0aGUgY2hhbm5lbCAoYW4gaW5zdGFuY2Ugb2YgdGhlIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pKS5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGdyb3VwTmFtZSAoT3B0aW9uYWwpIEdyb3VwIHRvIGJyb2FkY2FzdCB0by4gSWYgbm90IHByb3ZpZGVkLCBwaWNrcyB1cCBncm91cCBmcm9tIGN1cnJlbnQgc2Vzc2lvbiBpZiBlbmQgdXNlciBpcyBsb2dnZWQgaW4uXG4gICAgICogQHJldHVybiB7Q2hhbm5lbH0gQ2hhbm5lbCBpbnN0YW5jZVxuICAgICAqL1xuICAgIGdldEdyb3VwQ2hhbm5lbDogZnVuY3Rpb24gKGdyb3VwTmFtZSkge1xuICAgICAgICBncm91cE5hbWUgPSBnZXRGcm9tU2V0dGluZ3NPclNlc3Npb25PckVycm9yKGdyb3VwTmFtZSwgJ2dyb3VwTmFtZScsIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIHZhciBhY2NvdW50ID0gZ2V0RnJvbVNldHRpbmdzT3JTZXNzaW9uT3JFcnJvcignJywgJ2FjY291bnQnLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICB2YXIgcHJvamVjdCA9IGdldEZyb21TZXR0aW5nc09yU2Vzc2lvbk9yRXJyb3IoJycsICdwcm9qZWN0JywgdGhpcy5vcHRpb25zKTtcblxuICAgICAgICB2YXIgYmFzZVRvcGljID0gWycvZ3JvdXAnLCBhY2NvdW50LCBwcm9qZWN0LCBncm91cE5hbWVdLmpvaW4oJy8nKTtcbiAgICAgICAgcmV0dXJuIF9fc3VwZXIuZ2V0Q2hhbm5lbC5jYWxsKHRoaXMsIHsgYmFzZTogYmFzZVRvcGljIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYW5kIHJldHVybiBhIHB1Ymxpc2gvc3Vic2NyaWJlIGNoYW5uZWwgKGZyb20gdGhlIHVuZGVybHlpbmcgW0NoYW5uZWwgTWFuYWdlcl0oLi4vY2hhbm5lbC1tYW5hZ2VyLykpIGZvciB0aGUgZ2l2ZW4gW3dvcmxkXSguLi8uLi8uLi9nbG9zc2FyeS8jd29ybGQpLlxuICAgICAqXG4gICAgICogVGhpcyBpcyB0eXBpY2FsbHkgdXNlZCB0b2dldGhlciB3aXRoIHRoZSBbV29ybGQgTWFuYWdlcl0oLi4vd29ybGQtbWFuYWdlcikuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgIHZhciBjbSA9IG5ldyBGLm1hbmFnZXIuQ2hhbm5lbE1hbmFnZXIoKTtcbiAgICAgKiAgICAgdmFyIHdvcmxkTWFuYWdlciA9IG5ldyBGLm1hbmFnZXIuV29ybGRNYW5hZ2VyKHtcbiAgICAgKiAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgKiAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICogICAgICAgICBncm91cDogJ3RlYW0xJyxcbiAgICAgKiAgICAgICAgIHJ1bjogeyBtb2RlbDogJ21vZGVsLmVxbicgfVxuICAgICAqICAgICB9KTtcbiAgICAgKiAgICAgd29ybGRNYW5hZ2VyLmdldEN1cnJlbnRXb3JsZCgpLnRoZW4oZnVuY3Rpb24gKHdvcmxkT2JqZWN0LCB3b3JsZEFkYXB0ZXIpIHtcbiAgICAgKiAgICAgICAgIHZhciB3b3JsZENoYW5uZWwgPSBjbS5nZXRXb3JsZENoYW5uZWwod29ybGRPYmplY3QpO1xuICAgICAqICAgICAgICAgd29ybGRDaGFubmVsLnN1YnNjcmliZSgnJywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgKiAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgKiAgICAgICAgIH0pO1xuICAgICAqICAgICAgfSk7XG4gICAgICpcbiAgICAgKiAqKlJldHVybiBWYWx1ZSoqXG4gICAgICpcbiAgICAgKiAqICpDaGFubmVsKiBSZXR1cm5zIHRoZSBjaGFubmVsIChhbiBpbnN0YW5jZSBvZiB0aGUgW0NoYW5uZWwgU2VydmljZV0oLi4vY2hhbm5lbC1zZXJ2aWNlLykpLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ3xPYmplY3R9IHdvcmxkIFRoZSB3b3JsZCBvYmplY3Qgb3IgaWQuXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBncm91cE5hbWUgKE9wdGlvbmFsKSBHcm91cCB0aGUgd29ybGQgZXhpc3RzIGluLiBJZiBub3QgcHJvdmlkZWQsIHBpY2tzIHVwIGdyb3VwIGZyb20gY3VycmVudCBzZXNzaW9uIGlmIGVuZCB1c2VyIGlzIGxvZ2dlZCBpbi5cbiAgICAgKiBAcmV0dXJuIHtDaGFubmVsfSBDaGFubmVsIGluc3RhbmNlXG4gICAgICovXG4gICAgZ2V0V29ybGRDaGFubmVsOiBmdW5jdGlvbiAod29ybGQsIGdyb3VwTmFtZSkge1xuICAgICAgICB2YXIgd29ybGRpZCA9ICgkLmlzUGxhaW5PYmplY3Qod29ybGQpICYmIHdvcmxkLmlkKSA/IHdvcmxkLmlkIDogd29ybGQ7XG4gICAgICAgIGlmICghd29ybGRpZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2Ugc3BlY2lmeSBhIHdvcmxkIGlkJyk7XG4gICAgICAgIH1cbiAgICAgICAgZ3JvdXBOYW1lID0gZ2V0RnJvbVNldHRpbmdzT3JTZXNzaW9uT3JFcnJvcihncm91cE5hbWUsICdncm91cE5hbWUnLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICB2YXIgYWNjb3VudCA9IGdldEZyb21TZXR0aW5nc09yU2Vzc2lvbk9yRXJyb3IoJycsICdhY2NvdW50JywgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgdmFyIHByb2plY3QgPSBnZXRGcm9tU2V0dGluZ3NPclNlc3Npb25PckVycm9yKCcnLCAncHJvamVjdCcsIHRoaXMub3B0aW9ucyk7XG5cbiAgICAgICAgdmFyIGJhc2VUb3BpYyA9IFsnL3dvcmxkJywgYWNjb3VudCwgcHJvamVjdCwgZ3JvdXBOYW1lLCB3b3JsZGlkXS5qb2luKCcvJyk7XG4gICAgICAgIHJldHVybiBfX3N1cGVyLmdldENoYW5uZWwuY2FsbCh0aGlzLCB7IGJhc2U6IGJhc2VUb3BpYyB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGFuZCByZXR1cm4gYSBwdWJsaXNoL3N1YnNjcmliZSBjaGFubmVsIChmcm9tIHRoZSB1bmRlcmx5aW5nIFtDaGFubmVsIE1hbmFnZXJdKC4uL2NoYW5uZWwtbWFuYWdlci8pKSBmb3IgdGhlIGN1cnJlbnQgW2VuZCB1c2VyXSguLi8uLi8uLi9nbG9zc2FyeS8jdXNlcnMpIGluIHRoYXQgdXNlcidzIGN1cnJlbnQgW3dvcmxkXSguLi8uLi8uLi9nbG9zc2FyeS8jd29ybGQpLlxuICAgICAqXG4gICAgICogVGhpcyBpcyB0eXBpY2FsbHkgdXNlZCB0b2dldGhlciB3aXRoIHRoZSBbV29ybGQgTWFuYWdlcl0oLi4vd29ybGQtbWFuYWdlcikuIE5vdGUgdGhhdCB0aGlzIGNoYW5uZWwgb25seSBnZXRzIG5vdGlmaWNhdGlvbnMgZm9yIHdvcmxkcyBjdXJyZW50bHkgaW4gbWVtb3J5LiAoU2VlIG1vcmUgYmFja2dyb3VuZCBvbiBbcGVyc2lzdGVuY2VdKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZSkuKVxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyKCk7XG4gICAgICogICAgIHZhciB3b3JsZE1hbmFnZXIgPSBuZXcgRi5tYW5hZ2VyLldvcmxkTWFuYWdlcih7XG4gICAgICogICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICogICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAqICAgICAgICAgZ3JvdXA6ICd0ZWFtMScsXG4gICAgICogICAgICAgICBydW46IHsgbW9kZWw6ICdtb2RlbC5lcW4nIH1cbiAgICAgKiAgICAgfSk7XG4gICAgICogICAgIHdvcmxkTWFuYWdlci5nZXRDdXJyZW50V29ybGQoKS50aGVuKGZ1bmN0aW9uICh3b3JsZE9iamVjdCwgd29ybGRBZGFwdGVyKSB7XG4gICAgICogICAgICAgICB2YXIgdXNlckNoYW5uZWwgPSBjbS5nZXRVc2VyQ2hhbm5lbCh3b3JsZE9iamVjdCk7XG4gICAgICogICAgICAgICB1c2VyQ2hhbm5lbC5zdWJzY3JpYmUoJycsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICogICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICogICAgICAgICB9KTtcbiAgICAgKiAgICAgIH0pO1xuICAgICAqXG4gICAgICpcbiAgICAgKiAqKlJldHVybiBWYWx1ZSoqXG4gICAgICpcbiAgICAgKiAqICpDaGFubmVsKiBSZXR1cm5zIHRoZSBjaGFubmVsIChhbiBpbnN0YW5jZSBvZiB0aGUgW0NoYW5uZWwgU2VydmljZV0oLi4vY2hhbm5lbC1zZXJ2aWNlLykpLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ3xPYmplY3R9IHdvcmxkIFdvcmxkIG9iamVjdCBvciBpZC5cbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd8T2JqZWN0fSB1c2VyIChPcHRpb25hbCkgVXNlciBvYmplY3Qgb3IgaWQuIElmIG5vdCBwcm92aWRlZCwgcGlja3MgdXAgdXNlciBpZCBmcm9tIGN1cnJlbnQgc2Vzc2lvbiBpZiBlbmQgdXNlciBpcyBsb2dnZWQgaW4uXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBncm91cE5hbWUgKE9wdGlvbmFsKSBHcm91cCB0aGUgd29ybGQgZXhpc3RzIGluLiBJZiBub3QgcHJvdmlkZWQsIHBpY2tzIHVwIGdyb3VwIGZyb20gY3VycmVudCBzZXNzaW9uIGlmIGVuZCB1c2VyIGlzIGxvZ2dlZCBpbi5cbiAgICAgKiBAcmV0dXJuIHtDaGFubmVsfSBDaGFubmVsIGluc3RhbmNlXG4gICAgICovXG4gICAgZ2V0VXNlckNoYW5uZWw6IGZ1bmN0aW9uICh3b3JsZCwgdXNlciwgZ3JvdXBOYW1lKSB7XG4gICAgICAgIHZhciB3b3JsZGlkID0gKCQuaXNQbGFpbk9iamVjdCh3b3JsZCkgJiYgd29ybGQuaWQpID8gd29ybGQuaWQgOiB3b3JsZDtcbiAgICAgICAgaWYgKCF3b3JsZGlkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSBzcGVjaWZ5IGEgd29ybGQgaWQnKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdXNlcmlkID0gKCQuaXNQbGFpbk9iamVjdCh1c2VyKSAmJiB1c2VyLmlkKSA/IHVzZXIuaWQgOiB1c2VyO1xuICAgICAgICB1c2VyaWQgPSBnZXRGcm9tU2V0dGluZ3NPclNlc3Npb25PckVycm9yKHVzZXJpZCwgJ3VzZXJJZCcsIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIGdyb3VwTmFtZSA9IGdldEZyb21TZXR0aW5nc09yU2Vzc2lvbk9yRXJyb3IoZ3JvdXBOYW1lLCAnZ3JvdXBOYW1lJywgdGhpcy5vcHRpb25zKTtcblxuICAgICAgICB2YXIgYWNjb3VudCA9IGdldEZyb21TZXR0aW5nc09yU2Vzc2lvbk9yRXJyb3IoJycsICdhY2NvdW50JywgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgdmFyIHByb2plY3QgPSBnZXRGcm9tU2V0dGluZ3NPclNlc3Npb25PckVycm9yKCcnLCAncHJvamVjdCcsIHRoaXMub3B0aW9ucyk7XG5cbiAgICAgICAgdmFyIGJhc2VUb3BpYyA9IFsnL3VzZXInLCBhY2NvdW50LCBwcm9qZWN0LCBncm91cE5hbWUsIHdvcmxkaWQsIHVzZXJpZF0uam9pbignLycpO1xuICAgICAgICByZXR1cm4gX19zdXBlci5nZXRDaGFubmVsLmNhbGwodGhpcywgeyBiYXNlOiBiYXNlVG9waWMgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgcHVibGlzaC9zdWJzY3JpYmUgY2hhbm5lbCAoZnJvbSB0aGUgdW5kZXJseWluZyBbQ2hhbm5lbCBNYW5hZ2VyXSguLi9jaGFubmVsLW1hbmFnZXIvKSkgdGhhdCBhdXRvbWF0aWNhbGx5IHRyYWNrcyB0aGUgcHJlc2VuY2Ugb2YgYW4gW2VuZCB1c2VyXSguLi8uLi8uLi9nbG9zc2FyeS8jdXNlcnMpLCB0aGF0IGlzLCB3aGV0aGVyIHRoZSBlbmQgdXNlciBpcyBjdXJyZW50bHkgb25saW5lIGluIHRoaXMgZ3JvdXAgYW5kIHdvcmxkLiBOb3RpZmljYXRpb25zIGFyZSBhdXRvbWF0aWNhbGx5IHNlbnQgd2hlbiB0aGUgZW5kIHVzZXIgY29tZXMgb25saW5lLCBhbmQgd2hlbiB0aGUgZW5kIHVzZXIgZ29lcyBvZmZsaW5lIChub3QgcHJlc2VudCBmb3IgbW9yZSB0aGFuIDIgbWludXRlcykuIFVzZWZ1bCBpbiBtdWx0aXBsYXllciBnYW1lcyBmb3IgbGV0dGluZyBlYWNoIGVuZCB1c2VyIGtub3cgd2hldGhlciBvdGhlciB1c2VycyBpbiB0aGVpciBzaGFyZWQgd29ybGQgYXJlIGFsc28gb25saW5lLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyKCk7XG4gICAgICogICAgIHZhciB3b3JsZE1hbmFnZXIgPSBuZXcgRi5tYW5hZ2VyLldvcmxkTWFuYWdlcih7XG4gICAgICogICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICogICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAqICAgICAgICAgbW9kZWw6ICdtb2RlbC5lcW4nXG4gICAgICogICAgIH0pO1xuICAgICAqICAgICB3b3JsZE1hbmFnZXIuZ2V0Q3VycmVudFdvcmxkKCkudGhlbihmdW5jdGlvbiAod29ybGRPYmplY3QsIHdvcmxkU2VydmljZSkge1xuICAgICAqICAgICAgICAgdmFyIHByZXNlbmNlQ2hhbm5lbCA9IGNtLmdldFByZXNlbmNlQ2hhbm5lbCh3b3JsZE9iamVjdCk7XG4gICAgICogICAgICAgICBwcmVzZW5jZUNoYW5uZWwub24oJ3ByZXNlbmNlJywgZnVuY3Rpb24gKGV2dCwgbm90aWZpY2F0aW9uKSB7XG4gICAgICogICAgICAgICAgICAgIGNvbnNvbGUubG9nKG5vdGlmaWNhdGlvbi5vbmxpbmUsIG5vdGlmaWNhdGlvbi51c2VySWQpO1xuICAgICAqICAgICAgICAgIH0pO1xuICAgICAqICAgICAgfSk7XG4gICAgICpcbiAgICAgKlxuICAgICAqICoqUmV0dXJuIFZhbHVlKipcbiAgICAgKlxuICAgICAqICogKkNoYW5uZWwqIFJldHVybnMgdGhlIGNoYW5uZWwgKGFuIGluc3RhbmNlIG9mIHRoZSBbQ2hhbm5lbCBTZXJ2aWNlXSguLi9jaGFubmVsLXNlcnZpY2UvKSkuXG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqXG4gICAgICogQHBhcmFtICB7U3RyaW5nfE9iamVjdH0gd29ybGQgV29ybGQgb2JqZWN0IG9yIGlkLlxuICAgICAqIEBwYXJhbSAge1N0cmluZ3xPYmplY3R9IHVzZXJpZCAoT3B0aW9uYWwpIFVzZXIgb2JqZWN0IG9yIGlkLiBJZiBub3QgcHJvdmlkZWQsIHBpY2tzIHVwIHVzZXIgaWQgZnJvbSBjdXJyZW50IHNlc3Npb24gaWYgZW5kIHVzZXIgaXMgbG9nZ2VkIGluLlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gZ3JvdXBOYW1lIChPcHRpb25hbCkgR3JvdXAgdGhlIHdvcmxkIGV4aXN0cyBpbi4gSWYgbm90IHByb3ZpZGVkLCBwaWNrcyB1cCBncm91cCBmcm9tIGN1cnJlbnQgc2Vzc2lvbiBpZiBlbmQgdXNlciBpcyBsb2dnZWQgaW4uXG4gICAgICogQHJldHVybiB7Q2hhbm5lbH0gQ2hhbm5lbCBpbnN0YW5jZVxuICAgICAqL1xuICAgIGdldFByZXNlbmNlQ2hhbm5lbDogZnVuY3Rpb24gKHdvcmxkLCB1c2VyaWQsIGdyb3VwTmFtZSkge1xuICAgICAgICB2YXIgd29ybGRpZCA9ICgkLmlzUGxhaW5PYmplY3Qod29ybGQpICYmIHdvcmxkLmlkKSA/IHdvcmxkLmlkIDogd29ybGQ7XG4gICAgICAgIGlmICghd29ybGRpZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2Ugc3BlY2lmeSBhIHdvcmxkIGlkJyk7XG4gICAgICAgIH1cbiAgICAgICAgdXNlcmlkID0gZ2V0RnJvbVNldHRpbmdzT3JTZXNzaW9uT3JFcnJvcih1c2VyaWQsICd1c2VySWQnLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICBncm91cE5hbWUgPSBnZXRGcm9tU2V0dGluZ3NPclNlc3Npb25PckVycm9yKGdyb3VwTmFtZSwgJ2dyb3VwTmFtZScsIHRoaXMub3B0aW9ucyk7XG5cbiAgICAgICAgdmFyIGFjY291bnQgPSBnZXRGcm9tU2V0dGluZ3NPclNlc3Npb25PckVycm9yKCcnLCAnYWNjb3VudCcsIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIHZhciBwcm9qZWN0ID0gZ2V0RnJvbVNldHRpbmdzT3JTZXNzaW9uT3JFcnJvcignJywgJ3Byb2plY3QnLCB0aGlzLm9wdGlvbnMpO1xuXG4gICAgICAgIHZhciBiYXNlVG9waWMgPSBbJy91c2VyJywgYWNjb3VudCwgcHJvamVjdCwgZ3JvdXBOYW1lLCB3b3JsZGlkXS5qb2luKCcvJyk7XG4gICAgICAgIHZhciBjaGFubmVsID0gX19zdXBlci5nZXRDaGFubmVsLmNhbGwodGhpcywgeyBiYXNlOiBiYXNlVG9waWMgfSk7XG5cbiAgICAgICAgdmFyIGxhc3RQaW5nVGltZSA9IHsgfTtcblxuICAgICAgICB2YXIgUElOR19JTlRFUlZBTCA9IDYwMDA7XG4gICAgICAgIGNoYW5uZWwuc3Vic2NyaWJlKCdpbnRlcm5hbC1waW5nLWNoYW5uZWwnLCBmdW5jdGlvbiAobm90aWZpY2F0aW9uKSB7XG4gICAgICAgICAgICB2YXIgaW5jb21pbmdVc2VySWQgPSBub3RpZmljYXRpb24uZGF0YS51c2VyO1xuICAgICAgICAgICAgaWYgKCFsYXN0UGluZ1RpbWVbaW5jb21pbmdVc2VySWRdICYmIGluY29taW5nVXNlcklkICE9PSB1c2VyaWQpIHtcbiAgICAgICAgICAgICAgICBjaGFubmVsLnRyaWdnZXIoJ3ByZXNlbmNlJywgeyB1c2VySWQ6IGluY29taW5nVXNlcklkLCBvbmxpbmU6IHRydWUgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYXN0UGluZ1RpbWVbaW5jb21pbmdVc2VySWRdID0gKG5ldyBEYXRlKCkpLnZhbHVlT2YoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hhbm5lbC5wdWJsaXNoKCdpbnRlcm5hbC1waW5nLWNoYW5uZWwnLCB7IHVzZXI6IHVzZXJpZCB9KTtcblxuICAgICAgICAgICAgJC5lYWNoKGxhc3RQaW5nVGltZSwgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbm93ID0gKG5ldyBEYXRlKCkpLnZhbHVlT2YoKTtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUgKyAoUElOR19JTlRFUlZBTCAqIDIpIDwgbm93KSB7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RQaW5nVGltZVtrZXldID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgY2hhbm5lbC50cmlnZ2VyKCdwcmVzZW5jZScsIHsgdXNlcklkOiBrZXksIG9ubGluZTogZmFsc2UgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIFBJTkdfSU5URVJWQUwpO1xuXG4gICAgICAgIHJldHVybiBjaGFubmVsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYW5kIHJldHVybiBhIHB1Ymxpc2gvc3Vic2NyaWJlIGNoYW5uZWwgKGZyb20gdGhlIHVuZGVybHlpbmcgW0NoYW5uZWwgTWFuYWdlcl0oLi4vY2hhbm5lbC1tYW5hZ2VyLykpIGZvciB0aGUgZ2l2ZW4gY29sbGVjdGlvbi4gKFRoZSBjb2xsZWN0aW9uIG5hbWUgaXMgc3BlY2lmaWVkIGluIHRoZSBgcm9vdGAgYXJndW1lbnQgd2hlbiB0aGUgW0RhdGEgU2VydmljZV0oLi4vZGF0YS1hcGktc2VydmljZS8pIGlzIGluc3RhbnRpYXRlZC4pIE11c3QgYmUgb25lIG9mIHRoZSBjb2xsZWN0aW9ucyBpbiB0aGlzIGFjY291bnQgKHRlYW0pIGFuZCBwcm9qZWN0LlxuICAgICAqXG4gICAgICogVGhlcmUgYXJlIGF1dG9tYXRpYyBub3RpZmljYXRpb25zIGZyb20gRXBpY2VudGVyIG9uIHRoaXMgY2hhbm5lbCB3aGVuIGRhdGEgaXMgY3JlYXRlZCwgdXBkYXRlZCwgb3IgZGVsZXRlZCBpbiB0aGlzIGNvbGxlY3Rpb24uIFNlZSBtb3JlIG9uIFthdXRvbWF0aWMgbWVzc2FnZXMgdG8gdGhlIGRhdGEgY2hhbm5lbF0oLi4vLi4vLi4vcmVzdF9hcGlzL211bHRpcGxheWVyL2NoYW5uZWwvI2RhdGEtbWVzc2FnZXMpLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyKCk7XG4gICAgICogICAgIHZhciBkYyA9IGNtLmdldERhdGFDaGFubmVsKCdzdXJ2ZXktcmVzcG9uc2VzJyk7XG4gICAgICogICAgIGRjLnN1YnNjcmliZSgnJywgZnVuY3Rpb24oZGF0YSwgbWV0YSkge1xuICAgICAqICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAqXG4gICAgICogICAgICAgICAgLy8gbWV0YS5kYXRlIGlzIHRpbWUgb2YgY2hhbmdlLFxuICAgICAqICAgICAgICAgIC8vIG1ldGEuc3ViVHlwZSBpcyB0aGUga2luZCBvZiBjaGFuZ2U6IG5ldywgdXBkYXRlLCBvciBkZWxldGVcbiAgICAgKiAgICAgICAgICAvLyBtZXRhLnBhdGggaXMgdGhlIGZ1bGwgcGF0aCB0byB0aGUgY2hhbmdlZCBkYXRhXG4gICAgICogICAgICAgICAgY29uc29sZS5sb2cobWV0YSk7XG4gICAgICogICAgIH0pO1xuICAgICAqXG4gICAgICogKipSZXR1cm4gVmFsdWUqKlxuICAgICAqXG4gICAgICogKiAqQ2hhbm5lbCogUmV0dXJucyB0aGUgY2hhbm5lbCAoYW4gaW5zdGFuY2Ugb2YgdGhlIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pKS5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGNvbGxlY3Rpb24gTmFtZSBvZiBjb2xsZWN0aW9uIHdob3NlIGF1dG9tYXRpYyBub3RpZmljYXRpb25zIHlvdSB3YW50IHRvIHJlY2VpdmUuXG4gICAgICogQHJldHVybiB7Q2hhbm5lbH0gQ2hhbm5lbCBpbnN0YW5jZVxuICAgICAqL1xuICAgIGdldERhdGFDaGFubmVsOiBmdW5jdGlvbiAoY29sbGVjdGlvbikge1xuICAgICAgICBpZiAoIWNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHNwZWNpZnkgYSBjb2xsZWN0aW9uIHRvIGxpc3RlbiBvbi4nKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYWNjb3VudCA9IGdldEZyb21TZXR0aW5nc09yU2Vzc2lvbk9yRXJyb3IoJycsICdhY2NvdW50JywgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgdmFyIHByb2plY3QgPSBnZXRGcm9tU2V0dGluZ3NPclNlc3Npb25PckVycm9yKCcnLCAncHJvamVjdCcsIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIHZhciBiYXNlVG9waWMgPSBbJy9kYXRhJywgYWNjb3VudCwgcHJvamVjdCwgY29sbGVjdGlvbl0uam9pbignLycpO1xuICAgICAgICB2YXIgY2hhbm5lbCA9IF9fc3VwZXIuZ2V0Q2hhbm5lbC5jYWxsKHRoaXMsIHsgYmFzZTogYmFzZVRvcGljIH0pO1xuXG4gICAgICAgIC8vVE9ETzogRml4IGFmdGVyIEVwaWNlbnRlciBidWcgaXMgcmVzb2x2ZWRcbiAgICAgICAgdmFyIG9sZHN1YnMgPSBjaGFubmVsLnN1YnNjcmliZTtcbiAgICAgICAgY2hhbm5lbC5zdWJzY3JpYmUgPSBmdW5jdGlvbiAodG9waWMsIGNhbGxiYWNrLCBjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tXaXRoQ2xlYW5EYXRhID0gZnVuY3Rpb24gKHBheWxvYWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWV0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogcGF5bG9hZC5jaGFubmVsLFxuICAgICAgICAgICAgICAgICAgICBzdWJUeXBlOiBwYXlsb2FkLmRhdGEuc3ViVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0ZTogcGF5bG9hZC5kYXRhLmRhdGVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciBhY3R1YWxEYXRhID0gcGF5bG9hZC5kYXRhLmRhdGE7XG4gICAgICAgICAgICAgICAgaWYgKGFjdHVhbERhdGEuZGF0YSkgeyAvL0RlbGV0ZSBub3RpZmljYXRpb25zIGFyZSBvbmUgZGF0YS1sZXZlbCBiZWhpbmQgb2YgY291cnNlXG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbERhdGEgPSBhY3R1YWxEYXRhLmRhdGE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBhY3R1YWxEYXRhLCBtZXRhKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gb2xkc3Vicy5jYWxsKGNoYW5uZWwsIHRvcGljLCBjYWxsYmFja1dpdGhDbGVhbkRhdGEsIGNvbnRleHQsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBjaGFubmVsO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVwaWNlbnRlckNoYW5uZWxNYW5hZ2VyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBFUElfU0VTU0lPTl9LRVk6ICdlcGljZW50ZXJqcy5zZXNzaW9uJyxcbiAgICBTVFJBVEVHWV9TRVNTSU9OX0tFWTogJ2VwaWNlbnRlci1zY2VuYXJpbydcbn07IiwiLyoqXG4qICMjIFJ1biBNYW5hZ2VyXG4qXG4qIFRoZSBSdW4gTWFuYWdlciBnaXZlcyB5b3UgYWNjZXNzIHRvIHJ1bnMgZm9yIHlvdXIgcHJvamVjdC4gVGhpcyBhbGxvd3MgeW91IHRvIHJlYWQgYW5kIHVwZGF0ZSB2YXJpYWJsZXMsIGNhbGwgb3BlcmF0aW9ucywgZXRjLiBBZGRpdGlvbmFsbHksIHRoZSBSdW4gTWFuYWdlciBnaXZlcyB5b3UgY29udHJvbCBvdmVyIHJ1biBjcmVhdGlvbiBkZXBlbmRpbmcgb24gcnVuIHN0YXRlcy4gU3BlY2lmaWNhbGx5LCB5b3UgY2FuIHNlbGVjdCBbcnVuIGNyZWF0aW9uIHN0cmF0ZWdpZXMgKHJ1bGVzKV0oLi4vLi4vc3RyYXRlZ3kvKSBmb3Igd2hpY2ggcnVucyBlbmQgdXNlcnMgb2YgeW91ciBwcm9qZWN0IHdvcmsgd2l0aCB3aGVuIHRoZXkgbG9nIGluIHRvIHlvdXIgcHJvamVjdC5cbipcbiogVGhlcmUgYXJlIG1hbnkgd2F5cyB0byBjcmVhdGUgbmV3IHJ1bnMsIGluY2x1ZGluZyB0aGUgRXBpY2VudGVyLmpzIFtSdW4gU2VydmljZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLyksIHRoZSBSRVNGVGZ1bCBbUnVuIEFQSV0oLi4vLi4vLi4vcmVzdF9hcGlzL2FnZ3JlZ2F0ZV9ydW5fYXBpKSBhbmQgdGhlIFtNb2RlbCBSdW4gQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvb3RoZXJfYXBpcy9tb2RlbF9hcGlzL3J1bi8pLiBIb3dldmVyLCBmb3Igc29tZSBwcm9qZWN0cyBpdCBtYWtlcyBtb3JlIHNlbnNlIHRvIHBpY2sgdXAgd2hlcmUgdGhlIHVzZXIgbGVmdCBvZmYsIHVzaW5nIGFuIGV4aXN0aW5nIHJ1bi4gQW5kIGluIHNvbWUgcHJvamVjdHMsIHdoZXRoZXIgdG8gY3JlYXRlIGEgbmV3IHJ1biBvciB1c2UgYW4gZXhpc3Rpbmcgb25lIGlzIGNvbmRpdGlvbmFsLCBmb3IgZXhhbXBsZSBiYXNlZCBvbiBjaGFyYWN0ZXJpc3RpY3Mgb2YgdGhlIGV4aXN0aW5nIHJ1biBvciB5b3VyIG93biBrbm93bGVkZ2UgYWJvdXQgdGhlIG1vZGVsLiBUaGUgUnVuIE1hbmFnZXIgcHJvdmlkZXMgdGhpcyBsZXZlbCBvZiBjb250cm9sOiB5b3VyIGNhbGwgdG8gYGdldFJ1bigpYCwgcmF0aGVyIHRoYW4gYWx3YXlzIHJldHVybmluZyBhIG5ldyBydW4sIHJldHVybnMgYSBydW4gYmFzZWQgb24gdGhlIHN0cmF0ZWd5IHlvdSd2ZSBzcGVjaWZpZWQuIChOb3RlIHRoYXQgbWFueSBvZiB0aGUgRXBpY2VudGVyIHNhbXBsZSBwcm9qZWN0cyB1c2UgYSBSdW4gU2VydmljZSBkaXJlY3RseSwgYmVjYXVzZSBnZW5lcmFsbHkgdGhlIHNhbXBsZSBwcm9qZWN0cyBhcmUgcGxheWVkIGluIG9uZSBlbmQgdXNlciBzZXNzaW9uIGFuZCBkb24ndCBjYXJlIGFib3V0IHJ1biBzdGF0ZXMgb3IgcnVuIHN0cmF0ZWdpZXMuKVxuKlxuKlxuKiAjIyMgVXNpbmcgdGhlIFJ1biBNYW5hZ2VyIHRvIGNyZWF0ZSBhbmQgYWNjZXNzIHJ1bnNcbipcbiogVG8gdXNlIHRoZSBSdW4gTWFuYWdlciwgaW5zdGFudGlhdGUgaXQgYnkgcGFzc2luZyBpbjpcbipcbiogICAqIGBydW5gOiAocmVxdWlyZWQpIFJ1biBvYmplY3QuIE11c3QgY29udGFpbjpcbiogICAgICAgKiBgYWNjb3VudGA6IEVwaWNlbnRlciBhY2NvdW50IGlkICgqKlRlYW0gSUQqKiBmb3IgdGVhbSBwcm9qZWN0cywgKipVc2VyIElEKiogZm9yIHBlcnNvbmFsIHByb2plY3RzKS5cbiogICAgICAgKiBgcHJvamVjdGA6IEVwaWNlbnRlciBwcm9qZWN0IGlkLlxuKiAgICAgICAqIGBtb2RlbGA6IFRoZSBuYW1lIG9mIHlvdXIgcHJpbWFyeSBtb2RlbCBmaWxlLiAoU2VlIG1vcmUgb24gW1dyaXRpbmcgeW91ciBNb2RlbF0oLi4vLi4vLi4vd3JpdGluZ195b3VyX21vZGVsLykuKVxuKiAgICAgICAqIGBzY29wZWA6IChvcHRpb25hbCkgU2NvcGUgb2JqZWN0IGZvciB0aGUgcnVuLCBmb3IgZXhhbXBsZSBgc2NvcGUuZ3JvdXBgIHdpdGggdmFsdWUgb2YgdGhlIG5hbWUgb2YgdGhlIGdyb3VwLlxuKiAgICAgICAqIGBzZXJ2ZXJgOiAob3B0aW9uYWwpIEFuIG9iamVjdCB3aXRoIG9uZSBmaWVsZCwgYGhvc3RgLiBUaGUgdmFsdWUgb2YgYGhvc3RgIGlzIHRoZSBzdHJpbmcgYGFwaS5mb3Jpby5jb21gLCB0aGUgVVJJIG9mIHRoZSBGb3JpbyBzZXJ2ZXIuIFRoaXMgaXMgYXV0b21hdGljYWxseSBzZXQsIGJ1dCB5b3UgY2FuIHBhc3MgaXQgZXhwbGljaXRseSBpZiBkZXNpcmVkLiBJdCBpcyBtb3N0IGNvbW1vbmx5IHVzZWQgZm9yIGNsYXJpdHkgd2hlbiB5b3UgYXJlIFtob3N0aW5nIGFuIEVwaWNlbnRlciBwcm9qZWN0IG9uIHlvdXIgb3duIHNlcnZlcl0oLi4vLi4vLi4vaG93X3RvL3NlbGZfaG9zdGluZy8pLlxuKiAgICAgICAqIGBmaWxlc2A6IChvcHRpb25hbCkgSWYgYW5kIG9ubHkgaWYgeW91IGFyZSB1c2luZyBhIFZlbnNpbSBtb2RlbCBhbmQgeW91IGhhdmUgYWRkaXRpb25hbCBkYXRhIHRvIHBhc3MgaW4gdG8geW91ciBtb2RlbCwgeW91IGNhbiBwYXNzIGEgYGZpbGVzYCBvYmplY3Qgd2l0aCB0aGUgbmFtZXMgb2YgdGhlIGZpbGVzLCBmb3IgZXhhbXBsZTogYFwiZmlsZXNcIjoge1wiZGF0YVwiOiBcIm15RXh0cmFEYXRhLnhsc1wifWAuIChOb3RlIHRoYXQgeW91J2xsIGFsc28gbmVlZCB0byBhZGQgdGhpcyBzYW1lIGZpbGVzIG9iamVjdCB0byB5b3VyIFZlbnNpbSBbY29uZmlndXJhdGlvbiBmaWxlXSguLi8uLi8uLi9tb2RlbF9jb2RlL3ZlbnNpbS8pLikgU2VlIHRoZSBbdW5kZXJseWluZyBNb2RlbCBSdW4gQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvb3RoZXJfYXBpcy9tb2RlbF9hcGlzL3J1bi8jcG9zdC1jcmVhdGluZy1hLW5ldy1ydW4tZm9yLXRoaXMtcHJvamVjdCkgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24uXG4qXG4qICAgKiBgc3RyYXRlZ3lgOiAob3B0aW9uYWwpIFJ1biBjcmVhdGlvbiBzdHJhdGVneSBmb3Igd2hlbiB0byBjcmVhdGUgYSBuZXcgcnVuIGFuZCB3aGVuIHRvIHJldXNlIGFuIGVuZCB1c2VyJ3MgZXhpc3RpbmcgcnVuLiBTZWUgW1J1biBNYW5hZ2VyIFN0cmF0ZWdpZXNdKC4uLy4uL3N0cmF0ZWd5LykgZm9yIGRldGFpbHMuIERlZmF1bHRzIHRvIGBuZXctaWYtaW5pdGlhbGl6ZWRgLlxuKlxuKiAgICogYHNlc3Npb25LZXlgOiAob3B0aW9uYWwpIE5hbWUgb2YgYnJvd3NlciBjb29raWUgaW4gd2hpY2ggdG8gc3RvcmUgcnVuIGluZm9ybWF0aW9uLCBpbmNsdWRpbmcgcnVuIGlkLiBNYW55IGNvbmRpdGlvbmFsIHN0cmF0ZWdpZXMsIGluY2x1ZGluZyB0aGUgcHJvdmlkZWQgc3RyYXRlZ2llcywgcmVseSBvbiB0aGlzIGJyb3dzZXIgY29va2llIHRvIHN0b3JlIHRoZSBydW4gaWQgYW5kIGhlbHAgbWFrZSB0aGUgZGVjaXNpb24gb2Ygd2hldGhlciB0byBjcmVhdGUgYSBuZXcgcnVuIG9yIHVzZSBhbiBleGlzdGluZyBvbmUuIFRoZSBuYW1lIG9mIHRoaXMgY29va2llIGRlZmF1bHRzIHRvIGBlcGljZW50ZXItc2NlbmFyaW9gIGFuZCBjYW4gYmUgc2V0IHdpdGggdGhlIGBzZXNzaW9uS2V5YCBwYXJhbWV0ZXIuXG4qXG4qXG4qIEFmdGVyIGluc3RhbnRpYXRpbmcgYSBSdW4gTWFuYWdlciwgbWFrZSBhIGNhbGwgdG8gYGdldFJ1bigpYCB3aGVuZXZlciB5b3UgbmVlZCB0byBhY2Nlc3MgYSBydW4gZm9yIHRoaXMgZW5kIHVzZXIuIFRoZSBgUnVuTWFuYWdlci5ydW5gIGNvbnRhaW5zIHRoZSBpbnN0YW50aWF0ZWQgW1J1biBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKS4gVGhlIFJ1biBTZXJ2aWNlIGFsbG93cyB5b3UgdG8gYWNjZXNzIHZhcmlhYmxlcywgY2FsbCBvcGVyYXRpb25zLCBldGMuXG4qXG4qICoqRXhhbXBsZSoqXG4qXG4qICAgICAgIHZhciBybSA9IG5ldyBGLm1hbmFnZXIuUnVuTWFuYWdlcih7XG4qICAgICAgICAgICBydW46IHtcbiogICAgICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4qICAgICAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiogICAgICAgICAgICAgICBtb2RlbDogJ3N1cHBseS1jaGFpbi1tb2RlbC5qbCcsXG4qICAgICAgICAgICAgICAgc2VydmVyOiB7IGhvc3Q6ICdhcGkuZm9yaW8uY29tJyB9XG4qICAgICAgICAgICB9LFxuKiAgICAgICAgICAgc3RyYXRlZ3k6ICdhbHdheXMtbmV3JyxcbiogICAgICAgICAgIHNlc3Npb25LZXk6ICdlcGljZW50ZXItc2Vzc2lvbidcbiogICAgICAgfSk7XG4qICAgICAgIHJtLmdldFJ1bigpXG4qICAgICAgICAgICAudGhlbihmdW5jdGlvbihydW4pIHtcbiogICAgICAgICAgICAgICAvLyB0aGUgcmV0dXJuIHZhbHVlIG9mIGdldFJ1bigpIGlzIGEgcnVuIG9iamVjdFxuKiAgICAgICAgICAgICAgIHZhciB0aGlzUnVuSWQgPSBydW4uaWQ7XG4qICAgICAgICAgICAgICAgLy8gdGhlIFJ1bk1hbmFnZXIucnVuIGFsc28gY29udGFpbnMgdGhlIGluc3RhbnRpYXRlZCBSdW4gU2VydmljZSxcbiogICAgICAgICAgICAgICAvLyBzbyBhbnkgUnVuIFNlcnZpY2UgbWV0aG9kIGlzIHZhbGlkIGhlcmVcbiogICAgICAgICAgICAgICBybS5ydW4uZG8oJ3J1bk1vZGVsJyk7XG4qICAgICAgIH0pXG4qXG4qL1xuXG4ndXNlIHN0cmljdCc7XG52YXIgc3RyYXRlZ2llc01hcCA9IHJlcXVpcmUoJy4vcnVuLXN0cmF0ZWdpZXMvc3RyYXRlZ2llcy1tYXAnKTtcbnZhciBzcGVjaWFsT3BlcmF0aW9ucyA9IHJlcXVpcmUoJy4vc3BlY2lhbC1vcGVyYXRpb25zJyk7XG52YXIgUnVuU2VydmljZSA9IHJlcXVpcmUoJy4uL3NlcnZpY2UvcnVuLWFwaS1zZXJ2aWNlJyk7XG5cblxuZnVuY3Rpb24gcGF0Y2hSdW5TZXJ2aWNlKHNlcnZpY2UsIG1hbmFnZXIpIHtcbiAgICBpZiAoc2VydmljZS5wYXRjaGVkKSB7XG4gICAgICAgIHJldHVybiBzZXJ2aWNlO1xuICAgIH1cblxuICAgIHZhciBvcmlnID0gc2VydmljZS5kbztcbiAgICBzZXJ2aWNlLmRvID0gZnVuY3Rpb24gKG9wZXJhdGlvbiwgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciByZXNlcnZlZE9wcyA9IE9iamVjdC5rZXlzKHNwZWNpYWxPcGVyYXRpb25zKTtcbiAgICAgICAgaWYgKHJlc2VydmVkT3BzLmluZGV4T2Yob3BlcmF0aW9uKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiBvcmlnLmFwcGx5KHNlcnZpY2UsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gc3BlY2lhbE9wZXJhdGlvbnNbb3BlcmF0aW9uXS5jYWxsKHNlcnZpY2UsIHBhcmFtcywgb3B0aW9ucywgbWFuYWdlcik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VydmljZS5wYXRjaGVkID0gdHJ1ZTtcblxuICAgIHJldHVybiBzZXJ2aWNlO1xufVxuXG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICAvKipcbiAgICAgKiBSdW4gY3JlYXRpb24gc3RyYXRlZ3kgZm9yIHdoZW4gdG8gY3JlYXRlIGEgbmV3IHJ1biBhbmQgd2hlbiB0byByZXVzZSBhbiBlbmQgdXNlcidzIGV4aXN0aW5nIHJ1bi4gU2VlIFtSdW4gTWFuYWdlciBTdHJhdGVnaWVzXSguLi8uLi9zdHJhdGVneS8pIGZvciBkZXRhaWxzLiBEZWZhdWx0cyB0byBgbmV3LWlmLWluaXRpYWxpemVkYC5cbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAqL1xuXG4gICAgc3RyYXRlZ3k6ICduZXctaWYtaW5pdGlhbGl6ZWQnXG59O1xuXG5mdW5jdGlvbiBSdW5NYW5hZ2VyKG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5ydW4gaW5zdGFuY2VvZiBSdW5TZXJ2aWNlKSB7XG4gICAgICAgIHRoaXMucnVuID0gdGhpcy5vcHRpb25zLnJ1bjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJ1biA9IG5ldyBSdW5TZXJ2aWNlKHRoaXMub3B0aW9ucy5ydW4pO1xuICAgIH1cblxuICAgIHBhdGNoUnVuU2VydmljZSh0aGlzLnJ1biwgdGhpcyk7XG5cbiAgICB2YXIgU3RyYXRlZ3lDdG9yID0gdHlwZW9mIHRoaXMub3B0aW9ucy5zdHJhdGVneSA9PT0gJ2Z1bmN0aW9uJyA/IHRoaXMub3B0aW9ucy5zdHJhdGVneSA6IHN0cmF0ZWdpZXNNYXBbdGhpcy5vcHRpb25zLnN0cmF0ZWd5XTtcblxuICAgIGlmICghU3RyYXRlZ3lDdG9yKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU3BlY2lmaWVkIHJ1biBjcmVhdGlvbiBzdHJhdGVneSB3YXMgaW52YWxpZDonLCB0aGlzLm9wdGlvbnMuc3RyYXRlZ3kpO1xuICAgIH1cblxuICAgIHRoaXMuc3RyYXRlZ3kgPSBuZXcgU3RyYXRlZ3lDdG9yKHRoaXMucnVuLCB0aGlzLm9wdGlvbnMpO1xufVxuXG5SdW5NYW5hZ2VyLnByb3RvdHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBydW4gb2JqZWN0IGZvciBhICdnb29kJyBydW4uXG4gICAgICpcbiAgICAgKiBBIGdvb2QgcnVuIGlzIGRlZmluZWQgYnkgdGhlIHN0cmF0ZWd5LiBGb3IgZXhhbXBsZSwgaWYgdGhlIHN0cmF0ZWd5IGlzIGBhbHdheXMtbmV3YCwgdGhlIGNhbGxcbiAgICAgKiB0byBgZ2V0UnVuKClgIGFsd2F5cyByZXR1cm5zIGEgbmV3bHkgY3JlYXRlZCBydW47IGlmIHRoZSBzdHJhdGVneSBpcyBgbmV3LWlmLXBlcnNpc3RlZGAsXG4gICAgICogYGdldFJ1bigpYCBjcmVhdGVzIGEgbmV3IHJ1biBpZiB0aGUgcHJldmlvdXMgcnVuIGlzIGluIGEgcGVyc2lzdGVkIHN0YXRlLCBvdGhlcndpc2VcbiAgICAgKiBpdCByZXR1cm5zIHRoZSBwcmV2aW91cyBydW4uIFNlZSBbUnVuIE1hbmFnZXIgU3RyYXRlZ2llc10oLi4vLi4vc3RyYXRlZ3kvKSBmb3IgbW9yZSBvbiBzdHJhdGVnaWVzLlxuICAgICAqXG4gICAgICogICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIHJtLmdldFJ1bigpLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAqICAgICAgICAgIC8vIHVzZSB0aGUgcnVuIG9iamVjdFxuICAgICAqICAgICAgICAgIHZhciB0aGlzUnVuSWQgPSBydW4uaWQ7XG4gICAgICpcbiAgICAgKiAgICAgICAgICAvLyB1c2UgdGhlIFJ1biBTZXJ2aWNlIG9iamVjdFxuICAgICAqICAgICAgICAgIHJtLnJ1bi5kbygncnVuTW9kZWwnKTtcbiAgICAgKiAgICAgIH0pO1xuICAgICAqXG4gICAgICogQHJldHVybiB7JHByb21pc2V9IFByb21pc2UgdG8gY29tcGxldGUgdGhlIGNhbGwuXG4gICAgICovXG4gICAgZ2V0UnVuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0cmF0ZWd5XG4gICAgICAgICAgICAgICAgLmdldFJ1bigpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBydW4gb2JqZWN0IGZvciBhIG5ldyBydW4sIHJlZ2FyZGxlc3Mgb2Ygc3RyYXRlZ3k6IGZvcmNlIGNyZWF0aW9uIG9mIGEgbmV3IHJ1bi5cbiAgICAgKlxuICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICBybS5yZXNldCgpLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAqICAgICAgICAgIC8vIHVzZSB0aGUgKG5ldykgcnVuIG9iamVjdFxuICAgICAqICAgICAgICAgIHZhciB0aGlzUnVuSWQgPSBydW4uaWQ7XG4gICAgICpcbiAgICAgKiAgICAgICAgICAvLyB1c2UgdGhlIFJ1biBTZXJ2aWNlIG9iamVjdFxuICAgICAqICAgICAgICAgIHJtLnJ1bi5kbygncnVuTW9kZWwnKTtcbiAgICAgKiAgICAgIH0pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcnVuU2VydmljZU9wdGlvbnMgVGhlIG9wdGlvbnMgb2JqZWN0IHRvIGNvbmZpZ3VyZSB0aGUgUnVuIFNlcnZpY2UuIFNlZSBbUnVuIEFQSSBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKSBmb3IgbW9yZS5cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqL1xuICAgIHJlc2V0OiBmdW5jdGlvbiAocnVuU2VydmljZU9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RyYXRlZ3kucmVzZXQocnVuU2VydmljZU9wdGlvbnMpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUnVuTWFuYWdlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIENvbmRpdGlvbmFsU3RyYXRlZ3kgPSByZXF1aXJlKCcuL2NvbmRpdGlvbmFsLWNyZWF0aW9uLXN0cmF0ZWd5Jyk7XG5cbnZhciBfX3N1cGVyID0gQ29uZGl0aW9uYWxTdHJhdGVneS5wcm90b3R5cGU7XG5cbnZhciBTdHJhdGVneSA9IGNsYXNzRnJvbShDb25kaXRpb25hbFN0cmF0ZWd5LCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChydW5TZXJ2aWNlLCBvcHRpb25zKSB7XG4gICAgICAgIF9fc3VwZXIuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBydW5TZXJ2aWNlLCB0aGlzLmNyZWF0ZUlmLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgY3JlYXRlSWY6IGZ1bmN0aW9uIChydW4sIGhlYWRlcnMpIHtcbiAgICAgICAgLy8gYWx3YXlzIGNyZWF0ZSBhIG5ldyBydW4hXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmF0ZWd5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vaWRlbnRpdHktc3RyYXRlZ3knKTtcbnZhciBTZXNzaW9uTWFuYWdlciA9IHJlcXVpcmUoJy4uLy4uL3N0b3JlL3Nlc3Npb24tbWFuYWdlcicpO1xudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIEF1dGhNYW5hZ2VyID0gcmVxdWlyZSgnLi4vYXV0aC1tYW5hZ2VyJyk7XG5cbnZhciBrZXlOYW1lcyA9IHJlcXVpcmUoJy4uL2tleS1uYW1lcycpO1xuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgc2Vzc2lvbktleToga2V5TmFtZXMuU1RSQVRFR1lfU0VTU0lPTl9LRVksXG4gICAgcGF0aDogJydcbn07XG5cbmZ1bmN0aW9uIHNldFJ1bkluU2Vzc2lvbihzZXNzaW9uS2V5LCBydW4sIHNlc3Npb25NYW5hZ2VyKSB7XG4gICAgc2Vzc2lvbk1hbmFnZXIuZ2V0U3RvcmUoKS5zZXQoc2Vzc2lvbktleSwgSlNPTi5zdHJpbmdpZnkoeyBydW5JZDogcnVuLmlkIH0pKTtcbn1cblxuLyoqXG4qIENvbmRpdGlvbmFsIENyZWF0aW9uIFN0cmF0ZWd5XG4qIFRoaXMgc3RyYXRlZ3kgd2lsbCB0cnkgdG8gZ2V0IHRoZSBydW4gc3RvcmVkIGluIHRoZSBjb29raWUgYW5kXG4qIGV2YWx1YXRlIGlmIG5lZWRzIHRvIGNyZWF0ZSBhIG5ldyBydW4gYnkgY2FsbGluZyB0aGUgJ2NvbmRpdGlvbicgZnVuY3Rpb25cbiovXG5cbi8qIGpzaGludCBlcW51bGw6IHRydWUgKi9cbnZhciBTdHJhdGVneSA9IGNsYXNzRnJvbShCYXNlLCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIFN0cmF0ZWd5KHJ1blNlcnZpY2UsIGNvbmRpdGlvbiwgb3B0aW9ucykge1xuICAgICAgICBpZiAoY29uZGl0aW9uID09PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbmRpdGlvbmFsIHN0cmF0ZWd5IG5lZWRzIGEgY29uZGl0aW9uIHRvIGNyZWF0ZSBhIHJ1bicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fYXV0aCA9IG5ldyBBdXRoTWFuYWdlcigpO1xuICAgICAgICB0aGlzLnJ1biA9IHJ1blNlcnZpY2U7XG4gICAgICAgIHRoaXMuY29uZGl0aW9uID0gdHlwZW9mIGNvbmRpdGlvbiAhPT0gJ2Z1bmN0aW9uJyA/IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGNvbmRpdGlvbjsgfSA6IGNvbmRpdGlvbjtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5zZXNzaW9uTWFuYWdlciA9IG5ldyBTZXNzaW9uTWFuYWdlcihvcHRpb25zKTtcbiAgICAgICAgdGhpcy5ydW5PcHRpb25zID0gdGhpcy5vcHRpb25zLnJ1bjtcbiAgICB9LFxuXG4gICAgcnVuT3B0aW9uc1dpdGhTY29wZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdXNlclNlc3Npb24gPSB0aGlzLl9hdXRoLmdldEN1cnJlbnRVc2VyU2Vzc2lvbkluZm8oKTtcbiAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHtcbiAgICAgICAgICAgIHNjb3BlOiB7IGdyb3VwOiB1c2VyU2Vzc2lvbi5ncm91cE5hbWUgfVxuICAgICAgICB9LCB0aGlzLnJ1bk9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gKHJ1blNlcnZpY2VPcHRpb25zKSB7XG4gICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgIHZhciBvcHQgPSB0aGlzLnJ1bk9wdGlvbnNXaXRoU2NvcGUoKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5ydW5cbiAgICAgICAgICAgICAgICAuY3JlYXRlKG9wdCwgcnVuU2VydmljZU9wdGlvbnMpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgICAgICAgICAgc2V0UnVuSW5TZXNzaW9uKG1lLm9wdGlvbnMuc2Vzc2lvbktleSwgcnVuLCBtZS5zZXNzaW9uTWFuYWdlcik7XG4gICAgICAgICAgICAgICAgcnVuLmZyZXNobHlDcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGdldFJ1bjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc2Vzc2lvblN0b3JlID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRTdG9yZSgpO1xuICAgICAgICB2YXIgcnVuU2Vzc2lvbiA9IEpTT04ucGFyc2Uoc2Vzc2lvblN0b3JlLmdldCh0aGlzLm9wdGlvbnMuc2Vzc2lvbktleSkpO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICBpZiAocnVuU2Vzc2lvbiAmJiBydW5TZXNzaW9uLnJ1bklkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbG9hZEFuZENoZWNrKHJ1blNlc3Npb24pLmZhaWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtZS5yZXNldCgpOyAvL2lmIGl0IGdvdCB0aGUgd3JvbmcgY29va2llIGZvciBlLmcuXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc2V0KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2xvYWRBbmRDaGVjazogZnVuY3Rpb24gKHJ1blNlc3Npb24pIHtcbiAgICAgICAgdmFyIHNob3VsZENyZWF0ZSA9IGZhbHNlO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnJ1blxuICAgICAgICAgICAgLmxvYWQocnVuU2Vzc2lvbi5ydW5JZCwgbnVsbCwge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChydW4sIG1zZywgaGVhZGVycykge1xuICAgICAgICAgICAgICAgICAgICBzaG91bGRDcmVhdGUgPSBtZS5jb25kaXRpb24ocnVuLCBoZWFkZXJzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgICAgIGlmIChzaG91bGRDcmVhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9wdCA9IG1lLnJ1bk9wdGlvbnNXaXRoU2NvcGUoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lLnJ1bi5jcmVhdGUob3B0KVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRSdW5JblNlc3Npb24obWUub3B0aW9ucy5zZXNzaW9uS2V5LCBydW4sIG1lLnNlc3Npb25NYW5hZ2VyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bi5mcmVzaGx5Q3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmF0ZWd5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgQmFzZSA9IHt9O1xuXG4vLyBJbnRlcmZhY2UgdGhhdCBhbGwgc3RyYXRlZ2llcyBuZWVkIHRvIGltcGxlbWVudFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzc0Zyb20oQmFzZSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAocnVuU2VydmljZSwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLnJ1blNlcnZpY2UgPSBydW5TZXJ2aWNlO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyByZXR1cm4gYSBuZXdseSBjcmVhdGVkIHJ1blxuICAgICAgICByZXR1cm4gJC5EZWZlcnJlZCgpLnJlc29sdmUoKS5wcm9taXNlKCk7XG4gICAgfSxcblxuICAgIGdldFJ1bjogZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyByZXR1cm4gYSB1c2FibGUgcnVuXG4gICAgICAgIHJldHVybiAkLkRlZmVycmVkKCkucmVzb2x2ZSh0aGlzLnJ1blNlcnZpY2UpLnByb21pc2UoKTtcbiAgICB9XG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xuXG52YXIgSWRlbnRpdHlTdHJhdGVneSA9IHJlcXVpcmUoJy4vaWRlbnRpdHktc3RyYXRlZ3knKTtcbnZhciBXb3JsZEFwaUFkYXB0ZXIgPSByZXF1aXJlKCcuLi8uLi9zZXJ2aWNlL3dvcmxkLWFwaS1hZGFwdGVyJyk7XG52YXIgQXV0aE1hbmFnZXIgPSByZXF1aXJlKCcuLi9hdXRoLW1hbmFnZXInKTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHN0b3JlOiB7XG4gICAgICAgIHN5bmNocm9ub3VzOiB0cnVlXG4gICAgfVxufTtcblxudmFyIFN0cmF0ZWd5ID0gY2xhc3NGcm9tKElkZW50aXR5U3RyYXRlZ3ksIHtcblxuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAocnVuU2VydmljZSwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLnJ1blNlcnZpY2UgPSBydW5TZXJ2aWNlO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9hdXRoID0gbmV3IEF1dGhNYW5hZ2VyKCk7XG4gICAgICAgIHRoaXMuX2xvYWRSdW4gPSB0aGlzLl9sb2FkUnVuLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMud29ybGRBcGkgPSBuZXcgV29ybGRBcGlBZGFwdGVyKHRoaXMub3B0aW9ucy5ydW4pO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuX2F1dGguZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbygpO1xuICAgICAgICB2YXIgY3VyVXNlcklkID0gc2Vzc2lvbi51c2VySWQ7XG4gICAgICAgIHZhciBjdXJHcm91cE5hbWUgPSBzZXNzaW9uLmdyb3VwTmFtZTtcblxuICAgICAgICByZXR1cm4gdGhpcy53b3JsZEFwaVxuICAgICAgICAgICAgLmdldEN1cnJlbnRXb3JsZEZvclVzZXIoY3VyVXNlcklkLCBjdXJHcm91cE5hbWUpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAod29ybGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53b3JsZEFwaS5uZXdSdW5Gb3JXb3JsZCh3b3JsZC5pZCk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBnZXRSdW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLl9hdXRoLmdldEN1cnJlbnRVc2VyU2Vzc2lvbkluZm8oKTtcbiAgICAgICAgdmFyIGN1clVzZXJJZCA9IHNlc3Npb24udXNlcklkO1xuICAgICAgICB2YXIgY3VyR3JvdXBOYW1lID0gc2Vzc2lvbi5ncm91cE5hbWU7XG4gICAgICAgIHZhciB3b3JsZEFwaSA9IHRoaXMud29ybGRBcGk7XG4gICAgICAgIHZhciBtb2RlbCA9IHRoaXMub3B0aW9ucy5tb2RlbDtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgdmFyIGR0ZCA9ICQuRGVmZXJyZWQoKTtcblxuICAgICAgICBpZiAoIWN1clVzZXJJZCkge1xuICAgICAgICAgICAgcmV0dXJuIGR0ZC5yZWplY3QoeyBzdGF0dXNDb2RlOiA0MDAsIGVycm9yOiAnV2UgbmVlZCBhbiBhdXRoZW50aWNhdGVkIHVzZXIgdG8gam9pbiBhIG11bHRpcGxheWVyIHdvcmxkLiAoRVJSOiBubyB1c2VySWQgaW4gc2Vzc2lvbiknIH0sIHNlc3Npb24pLnByb21pc2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsb2FkUnVuRnJvbVdvcmxkID0gZnVuY3Rpb24gKHdvcmxkKSB7XG4gICAgICAgICAgICBpZiAoIXdvcmxkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGR0ZC5yZWplY3QoeyBzdGF0dXNDb2RlOiA0MDQsIGVycm9yOiAnVGhlIHVzZXIgaXMgbm90IGluIGFueSB3b3JsZC4nIH0sIHsgb3B0aW9uczogbWUub3B0aW9ucywgc2Vzc2lvbjogc2Vzc2lvbiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkQXBpLmdldEN1cnJlbnRSdW5JZCh7IG1vZGVsOiBtb2RlbCwgZmlsdGVyOiB3b3JsZC5pZCB9KVxuICAgICAgICAgICAgICAgIC50aGVuKG1lLl9sb2FkUnVuKVxuICAgICAgICAgICAgICAgIC50aGVuKGR0ZC5yZXNvbHZlKVxuICAgICAgICAgICAgICAgIC5mYWlsKGR0ZC5yZWplY3QpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBzZXJ2ZXJFcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgLy8gaXMgdGhpcyBwb3NzaWJsZT9cbiAgICAgICAgICAgIGR0ZC5yZWplY3QoZXJyb3IsIHNlc3Npb24sIG1lLm9wdGlvbnMpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMud29ybGRBcGlcbiAgICAgICAgICAgIC5nZXRDdXJyZW50V29ybGRGb3JVc2VyKGN1clVzZXJJZCwgY3VyR3JvdXBOYW1lKVxuICAgICAgICAgICAgLnRoZW4obG9hZFJ1bkZyb21Xb3JsZClcbiAgICAgICAgICAgIC5mYWlsKHNlcnZlckVycm9yKTtcblxuICAgICAgICByZXR1cm4gZHRkLnByb21pc2UoKTtcbiAgICB9LFxuXG4gICAgX2xvYWRSdW46IGZ1bmN0aW9uIChpZCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW5TZXJ2aWNlLmxvYWQoaWQsIG51bGwsIG9wdGlvbnMpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmF0ZWd5O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIENvbmRpdGlvbmFsU3RyYXRlZ3kgPSByZXF1aXJlKCcuL2NvbmRpdGlvbmFsLWNyZWF0aW9uLXN0cmF0ZWd5Jyk7XG5cbnZhciBfX3N1cGVyID0gQ29uZGl0aW9uYWxTdHJhdGVneS5wcm90b3R5cGU7XG5cbnZhciBTdHJhdGVneSA9IGNsYXNzRnJvbShDb25kaXRpb25hbFN0cmF0ZWd5LCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChydW5TZXJ2aWNlLCBvcHRpb25zKSB7XG4gICAgICAgIF9fc3VwZXIuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBydW5TZXJ2aWNlLCB0aGlzLmNyZWF0ZUlmLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgY3JlYXRlSWY6IGZ1bmN0aW9uIChydW4sIGhlYWRlcnMpIHtcbiAgICAgICAgcmV0dXJuIGhlYWRlcnMuZ2V0UmVzcG9uc2VIZWFkZXIoJ3ByYWdtYScpID09PSAncGVyc2lzdGVudCcgfHwgcnVuLmluaXRpYWxpemVkO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmF0ZWd5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgQ29uZGl0aW9uYWxTdHJhdGVneSA9IHJlcXVpcmUoJy4vY29uZGl0aW9uYWwtY3JlYXRpb24tc3RyYXRlZ3knKTtcblxudmFyIF9fc3VwZXIgPSBDb25kaXRpb25hbFN0cmF0ZWd5LnByb3RvdHlwZTtcblxuLypcbiogIGNyZWF0ZSBhIG5ldyBydW4gb25seSBpZiBub3RoaW5nIGlzIHN0b3JlZCBpbiB0aGUgY29va2llXG4qICB0aGlzIGlzIHVzZWZ1bCBmb3IgYmFzZVJ1bnMuXG4qL1xudmFyIFN0cmF0ZWd5ID0gY2xhc3NGcm9tKENvbmRpdGlvbmFsU3RyYXRlZ3ksIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIG9wdGlvbnMpIHtcbiAgICAgICAgX19zdXBlci5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIHJ1blNlcnZpY2UsIHRoaXMuY3JlYXRlSWYsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICBjcmVhdGVJZjogZnVuY3Rpb24gKHJ1biwgaGVhZGVycykge1xuICAgICAgICAvLyBpZiB3ZSBhcmUgaGVyZSwgaXQgbWVhbnMgdGhhdCB0aGUgcnVuIGV4aXN0cy4uLiBzbyB3ZSBkb24ndCBuZWVkIGEgbmV3IG9uZVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RyYXRlZ3k7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgQ29uZGl0aW9uYWxTdHJhdGVneSA9IHJlcXVpcmUoJy4vY29uZGl0aW9uYWwtY3JlYXRpb24tc3RyYXRlZ3knKTtcblxudmFyIF9fc3VwZXIgPSBDb25kaXRpb25hbFN0cmF0ZWd5LnByb3RvdHlwZTtcblxudmFyIFN0cmF0ZWd5ID0gY2xhc3NGcm9tKENvbmRpdGlvbmFsU3RyYXRlZ3ksIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIG9wdGlvbnMpIHtcbiAgICAgICAgX19zdXBlci5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIHJ1blNlcnZpY2UsIHRoaXMuY3JlYXRlSWYsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICBjcmVhdGVJZjogZnVuY3Rpb24gKHJ1biwgaGVhZGVycykge1xuICAgICAgICByZXR1cm4gaGVhZGVycy5nZXRSZXNwb25zZUhlYWRlcigncHJhZ21hJykgPT09ICdwZXJzaXN0ZW50JztcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJhdGVneTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIElkZW50aXR5U3RyYXRlZ3kgPSByZXF1aXJlKCcuL2lkZW50aXR5LXN0cmF0ZWd5Jyk7XG52YXIgU3RvcmFnZUZhY3RvcnkgPSByZXF1aXJlKCcuLi8uLi9zdG9yZS9zdG9yZS1mYWN0b3J5Jyk7XG52YXIgU3RhdGVBcGkgPSByZXF1aXJlKCcuLi8uLi9zZXJ2aWNlL3N0YXRlLWFwaS1hZGFwdGVyJyk7XG52YXIgQXV0aE1hbmFnZXIgPSByZXF1aXJlKCcuLi9hdXRoLW1hbmFnZXInKTtcblxudmFyIGtleU5hbWVzID0gcmVxdWlyZSgnLi4va2V5LW5hbWVzJyk7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICBzdG9yZToge1xuICAgICAgICBzeW5jaHJvbm91czogdHJ1ZVxuICAgIH1cbn07XG5cbnZhciBTdHJhdGVneSA9IGNsYXNzRnJvbShJZGVudGl0eVN0cmF0ZWd5LCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIFN0cmF0ZWd5KHJ1blNlcnZpY2UsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5ydW4gPSBydW5TZXJ2aWNlO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLnJ1bk9wdGlvbnMgPSB0aGlzLm9wdGlvbnMucnVuO1xuICAgICAgICB0aGlzLl9zdG9yZSA9IG5ldyBTdG9yYWdlRmFjdG9yeSh0aGlzLm9wdGlvbnMuc3RvcmUpO1xuICAgICAgICB0aGlzLnN0YXRlQXBpID0gbmV3IFN0YXRlQXBpKCk7XG4gICAgICAgIHRoaXMuX2F1dGggPSBuZXcgQXV0aE1hbmFnZXIoKTtcblxuICAgICAgICB0aGlzLl9sb2FkQW5kQ2hlY2sgPSB0aGlzLl9sb2FkQW5kQ2hlY2suYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fcmVzdG9yZVJ1biA9IHRoaXMuX3Jlc3RvcmVSdW4uYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fZ2V0QWxsUnVucyA9IHRoaXMuX2dldEFsbFJ1bnMuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fbG9hZFJ1biA9IHRoaXMuX2xvYWRSdW4uYmluZCh0aGlzKTtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uIChydW5TZXJ2aWNlT3B0aW9ucykge1xuICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuX2F1dGguZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbygpO1xuICAgICAgICB2YXIgb3B0ID0gJC5leHRlbmQoe1xuICAgICAgICAgICAgc2NvcGU6IHsgZ3JvdXA6IHNlc3Npb24uZ3JvdXBOYW1lIH1cbiAgICAgICAgfSwgdGhpcy5ydW5PcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5ydW5cbiAgICAgICAgICAgIC5jcmVhdGUob3B0LCBydW5TZXJ2aWNlT3B0aW9ucylcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgICAgICAgICBydW4uZnJlc2hseUNyZWF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBydW47XG4gICAgICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZ2V0UnVuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRBbGxSdW5zKClcbiAgICAgICAgICAgIC50aGVuKHRoaXMuX2xvYWRBbmRDaGVjayk7XG4gICAgfSxcblxuICAgIF9nZXRBbGxSdW5zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzZXNzaW9uID0gSlNPTi5wYXJzZSh0aGlzLl9zdG9yZS5nZXQoa2V5TmFtZXMuRVBJX1NFU1NJT05fS0VZKSB8fCAne30nKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuLnF1ZXJ5KHtcbiAgICAgICAgICAgICd1c2VyLmlkJzogc2Vzc2lvbi51c2VySWQgfHwgJzAwMDAnLFxuICAgICAgICAgICAgJ3Njb3BlLmdyb3VwJzogc2Vzc2lvbi5ncm91cE5hbWVcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9sb2FkQW5kQ2hlY2s6IGZ1bmN0aW9uIChydW5zKSB7XG4gICAgICAgIGlmICghcnVucyB8fCAhcnVucy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc2V0KCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZGF0ZUNvbXAgPSBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gbmV3IERhdGUoYi5kYXRlKSAtIG5ldyBEYXRlKGEuZGF0ZSk7IH07XG4gICAgICAgIHZhciBsYXRlc3RSdW4gPSBydW5zLnNvcnQoZGF0ZUNvbXApWzBdO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICB2YXIgc2hvdWxkUmVwbGF5ID0gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMucnVuLmxvYWQobGF0ZXN0UnVuLmlkLCBudWxsLCB7XG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocnVuLCBtc2csIGhlYWRlcnMpIHtcbiAgICAgICAgICAgICAgICBzaG91bGRSZXBsYXkgPSBoZWFkZXJzLmdldFJlc3BvbnNlSGVhZGVyKCdwcmFnbWEnKSA9PT0gJ3BlcnNpc3RlbnQnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgICAgIHJldHVybiBzaG91bGRSZXBsYXkgPyBtZS5fcmVzdG9yZVJ1bihydW4uaWQpIDogcnVuO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX3Jlc3RvcmVSdW46IGZ1bmN0aW9uIChydW5JZCkge1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZUFwaS5yZXBsYXkoeyBydW5JZDogcnVuSWQgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1lLl9sb2FkUnVuKHJlc3AucnVuKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfbG9hZFJ1bjogZnVuY3Rpb24gKGlkLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1bi5sb2FkKGlkLCBudWxsLCBvcHRpb25zKTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmF0ZWd5O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgJ25ldy1pZi1pbml0aWFsaXplZCc6IHJlcXVpcmUoJy4vbmV3LWlmLWluaXRpYWxpemVkLXN0cmF0ZWd5JyksXG4gICAgJ25ldy1pZi1wZXJzaXN0ZWQnOiByZXF1aXJlKCcuL25ldy1pZi1wZXJzaXN0ZWQtc3RyYXRlZ3knKSxcbiAgICAnbmV3LWlmLW1pc3NpbmcnOiByZXF1aXJlKCcuL25ldy1pZi1taXNzaW5nLXN0cmF0ZWd5JyksXG4gICAgJ2Fsd2F5cy1uZXcnOiByZXF1aXJlKCcuL2Fsd2F5cy1uZXctc3RyYXRlZ3knKSxcbiAgICBtdWx0aXBsYXllcjogcmVxdWlyZSgnLi9tdWx0aXBsYXllci1zdHJhdGVneScpLFxuICAgICdwZXJzaXN0ZW50LXNpbmdsZS1wbGF5ZXInOiByZXF1aXJlKCcuL3BlcnNpc3RlbnQtc2luZ2xlLXBsYXllci1zdHJhdGVneScpLFxuICAgIG5vbmU6IHJlcXVpcmUoJy4vaWRlbnRpdHktc3RyYXRlZ3knKVxufTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBSdW5TZXJ2aWNlID0gcmVxdWlyZSgnLi4vc2VydmljZS9ydW4tYXBpLXNlcnZpY2UnKTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHZhbGlkRmlsdGVyOiB7IHNhdmVkOiB0cnVlIH1cbn07XG5cbmZ1bmN0aW9uIFNjZW5hcmlvTWFuYWdlcihvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICB0aGlzLnJ1blNlcnZpY2UgPSB0aGlzLm9wdGlvbnMucnVuIHx8IG5ldyBSdW5TZXJ2aWNlKHRoaXMub3B0aW9ucyk7XG59XG5cblNjZW5hcmlvTWFuYWdlci5wcm90b3R5cGUgPSB7XG4gICAgZ2V0UnVuczogZnVuY3Rpb24gKGZpbHRlcikge1xuICAgICAgICB0aGlzLmZpbHRlciA9ICQuZXh0ZW5kKHRydWUsIHt9LCB0aGlzLm9wdGlvbnMudmFsaWRGaWx0ZXIsIGZpbHRlcik7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1blNlcnZpY2UucXVlcnkodGhpcy5maWx0ZXIpO1xuICAgIH0sXG5cbiAgICBsb2FkVmFyaWFibGVzOiBmdW5jdGlvbiAodmFycykge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW5TZXJ2aWNlLnF1ZXJ5KHRoaXMuZmlsdGVyLCB7IGluY2x1ZGU6IHZhcnMgfSk7XG4gICAgfSxcblxuICAgIHNhdmU6IGZ1bmN0aW9uIChydW4sIG1ldGEpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldFNlcnZpY2UocnVuKS5zYXZlKCQuZXh0ZW5kKHRydWUsIHt9LCB7IHNhdmVkOiB0cnVlIH0sIG1ldGEpKTtcbiAgICB9LFxuXG4gICAgYXJjaGl2ZTogZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0U2VydmljZShydW4pLnNhdmUoeyBzYXZlZDogZmFsc2UgfSk7XG4gICAgfSxcblxuICAgIF9nZXRTZXJ2aWNlOiBmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcnVuID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBSdW5TZXJ2aWNlKCQuZXh0ZW5kKHRydWUsIHt9LCB0aGlzLm9wdGlvbnMsIHsgZmlsdGVyOiBydW4gfSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBydW4gPT09ICdvYmplY3QnICYmIHJ1biBpbnN0YW5jZW9mIFJ1blNlcnZpY2UpIHtcbiAgICAgICAgICAgIHJldHVybiBydW47XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NhdmUgbWV0aG9kIHJlcXVpcmVzIGEgcnVuIHNlcnZpY2Ugb3IgYSBydW5JZCcpO1xuICAgIH0sXG5cbiAgICBnZXRSdW46IGZ1bmN0aW9uIChydW5JZCkge1xuICAgICAgICByZXR1cm4gbmV3IFJ1blNlcnZpY2UoJC5leHRlbmQodHJ1ZSwge30sIHRoaXMub3B0aW9ucywgeyBmaWx0ZXI6IHJ1bklkIH0pKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNjZW5hcmlvTWFuYWdlcjtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHJlc2V0OiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zLCBtYW5hZ2VyKSB7XG4gICAgICAgIHJldHVybiBtYW5hZ2VyLnJlc2V0KG9wdGlvbnMpO1xuICAgIH1cbn07XG4iLCIvKipcbiogIyMgV29ybGQgTWFuYWdlclxuKlxuKiBBcyBkaXNjdXNzZWQgdW5kZXIgdGhlIFtXb3JsZCBBUEkgQWRhcHRlcl0oLi4vd29ybGQtYXBpLWFkYXB0ZXIvKSwgYSBbcnVuXSguLi8uLi8uLi9nbG9zc2FyeS8jcnVuKSBpcyBhIGNvbGxlY3Rpb24gb2YgZW5kIHVzZXIgaW50ZXJhY3Rpb25zIHdpdGggYSBwcm9qZWN0IGFuZCBpdHMgbW9kZWwuIEZvciBidWlsZGluZyBtdWx0aXBsYXllciBzaW11bGF0aW9ucyB5b3UgdHlwaWNhbGx5IHdhbnQgbXVsdGlwbGUgZW5kIHVzZXJzIHRvIHNoYXJlIHRoZSBzYW1lIHNldCBvZiBpbnRlcmFjdGlvbnMsIGFuZCB3b3JrIHdpdGhpbiBhIGNvbW1vbiBzdGF0ZS4gRXBpY2VudGVyIGFsbG93cyB5b3UgdG8gY3JlYXRlIFwid29ybGRzXCIgdG8gaGFuZGxlIHN1Y2ggY2FzZXMuXG4qXG4qIFRoZSBXb3JsZCBNYW5hZ2VyIHByb3ZpZGVzIGFuIGVhc3kgd2F5IHRvIHRyYWNrIGFuZCBhY2Nlc3MgdGhlIGN1cnJlbnQgd29ybGQgYW5kIHJ1biBmb3IgcGFydGljdWxhciBlbmQgdXNlcnMuIEl0IGlzIHR5cGljYWxseSB1c2VkIGluIHBhZ2VzIHRoYXQgZW5kIHVzZXJzIHdpbGwgaW50ZXJhY3Qgd2l0aC4gKFRoZSByZWxhdGVkIFtXb3JsZCBBUEkgQWRhcHRlcl0oLi4vd29ybGQtYXBpLWFkYXB0ZXIvKSBoYW5kbGVzIGNyZWF0aW5nIG11bHRpcGxheWVyIHdvcmxkcywgYW5kIGFkZGluZyBhbmQgcmVtb3ZpbmcgZW5kIHVzZXJzIGFuZCBydW5zIGZyb20gYSB3b3JsZC4gQmVjYXVzZSBvZiB0aGlzLCB0eXBpY2FsbHkgdGhlIFdvcmxkIEFkYXB0ZXIgaXMgdXNlZCBmb3IgZmFjaWxpdGF0b3IgcGFnZXMgaW4geW91ciBwcm9qZWN0LilcbipcbiogIyMjIFVzaW5nIHRoZSBXb3JsZCBNYW5hZ2VyXG4qXG4qIFRvIHVzZSB0aGUgV29ybGQgTWFuYWdlciwgaW5zdGFudGlhdGUgaXQuIFRoZW4sIG1ha2UgY2FsbHMgdG8gYW55IG9mIHRoZSBtZXRob2RzIHlvdSBuZWVkLlxuKlxuKiBXaGVuIHlvdSBpbnN0YW50aWF0ZSBhIFdvcmxkIE1hbmFnZXIsIHRoZSB3b3JsZCdzIGFjY291bnQgaWQsIHByb2plY3QgaWQsIGFuZCBncm91cCBhcmUgYXV0b21hdGljYWxseSB0YWtlbiBmcm9tIHRoZSBzZXNzaW9uICh0aGFua3MgdG8gdGhlIFtBdXRoZW50aWNhdGlvbiBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlKSkuXG4qXG4qIE5vdGUgdGhhdCB0aGUgV29ybGQgTWFuYWdlciBkb2VzICpub3QqIGNyZWF0ZSB3b3JsZHMgYXV0b21hdGljYWxseS4gKFRoaXMgaXMgZGlmZmVyZW50IHRoYW4gdGhlIFtSdW4gTWFuYWdlcl0oLi4vcnVuLW1hbmFnZXIpLikgSG93ZXZlciwgeW91IGNhbiBwYXNzIGluIHNwZWNpZmljIG9wdGlvbnMgdG8gYW55IHJ1bnMgY3JlYXRlZCBieSB0aGUgbWFuYWdlciwgdXNpbmcgYSBgcnVuYCBvYmplY3QuXG4qXG4qIFRoZSBwYXJhbWV0ZXJzIGZvciBjcmVhdGluZyBhIFdvcmxkIE1hbmFnZXIgYXJlOlxuKlxuKiAgICogYGFjY291bnRgOiBUaGUgKipUZWFtIElEKiogaW4gdGhlIEVwaWNlbnRlciB1c2VyIGludGVyZmFjZSBmb3IgdGhpcyBwcm9qZWN0LlxuKiAgICogYHByb2plY3RgOiBUaGUgKipQcm9qZWN0IElEKiogZm9yIHRoaXMgcHJvamVjdC5cbiogICAqIGBncm91cGA6IFRoZSAqKkdyb3VwIE5hbWUqKiBmb3IgdGhpcyB3b3JsZC5cbiogICAqIGBydW5gOiBPcHRpb25zIHRvIHVzZSB3aGVuIGNyZWF0aW5nIG5ldyBydW5zIHdpdGggdGhlIG1hbmFnZXIsIGUuZy4gYHJ1bjogeyBmaWxlczogWydkYXRhLnhscyddIH1gLlxuKiAgICogYHJ1bi5tb2RlbGA6IFRoZSBuYW1lIG9mIHRoZSBwcmltYXJ5IG1vZGVsIGZpbGUgZm9yIHRoaXMgcHJvamVjdC4gUmVxdWlyZWQgaWYgeW91IGhhdmUgbm90IGFscmVhZHkgcGFzc2VkIGl0IGluIGFzIHBhcnQgb2YgdGhlIGBvcHRpb25zYCBwYXJhbWV0ZXIgZm9yIGFuIGVuY2xvc2luZyBjYWxsLlxuKlxuKiBGb3IgZXhhbXBsZTpcbipcbiogICAgICAgdmFyIHdNZ3IgPSBuZXcgRi5tYW5hZ2VyLldvcmxkTWFuYWdlcih7XG4qICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiogICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiogICAgICAgICAgcnVuOiB7IG1vZGVsOiAnc3VwcGx5LWNoYWluLnB5JyB9LFxuKiAgICAgICAgICBncm91cDogJ3RlYW0xJ1xuKiAgICAgICB9KTtcbipcbiogICAgICAgd01nci5nZXRDdXJyZW50UnVuKCk7XG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBXb3JsZEFwaSA9IHJlcXVpcmUoJy4uL3NlcnZpY2Uvd29ybGQtYXBpLWFkYXB0ZXInKTtcbnZhciBSdW5NYW5hZ2VyID0gcmVxdWlyZSgnLi9ydW4tbWFuYWdlcicpO1xudmFyIEF1dGhNYW5hZ2VyID0gcmVxdWlyZSgnLi9hdXRoLW1hbmFnZXInKTtcbnZhciB3b3JsZEFwaTtcblxuZnVuY3Rpb24gYnVpbGRTdHJhdGVneSh3b3JsZElkLCBkdGQpIHtcblxuICAgIHJldHVybiBmdW5jdGlvbiBDdG9yKHJ1blNlcnZpY2UsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5ydW5TZXJ2aWNlID0gcnVuU2VydmljZTtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcblxuICAgICAgICAkLmV4dGVuZCh0aGlzLCB7XG4gICAgICAgICAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm90IGltcGxlbWVudGQuIE5lZWQgYXBpIGNoYW5nZXMnKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGdldFJ1bjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgLy9nZXQgb3IgY3JlYXRlIVxuICAgICAgICAgICAgICAgIC8vIE1vZGVsIGlzIHJlcXVpcmVkIGluIHRoZSBvcHRpb25zXG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhpcy5vcHRpb25zLnJ1bi5tb2RlbCB8fCB0aGlzLm9wdGlvbnMubW9kZWw7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdvcmxkQXBpLmdldEN1cnJlbnRSdW5JZCh7IG1vZGVsOiBtb2RlbCwgZmlsdGVyOiB3b3JsZElkIH0pXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChydW5JZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lLnJ1blNlcnZpY2UubG9hZChydW5JZCk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlV2l0aChtZSwgW3J1bl0pO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuZmFpbChkdGQucmVqZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICApO1xuICAgIH07XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwgeyBydW46IHt9LCB3b3JsZDoge30gfTtcblxuICAgICQuZXh0ZW5kKHRydWUsIHRoaXMub3B0aW9ucywgdGhpcy5vcHRpb25zLnJ1bik7XG4gICAgJC5leHRlbmQodHJ1ZSwgdGhpcy5vcHRpb25zLCB0aGlzLm9wdGlvbnMud29ybGQpO1xuXG4gICAgd29ybGRBcGkgPSBuZXcgV29ybGRBcGkodGhpcy5vcHRpb25zKTtcbiAgICB0aGlzLl9hdXRoID0gbmV3IEF1dGhNYW5hZ2VyKCk7XG4gICAgdmFyIG1lID0gdGhpcztcblxuICAgIHZhciBhcGkgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogUmV0dXJucyB0aGUgY3VycmVudCB3b3JsZCAob2JqZWN0KSBhbmQgYW4gaW5zdGFuY2Ugb2YgdGhlIFtXb3JsZCBBUEkgQWRhcHRlcl0oLi4vd29ybGQtYXBpLWFkYXB0ZXIvKS5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICB3TWdyLmdldEN1cnJlbnRXb3JsZCgpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHdvcmxkLCB3b3JsZEFkYXB0ZXIpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHdvcmxkLmlkKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdvcmxkQWRhcHRlci5nZXRDdXJyZW50UnVuSWQoKTtcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VySWQgKE9wdGlvbmFsKSBUaGUgaWQgb2YgdGhlIHVzZXIgd2hvc2Ugd29ybGQgaXMgYmVpbmcgYWNjZXNzZWQuIERlZmF1bHRzIHRvIHRoZSB1c2VyIGluIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGdyb3VwTmFtZSAoT3B0aW9uYWwpIFRoZSBuYW1lIG9mIHRoZSBncm91cCB3aG9zZSB3b3JsZCBpcyBiZWluZyBhY2Nlc3NlZC4gRGVmYXVsdHMgdG8gdGhlIGdyb3VwIGZvciB0aGUgdXNlciBpbiB0aGUgY3VycmVudCBzZXNzaW9uLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGdldEN1cnJlbnRXb3JsZDogZnVuY3Rpb24gKHVzZXJJZCwgZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuX2F1dGguZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbygpO1xuICAgICAgICAgICAgaWYgKCF1c2VySWQpIHtcbiAgICAgICAgICAgICAgICB1c2VySWQgPSBzZXNzaW9uLnVzZXJJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICAgICAgZ3JvdXBOYW1lID0gc2Vzc2lvbi5ncm91cE5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gd29ybGRBcGkuZ2V0Q3VycmVudFdvcmxkRm9yVXNlcih1c2VySWQsIGdyb3VwTmFtZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogUmV0dXJucyB0aGUgY3VycmVudCBydW4gKG9iamVjdCkgYW5kIGFuIGluc3RhbmNlIG9mIHRoZSBbUnVuIEFQSSBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKS5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICB3TWdyLmdldEN1cnJlbnRSdW4oe21vZGVsOiAnbXlNb2RlbC5weSd9KVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbihydW4sIHJ1blNlcnZpY2UpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJ1bi5pZCk7XG4gICAgICAgICogICAgICAgICAgICAgICBydW5TZXJ2aWNlLmRvKCdzdGFydEdhbWUnKTtcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtb2RlbCAoT3B0aW9uYWwpIFRoZSBuYW1lIG9mIHRoZSBtb2RlbCBmaWxlLiBSZXF1aXJlZCBpZiBub3QgYWxyZWFkeSBwYXNzZWQgaW4gYXMgYHJ1bi5tb2RlbGAgd2hlbiB0aGUgV29ybGQgTWFuYWdlciBpcyBjcmVhdGVkLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGdldEN1cnJlbnRSdW46IGZ1bmN0aW9uIChtb2RlbCkge1xuICAgICAgICAgICAgdmFyIGR0ZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5fYXV0aC5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICAgICAgICB2YXIgY3VyVXNlcklkID0gc2Vzc2lvbi51c2VySWQ7XG4gICAgICAgICAgICB2YXIgY3VyR3JvdXBOYW1lID0gc2Vzc2lvbi5ncm91cE5hbWU7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldEFuZFJlc3RvcmVMYXRlc3RSdW4od29ybGQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXdvcmxkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkdGQucmVqZWN0KHsgZXJyb3I6ICdUaGUgdXNlciBpcyBub3QgcGFydCBvZiBhbnkgd29ybGQhJyB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudFdvcmxkSWQgPSB3b3JsZC5pZDtcbiAgICAgICAgICAgICAgICB2YXIgcnVuT3B0cyA9ICQuZXh0ZW5kKHRydWUsIG1lLm9wdGlvbnMsIHsgbW9kZWw6IG1vZGVsIH0pO1xuICAgICAgICAgICAgICAgIHZhciBzdHJhdGVneSA9IGJ1aWxkU3RyYXRlZ3koY3VycmVudFdvcmxkSWQsIGR0ZCk7XG4gICAgICAgICAgICAgICAgdmFyIG9wdCA9ICQuZXh0ZW5kKHRydWUsIHt9LCB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmF0ZWd5OiBzdHJhdGVneSxcbiAgICAgICAgICAgICAgICAgICAgcnVuOiBydW5PcHRzXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdmFyIHJtID0gbmV3IFJ1bk1hbmFnZXIob3B0KTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBybS5nZXRSdW4oKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZShydW4sIHJtLnJ1blNlcnZpY2UsIHJtKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0Q3VycmVudFdvcmxkKGN1clVzZXJJZCwgY3VyR3JvdXBOYW1lKVxuICAgICAgICAgICAgICAgIC50aGVuKGdldEFuZFJlc3RvcmVMYXRlc3RSdW4pO1xuXG4gICAgICAgICAgICByZXR1cm4gZHRkLnByb21pc2UoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBhcGkpO1xufTtcbiIsIi8qKlxuICogIyMgRmlsZSBBUEkgU2VydmljZVxuICpcbiAqIFRoZSBGaWxlIEFQSSBTZXJ2aWNlIGFsbG93cyB5b3UgdG8gdXBsb2FkIGFuZCBkb3dubG9hZCBmaWxlcyBkaXJlY3RseSBvbnRvIEVwaWNlbnRlciwgYW5hbG9nb3VzIHRvIHVzaW5nIHRoZSBGaWxlIE1hbmFnZXIgVUkgaW4gRXBpY2VudGVyIGRpcmVjdGx5IG9yIFNGVFBpbmcgZmlsZXMgaW4uIEl0IGlzIGJhc2VkIG9uIHRoZSBFcGljZW50ZXIgRmlsZSBBUEkuXG4gKlxuICogVGhlIEFzc2V0IEFQSSBTZXJ2aWNlIChodHRwczovL2ZvcmlvLmNvbS9lcGljZW50ZXIvZG9jcy9wdWJsaWMvYXBpX2FkYXB0ZXJzL2dlbmVyYXRlZC9hc3NldC1hcGktYWRhcHRlci8pIGlzIHR5cGljYWxseSB1c2VkIGZvciBhbGwgcHJvamVjdCB1c2UgY2FzZXMsIGFuZCBpdCdzIHVubGlrZWx5IHRoaXMgRmlsZSBTZXJ2aWNlIHdpbGwgYmUgdXNlZCBkaXJlY3RseSBleGNlcHQgYnkgQWRtaW4gdG9vbHMgKGUuZy4gRmxvdyBJbnNwZWN0b3IpLlxuICpcbiAqIFBhcnRpYWxseSBpbXBsZW1lbnRlZC5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbnZhciBTZXNzaW9uTWFuYWdlciA9IHJlcXVpcmUoJy4uL3N0b3JlL3Nlc3Npb24tbWFuYWdlcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGb3IgcHJvamVjdHMgdGhhdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uLCBwYXNzIGluIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiAoZGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nKS4gSWYgdGhlIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW4gdG8gRXBpY2VudGVyLCB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gaXMgYWxyZWFkeSBzZXQgaW4gYSBjb29raWUgYW5kIGF1dG9tYXRpY2FsbHkgbG9hZGVkIGZyb20gdGhlcmUuIChTZWUgW21vcmUgYmFja2dyb3VuZCBvbiBhY2Nlc3MgdG9rZW5zXSguLi8uLi8uLi9wcm9qZWN0X2FjY2Vzcy8pKS5cbiAgICAgICAgICogQHNlZSBbQXV0aGVudGljYXRpb24gQVBJIFNlcnZpY2VdKC4uL2F1dGgtYXBpLXNlcnZpY2UvKSBmb3IgZ2V0dGluZyB0b2tlbnMuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0b2tlbjogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWNjb3VudCBpZC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKSBvciAqKlVzZXIgSUQqKiAoZm9yIHBlcnNvbmFsIHByb2plY3RzKS4gRGVmYXVsdHMgdG8gdW5kZWZpbmVkLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgYWNjb3VudDogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcHJvamVjdCBpZC4gRGVmYXVsdHMgdG8gdW5kZWZpbmVkLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcHJvamVjdDogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgZm9sZGVyIHR5cGUuICBPbmUgb2YgYG1vZGVsYCB8IGBzdGF0aWNgIHwgYG5vZGVgLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZm9sZGVyVHlwZTogJ3N0YXRpYycsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucyB0byBwYXNzIG9uIHRvIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBsYXllci4gQWxsIGpxdWVyeS5hamF4IG9wdGlvbnMgYXQgaHR0cDovL2FwaS5qcXVlcnkuY29tL2pRdWVyeS5hamF4LyBhcmUgYXZhaWxhYmxlLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IHt9XG4gICAgfTtcblxuICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIgPSBuZXcgU2Vzc2lvbk1hbmFnZXIoKTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgdmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKHNlcnZpY2VPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy5hY2NvdW50KSB7XG4gICAgICAgIHVybENvbmZpZy5hY2NvdW50UGF0aCA9IHNlcnZpY2VPcHRpb25zLmFjY291bnQ7XG4gICAgfVxuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0KSB7XG4gICAgICAgIHVybENvbmZpZy5wcm9qZWN0UGF0aCA9IHNlcnZpY2VPcHRpb25zLnByb2plY3Q7XG4gICAgfVxuXG4gICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKCdmaWxlJylcbiAgICB9KTtcblxuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy50b2tlbikge1xuICAgICAgICBodHRwT3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeShodHRwT3B0aW9ucyk7XG5cbiAgICBmdW5jdGlvbiB1cGxvYWRCb2R5KGZpbGVOYW1lLCBjb250ZW50cykge1xuICAgICAgICB2YXIgYm91bmRhcnkgPSAnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tN2RhMjRmMmU1MDA0Nic7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGJvZHk6ICctLScgKyBib3VuZGFyeSArICdcXHJcXG4nICtcbiAgICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtRGlzcG9zaXRpb246IGZvcm0tZGF0YTsgbmFtZT1cImZpbGVcIjsnICtcbiAgICAgICAgICAgICAgICAgICAgJ2ZpbGVuYW1lPVwiJyArIGZpbGVOYW1lICsgJ1wiXFxyXFxuJyArXG4gICAgICAgICAgICAgICAgICAgICdDb250ZW50LXR5cGU6IHRleHQvaHRtbFxcclxcblxcclxcbicgK1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50cyArICdcXHJcXG4nICtcbiAgICAgICAgICAgICAgICAgICAgJy0tJyArIGJvdW5kYXJ5ICsgJy0tJyxcbiAgICAgICAgICAgIGJvdW5kYXJ5OiBib3VuZGFyeVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVwbG9hZEZpbGVPcHRpb25zKGZpbGVQYXRoLCBjb250ZW50cywgb3B0aW9ucykge1xuICAgICAgICBmaWxlUGF0aCA9IGZpbGVQYXRoLnNwbGl0KCcvJyk7XG4gICAgICAgIHZhciBmaWxlTmFtZSA9IGZpbGVQYXRoLnBvcCgpO1xuICAgICAgICBmaWxlUGF0aCA9IGZpbGVQYXRoLmpvaW4oJy8nKTtcbiAgICAgICAgdmFyIHBhdGggPSBzZXJ2aWNlT3B0aW9ucy5mb2xkZXJUeXBlICsgJy8nICsgZmlsZVBhdGg7XG4gICAgICAgIHZhciB1cGxvYWQgPSB1cGxvYWRCb2R5KGZpbGVOYW1lLCBjb250ZW50cyk7XG5cbiAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucywge1xuICAgICAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aCgnZmlsZScpICsgcGF0aCxcbiAgICAgICAgICAgIGRhdGE6IHVwbG9hZC5ib2R5LFxuICAgICAgICAgICAgY29udGVudFR5cGU6ICdtdWx0aXBhcnQvZm9ybS1kYXRhOyBib3VuZGFyeT0nICsgdXBsb2FkLmJvdW5kYXJ5XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBwdWJsaWNBc3luY0FQSSA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBhIGRpcmVjdG9yeSBsaXN0aW5nLCBvciBjb250ZW50cyBvZiBhIGZpbGUuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBmaWxlUGF0aCAgUGF0aCB0byB0aGUgZmlsZVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0Q29udGVudHM6IGZ1bmN0aW9uIChmaWxlUGF0aCwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHBhdGggPSBzZXJ2aWNlT3B0aW9ucy5mb2xkZXJUeXBlICsgJy8nICsgZmlsZVBhdGg7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKCdmaWxlJykgKyBwYXRoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldCgnJywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXBsYWNlcyB0aGUgZmlsZSBhdCB0aGUgZ2l2ZW4gZmlsZSBwYXRoLlxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGZpbGVQYXRoIFBhdGggdG8gdGhlIGZpbGVcbiAgICAgICAgICogQHBhcmFtICB7U3RyaW5nfSBjb250ZW50cyBDb250ZW50cyB0byB3cml0ZSB0byBmaWxlXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyAgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9uc1xuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgcmVwbGFjZTogZnVuY3Rpb24gKGZpbGVQYXRoLCBjb250ZW50cywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gdXBsb2FkRmlsZU9wdGlvbnMoZmlsZVBhdGgsIGNvbnRlbnRzLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucHV0KGh0dHBPcHRpb25zLmRhdGEsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlcyBhIGZpbGUgaW4gdGhlIGdpdmVuIGZpbGUgcGF0aC5cbiAgICAgICAgICogQHBhcmFtICB7U3RyaW5nfSBmaWxlUGF0aCBQYXRoIHRvIHRoZSBmaWxlXG4gICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gY29udGVudHMgQ29udGVudHMgdG8gd3JpdGUgdG8gZmlsZVxuICAgICAgICAgKiBAcGFyYW0gIHtCb29sZWFufSByZXBsYWNlRXhpc3RpbmcgUmVwbGFjZSBmaWxlIGlmIGl0IGFscmVhZHkgZXhpc3RzOyBkZWZhdWx0cyB0byBmYWxzZVxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9uc1xuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAoZmlsZVBhdGgsIGNvbnRlbnRzLCByZXBsYWNlRXhpc3RpbmcsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9IHVwbG9hZEZpbGVPcHRpb25zKGZpbGVQYXRoLCBjb250ZW50cywgb3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgcHJvbSA9IGh0dHAucG9zdChodHRwT3B0aW9ucy5kYXRhLCBodHRwT3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICAgICAgaWYgKHJlcGxhY2VFeGlzdGluZyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHByb20gPSBwcm9tLnRoZW4obnVsbCwgZnVuY3Rpb24gKHhocikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29uZmxpY3RTdGF0dXMgPSA0MDk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID09PSBjb25mbGljdFN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lLnJlcGxhY2UoZmlsZVBhdGgsIGNvbnRlbnRzLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHByb207XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZXMgdGhlIGZpbGUuXG4gICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gZmlsZVBhdGggUGF0aCB0byB0aGUgZmlsZVxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnNcbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24gKGZpbGVQYXRoLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgcGF0aCA9IHNlcnZpY2VPcHRpb25zLmZvbGRlclR5cGUgKyAnLycgKyBmaWxlUGF0aDtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucywge1xuICAgICAgICAgICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoJ2ZpbGUnKSArIHBhdGhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZGVsZXRlKG51bGwsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVuYW1lcyB0aGUgZmlsZS5cbiAgICAgICAgICogQHBhcmFtICB7U3RyaW5nfSBmaWxlUGF0aCBQYXRoIHRvIHRoZSBmaWxlXG4gICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gbmV3TmFtZSAgTmV3IG5hbWUgb2YgZmlsZVxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnNcbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgIHJlbmFtZTogZnVuY3Rpb24gKGZpbGVQYXRoLCBuZXdOYW1lLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgcGF0aCA9IHNlcnZpY2VPcHRpb25zLmZvbGRlclR5cGUgKyAnLycgKyBmaWxlUGF0aDtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucywge1xuICAgICAgICAgICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoJ2ZpbGUnKSArIHBhdGhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAucGF0Y2goeyBuYW1lOiBuZXdOYW1lIH0sIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBc3luY0FQSSk7XG59O1xuIiwiLyoqXG4gKiAjIyBBc3NldCBBUEkgQWRhcHRlclxuICpcbiAqIFRoZSBBc3NldCBBUEkgQWRhcHRlciBhbGxvd3MgeW91IHRvIHN0b3JlIGFzc2V0cyAtLSByZXNvdXJjZXMgb3IgZmlsZXMgb2YgYW55IGtpbmQgLS0gdXNlZCBieSBhIHByb2plY3Qgd2l0aCBhIHNjb3BlIHRoYXQgaXMgc3BlY2lmaWMgdG8gcHJvamVjdCwgZ3JvdXAsIG9yIGVuZCB1c2VyLlxuICpcbiAqIEFzc2V0cyBhcmUgdXNlZCB3aXRoIFt0ZWFtIHByb2plY3RzXSguLi8uLi8uLi9wcm9qZWN0X2FkbWluLyN0ZWFtKS4gT25lIGNvbW1vbiB1c2UgY2FzZSBpcyBoYXZpbmcgZW5kIHVzZXJzIGluIGEgW2dyb3VwXSguLi8uLi8uLi9nbG9zc2FyeS8jZ3JvdXBzKSBvciBpbiBhIFttdWx0aXBsYXllciB3b3JsZF0oLi4vLi4vLi4vZ2xvc3NhcnkvI3dvcmxkKSB1cGxvYWQgZGF0YSAtLSB2aWRlb3MgY3JlYXRlZCBkdXJpbmcgZ2FtZSBwbGF5LCBwcm9maWxlIHBpY3R1cmVzIGZvciBjdXN0b21pemluZyB0aGVpciBleHBlcmllbmNlLCBldGMuIC0tIGFzIHBhcnQgb2YgcGxheWluZyB0aHJvdWdoIHRoZSBwcm9qZWN0LlxuICpcbiAqIFJlc291cmNlcyBjcmVhdGVkIHVzaW5nIHRoZSBBc3NldCBBZGFwdGVyIGFyZSBzY29wZWQ6XG4gKlxuICogICogUHJvamVjdCBhc3NldHMgYXJlIHdyaXRhYmxlIG9ubHkgYnkgW3RlYW0gbWVtYmVyc10oLi4vLi4vLi4vZ2xvc3NhcnkvI3RlYW0pLCB0aGF0IGlzLCBFcGljZW50ZXIgYXV0aG9ycy5cbiAqICAqIEdyb3VwIGFzc2V0cyBhcmUgd3JpdGFibGUgYnkgYW55b25lIHdpdGggYWNjZXNzIHRvIHRoZSBwcm9qZWN0IHRoYXQgaXMgcGFydCBvZiB0aGF0IHBhcnRpY3VsYXIgW2dyb3VwXSguLi8uLi8uLi9nbG9zc2FyeS8jZ3JvdXBzKS4gVGhpcyBpbmNsdWRlcyBhbGwgW3RlYW0gbWVtYmVyc10oLi4vLi4vLi4vZ2xvc3NhcnkvI3RlYW0pIChFcGljZW50ZXIgYXV0aG9ycykgYW5kIGFueSBbZW5kIHVzZXJzXSguLi8uLi8uLi9nbG9zc2FyeS8jdXNlcnMpIHdobyBhcmUgbWVtYmVycyBvZiB0aGUgZ3JvdXAgLS0gYm90aCBmYWNpbGl0YXRvcnMgYW5kIHN0YW5kYXJkIGVuZCB1c2Vycy5cbiAqICAqIFVzZXIgYXNzZXRzIGFyZSB3cml0YWJsZSBieSB0aGUgc3BlY2lmaWMgZW5kIHVzZXIsIGFuZCBieSB0aGUgZmFjaWxpdGF0b3Igb2YgdGhlIGdyb3VwLlxuICogICogQWxsIGFzc2V0cyBhcmUgcmVhZGFibGUgYnkgYW55b25lIHdpdGggdGhlIGV4YWN0IFVSSS5cbiAqXG4gKiBUbyB1c2UgdGhlIEFzc2V0IEFkYXB0ZXIsIGluc3RhbnRpYXRlIGl0IGFuZCB0aGVuIGFjY2VzcyB0aGUgbWV0aG9kcyBwcm92aWRlZC4gSW5zdGFudGlhdGluZyByZXF1aXJlcyB0aGUgYWNjb3VudCBpZCAoKipUZWFtIElEKiogaW4gdGhlIEVwaWNlbnRlciB1c2VyIGludGVyZmFjZSkgYW5kIHByb2plY3QgaWQgKCoqUHJvamVjdCBJRCoqKS4gVGhlIGdyb3VwIG5hbWUgaXMgcmVxdWlyZWQgZm9yIGFzc2V0cyB3aXRoIGEgZ3JvdXAgc2NvcGUsIGFuZCB0aGUgZ3JvdXAgbmFtZSBhbmQgdXNlcklkIGFyZSByZXF1aXJlZCBmb3IgYXNzZXRzIHdpdGggYSB1c2VyIHNjb3BlLiBJZiBub3QgaW5jbHVkZWQsIHRoZXkgYXJlIHRha2VuIGZyb20gdGhlIGxvZ2dlZCBpbiB1c2VyJ3Mgc2Vzc2lvbiBpbmZvcm1hdGlvbiBpZiBuZWVkZWQuXG4gKlxuICogV2hlbiBjcmVhdGluZyBhbiBhc3NldCwgeW91IGNhbiBwYXNzIGluIHRleHQgKGVuY29kZWQgZGF0YSkgdG8gdGhlIGBjcmVhdGUoKWAgY2FsbC4gQWx0ZXJuYXRpdmVseSwgeW91IGNhbiBtYWtlIHRoZSBgY3JlYXRlKClgIGNhbGwgYXMgcGFydCBvZiBhbiBIVE1MIGZvcm0gYW5kIHBhc3MgaW4gYSBmaWxlIHVwbG9hZGVkIHZpYSB0aGUgZm9ybS5cbiAqXG4gKiAgICAgICAvLyBpbnN0YW50aWF0ZSB0aGUgQXNzZXQgQWRhcHRlclxuICogICAgICAgdmFyIGFhID0gbmV3IEYuc2VydmljZS5Bc3NldCh7XG4gKiAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gKiAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICogICAgICAgICAgZ3JvdXA6ICd0ZWFtMScsXG4gKiAgICAgICAgICB1c2VySWQ6ICcxMjM0NSdcbiAqICAgICAgIH0pO1xuICpcbiAqICAgICAgIC8vIGNyZWF0ZSBhIG5ldyBhc3NldCB1c2luZyBlbmNvZGVkIHRleHRcbiAqICAgICAgIGFhLmNyZWF0ZSgndGVzdC50eHQnLCB7XG4gKiAgICAgICAgICAgZW5jb2Rpbmc6ICdCQVNFXzY0JyxcbiAqICAgICAgICAgICBkYXRhOiAnVkdocGN5QnBjeUJoSUhSbGMzUWdabWxzWlM0PScsXG4gKiAgICAgICAgICAgY29udGVudFR5cGU6ICd0ZXh0L3BsYWluJ1xuICogICAgICAgfSwgeyBzY29wZTogJ3VzZXInIH0pO1xuICpcbiAqICAgICAgIC8vIGFsdGVybmF0aXZlbHksIGNyZWF0ZSBhIG5ldyBhc3NldCB1c2luZyBhIGZpbGUgdXBsb2FkZWQgdGhyb3VnaCBhIGZvcm1cbiAqICAgICAgIC8vIHRoaXMgc2FtcGxlIGNvZGUgZ29lcyB3aXRoIGFuIGh0bWwgZm9ybSB0aGF0IGxvb2tzIGxpa2UgdGhpczpcbiAqICAgICAgIC8vXG4gKiAgICAgICAvLyA8Zm9ybSBpZD1cInVwbG9hZC1maWxlXCI+XG4gKiAgICAgICAvLyAgIDxpbnB1dCBpZD1cImZpbGVcIiB0eXBlPVwiZmlsZVwiPlxuICogICAgICAgLy8gICA8aW5wdXQgaWQ9XCJmaWxlbmFtZVwiIHR5cGU9XCJ0ZXh0XCIgdmFsdWU9XCJteUZpbGUudHh0XCI+XG4gKiAgICAgICAvLyAgIDxidXR0b24gdHlwZT1cInN1Ym1pdFwiPlVwbG9hZCBteUZpbGU8L2J1dHRvbj5cbiAqICAgICAgIC8vIDwvZm9ybT5cbiAqICAgICAgIC8vXG4gKiAgICAgICAkKCcjdXBsb2FkLWZpbGUnKS5vbignc3VibWl0JywgZnVuY3Rpb24gKGUpIHtcbiAqICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAqICAgICAgICAgIHZhciBmaWxlbmFtZSA9ICQoJyNmaWxlbmFtZScpLnZhbCgpO1xuICogICAgICAgICAgdmFyIGRhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAqICAgICAgICAgIHZhciBpbnB1dENvbnRyb2wgPSAkKCcjZmlsZScpWzBdO1xuICogICAgICAgICAgZGF0YS5hcHBlbmQoJ2ZpbGUnLCBpbnB1dENvbnRyb2wuZmlsZXNbMF0sIGZpbGVuYW1lKTtcbiAqXG4gKiAgICAgICAgICBhYS5jcmVhdGUoZmlsZW5hbWUsIGRhdGEsIHsgc2NvcGU6ICd1c2VyJyB9KTtcbiAqICAgICAgIH0pO1xuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbnZhciBfcGljayA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0LXV0aWwnKS5fcGljaztcbnZhciBTZXNzaW9uTWFuYWdlciA9IHJlcXVpcmUoJy4uL3N0b3JlL3Nlc3Npb24tbWFuYWdlcicpO1xuXG52YXIgYXBpRW5kcG9pbnQgPSAnYXNzZXQnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGb3IgcHJvamVjdHMgdGhhdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uLCBwYXNzIGluIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiAoZGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nKS4gSWYgdGhlIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW4gdG8gRXBpY2VudGVyLCB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gaXMgYWxyZWFkeSBzZXQgaW4gYSBjb29raWUgYW5kIGF1dG9tYXRpY2FsbHkgbG9hZGVkIGZyb20gdGhlcmUuIChTZWUgW21vcmUgYmFja2dyb3VuZCBvbiBhY2Nlc3MgdG9rZW5zXSguLi8uLi8uLi9wcm9qZWN0X2FjY2Vzcy8pKS5cbiAgICAgICAgICogQHNlZSBbQXV0aGVudGljYXRpb24gQVBJIFNlcnZpY2VdKC4uL2F1dGgtYXBpLXNlcnZpY2UvKSBmb3IgZ2V0dGluZyB0b2tlbnMuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0b2tlbjogdW5kZWZpbmVkLFxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGFjY291bnQgaWQuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBhY2NvdW50OiB1bmRlZmluZWQsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcHJvamVjdCBpZC4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHByb2plY3Q6IHVuZGVmaW5lZCxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBncm91cCBuYW1lLiBEZWZhdWx0cyB0byBzZXNzaW9uJ3MgYGdyb3VwTmFtZWAuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBncm91cDogdW5kZWZpbmVkLFxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHVzZXIgaWQuIERlZmF1bHRzIHRvIHNlc3Npb24ncyBgdXNlcklkYC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHVzZXJJZDogdW5kZWZpbmVkLFxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHNjb3BlIGZvciB0aGUgYXNzZXQuIFZhbGlkIHZhbHVlcyBhcmU6IGB1c2VyYCwgYGdyb3VwYCwgYW5kIGBwcm9qZWN0YC4gU2VlIGFib3ZlIGZvciB0aGUgcmVxdWlyZWQgcGVybWlzc2lvbnMgdG8gd3JpdGUgdG8gZWFjaCBzY29wZS4gRGVmYXVsdHMgdG8gYHVzZXJgLCBtZWFuaW5nIHRoZSBjdXJyZW50IGVuZCB1c2VyIG9yIGEgZmFjaWxpdGF0b3IgaW4gdGhlIGVuZCB1c2VyJ3MgZ3JvdXAgY2FuIGVkaXQgdGhlIGFzc2V0LlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgc2NvcGU6ICd1c2VyJyxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERldGVybWluZXMgaWYgYSByZXF1ZXN0IHRvIGxpc3QgdGhlIGFzc2V0cyBpbiBhIHNjb3BlIGluY2x1ZGVzIHRoZSBjb21wbGV0ZSBVUkwgZm9yIGVhY2ggYXNzZXQgKGB0cnVlYCksIG9yIG9ubHkgdGhlIGZpbGUgbmFtZXMgb2YgdGhlIGFzc2V0cyAoYGZhbHNlYCkuIERlZmF1bHRzIHRvIGB0cnVlYC5cbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBmdWxsVXJsOiB0cnVlLFxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHRyYW5zcG9ydCBvYmplY3QgY29udGFpbnMgdGhlIG9wdGlvbnMgcGFzc2VkIHRvIHRoZSBYSFIgcmVxdWVzdC5cbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRyYW5zcG9ydDoge1xuICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlXG4gICAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIgPSBuZXcgU2Vzc2lvbk1hbmFnZXIoKTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgdmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKHNlcnZpY2VPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuXG4gICAgaWYgKCFzZXJ2aWNlT3B0aW9ucy5hY2NvdW50KSB7XG4gICAgICAgIHNlcnZpY2VPcHRpb25zLmFjY291bnQgPSB1cmxDb25maWcuYWNjb3VudFBhdGg7XG4gICAgfVxuXG4gICAgaWYgKCFzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0KSB7XG4gICAgICAgIHNlcnZpY2VPcHRpb25zLnByb2plY3QgPSB1cmxDb25maWcucHJvamVjdFBhdGg7XG4gICAgfVxuXG4gICAgdmFyIHRyYW5zcG9ydE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpXG4gICAgfSk7XG5cbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgdHJhbnNwb3J0T3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KHRyYW5zcG9ydE9wdGlvbnMpO1xuXG4gICAgdmFyIGFzc2V0QXBpUGFyYW1zID0gWydlbmNvZGluZycsICdkYXRhJywgJ2NvbnRlbnRUeXBlJ107XG4gICAgdmFyIHNjb3BlQ29uZmlnID0ge1xuICAgICAgICB1c2VyOiBbJ3Njb3BlJywgJ2FjY291bnQnLCAncHJvamVjdCcsICdncm91cCcsICd1c2VySWQnXSxcbiAgICAgICAgZ3JvdXA6IFsnc2NvcGUnLCAnYWNjb3VudCcsICdwcm9qZWN0JywgJ2dyb3VwJ10sXG4gICAgICAgIHByb2plY3Q6IFsnc2NvcGUnLCAnYWNjb3VudCcsICdwcm9qZWN0J10sXG4gICAgfTtcblxuICAgIHZhciB2YWxpZGF0ZUZpbGVuYW1lID0gZnVuY3Rpb24gKGZpbGVuYW1lKSB7XG4gICAgICAgIGlmICghZmlsZW5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignZmlsZW5hbWUgaXMgbmVlZGVkLicpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciB2YWxpZGF0ZVVybFBhcmFtcyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciBwYXJ0S2V5cyA9IHNjb3BlQ29uZmlnW29wdGlvbnMuc2NvcGVdO1xuICAgICAgICBpZiAoIXBhcnRLZXlzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Njb3BlIHBhcmFtZXRlciBpcyBuZWVkZWQuJyk7XG4gICAgICAgIH1cblxuICAgICAgICAkLmVhY2gocGFydEtleXMsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghb3B0aW9uc1t0aGlzXSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcih0aGlzICsgJyBwYXJhbWV0ZXIgaXMgbmVlZGVkLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgdmFyIGJ1aWxkVXJsID0gZnVuY3Rpb24gKGZpbGVuYW1lLCBvcHRpb25zKSB7XG4gICAgICAgIHZhbGlkYXRlVXJsUGFyYW1zKG9wdGlvbnMpO1xuICAgICAgICB2YXIgcGFydEtleXMgPSBzY29wZUNvbmZpZ1tvcHRpb25zLnNjb3BlXTtcbiAgICAgICAgdmFyIHBhcnRzID0gJC5tYXAocGFydEtleXMsIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zW2tleV07XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoZmlsZW5hbWUpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgcHJldmVudHMgYWRkaW5nIGEgdHJhaWxpbmcgLyBpbiB0aGUgVVJMIGFzIHRoZSBBc3NldCBBUElcbiAgICAgICAgICAgIC8vIGRvZXMgbm90IHdvcmsgY29ycmVjdGx5IHdpdGggaXRcbiAgICAgICAgICAgIGZpbGVuYW1lID0gJy8nICsgZmlsZW5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHBhcnRzLmpvaW4oJy8nKSArIGZpbGVuYW1lO1xuICAgIH07XG5cbiAgICAvLyBQcml2YXRlIGZ1bmN0aW9uLCBhbGwgcmVxdWVzdHMgZm9sbG93IGEgbW9yZSBvciBsZXNzIHNhbWUgYXBwcm9hY2ggdG9cbiAgICAvLyB1c2UgdGhlIEFzc2V0IEFQSSBhbmQgdGhlIGRpZmZlcmVuY2UgaXMgdGhlIEhUVFAgdmVyYlxuICAgIC8vXG4gICAgLy8gQHBhcmFtIHtzdHJpbmd9IG1ldGhvZGAgKFJlcXVpcmVkKSBIVFRQIHZlcmJcbiAgICAvLyBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWVgIChSZXF1aXJlZCkgTmFtZSBvZiB0aGUgZmlsZSB0byBkZWxldGUvcmVwbGFjZS9jcmVhdGVcbiAgICAvLyBAcGFyYW0ge29iamVjdH0gcGFyYW1zYCAoT3B0aW9uYWwpIEJvZHkgcGFyYW1ldGVycyB0byBzZW5kIHRvIHRoZSBBc3NldCBBUElcbiAgICAvLyBAcGFyYW0ge29iamVjdH0gb3B0aW9uc2AgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICB2YXIgdXBsb2FkID0gZnVuY3Rpb24gKG1ldGhvZCwgZmlsZW5hbWUsIHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICB2YWxpZGF0ZUZpbGVuYW1lKGZpbGVuYW1lKTtcbiAgICAgICAgLy8gbWFrZSBzdXJlIHRoZSBwYXJhbWV0ZXIgaXMgY2xlYW5cbiAgICAgICAgbWV0aG9kID0gbWV0aG9kLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHZhciBjb250ZW50VHlwZSA9IHBhcmFtcyBpbnN0YW5jZW9mIEZvcm1EYXRhID09PSB0cnVlID8gZmFsc2UgOiAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICAgIGlmIChjb250ZW50VHlwZSA9PT0gJ2FwcGxpY2F0aW9uL2pzb24nKSB7XG4gICAgICAgICAgICAvLyB3aGl0ZWxpc3QgdGhlIGZpZWxkcyB0aGF0IHdlIGFjdHVhbGx5IGNhbiBzZW5kIHRvIHRoZSBhcGlcbiAgICAgICAgICAgIHBhcmFtcyA9IF9waWNrKHBhcmFtcywgYXNzZXRBcGlQYXJhbXMpO1xuICAgICAgICB9IGVsc2UgeyAvLyBlbHNlIHdlJ3JlIHNlbmRpbmcgZm9ybSBkYXRhIHdoaWNoIGdvZXMgZGlyZWN0bHkgaW4gcmVxdWVzdCBib2R5XG4gICAgICAgICAgICAvLyBGb3IgbXVsdGlwYXJ0L2Zvcm0tZGF0YSB1cGxvYWRzIHRoZSBmaWxlbmFtZSBpcyBub3Qgc2V0IGluIHRoZSBVUkwsXG4gICAgICAgICAgICAvLyBpdCdzIGdldHRpbmcgcGlja2VkIGJ5IHRoZSBGb3JtRGF0YSBmaWVsZCBmaWxlbmFtZS5cbiAgICAgICAgICAgIGZpbGVuYW1lID0gbWV0aG9kID09PSAncG9zdCcgfHwgbWV0aG9kID09PSAncHV0JyA/ICcnIDogZmlsZW5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHVybE9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICB2YXIgdXJsID0gYnVpbGRVcmwoZmlsZW5hbWUsIHVybE9wdGlvbnMpO1xuICAgICAgICB2YXIgY3JlYXRlT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCB1cmxPcHRpb25zLCB7IHVybDogdXJsLCBjb250ZW50VHlwZTogY29udGVudFR5cGUgfSk7XG5cbiAgICAgICAgcmV0dXJuIGh0dHBbbWV0aG9kXShwYXJhbXMsIGNyZWF0ZU9wdGlvbnMpO1xuICAgIH07XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuICAgICAgICAvKipcbiAgICAgICAgKiBDcmVhdGVzIGEgZmlsZSBpbiB0aGUgQXNzZXQgQVBJLiBUaGUgc2VydmVyIHJldHVybnMgYW4gZXJyb3IgKHN0YXR1cyBjb2RlIGA0MDlgLCBjb25mbGljdCkgaWYgdGhlIGZpbGUgYWxyZWFkeSBleGlzdHMsIHNvXG4gICAgICAgICogY2hlY2sgZmlyc3Qgd2l0aCBhIGBsaXN0KClgIG9yIGEgYGdldCgpYC5cbiAgICAgICAgKlxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgdmFyIGFhID0gbmV3IEYuc2VydmljZS5Bc3NldCh7XG4gICAgICAgICogICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgZ3JvdXA6ICd0ZWFtMScsXG4gICAgICAgICogICAgICAgICAgdXNlcklkOiAnJ1xuICAgICAgICAqICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICAgLy8gY3JlYXRlIGEgbmV3IGFzc2V0IHVzaW5nIGVuY29kZWQgdGV4dFxuICAgICAgICAqICAgICAgIGFhLmNyZWF0ZSgndGVzdC50eHQnLCB7XG4gICAgICAgICogICAgICAgICAgIGVuY29kaW5nOiAnQkFTRV82NCcsXG4gICAgICAgICogICAgICAgICAgIGRhdGE6ICdWR2hwY3lCcGN5QmhJSFJsYzNRZ1ptbHNaUzQ9JyxcbiAgICAgICAgKiAgICAgICAgICAgY29udGVudFR5cGU6ICd0ZXh0L3BsYWluJ1xuICAgICAgICAqICAgICAgIH0sIHsgc2NvcGU6ICd1c2VyJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIC8vIGFsdGVybmF0aXZlbHksIGNyZWF0ZSBhIG5ldyBhc3NldCB1c2luZyBhIGZpbGUgdXBsb2FkZWQgdGhyb3VnaCBhIGZvcm1cbiAgICAgICAgKiAgICAgICAvLyB0aGlzIHNhbXBsZSBjb2RlIGdvZXMgd2l0aCBhbiBodG1sIGZvcm0gdGhhdCBsb29rcyBsaWtlIHRoaXM6XG4gICAgICAgICogICAgICAgLy9cbiAgICAgICAgKiAgICAgICAvLyA8Zm9ybSBpZD1cInVwbG9hZC1maWxlXCI+XG4gICAgICAgICogICAgICAgLy8gICA8aW5wdXQgaWQ9XCJmaWxlXCIgdHlwZT1cImZpbGVcIj5cbiAgICAgICAgKiAgICAgICAvLyAgIDxpbnB1dCBpZD1cImZpbGVuYW1lXCIgdHlwZT1cInRleHRcIiB2YWx1ZT1cIm15RmlsZS50eHRcIj5cbiAgICAgICAgKiAgICAgICAvLyAgIDxidXR0b24gdHlwZT1cInN1Ym1pdFwiPlVwbG9hZCBteUZpbGU8L2J1dHRvbj5cbiAgICAgICAgKiAgICAgICAvLyA8L2Zvcm0+XG4gICAgICAgICogICAgICAgLy9cbiAgICAgICAgKiAgICAgICAkKCcjdXBsb2FkLWZpbGUnKS5vbignc3VibWl0JywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgKiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICogICAgICAgICAgdmFyIGZpbGVuYW1lID0gJCgnI2ZpbGVuYW1lJykudmFsKCk7XG4gICAgICAgICogICAgICAgICAgdmFyIGRhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgICAgKiAgICAgICAgICB2YXIgaW5wdXRDb250cm9sID0gJCgnI2ZpbGUnKVswXTtcbiAgICAgICAgKiAgICAgICAgICBkYXRhLmFwcGVuZCgnZmlsZScsIGlucHV0Q29udHJvbC5maWxlc1swXSwgZmlsZW5hbWUpO1xuICAgICAgICAqXG4gICAgICAgICogICAgICAgICAgYWEuY3JlYXRlKGZpbGVuYW1lLCBkYXRhLCB7IHNjb3BlOiAndXNlcicgfSk7XG4gICAgICAgICogICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZSAoUmVxdWlyZWQpIE5hbWUgb2YgdGhlIGZpbGUgdG8gY3JlYXRlLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgKE9wdGlvbmFsKSBCb2R5IHBhcmFtZXRlcnMgdG8gc2VuZCB0byB0aGUgQXNzZXQgQVBJLiBSZXF1aXJlZCBpZiB0aGUgYG9wdGlvbnMudHJhbnNwb3J0LmNvbnRlbnRUeXBlYCBpcyBgYXBwbGljYXRpb24vanNvbmAsIG90aGVyd2lzZSBpZ25vcmVkLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuZW5jb2RpbmcgRWl0aGVyIGBIRVhgIG9yIGBCQVNFXzY0YC4gUmVxdWlyZWQgaWYgYG9wdGlvbnMudHJhbnNwb3J0LmNvbnRlbnRUeXBlYCBpcyBgYXBwbGljYXRpb24vanNvbmAuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5kYXRhIFRoZSBlbmNvZGVkIGRhdGEgZm9yIHRoZSBmaWxlLiBSZXF1aXJlZCBpZiBgb3B0aW9ucy50cmFuc3BvcnQuY29udGVudFR5cGVgIGlzIGBhcHBsaWNhdGlvbi9qc29uYC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmNvbnRlbnRUeXBlIFRoZSBtaW1lIHR5cGUgb2YgdGhlIGZpbGUuIE9wdGlvbmFsLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAoZmlsZW5hbWUsIHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHVwbG9hZCgncG9zdCcsIGZpbGVuYW1lLCBwYXJhbXMsIG9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEdldHMgYSBmaWxlIGZyb20gdGhlIEFzc2V0IEFQSSwgZmV0Y2hpbmcgdGhlIGFzc2V0IGNvbnRlbnQuIChUbyBnZXQgYSBsaXN0XG4gICAgICAgICogb2YgdGhlIGFzc2V0cyBpbiBhIHNjb3BlLCB1c2UgYGxpc3QoKWAuKVxuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lIChSZXF1aXJlZCkgTmFtZSBvZiB0aGUgZmlsZSB0byByZXRyaWV2ZS5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGdldDogZnVuY3Rpb24gKGZpbGVuYW1lLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgZ2V0U2VydmljZU9wdGlvbnMgPSBfcGljayhzZXJ2aWNlT3B0aW9ucywgWydzY29wZScsICdhY2NvdW50JywgJ3Byb2plY3QnLCAnZ3JvdXAnLCAndXNlcklkJ10pO1xuICAgICAgICAgICAgdmFyIHVybE9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZ2V0U2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIHVybCA9IGJ1aWxkVXJsKGZpbGVuYW1lLCB1cmxPcHRpb25zKTtcbiAgICAgICAgICAgIHZhciBnZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHVybE9wdGlvbnMsIHsgdXJsOiB1cmwgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldCh7fSwgZ2V0T3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogR2V0cyB0aGUgbGlzdCBvZiB0aGUgYXNzZXRzIGluIGEgc2NvcGUuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgYWEubGlzdCh7IGZ1bGxVcmw6IHRydWUgfSkudGhlbihmdW5jdGlvbihmaWxlTGlzdCl7XG4gICAgICAgICogICAgICAgICAgIGNvbnNvbGUubG9nKCdhcnJheSBvZiBmaWxlcyA9ICcsIGZpbGVMaXN0KTtcbiAgICAgICAgKiAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuc2NvcGUgKE9wdGlvbmFsKSBUaGUgc2NvcGUgKGB1c2VyYCwgYGdyb3VwYCwgYHByb2plY3RgKS5cbiAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMuZnVsbFVybCAoT3B0aW9uYWwpIERldGVybWluZXMgaWYgdGhlIGxpc3Qgb2YgYXNzZXRzIGluIGEgc2NvcGUgaW5jbHVkZXMgdGhlIGNvbXBsZXRlIFVSTCBmb3IgZWFjaCBhc3NldCAoYHRydWVgKSwgb3Igb25seSB0aGUgZmlsZSBuYW1lcyBvZiB0aGUgYXNzZXRzIChgZmFsc2VgKS5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBsaXN0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGR0ZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgdXJsT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgdXJsID0gYnVpbGRVcmwoJycsIHVybE9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIGdldE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdXJsT3B0aW9ucywgeyB1cmw6IHVybCB9KTtcbiAgICAgICAgICAgIHZhciBmdWxsVXJsID0gZ2V0T3B0aW9ucy5mdWxsVXJsO1xuXG4gICAgICAgICAgICBpZiAoIWZ1bGxVcmwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoe30sIGdldE9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBodHRwLmdldCh7fSwgZ2V0T3B0aW9ucylcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoZmlsZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZ1bGxQYXRoRmlsZXMgPSAkLm1hcChmaWxlcywgZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBidWlsZFVybChmaWxlLCB1cmxPcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlV2l0aChtZSwgW2Z1bGxQYXRoRmlsZXNdKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5mYWlsKGR0ZC5yZWplY3QpO1xuXG4gICAgICAgICAgICByZXR1cm4gZHRkLnByb21pc2UoKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBSZXBsYWNlcyBhbiBleGlzdGluZyBmaWxlIGluIHRoZSBBc3NldCBBUEkuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgLy8gcmVwbGFjZSBhbiBhc3NldCB1c2luZyBlbmNvZGVkIHRleHRcbiAgICAgICAgKiAgICAgICBhYS5yZXBsYWNlKCd0ZXN0LnR4dCcsIHtcbiAgICAgICAgKiAgICAgICAgICAgZW5jb2Rpbmc6ICdCQVNFXzY0JyxcbiAgICAgICAgKiAgICAgICAgICAgZGF0YTogJ1ZHaHBjeUJwY3lCaElITmxZMjl1WkNCMFpYTjBJR1pwYkdVdScsXG4gICAgICAgICogICAgICAgICAgIGNvbnRlbnRUeXBlOiAndGV4dC9wbGFpbidcbiAgICAgICAgKiAgICAgICB9LCB7IHNjb3BlOiAndXNlcicgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICAvLyBhbHRlcm5hdGl2ZWx5LCByZXBsYWNlIGFuIGFzc2V0IHVzaW5nIGEgZmlsZSB1cGxvYWRlZCB0aHJvdWdoIGEgZm9ybVxuICAgICAgICAqICAgICAgIC8vIHRoaXMgc2FtcGxlIGNvZGUgZ29lcyB3aXRoIGFuIGh0bWwgZm9ybSB0aGF0IGxvb2tzIGxpa2UgdGhpczpcbiAgICAgICAgKiAgICAgICAvL1xuICAgICAgICAqICAgICAgIC8vIDxmb3JtIGlkPVwicmVwbGFjZS1maWxlXCI+XG4gICAgICAgICogICAgICAgLy8gICA8aW5wdXQgaWQ9XCJmaWxlXCIgdHlwZT1cImZpbGVcIj5cbiAgICAgICAgKiAgICAgICAvLyAgIDxpbnB1dCBpZD1cInJlcGxhY2UtZmlsZW5hbWVcIiB0eXBlPVwidGV4dFwiIHZhbHVlPVwibXlGaWxlLnR4dFwiPlxuICAgICAgICAqICAgICAgIC8vICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCI+UmVwbGFjZSBteUZpbGU8L2J1dHRvbj5cbiAgICAgICAgKiAgICAgICAvLyA8L2Zvcm0+XG4gICAgICAgICogICAgICAgLy9cbiAgICAgICAgKiAgICAgICAkKCcjcmVwbGFjZS1maWxlJykub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICogICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAqICAgICAgICAgIHZhciBmaWxlbmFtZSA9ICQoJyNyZXBsYWNlLWZpbGVuYW1lJykudmFsKCk7XG4gICAgICAgICogICAgICAgICAgdmFyIGRhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgICAgKiAgICAgICAgICB2YXIgaW5wdXRDb250cm9sID0gJCgnI2ZpbGUnKVswXTtcbiAgICAgICAgKiAgICAgICAgICBkYXRhLmFwcGVuZCgnZmlsZScsIGlucHV0Q29udHJvbC5maWxlc1swXSwgZmlsZW5hbWUpO1xuICAgICAgICAqXG4gICAgICAgICogICAgICAgICAgYWEucmVwbGFjZShmaWxlbmFtZSwgZGF0YSwgeyBzY29wZTogJ3VzZXInIH0pO1xuICAgICAgICAqICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lIChSZXF1aXJlZCkgTmFtZSBvZiB0aGUgZmlsZSBiZWluZyByZXBsYWNlZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIChPcHRpb25hbCkgQm9keSBwYXJhbWV0ZXJzIHRvIHNlbmQgdG8gdGhlIEFzc2V0IEFQSS4gUmVxdWlyZWQgaWYgdGhlIGBvcHRpb25zLnRyYW5zcG9ydC5jb250ZW50VHlwZWAgaXMgYGFwcGxpY2F0aW9uL2pzb25gLCBvdGhlcndpc2UgaWdub3JlZC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmVuY29kaW5nIEVpdGhlciBgSEVYYCBvciBgQkFTRV82NGAuIFJlcXVpcmVkIGlmIGBvcHRpb25zLnRyYW5zcG9ydC5jb250ZW50VHlwZWAgaXMgYGFwcGxpY2F0aW9uL2pzb25gLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuZGF0YSBUaGUgZW5jb2RlZCBkYXRhIGZvciB0aGUgZmlsZS4gUmVxdWlyZWQgaWYgYG9wdGlvbnMudHJhbnNwb3J0LmNvbnRlbnRUeXBlYCBpcyBgYXBwbGljYXRpb24vanNvbmAuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5jb250ZW50VHlwZSBUaGUgbWltZSB0eXBlIG9mIHRoZSBmaWxlLiBPcHRpb25hbC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIHJlcGxhY2U6IGZ1bmN0aW9uIChmaWxlbmFtZSwgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gdXBsb2FkKCdwdXQnLCBmaWxlbmFtZSwgcGFyYW1zLCBvcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBEZWxldGVzIGEgZmlsZSBmcm9tIHRoZSBBc3NldCBBUEkuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgYWEuZGVsZXRlKHNhbXBsZUZpbGVOYW1lKTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZSAoUmVxdWlyZWQpIE5hbWUgb2YgdGhlIGZpbGUgdG8gZGVsZXRlLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgZGVsZXRlOiBmdW5jdGlvbiAoZmlsZW5hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiB1cGxvYWQoJ2RlbGV0ZScsIGZpbGVuYW1lLCB7fSwgb3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXNzZXRVcmw6IGZ1bmN0aW9uIChmaWxlbmFtZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHVybE9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIGJ1aWxkVXJsKGZpbGVuYW1lLCB1cmxPcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG4iLCIvKipcbiAqXG4gKiAjIyBBdXRoZW50aWNhdGlvbiBBUEkgU2VydmljZVxuICpcbiAqIFRoZSBBdXRoZW50aWNhdGlvbiBBUEkgU2VydmljZSBwcm92aWRlcyBhIG1ldGhvZCBmb3IgbG9nZ2luZyBpbiwgd2hpY2ggY3JlYXRlcyBhbmQgcmV0dXJucyBhIHVzZXIgYWNjZXNzIHRva2VuLlxuICpcbiAqIFVzZXIgYWNjZXNzIHRva2VucyBhcmUgcmVxdWlyZWQgZm9yIGVhY2ggY2FsbCB0byBFcGljZW50ZXIuIChTZWUgW1Byb2plY3QgQWNjZXNzXSguLi8uLi8uLi9wcm9qZWN0X2FjY2Vzcy8pIGZvciBtb3JlIGluZm9ybWF0aW9uLilcbiAqXG4gKiBJZiB5b3UgbmVlZCBhZGRpdGlvbmFsIGZ1bmN0aW9uYWxpdHkgLS0gc3VjaCBhcyB0cmFja2luZyBzZXNzaW9uIGluZm9ybWF0aW9uLCBlYXNpbHkgcmV0cmlldmluZyB0aGUgdXNlciB0b2tlbiwgb3IgZ2V0dGluZyB0aGUgZ3JvdXBzIHRvIHdoaWNoIGFuIGVuZCB1c2VyIGJlbG9uZ3MgLS0gY29uc2lkZXIgdXNpbmcgdGhlIFtBdXRob3JpemF0aW9uIE1hbmFnZXJdKC4uL2F1dGgtbWFuYWdlci8pIGluc3RlYWQuXG4gKlxuICogICAgICB2YXIgYXV0aCA9IG5ldyBGLnNlcnZpY2UuQXV0aCgpO1xuICogICAgICBhdXRoLmxvZ2luKHsgdXNlck5hbWU6ICdqc21pdGhAYWNtZXNpbXVsYXRpb25zLmNvbScsXG4gKiAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiAncGFzc3cwcmQnIH0pO1xuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFbWFpbCBvciB1c2VybmFtZSB0byB1c2UgZm9yIGxvZ2dpbmcgaW4uIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHVzZXJOYW1lOiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUGFzc3dvcmQgZm9yIHNwZWNpZmllZCBgdXNlck5hbWVgLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBwYXNzd29yZDogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY2NvdW50IGlkIGZvciB0aGlzIGB1c2VyTmFtZWAuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgdGhlICoqVXNlciBJRCoqIChmb3IgcGVyc29uYWwgcHJvamVjdHMpLiBSZXF1aXJlZCBpZiB0aGUgYHVzZXJOYW1lYCBpcyBmb3IgYW4gW2VuZCB1c2VyXSguLi8uLi8uLi9nbG9zc2FyeS8jdXNlcnMpLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBhY2NvdW50OiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucyB0byBwYXNzIG9uIHRvIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBsYXllci4gQWxsIGpxdWVyeS5hamF4IG9wdGlvbnMgYXQgaHR0cDovL2FwaS5qcXVlcnkuY29tL2pRdWVyeS5hamF4LyBhcmUgYXZhaWxhYmxlLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IHt9XG4gICAgfTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgdmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKHNlcnZpY2VPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuXG4gICAgdmFyIHRyYW5zcG9ydE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoJ2F1dGhlbnRpY2F0aW9uJylcbiAgICB9KTtcbiAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KHRyYW5zcG9ydE9wdGlvbnMpO1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTG9ncyB1c2VyIGluLCByZXR1cm5pbmcgdGhlIHVzZXIgYWNjZXNzIHRva2VuLlxuICAgICAgICAgKlxuICAgICAgICAgKiBJZiBubyBgdXNlck5hbWVgIG9yIGBwYXNzd29yZGAgd2VyZSBwcm92aWRlZCBpbiB0aGUgaW5pdGlhbCBjb25maWd1cmF0aW9uIG9wdGlvbnMsIHRoZXkgYXJlIHJlcXVpcmVkIGluIHRoZSBgb3B0aW9uc2AgaGVyZS4gSWYgbm8gYGFjY291bnRgIHdhcyBwcm92aWRlZCBpbiB0aGUgaW5pdGlhbCBjb25maWd1cmF0aW9uIG9wdGlvbnMgYW5kIHRoZSBgdXNlck5hbWVgIGlzIGZvciBhbiBbZW5kIHVzZXJdKC4uLy4uLy4uL2dsb3NzYXJ5LyN1c2VycyksIHRoZSBgYWNjb3VudGAgaXMgcmVxdWlyZWQgYXMgd2VsbC5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICBhdXRoLmxvZ2luKHtcbiAgICAgICAgICogICAgICAgICAgdXNlck5hbWU6ICdqc21pdGgnLFxuICAgICAgICAgKiAgICAgICAgICBwYXNzd29yZDogJ3Bhc3N3MHJkJyxcbiAgICAgICAgICogICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnIH0pXG4gICAgICAgICAqICAgICAgLnRoZW4oZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICAgICAqICAgICAgICAgIGNvbnNvbGUubG9nKFwidXNlciBhY2Nlc3MgdG9rZW4gaXM6IFwiLCB0b2tlbi5hY2Nlc3NfdG9rZW4pO1xuICAgICAgICAgKiAgICAgIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgbG9naW46IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7IHN1Y2Nlc3M6ICQubm9vcCB9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBpZiAoIWh0dHBPcHRpb25zLnVzZXJOYW1lIHx8ICFodHRwT3B0aW9ucy5wYXNzd29yZCkge1xuICAgICAgICAgICAgICAgIHZhciByZXNwID0geyBzdGF0dXM6IDQwMSwgc3RhdHVzTWVzc2FnZTogJ05vIHVzZXJuYW1lIG9yIHBhc3N3b3JkIHNwZWNpZmllZC4nIH07XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5lcnJvci5jYWxsKHRoaXMsIHJlc3ApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KHJlc3ApLnByb21pc2UoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHBvc3RQYXJhbXMgPSB7XG4gICAgICAgICAgICAgICAgdXNlck5hbWU6IGh0dHBPcHRpb25zLnVzZXJOYW1lLFxuICAgICAgICAgICAgICAgIHBhc3N3b3JkOiBodHRwT3B0aW9ucy5wYXNzd29yZCxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoaHR0cE9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICAgICAgICAgIC8vcGFzcyBpbiBudWxsIGZvciBhY2NvdW50IHVuZGVyIG9wdGlvbnMgaWYgeW91IGRvbid0IHdhbnQgaXQgdG8gYmUgc2VudFxuICAgICAgICAgICAgICAgIHBvc3RQYXJhbXMuYWNjb3VudCA9IGh0dHBPcHRpb25zLmFjY291bnQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QocG9zdFBhcmFtcywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIChyZXBsYWNlIHdpdGggLyogKi8gY29tbWVudCBibG9jaywgdG8gbWFrZSB2aXNpYmxlIGluIGRvY3MsIG9uY2UgdGhpcyBpcyBtb3JlIHRoYW4gYSBub29wKVxuICAgICAgICAvL1xuICAgICAgICAvLyBMb2dzIHVzZXIgb3V0IGZyb20gc3BlY2lmaWVkIGFjY291bnRzLlxuICAgICAgICAvL1xuICAgICAgICAvLyBFcGljZW50ZXIgbG9nb3V0IGlzIG5vdCBpbXBsZW1lbnRlZCB5ZXQsIHNvIGZvciBub3cgdGhpcyBpcyBhIGR1bW15IHByb21pc2UgdGhhdCBnZXRzIGF1dG9tYXRpY2FsbHkgcmVzb2x2ZWQuXG4gICAgICAgIC8vXG4gICAgICAgIC8vICoqRXhhbXBsZSoqXG4gICAgICAgIC8vXG4gICAgICAgIC8vICAgICAgYXV0aC5sb2dvdXQoKTtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gKipQYXJhbWV0ZXJzKipcbiAgICAgICAgLy8gQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAvL1xuICAgICAgICBsb2dvdXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgZHRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICAgICAgZHRkLnJlc29sdmUoKTtcbiAgICAgICAgICAgIHJldHVybiBkdGQucHJvbWlzZSgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiLyoqXG4gKiAjIyBDaGFubmVsIFNlcnZpY2VcbiAqXG4gKiBUaGUgRXBpY2VudGVyIHBsYXRmb3JtIHByb3ZpZGVzIGEgcHVzaCBjaGFubmVsLCB3aGljaCBhbGxvd3MgeW91IHRvIHB1Ymxpc2ggYW5kIHN1YnNjcmliZSB0byBtZXNzYWdlcyB3aXRoaW4gYSBbcHJvamVjdF0oLi4vLi4vLi4vZ2xvc3NhcnkvI3Byb2plY3RzKSwgW2dyb3VwXSguLi8uLi8uLi9nbG9zc2FyeS8jZ3JvdXBzKSwgb3IgW211bHRpcGxheWVyIHdvcmxkXSguLi8uLi8uLi9nbG9zc2FyeS8jd29ybGQpLiBUaGVyZSBhcmUgdHdvIG1haW4gdXNlIGNhc2VzIGZvciB0aGUgY2hhbm5lbDogZXZlbnQgbm90aWZpY2F0aW9ucyBhbmQgY2hhdCBtZXNzYWdlcy5cbiAqXG4gKiBUaGUgQ2hhbm5lbCBTZXJ2aWNlIGlzIGEgYnVpbGRpbmcgYmxvY2sgZm9yIHRoaXMgZnVuY3Rpb25hbGl0eS4gSXQgY3JlYXRlcyBhIHB1Ymxpc2gtc3Vic2NyaWJlIG9iamVjdCwgYWxsb3dpbmcgeW91IHRvIHB1Ymxpc2ggbWVzc2FnZXMsIHN1YnNjcmliZSB0byBtZXNzYWdlcywgb3IgdW5zdWJzY3JpYmUgZnJvbSBtZXNzYWdlcyBmb3IgYSBnaXZlbiAndG9waWMnIG9uIGEgYCQuY29tZXRkYCB0cmFuc3BvcnQgaW5zdGFuY2UuXG4gKlxuICogVHlwaWNhbGx5LCB5b3UgdXNlIHRoZSBbRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlcl0oLi4vZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlci8pIHRvIGNyZWF0ZSBvciByZXRyaWV2ZSBjaGFubmVscywgdGhlbiB1c2UgdGhlIENoYW5uZWwgU2VydmljZSBgc3Vic2NyaWJlKClgIGFuZCBgcHVibGlzaCgpYCBtZXRob2RzIHRvIGxpc3RlbiB0byBvciB1cGRhdGUgZGF0YS4gKEZvciBhZGRpdGlvbmFsIGJhY2tncm91bmQgb24gRXBpY2VudGVyJ3MgcHVzaCBjaGFubmVsLCBzZWUgdGhlIGludHJvZHVjdG9yeSBub3RlcyBvbiB0aGUgW1B1c2ggQ2hhbm5lbCBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9tdWx0aXBsYXllci9jaGFubmVsLykgcGFnZS4pXG4gKlxuICogWW91J2xsIG5lZWQgdG8gaW5jbHVkZSB0aGUgYGVwaWNlbnRlci1tdWx0aXBsYXllci1kZXBlbmRlbmNpZXMuanNgIGxpYnJhcnkgaW4gYWRkaXRpb24gdG8gdGhlIGBlcGljZW50ZXIuanNgIGxpYnJhcnkgaW4geW91ciBwcm9qZWN0IHRvIHVzZSB0aGUgQ2hhbm5lbCBTZXJ2aWNlLiBTZWUgW0luY2x1ZGluZyBFcGljZW50ZXIuanNdKC4uLy4uLyNpbmNsdWRlKS5cbiAqXG4gKiBUbyB1c2UgdGhlIENoYW5uZWwgU2VydmljZSwgaW5zdGFudGlhdGUgaXQsIHRoZW4gbWFrZSBjYWxscyB0byBhbnkgb2YgdGhlIG1ldGhvZHMgeW91IG5lZWQuXG4gKlxuICogICAgICAgIHZhciBjcyA9IG5ldyBGLnNlcnZpY2UuQ2hhbm5lbCgpO1xuICogICAgICAgIGNzLnB1Ymxpc2goJy9hY21lLXNpbXVsYXRpb25zL3N1cHBseS1jaGFpbi1nYW1lL2ZhbGwtc2VtaW5hci9ydW4vdmFyaWFibGVzJywgeyBwcmljZTogNTAgfSk7XG4gKlxuICogVGhlIHBhcmFtZXRlcnMgZm9yIGluc3RhbnRpYXRpbmcgYSBDaGFubmVsIFNlcnZpY2UgaW5jbHVkZTpcbiAqXG4gKiAqIGBvcHRpb25zYCBUaGUgb3B0aW9ucyBvYmplY3QgdG8gY29uZmlndXJlIHRoZSBDaGFubmVsIFNlcnZpY2UuXG4gKiAqIGBvcHRpb25zLmJhc2VgIFRoZSBiYXNlIHRvcGljLiBUaGlzIGlzIGFkZGVkIGFzIGEgcHJlZml4IHRvIGFsbCBmdXJ0aGVyIHRvcGljcyB5b3UgcHVibGlzaCBvciBzdWJzY3JpYmUgdG8gd2hpbGUgd29ya2luZyB3aXRoIHRoaXMgQ2hhbm5lbCBTZXJ2aWNlLlxuICogKiBgb3B0aW9ucy50b3BpY1Jlc29sdmVyYCBBIGZ1bmN0aW9uIHRoYXQgcHJvY2Vzc2VzIGFsbCAndG9waWNzJyBwYXNzZWQgaW50byB0aGUgYHB1Ymxpc2hgIGFuZCBgc3Vic2NyaWJlYCBtZXRob2RzLiBUaGlzIGlzIHVzZWZ1bCBpZiB5b3Ugd2FudCB0byBpbXBsZW1lbnQgeW91ciBvd24gc2VyaWFsaXplIGZ1bmN0aW9ucyBmb3IgY29udmVydGluZyBjdXN0b20gb2JqZWN0cyB0byB0b3BpYyBuYW1lcy4gUmV0dXJucyBhIFN0cmluZy4gQnkgZGVmYXVsdCwgaXQganVzdCBlY2hvZXMgdGhlIHRvcGljLlxuICogKiBgb3B0aW9ucy50cmFuc3BvcnRgIFRoZSBpbnN0YW5jZSBvZiBgJC5jb21ldGRgIHRvIGhvb2sgb250by4gU2VlIGh0dHA6Ly9kb2NzLmNvbWV0ZC5vcmcvcmVmZXJlbmNlL2phdmFzY3JpcHQuaHRtbCBmb3IgYWRkaXRpb25hbCBiYWNrZ3JvdW5kIG9uIGNvbWV0ZC5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG52YXIgQ2hhbm5lbCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYmFzZSB0b3BpYy4gVGhpcyBpcyBhZGRlZCBhcyBhIHByZWZpeCB0byBhbGwgZnVydGhlciB0b3BpY3MgeW91IHB1Ymxpc2ggb3Igc3Vic2NyaWJlIHRvIHdoaWxlIHdvcmtpbmcgd2l0aCB0aGlzIENoYW5uZWwgU2VydmljZS5cbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGJhc2U6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBIGZ1bmN0aW9uIHRoYXQgcHJvY2Vzc2VzIGFsbCAndG9waWNzJyBwYXNzZWQgaW50byB0aGUgYHB1Ymxpc2hgIGFuZCBgc3Vic2NyaWJlYCBtZXRob2RzLiBUaGlzIGlzIHVzZWZ1bCBpZiB5b3Ugd2FudCB0byBpbXBsZW1lbnQgeW91ciBvd24gc2VyaWFsaXplIGZ1bmN0aW9ucyBmb3IgY29udmVydGluZyBjdXN0b20gb2JqZWN0cyB0byB0b3BpYyBuYW1lcy4gQnkgZGVmYXVsdCwgaXQganVzdCBlY2hvZXMgdGhlIHRvcGljLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAqIGB0b3BpY2AgVG9waWMgdG8gcGFyc2UuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqUmV0dXJuIFZhbHVlKipcbiAgICAgICAgICpcbiAgICAgICAgICogKiAqU3RyaW5nKjogVGhpcyBmdW5jdGlvbiBzaG91bGQgcmV0dXJuIGEgc3RyaW5nIHRvcGljLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAdHlwZSB7ZnVuY3Rpb259XG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0b3BpYyB0b3BpYyB0byByZXNvbHZlXG4gICAgICAgICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRvcGljUmVzb2x2ZXI6IGZ1bmN0aW9uICh0b3BpYykge1xuICAgICAgICAgICAgcmV0dXJuIHRvcGljO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgaW5zdGFuY2Ugb2YgYCQuY29tZXRkYCB0byBob29rIG9udG8uXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IG51bGxcbiAgICB9O1xuICAgIHRoaXMuY2hhbm5lbE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xufTtcblxudmFyIG1ha2VOYW1lID0gZnVuY3Rpb24gKGNoYW5uZWxOYW1lLCB0b3BpYykge1xuICAgIC8vUmVwbGFjZSB0cmFpbGluZy9kb3VibGUgc2xhc2hlc1xuICAgIHZhciBuZXdOYW1lID0gKGNoYW5uZWxOYW1lID8gKGNoYW5uZWxOYW1lICsgJy8nICsgdG9waWMpIDogdG9waWMpLnJlcGxhY2UoL1xcL1xcLy9nLCAnLycpLnJlcGxhY2UoL1xcLyQvLCAnJyk7XG4gICAgcmV0dXJuIG5ld05hbWU7XG59O1xuXG5cbkNoYW5uZWwucHJvdG90eXBlID0gJC5leHRlbmQoQ2hhbm5lbC5wcm90b3R5cGUsIHtcblxuICAgIC8vIGZ1dHVyZSBmdW5jdGlvbmFsaXR5OlxuICAgIC8vICAgICAgLy8gU2V0IHRoZSBjb250ZXh0IGZvciB0aGUgY2FsbGJhY2tcbiAgICAvLyAgICAgIGNzLnN1YnNjcmliZSgncnVuJywgZnVuY3Rpb24gKCkgeyB0aGlzLmlubmVySFRNTCA9ICdUcmlnZ2VyZWQnfSwgZG9jdW1lbnQuYm9keSk7XG4gICAgIC8vXG4gICAgIC8vICAgICAgLy8gQ29udHJvbCB0aGUgb3JkZXIgb2Ygb3BlcmF0aW9ucyBieSBzZXR0aW5nIHRoZSBgcHJpb3JpdHlgXG4gICAgIC8vICAgICAgY3Muc3Vic2NyaWJlKCdydW4nLCBjYiwgdGhpcywge3ByaW9yaXR5OiA5fSk7XG4gICAgIC8vXG4gICAgIC8vICAgICAgLy8gT25seSBleGVjdXRlIHRoZSBjYWxsYmFjaywgYGNiYCwgaWYgdGhlIHZhbHVlIG9mIHRoZSBgcHJpY2VgIHZhcmlhYmxlIGlzIDUwXG4gICAgIC8vICAgICAgY3Muc3Vic2NyaWJlKCdydW4vdmFyaWFibGVzL3ByaWNlJywgY2IsIHRoaXMsIHtwcmlvcml0eTogMzAsIHZhbHVlOiA1MH0pO1xuICAgICAvL1xuICAgICAvLyAgICAgIC8vIE9ubHkgZXhlY3V0ZSB0aGUgY2FsbGJhY2ssIGBjYmAsIGlmIHRoZSB2YWx1ZSBvZiB0aGUgYHByaWNlYCB2YXJpYWJsZSBpcyBncmVhdGVyIHRoYW4gNTBcbiAgICAgLy8gICAgICBzdWJzY3JpYmUoJ3J1bi92YXJpYWJsZXMvcHJpY2UnLCBjYiwgdGhpcywge3ByaW9yaXR5OiAzMCwgdmFsdWU6ICc+NTAnfSk7XG4gICAgIC8vXG4gICAgIC8vICAgICAgLy8gT25seSBleGVjdXRlIHRoZSBjYWxsYmFjaywgYGNiYCwgaWYgdGhlIHZhbHVlIG9mIHRoZSBgcHJpY2VgIHZhcmlhYmxlIGlzIGV2ZW5cbiAgICAgLy8gICAgICBzdWJzY3JpYmUoJ3J1bi92YXJpYWJsZXMvcHJpY2UnLCBjYiwgdGhpcywge3ByaW9yaXR5OiAzMCwgdmFsdWU6IGZ1bmN0aW9uICh2YWwpIHtyZXR1cm4gdmFsICUgMiA9PT0gMH19KTtcblxuXG4gICAgLyoqXG4gICAgICogU3Vic2NyaWJlIHRvIGNoYW5nZXMgb24gYSB0b3BpYy5cbiAgICAgKlxuICAgICAqIFRoZSB0b3BpYyBzaG91bGQgaW5jbHVkZSB0aGUgZnVsbCBwYXRoIG9mIHRoZSBhY2NvdW50IGlkICgqKlRlYW0gSUQqKiBmb3IgdGVhbSBwcm9qZWN0cyksIHByb2plY3QgaWQsIGFuZCBncm91cCBuYW1lLiAoSW4gbW9zdCBjYXNlcywgaXQgaXMgc2ltcGxlciB0byB1c2UgdGhlIFtFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyXSguLi9lcGljZW50ZXItY2hhbm5lbC1tYW5hZ2VyLykgaW5zdGVhZCwgaW4gd2hpY2ggY2FzZSB0aGlzIGlzIGNvbmZpZ3VyZWQgZm9yIHlvdS4pXG4gICAgICpcbiAgICAgKiAgKipFeGFtcGxlcyoqXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBjYiA9IGZ1bmN0aW9uKHZhbCkgeyBjb25zb2xlLmxvZyh2YWwuZGF0YSk7IH07XG4gICAgICpcbiAgICAgKiAgICAgIC8vIFN1YnNjcmliZSB0byBjaGFuZ2VzIG9uIGEgdG9wLWxldmVsICdydW4nIHRvcGljXG4gICAgICogICAgICBjcy5zdWJzY3JpYmUoJy9hY21lLXNpbXVsYXRpb25zL3N1cHBseS1jaGFpbi1nYW1lL2ZhbGwtc2VtaW5hci9ydW4nLCBjYik7XG4gICAgICpcbiAgICAgKiAgICAgIC8vIFN1YnNjcmliZSB0byBjaGFuZ2VzIG9uIGNoaWxkcmVuIG9mIHRoZSAncnVuJyB0b3BpYy4gTm90ZSB0aGlzIHdpbGwgYWxzbyBiZSB0cmlnZ2VyZWQgZm9yIGNoYW5nZXMgdG8gcnVuLngueS56LlxuICAgICAqICAgICAgY3Muc3Vic2NyaWJlKCcvYWNtZS1zaW11bGF0aW9ucy9zdXBwbHktY2hhaW4tZ2FtZS9mYWxsLXNlbWluYXIvcnVuLyonLCBjYik7XG4gICAgICpcbiAgICAgKiAgICAgIC8vIFN1YnNjcmliZSB0byBjaGFuZ2VzIG9uIGJvdGggdGhlIHRvcC1sZXZlbCAncnVuJyB0b3BpYyBhbmQgaXRzIGNoaWxkcmVuXG4gICAgICogICAgICBjcy5zdWJzY3JpYmUoWycvYWNtZS1zaW11bGF0aW9ucy9zdXBwbHktY2hhaW4tZ2FtZS9mYWxsLXNlbWluYXIvcnVuJyxcbiAgICAgKiAgICAgICAgICAnL2FjbWUtc2ltdWxhdGlvbnMvc3VwcGx5LWNoYWluLWdhbWUvZmFsbC1zZW1pbmFyL3J1bi8qJ10sIGNiKTtcbiAgICAgKlxuICAgICAqICAgICAgLy8gU3Vic2NyaWJlIHRvIGNoYW5nZXMgb24gYSBwYXJ0aWN1bGFyIHZhcmlhYmxlXG4gICAgICogICAgICBzdWJzY3JpYmUoJy9hY21lLXNpbXVsYXRpb25zL3N1cHBseS1jaGFpbi1nYW1lL2ZhbGwtc2VtaW5hci9ydW4vdmFyaWFibGVzL3ByaWNlJywgY2IpO1xuICAgICAqXG4gICAgICpcbiAgICAgKiAqKlJldHVybiBWYWx1ZSoqXG4gICAgICpcbiAgICAgKiAqICpTdHJpbmcqIFJldHVybnMgYSB0b2tlbiB5b3UgY2FuIGxhdGVyIHVzZSB0byB1bnN1YnNjcmliZS5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICogQHBhcmFtICB7U3RyaW5nfEFycmF5fSAgIHRvcGljICAgIExpc3Qgb2YgdG9waWNzIHRvIGxpc3RlbiBmb3IgY2hhbmdlcyBvbi5cbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb24gdG8gZXhlY3V0ZS4gQ2FsbGJhY2sgaXMgY2FsbGVkIHdpdGggc2lnbmF0dXJlIGAoZXZ0LCBwYXlsb2FkLCBtZXRhZGF0YSlgLlxuICAgICAqIEBwYXJhbSAge09iamVjdH0gICBjb250ZXh0ICBDb250ZXh0IGluIHdoaWNoIHRoZSBgY2FsbGJhY2tgIGlzIGV4ZWN1dGVkLlxuICAgICAqIEBwYXJhbSAge09iamVjdH0gICBvcHRpb25zICAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gICBvcHRpb25zLnByaW9yaXR5ICBVc2VkIHRvIGNvbnRyb2wgb3JkZXIgb2Ygb3BlcmF0aW9ucy4gRGVmYXVsdHMgdG8gMC4gQ2FuIGJlIGFueSArdmUgb3IgLXZlIG51bWJlci5cbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd8TnVtYmVyfEZ1bmN0aW9ufSAgIG9wdGlvbnMudmFsdWUgVGhlIGBjYWxsYmFja2AgaXMgb25seSB0cmlnZ2VyZWQgaWYgdGhpcyBjb25kaXRpb24gbWF0Y2hlcy4gU2VlIGV4YW1wbGVzIGZvciBkZXRhaWxzLlxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gU3Vic2NyaXB0aW9uIElEXG4gICAgICovXG4gICAgc3Vic2NyaWJlOiBmdW5jdGlvbiAodG9waWMsIGNhbGxiYWNrLCBjb250ZXh0LCBvcHRpb25zKSB7XG5cbiAgICAgICAgdmFyIHRvcGljcyA9IFtdLmNvbmNhdCh0b3BpYyk7XG4gICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgIHZhciBzdWJzY3JpcHRpb25JZHMgPSBbXTtcbiAgICAgICAgdmFyIG9wdHMgPSBtZS5jaGFubmVsT3B0aW9ucztcblxuICAgICAgICBvcHRzLnRyYW5zcG9ydC5iYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkLmVhY2godG9waWNzLCBmdW5jdGlvbiAoaW5kZXgsIHRvcGljKSB7XG4gICAgICAgICAgICAgICAgdG9waWMgPSBtYWtlTmFtZShvcHRzLmJhc2UsIG9wdHMudG9waWNSZXNvbHZlcih0b3BpYykpO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkcy5wdXNoKG9wdHMudHJhbnNwb3J0LnN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2spKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIChzdWJzY3JpcHRpb25JZHNbMV0gPyBzdWJzY3JpcHRpb25JZHMgOiBzdWJzY3JpcHRpb25JZHNbMF0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQdWJsaXNoIGRhdGEgdG8gYSB0b3BpYy5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZXMqKlxuICAgICAqXG4gICAgICogICAgICAvLyBTZW5kIGRhdGEgdG8gYWxsIHN1YnNjcmliZXJzIG9mIHRoZSAncnVuJyB0b3BpY1xuICAgICAqICAgICAgY3MucHVibGlzaCgnL2FjbWUtc2ltdWxhdGlvbnMvc3VwcGx5LWNoYWluLWdhbWUvZmFsbC1zZW1pbmFyL3J1bicsIHsgY29tcGxldGVkOiBmYWxzZSB9KTtcbiAgICAgKlxuICAgICAqICAgICAgLy8gU2VuZCBkYXRhIHRvIGFsbCBzdWJzY3JpYmVycyBvZiB0aGUgJ3J1bi92YXJpYWJsZXMnIHRvcGljXG4gICAgICogICAgICBjcy5wdWJsaXNoKCcvYWNtZS1zaW11bGF0aW9ucy9zdXBwbHktY2hhaW4tZ2FtZS9mYWxsLXNlbWluYXIvcnVuL3ZhcmlhYmxlcycsIHsgcHJpY2U6IDUwIH0pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gdG9waWMgVG9waWMgdG8gcHVibGlzaCB0by5cbiAgICAgKiBAcGFyYW0gIHsqfSBkYXRhICBEYXRhIHRvIHB1Ymxpc2ggdG8gdG9waWMuXG4gICAgICogQHJldHVybiB7QXJyYXkgfCBPYmplY3R9IFJlc3BvbnNlcyB0byBwdWJsaXNoZWQgZGF0YVxuICAgICAqXG4gICAgICovXG4gICAgcHVibGlzaDogZnVuY3Rpb24gKHRvcGljLCBkYXRhKSB7XG4gICAgICAgIHZhciB0b3BpY3MgPSBbXS5jb25jYXQodG9waWMpO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICB2YXIgcmV0dXJuT2JqcyA9IFtdO1xuICAgICAgICB2YXIgb3B0cyA9IG1lLmNoYW5uZWxPcHRpb25zO1xuXG5cbiAgICAgICAgb3B0cy50cmFuc3BvcnQuYmF0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJC5lYWNoKHRvcGljcywgZnVuY3Rpb24gKGluZGV4LCB0b3BpYykge1xuICAgICAgICAgICAgICAgIHRvcGljID0gbWFrZU5hbWUob3B0cy5iYXNlLCBvcHRzLnRvcGljUmVzb2x2ZXIodG9waWMpKTtcbiAgICAgICAgICAgICAgICBpZiAodG9waWMuY2hhckF0KHRvcGljLmxlbmd0aCAtIDEpID09PSAnKicpIHtcbiAgICAgICAgICAgICAgICAgICAgdG9waWMgPSB0b3BpYy5yZXBsYWNlKC9cXCorJC8sICcnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdZb3UgY2FuIGNhbm5vdCBwdWJsaXNoIHRvIGNoYW5uZWxzIHdpdGggd2lsZGNhcmRzLiBQdWJsaXNoaW5nIHRvICcsIHRvcGljLCAnaW5zdGVhZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm5PYmpzLnB1c2gob3B0cy50cmFuc3BvcnQucHVibGlzaCh0b3BpYywgZGF0YSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gKHJldHVybk9ianNbMV0gPyByZXR1cm5PYmpzIDogcmV0dXJuT2Jqc1swXSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVuc3Vic2NyaWJlIGZyb20gY2hhbmdlcyB0byBhIHRvcGljLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgY3MudW5zdWJzY3JpYmUoJ3NhbXBsZVRva2VuJyk7XG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gdG9rZW4gVGhlIHRva2VuIGZvciB0b3BpYyBpcyByZXR1cm5lZCB3aGVuIHlvdSBpbml0aWFsbHkgc3Vic2NyaWJlLiBQYXNzIGl0IGhlcmUgdG8gdW5zdWJzY3JpYmUgZnJvbSB0aGF0IHRvcGljLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gcmVmZXJlbmNlIHRvIGN1cnJlbnQgaW5zdGFuY2VcbiAgICAgKi9cbiAgICB1bnN1YnNjcmliZTogZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICAgIHRoaXMuY2hhbm5lbE9wdGlvbnMudHJhbnNwb3J0LnVuc3Vic2NyaWJlKHRva2VuKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IGxpc3RlbmluZyBmb3IgZXZlbnRzIG9uIHRoaXMgaW5zdGFuY2UuIFNpZ25hdHVyZSBpcyBzYW1lIGFzIGZvciBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vb24vLlxuICAgICAqXG4gICAgICogU3VwcG9ydGVkIGV2ZW50cyBhcmU6IGBjb25uZWN0YCwgYGRpc2Nvbm5lY3RgLCBgc3Vic2NyaWJlYCwgYHVuc3Vic2NyaWJlYCwgYHB1Ymxpc2hgLCBgZXJyb3JgLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgdHlwZS4gU2VlIG1vcmUgZGV0YWlsIGF0IGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9vbi8uXG4gICAgICovXG4gICAgb246IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAkKHRoaXMpLm9uLmFwcGx5KCQodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0b3AgbGlzdGVuaW5nIGZvciBldmVudHMgb24gdGhpcyBpbnN0YW5jZS4gU2lnbmF0dXJlIGlzIHNhbWUgYXMgZm9yIGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9vZmYvLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgdHlwZS4gU2VlIG1vcmUgZGV0YWlsIGF0IGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9vZmYvLlxuICAgICAqL1xuICAgIG9mZjogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICQodGhpcykub2ZmLmFwcGx5KCQodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRyaWdnZXIgZXZlbnRzIGFuZCBleGVjdXRlIGhhbmRsZXJzLiBTaWduYXR1cmUgaXMgc2FtZSBhcyBmb3IgalF1ZXJ5IEV2ZW50czogaHR0cDovL2FwaS5qcXVlcnkuY29tL3RyaWdnZXIvLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgdHlwZS4gU2VlIG1vcmUgZGV0YWlsIGF0IGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS90cmlnZ2VyLy5cbiAgICAgKi9cbiAgICB0cmlnZ2VyOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgJCh0aGlzKS50cmlnZ2VyLmFwcGx5KCQodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDaGFubmVsO1xuIiwiLyoqXG4gKiBAY2xhc3MgQ29uZmlndXJhdGlvblNlcnZpY2VcbiAqXG4gKiBBbGwgc2VydmljZXMgdGFrZSBpbiBhIGNvbmZpZ3VyYXRpb24gc2V0dGluZ3Mgb2JqZWN0IHRvIGNvbmZpZ3VyZSB0aGVtc2VsdmVzLiBBIEpTIGhhc2gge30gaXMgYSB2YWxpZCBjb25maWd1cmF0aW9uIG9iamVjdCwgYnV0IG9wdGlvbmFsbHkgeW91IGNhbiB1c2UgdGhlIGNvbmZpZ3VyYXRpb24gc2VydmljZSB0byB0b2dnbGUgY29uZmlncyBiYXNlZCBvbiB0aGUgZW52aXJvbm1lbnRcbiAqXG4gKiBAZXhhbXBsZVxuICogICAgIHZhciBjcyA9IHJlcXVpcmUoJ2NvbmZpZ3VyYXRpb24tc2VydmljZScpKHtcbiAqICAgICAgICAgIGRldjogeyAvL2Vudmlyb25tZW50XG4gICAgICAgICAgICAgICAgcG9ydDogMzAwMCxcbiAgICAgICAgICAgICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9kOiB7XG4gICAgICAgICAgICAgICAgcG9ydDogODA4MCxcbiAgICAgICAgICAgICAgICBob3N0OiAnYXBpLmZvcmlvLmNvbScsXG4gICAgICAgICAgICAgICAgbG9nTGV2ZWw6ICdub25lJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxvZ0xldmVsOiAnREVCVUcnIC8vZ2xvYmFsXG4gKiAgICAgfSk7XG4gKlxuICogICAgICBjcy5nZXQoJ2xvZ0xldmVsJyk7IC8vcmV0dXJucyAnREVCVUcnXG4gKlxuICogICAgICBjcy5zZXRFbnYoJ2RldicpO1xuICogICAgICBjcy5nZXQoJ2xvZ0xldmVsJyk7IC8vcmV0dXJucyAnREVCVUcnXG4gKlxuICogICAgICBjcy5zZXRFbnYoJ3Byb2QnKTtcbiAqICAgICAgY3MuZ2V0KCdsb2dMZXZlbCcpOyAvL3JldHVybnMgJ25vbmUnXG4gKlxuICovXG5cbid1c2Ugc3RyaWN0JztcbnZhciB1cmxTZXJ2aWNlID0gcmVxdWlyZSgnLi91cmwtY29uZmlnLXNlcnZpY2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgLy9UT0RPOiBFbnZpcm9ubWVudHNcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIGxvZ0xldmVsOiAnTk9ORSdcbiAgICB9O1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcbiAgICBzZXJ2aWNlT3B0aW9ucy5zZXJ2ZXIgPSB1cmxTZXJ2aWNlKHNlcnZpY2VPcHRpb25zLnNlcnZlcik7XG5cbiAgICByZXR1cm4ge1xuXG4gICAgICAgIGRhdGE6IHNlcnZpY2VPcHRpb25zLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgdGhlIGVudmlyb25tZW50IGtleSB0byBnZXQgY29uZmlndXJhdGlvbiBvcHRpb25zIGZyb21cbiAgICAgICAgICogQHBhcmFtIHsgc3RyaW5nfSBlbnZcbiAgICAgICAgICovXG4gICAgICAgIHNldEVudjogZnVuY3Rpb24gKGVudikge1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBjb25maWd1cmF0aW9uLlxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfSBwcm9wZXJ0eSBvcHRpb25hbFxuICAgICAgICAgKiBAcmV0dXJuIHsqfSAgICAgICAgICBWYWx1ZSBvZiBwcm9wZXJ0eSBpZiBzcGVjaWZpZWQsIHRoZSBlbnRpcmUgY29uZmlnIG9iamVjdCBvdGhlcndpc2VcbiAgICAgICAgICovXG4gICAgICAgIGdldDogZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICByZXR1cm4gc2VydmljZU9wdGlvbnNbcHJvcGVydHldO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgY29uZmlndXJhdGlvbi5cbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xPYmplY3R9IGtleSBpZiBhIGtleSBpcyBwcm92aWRlZCwgc2V0IGEga2V5IHRvIHRoYXQgdmFsdWUuIE90aGVyd2lzZSBtZXJnZSBvYmplY3Qgd2l0aCBjdXJyZW50IGNvbmZpZ1xuICAgICAgICAgKiBAcGFyYW0gIHsqfSB2YWx1ZSAgdmFsdWUgZm9yIHByb3ZpZGVkIGtleVxuICAgICAgICAgKi9cbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnNba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbiIsIi8qKlxuICogIyMgRGF0YSBBUEkgU2VydmljZVxuICpcbiAqIFRoZSBEYXRhIEFQSSBTZXJ2aWNlIGFsbG93cyB5b3UgdG8gY3JlYXRlLCBhY2Nlc3MsIGFuZCBtYW5pcHVsYXRlIGRhdGEgcmVsYXRlZCB0byBhbnkgb2YgeW91ciBwcm9qZWN0cy4gRGF0YSBhcmUgb3JnYW5pemVkIGluIGNvbGxlY3Rpb25zLiBFYWNoIGNvbGxlY3Rpb24gY29udGFpbnMgYSBkb2N1bWVudDsgZWFjaCBlbGVtZW50IG9mIHRoaXMgdG9wLWxldmVsIGRvY3VtZW50IGlzIGEgSlNPTiBvYmplY3QuIChTZWUgYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBvbiB0aGUgdW5kZXJseWluZyBbRGF0YSBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9kYXRhX2FwaS8pLilcbiAqXG4gKiBBbGwgQVBJIGNhbGxzIHRha2UgaW4gYW4gXCJvcHRpb25zXCIgb2JqZWN0IGFzIHRoZSBsYXN0IHBhcmFtZXRlci4gVGhlIG9wdGlvbnMgY2FuIGJlIHVzZWQgdG8gZXh0ZW5kL292ZXJyaWRlIHRoZSBEYXRhIEFQSSBTZXJ2aWNlIGRlZmF1bHRzLiBJbiBwYXJ0aWN1bGFyLCB0aGVyZSBhcmUgdGhyZWUgcmVxdWlyZWQgcGFyYW1ldGVycyB3aGVuIHlvdSBpbnN0YW50aWF0ZSB0aGUgRGF0YSBTZXJ2aWNlOlxuICpcbiAqICogYGFjY291bnRgOiBFcGljZW50ZXIgYWNjb3VudCBpZCAoKipUZWFtIElEKiogZm9yIHRlYW0gcHJvamVjdHMsICoqVXNlciBJRCoqIGZvciBwZXJzb25hbCBwcm9qZWN0cykuXG4gKiAqIGBwcm9qZWN0YDogRXBpY2VudGVyIHByb2plY3QgaWQuXG4gKiAqIGByb290YDogVGhlIHRoZSBuYW1lIG9mIHRoZSBjb2xsZWN0aW9uLiBJZiB5b3UgaGF2ZSBtdWx0aXBsZSBjb2xsZWN0aW9ucyB3aXRoaW4gZWFjaCBvZiB5b3VyIHByb2plY3RzLCB5b3UgY2FuIGFsc28gcGFzcyB0aGUgY29sbGVjdGlvbiBuYW1lIGFzIGFuIG9wdGlvbiBmb3IgZWFjaCBjYWxsLlxuICpcbiAqICAgICAgIHZhciBkcyA9IG5ldyBGLnNlcnZpY2UuRGF0YSh7XG4gKiAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gKiAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICogICAgICAgICAgcm9vdDogJ3N1cnZleS1yZXNwb25zZXMnLFxuICogICAgICAgICAgc2VydmVyOiB7IGhvc3Q6ICdhcGkuZm9yaW8uY29tJyB9XG4gKiAgICAgICB9KTtcbiAqICAgICAgIGRzLnNhdmVBcygndXNlcjEnLFxuICogICAgICAgICAgeyAncXVlc3Rpb24xJzogMiwgJ3F1ZXN0aW9uMic6IDEwLFxuICogICAgICAgICAgJ3F1ZXN0aW9uMyc6IGZhbHNlLCAncXVlc3Rpb240JzogJ3NvbWV0aW1lcycgfSApO1xuICogICAgICAgZHMuc2F2ZUFzKCd1c2VyMicsXG4gKiAgICAgICAgICB7ICdxdWVzdGlvbjEnOiAzLCAncXVlc3Rpb24yJzogOCxcbiAqICAgICAgICAgICdxdWVzdGlvbjMnOiB0cnVlLCAncXVlc3Rpb240JzogJ2Fsd2F5cycgfSApO1xuICogICAgICAgZHMucXVlcnkoJycseyAncXVlc3Rpb24yJzogeyAnJGd0JzogOX0gfSk7XG4gKlxuICogTm90ZSB0aGF0IGluIGFkZGl0aW9uIHRvIHRoZSBgYWNjb3VudGAsIGBwcm9qZWN0YCwgYW5kIGByb290YCwgdGhlIERhdGEgU2VydmljZSBwYXJhbWV0ZXJzIG9wdGlvbmFsbHkgaW5jbHVkZSBhIGBzZXJ2ZXJgIG9iamVjdCwgd2hvc2UgYGhvc3RgIGZpZWxkIGNvbnRhaW5zIHRoZSBVUkkgb2YgdGhlIEZvcmlvIHNlcnZlci4gVGhpcyBpcyBhdXRvbWF0aWNhbGx5IHNldCwgYnV0IHlvdSBjYW4gcGFzcyBpdCBleHBsaWNpdGx5IGlmIGRlc2lyZWQuIEl0IGlzIG1vc3QgY29tbW9ubHkgdXNlZCBmb3IgY2xhcml0eSB3aGVuIHlvdSBhcmUgW2hvc3RpbmcgYW4gRXBpY2VudGVyIHByb2plY3Qgb24geW91ciBvd24gc2VydmVyXSguLi8uLi8uLi9ob3dfdG8vc2VsZl9ob3N0aW5nLykuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgcXV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3F1ZXJ5LXV0aWwnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbnZhciBTZXNzaW9uTWFuYWdlciA9IHJlcXVpcmUoJy4uL3N0b3JlL3Nlc3Npb24tbWFuYWdlcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOYW1lIG9mIGNvbGxlY3Rpb24uIERlZmF1bHRzIHRvIGAvYCwgdGhhdCBpcywgdGhlIHJvb3QgbGV2ZWwgb2YgeW91ciBwcm9qZWN0IGF0IGBmb3Jpby5jb20vYXBwL3lvdXItYWNjb3VudC1pZC95b3VyLXByb2plY3QtaWQvYC4gUmVxdWlyZWQuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICByb290OiAnLycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY2NvdW50IGlkLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpIG9yICoqVXNlciBJRCoqIChmb3IgcGVyc29uYWwgcHJvamVjdHMpLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBhY2NvdW50OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBwcm9qZWN0IGlkLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBwcm9qZWN0OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvciBvcGVyYXRpb25zIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZykuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdG9rZW46IHVuZGVmaW5lZCxcblxuICAgICAgICAvL09wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXJcbiAgICAgICAgdHJhbnNwb3J0OiB7fVxuICAgIH07XG4gICAgdGhpcy5zZXNzaW9uTWFuYWdlciA9IG5ldyBTZXNzaW9uTWFuYWdlcigpO1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyhkZWZhdWx0cywgY29uZmlnKTtcblxuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICB1cmxDb25maWcuYWNjb3VudFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5hY2NvdW50O1xuICAgIH1cbiAgICBpZiAoc2VydmljZU9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICB1cmxDb25maWcucHJvamVjdFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0O1xuICAgIH1cblxuICAgIHZhciBnZXRVUkwgPSBmdW5jdGlvbiAoa2V5LCByb290KSB7XG4gICAgICAgIGlmICghcm9vdCkge1xuICAgICAgICAgICAgcm9vdCA9IHNlcnZpY2VPcHRpb25zLnJvb3Q7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHVybCA9IHVybENvbmZpZy5nZXRBUElQYXRoKCdkYXRhJykgKyBxdXRpbC5hZGRUcmFpbGluZ1NsYXNoKHJvb3QpO1xuICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICB1cmwgKz0gcXV0aWwuYWRkVHJhaWxpbmdTbGFzaChrZXkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfTtcblxuICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgdXJsOiBnZXRVUkxcbiAgICB9KTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgaHR0cE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkoaHR0cE9wdGlvbnMpO1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2VhcmNoIGZvciBkYXRhIHdpdGhpbiBhIGNvbGxlY3Rpb24uXG4gICAgICAgICAqXG4gICAgICAgICAqIFNlYXJjaGluZyB1c2luZyBjb21wYXJpc29uIG9yIGxvZ2ljYWwgb3BlcmF0b3JzIChhcyBvcHBvc2VkIHRvIGV4YWN0IG1hdGNoZXMpIHJlcXVpcmVzIE1vbmdvREIgc3ludGF4LiBTZWUgdGhlIHVuZGVybHlpbmcgW0RhdGEgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvZGF0YV9hcGkvI3NlYXJjaGluZykgZm9yIGFkZGl0aW9uYWwgZGV0YWlscy5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlcyoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gcmVxdWVzdCBhbGwgZGF0YSBhc3NvY2lhdGVkIHdpdGggZG9jdW1lbnQgJ3VzZXIxJ1xuICAgICAgICAgKiAgICAgIGRzLnF1ZXJ5KCd1c2VyMScpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIGV4YWN0IG1hdGNoaW5nOlxuICAgICAgICAgKiAgICAgIC8vIHJlcXVlc3QgYWxsIGRvY3VtZW50cyBpbiBjb2xsZWN0aW9uIHdoZXJlICdxdWVzdGlvbjInIGlzIDlcbiAgICAgICAgICogICAgICBkcy5xdWVyeSgnJywgeyAncXVlc3Rpb24yJzogOX0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIGNvbXBhcmlzb24gb3BlcmF0b3JzOlxuICAgICAgICAgKiAgICAgIC8vIHJlcXVlc3QgYWxsIGRvY3VtZW50cyBpbiBjb2xsZWN0aW9uXG4gICAgICAgICAqICAgICAgLy8gd2hlcmUgJ3F1ZXN0aW9uMicgaXMgZ3JlYXRlciB0aGFuIDlcbiAgICAgICAgICogICAgICBkcy5xdWVyeSgnJywgeyAncXVlc3Rpb24yJzogeyAnJGd0JzogOX0gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gbG9naWNhbCBvcGVyYXRvcnM6XG4gICAgICAgICAqICAgICAgLy8gcmVxdWVzdCBhbGwgZG9jdW1lbnRzIGluIGNvbGxlY3Rpb25cbiAgICAgICAgICogICAgICAvLyB3aGVyZSAncXVlc3Rpb24yJyBpcyBsZXNzIHRoYW4gMTAsIGFuZCAncXVlc3Rpb24zJyBpcyBmYWxzZVxuICAgICAgICAgKiAgICAgIGRzLnF1ZXJ5KCcnLCB7ICckYW5kJzogWyB7ICdxdWVzdGlvbjInOiB7ICckbHQnOjEwfSB9LCB7ICdxdWVzdGlvbjMnOiBmYWxzZSB9XSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyByZWd1bGFyIGV4cHJlc3NzaW9uczogdXNlIGFueSBQZXJsLWNvbXBhdGlibGUgcmVndWxhciBleHByZXNzaW9uc1xuICAgICAgICAgKiAgICAgIC8vIHJlcXVlc3QgYWxsIGRvY3VtZW50cyBpbiBjb2xsZWN0aW9uXG4gICAgICAgICAqICAgICAgLy8gd2hlcmUgJ3F1ZXN0aW9uNScgY29udGFpbnMgdGhlIHN0cmluZyAnLipkYXknXG4gICAgICAgICAqICAgICAgZHMucXVlcnkoJycsIHsgJ3F1ZXN0aW9uNSc6IHsgJyRyZWdleCc6ICcuKmRheScgfSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGtleSBUaGUgbmFtZSBvZiB0aGUgZG9jdW1lbnQgdG8gc2VhcmNoLiBQYXNzIHRoZSBlbXB0eSBzdHJpbmcgKCcnKSB0byBzZWFyY2ggdGhlIGVudGlyZSBjb2xsZWN0aW9uLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcXVlcnkgVGhlIHF1ZXJ5IG9iamVjdC4gRm9yIGV4YWN0IG1hdGNoaW5nLCB0aGlzIG9iamVjdCBjb250YWlucyB0aGUgZmllbGQgbmFtZSBhbmQgZmllbGQgdmFsdWUgdG8gbWF0Y2guIEZvciBtYXRjaGluZyBiYXNlZCBvbiBjb21wYXJpc29uLCB0aGlzIG9iamVjdCBjb250YWlucyB0aGUgZmllbGQgbmFtZSBhbmQgdGhlIGNvbXBhcmlzb24gZXhwcmVzc2lvbi4gRm9yIG1hdGNoaW5nIGJhc2VkIG9uIGxvZ2ljYWwgb3BlcmF0b3JzLCB0aGlzIG9iamVjdCBjb250YWlucyBhbiBleHByZXNzaW9uIHVzaW5nIE1vbmdvREIgc3ludGF4LiBTZWUgdGhlIHVuZGVybHlpbmcgW0RhdGEgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvZGF0YV9hcGkvI3NlYXJjaGluZykgZm9yIGFkZGl0aW9uYWwgZXhhbXBsZXMuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvdXRwdXRNb2RpZmllciAoT3B0aW9uYWwpIEF2YWlsYWJsZSBmaWVsZHMgaW5jbHVkZTogYHN0YXJ0cmVjb3JkYCwgYGVuZHJlY29yZGAsIGBzb3J0YCwgYW5kIGBkaXJlY3Rpb25gIChgYXNjYCBvciBgZGVzY2ApLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBcbiAgICAgICAgICovXG4gICAgICAgIHF1ZXJ5OiBmdW5jdGlvbiAoa2V5LCBxdWVyeSwgb3V0cHV0TW9kaWZpZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSAkLmV4dGVuZCh0cnVlLCB7IHE6IHF1ZXJ5IH0sIG91dHB1dE1vZGlmaWVyKTtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBodHRwT3B0aW9ucy51cmwgPSBnZXRVUkwoa2V5LCBodHRwT3B0aW9ucy5yb290KTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChwYXJhbXMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2F2ZSBkYXRhIHRvIGFuIGFub255bW91cyBkb2N1bWVudCB3aXRoaW4gdGhlIGNvbGxlY3Rpb24uXG4gICAgICAgICAqXG4gICAgICAgICAqIChEb2N1bWVudHMgYXJlIHRvcC1sZXZlbCBlbGVtZW50cyB3aXRoaW4gYSBjb2xsZWN0aW9uLiBDb2xsZWN0aW9ucyBtdXN0IGJlIHVuaXF1ZSB3aXRoaW4gdGhpcyBhY2NvdW50ICh0ZWFtIG9yIHBlcnNvbmFsIGFjY291bnQpIGFuZCBwcm9qZWN0IGFuZCBhcmUgc2V0IHdpdGggdGhlIGByb290YCBmaWVsZCBpbiB0aGUgYG9wdGlvbmAgcGFyYW1ldGVyLiBTZWUgdGhlIHVuZGVybHlpbmcgW0RhdGEgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvZGF0YV9hcGkvKSBmb3IgYWRkaXRpb25hbCBiYWNrZ3JvdW5kLilcbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICBkcy5zYXZlKCdxdWVzdGlvbjEnLCAneWVzJyk7XG4gICAgICAgICAqICAgICAgZHMuc2F2ZSh7cXVlc3Rpb24xOid5ZXMnLCBxdWVzdGlvbjI6IDMyIH0pO1xuICAgICAgICAgKiAgICAgIGRzLnNhdmUoeyBuYW1lOidKb2huJywgY2xhc3NOYW1lOiAnQ1MxMDEnIH0sIHsgcm9vdDogJ3N0dWRlbnRzJyB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBrZXkgSWYgYGtleWAgaXMgYSBzdHJpbmcsIGl0IGlzIHRoZSBpZCBvZiB0aGUgZWxlbWVudCB0byBzYXZlIChjcmVhdGUpIGluIHRoaXMgZG9jdW1lbnQuIElmIGBrZXlgIGlzIGFuIG9iamVjdCwgdGhlIG9iamVjdCBpcyB0aGUgZGF0YSB0byBzYXZlIChjcmVhdGUpIGluIHRoaXMgZG9jdW1lbnQuIEluIGJvdGggY2FzZXMsIHRoZSBpZCBmb3IgdGhlIGRvY3VtZW50IGlzIGdlbmVyYXRlZCBhdXRvbWF0aWNhbGx5LlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWUgKE9wdGlvbmFsKSBUaGUgZGF0YSB0byBzYXZlLiBJZiBga2V5YCBpcyBhIHN0cmluZywgdGhpcyBpcyB0aGUgdmFsdWUgdG8gc2F2ZS4gSWYgYGtleWAgaXMgYW4gb2JqZWN0LCB0aGUgdmFsdWUocykgdG8gc2F2ZSBhcmUgYWxyZWFkeSBwYXJ0IG9mIGBrZXlgIGFuZCB0aGlzIGFyZ3VtZW50IGlzIG5vdCByZXF1aXJlZC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX0gXG4gICAgICAgICAqL1xuICAgICAgICBzYXZlOiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGF0dHJzO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgYXR0cnMgPSBrZXk7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAoYXR0cnMgPSB7fSlba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGh0dHBPcHRpb25zLnVybCA9IGdldFVSTCgnJywgaHR0cE9wdGlvbnMucm9vdCk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QoYXR0cnMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2F2ZSBkYXRhIHRvIGEgbmFtZWQgZG9jdW1lbnQgb3IgZWxlbWVudCB3aXRoaW4gdGhlIGNvbGxlY3Rpb24uIFRoZSBgcm9vdGAgb2YgdGhlIGNvbGxlY3Rpb24gbXVzdCBiZSBzcGVjaWZpZWQgc2VwYXJhdGVseSBpbiBjb25maWd1cmF0aW9uIG9wdGlvbnMsIGVpdGhlciBhcyBwYXJ0IG9mIHRoZSBjYWxsIG9yIGFzIHBhcnQgb2YgdGhlIGluaXRpYWxpemF0aW9uIG9mIGRzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAoRG9jdW1lbnRzIGFyZSB0b3AtbGV2ZWwgZWxlbWVudHMgd2l0aGluIGEgY29sbGVjdGlvbi4gQ29sbGVjdGlvbnMgbXVzdCBiZSB1bmlxdWUgd2l0aGluIHRoaXMgYWNjb3VudCAodGVhbSBvciBwZXJzb25hbCBhY2NvdW50KSBhbmQgcHJvamVjdCBhbmQgYXJlIHNldCB3aXRoIHRoZSBgcm9vdGAgZmllbGQgaW4gdGhlIGBvcHRpb25gIHBhcmFtZXRlci4gU2VlIHRoZSB1bmRlcmx5aW5nIFtEYXRhIEFQSV0oLi4vLi4vLi4vcmVzdF9hcGlzL2RhdGFfYXBpLykgZm9yIGFkZGl0aW9uYWwgYmFja2dyb3VuZC4pXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgZHMuc2F2ZUFzKCd1c2VyMScsXG4gICAgICAgICAqICAgICAgICAgIHsgJ3F1ZXN0aW9uMSc6IDIsICdxdWVzdGlvbjInOiAxMCxcbiAgICAgICAgICogICAgICAgICAgICdxdWVzdGlvbjMnOiBmYWxzZSwgJ3F1ZXN0aW9uNCc6ICdzb21ldGltZXMnIH0gKTtcbiAgICAgICAgICogICAgICBkcy5zYXZlQXMoJ3N0dWRlbnQxJyxcbiAgICAgICAgICogICAgICAgICAgeyBmaXJzdE5hbWU6ICdqb2huJywgbGFzdE5hbWU6ICdzbWl0aCcgfSxcbiAgICAgICAgICogICAgICAgICAgeyByb290OiAnc3R1ZGVudHMnIH0pO1xuICAgICAgICAgKiAgICAgIGRzLnNhdmVBcygnbWdtdDEwMC9ncm91cEInLFxuICAgICAgICAgKiAgICAgICAgICB7IHNjZW5hcmlvWWVhcjogJzIwMTUnIH0sXG4gICAgICAgICAqICAgICAgICAgIHsgcm9vdDogJ215Y2xhc3NlcycgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgSWQgb2YgdGhlIGRvY3VtZW50LlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWUgKE9wdGlvbmFsKSBUaGUgZGF0YSB0byBzYXZlLCBpbiBrZXk6dmFsdWUgcGFpcnMuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9IFxuICAgICAgICAgKi9cbiAgICAgICAgc2F2ZUFzOiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGh0dHBPcHRpb25zLnVybCA9IGdldFVSTChrZXksIGh0dHBPcHRpb25zLnJvb3QpO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wdXQodmFsdWUsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IGRhdGEgZm9yIGEgc3BlY2lmaWMgZG9jdW1lbnQgb3IgZmllbGQuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgZHMubG9hZCgndXNlcjEnKTtcbiAgICAgICAgICogICAgICBkcy5sb2FkKCd1c2VyMS9xdWVzdGlvbjMnKTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtICB7U3RyaW5nfE9iamVjdH0ga2V5IFRoZSBpZCBvZiB0aGUgZGF0YSB0byByZXR1cm4uIENhbiBiZSB0aGUgaWQgb2YgYSBkb2N1bWVudCwgb3IgYSBwYXRoIHRvIGRhdGEgd2l0aGluIHRoYXQgZG9jdW1lbnQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvdXRwdXRNb2RpZmllciAoT3B0aW9uYWwpIEF2YWlsYWJsZSBmaWVsZHMgaW5jbHVkZTogYHN0YXJ0cmVjb3JkYCwgYGVuZHJlY29yZGAsIGBzb3J0YCwgYW5kIGBkaXJlY3Rpb25gIChgYXNjYCBvciBgZGVzY2ApLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX0gXG4gICAgICAgICAqL1xuICAgICAgICBsb2FkOiBmdW5jdGlvbiAoa2V5LCBvdXRwdXRNb2RpZmllciwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGh0dHBPcHRpb25zLnVybCA9IGdldFVSTChrZXksIGh0dHBPcHRpb25zLnJvb3QpO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KG91dHB1dE1vZGlmaWVyLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZXMgZGF0YSBmcm9tIGNvbGxlY3Rpb24uIE9ubHkgZG9jdW1lbnRzICh0b3AtbGV2ZWwgZWxlbWVudHMgaW4gZWFjaCBjb2xsZWN0aW9uKSBjYW4gYmUgZGVsZXRlZC5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIGRzLnJlbW92ZSgndXNlcjEnKTtcbiAgICAgICAgICpcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd8QXJyYXl9IGtleXMgVGhlIGlkIG9mIHRoZSBkb2N1bWVudCB0byByZW1vdmUgZnJvbSB0aGlzIGNvbGxlY3Rpb24sIG9yIGFuIGFycmF5IG9mIHN1Y2ggaWRzLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBcbiAgICAgICAgICovXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24gKGtleXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgcGFyYW1zO1xuICAgICAgICAgICAgaWYgKCQuaXNBcnJheShrZXlzKSkge1xuICAgICAgICAgICAgICAgIHBhcmFtcyA9IHsgaWQ6IGtleXMgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zID0gJyc7XG4gICAgICAgICAgICAgICAgaHR0cE9wdGlvbnMudXJsID0gZ2V0VVJMKGtleXMsIGh0dHBPcHRpb25zLnJvb3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZGVsZXRlKHBhcmFtcywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRXBpY2VudGVyIGRvZXNuJ3QgYWxsb3cgbnVraW5nIGNvbGxlY3Rpb25zXG4gICAgICAgIC8vICAgICAvKipcbiAgICAgICAgLy8gICAgICAqIFJlbW92ZXMgY29sbGVjdGlvbiBiZWluZyByZWZlcmVuY2VkXG4gICAgICAgIC8vICAgICAgKiBAcmV0dXJuIG51bGxcbiAgICAgICAgLy8gICAgICAqL1xuICAgICAgICAvLyAgICAgZGVzdHJveTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgLy8gICAgICAgICByZXR1cm4gdGhpcy5yZW1vdmUoJycsIG9wdGlvbnMpO1xuICAgICAgICAvLyAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIi8qKlxuICpcbiAqICMjIEdyb3VwIEFQSSBBZGFwdGVyXG4gKlxuICogVGhlIEdyb3VwIEFQSSBBZGFwdGVyIHByb3ZpZGVzIG1ldGhvZHMgdG8gbG9vayB1cCwgY3JlYXRlLCBjaGFuZ2Ugb3IgcmVtb3ZlIGluZm9ybWF0aW9uIGFib3V0IGdyb3VwcyBpbiBhIHByb2plY3QuIEl0IGlzIGJhc2VkIG9uIHF1ZXJ5IGNhcGFiaWxpdGllcyBvZiB0aGUgdW5kZXJseWluZyBSRVNUZnVsIFtHcm91cCBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy91c2VyX21hbmFnZW1lbnQvZ3JvdXAvKS5cbiAqXG4gKiBUaGlzIGlzIG9ubHkgbmVlZGVkIGZvciBBdXRoZW50aWNhdGVkIHByb2plY3RzLCB0aGF0IGlzLCB0ZWFtIHByb2plY3RzIHdpdGggW2VuZCB1c2VycyBhbmQgZ3JvdXBzXSguLi8uLi8uLi9ncm91cHNfYW5kX2VuZF91c2Vycy8pLlxuICpcbiAqICAgICAgdmFyIG1hID0gbmV3IEYuc2VydmljZS5Hcm91cCh7IHRva2VuOiAndXNlci1vci1wcm9qZWN0LWFjY2Vzcy10b2tlbicgfSk7XG4gKiAgICAgIG1hLmdldEdyb3Vwc0ZvclByb2plY3QoeyBhY2NvdW50OiAnYWNtZScsIHByb2plY3Q6ICdzYW1wbGUnIH0pO1xuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHNlcnZpY2VVdGlscyA9IHJlcXVpcmUoJy4vc2VydmljZS11dGlscycpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xudmFyIG9iamVjdEFzc2lnbiA9IHJlcXVpcmUoJ29iamVjdC1hc3NpZ24nKTtcblxudmFyIGFwaUVuZHBvaW50ID0gJ2dyb3VwL2xvY2FsJztcblxudmFyIEdyb3VwU2VydmljZSA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFcGljZW50ZXIgYWNjb3VudCBuYW1lLiBEZWZhdWx0cyB0byB1bmRlZmluZWQuXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBhY2NvdW50OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEVwaWNlbnRlciBwcm9qZWN0IG5hbWUuIERlZmF1bHRzIHRvIHVuZGVmaW5lZC5cbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHByb2plY3Q6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucyB0byBwYXNzIG9uIHRvIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBsYXllci4gQWxsIGpxdWVyeS5hamF4IG9wdGlvbnMgYXQgaHR0cDovL2FwaS5qcXVlcnkuY29tL2pRdWVyeS5hamF4LyBhcmUgYXZhaWxhYmxlLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IHt9XG4gICAgfTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSBzZXJ2aWNlVXRpbHMuZ2V0RGVmYXVsdE9wdGlvbnMoZGVmYXVsdHMsIGNvbmZpZywgeyBhcGlFbmRwb2ludDogYXBpRW5kcG9pbnQgfSk7XG4gICAgdmFyIHRyYW5zcG9ydE9wdGlvbnMgPSBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQ7XG4gICAgZGVsZXRlIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydDtcbiAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KHRyYW5zcG9ydE9wdGlvbnMsIHNlcnZpY2VPcHRpb25zKTtcbiAgICB2YXIgcHVibGljQVBJID0ge1xuICAgICAgICAvKipcbiAgICAgICAgKiBHZXRzIGluZm9ybWF0aW9uIGZvciBhIGdyb3VwIG9yIG11bHRpcGxlIGdyb3Vwcy5cbiAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIG9iamVjdCB3aXRoIHF1ZXJ5IHBhcmFtZXRlcnNcbiAgICAgICAgKiBAcGF0YW0ge3N0cmluZ30gcGFyYW1zLnEgcGFydGlhbCBtYXRjaCBmb3IgbmFtZSwgb3JnYW5pemF0aW9uIG9yIGV2ZW50LlxuICAgICAgICAqIEBwYXRhbSB7c3RyaW5nfSBwYXJhbXMuYWNjb3VudCBFcGljZW50ZXIncyBUZWFtIElEXG4gICAgICAgICogQHBhdGFtIHtzdHJpbmd9IHBhcmFtcy5wcm9qZWN0IEVwaWNlbnRlcidzIFByb2plY3QgSURcbiAgICAgICAgKiBAcGF0YW0ge3N0cmluZ30gcGFyYW1zLm5hbWUgRXBpY2VudGVyJ3MgR3JvdXAgTmFtZVxuICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgZ2V0R3JvdXBzOiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAvL2dyb3VwSUQgaXMgcGFydCBvZiB0aGUgVVJMXG4gICAgICAgICAgICAvL3EsIGFjY291bnQgYW5kIHByb2plY3QgYXJlIHBhcnQgb2YgdGhlIHF1ZXJ5IHN0cmluZ1xuICAgICAgICAgICAgdmFyIGZpbmFsT3B0cyA9IG9iamVjdEFzc2lnbih7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIGZpbmFsUGFyYW1zO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJhbXMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgZmluYWxPcHRzLnVybCA9IHNlcnZpY2VVdGlscy5nZXRBcGlVcmwoYXBpRW5kcG9pbnQgKyAnLycgKyBwYXJhbXMsIGZpbmFsT3B0cyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZpbmFsUGFyYW1zID0gcGFyYW1zO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KGZpbmFsUGFyYW1zLCBmaW5hbE9wdHMpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBvYmplY3RBc3NpZ24odGhpcywgcHVibGljQVBJKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR3JvdXBTZXJ2aWNlO1xuIiwiLyoqXG4gKlxuICogIyMgSW50cm9zcGVjdGlvbiBBUEkgU2VydmljZVxuICpcbiAqIFRoZSBJbnRyb3NwZWN0aW9uIEFQSSBTZXJ2aWNlIGFsbG93cyB5b3UgdG8gdmlldyBhIGxpc3Qgb2YgdGhlIHZhcmlhYmxlcyBhbmQgb3BlcmF0aW9ucyBpbiBhIG1vZGVsLiBUeXBpY2FsbHkgdXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZSBbUnVuIEFQSSBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKS5cbiAqXG4gKiBUaGUgSW50cm9zcGVjdGlvbiBBUEkgU2VydmljZSBpcyBub3QgYXZhaWxhYmxlIGZvciBGb3JpbyBTaW1MYW5nLlxuICpcbiAqICAgICAgIHZhciBpbnRybyA9IG5ldyBGLnNlcnZpY2UuSW50cm9zcGVjdCh7XG4gKiAgICAgICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAqICAgICAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJ1xuICogICAgICAgfSk7XG4gKiAgICAgICBpbnRyby5ieU1vZGVsKCdzdXBwbHktY2hhaW4ucHknKS50aGVuKGZ1bmN0aW9uKGRhdGEpeyAuLi4gfSk7XG4gKiAgICAgICBpbnRyby5ieVJ1bklEKCcyYjRkOGY3MS01YzM0LTQzNWEtOGMxNi05ZGU2NzRhYjcyZTYnKS50aGVuKGZ1bmN0aW9uKGRhdGEpeyAuLi4gfSk7XG4gKlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG5cbnZhciBhcGlFbmRwb2ludCA9ICdtb2RlbC9pbnRyb3NwZWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRm9yIHByb2plY3RzIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZykuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdG9rZW46IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGFjY291bnQgaWQuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHByb2plY3QgaWQuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHByb2plY3Q6IHVuZGVmaW5lZCxcblxuICAgIH07XG5cbiAgICB2YXIgc2Vzc2lvbk1hbmFnZXIgPSBuZXcgU2Vzc2lvbk1hbmFnZXIoKTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSBzZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKGRlZmF1bHRzLCBjb25maWcpO1xuXG4gICAgdmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKHNlcnZpY2VPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy5hY2NvdW50KSB7XG4gICAgICAgIHVybENvbmZpZy5hY2NvdW50UGF0aCA9IHNlcnZpY2VPcHRpb25zLmFjY291bnQ7XG4gICAgfVxuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0KSB7XG4gICAgICAgIHVybENvbmZpZy5wcm9qZWN0UGF0aCA9IHNlcnZpY2VPcHRpb25zLnByb2plY3Q7XG4gICAgfVxuXG4gICAgdmFyIHRyYW5zcG9ydE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpXG4gICAgfSk7XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIHRyYW5zcG9ydE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkodHJhbnNwb3J0T3B0aW9ucyk7XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHRoZSBhdmFpbGFibGUgdmFyaWFibGVzIGFuZCBvcGVyYXRpb25zIGZvciBhIGdpdmVuIG1vZGVsIGZpbGUuXG4gICAgICAgICAqXG4gICAgICAgICAqIE5vdGU6IFRoaXMgZG9lcyBub3Qgd29yayBmb3IgYW55IG1vZGVsIHdoaWNoIHJlcXVpcmVzIGFkZGl0aW9uYWwgcGFyYW1ldGVycywgc3VjaCBhcyBgZmlsZXNgLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIGludHJvLmJ5TW9kZWwoJ2FiYy52bWYnKVxuICAgICAgICAgKiAgICAgICAgICAudGhlbihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAqICAgICAgICAgICAgICAvLyBkYXRhIGNvbnRhaW5zIGFuIG9iamVjdCB3aXRoIGF2YWlsYWJsZSBmdW5jdGlvbnMgKHVzZWQgd2l0aCBvcGVyYXRpb25zIEFQSSkgYW5kIGF2YWlsYWJsZSB2YXJpYWJsZXMgKHVzZWQgd2l0aCB2YXJpYWJsZXMgQVBJKVxuICAgICAgICAgKiAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YS5mdW5jdGlvbnMpO1xuICAgICAgICAgKiAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YS52YXJpYWJsZXMpO1xuICAgICAgICAgKiAgICAgICAgICB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtICB7U3RyaW5nfSBtb2RlbEZpbGUgTmFtZSBvZiB0aGUgbW9kZWwgZmlsZSB0byBpbnRyb3NwZWN0LlxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX0gXG4gICAgICAgICAqL1xuICAgICAgICBieU1vZGVsOiBmdW5jdGlvbiAobW9kZWxGaWxlLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgb3B0cyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBpZiAoIW9wdHMuYWNjb3VudCB8fCAhb3B0cy5wcm9qZWN0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBY2NvdW50IGFuZCBwcm9qZWN0IGFyZSByZXF1aXJlZCB3aGVuIHVzaW5nIGludHJvc3BlY3QjYnlNb2RlbCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFtb2RlbEZpbGUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21vZGVsRmlsZSBpcyByZXF1aXJlZCB3aGVuIHVzaW5nIGludHJvc3BlY3QjYnlNb2RlbCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHVybCA9IHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBbb3B0cy5hY2NvdW50LCBvcHRzLnByb2plY3QsIG1vZGVsRmlsZV0uam9pbignLycpIH07XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMsIHVybCk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoJycsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHRoZSBhdmFpbGFibGUgdmFyaWFibGVzIGFuZCBvcGVyYXRpb25zIGZvciBhIGdpdmVuIG1vZGVsIGZpbGUuXG4gICAgICAgICAqXG4gICAgICAgICAqIE5vdGU6IFRoaXMgZG9lcyBub3Qgd29yayBmb3IgYW55IG1vZGVsIHdoaWNoIHJlcXVpcmVzIGFkZGl0aW9uYWwgcGFyYW1ldGVycyBzdWNoIGFzIGBmaWxlc2AuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgaW50cm8uYnlSdW5JRCgnMmI0ZDhmNzEtNWMzNC00MzVhLThjMTYtOWRlNjc0YWI3MmU2JylcbiAgICAgICAgICogICAgICAgICAgLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgKiAgICAgICAgICAgICAgLy8gZGF0YSBjb250YWlucyBhbiBvYmplY3Qgd2l0aCBhdmFpbGFibGUgZnVuY3Rpb25zICh1c2VkIHdpdGggb3BlcmF0aW9ucyBBUEkpIGFuZCBhdmFpbGFibGUgdmFyaWFibGVzICh1c2VkIHdpdGggdmFyaWFibGVzIEFQSSlcbiAgICAgICAgICogICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEuZnVuY3Rpb25zKTtcbiAgICAgICAgICogICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEudmFyaWFibGVzKTtcbiAgICAgICAgICogICAgICAgICAgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gcnVuSUQgSWQgb2YgdGhlIHJ1biB0byBpbnRyb3NwZWN0LlxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX0gXG4gICAgICAgICAqL1xuICAgICAgICBieVJ1bklEOiBmdW5jdGlvbiAocnVuSUQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmICghcnVuSUQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3J1bklEIGlzIHJlcXVpcmVkIHdoZW4gdXNpbmcgaW50cm9zcGVjdCNieU1vZGVsJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdXJsID0geyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHJ1bklEIH07XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMsIHVybCk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoJycsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG4iLCIvKipcbiAqXG4gKiAjIyBNZW1iZXIgQVBJIEFkYXB0ZXJcbiAqXG4gKiBUaGUgTWVtYmVyIEFQSSBBZGFwdGVyIHByb3ZpZGVzIG1ldGhvZHMgdG8gbG9vayB1cCBpbmZvcm1hdGlvbiBhYm91dCBlbmQgdXNlcnMgZm9yIHlvdXIgcHJvamVjdCBhbmQgaG93IHRoZXkgYXJlIGRpdmlkZWQgYWNyb3NzIGdyb3Vwcy4gSXQgaXMgYmFzZWQgb24gcXVlcnkgY2FwYWJpbGl0aWVzIG9mIHRoZSB1bmRlcmx5aW5nIFJFU1RmdWwgW01lbWJlciBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy91c2VyX21hbmFnZW1lbnQvbWVtYmVyLykuXG4gKlxuICogVGhpcyBpcyBvbmx5IG5lZWRlZCBmb3IgQXV0aGVudGljYXRlZCBwcm9qZWN0cywgdGhhdCBpcywgdGVhbSBwcm9qZWN0cyB3aXRoIFtlbmQgdXNlcnMgYW5kIGdyb3Vwc10oLi4vLi4vLi4vZ3JvdXBzX2FuZF9lbmRfdXNlcnMvKS4gRm9yIGV4YW1wbGUsIGlmIHNvbWUgb2YgeW91ciBlbmQgdXNlcnMgYXJlIGZhY2lsaXRhdG9ycywgb3IgaWYgeW91ciBlbmQgdXNlcnMgc2hvdWxkIGJlIHRyZWF0ZWQgZGlmZmVyZW50bHkgYmFzZWQgb24gd2hpY2ggZ3JvdXAgdGhleSBhcmUgaW4sIHVzZSB0aGUgTWVtYmVyIEFQSSB0byBmaW5kIHRoYXQgaW5mb3JtYXRpb24uXG4gKlxuICogICAgICB2YXIgbWEgPSBuZXcgRi5zZXJ2aWNlLk1lbWJlcih7IHRva2VuOiAndXNlci1vci1wcm9qZWN0LWFjY2Vzcy10b2tlbicgfSk7XG4gKiAgICAgIG1hLmdldEdyb3Vwc0ZvclVzZXIoeyB1c2VySWQ6ICdiNmIzMTNhMy1hYjg0LTQ3OWMtYmFlYS0yMDZmNmJmZjMzNycgfSk7XG4gKiAgICAgIG1hLmdldEdyb3VwRGV0YWlscyh7IGdyb3VwSWQ6ICcwMGI1MzMwOC05ODMzLTQ3ZjItYjIxZS0xMjc4YzA3ZDUzYjgnIH0pO1xuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG52YXIgX3BpY2sgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdC11dGlsJykuX3BpY2s7XG52YXIgYXBpRW5kcG9pbnQgPSAnbWVtYmVyL2xvY2FsJztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRXBpY2VudGVyIHVzZXIgaWQuIERlZmF1bHRzIHRvIGEgYmxhbmsgc3RyaW5nLlxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdXNlcklkOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEVwaWNlbnRlciBncm91cCBpZC4gRGVmYXVsdHMgdG8gYSBibGFuayBzdHJpbmcuIE5vdGUgdGhhdCB0aGlzIGlzIHRoZSBncm91cCAqaWQqLCBub3QgdGhlIGdyb3VwICpuYW1lKi5cbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGdyb3VwSWQ6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucyB0byBwYXNzIG9uIHRvIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBsYXllci4gQWxsIGpxdWVyeS5hamF4IG9wdGlvbnMgYXQgaHR0cDovL2FwaS5qcXVlcnkuY29tL2pRdWVyeS5hamF4LyBhcmUgYXZhaWxhYmxlLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IHt9XG4gICAgfTtcbiAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKCk7XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKGRlZmF1bHRzLCBjb25maWcpO1xuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcblxuICAgIHZhciB0cmFuc3BvcnRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KVxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIHRyYW5zcG9ydE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkodHJhbnNwb3J0T3B0aW9ucywgc2VydmljZU9wdGlvbnMpO1xuXG4gICAgdmFyIGdldEZpbmFsUGFyYW1zID0gZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgICBpZiAodHlwZW9mIHBhcmFtcyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHJldHVybiAkLmV4dGVuZCh0cnVlLCBzZXJ2aWNlT3B0aW9ucywgcGFyYW1zKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2VydmljZU9wdGlvbnM7XG4gICAgfTtcblxuICAgIHZhciBwYXRjaFVzZXJBY3RpdmVGaWVsZCA9IGZ1bmN0aW9uIChwYXJhbXMsIGFjdGl2ZSwgb3B0aW9ucykge1xuICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucywge1xuICAgICAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBwYXJhbXMuZ3JvdXBJZCArICcvJyArIHBhcmFtcy51c2VySWRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGh0dHAucGF0Y2goeyBhY3RpdmU6IGFjdGl2ZSB9LCBodHRwT3B0aW9ucyk7XG4gICAgfTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogUmV0cmlldmUgZGV0YWlscyBhYm91dCBhbGwgb2YgdGhlIGdyb3VwIG1lbWJlcnNoaXBzIGZvciBvbmUgZW5kIHVzZXIuIFRoZSBtZW1iZXJzaGlwIGRldGFpbHMgYXJlIHJldHVybmVkIGluIGFuIGFycmF5LCB3aXRoIG9uZSBlbGVtZW50IChncm91cCByZWNvcmQpIGZvciBlYWNoIGdyb3VwIHRvIHdoaWNoIHRoZSBlbmQgdXNlciBiZWxvbmdzLlxuICAgICAgICAqXG4gICAgICAgICogSW4gdGhlIG1lbWJlcnNoaXAgYXJyYXksIGVhY2ggZ3JvdXAgcmVjb3JkIGluY2x1ZGVzIHRoZSBncm91cCBpZCwgcHJvamVjdCBpZCwgYWNjb3VudCAodGVhbSkgaWQsIGFuZCBhbiBhcnJheSBvZiBtZW1iZXJzLiBIb3dldmVyLCBvbmx5IHRoZSB1c2VyIHdob3NlIHVzZXJJZCBpcyBpbmNsdWRlZCBpbiB0aGUgY2FsbCBpcyBsaXN0ZWQgaW4gdGhlIG1lbWJlcnMgYXJyYXkgKHJlZ2FyZGxlc3Mgb2Ygd2hldGhlciB0aGVyZSBhcmUgb3RoZXIgbWVtYmVycyBpbiB0aGlzIGdyb3VwKS5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICB2YXIgbWEgPSBuZXcgRi5zZXJ2aWNlLk1lbWJlcih7IHRva2VuOiAndXNlci1vci1wcm9qZWN0LWFjY2Vzcy10b2tlbicgfSk7XG4gICAgICAgICogICAgICAgbWEuZ2V0R3JvdXBzRm9yVXNlcignNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJylcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24obWVtYmVyc2hpcHMpe1xuICAgICAgICAqICAgICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPG1lbWJlcnNoaXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICogICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cobWVtYmVyc2hpcHNbaV0uZ3JvdXBJZCk7XG4gICAgICAgICogICAgICAgICAgICAgICB9XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICAgbWEuZ2V0R3JvdXBzRm9yVXNlcih7IHVzZXJJZDogJzQyODM2ZDRiLTViNjEtNGZlNC04MGViLTMxMzZlOTU2ZWU1YycgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfG9iamVjdH0gcGFyYW1zIFRoZSB1c2VyIGlkIGZvciB0aGUgZW5kIHVzZXIuIEFsdGVybmF0aXZlbHksIGFuIG9iamVjdCB3aXRoIGZpZWxkIGB1c2VySWRgIGFuZCB2YWx1ZSB0aGUgdXNlciBpZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAqL1xuXG4gICAgICAgIGdldEdyb3Vwc0ZvclVzZXI6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIGlzU3RyaW5nID0gdHlwZW9mIHBhcmFtcyA9PT0gJ3N0cmluZyc7XG4gICAgICAgICAgICB2YXIgb2JqUGFyYW1zID0gZ2V0RmluYWxQYXJhbXMocGFyYW1zKTtcbiAgICAgICAgICAgIGlmICghaXNTdHJpbmcgJiYgIW9ialBhcmFtcy51c2VySWQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHVzZXJJZCBzcGVjaWZpZWQuJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBnZXRQYXJtcyA9IGlzU3RyaW5nID8geyB1c2VySWQ6IHBhcmFtcyB9IDogX3BpY2sob2JqUGFyYW1zLCAndXNlcklkJyk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoZ2V0UGFybXMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBSZXRyaWV2ZSBkZXRhaWxzIGFib3V0IG9uZSBncm91cCwgaW5jbHVkaW5nIGFuIGFycmF5IG9mIGFsbCBpdHMgbWVtYmVycy5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICB2YXIgbWEgPSBuZXcgRi5zZXJ2aWNlLk1lbWJlcih7IHRva2VuOiAndXNlci1vci1wcm9qZWN0LWFjY2Vzcy10b2tlbicgfSk7XG4gICAgICAgICogICAgICAgbWEuZ2V0R3JvdXBEZXRhaWxzKCc4MDI1N2EyNS1hYTEwLTQ5NTktOTY4Yi1mZDA1MzkwMWY3MmYnKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbihncm91cCl7XG4gICAgICAgICogICAgICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8Z3JvdXAubWVtYmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAqICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGdyb3VwLm1lbWJlcnNbaV0udXNlck5hbWUpO1xuICAgICAgICAqICAgICAgICAgICAgICAgfVxuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIG1hLmdldEdyb3VwRGV0YWlscyh7IGdyb3VwSWQ6ICc4MDI1N2EyNS1hYTEwLTQ5NTktOTY4Yi1mZDA1MzkwMWY3MmYnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ3xvYmplY3R9IHBhcmFtcyBUaGUgZ3JvdXAgaWQuIEFsdGVybmF0aXZlbHksIGFuIG9iamVjdCB3aXRoIGZpZWxkIGBncm91cElkYCBhbmQgdmFsdWUgdGhlIGdyb3VwIGlkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgZ2V0R3JvdXBEZXRhaWxzOiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgICAgIHZhciBpc1N0cmluZyA9IHR5cGVvZiBwYXJhbXMgPT09ICdzdHJpbmcnO1xuICAgICAgICAgICAgdmFyIG9ialBhcmFtcyA9IGdldEZpbmFsUGFyYW1zKHBhcmFtcyk7XG4gICAgICAgICAgICBpZiAoIWlzU3RyaW5nICYmICFvYmpQYXJhbXMuZ3JvdXBJZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZ3JvdXBJZCBzcGVjaWZpZWQuJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBncm91cElkID0gaXNTdHJpbmcgPyBwYXJhbXMgOiBvYmpQYXJhbXMuZ3JvdXBJZDtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIGdyb3VwSWQgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KHt9LCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogU2V0IGEgcGFydGljdWxhciBlbmQgdXNlciBhcyBgYWN0aXZlYC4gQWN0aXZlIGVuZCB1c2VycyBjYW4gYmUgYXNzaWduZWQgdG8gW3dvcmxkc10oLi4vd29ybGQtbWFuYWdlci8pIGluIG11bHRpcGxheWVyIGdhbWVzIGR1cmluZyBhdXRvbWF0aWMgYXNzaWdubWVudC5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICB2YXIgbWEgPSBuZXcgRi5zZXJ2aWNlLk1lbWJlcih7IHRva2VuOiAndXNlci1vci1wcm9qZWN0LWFjY2Vzcy10b2tlbicgfSk7XG4gICAgICAgICogICAgICAgbWEubWFrZVVzZXJBY3RpdmUoeyB1c2VySWQ6ICc0MjgzNmQ0Yi01YjYxLTRmZTQtODBlYi0zMTM2ZTk1NmVlNWMnLFxuICAgICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBJZDogJzgwMjU3YTI1LWFhMTAtNDk1OS05NjhiLWZkMDUzOTAxZjcyZicgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgVGhlIGVuZCB1c2VyIGFuZCBncm91cCBpbmZvcm1hdGlvbi5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLnVzZXJJZCBUaGUgaWQgb2YgdGhlIGVuZCB1c2VyIHRvIG1ha2UgYWN0aXZlLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuZ3JvdXBJZCBUaGUgaWQgb2YgdGhlIGdyb3VwIHRvIHdoaWNoIHRoaXMgZW5kIHVzZXIgYmVsb25ncywgYW5kIGluIHdoaWNoIHRoZSBlbmQgdXNlciBzaG91bGQgYmVjb21lIGFjdGl2ZS5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIG1ha2VVc2VyQWN0aXZlOiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gcGF0Y2hVc2VyQWN0aXZlRmllbGQocGFyYW1zLCB0cnVlLCBvcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBTZXQgYSBwYXJ0aWN1bGFyIGVuZCB1c2VyIGFzIGBpbmFjdGl2ZWAuIEluYWN0aXZlIGVuZCB1c2VycyBhcmUgbm90IGFzc2lnbmVkIHRvIFt3b3JsZHNdKC4uL3dvcmxkLW1hbmFnZXIvKSBpbiBtdWx0aXBsYXllciBnYW1lcyBkdXJpbmcgYXV0b21hdGljIGFzc2lnbm1lbnQuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgdmFyIG1hID0gbmV3IEYuc2VydmljZS5NZW1iZXIoeyB0b2tlbjogJ3VzZXItb3ItcHJvamVjdC1hY2Nlc3MtdG9rZW4nIH0pO1xuICAgICAgICAqICAgICAgIG1hLm1ha2VVc2VySW5hY3RpdmUoeyB1c2VySWQ6ICc0MjgzNmQ0Yi01YjYxLTRmZTQtODBlYi0zMTM2ZTk1NmVlNWMnLFxuICAgICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBJZDogJzgwMjU3YTI1LWFhMTAtNDk1OS05NjhiLWZkMDUzOTAxZjcyZicgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgVGhlIGVuZCB1c2VyIGFuZCBncm91cCBpbmZvcm1hdGlvbi5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLnVzZXJJZCBUaGUgaWQgb2YgdGhlIGVuZCB1c2VyIHRvIG1ha2UgaW5hY3RpdmUuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5ncm91cElkIFRoZSBpZCBvZiB0aGUgZ3JvdXAgdG8gd2hpY2ggdGhpcyBlbmQgdXNlciBiZWxvbmdzLCBhbmQgaW4gd2hpY2ggdGhlIGVuZCB1c2VyIHNob3VsZCBiZWNvbWUgaW5hY3RpdmUuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBtYWtlVXNlckluYWN0aXZlOiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gcGF0Y2hVc2VyQWN0aXZlRmllbGQocGFyYW1zLCBmYWxzZSwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG4iLCIvKipcbiAqXG4gKiAjIyBSdW4gQVBJIFNlcnZpY2VcbiAqXG4gKiBUaGUgUnVuIEFQSSBTZXJ2aWNlIGFsbG93cyB5b3UgdG8gcGVyZm9ybSBjb21tb24gdGFza3MgYXJvdW5kIGNyZWF0aW5nIGFuZCB1cGRhdGluZyBydW5zLCB2YXJpYWJsZXMsIGFuZCBkYXRhLlxuICpcbiAqIFdoZW4gYnVpbGRpbmcgaW50ZXJmYWNlcyB0byBzaG93IHJ1biBvbmUgYXQgYSB0aW1lIChhcyBmb3Igc3RhbmRhcmQgZW5kIHVzZXJzKSwgdHlwaWNhbGx5IHlvdSBmaXJzdCBpbnN0YW50aWF0ZSBhIFtSdW4gTWFuYWdlcl0oLi4vcnVuLW1hbmFnZXIvKSBhbmQgdGhlbiBhY2Nlc3MgdGhlIFJ1biBTZXJ2aWNlIHRoYXQgaXMgYXV0b21hdGljYWxseSBwYXJ0IG9mIHRoZSBtYW5hZ2VyLCByYXRoZXIgdGhhbiBpbnN0YW50aWF0aW5nIHRoZSBSdW4gU2VydmljZSBkaXJlY3RseS4gVGhpcyBpcyBiZWNhdXNlIHRoZSBSdW4gTWFuYWdlciBnaXZlcyB5b3UgY29udHJvbCBvdmVyIHJ1biBjcmVhdGlvbiBkZXBlbmRpbmcgb24gcnVuIHN0YXRlcy5cbiAqXG4gKiBIb3dldmVyLCBtYW55IG9mIHRoZSBFcGljZW50ZXIgc2FtcGxlIHByb2plY3RzIHVzZSBhIFJ1biBTZXJ2aWNlLCBiZWNhdXNlIGdlbmVyYWxseSB0aGUgc2FtcGxlIHByb2plY3RzIGFyZSBwbGF5ZWQgaW4gb25lIGVuZCB1c2VyIHNlc3Npb24gYW5kIGRvbid0IGNhcmUgYWJvdXQgcnVuIHN0YXRlcyBvciBbcnVuIHN0cmF0ZWdpZXNdKC4uLy4uL3N0cmF0ZWd5LykuIFRoZSBSdW4gQVBJIFNlcnZpY2UgaXMgYWxzbyB1c2VmdWwgZm9yIGJ1aWxkaW5nIGFuIGludGVyZmFjZSBmb3IgYSBmYWNpbGl0YXRvciwgYmVjYXVzZSBpdCBtYWtlcyBpdCBlYXN5IHRvIGxpc3QgZGF0YSBhY3Jvc3MgbXVsdGlwbGUgcnVucyAodXNpbmcgdGhlIGBmaWx0ZXIoKWAgYW5kIGBxdWVyeSgpYCBtZXRob2RzKS5cbiAqXG4gKiBUbyB1c2UgdGhlIFJ1biBBUEkgU2VydmljZSwgaW5zdGFudGlhdGUgaXQgYnkgcGFzc2luZyBpbjpcbiAqXG4gKiAqIGBhY2NvdW50YDogRXBpY2VudGVyIGFjY291bnQgaWQgKCoqVGVhbSBJRCoqIGZvciB0ZWFtIHByb2plY3RzLCAqKlVzZXIgSUQqKiBmb3IgcGVyc29uYWwgcHJvamVjdHMpLlxuICogKiBgcHJvamVjdGA6IEVwaWNlbnRlciBwcm9qZWN0IGlkLlxuICpcbiAqIEZvciBleGFtcGxlLFxuICpcbiAqICAgICAgIHZhciBycyA9IG5ldyBGLnNlcnZpY2UuUnVuKHtcbiAqICAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICogICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICogICAgICB9KTtcbiAqICAgICAgcnMuY3JlYXRlKCdzdXBwbHlfY2hhaW5fZ2FtZS5weScpLnRoZW4oZnVuY3Rpb24ocnVuKSB7XG4gKiAgICAgICAgICAgICBycy5kbygnc29tZU9wZXJhdGlvbicpO1xuICogICAgICB9KTtcbiAqXG4gKlxuICogQWRkaXRpb25hbGx5LCBhbGwgQVBJIGNhbGxzIHRha2UgaW4gYW4gXCJvcHRpb25zXCIgb2JqZWN0IGFzIHRoZSBsYXN0IHBhcmFtZXRlci4gVGhlIG9wdGlvbnMgY2FuIGJlIHVzZWQgdG8gZXh0ZW5kL292ZXJyaWRlIHRoZSBSdW4gQVBJIFNlcnZpY2UgZGVmYXVsdHMgbGlzdGVkIGJlbG93LlxuICpcbiAqIE5vdGUgdGhhdCBpbiBhZGRpdGlvbiB0byB0aGUgYGFjY291bnRgLCBgcHJvamVjdGAsIGFuZCBgbW9kZWxgLCB0aGUgUnVuIFNlcnZpY2UgcGFyYW1ldGVycyBvcHRpb25hbGx5IGluY2x1ZGUgYSBgc2VydmVyYCBvYmplY3QsIHdob3NlIGBob3N0YCBmaWVsZCBjb250YWlucyB0aGUgVVJJIG9mIHRoZSBGb3JpbyBzZXJ2ZXIuIFRoaXMgaXMgYXV0b21hdGljYWxseSBzZXQsIGJ1dCB5b3UgY2FuIHBhc3MgaXQgZXhwbGljaXRseSBpZiBkZXNpcmVkLiBJdCBpcyBtb3N0IGNvbW1vbmx5IHVzZWQgZm9yIGNsYXJpdHkgd2hlbiB5b3UgYXJlIFtob3N0aW5nIGFuIEVwaWNlbnRlciBwcm9qZWN0IG9uIHlvdXIgb3duIHNlcnZlcl0oLi4vLi4vLi4vaG93X3RvL3NlbGZfaG9zdGluZy8pLlxuICpcbiAqICAgICAgIHZhciBybSA9IG5ldyBGLm1hbmFnZXIuUnVuTWFuYWdlcih7XG4gKiAgICAgICAgICAgcnVuOiB7XG4gKiAgICAgICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAqICAgICAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAqICAgICAgICAgICAgICAgbW9kZWw6ICdzdXBwbHlfY2hhaW5fZ2FtZS5weScsXG4gKiAgICAgICAgICAgICAgIHNlcnZlcjogeyBob3N0OiAnYXBpLmZvcmlvLmNvbScgfVxuICogICAgICAgICAgIH1cbiAqICAgICAgIH0pO1xuICogICAgICAgcm0uZ2V0UnVuKClcbiAqICAgICAgICAgICAudGhlbihmdW5jdGlvbihydW4pIHtcbiAqICAgICAgICAgICAgICAgLy8gdGhlIFJ1bk1hbmFnZXIucnVuIGNvbnRhaW5zIHRoZSBpbnN0YW50aWF0ZWQgUnVuIFNlcnZpY2UsXG4gKiAgICAgICAgICAgICAgIC8vIHNvIGFueSBSdW4gU2VydmljZSBtZXRob2QgaXMgdmFsaWQgaGVyZVxuICogICAgICAgICAgICAgICB2YXIgcnMgPSBybS5ydW47XG4gKiAgICAgICAgICAgICAgIHJzLmRvKCdzb21lT3BlcmF0aW9uJyk7XG4gKiAgICAgICB9KVxuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBxdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvcXVlcnktdXRpbCcpO1xudmFyIHJ1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9ydW4tdXRpbCcpO1xudmFyIF9waWNrID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QtdXRpbCcpLl9waWNrO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xudmFyIFZhcmlhYmxlc1NlcnZpY2UgPSByZXF1aXJlKCcuL3ZhcmlhYmxlcy1hcGktc2VydmljZScpO1xudmFyIEludHJvc3BlY3Rpb25TZXJ2aWNlID0gcmVxdWlyZSgnLi9pbnRyb3NwZWN0aW9uLWFwaS1zZXJ2aWNlJyk7XG52YXIgU2Vzc2lvbk1hbmFnZXIgPSByZXF1aXJlKCcuLi9zdG9yZS9zZXNzaW9uLW1hbmFnZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRm9yIHByb2plY3RzIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZykuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdG9rZW46IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGFjY291bnQgaWQuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHByb2plY3QgaWQuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHByb2plY3Q6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3JpdGVyaWEgYnkgd2hpY2ggdG8gZmlsdGVyIHJ1bnMuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGZpbHRlcjogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbnZlbmllbmNlIGFsaWFzIGZvciBmaWx0ZXIuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBpZDogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZsYWcgZGV0ZXJtaW5lcyBpZiBgWC1BdXRvUmVzdG9yZTogdHJ1ZWAgaGVhZGVyIGlzIHNlbnQgdG8gRXBpY2VudGVyLiBEZWZhdWx0cyB0byBgdHJ1ZWAuXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgYXV0b1Jlc3RvcmU6IHRydWUsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGxlZCB3aGVuIHRoZSBjYWxsIGNvbXBsZXRlcyBzdWNjZXNzZnVsbHkuIERlZmF1bHRzIHRvIGAkLm5vb3BgLlxuICAgICAgICAgKiBAdHlwZSB7ZnVuY3Rpb259XG4gICAgICAgICAqL1xuICAgICAgICBzdWNjZXNzOiAkLm5vb3AsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGxlZCB3aGVuIHRoZSBjYWxsIGZhaWxzLiBEZWZhdWx0cyB0byBgJC5ub29wYC5cbiAgICAgICAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgICAgICAgKi9cbiAgICAgICAgZXJyb3I6ICQubm9vcCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucyB0byBwYXNzIG9uIHRvIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBsYXllci4gQWxsIGpxdWVyeS5hamF4IG9wdGlvbnMgYXQgaHR0cDovL2FwaS5qcXVlcnkuY29tL2pRdWVyeS5hamF4LyBhcmUgYXZhaWxhYmxlLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IHt9XG4gICAgfTtcblxuICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIgPSBuZXcgU2Vzc2lvbk1hbmFnZXIoKTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLmlkKSB7XG4gICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IHNlcnZpY2VPcHRpb25zLmlkO1xuICAgIH1cblxuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICB1cmxDb25maWcuYWNjb3VudFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5hY2NvdW50O1xuICAgIH1cbiAgICBpZiAoc2VydmljZU9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICB1cmxDb25maWcucHJvamVjdFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0O1xuICAgIH1cblxuICAgIHVybENvbmZpZy5maWx0ZXIgPSAnOyc7XG4gICAgdXJsQ29uZmlnLmdldEZpbHRlclVSTCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHVybCA9IHVybENvbmZpZy5nZXRBUElQYXRoKCdydW4nKTtcbiAgICAgICAgdmFyIGZpbHRlciA9IHF1dGlsLnRvTWF0cml4Rm9ybWF0KHNlcnZpY2VPcHRpb25zLmZpbHRlcik7XG5cbiAgICAgICAgaWYgKGZpbHRlcikge1xuICAgICAgICAgICAgdXJsICs9IGZpbHRlciArICcvJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH07XG5cbiAgICB1cmxDb25maWcuYWRkQXV0b1Jlc3RvcmVIZWFkZXIgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgZmlsdGVyID0gc2VydmljZU9wdGlvbnMuZmlsdGVyO1xuICAgICAgICAvLyBUaGUgc2VtaWNvbG9uIHNlcGFyYXRlZCBmaWx0ZXIgaXMgdXNlZCB3aGVuIGZpbHRlciBpcyBhbiBvYmplY3RcbiAgICAgICAgdmFyIGlzRmlsdGVyUnVuSWQgPSBmaWx0ZXIgJiYgJC50eXBlKGZpbHRlcikgPT09ICdzdHJpbmcnO1xuICAgICAgICBpZiAoc2VydmljZU9wdGlvbnMuYXV0b1Jlc3RvcmUgJiYgaXNGaWx0ZXJSdW5JZCkge1xuICAgICAgICAgICAgLy8gQnkgZGVmYXVsdCBhdXRvcmVwbGF5IHRoZSBydW4gYnkgc2VuZGluZyB0aGlzIGhlYWRlciB0byBlcGljZW50ZXJcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZm9yaW8uY29tL2VwaWNlbnRlci9kb2NzL3B1YmxpYy9yZXN0X2FwaXMvYWdncmVnYXRlX3J1bl9hcGkvI3JldHJpZXZpbmdcbiAgICAgICAgICAgIHZhciBhdXRvcmVzdG9yZU9wdHMgPSB7XG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAnWC1BdXRvUmVzdG9yZSc6IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIGF1dG9yZXN0b3JlT3B0cywgb3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3B0aW9ucztcbiAgICB9O1xuXG4gICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRGaWx0ZXJVUkxcbiAgICB9KTtcblxuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy50b2tlbikge1xuICAgICAgICBodHRwT3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeShodHRwT3B0aW9ucyk7XG4gICAgaHR0cC5zcGxpdEdldCA9IHJ1dGlsLnNwbGl0R2V0RmFjdG9yeShodHRwT3B0aW9ucyk7XG5cbiAgICB2YXIgc2V0RmlsdGVyT3JUaHJvd0Vycm9yID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaWQpIHtcbiAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IG9wdGlvbnMuaWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuZmlsdGVyKSB7XG4gICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSBvcHRpb25zLmZpbHRlcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXNlcnZpY2VPcHRpb25zLmZpbHRlcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBmaWx0ZXIgc3BlY2lmaWVkIHRvIGFwcGx5IG9wZXJhdGlvbnMgYWdhaW5zdCcpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBwdWJsaWNBc3luY0FQSSA9IHtcbiAgICAgICAgdXJsQ29uZmlnOiB1cmxDb25maWcsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZSBhIG5ldyBydW4uXG4gICAgICAgICAqXG4gICAgICAgICAqIE5PVEU6IFR5cGljYWxseSB0aGlzIGlzIG5vdCB1c2VkISBVc2UgYFJ1bk1hbmFnZXIuZ2V0UnVuKClgIHdpdGggYSBgc3RyYXRlZ3lgIG9mIGBhbHdheXMtbmV3YCwgb3IgdXNlIGBSdW5NYW5hZ2VyLnJlc2V0KClgLiBTZWUgW1J1biBNYW5hZ2VyXSguLi9ydW4tbWFuYWdlci8pIGZvciBtb3JlIGRldGFpbHMuXG4gICAgICAgICAqXG4gICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIHJzLmNyZWF0ZSgnaGVsbG9fd29ybGQuamwnKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gcGFyYW1zIElmIGEgc3RyaW5nLCB0aGUgbmFtZSBvZiB0aGUgcHJpbWFyeSBbbW9kZWwgZmlsZV0oLi4vLi4vLi4vd3JpdGluZ195b3VyX21vZGVsLykuIFRoaXMgaXMgdGhlIG9uZSBmaWxlIGluIHRoZSBwcm9qZWN0IHRoYXQgZXhwbGljaXRseSBleHBvc2VzIHZhcmlhYmxlcyBhbmQgbWV0aG9kcywgYW5kIGl0IG11c3QgYmUgc3RvcmVkIGluIHRoZSBNb2RlbCBmb2xkZXIgb2YgeW91ciBFcGljZW50ZXIgcHJvamVjdC4gSWYgYW4gb2JqZWN0LCBtYXkgaW5jbHVkZSBgbW9kZWxgLCBgc2NvcGVgLCBhbmQgYGZpbGVzYC4gKFNlZSB0aGUgW1J1biBNYW5hZ2VyXSguLi9ydW5fbWFuYWdlci8pIGZvciBtb3JlIGluZm9ybWF0aW9uIG9uIGBzY29wZWAgYW5kIGBmaWxlc2AuKVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgY3JlYXRlT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucywgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKCdydW4nKSB9KTtcbiAgICAgICAgICAgIHZhciBydW5BcGlQYXJhbXMgPSBbJ21vZGVsJywgJ3Njb3BlJywgJ2ZpbGVzJ107XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIGp1c3QgdGhlIG1vZGVsIG5hbWVcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSB7IG1vZGVsOiBwYXJhbXMgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gd2hpdGVsaXN0IHRoZSBmaWVsZHMgdGhhdCB3ZSBhY3R1YWxseSBjYW4gc2VuZCB0byB0aGUgYXBpXG4gICAgICAgICAgICAgICAgcGFyYW1zID0gX3BpY2socGFyYW1zLCBydW5BcGlQYXJhbXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgb2xkU3VjY2VzcyA9IGNyZWF0ZU9wdGlvbnMuc3VjY2VzcztcbiAgICAgICAgICAgIGNyZWF0ZU9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IHJlc3BvbnNlLmlkOyAvL2FsbCBmdXR1cmUgY2hhaW5lZCBjYWxscyB0byBvcGVyYXRlIG9uIHRoaXMgaWRcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5pZCA9IHJlc3BvbnNlLmlkO1xuICAgICAgICAgICAgICAgIHJldHVybiBvbGRTdWNjZXNzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHBhcmFtcywgY3JlYXRlT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgcGFydGljdWxhciBydW5zLCBiYXNlZCBvbiBjb25kaXRpb25zIHNwZWNpZmllZCBpbiB0aGUgYHFzYCBvYmplY3QuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBlbGVtZW50cyBvZiB0aGUgYHFzYCBvYmplY3QgYXJlIEFORGVkIHRvZ2V0aGVyIHdpdGhpbiBhIHNpbmdsZSBjYWxsIHRvIGAucXVlcnkoKWAuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gcmV0dXJucyBydW5zIHdpdGggc2F2ZWQgPSB0cnVlIGFuZCB2YXJpYWJsZXMucHJpY2UgPiAxLFxuICAgICAgICAgKiAgICAgIC8vIHdoZXJlIHZhcmlhYmxlcy5wcmljZSBoYXMgYmVlbiBwZXJzaXN0ZWQgKHJlY29yZGVkKVxuICAgICAgICAgKiAgICAgIC8vIGluIHRoZSBtb2RlbC5cbiAgICAgICAgICogICAgIHJzLnF1ZXJ5KHtcbiAgICAgICAgICogICAgICAgICAgJ3NhdmVkJzogJ3RydWUnLFxuICAgICAgICAgKiAgICAgICAgICAnLnByaWNlJzogJz4xJ1xuICAgICAgICAgKiAgICAgICB9LFxuICAgICAgICAgKiAgICAgICB7XG4gICAgICAgICAqICAgICAgICAgIHN0YXJ0cmVjb3JkOiAyLFxuICAgICAgICAgKiAgICAgICAgICBlbmRyZWNvcmQ6IDVcbiAgICAgICAgICogICAgICAgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBxcyBRdWVyeSBvYmplY3QuIEVhY2gga2V5IGNhbiBiZSBhIHByb3BlcnR5IG9mIHRoZSBydW4gb3IgdGhlIG5hbWUgb2YgdmFyaWFibGUgdGhhdCBoYXMgYmVlbiBzYXZlZCBpbiB0aGUgcnVuIChwcmVmYWNlZCBieSBgdmFyaWFibGVzLmApLiBFYWNoIHZhbHVlIGNhbiBiZSBhIGxpdGVyYWwgdmFsdWUsIG9yIGEgY29tcGFyaXNvbiBvcGVyYXRvciBhbmQgdmFsdWUuIChTZWUgW21vcmUgb24gZmlsdGVyaW5nXSguLi8uLi8uLi9yZXN0X2FwaXMvYWdncmVnYXRlX3J1bl9hcGkvI2ZpbHRlcnMpIGFsbG93ZWQgaW4gdGhlIHVuZGVybHlpbmcgUnVuIEFQSS4pIFF1ZXJ5aW5nIGZvciB2YXJpYWJsZXMgaXMgYXZhaWxhYmxlIGZvciBydW5zIFtpbiBtZW1vcnldKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpIGFuZCBmb3IgcnVucyBbaW4gdGhlIGRhdGFiYXNlXSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KSBpZiB0aGUgdmFyaWFibGVzIGFyZSBwZXJzaXN0ZWQgKGUuZy4gdGhhdCBoYXZlIGJlZW4gYHJlY29yZGBlZCBpbiB5b3VyIEp1bGlhIG1vZGVsKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG91dHB1dE1vZGlmaWVyIChPcHRpb25hbCkgQXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICBxdWVyeTogZnVuY3Rpb24gKHFzLCBvdXRwdXRNb2RpZmllciwgb3B0aW9ucykge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gcXM7IC8vc2hvdWxkbid0IGJlIGFibGUgdG8gb3Zlci1yaWRlXG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaHR0cE9wdGlvbnMgPSB1cmxDb25maWcuYWRkQXV0b1Jlc3RvcmVIZWFkZXIoaHR0cE9wdGlvbnMpO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5zcGxpdEdldChvdXRwdXRNb2RpZmllciwgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIHBhcnRpY3VsYXIgcnVucywgYmFzZWQgb24gY29uZGl0aW9ucyBzcGVjaWZpZWQgaW4gdGhlIGBxc2Agb2JqZWN0LlxuICAgICAgICAgKlxuICAgICAgICAgKiBTaW1pbGFyIHRvIGAucXVlcnkoKWAuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBmaWx0ZXIgRmlsdGVyIG9iamVjdC4gRWFjaCBrZXkgY2FuIGJlIGEgcHJvcGVydHkgb2YgdGhlIHJ1biBvciB0aGUgbmFtZSBvZiB2YXJpYWJsZSB0aGF0IGhhcyBiZWVuIHNhdmVkIGluIHRoZSBydW4gKHByZWZhY2VkIGJ5IGB2YXJpYWJsZXMuYCkuIEVhY2ggdmFsdWUgY2FuIGJlIGEgbGl0ZXJhbCB2YWx1ZSwgb3IgYSBjb21wYXJpc29uIG9wZXJhdG9yIGFuZCB2YWx1ZS4gKFNlZSBbbW9yZSBvbiBmaWx0ZXJpbmddKC4uLy4uLy4uL3Jlc3RfYXBpcy9hZ2dyZWdhdGVfcnVuX2FwaS8jZmlsdGVycykgYWxsb3dlZCBpbiB0aGUgdW5kZXJseWluZyBSdW4gQVBJLikgRmlsdGVyaW5nIGZvciB2YXJpYWJsZXMgaXMgYXZhaWxhYmxlIGZvciBydW5zIFtpbiBtZW1vcnldKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpIGFuZCBmb3IgcnVucyBbaW4gdGhlIGRhdGFiYXNlXSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KSBpZiB0aGUgdmFyaWFibGVzIGFyZSBwZXJzaXN0ZWQgKGUuZy4gdGhhdCBoYXZlIGJlZW4gYHJlY29yZGBlZCBpbiB5b3VyIEp1bGlhIG1vZGVsKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG91dHB1dE1vZGlmaWVyIChPcHRpb25hbCkgQXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICBmaWx0ZXI6IGZ1bmN0aW9uIChmaWx0ZXIsIG91dHB1dE1vZGlmaWVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHNlcnZpY2VPcHRpb25zLmZpbHRlcikpIHtcbiAgICAgICAgICAgICAgICAkLmV4dGVuZChzZXJ2aWNlT3B0aW9ucy5maWx0ZXIsIGZpbHRlcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IGZpbHRlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBodHRwT3B0aW9ucyA9IHVybENvbmZpZy5hZGRBdXRvUmVzdG9yZUhlYWRlcihodHRwT3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5zcGxpdEdldChvdXRwdXRNb2RpZmllciwgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgZGF0YSBmb3IgYSBzcGVjaWZpYyBydW4uIFRoaXMgaW5jbHVkZXMgc3RhbmRhcmQgcnVuIGRhdGEgc3VjaCBhcyB0aGUgYWNjb3VudCwgbW9kZWwsIHByb2plY3QsIGFuZCBjcmVhdGVkIGFuZCBsYXN0IG1vZGlmaWVkIGRhdGVzLiBUbyByZXF1ZXN0IHNwZWNpZmljIG1vZGVsIHZhcmlhYmxlcywgcGFzcyB0aGVtIGFzIHBhcnQgb2YgdGhlIGBmaWx0ZXJzYCBwYXJhbWV0ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIE5vdGUgdGhhdCBpZiB0aGUgcnVuIGlzIFtpbiBtZW1vcnldKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpLCBhbnkgbW9kZWwgdmFyaWFibGVzIGFyZSBhdmFpbGFibGU7IGlmIHRoZSBydW4gaXMgW2luIHRoZSBkYXRhYmFzZV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLWRiKSwgb25seSBtb2RlbCB2YXJpYWJsZXMgdGhhdCBoYXZlIGJlZW4gcGVyc2lzdGVkICZtZGFzaDsgdGhhdCBpcywgYHJlY29yZGBlZCBpbiB5b3VyIEp1bGlhIG1vZGVsICZtZGFzaDsgYXJlIGF2YWlsYWJsZS5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIHJzLmxvYWQoJ2JiNTg5Njc3LWQ0NzYtNDk3MS1hNjhlLTBjNThkMTkxZTQ1MCcsIHsgaW5jbHVkZTogWycucHJpY2UnLCAnLnNhbGVzJ10gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBydW5JRCBUaGUgcnVuIGlkLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gZmlsdGVycyAoT3B0aW9uYWwpIE9iamVjdCBjb250YWluaW5nIGZpbHRlcnMgYW5kIG9wZXJhdGlvbiBtb2RpZmllcnMuIFVzZSBrZXkgYGluY2x1ZGVgIHRvIGxpc3QgbW9kZWwgdmFyaWFibGVzIHRoYXQgeW91IHdhbnQgdG8gaW5jbHVkZSBpbiB0aGUgcmVzcG9uc2UuIE90aGVyIGF2YWlsYWJsZSBmaWVsZHMgaW5jbHVkZTogYHN0YXJ0cmVjb3JkYCwgYGVuZHJlY29yZGAsIGBzb3J0YCwgYW5kIGBkaXJlY3Rpb25gIChgYXNjYCBvciBgZGVzY2ApLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKHJ1bklELCBmaWx0ZXJzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAocnVuSUQpIHtcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSBydW5JRDsgLy9zaG91bGRuJ3QgYmUgYWJsZSB0byBvdmVyLXJpZGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBodHRwT3B0aW9ucyA9IHVybENvbmZpZy5hZGRBdXRvUmVzdG9yZUhlYWRlcihodHRwT3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoZmlsdGVycywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNhdmUgYXR0cmlidXRlcyAoZGF0YSwgbW9kZWwgdmFyaWFibGVzKSBvZiB0aGUgcnVuLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGVzKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIGFkZCAnY29tcGxldGVkJyBmaWVsZCB0byBydW4gcmVjb3JkXG4gICAgICAgICAqICAgICBycy5zYXZlKHsgY29tcGxldGVkOiB0cnVlIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gdXBkYXRlICdzYXZlZCcgZmllbGQgb2YgcnVuIHJlY29yZCwgYW5kIHVwZGF0ZSB2YWx1ZXMgb2YgbW9kZWwgdmFyaWFibGVzIGZvciB0aGlzIHJ1blxuICAgICAgICAgKiAgICAgcnMuc2F2ZSh7IHNhdmVkOiB0cnVlLCB2YXJpYWJsZXM6IHsgYTogMjMsIGI6IDIzIH0gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBhdHRyaWJ1dGVzIFRoZSBydW4gZGF0YSBhbmQgdmFyaWFibGVzIHRvIHNhdmUuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBhdHRyaWJ1dGVzLnZhcmlhYmxlcyBNb2RlbCB2YXJpYWJsZXMgbXVzdCBiZSBpbmNsdWRlZCBpbiBhIGB2YXJpYWJsZXNgIGZpZWxkIHdpdGhpbiB0aGUgYGF0dHJpYnV0ZXNgIG9iamVjdC4gKE90aGVyd2lzZSB0aGV5IGFyZSB0cmVhdGVkIGFzIHJ1biBkYXRhIGFuZCBhZGRlZCB0byB0aGUgcnVuIHJlY29yZCBkaXJlY3RseS4pXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICBzYXZlOiBmdW5jdGlvbiAoYXR0cmlidXRlcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHNldEZpbHRlck9yVGhyb3dFcnJvcihodHRwT3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wYXRjaChhdHRyaWJ1dGVzLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGwgYSBtZXRob2QgZnJvbSB0aGUgbW9kZWwuXG4gICAgICAgICAqXG4gICAgICAgICAqIERlcGVuZGluZyBvbiB0aGUgbGFuZ3VhZ2UgaW4gd2hpY2ggeW91IGhhdmUgd3JpdHRlbiB5b3VyIG1vZGVsLCB0aGUgbWV0aG9kIG1heSBuZWVkIHRvIGJlIGV4cG9zZWQgKGUuZy4gYGV4cG9ydGAgZm9yIGEgSnVsaWEgbW9kZWwpIGluIHRoZSBtb2RlbCBmaWxlIGluIG9yZGVyIHRvIGJlIGNhbGxlZCB0aHJvdWdoIHRoZSBBUEkuIFNlZSBbV3JpdGluZyB5b3VyIE1vZGVsXSguLi8uLi8uLi93cml0aW5nX3lvdXJfbW9kZWwvKSkuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBwYXJhbXMgYXJndW1lbnQgaXMgbm9ybWFsbHkgYW4gYXJyYXkgb2YgYXJndW1lbnRzIHRvIHRoZSBgb3BlcmF0aW9uYC4gSW4gdGhlIHNwZWNpYWwgY2FzZSB3aGVyZSBgb3BlcmF0aW9uYCBvbmx5IHRha2VzIG9uZSBhcmd1bWVudCwgeW91IGFyZSBub3QgcmVxdWlyZWQgdG8gcHV0IHRoYXQgYXJndW1lbnQgaW50byBhbiBhcnJheS5cbiAgICAgICAgICpcbiAgICAgICAgICogTm90ZSB0aGF0IHlvdSBjYW4gY29tYmluZSB0aGUgYG9wZXJhdGlvbmAgYW5kIHBhcmFtcyBhcmd1bWVudHMgaW50byBhIHNpbmdsZSBvYmplY3QgaWYgeW91IHByZWZlciwgYXMgaW4gdGhlIGxhc3QgZXhhbXBsZS5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlcyoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kIFwic29sdmVcIiB0YWtlcyBubyBhcmd1bWVudHNcbiAgICAgICAgICogICAgIHJzLmRvKCdzb2x2ZScpO1xuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZCBcImVjaG9cIiB0YWtlcyBvbmUgYXJndW1lbnQsIGEgc3RyaW5nXG4gICAgICAgICAqICAgICBycy5kbygnZWNobycsIFsnaGVsbG8nXSk7XG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kIFwiZWNob1wiIHRha2VzIG9uZSBhcmd1bWVudCwgYSBzdHJpbmdcbiAgICAgICAgICogICAgIHJzLmRvKCdlY2hvJywgJ2hlbGxvJyk7XG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kIFwic3VtQXJyYXlcIiB0YWtlcyBvbmUgYXJndW1lbnQsIGFuIGFycmF5XG4gICAgICAgICAqICAgICBycy5kbygnc3VtQXJyYXknLCBbWzQsMiwxXV0pO1xuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZCBcImFkZFwiIHRha2VzIHR3byBhcmd1bWVudHMsIGJvdGggaW50ZWdlcnNcbiAgICAgICAgICogICAgIHJzLmRvKHsgbmFtZTonYWRkJywgcGFyYW1zOlsyLDRdIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gb3BlcmF0aW9uIE5hbWUgb2YgbWV0aG9kLlxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBwYXJhbXMgKE9wdGlvbmFsKSBBbnkgcGFyYW1ldGVycyB0aGUgb3BlcmF0aW9uIHRha2VzLCBwYXNzZWQgYXMgYW4gYXJyYXkuIEluIHRoZSBzcGVjaWFsIGNhc2Ugd2hlcmUgYG9wZXJhdGlvbmAgb25seSB0YWtlcyBvbmUgYXJndW1lbnQsIHlvdSBhcmUgbm90IHJlcXVpcmVkIHRvIHB1dCB0aGF0IGFyZ3VtZW50IGludG8gYW4gYXJyYXksIGFuZCBjYW4ganVzdCBwYXNzIGl0IGRpcmVjdGx5LlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgZG86IGZ1bmN0aW9uIChvcGVyYXRpb24sIHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2RvJywgb3BlcmF0aW9uLCBwYXJhbXMpO1xuICAgICAgICAgICAgdmFyIG9wc0FyZ3M7XG4gICAgICAgICAgICB2YXIgcG9zdE9wdGlvbnM7XG4gICAgICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgICAgICAgIG9wc0FyZ3MgPSBwYXJhbXM7XG4gICAgICAgICAgICAgICAgcG9zdE9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgkLmlzUGxhaW5PYmplY3QocGFyYW1zKSkge1xuICAgICAgICAgICAgICAgIG9wc0FyZ3MgPSBudWxsO1xuICAgICAgICAgICAgICAgIHBvc3RPcHRpb25zID0gcGFyYW1zO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvcHNBcmdzID0gcGFyYW1zO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHJ1dGlsLm5vcm1hbGl6ZU9wZXJhdGlvbnMob3BlcmF0aW9uLCBvcHNBcmdzKTtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgcG9zdE9wdGlvbnMpO1xuXG4gICAgICAgICAgICBzZXRGaWx0ZXJPclRocm93RXJyb3IoaHR0cE9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgcHJtcyA9IChyZXN1bHQuYXJnc1swXS5sZW5ndGggJiYgKHJlc3VsdC5hcmdzWzBdICE9PSBudWxsICYmIHJlc3VsdC5hcmdzWzBdICE9PSB1bmRlZmluZWQpKSA/IHJlc3VsdC5hcmdzWzBdIDogW107XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHsgYXJndW1lbnRzOiBwcm1zIH0sICQuZXh0ZW5kKHRydWUsIHt9LCBodHRwT3B0aW9ucywge1xuICAgICAgICAgICAgICAgIHVybDogdXJsQ29uZmlnLmdldEZpbHRlclVSTCgpICsgJ29wZXJhdGlvbnMvJyArIHJlc3VsdC5vcHNbMF0gKyAnLydcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbCBzZXZlcmFsIG1ldGhvZHMgZnJvbSB0aGUgbW9kZWwsIHNlcXVlbnRpYWxseS5cbiAgICAgICAgICpcbiAgICAgICAgICogRGVwZW5kaW5nIG9uIHRoZSBsYW5ndWFnZSBpbiB3aGljaCB5b3UgaGF2ZSB3cml0dGVuIHlvdXIgbW9kZWwsIHRoZSBtZXRob2RzIG1heSBuZWVkIHRvIGJlIGV4cG9zZWQgKGUuZy4gYGV4cG9ydGAgZm9yIGEgSnVsaWEgbW9kZWwpIGluIHRoZSBtb2RlbCBmaWxlIGluIG9yZGVyIHRvIGJlIGNhbGxlZCB0aHJvdWdoIHRoZSBBUEkuIFNlZSBbV3JpdGluZyB5b3VyIE1vZGVsXSguLi8uLi8uLi93cml0aW5nX3lvdXJfbW9kZWwvKSkuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZXMqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZHMgXCJpbml0aWFsaXplXCIgYW5kIFwic29sdmVcIiBkbyBub3QgdGFrZSBhbnkgYXJndW1lbnRzXG4gICAgICAgICAqICAgICBycy5zZXJpYWwoWydpbml0aWFsaXplJywgJ3NvbHZlJ10pO1xuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZHMgXCJpbml0XCIgYW5kIFwicmVzZXRcIiB0YWtlIHR3byBhcmd1bWVudHMgZWFjaFxuICAgICAgICAgKiAgICAgcnMuc2VyaWFsKFsgIHsgbmFtZTogJ2luaXQnLCBwYXJhbXM6IFsxLDJdIH0sXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgeyBuYW1lOiAncmVzZXQnLCBwYXJhbXM6IFsyLDNdIH1dKTtcbiAgICAgICAgICogICAgICAvLyBtZXRob2QgXCJpbml0XCIgdGFrZXMgdHdvIGFyZ3VtZW50cyxcbiAgICAgICAgICogICAgICAvLyBtZXRob2QgXCJydW5tb2RlbFwiIHRha2VzIG5vbmVcbiAgICAgICAgICogICAgIHJzLnNlcmlhbChbICB7IG5hbWU6ICdpbml0JywgcGFyYW1zOiBbMSwyXSB9LFxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ3J1bm1vZGVsJywgcGFyYW1zOiBbXSB9XSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IG9wZXJhdGlvbnMgSWYgbm9uZSBvZiB0aGUgbWV0aG9kcyB0YWtlIHBhcmFtZXRlcnMsIHBhc3MgYW4gYXJyYXkgb2YgdGhlIG1ldGhvZCBuYW1lcyAoc3RyaW5ncykuIElmIGFueSBvZiB0aGUgbWV0aG9kcyBkbyB0YWtlIHBhcmFtZXRlcnMsIHBhc3MgYW4gYXJyYXkgb2Ygb2JqZWN0cywgZWFjaCBvZiB3aGljaCBjb250YWlucyBhIG1ldGhvZCBuYW1lIGFuZCBpdHMgb3duIChwb3NzaWJseSBlbXB0eSkgYXJyYXkgb2YgcGFyYW1ldGVycy5cbiAgICAgICAgICogQHBhcmFtIHsqfSBwYXJhbXMgUGFyYW1ldGVycyB0byBwYXNzIHRvIG9wZXJhdGlvbnMuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICBzZXJpYWw6IGZ1bmN0aW9uIChvcGVyYXRpb25zLCBwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBvcFBhcmFtcyA9IHJ1dGlsLm5vcm1hbGl6ZU9wZXJhdGlvbnMob3BlcmF0aW9ucywgcGFyYW1zKTtcbiAgICAgICAgICAgIHZhciBvcHMgPSBvcFBhcmFtcy5vcHM7XG4gICAgICAgICAgICB2YXIgYXJncyA9IG9wUGFyYW1zLmFyZ3M7XG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgICAgICAgICB2YXIgJGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgICAgICB2YXIgcG9zdE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgZG9TaW5nbGVPcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3AgPSBvcHMuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICB2YXIgYXJnID0gYXJncy5zaGlmdCgpO1xuXG4gICAgICAgICAgICAgICAgbWUuZG8ob3AsIGFyZywge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3BzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvU2luZ2xlT3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGQucmVzb2x2ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc3RPcHRpb25zLnN1Y2Nlc3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRkLnJlamVjdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdE9wdGlvbnMuZXJyb3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZG9TaW5nbGVPcCgpO1xuXG4gICAgICAgICAgICByZXR1cm4gJGQucHJvbWlzZSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsIHNldmVyYWwgbWV0aG9kcyBmcm9tIHRoZSBtb2RlbCwgZXhlY3V0aW5nIHRoZW0gaW4gcGFyYWxsZWwuXG4gICAgICAgICAqXG4gICAgICAgICAqIERlcGVuZGluZyBvbiB0aGUgbGFuZ3VhZ2UgaW4gd2hpY2ggeW91IGhhdmUgd3JpdHRlbiB5b3VyIG1vZGVsLCB0aGUgbWV0aG9kcyBtYXkgbmVlZCB0byBiZSBleHBvc2VkIChlLmcuIGBleHBvcnRgIGZvciBhIEp1bGlhIG1vZGVsKSBpbiB0aGUgbW9kZWwgZmlsZSBpbiBvcmRlciB0byBiZSBjYWxsZWQgdGhyb3VnaCB0aGUgQVBJLiBTZWUgW1dyaXRpbmcgeW91ciBNb2RlbF0oLi4vLi4vLi4vd3JpdGluZ195b3VyX21vZGVsLykpLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZHMgXCJzb2x2ZVwiIGFuZCBcInJlc2V0XCIgZG8gbm90IHRha2UgYW55IGFyZ3VtZW50c1xuICAgICAgICAgKiAgICAgcnMucGFyYWxsZWwoWydzb2x2ZScsICdyZXNldCddKTtcbiAgICAgICAgICogICAgICAvLyBtZXRob2RzIFwiYWRkXCIgYW5kIFwic3VidHJhY3RcIiB0YWtlIHR3byBhcmd1bWVudHMgZWFjaFxuICAgICAgICAgKiAgICAgcnMucGFyYWxsZWwoWyB7IG5hbWU6ICdhZGQnLCBwYXJhbXM6IFsxLDJdIH0sXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ3N1YnRyYWN0JywgcGFyYW1zOlsyLDNdIH1dKTtcbiAgICAgICAgICogICAgICAvLyBtZXRob2RzIFwiYWRkXCIgYW5kIFwic3VidHJhY3RcIiB0YWtlIHR3byBhcmd1bWVudHMgZWFjaFxuICAgICAgICAgKiAgICAgcnMucGFyYWxsZWwoeyBhZGQ6IFsxLDJdLCBzdWJ0cmFjdDogWzIsNF0gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fSBvcGVyYXRpb25zIElmIG5vbmUgb2YgdGhlIG1ldGhvZHMgdGFrZSBwYXJhbWV0ZXJzLCBwYXNzIGFuIGFycmF5IG9mIHRoZSBtZXRob2QgbmFtZXMgKGFzIHN0cmluZ3MpLiBJZiBhbnkgb2YgdGhlIG1ldGhvZHMgZG8gdGFrZSBwYXJhbWV0ZXJzLCB5b3UgaGF2ZSB0d28gb3B0aW9ucy4gWW91IGNhbiBwYXNzIGFuIGFycmF5IG9mIG9iamVjdHMsIGVhY2ggb2Ygd2hpY2ggY29udGFpbnMgYSBtZXRob2QgbmFtZSBhbmQgaXRzIG93biAocG9zc2libHkgZW1wdHkpIGFycmF5IG9mIHBhcmFtZXRlcnMuIEFsdGVybmF0aXZlbHksIHlvdSBjYW4gcGFzcyBhIHNpbmdsZSBvYmplY3Qgd2l0aCB0aGUgbWV0aG9kIG5hbWUgYW5kIGEgKHBvc3NpYmx5IGVtcHR5KSBhcnJheSBvZiBwYXJhbWV0ZXJzLlxuICAgICAgICAgKiBAcGFyYW0geyp9IHBhcmFtcyBQYXJhbWV0ZXJzIHRvIHBhc3MgdG8gb3BlcmF0aW9ucy5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgIHBhcmFsbGVsOiBmdW5jdGlvbiAob3BlcmF0aW9ucywgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgJGQgPSAkLkRlZmVycmVkKCk7XG5cbiAgICAgICAgICAgIHZhciBvcFBhcmFtcyA9IHJ1dGlsLm5vcm1hbGl6ZU9wZXJhdGlvbnMob3BlcmF0aW9ucywgcGFyYW1zKTtcbiAgICAgICAgICAgIHZhciBvcHMgPSBvcFBhcmFtcy5vcHM7XG4gICAgICAgICAgICB2YXIgYXJncyA9IG9wUGFyYW1zLmFyZ3M7XG4gICAgICAgICAgICB2YXIgcG9zdE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcXVldWUucHVzaChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kbyhvcHNbaV0sIGFyZ3NbaV0pXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICQud2hlbi5hcHBseSh0aGlzLCBxdWV1ZSlcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICRkLnJlc29sdmUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgcG9zdE9wdGlvbnMuc3VjY2Vzcy5hcHBseSh0aGlzLmFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmFpbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICRkLnJlamVjdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICBwb3N0T3B0aW9ucy5lcnJvci5hcHBseSh0aGlzLmFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiAkZC5wcm9taXNlKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNob3J0Y3V0IHRvIHVzaW5nIHRoZSBbSW50cm9zcGVjdGlvbiBBUEkgU2VydmljZV0oLi4vaW50cm9zcGVjdGlvbi1hcGktc2VydmljZS8pLiBBbGxvd3MgeW91IHRvIHZpZXcgYSBsaXN0IG9mIHRoZSB2YXJpYWJsZXMgYW5kIG9wZXJhdGlvbnMgaW4gYSBtb2RlbC5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIHJzLmludHJvc3BlY3QoeyBydW5JRDogJ2NiZjg1NDM3LWI1MzktNDk3Ny1hMWZjLTIzNTE1Y2YwNzFiYicgfSkudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgKiAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhLmZ1bmN0aW9ucyk7XG4gICAgICAgICAqICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEudmFyaWFibGVzKTtcbiAgICAgICAgICogICAgIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgT3B0aW9ucyBjYW4gZWl0aGVyIGJlIG9mIHRoZSBmb3JtIGB7IHJ1bklEOiA8cnVuaWQ+IH1gIG9yIGB7IG1vZGVsOiA8bW9kZWxGaWxlTmFtZT4gfWAuXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gaW50cm9zcGVjdGlvbkNvbmZpZyAoT3B0aW9uYWwpIFNlcnZpY2Ugb3B0aW9ucyBmb3IgSW50cm9zcGVjdGlvbiBTZXJ2aWNlXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICBpbnRyb3NwZWN0OiBmdW5jdGlvbiAob3B0aW9ucywgaW50cm9zcGVjdGlvbkNvbmZpZykge1xuICAgICAgICAgICAgdmFyIGludHJvc3BlY3Rpb24gPSBuZXcgSW50cm9zcGVjdGlvblNlcnZpY2UoJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBpbnRyb3NwZWN0aW9uQ29uZmlnKSk7XG4gICAgICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnJ1bklEKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnRyb3NwZWN0aW9uLmJ5UnVuSUQob3B0aW9ucy5ydW5JRCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLm1vZGVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnRyb3NwZWN0aW9uLmJ5TW9kZWwob3B0aW9ucy5tb2RlbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChzZXJ2aWNlT3B0aW9ucy5pZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpbnRyb3NwZWN0aW9uLmJ5UnVuSUQoc2VydmljZU9wdGlvbnMuaWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSBzcGVjaWZ5IGVpdGhlciB0aGUgbW9kZWwgb3IgcnVuaWQgdG8gaW50cm9zcGVjdCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBwdWJsaWNTeW5jQVBJID0ge1xuICAgICAgICBnZXRDdXJyZW50Q29uZmlnOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VydmljZU9wdGlvbnM7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgICogUmV0dXJucyBhIFZhcmlhYmxlcyBTZXJ2aWNlIGluc3RhbmNlLiBVc2UgdGhlIHZhcmlhYmxlcyBpbnN0YW5jZSB0byBsb2FkLCBzYXZlLCBhbmQgcXVlcnkgZm9yIHNwZWNpZmljIG1vZGVsIHZhcmlhYmxlcy4gU2VlIHRoZSBbVmFyaWFibGUgQVBJIFNlcnZpY2VdKC4uL3ZhcmlhYmxlcy1hcGktc2VydmljZS8pIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgICAgICAgICpcbiAgICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAgKlxuICAgICAgICAgICogICAgICB2YXIgdnMgPSBycy52YXJpYWJsZXMoKTtcbiAgICAgICAgICAqICAgICAgdnMuc2F2ZSh7IHNhbXBsZV9pbnQ6IDQgfSk7XG4gICAgICAgICAgKlxuICAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWcgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICAqIEByZXR1cm4ge09iamVjdH0gdmFyaWFibGVzU2VydmljZSBJbnN0YW5jZVxuICAgICAgICAgICovXG4gICAgICAgIHZhcmlhYmxlczogZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICAgICAgdmFyIHZzID0gbmV3IFZhcmlhYmxlc1NlcnZpY2UoJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBjb25maWcsIHtcbiAgICAgICAgICAgICAgICBydW5TZXJ2aWNlOiB0aGlzXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICByZXR1cm4gdnM7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQXN5bmNBUEkpO1xuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY1N5bmNBUEkpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG52YXIgb2JqZWN0QXNzaWduID0gcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xuXG52YXIgc2VydmljZVV0aWxzID0ge1xuICAgIC8qXG4gICAgKiBHZXRzIHRoZSBkZWZhdWx0IG9wdGlvbnMgZm9yIGEgYXBpIHNlcnZpY2UuXG4gICAgKiBJdCB3aWxsIG1lcmdlOlxuICAgICogLSBUaGUgU2Vzc2lvbiBvcHRpb25zIChVc2luZyB0aGUgU2Vzc2lvbiBNYW5hZ2VyKVxuICAgICogLSBUaGUgQXV0aG9yaXphdGlvbiBIZWFkZXIgZnJvbSB0aGUgdG9rZW4gb3B0aW9uXG4gICAgKiAtIFRoZSBmdWxsIHVybCBmcm9tIHRoZSBlbmRwb2ludCBvcHRpb25cbiAgICAqIFdpdGggdGhlIHN1cHBsaWVkIG92ZXJyaWRlcyBhbmQgZGVmYXVsdHNcbiAgICAqXG4gICAgKi9cbiAgICBnZXREZWZhdWx0T3B0aW9uczogZnVuY3Rpb24gKGRlZmF1bHRzKSB7XG4gICAgICAgIHZhciByZXN0ID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgdmFyIHNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKCk7XG4gICAgICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9IHNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMuYXBwbHkoc2Vzc2lvbk1hbmFnZXIsIFtkZWZhdWx0c10uY29uY2F0KHJlc3QpKTtcblxuICAgICAgICBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQgPSBvYmplY3RBc3NpZ24oe30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICAgICAgdXJsOiB0aGlzLmdldEFwaVVybChzZXJ2aWNlT3B0aW9ucy5hcGlFbmRwb2ludCwgc2VydmljZU9wdGlvbnMpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChzZXJ2aWNlT3B0aW9ucy50b2tlbikge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LmhlYWRlcnMgPSB7XG4gICAgICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNlcnZpY2VPcHRpb25zO1xuICAgIH0sXG5cbiAgICBnZXRBcGlVcmw6IGZ1bmN0aW9uIChhcGlFbmRwb2ludCwgc2VydmljZU9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKHNlcnZpY2VPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuICAgICAgICByZXR1cm4gdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2VydmljZVV0aWxzOyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuICogIyMgU3RhdGUgQVBJIEFkYXB0ZXJcbiAqXG4gKiBUaGUgU3RhdGUgQVBJIEFkYXB0ZXIgYWxsb3dzIHlvdSB0byByZXBsYXkgb3IgY2xvbmUgcnVucy4gSXQgYnJpbmdzIGV4aXN0aW5nLCBwZXJzaXN0ZWQgcnVuIGRhdGEgZnJvbSB0aGUgZGF0YWJhc2UgYmFjayBpbnRvIG1lbW9yeSwgdXNpbmcgdGhlIHNhbWUgcnVuIGlkIChgcmVwbGF5YCkgb3IgYSBuZXcgcnVuIGlkIChgY2xvbmVgKS4gUnVucyBtdXN0IGJlIGluIG1lbW9yeSBpbiBvcmRlciBmb3IgeW91IHRvIHVwZGF0ZSB2YXJpYWJsZXMgb3IgY2FsbCBvcGVyYXRpb25zIG9uIHRoZW0uXG4gKlxuICogU3BlY2lmaWNhbGx5LCB0aGUgU3RhdGUgQVBJIEFkYXB0ZXIgd29ya3MgYnkgXCJyZS1ydW5uaW5nXCIgdGhlIHJ1biAodXNlciBpbnRlcmFjdGlvbnMpIGZyb20gdGhlIGNyZWF0aW9uIG9mIHRoZSBydW4gdXAgdG8gdGhlIHRpbWUgaXQgd2FzIGxhc3QgcGVyc2lzdGVkIGluIHRoZSBkYXRhYmFzZS4gVGhpcyBwcm9jZXNzIHVzZXMgdGhlIGN1cnJlbnQgdmVyc2lvbiBvZiB0aGUgcnVuJ3MgbW9kZWwuIFRoZXJlZm9yZSwgaWYgdGhlIG1vZGVsIGhhcyBjaGFuZ2VkIHNpbmNlIHRoZSBvcmlnaW5hbCBydW4gd2FzIGNyZWF0ZWQsIHRoZSByZXRyaWV2ZWQgcnVuIHdpbGwgdXNlIHRoZSBuZXcgbW9kZWwg4oCUIGFuZCBtYXkgZW5kIHVwIGhhdmluZyBkaWZmZXJlbnQgdmFsdWVzIG9yIGJlaGF2aW9yIGFzIGEgcmVzdWx0LiBVc2Ugd2l0aCBjYXJlIVxuICpcbiAqIFRvIHVzZSB0aGUgU3RhdGUgQVBJIEFkYXB0ZXIsIGluc3RhbnRpYXRlIGl0IGFuZCB0aGVuIGNhbGwgaXRzIG1ldGhvZHM6XG4gKlxuICogICAgICB2YXIgc2EgPSBuZXcgRi5zZXJ2aWNlLlN0YXRlKCk7XG4gKiAgICAgIHNhLnJlcGxheSh7cnVuSWQ6ICcxODQyYmI1Yy04M2FkLTRiYTgtYTk1NS1iZDEzY2MyZmRiNGYnfSk7XG4gKlxuICogVGhlIGNvbnN0cnVjdG9yIHRha2VzIGFuIG9wdGlvbmFsIGBvcHRpb25zYCBwYXJhbWV0ZXIgaW4gd2hpY2ggeW91IGNhbiBzcGVjaWZ5IHRoZSBgYWNjb3VudGAgYW5kIGBwcm9qZWN0YCBpZiB0aGV5IGFyZSBub3QgYWxyZWFkeSBhdmFpbGFibGUgaW4gdGhlIGN1cnJlbnQgY29udGV4dC5cbiAqXG4gKi9cblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xudmFyIF9waWNrID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QtdXRpbCcpLl9waWNrO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG52YXIgYXBpRW5kcG9pbnQgPSAnbW9kZWwvc3RhdGUnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcblxuICAgIHZhciBkZWZhdWx0cyA9IHtcblxuICAgIH07XG5cbiAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKCk7XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKGRlZmF1bHRzLCBjb25maWcpO1xuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcblxuICAgIHZhciB0cmFuc3BvcnRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KVxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIHRyYW5zcG9ydE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zKTtcbiAgICB2YXIgcGFyc2VSdW5JZE9yRXJyb3IgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3QocGFyYW1zKSAmJiBwYXJhbXMucnVuSWQpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbXMucnVuSWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSBwYXNzIGluIGEgcnVuIGlkJyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICogUmVwbGF5IGEgcnVuLiBBZnRlciB0aGlzIGNhbGwsIHRoZSBydW4sIHdpdGggaXRzIG9yaWdpbmFsIHJ1biBpZCwgaXMgbm93IGF2YWlsYWJsZSBbaW4gbWVtb3J5XSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KS4gKEl0IGNvbnRpbnVlcyB0byBiZSBwZXJzaXN0ZWQgaW50byB0aGUgRXBpY2VudGVyIGRhdGFiYXNlIGF0IHJlZ3VsYXIgaW50ZXJ2YWxzLilcbiAgICAgICAgKlxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgc2EgPSBuZXcgRi5zZXJ2aWNlLlN0YXRlKCk7XG4gICAgICAgICogICAgICBzYS5yZXBsYXkoe3J1bklkOiAnMTg0MmJiNWMtODNhZC00YmE4LWE5NTUtYmQxM2NjMmZkYjRmJywgc3RvcEJlZm9yZTogJ2NhbGN1bGF0ZVNjb3JlJ30pO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyBQYXJhbWV0ZXJzIG9iamVjdC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLnJ1bklkIFRoZSBpZCBvZiB0aGUgcnVuIHRvIGJyaW5nIGJhY2sgdG8gbWVtb3J5LlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuc3RvcEJlZm9yZSAoT3B0aW9uYWwpIFRoZSBydW4gaXMgYWR2YW5jZWQgb25seSB1cCB0byB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiB0aGlzIG1ldGhvZC5cbiAgICAgICAgKiBAcGFyYW0ge2FycmF5fSBwYXJhbXMuZXhjbHVkZSAoT3B0aW9uYWwpIEFycmF5IG9mIG1ldGhvZHMgdG8gZXhjbHVkZSB3aGVuIGFkdmFuY2luZyB0aGUgcnVuLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgcmVwbGF5OiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgcnVuSWQgPSBwYXJzZVJ1bklkT3JFcnJvcihwYXJhbXMpO1xuXG4gICAgICAgICAgICB2YXIgcmVwbGF5T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHJ1bklkIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHBhcmFtcyA9ICQuZXh0ZW5kKHRydWUsIHsgYWN0aW9uOiAncmVwbGF5JyB9LCBfcGljayhwYXJhbXMsIFsnc3RvcEJlZm9yZScsICdleGNsdWRlJ10pKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChwYXJhbXMsIHJlcGxheU9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIENsb25lIGEgZ2l2ZW4gcnVuIGFuZCByZXR1cm4gYSBuZXcgcnVuIGluIHRoZSBzYW1lIHN0YXRlIGFzIHRoZSBnaXZlbiBydW4uXG4gICAgICAgICpcbiAgICAgICAgKiBUaGUgbmV3IHJ1biBpZCBpcyBub3cgYXZhaWxhYmxlIFtpbiBtZW1vcnldKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpLiBUaGUgbmV3IHJ1biBpbmNsdWRlcyBhIGNvcHkgb2YgYWxsIG9mIHRoZSBkYXRhIGZyb20gdGhlIG9yaWdpbmFsIHJ1biwgRVhDRVBUOlxuICAgICAgICAqXG4gICAgICAgICogKiBUaGUgYHNhdmVkYCBmaWVsZCBpbiB0aGUgbmV3IHJ1biByZWNvcmQgaXMgbm90IGNvcGllZCBmcm9tIHRoZSBvcmlnaW5hbCBydW4gcmVjb3JkLiBJdCBkZWZhdWx0cyB0byBgZmFsc2VgLlxuICAgICAgICAqICogVGhlIGBpbml0aWFsaXplZGAgZmllbGQgaW4gdGhlIG5ldyBydW4gcmVjb3JkIGlzIG5vdCBjb3BpZWQgZnJvbSB0aGUgb3JpZ2luYWwgcnVuIHJlY29yZC4gSXQgZGVmYXVsdHMgdG8gYGZhbHNlYCBidXQgbWF5IGNoYW5nZSB0byBgdHJ1ZWAgYXMgdGhlIG5ldyBydW4gaXMgYWR2YW5jZWQuIEZvciBleGFtcGxlLCBpZiB0aGVyZSBoYXMgYmVlbiBhIGNhbGwgdG8gdGhlIGBzdGVwYCBmdW5jdGlvbiAoZm9yIFZlbnNpbSBtb2RlbHMpLCB0aGUgYGluaXRpYWxpemVkYCBmaWVsZCBpcyBzZXQgdG8gYHRydWVgLlxuICAgICAgICAqICogVGhlIGBjcmVhdGVkYCBmaWVsZCBpbiB0aGUgbmV3IHJ1biByZWNvcmQgaXMgdGhlIGRhdGUgYW5kIHRpbWUgYXQgd2hpY2ggdGhlIGNsb25lIHdhcyBjcmVhdGVkIChub3QgdGhlIHRpbWUgdGhhdCB0aGUgb3JpZ2luYWwgcnVuIHdhcyBjcmVhdGVkLilcbiAgICAgICAgKlxuICAgICAgICAqIFRoZSBvcmlnaW5hbCBydW4gcmVtYWlucyBvbmx5IFtpbiB0aGUgZGF0YWJhc2VdKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1kYikuXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHNhID0gbmV3IEYuc2VydmljZS5TdGF0ZSgpO1xuICAgICAgICAqICAgICAgc2EuY2xvbmUoe3J1bklkOiAnMTg0MmJiNWMtODNhZC00YmE4LWE5NTUtYmQxM2NjMmZkYjRmJywgc3RvcEJlZm9yZTogJ2NhbGN1bGF0ZVNjb3JlJywgZXhjbHVkZTogWydpbnRlcmltQ2FsY3VsYXRpb24nXSB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgUGFyYW1ldGVycyBvYmplY3QuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5ydW5JZCBUaGUgaWQgb2YgdGhlIHJ1biB0byBjbG9uZSBmcm9tIG1lbW9yeS5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLnN0b3BCZWZvcmUgKE9wdGlvbmFsKSBUaGUgbmV3bHkgY2xvbmVkIHJ1biBpcyBhZHZhbmNlZCBvbmx5IHVwIHRvIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIHRoaXMgbWV0aG9kLlxuICAgICAgICAqIEBwYXJhbSB7YXJyYXl9IHBhcmFtcy5leGNsdWRlIChPcHRpb25hbCkgQXJyYXkgb2YgbWV0aG9kcyB0byBleGNsdWRlIHdoZW4gYWR2YW5jaW5nIHRoZSBuZXdseSBjbG9uZWQgcnVuLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgY2xvbmU6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBydW5JZCA9IHBhcnNlUnVuSWRPckVycm9yKHBhcmFtcyk7XG5cbiAgICAgICAgICAgIHZhciByZXBsYXlPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgcnVuSWQgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcGFyYW1zID0gJC5leHRlbmQodHJ1ZSwgeyBhY3Rpb246ICdjbG9uZScgfSwgX3BpY2socGFyYW1zLCBbJ3N0b3BCZWZvcmUnLCAnZXhjbHVkZSddKSk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QocGFyYW1zLCByZXBsYXlPcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGVwaVZlcnNpb24gPSByZXF1aXJlKCcuLi9hcGktdmVyc2lvbi5qc29uJyk7XG5cbi8vVE9ETzogdXJsdXRpbHMgdG8gZ2V0IGhvc3QsIHNpbmNlIG5vIHdpbmRvdyBvbiBub2RlXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgaG9zdDogd2luZG93LmxvY2F0aW9uLmhvc3QsXG4gICAgcGF0aG5hbWU6IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZVxufTtcblxudmFyIFVybENvbmZpZ1NlcnZpY2UgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgdmFyIGFjdGluZ0hvc3QgPSBvcHRpb25zLmhvc3Q7XG5cbiAgICBmdW5jdGlvbiBpc0xvY2FsaG9zdCgpIHtcbiAgICAgICAgdmFyIGlzTG9jYWwgPSAhb3B0aW9ucy5ob3N0IHx8IC8vcGhhbnRvbWpzXG4gICAgICAgICAgICBvcHRpb25zLmhvc3QgPT09ICcxMjcuMC4wLjEnIHx8IFxuICAgICAgICAgICAgb3B0aW9ucy5ob3N0LmluZGV4T2YoJ2xvY2FsLicpID09PSAwIHx8IFxuICAgICAgICAgICAgb3B0aW9ucy5ob3N0LmluZGV4T2YoJ2xvY2FsaG9zdCcpID09PSAwO1xuICAgICAgICByZXR1cm4gaXNMb2NhbDtcbiAgICB9XG4gICAgXG4gICAgLy8gY29uc29sZS5sb2coaXNMb2NhbGhvc3QoKSwgJ19fX19fX19fX19fJyk7XG4gICAgaWYgKCFhY3RpbmdIb3N0ICYmIGlzTG9jYWxob3N0KCkpIHtcbiAgICAgICAgYWN0aW5nSG9zdCA9ICdmb3Jpby5jb20nO1xuICAgIH1cblxuICAgIHZhciBBUElfUFJPVE9DT0wgPSAnaHR0cHMnO1xuICAgIHZhciBIT1NUX0FQSV9NQVBQSU5HID0ge1xuICAgICAgICAnZm9yaW8uY29tJzogJ2FwaS5mb3Jpby5jb20nLFxuICAgICAgICAnZm9yaW9kZXYuY29tJzogJ2FwaS5lcGljZW50ZXIuZm9yaW9kZXYuY29tJ1xuICAgIH07XG5cbiAgICB2YXIgcHVibGljRXhwb3J0cyA9IHtcbiAgICAgICAgcHJvdG9jb2w6IEFQSV9QUk9UT0NPTCxcblxuICAgICAgICBhcGk6ICcnLFxuXG4gICAgICAgIC8vVE9ETzogdGhpcyBzaG91bGQgcmVhbGx5IGJlIGNhbGxlZCAnYXBpaG9zdCcsIGJ1dCBjYW4ndCBiZWNhdXNlIHRoYXQgd291bGQgYnJlYWsgdG9vIG1hbnkgdGhpbmdzXG4gICAgICAgIGhvc3Q6IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYXBpSG9zdCA9IChIT1NUX0FQSV9NQVBQSU5HW2FjdGluZ0hvc3RdKSA/IEhPU1RfQVBJX01BUFBJTkdbYWN0aW5nSG9zdF0gOiBhY3RpbmdIb3N0O1xuICAgICAgICAgICAgcmV0dXJuIGFwaUhvc3Q7XG4gICAgICAgIH0oKSksXG5cbiAgICAgICAgaXNDdXN0b21Eb21haW46IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcGF0aCA9IG9wdGlvbnMucGF0aG5hbWUuc3BsaXQoJ1xcLycpO1xuICAgICAgICAgICAgdmFyIHBhdGhIYXNBcHAgPSBwYXRoICYmIHBhdGhbMV0gPT09ICdhcHAnO1xuICAgICAgICAgICAgcmV0dXJuICghaXNMb2NhbGhvc3QoKSAmJiAhcGF0aEhhc0FwcCk7XG4gICAgICAgIH0oKSksXG5cbiAgICAgICAgYXBwUGF0aDogKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBwYXRoID0gb3B0aW9ucy5wYXRobmFtZS5zcGxpdCgnXFwvJyk7XG5cbiAgICAgICAgICAgIHJldHVybiBwYXRoICYmIHBhdGhbMV0gfHwgJyc7XG4gICAgICAgIH0oKSksXG5cbiAgICAgICAgYWNjb3VudFBhdGg6IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYWNjbnQgPSAnJztcbiAgICAgICAgICAgIHZhciBwYXRoID0gb3B0aW9ucy5wYXRobmFtZS5zcGxpdCgnXFwvJyk7XG4gICAgICAgICAgICBpZiAocGF0aCAmJiBwYXRoWzFdID09PSAnYXBwJykge1xuICAgICAgICAgICAgICAgIGFjY250ID0gcGF0aFsyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhY2NudDtcbiAgICAgICAgfSgpKSxcblxuICAgICAgICBwcm9qZWN0UGF0aDogKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBwcmogPSAnJztcbiAgICAgICAgICAgIHZhciBwYXRoID0gb3B0aW9ucy5wYXRobmFtZS5zcGxpdCgnXFwvJyk7XG4gICAgICAgICAgICBpZiAocGF0aCAmJiBwYXRoWzFdID09PSAnYXBwJykge1xuICAgICAgICAgICAgICAgIHByaiA9IHBhdGhbM107IC8vZXNsaW50LWRpc2FibGUtbGluZSBuby1tYWdpYy1udW1iZXJzXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcHJqO1xuICAgICAgICB9KCkpLFxuXG4gICAgICAgIHZlcnNpb25QYXRoOiAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHZlcnNpb24gPSBlcGlWZXJzaW9uLnZlcnNpb24gPyBlcGlWZXJzaW9uLnZlcnNpb24gKyAnLycgOiAnJztcbiAgICAgICAgICAgIHJldHVybiB2ZXJzaW9uO1xuICAgICAgICB9KCkpLFxuXG4gICAgICAgIGlzTG9jYWxob3N0OiBpc0xvY2FsaG9zdCxcblxuICAgICAgICBnZXRBUElQYXRoOiBmdW5jdGlvbiAoYXBpKSB7XG4gICAgICAgICAgICB2YXIgUFJPSkVDVF9BUElTID0gWydydW4nLCAnZGF0YScsICdmaWxlJ107XG5cbiAgICAgICAgICAgIHZhciBhcGlQYXRoID0gdGhpcy5wcm90b2NvbCArICc6Ly8nICsgdGhpcy5ob3N0ICsgJy8nICsgdGhpcy52ZXJzaW9uUGF0aCArIGFwaSArICcvJztcblxuICAgICAgICAgICAgaWYgKCQuaW5BcnJheShhcGksIFBST0pFQ1RfQVBJUykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgYXBpUGF0aCArPSB0aGlzLmFjY291bnRQYXRoICsgJy8nICsgdGhpcy5wcm9qZWN0UGF0aCArICcvJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhcGlQYXRoO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBlbnZDb25mID0gVXJsQ29uZmlnU2VydmljZS5kZWZhdWx0cztcblxuICAgICQuZXh0ZW5kKHB1YmxpY0V4cG9ydHMsIGVudkNvbmYsIGNvbmZpZyk7XG4gICAgcmV0dXJuIHB1YmxpY0V4cG9ydHM7XG59O1xuLy8gVGhpcyBkYXRhIGNhbiBiZSBzZXQgYnkgZXh0ZXJuYWwgc2NyaXB0cywgZm9yIGxvYWRpbmcgZnJvbSBhbiBlbnYgc2VydmVyIGZvciBlZztcblVybENvbmZpZ1NlcnZpY2UuZGVmYXVsdHMgPSB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSBVcmxDb25maWdTZXJ2aWNlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qICMjIFVzZXIgQVBJIEFkYXB0ZXJcbipcbiogVGhlIFVzZXIgQVBJIEFkYXB0ZXIgYWxsb3dzIHlvdSB0byByZXRyaWV2ZSBkZXRhaWxzIGFib3V0IGVuZCB1c2VycyBpbiB5b3VyIHRlYW0gKGFjY291bnQpLiBJdCBpcyBiYXNlZCBvbiB0aGUgcXVlcnlpbmcgY2FwYWJpbGl0aWVzIG9mIHRoZSB1bmRlcmx5aW5nIFJFU1RmdWwgW1VzZXIgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvdXNlcl9tYW5hZ2VtZW50L3VzZXIvKS5cbipcbiogVG8gdXNlIHRoZSBVc2VyIEFQSSBBZGFwdGVyLCBpbnN0YW50aWF0ZSBpdCBhbmQgdGhlbiBjYWxsIGl0cyBtZXRob2RzLlxuKlxuKiAgICAgICB2YXIgdWEgPSBuZXcgRi5zZXJ2aWNlLlVzZXIoe1xuKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuKiAgICAgICAgICAgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJ1xuKiAgICAgICB9KTtcbiogICAgICAgdWEuZ2V0QnlJZCgnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyk7XG4qICAgICAgIHVhLmdldCh7IHVzZXJOYW1lOiAnanNtaXRoJyB9KTtcbiogICAgICAgdWEuZ2V0KHsgaWQ6IFsnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyxcbiogICAgICAgICAgICAgICAgICAgJzRlYTc1NjMxLTRjOGQtNDg3Mi05ZDgwLWI0NjAwMTQ2NDc4ZSddIH0pO1xuKlxuKiBUaGUgY29uc3RydWN0b3IgdGFrZXMgYW4gb3B0aW9uYWwgb3B0aW9ucyBwYXJhbWV0ZXIgaW4gd2hpY2ggeW91IGNhbiBzcGVjaWZ5IHRoZSBgYWNjb3VudGAgYW5kIGB0b2tlbmAgaWYgdGhleSBhcmUgbm90IGFscmVhZHkgYXZhaWxhYmxlIGluIHRoZSBjdXJyZW50IGNvbnRleHQuXG4qL1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG52YXIgU2Vzc2lvbk1hbmFnZXIgPSByZXF1aXJlKCcuLi9zdG9yZS9zZXNzaW9uLW1hbmFnZXInKTtcbnZhciBxdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvcXVlcnktdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY2NvdW50IGlkLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpIG9yICoqVXNlciBJRCoqIChmb3IgcGVyc29uYWwgcHJvamVjdHMpLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBhY2NvdW50OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY2Nlc3MgdG9rZW4gdG8gdXNlIHdoZW4gc2VhcmNoaW5nIGZvciBlbmQgdXNlcnMuIChTZWUgW21vcmUgYmFja2dyb3VuZCBvbiBhY2Nlc3MgdG9rZW5zXSguLi8uLi8uLi9wcm9qZWN0X2FjY2Vzcy8pKS5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRva2VuOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXIuIEFsbCBqcXVlcnkuYWpheCBvcHRpb25zIGF0IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuYWpheC8gYXJlIGF2YWlsYWJsZS4gRGVmYXVsdHMgdG8gZW1wdHkgb2JqZWN0LlxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7fVxuICAgIH07XG5cbiAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKCk7XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKGRlZmF1bHRzLCBjb25maWcpO1xuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcbiAgICB2YXIgdHJhbnNwb3J0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aCgndXNlcicpXG4gICAgfSk7XG5cbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgdHJhbnNwb3J0T3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KHRyYW5zcG9ydE9wdGlvbnMpO1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBSZXRyaWV2ZSBkZXRhaWxzIGFib3V0IHBhcnRpY3VsYXIgZW5kIHVzZXJzIGluIHlvdXIgdGVhbSwgYmFzZWQgb24gdXNlciBuYW1lIG9yIHVzZXIgaWQuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgdmFyIHVhID0gbmV3IEYuc2VydmljZS5Vc2VyKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICB0b2tlbjogJ3VzZXItb3ItcHJvamVjdC1hY2Nlc3MtdG9rZW4nXG4gICAgICAgICogICAgICAgfSk7XG4gICAgICAgICogICAgICAgdWEuZ2V0KHsgdXNlck5hbWU6ICdqc21pdGgnIH0pO1xuICAgICAgICAqICAgICAgIHVhLmdldCh7IGlkOiBbJzQyODM2ZDRiLTViNjEtNGZlNC04MGViLTMxMzZlOTU2ZWU1YycsXG4gICAgICAgICogICAgICAgICAgICAgICAgICAgJzRlYTc1NjMxLTRjOGQtNDg3Mi05ZDgwLWI0NjAwMTQ2NDc4ZSddIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZmlsdGVyIE9iamVjdCB3aXRoIGZpZWxkIGB1c2VyTmFtZWAgYW5kIHZhbHVlIG9mIHRoZSB1c2VybmFtZS4gQWx0ZXJuYXRpdmVseSwgb2JqZWN0IHdpdGggZmllbGQgYGlkYCBhbmQgdmFsdWUgb2YgYW4gYXJyYXkgb2YgdXNlciBpZHMuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuXG4gICAgICAgIGdldDogZnVuY3Rpb24gKGZpbHRlciwgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICBmaWx0ZXIgPSBmaWx0ZXIgfHwge307XG5cbiAgICAgICAgICAgIHZhciBnZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9uc1xuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgdmFyIHRvUUZpbHRlciA9IGZ1bmN0aW9uIChmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzID0ge307XG5cbiAgICAgICAgICAgICAgICAvLyBBUEkgb25seSBzdXBwb3J0cyBmaWx0ZXJpbmcgYnkgdXNlcm5hbWUgZm9yIG5vd1xuICAgICAgICAgICAgICAgIGlmIChmaWx0ZXIudXNlck5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnEgPSBmaWx0ZXIudXNlck5hbWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciB0b0lkRmlsdGVycyA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgICAgIGlmICghaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlkID0gJC5pc0FycmF5KGlkKSA/IGlkIDogW2lkXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ2lkPScgKyBpZC5qb2luKCcmaWQ9Jyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgZ2V0RmlsdGVycyA9IFtcbiAgICAgICAgICAgICAgICAnYWNjb3VudD0nICsgZ2V0T3B0aW9ucy5hY2NvdW50LFxuICAgICAgICAgICAgICAgIHRvSWRGaWx0ZXJzKGZpbHRlci5pZCksXG4gICAgICAgICAgICAgICAgcXV0aWwudG9RdWVyeUZvcm1hdCh0b1FGaWx0ZXIoZmlsdGVyKSlcbiAgICAgICAgICAgIF0uam9pbignJicpO1xuXG4gICAgICAgICAgICAvLyBzcGVjaWFsIGNhc2UgZm9yIHF1ZXJpZXMgd2l0aCBsYXJnZSBudW1iZXIgb2YgaWRzXG4gICAgICAgICAgICAvLyBtYWtlIGl0IGFzIGEgcG9zdCB3aXRoIEdFVCBzZW1hbnRpY3NcbiAgICAgICAgICAgIHZhciB0aHJlc2hvbGQgPSAzMDtcbiAgICAgICAgICAgIGlmIChmaWx0ZXIuaWQgJiYgJC5pc0FycmF5KGZpbHRlci5pZCkgJiYgZmlsdGVyLmlkLmxlbmd0aCA+PSB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICBnZXRPcHRpb25zLnVybCA9IHVybENvbmZpZy5nZXRBUElQYXRoKCd1c2VyJykgKyAnP19tZXRob2Q9R0VUJztcbiAgICAgICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHsgaWQ6IGZpbHRlci5pZCB9LCBnZXRPcHRpb25zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KGdldEZpbHRlcnMsIGdldE9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFJldHJpZXZlIGRldGFpbHMgYWJvdXQgYSBzaW5nbGUgZW5kIHVzZXIgaW4geW91ciB0ZWFtLCBiYXNlZCBvbiB1c2VyIGlkLlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIHZhciB1YSA9IG5ldyBGLnNlcnZpY2UuVXNlcih7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJ1xuICAgICAgICAqICAgICAgIH0pO1xuICAgICAgICAqICAgICAgIHVhLmdldEJ5SWQoJzQyODM2ZDRiLTViNjEtNGZlNC04MGViLTMxMzZlOTU2ZWU1YycpO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlcklkIFRoZSB1c2VyIGlkIGZvciB0aGUgZW5kIHVzZXIgaW4geW91ciB0ZWFtLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cblxuICAgICAgICBnZXRCeUlkOiBmdW5jdGlvbiAodXNlcklkLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gcHVibGljQVBJLmdldCh7IGlkOiB1c2VySWQgfSwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG5cblxuIiwiLyoqXG4gKlxuICogIyMgVmFyaWFibGVzIEFQSSBTZXJ2aWNlXG4gKlxuICogVXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZSBbUnVuIEFQSSBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKSB0byByZWFkLCB3cml0ZSwgYW5kIHNlYXJjaCBmb3Igc3BlY2lmaWMgbW9kZWwgdmFyaWFibGVzLlxuICpcbiAqICAgICB2YXIgcm0gPSBuZXcgRi5tYW5hZ2VyLlJ1bk1hbmFnZXIoe1xuICogICAgICAgICAgIHJ1bjoge1xuICogICAgICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gKiAgICAgICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gKiAgICAgICAgICAgICAgIG1vZGVsOiAnc3VwcGx5LWNoYWluLW1vZGVsLmpsJ1xuICogICAgICAgICAgIH1cbiAqICAgICAgfSk7XG4gKiAgICAgcm0uZ2V0UnVuKClcbiAqICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICogICAgICAgICAgdmFyIHZzID0gcm0ucnVuLnZhcmlhYmxlcygpO1xuICogICAgICAgICAgdnMuc2F2ZSh7c2FtcGxlX2ludDogNH0pO1xuICogICAgICAgIH0pO1xuICpcbiAqL1xuXG5cbiAndXNlIHN0cmljdCc7XG5cbiB2YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG4gdmFyIHJ1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9ydW4tdXRpbCcpO1xuXG4gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBydW5zIG9iamVjdCB0byB3aGljaCB0aGUgdmFyaWFibGUgZmlsdGVycyBhcHBseS4gRGVmYXVsdHMgdG8gbnVsbC5cbiAgICAgICAgICogQHR5cGUge3J1blNlcnZpY2V9XG4gICAgICAgICAqL1xuICAgICAgICAgcnVuU2VydmljZTogbnVsbFxuICAgICB9O1xuICAgICB2YXIgc2VydmljZU9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG5cbiAgICAgdmFyIGdldFVSTCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgIHJldHVybiBzZXJ2aWNlT3B0aW9ucy5ydW5TZXJ2aWNlLnVybENvbmZpZy5nZXRGaWx0ZXJVUkwoKSArICd2YXJpYWJsZXMvJztcbiAgICAgfTtcblxuICAgICB2YXIgYWRkQXV0b1Jlc3RvcmVIZWFkZXIgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgcmV0dXJuIHNlcnZpY2VPcHRpb25zLnJ1blNlcnZpY2UudXJsQ29uZmlnLmFkZEF1dG9SZXN0b3JlSGVhZGVyKG9wdGlvbnMpO1xuICAgICB9O1xuXG4gICAgIHZhciBodHRwT3B0aW9ucyA9IHtcbiAgICAgICAgIHVybDogZ2V0VVJMXG4gICAgIH07XG4gICAgIGlmIChzZXJ2aWNlT3B0aW9ucy50b2tlbikge1xuICAgICAgICAgaHR0cE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyBzZXJ2aWNlT3B0aW9ucy50b2tlblxuICAgICAgICAgfTtcbiAgICAgfVxuICAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KGh0dHBPcHRpb25zKTtcbiAgICAgaHR0cC5zcGxpdEdldCA9IHJ1dGlsLnNwbGl0R2V0RmFjdG9yeShodHRwT3B0aW9ucyk7XG5cbiAgICAgdmFyIHB1YmxpY0FQSSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHZhbHVlcyBmb3IgYSB2YXJpYWJsZS5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICB2cy5sb2FkKCdzYW1wbGVfaW50JylcbiAgICAgICAgICogICAgICAgICAgLnRoZW4oZnVuY3Rpb24odmFsKXtcbiAgICAgICAgICogICAgICAgICAgICAgIC8vIHZhbCBjb250YWlucyB0aGUgdmFsdWUgb2Ygc2FtcGxlX2ludFxuICAgICAgICAgKiAgICAgICAgICB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHZhcmlhYmxlIE5hbWUgb2YgdmFyaWFibGUgdG8gbG9hZC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG91dHB1dE1vZGlmaWVyIChPcHRpb25hbCkgQXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICAgbG9hZDogZnVuY3Rpb24gKHZhcmlhYmxlLCBvdXRwdXRNb2RpZmllciwgb3B0aW9ucykge1xuICAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICAgaHR0cE9wdGlvbnMgPSBhZGRBdXRvUmVzdG9yZUhlYWRlcihodHRwT3B0aW9ucyk7XG4gICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KG91dHB1dE1vZGlmaWVyLCAkLmV4dGVuZCh7fSwgaHR0cE9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICAgdXJsOiBnZXRVUkwoKSArIHZhcmlhYmxlICsgJy8nXG4gICAgICAgICAgICAgfSkpO1xuICAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyBwYXJ0aWN1bGFyIHZhcmlhYmxlcywgYmFzZWQgb24gY29uZGl0aW9ucyBzcGVjaWZpZWQgaW4gdGhlIGBxdWVyeWAgb2JqZWN0LlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIHZzLnF1ZXJ5KFsncHJpY2UnLCAnc2FsZXMnXSlcbiAgICAgICAgICogICAgICAgICAgLnRoZW4oZnVuY3Rpb24odmFsKSB7XG4gICAgICAgICAqICAgICAgICAgICAgICAvLyB2YWwgaXMgYW4gb2JqZWN0IHdpdGggdGhlIHZhbHVlcyBvZiB0aGUgcmVxdWVzdGVkIHZhcmlhYmxlczogdmFsLnByaWNlLCB2YWwuc2FsZXNcbiAgICAgICAgICogICAgICAgICAgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgdnMucXVlcnkoeyBpbmNsdWRlOlsncHJpY2UnLCAnc2FsZXMnXSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R8QXJyYXl9IHF1ZXJ5IFRoZSBuYW1lcyBvZiB0aGUgdmFyaWFibGVzIHJlcXVlc3RlZC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG91dHB1dE1vZGlmaWVyIChPcHRpb25hbCkgQXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICAgcXVlcnk6IGZ1bmN0aW9uIChxdWVyeSwgb3V0cHV0TW9kaWZpZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vUXVlcnkgYW5kIG91dHB1dE1vZGlmaWVyIGFyZSBib3RoIHF1ZXJ5c3RyaW5ncyBpbiB0aGUgdXJsOyBvbmx5IGNhbGxpbmcgdGhlbSBvdXQgc2VwYXJhdGVseSBoZXJlIHRvIGJlIGNvbnNpc3RlbnQgd2l0aCB0aGUgb3RoZXIgY2FsbHNcbiAgICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgIGh0dHBPcHRpb25zID0gYWRkQXV0b1Jlc3RvcmVIZWFkZXIoaHR0cE9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgaWYgKCQuaXNBcnJheShxdWVyeSkpIHtcbiAgICAgICAgICAgICAgICAgcXVlcnkgPSB7IGluY2x1ZGU6IHF1ZXJ5IH07XG4gICAgICAgICAgICAgfVxuICAgICAgICAgICAgICQuZXh0ZW5kKHF1ZXJ5LCBvdXRwdXRNb2RpZmllcik7XG4gICAgICAgICAgICAgcmV0dXJuIGh0dHAuc3BsaXRHZXQocXVlcnksIGh0dHBPcHRpb25zKTtcbiAgICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNhdmUgdmFsdWVzIHRvIG1vZGVsIHZhcmlhYmxlcy4gT3ZlcndyaXRlcyBleGlzdGluZyB2YWx1ZXMuIE5vdGUgdGhhdCB5b3UgY2FuIG9ubHkgdXBkYXRlIG1vZGVsIHZhcmlhYmxlcyBpZiB0aGUgcnVuIGlzIFtpbiBtZW1vcnldKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpLiAoQW4gYWx0ZXJuYXRlIHdheSB0byB1cGRhdGUgbW9kZWwgdmFyaWFibGVzIGlzIHRvIGNhbGwgYSBtZXRob2QgZnJvbSB0aGUgbW9kZWwgYW5kIG1ha2Ugc3VyZSB0aGF0IHRoZSBtZXRob2QgcGVyc2lzdHMgdGhlIHZhcmlhYmxlcy4gU2VlIGBkb2AsIGBzZXJpYWxgLCBhbmQgYHBhcmFsbGVsYCBpbiB0aGUgW1J1biBBUEkgU2VydmljZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLykgZm9yIGNhbGxpbmcgbWV0aG9kcyBmcm9tIHRoZSBtb2RlbC4pXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgdnMuc2F2ZSgncHJpY2UnLCA0KTtcbiAgICAgICAgICogICAgICB2cy5zYXZlKHsgcHJpY2U6IDQsIHF1YW50aXR5OiA1LCBwcm9kdWN0czogWzIsMyw0XSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSB2YXJpYWJsZSBBbiBvYmplY3QgY29tcG9zZWQgb2YgdGhlIG1vZGVsIHZhcmlhYmxlcyBhbmQgdGhlIHZhbHVlcyB0byBzYXZlLiBBbHRlcm5hdGl2ZWx5LCBhIHN0cmluZyB3aXRoIHRoZSBuYW1lIG9mIHRoZSB2YXJpYWJsZS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHZhbCAoT3B0aW9uYWwpIElmIHBhc3NpbmcgYSBzdHJpbmcgZm9yIGB2YXJpYWJsZWAsIHVzZSB0aGlzIGFyZ3VtZW50IGZvciB0aGUgdmFsdWUgdG8gc2F2ZS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgICBzYXZlOiBmdW5jdGlvbiAodmFyaWFibGUsIHZhbCwgb3B0aW9ucykge1xuICAgICAgICAgICAgIHZhciBhdHRycztcbiAgICAgICAgICAgICBpZiAodHlwZW9mIHZhcmlhYmxlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICBhdHRycyA9IHZhcmlhYmxlO1xuICAgICAgICAgICAgICAgICBvcHRpb25zID0gdmFsO1xuICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgIChhdHRycyA9IHt9KVt2YXJpYWJsZV0gPSB2YWw7XG4gICAgICAgICAgICAgfVxuICAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgICByZXR1cm4gaHR0cC5wYXRjaC5jYWxsKHRoaXMsIGF0dHJzLCBodHRwT3B0aW9ucyk7XG4gICAgICAgICB9XG5cbiAgICAgICAgLy8gTm90IEF2YWlsYWJsZSB1bnRpbCB1bmRlcmx5aW5nIEFQSSBzdXBwb3J0cyBQVVQuIE90aGVyd2lzZSBzYXZlIHdvdWxkIGJlIFBVVCBhbmQgbWVyZ2Ugd291bGQgYmUgUEFUQ0hcbiAgICAgICAgLy8gKlxuICAgICAgICAvLyAgKiBTYXZlIHZhbHVlcyB0byB0aGUgYXBpLiBNZXJnZXMgYXJyYXlzLCBidXQgb3RoZXJ3aXNlIHNhbWUgYXMgc2F2ZVxuICAgICAgICAvLyAgKiBAcGFyYW0ge09iamVjdHxTdHJpbmd9IHZhcmlhYmxlIE9iamVjdCB3aXRoIGF0dHJpYnV0ZXMsIG9yIHN0cmluZyBrZXlcbiAgICAgICAgLy8gICogQHBhcmFtIHtPYmplY3R9IHZhbCBPcHRpb25hbCBpZiBwcmV2IHBhcmFtZXRlciB3YXMgYSBzdHJpbmcsIHNldCB2YWx1ZSBoZXJlXG4gICAgICAgIC8vICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zXG4gICAgICAgIC8vICAqXG4gICAgICAgIC8vICAqIEBleGFtcGxlXG4gICAgICAgIC8vICAqICAgICB2cy5tZXJnZSh7IHByaWNlOiA0LCBxdWFudGl0eTogNSwgcHJvZHVjdHM6IFsyLDMsNF0gfSlcbiAgICAgICAgLy8gICogICAgIHZzLm1lcmdlKCdwcmljZScsIDQpO1xuXG4gICAgICAgIC8vIG1lcmdlOiBmdW5jdGlvbiAodmFyaWFibGUsIHZhbCwgb3B0aW9ucykge1xuICAgICAgICAvLyAgICAgdmFyIGF0dHJzO1xuICAgICAgICAvLyAgICAgaWYgKHR5cGVvZiB2YXJpYWJsZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgLy8gICAgICAgYXR0cnMgPSB2YXJpYWJsZTtcbiAgICAgICAgLy8gICAgICAgb3B0aW9ucyA9IHZhbDtcbiAgICAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICAgIChhdHRycyA9IHt9KVt2YXJpYWJsZV0gPSB2YWw7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgIC8vICAgICByZXR1cm4gaHR0cC5wYXRjaC5jYWxsKHRoaXMsIGF0dHJzLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIC8vIH1cbiAgICAgfTtcbiAgICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbiB9O1xuIiwiLyoqXG4gKiAjIyBXb3JsZCBBUEkgQWRhcHRlclxuICpcbiAqIEEgW3J1bl0oLi4vLi4vLi4vZ2xvc3NhcnkvI3J1bikgaXMgYSBjb2xsZWN0aW9uIG9mIGVuZCB1c2VyIGludGVyYWN0aW9ucyB3aXRoIGEgcHJvamVjdCBhbmQgaXRzIG1vZGVsIC0tIGluY2x1ZGluZyBzZXR0aW5nIHZhcmlhYmxlcywgbWFraW5nIGRlY2lzaW9ucywgYW5kIGNhbGxpbmcgb3BlcmF0aW9ucy4gRm9yIGJ1aWxkaW5nIG11bHRpcGxheWVyIHNpbXVsYXRpb25zIHlvdSB0eXBpY2FsbHkgd2FudCBtdWx0aXBsZSBlbmQgdXNlcnMgdG8gc2hhcmUgdGhlIHNhbWUgc2V0IG9mIGludGVyYWN0aW9ucywgYW5kIHdvcmsgd2l0aGluIGEgY29tbW9uIHN0YXRlLiBFcGljZW50ZXIgYWxsb3dzIHlvdSB0byBjcmVhdGUgXCJ3b3JsZHNcIiB0byBoYW5kbGUgc3VjaCBjYXNlcy4gT25seSBbdGVhbSBwcm9qZWN0c10oLi4vLi4vLi4vZ2xvc3NhcnkvI3RlYW0pIGNhbiBiZSBtdWx0aXBsYXllci5cbiAqXG4gKiBUaGUgV29ybGQgQVBJIEFkYXB0ZXIgYWxsb3dzIHlvdSB0byBjcmVhdGUsIGFjY2VzcywgYW5kIG1hbmlwdWxhdGUgbXVsdGlwbGF5ZXIgd29ybGRzIHdpdGhpbiB5b3VyIEVwaWNlbnRlciBwcm9qZWN0LiBZb3UgY2FuIHVzZSB0aGlzIHRvIGFkZCBhbmQgcmVtb3ZlIGVuZCB1c2VycyBmcm9tIHRoZSB3b3JsZCwgYW5kIHRvIGNyZWF0ZSwgYWNjZXNzLCBhbmQgcmVtb3ZlIHRoZWlyIHJ1bnMuIEJlY2F1c2Ugb2YgdGhpcywgdHlwaWNhbGx5IHRoZSBXb3JsZCBBZGFwdGVyIGlzIHVzZWQgZm9yIGZhY2lsaXRhdG9yIHBhZ2VzIGluIHlvdXIgcHJvamVjdC4gKFRoZSByZWxhdGVkIFtXb3JsZCBNYW5hZ2VyXSguLi93b3JsZC1tYW5hZ2VyLykgcHJvdmlkZXMgYW4gZWFzeSB3YXkgdG8gYWNjZXNzIHJ1bnMgYW5kIHdvcmxkcyBmb3IgcGFydGljdWxhciBlbmQgdXNlcnMsIHNvIGlzIHR5cGljYWxseSB1c2VkIGluIHBhZ2VzIHRoYXQgZW5kIHVzZXJzIHdpbGwgaW50ZXJhY3Qgd2l0aC4pXG4gKlxuICogQXMgd2l0aCBhbGwgdGhlIG90aGVyIFtBUEkgQWRhcHRlcnNdKC4uLy4uLyksIGFsbCBtZXRob2RzIHRha2UgaW4gYW4gXCJvcHRpb25zXCIgb2JqZWN0IGFzIHRoZSBsYXN0IHBhcmFtZXRlci4gVGhlIG9wdGlvbnMgY2FuIGJlIHVzZWQgdG8gZXh0ZW5kL292ZXJyaWRlIHRoZSBXb3JsZCBBUEkgU2VydmljZSBkZWZhdWx0cy5cbiAqXG4gKiBUbyB1c2UgdGhlIFdvcmxkIEFkYXB0ZXIsIGluc3RhbnRpYXRlIGl0IGFuZCB0aGVuIGFjY2VzcyB0aGUgbWV0aG9kcyBwcm92aWRlZC4gSW5zdGFudGlhdGluZyByZXF1aXJlcyB0aGUgYWNjb3VudCBpZCAoKipUZWFtIElEKiogaW4gdGhlIEVwaWNlbnRlciB1c2VyIGludGVyZmFjZSksIHByb2plY3QgaWQgKCoqUHJvamVjdCBJRCoqKSwgYW5kIGdyb3VwICgqKkdyb3VwIE5hbWUqKikuXG4gKlxuICogICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gKiAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gKiAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICogICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gKiAgICAgICB3YS5jcmVhdGUoKVxuICogICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAqICAgICAgICAgICAgICAvLyBjYWxsIG1ldGhvZHMsIGUuZy4gd2EuYWRkVXNlcnMoKVxuICogICAgICAgICAgfSk7XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG4vLyB2YXIgcXV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3F1ZXJ5LXV0aWwnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbnZhciBTZXNzaW9uTWFuYWdlciA9IHJlcXVpcmUoJy4uL3N0b3JlL3Nlc3Npb24tbWFuYWdlcicpO1xudmFyIF9waWNrID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QtdXRpbCcpLl9waWNrO1xuXG52YXIgYXBpQmFzZSA9ICdtdWx0aXBsYXllci8nO1xudmFyIGFzc2lnbm1lbnRFbmRwb2ludCA9IGFwaUJhc2UgKyAnYXNzaWduJztcbnZhciBhcGlFbmRwb2ludCA9IGFwaUJhc2UgKyAnd29ybGQnO1xudmFyIHByb2plY3RFbmRwb2ludCA9IGFwaUJhc2UgKyAncHJvamVjdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvciBwcm9qZWN0cyB0aGF0IHJlcXVpcmUgYXV0aGVudGljYXRpb24sIHBhc3MgaW4gdGhlIHVzZXIgYWNjZXNzIHRva2VuIChkZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcpLiBJZiB0aGUgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbiB0byBFcGljZW50ZXIsIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiBpcyBhbHJlYWR5IHNldCBpbiBhIGNvb2tpZSBhbmQgYXV0b21hdGljYWxseSBsb2FkZWQgZnJvbSB0aGVyZS4gKFNlZSBbbW9yZSBiYWNrZ3JvdW5kIG9uIGFjY2VzcyB0b2tlbnNdKC4uLy4uLy4uL3Byb2plY3RfYWNjZXNzLykpLlxuICAgICAgICAgKiBAc2VlIFtBdXRoZW50aWNhdGlvbiBBUEkgU2VydmljZV0oLi4vYXV0aC1hcGktc2VydmljZS8pIGZvciBnZXR0aW5nIHRva2Vucy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRva2VuOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBwcm9qZWN0IGlkLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgVVJMLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcHJvamVjdDogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWNjb3VudCBpZC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKS4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGdyb3VwIG5hbWUuIERlZmF1bHRzIHRvIHVuZGVmaW5lZC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGdyb3VwOiB1bmRlZmluZWQsXG5cbiAgICAgICAvKipcbiAgICAgICAgICogVGhlIG1vZGVsIGZpbGUgdG8gdXNlIHRvIGNyZWF0ZSBydW5zIGluIHRoaXMgd29ybGQuIERlZmF1bHRzIHRvIHVuZGVmaW5lZC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIG1vZGVsOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyaXRlcmlhIGJ5IHdoaWNoIHRvIGZpbHRlciB3b3JsZC4gQ3VycmVudGx5IG9ubHkgc3VwcG9ydHMgd29ybGQtaWRzIGFzIGZpbHRlcnMuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmaWx0ZXI6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb252ZW5pZW5jZSBhbGlhcyBmb3IgZmlsdGVyXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBpZDogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXIuIEFsbCBqcXVlcnkuYWpheCBvcHRpb25zIGF0IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuYWpheC8gYXJlIGF2YWlsYWJsZS4gRGVmYXVsdHMgdG8gZW1wdHkgb2JqZWN0LlxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7fSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbGVkIHdoZW4gdGhlIGNhbGwgY29tcGxldGVzIHN1Y2Nlc3NmdWxseS4gRGVmYXVsdHMgdG8gYCQubm9vcGAuXG4gICAgICAgICAqIEB0eXBlIHtmdW5jdGlvbn1cbiAgICAgICAgICovXG4gICAgICAgIHN1Y2Nlc3M6ICQubm9vcCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbGVkIHdoZW4gdGhlIGNhbGwgZmFpbHMuIERlZmF1bHRzIHRvIGAkLm5vb3BgLlxuICAgICAgICAgKiBAdHlwZSB7ZnVuY3Rpb259XG4gICAgICAgICAqL1xuICAgICAgICBlcnJvcjogJC5ub29wXG4gICAgfTtcblxuICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIgPSBuZXcgU2Vzc2lvbk1hbmFnZXIoKTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLmlkKSB7XG4gICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IHNlcnZpY2VPcHRpb25zLmlkO1xuICAgIH1cblxuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcblxuICAgIGlmICghc2VydmljZU9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICBzZXJ2aWNlT3B0aW9ucy5hY2NvdW50ID0gdXJsQ29uZmlnLmFjY291bnRQYXRoO1xuICAgIH1cblxuICAgIGlmICghc2VydmljZU9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICBzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0ID0gdXJsQ29uZmlnLnByb2plY3RQYXRoO1xuICAgIH1cblxuICAgIHZhciB0cmFuc3BvcnRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KVxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIHRyYW5zcG9ydE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zKTtcblxuICAgIHZhciBzZXRJZEZpbHRlck9yVGhyb3dFcnJvciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmlkKSB7XG4gICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSBvcHRpb25zLmlkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmZpbHRlcikge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gb3B0aW9ucy5maWx0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFzZXJ2aWNlT3B0aW9ucy5maWx0ZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gd29ybGQgaWQgc3BlY2lmaWVkIHRvIGFwcGx5IG9wZXJhdGlvbnMgYWdhaW5zdC4gVGhpcyBjb3VsZCBoYXBwZW4gaWYgdGhlIHVzZXIgaXMgbm90IGFzc2lnbmVkIHRvIGEgd29ybGQgYW5kIGlzIHRyeWluZyB0byB3b3JrIHdpdGggcnVucyBmcm9tIHRoYXQgd29ybGQuJyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHZhbGlkYXRlTW9kZWxPclRocm93RXJyb3IgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAoIW9wdGlvbnMubW9kZWwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gbW9kZWwgc3BlY2lmaWVkIHRvIGdldCB0aGUgY3VycmVudCBydW4nKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIENyZWF0ZXMgYSBuZXcgV29ybGQuXG4gICAgICAgICpcbiAgICAgICAgKiBVc2luZyB0aGlzIG1ldGhvZCBpcyByYXJlLiBJdCBpcyBtb3JlIGNvbW1vbiB0byBjcmVhdGUgd29ybGRzIGF1dG9tYXRpY2FsbHkgd2hpbGUgeW91IGBhdXRvQXNzaWduKClgIGVuZCB1c2VycyB0byB3b3JsZHMuIChJbiB0aGlzIGNhc2UsIGNvbmZpZ3VyYXRpb24gZGF0YSBmb3IgdGhlIHdvcmxkLCBzdWNoIGFzIHRoZSByb2xlcywgYXJlIHJlYWQgZnJvbSB0aGUgcHJvamVjdC1sZXZlbCB3b3JsZCBjb25maWd1cmF0aW9uIGluZm9ybWF0aW9uLCBmb3IgZXhhbXBsZSBieSBgZ2V0UHJvamVjdFNldHRpbmdzKClgLilcbiAgICAgICAgKlxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKiAgICAgIHdhLmNyZWF0ZSh7XG4gICAgICAgICogICAgICAgICAgIHJvbGVzOiBbJ1ZQIE1hcmtldGluZycsICdWUCBTYWxlcycsICdWUCBFbmdpbmVlcmluZyddXG4gICAgICAgICogICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIFBhcmFtZXRlcnMgdG8gY3JlYXRlIHRoZSB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmdyb3VwIChPcHRpb25hbCkgVGhlICoqR3JvdXAgTmFtZSoqIHRvIGNyZWF0ZSB0aGlzIHdvcmxkIHVuZGVyLiBPbmx5IGVuZCB1c2VycyBpbiB0aGlzIGdyb3VwIGFyZSBlbGlnaWJsZSB0byBqb2luIHRoZSB3b3JsZC4gT3B0aW9uYWwgaGVyZTsgcmVxdWlyZWQgd2hlbiBpbnN0YW50aWF0aW5nIHRoZSBzZXJ2aWNlIChgbmV3IEYuc2VydmljZS5Xb3JsZCgpYCkuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcy5yb2xlcyAoT3B0aW9uYWwpIFRoZSBsaXN0IG9mIHJvbGVzIChzdHJpbmdzKSBmb3IgdGhpcyB3b3JsZC4gU29tZSB3b3JsZHMgaGF2ZSBzcGVjaWZpYyByb2xlcyB0aGF0ICoqbXVzdCoqIGJlIGZpbGxlZCBieSBlbmQgdXNlcnMuIExpc3RpbmcgdGhlIHJvbGVzIGFsbG93cyB5b3UgdG8gYXV0b2Fzc2lnbiB1c2VycyB0byB3b3JsZHMgYW5kIGVuc3VyZSB0aGF0IGFsbCByb2xlcyBhcmUgZmlsbGVkIGluIGVhY2ggd29ybGQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcy5vcHRpb25hbFJvbGVzIChPcHRpb25hbCkgVGhlIGxpc3Qgb2Ygb3B0aW9uYWwgcm9sZXMgKHN0cmluZ3MpIGZvciB0aGlzIHdvcmxkLiBTb21lIHdvcmxkcyBoYXZlIHNwZWNpZmljIHJvbGVzIHRoYXQgKiptYXkqKiBiZSBmaWxsZWQgYnkgZW5kIHVzZXJzLiBMaXN0aW5nIHRoZSBvcHRpb25hbCByb2xlcyBhcyBwYXJ0IG9mIHRoZSB3b3JsZCBvYmplY3QgYWxsb3dzIHlvdSB0byBhdXRvYXNzaWduIHVzZXJzIHRvIHdvcmxkcyBhbmQgZW5zdXJlIHRoYXQgYWxsIHJvbGVzIGFyZSBmaWxsZWQgaW4gZWFjaCB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge2ludGVnZXJ9IHBhcmFtcy5taW5Vc2VycyAoT3B0aW9uYWwpIFRoZSBtaW5pbXVtIG51bWJlciBvZiB1c2VycyBmb3IgdGhlIHdvcmxkLiBJbmNsdWRpbmcgdGhpcyBudW1iZXIgYWxsb3dzIHlvdSB0byBhdXRvYXNzaWduIGVuZCB1c2VycyB0byB3b3JsZHMgYW5kIGVuc3VyZSB0aGF0IHRoZSBjb3JyZWN0IG51bWJlciBvZiB1c2VycyBhcmUgaW4gZWFjaCB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGNyZWF0ZU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMsIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgfSk7XG4gICAgICAgICAgICB2YXIgd29ybGRBcGlQYXJhbXMgPSBbJ3Njb3BlJywgJ2ZpbGVzJywgJ3JvbGVzJywgJ29wdGlvbmFsUm9sZXMnLCAnbWluVXNlcnMnLCAnZ3JvdXAnLCAnbmFtZSddO1xuICAgICAgICAgICAgdmFyIHZhbGlkUGFyYW1zID0gX3BpY2soc2VydmljZU9wdGlvbnMsIFsnYWNjb3VudCcsICdwcm9qZWN0JywgJ2dyb3VwJ10pO1xuICAgICAgICAgICAgLy8gd2hpdGVsaXN0IHRoZSBmaWVsZHMgdGhhdCB3ZSBhY3R1YWxseSBjYW4gc2VuZCB0byB0aGUgYXBpXG4gICAgICAgICAgICBwYXJhbXMgPSBfcGljayhwYXJhbXMsIHdvcmxkQXBpUGFyYW1zKTtcblxuICAgICAgICAgICAgLy8gYWNjb3VudCBhbmQgcHJvamVjdCBnbyBpbiB0aGUgYm9keSwgbm90IGluIHRoZSB1cmxcbiAgICAgICAgICAgIHBhcmFtcyA9ICQuZXh0ZW5kKHt9LCB2YWxpZFBhcmFtcywgcGFyYW1zKTtcblxuICAgICAgICAgICAgdmFyIG9sZFN1Y2Nlc3MgPSBjcmVhdGVPcHRpb25zLnN1Y2Nlc3M7XG4gICAgICAgICAgICBjcmVhdGVPcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSByZXNwb25zZS5pZDsgLy9hbGwgZnV0dXJlIGNoYWluZWQgY2FsbHMgdG8gb3BlcmF0ZSBvbiB0aGlzIGlkXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9sZFN1Y2Nlc3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QocGFyYW1zLCBjcmVhdGVPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBVcGRhdGVzIGEgV29ybGQsIGZvciBleGFtcGxlIHRvIHJlcGxhY2UgdGhlIHJvbGVzIGluIHRoZSB3b3JsZC5cbiAgICAgICAgKlxuICAgICAgICAqIFR5cGljYWxseSwgeW91IGNvbXBsZXRlIHdvcmxkIGNvbmZpZ3VyYXRpb24gYXQgdGhlIHByb2plY3QgbGV2ZWwsIHJhdGhlciB0aGFuIGF0IHRoZSB3b3JsZCBsZXZlbC4gRm9yIGV4YW1wbGUsIGVhY2ggd29ybGQgaW4geW91ciBwcm9qZWN0IHByb2JhYmx5IGhhcyB0aGUgc2FtZSByb2xlcyBmb3IgZW5kIHVzZXJzLiBBbmQgeW91ciBwcm9qZWN0IGlzIHByb2JhYmx5IGVpdGhlciBjb25maWd1cmVkIHNvIHRoYXQgYWxsIGVuZCB1c2VycyBzaGFyZSB0aGUgc2FtZSB3b3JsZCAoYW5kIHJ1biksIG9yIHNtYWxsZXIgc2V0cyBvZiBlbmQgdXNlcnMgc2hhcmUgd29ybGRzIOKAlCBidXQgbm90IGJvdGguIEhvd2V2ZXIsIHRoaXMgbWV0aG9kIGlzIGF2YWlsYWJsZSBpZiB5b3UgbmVlZCB0byB1cGRhdGUgdGhlIGNvbmZpZ3VyYXRpb24gb2YgYSBwYXJ0aWN1bGFyIHdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLnVwZGF0ZSh7IHJvbGVzOiBbJ1ZQIE1hcmtldGluZycsICdWUCBTYWxlcycsICdWUCBFbmdpbmVlcmluZyddIH0pO1xuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgUGFyYW1ldGVycyB0byB1cGRhdGUgdGhlIHdvcmxkLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMubmFtZSBBIHN0cmluZyBpZGVudGlmaWVyIGZvciB0aGUgbGlua2VkIGVuZCB1c2VycywgZm9yIGV4YW1wbGUsIFwibmFtZVwiOiBcIk91ciBUZWFtXCIuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcy5yb2xlcyAoT3B0aW9uYWwpIFRoZSBsaXN0IG9mIHJvbGVzIChzdHJpbmdzKSBmb3IgdGhpcyB3b3JsZC4gU29tZSB3b3JsZHMgaGF2ZSBzcGVjaWZpYyByb2xlcyB0aGF0ICoqbXVzdCoqIGJlIGZpbGxlZCBieSBlbmQgdXNlcnMuIExpc3RpbmcgdGhlIHJvbGVzIGFsbG93cyB5b3UgdG8gYXV0b2Fzc2lnbiB1c2VycyB0byB3b3JsZHMgYW5kIGVuc3VyZSB0aGF0IGFsbCByb2xlcyBhcmUgZmlsbGVkIGluIGVhY2ggd29ybGQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcy5vcHRpb25hbFJvbGVzIChPcHRpb25hbCkgVGhlIGxpc3Qgb2Ygb3B0aW9uYWwgcm9sZXMgKHN0cmluZ3MpIGZvciB0aGlzIHdvcmxkLiBTb21lIHdvcmxkcyBoYXZlIHNwZWNpZmljIHJvbGVzIHRoYXQgKiptYXkqKiBiZSBmaWxsZWQgYnkgZW5kIHVzZXJzLiBMaXN0aW5nIHRoZSBvcHRpb25hbCByb2xlcyBhcyBwYXJ0IG9mIHRoZSB3b3JsZCBvYmplY3QgYWxsb3dzIHlvdSB0byBhdXRvYXNzaWduIHVzZXJzIHRvIHdvcmxkcyBhbmQgZW5zdXJlIHRoYXQgYWxsIHJvbGVzIGFyZSBmaWxsZWQgaW4gZWFjaCB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge2ludGVnZXJ9IHBhcmFtcy5taW5Vc2VycyAoT3B0aW9uYWwpIFRoZSBtaW5pbXVtIG51bWJlciBvZiB1c2VycyBmb3IgdGhlIHdvcmxkLiBJbmNsdWRpbmcgdGhpcyBudW1iZXIgYWxsb3dzIHlvdSB0byBhdXRvYXNzaWduIGVuZCB1c2VycyB0byB3b3JsZHMgYW5kIGVuc3VyZSB0aGF0IHRoZSBjb3JyZWN0IG51bWJlciBvZiB1c2VycyBhcmUgaW4gZWFjaCB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHdoaXRlbGlzdCA9IFsncm9sZXMnLCAnb3B0aW9uYWxSb2xlcycsICdtaW5Vc2VycyddO1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICBzZXRJZEZpbHRlck9yVGhyb3dFcnJvcihvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIHVwZGF0ZU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcGFyYW1zID0gX3BpY2socGFyYW1zIHx8IHt9LCB3aGl0ZWxpc3QpO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wYXRjaChwYXJhbXMsIHVwZGF0ZU9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIERlbGV0ZXMgYW4gZXhpc3Rpbmcgd29ybGQuXG4gICAgICAgICpcbiAgICAgICAgKiBUaGlzIGZ1bmN0aW9uIG9wdGlvbmFsbHkgdGFrZXMgb25lIGFyZ3VtZW50LiBJZiB0aGUgYXJndW1lbnQgaXMgYSBzdHJpbmcsIGl0IGlzIHRoZSBpZCBvZiB0aGUgd29ybGQgdG8gZGVsZXRlLiBJZiB0aGUgYXJndW1lbnQgaXMgYW4gb2JqZWN0LCBpdCBpcyB0aGUgb3ZlcnJpZGUgZm9yIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmRlbGV0ZSgpO1xuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIFRoZSBpZCBvZiB0aGUgd29ybGQgdG8gZGVsZXRlLCBvciBvcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBkZWxldGU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gKG9wdGlvbnMgJiYgKHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJykpID8geyBmaWx0ZXI6IG9wdGlvbnMgfSA6IHt9O1xuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBkZWxldGVPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmRlbGV0ZShudWxsLCBkZWxldGVPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBVcGRhdGVzIHRoZSBjb25maWd1cmF0aW9uIGZvciB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGUgV29ybGQgQVBJIEFkYXB0ZXIgKGluY2x1ZGluZyBhbGwgc3Vic2VxdWVudCBmdW5jdGlvbiBjYWxscywgdW50aWwgdGhlIGNvbmZpZ3VyYXRpb24gaXMgdXBkYXRlZCBhZ2FpbikuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHsuLi59KS51cGRhdGVDb25maWcoeyBmaWx0ZXI6ICcxMjMnIH0pLmFkZFVzZXIoeyB1c2VySWQ6ICcxMjMnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gY29uZmlnIFRoZSBjb25maWd1cmF0aW9uIG9iamVjdCB0byB1c2UgaW4gdXBkYXRpbmcgZXhpc3RpbmcgY29uZmlndXJhdGlvbi5cbiAgICAgICAgKiBAcmV0dXJuIHtPYmplY3R9IHJlZmVyZW5jZSB0byBjdXJyZW50IGluc3RhbmNlXG4gICAgICAgICovXG4gICAgICAgIHVwZGF0ZUNvbmZpZzogZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICAgICAgJC5leHRlbmQoc2VydmljZU9wdGlvbnMsIGNvbmZpZyk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIExpc3RzIGFsbCB3b3JsZHMgZm9yIGEgZ2l2ZW4gYWNjb3VudCwgcHJvamVjdCwgYW5kIGdyb3VwLiBBbGwgdGhyZWUgYXJlIHJlcXVpcmVkLCBhbmQgaWYgbm90IHNwZWNpZmllZCBhcyBwYXJhbWV0ZXJzLCBhcmUgcmVhZCBmcm9tIHRoZSBzZXJ2aWNlLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIC8vIGxpc3RzIGFsbCB3b3JsZHMgaW4gZ3JvdXAgXCJ0ZWFtMVwiXG4gICAgICAgICogICAgICAgICAgICAgICB3YS5saXN0KCk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICAgICAgICAgIC8vIGxpc3RzIGFsbCB3b3JsZHMgaW4gZ3JvdXAgXCJvdGhlci1ncm91cC1uYW1lXCJcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmxpc3QoeyBncm91cDogJ290aGVyLWdyb3VwLW5hbWUnIH0pO1xuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgbGlzdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICB2YXIgZ2V0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICB2YXIgZmlsdGVycyA9IF9waWNrKGdldE9wdGlvbnMsIFsnYWNjb3VudCcsICdwcm9qZWN0JywgJ2dyb3VwJ10pO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoZmlsdGVycywgZ2V0T3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogR2V0cyBhbGwgd29ybGRzIHRoYXQgYW4gZW5kIHVzZXIgYmVsb25ncyB0byBmb3IgYSBnaXZlbiBhY2NvdW50ICh0ZWFtKSwgcHJvamVjdCwgYW5kIGdyb3VwLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmdldFdvcmxkc0ZvclVzZXIoJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMycpXG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKiogUGFyYW1ldGVycyAqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VySWQgVGhlIGB1c2VySWRgIG9mIHRoZSB1c2VyIHdob3NlIHdvcmxkcyBhcmUgYmVpbmcgcmV0cmlldmVkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgZ2V0V29ybGRzRm9yVXNlcjogZnVuY3Rpb24gKHVzZXJJZCwgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgICAgIHZhciBnZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHZhciBmaWx0ZXJzID0gJC5leHRlbmQoXG4gICAgICAgICAgICAgICAgX3BpY2soZ2V0T3B0aW9ucywgWydhY2NvdW50JywgJ3Byb2plY3QnLCAnZ3JvdXAnXSksXG4gICAgICAgICAgICAgICAgeyB1c2VySWQ6IHVzZXJJZCB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoZmlsdGVycywgZ2V0T3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExvYWQgaW5mb3JtYXRpb24gZm9yIGEgc3BlY2lmaWMgd29ybGQuIEFsbCBmdXJ0aGVyIGNhbGxzIHRvIHRoZSB3b3JsZCBzZXJ2aWNlIHdpbGwgdXNlIHRoZSBpZCBwcm92aWRlZC5cbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHdvcmxkSWQgVGhlIGlkIG9mIHRoZSB3b3JsZCB0byBsb2FkLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKHdvcmxkSWQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmICh3b3JsZElkKSB7XG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gd29ybGRJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc2VydmljZU9wdGlvbnMuZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2UgcHJvdmlkZSBhIHdvcmxkaWQgdG8gbG9hZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zLCB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyICsgJy8nIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KCcnLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogQWRkcyBhbiBlbmQgdXNlciBvciBsaXN0IG9mIGVuZCB1c2VycyB0byBhIGdpdmVuIHdvcmxkLiBUaGUgZW5kIHVzZXIgbXVzdCBiZSBhIG1lbWJlciBvZiB0aGUgYGdyb3VwYCB0aGF0IGlzIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIC8vIGFkZCBvbmUgdXNlclxuICAgICAgICAqICAgICAgICAgICAgICAgd2EuYWRkVXNlcnMoJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMycpO1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EuYWRkVXNlcnMoWydiMWMxOWRkYS0yZDJlLTQ3NzctYWQ1ZC0zOTI5ZjE3ZTg2ZDMnXSk7XG4gICAgICAgICogICAgICAgICAgICAgICB3YS5hZGRVc2Vycyh7IHVzZXJJZDogJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMycsIHJvbGU6ICdWUCBTYWxlcycgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICAgICAgICAgIC8vIGFkZCBzZXZlcmFsIHVzZXJzXG4gICAgICAgICogICAgICAgICAgICAgICB3YS5hZGRVc2VycyhbXG4gICAgICAgICogICAgICAgICAgICAgICAgICAgeyB1c2VySWQ6ICdhNmZlMGMxZS1mNGI4LTRmMDEtOWY1Zi0wMWNjZjRjMmVkNDQnLFxuICAgICAgICAqICAgICAgICAgICAgICAgICAgICAgcm9sZTogJ1ZQIE1hcmtldGluZycgfSxcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICB7IHVzZXJJZDogJzhmMjYwNGNmLTk2Y2QtNDQ5Zi04MmZhLWUzMzE1MzA3MzRlZScsXG4gICAgICAgICogICAgICAgICAgICAgICAgICAgICByb2xlOiAnVlAgRW5naW5lZXJpbmcnIH1cbiAgICAgICAgKiAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICAgICAgICAgICAvLyBhZGQgb25lIHVzZXIgdG8gYSBzcGVjaWZpYyB3b3JsZFxuICAgICAgICAqICAgICAgICAgICAgICAgd2EuYWRkVXNlcnMoJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMycsIHdvcmxkLmlkKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmFkZFVzZXJzKCdiMWMxOWRkYS0yZDJlLTQ3NzctYWQ1ZC0zOTI5ZjE3ZTg2ZDMnLCB7IGZpbHRlcjogd29ybGQuaWQgfSk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKiogUGFyYW1ldGVycyAqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfG9iamVjdHxhcnJheX0gdXNlcnMgVXNlciBpZCwgYXJyYXkgb2YgdXNlciBpZHMsIG9iamVjdCwgb3IgYXJyYXkgb2Ygb2JqZWN0cyBvZiB0aGUgdXNlcnMgdG8gYWRkIHRvIHRoaXMgd29ybGQuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHVzZXJzLnJvbGUgVGhlIGByb2xlYCB0aGUgdXNlciBzaG91bGQgaGF2ZSBpbiB0aGUgd29ybGQuIEl0IGlzIHVwIHRvIHRoZSBjYWxsZXIgdG8gZW5zdXJlLCBpZiBuZWVkZWQsIHRoYXQgdGhlIGByb2xlYCBwYXNzZWQgaW4gaXMgb25lIG9mIHRoZSBgcm9sZXNgIG9yIGBvcHRpb25hbFJvbGVzYCBvZiB0aGlzIHdvcmxkLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB3b3JsZElkIFRoZSB3b3JsZCB0byB3aGljaCB0aGUgdXNlcnMgc2hvdWxkIGJlIGFkZGVkLiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgZmlsdGVyIHBhcmFtZXRlciBvZiB0aGUgYG9wdGlvbnNgIG9iamVjdCBpcyB1c2VkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgYWRkVXNlcnM6IGZ1bmN0aW9uICh1c2Vycywgd29ybGRJZCwgb3B0aW9ucykge1xuXG4gICAgICAgICAgICBpZiAoIXVzZXJzKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2UgcHJvdmlkZSBhIGxpc3Qgb2YgdXNlcnMgdG8gYWRkIHRvIHRoZSB3b3JsZCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBub3JtYWxpemUgdGhlIGxpc3Qgb2YgdXNlcnMgdG8gYW4gYXJyYXkgb2YgdXNlciBvYmplY3RzXG4gICAgICAgICAgICB1c2VycyA9ICQubWFwKFtdLmNvbmNhdCh1c2VycyksIGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICAgICAgdmFyIGlzT2JqZWN0ID0gJC5pc1BsYWluT2JqZWN0KHUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB1ICE9PSAnc3RyaW5nJyAmJiAhaXNPYmplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTb21lIG9mIHRoZSB1c2VycyBpbiB0aGUgbGlzdCBhcmUgbm90IGluIHRoZSB2YWxpZCBmb3JtYXQ6ICcgKyB1KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gaXNPYmplY3QgPyB1IDogeyB1c2VySWQ6IHUgfTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBjaGVjayBpZiBvcHRpb25zIHdlcmUgcGFzc2VkIGFzIHRoZSBzZWNvbmQgcGFyYW1ldGVyXG4gICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHdvcmxkSWQpICYmICFvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHdvcmxkSWQ7XG4gICAgICAgICAgICAgICAgd29ybGRJZCA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICAvLyB3ZSBtdXN0IGhhdmUgb3B0aW9ucyBieSBub3dcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd29ybGRJZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmZpbHRlciA9IHdvcmxkSWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNldElkRmlsdGVyT3JUaHJvd0Vycm9yKG9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgdXBkYXRlT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHNlcnZpY2VPcHRpb25zLmZpbHRlciArICcvdXNlcnMnIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QodXNlcnMsIHVwZGF0ZU9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFVwZGF0ZXMgdGhlIHJvbGUgb2YgYW4gZW5kIHVzZXIgaW4gYSBnaXZlbiB3b3JsZC4gKFlvdSBjYW4gb25seSB1cGRhdGUgb25lIGVuZCB1c2VyIGF0IGEgdGltZS4pXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgd2EuY3JlYXRlKCkudGhlbihmdW5jdGlvbih3b3JsZCkge1xuICAgICAgICAqICAgICAgICAgICB3YS5hZGRVc2VycygnYjFjMTlkZGEtMmQyZS00Nzc3LWFkNWQtMzkyOWYxN2U4NmQzJyk7XG4gICAgICAgICogICAgICAgICAgIHdhLnVwZGF0ZVVzZXIoeyB1c2VySWQ6ICdiMWMxOWRkYS0yZDJlLTQ3NzctYWQ1ZC0zOTI5ZjE3ZTg2ZDMnLCByb2xlOiAnbGVhZGVyJyB9KTtcbiAgICAgICAgKiAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gdXNlciBVc2VyIG9iamVjdCB3aXRoIGB1c2VySWRgIGFuZCB0aGUgbmV3IGByb2xlYC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIHVwZGF0ZVVzZXI6IGZ1bmN0aW9uICh1c2VyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgaWYgKCF1c2VyIHx8ICF1c2VyLnVzZXJJZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignWW91IG5lZWQgdG8gcGFzcyBhIHVzZXJJZCB0byB1cGRhdGUgZnJvbSB0aGUgd29ybGQnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBwYXRjaE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgKyAnL3VzZXJzLycgKyB1c2VyLnVzZXJJZCB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wYXRjaChfcGljayh1c2VyLCAncm9sZScpLCBwYXRjaE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFJlbW92ZXMgYW4gZW5kIHVzZXIgZnJvbSBhIGdpdmVuIHdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmFkZFVzZXJzKFsnYTZmZTBjMWUtZjRiOC00ZjAxLTlmNWYtMDFjY2Y0YzJlZDQ0JywgJzhmMjYwNGNmLTk2Y2QtNDQ5Zi04MmZhLWUzMzE1MzA3MzRlZSddKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLnJlbW92ZVVzZXIoJ2E2ZmUwYzFlLWY0YjgtNGYwMS05ZjVmLTAxY2NmNGMyZWQ0NCcpO1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EucmVtb3ZlVXNlcih7IHVzZXJJZDogJzhmMjYwNGNmLTk2Y2QtNDQ5Zi04MmZhLWUzMzE1MzA3MzRlZScgfSk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKiogUGFyYW1ldGVycyAqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fHN0cmluZ30gdXNlciBUaGUgYHVzZXJJZGAgb2YgdGhlIHVzZXIgdG8gcmVtb3ZlIGZyb20gdGhlIHdvcmxkLCBvciBhbiBvYmplY3QgY29udGFpbmluZyB0aGUgYHVzZXJJZGAgZmllbGQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICByZW1vdmVVc2VyOiBmdW5jdGlvbiAodXNlciwgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdXNlciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB1c2VyID0geyB1c2VySWQ6IHVzZXIgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCF1c2VyLnVzZXJJZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignWW91IG5lZWQgdG8gcGFzcyBhIHVzZXJJZCB0byByZW1vdmUgZnJvbSB0aGUgd29ybGQnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBnZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyICsgJy91c2Vycy8nICsgdXNlci51c2VySWQgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZGVsZXRlKG51bGwsIGdldE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEdldHMgdGhlIHJ1biBpZCBvZiBjdXJyZW50IHJ1biBmb3IgdGhlIGdpdmVuIHdvcmxkLiBJZiB0aGUgd29ybGQgZG9lcyBub3QgaGF2ZSBhIHJ1biwgY3JlYXRlcyBhIG5ldyBvbmUgYW5kIHJldHVybnMgdGhlIHJ1biBpZC5cbiAgICAgICAgKlxuICAgICAgICAqIFJlbWVtYmVyIHRoYXQgYSBbcnVuXSguLi8uLi9nbG9zc2FyeS8jcnVuKSBpcyBhIGNvbGxlY3Rpb24gb2YgaW50ZXJhY3Rpb25zIHdpdGggYSBwcm9qZWN0IGFuZCBpdHMgbW9kZWwuIEluIHRoZSBjYXNlIG9mIG11bHRpcGxheWVyIHByb2plY3RzLCB0aGUgcnVuIGlzIHNoYXJlZCBieSBhbGwgZW5kIHVzZXJzIGluIHRoZSB3b3JsZC5cbiAgICAgICAgKlxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKiAgICAgIHdhLmNyZWF0ZSgpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHdvcmxkKSB7XG4gICAgICAgICogICAgICAgICAgICAgICB3YS5nZXRDdXJyZW50UnVuSWQoeyBtb2RlbDogJ21vZGVsLnB5JyB9KTtcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKiBQYXJhbWV0ZXJzICoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5tb2RlbCBUaGUgbW9kZWwgZmlsZSB0byB1c2UgdG8gY3JlYXRlIGEgcnVuIGlmIG5lZWRlZC5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBnZXRDdXJyZW50UnVuSWQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBnZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyICsgJy9ydW4nIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHZhbGlkYXRlTW9kZWxPclRocm93RXJyb3IoZ2V0T3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KF9waWNrKGdldE9wdGlvbnMsICdtb2RlbCcpLCBnZXRPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBHZXRzIHRoZSBjdXJyZW50IChtb3N0IHJlY2VudCkgd29ybGQgZm9yIHRoZSBnaXZlbiBlbmQgdXNlciBpbiB0aGUgZ2l2ZW4gZ3JvdXAuIEJyaW5ncyB0aGlzIG1vc3QgcmVjZW50IHdvcmxkIGludG8gbWVtb3J5IGlmIG5lZWRlZC5cbiAgICAgICAgKlxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKiAgICAgIHdhLmdldEN1cnJlbnRXb3JsZEZvclVzZXIoJzhmMjYwNGNmLTk2Y2QtNDQ5Zi04MmZhLWUzMzE1MzA3MzRlZScpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHdvcmxkKSB7XG4gICAgICAgICogICAgICAgICAgICAgICAvLyB1c2UgZGF0YSBmcm9tIHdvcmxkXG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKiogUGFyYW1ldGVycyAqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VySWQgVGhlIGB1c2VySWRgIG9mIHRoZSB1c2VyIHdob3NlIGN1cnJlbnQgKG1vc3QgcmVjZW50KSB3b3JsZCBpcyBiZWluZyByZXRyaWV2ZWQuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGdyb3VwTmFtZSAoT3B0aW9uYWwpIFRoZSBuYW1lIG9mIHRoZSBncm91cC4gSWYgbm90IHByb3ZpZGVkLCBkZWZhdWx0cyB0byB0aGUgZ3JvdXAgdXNlZCB0byBjcmVhdGUgdGhlIHNlcnZpY2UuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgZ2V0Q3VycmVudFdvcmxkRm9yVXNlcjogZnVuY3Rpb24gKHVzZXJJZCwgZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICB2YXIgZHRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgICAgIHRoaXMuZ2V0V29ybGRzRm9yVXNlcih1c2VySWQsIHsgZ3JvdXA6IGdyb3VwTmFtZSB9KVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICh3b3JsZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYXNzdW1lIHRoZSBtb3N0IHJlY2VudCB3b3JsZCBhcyB0aGUgJ2FjdGl2ZScgd29ybGRcbiAgICAgICAgICAgICAgICAgICAgd29ybGRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIG5ldyBEYXRlKGIubGFzdE1vZGlmaWVkKSAtIG5ldyBEYXRlKGEubGFzdE1vZGlmaWVkKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50V29ybGQgPSB3b3JsZHNbMF07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRXb3JsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gY3VycmVudFdvcmxkLmlkO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZHRkLnJlc29sdmVXaXRoKG1lLCBbY3VycmVudFdvcmxkXSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmFpbChkdGQucmVqZWN0KTtcblxuICAgICAgICAgICAgcmV0dXJuIGR0ZC5wcm9taXNlKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogRGVsZXRlcyB0aGUgY3VycmVudCBydW4gZnJvbSB0aGUgd29ybGQuXG4gICAgICAgICpcbiAgICAgICAgKiAoTm90ZSB0aGF0IHRoZSB3b3JsZCBpZCByZW1haW5zIHBhcnQgb2YgdGhlIHJ1biByZWNvcmQsIGluZGljYXRpbmcgdGhhdCB0aGUgcnVuIHdhcyBmb3JtZXJseSBhbiBhY3RpdmUgcnVuIGZvciB0aGUgd29ybGQuKVxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICB3YS5kZWxldGVSdW4oJ3NhbXBsZS13b3JsZC1pZCcpO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHdvcmxkSWQgVGhlIGB3b3JsZElkYCBvZiB0aGUgd29ybGQgZnJvbSB3aGljaCB0aGUgY3VycmVudCBydW4gaXMgYmVpbmcgZGVsZXRlZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGRlbGV0ZVJ1bjogZnVuY3Rpb24gKHdvcmxkSWQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICBpZiAod29ybGRJZCkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuZmlsdGVyID0gd29ybGRJZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBkZWxldGVPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyICsgJy9ydW4nIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmRlbGV0ZShudWxsLCBkZWxldGVPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBDcmVhdGVzIGEgbmV3IHJ1biBmb3IgdGhlIHdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICB3YS5nZXRDdXJyZW50V29ybGRGb3JVc2VyKCc4ZjI2MDRjZi05NmNkLTQ0OWYtODJmYS1lMzMxNTMwNzM0ZWUnKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbiAod29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICB3YS5uZXdSdW5Gb3JXb3JsZCh3b3JsZC5pZCk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHdvcmxkSWQgd29ybGRJZCBpbiB3aGljaCB3ZSBjcmVhdGUgdGhlIG5ldyBydW4uXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5tb2RlbCBUaGUgbW9kZWwgZmlsZSB0byB1c2UgdG8gY3JlYXRlIGEgcnVuIGlmIG5lZWRlZC5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBuZXdSdW5Gb3JXb3JsZDogZnVuY3Rpb24gKHdvcmxkSWQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBjdXJyZW50UnVuT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyBmaWx0ZXI6IHdvcmxkSWQgfHwgc2VydmljZU9wdGlvbnMuZmlsdGVyIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgICAgICAgICB2YWxpZGF0ZU1vZGVsT3JUaHJvd0Vycm9yKGN1cnJlbnRSdW5PcHRpb25zKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGVsZXRlUnVuKHdvcmxkSWQsIG9wdGlvbnMpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWUuZ2V0Q3VycmVudFJ1bklkKGN1cnJlbnRSdW5PcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBBc3NpZ25zIGVuZCB1c2VycyB0byB3b3JsZHMsIGNyZWF0aW5nIG5ldyB3b3JsZHMgYXMgYXBwcm9wcmlhdGUsIGF1dG9tYXRpY2FsbHkuIEFzc2lnbnMgYWxsIGVuZCB1c2VycyBpbiB0aGUgZ3JvdXAsIGFuZCBjcmVhdGVzIG5ldyB3b3JsZHMgYXMgbmVlZGVkIGJhc2VkIG9uIHRoZSBwcm9qZWN0LWxldmVsIHdvcmxkIGNvbmZpZ3VyYXRpb24gKHJvbGVzLCBvcHRpb25hbCByb2xlcywgYW5kIG1pbmltdW0gZW5kIHVzZXJzIHBlciB3b3JsZCkuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgd2EuYXV0b0Fzc2lnbigpO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICpcbiAgICAgICAgKi9cbiAgICAgICAgYXV0b0Fzc2lnbjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICB2YXIgb3B0ID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXNzaWdubWVudEVuZHBvaW50KSB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICAgICAgICAgIGFjY291bnQ6IG9wdC5hY2NvdW50LFxuICAgICAgICAgICAgICAgIHByb2plY3Q6IG9wdC5wcm9qZWN0LFxuICAgICAgICAgICAgICAgIGdyb3VwOiBvcHQuZ3JvdXBcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChvcHQubWF4VXNlcnMpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMubWF4VXNlcnMgPSBvcHQubWF4VXNlcnM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QocGFyYW1zLCBvcHQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEdldHMgdGhlIHByb2plY3QncyB3b3JsZCBjb25maWd1cmF0aW9uLlxuICAgICAgICAqXG4gICAgICAgICogVHlwaWNhbGx5LCBldmVyeSBpbnRlcmFjdGlvbiB3aXRoIHlvdXIgcHJvamVjdCB1c2VzIHRoZSBzYW1lIGNvbmZpZ3VyYXRpb24gb2YgZWFjaCB3b3JsZC4gRm9yIGV4YW1wbGUsIGVhY2ggd29ybGQgaW4geW91ciBwcm9qZWN0IHByb2JhYmx5IGhhcyB0aGUgc2FtZSByb2xlcyBmb3IgZW5kIHVzZXJzLiBBbmQgeW91ciBwcm9qZWN0IGlzIHByb2JhYmx5IGVpdGhlciBjb25maWd1cmVkIHNvIHRoYXQgYWxsIGVuZCB1c2VycyBzaGFyZSB0aGUgc2FtZSB3b3JsZCAoYW5kIHJ1biksIG9yIHNtYWxsZXIgc2V0cyBvZiBlbmQgdXNlcnMgc2hhcmUgd29ybGRzIOKAlCBidXQgbm90IGJvdGguXG4gICAgICAgICpcbiAgICAgICAgKiAoVGhlIFtNdWx0aXBsYXllciBQcm9qZWN0IFJFU1QgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvbXVsdGlwbGF5ZXIvbXVsdGlwbGF5ZXJfcHJvamVjdC8pIGFsbG93cyB5b3UgdG8gc2V0IHRoZXNlIHByb2plY3QtbGV2ZWwgd29ybGQgY29uZmlndXJhdGlvbnMuIFRoZSBXb3JsZCBBZGFwdGVyIHNpbXBseSByZXRyaWV2ZXMgdGhlbSwgZm9yIGV4YW1wbGUgc28gdGhleSBjYW4gYmUgdXNlZCBpbiBhdXRvLWFzc2lnbm1lbnQgb2YgZW5kIHVzZXJzIHRvIHdvcmxkcy4pXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgd2EuZ2V0UHJvamVjdFNldHRpbmdzKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oc2V0dGluZ3MpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNldHRpbmdzLnJvbGVzKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNldHRpbmdzLm9wdGlvbmFsUm9sZXMpO1xuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBnZXRQcm9qZWN0U2V0dGluZ3M6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgdmFyIG9wdCA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKHByb2plY3RFbmRwb2ludCkgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgb3B0LnVybCArPSBbb3B0LmFjY291bnQsIG9wdC5wcm9qZWN0XS5qb2luKCcvJyk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQobnVsbCwgb3B0KTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiLyoqXG4gKiBAY2xhc3MgQ29va2llIFN0b3JhZ2UgU2VydmljZVxuICpcbiAqIEBleGFtcGxlXG4gKiAgICAgIHZhciBwZW9wbGUgPSByZXF1aXJlKCdjb29raWUtc3RvcmUnKSh7IHJvb3Q6ICdwZW9wbGUnIH0pO1xuICAgICAgICBwZW9wbGVcbiAgICAgICAgICAgIC5zYXZlKHtsYXN0TmFtZTogJ3NtaXRoJyB9KVxuXG4gKi9cblxuXG4ndXNlIHN0cmljdCc7XG5cbi8vIFRoaW4gZG9jdW1lbnQuY29va2llIHdyYXBwZXIgdG8gYWxsb3cgdW5pdCB0ZXN0aW5nXG52YXIgQ29va2llID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZG9jdW1lbnQuY29va2llO1xuICAgIH07XG5cbiAgICB0aGlzLnNldCA9IGZ1bmN0aW9uIChuZXdDb29raWUpIHtcbiAgICAgICAgZG9jdW1lbnQuY29va2llID0gbmV3Q29va2llO1xuICAgIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgaG9zdCA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZTtcbiAgICB2YXIgdmFsaWRIb3N0ID0gaG9zdC5zcGxpdCgnLicpLmxlbmd0aCA+IDE7XG4gICAgdmFyIGRvbWFpbiA9IHZhbGlkSG9zdCA/ICcuJyArIGhvc3QgOiBudWxsO1xuXG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogTmFtZSBvZiBjb2xsZWN0aW9uXG4gICAgICAgICAqIEB0eXBlIHsgc3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcm9vdDogJy8nLFxuXG4gICAgICAgIGRvbWFpbjogZG9tYWluLFxuICAgICAgICBjb29raWU6IG5ldyBDb29raWUoKVxuICAgIH07XG4gICAgdGhpcy5zZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG4gICAgICAgIC8vICogVEJEXG4gICAgICAgIC8vICAqIFF1ZXJ5IGNvbGxlY3Rpb247IHVzZXMgTW9uZ29EQiBzeW50YXhcbiAgICAgICAgLy8gICogQHNlZSAgPFRCRDogRGF0YSBBUEkgVVJMPlxuICAgICAgICAvLyAgKlxuICAgICAgICAvLyAgKiBAcGFyYW0geyBzdHJpbmd9IHFzIFF1ZXJ5IEZpbHRlclxuICAgICAgICAvLyAgKiBAcGFyYW0geyBzdHJpbmd9IGxpbWl0ZXJzIEBzZWUgPFRCRDogdXJsIGZvciBsaW1pdHMsIHBhZ2luZyBldGM+XG4gICAgICAgIC8vICAqXG4gICAgICAgIC8vICAqIEBleGFtcGxlXG4gICAgICAgIC8vICAqICAgICBjcy5xdWVyeShcbiAgICAgICAgLy8gICogICAgICB7IG5hbWU6ICdKb2huJywgY2xhc3NOYW1lOiAnQ1NDMTAxJyB9LFxuICAgICAgICAvLyAgKiAgICAgIHtsaW1pdDogMTB9XG4gICAgICAgIC8vICAqICAgICApXG5cbiAgICAgICAgLy8gcXVlcnk6IGZ1bmN0aW9uIChxcywgbGltaXRlcnMpIHtcblxuICAgICAgICAvLyB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTYXZlIGNvb2tpZSB2YWx1ZVxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfE9iamVjdH0ga2V5ICAgSWYgZ2l2ZW4gYSBrZXkgc2F2ZSB2YWx1ZXMgdW5kZXIgaXQsIGlmIGdpdmVuIGFuIG9iamVjdCBkaXJlY3RseSwgc2F2ZSB0byB0b3AtbGV2ZWwgYXBpXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gdmFsdWUgKE9wdGlvbmFsKVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBPdmVycmlkZXMgZm9yIHNlcnZpY2Ugb3B0aW9uc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJuIHsqfSBUaGUgc2F2ZWQgdmFsdWVcbiAgICAgICAgICpcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogICAgIGNzLnNldCgncGVyc29uJywgeyBmaXJzdE5hbWU6ICdqb2huJywgbGFzdE5hbWU6ICdzbWl0aCcgfSk7XG4gICAgICAgICAqICAgICBjcy5zZXQoeyBuYW1lOidzbWl0aCcsIGFnZTonMzInIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHNldE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdGhpcy5zZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBkb21haW4gPSBzZXRPcHRpb25zLmRvbWFpbjtcbiAgICAgICAgICAgIHZhciBwYXRoID0gc2V0T3B0aW9ucy5yb290O1xuICAgICAgICAgICAgdmFyIGNvb2tpZSA9IHNldE9wdGlvbnMuY29va2llO1xuXG4gICAgICAgICAgICBjb29raWUuc2V0KGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgJz0nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChkb21haW4gPyAnOyBkb21haW49JyArIGRvbWFpbiA6ICcnKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChwYXRoID8gJzsgcGF0aD0nICsgcGF0aCA6ICcnKVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMb2FkIGNvb2tpZSB2YWx1ZVxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfE9iamVjdH0ga2V5ICAgSWYgZ2l2ZW4gYSBrZXkgc2F2ZSB2YWx1ZXMgdW5kZXIgaXQsIGlmIGdpdmVuIGFuIG9iamVjdCBkaXJlY3RseSwgc2F2ZSB0byB0b3AtbGV2ZWwgYXBpXG4gICAgICAgICAqIEByZXR1cm4geyp9IFRoZSB2YWx1ZSBzdG9yZWRcbiAgICAgICAgICpcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogICAgIGNzLmdldCgncGVyc29uJyk7XG4gICAgICAgICAqL1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHZhciBjb29raWUgPSB0aGlzLnNlcnZpY2VPcHRpb25zLmNvb2tpZTtcbiAgICAgICAgICAgIHZhciBjb29raWVSZWcgPSBuZXcgUmVnRXhwKCcoPzpefDspXFxcXHMqJyArIGVuY29kZVVSSUNvbXBvbmVudChrZXkpLnJlcGxhY2UoL1tcXC1cXC5cXCtcXCpdL2csICdcXFxcJCYnKSArICdcXFxccypcXFxcPVxcXFxzKihbXjtdKikuKiQnKTtcbiAgICAgICAgICAgIHZhciByZXMgPSBjb29raWVSZWcuZXhlYyhjb29raWUuZ2V0KCkpO1xuICAgICAgICAgICAgdmFyIHZhbCA9IHJlcyA/IGRlY29kZVVSSUNvbXBvbmVudChyZXNbMV0pIDogbnVsbDtcbiAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZXMga2V5IGZyb20gY29sbGVjdGlvblxuICAgICAgICAgKiBAcGFyYW0geyBzdHJpbmd9IGtleSBrZXkgdG8gcmVtb3ZlXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChvcHRpb25hbCkgb3ZlcnJpZGVzIGZvciBzZXJ2aWNlIG9wdGlvbnNcbiAgICAgICAgICogQHJldHVybiB7IHN0cmluZ30ga2V5IFRoZSBrZXkgcmVtb3ZlZFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiAgICAgY3MucmVtb3ZlKCdwZXJzb24nKTtcbiAgICAgICAgICovXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24gKGtleSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHJlbU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdGhpcy5zZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBkb21haW4gPSByZW1PcHRpb25zLmRvbWFpbjtcbiAgICAgICAgICAgIHZhciBwYXRoID0gcmVtT3B0aW9ucy5yb290O1xuICAgICAgICAgICAgdmFyIGNvb2tpZSA9IHJlbU9wdGlvbnMuY29va2llO1xuXG4gICAgICAgICAgICBjb29raWUuc2V0KGVuY29kZVVSSUNvbXBvbmVudChrZXkpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPTsgZXhwaXJlcz1UaHUsIDAxIEphbiAxOTcwIDAwOjAwOjAwIEdNVCcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChkb21haW4gPyAnOyBkb21haW49JyArIGRvbWFpbiA6ICcnKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHBhdGggPyAnOyBwYXRoPScgKyBwYXRoIDogJycpXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBjb2xsZWN0aW9uIGJlaW5nIHJlZmVyZW5jZWRcbiAgICAgICAgICogQHJldHVybiB7IGFycmF5fSBrZXlzIEFsbCB0aGUga2V5cyByZW1vdmVkXG4gICAgICAgICAqL1xuICAgICAgICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY29va2llID0gdGhpcy5zZXJ2aWNlT3B0aW9ucy5jb29raWU7XG4gICAgICAgICAgICB2YXIgYUtleXMgPSBjb29raWUuZ2V0KCkucmVwbGFjZSgvKCg/Ol58XFxzKjspW15cXD1dKykoPz07fCQpfF5cXHMqfFxccyooPzpcXD1bXjtdKik/KD86XFwxfCQpL2csICcnKS5zcGxpdCgvXFxzKig/OlxcPVteO10qKT87XFxzKi8pO1xuICAgICAgICAgICAgZm9yICh2YXIgbklkeCA9IDA7IG5JZHggPCBhS2V5cy5sZW5ndGg7IG5JZHgrKykge1xuICAgICAgICAgICAgICAgIHZhciBjb29raWVLZXkgPSBkZWNvZGVVUklDb21wb25lbnQoYUtleXNbbklkeF0pO1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlKGNvb2tpZUtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYUtleXM7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBrZXlOYW1lcyA9IHJlcXVpcmUoJy4uL21hbmFnZXJzL2tleS1uYW1lcycpO1xudmFyIFN0b3JhZ2VGYWN0b3J5ID0gcmVxdWlyZSgnLi9zdG9yZS1mYWN0b3J5Jyk7XG52YXIgb3B0aW9uVXRpbHMgPSByZXF1aXJlKCcuLi91dGlsL29wdGlvbi11dGlscycpO1xuXG52YXIgRVBJX1NFU1NJT05fS0VZID0ga2V5TmFtZXMuRVBJX1NFU1NJT05fS0VZO1xudmFyIGRlZmF1bHRzID0ge1xuICAgIC8qKlxuICAgICAqIFdoZXJlIHRvIHN0b3JlIHVzZXIgYWNjZXNzIHRva2VucyBmb3IgdGVtcG9yYXJ5IGFjY2Vzcy4gRGVmYXVsdHMgdG8gc3RvcmluZyBpbiBhIGNvb2tpZSBpbiB0aGUgYnJvd3Nlci5cbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIHN0b3JlOiB7IHN5bmNocm9ub3VzOiB0cnVlIH1cbn07XG5cbnZhciBTZXNzaW9uTWFuYWdlciA9IGZ1bmN0aW9uIChtYW5hZ2VyT3B0aW9ucykge1xuICAgIG1hbmFnZXJPcHRpb25zID0gbWFuYWdlck9wdGlvbnMgfHwge307XG4gICAgZnVuY3Rpb24gZ2V0QmFzZU9wdGlvbnMob3ZlcnJpZGVzKSB7XG4gICAgICAgIG92ZXJyaWRlcyA9IG92ZXJyaWRlcyB8fCB7fTtcbiAgICAgICAgdmFyIGxpYk9wdGlvbnMgPSBvcHRpb25VdGlscy5nZXRPcHRpb25zKCk7XG4gICAgICAgIHZhciBmaW5hbE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIGxpYk9wdGlvbnMsIG1hbmFnZXJPcHRpb25zLCBvdmVycmlkZXMpO1xuICAgICAgICByZXR1cm4gZmluYWxPcHRpb25zO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFN0b3JlKG92ZXJyaWRlcykge1xuICAgICAgICB2YXIgYmFzZU9wdGlvbnMgPSBnZXRCYXNlT3B0aW9ucyhvdmVycmlkZXMpO1xuICAgICAgICB2YXIgc3RvcmVPcHRzID0gYmFzZU9wdGlvbnMuc3RvcmUgfHwge307XG4gICAgICAgIHZhciBpc0VwaWNlbnRlckRvbWFpbiA9ICFiYXNlT3B0aW9ucy5pc0xvY2FsICYmICFiYXNlT3B0aW9ucy5pc0N1c3RvbURvbWFpbjtcbiAgICAgICAgaWYgKHN0b3JlT3B0cy5yb290ID09PSB1bmRlZmluZWQgJiYgYmFzZU9wdGlvbnMuYWNjb3VudCAmJiBiYXNlT3B0aW9ucy5wcm9qZWN0ICYmIGlzRXBpY2VudGVyRG9tYWluKSB7XG4gICAgICAgICAgICBzdG9yZU9wdHMucm9vdCA9ICcvYXBwLycgKyBiYXNlT3B0aW9ucy5hY2NvdW50ICsgJy8nICsgYmFzZU9wdGlvbnMucHJvamVjdDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFN0b3JhZ2VGYWN0b3J5KHN0b3JlT3B0cyk7XG4gICAgfVxuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcbiAgICAgICAgc2F2ZVNlc3Npb246IGZ1bmN0aW9uICh1c2VySW5mbywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHNlcmlhbGl6ZWQgPSBKU09OLnN0cmluZ2lmeSh1c2VySW5mbyk7XG4gICAgICAgICAgICBnZXRTdG9yZShvcHRpb25zKS5zZXQoRVBJX1NFU1NJT05fS0VZLCBzZXJpYWxpemVkKTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0U2Vzc2lvbjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vIHZhciBzZXNzaW9uID0gZ2V0U3RvcmUob3B0aW9ucykuZ2V0KEVQSV9TRVNTSU9OX0tFWSkgfHwgJ3t9JztcbiAgICAgICAgICAgIC8vIHJldHVybiBKU09OLnBhcnNlKHNlc3Npb24pO1xuICAgICAgICAgICAgdmFyIHN0b3JlID0gZ2V0U3RvcmUob3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgZmluYWxPcHRzID0gc3RvcmUuc2VydmljZU9wdGlvbnM7XG4gICAgICAgICAgICB2YXIgc2VyaWFsaXplZCA9IHN0b3JlLmdldChFUElfU0VTU0lPTl9LRVkpIHx8ICd7fSc7XG4gICAgICAgICAgICB2YXIgc2Vzc2lvbiA9IEpTT04ucGFyc2Uoc2VyaWFsaXplZCk7XG4gICAgICAgICAgICAvLyBJZiB0aGUgdXJsIGNvbnRhaW5zIHRoZSBwcm9qZWN0IGFuZCBhY2NvdW50XG4gICAgICAgICAgICAvLyB2YWxpZGF0ZSB0aGUgYWNjb3VudCBhbmQgcHJvamVjdCBpbiB0aGUgc2Vzc2lvblxuICAgICAgICAgICAgLy8gYW5kIG92ZXJyaWRlIHByb2plY3QsIGdyb3VwTmFtZSwgZ3JvdXBJZCBhbmQgaXNGYWNcbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSAoaS5lLiBsb2NhbGhvc3QpIHVzZSB0aGUgc2F2ZWQgc2Vzc2lvbiB2YWx1ZXNcbiAgICAgICAgICAgIHZhciBhY2NvdW50ID0gZmluYWxPcHRzLmFjY291bnQ7XG4gICAgICAgICAgICB2YXIgcHJvamVjdCA9IGZpbmFsT3B0cy5wcm9qZWN0O1xuICAgICAgICAgICAgaWYgKGFjY291bnQgJiYgc2Vzc2lvbi5hY2NvdW50ICE9PSBhY2NvdW50KSB7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBtZWFucyB0aGF0IHRoZSB0b2tlbiB3YXMgbm90IHVzZWQgdG8gbG9naW4gdG8gdGhlIHNhbWUgYWNjb3VudFxuICAgICAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzZXNzaW9uLmdyb3VwcyAmJiBhY2NvdW50ICYmIHByb2plY3QpIHtcbiAgICAgICAgICAgICAgICB2YXIgZ3JvdXAgPSBzZXNzaW9uLmdyb3Vwc1twcm9qZWN0XSB8fCB7IGdyb3VwSWQ6ICcnLCBncm91cE5hbWU6ICcnLCBpc0ZhYzogZmFsc2UgfTtcbiAgICAgICAgICAgICAgICAkLmV4dGVuZChzZXNzaW9uLCB7IHByb2plY3Q6IHByb2plY3QgfSwgZ3JvdXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHNlc3Npb247XG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZVNlc3Npb246IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgc3RvcmUgPSBnZXRTdG9yZShvcHRpb25zKTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGtleU5hbWVzKS5mb3JFYWNoKGZ1bmN0aW9uIChjb29raWVLZXkpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29va2llTmFtZSA9IGtleU5hbWVzW2Nvb2tpZUtleV07XG4gICAgICAgICAgICAgICAgc3RvcmUucmVtb3ZlKGNvb2tpZU5hbWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0U3RvcmU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0U3RvcmUob3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0TWVyZ2VkT3B0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgdmFyIG92ZXJyaWRlcyA9ICQuZXh0ZW5kLmFwcGx5KCQsIFt0cnVlLCB7fV0uY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgICAgIHZhciBiYXNlT3B0aW9ucyA9IGdldEJhc2VPcHRpb25zKG92ZXJyaWRlcyk7XG4gICAgICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuZ2V0U2Vzc2lvbihvdmVycmlkZXMpO1xuXG4gICAgICAgICAgICB2YXIgc2Vzc2lvbkRlZmF1bHRzID0ge1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEZvciBwcm9qZWN0cyB0aGF0IHJlcXVpcmUgYXV0aGVudGljYXRpb24sIHBhc3MgaW4gdGhlIHVzZXIgYWNjZXNzIHRva2VuIChkZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcpLiBJZiB0aGUgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbiB0byBFcGljZW50ZXIsIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiBpcyBhbHJlYWR5IHNldCBpbiBhIGNvb2tpZSBhbmQgYXV0b21hdGljYWxseSBsb2FkZWQgZnJvbSB0aGVyZS4gKFNlZSBbbW9yZSBiYWNrZ3JvdW5kIG9uIGFjY2VzcyB0b2tlbnNdKC4uLy4uLy4uL3Byb2plY3RfYWNjZXNzLykpLlxuICAgICAgICAgICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgLy9qc2hpbnQgY2FtZWxjYXNlOiBmYWxzZVxuICAgICAgICAgICAgICAgIC8vanNjczpkaXNhYmxlXG4gICAgICAgICAgICAgICAgdG9rZW46IHNlc3Npb24uYXV0aF90b2tlbixcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBUaGUgZ3JvdXAgbmFtZS4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIGNvb2tpZSBzZXNzaW9uLlxuICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZ3JvdXA6IHNlc3Npb24uZ3JvdXBOYW1lLFxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFRoZSBncm91cCBpZC4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIGNvb2tpZSBzZXNzaW9uLlxuICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZ3JvdXBJZDogc2Vzc2lvbi5ncm91cElkLFxuICAgICAgICAgICAgICAgIHVzZXJJZDogc2Vzc2lvbi51c2VySWRcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gJC5leHRlbmQodHJ1ZSwgc2Vzc2lvbkRlZmF1bHRzLCBiYXNlT3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlc3Npb25NYW5hZ2VyOyIsIi8qKlxuICAgIERlY2lkZXMgdHlwZSBvZiBzdG9yZSB0byBwcm92aWRlXG4qL1xuXG4ndXNlIHN0cmljdCc7XG4vLyB2YXIgaXNOb2RlID0gZmFsc2U7IEZJWE1FOiBCcm93c2VyaWZ5L21pbmlmeWlmeSBoYXMgaXNzdWVzIHdpdGggdGhlIG5leHQgbGlua1xuLy8gdmFyIHN0b3JlID0gKGlzTm9kZSkgPyByZXF1aXJlKCcuL3Nlc3Npb24tc3RvcmUnKSA6IHJlcXVpcmUoJy4vY29va2llLXN0b3JlJyk7XG52YXIgc3RvcmUgPSByZXF1aXJlKCcuL2Nvb2tpZS1zdG9yZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHN0b3JlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcXV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbC9xdWVyeS11dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuXG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICB1cmw6ICcnLFxuXG4gICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIGhlYWRlcnM6IHt9LFxuICAgICAgICBzdGF0dXNDb2RlOiB7XG4gICAgICAgICAgICA0MDQ6ICQubm9vcFxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPTkxZIGZvciBzdHJpbmdzIGluIHRoZSB1cmwuIEFsbCBHRVQgJiBERUxFVEUgcGFyYW1zIGFyZSBydW4gdGhyb3VnaCB0aGlzXG4gICAgICAgICAqIEB0eXBlIHtbdHlwZV0gfVxuICAgICAgICAgKi9cbiAgICAgICAgcGFyYW1ldGVyUGFyc2VyOiBxdXRpbHMudG9RdWVyeUZvcm1hdCxcblxuICAgICAgICAvLyBUbyBhbGxvdyBlcGljZW50ZXIudG9rZW4gYW5kIG90aGVyIHNlc3Npb24gY29va2llcyB0byBiZSBwYXNzZWRcbiAgICAgICAgLy8gd2l0aCB0aGUgcmVxdWVzdHNcbiAgICAgICAgeGhyRmllbGRzOiB7XG4gICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWVcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgdHJhbnNwb3J0T3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcblxuICAgIHZhciByZXN1bHQgPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gKCQuaXNGdW5jdGlvbihkKSkgPyBkKCkgOiBkO1xuICAgIH07XG5cbiAgICB2YXIgY29ubmVjdCA9IGZ1bmN0aW9uIChtZXRob2QsIHBhcmFtcywgY29ubmVjdE9wdGlvbnMpIHtcbiAgICAgICAgcGFyYW1zID0gcmVzdWx0KHBhcmFtcyk7XG4gICAgICAgIHBhcmFtcyA9ICgkLmlzUGxhaW5PYmplY3QocGFyYW1zKSB8fCAkLmlzQXJyYXkocGFyYW1zKSkgPyBKU09OLnN0cmluZ2lmeShwYXJhbXMpIDogcGFyYW1zO1xuXG4gICAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHRyYW5zcG9ydE9wdGlvbnMsIGNvbm5lY3RPcHRpb25zLCB7XG4gICAgICAgICAgICB0eXBlOiBtZXRob2QsXG4gICAgICAgICAgICBkYXRhOiBwYXJhbXNcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBBTExPV0VEX1RPX0JFX0ZVTkNUSU9OUyA9IFsnZGF0YScsICd1cmwnXTtcbiAgICAgICAgJC5lYWNoKG9wdGlvbnMsIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKHZhbHVlKSAmJiAkLmluQXJyYXkoa2V5LCBBTExPV0VEX1RPX0JFX0ZVTkNUSU9OUykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9uc1trZXldID0gdmFsdWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMubG9nTGV2ZWwgJiYgb3B0aW9ucy5sb2dMZXZlbCA9PT0gJ0RFQlVHJykge1xuICAgICAgICAgICAgY29uc29sZS5sb2cob3B0aW9ucy51cmwpO1xuICAgICAgICAgICAgdmFyIG9sZFN1Y2Nlc3NGbiA9IG9wdGlvbnMuc3VjY2VzcyB8fCAkLm5vb3A7XG4gICAgICAgICAgICBvcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbiAocmVzcG9uc2UsIGFqYXhTdGF0dXMsIGFqYXhSZXEpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgb2xkU3VjY2Vzc0ZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGJlZm9yZVNlbmQgPSBvcHRpb25zLmJlZm9yZVNlbmQ7XG4gICAgICAgIG9wdGlvbnMuYmVmb3JlU2VuZCA9IGZ1bmN0aW9uICh4aHIsIHNldHRpbmdzKSB7XG4gICAgICAgICAgICB4aHIucmVxdWVzdFVybCA9IChjb25uZWN0T3B0aW9ucyB8fCB7fSkudXJsO1xuICAgICAgICAgICAgaWYgKGJlZm9yZVNlbmQpIHtcbiAgICAgICAgICAgICAgICBiZWZvcmVTZW5kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuICQuYWpheChvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAocGFyYW1zLCBhamF4T3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdHJhbnNwb3J0T3B0aW9ucywgYWpheE9wdGlvbnMpO1xuICAgICAgICAgICAgcGFyYW1zID0gb3B0aW9ucy5wYXJhbWV0ZXJQYXJzZXIocmVzdWx0KHBhcmFtcykpO1xuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuY2FsbCh0aGlzLCAnR0VUJywgcGFyYW1zLCBvcHRpb25zKTtcbiAgICAgICAgfSxcbiAgICAgICAgc3BsaXRHZXQ6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB9LFxuICAgICAgICBwb3N0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdC5hcHBseSh0aGlzLCBbJ3Bvc3QnXS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH0sXG4gICAgICAgIHBhdGNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdC5hcHBseSh0aGlzLCBbJ3BhdGNoJ10uY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9LFxuICAgICAgICBwdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0LmFwcGx5KHRoaXMsIFsncHV0J10uY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9LFxuICAgICAgICBkZWxldGU6IGZ1bmN0aW9uIChwYXJhbXMsIGFqYXhPcHRpb25zKSB7XG4gICAgICAgICAgICAvL0RFTEVURSBkb2Vzbid0IHN1cHBvcnQgYm9keSBwYXJhbXMsIGJ1dCBqUXVlcnkgdGhpbmtzIGl0IGRvZXMuXG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCB0cmFuc3BvcnRPcHRpb25zLCBhamF4T3B0aW9ucyk7XG4gICAgICAgICAgICBwYXJhbXMgPSBvcHRpb25zLnBhcmFtZXRlclBhcnNlcihyZXN1bHQocGFyYW1zKSk7XG4gICAgICAgICAgICBpZiAoJC50cmltKHBhcmFtcykpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVsaW1pdGVyID0gKHJlc3VsdChvcHRpb25zLnVybCkuaW5kZXhPZignPycpID09PSAtMSkgPyAnPycgOiAnJic7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy51cmwgPSByZXN1bHQob3B0aW9ucy51cmwpICsgZGVsaW1pdGVyICsgcGFyYW1zO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuY2FsbCh0aGlzLCAnREVMRVRFJywgbnVsbCwgb3B0aW9ucyk7XG4gICAgICAgIH0sXG4gICAgICAgIGhlYWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0LmFwcGx5KHRoaXMsIFsnaGVhZCddLmNvbmNhdChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgfSxcbiAgICAgICAgb3B0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuYXBwbHkodGhpcywgWydvcHRpb25zJ10uY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gdmFyIGlzTm9kZSA9IGZhbHNlOyBGSVhNRTogQnJvd3NlcmlmeS9taW5pZnlpZnkgaGFzIGlzc3VlcyB3aXRoIHRoZSBuZXh0IGxpbmtcbi8vIHZhciB0cmFuc3BvcnQgPSAoaXNOb2RlKSA/IHJlcXVpcmUoJy4vbm9kZS1odHRwLXRyYW5zcG9ydCcpIDogcmVxdWlyZSgnLi9hamF4LWh0dHAtdHJhbnNwb3J0Jyk7XG52YXIgdHJhbnNwb3J0ID0gcmVxdWlyZSgnLi9hamF4LWh0dHAtdHJhbnNwb3J0Jyk7XG5tb2R1bGUuZXhwb3J0cyA9IHRyYW5zcG9ydDtcbiIsIi8qKlxuLyogSW5oZXJpdCBmcm9tIGEgY2xhc3MgKHVzaW5nIHByb3RvdHlwZSBib3Jyb3dpbmcpXG4qL1xuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBpbmhlcml0KEMsIFApIHtcbiAgICB2YXIgRiA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIEYucHJvdG90eXBlID0gUC5wcm90b3R5cGU7XG4gICAgQy5wcm90b3R5cGUgPSBuZXcgRigpO1xuICAgIEMuX19zdXBlciA9IFAucHJvdG90eXBlO1xuICAgIEMucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQztcbn1cblxuLyoqXG4qIFNoYWxsb3cgY29weSBvZiBhbiBvYmplY3RcbiogQHBhcmFtIHtPYmplY3R9IGRlc3Qgb2JqZWN0IHRvIGV4dGVuZFxuKiBAcmV0dXJuIHtPYmplY3R9IGV4dGVuZGVkIG9iamVjdFxuKi9cbnZhciBleHRlbmQgPSBmdW5jdGlvbiAoZGVzdCAvKiwgdmFyX2FyZ3MqLykge1xuICAgIHZhciBvYmogPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHZhciBjdXJyZW50O1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgb2JqLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmICghKGN1cnJlbnQgPSBvYmpbal0pKSB7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBkbyBub3Qgd3JhcCBpbm5lciBpbiBkZXN0Lmhhc093blByb3BlcnR5IG9yIGJhZCB0aGluZ3Mgd2lsbCBoYXBwZW5cbiAgICAgICAgZm9yICh2YXIga2V5IGluIGN1cnJlbnQpIHsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgICAgICBkZXN0W2tleV0gPSBjdXJyZW50W2tleV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGVzdDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGJhc2UsIHByb3BzLCBzdGF0aWNQcm9wcykge1xuICAgIHZhciBwYXJlbnQgPSBiYXNlO1xuICAgIHZhciBjaGlsZDtcblxuICAgIGNoaWxkID0gcHJvcHMgJiYgcHJvcHMuaGFzT3duUHJvcGVydHkoJ2NvbnN0cnVjdG9yJykgPyBwcm9wcy5jb25zdHJ1Y3RvciA6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHBhcmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9O1xuXG4gICAgLy8gYWRkIHN0YXRpYyBwcm9wZXJ0aWVzIHRvIHRoZSBjaGlsZCBjb25zdHJ1Y3RvciBmdW5jdGlvblxuICAgIGV4dGVuZChjaGlsZCwgcGFyZW50LCBzdGF0aWNQcm9wcyk7XG5cbiAgICAvLyBhc3NvY2lhdGUgcHJvdG90eXBlIGNoYWluXG4gICAgaW5oZXJpdChjaGlsZCwgcGFyZW50KTtcblxuICAgIC8vIGFkZCBpbnN0YW5jZSBwcm9wZXJ0aWVzXG4gICAgaWYgKHByb3BzKSB7XG4gICAgICAgIGV4dGVuZChjaGlsZC5wcm90b3R5cGUsIHByb3BzKTtcbiAgICB9XG5cbiAgICAvLyBkb25lXG4gICAgcmV0dXJuIGNoaWxkO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgX3BpY2s6IGZ1bmN0aW9uIChvYmosIHByb3BzKSB7XG4gICAgICAgIHZhciByZXMgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgcCBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmIChwcm9wcy5pbmRleE9mKHApICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJlc1twXSA9IG9ialtwXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xuXG52YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2UoKS5nZXQoJ3NlcnZlcicpO1xudmFyIGN1c3RvbURlZmF1bHRzID0ge307XG52YXIgbGliRGVmYXVsdHMgPSB7XG4gICAgLyoqXG4gICAgICogVGhlIGFjY291bnQgaWQuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAqL1xuICAgIGFjY291bnQ6IHVybENvbmZpZy5hY2NvdW50UGF0aCxcbiAgICAvKipcbiAgICAgKiBUaGUgYWNjb3VudCBpZC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKSBvciAqKlVzZXIgSUQqKiAoZm9yIHBlcnNvbmFsIHByb2plY3RzKS4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgVVJMLlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG4gICAgcHJvamVjdDogdXJsQ29uZmlnLnByb2plY3RQYXRoLFxuICAgIGlzTG9jYWw6IHVybENvbmZpZy5pc0xvY2FsaG9zdCgpLFxuICAgIGlzQ3VzdG9tRG9tYWluOiB1cmxDb25maWcuaXNDdXN0b21Eb21haW4sXG4gICAgc3RvcmU6IHt9XG59O1xuXG52YXIgb3B0aW9uVXRpbHMgPSB7XG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgZmluYWwgb3B0aW9ucyBieSBvdmVycmlkaW5nIHRoZSBnbG9iYWwgb3B0aW9ucyBzZXQgd2l0aFxuICAgICAqIG9wdGlvblV0aWxzI3NldERlZmF1bHRzKCkgYW5kIHRoZSBsaWIgZGVmYXVsdHMuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgVGhlIGZpbmFsIG9wdGlvbnMgb2JqZWN0LlxuICAgICAqIEByZXR1cm4ge29iamVjdH0gRXh0ZW5kZWQgb2JqZWN0XG4gICAgICovXG4gICAgZ2V0T3B0aW9uczogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHt9LCBsaWJEZWZhdWx0cywgY3VzdG9tRGVmYXVsdHMsIG9wdGlvbnMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgZ2xvYmFsIGRlZmF1bHRzIGZvciB0aGUgb3B0aW9uVXRpbHMjZ2V0T3B0aW9ucygpIG1ldGhvZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGVmYXVsdHMgVGhlIGRlZmF1bHRzIG9iamVjdC5cbiAgICAgKi9cbiAgICBzZXREZWZhdWx0czogZnVuY3Rpb24gKGRlZmF1bHRzKSB7XG4gICAgICAgIGN1c3RvbURlZmF1bHRzID0gZGVmYXVsdHM7XG4gICAgfVxufTtcbm1vZHVsZS5leHBvcnRzID0gb3B0aW9uVXRpbHM7XG4iLCIvKipcbiAqIFV0aWxpdGllcyBmb3Igd29ya2luZyB3aXRoIHF1ZXJ5IHN0cmluZ3NcbiovXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb252ZXJ0cyB0byBtYXRyaXggZm9ybWF0XG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gcXMgT2JqZWN0IHRvIGNvbnZlcnQgdG8gcXVlcnkgc3RyaW5nXG4gICAgICAgICAqIEByZXR1cm4geyBzdHJpbmd9ICAgIE1hdHJpeC1mb3JtYXQgcXVlcnkgcGFyYW1ldGVyc1xuICAgICAgICAgKi9cbiAgICAgICAgdG9NYXRyaXhGb3JtYXQ6IGZ1bmN0aW9uIChxcykge1xuICAgICAgICAgICAgaWYgKHFzID09PSBudWxsIHx8IHFzID09PSB1bmRlZmluZWQgfHwgcXMgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICc7JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgcXMgPT09ICdzdHJpbmcnIHx8IHFzIGluc3RhbmNlb2YgU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHFzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcmV0dXJuQXJyYXkgPSBbXTtcbiAgICAgICAgICAgIHZhciBPUEVSQVRPUlMgPSBbJzwnLCAnPicsICchJ107XG4gICAgICAgICAgICAkLmVhY2gocXMsIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgfHwgJC5pbkFycmF5KCQudHJpbSh2YWx1ZSkuY2hhckF0KDApLCBPUEVSQVRPUlMpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9ICc9JyArIHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm5BcnJheS5wdXNoKGtleSArIHZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2YXIgbXRyeCA9ICc7JyArIHJldHVybkFycmF5LmpvaW4oJzsnKTtcbiAgICAgICAgICAgIHJldHVybiBtdHJ4O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb252ZXJ0cyBzdHJpbmdzL2FycmF5cy9vYmplY3RzIHRvIHR5cGUgJ2E9YiZiPWMnXG4gICAgICAgICAqIEBwYXJhbSAgeyBzdHJpbmd8QXJyYXl8T2JqZWN0fSBxc1xuICAgICAgICAgKiBAcmV0dXJuIHsgc3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdG9RdWVyeUZvcm1hdDogZnVuY3Rpb24gKHFzKSB7XG4gICAgICAgICAgICBpZiAocXMgPT09IG51bGwgfHwgcXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgcXMgPT09ICdzdHJpbmcnIHx8IHFzIGluc3RhbmNlb2YgU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHFzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcmV0dXJuQXJyYXkgPSBbXTtcbiAgICAgICAgICAgICQuZWFjaChxcywgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoJC5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLmpvaW4oJywnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy9Nb3N0bHkgZm9yIGRhdGEgYXBpXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm5BcnJheS5wdXNoKGtleSArICc9JyArIHZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gcmV0dXJuQXJyYXkuam9pbignJicpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29udmVydHMgc3RyaW5ncyBvZiB0eXBlICdhPWImYj1jJyB0byB7IGE6YiwgYjpjfVxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfSBxc1xuICAgICAgICAgKiBAcmV0dXJuIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBxc1RvT2JqZWN0OiBmdW5jdGlvbiAocXMpIHtcbiAgICAgICAgICAgIGlmIChxcyA9PT0gbnVsbCB8fCBxcyA9PT0gdW5kZWZpbmVkIHx8IHFzID09PSAnJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHFzQXJyYXkgPSBxcy5zcGxpdCgnJicpO1xuICAgICAgICAgICAgdmFyIHJldHVybk9iaiA9IHt9O1xuICAgICAgICAgICAgJC5lYWNoKHFzQXJyYXksIGZ1bmN0aW9uIChpbmRleCwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcUtleSA9IHZhbHVlLnNwbGl0KCc9JylbMF07XG4gICAgICAgICAgICAgICAgdmFyIHFWYWwgPSB2YWx1ZS5zcGxpdCgnPScpWzFdO1xuXG4gICAgICAgICAgICAgICAgaWYgKHFWYWwuaW5kZXhPZignLCcpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBxVmFsID0gcVZhbC5zcGxpdCgnLCcpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybk9ialtxS2V5XSA9IHFWYWw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHJldHVybk9iajtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogTm9ybWFsaXplcyBhbmQgbWVyZ2VzIHN0cmluZ3Mgb2YgdHlwZSAnYT1iJywgeyBiOmN9IHRvIHsgYTpiLCBiOmN9XG4gICAgICAgICAqIEBwYXJhbSAgeyBzdHJpbmd8QXJyYXl8T2JqZWN0fSBxczFcbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xBcnJheXxPYmplY3R9IHFzMlxuICAgICAgICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBtZXJnZVFTOiBmdW5jdGlvbiAocXMxLCBxczIpIHtcbiAgICAgICAgICAgIHZhciBvYmoxID0gdGhpcy5xc1RvT2JqZWN0KHRoaXMudG9RdWVyeUZvcm1hdChxczEpKTtcbiAgICAgICAgICAgIHZhciBvYmoyID0gdGhpcy5xc1RvT2JqZWN0KHRoaXMudG9RdWVyeUZvcm1hdChxczIpKTtcbiAgICAgICAgICAgIHJldHVybiAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqMSwgb2JqMik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWRkVHJhaWxpbmdTbGFzaDogZnVuY3Rpb24gKHVybCkge1xuICAgICAgICAgICAgaWYgKCF1cmwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gKHVybC5jaGFyQXQodXJsLmxlbmd0aCAtIDEpID09PSAnLycpID8gdXJsIDogKHVybCArICcvJyk7XG4gICAgICAgIH1cbiAgICB9O1xufSgpKTtcblxuXG4iLCIvKipcbiAqIFV0aWxpdGllcyBmb3Igd29ya2luZyB3aXRoIHRoZSBydW4gc2VydmljZVxuKi9cbid1c2Ugc3RyaWN0JztcbnZhciBxdXRpbCA9IHJlcXVpcmUoJy4vcXVlcnktdXRpbCcpO1xudmFyIE1BWF9VUkxfTEVOR1RIID0gMjA0ODtcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiByZXR1cm5zIG9wZXJhdGlvbnMgb2YgdGhlIGZvcm0gYFtbb3AxLG9wMl0sIFthcmcxLCBhcmcyXV1gXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdHxBcnJheXxTdHJpbmd9IG9wZXJhdGlvbnMgb3BlcmF0aW9ucyB0byBwZXJmb3JtXG4gICAgICAgICAqIEBwYXJhbSAge0FycmF5fSBhcmdzIGFyZ3VtZW50cyBmb3Igb3BlcmF0aW9uXG4gICAgICAgICAqIEByZXR1cm4ge1N0cmluZ30gICAgTWF0cml4LWZvcm1hdCBxdWVyeSBwYXJhbWV0ZXJzXG4gICAgICAgICAqL1xuICAgICAgICBub3JtYWxpemVPcGVyYXRpb25zOiBmdW5jdGlvbiAob3BlcmF0aW9ucywgYXJncykge1xuICAgICAgICAgICAgaWYgKCFhcmdzKSB7XG4gICAgICAgICAgICAgICAgYXJncyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHJldHVybkxpc3QgPSB7XG4gICAgICAgICAgICAgICAgb3BzOiBbXSxcbiAgICAgICAgICAgICAgICBhcmdzOiBbXVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIF9jb25jYXQgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChhcnIgIT09IG51bGwgJiYgYXJyICE9PSB1bmRlZmluZWQpID8gW10uY29uY2F0KGFycikgOiBbXTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8veyBhZGQ6IFsxLDJdLCBzdWJ0cmFjdDogWzIsNF0gfVxuICAgICAgICAgICAgdmFyIF9ub3JtYWxpemVQbGFpbk9iamVjdHMgPSBmdW5jdGlvbiAob3BlcmF0aW9ucywgcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgIGlmICghcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5MaXN0ID0geyBvcHM6IFtdLCBhcmdzOiBbXSB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkLmVhY2gob3BlcmF0aW9ucywgZnVuY3Rpb24gKG9wbiwgYXJnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybkxpc3Qub3BzLnB1c2gob3BuKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuTGlzdC5hcmdzLnB1c2goX2NvbmNhdChhcmcpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0dXJuTGlzdDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvL3sgbmFtZTogJ2FkZCcsIHBhcmFtczogWzFdIH1cbiAgICAgICAgICAgIHZhciBfbm9ybWFsaXplU3RydWN0dXJlZE9iamVjdHMgPSBmdW5jdGlvbiAob3BlcmF0aW9uLCByZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybkxpc3QgPSB7IG9wczogW10sIGFyZ3M6IFtdIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybkxpc3Qub3BzLnB1c2gob3BlcmF0aW9uLm5hbWUpO1xuICAgICAgICAgICAgICAgIHJldHVybkxpc3QuYXJncy5wdXNoKF9jb25jYXQob3BlcmF0aW9uLnBhcmFtcykpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXR1cm5MaXN0O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIF9ub3JtYWxpemVPYmplY3QgPSBmdW5jdGlvbiAob3BlcmF0aW9uLCByZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICgob3BlcmF0aW9uLm5hbWUpID8gX25vcm1hbGl6ZVN0cnVjdHVyZWRPYmplY3RzIDogX25vcm1hbGl6ZVBsYWluT2JqZWN0cykob3BlcmF0aW9uLCByZXR1cm5MaXN0KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBfbm9ybWFsaXplTGl0ZXJhbHMgPSBmdW5jdGlvbiAob3BlcmF0aW9uLCBhcmdzLCByZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybkxpc3QgPSB7IG9wczogW10sIGFyZ3M6IFtdIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybkxpc3Qub3BzLnB1c2gob3BlcmF0aW9uKTtcbiAgICAgICAgICAgICAgICByZXR1cm5MaXN0LmFyZ3MucHVzaChfY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0dXJuTGlzdDtcbiAgICAgICAgICAgIH07XG5cblxuICAgICAgICAgICAgdmFyIF9ub3JtYWxpemVBcnJheXMgPSBmdW5jdGlvbiAob3BlcmF0aW9ucywgYXJnLCByZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybkxpc3QgPSB7IG9wczogW10sIGFyZ3M6IFtdIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICQuZWFjaChvcGVyYXRpb25zLCBmdW5jdGlvbiAoaW5kZXgsIG9wbikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KG9wbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9ub3JtYWxpemVPYmplY3Qob3BuLCByZXR1cm5MaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9ub3JtYWxpemVMaXRlcmFscyhvcG4sIGFyZ3NbaW5kZXhdLCByZXR1cm5MaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXR1cm5MaXN0O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdChvcGVyYXRpb25zKSkge1xuICAgICAgICAgICAgICAgIF9ub3JtYWxpemVPYmplY3Qob3BlcmF0aW9ucywgcmV0dXJuTGlzdCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCQuaXNBcnJheShvcGVyYXRpb25zKSkge1xuICAgICAgICAgICAgICAgIF9ub3JtYWxpemVBcnJheXMob3BlcmF0aW9ucywgYXJncywgcmV0dXJuTGlzdCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIF9ub3JtYWxpemVMaXRlcmFscyhvcGVyYXRpb25zLCBhcmdzLCByZXR1cm5MaXN0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJldHVybkxpc3Q7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3BsaXRHZXRGYWN0b3J5OiBmdW5jdGlvbiAoaHR0cE9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyIGh0dHAgPSB0aGlzOyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgICAgICAgICB2YXIgZ2V0VmFsdWUgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBvcHRpb25zW25hbWVdIHx8IGh0dHBPcHRpb25zW25hbWVdO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdmFyIGdldEZpbmFsVXJsID0gZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdXJsID0gZ2V0VmFsdWUoJ3VybCcsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHBhcmFtcztcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlcmUgaXMgZWFzeSAob3Iga25vd24pIHdheSB0byBnZXQgdGhlIGZpbmFsIFVSTCBqcXVlcnkgaXMgZ29pbmcgdG8gc2VuZCBzb1xuICAgICAgICAgICAgICAgICAgICAvLyB3ZSdyZSByZXBsaWNhdGluZyBpdC4gVGhlIHByb2Nlc3MgbWlnaHQgY2hhbmdlIGF0IHNvbWUgcG9pbnQgYnV0IGl0IHByb2JhYmx5IHdpbGwgbm90LlxuICAgICAgICAgICAgICAgICAgICAvLyAxLiBSZW1vdmUgaGFzaFxuICAgICAgICAgICAgICAgICAgICB1cmwgPSB1cmwucmVwbGFjZSgvIy4qJC8sICcnKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gMS4gQXBwZW5kIHF1ZXJ5IHN0cmluZ1xuICAgICAgICAgICAgICAgICAgICB2YXIgcXVlcnlQYXJhbXMgPSBxdXRpbC50b1F1ZXJ5Rm9ybWF0KGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcXVlc3Rpb25JZHggPSB1cmwuaW5kZXhPZignPycpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocXVlcnlQYXJhbXMgJiYgcXVlc3Rpb25JZHggPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVybCArICcmJyArIHF1ZXJ5UGFyYW1zO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHF1ZXJ5UGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdXJsICsgJz8nICsgcXVlcnlQYXJhbXM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVybDtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciB1cmwgPSBnZXRGaW5hbFVybChwYXJhbXMpO1xuICAgICAgICAgICAgICAgIC8vIFdlIG11c3Qgc3BsaXQgdGhlIEdFVCBpbiBtdWx0aXBsZSBzaG9ydCBVUkwnc1xuICAgICAgICAgICAgICAgIC8vIFRoZSBvbmx5IHByb3BlcnR5IGFsbG93ZWQgdG8gYmUgc3BsaXQgaXMgXCJpbmNsdWRlXCJcbiAgICAgICAgICAgICAgICBpZiAocGFyYW1zICYmIHBhcmFtcy5pbmNsdWRlICYmIGVuY29kZVVSSSh1cmwpLmxlbmd0aCA+IE1BWF9VUkxfTEVOR1RIKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkdGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJhbXNDb3B5ID0gJC5leHRlbmQodHJ1ZSwge30sIHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBwYXJhbXNDb3B5LmluY2x1ZGU7XG4gICAgICAgICAgICAgICAgICAgIHZhciB1cmxOb0luY2x1ZGVzID0gZ2V0RmluYWxVcmwocGFyYW1zQ29weSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaWZmID0gTUFYX1VSTF9MRU5HVEggLSB1cmxOb0luY2x1ZGVzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9sZFN1Y2Nlc3MgPSBvcHRpb25zLnN1Y2Nlc3MgfHwgaHR0cE9wdGlvbnMuc3VjY2VzcyB8fCAkLm5vb3A7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvbGRFcnJvciA9IG9wdGlvbnMuZXJyb3IgfHwgaHR0cE9wdGlvbnMuZXJyb3IgfHwgJC5ub29wO1xuICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIG9yaWdpbmFsIHN1Y2Nlc3MgYW5kIGVycm9yIGNhbGxiYWNrc1xuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnN1Y2Nlc3MgPSAkLm5vb3A7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZXJyb3IgPSAkLm5vb3A7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGluY2x1ZGUgPSBwYXJhbXMuaW5jbHVkZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJJbmNsdWRlcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5jbHVkZU9wdHMgPSBbY3VyckluY2x1ZGVzXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJMZW5ndGggPSBlbmNvZGVVUklDb21wb25lbnQoJz9pbmNsdWRlPScpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhcmlhYmxlID0gaW5jbHVkZS5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHZhcmlhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFyTGVuZ2h0ID0gZW5jb2RlVVJJQ29tcG9uZW50KHZhcmlhYmxlKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBVc2UgYSBncmVlZHkgYXBwcm9hY2ggZm9yIG5vdywgY2FuIGJlIG9wdGltaXplZCB0byBiZSBzb2x2ZWQgaW4gYSBtb3JlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBlZmZpY2llbnQgd2F5XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyArIDEgaXMgdGhlIGNvbW1hXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3Vyckxlbmd0aCArIHZhckxlbmdodCArIDEgPCBkaWZmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VyckluY2x1ZGVzLnB1c2godmFyaWFibGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJMZW5ndGggKz0gdmFyTGVuZ2h0ICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VyckluY2x1ZGVzID0gW3ZhcmlhYmxlXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlT3B0cy5wdXNoKGN1cnJJbmNsdWRlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyckxlbmd0aCA9ICc/aW5jbHVkZT0nLmxlbmd0aCArIHZhckxlbmdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlID0gaW5jbHVkZS5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVxcyA9ICQubWFwKGluY2x1ZGVPcHRzLCBmdW5jdGlvbiAoaW5jbHVkZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlcVBhcmFtcyA9ICQuZXh0ZW5kKHt9LCBwYXJhbXMsIHsgaW5jbHVkZTogaW5jbHVkZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBodHRwLmdldChyZXFQYXJhbXMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJC53aGVuLmFwcGx5KCQsIHJlcXMpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRWFjaCBhcmd1bWVudCBhcmUgYXJyYXlzIG9mIHRoZSBhcmd1bWVudHMgb2YgZWFjaCBkb25lIHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNvIHRoZSBmaXJzdCBhcmd1bWVudCBvZiB0aGUgZmlyc3QgYXJyYXkgb2YgYXJndW1lbnRzIGlzIHRoZSBkYXRhXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXNWYWxpZCA9IGFyZ3VtZW50c1swXSAmJiBhcmd1bWVudHNbMF1bMF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTaG91bGQgbmV2ZXIgaGFwcGVuLi4uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkRXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZHRkLnJlamVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZpcnN0UmVzcG9uc2UgPSBhcmd1bWVudHNbMF1bMF07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXNPYmplY3QgPSAkLmlzUGxhaW5PYmplY3QoZmlyc3RSZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXNSdW5BUEkgPSAoaXNPYmplY3QgJiYgJC5pc1BsYWluT2JqZWN0KGZpcnN0UmVzcG9uc2UudmFyaWFibGVzKSkgfHwgIWlzT2JqZWN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzUnVuQVBJKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFnZ3JlZ2F0ZSB0aGUgdmFyaWFibGVzIHByb3BlcnR5IG9ubHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFnZ3JlZ2F0ZVJ1biA9IGFyZ3VtZW50c1swXVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGFyZ3VtZW50cywgZnVuY3Rpb24gKGlkeCwgYXJncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJ1biA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCBhZ2dyZWdhdGVSdW4udmFyaWFibGVzLCBydW4udmFyaWFibGVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFN1Y2Nlc3MoYWdncmVnYXRlUnVuLCBhcmd1bWVudHNbMF1bMV0sIGFyZ3VtZW50c1swXVsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlKGFnZ3JlZ2F0ZVJ1biwgYXJndW1lbnRzWzBdWzFdLCBhcmd1bWVudHNbMF1bMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFycmF5IG9mIHJ1bnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWdyZWdhdGUgdmFyaWFibGVzIGluIGVhY2ggcnVuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhZ2dyZWdhdGVkUnVucyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goYXJndW1lbnRzLCBmdW5jdGlvbiAoaWR4LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcnVucyA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoISQuaXNBcnJheShydW5zKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChydW5zLCBmdW5jdGlvbiAoaWR4UnVuLCBydW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocnVuLmlkICYmICFhZ2dyZWdhdGVkUnVuc1tydW4uaWRdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bi52YXJpYWJsZXMgPSBydW4udmFyaWFibGVzIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVkUnVuc1tydW4uaWRdID0gcnVuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocnVuLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZXh0ZW5kKHRydWUsIGFnZ3JlZ2F0ZWRSdW5zW3J1bi5pZF0udmFyaWFibGVzLCBydW4udmFyaWFibGVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHR1cm4gaXQgaW50byBhbiBhcnJheVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVkUnVucyA9ICQubWFwKGFnZ3JlZ2F0ZWRSdW5zLCBmdW5jdGlvbiAocnVuKSB7IHJldHVybiBydW47IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRTdWNjZXNzKGFnZ3JlZ2F0ZWRSdW5zLCBhcmd1bWVudHNbMF1bMV0sIGFyZ3VtZW50c1swXVsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlKGFnZ3JlZ2F0ZWRSdW5zLCBhcmd1bWVudHNbMF1bMV0sIGFyZ3VtZW50c1swXVsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpcyB2YXJpYWJsZXMgQVBJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWdncmVnYXRlIHRoZSByZXNwb25zZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhZ2dyZWdhdGVkVmFyaWFibGVzID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGFyZ3VtZW50cywgZnVuY3Rpb24gKGlkeCwgYXJncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFycyA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZXh0ZW5kKHRydWUsIGFnZ3JlZ2F0ZWRWYXJpYWJsZXMsIHZhcnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFN1Y2Nlc3MoYWdncmVnYXRlZFZhcmlhYmxlcywgYXJndW1lbnRzWzBdWzFdLCBhcmd1bWVudHNbMF1bMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlKGFnZ3JlZ2F0ZWRWYXJpYWJsZXMsIGFyZ3VtZW50c1swXVsxXSwgYXJndW1lbnRzWzBdWzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2xkRXJyb3IuYXBwbHkoaHR0cCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGR0ZC5yZWplY3QuYXBwbHkoZHRkLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGR0ZC5wcm9taXNlKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KHBhcmFtcywgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH07XG59KCkpO1xuIl19
