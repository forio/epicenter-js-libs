(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

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
 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
 *     on objects.
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

function typedArraySupport () {
  function Bar () {}
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    arr.constructor = Bar
    return arr.foo() === 42 && // typed array instances can be augmented
        arr.constructor === Bar && // constructor can be set
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

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  this.length = 0
  this.parent = undefined

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    array.byteLength
    that = Buffer._augment(new Uint8Array(array))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
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

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
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
    case 'binary':
    case 'base64':
    case 'raw':
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
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
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

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

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

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` is deprecated
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` is deprecated
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
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
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
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

function binaryWrite (buf, string, offset, length) {
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
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
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

      case 'binary':
        return binaryWrite(this, string, offset, length)

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

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
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
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

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
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

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
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

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
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
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
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
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
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
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
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
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
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
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
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

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

  for (var i = 0; i < length; i++) {
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
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
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
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"base64-js":2,"ieee754":3,"is-array":4}],2:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],3:[function(require,module,exports){
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

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],5:[function(require,module,exports){
module.exports={
    "version": ""
}

},{}],6:[function(require,module,exports){
(function (global){
/**
 * Epicenter Javascript libraries
 * v1.6.3
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

F.util.query = require('./util/query-util');
F.util.makeSequence = require('./util/make-sequence');
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

F.version = '1.6.3';
F.api = require('./api-version.json');

global.F = F;
module.exports = F;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./api-version.json":5,"./managers/auth-manager":7,"./managers/epicenter-channel-manager":9,"./managers/run-manager":11,"./managers/run-strategies/always-new-strategy":12,"./managers/run-strategies/conditional-creation-strategy":13,"./managers/run-strategies/identity-strategy":14,"./managers/run-strategies/new-if-initialized-strategy":16,"./managers/run-strategies/new-if-missing-strategy":17,"./managers/run-strategies/new-if-persisted-strategy":18,"./managers/scenario-manager":21,"./managers/world-manager":23,"./service/admin-file-service":24,"./service/asset-api-adapter":25,"./service/auth-api-service":26,"./service/channel-service":27,"./service/configuration-service":28,"./service/data-api-service":29,"./service/member-api-adapter":30,"./service/run-api-service":31,"./service/state-api-adapter":32,"./service/url-config-service":33,"./service/user-api-adapter":34,"./service/variables-api-service":35,"./service/world-api-adapter":36,"./store/cookie-store":37,"./store/store-factory":38,"./transport/ajax-http-transport":39,"./transport/http-transport-factory":40,"./util/inherit":41,"./util/make-sequence":42,"./util/query-util":44,"./util/run-util":45}],7:[function(require,module,exports){
/**
* ## Authorization Manager
*
* The Authorization Manager provides an easy way to manage user authentication (logging in and out) and authorization (keeping track of tokens, sessions, and groups) for projects.
*
* The Authorization Manager is most useful for [team projects](../../../glossary/#team) with an access level of [Authenticated](../../../glossary/#access). These projects are accessed by [end users](../../../glossary/#users) who are members of one or more [groups](../../../glossary/#groups).
*
* ####Using the Authorization Manager
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
var ConfigService = require('../service/configuration-service');
var AuthAdapter = require('../service/auth-api-service');
var MemberAdapter = require('../service/member-api-adapter');
var StorageFactory = require('../store/store-factory');
var Buffer = require('buffer').Buffer;
var keyNames = require('./key-names');

var defaults = {
    /**
     * Where to store user access tokens for temporary access. Defaults to storing in a cookie in the browser.
     * @type {string}
     */
    store: { synchronous: true }
};

var EPI_COOKIE_KEY = keyNames.EPI_COOKIE_KEY;
var EPI_SESSION_KEY = keyNames.EPI_SESSION_KEY;
var token;
var session;

function saveSession(userInfo, store) {
    var serialized = JSON.stringify(userInfo);
    store.set(EPI_SESSION_KEY, serialized);

    //jshint camelcase: false
    //jscs:disable
    store.set(EPI_COOKIE_KEY, userInfo.auth_token);
}

function getSession(store) {
    var session = store.get(EPI_SESSION_KEY) || '{}';
    return JSON.parse(session);
}

function AuthManager(options) {
    this.options = $.extend(true, {}, defaults, options);

    var urlConfig = new ConfigService(this.options).get('server');
    this.isLocal = urlConfig.isLocalhost();

    if (!this.options.account) {
        this.options.account = urlConfig.accountPath;
    }

    // null might specified to disable project filtering
    if (this.options.project === undefined) {
        this.options.project = urlConfig.projectPath;
    }

    this.store = new StorageFactory(this.options.store);
    session = getSession(this.store);
    token = this.store.get(EPI_COOKIE_KEY) || '';
    //jshint camelcase: false
    //jscs:disable
    this.authAdapter = new AuthAdapter(this.options, { token: session.auth_token });
}

var _findUserInGroup = function (members, id) {
    for (var j = 0; j<members.length; j++) {
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
    * @param {Object} `options` (Optional) Overrides for configuration options. If not passed in when creating an instance of the manager (`F.manager.AuthManager()`), these options should include:
    * @param {string} `options.account` The account id for this `userName`. In the Epicenter UI, this is the **Team ID** (for team projects) or the **User ID** (for personal projects).
    * @param {string} `options.userName` Email or username to use for logging in.
    * @param {string} `options.password` Password for specified `userName`.
    * @param {string} `options.project` (Optional) The **Project ID** for the project to log this user into.
    * @param {string} `options.groupId` The id of the group to which `userName` belongs. Required for [end users](../../../glossary/#users) if the `project` is specified and if the end users are members of multiple [groups](../../../glossary/#groups), otherwise optional.
    */
    login: function (options) {
        var _this = this;
        var $d = $.Deferred();
        var adapterOptions = $.extend(true, { success: $.noop, error: $.noop }, this.options, options);
        var outSuccess = adapterOptions.success;
        var outError = adapterOptions.error;
        var groupId = adapterOptions.groupId;

        var accountName = adapterOptions.account;
        var projectName = adapterOptions.project;

        if (this.options.store.root === undefined && accountName && projectName && !this.isLocal) {
            this.store.serviceOptions.root = '/app/' + accountName + '/' + projectName;
        }

        var decodeToken = function (token) {
            var encoded = token.split('.')[1];
            while (encoded.length % 4 !== 0) {
                encoded += '=';
            }

            var decode = window.atob ? window.atob : function (encoded) { return new Buffer(encoded, 'base64').toString('ascii'); };

            return JSON.parse(decode(encoded));
        };

        var handleGroupError = function (message, statusCode, data) {
            // logout the user since it's in an invalid state with no group selected
            _this.logout().then(function () {
                var error = $.extend(true, {}, data, { statusText: message, status: statusCode });
                $d.reject(error);
            });
        };

        var handleSuccess = function (response) {
            //jshint camelcase: false
            //jscs:disable
            token = response.access_token;
            var userInfo = decodeToken(token);
            var userGroupOpts = $.extend(true, {}, adapterOptions, { success: $.noop, token: token });
            _this.getUserGroups({ userId: userInfo.user_id, token: token }, userGroupOpts).done( function (memberInfo) {
                var data = {auth: response, user: userInfo, userGroups: memberInfo, groupSelection: {} };

                var sessionInfo = {
                    'auth_token': token,
                    'account': adapterOptions.account,
                    'project': adapterOptions.project,
                    'userId': userInfo.user_id
                };
                // The group is not required if the user is not logging into a project
                if (!adapterOptions.project) {
                    saveSession(sessionInfo, _this.store);
                    outSuccess.apply(this, [data]);
                    $d.resolve(data);
                    return;
                }

                var group = null;
                if (memberInfo.length === 0) {
                    handleGroupError('The user has no groups associated in this account', 401, data);
                    return;
                } else if (memberInfo.length === 1) {
                    // Select the only group
                    group = memberInfo[0];
                } else if (memberInfo.length > 1) {
                    if (groupId) {
                        var filteredGroups = $.grep(memberInfo, function (resGroup) {
                            return resGroup.groupId === groupId;
                        });
                        group = filteredGroups.length === 1 ? filteredGroups[0] : null;
                    }
                }

                if (group) {
                    var groupSelection = group.groupId;
                    data.groupSelection[adapterOptions.project] = groupSelection;
                    var sessionInfoWithGroup = $.extend({}, sessionInfo, {
                        'groupId': group.groupId,
                        'groupName': group.name,
                        'isFac': _findUserInGroup(group.members, userInfo.user_id).role === 'facilitator'
                    });
                    saveSession(sessionInfoWithGroup, _this.store);
                    outSuccess.apply(this, [data]);
                    $d.resolve(data);
                } else {
                    handleGroupError('This user is associated with more than one group. Please specify a group id to log into and try again', 403, data);
                }
            }).fail($d.reject);
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

                _this.authAdapter.login(adapterOptions);
                return;
            }

            outError.apply(this, arguments);
            $d.reject(response);
        };

        this.authAdapter.login(adapterOptions);
        return $d.promise();
    },

    /**
    * Logs user out.
    *
    * **Example**
    *
    *       authMgr.logout();
    *
    * **Parameters**
    *
    * @param {Object} `options` (Optional) Overrides for configuration options.
    */
    logout: function (options) {
        var _this = this;
        var adapterOptions = $.extend(true, { token: token }, this.options, options);

        var removeCookieFn = function (response) {
            _this.store.remove(EPI_COOKIE_KEY, adapterOptions);
            _this.store.remove(EPI_SESSION_KEY, adapterOptions);
            token = '';
        };

        return this.authAdapter.logout(adapterOptions).done(removeCookieFn);
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
     * @param {Object} `options` (Optional) Overrides for configuration options.
     */
    getToken: function (options) {
        var httpOptions = $.extend(true, this.options, options);

        var $d = $.Deferred();
        if (token) {
            $d.resolve(token);
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
     * @param {Object} `params` Object with a userId and token properties.
     * @param {String} `params.userId` The userId. If looking up groups for the currently logged in user, this is in the session information. Otherwise, pass a string.
     * @param {String} `params.token` The authorization credentials (access token) to use for checking the groups for this user. If looking up groups for the currently logged in user, this is in the session information. A team member's token or a project access token can access all the groups for all end users in the team or project.
     * @param {Object} `options` (Optional) Overrides for configuration options.
     */
    getUserGroups: function (params, options) {
        var adapterOptions = $.extend(true, { success: $.noop }, this.options, options);
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
     * By default, session information is stored in a cookie in the browser. You can change this with the `store` configuration option.
     *
     * **Example**
     *
     *      var sessionObj = authMgr.getCurrentUserSessionInfo();
     *
     * **Parameters**
     * @param {Object} `options` (Optional) Overrides for configuration options.
     */
    getCurrentUserSessionInfo: function (options) {
        return getSession(this.store, options);
    }
});

module.exports = AuthManager;

},{"../service/auth-api-service":26,"../service/configuration-service":28,"../service/member-api-adapter":30,"../store/store-factory":38,"./key-names":10,"buffer":1}],8:[function(require,module,exports){
'use strict';

var Channel = require('../service/channel-service');

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

        }
    };
    var defaultCometOptions = $.extend(true, {}, defaults, options);
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

    cometd.handshake();

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
     * @param {Object|String} `options` (Optional) If string, assumed to be the base channel url. If object, assumed to be configuration options for the constructor.
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
            this.currentSubscriptions  = this.currentSubscriptions.concat(subid);
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
     * @param {string} `event` The event type. See more detail at jQuery Events: http://api.jquery.com/on/.
     */
    on: function (event) {
        $(this).on.apply($(this), arguments);
    },

    /**
     * Stop listening for events on this instance. Signature is same as for jQuery Events: http://api.jquery.com/off/.
     *
     * **Parameters**
     *
     * @param {string} `event` The event type. See more detail at jQuery Events: http://api.jquery.com/off/.
     */
    off: function (event) {
        $(this).off.apply($(this), arguments);
    },

    /**
     * Trigger events and execute handlers. Signature is same as for jQuery Events: http://api.jquery.com/trigger/.
     *
     * **Parameters**
     *
     * @param {string} `event` The event type. See more detail at jQuery Events: http://api.jquery.com/trigger/.
     */
    trigger: function (event) {
        $(this).trigger.apply($(this), arguments);
    }
});

module.exports = ChannelManager;

},{"../service/channel-service":27}],9:[function(require,module,exports){
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
 * * `server` Object with details about the Epicenter project for this Epicenter Channel Manager instance.
 * * `server.account` The Epicenter account id (**Team ID** for team projects, **User ID** for personal projects).
 * * `server.project` Epicenter project id.
 */

var ChannelManager = require('./channel-manager');
var classFrom = require('../util/inherit');
var urlService = require('../service/url-config-service');

var AuthManager = require('./auth-manager');

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
        var userInfo = session.getCurrentUserSessionInfo();

        var defaults = {
            account: userInfo.account,
            project: userInfo.project,
        };
        var defaultCometOptions = $.extend(true, {}, defaults, userInfo, options);

        var urlOpts = urlService(defaultCometOptions.server);
        if (!defaultCometOptions.url) {
            //Default epicenter cometd endpoint
            defaultCometOptions.url = urlOpts.protocol + '://' + urlOpts.host + '/channel/subscribe';
        }

        this.options = defaultCometOptions;
        return __super.constructor.call(this, defaultCometOptions);
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
     * @param  {String} `groupName` (Optional) Group to broadcast to. If not provided, picks up group from current session if end user is logged in.
     */
    getGroupChannel: function (groupName) {
        groupName = getFromSettingsOrSessionOrError(groupName, 'groupName');
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
     * @param  {String|Object} `world` The world object or id.
     * @param  {String} `groupName` (Optional) Group the world exists in. If not provided, picks up group from current session if end user is logged in.
     */
    getWorldChannel: function (world, groupName) {
        var worldid = ($.isPlainObject(world) && world.id) ? world.id : world;
        if (!worldid) {
            throw new Error('Please specify a world id');
        }
        groupName = getFromSettingsOrSessionOrError(groupName, 'groupName');
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
     * @param  {String|Object} `world` World object or id.
     * @param  {String|Object} `user` (Optional) User object or id. If not provided, picks up user id from current session if end user is logged in.
     * @param  {String} `groupName` (Optional) Group the world exists in. If not provided, picks up group from current session if end user is logged in.
     */
    getUserChannel: function (world, user, groupName) {
        var worldid = ($.isPlainObject(world) && world.id) ? world.id : world;
        if (!worldid) {
            throw new Error('Please specify a world id');
        }
        var userid = ($.isPlainObject(user) && user.id) ? user.id : user;
        userid = getFromSettingsOrSessionOrError(userid, 'userId');
        groupName = getFromSettingsOrSessionOrError(groupName, 'groupName');

        var account = getFromSettingsOrSessionOrError('', 'account', this.options);
        var project = getFromSettingsOrSessionOrError('', 'project', this.options);

        var baseTopic = ['/users', account, project, groupName, worldid, userid].join('/');
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
     * @param  {String|Object} `world` World object or id.
     * @param  {String|Object} `userid` (Optional) User object or id. If not provided, picks up user id from current session if end user is logged in.
     * @param  {String} `groupName` (Optional) Group the world exists in. If not provided, picks up group from current session if end user is logged in.
     */
    getPresenceChannel: function (world, userid, groupName) {
        var worldid = ($.isPlainObject(world) && world.id) ? world.id : world;
        if (!worldid) {
            throw new Error('Please specify a world id');
        }
        userid = getFromSettingsOrSessionOrError(userid, 'userId');
        groupName = getFromSettingsOrSessionOrError(groupName, 'groupName');

        var account = getFromSettingsOrSessionOrError('', 'account', this.options);
        var project = getFromSettingsOrSessionOrError('', 'project', this.options);

        var baseTopic = ['/users', account, project, groupName, worldid].join('/');
        var channel = __super.getChannel.call(this, { base: baseTopic });

        var lastPingTime = { };

        var PING_INTERVAL = 6000;
        channel.subscribe('internal-ping-channel', function (notification) {
            var incomingUserId = notification.data.user;
            if (!lastPingTime[incomingUserId] && incomingUserId !== userid) {
                channel.trigger.call(channel, 'presence', { userId: incomingUserId, online: true });
            }
            lastPingTime[incomingUserId] = (new Date()).valueOf();
        });

        setInterval(function () {
            channel.publish('internal-ping-channel', { user: userid });

            $.each(lastPingTime, function (key, value) {
                var now = (new Date()).valueOf();
                if (value && value + (PING_INTERVAL * 2) < now) {
                    lastPingTime[key] = null;
                    channel.trigger.call(channel, 'presence', { userId: key, online: false });
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
     *     var gc = cm.getDataChannel('survey-responses');
     *     gc.subscribe('', function(data, meta) {
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
     * @param  {String} `collection` Name of collection whose automatic notifications you want to receive.
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

},{"../service/url-config-service":33,"../util/inherit":41,"./auth-manager":7,"./channel-manager":8}],10:[function(require,module,exports){
'use strict';

module.exports = {
    EPI_COOKIE_KEY: 'epicenter.project.token',
    EPI_SESSION_KEY: 'epicenter.user.session',
    STRATEGY_SESSION_KEY: 'epicenter-scenario'
};
},{}],11:[function(require,module,exports){
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
     * @param {Object} `runServiceOptions` The options object to configure the Run Service. See [Run API Service](../run-api-service/) for more.
     */
    reset: function (runServiceOptions) {
        return this.strategy.reset(runServiceOptions);
    }
};

module.exports = RunManager;

},{"../service/run-api-service":31,"./run-strategies/strategies-map":20,"./special-operations":22}],12:[function(require,module,exports){
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

},{"../../util/inherit":41,"./conditional-creation-strategy":13}],13:[function(require,module,exports){
'use strict';

var makeSeq = require('../../util/make-sequence');
var Base = require('./identity-strategy');
var SessionStore = require('../../store/store-factory');
var classFrom = require('../../util/inherit');
var UrlService = require('../../service/url-config-service');
var AuthManager = require('../auth-manager');

var sessionStore = new SessionStore({});
var urlService = new UrlService();
var keyNames = require('../key-names');

var defaults = {
    sessionKey: keyNames.STRATEGY_SESSION_KEY,
    path: ''
};

function setRunInSession(sessionKey, run, path) {
    if (!path) {
        if (!urlService.isLocalhost()) {
            path = '/' + [urlService.appPath, urlService.accountPath, urlService.projectPath].join('/');
            // make sure we don't get consecuteive '/' so we have a valid path for the session
            path = path.replace(/\/{2,}/g,'/');
        } else {
            path = '';
        }
    }
    // set the seesionKey for the run
    sessionStore.set(sessionKey, JSON.stringify({ runId: run.id }), { root: path });
}

/**
* Conditional Creation Strategy
* This strategy will try to get the run stored in the cookie and
* evaluate if needs to create a new run by calling the 'condition' function
*/

/* jshint eqnull: true */
var Strategy = classFrom(Base, {
    constructor: function Strategy(runService, condition, options) {

        if (condition == null) {
            throw new Error('Conditional strategy needs a condition to createte a run');
        }

        this._auth = new AuthManager();
        this.run = makeSeq(runService);
        this.condition = typeof condition !== 'function' ? function () { return condition; } : condition;
        this.options = $.extend(true, {}, defaults, options);
        this.runOptions = this.options.run;
    },

    runOptionsWithScope: function () {
        var userSession = this._auth.getCurrentUserSessionInfo();
        return $.extend({
            scope: { group: userSession.groupName }
        }, this.runOptions);
    },

    reset: function (runServiceOptions) {
        var _this = this;
        var opt = this.runOptionsWithScope();

        return this.run
                .create(opt, runServiceOptions)
            .then(function (run) {
                setRunInSession(_this.options.sessionKey, run, _this.options.path);
                run.freshlyCreated = true;
                return run;
            })
            .start();
    },

    getRun: function () {
        var runSession = JSON.parse(sessionStore.get(this.options.sessionKey));

        if (runSession && runSession.runId) {
            return this._loadAndCheck(runSession);
        } else {
            return this.reset();
        }
    },

    _loadAndCheck: function (runSession) {
        var shouldCreate = false;
        var _this = this;

        return this.run
            .load(runSession.runId, null, {
                success: function (run, msg, headers) {
                    shouldCreate = _this.condition.call(_this, run, headers);
                }
            })
            .then(function (run) {
                if (shouldCreate) {
                    var opt = _this.runOptionsWithScope();
                    // we need to do this, on the original runService (ie not sequencialized)
                    // so we don't get in the middle of the queue
                    return _this.run.original.create(opt)
                    .then(function (run) {
                        setRunInSession(_this.options.sessionKey, run);
                        run.freshlyCreated = true;
                        return run;
                    });
                }

                return run;
            })
            .start();
    }
});

module.exports = Strategy;

},{"../../service/url-config-service":33,"../../store/store-factory":38,"../../util/inherit":41,"../../util/make-sequence":42,"../auth-manager":7,"../key-names":10,"./identity-strategy":14}],14:[function(require,module,exports){
'use strict';

var classFrom = require('../../util/inherit');
var Base = {};

// Interface that all strategies need to implement
module.exports = classFrom(Base, {
    constructor: function (runService, options) {
        this.runService  = runService;
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

},{"../../util/inherit":41}],15:[function(require,module,exports){
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
        var _this = this;
        var dtd = $.Deferred();

        if (!curUserId) {
            return dtd.reject({ statusCode: 400, error: 'We need an authenticated user to join a multiplayer world. (ERR: no userId in session)' }, session).promise();
        }

        var loadRunFromWorld = function (world) {
            if (!world) {
                return dtd.reject({ statusCode: 404, error: 'The user is not in any world.' }, { options: this.options, session: session });
            }

            return worldApi.getCurrentRunId({ model: model, filter: world.id })
                .then(_this._loadRun)
                .then(dtd.resolve)
                .fail(dtd.reject);
        };

        var serverError = function (error) {
            // is this possible?
            dtd.reject(error, session, this.options);
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

},{"../../service/world-api-adapter":36,"../../util/inherit":41,"../auth-manager":7,"./identity-strategy":14}],16:[function(require,module,exports){
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

},{"../../util/inherit":41,"./conditional-creation-strategy":13}],17:[function(require,module,exports){
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

},{"../../util/inherit":41,"./conditional-creation-strategy":13}],18:[function(require,module,exports){
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

},{"../../util/inherit":41,"./conditional-creation-strategy":13}],19:[function(require,module,exports){
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
        var _this = this;
        var shouldReplay = false;

        return this.run.load(latestRun.id, null, {
            success: function (run, msg, headers) {
                shouldReplay = headers.getResponseHeader('pragma') === 'persistent';
            }
        }).then(function (run) {
            return shouldReplay ? _this._restoreRun(run.id) : run;
        });
    },

    _restoreRun: function (runId) {
        var _this = this;
        return this.stateApi.replay({ runId: runId })
            .then(function (resp) {
                return _this._loadRun(resp.run);
            });
    },

    _loadRun: function (id, options) {
        return this.run.load(id, null, options);
    }

});

module.exports = Strategy;

},{"../../service/state-api-adapter":32,"../../store/store-factory":38,"../../util/inherit":41,"../auth-manager":7,"../key-names":10,"./identity-strategy":14}],20:[function(require,module,exports){
module.exports = {
    'new-if-initialized': require('./new-if-initialized-strategy'),
    'new-if-persisted': require('./new-if-persisted-strategy'),
    'new-if-missing': require('./new-if-missing-strategy'),
    'always-new': require('./always-new-strategy'),
    'multiplayer': require('./multiplayer-strategy'),
    'persistent-single-player': require('./persistent-single-player-strategy'),
    'none': require('./identity-strategy')
};

},{"./always-new-strategy":12,"./identity-strategy":14,"./multiplayer-strategy":15,"./new-if-initialized-strategy":16,"./new-if-missing-strategy":17,"./new-if-persisted-strategy":18,"./persistent-single-player-strategy":19}],21:[function(require,module,exports){
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
            return new RunService($.extend(true, {},  this.options, { filter: run }));
        }

        if (typeof run === 'object' && run instanceof RunService) {
            return run;
        }

        throw new Error('Save method requires a run service or a runId');
    },

    getRun: function (runId) {
        return new RunService($.extend(true, {},  this.options, { filter: runId }));
    }
};

module.exports = ScenarioManager;


},{"../service/run-api-service":31}],22:[function(require,module,exports){
'use strict';


module.exports = {
    reset: function (params, options, manager) {
        return manager.reset(options);
    }
};

},{}],23:[function(require,module,exports){
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
var RunManager =  require('./run-manager');
var AuthManager = require('./auth-manager');
var worldApi;

// var defaults = {
//  account: '',
//  project: '',
//  group: '',
//  transport: {
//  }
// };


function buildStrategy(worldId, dtd) {

    return function Ctor(runService, options) {
        this.runService = runService;
        this.options = options;

        $.extend(this, {
            reset: function () {
                throw new Error('not implementd. Need api changes');
            },

            getRun: function () {
                var _this = this;
                //get or create!
                // Model is required in the options
                var model = this.options.run.model || this.options.model;
                return worldApi.getCurrentRunId({ model: model, filter: worldId })
                    .then(function (runId) {
                        return _this.runService.load(runId);
                    })
                    .then(function (run) {
                        dtd.resolve.call(this, run, _this.runService);
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
    var _this = this;

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
        * @param {string} `userId` (Optional) The id of the user whose world is being accessed. Defaults to the user in the current session.
        * @param {string} `groupName` (Optional) The name of the group whose world is being accessed. Defaults to the group for the user in the current session.
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
        * @param {string} `model` (Optional) The name of the model file. Required if not already passed in as `run.model` when the World Manager is created.
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
                var runOpts = $.extend(true, _this.options, { model: model });
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

},{"../service/world-api-adapter":36,"./auth-manager":7,"./run-manager":11}],24:[function(require,module,exports){
/**
 * ##File API Service
 *
 * This is used to upload/download files directly onto Epicenter, analogous to using the File Manager UI in Epicenter directly or SFTPing files in. The Asset API is typically used for all project use-cases, and it's unlikely this File Service will be used directly except by Admin tools (e.g. Flow Inspector).
 *
 * Partially implemented.
 */

'use strict';

var ConfigService = require('./configuration-service');
var StorageFactory = require('../store/store-factory');
var TransportFactory = require('../transport/http-transport-factory');

module.exports = function (config) {
    // config || (config = configService.get());
    var store = new StorageFactory({ synchronous: true });

    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
         token: store.get('epicenter.project.token') || store.get('epicenter.token') || '',

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string.
         * @type {String}
         */
        account: '',

        /**
         * The project id. Defaults to empty string.
         * @type {String}
         */
        project: '',


        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {Object}
         */
        transport: {}
    };

    var serviceOptions = $.extend({}, defaults, config);
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
            'Authorization': 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(httpOptions);

    var publicAsyncAPI = {
        /**
         * Get a directory listing, or contents of a file
         * @param  {String} `filePath`   Path to the file
         * @param  {String} `folderType` One of Model|Static|Node
         * @param  {Object} `options` (Optional) Overrides for configuration options.
         */
        getContents: function (filePath, folderType, options) {
            var path = folderType + '/' + filePath;
            var httpOptions = $.extend(true, {}, serviceOptions, options, {
                url: urlConfig.getAPIPath('file') + path
            });
            return http.get('', httpOptions);
        }
    };

    $.extend(this, publicAsyncAPI);
};

},{"../store/store-factory":38,"../transport/http-transport-factory":40,"./configuration-service":28}],25:[function(require,module,exports){
/**
 * ##Asset API Adapter
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
var StorageFactory = require('../store/store-factory');
// var qutil = require('../util/query-util');
var TransportFactory = require('../transport/http-transport-factory');
var _pick = require('../util/object-util')._pick;
var keyNames = require('../managers/key-names');

var apiEndpoint = 'asset';

module.exports = function (config) {
    var store = new StorageFactory({ synchronous: true });
    var session = JSON.parse(store.get(keyNames.EPI_SESSION_KEY) || '{}');
    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: store.get(keyNames.EPI_COOKIE_KEY) || '',
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
        group: session.groupName,
        /**
         * The user id. Defaults to session's `userId`.
         * @type {String}
         */
        userId: session.userId,
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
    var serviceOptions = $.extend(true, {}, defaults, config);
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
            'Authorization': 'Bearer ' + serviceOptions.token
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
    // @param {string} `method` (Required) HTTP verb
    // @param {string} `filename` (Required) Name of the file to delete/replace/create
    // @param {object} `params` (Optional) Body parameters to send to the Asset API
    // @param {object} `options` (Optional) Options object to override global options.
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
        * @param {string} `filename` (Required) Name of the file to create.
        * @param {object} `params` (Optional) Body parameters to send to the Asset API. Required if the `options.transport.contentType` is `application/json`, otherwise ignored.
        * @param {string} `params.encoding` Either `HEX` or `BASE_64`. Required if `options.transport.contentType` is `application/json`.
        * @param {string} `params.data` The encoded data for the file. Required if `options.transport.contentType` is `application/json`.
        * @param {string} `params.contentType` The mime type of the file. Optional.
        * @param {object} `options` (Optional) Options object to override global options.
        *
        */
        create: function (filename, params, options) {
            return upload('post', filename, params, options);
        },

        /**
        * Gets a file from the Asset API, fetching the asset content. (To get a list
        * of the assets in a scope, use `list()`.)
        *
        *  **Parameters**
        * @param {string} `filename` (Required) Name of the file to retrieve.
        * @param {object} `options` (Optional) Options object to override global options.
        *
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
        * @param {object} `options` (Optional) Options object to override global options.
        * @param {string} `options.scope` (Optional) The scope (`user`, `group`, `project`).
        * @param {boolean} `options.fullUrl` (Optional) Determines if the list of assets in a scope includes the complete URL for each asset (`true`), or only the file names of the assets (`false`).
        *
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
                    dtd.resolve(fullPathFiles, me);
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
        * @param {string} `filename` (Required) Name of the file being replaced.
        * @param {object} `params` (Optional) Body parameters to send to the Asset API. Required if the `options.transport.contentType` is `application/json`, otherwise ignored.
        * @param {string} `params.encoding` Either `HEX` or `BASE_64`. Required if `options.transport.contentType` is `application/json`.
        * @param {string} `params.data` The encoded data for the file. Required if `options.transport.contentType` is `application/json`.
        * @param {string} `params.contentType` The mime type of the file. Optional.
        * @param {object} `options` (Optional) Options object to override global options.
        *
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
        * @param {string} `filename` (Required) Name of the file to delete.
        * @param {object} `options` (Optional) Options object to override global options.
        *
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

},{"../managers/key-names":10,"../store/store-factory":38,"../transport/http-transport-factory":40,"../util/object-util":43,"./configuration-service":28}],26:[function(require,module,exports){
/**
 *
 * ##Authentication API Service
 *
 * The Authentication API Service provides methods for logging in and logging out. On login, this service creates and returns a user access token.
 *
 * User access tokens are required for each call to Epicenter. (See [Project Access](../../../project_access/) for more information.)
 *
 * If you need additional functionality -- such as tracking session information, easily retrieving the user token, or getting the groups to which an end user belongs -- consider using the [Authorization Manager](../auth-manager/) instead.
 *
 *      var auth = new F.service.Auth();
 *      auth.login({ userName: 'jsmith@acmesimulations.com',
 *                  password: 'passw0rd' });
 *      auth.logout();
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
         * @param {Object} `options` (Optional) Overrides for configuration options.
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

        /**
         * Logs user out from specified accounts.
         * Epicenter logout is not implemented yet, added a dummy promise that gets automatically resolved.
         *
         * **Example**
         *
         *      auth.logout();
         *
         * **Parameters**
         * @param {Object} `options` (Optional) Overrides for configuration options.
         */
        logout: function (options) {
            var dtd = $.Deferred();
            dtd.resolve();
            return dtd.promise();
        }
    };

    $.extend(this, publicAPI);
};

},{"../transport/http-transport-factory":40,"./configuration-service":28}],27:[function(require,module,exports){
'use strict';

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
    var newName = (channelName ? (channelName + '/' + topic) : topic).replace(/\/\//g, '/').replace(/\/$/,'');
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
     * @param  {String|Array}   `topic`    List of topics to listen for changes on.
     * @param  {Function} `callback` Callback function to execute. Callback is called with signature `(evt, payload, metadata)`.
     * @param  {Object}   `context`  Context in which the `callback` is executed.
     * @param  {Object}   `options`  (Optional) Overrides for configuration options.
     * @param  {Number}   `options.priority`  Used to control order of operations. Defaults to 0. Can be any +ve or -ve number.
     * @param  {String|Number|Function}   `options.value` The `callback` is only triggered if this condition matches. See examples for details.
     *
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
     * @param  {String} `topic` Topic to publish to.
     * @param  {*} `data`  Data to publish to topic.
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
     * @param  {String} `token` The token for topic is returned when you initially subscribe. Pass it here to unsubscribe from that topic.
     */
    unsubscribe: function (token) {
        this.channelOptions.transport.unsubscribe(token);
        return token;
    },

    /**
     * Start listening for events on this instance. Signature is same as for jQuery Events: http://api.jquery.com/on/.
     *
     * Supported events are: `connect`, `disconnect`, `subscribe`, `unsubscribe`, `publish`, `error`.
     *
     * **Parameters**
     *
     * @param {string} `event` The event type. See more detail at jQuery Events: http://api.jquery.com/on/.
     */
    on: function (event) {
        $(this).on.apply($(this), arguments);
    },

    /**
     * Stop listening for events on this instance. Signature is same as for jQuery Events: http://api.jquery.com/off/.
     *
     * **Parameters**
     *
     * @param {string} `event` The event type. See more detail at jQuery Events: http://api.jquery.com/off/.
     */
    off: function (event) {
        $(this).off.apply($(this), arguments);
    },

    /**
     * Trigger events and execute handlers. Signature is same as for jQuery Events: http://api.jquery.com/trigger/.
     *
     * **Parameters**
     *
     * @param {string} `event` The event type. See more detail at jQuery Events: http://api.jquery.com/trigger/.
     */
    trigger: function (event) {
        $(this).trigger.apply($(this), arguments);
    }

});

module.exports = Channel;

},{}],28:[function(require,module,exports){
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


},{"./url-config-service":33}],29:[function(require,module,exports){
/**
 * ##Data API Service
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
var StorageFactory = require('../store/store-factory');
var qutil = require('../util/query-util');
var TransportFactory = require('../transport/http-transport-factory');

module.exports = function (config) {
    var store = new StorageFactory({ synchronous: true });

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
        account: '',

        /**
         * The project id. Defaults to empty string. If left undefined, taken from the URL.
         * @type {String}
         */
        project: '',

        /**
         * For operations that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: store.get('epicenter.project.token') || '',

        domain: 'forio.com',

        //Options to pass on to the underlying transport layer
        transport: {}
    };
    var serviceOptions = $.extend({}, defaults, config);

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
            url+= qutil.addTrailingSlash(key);
        }
        return url;
    };

    var httpOptions = $.extend(true, {}, serviceOptions.transport, {
        url: getURL
    });
    if (serviceOptions.token) {
        httpOptions.headers = {
            'Authorization': 'Bearer ' + serviceOptions.token
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
         * @param {String} `key` The name of the document to search. Pass the empty string ('') to search the entire collection.
         * @param {Object} `query` The query object. For exact matching, this object contains the field name and field value to match. For matching based on comparison, this object contains the field name and the comparison expression. For matching based on logical operators, this object contains an expression using MongoDB syntax. See the underlying [Data API](../../../rest_apis/data_api/#searching) for additional examples.
         * @param {Object} `outputModifier` (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} `options` (Optional) Overrides for configuration options.
         *
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
         * @param {String|Object} `key` If `key` is a string, it is the id of the element to save (create) in this document. If `key` is an object, the object is the data to save (create) in this document. In both cases, the id for the document is generated automatically.
         * @param {Object} `value` (Optional) The data to save. If `key` is a string, this is the value to save. If `key` is an object, the value(s) to save are already part of `key` and this argument is not required.
         * @param {Object} `options` (Optional) Overrides for configuration options.
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
         * @param {String} `key` Id of the document.
         * @param {Object} `value` (Optional) The data to save, in key:value pairs.
         * @param {Object} `options` (Optional) Overrides for configuration options.
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
         * @param  {String|Object} `key` The id of the data to return. Can be the id of a document, or a path to data within that document.
         * @param {Object} `outputModifier` (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} `options` Overrides for configuration options.
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
         * @param {String|Array} `keys` The id of the document to remove from this collection, or an array of such ids.
         * @param {Object} `options` (Optional) Overrides for configuration options.
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

},{"../store/store-factory":38,"../transport/http-transport-factory":40,"../util/query-util":44,"./configuration-service":28}],30:[function(require,module,exports){
/**
 *
 * ##Member API Adapter
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
var _pick = require('../util/object-util')._pick;
var apiEndpoint = 'member/local';

module.exports = function (config) {
    var defaults = {
        /**
         * Epicenter user id. Defaults to a blank string.
         * @type {string}
         */
        userId: '',

        /**
         * Epicenter group id. Defaults to a blank string. Note that this is the group *id*, not the group *name*.
         * @type {string}
         */
        groupId: '',

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {object}
         */
        transport: {}
    };
    var serviceOptions = $.extend({}, defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            'Authorization': 'Bearer ' + serviceOptions.token
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
        * @param {string|object} `params` The user id for the end user. Alternatively, an object with field `userId` and value the user id.
        * @param {object} `options` (Optional) Overrides for configuration options.
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
        * @param {string|object} `params` The group id. Alternatively, an object with field `groupId` and value the group id.
        * @param {object} `options` (Optional) Overrides for configuration options.
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
        * @param {object} `params` The end user and group information.
        * @param {string} `params.userId` The id of the end user to make active.
        * @param {string} `params.groupId` The id of the group to which this end user belongs, and in which the end user should become active.
        * @param {object} `options` (Optional) Overrides for configuration options.
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
        * @param {object} `params` The end user and group information.
        * @param {string} `params.userId` The id of the end user to make inactive.
        * @param {string} `params.groupId` The id of the group to which this end user belongs, and in which the end user should become inactive.
        * @param {object} `options` (Optional) Overrides for configuration options.
        */
        makeUserInactive: function (params, options) {
            return patchUserActiveField(params, false, options);
        }
    };

    $.extend(this, publicAPI);
};

},{"../transport/http-transport-factory":40,"../util/object-util":43,"./configuration-service":28}],31:[function(require,module,exports){
/**
 *
 * ##Run API Service
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
var StorageFactory = require('../store/store-factory');
var qutil = require('../util/query-util');
var rutil = require('../util/run-util');
var _pick = require('../util/object-util')._pick;
var TransportFactory = require('../transport/http-transport-factory');
var VariablesService = require('./variables-api-service');

module.exports = function (config) {
    // config || (config = configService.get());
    var store = new StorageFactory({ synchronous: true });

    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: store.get('epicenter.project.token') || store.get('epicenter.token') || '',

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string. If left undefined, taken from the URL.
         * @type {String}
         */
        account: '',

        /**
         * The project id. Defaults to empty string. If left undefined, taken from the URL.
         * @type {String}
         */
        project: '',

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

    var serviceOptions = $.extend({}, defaults, config);
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
            'Authorization': 'Bearer ' + serviceOptions.token
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
         * @param {String|Object} `params` If a string, the name of the primary [model file](../../../writing_your_model/). This is the one file in the project that explicitly exposes variables and methods, and it must be stored in the Model folder of your Epicenter project. If an object, may include `model`, `scope`, and `files`. (See the [Run Manager](../run_manager/) for more information on `scope` and `files`.)
         * @param {Object} `options` (Optional) Overrides for configuration options.
         *
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
         * @param {Object} `qs` Query object. Each key can be a property of the run or the name of variable that has been saved in the run (prefaced by `variables.`). Each value can be a literal value, or a comparison operator and value. (See [more on filtering](../../../rest_apis/aggregate_run_api/#filters) allowed in the underlying Run API.) Querying for variables is available for runs [in memory](../../../run_persistence/#runs-in-memory) and for runs [in the database](../../../run_persistence/#runs-in-memory) if the variables are persisted (e.g. that have been `record`ed in your Julia model).
         * @param {Object} `outputModifier` (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} `options` (Optional) Overrides for configuration options.
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
         * @param {Object} `filter` Filter object. Each key can be a property of the run or the name of variable that has been saved in the run (prefaced by `variables.`). Each value can be a literal value, or a comparison operator and value. (See [more on filtering](../../../rest_apis/aggregate_run_api/#filters) allowed in the underlying Run API.) Filtering for variables is available for runs [in memory](../../../run_persistence/#runs-in-memory) and for runs [in the database](../../../run_persistence/#runs-in-memory) if the variables are persisted (e.g. that have been `record`ed in your Julia model).
         * @param {Object} `outputModifier` (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} `options` (Optional) Overrides for configuration options.
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
         * @param {String} `runID` The run id.
         * @param {Object} `filters` (Optional) Object containing filters and operation modifiers. Use key `include` to list model variables that you want to include in the response. Other available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} `options` (Optional) Overrides for configuration options.
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
         * @param {Object} `attributes` The run data and variables to save.
         * @param {Object} `attributes.variables` Model variables must be included in a `variables` field within the `attributes` object. (Otherwise they are treated as run data and added to the run record directly.)
         * @param {Object} `options` (Optional) Overrides for configuration options.
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
         * The `params` argument is normally an array of arguments to the `operation`. In the special case where `operation` only takes one argument, you are not required to put that argument into an array.
         *
         * Note that you can combine the `operation` and `params` arguments into a single object if you prefer, as in the last example.
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
         * @param {String} `operation` Name of method.
         * @param {Array} `params` (Optional) Any parameters the operation takes, passed as an array. In the special case where `operation` only takes one argument, you are not required to put that argument into an array, and can just pass it directly.
         * @param {Object} `options` (Optional) Overrides for configuration options.
         */
        do: function (operation, params, options) {
            // console.log('do', operation, params);
            var opsArgs;
            var postOptions;
            if (options) {
                opsArgs = params;
                postOptions = options;
            } else {
                if ($.isPlainObject(params)) {
                    opsArgs = null;
                    postOptions = params;
                } else {
                    opsArgs = params;
                }
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
         * @param {Array} `operations` If none of the methods take parameters, pass an array of the method names (strings). If any of the methods do take parameters, pass an array of objects, each of which contains a method name and its own (possibly empty) array of parameters.
         * @param {*} `params` Parameters to pass to operations.
         * @param {Object} `options` (Optional) Overrides for configuration options.
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
         * @param {Array|Object} `operations` If none of the methods take parameters, pass an array of the method names (as strings). If any of the methods do take parameters, you have two options. You can pass an array of objects, each of which contains a method name and its own (possibly empty) array of parameters. Alternatively, you can pass a single object with the method name and a (possibly empty) array of parameters.
         * @param {*} `params` Parameters to pass to operations.
         * @param {Object} `options` (Optional) Overrides for configuration options.
         */
        parallel: function (operations, params, options) {
            var $d = $.Deferred();

            var opParams = rutil.normalizeOperations(operations, params);
            var ops = opParams.ops;
            var args = opParams.args;
            var postOptions = $.extend(true, {}, serviceOptions, options);

            var queue  = [];
            for (var i = 0; i< ops.length; i++) {
                queue.push(
                    this.do(ops[i], args[i])
                );
            }
            $.when.apply(this, queue)
                .done(function () {
                    $d.resolve.apply(this, arguments);
                    postOptions.success.apply(this.arguments);
                })
                .fail(function () {
                    $d.reject.apply(this, arguments);
                    postOptions.error.apply(this.arguments);
                });

            return $d.promise();
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
          * @param {Object} `config` (Optional) Overrides for configuration options.
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

},{"../store/store-factory":38,"../transport/http-transport-factory":40,"../util/object-util":43,"../util/query-util":44,"../util/run-util":45,"./configuration-service":28,"./variables-api-service":35}],32:[function(require,module,exports){
'use strict';
/**
 * ##State API Adapter
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
var apiEndpoint = 'model/state';

module.exports = function (config) {

    var defaults = {

    };

    var serviceOptions = $.extend({}, defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            'Authorization': 'Bearer ' + serviceOptions.token
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
        * @param {object} `params` Parameters object.
        * @param {string} `params.runId` The id of the run to bring back to memory.
        * @param {string} `params.stopBefore` (Optional) The run is advanced only up to the first occurrence of this method.
        * @param {array} `params.exclude` (Optional) Array of methods to exclude when advancing the run.
        * @param {object} `options` (Optional) Overrides for configuration options.
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
        * @param {object} `params` Parameters object.
        * @param {string} `params.runId` The id of the run to clone from memory.
        * @param {string} `params.stopBefore` (Optional) The newly cloned run is advanced only up to the first occurrence of this method.
        * @param {array} `params.exclude` (Optional) Array of methods to exclude when advancing the newly cloned run.
        * @param {object} `options` (Optional) Overrides for configuration options.
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

},{"../transport/http-transport-factory":40,"../util/object-util":43,"./configuration-service":28}],33:[function(require,module,exports){
'use strict';

var epiVersion = require('../api-version.json');

module.exports = function (config) {
    //TODO: urlutils to get host, since no window on node

    var API_PROTOCOL = 'https';
    var HOST_API_MAPPING = {
        'forio.com': 'api.forio.com',
        'foriodev.com': 'api.epicenter.foriodev.com'
    };

    var publicExports = {
        protocol: API_PROTOCOL,

        api: '',

        host: (function () {
            var host = window.location.host;
            if (!host || host.indexOf('local') !== -1) {
                host = 'forio.com';
            }
            return (HOST_API_MAPPING[host]) ? HOST_API_MAPPING[host] : 'api.' + host;
        }()),

        appPath: (function () {
            var path = window.location.pathname.split('\/');

            return path && path[1] || '';
        }()),

        accountPath: (function () {
            var accnt = '';
            var path = window.location.pathname.split('\/');
            if (path && path[1] === 'app') {
                accnt = path[2];
            }
            return accnt;
        }()),

        projectPath: (function () {
            var prj = '';
            var path = window.location.pathname.split('\/');
            if (path && path[1] === 'app') {
                prj = path[3];
            }
            return prj;
        }()),

        versionPath: (function () {
            var version = epiVersion.version ? epiVersion.version + '/' : '';
            return version;
        }()),

        isLocalhost: function () {
            var host = window.location.host;
            return (!host || host.indexOf('local') !== -1);
        },

        getAPIPath: function (api) {
            var PROJECT_APIS = ['run', 'data', 'file'];

            var apiPath = this.protocol + '://' + this.host + '/' + this.versionPath + api + '/';

            if ($.inArray(api, PROJECT_APIS) !== -1) {
                apiPath += this.accountPath + '/' + this.projectPath  + '/';
            }
            return apiPath;
        }
    };

    $.extend(publicExports, config);
    return publicExports;
};

},{"../api-version.json":5}],34:[function(require,module,exports){
'use strict';
/**
* ##User API Adapter
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
* The constructor takes an optional `options` parameter in which you can specify the `account` and `token` if they are not already available in the current context.
*/

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var qutil = require('../util/query-util');

module.exports = function (config) {
    var defaults = {

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string.
         * @type {String}
         */
       account: '',

        /**
         * The access token to use when searching for end users. (See [more background on access tokens](../../../project_access/)).
         * @type {String}
         */
       token: '',

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {Object}
         */
        transport: {}
    };

    var serviceOptions = $.extend({}, defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');
    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath('user')
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            'Authorization': 'Bearer ' + serviceOptions.token
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
        * @param {object} `filter` Object with field `userName` and value of the username. Alternatively, object with field `id` and value of an array of user ids.
        * @param {object} `options` (Optional) Overrides for configuration options.
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
        * @param {string} `userId` The user id for the end user in your team.
        * @param {object} `options` (Optional) Overrides for configuration options.
        */

        getById: function (userId, options) {
            return publicAPI.get({ id: userId }, options);
        }
    };

    $.extend(this, publicAPI);
};





},{"../transport/http-transport-factory":40,"../util/query-util":44,"./configuration-service":28}],35:[function(require,module,exports){
/**
 *
 * ##Variables API Service
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
            'Authorization': 'Bearer ' + serviceOptions.token
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
         * @param {String} `variable` Name of variable to load.
         * @param {Object} `outputModifier` (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} `options` (Optional) Overrides for configuration options.
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
         * @param {Object|Array} `query` The names of the variables requested.
         * @param {Object} `outputModifier` (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} `options` (Optional) Overrides for configuration options.
         *
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
         * @param {Object|String} `variable` An object composed of the model variables and the values to save. Alternatively, a string with the name of the variable.
         * @param {Object} `val` (Optional) If passing a string for `variable`, use this argument for the value to save.
         * @param {Object} `options` (Optional) Overrides for configuration options.
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

},{"../transport/http-transport-factory":40,"../util/run-util":45}],36:[function(require,module,exports){
/**
 * ##World API Adapter
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
var StorageFactory = require('../store/store-factory');
// var qutil = require('../util/query-util');
var TransportFactory = require('../transport/http-transport-factory');
var _pick = require('../util/object-util')._pick;

var apiBase = 'multiplayer/';
var assignmentEndpoint = apiBase + 'assign';
var apiEndpoint = apiBase + 'world';
var projectEndpoint = apiBase + 'project';

module.exports = function (config) {
    var store = new StorageFactory({ synchronous: true });

    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
       token: store.get('epicenter.project.token') || '',

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

    var serviceOptions = $.extend({}, defaults, config);
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
            'Authorization': 'Bearer ' + serviceOptions.token
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
        * @param {object} `params` Parameters to create the world.
        * @param {string} `params.group` (Optional) The **Group Name** to create this world under. Only end users in this group are eligible to join the world. Optional here; required when instantiating the service (`new F.service.World()`).
        * @param {object} `params.roles` (Optional) The list of roles (strings) for this world. Some worlds have specific roles that **must** be filled by end users. Listing the roles allows you to autoassign users to worlds and ensure that all roles are filled in each world.
        * @param {object} `params.optionalRoles` (Optional) The list of optional roles (strings) for this world. Some worlds have specific roles that **may** be filled by end users. Listing the optional roles as part of the world object allows you to autoassign users to worlds and ensure that all roles are filled in each world.
        * @param {integer} `params.minUsers` (Optional) The minimum number of users for the world. Including this number allows you to autoassign end users to worlds and ensure that the correct number of users are in each world.
        * @param {object} `options` (Optional) Options object to override global options.
        *
        */
        create: function (params, options) {
            var createOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) });
            var worldApiParams = ['scope', 'files', 'roles', 'optionalRoles', 'minUsers', 'group', 'name'];
            // whitelist the fields that we actually can send to the api
            params = _pick(params, worldApiParams);

            // account and project go in the body, not in the url
            $.extend(params, _pick(serviceOptions, ['account', 'project', 'group']));

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
        * @param {object} `params` Parameters to update the world.
        * @param {string} `params.name` A string identifier for the linked end users, for example, "name": "Our Team".
        * @param {object} `params.roles` (Optional) The list of roles (strings) for this world. Some worlds have specific roles that **must** be filled by end users. Listing the roles allows you to autoassign users to worlds and ensure that all roles are filled in each world.
        * @param {object} `params.optionalRoles` (Optional) The list of optional roles (strings) for this world. Some worlds have specific roles that **may** be filled by end users. Listing the optional roles as part of the world object allows you to autoassign users to worlds and ensure that all roles are filled in each world.
        * @param {integer} `params.minUsers` (Optional) The minimum number of users for the world. Including this number allows you to autoassign end users to worlds and ensure that the correct number of users are in each world.
        * @param {object} `options` (Optional) Options object to override global options.
        *
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
        * @param {String|Object} `options` (Optional) The id of the world to delete, or options object to override global options.
        *
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
        * @param {object} `config` The configuration object to use in updating existing configuration.
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
        * @param {object} `options` (Optional) Options object to override global options.
        *
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
        * @param {string} `userId` The `userId` of the user whose worlds are being retrieved.
        * @param {object} `options` (Optional) Options object to override global options.
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
         * @param {String} `worldId` The id of the world to load.
         * @param {Object} `options` (Optional) Options object to override global options.
         */
        load: function (worldId, options) {
            if (worldId) {
                serviceOptions.filter = worldId;
            }
            if (!serviceOptions.filter) {
                throw new Error('Please provide a worldid to load');
            }
            var httpOptions = $.extend(true, {}, serviceOptions, options,  { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/' });
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
        * @param {string|object|array} `users` User id, array of user ids, object, or array of objects of the users to add to this world.
        * @param {string} `users.role` The `role` the user should have in the world. It is up to the caller to ensure, if needed, that the `role` passed in is one of the `roles` or `optionalRoles` of this world.
        * @param {string} `worldId` The world to which the users should be added. If not specified, the filter parameter of the `options` object is used.
        * @param {object} `options` (Optional) Options object to override global options.
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
        * @param {object} `user` User object with `userId` and the new `role`.
        * @param {object} `options` (Optional) Options object to override global options.
        *
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
        * @param {object|string} `user` The `userId` of the user to remove from the world, or an object containing the `userId` field.
        * @param {object} `options` (Optional) Options object to override global options.
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
        * @param {object} `options` (Optional) Options object to override global options.
        * @param {object} `options.model` The model file to use to create a run if needed.
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
        * @param {string} `userId` The `userId` of the user whose current (most recent) world is being retrieved.
        * @param {string} `groupName` (Optional) The name of the group. If not provided, defaults to the group used to create the service.
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
                        serviceOptions.filter =  currentWorld.id;
                    }

                    dtd.resolve(currentWorld, me);
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
        * @param {string} `worldId` The `worldId` of the world from which the current run is being deleted.
        * @param {object} `options` (Optional) Options object to override global options.
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
        * @param {string} `worldId` worldId in which we create the new run.
        * @param {object} `options` (Optional) Options object to override global options.
        * @param {object} `options.model` The model file to use to create a run if needed.
        */
        newRunForWorld: function (worldId, options) {
            var currentRunOptions = $.extend(true, {},
                options,
                { filter: worldId || serviceOptions.filter }
            );
            var _this = this;

            validateModelOrThrowError(currentRunOptions);

            return this.deleteRun(worldId, options)
                .then(function () {
                    return _this.getCurrentRunId(currentRunOptions);
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
        * @param {object} `options` (Optional) Options object to override global options.
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
        * @param {object} `options` (Optional) Options object to override global options.
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

},{"../store/store-factory":38,"../transport/http-transport-factory":40,"../util/object-util":43,"./configuration-service":28}],37:[function(require,module,exports){
/**
 * @class Cookie Storage Service
 *
 * @example
 *      var people = require('cookie-store')({ root: 'people' });
        people
            .save({lastName: 'smith' })

 */


'use strict';

module.exports = function (config) {
    var defaults = {
        /**
         * Name of collection
         * @type { string}
         */
        root: '/',

        domain: '.forio.com'
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

            document.cookie = encodeURIComponent(key) + '=' +
                                encodeURIComponent(value) +
                                (domain ? '; domain=' + domain : '') +
                                (path ? '; path=' + path : '');

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
            var cookieReg = new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(key).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$');
            var val = document.cookie.replace(cookieReg, '$1');
            val = decodeURIComponent(val) || null;
            return val;
        },

        /**
         * Removes key from collection
         * @param { string} key key to remove
         * @return { string} key The key removed
         *
         * @example
         *     cs.remove('person');
         */
        remove: function (key, options) {
            var remOptions = $.extend(true, {}, this.serviceOptions, options);

            var domain = remOptions.domain;
            var path = remOptions.root;

            document.cookie = encodeURIComponent(key) +
                            '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' +
                            (domain ? '; domain=' + domain : '') +
                            (path ? '; path=' + path : '');
            return key;
        },

        /**
         * Removes collection being referenced
         * @return { array} keys All the keys removed
         */
        destroy: function () {
            var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, '').split(/\s*(?:\=[^;]*)?;\s*/);
            for (var nIdx = 0; nIdx < aKeys.length; nIdx++) {
                var cookieKey = decodeURIComponent(aKeys[nIdx]);
                this.remove(cookieKey);
            }
            return aKeys;
        }
    };

    $.extend(this, publicAPI);
};

},{}],38:[function(require,module,exports){
/**
    Decides type of store to provide
*/

'use strict';
// var isNode = false; FIXME: Browserify/minifyify has issues with the next link
// var store = (isNode) ? require('./session-store') : require('./cookie-store');
var store = require('./cookie-store');

module.exports = store;

},{"./cookie-store":37}],39:[function(require,module,exports){
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
        get:function (params, ajaxOptions) {
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

},{"../util/query-util":44}],40:[function(require,module,exports){
'use strict';

// var isNode = false; FIXME: Browserify/minifyify has issues with the next link
// var transport = (isNode) ? require('./node-http-transport') : require('./ajax-http-transport');
var transport = require('./ajax-http-transport');
module.exports = transport;

},{"./ajax-http-transport":39}],41:[function(require,module,exports){
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
*/
var extend = function (dest /*, var_args*/) {
    var obj = Array.prototype.slice.call(arguments, 1);
    var current;
    for (var j = 0; j<obj.length; j++) {
        if (!(current = obj[j])) {
            continue;
        }

        // do not wrap inner in dest.hasOwnProperty or bad things will happen
        /*jshint -W089 */
        for (var key in current) {
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

},{}],42:[function(require,module,exports){
'use strict';
/*jshint loopfunc:false */

function _w(val) {
    if (val && val.then) {
        return val;
    }
    var p = $.Deferred();
    p.resolve(val);

    return p.promise();
}

function seq() {
    var list = Array.prototype.slice.apply(arguments);

    function next(p) {
        var cur = list.splice(0,1)[0];

        if (!cur) {
            return p;
        }

        return _w(cur(p)).then(next);
    }

    return function (seed) {
        return next(seed).fail(seq.fail);
    };
}

function MakeSeq(obj) {
    var res = {
        __calls: [],

        original: obj,

        then: function (fn) {
            this.__calls.push(fn);
            return this;
        },

        start: function () {
            var _this = this;

            // clean up
            this.then(function (run) {
                _this.__calls.length = 0;
                return run;
            });

            return seq.apply(null, this.__calls)();
        },

        fail: function (fn) {
            seq.fail = fn;
            return this;
        }
    };

    var funcMaker = function (p, obj) {
        var fn = obj[p].bind(obj);
        return function () {
            var args = Array.prototype.slice.apply(arguments);
            this.__calls.push(Function.bind.apply(fn, [null].concat(args)));
            return this;
        };
    };

    for (var prop in obj) {
        if (typeof obj[prop] === 'function') {
            res[prop] = funcMaker(prop, obj);
        } else {
            res[prop] = obj[prop];
        }
    }

    return res;
}

module.exports = MakeSeq;

},{}],43:[function(require,module,exports){
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

},{}],44:[function(require,module,exports){
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




},{}],45:[function(require,module,exports){
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
         * @param  {Object|Array|String} `operations` operations to perform
         * @param  {Array} `args` arguments for operation
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
                var http = this;
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
                if (params && params.include && url.length > MAX_URL_LENGTH) {
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
                    var currLength = '?include='.length;
                    var variable = include.pop();
                    while (variable) {
                        // Use a greedy approach for now, can be optimized to be solved in a more
                        // efficient way
                        // + 1 is the comma
                        if (currLength + variable.length + 1 < diff) {
                            currIncludes.push(variable);
                            currLength += variable.length + 1;
                        } else {
                            currIncludes = [variable];
                            includeOpts.push(currIncludes);
                            currLength = '?include='.length + variable.length;
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

},{"./query-util":44}]},{},[6])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCJub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaXMtYXJyYXkvaW5kZXguanMiLCJzcmMvYXBpLXZlcnNpb24uanNvbiIsInNyYy9hcHAuanMiLCJzcmMvbWFuYWdlcnMvYXV0aC1tYW5hZ2VyLmpzIiwic3JjL21hbmFnZXJzL2NoYW5uZWwtbWFuYWdlci5qcyIsInNyYy9tYW5hZ2Vycy9lcGljZW50ZXItY2hhbm5lbC1tYW5hZ2VyLmpzIiwic3JjL21hbmFnZXJzL2tleS1uYW1lcy5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tbWFuYWdlci5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9hbHdheXMtbmV3LXN0cmF0ZWd5LmpzIiwic3JjL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL2NvbmRpdGlvbmFsLWNyZWF0aW9uLXN0cmF0ZWd5LmpzIiwic3JjL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL2lkZW50aXR5LXN0cmF0ZWd5LmpzIiwic3JjL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL211bHRpcGxheWVyLXN0cmF0ZWd5LmpzIiwic3JjL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL25ldy1pZi1pbml0aWFsaXplZC1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9uZXctaWYtbWlzc2luZy1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9uZXctaWYtcGVyc2lzdGVkLXN0cmF0ZWd5LmpzIiwic3JjL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL3BlcnNpc3RlbnQtc2luZ2xlLXBsYXllci1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9zdHJhdGVnaWVzLW1hcC5qcyIsInNyYy9tYW5hZ2Vycy9zY2VuYXJpby1tYW5hZ2VyLmpzIiwic3JjL21hbmFnZXJzL3NwZWNpYWwtb3BlcmF0aW9ucy5qcyIsInNyYy9tYW5hZ2Vycy93b3JsZC1tYW5hZ2VyLmpzIiwic3JjL3NlcnZpY2UvYWRtaW4tZmlsZS1zZXJ2aWNlLmpzIiwic3JjL3NlcnZpY2UvYXNzZXQtYXBpLWFkYXB0ZXIuanMiLCJzcmMvc2VydmljZS9hdXRoLWFwaS1zZXJ2aWNlLmpzIiwic3JjL3NlcnZpY2UvY2hhbm5lbC1zZXJ2aWNlLmpzIiwic3JjL3NlcnZpY2UvY29uZmlndXJhdGlvbi1zZXJ2aWNlLmpzIiwic3JjL3NlcnZpY2UvZGF0YS1hcGktc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL21lbWJlci1hcGktYWRhcHRlci5qcyIsInNyYy9zZXJ2aWNlL3J1bi1hcGktc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL3N0YXRlLWFwaS1hZGFwdGVyLmpzIiwic3JjL3NlcnZpY2UvdXJsLWNvbmZpZy1zZXJ2aWNlLmpzIiwic3JjL3NlcnZpY2UvdXNlci1hcGktYWRhcHRlci5qcyIsInNyYy9zZXJ2aWNlL3ZhcmlhYmxlcy1hcGktc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL3dvcmxkLWFwaS1hZGFwdGVyLmpzIiwic3JjL3N0b3JlL2Nvb2tpZS1zdG9yZS5qcyIsInNyYy9zdG9yZS9zdG9yZS1mYWN0b3J5LmpzIiwic3JjL3RyYW5zcG9ydC9hamF4LWh0dHAtdHJhbnNwb3J0LmpzIiwic3JjL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5LmpzIiwic3JjL3V0aWwvaW5oZXJpdC5qcyIsInNyYy91dGlsL21ha2Utc2VxdWVuY2UuanMiLCJzcmMvdXRpbC9vYmplY3QtdXRpbC5qcyIsInNyYy91dGlsL3F1ZXJ5LXV0aWwuanMiLCJzcmMvdXRpbC9ydW4tdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN4Z0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4ZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM3VCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLXByb3RvICovXG5cbnZhciBiYXNlNjQgPSByZXF1aXJlKCdiYXNlNjQtanMnKVxudmFyIGllZWU3NTQgPSByZXF1aXJlKCdpZWVlNzU0JylcbnZhciBpc0FycmF5ID0gcmVxdWlyZSgnaXMtYXJyYXknKVxuXG5leHBvcnRzLkJ1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5TbG93QnVmZmVyID0gU2xvd0J1ZmZlclxuZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFUyA9IDUwXG5CdWZmZXIucG9vbFNpemUgPSA4MTkyIC8vIG5vdCB1c2VkIGJ5IHRoaXMgaW1wbGVtZW50YXRpb25cblxudmFyIHJvb3RQYXJlbnQgPSB7fVxuXG4vKipcbiAqIElmIGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGA6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBVc2UgT2JqZWN0IGltcGxlbWVudGF0aW9uIChtb3N0IGNvbXBhdGlibGUsIGV2ZW4gSUU2KVxuICpcbiAqIEJyb3dzZXJzIHRoYXQgc3VwcG9ydCB0eXBlZCBhcnJheXMgYXJlIElFIDEwKywgRmlyZWZveCA0KywgQ2hyb21lIDcrLCBTYWZhcmkgNS4xKyxcbiAqIE9wZXJhIDExLjYrLCBpT1MgNC4yKy5cbiAqXG4gKiBEdWUgdG8gdmFyaW91cyBicm93c2VyIGJ1Z3MsIHNvbWV0aW1lcyB0aGUgT2JqZWN0IGltcGxlbWVudGF0aW9uIHdpbGwgYmUgdXNlZCBldmVuXG4gKiB3aGVuIHRoZSBicm93c2VyIHN1cHBvcnRzIHR5cGVkIGFycmF5cy5cbiAqXG4gKiBOb3RlOlxuICpcbiAqICAgLSBGaXJlZm94IDQtMjkgbGFja3Mgc3VwcG9ydCBmb3IgYWRkaW5nIG5ldyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YCBpbnN0YW5jZXMsXG4gKiAgICAgU2VlOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzguXG4gKlxuICogICAtIFNhZmFyaSA1LTcgbGFja3Mgc3VwcG9ydCBmb3IgY2hhbmdpbmcgdGhlIGBPYmplY3QucHJvdG90eXBlLmNvbnN0cnVjdG9yYCBwcm9wZXJ0eVxuICogICAgIG9uIG9iamVjdHMuXG4gKlxuICogICAtIENocm9tZSA5LTEwIGlzIG1pc3NpbmcgdGhlIGBUeXBlZEFycmF5LnByb3RvdHlwZS5zdWJhcnJheWAgZnVuY3Rpb24uXG4gKlxuICogICAtIElFMTAgaGFzIGEgYnJva2VuIGBUeXBlZEFycmF5LnByb3RvdHlwZS5zdWJhcnJheWAgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBhcnJheXMgb2ZcbiAqICAgICBpbmNvcnJlY3QgbGVuZ3RoIGluIHNvbWUgc2l0dWF0aW9ucy5cblxuICogV2UgZGV0ZWN0IHRoZXNlIGJ1Z2d5IGJyb3dzZXJzIGFuZCBzZXQgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYCB0byBgZmFsc2VgIHNvIHRoZXlcbiAqIGdldCB0aGUgT2JqZWN0IGltcGxlbWVudGF0aW9uLCB3aGljaCBpcyBzbG93ZXIgYnV0IGJlaGF2ZXMgY29ycmVjdGx5LlxuICovXG5CdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCA9IGdsb2JhbC5UWVBFRF9BUlJBWV9TVVBQT1JUICE9PSB1bmRlZmluZWRcbiAgPyBnbG9iYWwuVFlQRURfQVJSQVlfU1VQUE9SVFxuICA6IHR5cGVkQXJyYXlTdXBwb3J0KClcblxuZnVuY3Rpb24gdHlwZWRBcnJheVN1cHBvcnQgKCkge1xuICBmdW5jdGlvbiBCYXIgKCkge31cbiAgdHJ5IHtcbiAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoMSlcbiAgICBhcnIuZm9vID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfVxuICAgIGFyci5jb25zdHJ1Y3RvciA9IEJhclxuICAgIHJldHVybiBhcnIuZm9vKCkgPT09IDQyICYmIC8vIHR5cGVkIGFycmF5IGluc3RhbmNlcyBjYW4gYmUgYXVnbWVudGVkXG4gICAgICAgIGFyci5jb25zdHJ1Y3RvciA9PT0gQmFyICYmIC8vIGNvbnN0cnVjdG9yIGNhbiBiZSBzZXRcbiAgICAgICAgdHlwZW9mIGFyci5zdWJhcnJheSA9PT0gJ2Z1bmN0aW9uJyAmJiAvLyBjaHJvbWUgOS0xMCBsYWNrIGBzdWJhcnJheWBcbiAgICAgICAgYXJyLnN1YmFycmF5KDEsIDEpLmJ5dGVMZW5ndGggPT09IDAgLy8gaWUxMCBoYXMgYnJva2VuIGBzdWJhcnJheWBcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbmZ1bmN0aW9uIGtNYXhMZW5ndGggKCkge1xuICByZXR1cm4gQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRcbiAgICA/IDB4N2ZmZmZmZmZcbiAgICA6IDB4M2ZmZmZmZmZcbn1cblxuLyoqXG4gKiBDbGFzczogQnVmZmVyXG4gKiA9PT09PT09PT09PT09XG4gKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBhcmUgYXVnbWVudGVkXG4gKiB3aXRoIGZ1bmN0aW9uIHByb3BlcnRpZXMgZm9yIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBBUEkgZnVuY3Rpb25zLiBXZSB1c2VcbiAqIGBVaW50OEFycmF5YCBzbyB0aGF0IHNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0IHJldHVybnNcbiAqIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIEJ5IGF1Z21lbnRpbmcgdGhlIGluc3RhbmNlcywgd2UgY2FuIGF2b2lkIG1vZGlmeWluZyB0aGUgYFVpbnQ4QXJyYXlgXG4gKiBwcm90b3R5cGUuXG4gKi9cbmZ1bmN0aW9uIEJ1ZmZlciAoYXJnKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBCdWZmZXIpKSB7XG4gICAgLy8gQXZvaWQgZ29pbmcgdGhyb3VnaCBhbiBBcmd1bWVudHNBZGFwdG9yVHJhbXBvbGluZSBpbiB0aGUgY29tbW9uIGNhc2UuXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSByZXR1cm4gbmV3IEJ1ZmZlcihhcmcsIGFyZ3VtZW50c1sxXSlcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcihhcmcpXG4gIH1cblxuICB0aGlzLmxlbmd0aCA9IDBcbiAgdGhpcy5wYXJlbnQgPSB1bmRlZmluZWRcblxuICAvLyBDb21tb24gY2FzZS5cbiAgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XG4gICAgcmV0dXJuIGZyb21OdW1iZXIodGhpcywgYXJnKVxuICB9XG5cbiAgLy8gU2xpZ2h0bHkgbGVzcyBjb21tb24gY2FzZS5cbiAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGZyb21TdHJpbmcodGhpcywgYXJnLCBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6ICd1dGY4JylcbiAgfVxuXG4gIC8vIFVudXN1YWwuXG4gIHJldHVybiBmcm9tT2JqZWN0KHRoaXMsIGFyZylcbn1cblxuZnVuY3Rpb24gZnJvbU51bWJlciAodGhhdCwgbGVuZ3RoKSB7XG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGggPCAwID8gMCA6IGNoZWNrZWQobGVuZ3RoKSB8IDApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGF0W2ldID0gMFxuICAgIH1cbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tU3RyaW5nICh0aGF0LCBzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnIHx8IGVuY29kaW5nID09PSAnJykgZW5jb2RpbmcgPSAndXRmOCdcblxuICAvLyBBc3N1bXB0aW9uOiBieXRlTGVuZ3RoKCkgcmV0dXJuIHZhbHVlIGlzIGFsd2F5cyA8IGtNYXhMZW5ndGguXG4gIHZhciBsZW5ndGggPSBieXRlTGVuZ3RoKHN0cmluZywgZW5jb2RpbmcpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuXG4gIHRoYXQud3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbU9iamVjdCAodGhhdCwgb2JqZWN0KSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIob2JqZWN0KSkgcmV0dXJuIGZyb21CdWZmZXIodGhhdCwgb2JqZWN0KVxuXG4gIGlmIChpc0FycmF5KG9iamVjdCkpIHJldHVybiBmcm9tQXJyYXkodGhhdCwgb2JqZWN0KVxuXG4gIGlmIChvYmplY3QgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ211c3Qgc3RhcnQgd2l0aCBudW1iZXIsIGJ1ZmZlciwgYXJyYXkgb3Igc3RyaW5nJylcbiAgfVxuXG4gIGlmICh0eXBlb2YgQXJyYXlCdWZmZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKG9iamVjdC5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgcmV0dXJuIGZyb21UeXBlZEFycmF5KHRoYXQsIG9iamVjdClcbiAgICB9XG4gICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICByZXR1cm4gZnJvbUFycmF5QnVmZmVyKHRoYXQsIG9iamVjdClcbiAgICB9XG4gIH1cblxuICBpZiAob2JqZWN0Lmxlbmd0aCkgcmV0dXJuIGZyb21BcnJheUxpa2UodGhhdCwgb2JqZWN0KVxuXG4gIHJldHVybiBmcm9tSnNvbk9iamVjdCh0aGF0LCBvYmplY3QpXG59XG5cbmZ1bmN0aW9uIGZyb21CdWZmZXIgKHRoYXQsIGJ1ZmZlcikge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChidWZmZXIubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgYnVmZmVyLmNvcHkodGhhdCwgMCwgMCwgbGVuZ3RoKVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXkgKHRoYXQsIGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGF0W2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG4vLyBEdXBsaWNhdGUgb2YgZnJvbUFycmF5KCkgdG8ga2VlcCBmcm9tQXJyYXkoKSBtb25vbW9ycGhpYy5cbmZ1bmN0aW9uIGZyb21UeXBlZEFycmF5ICh0aGF0LCBhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuICAvLyBUcnVuY2F0aW5nIHRoZSBlbGVtZW50cyBpcyBwcm9iYWJseSBub3Qgd2hhdCBwZW9wbGUgZXhwZWN0IGZyb20gdHlwZWRcbiAgLy8gYXJyYXlzIHdpdGggQllURVNfUEVSX0VMRU1FTlQgPiAxIGJ1dCBpdCdzIGNvbXBhdGlibGUgd2l0aCB0aGUgYmVoYXZpb3JcbiAgLy8gb2YgdGhlIG9sZCBCdWZmZXIgY29uc3RydWN0b3IuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGF0W2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlCdWZmZXIgKHRoYXQsIGFycmF5KSB7XG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlLCBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIGFycmF5LmJ5dGVMZW5ndGhcbiAgICB0aGF0ID0gQnVmZmVyLl9hdWdtZW50KG5ldyBVaW50OEFycmF5KGFycmF5KSlcbiAgfSBlbHNlIHtcbiAgICAvLyBGYWxsYmFjazogUmV0dXJuIGFuIG9iamVjdCBpbnN0YW5jZSBvZiB0aGUgQnVmZmVyIGNsYXNzXG4gICAgdGhhdCA9IGZyb21UeXBlZEFycmF5KHRoYXQsIG5ldyBVaW50OEFycmF5KGFycmF5KSlcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlMaWtlICh0aGF0LCBhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuLy8gRGVzZXJpYWxpemUgeyB0eXBlOiAnQnVmZmVyJywgZGF0YTogWzEsMiwzLC4uLl0gfSBpbnRvIGEgQnVmZmVyIG9iamVjdC5cbi8vIFJldHVybnMgYSB6ZXJvLWxlbmd0aCBidWZmZXIgZm9yIGlucHV0cyB0aGF0IGRvbid0IGNvbmZvcm0gdG8gdGhlIHNwZWMuXG5mdW5jdGlvbiBmcm9tSnNvbk9iamVjdCAodGhhdCwgb2JqZWN0KSB7XG4gIHZhciBhcnJheVxuICB2YXIgbGVuZ3RoID0gMFxuXG4gIGlmIChvYmplY3QudHlwZSA9PT0gJ0J1ZmZlcicgJiYgaXNBcnJheShvYmplY3QuZGF0YSkpIHtcbiAgICBhcnJheSA9IG9iamVjdC5kYXRhXG4gICAgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB9XG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICBCdWZmZXIucHJvdG90eXBlLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXkucHJvdG90eXBlXG4gIEJ1ZmZlci5fX3Byb3RvX18gPSBVaW50OEFycmF5XG59XG5cbmZ1bmN0aW9uIGFsbG9jYXRlICh0aGF0LCBsZW5ndGgpIHtcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2UsIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgdGhhdCA9IEJ1ZmZlci5fYXVnbWVudChuZXcgVWludDhBcnJheShsZW5ndGgpKVxuICAgIHRoYXQuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gYW4gb2JqZWN0IGluc3RhbmNlIG9mIHRoZSBCdWZmZXIgY2xhc3NcbiAgICB0aGF0Lmxlbmd0aCA9IGxlbmd0aFxuICAgIHRoYXQuX2lzQnVmZmVyID0gdHJ1ZVxuICB9XG5cbiAgdmFyIGZyb21Qb29sID0gbGVuZ3RoICE9PSAwICYmIGxlbmd0aCA8PSBCdWZmZXIucG9vbFNpemUgPj4+IDFcbiAgaWYgKGZyb21Qb29sKSB0aGF0LnBhcmVudCA9IHJvb3RQYXJlbnRcblxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBjaGVja2VkIChsZW5ndGgpIHtcbiAgLy8gTm90ZTogY2Fubm90IHVzZSBgbGVuZ3RoIDwga01heExlbmd0aGAgaGVyZSBiZWNhdXNlIHRoYXQgZmFpbHMgd2hlblxuICAvLyBsZW5ndGggaXMgTmFOICh3aGljaCBpcyBvdGhlcndpc2UgY29lcmNlZCB0byB6ZXJvLilcbiAgaWYgKGxlbmd0aCA+PSBrTWF4TGVuZ3RoKCkpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byBhbGxvY2F0ZSBCdWZmZXIgbGFyZ2VyIHRoYW4gbWF4aW11bSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAnc2l6ZTogMHgnICsga01heExlbmd0aCgpLnRvU3RyaW5nKDE2KSArICcgYnl0ZXMnKVxuICB9XG4gIHJldHVybiBsZW5ndGggfCAwXG59XG5cbmZ1bmN0aW9uIFNsb3dCdWZmZXIgKHN1YmplY3QsIGVuY29kaW5nKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTbG93QnVmZmVyKSkgcmV0dXJuIG5ldyBTbG93QnVmZmVyKHN1YmplY3QsIGVuY29kaW5nKVxuXG4gIHZhciBidWYgPSBuZXcgQnVmZmVyKHN1YmplY3QsIGVuY29kaW5nKVxuICBkZWxldGUgYnVmLnBhcmVudFxuICByZXR1cm4gYnVmXG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIGlzQnVmZmVyIChiKSB7XG4gIHJldHVybiAhIShiICE9IG51bGwgJiYgYi5faXNCdWZmZXIpXG59XG5cbkJ1ZmZlci5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYSwgYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhKSB8fCAhQnVmZmVyLmlzQnVmZmVyKGIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIG11c3QgYmUgQnVmZmVycycpXG4gIH1cblxuICBpZiAoYSA9PT0gYikgcmV0dXJuIDBcblxuICB2YXIgeCA9IGEubGVuZ3RoXG4gIHZhciB5ID0gYi5sZW5ndGhcblxuICB2YXIgaSA9IDBcbiAgdmFyIGxlbiA9IE1hdGgubWluKHgsIHkpXG4gIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIGJyZWFrXG5cbiAgICArK2lcbiAgfVxuXG4gIGlmIChpICE9PSBsZW4pIHtcbiAgICB4ID0gYVtpXVxuICAgIHkgPSBiW2ldXG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gaXNFbmNvZGluZyAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQgKGxpc3QsIGxlbmd0aCkge1xuICBpZiAoIWlzQXJyYXkobGlzdCkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2xpc3QgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzLicpXG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoMClcbiAgfVxuXG4gIHZhciBpXG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGxlbmd0aCA9IDBcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgbGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIobGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpdGVtID0gbGlzdFtpXVxuICAgIGl0ZW0uY29weShidWYsIHBvcylcbiAgICBwb3MgKz0gaXRlbS5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSBzdHJpbmcgPSAnJyArIHN0cmluZ1xuXG4gIHZhciBsZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGlmIChsZW4gPT09IDApIHJldHVybiAwXG5cbiAgLy8gVXNlIGEgZm9yIGxvb3AgdG8gYXZvaWQgcmVjdXJzaW9uXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgLy8gRGVwcmVjYXRlZFxuICAgICAgY2FzZSAncmF3JzpcbiAgICAgIGNhc2UgJ3Jhd3MnOlxuICAgICAgICByZXR1cm4gbGVuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gbGVuICogMlxuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGxlbiA+Pj4gMVxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgcmV0dXJuIHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoIC8vIGFzc3VtZSB1dGY4XG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcblxuLy8gcHJlLXNldCBmb3IgdmFsdWVzIHRoYXQgbWF5IGV4aXN0IGluIHRoZSBmdXR1cmVcbkJ1ZmZlci5wcm90b3R5cGUubGVuZ3RoID0gdW5kZWZpbmVkXG5CdWZmZXIucHJvdG90eXBlLnBhcmVudCA9IHVuZGVmaW5lZFxuXG5mdW5jdGlvbiBzbG93VG9TdHJpbmcgKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG5cbiAgc3RhcnQgPSBzdGFydCB8IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID09PSBJbmZpbml0eSA/IHRoaXMubGVuZ3RoIDogZW5kIHwgMFxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG4gIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmIChlbmQgPD0gc3RhcnQpIHJldHVybiAnJ1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGJpbmFyeVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdXRmMTZsZVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9IChlbmNvZGluZyArICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGggfCAwXG4gIGlmIChsZW5ndGggPT09IDApIHJldHVybiAnJ1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCAwLCBsZW5ndGgpXG4gIHJldHVybiBzbG93VG9TdHJpbmcuYXBwbHkodGhpcywgYXJndW1lbnRzKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIGVxdWFscyAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gaW5zcGVjdCAoKSB7XG4gIHZhciBzdHIgPSAnJ1xuICB2YXIgbWF4ID0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFU1xuICBpZiAodGhpcy5sZW5ndGggPiAwKSB7XG4gICAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5tYXRjaCgvLnsyfS9nKS5qb2luKCcgJylcbiAgICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIH1cbiAgcmV0dXJuICc8QnVmZmVyICcgKyBzdHIgKyAnPidcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gMFxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYilcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gaW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0KSB7XG4gIGlmIChieXRlT2Zmc2V0ID4gMHg3ZmZmZmZmZikgYnl0ZU9mZnNldCA9IDB4N2ZmZmZmZmZcbiAgZWxzZSBpZiAoYnl0ZU9mZnNldCA8IC0weDgwMDAwMDAwKSBieXRlT2Zmc2V0ID0gLTB4ODAwMDAwMDBcbiAgYnl0ZU9mZnNldCA+Pj0gMFxuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xXG4gIGlmIChieXRlT2Zmc2V0ID49IHRoaXMubGVuZ3RoKSByZXR1cm4gLTFcblxuICAvLyBOZWdhdGl2ZSBvZmZzZXRzIHN0YXJ0IGZyb20gdGhlIGVuZCBvZiB0aGUgYnVmZmVyXG4gIGlmIChieXRlT2Zmc2V0IDwgMCkgYnl0ZU9mZnNldCA9IE1hdGgubWF4KHRoaXMubGVuZ3RoICsgYnl0ZU9mZnNldCwgMClcblxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xIC8vIHNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nIGFsd2F5cyBmYWlsc1xuICAgIHJldHVybiBTdHJpbmcucHJvdG90eXBlLmluZGV4T2YuY2FsbCh0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gIH1cbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWwpKSB7XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gIH1cbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwodGhpcywgdmFsLCBieXRlT2Zmc2V0KVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKHRoaXMsIFsgdmFsIF0sIGJ5dGVPZmZzZXQpXG4gIH1cblxuICBmdW5jdGlvbiBhcnJheUluZGV4T2YgKGFyciwgdmFsLCBieXRlT2Zmc2V0KSB7XG4gICAgdmFyIGZvdW5kSW5kZXggPSAtMVxuICAgIGZvciAodmFyIGkgPSAwOyBieXRlT2Zmc2V0ICsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFycltieXRlT2Zmc2V0ICsgaV0gPT09IHZhbFtmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleF0pIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSBmb3VuZEluZGV4ID0gaVxuICAgICAgICBpZiAoaSAtIGZvdW5kSW5kZXggKyAxID09PSB2YWwubGVuZ3RoKSByZXR1cm4gYnl0ZU9mZnNldCArIGZvdW5kSW5kZXhcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvdW5kSW5kZXggPSAtMVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTFcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbCBtdXN0IGJlIHN0cmluZywgbnVtYmVyIG9yIEJ1ZmZlcicpXG59XG5cbi8vIGBnZXRgIGlzIGRlcHJlY2F0ZWRcbkJ1ZmZlci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0IChvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5nZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLnJlYWRVSW50OChvZmZzZXQpXG59XG5cbi8vIGBzZXRgIGlzIGRlcHJlY2F0ZWRcbkJ1ZmZlci5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0ICh2LCBvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5zZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLndyaXRlVUludDgodiwgb2Zmc2V0KVxufVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIC8vIG11c3QgYmUgYW4gZXZlbiBudW1iZXIgb2YgZGlnaXRzXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGlmIChzdHJMZW4gJSAyICE9PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaGV4IHN0cmluZycpXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhciBwYXJzZWQgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgaWYgKGlzTmFOKHBhcnNlZCkpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBoZXggc3RyaW5nJylcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSBwYXJzZWRcbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiB1dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBhc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYXNjaWlUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJpbmFyeVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGFzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gdWNzMldyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIHdyaXRlIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZykge1xuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nKVxuICBpZiAob2Zmc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIG9mZnNldFssIGxlbmd0aF1bLCBlbmNvZGluZ10pXG4gIH0gZWxzZSBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgICBpZiAoaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgbGVuZ3RoID0gbGVuZ3RoIHwgMFxuICAgICAgaWYgKGVuY29kaW5nID09PSB1bmRlZmluZWQpIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgfSBlbHNlIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIC8vIGxlZ2FjeSB3cml0ZShzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXQsIGxlbmd0aCkgLSByZW1vdmUgaW4gdjAuMTNcbiAgfSBlbHNlIHtcbiAgICB2YXIgc3dhcCA9IGVuY29kaW5nXG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBvZmZzZXQgPSBsZW5ndGggfCAwXG4gICAgbGVuZ3RoID0gc3dhcFxuICB9XG5cbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPiByZW1haW5pbmcpIGxlbmd0aCA9IHJlbWFpbmluZ1xuXG4gIGlmICgoc3RyaW5nLmxlbmd0aCA+IDAgJiYgKGxlbmd0aCA8IDAgfHwgb2Zmc2V0IDwgMCkpIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2F0dGVtcHQgdG8gd3JpdGUgb3V0c2lkZSBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBiaW5hcnlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICAvLyBXYXJuaW5nOiBtYXhMZW5ndGggbm90IHRha2VuIGludG8gYWNjb3VudCBpbiBiYXNlNjRXcml0ZVxuICAgICAgICByZXR1cm4gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHVjczJXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG4gIHZhciByZXMgPSBbXVxuXG4gIHZhciBpID0gc3RhcnRcbiAgd2hpbGUgKGkgPCBlbmQpIHtcbiAgICB2YXIgZmlyc3RCeXRlID0gYnVmW2ldXG4gICAgdmFyIGNvZGVQb2ludCA9IG51bGxcbiAgICB2YXIgYnl0ZXNQZXJTZXF1ZW5jZSA9IChmaXJzdEJ5dGUgPiAweEVGKSA/IDRcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4REYpID8gM1xuICAgICAgOiAoZmlyc3RCeXRlID4gMHhCRikgPyAyXG4gICAgICA6IDFcblxuICAgIGlmIChpICsgYnl0ZXNQZXJTZXF1ZW5jZSA8PSBlbmQpIHtcbiAgICAgIHZhciBzZWNvbmRCeXRlLCB0aGlyZEJ5dGUsIGZvdXJ0aEJ5dGUsIHRlbXBDb2RlUG9pbnRcblxuICAgICAgc3dpdGNoIChieXRlc1BlclNlcXVlbmNlKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBpZiAoZmlyc3RCeXRlIDwgMHg4MCkge1xuICAgICAgICAgICAgY29kZVBvaW50ID0gZmlyc3RCeXRlXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4MUYpIDw8IDB4NiB8IChzZWNvbmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3Rikge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweEMgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4NiB8ICh0aGlyZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGRiAmJiAodGVtcENvZGVQb2ludCA8IDB4RDgwMCB8fCB0ZW1wQ29kZVBvaW50ID4gMHhERkZGKSkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBmb3VydGhCeXRlID0gYnVmW2kgKyAzXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAoZm91cnRoQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHgxMiB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHhDIHwgKHRoaXJkQnl0ZSAmIDB4M0YpIDw8IDB4NiB8IChmb3VydGhCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHhGRkZGICYmIHRlbXBDb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb2RlUG9pbnQgPT09IG51bGwpIHtcbiAgICAgIC8vIHdlIGRpZCBub3QgZ2VuZXJhdGUgYSB2YWxpZCBjb2RlUG9pbnQgc28gaW5zZXJ0IGFcbiAgICAgIC8vIHJlcGxhY2VtZW50IGNoYXIgKFUrRkZGRCkgYW5kIGFkdmFuY2Ugb25seSAxIGJ5dGVcbiAgICAgIGNvZGVQb2ludCA9IDB4RkZGRFxuICAgICAgYnl0ZXNQZXJTZXF1ZW5jZSA9IDFcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA+IDB4RkZGRikge1xuICAgICAgLy8gZW5jb2RlIHRvIHV0ZjE2IChzdXJyb2dhdGUgcGFpciBkYW5jZSlcbiAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwXG4gICAgICByZXMucHVzaChjb2RlUG9pbnQgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApXG4gICAgICBjb2RlUG9pbnQgPSAweERDMDAgfCBjb2RlUG9pbnQgJiAweDNGRlxuICAgIH1cblxuICAgIHJlcy5wdXNoKGNvZGVQb2ludClcbiAgICBpICs9IGJ5dGVzUGVyU2VxdWVuY2VcbiAgfVxuXG4gIHJldHVybiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkocmVzKVxufVxuXG4vLyBCYXNlZCBvbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMjc0NzI3Mi82ODA3NDIsIHRoZSBicm93c2VyIHdpdGhcbi8vIHRoZSBsb3dlc3QgbGltaXQgaXMgQ2hyb21lLCB3aXRoIDB4MTAwMDAgYXJncy5cbi8vIFdlIGdvIDEgbWFnbml0dWRlIGxlc3MsIGZvciBzYWZldHlcbnZhciBNQVhfQVJHVU1FTlRTX0xFTkdUSCA9IDB4MTAwMFxuXG5mdW5jdGlvbiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkgKGNvZGVQb2ludHMpIHtcbiAgdmFyIGxlbiA9IGNvZGVQb2ludHMubGVuZ3RoXG4gIGlmIChsZW4gPD0gTUFYX0FSR1VNRU5UU19MRU5HVEgpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNvZGVQb2ludHMpIC8vIGF2b2lkIGV4dHJhIHNsaWNlKClcbiAgfVxuXG4gIC8vIERlY29kZSBpbiBjaHVua3MgdG8gYXZvaWQgXCJjYWxsIHN0YWNrIHNpemUgZXhjZWVkZWRcIi5cbiAgdmFyIHJlcyA9ICcnXG4gIHZhciBpID0gMFxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFxuICAgICAgU3RyaW5nLFxuICAgICAgY29kZVBvaW50cy5zbGljZShpLCBpICs9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKVxuICAgIClcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldICYgMHg3RilcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGJpbmFyeVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGhleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyBieXRlc1tpICsgMV0gKiAyNTYpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZlxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBuZXdCdWYgPSBCdWZmZXIuX2F1Z21lbnQodGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSlcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2xpY2VMZW4gPSBlbmQgLSBzdGFydFxuICAgIG5ld0J1ZiA9IG5ldyBCdWZmZXIoc2xpY2VMZW4sIHVuZGVmaW5lZClcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWNlTGVuOyBpKyspIHtcbiAgICAgIG5ld0J1ZltpXSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfVxuXG4gIGlmIChuZXdCdWYubGVuZ3RoKSBuZXdCdWYucGFyZW50ID0gdGhpcy5wYXJlbnQgfHwgdGhpc1xuXG4gIHJldHVybiBuZXdCdWZcbn1cblxuLypcbiAqIE5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgYnVmZmVyIGlzbid0IHRyeWluZyB0byB3cml0ZSBvdXQgb2YgYm91bmRzLlxuICovXG5mdW5jdGlvbiBjaGVja09mZnNldCAob2Zmc2V0LCBleHQsIGxlbmd0aCkge1xuICBpZiAoKG9mZnNldCAlIDEpICE9PSAwIHx8IG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVHJ5aW5nIHRvIGFjY2VzcyBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRMRSA9IGZ1bmN0aW9uIHJlYWRVSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRCRSA9IGZ1bmN0aW9uIHJlYWRVSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG4gIH1cblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiByZWFkVUludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiByZWFkVUludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICgodGhpc1tvZmZzZXRdKSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikpICtcbiAgICAgICh0aGlzW29mZnNldCArIDNdICogMHgxMDAwMDAwKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludExFID0gZnVuY3Rpb24gcmVhZEludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludEJFID0gZnVuY3Rpb24gcmVhZEludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoXG4gIHZhciBtdWwgPSAxXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0taV1cbiAgd2hpbGUgKGkgPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1pXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiByZWFkSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSkgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gcmVhZEludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIDFdIHwgKHRoaXNbb2Zmc2V0XSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiByZWFkSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDI0KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiByZWFkRmxvYXRMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0QkUgPSBmdW5jdGlvbiByZWFkRmxvYXRCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gcmVhZERvdWJsZUJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgNTIsIDgpXG59XG5cbmZ1bmN0aW9uIGNoZWNrSW50IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignYnVmZmVyIG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCd2YWx1ZSBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludExFID0gZnVuY3Rpb24gd3JpdGVVSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSwgMClcblxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludEJFID0gZnVuY3Rpb24gd3JpdGVVSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSwgMClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiB3cml0ZVVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4ZmYsIDApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHZhbHVlID0gTWF0aC5mbG9vcih2YWx1ZSlcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuZnVuY3Rpb24gb2JqZWN0V3JpdGVVSW50MTYgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuKSB7XG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmICsgdmFsdWUgKyAxXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4oYnVmLmxlbmd0aCAtIG9mZnNldCwgMik7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSAodmFsdWUgJiAoMHhmZiA8PCAoOCAqIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpKSkpID4+PlxuICAgICAgKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkgKiA4XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuZnVuY3Rpb24gb2JqZWN0V3JpdGVVSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuKSB7XG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBvZmZzZXQsIDQpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID0gKHZhbHVlID4+PiAobGl0dGxlRW5kaWFuID8gaSA6IDMgLSBpKSAqIDgpICYgMHhmZlxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludExFID0gZnVuY3Rpb24gd3JpdGVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGggLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IDBcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IHZhbHVlIDwgMCA/IDEgOiAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gdmFsdWUgPCAwID8gMSA6IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweDdmLCAtMHg4MClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkgdmFsdWUgPSBNYXRoLmZsb29yKHZhbHVlKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuZnVuY3Rpb24gY2hlY2tJRUVFNzU0IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndmFsdWUgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDQsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gd3JpdGVGbG9hdEJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDgsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG4gIHJldHVybiBvZmZzZXQgKyA4XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVMRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUJFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gY29weSh0YXJnZXRCdWZmZXIsIHRhcmdldFN0YXJ0PTAsIHNvdXJjZVN0YXJ0PTAsIHNvdXJjZUVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gY29weSAodGFyZ2V0LCB0YXJnZXRTdGFydCwgc3RhcnQsIGVuZCkge1xuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0U3RhcnQgPj0gdGFyZ2V0Lmxlbmd0aCkgdGFyZ2V0U3RhcnQgPSB0YXJnZXQubGVuZ3RoXG4gIGlmICghdGFyZ2V0U3RhcnQpIHRhcmdldFN0YXJ0ID0gMFxuICBpZiAoZW5kID4gMCAmJiBlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICAvLyBDb3B5IDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVybiAwXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgaWYgKHRhcmdldFN0YXJ0IDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgfVxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlU3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChlbmQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlRW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIC8vIEFyZSB3ZSBvb2I/XG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCA8IGVuZCAtIHN0YXJ0KSB7XG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0ICsgc3RhcnRcbiAgfVxuXG4gIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuICB2YXIgaVxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQgJiYgc3RhcnQgPCB0YXJnZXRTdGFydCAmJiB0YXJnZXRTdGFydCA8IGVuZCkge1xuICAgIC8vIGRlc2NlbmRpbmcgY29weSBmcm9tIGVuZFxuICAgIGZvciAoaSA9IGxlbiAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIGlmIChsZW4gPCAxMDAwIHx8ICFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIGFzY2VuZGluZyBjb3B5IGZyb20gc3RhcnRcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0U3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRhcmdldC5fc2V0KHRoaXMuc3ViYXJyYXkoc3RhcnQsIHN0YXJ0ICsgbGVuKSwgdGFyZ2V0U3RhcnQpXG4gIH1cblxuICByZXR1cm4gbGVuXG59XG5cbi8vIGZpbGwodmFsdWUsIHN0YXJ0PTAsIGVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gZmlsbCAodmFsdWUsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCF2YWx1ZSkgdmFsdWUgPSAwXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCkgZW5kID0gdGhpcy5sZW5ndGhcblxuICBpZiAoZW5kIDwgc3RhcnQpIHRocm93IG5ldyBSYW5nZUVycm9yKCdlbmQgPCBzdGFydCcpXG5cbiAgLy8gRmlsbCAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChlbmQgPCAwIHx8IGVuZCA+IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignZW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IHZhbHVlXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IHV0ZjhUb0J5dGVzKHZhbHVlLnRvU3RyaW5nKCkpXG4gICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aFxuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSBieXRlc1tpICUgbGVuXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBgQXJyYXlCdWZmZXJgIHdpdGggdGhlICpjb3BpZWQqIG1lbW9yeSBvZiB0aGUgYnVmZmVyIGluc3RhbmNlLlxuICogQWRkZWQgaW4gTm9kZSAwLjEyLiBPbmx5IGF2YWlsYWJsZSBpbiBicm93c2VycyB0aGF0IHN1cHBvcnQgQXJyYXlCdWZmZXIuXG4gKi9cbkJ1ZmZlci5wcm90b3R5cGUudG9BcnJheUJ1ZmZlciA9IGZ1bmN0aW9uIHRvQXJyYXlCdWZmZXIgKCkge1xuICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgICByZXR1cm4gKG5ldyBCdWZmZXIodGhpcykpLmJ1ZmZlclxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5sZW5ndGgpXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYnVmLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgIGJ1ZltpXSA9IHRoaXNbaV1cbiAgICAgIH1cbiAgICAgIHJldHVybiBidWYuYnVmZmVyXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0J1ZmZlci50b0FycmF5QnVmZmVyIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyJylcbiAgfVxufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBCUCA9IEJ1ZmZlci5wcm90b3R5cGVcblxuLyoqXG4gKiBBdWdtZW50IGEgVWludDhBcnJheSAqaW5zdGFuY2UqIChub3QgdGhlIFVpbnQ4QXJyYXkgY2xhc3MhKSB3aXRoIEJ1ZmZlciBtZXRob2RzXG4gKi9cbkJ1ZmZlci5fYXVnbWVudCA9IGZ1bmN0aW9uIF9hdWdtZW50IChhcnIpIHtcbiAgYXJyLmNvbnN0cnVjdG9yID0gQnVmZmVyXG4gIGFyci5faXNCdWZmZXIgPSB0cnVlXG5cbiAgLy8gc2F2ZSByZWZlcmVuY2UgdG8gb3JpZ2luYWwgVWludDhBcnJheSBzZXQgbWV0aG9kIGJlZm9yZSBvdmVyd3JpdGluZ1xuICBhcnIuX3NldCA9IGFyci5zZXRcblxuICAvLyBkZXByZWNhdGVkXG4gIGFyci5nZXQgPSBCUC5nZXRcbiAgYXJyLnNldCA9IEJQLnNldFxuXG4gIGFyci53cml0ZSA9IEJQLndyaXRlXG4gIGFyci50b1N0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0xvY2FsZVN0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0pTT04gPSBCUC50b0pTT05cbiAgYXJyLmVxdWFscyA9IEJQLmVxdWFsc1xuICBhcnIuY29tcGFyZSA9IEJQLmNvbXBhcmVcbiAgYXJyLmluZGV4T2YgPSBCUC5pbmRleE9mXG4gIGFyci5jb3B5ID0gQlAuY29weVxuICBhcnIuc2xpY2UgPSBCUC5zbGljZVxuICBhcnIucmVhZFVJbnRMRSA9IEJQLnJlYWRVSW50TEVcbiAgYXJyLnJlYWRVSW50QkUgPSBCUC5yZWFkVUludEJFXG4gIGFyci5yZWFkVUludDggPSBCUC5yZWFkVUludDhcbiAgYXJyLnJlYWRVSW50MTZMRSA9IEJQLnJlYWRVSW50MTZMRVxuICBhcnIucmVhZFVJbnQxNkJFID0gQlAucmVhZFVJbnQxNkJFXG4gIGFyci5yZWFkVUludDMyTEUgPSBCUC5yZWFkVUludDMyTEVcbiAgYXJyLnJlYWRVSW50MzJCRSA9IEJQLnJlYWRVSW50MzJCRVxuICBhcnIucmVhZEludExFID0gQlAucmVhZEludExFXG4gIGFyci5yZWFkSW50QkUgPSBCUC5yZWFkSW50QkVcbiAgYXJyLnJlYWRJbnQ4ID0gQlAucmVhZEludDhcbiAgYXJyLnJlYWRJbnQxNkxFID0gQlAucmVhZEludDE2TEVcbiAgYXJyLnJlYWRJbnQxNkJFID0gQlAucmVhZEludDE2QkVcbiAgYXJyLnJlYWRJbnQzMkxFID0gQlAucmVhZEludDMyTEVcbiAgYXJyLnJlYWRJbnQzMkJFID0gQlAucmVhZEludDMyQkVcbiAgYXJyLnJlYWRGbG9hdExFID0gQlAucmVhZEZsb2F0TEVcbiAgYXJyLnJlYWRGbG9hdEJFID0gQlAucmVhZEZsb2F0QkVcbiAgYXJyLnJlYWREb3VibGVMRSA9IEJQLnJlYWREb3VibGVMRVxuICBhcnIucmVhZERvdWJsZUJFID0gQlAucmVhZERvdWJsZUJFXG4gIGFyci53cml0ZVVJbnQ4ID0gQlAud3JpdGVVSW50OFxuICBhcnIud3JpdGVVSW50TEUgPSBCUC53cml0ZVVJbnRMRVxuICBhcnIud3JpdGVVSW50QkUgPSBCUC53cml0ZVVJbnRCRVxuICBhcnIud3JpdGVVSW50MTZMRSA9IEJQLndyaXRlVUludDE2TEVcbiAgYXJyLndyaXRlVUludDE2QkUgPSBCUC53cml0ZVVJbnQxNkJFXG4gIGFyci53cml0ZVVJbnQzMkxFID0gQlAud3JpdGVVSW50MzJMRVxuICBhcnIud3JpdGVVSW50MzJCRSA9IEJQLndyaXRlVUludDMyQkVcbiAgYXJyLndyaXRlSW50TEUgPSBCUC53cml0ZUludExFXG4gIGFyci53cml0ZUludEJFID0gQlAud3JpdGVJbnRCRVxuICBhcnIud3JpdGVJbnQ4ID0gQlAud3JpdGVJbnQ4XG4gIGFyci53cml0ZUludDE2TEUgPSBCUC53cml0ZUludDE2TEVcbiAgYXJyLndyaXRlSW50MTZCRSA9IEJQLndyaXRlSW50MTZCRVxuICBhcnIud3JpdGVJbnQzMkxFID0gQlAud3JpdGVJbnQzMkxFXG4gIGFyci53cml0ZUludDMyQkUgPSBCUC53cml0ZUludDMyQkVcbiAgYXJyLndyaXRlRmxvYXRMRSA9IEJQLndyaXRlRmxvYXRMRVxuICBhcnIud3JpdGVGbG9hdEJFID0gQlAud3JpdGVGbG9hdEJFXG4gIGFyci53cml0ZURvdWJsZUxFID0gQlAud3JpdGVEb3VibGVMRVxuICBhcnIud3JpdGVEb3VibGVCRSA9IEJQLndyaXRlRG91YmxlQkVcbiAgYXJyLmZpbGwgPSBCUC5maWxsXG4gIGFyci5pbnNwZWN0ID0gQlAuaW5zcGVjdFxuICBhcnIudG9BcnJheUJ1ZmZlciA9IEJQLnRvQXJyYXlCdWZmZXJcblxuICByZXR1cm4gYXJyXG59XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXitcXC8wLTlBLVphLXotX10vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHJpbmd0cmltKHN0cikucmVwbGFjZShJTlZBTElEX0JBU0U2NF9SRSwgJycpXG4gIC8vIE5vZGUgY29udmVydHMgc3RyaW5ncyB3aXRoIGxlbmd0aCA8IDIgdG8gJydcbiAgaWYgKHN0ci5sZW5ndGggPCAyKSByZXR1cm4gJydcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gc3RyaW5ndHJpbSAoc3RyKSB7XG4gIGlmIChzdHIudHJpbSkgcmV0dXJuIHN0ci50cmltKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyaW5nLCB1bml0cykge1xuICB1bml0cyA9IHVuaXRzIHx8IEluZmluaXR5XG4gIHZhciBjb2RlUG9pbnRcbiAgdmFyIGxlbmd0aCA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIGxlYWRTdXJyb2dhdGUgPSBudWxsXG4gIHZhciBieXRlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpXG5cbiAgICAvLyBpcyBzdXJyb2dhdGUgY29tcG9uZW50XG4gICAgaWYgKGNvZGVQb2ludCA+IDB4RDdGRiAmJiBjb2RlUG9pbnQgPCAweEUwMDApIHtcbiAgICAgIC8vIGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoIWxlYWRTdXJyb2dhdGUpIHtcbiAgICAgICAgLy8gbm8gbGVhZCB5ZXRcbiAgICAgICAgaWYgKGNvZGVQb2ludCA+IDB4REJGRikge1xuICAgICAgICAgIC8vIHVuZXhwZWN0ZWQgdHJhaWxcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKGkgKyAxID09PSBsZW5ndGgpIHtcbiAgICAgICAgICAvLyB1bnBhaXJlZCBsZWFkXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbGlkIGxlYWRcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIDIgbGVhZHMgaW4gYSByb3dcbiAgICAgIGlmIChjb2RlUG9pbnQgPCAweERDMDApIHtcbiAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gdmFsaWQgc3Vycm9nYXRlIHBhaXJcbiAgICAgIGNvZGVQb2ludCA9IChsZWFkU3Vycm9nYXRlIC0gMHhEODAwIDw8IDEwIHwgY29kZVBvaW50IC0gMHhEQzAwKSArIDB4MTAwMDBcbiAgICB9IGVsc2UgaWYgKGxlYWRTdXJyb2dhdGUpIHtcbiAgICAgIC8vIHZhbGlkIGJtcCBjaGFyLCBidXQgbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgIH1cblxuICAgIGxlYWRTdXJyb2dhdGUgPSBudWxsXG5cbiAgICAvLyBlbmNvZGUgdXRmOFxuICAgIGlmIChjb2RlUG9pbnQgPCAweDgwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDEpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goY29kZVBvaW50KVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHg4MDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiB8IDB4QzAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDMpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgfCAweEUwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSA0KSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHgxMiB8IDB4RjAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludCcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVUb0J5dGVzIChzdHIsIHVuaXRzKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG5cbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBoaSA9IGMgPj4gOFxuICAgIGxvID0gYyAlIDI1NlxuICAgIGJ5dGVBcnJheS5wdXNoKGxvKVxuICAgIGJ5dGVBcnJheS5wdXNoKGhpKVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzIChzdHIpIHtcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShiYXNlNjRjbGVhbihzdHIpKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSkgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuIiwidmFyIGxvb2t1cCA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcblxuOyhmdW5jdGlvbiAoZXhwb3J0cykge1xuXHQndXNlIHN0cmljdCc7XG5cbiAgdmFyIEFyciA9ICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgPyBVaW50OEFycmF5XG4gICAgOiBBcnJheVxuXG5cdHZhciBQTFVTICAgPSAnKycuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0ggID0gJy8nLmNoYXJDb2RlQXQoMClcblx0dmFyIE5VTUJFUiA9ICcwJy5jaGFyQ29kZUF0KDApXG5cdHZhciBMT1dFUiAgPSAnYScuY2hhckNvZGVBdCgwKVxuXHR2YXIgVVBQRVIgID0gJ0EnLmNoYXJDb2RlQXQoMClcblx0dmFyIFBMVVNfVVJMX1NBRkUgPSAnLScuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0hfVVJMX1NBRkUgPSAnXycuY2hhckNvZGVBdCgwKVxuXG5cdGZ1bmN0aW9uIGRlY29kZSAoZWx0KSB7XG5cdFx0dmFyIGNvZGUgPSBlbHQuY2hhckNvZGVBdCgwKVxuXHRcdGlmIChjb2RlID09PSBQTFVTIHx8XG5cdFx0ICAgIGNvZGUgPT09IFBMVVNfVVJMX1NBRkUpXG5cdFx0XHRyZXR1cm4gNjIgLy8gJysnXG5cdFx0aWYgKGNvZGUgPT09IFNMQVNIIHx8XG5cdFx0ICAgIGNvZGUgPT09IFNMQVNIX1VSTF9TQUZFKVxuXHRcdFx0cmV0dXJuIDYzIC8vICcvJ1xuXHRcdGlmIChjb2RlIDwgTlVNQkVSKVxuXHRcdFx0cmV0dXJuIC0xIC8vbm8gbWF0Y2hcblx0XHRpZiAoY29kZSA8IE5VTUJFUiArIDEwKVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBOVU1CRVIgKyAyNiArIDI2XG5cdFx0aWYgKGNvZGUgPCBVUFBFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBVUFBFUlxuXHRcdGlmIChjb2RlIDwgTE9XRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gTE9XRVIgKyAyNlxuXHR9XG5cblx0ZnVuY3Rpb24gYjY0VG9CeXRlQXJyYXkgKGI2NCkge1xuXHRcdHZhciBpLCBqLCBsLCB0bXAsIHBsYWNlSG9sZGVycywgYXJyXG5cblx0XHRpZiAoYjY0Lmxlbmd0aCAlIDQgPiAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuXHRcdH1cblxuXHRcdC8vIHRoZSBudW1iZXIgb2YgZXF1YWwgc2lnbnMgKHBsYWNlIGhvbGRlcnMpXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHR3byBwbGFjZWhvbGRlcnMsIHRoYW4gdGhlIHR3byBjaGFyYWN0ZXJzIGJlZm9yZSBpdFxuXHRcdC8vIHJlcHJlc2VudCBvbmUgYnl0ZVxuXHRcdC8vIGlmIHRoZXJlIGlzIG9ubHkgb25lLCB0aGVuIHRoZSB0aHJlZSBjaGFyYWN0ZXJzIGJlZm9yZSBpdCByZXByZXNlbnQgMiBieXRlc1xuXHRcdC8vIHRoaXMgaXMganVzdCBhIGNoZWFwIGhhY2sgdG8gbm90IGRvIGluZGV4T2YgdHdpY2Vcblx0XHR2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXHRcdHBsYWNlSG9sZGVycyA9ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAyKSA/IDIgOiAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMSkgPyAxIDogMFxuXG5cdFx0Ly8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5cdFx0YXJyID0gbmV3IEFycihiNjQubGVuZ3RoICogMyAvIDQgLSBwbGFjZUhvbGRlcnMpXG5cblx0XHQvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG5cdFx0bCA9IHBsYWNlSG9sZGVycyA+IDAgPyBiNjQubGVuZ3RoIC0gNCA6IGI2NC5sZW5ndGhcblxuXHRcdHZhciBMID0gMFxuXG5cdFx0ZnVuY3Rpb24gcHVzaCAodikge1xuXHRcdFx0YXJyW0wrK10gPSB2XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMCwgaiA9IDA7IGkgPCBsOyBpICs9IDQsIGogKz0gMykge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxOCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCAxMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA8PCA2KSB8IGRlY29kZShiNjQuY2hhckF0KGkgKyAzKSlcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMDAwKSA+PiAxNilcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMCkgPj4gOClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRpZiAocGxhY2VIb2xkZXJzID09PSAyKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPj4gNClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9IGVsc2UgaWYgKHBsYWNlSG9sZGVycyA9PT0gMSkge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxMCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCA0KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpID4+IDIpXG5cdFx0XHRwdXNoKCh0bXAgPj4gOCkgJiAweEZGKVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdHJldHVybiBhcnJcblx0fVxuXG5cdGZ1bmN0aW9uIHVpbnQ4VG9CYXNlNjQgKHVpbnQ4KSB7XG5cdFx0dmFyIGksXG5cdFx0XHRleHRyYUJ5dGVzID0gdWludDgubGVuZ3RoICUgMywgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcblx0XHRcdG91dHB1dCA9IFwiXCIsXG5cdFx0XHR0ZW1wLCBsZW5ndGhcblxuXHRcdGZ1bmN0aW9uIGVuY29kZSAobnVtKSB7XG5cdFx0XHRyZXR1cm4gbG9va3VwLmNoYXJBdChudW0pXG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcblx0XHRcdHJldHVybiBlbmNvZGUobnVtID4+IDE4ICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDEyICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDYgJiAweDNGKSArIGVuY29kZShudW0gJiAweDNGKVxuXHRcdH1cblxuXHRcdC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcblx0XHRmb3IgKGkgPSAwLCBsZW5ndGggPSB1aW50OC5sZW5ndGggLSBleHRyYUJ5dGVzOyBpIDwgbGVuZ3RoOyBpICs9IDMpIHtcblx0XHRcdHRlbXAgPSAodWludDhbaV0gPDwgMTYpICsgKHVpbnQ4W2kgKyAxXSA8PCA4KSArICh1aW50OFtpICsgMl0pXG5cdFx0XHRvdXRwdXQgKz0gdHJpcGxldFRvQmFzZTY0KHRlbXApXG5cdFx0fVxuXG5cdFx0Ly8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuXHRcdHN3aXRjaCAoZXh0cmFCeXRlcykge1xuXHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHR0ZW1wID0gdWludDhbdWludDgubGVuZ3RoIC0gMV1cblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDIpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz09J1xuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSAyOlxuXHRcdFx0XHR0ZW1wID0gKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDJdIDw8IDgpICsgKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMTApXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPj4gNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDIpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9J1xuXHRcdFx0XHRicmVha1xuXHRcdH1cblxuXHRcdHJldHVybiBvdXRwdXRcblx0fVxuXG5cdGV4cG9ydHMudG9CeXRlQXJyYXkgPSBiNjRUb0J5dGVBcnJheVxuXHRleHBvcnRzLmZyb21CeXRlQXJyYXkgPSB1aW50OFRvQmFzZTY0XG59KHR5cGVvZiBleHBvcnRzID09PSAndW5kZWZpbmVkJyA/ICh0aGlzLmJhc2U2NGpzID0ge30pIDogZXhwb3J0cykpXG4iLCJleHBvcnRzLnJlYWQgPSBmdW5jdGlvbiAoYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbVxuICB2YXIgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIG5CaXRzID0gLTdcbiAgdmFyIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMFxuICB2YXIgZCA9IGlzTEUgPyAtMSA6IDFcbiAgdmFyIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV1cblxuICBpICs9IGRcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBzID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBlTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSBlICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgZSA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gbUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gbSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhc1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSlcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pXG4gICAgZSA9IGUgLSBlQmlhc1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pXG59XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbiAoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGNcbiAgdmFyIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMClcbiAgdmFyIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKVxuICB2YXIgZCA9IGlzTEUgPyAxIDogLTFcbiAgdmFyIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDBcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKVxuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwXG4gICAgZSA9IGVNYXhcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMilcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS1cbiAgICAgIGMgKj0gMlxuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gY1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcylcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKytcbiAgICAgIGMgLz0gMlxuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDBcbiAgICAgIGUgPSBlTWF4XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICh2YWx1ZSAqIGMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gZSArIGVCaWFzXG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IDBcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KSB7fVxuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG1cbiAgZUxlbiArPSBtTGVuXG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCkge31cblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjhcbn1cbiIsIlxuLyoqXG4gKiBpc0FycmF5XG4gKi9cblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuXG4vKipcbiAqIHRvU3RyaW5nXG4gKi9cblxudmFyIHN0ciA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbi8qKlxuICogV2hldGhlciBvciBub3QgdGhlIGdpdmVuIGB2YWxgXG4gKiBpcyBhbiBhcnJheS5cbiAqXG4gKiBleGFtcGxlOlxuICpcbiAqICAgICAgICBpc0FycmF5KFtdKTtcbiAqICAgICAgICAvLyA+IHRydWVcbiAqICAgICAgICBpc0FycmF5KGFyZ3VtZW50cyk7XG4gKiAgICAgICAgLy8gPiBmYWxzZVxuICogICAgICAgIGlzQXJyYXkoJycpO1xuICogICAgICAgIC8vID4gZmFsc2VcbiAqXG4gKiBAcGFyYW0ge21peGVkfSB2YWxcbiAqIEByZXR1cm4ge2Jvb2x9XG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBpc0FycmF5IHx8IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuICEhIHZhbCAmJiAnW29iamVjdCBBcnJheV0nID09IHN0ci5jYWxsKHZhbCk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHM9e1xuICAgIFwidmVyc2lvblwiOiBcIlwiXG59XG4iLCIvKipcbiAqIEVwaWNlbnRlciBKYXZhc2NyaXB0IGxpYnJhcmllc1xuICogdjwlPSB2ZXJzaW9uICU+XG4gKiBodHRwczovL2dpdGh1Yi5jb20vZm9yaW8vZXBpY2VudGVyLWpzLWxpYnNcbiAqL1xuXG52YXIgRiA9IHtcbiAgICB1dGlsOiB7fSxcbiAgICBmYWN0b3J5OiB7fSxcbiAgICB0cmFuc3BvcnQ6IHt9LFxuICAgIHN0b3JlOiB7fSxcbiAgICBzZXJ2aWNlOiB7fSxcbiAgICBtYW5hZ2VyOiB7XG4gICAgICAgIHN0cmF0ZWd5OiB7fVxuICAgIH0sXG5cbn07XG5cbkYudXRpbC5xdWVyeSA9IHJlcXVpcmUoJy4vdXRpbC9xdWVyeS11dGlsJyk7XG5GLnV0aWwubWFrZVNlcXVlbmNlID0gcmVxdWlyZSgnLi91dGlsL21ha2Utc2VxdWVuY2UnKTtcbkYudXRpbC5ydW4gPSByZXF1aXJlKCcuL3V0aWwvcnVuLXV0aWwnKTtcbkYudXRpbC5jbGFzc0Zyb20gPSByZXF1aXJlKCcuL3V0aWwvaW5oZXJpdCcpO1xuXG5GLmZhY3RvcnkuVHJhbnNwb3J0ID0gcmVxdWlyZSgnLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xuRi50cmFuc3BvcnQuQWpheCA9IHJlcXVpcmUoJy4vdHJhbnNwb3J0L2FqYXgtaHR0cC10cmFuc3BvcnQnKTtcblxuRi5zZXJ2aWNlLlVSTCA9IHJlcXVpcmUoJy4vc2VydmljZS91cmwtY29uZmlnLXNlcnZpY2UnKTtcbkYuc2VydmljZS5Db25maWcgPSByZXF1aXJlKCcuL3NlcnZpY2UvY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG5GLnNlcnZpY2UuUnVuID0gcmVxdWlyZSgnLi9zZXJ2aWNlL3J1bi1hcGktc2VydmljZScpO1xuRi5zZXJ2aWNlLkZpbGUgPSByZXF1aXJlKCcuL3NlcnZpY2UvYWRtaW4tZmlsZS1zZXJ2aWNlJyk7XG5GLnNlcnZpY2UuVmFyaWFibGVzID0gcmVxdWlyZSgnLi9zZXJ2aWNlL3ZhcmlhYmxlcy1hcGktc2VydmljZScpO1xuRi5zZXJ2aWNlLkRhdGEgPSByZXF1aXJlKCcuL3NlcnZpY2UvZGF0YS1hcGktc2VydmljZScpO1xuRi5zZXJ2aWNlLkF1dGggPSByZXF1aXJlKCcuL3NlcnZpY2UvYXV0aC1hcGktc2VydmljZScpO1xuRi5zZXJ2aWNlLldvcmxkID0gcmVxdWlyZSgnLi9zZXJ2aWNlL3dvcmxkLWFwaS1hZGFwdGVyJyk7XG5GLnNlcnZpY2UuU3RhdGUgPSByZXF1aXJlKCcuL3NlcnZpY2Uvc3RhdGUtYXBpLWFkYXB0ZXInKTtcbkYuc2VydmljZS5Vc2VyID0gcmVxdWlyZSgnLi9zZXJ2aWNlL3VzZXItYXBpLWFkYXB0ZXInKTtcbkYuc2VydmljZS5NZW1iZXIgPSByZXF1aXJlKCcuL3NlcnZpY2UvbWVtYmVyLWFwaS1hZGFwdGVyJyk7XG5GLnNlcnZpY2UuQXNzZXQgPSByZXF1aXJlKCcuL3NlcnZpY2UvYXNzZXQtYXBpLWFkYXB0ZXInKTtcblxuRi5zdG9yZS5Db29raWUgPSByZXF1aXJlKCcuL3N0b3JlL2Nvb2tpZS1zdG9yZScpO1xuRi5mYWN0b3J5LlN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZS9zdG9yZS1mYWN0b3J5Jyk7XG5cbkYubWFuYWdlci5TY2VuYXJpb01hbmFnZXIgPSByZXF1aXJlKCcuL21hbmFnZXJzL3NjZW5hcmlvLW1hbmFnZXInKTtcbkYubWFuYWdlci5SdW5NYW5hZ2VyID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9ydW4tbWFuYWdlcicpO1xuRi5tYW5hZ2VyLkF1dGhNYW5hZ2VyID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9hdXRoLW1hbmFnZXInKTtcbkYubWFuYWdlci5Xb3JsZE1hbmFnZXIgPSByZXF1aXJlKCcuL21hbmFnZXJzL3dvcmxkLW1hbmFnZXInKTtcblxuRi5tYW5hZ2VyLnN0cmF0ZWd5WydhbHdheXMtbmV3J10gPSByZXF1aXJlKCcuL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL2Fsd2F5cy1uZXctc3RyYXRlZ3knKTtcbkYubWFuYWdlci5zdHJhdGVneVsnY29uZGl0aW9uYWwtY3JlYXRpb24nXSA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvY29uZGl0aW9uYWwtY3JlYXRpb24tc3RyYXRlZ3knKTtcbkYubWFuYWdlci5zdHJhdGVneS5pZGVudGl0eSA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvaWRlbnRpdHktc3RyYXRlZ3knKTtcbkYubWFuYWdlci5zdHJhdGVneVsnbmV3LWlmLW1pc3NpbmcnXSA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvbmV3LWlmLW1pc3Npbmctc3RyYXRlZ3knKTtcbkYubWFuYWdlci5zdHJhdGVneVsnbmV3LWlmLW1pc3NpbmcnXSA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvbmV3LWlmLW1pc3Npbmctc3RyYXRlZ3knKTtcbkYubWFuYWdlci5zdHJhdGVneVsnbmV3LWlmLXBlcnNpc3RlZCddID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9uZXctaWYtcGVyc2lzdGVkLXN0cmF0ZWd5Jyk7XG5GLm1hbmFnZXIuc3RyYXRlZ3lbJ25ldy1pZi1pbml0aWFsaXplZCddID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9uZXctaWYtaW5pdGlhbGl6ZWQtc3RyYXRlZ3knKTtcblxuRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9lcGljZW50ZXItY2hhbm5lbC1tYW5hZ2VyJyk7XG5GLnNlcnZpY2UuQ2hhbm5lbCA9IHJlcXVpcmUoJy4vc2VydmljZS9jaGFubmVsLXNlcnZpY2UnKTtcblxuRi52ZXJzaW9uID0gJzwlPSB2ZXJzaW9uICU+JztcbkYuYXBpID0gcmVxdWlyZSgnLi9hcGktdmVyc2lvbi5qc29uJyk7XG5cbmdsb2JhbC5GID0gRjtcbm1vZHVsZS5leHBvcnRzID0gRjtcbiIsIi8qKlxuKiAjIyBBdXRob3JpemF0aW9uIE1hbmFnZXJcbipcbiogVGhlIEF1dGhvcml6YXRpb24gTWFuYWdlciBwcm92aWRlcyBhbiBlYXN5IHdheSB0byBtYW5hZ2UgdXNlciBhdXRoZW50aWNhdGlvbiAobG9nZ2luZyBpbiBhbmQgb3V0KSBhbmQgYXV0aG9yaXphdGlvbiAoa2VlcGluZyB0cmFjayBvZiB0b2tlbnMsIHNlc3Npb25zLCBhbmQgZ3JvdXBzKSBmb3IgcHJvamVjdHMuXG4qXG4qIFRoZSBBdXRob3JpemF0aW9uIE1hbmFnZXIgaXMgbW9zdCB1c2VmdWwgZm9yIFt0ZWFtIHByb2plY3RzXSguLi8uLi8uLi9nbG9zc2FyeS8jdGVhbSkgd2l0aCBhbiBhY2Nlc3MgbGV2ZWwgb2YgW0F1dGhlbnRpY2F0ZWRdKC4uLy4uLy4uL2dsb3NzYXJ5LyNhY2Nlc3MpLiBUaGVzZSBwcm9qZWN0cyBhcmUgYWNjZXNzZWQgYnkgW2VuZCB1c2Vyc10oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKSB3aG8gYXJlIG1lbWJlcnMgb2Ygb25lIG9yIG1vcmUgW2dyb3Vwc10oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3VwcykuXG4qXG4qICMjIyNVc2luZyB0aGUgQXV0aG9yaXphdGlvbiBNYW5hZ2VyXG4qXG4qIFRvIHVzZSB0aGUgQXV0aG9yaXphdGlvbiBNYW5hZ2VyLCBpbnN0YW50aWF0ZSBpdC4gVGhlbiwgbWFrZSBjYWxscyB0byBhbnkgb2YgdGhlIG1ldGhvZHMgeW91IG5lZWQ6XG4qXG4qICAgICAgIHZhciBhdXRoTWdyID0gbmV3IEYubWFuYWdlci5BdXRoTWFuYWdlcih7XG4qICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4qICAgICAgICAgICB1c2VyTmFtZTogJ2VuZHVzZXIxJyxcbiogICAgICAgICAgIHBhc3N3b3JkOiAncGFzc3cwcmQnXG4qICAgICAgIH0pO1xuKiAgICAgICBhdXRoTWdyLmxvZ2luKCkudGhlbihmdW5jdGlvbiAoKSB7XG4qICAgICAgICAgICBhdXRoTWdyLmdldEN1cnJlbnRVc2VyU2Vzc2lvbkluZm8oKTtcbiogICAgICAgfSk7XG4qXG4qXG4qIFRoZSBgb3B0aW9uc2Agb2JqZWN0IHBhc3NlZCB0byB0aGUgYEYubWFuYWdlci5BdXRoTWFuYWdlcigpYCBjYWxsIGNhbiBpbmNsdWRlOlxuKlxuKiAgICogYGFjY291bnRgOiBUaGUgYWNjb3VudCBpZCBmb3IgdGhpcyBgdXNlck5hbWVgLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpIG9yIHRoZSAqKlVzZXIgSUQqKiAoZm9yIHBlcnNvbmFsIHByb2plY3RzKS5cbiogICAqIGB1c2VyTmFtZWA6IEVtYWlsIG9yIHVzZXJuYW1lIHRvIHVzZSBmb3IgbG9nZ2luZyBpbi5cbiogICAqIGBwYXNzd29yZGA6IFBhc3N3b3JkIGZvciBzcGVjaWZpZWQgYHVzZXJOYW1lYC5cbiogICAqIGBwcm9qZWN0YDogVGhlICoqUHJvamVjdCBJRCoqIGZvciB0aGUgcHJvamVjdCB0byBsb2cgdGhpcyB1c2VyIGludG8uIE9wdGlvbmFsLlxuKiAgICogYGdyb3VwSWRgOiBJZCBvZiB0aGUgZ3JvdXAgdG8gd2hpY2ggYHVzZXJOYW1lYCBiZWxvbmdzLiBSZXF1aXJlZCBmb3IgZW5kIHVzZXJzIGlmIHRoZSBgcHJvamVjdGAgaXMgc3BlY2lmaWVkLlxuKlxuKiBJZiB5b3UgcHJlZmVyIHN0YXJ0aW5nIGZyb20gYSB0ZW1wbGF0ZSwgdGhlIEVwaWNlbnRlciBKUyBMaWJzIFtMb2dpbiBDb21wb25lbnRdKC4uLy4uLyNjb21wb25lbnRzKSB1c2VzIHRoZSBBdXRob3JpemF0aW9uIE1hbmFnZXIgYXMgd2VsbC4gVGhpcyBzYW1wbGUgSFRNTCBwYWdlIChhbmQgYXNzb2NpYXRlZCBDU1MgYW5kIEpTIGZpbGVzKSBwcm92aWRlcyBhIGxvZ2luIGZvcm0gZm9yIHRlYW0gbWVtYmVycyBhbmQgZW5kIHVzZXJzIG9mIHlvdXIgcHJvamVjdC4gSXQgYWxzbyBpbmNsdWRlcyBhIGdyb3VwIHNlbGVjdG9yIGZvciBlbmQgdXNlcnMgdGhhdCBhcmUgbWVtYmVycyBvZiBtdWx0aXBsZSBncm91cHMuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4uL3NlcnZpY2UvY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgQXV0aEFkYXB0ZXIgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL2F1dGgtYXBpLXNlcnZpY2UnKTtcbnZhciBNZW1iZXJBZGFwdGVyID0gcmVxdWlyZSgnLi4vc2VydmljZS9tZW1iZXItYXBpLWFkYXB0ZXInKTtcbnZhciBTdG9yYWdlRmFjdG9yeSA9IHJlcXVpcmUoJy4uL3N0b3JlL3N0b3JlLWZhY3RvcnknKTtcbnZhciBCdWZmZXIgPSByZXF1aXJlKCdidWZmZXInKS5CdWZmZXI7XG52YXIga2V5TmFtZXMgPSByZXF1aXJlKCcuL2tleS1uYW1lcycpO1xuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgLyoqXG4gICAgICogV2hlcmUgdG8gc3RvcmUgdXNlciBhY2Nlc3MgdG9rZW5zIGZvciB0ZW1wb3JhcnkgYWNjZXNzLiBEZWZhdWx0cyB0byBzdG9yaW5nIGluIGEgY29va2llIGluIHRoZSBicm93c2VyLlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgc3RvcmU6IHsgc3luY2hyb25vdXM6IHRydWUgfVxufTtcblxudmFyIEVQSV9DT09LSUVfS0VZID0ga2V5TmFtZXMuRVBJX0NPT0tJRV9LRVk7XG52YXIgRVBJX1NFU1NJT05fS0VZID0ga2V5TmFtZXMuRVBJX1NFU1NJT05fS0VZO1xudmFyIHRva2VuO1xudmFyIHNlc3Npb247XG5cbmZ1bmN0aW9uIHNhdmVTZXNzaW9uKHVzZXJJbmZvLCBzdG9yZSkge1xuICAgIHZhciBzZXJpYWxpemVkID0gSlNPTi5zdHJpbmdpZnkodXNlckluZm8pO1xuICAgIHN0b3JlLnNldChFUElfU0VTU0lPTl9LRVksIHNlcmlhbGl6ZWQpO1xuXG4gICAgLy9qc2hpbnQgY2FtZWxjYXNlOiBmYWxzZVxuICAgIC8vanNjczpkaXNhYmxlXG4gICAgc3RvcmUuc2V0KEVQSV9DT09LSUVfS0VZLCB1c2VySW5mby5hdXRoX3Rva2VuKTtcbn1cblxuZnVuY3Rpb24gZ2V0U2Vzc2lvbihzdG9yZSkge1xuICAgIHZhciBzZXNzaW9uID0gc3RvcmUuZ2V0KEVQSV9TRVNTSU9OX0tFWSkgfHwgJ3t9JztcbiAgICByZXR1cm4gSlNPTi5wYXJzZShzZXNzaW9uKTtcbn1cblxuZnVuY3Rpb24gQXV0aE1hbmFnZXIob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG5cbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2UodGhpcy5vcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuICAgIHRoaXMuaXNMb2NhbCA9IHVybENvbmZpZy5pc0xvY2FsaG9zdCgpO1xuXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMuYWNjb3VudCA9IHVybENvbmZpZy5hY2NvdW50UGF0aDtcbiAgICB9XG5cbiAgICAvLyBudWxsIG1pZ2h0IHNwZWNpZmllZCB0byBkaXNhYmxlIHByb2plY3QgZmlsdGVyaW5nXG4gICAgaWYgKHRoaXMub3B0aW9ucy5wcm9qZWN0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnByb2plY3QgPSB1cmxDb25maWcucHJvamVjdFBhdGg7XG4gICAgfVxuXG4gICAgdGhpcy5zdG9yZSA9IG5ldyBTdG9yYWdlRmFjdG9yeSh0aGlzLm9wdGlvbnMuc3RvcmUpO1xuICAgIHNlc3Npb24gPSBnZXRTZXNzaW9uKHRoaXMuc3RvcmUpO1xuICAgIHRva2VuID0gdGhpcy5zdG9yZS5nZXQoRVBJX0NPT0tJRV9LRVkpIHx8ICcnO1xuICAgIC8vanNoaW50IGNhbWVsY2FzZTogZmFsc2VcbiAgICAvL2pzY3M6ZGlzYWJsZVxuICAgIHRoaXMuYXV0aEFkYXB0ZXIgPSBuZXcgQXV0aEFkYXB0ZXIodGhpcy5vcHRpb25zLCB7IHRva2VuOiBzZXNzaW9uLmF1dGhfdG9rZW4gfSk7XG59XG5cbnZhciBfZmluZFVzZXJJbkdyb3VwID0gZnVuY3Rpb24gKG1lbWJlcnMsIGlkKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGo8bWVtYmVycy5sZW5ndGg7IGorKykge1xuICAgICAgICBpZiAobWVtYmVyc1tqXS51c2VySWQgPT09IGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gbWVtYmVyc1tqXTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgcmV0dXJuIG51bGw7XG59O1xuXG5BdXRoTWFuYWdlci5wcm90b3R5cGUgPSAkLmV4dGVuZChBdXRoTWFuYWdlci5wcm90b3R5cGUsIHtcblxuICAgIC8qKlxuICAgICogTG9ncyB1c2VyIGluLlxuICAgICpcbiAgICAqICoqRXhhbXBsZSoqXG4gICAgKlxuICAgICogICAgICAgYXV0aE1nci5sb2dpbih7XG4gICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgKiAgICAgICAgICAgdXNlck5hbWU6ICdlbmR1c2VyMScsXG4gICAgKiAgICAgICAgICAgcGFzc3dvcmQ6ICdwYXNzdzByZCdcbiAgICAqICAgICAgIH0pXG4gICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oc3RhdHVzT2JqKSB7XG4gICAgKiAgICAgICAgICAgICAgIC8vIGlmIGVuZHVzZXIxIGJlbG9uZ3MgdG8gZXhhY3RseSBvbmUgZ3JvdXBcbiAgICAqICAgICAgICAgICAgICAgLy8gKG9yIGlmIHRoZSBsb2dpbigpIGNhbGwgaXMgbW9kaWZpZWQgdG8gaW5jbHVkZSB0aGUgZ3JvdXAgaWQpXG4gICAgKiAgICAgICAgICAgICAgIC8vIGNvbnRpbnVlIGhlcmVcbiAgICAqICAgICAgICAgICB9KVxuICAgICogICAgICAgICAgIC5mYWlsKGZ1bmN0aW9uKHN0YXR1c09iaikge1xuICAgICogICAgICAgICAgICAgICAvLyBpZiBlbmR1c2VyMSBiZWxvbmdzIHRvIG11bHRpcGxlIGdyb3VwcyxcbiAgICAqICAgICAgICAgICAgICAgLy8gdGhlIGxvZ2luKCkgY2FsbCBmYWlsc1xuICAgICogICAgICAgICAgICAgICAvLyBhbmQgcmV0dXJucyBhbGwgZ3JvdXBzIG9mIHdoaWNoIHRoZSB1c2VyIGlzIGEgbWVtYmVyXG4gICAgKiAgICAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaSA8IHN0YXR1c09iai51c2VyR3JvdXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgKiAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzdGF0dXNPYmoudXNlckdyb3Vwc1tpXS5uYW1lLCBzdGF0dXNPYmoudXNlckdyb3Vwc1tpXS5ncm91cElkKTtcbiAgICAqICAgICAgICAgICAgICAgfVxuICAgICogICAgICAgICAgIH0pO1xuICAgICpcbiAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgKlxuICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLiBJZiBub3QgcGFzc2VkIGluIHdoZW4gY3JlYXRpbmcgYW4gaW5zdGFuY2Ugb2YgdGhlIG1hbmFnZXIgKGBGLm1hbmFnZXIuQXV0aE1hbmFnZXIoKWApLCB0aGVzZSBvcHRpb25zIHNob3VsZCBpbmNsdWRlOlxuICAgICogQHBhcmFtIHtzdHJpbmd9IGBvcHRpb25zLmFjY291bnRgIFRoZSBhY2NvdW50IGlkIGZvciB0aGlzIGB1c2VyTmFtZWAuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgdGhlICoqVXNlciBJRCoqIChmb3IgcGVyc29uYWwgcHJvamVjdHMpLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IGBvcHRpb25zLnVzZXJOYW1lYCBFbWFpbCBvciB1c2VybmFtZSB0byB1c2UgZm9yIGxvZ2dpbmcgaW4uXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gYG9wdGlvbnMucGFzc3dvcmRgIFBhc3N3b3JkIGZvciBzcGVjaWZpZWQgYHVzZXJOYW1lYC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBgb3B0aW9ucy5wcm9qZWN0YCAoT3B0aW9uYWwpIFRoZSAqKlByb2plY3QgSUQqKiBmb3IgdGhlIHByb2plY3QgdG8gbG9nIHRoaXMgdXNlciBpbnRvLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IGBvcHRpb25zLmdyb3VwSWRgIFRoZSBpZCBvZiB0aGUgZ3JvdXAgdG8gd2hpY2ggYHVzZXJOYW1lYCBiZWxvbmdzLiBSZXF1aXJlZCBmb3IgW2VuZCB1c2Vyc10oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKSBpZiB0aGUgYHByb2plY3RgIGlzIHNwZWNpZmllZCBhbmQgaWYgdGhlIGVuZCB1c2VycyBhcmUgbWVtYmVycyBvZiBtdWx0aXBsZSBbZ3JvdXBzXSguLi8uLi8uLi9nbG9zc2FyeS8jZ3JvdXBzKSwgb3RoZXJ3aXNlIG9wdGlvbmFsLlxuICAgICovXG4gICAgbG9naW46IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciAkZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgdmFyIGFkYXB0ZXJPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwgeyBzdWNjZXNzOiAkLm5vb3AsIGVycm9yOiAkLm5vb3AgfSwgdGhpcy5vcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgdmFyIG91dFN1Y2Nlc3MgPSBhZGFwdGVyT3B0aW9ucy5zdWNjZXNzO1xuICAgICAgICB2YXIgb3V0RXJyb3IgPSBhZGFwdGVyT3B0aW9ucy5lcnJvcjtcbiAgICAgICAgdmFyIGdyb3VwSWQgPSBhZGFwdGVyT3B0aW9ucy5ncm91cElkO1xuXG4gICAgICAgIHZhciBhY2NvdW50TmFtZSA9IGFkYXB0ZXJPcHRpb25zLmFjY291bnQ7XG4gICAgICAgIHZhciBwcm9qZWN0TmFtZSA9IGFkYXB0ZXJPcHRpb25zLnByb2plY3Q7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zdG9yZS5yb290ID09PSB1bmRlZmluZWQgJiYgYWNjb3VudE5hbWUgJiYgcHJvamVjdE5hbWUgJiYgIXRoaXMuaXNMb2NhbCkge1xuICAgICAgICAgICAgdGhpcy5zdG9yZS5zZXJ2aWNlT3B0aW9ucy5yb290ID0gJy9hcHAvJyArIGFjY291bnROYW1lICsgJy8nICsgcHJvamVjdE5hbWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZGVjb2RlVG9rZW4gPSBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgICAgIHZhciBlbmNvZGVkID0gdG9rZW4uc3BsaXQoJy4nKVsxXTtcbiAgICAgICAgICAgIHdoaWxlIChlbmNvZGVkLmxlbmd0aCAlIDQgIT09IDApIHtcbiAgICAgICAgICAgICAgICBlbmNvZGVkICs9ICc9JztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGRlY29kZSA9IHdpbmRvdy5hdG9iID8gd2luZG93LmF0b2IgOiBmdW5jdGlvbiAoZW5jb2RlZCkgeyByZXR1cm4gbmV3IEJ1ZmZlcihlbmNvZGVkLCAnYmFzZTY0JykudG9TdHJpbmcoJ2FzY2lpJyk7IH07XG5cbiAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKGRlY29kZShlbmNvZGVkKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZUdyb3VwRXJyb3IgPSBmdW5jdGlvbiAobWVzc2FnZSwgc3RhdHVzQ29kZSwgZGF0YSkge1xuICAgICAgICAgICAgLy8gbG9nb3V0IHRoZSB1c2VyIHNpbmNlIGl0J3MgaW4gYW4gaW52YWxpZCBzdGF0ZSB3aXRoIG5vIGdyb3VwIHNlbGVjdGVkXG4gICAgICAgICAgICBfdGhpcy5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXJyb3IgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGF0YSwgeyBzdGF0dXNUZXh0OiBtZXNzYWdlLCBzdGF0dXM6IHN0YXR1c0NvZGUgfSk7XG4gICAgICAgICAgICAgICAgJGQucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBoYW5kbGVTdWNjZXNzID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAvL2pzaGludCBjYW1lbGNhc2U6IGZhbHNlXG4gICAgICAgICAgICAvL2pzY3M6ZGlzYWJsZVxuICAgICAgICAgICAgdG9rZW4gPSByZXNwb25zZS5hY2Nlc3NfdG9rZW47XG4gICAgICAgICAgICB2YXIgdXNlckluZm8gPSBkZWNvZGVUb2tlbih0b2tlbik7XG4gICAgICAgICAgICB2YXIgdXNlckdyb3VwT3B0cyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBhZGFwdGVyT3B0aW9ucywgeyBzdWNjZXNzOiAkLm5vb3AsIHRva2VuOiB0b2tlbiB9KTtcbiAgICAgICAgICAgIF90aGlzLmdldFVzZXJHcm91cHMoeyB1c2VySWQ6IHVzZXJJbmZvLnVzZXJfaWQsIHRva2VuOiB0b2tlbiB9LCB1c2VyR3JvdXBPcHRzKS5kb25lKCBmdW5jdGlvbiAobWVtYmVySW5mbykge1xuICAgICAgICAgICAgICAgIHZhciBkYXRhID0ge2F1dGg6IHJlc3BvbnNlLCB1c2VyOiB1c2VySW5mbywgdXNlckdyb3VwczogbWVtYmVySW5mbywgZ3JvdXBTZWxlY3Rpb246IHt9IH07XG5cbiAgICAgICAgICAgICAgICB2YXIgc2Vzc2lvbkluZm8gPSB7XG4gICAgICAgICAgICAgICAgICAgICdhdXRoX3Rva2VuJzogdG9rZW4sXG4gICAgICAgICAgICAgICAgICAgICdhY2NvdW50JzogYWRhcHRlck9wdGlvbnMuYWNjb3VudCxcbiAgICAgICAgICAgICAgICAgICAgJ3Byb2plY3QnOiBhZGFwdGVyT3B0aW9ucy5wcm9qZWN0LFxuICAgICAgICAgICAgICAgICAgICAndXNlcklkJzogdXNlckluZm8udXNlcl9pZFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLy8gVGhlIGdyb3VwIGlzIG5vdCByZXF1aXJlZCBpZiB0aGUgdXNlciBpcyBub3QgbG9nZ2luZyBpbnRvIGEgcHJvamVjdFxuICAgICAgICAgICAgICAgIGlmICghYWRhcHRlck9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBzYXZlU2Vzc2lvbihzZXNzaW9uSW5mbywgX3RoaXMuc3RvcmUpO1xuICAgICAgICAgICAgICAgICAgICBvdXRTdWNjZXNzLmFwcGx5KHRoaXMsIFtkYXRhXSk7XG4gICAgICAgICAgICAgICAgICAgICRkLnJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgZ3JvdXAgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlmIChtZW1iZXJJbmZvLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVHcm91cEVycm9yKCdUaGUgdXNlciBoYXMgbm8gZ3JvdXBzIGFzc29jaWF0ZWQgaW4gdGhpcyBhY2NvdW50JywgNDAxLCBkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWVtYmVySW5mby5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gU2VsZWN0IHRoZSBvbmx5IGdyb3VwXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwID0gbWVtYmVySW5mb1swXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1lbWJlckluZm8ubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZ3JvdXBJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZpbHRlcmVkR3JvdXBzID0gJC5ncmVwKG1lbWJlckluZm8sIGZ1bmN0aW9uIChyZXNHcm91cCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNHcm91cC5ncm91cElkID09PSBncm91cElkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cCA9IGZpbHRlcmVkR3JvdXBzLmxlbmd0aCA9PT0gMSA/IGZpbHRlcmVkR3JvdXBzWzBdIDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChncm91cCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZ3JvdXBTZWxlY3Rpb24gPSBncm91cC5ncm91cElkO1xuICAgICAgICAgICAgICAgICAgICBkYXRhLmdyb3VwU2VsZWN0aW9uW2FkYXB0ZXJPcHRpb25zLnByb2plY3RdID0gZ3JvdXBTZWxlY3Rpb247XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZXNzaW9uSW5mb1dpdGhHcm91cCA9ICQuZXh0ZW5kKHt9LCBzZXNzaW9uSW5mbywge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2dyb3VwSWQnOiBncm91cC5ncm91cElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2dyb3VwTmFtZSc6IGdyb3VwLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnaXNGYWMnOiBfZmluZFVzZXJJbkdyb3VwKGdyb3VwLm1lbWJlcnMsIHVzZXJJbmZvLnVzZXJfaWQpLnJvbGUgPT09ICdmYWNpbGl0YXRvcidcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHNhdmVTZXNzaW9uKHNlc3Npb25JbmZvV2l0aEdyb3VwLCBfdGhpcy5zdG9yZSk7XG4gICAgICAgICAgICAgICAgICAgIG91dFN1Y2Nlc3MuYXBwbHkodGhpcywgW2RhdGFdKTtcbiAgICAgICAgICAgICAgICAgICAgJGQucmVzb2x2ZShkYXRhKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVHcm91cEVycm9yKCdUaGlzIHVzZXIgaXMgYXNzb2NpYXRlZCB3aXRoIG1vcmUgdGhhbiBvbmUgZ3JvdXAuIFBsZWFzZSBzcGVjaWZ5IGEgZ3JvdXAgaWQgdG8gbG9nIGludG8gYW5kIHRyeSBhZ2FpbicsIDQwMywgZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuZmFpbCgkZC5yZWplY3QpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGFkYXB0ZXJPcHRpb25zLnN1Y2Nlc3MgPSBoYW5kbGVTdWNjZXNzO1xuICAgICAgICBhZGFwdGVyT3B0aW9ucy5lcnJvciA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgaWYgKGFkYXB0ZXJPcHRpb25zLmFjY291bnQpIHtcbiAgICAgICAgICAgICAgICAvLyBUcnkgdG8gbG9naW4gYXMgYSBzeXN0ZW0gdXNlclxuICAgICAgICAgICAgICAgIGFkYXB0ZXJPcHRpb25zLmFjY291bnQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGFkYXB0ZXJPcHRpb25zLmVycm9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBvdXRFcnJvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICAkZC5yZWplY3QocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBfdGhpcy5hdXRoQWRhcHRlci5sb2dpbihhZGFwdGVyT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvdXRFcnJvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgJGQucmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmF1dGhBZGFwdGVyLmxvZ2luKGFkYXB0ZXJPcHRpb25zKTtcbiAgICAgICAgcmV0dXJuICRkLnByb21pc2UoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgKiBMb2dzIHVzZXIgb3V0LlxuICAgICpcbiAgICAqICoqRXhhbXBsZSoqXG4gICAgKlxuICAgICogICAgICAgYXV0aE1nci5sb2dvdXQoKTtcbiAgICAqXG4gICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICpcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAqL1xuICAgIGxvZ291dDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGFkYXB0ZXJPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwgeyB0b2tlbjogdG9rZW4gfSwgdGhpcy5vcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICB2YXIgcmVtb3ZlQ29va2llRm4gPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIF90aGlzLnN0b3JlLnJlbW92ZShFUElfQ09PS0lFX0tFWSwgYWRhcHRlck9wdGlvbnMpO1xuICAgICAgICAgICAgX3RoaXMuc3RvcmUucmVtb3ZlKEVQSV9TRVNTSU9OX0tFWSwgYWRhcHRlck9wdGlvbnMpO1xuICAgICAgICAgICAgdG9rZW4gPSAnJztcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdGhpcy5hdXRoQWRhcHRlci5sb2dvdXQoYWRhcHRlck9wdGlvbnMpLmRvbmUocmVtb3ZlQ29va2llRm4pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBleGlzdGluZyB1c2VyIGFjY2VzcyB0b2tlbiBpZiB0aGUgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbi4gT3RoZXJ3aXNlLCBsb2dzIHRoZSB1c2VyIGluLCBjcmVhdGluZyBhIG5ldyB1c2VyIGFjY2VzcyB0b2tlbiwgYW5kIHJldHVybnMgdGhlIG5ldyB0b2tlbi4gKFNlZSBbbW9yZSBiYWNrZ3JvdW5kIG9uIGFjY2VzcyB0b2tlbnNdKC4uLy4uLy4uL3Byb2plY3RfYWNjZXNzLykpLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgYXV0aE1nci5nZXRUb2tlbigpXG4gICAgICogICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICogICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNeSB0b2tlbiBpcyAnLCB0b2tlbik7XG4gICAgICogICAgICAgICAgfSk7XG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgKi9cbiAgICBnZXRUb2tlbjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwgdGhpcy5vcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICB2YXIgJGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgIGlmICh0b2tlbikge1xuICAgICAgICAgICAgJGQucmVzb2x2ZSh0b2tlbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2luKGh0dHBPcHRpb25zKS50aGVuKCRkLnJlc29sdmUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkZC5wcm9taXNlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gYXJyYXkgb2YgZ3JvdXAgcmVjb3Jkcywgb25lIGZvciBlYWNoIGdyb3VwIG9mIHdoaWNoIHRoZSBjdXJyZW50IHVzZXIgaXMgYSBtZW1iZXIuIEVhY2ggZ3JvdXAgcmVjb3JkIGluY2x1ZGVzIHRoZSBncm91cCBgbmFtZWAsIGBhY2NvdW50YCwgYHByb2plY3RgLCBhbmQgYGdyb3VwSWRgLlxuICAgICAqXG4gICAgICogSWYgc29tZSBlbmQgdXNlcnMgaW4geW91ciBwcm9qZWN0IGFyZSBtZW1iZXJzIG9mIG11bHRpcGxlIGdyb3VwcywgdGhpcyBpcyBhIHVzZWZ1bCBtZXRob2QgdG8gY2FsbCBvbiB5b3VyIHByb2plY3QncyBsb2dpbiBwYWdlLiBXaGVuIHRoZSB1c2VyIGF0dGVtcHRzIHRvIGxvZyBpbiwgeW91IGNhbiB1c2UgdGhpcyB0byBkaXNwbGF5IHRoZSBncm91cHMgb2Ygd2hpY2ggdGhlIHVzZXIgaXMgbWVtYmVyLCBhbmQgaGF2ZSB0aGUgdXNlciBzZWxlY3QgdGhlIGNvcnJlY3QgZ3JvdXAgdG8gbG9nIGluIHRvIGZvciB0aGlzIHNlc3Npb24uXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICAvLyBnZXQgZ3JvdXBzIGZvciBjdXJyZW50IHVzZXJcbiAgICAgKiAgICAgIHZhciBzZXNzaW9uT2JqID0gYXV0aE1nci5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICogICAgICBhdXRoTWdyLmdldFVzZXJHcm91cHMoeyB1c2VySWQ6IHNlc3Npb25PYmoudXNlcklkLCB0b2tlbjogc2Vzc2lvbk9iai5hdXRoX3Rva2VuIH0pXG4gICAgICogICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGdyb3Vwcykge1xuICAgICAqICAgICAgICAgICAgICBmb3IgKHZhciBpPTA7IGkgPCBncm91cHMubGVuZ3RoOyBpKyspXG4gICAgICogICAgICAgICAgICAgICAgICB7IGNvbnNvbGUubG9nKGdyb3Vwc1tpXS5uYW1lKTsgfVxuICAgICAqICAgICAgICAgIH0pO1xuICAgICAqXG4gICAgICogICAgICAvLyBnZXQgZ3JvdXBzIGZvciBwYXJ0aWN1bGFyIHVzZXJcbiAgICAgKiAgICAgIGF1dGhNZ3IuZ2V0VXNlckdyb3Vwcyh7dXNlcklkOiAnYjFjMTlkZGEtMmQyZS00Nzc3LWFkNWQtMzkyOWYxN2U4NmQzJywgdG9rZW46IHNhdmVkUHJvakFjY2Vzc1Rva2VuIH0pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gYHBhcmFtc2AgT2JqZWN0IHdpdGggYSB1c2VySWQgYW5kIHRva2VuIHByb3BlcnRpZXMuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGBwYXJhbXMudXNlcklkYCBUaGUgdXNlcklkLiBJZiBsb29raW5nIHVwIGdyb3VwcyBmb3IgdGhlIGN1cnJlbnRseSBsb2dnZWQgaW4gdXNlciwgdGhpcyBpcyBpbiB0aGUgc2Vzc2lvbiBpbmZvcm1hdGlvbi4gT3RoZXJ3aXNlLCBwYXNzIGEgc3RyaW5nLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBgcGFyYW1zLnRva2VuYCBUaGUgYXV0aG9yaXphdGlvbiBjcmVkZW50aWFscyAoYWNjZXNzIHRva2VuKSB0byB1c2UgZm9yIGNoZWNraW5nIHRoZSBncm91cHMgZm9yIHRoaXMgdXNlci4gSWYgbG9va2luZyB1cCBncm91cHMgZm9yIHRoZSBjdXJyZW50bHkgbG9nZ2VkIGluIHVzZXIsIHRoaXMgaXMgaW4gdGhlIHNlc3Npb24gaW5mb3JtYXRpb24uIEEgdGVhbSBtZW1iZXIncyB0b2tlbiBvciBhIHByb2plY3QgYWNjZXNzIHRva2VuIGNhbiBhY2Nlc3MgYWxsIHRoZSBncm91cHMgZm9yIGFsbCBlbmQgdXNlcnMgaW4gdGhlIHRlYW0gb3IgcHJvamVjdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICovXG4gICAgZ2V0VXNlckdyb3VwczogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICB2YXIgYWRhcHRlck9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7IHN1Y2Nlc3M6ICQubm9vcCB9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICB2YXIgJGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgIHZhciBvdXRTdWNjZXNzID0gYWRhcHRlck9wdGlvbnMuc3VjY2VzcztcblxuICAgICAgICBhZGFwdGVyT3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24gKG1lbWJlckluZm8pIHtcbiAgICAgICAgICAgIC8vIFRoZSBtZW1iZXIgQVBJIGlzIGF0IHRoZSBhY2NvdW50IHNjb3BlLCB3ZSBmaWx0ZXIgYnkgcHJvamVjdFxuICAgICAgICAgICAgaWYgKGFkYXB0ZXJPcHRpb25zLnByb2plY3QpIHtcbiAgICAgICAgICAgICAgICBtZW1iZXJJbmZvID0gJC5ncmVwKG1lbWJlckluZm8sIGZ1bmN0aW9uIChncm91cCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ3JvdXAucHJvamVjdCA9PT0gYWRhcHRlck9wdGlvbnMucHJvamVjdDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3V0U3VjY2Vzcy5hcHBseSh0aGlzLCBbbWVtYmVySW5mb10pO1xuICAgICAgICAgICAgJGQucmVzb2x2ZShtZW1iZXJJbmZvKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgbWVtYmVyQWRhcHRlciA9IG5ldyBNZW1iZXJBZGFwdGVyKHsgdG9rZW46IHBhcmFtcy50b2tlbiB9KTtcbiAgICAgICAgbWVtYmVyQWRhcHRlci5nZXRHcm91cHNGb3JVc2VyKHBhcmFtcywgYWRhcHRlck9wdGlvbnMpLmZhaWwoJGQucmVqZWN0KTtcbiAgICAgICAgcmV0dXJuICRkLnByb21pc2UoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBzZXNzaW9uIGluZm9ybWF0aW9uIGZvciB0aGUgY3VycmVudCB1c2VyLCBpbmNsdWRpbmcgdGhlIGB1c2VySWRgLCBgYWNjb3VudGAsIGBwcm9qZWN0YCwgYGdyb3VwSWRgLCBgZ3JvdXBOYW1lYCwgYGlzRmFjYCAod2hldGhlciB0aGUgZW5kIHVzZXIgaXMgYSBmYWNpbGl0YXRvciBvZiB0aGlzIGdyb3VwKSwgYW5kIGBhdXRoX3Rva2VuYCAodXNlciBhY2Nlc3MgdG9rZW4pLlxuICAgICAqXG4gICAgICogKkltcG9ydGFudCo6IFRoaXMgbWV0aG9kIGlzIHN5bmNocm9ub3VzLiBUaGUgc2Vzc2lvbiBpbmZvcm1hdGlvbiBpcyByZXR1cm5lZCBpbW1lZGlhdGVseSBpbiBhbiBvYmplY3Q7IG5vIGNhbGxiYWNrcyBvciBwcm9taXNlcyBhcmUgbmVlZGVkLlxuICAgICAqXG4gICAgICogQnkgZGVmYXVsdCwgc2Vzc2lvbiBpbmZvcm1hdGlvbiBpcyBzdG9yZWQgaW4gYSBjb29raWUgaW4gdGhlIGJyb3dzZXIuIFlvdSBjYW4gY2hhbmdlIHRoaXMgd2l0aCB0aGUgYHN0b3JlYCBjb25maWd1cmF0aW9uIG9wdGlvbi5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBzZXNzaW9uT2JqID0gYXV0aE1nci5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgKi9cbiAgICBnZXRDdXJyZW50VXNlclNlc3Npb25JbmZvOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gZ2V0U2Vzc2lvbih0aGlzLnN0b3JlLCBvcHRpb25zKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBdXRoTWFuYWdlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIENoYW5uZWwgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL2NoYW5uZWwtc2VydmljZScpO1xuXG4vKipcbiAqICMjIENoYW5uZWwgTWFuYWdlclxuICpcbiAqIFRoZXJlIGFyZSB0d28gbWFpbiB1c2UgY2FzZXMgZm9yIHRoZSBjaGFubmVsOiBldmVudCBub3RpZmljYXRpb25zIGFuZCBjaGF0IG1lc3NhZ2VzLlxuICpcbiAqIFRoZSBDaGFubmVsIE1hbmFnZXIgaXMgYSB3cmFwcGVyIGFyb3VuZCB0aGUgZGVmYXVsdCBbY29tZXRkIEphdmFTY3JpcHQgbGlicmFyeV0oaHR0cDovL2RvY3MuY29tZXRkLm9yZy8yL3JlZmVyZW5jZS9qYXZhc2NyaXB0Lmh0bWwpLCBgJC5jb21ldGRgLiBJdCBwcm92aWRlcyBhIGZldyBuaWNlIGZlYXR1cmVzIHRoYXQgYCQuY29tZXRkYCBkb2Vzbid0LCBpbmNsdWRpbmc6XG4gKlxuICogKiBBdXRvbWF0aWMgcmUtc3Vic2NyaXB0aW9uIHRvIGNoYW5uZWxzIGlmIHlvdSBsb3NlIHlvdXIgY29ubmVjdGlvblxuICogKiBPbmxpbmUgLyBPZmZsaW5lIG5vdGlmaWNhdGlvbnNcbiAqICogJ0V2ZW50cycgZm9yIGNvbWV0ZCBub3RpZmljYXRpb25zIChpbnN0ZWFkIG9mIGhhdmluZyB0byBsaXN0ZW4gb24gc3BlY2lmaWMgbWV0YSBjaGFubmVscylcbiAqXG4gKiBXaGlsZSB5b3UgY2FuIHdvcmsgZGlyZWN0bHkgd2l0aCB0aGUgQ2hhbm5lbCBNYW5hZ2VyIHRocm91Z2ggTm9kZS5qcyAoZm9yIGV4YW1wbGUsIGByZXF1aXJlKCdtYW5hZ2VyL2NoYW5uZWwtbWFuYWdlcicpYCkgLS0gb3IgZXZlbiB3b3JrIGRpcmVjdGx5IHdpdGggYCQuY29tZXRkYCBhbmQgRXBpY2VudGVyJ3MgdW5kZXJseWluZyBbUHVzaCBDaGFubmVsIEFQSV0oLi4vLi4vLi4vcmVzdF9hcGlzL211bHRpcGxheWVyL2NoYW5uZWwvKSAtLSBtb3N0IG9mdGVuIGl0IHdpbGwgYmUgZWFzaWVzdCB0byB3b3JrIHdpdGggdGhlIFtFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyXSguLi9lcGljZW50ZXItY2hhbm5lbC1tYW5hZ2VyLykuIFRoZSBFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyIGlzIGEgd3JhcHBlciB0aGF0IGluc3RhbnRpYXRlcyBhIENoYW5uZWwgTWFuYWdlciB3aXRoIEVwaWNlbnRlci1zcGVjaWZpYyBkZWZhdWx0cy5cbiAqXG4gKiBZb3UnbGwgbmVlZCB0byBpbmNsdWRlIHRoZSBgZXBpY2VudGVyLW11bHRpcGxheWVyLWRlcGVuZGVuY2llcy5qc2AgbGlicmFyeSBpbiBhZGRpdGlvbiB0byB0aGUgYGVwaWNlbnRlci5qc2AgbGlicmFyeSBpbiB5b3VyIHByb2plY3QgdG8gdXNlIHRoZSBDaGFubmVsIE1hbmFnZXIuIChTZWUgW0luY2x1ZGluZyBFcGljZW50ZXIuanNdKC4uLy4uLyNpbmNsdWRlKS4pXG4gKlxuICogVG8gdXNlIHRoZSBDaGFubmVsIE1hbmFnZXIgaW4gY2xpZW50LXNpZGUgSmF2YVNjcmlwdCwgaW5zdGFudGlhdGUgdGhlIFtFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyXSguLi9lcGljZW50ZXItY2hhbm5lbC1tYW5hZ2VyLyksIGdldCB0aGUgY2hhbm5lbCwgdGhlbiB1c2UgdGhlIGNoYW5uZWwncyBgc3Vic2NyaWJlKClgIGFuZCBgcHVibGlzaCgpYCBtZXRob2RzIHRvIHN1YnNjcmliZSB0byB0b3BpY3Mgb3IgcHVibGlzaCBkYXRhIHRvIHRvcGljcy5cbiAqXG4gKiAgICAgICAgdmFyIGNtID0gbmV3IEYubWFuYWdlci5DaGFubmVsTWFuYWdlcigpO1xuICogICAgICAgIHZhciBjaGFubmVsID0gY20uZ2V0Q2hhbm5lbCgpO1xuICpcbiAqICAgICAgICBjaGFubmVsLnN1YnNjcmliZSgndG9waWMnLCBjYWxsYmFjayk7XG4gKiAgICAgICAgY2hhbm5lbC5wdWJsaXNoKCd0b3BpYycsIHsgbXlEYXRhOiAxMDAgfSk7XG4gKlxuICogVGhlIHBhcmFtZXRlcnMgZm9yIGluc3RhbnRpYXRpbmcgYSBDaGFubmVsIE1hbmFnZXIgaW5jbHVkZTpcbiAqXG4gKiAqIGBvcHRpb25zYCBUaGUgb3B0aW9ucyBvYmplY3QgdG8gY29uZmlndXJlIHRoZSBDaGFubmVsIE1hbmFnZXIuIEJlc2lkZXMgdGhlIGNvbW1vbiBvcHRpb25zIGxpc3RlZCBoZXJlLCBzZWUgaHR0cDovL2RvY3MuY29tZXRkLm9yZy9yZWZlcmVuY2UvamF2YXNjcmlwdC5odG1sIGZvciBvdGhlciBzdXBwb3J0ZWQgb3B0aW9ucy5cbiAqICogYG9wdGlvbnMudXJsYCBUaGUgQ29tZXRkIGVuZHBvaW50IFVSTC5cbiAqICogYG9wdGlvbnMud2Vic29ja2V0RW5hYmxlZGAgV2hldGhlciB3ZWJzb2NrZXQgc3VwcG9ydCBpcyBhY3RpdmUgKGJvb2xlYW4pLlxuICogKiBgb3B0aW9ucy5jaGFubmVsYCBPdGhlciBkZWZhdWx0cyB0byBwYXNzIG9uIHRvIGluc3RhbmNlcyBvZiB0aGUgdW5kZXJseWluZyBDaGFubmVsIFNlcnZpY2UuIFNlZSBbQ2hhbm5lbCBTZXJ2aWNlXSguLi9jaGFubmVsLXNlcnZpY2UvKSBmb3IgZGV0YWlscy5cbiAqXG4gKi9cbnZhciBDaGFubmVsTWFuYWdlciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgaWYgKCEkLmNvbWV0ZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbWV0ZCBsaWJyYXJ5IG5vdCBmb3VuZC4gUGxlYXNlIGluY2x1ZGUgZXBpY2VudGVyLW11bHRpcGxheWVyLWRlcGVuZGVuY2llcy5qcycpO1xuICAgIH1cbiAgICBpZiAoIW9wdGlvbnMgfHwgIW9wdGlvbnMudXJsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHByb3ZpZGUgYW4gdXJsIGZvciB0aGUgY29tZXRkIHNlcnZlcicpO1xuICAgIH1cblxuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBDb21ldGQgZW5kcG9pbnQgVVJMLlxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdXJsOiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGxvZyBsZXZlbCBmb3IgdGhlIGNoYW5uZWwgKGxvZ3MgdG8gY29uc29sZSkuXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBsb2dMZXZlbDogJ2luZm8nLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHdlYnNvY2tldCBzdXBwb3J0IGlzIGFjdGl2ZS4gRGVmYXVsdHMgdG8gYGZhbHNlYDsgRXBpY2VudGVyIGRvZXNuJ3QgY3VycmVudGx5IHN1cHBvcnQgY29tbXVuaWNhdGlvbiB0aHJvdWdoIHdlYnNvY2tldHMuXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgd2Vic29ja2V0RW5hYmxlZDogZmFsc2UsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIGZhbHNlIGVhY2ggaW5zdGFuY2Ugb2YgQ2hhbm5lbCB3aWxsIGhhdmUgYSBzZXBhcmF0ZSBjb21ldGQgY29ubmVjdGlvbiB0byBzZXJ2ZXIsIHdoaWNoIGNvdWxkIGJlIG5vaXN5LiBTZXQgdG8gdHJ1ZSB0byByZS11c2UgdGhlIHNhbWUgY29ubmVjdGlvbiBhY3Jvc3MgaW5zdGFuY2VzLlxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHNoYXJlQ29ubmVjdGlvbjogZmFsc2UsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE90aGVyIGRlZmF1bHRzIHRvIHBhc3Mgb24gdG8gaW5zdGFuY2VzIG9mIHRoZSB1bmRlcmx5aW5nIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pLCB3aGljaCBhcmUgY3JlYXRlZCB0aHJvdWdoIGBnZXRDaGFubmVsKClgLlxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgY2hhbm5lbDoge1xuXG4gICAgICAgIH1cbiAgICB9O1xuICAgIHZhciBkZWZhdWx0Q29tZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICB0aGlzLmN1cnJlbnRTdWJzY3JpcHRpb25zID0gW107XG4gICAgdGhpcy5vcHRpb25zID0gZGVmYXVsdENvbWV0T3B0aW9ucztcblxuICAgIGlmIChkZWZhdWx0Q29tZXRPcHRpb25zLnNoYXJlQ29ubmVjdGlvbiAmJiBDaGFubmVsTWFuYWdlci5wcm90b3R5cGUuX2NvbWV0ZCkge1xuICAgICAgICB0aGlzLmNvbWV0ZCA9IENoYW5uZWxNYW5hZ2VyLnByb3RvdHlwZS5fY29tZXRkO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgdmFyIGNvbWV0ZCA9IG5ldyAkLkNvbWV0ZCgpO1xuICAgIENoYW5uZWxNYW5hZ2VyLnByb3RvdHlwZS5fY29tZXRkID0gY29tZXRkO1xuXG4gICAgY29tZXRkLndlYnNvY2tldEVuYWJsZWQgPSBkZWZhdWx0Q29tZXRPcHRpb25zLndlYnNvY2tldEVuYWJsZWQ7XG5cbiAgICB0aGlzLmlzQ29ubmVjdGVkID0gZmFsc2U7XG4gICAgdmFyIGNvbm5lY3Rpb25Ccm9rZW4gPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAkKHRoaXMpLnRyaWdnZXIoJ2Rpc2Nvbm5lY3QnLCBtZXNzYWdlKTtcbiAgICB9O1xuICAgIHZhciBjb25uZWN0aW9uU3VjY2VlZGVkID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgJCh0aGlzKS50cmlnZ2VyKCdjb25uZWN0JywgbWVzc2FnZSk7XG4gICAgfTtcbiAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgY29tZXRkLmNvbmZpZ3VyZShkZWZhdWx0Q29tZXRPcHRpb25zKTtcblxuICAgIGNvbWV0ZC5hZGRMaXN0ZW5lcignL21ldGEvY29ubmVjdCcsIGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgIHZhciB3YXNDb25uZWN0ZWQgPSB0aGlzLmlzQ29ubmVjdGVkO1xuICAgICAgICB0aGlzLmlzQ29ubmVjdGVkID0gKG1lc3NhZ2Uuc3VjY2Vzc2Z1bCA9PT0gdHJ1ZSk7XG4gICAgICAgIGlmICghd2FzQ29ubmVjdGVkICYmIHRoaXMuaXNDb25uZWN0ZWQpIHsgLy9Db25uZWN0aW5nIGZvciB0aGUgZmlyc3QgdGltZVxuICAgICAgICAgICAgY29ubmVjdGlvblN1Y2NlZWRlZC5jYWxsKHRoaXMsIG1lc3NhZ2UpO1xuICAgICAgICB9IGVsc2UgaWYgKHdhc0Nvbm5lY3RlZCAmJiAhdGhpcy5pc0Nvbm5lY3RlZCkgeyAvL09ubHkgdGhyb3cgZGlzY29ubmVjdGVkIG1lc3NhZ2UgZnJvIHRoZSBmaXJzdCBkaXNjb25uZWN0LCBub3Qgb25jZSBwZXIgdHJ5XG4gICAgICAgICAgICBjb25uZWN0aW9uQnJva2VuLmNhbGwodGhpcywgbWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgY29tZXRkLmFkZExpc3RlbmVyKCcvbWV0YS9kaXNjb25uZWN0JywgY29ubmVjdGlvbkJyb2tlbik7XG5cbiAgICBjb21ldGQuYWRkTGlzdGVuZXIoJy9tZXRhL2hhbmRzaGFrZScsIGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgIGlmIChtZXNzYWdlLnN1Y2Nlc3NmdWwpIHtcbiAgICAgICAgICAgIC8vaHR0cDovL2RvY3MuY29tZXRkLm9yZy9yZWZlcmVuY2UvamF2YXNjcmlwdF9zdWJzY3JpYmUuaHRtbCNqYXZhc2NyaXB0X3N1YnNjcmliZV9tZXRhX2NoYW5uZWxzXG4gICAgICAgICAgICAvLyBeIFwiZHluYW1pYyBzdWJzY3JpcHRpb25zIGFyZSBjbGVhcmVkIChsaWtlIGFueSBvdGhlciBzdWJzY3JpcHRpb24pIGFuZCB0aGUgYXBwbGljYXRpb24gbmVlZHMgdG8gZmlndXJlIG91dCB3aGljaCBkeW5hbWljIHN1YnNjcmlwdGlvbiBtdXN0IGJlIHBlcmZvcm1lZCBhZ2FpblwiXG4gICAgICAgICAgICBjb21ldGQuYmF0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICQobWUuY3VycmVudFN1YnNjcmlwdGlvbnMpLmVhY2goZnVuY3Rpb24gKGluZGV4LCBzdWJzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbWV0ZC5yZXN1YnNjcmliZShzdWJzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvL090aGVyIGludGVyZXN0aW5nIGV2ZW50cyBmb3IgcmVmZXJlbmNlXG4gICAgY29tZXRkLmFkZExpc3RlbmVyKCcvbWV0YS9zdWJzY3JpYmUnLCBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAkKG1lKS50cmlnZ2VyKCdzdWJzY3JpYmUnLCBtZXNzYWdlKTtcbiAgICB9KTtcbiAgICBjb21ldGQuYWRkTGlzdGVuZXIoJy9tZXRhL3Vuc3Vic2NyaWJlJywgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgJChtZSkudHJpZ2dlcigndW5zdWJzY3JpYmUnLCBtZXNzYWdlKTtcbiAgICB9KTtcbiAgICBjb21ldGQuYWRkTGlzdGVuZXIoJy9tZXRhL3B1Ymxpc2gnLCBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAkKG1lKS50cmlnZ2VyKCdwdWJsaXNoJywgbWVzc2FnZSk7XG4gICAgfSk7XG4gICAgY29tZXRkLmFkZExpc3RlbmVyKCcvbWV0YS91bnN1Y2Nlc3NmdWwnLCBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAkKG1lKS50cmlnZ2VyKCdlcnJvcicsIG1lc3NhZ2UpO1xuICAgIH0pO1xuXG4gICAgY29tZXRkLmhhbmRzaGFrZSgpO1xuXG4gICAgdGhpcy5jb21ldGQgPSBjb21ldGQ7XG59O1xuXG5cbkNoYW5uZWxNYW5hZ2VyLnByb3RvdHlwZSA9ICQuZXh0ZW5kKENoYW5uZWxNYW5hZ2VyLnByb3RvdHlwZSwge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbmQgcmV0dXJucyBhIGNoYW5uZWwsIHRoYXQgaXMsIGFuIGluc3RhbmNlIG9mIGEgW0NoYW5uZWwgU2VydmljZV0oLi4vY2hhbm5lbC1zZXJ2aWNlLykuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyKCk7XG4gICAgICogICAgICB2YXIgY2hhbm5lbCA9IGNtLmdldENoYW5uZWwoKTtcbiAgICAgKlxuICAgICAqICAgICAgY2hhbm5lbC5zdWJzY3JpYmUoJ3RvcGljJywgY2FsbGJhY2spO1xuICAgICAqICAgICAgY2hhbm5lbC5wdWJsaXNoKCd0b3BpYycsIHsgbXlEYXRhOiAxMDAgfSk7XG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fFN0cmluZ30gYG9wdGlvbnNgIChPcHRpb25hbCkgSWYgc3RyaW5nLCBhc3N1bWVkIHRvIGJlIHRoZSBiYXNlIGNoYW5uZWwgdXJsLiBJZiBvYmplY3QsIGFzc3VtZWQgdG8gYmUgY29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgY29uc3RydWN0b3IuXG4gICAgICovXG4gICAgZ2V0Q2hhbm5lbDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgLy9JZiB5b3UganVzdCB3YW50IHRvIHBhc3MgaW4gYSBzdHJpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMgJiYgISQuaXNQbGFpbk9iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICBiYXNlOiBvcHRpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgICAgIHRyYW5zcG9ydDogdGhpcy5jb21ldGRcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGNoYW5uZWwgPSBuZXcgQ2hhbm5lbCgkLmV4dGVuZCh0cnVlLCB7fSwgdGhpcy5vcHRpb25zLmNoYW5uZWwsIGRlZmF1bHRzLCBvcHRpb25zKSk7XG5cblxuICAgICAgICAvL1dyYXAgc3VicyBhbmQgdW5zdWJzIHNvIHdlIGNhbiB1c2UgaXQgdG8gcmUtYXR0YWNoIGhhbmRsZXJzIGFmdGVyIGJlaW5nIGRpc2Nvbm5lY3RlZFxuICAgICAgICB2YXIgc3VicyA9IGNoYW5uZWwuc3Vic2NyaWJlO1xuICAgICAgICBjaGFubmVsLnN1YnNjcmliZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBzdWJpZCA9IHN1YnMuYXBwbHkoY2hhbm5lbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFN1YnNjcmlwdGlvbnMgID0gdGhpcy5jdXJyZW50U3Vic2NyaXB0aW9ucy5jb25jYXQoc3ViaWQpO1xuICAgICAgICAgICAgcmV0dXJuIHN1YmlkO1xuICAgICAgICB9LmJpbmQodGhpcyk7XG5cblxuICAgICAgICB2YXIgdW5zdWJzID0gY2hhbm5lbC51bnN1YnNjcmliZTtcbiAgICAgICAgY2hhbm5lbC51bnN1YnNjcmliZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciByZW1vdmVkID0gdW5zdWJzLmFwcGx5KGNoYW5uZWwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY3VycmVudFN1YnNjcmlwdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50U3Vic2NyaXB0aW9uc1tpXS5pZCA9PT0gcmVtb3ZlZC5pZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRTdWJzY3JpcHRpb25zLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVtb3ZlZDtcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBjaGFubmVsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdGFydCBsaXN0ZW5pbmcgZm9yIGV2ZW50cyBvbiB0aGlzIGluc3RhbmNlLiBTaWduYXR1cmUgaXMgc2FtZSBhcyBmb3IgalF1ZXJ5IEV2ZW50czogaHR0cDovL2FwaS5qcXVlcnkuY29tL29uLy5cbiAgICAgKlxuICAgICAqIFN1cHBvcnRlZCBldmVudHMgYXJlOiBgY29ubmVjdGAsIGBkaXNjb25uZWN0YCwgYHN1YnNjcmliZWAsIGB1bnN1YnNjcmliZWAsIGBwdWJsaXNoYCwgYGVycm9yYC5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYGV2ZW50YCBUaGUgZXZlbnQgdHlwZS4gU2VlIG1vcmUgZGV0YWlsIGF0IGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9vbi8uXG4gICAgICovXG4gICAgb246IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAkKHRoaXMpLm9uLmFwcGx5KCQodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0b3AgbGlzdGVuaW5nIGZvciBldmVudHMgb24gdGhpcyBpbnN0YW5jZS4gU2lnbmF0dXJlIGlzIHNhbWUgYXMgZm9yIGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9vZmYvLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgZXZlbnRgIFRoZSBldmVudCB0eXBlLiBTZWUgbW9yZSBkZXRhaWwgYXQgalF1ZXJ5IEV2ZW50czogaHR0cDovL2FwaS5qcXVlcnkuY29tL29mZi8uXG4gICAgICovXG4gICAgb2ZmOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgJCh0aGlzKS5vZmYuYXBwbHkoJCh0aGlzKSwgYXJndW1lbnRzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVHJpZ2dlciBldmVudHMgYW5kIGV4ZWN1dGUgaGFuZGxlcnMuIFNpZ25hdHVyZSBpcyBzYW1lIGFzIGZvciBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vdHJpZ2dlci8uXG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGBldmVudGAgVGhlIGV2ZW50IHR5cGUuIFNlZSBtb3JlIGRldGFpbCBhdCBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vdHJpZ2dlci8uXG4gICAgICovXG4gICAgdHJpZ2dlcjogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICQodGhpcykudHJpZ2dlci5hcHBseSgkKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENoYW5uZWxNYW5hZ2VyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqICMjIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXJcbiAqXG4gKiBUaGUgRXBpY2VudGVyIHBsYXRmb3JtIHByb3ZpZGVzIGEgcHVzaCBjaGFubmVsLCB3aGljaCBhbGxvd3MgeW91IHRvIHB1Ymxpc2ggYW5kIHN1YnNjcmliZSB0byBtZXNzYWdlcyB3aXRoaW4gYSBbcHJvamVjdF0oLi4vLi4vLi4vZ2xvc3NhcnkvI3Byb2plY3RzKSwgW2dyb3VwXSguLi8uLi8uLi9nbG9zc2FyeS8jZ3JvdXBzKSwgb3IgW211bHRpcGxheWVyIHdvcmxkXSguLi8uLi8uLi9nbG9zc2FyeS8jd29ybGQpLiBUaGVyZSBhcmUgdHdvIG1haW4gdXNlIGNhc2VzIGZvciB0aGUgY2hhbm5lbDogZXZlbnQgbm90aWZpY2F0aW9ucyBhbmQgY2hhdCBtZXNzYWdlcy5cbiAqXG4gKiBUaGUgRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlciBpcyBhIHdyYXBwZXIgYXJvdW5kIHRoZSAobW9yZSBnZW5lcmljKSBbQ2hhbm5lbCBNYW5hZ2VyXSguLi9jaGFubmVsLW1hbmFnZXIvKSwgdG8gaW5zdGFudGlhdGUgaXQgd2l0aCBFcGljZW50ZXItc3BlY2lmaWMgZGVmYXVsdHMuIElmIHlvdSBhcmUgaW50ZXJlc3RlZCBpbiBpbmNsdWRpbmcgYSBub3RpZmljYXRpb24gb3IgY2hhdCBmZWF0dXJlIGluIHlvdXIgcHJvamVjdCwgdXNpbmcgYW4gRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlciBpcyBwcm9iYWJseSB0aGUgZWFzaWVzdCB3YXkgdG8gZ2V0IHN0YXJ0ZWQuXG4gKlxuICogWW91J2xsIG5lZWQgdG8gaW5jbHVkZSB0aGUgYGVwaWNlbnRlci1tdWx0aXBsYXllci1kZXBlbmRlbmNpZXMuanNgIGxpYnJhcnkgaW4gYWRkaXRpb24gdG8gdGhlIGBlcGljZW50ZXIuanNgIGxpYnJhcnkgaW4geW91ciBwcm9qZWN0IHRvIHVzZSB0aGUgRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlci4gU2VlIFtJbmNsdWRpbmcgRXBpY2VudGVyLmpzXSguLi8uLi8jaW5jbHVkZSkuXG4gKlxuICogVG8gdXNlIHRoZSBFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyOiBpbnN0YW50aWF0ZSBpdCwgZ2V0IHRoZSBjaGFubmVsIG9mIHRoZSBzY29wZSB5b3Ugd2FudCAoW3VzZXJdKC4uLy4uLy4uL2dsb3NzYXJ5LyN1c2VycyksIFt3b3JsZF0oLi4vLi4vLi4vZ2xvc3NhcnkvI3dvcmxkKSwgb3IgW2dyb3VwXSguLi8uLi8uLi9nbG9zc2FyeS8jZ3JvdXBzKSksIHRoZW4gdXNlIHRoZSBjaGFubmVsJ3MgYHN1YnNjcmliZSgpYCBhbmQgYHB1Ymxpc2goKWAgbWV0aG9kcyB0byBzdWJzY3JpYmUgdG8gdG9waWNzIG9yIHB1Ymxpc2ggZGF0YSB0byB0b3BpY3MuXG4gKlxuICogICAgIHZhciBjbSA9IG5ldyBGLm1hbmFnZXIuQ2hhbm5lbE1hbmFnZXIoKTtcbiAqICAgICB2YXIgZ2MgPSBjbS5nZXRHcm91cENoYW5uZWwoKTtcbiAqICAgICBnYy5zdWJzY3JpYmUoJ2Jyb2FkY2FzdHMnLCBjYWxsYmFjayk7XG4gKlxuICogRm9yIGFkZGl0aW9uYWwgYmFja2dyb3VuZCBvbiBFcGljZW50ZXIncyBwdXNoIGNoYW5uZWwsIHNlZSB0aGUgaW50cm9kdWN0b3J5IG5vdGVzIG9uIHRoZSBbUHVzaCBDaGFubmVsIEFQSV0oLi4vLi4vLi4vcmVzdF9hcGlzL211bHRpcGxheWVyL2NoYW5uZWwvKSBwYWdlLlxuICpcbiAqIFRoZSBwYXJhbWV0ZXJzIGZvciBpbnN0YW50aWF0aW5nIGFuIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXIgaW5jbHVkZTpcbiAqXG4gKiAqIGBzZXJ2ZXJgIE9iamVjdCB3aXRoIGRldGFpbHMgYWJvdXQgdGhlIEVwaWNlbnRlciBwcm9qZWN0IGZvciB0aGlzIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXIgaW5zdGFuY2UuXG4gKiAqIGBzZXJ2ZXIuYWNjb3VudGAgVGhlIEVwaWNlbnRlciBhY2NvdW50IGlkICgqKlRlYW0gSUQqKiBmb3IgdGVhbSBwcm9qZWN0cywgKipVc2VyIElEKiogZm9yIHBlcnNvbmFsIHByb2plY3RzKS5cbiAqICogYHNlcnZlci5wcm9qZWN0YCBFcGljZW50ZXIgcHJvamVjdCBpZC5cbiAqL1xuXG52YXIgQ2hhbm5lbE1hbmFnZXIgPSByZXF1aXJlKCcuL2NoYW5uZWwtbWFuYWdlcicpO1xudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIHVybFNlcnZpY2UgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL3VybC1jb25maWctc2VydmljZScpO1xuXG52YXIgQXV0aE1hbmFnZXIgPSByZXF1aXJlKCcuL2F1dGgtbWFuYWdlcicpO1xuXG52YXIgc2Vzc2lvbiA9IG5ldyBBdXRoTWFuYWdlcigpO1xudmFyIGdldEZyb21TZXR0aW5nc09yU2Vzc2lvbk9yRXJyb3IgPSBmdW5jdGlvbiAodmFsdWUsIHNlc3Npb25LZXlOYW1lLCBzZXR0aW5ncykge1xuICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgdmFyIHVzZXJJbmZvID0gc2Vzc2lvbi5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICAgIGlmIChzZXR0aW5ncyAmJiBzZXR0aW5nc1tzZXNzaW9uS2V5TmFtZV0pIHtcbiAgICAgICAgICAgIHZhbHVlID0gc2V0dGluZ3Nbc2Vzc2lvbktleU5hbWVdO1xuICAgICAgICB9IGVsc2UgaWYgKHVzZXJJbmZvW3Nlc3Npb25LZXlOYW1lXSkge1xuICAgICAgICAgICAgdmFsdWUgPSB1c2VySW5mb1tzZXNzaW9uS2V5TmFtZV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3Ioc2Vzc2lvbktleU5hbWUgKyAnIG5vdCBmb3VuZC4gUGxlYXNlIGxvZy1pbiBhZ2Fpbiwgb3Igc3BlY2lmeSAnICsgc2Vzc2lvbktleU5hbWUgKyAnIGV4cGxpY2l0bHknKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG59O1xudmFyIF9fc3VwZXIgPSBDaGFubmVsTWFuYWdlci5wcm90b3R5cGU7XG52YXIgRXBpY2VudGVyQ2hhbm5lbE1hbmFnZXIgPSBjbGFzc0Zyb20oQ2hhbm5lbE1hbmFnZXIsIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHVzZXJJbmZvID0gc2Vzc2lvbi5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG5cbiAgICAgICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAgICAgYWNjb3VudDogdXNlckluZm8uYWNjb3VudCxcbiAgICAgICAgICAgIHByb2plY3Q6IHVzZXJJbmZvLnByb2plY3QsXG4gICAgICAgIH07XG4gICAgICAgIHZhciBkZWZhdWx0Q29tZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCB1c2VySW5mbywgb3B0aW9ucyk7XG5cbiAgICAgICAgdmFyIHVybE9wdHMgPSB1cmxTZXJ2aWNlKGRlZmF1bHRDb21ldE9wdGlvbnMuc2VydmVyKTtcbiAgICAgICAgaWYgKCFkZWZhdWx0Q29tZXRPcHRpb25zLnVybCkge1xuICAgICAgICAgICAgLy9EZWZhdWx0IGVwaWNlbnRlciBjb21ldGQgZW5kcG9pbnRcbiAgICAgICAgICAgIGRlZmF1bHRDb21ldE9wdGlvbnMudXJsID0gdXJsT3B0cy5wcm90b2NvbCArICc6Ly8nICsgdXJsT3B0cy5ob3N0ICsgJy9jaGFubmVsL3N1YnNjcmliZSc7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBkZWZhdWx0Q29tZXRPcHRpb25zO1xuICAgICAgICByZXR1cm4gX19zdXBlci5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIGRlZmF1bHRDb21ldE9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYW5kIHJldHVybiBhIHB1Ymxpc2gvc3Vic2NyaWJlIGNoYW5uZWwgKGZyb20gdGhlIHVuZGVybHlpbmcgW0NoYW5uZWwgTWFuYWdlcl0oLi4vY2hhbm5lbC1tYW5hZ2VyLykpIGZvciB0aGUgZ2l2ZW4gW2dyb3VwXSguLi8uLi8uLi9nbG9zc2FyeS8jZ3JvdXBzKS4gVGhlIGdyb3VwIG11c3QgZXhpc3QgaW4gdGhlIGFjY291bnQgKHRlYW0pIGFuZCBwcm9qZWN0IHByb3ZpZGVkLlxuICAgICAqXG4gICAgICogVGhlcmUgYXJlIG5vIG5vdGlmaWNhdGlvbnMgZnJvbSBFcGljZW50ZXIgb24gdGhpcyBjaGFubmVsOyBhbGwgbWVzc2FnZXMgYXJlIHVzZXItb3JpZ2luYXRlZC5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgdmFyIGNtID0gbmV3IEYubWFuYWdlci5DaGFubmVsTWFuYWdlcigpO1xuICAgICAqICAgICB2YXIgZ2MgPSBjbS5nZXRHcm91cENoYW5uZWwoKTtcbiAgICAgKiAgICAgZ2Muc3Vic2NyaWJlKCdicm9hZGNhc3RzJywgY2FsbGJhY2spO1xuICAgICAqXG4gICAgICogKipSZXR1cm4gVmFsdWUqKlxuICAgICAqXG4gICAgICogKiAqQ2hhbm5lbCogUmV0dXJucyB0aGUgY2hhbm5lbCAoYW4gaW5zdGFuY2Ugb2YgdGhlIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pKS5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGBncm91cE5hbWVgIChPcHRpb25hbCkgR3JvdXAgdG8gYnJvYWRjYXN0IHRvLiBJZiBub3QgcHJvdmlkZWQsIHBpY2tzIHVwIGdyb3VwIGZyb20gY3VycmVudCBzZXNzaW9uIGlmIGVuZCB1c2VyIGlzIGxvZ2dlZCBpbi5cbiAgICAgKi9cbiAgICBnZXRHcm91cENoYW5uZWw6IGZ1bmN0aW9uIChncm91cE5hbWUpIHtcbiAgICAgICAgZ3JvdXBOYW1lID0gZ2V0RnJvbVNldHRpbmdzT3JTZXNzaW9uT3JFcnJvcihncm91cE5hbWUsICdncm91cE5hbWUnKTtcbiAgICAgICAgdmFyIGFjY291bnQgPSBnZXRGcm9tU2V0dGluZ3NPclNlc3Npb25PckVycm9yKCcnLCAnYWNjb3VudCcsIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIHZhciBwcm9qZWN0ID0gZ2V0RnJvbVNldHRpbmdzT3JTZXNzaW9uT3JFcnJvcignJywgJ3Byb2plY3QnLCB0aGlzLm9wdGlvbnMpO1xuXG4gICAgICAgIHZhciBiYXNlVG9waWMgPSBbJy9ncm91cCcsIGFjY291bnQsIHByb2plY3QsIGdyb3VwTmFtZV0uam9pbignLycpO1xuICAgICAgICByZXR1cm4gX19zdXBlci5nZXRDaGFubmVsLmNhbGwodGhpcywgeyBiYXNlOiBiYXNlVG9waWMgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgcHVibGlzaC9zdWJzY3JpYmUgY2hhbm5lbCAoZnJvbSB0aGUgdW5kZXJseWluZyBbQ2hhbm5lbCBNYW5hZ2VyXSguLi9jaGFubmVsLW1hbmFnZXIvKSkgZm9yIHRoZSBnaXZlbiBbd29ybGRdKC4uLy4uLy4uL2dsb3NzYXJ5LyN3b3JsZCkuXG4gICAgICpcbiAgICAgKiBUaGlzIGlzIHR5cGljYWxseSB1c2VkIHRvZ2V0aGVyIHdpdGggdGhlIFtXb3JsZCBNYW5hZ2VyXSguLi93b3JsZC1tYW5hZ2VyKS5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgdmFyIGNtID0gbmV3IEYubWFuYWdlci5DaGFubmVsTWFuYWdlcigpO1xuICAgICAqICAgICB2YXIgd29ybGRNYW5hZ2VyID0gbmV3IEYubWFuYWdlci5Xb3JsZE1hbmFnZXIoe1xuICAgICAqICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAqICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgKiAgICAgICAgIGdyb3VwOiAndGVhbTEnLFxuICAgICAqICAgICAgICAgcnVuOiB7IG1vZGVsOiAnbW9kZWwuZXFuJyB9XG4gICAgICogICAgIH0pO1xuICAgICAqICAgICB3b3JsZE1hbmFnZXIuZ2V0Q3VycmVudFdvcmxkKCkudGhlbihmdW5jdGlvbiAod29ybGRPYmplY3QsIHdvcmxkQWRhcHRlcikge1xuICAgICAqICAgICAgICAgdmFyIHdvcmxkQ2hhbm5lbCA9IGNtLmdldFdvcmxkQ2hhbm5lbCh3b3JsZE9iamVjdCk7XG4gICAgICogICAgICAgICB3b3JsZENoYW5uZWwuc3Vic2NyaWJlKCcnLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAqICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAqICAgICAgICAgfSk7XG4gICAgICogICAgICB9KTtcbiAgICAgKlxuICAgICAqICoqUmV0dXJuIFZhbHVlKipcbiAgICAgKlxuICAgICAqICogKkNoYW5uZWwqIFJldHVybnMgdGhlIGNoYW5uZWwgKGFuIGluc3RhbmNlIG9mIHRoZSBbQ2hhbm5lbCBTZXJ2aWNlXSguLi9jaGFubmVsLXNlcnZpY2UvKSkuXG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqXG4gICAgICogQHBhcmFtICB7U3RyaW5nfE9iamVjdH0gYHdvcmxkYCBUaGUgd29ybGQgb2JqZWN0IG9yIGlkLlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gYGdyb3VwTmFtZWAgKE9wdGlvbmFsKSBHcm91cCB0aGUgd29ybGQgZXhpc3RzIGluLiBJZiBub3QgcHJvdmlkZWQsIHBpY2tzIHVwIGdyb3VwIGZyb20gY3VycmVudCBzZXNzaW9uIGlmIGVuZCB1c2VyIGlzIGxvZ2dlZCBpbi5cbiAgICAgKi9cbiAgICBnZXRXb3JsZENoYW5uZWw6IGZ1bmN0aW9uICh3b3JsZCwgZ3JvdXBOYW1lKSB7XG4gICAgICAgIHZhciB3b3JsZGlkID0gKCQuaXNQbGFpbk9iamVjdCh3b3JsZCkgJiYgd29ybGQuaWQpID8gd29ybGQuaWQgOiB3b3JsZDtcbiAgICAgICAgaWYgKCF3b3JsZGlkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSBzcGVjaWZ5IGEgd29ybGQgaWQnKTtcbiAgICAgICAgfVxuICAgICAgICBncm91cE5hbWUgPSBnZXRGcm9tU2V0dGluZ3NPclNlc3Npb25PckVycm9yKGdyb3VwTmFtZSwgJ2dyb3VwTmFtZScpO1xuICAgICAgICB2YXIgYWNjb3VudCA9IGdldEZyb21TZXR0aW5nc09yU2Vzc2lvbk9yRXJyb3IoJycsICdhY2NvdW50JywgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgdmFyIHByb2plY3QgPSBnZXRGcm9tU2V0dGluZ3NPclNlc3Npb25PckVycm9yKCcnLCAncHJvamVjdCcsIHRoaXMub3B0aW9ucyk7XG5cbiAgICAgICAgdmFyIGJhc2VUb3BpYyA9IFsnL3dvcmxkJywgYWNjb3VudCwgcHJvamVjdCwgZ3JvdXBOYW1lLCB3b3JsZGlkXS5qb2luKCcvJyk7XG4gICAgICAgIHJldHVybiBfX3N1cGVyLmdldENoYW5uZWwuY2FsbCh0aGlzLCB7IGJhc2U6IGJhc2VUb3BpYyB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGFuZCByZXR1cm4gYSBwdWJsaXNoL3N1YnNjcmliZSBjaGFubmVsIChmcm9tIHRoZSB1bmRlcmx5aW5nIFtDaGFubmVsIE1hbmFnZXJdKC4uL2NoYW5uZWwtbWFuYWdlci8pKSBmb3IgdGhlIGN1cnJlbnQgW2VuZCB1c2VyXSguLi8uLi8uLi9nbG9zc2FyeS8jdXNlcnMpIGluIHRoYXQgdXNlcidzIGN1cnJlbnQgW3dvcmxkXSguLi8uLi8uLi9nbG9zc2FyeS8jd29ybGQpLlxuICAgICAqXG4gICAgICogVGhpcyBpcyB0eXBpY2FsbHkgdXNlZCB0b2dldGhlciB3aXRoIHRoZSBbV29ybGQgTWFuYWdlcl0oLi4vd29ybGQtbWFuYWdlcikuIE5vdGUgdGhhdCB0aGlzIGNoYW5uZWwgb25seSBnZXRzIG5vdGlmaWNhdGlvbnMgZm9yIHdvcmxkcyBjdXJyZW50bHkgaW4gbWVtb3J5LiAoU2VlIG1vcmUgYmFja2dyb3VuZCBvbiBbcGVyc2lzdGVuY2VdKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZSkuKVxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyKCk7XG4gICAgICogICAgIHZhciB3b3JsZE1hbmFnZXIgPSBuZXcgRi5tYW5hZ2VyLldvcmxkTWFuYWdlcih7XG4gICAgICogICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICogICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAqICAgICAgICAgZ3JvdXA6ICd0ZWFtMScsXG4gICAgICogICAgICAgICBydW46IHsgbW9kZWw6ICdtb2RlbC5lcW4nIH1cbiAgICAgKiAgICAgfSk7XG4gICAgICogICAgIHdvcmxkTWFuYWdlci5nZXRDdXJyZW50V29ybGQoKS50aGVuKGZ1bmN0aW9uICh3b3JsZE9iamVjdCwgd29ybGRBZGFwdGVyKSB7XG4gICAgICogICAgICAgICB2YXIgdXNlckNoYW5uZWwgPSBjbS5nZXRVc2VyQ2hhbm5lbCh3b3JsZE9iamVjdCk7XG4gICAgICogICAgICAgICB1c2VyQ2hhbm5lbC5zdWJzY3JpYmUoJycsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICogICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICogICAgICAgICB9KTtcbiAgICAgKiAgICAgIH0pO1xuICAgICAqXG4gICAgICpcbiAgICAgKiAqKlJldHVybiBWYWx1ZSoqXG4gICAgICpcbiAgICAgKiAqICpDaGFubmVsKiBSZXR1cm5zIHRoZSBjaGFubmVsIChhbiBpbnN0YW5jZSBvZiB0aGUgW0NoYW5uZWwgU2VydmljZV0oLi4vY2hhbm5lbC1zZXJ2aWNlLykpLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ3xPYmplY3R9IGB3b3JsZGAgV29ybGQgb2JqZWN0IG9yIGlkLlxuICAgICAqIEBwYXJhbSAge1N0cmluZ3xPYmplY3R9IGB1c2VyYCAoT3B0aW9uYWwpIFVzZXIgb2JqZWN0IG9yIGlkLiBJZiBub3QgcHJvdmlkZWQsIHBpY2tzIHVwIHVzZXIgaWQgZnJvbSBjdXJyZW50IHNlc3Npb24gaWYgZW5kIHVzZXIgaXMgbG9nZ2VkIGluLlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gYGdyb3VwTmFtZWAgKE9wdGlvbmFsKSBHcm91cCB0aGUgd29ybGQgZXhpc3RzIGluLiBJZiBub3QgcHJvdmlkZWQsIHBpY2tzIHVwIGdyb3VwIGZyb20gY3VycmVudCBzZXNzaW9uIGlmIGVuZCB1c2VyIGlzIGxvZ2dlZCBpbi5cbiAgICAgKi9cbiAgICBnZXRVc2VyQ2hhbm5lbDogZnVuY3Rpb24gKHdvcmxkLCB1c2VyLCBncm91cE5hbWUpIHtcbiAgICAgICAgdmFyIHdvcmxkaWQgPSAoJC5pc1BsYWluT2JqZWN0KHdvcmxkKSAmJiB3b3JsZC5pZCkgPyB3b3JsZC5pZCA6IHdvcmxkO1xuICAgICAgICBpZiAoIXdvcmxkaWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHNwZWNpZnkgYSB3b3JsZCBpZCcpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB1c2VyaWQgPSAoJC5pc1BsYWluT2JqZWN0KHVzZXIpICYmIHVzZXIuaWQpID8gdXNlci5pZCA6IHVzZXI7XG4gICAgICAgIHVzZXJpZCA9IGdldEZyb21TZXR0aW5nc09yU2Vzc2lvbk9yRXJyb3IodXNlcmlkLCAndXNlcklkJyk7XG4gICAgICAgIGdyb3VwTmFtZSA9IGdldEZyb21TZXR0aW5nc09yU2Vzc2lvbk9yRXJyb3IoZ3JvdXBOYW1lLCAnZ3JvdXBOYW1lJyk7XG5cbiAgICAgICAgdmFyIGFjY291bnQgPSBnZXRGcm9tU2V0dGluZ3NPclNlc3Npb25PckVycm9yKCcnLCAnYWNjb3VudCcsIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIHZhciBwcm9qZWN0ID0gZ2V0RnJvbVNldHRpbmdzT3JTZXNzaW9uT3JFcnJvcignJywgJ3Byb2plY3QnLCB0aGlzLm9wdGlvbnMpO1xuXG4gICAgICAgIHZhciBiYXNlVG9waWMgPSBbJy91c2VycycsIGFjY291bnQsIHByb2plY3QsIGdyb3VwTmFtZSwgd29ybGRpZCwgdXNlcmlkXS5qb2luKCcvJyk7XG4gICAgICAgIHJldHVybiBfX3N1cGVyLmdldENoYW5uZWwuY2FsbCh0aGlzLCB7IGJhc2U6IGJhc2VUb3BpYyB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGFuZCByZXR1cm4gYSBwdWJsaXNoL3N1YnNjcmliZSBjaGFubmVsIChmcm9tIHRoZSB1bmRlcmx5aW5nIFtDaGFubmVsIE1hbmFnZXJdKC4uL2NoYW5uZWwtbWFuYWdlci8pKSB0aGF0IGF1dG9tYXRpY2FsbHkgdHJhY2tzIHRoZSBwcmVzZW5jZSBvZiBhbiBbZW5kIHVzZXJdKC4uLy4uLy4uL2dsb3NzYXJ5LyN1c2VycyksIHRoYXQgaXMsIHdoZXRoZXIgdGhlIGVuZCB1c2VyIGlzIGN1cnJlbnRseSBvbmxpbmUgaW4gdGhpcyBncm91cCBhbmQgd29ybGQuIE5vdGlmaWNhdGlvbnMgYXJlIGF1dG9tYXRpY2FsbHkgc2VudCB3aGVuIHRoZSBlbmQgdXNlciBjb21lcyBvbmxpbmUsIGFuZCB3aGVuIHRoZSBlbmQgdXNlciBnb2VzIG9mZmxpbmUgKG5vdCBwcmVzZW50IGZvciBtb3JlIHRoYW4gMiBtaW51dGVzKS4gVXNlZnVsIGluIG11bHRpcGxheWVyIGdhbWVzIGZvciBsZXR0aW5nIGVhY2ggZW5kIHVzZXIga25vdyB3aGV0aGVyIG90aGVyIHVzZXJzIGluIHRoZWlyIHNoYXJlZCB3b3JsZCBhcmUgYWxzbyBvbmxpbmUuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgIHZhciBjbSA9IG5ldyBGLm1hbmFnZXIuQ2hhbm5lbE1hbmFnZXIoKTtcbiAgICAgKiAgICAgdmFyIHdvcmxkTWFuYWdlciA9IG5ldyBGLm1hbmFnZXIuV29ybGRNYW5hZ2VyKHtcbiAgICAgKiAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgKiAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICogICAgICAgICBtb2RlbDogJ21vZGVsLmVxbidcbiAgICAgKiAgICAgfSk7XG4gICAgICogICAgIHdvcmxkTWFuYWdlci5nZXRDdXJyZW50V29ybGQoKS50aGVuKGZ1bmN0aW9uICh3b3JsZE9iamVjdCwgd29ybGRTZXJ2aWNlKSB7XG4gICAgICogICAgICAgICB2YXIgcHJlc2VuY2VDaGFubmVsID0gY20uZ2V0UHJlc2VuY2VDaGFubmVsKHdvcmxkT2JqZWN0KTtcbiAgICAgKiAgICAgICAgIHByZXNlbmNlQ2hhbm5lbC5vbigncHJlc2VuY2UnLCBmdW5jdGlvbiAoZXZ0LCBub3RpZmljYXRpb24pIHtcbiAgICAgKiAgICAgICAgICAgICAgY29uc29sZS5sb2cobm90aWZpY2F0aW9uLm9ubGluZSwgbm90aWZpY2F0aW9uLnVzZXJJZCk7XG4gICAgICogICAgICAgICAgfSk7XG4gICAgICogICAgICB9KTtcbiAgICAgKlxuICAgICAqXG4gICAgICogKipSZXR1cm4gVmFsdWUqKlxuICAgICAqXG4gICAgICogKiAqQ2hhbm5lbCogUmV0dXJucyB0aGUgY2hhbm5lbCAoYW4gaW5zdGFuY2Ugb2YgdGhlIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pKS5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd8T2JqZWN0fSBgd29ybGRgIFdvcmxkIG9iamVjdCBvciBpZC5cbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd8T2JqZWN0fSBgdXNlcmlkYCAoT3B0aW9uYWwpIFVzZXIgb2JqZWN0IG9yIGlkLiBJZiBub3QgcHJvdmlkZWQsIHBpY2tzIHVwIHVzZXIgaWQgZnJvbSBjdXJyZW50IHNlc3Npb24gaWYgZW5kIHVzZXIgaXMgbG9nZ2VkIGluLlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gYGdyb3VwTmFtZWAgKE9wdGlvbmFsKSBHcm91cCB0aGUgd29ybGQgZXhpc3RzIGluLiBJZiBub3QgcHJvdmlkZWQsIHBpY2tzIHVwIGdyb3VwIGZyb20gY3VycmVudCBzZXNzaW9uIGlmIGVuZCB1c2VyIGlzIGxvZ2dlZCBpbi5cbiAgICAgKi9cbiAgICBnZXRQcmVzZW5jZUNoYW5uZWw6IGZ1bmN0aW9uICh3b3JsZCwgdXNlcmlkLCBncm91cE5hbWUpIHtcbiAgICAgICAgdmFyIHdvcmxkaWQgPSAoJC5pc1BsYWluT2JqZWN0KHdvcmxkKSAmJiB3b3JsZC5pZCkgPyB3b3JsZC5pZCA6IHdvcmxkO1xuICAgICAgICBpZiAoIXdvcmxkaWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHNwZWNpZnkgYSB3b3JsZCBpZCcpO1xuICAgICAgICB9XG4gICAgICAgIHVzZXJpZCA9IGdldEZyb21TZXR0aW5nc09yU2Vzc2lvbk9yRXJyb3IodXNlcmlkLCAndXNlcklkJyk7XG4gICAgICAgIGdyb3VwTmFtZSA9IGdldEZyb21TZXR0aW5nc09yU2Vzc2lvbk9yRXJyb3IoZ3JvdXBOYW1lLCAnZ3JvdXBOYW1lJyk7XG5cbiAgICAgICAgdmFyIGFjY291bnQgPSBnZXRGcm9tU2V0dGluZ3NPclNlc3Npb25PckVycm9yKCcnLCAnYWNjb3VudCcsIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIHZhciBwcm9qZWN0ID0gZ2V0RnJvbVNldHRpbmdzT3JTZXNzaW9uT3JFcnJvcignJywgJ3Byb2plY3QnLCB0aGlzLm9wdGlvbnMpO1xuXG4gICAgICAgIHZhciBiYXNlVG9waWMgPSBbJy91c2VycycsIGFjY291bnQsIHByb2plY3QsIGdyb3VwTmFtZSwgd29ybGRpZF0uam9pbignLycpO1xuICAgICAgICB2YXIgY2hhbm5lbCA9IF9fc3VwZXIuZ2V0Q2hhbm5lbC5jYWxsKHRoaXMsIHsgYmFzZTogYmFzZVRvcGljIH0pO1xuXG4gICAgICAgIHZhciBsYXN0UGluZ1RpbWUgPSB7IH07XG5cbiAgICAgICAgdmFyIFBJTkdfSU5URVJWQUwgPSA2MDAwO1xuICAgICAgICBjaGFubmVsLnN1YnNjcmliZSgnaW50ZXJuYWwtcGluZy1jaGFubmVsJywgZnVuY3Rpb24gKG5vdGlmaWNhdGlvbikge1xuICAgICAgICAgICAgdmFyIGluY29taW5nVXNlcklkID0gbm90aWZpY2F0aW9uLmRhdGEudXNlcjtcbiAgICAgICAgICAgIGlmICghbGFzdFBpbmdUaW1lW2luY29taW5nVXNlcklkXSAmJiBpbmNvbWluZ1VzZXJJZCAhPT0gdXNlcmlkKSB7XG4gICAgICAgICAgICAgICAgY2hhbm5lbC50cmlnZ2VyLmNhbGwoY2hhbm5lbCwgJ3ByZXNlbmNlJywgeyB1c2VySWQ6IGluY29taW5nVXNlcklkLCBvbmxpbmU6IHRydWUgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYXN0UGluZ1RpbWVbaW5jb21pbmdVc2VySWRdID0gKG5ldyBEYXRlKCkpLnZhbHVlT2YoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hhbm5lbC5wdWJsaXNoKCdpbnRlcm5hbC1waW5nLWNoYW5uZWwnLCB7IHVzZXI6IHVzZXJpZCB9KTtcblxuICAgICAgICAgICAgJC5lYWNoKGxhc3RQaW5nVGltZSwgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbm93ID0gKG5ldyBEYXRlKCkpLnZhbHVlT2YoKTtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUgKyAoUElOR19JTlRFUlZBTCAqIDIpIDwgbm93KSB7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RQaW5nVGltZVtrZXldID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgY2hhbm5lbC50cmlnZ2VyLmNhbGwoY2hhbm5lbCwgJ3ByZXNlbmNlJywgeyB1c2VySWQ6IGtleSwgb25saW5lOiBmYWxzZSB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgUElOR19JTlRFUlZBTCk7XG5cbiAgICAgICAgcmV0dXJuIGNoYW5uZWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgcHVibGlzaC9zdWJzY3JpYmUgY2hhbm5lbCAoZnJvbSB0aGUgdW5kZXJseWluZyBbQ2hhbm5lbCBNYW5hZ2VyXSguLi9jaGFubmVsLW1hbmFnZXIvKSkgZm9yIHRoZSBnaXZlbiBjb2xsZWN0aW9uLiAoVGhlIGNvbGxlY3Rpb24gbmFtZSBpcyBzcGVjaWZpZWQgaW4gdGhlIGByb290YCBhcmd1bWVudCB3aGVuIHRoZSBbRGF0YSBTZXJ2aWNlXSguLi9kYXRhLWFwaS1zZXJ2aWNlLykgaXMgaW5zdGFudGlhdGVkLikgTXVzdCBiZSBvbmUgb2YgdGhlIGNvbGxlY3Rpb25zIGluIHRoaXMgYWNjb3VudCAodGVhbSkgYW5kIHByb2plY3QuXG4gICAgICpcbiAgICAgKiBUaGVyZSBhcmUgYXV0b21hdGljIG5vdGlmaWNhdGlvbnMgZnJvbSBFcGljZW50ZXIgb24gdGhpcyBjaGFubmVsIHdoZW4gZGF0YSBpcyBjcmVhdGVkLCB1cGRhdGVkLCBvciBkZWxldGVkIGluIHRoaXMgY29sbGVjdGlvbi4gU2VlIG1vcmUgb24gW2F1dG9tYXRpYyBtZXNzYWdlcyB0byB0aGUgZGF0YSBjaGFubmVsXSguLi8uLi8uLi9yZXN0X2FwaXMvbXVsdGlwbGF5ZXIvY2hhbm5lbC8jZGF0YS1tZXNzYWdlcykuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgIHZhciBjbSA9IG5ldyBGLm1hbmFnZXIuQ2hhbm5lbE1hbmFnZXIoKTtcbiAgICAgKiAgICAgdmFyIGdjID0gY20uZ2V0RGF0YUNoYW5uZWwoJ3N1cnZleS1yZXNwb25zZXMnKTtcbiAgICAgKiAgICAgZ2Muc3Vic2NyaWJlKCcnLCBmdW5jdGlvbihkYXRhLCBtZXRhKSB7XG4gICAgICogICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICpcbiAgICAgKiAgICAgICAgICAvLyBtZXRhLmRhdGUgaXMgdGltZSBvZiBjaGFuZ2UsXG4gICAgICogICAgICAgICAgLy8gbWV0YS5zdWJUeXBlIGlzIHRoZSBraW5kIG9mIGNoYW5nZTogbmV3LCB1cGRhdGUsIG9yIGRlbGV0ZVxuICAgICAqICAgICAgICAgIC8vIG1ldGEucGF0aCBpcyB0aGUgZnVsbCBwYXRoIHRvIHRoZSBjaGFuZ2VkIGRhdGFcbiAgICAgKiAgICAgICAgICBjb25zb2xlLmxvZyhtZXRhKTtcbiAgICAgKiAgICAgfSk7XG4gICAgICpcbiAgICAgKiAqKlJldHVybiBWYWx1ZSoqXG4gICAgICpcbiAgICAgKiAqICpDaGFubmVsKiBSZXR1cm5zIHRoZSBjaGFubmVsIChhbiBpbnN0YW5jZSBvZiB0aGUgW0NoYW5uZWwgU2VydmljZV0oLi4vY2hhbm5lbC1zZXJ2aWNlLykpLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gYGNvbGxlY3Rpb25gIE5hbWUgb2YgY29sbGVjdGlvbiB3aG9zZSBhdXRvbWF0aWMgbm90aWZpY2F0aW9ucyB5b3Ugd2FudCB0byByZWNlaXZlLlxuICAgICAqL1xuICAgIGdldERhdGFDaGFubmVsOiBmdW5jdGlvbiAoY29sbGVjdGlvbikge1xuICAgICAgICBpZiAoIWNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHNwZWNpZnkgYSBjb2xsZWN0aW9uIHRvIGxpc3RlbiBvbi4nKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYWNjb3VudCA9IGdldEZyb21TZXR0aW5nc09yU2Vzc2lvbk9yRXJyb3IoJycsICdhY2NvdW50JywgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgdmFyIHByb2plY3QgPSBnZXRGcm9tU2V0dGluZ3NPclNlc3Npb25PckVycm9yKCcnLCAncHJvamVjdCcsIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIHZhciBiYXNlVG9waWMgPSBbJy9kYXRhJywgYWNjb3VudCwgcHJvamVjdCwgY29sbGVjdGlvbl0uam9pbignLycpO1xuICAgICAgICB2YXIgY2hhbm5lbCA9IF9fc3VwZXIuZ2V0Q2hhbm5lbC5jYWxsKHRoaXMsIHsgYmFzZTogYmFzZVRvcGljIH0pO1xuXG4gICAgICAgIC8vVE9ETzogRml4IGFmdGVyIEVwaWNlbnRlciBidWcgaXMgcmVzb2x2ZWRcbiAgICAgICAgdmFyIG9sZHN1YnMgPSBjaGFubmVsLnN1YnNjcmliZTtcbiAgICAgICAgY2hhbm5lbC5zdWJzY3JpYmUgPSBmdW5jdGlvbiAodG9waWMsIGNhbGxiYWNrLCBjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tXaXRoQ2xlYW5EYXRhID0gZnVuY3Rpb24gKHBheWxvYWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWV0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogcGF5bG9hZC5jaGFubmVsLFxuICAgICAgICAgICAgICAgICAgICBzdWJUeXBlOiBwYXlsb2FkLmRhdGEuc3ViVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0ZTogcGF5bG9hZC5kYXRhLmRhdGVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciBhY3R1YWxEYXRhID0gcGF5bG9hZC5kYXRhLmRhdGE7XG4gICAgICAgICAgICAgICAgaWYgKGFjdHVhbERhdGEuZGF0YSkgeyAvL0RlbGV0ZSBub3RpZmljYXRpb25zIGFyZSBvbmUgZGF0YS1sZXZlbCBiZWhpbmQgb2YgY291cnNlXG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbERhdGEgPSBhY3R1YWxEYXRhLmRhdGE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBhY3R1YWxEYXRhLCBtZXRhKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gb2xkc3Vicy5jYWxsKGNoYW5uZWwsIHRvcGljLCBjYWxsYmFja1dpdGhDbGVhbkRhdGEsIGNvbnRleHQsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBjaGFubmVsO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVwaWNlbnRlckNoYW5uZWxNYW5hZ2VyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBFUElfQ09PS0lFX0tFWTogJ2VwaWNlbnRlci5wcm9qZWN0LnRva2VuJyxcbiAgICBFUElfU0VTU0lPTl9LRVk6ICdlcGljZW50ZXIudXNlci5zZXNzaW9uJyxcbiAgICBTVFJBVEVHWV9TRVNTSU9OX0tFWTogJ2VwaWNlbnRlci1zY2VuYXJpbydcbn07IiwiLyoqXG4qICMjIFJ1biBNYW5hZ2VyXG4qXG4qIFRoZSBSdW4gTWFuYWdlciBnaXZlcyB5b3UgYWNjZXNzIHRvIHJ1bnMgZm9yIHlvdXIgcHJvamVjdC4gVGhpcyBhbGxvd3MgeW91IHRvIHJlYWQgYW5kIHVwZGF0ZSB2YXJpYWJsZXMsIGNhbGwgb3BlcmF0aW9ucywgZXRjLiBBZGRpdGlvbmFsbHksIHRoZSBSdW4gTWFuYWdlciBnaXZlcyB5b3UgY29udHJvbCBvdmVyIHJ1biBjcmVhdGlvbiBkZXBlbmRpbmcgb24gcnVuIHN0YXRlcy4gU3BlY2lmaWNhbGx5LCB5b3UgY2FuIHNlbGVjdCBbcnVuIGNyZWF0aW9uIHN0cmF0ZWdpZXMgKHJ1bGVzKV0oLi4vLi4vc3RyYXRlZ3kvKSBmb3Igd2hpY2ggcnVucyBlbmQgdXNlcnMgb2YgeW91ciBwcm9qZWN0IHdvcmsgd2l0aCB3aGVuIHRoZXkgbG9nIGluIHRvIHlvdXIgcHJvamVjdC5cbipcbiogVGhlcmUgYXJlIG1hbnkgd2F5cyB0byBjcmVhdGUgbmV3IHJ1bnMsIGluY2x1ZGluZyB0aGUgRXBpY2VudGVyLmpzIFtSdW4gU2VydmljZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLyksIHRoZSBSRVNGVGZ1bCBbUnVuIEFQSV0oLi4vLi4vLi4vcmVzdF9hcGlzL2FnZ3JlZ2F0ZV9ydW5fYXBpKSBhbmQgdGhlIFtNb2RlbCBSdW4gQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvb3RoZXJfYXBpcy9tb2RlbF9hcGlzL3J1bi8pLiBIb3dldmVyLCBmb3Igc29tZSBwcm9qZWN0cyBpdCBtYWtlcyBtb3JlIHNlbnNlIHRvIHBpY2sgdXAgd2hlcmUgdGhlIHVzZXIgbGVmdCBvZmYsIHVzaW5nIGFuIGV4aXN0aW5nIHJ1bi4gQW5kIGluIHNvbWUgcHJvamVjdHMsIHdoZXRoZXIgdG8gY3JlYXRlIGEgbmV3IHJ1biBvciB1c2UgYW4gZXhpc3Rpbmcgb25lIGlzIGNvbmRpdGlvbmFsLCBmb3IgZXhhbXBsZSBiYXNlZCBvbiBjaGFyYWN0ZXJpc3RpY3Mgb2YgdGhlIGV4aXN0aW5nIHJ1biBvciB5b3VyIG93biBrbm93bGVkZ2UgYWJvdXQgdGhlIG1vZGVsLiBUaGUgUnVuIE1hbmFnZXIgcHJvdmlkZXMgdGhpcyBsZXZlbCBvZiBjb250cm9sOiB5b3VyIGNhbGwgdG8gYGdldFJ1bigpYCwgcmF0aGVyIHRoYW4gYWx3YXlzIHJldHVybmluZyBhIG5ldyBydW4sIHJldHVybnMgYSBydW4gYmFzZWQgb24gdGhlIHN0cmF0ZWd5IHlvdSd2ZSBzcGVjaWZpZWQuIChOb3RlIHRoYXQgbWFueSBvZiB0aGUgRXBpY2VudGVyIHNhbXBsZSBwcm9qZWN0cyB1c2UgYSBSdW4gU2VydmljZSBkaXJlY3RseSwgYmVjYXVzZSBnZW5lcmFsbHkgdGhlIHNhbXBsZSBwcm9qZWN0cyBhcmUgcGxheWVkIGluIG9uZSBlbmQgdXNlciBzZXNzaW9uIGFuZCBkb24ndCBjYXJlIGFib3V0IHJ1biBzdGF0ZXMgb3IgcnVuIHN0cmF0ZWdpZXMuKVxuKlxuKlxuKiAjIyMgVXNpbmcgdGhlIFJ1biBNYW5hZ2VyIHRvIGNyZWF0ZSBhbmQgYWNjZXNzIHJ1bnNcbipcbiogVG8gdXNlIHRoZSBSdW4gTWFuYWdlciwgaW5zdGFudGlhdGUgaXQgYnkgcGFzc2luZyBpbjpcbipcbiogICAqIGBydW5gOiAocmVxdWlyZWQpIFJ1biBvYmplY3QuIE11c3QgY29udGFpbjpcbiogICAgICAgKiBgYWNjb3VudGA6IEVwaWNlbnRlciBhY2NvdW50IGlkICgqKlRlYW0gSUQqKiBmb3IgdGVhbSBwcm9qZWN0cywgKipVc2VyIElEKiogZm9yIHBlcnNvbmFsIHByb2plY3RzKS5cbiogICAgICAgKiBgcHJvamVjdGA6IEVwaWNlbnRlciBwcm9qZWN0IGlkLlxuKiAgICAgICAqIGBtb2RlbGA6IFRoZSBuYW1lIG9mIHlvdXIgcHJpbWFyeSBtb2RlbCBmaWxlLiAoU2VlIG1vcmUgb24gW1dyaXRpbmcgeW91ciBNb2RlbF0oLi4vLi4vLi4vd3JpdGluZ195b3VyX21vZGVsLykuKVxuKiAgICAgICAqIGBzY29wZWA6IChvcHRpb25hbCkgU2NvcGUgb2JqZWN0IGZvciB0aGUgcnVuLCBmb3IgZXhhbXBsZSBgc2NvcGUuZ3JvdXBgIHdpdGggdmFsdWUgb2YgdGhlIG5hbWUgb2YgdGhlIGdyb3VwLlxuKiAgICAgICAqIGBzZXJ2ZXJgOiAob3B0aW9uYWwpIEFuIG9iamVjdCB3aXRoIG9uZSBmaWVsZCwgYGhvc3RgLiBUaGUgdmFsdWUgb2YgYGhvc3RgIGlzIHRoZSBzdHJpbmcgYGFwaS5mb3Jpby5jb21gLCB0aGUgVVJJIG9mIHRoZSBGb3JpbyBzZXJ2ZXIuIFRoaXMgaXMgYXV0b21hdGljYWxseSBzZXQsIGJ1dCB5b3UgY2FuIHBhc3MgaXQgZXhwbGljaXRseSBpZiBkZXNpcmVkLiBJdCBpcyBtb3N0IGNvbW1vbmx5IHVzZWQgZm9yIGNsYXJpdHkgd2hlbiB5b3UgYXJlIFtob3N0aW5nIGFuIEVwaWNlbnRlciBwcm9qZWN0IG9uIHlvdXIgb3duIHNlcnZlcl0oLi4vLi4vLi4vaG93X3RvL3NlbGZfaG9zdGluZy8pLlxuKiAgICAgICAqIGBmaWxlc2A6IChvcHRpb25hbCkgSWYgYW5kIG9ubHkgaWYgeW91IGFyZSB1c2luZyBhIFZlbnNpbSBtb2RlbCBhbmQgeW91IGhhdmUgYWRkaXRpb25hbCBkYXRhIHRvIHBhc3MgaW4gdG8geW91ciBtb2RlbCwgeW91IGNhbiBwYXNzIGEgYGZpbGVzYCBvYmplY3Qgd2l0aCB0aGUgbmFtZXMgb2YgdGhlIGZpbGVzLCBmb3IgZXhhbXBsZTogYFwiZmlsZXNcIjoge1wiZGF0YVwiOiBcIm15RXh0cmFEYXRhLnhsc1wifWAuIChOb3RlIHRoYXQgeW91J2xsIGFsc28gbmVlZCB0byBhZGQgdGhpcyBzYW1lIGZpbGVzIG9iamVjdCB0byB5b3VyIFZlbnNpbSBbY29uZmlndXJhdGlvbiBmaWxlXSguLi8uLi8uLi9tb2RlbF9jb2RlL3ZlbnNpbS8pLikgU2VlIHRoZSBbdW5kZXJseWluZyBNb2RlbCBSdW4gQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvb3RoZXJfYXBpcy9tb2RlbF9hcGlzL3J1bi8jcG9zdC1jcmVhdGluZy1hLW5ldy1ydW4tZm9yLXRoaXMtcHJvamVjdCkgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24uXG4qXG4qICAgKiBgc3RyYXRlZ3lgOiAob3B0aW9uYWwpIFJ1biBjcmVhdGlvbiBzdHJhdGVneSBmb3Igd2hlbiB0byBjcmVhdGUgYSBuZXcgcnVuIGFuZCB3aGVuIHRvIHJldXNlIGFuIGVuZCB1c2VyJ3MgZXhpc3RpbmcgcnVuLiBTZWUgW1J1biBNYW5hZ2VyIFN0cmF0ZWdpZXNdKC4uLy4uL3N0cmF0ZWd5LykgZm9yIGRldGFpbHMuIERlZmF1bHRzIHRvIGBuZXctaWYtaW5pdGlhbGl6ZWRgLlxuKlxuKiAgICogYHNlc3Npb25LZXlgOiAob3B0aW9uYWwpIE5hbWUgb2YgYnJvd3NlciBjb29raWUgaW4gd2hpY2ggdG8gc3RvcmUgcnVuIGluZm9ybWF0aW9uLCBpbmNsdWRpbmcgcnVuIGlkLiBNYW55IGNvbmRpdGlvbmFsIHN0cmF0ZWdpZXMsIGluY2x1ZGluZyB0aGUgcHJvdmlkZWQgc3RyYXRlZ2llcywgcmVseSBvbiB0aGlzIGJyb3dzZXIgY29va2llIHRvIHN0b3JlIHRoZSBydW4gaWQgYW5kIGhlbHAgbWFrZSB0aGUgZGVjaXNpb24gb2Ygd2hldGhlciB0byBjcmVhdGUgYSBuZXcgcnVuIG9yIHVzZSBhbiBleGlzdGluZyBvbmUuIFRoZSBuYW1lIG9mIHRoaXMgY29va2llIGRlZmF1bHRzIHRvIGBlcGljZW50ZXItc2NlbmFyaW9gIGFuZCBjYW4gYmUgc2V0IHdpdGggdGhlIGBzZXNzaW9uS2V5YCBwYXJhbWV0ZXIuXG4qXG4qXG4qIEFmdGVyIGluc3RhbnRpYXRpbmcgYSBSdW4gTWFuYWdlciwgbWFrZSBhIGNhbGwgdG8gYGdldFJ1bigpYCB3aGVuZXZlciB5b3UgbmVlZCB0byBhY2Nlc3MgYSBydW4gZm9yIHRoaXMgZW5kIHVzZXIuIFRoZSBgUnVuTWFuYWdlci5ydW5gIGNvbnRhaW5zIHRoZSBpbnN0YW50aWF0ZWQgW1J1biBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKS4gVGhlIFJ1biBTZXJ2aWNlIGFsbG93cyB5b3UgdG8gYWNjZXNzIHZhcmlhYmxlcywgY2FsbCBvcGVyYXRpb25zLCBldGMuXG4qXG4qICoqRXhhbXBsZSoqXG4qXG4qICAgICAgIHZhciBybSA9IG5ldyBGLm1hbmFnZXIuUnVuTWFuYWdlcih7XG4qICAgICAgICAgICBydW46IHtcbiogICAgICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4qICAgICAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiogICAgICAgICAgICAgICBtb2RlbDogJ3N1cHBseS1jaGFpbi1tb2RlbC5qbCcsXG4qICAgICAgICAgICAgICAgc2VydmVyOiB7IGhvc3Q6ICdhcGkuZm9yaW8uY29tJyB9XG4qICAgICAgICAgICB9LFxuKiAgICAgICAgICAgc3RyYXRlZ3k6ICdhbHdheXMtbmV3JyxcbiogICAgICAgICAgIHNlc3Npb25LZXk6ICdlcGljZW50ZXItc2Vzc2lvbidcbiogICAgICAgfSk7XG4qICAgICAgIHJtLmdldFJ1bigpXG4qICAgICAgICAgICAudGhlbihmdW5jdGlvbihydW4pIHtcbiogICAgICAgICAgICAgICAvLyB0aGUgcmV0dXJuIHZhbHVlIG9mIGdldFJ1bigpIGlzIGEgcnVuIG9iamVjdFxuKiAgICAgICAgICAgICAgIHZhciB0aGlzUnVuSWQgPSBydW4uaWQ7XG4qICAgICAgICAgICAgICAgLy8gdGhlIFJ1bk1hbmFnZXIucnVuIGFsc28gY29udGFpbnMgdGhlIGluc3RhbnRpYXRlZCBSdW4gU2VydmljZSxcbiogICAgICAgICAgICAgICAvLyBzbyBhbnkgUnVuIFNlcnZpY2UgbWV0aG9kIGlzIHZhbGlkIGhlcmVcbiogICAgICAgICAgICAgICBybS5ydW4uZG8oJ3J1bk1vZGVsJyk7XG4qICAgICAgIH0pXG4qXG4qL1xuXG4ndXNlIHN0cmljdCc7XG52YXIgc3RyYXRlZ2llc01hcCA9IHJlcXVpcmUoJy4vcnVuLXN0cmF0ZWdpZXMvc3RyYXRlZ2llcy1tYXAnKTtcbnZhciBzcGVjaWFsT3BlcmF0aW9ucyA9IHJlcXVpcmUoJy4vc3BlY2lhbC1vcGVyYXRpb25zJyk7XG52YXIgUnVuU2VydmljZSA9IHJlcXVpcmUoJy4uL3NlcnZpY2UvcnVuLWFwaS1zZXJ2aWNlJyk7XG5cblxuZnVuY3Rpb24gcGF0Y2hSdW5TZXJ2aWNlKHNlcnZpY2UsIG1hbmFnZXIpIHtcbiAgICBpZiAoc2VydmljZS5wYXRjaGVkKSB7XG4gICAgICAgIHJldHVybiBzZXJ2aWNlO1xuICAgIH1cblxuICAgIHZhciBvcmlnID0gc2VydmljZS5kbztcbiAgICBzZXJ2aWNlLmRvID0gZnVuY3Rpb24gKG9wZXJhdGlvbiwgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciByZXNlcnZlZE9wcyA9IE9iamVjdC5rZXlzKHNwZWNpYWxPcGVyYXRpb25zKTtcbiAgICAgICAgaWYgKHJlc2VydmVkT3BzLmluZGV4T2Yob3BlcmF0aW9uKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiBvcmlnLmFwcGx5KHNlcnZpY2UsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gc3BlY2lhbE9wZXJhdGlvbnNbb3BlcmF0aW9uXS5jYWxsKHNlcnZpY2UsIHBhcmFtcywgb3B0aW9ucywgbWFuYWdlcik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VydmljZS5wYXRjaGVkID0gdHJ1ZTtcblxuICAgIHJldHVybiBzZXJ2aWNlO1xufVxuXG5cblxudmFyIGRlZmF1bHRzID0ge1xuICAgIC8qKlxuICAgICAqIFJ1biBjcmVhdGlvbiBzdHJhdGVneSBmb3Igd2hlbiB0byBjcmVhdGUgYSBuZXcgcnVuIGFuZCB3aGVuIHRvIHJldXNlIGFuIGVuZCB1c2VyJ3MgZXhpc3RpbmcgcnVuLiBTZWUgW1J1biBNYW5hZ2VyIFN0cmF0ZWdpZXNdKC4uLy4uL3N0cmF0ZWd5LykgZm9yIGRldGFpbHMuIERlZmF1bHRzIHRvIGBuZXctaWYtaW5pdGlhbGl6ZWRgLlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG5cbiAgICBzdHJhdGVneTogJ25ldy1pZi1pbml0aWFsaXplZCdcbn07XG5cbmZ1bmN0aW9uIFJ1bk1hbmFnZXIob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnJ1biBpbnN0YW5jZW9mIFJ1blNlcnZpY2UpIHtcbiAgICAgICAgdGhpcy5ydW4gPSB0aGlzLm9wdGlvbnMucnVuO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucnVuID0gbmV3IFJ1blNlcnZpY2UodGhpcy5vcHRpb25zLnJ1bik7XG4gICAgfVxuXG4gICAgcGF0Y2hSdW5TZXJ2aWNlKHRoaXMucnVuLCB0aGlzKTtcblxuICAgIHZhciBTdHJhdGVneUN0b3IgPSB0eXBlb2YgdGhpcy5vcHRpb25zLnN0cmF0ZWd5ID09PSAnZnVuY3Rpb24nID8gdGhpcy5vcHRpb25zLnN0cmF0ZWd5IDogc3RyYXRlZ2llc01hcFt0aGlzLm9wdGlvbnMuc3RyYXRlZ3ldO1xuXG4gICAgaWYgKCFTdHJhdGVneUN0b3IpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTcGVjaWZpZWQgcnVuIGNyZWF0aW9uIHN0cmF0ZWd5IHdhcyBpbnZhbGlkOicsIHRoaXMub3B0aW9ucy5zdHJhdGVneSk7XG4gICAgfVxuXG4gICAgdGhpcy5zdHJhdGVneSA9IG5ldyBTdHJhdGVneUN0b3IodGhpcy5ydW4sIHRoaXMub3B0aW9ucyk7XG59XG5cblJ1bk1hbmFnZXIucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHJ1biBvYmplY3QgZm9yIGEgJ2dvb2QnIHJ1bi5cbiAgICAgKlxuICAgICAqIEEgZ29vZCBydW4gaXMgZGVmaW5lZCBieSB0aGUgc3RyYXRlZ3kuIEZvciBleGFtcGxlLCBpZiB0aGUgc3RyYXRlZ3kgaXMgYGFsd2F5cy1uZXdgLCB0aGUgY2FsbFxuICAgICAqIHRvIGBnZXRSdW4oKWAgYWx3YXlzIHJldHVybnMgYSBuZXdseSBjcmVhdGVkIHJ1bjsgaWYgdGhlIHN0cmF0ZWd5IGlzIGBuZXctaWYtcGVyc2lzdGVkYCxcbiAgICAgKiBgZ2V0UnVuKClgIGNyZWF0ZXMgYSBuZXcgcnVuIGlmIHRoZSBwcmV2aW91cyBydW4gaXMgaW4gYSBwZXJzaXN0ZWQgc3RhdGUsIG90aGVyd2lzZVxuICAgICAqIGl0IHJldHVybnMgdGhlIHByZXZpb3VzIHJ1bi4gU2VlIFtSdW4gTWFuYWdlciBTdHJhdGVnaWVzXSguLi8uLi9zdHJhdGVneS8pIGZvciBtb3JlIG9uIHN0cmF0ZWdpZXMuXG4gICAgICpcbiAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgcm0uZ2V0UnVuKCkudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICogICAgICAgICAgLy8gdXNlIHRoZSBydW4gb2JqZWN0XG4gICAgICogICAgICAgICAgdmFyIHRoaXNSdW5JZCA9IHJ1bi5pZDtcbiAgICAgKlxuICAgICAqICAgICAgICAgIC8vIHVzZSB0aGUgUnVuIFNlcnZpY2Ugb2JqZWN0XG4gICAgICogICAgICAgICAgcm0ucnVuLmRvKCdydW5Nb2RlbCcpO1xuICAgICAqICAgICAgfSk7XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHskcHJvbWlzZX0gUHJvbWlzZSB0byBjb21wbGV0ZSB0aGUgY2FsbC5cbiAgICAgKi9cbiAgICBnZXRSdW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RyYXRlZ3lcbiAgICAgICAgICAgICAgICAuZ2V0UnVuKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHJ1biBvYmplY3QgZm9yIGEgbmV3IHJ1biwgcmVnYXJkbGVzcyBvZiBzdHJhdGVneTogZm9yY2UgY3JlYXRpb24gb2YgYSBuZXcgcnVuLlxuICAgICAqXG4gICAgICogICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIHJtLnJlc2V0KCkudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICogICAgICAgICAgLy8gdXNlIHRoZSAobmV3KSBydW4gb2JqZWN0XG4gICAgICogICAgICAgICAgdmFyIHRoaXNSdW5JZCA9IHJ1bi5pZDtcbiAgICAgKlxuICAgICAqICAgICAgICAgIC8vIHVzZSB0aGUgUnVuIFNlcnZpY2Ugb2JqZWN0XG4gICAgICogICAgICAgICAgcm0ucnVuLmRvKCdydW5Nb2RlbCcpO1xuICAgICAqICAgICAgfSk7XG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgcnVuU2VydmljZU9wdGlvbnNgIFRoZSBvcHRpb25zIG9iamVjdCB0byBjb25maWd1cmUgdGhlIFJ1biBTZXJ2aWNlLiBTZWUgW1J1biBBUEkgU2VydmljZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLykgZm9yIG1vcmUuXG4gICAgICovXG4gICAgcmVzZXQ6IGZ1bmN0aW9uIChydW5TZXJ2aWNlT3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5zdHJhdGVneS5yZXNldChydW5TZXJ2aWNlT3B0aW9ucyk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSdW5NYW5hZ2VyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgQ29uZGl0aW9uYWxTdHJhdGVneSA9IHJlcXVpcmUoJy4vY29uZGl0aW9uYWwtY3JlYXRpb24tc3RyYXRlZ3knKTtcblxudmFyIF9fc3VwZXIgPSBDb25kaXRpb25hbFN0cmF0ZWd5LnByb3RvdHlwZTtcblxudmFyIFN0cmF0ZWd5ID0gY2xhc3NGcm9tKENvbmRpdGlvbmFsU3RyYXRlZ3ksIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIG9wdGlvbnMpIHtcbiAgICAgICAgX19zdXBlci5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIHJ1blNlcnZpY2UsIHRoaXMuY3JlYXRlSWYsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICBjcmVhdGVJZjogZnVuY3Rpb24gKHJ1biwgaGVhZGVycykge1xuICAgICAgICAvLyBhbHdheXMgY3JlYXRlIGEgbmV3IHJ1biFcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RyYXRlZ3k7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBtYWtlU2VxID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9tYWtlLXNlcXVlbmNlJyk7XG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vaWRlbnRpdHktc3RyYXRlZ3knKTtcbnZhciBTZXNzaW9uU3RvcmUgPSByZXF1aXJlKCcuLi8uLi9zdG9yZS9zdG9yZS1mYWN0b3J5Jyk7XG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgVXJsU2VydmljZSA9IHJlcXVpcmUoJy4uLy4uL3NlcnZpY2UvdXJsLWNvbmZpZy1zZXJ2aWNlJyk7XG52YXIgQXV0aE1hbmFnZXIgPSByZXF1aXJlKCcuLi9hdXRoLW1hbmFnZXInKTtcblxudmFyIHNlc3Npb25TdG9yZSA9IG5ldyBTZXNzaW9uU3RvcmUoe30pO1xudmFyIHVybFNlcnZpY2UgPSBuZXcgVXJsU2VydmljZSgpO1xudmFyIGtleU5hbWVzID0gcmVxdWlyZSgnLi4va2V5LW5hbWVzJyk7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICBzZXNzaW9uS2V5OiBrZXlOYW1lcy5TVFJBVEVHWV9TRVNTSU9OX0tFWSxcbiAgICBwYXRoOiAnJ1xufTtcblxuZnVuY3Rpb24gc2V0UnVuSW5TZXNzaW9uKHNlc3Npb25LZXksIHJ1biwgcGF0aCkge1xuICAgIGlmICghcGF0aCkge1xuICAgICAgICBpZiAoIXVybFNlcnZpY2UuaXNMb2NhbGhvc3QoKSkge1xuICAgICAgICAgICAgcGF0aCA9ICcvJyArIFt1cmxTZXJ2aWNlLmFwcFBhdGgsIHVybFNlcnZpY2UuYWNjb3VudFBhdGgsIHVybFNlcnZpY2UucHJvamVjdFBhdGhdLmpvaW4oJy8nKTtcbiAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB3ZSBkb24ndCBnZXQgY29uc2VjdXRlaXZlICcvJyBzbyB3ZSBoYXZlIGEgdmFsaWQgcGF0aCBmb3IgdGhlIHNlc3Npb25cbiAgICAgICAgICAgIHBhdGggPSBwYXRoLnJlcGxhY2UoL1xcL3syLH0vZywnLycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGF0aCA9ICcnO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIHNldCB0aGUgc2Vlc2lvbktleSBmb3IgdGhlIHJ1blxuICAgIHNlc3Npb25TdG9yZS5zZXQoc2Vzc2lvbktleSwgSlNPTi5zdHJpbmdpZnkoeyBydW5JZDogcnVuLmlkIH0pLCB7IHJvb3Q6IHBhdGggfSk7XG59XG5cbi8qKlxuKiBDb25kaXRpb25hbCBDcmVhdGlvbiBTdHJhdGVneVxuKiBUaGlzIHN0cmF0ZWd5IHdpbGwgdHJ5IHRvIGdldCB0aGUgcnVuIHN0b3JlZCBpbiB0aGUgY29va2llIGFuZFxuKiBldmFsdWF0ZSBpZiBuZWVkcyB0byBjcmVhdGUgYSBuZXcgcnVuIGJ5IGNhbGxpbmcgdGhlICdjb25kaXRpb24nIGZ1bmN0aW9uXG4qL1xuXG4vKiBqc2hpbnQgZXFudWxsOiB0cnVlICovXG52YXIgU3RyYXRlZ3kgPSBjbGFzc0Zyb20oQmFzZSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBTdHJhdGVneShydW5TZXJ2aWNlLCBjb25kaXRpb24sIG9wdGlvbnMpIHtcblxuICAgICAgICBpZiAoY29uZGl0aW9uID09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29uZGl0aW9uYWwgc3RyYXRlZ3kgbmVlZHMgYSBjb25kaXRpb24gdG8gY3JlYXRldGUgYSBydW4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2F1dGggPSBuZXcgQXV0aE1hbmFnZXIoKTtcbiAgICAgICAgdGhpcy5ydW4gPSBtYWtlU2VxKHJ1blNlcnZpY2UpO1xuICAgICAgICB0aGlzLmNvbmRpdGlvbiA9IHR5cGVvZiBjb25kaXRpb24gIT09ICdmdW5jdGlvbicgPyBmdW5jdGlvbiAoKSB7IHJldHVybiBjb25kaXRpb247IH0gOiBjb25kaXRpb247XG4gICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMucnVuT3B0aW9ucyA9IHRoaXMub3B0aW9ucy5ydW47XG4gICAgfSxcblxuICAgIHJ1bk9wdGlvbnNXaXRoU2NvcGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHVzZXJTZXNzaW9uID0gdGhpcy5fYXV0aC5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICAgIHJldHVybiAkLmV4dGVuZCh7XG4gICAgICAgICAgICBzY29wZTogeyBncm91cDogdXNlclNlc3Npb24uZ3JvdXBOYW1lIH1cbiAgICAgICAgfSwgdGhpcy5ydW5PcHRpb25zKTtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uIChydW5TZXJ2aWNlT3B0aW9ucykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgb3B0ID0gdGhpcy5ydW5PcHRpb25zV2l0aFNjb3BlKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMucnVuXG4gICAgICAgICAgICAgICAgLmNyZWF0ZShvcHQsIHJ1blNlcnZpY2VPcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgICAgIHNldFJ1bkluU2Vzc2lvbihfdGhpcy5vcHRpb25zLnNlc3Npb25LZXksIHJ1biwgX3RoaXMub3B0aW9ucy5wYXRoKTtcbiAgICAgICAgICAgICAgICBydW4uZnJlc2hseUNyZWF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBydW47XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0YXJ0KCk7XG4gICAgfSxcblxuICAgIGdldFJ1bjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcnVuU2Vzc2lvbiA9IEpTT04ucGFyc2Uoc2Vzc2lvblN0b3JlLmdldCh0aGlzLm9wdGlvbnMuc2Vzc2lvbktleSkpO1xuXG4gICAgICAgIGlmIChydW5TZXNzaW9uICYmIHJ1blNlc3Npb24ucnVuSWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9sb2FkQW5kQ2hlY2socnVuU2Vzc2lvbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXNldCgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9sb2FkQW5kQ2hlY2s6IGZ1bmN0aW9uIChydW5TZXNzaW9uKSB7XG4gICAgICAgIHZhciBzaG91bGRDcmVhdGUgPSBmYWxzZTtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICByZXR1cm4gdGhpcy5ydW5cbiAgICAgICAgICAgIC5sb2FkKHJ1blNlc3Npb24ucnVuSWQsIG51bGwsIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocnVuLCBtc2csIGhlYWRlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgc2hvdWxkQ3JlYXRlID0gX3RoaXMuY29uZGl0aW9uLmNhbGwoX3RoaXMsIHJ1biwgaGVhZGVycyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgICAgICAgICBpZiAoc2hvdWxkQ3JlYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvcHQgPSBfdGhpcy5ydW5PcHRpb25zV2l0aFNjb3BlKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIHdlIG5lZWQgdG8gZG8gdGhpcywgb24gdGhlIG9yaWdpbmFsIHJ1blNlcnZpY2UgKGllIG5vdCBzZXF1ZW5jaWFsaXplZClcbiAgICAgICAgICAgICAgICAgICAgLy8gc28gd2UgZG9uJ3QgZ2V0IGluIHRoZSBtaWRkbGUgb2YgdGhlIHF1ZXVlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5ydW4ub3JpZ2luYWwuY3JlYXRlKG9wdClcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0UnVuSW5TZXNzaW9uKF90aGlzLm9wdGlvbnMuc2Vzc2lvbktleSwgcnVuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bi5mcmVzaGx5Q3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGFydCgpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmF0ZWd5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgQmFzZSA9IHt9O1xuXG4vLyBJbnRlcmZhY2UgdGhhdCBhbGwgc3RyYXRlZ2llcyBuZWVkIHRvIGltcGxlbWVudFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzc0Zyb20oQmFzZSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAocnVuU2VydmljZSwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLnJ1blNlcnZpY2UgID0gcnVuU2VydmljZTtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gcmV0dXJuIGEgbmV3bHkgY3JlYXRlZCBydW5cbiAgICAgICAgcmV0dXJuICQuRGVmZXJyZWQoKS5yZXNvbHZlKCkucHJvbWlzZSgpO1xuICAgIH0sXG5cbiAgICBnZXRSdW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gcmV0dXJuIGEgdXNhYmxlIHJ1blxuICAgICAgICByZXR1cm4gJC5EZWZlcnJlZCgpLnJlc29sdmUodGhpcy5ydW5TZXJ2aWNlKS5wcm9taXNlKCk7XG4gICAgfVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcblxudmFyIElkZW50aXR5U3RyYXRlZ3kgPSByZXF1aXJlKCcuL2lkZW50aXR5LXN0cmF0ZWd5Jyk7XG52YXIgV29ybGRBcGlBZGFwdGVyID0gcmVxdWlyZSgnLi4vLi4vc2VydmljZS93b3JsZC1hcGktYWRhcHRlcicpO1xudmFyIEF1dGhNYW5hZ2VyID0gcmVxdWlyZSgnLi4vYXV0aC1tYW5hZ2VyJyk7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICBzdG9yZToge1xuICAgICAgICBzeW5jaHJvbm91czogdHJ1ZVxuICAgIH1cbn07XG5cbnZhciBTdHJhdGVneSA9IGNsYXNzRnJvbShJZGVudGl0eVN0cmF0ZWd5LCB7XG5cbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5ydW5TZXJ2aWNlID0gcnVuU2VydmljZTtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fYXV0aCA9IG5ldyBBdXRoTWFuYWdlcigpO1xuICAgICAgICB0aGlzLl9sb2FkUnVuID0gdGhpcy5fbG9hZFJ1bi5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLndvcmxkQXBpID0gbmV3IFdvcmxkQXBpQWRhcHRlcih0aGlzLm9wdGlvbnMucnVuKTtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLl9hdXRoLmdldEN1cnJlbnRVc2VyU2Vzc2lvbkluZm8oKTtcbiAgICAgICAgdmFyIGN1clVzZXJJZCA9IHNlc3Npb24udXNlcklkO1xuICAgICAgICB2YXIgY3VyR3JvdXBOYW1lID0gc2Vzc2lvbi5ncm91cE5hbWU7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMud29ybGRBcGlcbiAgICAgICAgICAgIC5nZXRDdXJyZW50V29ybGRGb3JVc2VyKGN1clVzZXJJZCwgY3VyR3JvdXBOYW1lKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHdvcmxkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMud29ybGRBcGkubmV3UnVuRm9yV29ybGQod29ybGQuaWQpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgZ2V0UnVuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5fYXV0aC5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICAgIHZhciBjdXJVc2VySWQgPSBzZXNzaW9uLnVzZXJJZDtcbiAgICAgICAgdmFyIGN1ckdyb3VwTmFtZSA9IHNlc3Npb24uZ3JvdXBOYW1lO1xuICAgICAgICB2YXIgd29ybGRBcGkgPSB0aGlzLndvcmxkQXBpO1xuICAgICAgICB2YXIgbW9kZWwgPSB0aGlzLm9wdGlvbnMubW9kZWw7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBkdGQgPSAkLkRlZmVycmVkKCk7XG5cbiAgICAgICAgaWYgKCFjdXJVc2VySWQpIHtcbiAgICAgICAgICAgIHJldHVybiBkdGQucmVqZWN0KHsgc3RhdHVzQ29kZTogNDAwLCBlcnJvcjogJ1dlIG5lZWQgYW4gYXV0aGVudGljYXRlZCB1c2VyIHRvIGpvaW4gYSBtdWx0aXBsYXllciB3b3JsZC4gKEVSUjogbm8gdXNlcklkIGluIHNlc3Npb24pJyB9LCBzZXNzaW9uKS5wcm9taXNlKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbG9hZFJ1bkZyb21Xb3JsZCA9IGZ1bmN0aW9uICh3b3JsZCkge1xuICAgICAgICAgICAgaWYgKCF3b3JsZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkdGQucmVqZWN0KHsgc3RhdHVzQ29kZTogNDA0LCBlcnJvcjogJ1RoZSB1c2VyIGlzIG5vdCBpbiBhbnkgd29ybGQuJyB9LCB7IG9wdGlvbnM6IHRoaXMub3B0aW9ucywgc2Vzc2lvbjogc2Vzc2lvbiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkQXBpLmdldEN1cnJlbnRSdW5JZCh7IG1vZGVsOiBtb2RlbCwgZmlsdGVyOiB3b3JsZC5pZCB9KVxuICAgICAgICAgICAgICAgIC50aGVuKF90aGlzLl9sb2FkUnVuKVxuICAgICAgICAgICAgICAgIC50aGVuKGR0ZC5yZXNvbHZlKVxuICAgICAgICAgICAgICAgIC5mYWlsKGR0ZC5yZWplY3QpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBzZXJ2ZXJFcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgLy8gaXMgdGhpcyBwb3NzaWJsZT9cbiAgICAgICAgICAgIGR0ZC5yZWplY3QoZXJyb3IsIHNlc3Npb24sIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy53b3JsZEFwaVxuICAgICAgICAgICAgLmdldEN1cnJlbnRXb3JsZEZvclVzZXIoY3VyVXNlcklkLCBjdXJHcm91cE5hbWUpXG4gICAgICAgICAgICAudGhlbihsb2FkUnVuRnJvbVdvcmxkKVxuICAgICAgICAgICAgLmZhaWwoc2VydmVyRXJyb3IpO1xuXG4gICAgICAgIHJldHVybiBkdGQucHJvbWlzZSgpO1xuICAgIH0sXG5cbiAgICBfbG9hZFJ1bjogZnVuY3Rpb24gKGlkLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1blNlcnZpY2UubG9hZChpZCwgbnVsbCwgb3B0aW9ucyk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RyYXRlZ3k7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgQ29uZGl0aW9uYWxTdHJhdGVneSA9IHJlcXVpcmUoJy4vY29uZGl0aW9uYWwtY3JlYXRpb24tc3RyYXRlZ3knKTtcblxudmFyIF9fc3VwZXIgPSBDb25kaXRpb25hbFN0cmF0ZWd5LnByb3RvdHlwZTtcblxudmFyIFN0cmF0ZWd5ID0gY2xhc3NGcm9tKENvbmRpdGlvbmFsU3RyYXRlZ3ksIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIG9wdGlvbnMpIHtcbiAgICAgICAgX19zdXBlci5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIHJ1blNlcnZpY2UsIHRoaXMuY3JlYXRlSWYsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICBjcmVhdGVJZjogZnVuY3Rpb24gKHJ1biwgaGVhZGVycykge1xuICAgICAgICByZXR1cm4gaGVhZGVycy5nZXRSZXNwb25zZUhlYWRlcigncHJhZ21hJykgPT09ICdwZXJzaXN0ZW50JyB8fCBydW4uaW5pdGlhbGl6ZWQ7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RyYXRlZ3k7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBDb25kaXRpb25hbFN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9jb25kaXRpb25hbC1jcmVhdGlvbi1zdHJhdGVneScpO1xuXG52YXIgX19zdXBlciA9IENvbmRpdGlvbmFsU3RyYXRlZ3kucHJvdG90eXBlO1xuXG4vKlxuKiAgY3JlYXRlIGEgbmV3IHJ1biBvbmx5IGlmIG5vdGhpbmcgaXMgc3RvcmVkIGluIHRoZSBjb29raWVcbiogIHRoaXMgaXMgdXNlZnVsIGZvciBiYXNlUnVucy5cbiovXG52YXIgU3RyYXRlZ3kgPSBjbGFzc0Zyb20oQ29uZGl0aW9uYWxTdHJhdGVneSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAocnVuU2VydmljZSwgb3B0aW9ucykge1xuICAgICAgICBfX3N1cGVyLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgcnVuU2VydmljZSwgdGhpcy5jcmVhdGVJZiwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIGNyZWF0ZUlmOiBmdW5jdGlvbiAocnVuLCBoZWFkZXJzKSB7XG4gICAgICAgIC8vIGlmIHdlIGFyZSBoZXJlLCBpdCBtZWFucyB0aGF0IHRoZSBydW4gZXhpc3RzLi4uIHNvIHdlIGRvbid0IG5lZWQgYSBuZXcgb25lXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJhdGVneTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBDb25kaXRpb25hbFN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9jb25kaXRpb25hbC1jcmVhdGlvbi1zdHJhdGVneScpO1xuXG52YXIgX19zdXBlciA9IENvbmRpdGlvbmFsU3RyYXRlZ3kucHJvdG90eXBlO1xuXG52YXIgU3RyYXRlZ3kgPSBjbGFzc0Zyb20oQ29uZGl0aW9uYWxTdHJhdGVneSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAocnVuU2VydmljZSwgb3B0aW9ucykge1xuICAgICAgICBfX3N1cGVyLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgcnVuU2VydmljZSwgdGhpcy5jcmVhdGVJZiwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIGNyZWF0ZUlmOiBmdW5jdGlvbiAocnVuLCBoZWFkZXJzKSB7XG4gICAgICAgIHJldHVybiBoZWFkZXJzLmdldFJlc3BvbnNlSGVhZGVyKCdwcmFnbWEnKSA9PT0gJ3BlcnNpc3RlbnQnO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmF0ZWd5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgSWRlbnRpdHlTdHJhdGVneSA9IHJlcXVpcmUoJy4vaWRlbnRpdHktc3RyYXRlZ3knKTtcbnZhciBTdG9yYWdlRmFjdG9yeSA9IHJlcXVpcmUoJy4uLy4uL3N0b3JlL3N0b3JlLWZhY3RvcnknKTtcbnZhciBTdGF0ZUFwaSA9IHJlcXVpcmUoJy4uLy4uL3NlcnZpY2Uvc3RhdGUtYXBpLWFkYXB0ZXInKTtcbnZhciBBdXRoTWFuYWdlciA9IHJlcXVpcmUoJy4uL2F1dGgtbWFuYWdlcicpO1xuXG52YXIga2V5TmFtZXMgPSByZXF1aXJlKCcuLi9rZXktbmFtZXMnKTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHN0b3JlOiB7XG4gICAgICAgIHN5bmNocm9ub3VzOiB0cnVlXG4gICAgfVxufTtcblxudmFyIFN0cmF0ZWd5ID0gY2xhc3NGcm9tKElkZW50aXR5U3RyYXRlZ3ksIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gU3RyYXRlZ3kocnVuU2VydmljZSwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLnJ1biA9IHJ1blNlcnZpY2U7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMucnVuT3B0aW9ucyA9IHRoaXMub3B0aW9ucy5ydW47XG4gICAgICAgIHRoaXMuX3N0b3JlID0gbmV3IFN0b3JhZ2VGYWN0b3J5KHRoaXMub3B0aW9ucy5zdG9yZSk7XG4gICAgICAgIHRoaXMuc3RhdGVBcGkgPSBuZXcgU3RhdGVBcGkoKTtcbiAgICAgICAgdGhpcy5fYXV0aCA9IG5ldyBBdXRoTWFuYWdlcigpO1xuXG4gICAgICAgIHRoaXMuX2xvYWRBbmRDaGVjayA9IHRoaXMuX2xvYWRBbmRDaGVjay5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9yZXN0b3JlUnVuID0gdGhpcy5fcmVzdG9yZVJ1bi5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9nZXRBbGxSdW5zID0gdGhpcy5fZ2V0QWxsUnVucy5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9sb2FkUnVuID0gdGhpcy5fbG9hZFJ1bi5iaW5kKHRoaXMpO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gKHJ1blNlcnZpY2VPcHRpb25zKSB7XG4gICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5fYXV0aC5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICAgIHZhciBvcHQgPSAkLmV4dGVuZCh7XG4gICAgICAgICAgICBzY29wZTogeyBncm91cDogc2Vzc2lvbi5ncm91cE5hbWUgfVxuICAgICAgICB9LCB0aGlzLnJ1bk9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnJ1blxuICAgICAgICAgICAgLmNyZWF0ZShvcHQsIHJ1blNlcnZpY2VPcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgICAgIHJ1bi5mcmVzaGx5Q3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBnZXRSdW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldEFsbFJ1bnMoKVxuICAgICAgICAgICAgLnRoZW4odGhpcy5fbG9hZEFuZENoZWNrKTtcbiAgICB9LFxuXG4gICAgX2dldEFsbFJ1bnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHNlc3Npb24gPSBKU09OLnBhcnNlKHRoaXMuX3N0b3JlLmdldChrZXlOYW1lcy5FUElfU0VTU0lPTl9LRVkpIHx8ICd7fScpO1xuICAgICAgICByZXR1cm4gdGhpcy5ydW4ucXVlcnkoe1xuICAgICAgICAgICAgJ3VzZXIuaWQnOiBzZXNzaW9uLnVzZXJJZCB8fCAnMDAwMCcsXG4gICAgICAgICAgICAnc2NvcGUuZ3JvdXAnOiBzZXNzaW9uLmdyb3VwTmFtZVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX2xvYWRBbmRDaGVjazogZnVuY3Rpb24gKHJ1bnMpIHtcbiAgICAgICAgaWYgKCFydW5zIHx8ICFydW5zLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVzZXQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkYXRlQ29tcCA9IGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBuZXcgRGF0ZShiLmRhdGUpIC0gbmV3IERhdGUoYS5kYXRlKTsgfTtcbiAgICAgICAgdmFyIGxhdGVzdFJ1biA9IHJ1bnMuc29ydChkYXRlQ29tcClbMF07XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBzaG91bGRSZXBsYXkgPSBmYWxzZTtcblxuICAgICAgICByZXR1cm4gdGhpcy5ydW4ubG9hZChsYXRlc3RSdW4uaWQsIG51bGwsIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChydW4sIG1zZywgaGVhZGVycykge1xuICAgICAgICAgICAgICAgIHNob3VsZFJlcGxheSA9IGhlYWRlcnMuZ2V0UmVzcG9uc2VIZWFkZXIoJ3ByYWdtYScpID09PSAncGVyc2lzdGVudCc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgcmV0dXJuIHNob3VsZFJlcGxheSA/IF90aGlzLl9yZXN0b3JlUnVuKHJ1bi5pZCkgOiBydW47XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfcmVzdG9yZVJ1bjogZnVuY3Rpb24gKHJ1bklkKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlQXBpLnJlcGxheSh7IHJ1bklkOiBydW5JZCB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMuX2xvYWRSdW4ocmVzcC5ydW4pO1xuICAgICAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9sb2FkUnVuOiBmdW5jdGlvbiAoaWQsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuLmxvYWQoaWQsIG51bGwsIG9wdGlvbnMpO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RyYXRlZ3k7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnbmV3LWlmLWluaXRpYWxpemVkJzogcmVxdWlyZSgnLi9uZXctaWYtaW5pdGlhbGl6ZWQtc3RyYXRlZ3knKSxcbiAgICAnbmV3LWlmLXBlcnNpc3RlZCc6IHJlcXVpcmUoJy4vbmV3LWlmLXBlcnNpc3RlZC1zdHJhdGVneScpLFxuICAgICduZXctaWYtbWlzc2luZyc6IHJlcXVpcmUoJy4vbmV3LWlmLW1pc3Npbmctc3RyYXRlZ3knKSxcbiAgICAnYWx3YXlzLW5ldyc6IHJlcXVpcmUoJy4vYWx3YXlzLW5ldy1zdHJhdGVneScpLFxuICAgICdtdWx0aXBsYXllcic6IHJlcXVpcmUoJy4vbXVsdGlwbGF5ZXItc3RyYXRlZ3knKSxcbiAgICAncGVyc2lzdGVudC1zaW5nbGUtcGxheWVyJzogcmVxdWlyZSgnLi9wZXJzaXN0ZW50LXNpbmdsZS1wbGF5ZXItc3RyYXRlZ3knKSxcbiAgICAnbm9uZSc6IHJlcXVpcmUoJy4vaWRlbnRpdHktc3RyYXRlZ3knKVxufTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBSdW5TZXJ2aWNlID0gcmVxdWlyZSgnLi4vc2VydmljZS9ydW4tYXBpLXNlcnZpY2UnKTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHZhbGlkRmlsdGVyOiB7IHNhdmVkOiB0cnVlIH1cbn07XG5cbmZ1bmN0aW9uIFNjZW5hcmlvTWFuYWdlcihvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICB0aGlzLnJ1blNlcnZpY2UgPSB0aGlzLm9wdGlvbnMucnVuIHx8IG5ldyBSdW5TZXJ2aWNlKHRoaXMub3B0aW9ucyk7XG59XG5cblNjZW5hcmlvTWFuYWdlci5wcm90b3R5cGUgPSB7XG4gICAgZ2V0UnVuczogZnVuY3Rpb24gKGZpbHRlcikge1xuICAgICAgICB0aGlzLmZpbHRlciA9ICQuZXh0ZW5kKHRydWUsIHt9LCB0aGlzLm9wdGlvbnMudmFsaWRGaWx0ZXIsIGZpbHRlcik7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1blNlcnZpY2UucXVlcnkodGhpcy5maWx0ZXIpO1xuICAgIH0sXG5cbiAgICBsb2FkVmFyaWFibGVzOiBmdW5jdGlvbiAodmFycykge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW5TZXJ2aWNlLnF1ZXJ5KHRoaXMuZmlsdGVyLCB7IGluY2x1ZGU6IHZhcnMgfSk7XG4gICAgfSxcblxuICAgIHNhdmU6IGZ1bmN0aW9uIChydW4sIG1ldGEpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldFNlcnZpY2UocnVuKS5zYXZlKCQuZXh0ZW5kKHRydWUsIHt9LCB7IHNhdmVkOiB0cnVlIH0sIG1ldGEpKTtcbiAgICB9LFxuXG4gICAgYXJjaGl2ZTogZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0U2VydmljZShydW4pLnNhdmUoeyBzYXZlZDogZmFsc2UgfSk7XG4gICAgfSxcblxuICAgIF9nZXRTZXJ2aWNlOiBmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcnVuID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBSdW5TZXJ2aWNlKCQuZXh0ZW5kKHRydWUsIHt9LCAgdGhpcy5vcHRpb25zLCB7IGZpbHRlcjogcnVuIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgcnVuID09PSAnb2JqZWN0JyAmJiBydW4gaW5zdGFuY2VvZiBSdW5TZXJ2aWNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTYXZlIG1ldGhvZCByZXF1aXJlcyBhIHJ1biBzZXJ2aWNlIG9yIGEgcnVuSWQnKTtcbiAgICB9LFxuXG4gICAgZ2V0UnVuOiBmdW5jdGlvbiAocnVuSWQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSdW5TZXJ2aWNlKCQuZXh0ZW5kKHRydWUsIHt9LCAgdGhpcy5vcHRpb25zLCB7IGZpbHRlcjogcnVuSWQgfSkpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2NlbmFyaW9NYW5hZ2VyO1xuXG4iLCIndXNlIHN0cmljdCc7XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcmVzZXQ6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMsIG1hbmFnZXIpIHtcbiAgICAgICAgcmV0dXJuIG1hbmFnZXIucmVzZXQob3B0aW9ucyk7XG4gICAgfVxufTtcbiIsIi8qKlxuKiAjIyBXb3JsZCBNYW5hZ2VyXG4qXG4qIEFzIGRpc2N1c3NlZCB1bmRlciB0aGUgW1dvcmxkIEFQSSBBZGFwdGVyXSguLi93b3JsZC1hcGktYWRhcHRlci8pLCBhIFtydW5dKC4uLy4uLy4uL2dsb3NzYXJ5LyNydW4pIGlzIGEgY29sbGVjdGlvbiBvZiBlbmQgdXNlciBpbnRlcmFjdGlvbnMgd2l0aCBhIHByb2plY3QgYW5kIGl0cyBtb2RlbC4gRm9yIGJ1aWxkaW5nIG11bHRpcGxheWVyIHNpbXVsYXRpb25zIHlvdSB0eXBpY2FsbHkgd2FudCBtdWx0aXBsZSBlbmQgdXNlcnMgdG8gc2hhcmUgdGhlIHNhbWUgc2V0IG9mIGludGVyYWN0aW9ucywgYW5kIHdvcmsgd2l0aGluIGEgY29tbW9uIHN0YXRlLiBFcGljZW50ZXIgYWxsb3dzIHlvdSB0byBjcmVhdGUgXCJ3b3JsZHNcIiB0byBoYW5kbGUgc3VjaCBjYXNlcy5cbipcbiogVGhlIFdvcmxkIE1hbmFnZXIgcHJvdmlkZXMgYW4gZWFzeSB3YXkgdG8gdHJhY2sgYW5kIGFjY2VzcyB0aGUgY3VycmVudCB3b3JsZCBhbmQgcnVuIGZvciBwYXJ0aWN1bGFyIGVuZCB1c2Vycy4gSXQgaXMgdHlwaWNhbGx5IHVzZWQgaW4gcGFnZXMgdGhhdCBlbmQgdXNlcnMgd2lsbCBpbnRlcmFjdCB3aXRoLiAoVGhlIHJlbGF0ZWQgW1dvcmxkIEFQSSBBZGFwdGVyXSguLi93b3JsZC1hcGktYWRhcHRlci8pIGhhbmRsZXMgY3JlYXRpbmcgbXVsdGlwbGF5ZXIgd29ybGRzLCBhbmQgYWRkaW5nIGFuZCByZW1vdmluZyBlbmQgdXNlcnMgYW5kIHJ1bnMgZnJvbSBhIHdvcmxkLiBCZWNhdXNlIG9mIHRoaXMsIHR5cGljYWxseSB0aGUgV29ybGQgQWRhcHRlciBpcyB1c2VkIGZvciBmYWNpbGl0YXRvciBwYWdlcyBpbiB5b3VyIHByb2plY3QuKVxuKlxuKiAjIyMgVXNpbmcgdGhlIFdvcmxkIE1hbmFnZXJcbipcbiogVG8gdXNlIHRoZSBXb3JsZCBNYW5hZ2VyLCBpbnN0YW50aWF0ZSBpdC4gVGhlbiwgbWFrZSBjYWxscyB0byBhbnkgb2YgdGhlIG1ldGhvZHMgeW91IG5lZWQuXG4qXG4qIFdoZW4geW91IGluc3RhbnRpYXRlIGEgV29ybGQgTWFuYWdlciwgdGhlIHdvcmxkJ3MgYWNjb3VudCBpZCwgcHJvamVjdCBpZCwgYW5kIGdyb3VwIGFyZSBhdXRvbWF0aWNhbGx5IHRha2VuIGZyb20gdGhlIHNlc3Npb24gKHRoYW5rcyB0byB0aGUgW0F1dGhlbnRpY2F0aW9uIFNlcnZpY2VdKC4uL2F1dGgtYXBpLXNlcnZpY2UpKS5cbipcbiogTm90ZSB0aGF0IHRoZSBXb3JsZCBNYW5hZ2VyIGRvZXMgKm5vdCogY3JlYXRlIHdvcmxkcyBhdXRvbWF0aWNhbGx5LiAoVGhpcyBpcyBkaWZmZXJlbnQgdGhhbiB0aGUgW1J1biBNYW5hZ2VyXSguLi9ydW4tbWFuYWdlcikuKSBIb3dldmVyLCB5b3UgY2FuIHBhc3MgaW4gc3BlY2lmaWMgb3B0aW9ucyB0byBhbnkgcnVucyBjcmVhdGVkIGJ5IHRoZSBtYW5hZ2VyLCB1c2luZyBhIGBydW5gIG9iamVjdC5cbipcbiogVGhlIHBhcmFtZXRlcnMgZm9yIGNyZWF0aW5nIGEgV29ybGQgTWFuYWdlciBhcmU6XG4qXG4qICAgKiBgYWNjb3VudGA6IFRoZSAqKlRlYW0gSUQqKiBpbiB0aGUgRXBpY2VudGVyIHVzZXIgaW50ZXJmYWNlIGZvciB0aGlzIHByb2plY3QuXG4qICAgKiBgcHJvamVjdGA6IFRoZSAqKlByb2plY3QgSUQqKiBmb3IgdGhpcyBwcm9qZWN0LlxuKiAgICogYGdyb3VwYDogVGhlICoqR3JvdXAgTmFtZSoqIGZvciB0aGlzIHdvcmxkLlxuKiAgICogYHJ1bmA6IE9wdGlvbnMgdG8gdXNlIHdoZW4gY3JlYXRpbmcgbmV3IHJ1bnMgd2l0aCB0aGUgbWFuYWdlciwgZS5nLiBgcnVuOiB7IGZpbGVzOiBbJ2RhdGEueGxzJ10gfWAuXG4qICAgKiBgcnVuLm1vZGVsYDogVGhlIG5hbWUgb2YgdGhlIHByaW1hcnkgbW9kZWwgZmlsZSBmb3IgdGhpcyBwcm9qZWN0LiBSZXF1aXJlZCBpZiB5b3UgaGF2ZSBub3QgYWxyZWFkeSBwYXNzZWQgaXQgaW4gYXMgcGFydCBvZiB0aGUgYG9wdGlvbnNgIHBhcmFtZXRlciBmb3IgYW4gZW5jbG9zaW5nIGNhbGwuXG4qXG4qIEZvciBleGFtcGxlOlxuKlxuKiAgICAgICB2YXIgd01nciA9IG5ldyBGLm1hbmFnZXIuV29ybGRNYW5hZ2VyKHtcbiogICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuKiAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuKiAgICAgICAgICBydW46IHsgbW9kZWw6ICdzdXBwbHktY2hhaW4ucHknIH0sXG4qICAgICAgICAgIGdyb3VwOiAndGVhbTEnXG4qICAgICAgIH0pO1xuKlxuKiAgICAgICB3TWdyLmdldEN1cnJlbnRSdW4oKTtcbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFdvcmxkQXBpID0gcmVxdWlyZSgnLi4vc2VydmljZS93b3JsZC1hcGktYWRhcHRlcicpO1xudmFyIFJ1bk1hbmFnZXIgPSAgcmVxdWlyZSgnLi9ydW4tbWFuYWdlcicpO1xudmFyIEF1dGhNYW5hZ2VyID0gcmVxdWlyZSgnLi9hdXRoLW1hbmFnZXInKTtcbnZhciB3b3JsZEFwaTtcblxuLy8gdmFyIGRlZmF1bHRzID0ge1xuLy8gIGFjY291bnQ6ICcnLFxuLy8gIHByb2plY3Q6ICcnLFxuLy8gIGdyb3VwOiAnJyxcbi8vICB0cmFuc3BvcnQ6IHtcbi8vICB9XG4vLyB9O1xuXG5cbmZ1bmN0aW9uIGJ1aWxkU3RyYXRlZ3kod29ybGRJZCwgZHRkKSB7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gQ3RvcihydW5TZXJ2aWNlLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMucnVuU2VydmljZSA9IHJ1blNlcnZpY2U7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICAgICAgJC5leHRlbmQodGhpcywge1xuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vdCBpbXBsZW1lbnRkLiBOZWVkIGFwaSBjaGFuZ2VzJyk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBnZXRSdW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgIC8vZ2V0IG9yIGNyZWF0ZSFcbiAgICAgICAgICAgICAgICAvLyBNb2RlbCBpcyByZXF1aXJlZCBpbiB0aGUgb3B0aW9uc1xuICAgICAgICAgICAgICAgIHZhciBtb2RlbCA9IHRoaXMub3B0aW9ucy5ydW4ubW9kZWwgfHwgdGhpcy5vcHRpb25zLm1vZGVsO1xuICAgICAgICAgICAgICAgIHJldHVybiB3b3JsZEFwaS5nZXRDdXJyZW50UnVuSWQoeyBtb2RlbDogbW9kZWwsIGZpbHRlcjogd29ybGRJZCB9KVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocnVuSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5ydW5TZXJ2aWNlLmxvYWQocnVuSWQpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZS5jYWxsKHRoaXMsIHJ1biwgX3RoaXMucnVuU2VydmljZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5mYWlsKGR0ZC5yZWplY3QpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9O1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHsgcnVuOiB7fSwgd29ybGQ6IHt9IH07XG5cbiAgICAkLmV4dGVuZCh0cnVlLCB0aGlzLm9wdGlvbnMsIHRoaXMub3B0aW9ucy5ydW4pO1xuICAgICQuZXh0ZW5kKHRydWUsIHRoaXMub3B0aW9ucywgdGhpcy5vcHRpb25zLndvcmxkKTtcblxuICAgIHdvcmxkQXBpID0gbmV3IFdvcmxkQXBpKHRoaXMub3B0aW9ucyk7XG4gICAgdGhpcy5fYXV0aCA9IG5ldyBBdXRoTWFuYWdlcigpO1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB2YXIgYXBpID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgd29ybGQgKG9iamVjdCkgYW5kIGFuIGluc3RhbmNlIG9mIHRoZSBbV29ybGQgQVBJIEFkYXB0ZXJdKC4uL3dvcmxkLWFwaS1hZGFwdGVyLykuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgd01nci5nZXRDdXJyZW50V29ybGQoKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbih3b3JsZCwgd29ybGRBZGFwdGVyKSB7XG4gICAgICAgICogICAgICAgICAgICAgICBjb25zb2xlLmxvZyh3b3JsZC5pZCk7XG4gICAgICAgICogICAgICAgICAgICAgICB3b3JsZEFkYXB0ZXIuZ2V0Q3VycmVudFJ1bklkKCk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYHVzZXJJZGAgKE9wdGlvbmFsKSBUaGUgaWQgb2YgdGhlIHVzZXIgd2hvc2Ugd29ybGQgaXMgYmVpbmcgYWNjZXNzZWQuIERlZmF1bHRzIHRvIHRoZSB1c2VyIGluIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGBncm91cE5hbWVgIChPcHRpb25hbCkgVGhlIG5hbWUgb2YgdGhlIGdyb3VwIHdob3NlIHdvcmxkIGlzIGJlaW5nIGFjY2Vzc2VkLiBEZWZhdWx0cyB0byB0aGUgZ3JvdXAgZm9yIHRoZSB1c2VyIGluIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAgICAgICovXG4gICAgICAgIGdldEN1cnJlbnRXb3JsZDogZnVuY3Rpb24gKHVzZXJJZCwgZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuX2F1dGguZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbygpO1xuICAgICAgICAgICAgaWYgKCF1c2VySWQpIHtcbiAgICAgICAgICAgICAgICB1c2VySWQgPSBzZXNzaW9uLnVzZXJJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICAgICAgZ3JvdXBOYW1lID0gc2Vzc2lvbi5ncm91cE5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gd29ybGRBcGkuZ2V0Q3VycmVudFdvcmxkRm9yVXNlcih1c2VySWQsIGdyb3VwTmFtZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogUmV0dXJucyB0aGUgY3VycmVudCBydW4gKG9iamVjdCkgYW5kIGFuIGluc3RhbmNlIG9mIHRoZSBbUnVuIEFQSSBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKS5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICB3TWdyLmdldEN1cnJlbnRSdW4oe21vZGVsOiAnbXlNb2RlbC5weSd9KVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbihydW4sIHJ1blNlcnZpY2UpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJ1bi5pZCk7XG4gICAgICAgICogICAgICAgICAgICAgICBydW5TZXJ2aWNlLmRvKCdzdGFydEdhbWUnKTtcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgbW9kZWxgIChPcHRpb25hbCkgVGhlIG5hbWUgb2YgdGhlIG1vZGVsIGZpbGUuIFJlcXVpcmVkIGlmIG5vdCBhbHJlYWR5IHBhc3NlZCBpbiBhcyBgcnVuLm1vZGVsYCB3aGVuIHRoZSBXb3JsZCBNYW5hZ2VyIGlzIGNyZWF0ZWQuXG4gICAgICAgICovXG4gICAgICAgIGdldEN1cnJlbnRSdW46IGZ1bmN0aW9uIChtb2RlbCkge1xuICAgICAgICAgICAgdmFyIGR0ZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5fYXV0aC5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICAgICAgICB2YXIgY3VyVXNlcklkID0gc2Vzc2lvbi51c2VySWQ7XG4gICAgICAgICAgICB2YXIgY3VyR3JvdXBOYW1lID0gc2Vzc2lvbi5ncm91cE5hbWU7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldEFuZFJlc3RvcmVMYXRlc3RSdW4od29ybGQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXdvcmxkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkdGQucmVqZWN0KHsgZXJyb3I6ICdUaGUgdXNlciBpcyBub3QgcGFydCBvZiBhbnkgd29ybGQhJyB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudFdvcmxkSWQgPSB3b3JsZC5pZDtcbiAgICAgICAgICAgICAgICB2YXIgcnVuT3B0cyA9ICQuZXh0ZW5kKHRydWUsIF90aGlzLm9wdGlvbnMsIHsgbW9kZWw6IG1vZGVsIH0pO1xuICAgICAgICAgICAgICAgIHZhciBzdHJhdGVneSA9IGJ1aWxkU3RyYXRlZ3koY3VycmVudFdvcmxkSWQsIGR0ZCk7XG4gICAgICAgICAgICAgICAgdmFyIG9wdCA9ICQuZXh0ZW5kKHRydWUsIHt9LCB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmF0ZWd5OiBzdHJhdGVneSxcbiAgICAgICAgICAgICAgICAgICAgcnVuOiBydW5PcHRzXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdmFyIHJtID0gbmV3IFJ1bk1hbmFnZXIob3B0KTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBybS5nZXRSdW4oKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZShydW4sIHJtLnJ1blNlcnZpY2UsIHJtKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0Q3VycmVudFdvcmxkKGN1clVzZXJJZCwgY3VyR3JvdXBOYW1lKVxuICAgICAgICAgICAgICAgIC50aGVuKGdldEFuZFJlc3RvcmVMYXRlc3RSdW4pO1xuXG4gICAgICAgICAgICByZXR1cm4gZHRkLnByb21pc2UoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBhcGkpO1xufTtcbiIsIi8qKlxuICogIyNGaWxlIEFQSSBTZXJ2aWNlXG4gKlxuICogVGhpcyBpcyB1c2VkIHRvIHVwbG9hZC9kb3dubG9hZCBmaWxlcyBkaXJlY3RseSBvbnRvIEVwaWNlbnRlciwgYW5hbG9nb3VzIHRvIHVzaW5nIHRoZSBGaWxlIE1hbmFnZXIgVUkgaW4gRXBpY2VudGVyIGRpcmVjdGx5IG9yIFNGVFBpbmcgZmlsZXMgaW4uIFRoZSBBc3NldCBBUEkgaXMgdHlwaWNhbGx5IHVzZWQgZm9yIGFsbCBwcm9qZWN0IHVzZS1jYXNlcywgYW5kIGl0J3MgdW5saWtlbHkgdGhpcyBGaWxlIFNlcnZpY2Ugd2lsbCBiZSB1c2VkIGRpcmVjdGx5IGV4Y2VwdCBieSBBZG1pbiB0b29scyAoZS5nLiBGbG93IEluc3BlY3RvcikuXG4gKlxuICogUGFydGlhbGx5IGltcGxlbWVudGVkLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIFN0b3JhZ2VGYWN0b3J5ID0gcmVxdWlyZSgnLi4vc3RvcmUvc3RvcmUtZmFjdG9yeScpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAvLyBjb25maWcgfHwgKGNvbmZpZyA9IGNvbmZpZ1NlcnZpY2UuZ2V0KCkpO1xuICAgIHZhciBzdG9yZSA9IG5ldyBTdG9yYWdlRmFjdG9yeSh7IHN5bmNocm9ub3VzOiB0cnVlIH0pO1xuXG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRm9yIHByb2plY3RzIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZykuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgIHRva2VuOiBzdG9yZS5nZXQoJ2VwaWNlbnRlci5wcm9qZWN0LnRva2VuJykgfHwgc3RvcmUuZ2V0KCdlcGljZW50ZXIudG9rZW4nKSB8fCAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGFjY291bnQgaWQuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcHJvamVjdCBpZC4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcHJvamVjdDogJycsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucyB0byBwYXNzIG9uIHRvIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBsYXllci4gQWxsIGpxdWVyeS5hamF4IG9wdGlvbnMgYXQgaHR0cDovL2FwaS5qcXVlcnkuY29tL2pRdWVyeS5hamF4LyBhcmUgYXZhaWxhYmxlLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IHt9XG4gICAgfTtcblxuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLmFjY291bnQpIHtcbiAgICAgICAgdXJsQ29uZmlnLmFjY291bnRQYXRoID0gc2VydmljZU9wdGlvbnMuYWNjb3VudDtcbiAgICB9XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnByb2plY3QpIHtcbiAgICAgICAgdXJsQ29uZmlnLnByb2plY3RQYXRoID0gc2VydmljZU9wdGlvbnMucHJvamVjdDtcbiAgICB9XG5cbiAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoJ2ZpbGUnKVxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIGh0dHBPcHRpb25zLmhlYWRlcnMgPSB7XG4gICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkoaHR0cE9wdGlvbnMpO1xuXG4gICAgdmFyIHB1YmxpY0FzeW5jQVBJID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IGEgZGlyZWN0b3J5IGxpc3RpbmcsIG9yIGNvbnRlbnRzIG9mIGEgZmlsZVxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGBmaWxlUGF0aGAgICBQYXRoIHRvIHRoZSBmaWxlXG4gICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gYGZvbGRlclR5cGVgIE9uZSBvZiBNb2RlbHxTdGF0aWN8Tm9kZVxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0Q29udGVudHM6IGZ1bmN0aW9uIChmaWxlUGF0aCwgZm9sZGVyVHlwZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHBhdGggPSBmb2xkZXJUeXBlICsgJy8nICsgZmlsZVBhdGg7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKCdmaWxlJykgKyBwYXRoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldCgnJywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FzeW5jQVBJKTtcbn07XG4iLCIvKipcbiAqICMjQXNzZXQgQVBJIEFkYXB0ZXJcbiAqXG4gKiBUaGUgQXNzZXQgQVBJIEFkYXB0ZXIgYWxsb3dzIHlvdSB0byBzdG9yZSBhc3NldHMgLS0gcmVzb3VyY2VzIG9yIGZpbGVzIG9mIGFueSBraW5kIC0tIHVzZWQgYnkgYSBwcm9qZWN0IHdpdGggYSBzY29wZSB0aGF0IGlzIHNwZWNpZmljIHRvIHByb2plY3QsIGdyb3VwLCBvciBlbmQgdXNlci5cbiAqXG4gKiBBc3NldHMgYXJlIHVzZWQgd2l0aCBbdGVhbSBwcm9qZWN0c10oLi4vLi4vLi4vcHJvamVjdF9hZG1pbi8jdGVhbSkuIE9uZSBjb21tb24gdXNlIGNhc2UgaXMgaGF2aW5nIGVuZCB1c2VycyBpbiBhIFtncm91cF0oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3Vwcykgb3IgaW4gYSBbbXVsdGlwbGF5ZXIgd29ybGRdKC4uLy4uLy4uL2dsb3NzYXJ5LyN3b3JsZCkgdXBsb2FkIGRhdGEgLS0gdmlkZW9zIGNyZWF0ZWQgZHVyaW5nIGdhbWUgcGxheSwgcHJvZmlsZSBwaWN0dXJlcyBmb3IgY3VzdG9taXppbmcgdGhlaXIgZXhwZXJpZW5jZSwgZXRjLiAtLSBhcyBwYXJ0IG9mIHBsYXlpbmcgdGhyb3VnaCB0aGUgcHJvamVjdC5cbiAqXG4gKiBSZXNvdXJjZXMgY3JlYXRlZCB1c2luZyB0aGUgQXNzZXQgQWRhcHRlciBhcmUgc2NvcGVkOlxuICpcbiAqICAqIFByb2plY3QgYXNzZXRzIGFyZSB3cml0YWJsZSBvbmx5IGJ5IFt0ZWFtIG1lbWJlcnNdKC4uLy4uLy4uL2dsb3NzYXJ5LyN0ZWFtKSwgdGhhdCBpcywgRXBpY2VudGVyIGF1dGhvcnMuXG4gKiAgKiBHcm91cCBhc3NldHMgYXJlIHdyaXRhYmxlIGJ5IGFueW9uZSB3aXRoIGFjY2VzcyB0byB0aGUgcHJvamVjdCB0aGF0IGlzIHBhcnQgb2YgdGhhdCBwYXJ0aWN1bGFyIFtncm91cF0oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3VwcykuIFRoaXMgaW5jbHVkZXMgYWxsIFt0ZWFtIG1lbWJlcnNdKC4uLy4uLy4uL2dsb3NzYXJ5LyN0ZWFtKSAoRXBpY2VudGVyIGF1dGhvcnMpIGFuZCBhbnkgW2VuZCB1c2Vyc10oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKSB3aG8gYXJlIG1lbWJlcnMgb2YgdGhlIGdyb3VwIC0tIGJvdGggZmFjaWxpdGF0b3JzIGFuZCBzdGFuZGFyZCBlbmQgdXNlcnMuXG4gKiAgKiBVc2VyIGFzc2V0cyBhcmUgd3JpdGFibGUgYnkgdGhlIHNwZWNpZmljIGVuZCB1c2VyLCBhbmQgYnkgdGhlIGZhY2lsaXRhdG9yIG9mIHRoZSBncm91cC5cbiAqICAqIEFsbCBhc3NldHMgYXJlIHJlYWRhYmxlIGJ5IGFueW9uZSB3aXRoIHRoZSBleGFjdCBVUkkuXG4gKlxuICogVG8gdXNlIHRoZSBBc3NldCBBZGFwdGVyLCBpbnN0YW50aWF0ZSBpdCBhbmQgdGhlbiBhY2Nlc3MgdGhlIG1ldGhvZHMgcHJvdmlkZWQuIEluc3RhbnRpYXRpbmcgcmVxdWlyZXMgdGhlIGFjY291bnQgaWQgKCoqVGVhbSBJRCoqIGluIHRoZSBFcGljZW50ZXIgdXNlciBpbnRlcmZhY2UpIGFuZCBwcm9qZWN0IGlkICgqKlByb2plY3QgSUQqKikuIFRoZSBncm91cCBuYW1lIGlzIHJlcXVpcmVkIGZvciBhc3NldHMgd2l0aCBhIGdyb3VwIHNjb3BlLCBhbmQgdGhlIGdyb3VwIG5hbWUgYW5kIHVzZXJJZCBhcmUgcmVxdWlyZWQgZm9yIGFzc2V0cyB3aXRoIGEgdXNlciBzY29wZS4gSWYgbm90IGluY2x1ZGVkLCB0aGV5IGFyZSB0YWtlbiBmcm9tIHRoZSBsb2dnZWQgaW4gdXNlcidzIHNlc3Npb24gaW5mb3JtYXRpb24gaWYgbmVlZGVkLlxuICpcbiAqIFdoZW4gY3JlYXRpbmcgYW4gYXNzZXQsIHlvdSBjYW4gcGFzcyBpbiB0ZXh0IChlbmNvZGVkIGRhdGEpIHRvIHRoZSBgY3JlYXRlKClgIGNhbGwuIEFsdGVybmF0aXZlbHksIHlvdSBjYW4gbWFrZSB0aGUgYGNyZWF0ZSgpYCBjYWxsIGFzIHBhcnQgb2YgYW4gSFRNTCBmb3JtIGFuZCBwYXNzIGluIGEgZmlsZSB1cGxvYWRlZCB2aWEgdGhlIGZvcm0uXG4gKlxuICogICAgICAgLy8gaW5zdGFudGlhdGUgdGhlIEFzc2V0IEFkYXB0ZXJcbiAqICAgICAgIHZhciBhYSA9IG5ldyBGLnNlcnZpY2UuQXNzZXQoe1xuICogICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICogICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAqICAgICAgICAgIGdyb3VwOiAndGVhbTEnLFxuICogICAgICAgICAgdXNlcklkOiAnMTIzNDUnXG4gKiAgICAgICB9KTtcbiAqXG4gKiAgICAgICAvLyBjcmVhdGUgYSBuZXcgYXNzZXQgdXNpbmcgZW5jb2RlZCB0ZXh0XG4gKiAgICAgICBhYS5jcmVhdGUoJ3Rlc3QudHh0Jywge1xuICogICAgICAgICAgIGVuY29kaW5nOiAnQkFTRV82NCcsXG4gKiAgICAgICAgICAgZGF0YTogJ1ZHaHBjeUJwY3lCaElIUmxjM1FnWm1sc1pTND0nLFxuICogICAgICAgICAgIGNvbnRlbnRUeXBlOiAndGV4dC9wbGFpbidcbiAqICAgICAgIH0sIHsgc2NvcGU6ICd1c2VyJyB9KTtcbiAqXG4gKiAgICAgICAvLyBhbHRlcm5hdGl2ZWx5LCBjcmVhdGUgYSBuZXcgYXNzZXQgdXNpbmcgYSBmaWxlIHVwbG9hZGVkIHRocm91Z2ggYSBmb3JtXG4gKiAgICAgICAvLyB0aGlzIHNhbXBsZSBjb2RlIGdvZXMgd2l0aCBhbiBodG1sIGZvcm0gdGhhdCBsb29rcyBsaWtlIHRoaXM6XG4gKiAgICAgICAvL1xuICogICAgICAgLy8gPGZvcm0gaWQ9XCJ1cGxvYWQtZmlsZVwiPlxuICogICAgICAgLy8gICA8aW5wdXQgaWQ9XCJmaWxlXCIgdHlwZT1cImZpbGVcIj5cbiAqICAgICAgIC8vICAgPGlucHV0IGlkPVwiZmlsZW5hbWVcIiB0eXBlPVwidGV4dFwiIHZhbHVlPVwibXlGaWxlLnR4dFwiPlxuICogICAgICAgLy8gICA8YnV0dG9uIHR5cGU9XCJzdWJtaXRcIj5VcGxvYWQgbXlGaWxlPC9idXR0b24+XG4gKiAgICAgICAvLyA8L2Zvcm0+XG4gKiAgICAgICAvL1xuICogICAgICAgJCgnI3VwbG9hZC1maWxlJykub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uIChlKSB7XG4gKiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gKiAgICAgICAgICB2YXIgZmlsZW5hbWUgPSAkKCcjZmlsZW5hbWUnKS52YWwoKTtcbiAqICAgICAgICAgIHZhciBkYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gKiAgICAgICAgICB2YXIgaW5wdXRDb250cm9sID0gJCgnI2ZpbGUnKVswXTtcbiAqICAgICAgICAgIGRhdGEuYXBwZW5kKCdmaWxlJywgaW5wdXRDb250cm9sLmZpbGVzWzBdLCBmaWxlbmFtZSk7XG4gKlxuICogICAgICAgICAgYWEuY3JlYXRlKGZpbGVuYW1lLCBkYXRhLCB7IHNjb3BlOiAndXNlcicgfSk7XG4gKiAgICAgICB9KTtcbiAqXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgU3RvcmFnZUZhY3RvcnkgPSByZXF1aXJlKCcuLi9zdG9yZS9zdG9yZS1mYWN0b3J5Jyk7XG4vLyB2YXIgcXV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3F1ZXJ5LXV0aWwnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbnZhciBfcGljayA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0LXV0aWwnKS5fcGljaztcbnZhciBrZXlOYW1lcyA9IHJlcXVpcmUoJy4uL21hbmFnZXJzL2tleS1uYW1lcycpO1xuXG52YXIgYXBpRW5kcG9pbnQgPSAnYXNzZXQnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgc3RvcmUgPSBuZXcgU3RvcmFnZUZhY3RvcnkoeyBzeW5jaHJvbm91czogdHJ1ZSB9KTtcbiAgICB2YXIgc2Vzc2lvbiA9IEpTT04ucGFyc2Uoc3RvcmUuZ2V0KGtleU5hbWVzLkVQSV9TRVNTSU9OX0tFWSkgfHwgJ3t9Jyk7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRm9yIHByb2plY3RzIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZykuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdG9rZW46IHN0b3JlLmdldChrZXlOYW1lcy5FUElfQ09PS0lFX0tFWSkgfHwgJycsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWNjb3VudCBpZC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKS4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6IHVuZGVmaW5lZCxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBwcm9qZWN0IGlkLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgVVJMLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcHJvamVjdDogdW5kZWZpbmVkLFxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGdyb3VwIG5hbWUuIERlZmF1bHRzIHRvIHNlc3Npb24ncyBgZ3JvdXBOYW1lYC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGdyb3VwOiBzZXNzaW9uLmdyb3VwTmFtZSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSB1c2VyIGlkLiBEZWZhdWx0cyB0byBzZXNzaW9uJ3MgYHVzZXJJZGAuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB1c2VySWQ6IHNlc3Npb24udXNlcklkLFxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHNjb3BlIGZvciB0aGUgYXNzZXQuIFZhbGlkIHZhbHVlcyBhcmU6IGB1c2VyYCwgYGdyb3VwYCwgYW5kIGBwcm9qZWN0YC4gU2VlIGFib3ZlIGZvciB0aGUgcmVxdWlyZWQgcGVybWlzc2lvbnMgdG8gd3JpdGUgdG8gZWFjaCBzY29wZS4gRGVmYXVsdHMgdG8gYHVzZXJgLCBtZWFuaW5nIHRoZSBjdXJyZW50IGVuZCB1c2VyIG9yIGEgZmFjaWxpdGF0b3IgaW4gdGhlIGVuZCB1c2VyJ3MgZ3JvdXAgY2FuIGVkaXQgdGhlIGFzc2V0LlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgc2NvcGU6ICd1c2VyJyxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERldGVybWluZXMgaWYgYSByZXF1ZXN0IHRvIGxpc3QgdGhlIGFzc2V0cyBpbiBhIHNjb3BlIGluY2x1ZGVzIHRoZSBjb21wbGV0ZSBVUkwgZm9yIGVhY2ggYXNzZXQgKGB0cnVlYCksIG9yIG9ubHkgdGhlIGZpbGUgbmFtZXMgb2YgdGhlIGFzc2V0cyAoYGZhbHNlYCkuIERlZmF1bHRzIHRvIGB0cnVlYC5cbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBmdWxsVXJsOiB0cnVlLFxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHRyYW5zcG9ydCBvYmplY3QgY29udGFpbnMgdGhlIG9wdGlvbnMgcGFzc2VkIHRvIHRoZSBYSFIgcmVxdWVzdC5cbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRyYW5zcG9ydDoge1xuICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlXG4gICAgICAgIH1cbiAgICB9O1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgY29uZmlnKTtcbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG5cbiAgICBpZiAoIXNlcnZpY2VPcHRpb25zLmFjY291bnQpIHtcbiAgICAgICAgc2VydmljZU9wdGlvbnMuYWNjb3VudCA9IHVybENvbmZpZy5hY2NvdW50UGF0aDtcbiAgICB9XG5cbiAgICBpZiAoIXNlcnZpY2VPcHRpb25zLnByb2plY3QpIHtcbiAgICAgICAgc2VydmljZU9wdGlvbnMucHJvamVjdCA9IHVybENvbmZpZy5wcm9qZWN0UGF0aDtcbiAgICB9XG5cbiAgICB2YXIgdHJhbnNwb3J0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludClcbiAgICB9KTtcblxuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy50b2tlbikge1xuICAgICAgICB0cmFuc3BvcnRPcHRpb25zLmhlYWRlcnMgPSB7XG4gICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zKTtcblxuICAgIHZhciBhc3NldEFwaVBhcmFtcyA9IFsnZW5jb2RpbmcnLCAnZGF0YScsICdjb250ZW50VHlwZSddO1xuICAgIHZhciBzY29wZUNvbmZpZyA9IHtcbiAgICAgICAgdXNlcjogWydzY29wZScsICdhY2NvdW50JywgJ3Byb2plY3QnLCAnZ3JvdXAnLCAndXNlcklkJ10sXG4gICAgICAgIGdyb3VwOiBbJ3Njb3BlJywgJ2FjY291bnQnLCAncHJvamVjdCcsICdncm91cCddLFxuICAgICAgICBwcm9qZWN0OiBbJ3Njb3BlJywgJ2FjY291bnQnLCAncHJvamVjdCddLFxuICAgIH07XG5cbiAgICB2YXIgdmFsaWRhdGVGaWxlbmFtZSA9IGZ1bmN0aW9uIChmaWxlbmFtZSkge1xuICAgICAgICBpZiAoIWZpbGVuYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ZpbGVuYW1lIGlzIG5lZWRlZC4nKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgdmFsaWRhdGVVcmxQYXJhbXMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgcGFydEtleXMgPSBzY29wZUNvbmZpZ1tvcHRpb25zLnNjb3BlXTtcbiAgICAgICAgaWYgKCFwYXJ0S2V5cykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzY29wZSBwYXJhbWV0ZXIgaXMgbmVlZGVkLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgJC5lYWNoKHBhcnRLZXlzLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIW9wdGlvbnNbdGhpc10pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IodGhpcyArICcgcGFyYW1ldGVyIGlzIG5lZWRlZC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBidWlsZFVybCA9IGZ1bmN0aW9uIChmaWxlbmFtZSwgb3B0aW9ucykge1xuICAgICAgICB2YWxpZGF0ZVVybFBhcmFtcyhvcHRpb25zKTtcbiAgICAgICAgdmFyIHBhcnRLZXlzID0gc2NvcGVDb25maWdbb3B0aW9ucy5zY29wZV07XG4gICAgICAgIHZhciBwYXJ0cyA9ICQubWFwKHBhcnRLZXlzLCBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9uc1trZXldO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGZpbGVuYW1lKSB7XG4gICAgICAgICAgICAvLyBUaGlzIHByZXZlbnRzIGFkZGluZyBhIHRyYWlsaW5nIC8gaW4gdGhlIFVSTCBhcyB0aGUgQXNzZXQgQVBJXG4gICAgICAgICAgICAvLyBkb2VzIG5vdCB3b3JrIGNvcnJlY3RseSB3aXRoIGl0XG4gICAgICAgICAgICBmaWxlbmFtZSA9ICcvJyArIGZpbGVuYW1lO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBwYXJ0cy5qb2luKCcvJykgKyBmaWxlbmFtZTtcbiAgICB9O1xuXG4gICAgLy8gUHJpdmF0ZSBmdW5jdGlvbiwgYWxsIHJlcXVlc3RzIGZvbGxvdyBhIG1vcmUgb3IgbGVzcyBzYW1lIGFwcHJvYWNoIHRvXG4gICAgLy8gdXNlIHRoZSBBc3NldCBBUEkgYW5kIHRoZSBkaWZmZXJlbmNlIGlzIHRoZSBIVFRQIHZlcmJcbiAgICAvL1xuICAgIC8vIEBwYXJhbSB7c3RyaW5nfSBgbWV0aG9kYCAoUmVxdWlyZWQpIEhUVFAgdmVyYlxuICAgIC8vIEBwYXJhbSB7c3RyaW5nfSBgZmlsZW5hbWVgIChSZXF1aXJlZCkgTmFtZSBvZiB0aGUgZmlsZSB0byBkZWxldGUvcmVwbGFjZS9jcmVhdGVcbiAgICAvLyBAcGFyYW0ge29iamVjdH0gYHBhcmFtc2AgKE9wdGlvbmFsKSBCb2R5IHBhcmFtZXRlcnMgdG8gc2VuZCB0byB0aGUgQXNzZXQgQVBJXG4gICAgLy8gQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgIHZhciB1cGxvYWQgPSBmdW5jdGlvbiAobWV0aG9kLCBmaWxlbmFtZSwgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgIHZhbGlkYXRlRmlsZW5hbWUoZmlsZW5hbWUpO1xuICAgICAgICAvLyBtYWtlIHN1cmUgdGhlIHBhcmFtZXRlciBpcyBjbGVhblxuICAgICAgICBtZXRob2QgPSBtZXRob2QudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgdmFyIGNvbnRlbnRUeXBlID0gcGFyYW1zIGluc3RhbmNlb2YgRm9ybURhdGEgPT09IHRydWUgPyBmYWxzZSA6ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgaWYgKGNvbnRlbnRUeXBlID09PSAnYXBwbGljYXRpb24vanNvbicpIHtcbiAgICAgICAgICAgIC8vIHdoaXRlbGlzdCB0aGUgZmllbGRzIHRoYXQgd2UgYWN0dWFsbHkgY2FuIHNlbmQgdG8gdGhlIGFwaVxuICAgICAgICAgICAgcGFyYW1zID0gX3BpY2socGFyYW1zLCBhc3NldEFwaVBhcmFtcyk7XG4gICAgICAgIH0gZWxzZSB7IC8vIGVsc2Ugd2UncmUgc2VuZGluZyBmb3JtIGRhdGEgd2hpY2ggZ29lcyBkaXJlY3RseSBpbiByZXF1ZXN0IGJvZHlcbiAgICAgICAgICAgIC8vIEZvciBtdWx0aXBhcnQvZm9ybS1kYXRhIHVwbG9hZHMgdGhlIGZpbGVuYW1lIGlzIG5vdCBzZXQgaW4gdGhlIFVSTCxcbiAgICAgICAgICAgIC8vIGl0J3MgZ2V0dGluZyBwaWNrZWQgYnkgdGhlIEZvcm1EYXRhIGZpZWxkIGZpbGVuYW1lLlxuICAgICAgICAgICAgZmlsZW5hbWUgPSBtZXRob2QgPT09ICdwb3N0JyB8fCBtZXRob2QgPT09ICdwdXQnID8gJycgOiBmaWxlbmFtZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdXJsT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgIHZhciB1cmwgPSBidWlsZFVybChmaWxlbmFtZSwgdXJsT3B0aW9ucyk7XG4gICAgICAgIHZhciBjcmVhdGVPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHVybE9wdGlvbnMsIHsgdXJsOiB1cmwsIGNvbnRlbnRUeXBlOiBjb250ZW50VHlwZSB9KTtcblxuICAgICAgICByZXR1cm4gaHR0cFttZXRob2RdKHBhcmFtcywgY3JlYXRlT3B0aW9ucyk7XG4gICAgfTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIENyZWF0ZXMgYSBmaWxlIGluIHRoZSBBc3NldCBBUEkuIFRoZSBzZXJ2ZXIgcmV0dXJucyBhbiBlcnJvciAoc3RhdHVzIGNvZGUgYDQwOWAsIGNvbmZsaWN0KSBpZiB0aGUgZmlsZSBhbHJlYWR5IGV4aXN0cywgc29cbiAgICAgICAgKiBjaGVjayBmaXJzdCB3aXRoIGEgYGxpc3QoKWAgb3IgYSBgZ2V0KClgLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICB2YXIgYWEgPSBuZXcgRi5zZXJ2aWNlLkFzc2V0KHtcbiAgICAgICAgKiAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICBncm91cDogJ3RlYW0xJyxcbiAgICAgICAgKiAgICAgICAgICB1c2VySWQ6ICcnXG4gICAgICAgICogICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICAvLyBjcmVhdGUgYSBuZXcgYXNzZXQgdXNpbmcgZW5jb2RlZCB0ZXh0XG4gICAgICAgICogICAgICAgYWEuY3JlYXRlKCd0ZXN0LnR4dCcsIHtcbiAgICAgICAgKiAgICAgICAgICAgZW5jb2Rpbmc6ICdCQVNFXzY0JyxcbiAgICAgICAgKiAgICAgICAgICAgZGF0YTogJ1ZHaHBjeUJwY3lCaElIUmxjM1FnWm1sc1pTND0nLFxuICAgICAgICAqICAgICAgICAgICBjb250ZW50VHlwZTogJ3RleHQvcGxhaW4nXG4gICAgICAgICogICAgICAgfSwgeyBzY29wZTogJ3VzZXInIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICAgLy8gYWx0ZXJuYXRpdmVseSwgY3JlYXRlIGEgbmV3IGFzc2V0IHVzaW5nIGEgZmlsZSB1cGxvYWRlZCB0aHJvdWdoIGEgZm9ybVxuICAgICAgICAqICAgICAgIC8vIHRoaXMgc2FtcGxlIGNvZGUgZ29lcyB3aXRoIGFuIGh0bWwgZm9ybSB0aGF0IGxvb2tzIGxpa2UgdGhpczpcbiAgICAgICAgKiAgICAgICAvL1xuICAgICAgICAqICAgICAgIC8vIDxmb3JtIGlkPVwidXBsb2FkLWZpbGVcIj5cbiAgICAgICAgKiAgICAgICAvLyAgIDxpbnB1dCBpZD1cImZpbGVcIiB0eXBlPVwiZmlsZVwiPlxuICAgICAgICAqICAgICAgIC8vICAgPGlucHV0IGlkPVwiZmlsZW5hbWVcIiB0eXBlPVwidGV4dFwiIHZhbHVlPVwibXlGaWxlLnR4dFwiPlxuICAgICAgICAqICAgICAgIC8vICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCI+VXBsb2FkIG15RmlsZTwvYnV0dG9uPlxuICAgICAgICAqICAgICAgIC8vIDwvZm9ybT5cbiAgICAgICAgKiAgICAgICAvL1xuICAgICAgICAqICAgICAgICQoJyN1cGxvYWQtZmlsZScpLm9uKCdzdWJtaXQnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAqICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgKiAgICAgICAgICB2YXIgZmlsZW5hbWUgPSAkKCcjZmlsZW5hbWUnKS52YWwoKTtcbiAgICAgICAgKiAgICAgICAgICB2YXIgZGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICAqICAgICAgICAgIHZhciBpbnB1dENvbnRyb2wgPSAkKCcjZmlsZScpWzBdO1xuICAgICAgICAqICAgICAgICAgIGRhdGEuYXBwZW5kKCdmaWxlJywgaW5wdXRDb250cm9sLmZpbGVzWzBdLCBmaWxlbmFtZSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICAgICBhYS5jcmVhdGUoZmlsZW5hbWUsIGRhdGEsIHsgc2NvcGU6ICd1c2VyJyB9KTtcbiAgICAgICAgKiAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGBmaWxlbmFtZWAgKFJlcXVpcmVkKSBOYW1lIG9mIHRoZSBmaWxlIHRvIGNyZWF0ZS5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYHBhcmFtc2AgKE9wdGlvbmFsKSBCb2R5IHBhcmFtZXRlcnMgdG8gc2VuZCB0byB0aGUgQXNzZXQgQVBJLiBSZXF1aXJlZCBpZiB0aGUgYG9wdGlvbnMudHJhbnNwb3J0LmNvbnRlbnRUeXBlYCBpcyBgYXBwbGljYXRpb24vanNvbmAsIG90aGVyd2lzZSBpZ25vcmVkLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgcGFyYW1zLmVuY29kaW5nYCBFaXRoZXIgYEhFWGAgb3IgYEJBU0VfNjRgLiBSZXF1aXJlZCBpZiBgb3B0aW9ucy50cmFuc3BvcnQuY29udGVudFR5cGVgIGlzIGBhcHBsaWNhdGlvbi9qc29uYC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYHBhcmFtcy5kYXRhYCBUaGUgZW5jb2RlZCBkYXRhIGZvciB0aGUgZmlsZS4gUmVxdWlyZWQgaWYgYG9wdGlvbnMudHJhbnNwb3J0LmNvbnRlbnRUeXBlYCBpcyBgYXBwbGljYXRpb24vanNvbmAuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGBwYXJhbXMuY29udGVudFR5cGVgIFRoZSBtaW1lIHR5cGUgb2YgdGhlIGZpbGUuIE9wdGlvbmFsLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKlxuICAgICAgICAqL1xuICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uIChmaWxlbmFtZSwgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gdXBsb2FkKCdwb3N0JywgZmlsZW5hbWUsIHBhcmFtcywgb3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogR2V0cyBhIGZpbGUgZnJvbSB0aGUgQXNzZXQgQVBJLCBmZXRjaGluZyB0aGUgYXNzZXQgY29udGVudC4gKFRvIGdldCBhIGxpc3RcbiAgICAgICAgKiBvZiB0aGUgYXNzZXRzIGluIGEgc2NvcGUsIHVzZSBgbGlzdCgpYC4pXG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYGZpbGVuYW1lYCAoUmVxdWlyZWQpIE5hbWUgb2YgdGhlIGZpbGUgdG8gcmV0cmlldmUuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqXG4gICAgICAgICovXG4gICAgICAgIGdldDogZnVuY3Rpb24gKGZpbGVuYW1lLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgZ2V0U2VydmljZU9wdGlvbnMgPSBfcGljayhzZXJ2aWNlT3B0aW9ucywgWydzY29wZScsICdhY2NvdW50JywgJ3Byb2plY3QnLCAnZ3JvdXAnLCAndXNlcklkJ10pO1xuICAgICAgICAgICAgdmFyIHVybE9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZ2V0U2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIHVybCA9IGJ1aWxkVXJsKGZpbGVuYW1lLCB1cmxPcHRpb25zKTtcbiAgICAgICAgICAgIHZhciBnZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHVybE9wdGlvbnMsIHsgdXJsOiB1cmwgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldCh7fSwgZ2V0T3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogR2V0cyB0aGUgbGlzdCBvZiB0aGUgYXNzZXRzIGluIGEgc2NvcGUuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgYWEubGlzdCh7IGZ1bGxVcmw6IHRydWUgfSkudGhlbihmdW5jdGlvbihmaWxlTGlzdCl7XG4gICAgICAgICogICAgICAgICAgIGNvbnNvbGUubG9nKCdhcnJheSBvZiBmaWxlcyA9ICcsIGZpbGVMaXN0KTtcbiAgICAgICAgKiAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYG9wdGlvbnMuc2NvcGVgIChPcHRpb25hbCkgVGhlIHNjb3BlIChgdXNlcmAsIGBncm91cGAsIGBwcm9qZWN0YCkuXG4gICAgICAgICogQHBhcmFtIHtib29sZWFufSBgb3B0aW9ucy5mdWxsVXJsYCAoT3B0aW9uYWwpIERldGVybWluZXMgaWYgdGhlIGxpc3Qgb2YgYXNzZXRzIGluIGEgc2NvcGUgaW5jbHVkZXMgdGhlIGNvbXBsZXRlIFVSTCBmb3IgZWFjaCBhc3NldCAoYHRydWVgKSwgb3Igb25seSB0aGUgZmlsZSBuYW1lcyBvZiB0aGUgYXNzZXRzIChgZmFsc2VgKS5cbiAgICAgICAgKlxuICAgICAgICAqL1xuICAgICAgICBsaXN0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGR0ZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgdXJsT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgdXJsID0gYnVpbGRVcmwoJycsIHVybE9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIGdldE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdXJsT3B0aW9ucywgeyB1cmw6IHVybCB9KTtcbiAgICAgICAgICAgIHZhciBmdWxsVXJsID0gZ2V0T3B0aW9ucy5mdWxsVXJsO1xuXG4gICAgICAgICAgICBpZiAoIWZ1bGxVcmwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoe30sIGdldE9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBodHRwLmdldCh7fSwgZ2V0T3B0aW9ucylcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoZmlsZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZ1bGxQYXRoRmlsZXMgPSAkLm1hcChmaWxlcywgZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBidWlsZFVybChmaWxlLCB1cmxPcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlKGZ1bGxQYXRoRmlsZXMsIG1lKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5mYWlsKGR0ZC5yZWplY3QpO1xuXG4gICAgICAgICAgICByZXR1cm4gZHRkLnByb21pc2UoKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBSZXBsYWNlcyBhbiBleGlzdGluZyBmaWxlIGluIHRoZSBBc3NldCBBUEkuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgLy8gcmVwbGFjZSBhbiBhc3NldCB1c2luZyBlbmNvZGVkIHRleHRcbiAgICAgICAgKiAgICAgICBhYS5yZXBsYWNlKCd0ZXN0LnR4dCcsIHtcbiAgICAgICAgKiAgICAgICAgICAgZW5jb2Rpbmc6ICdCQVNFXzY0JyxcbiAgICAgICAgKiAgICAgICAgICAgZGF0YTogJ1ZHaHBjeUJwY3lCaElITmxZMjl1WkNCMFpYTjBJR1pwYkdVdScsXG4gICAgICAgICogICAgICAgICAgIGNvbnRlbnRUeXBlOiAndGV4dC9wbGFpbidcbiAgICAgICAgKiAgICAgICB9LCB7IHNjb3BlOiAndXNlcicgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICAvLyBhbHRlcm5hdGl2ZWx5LCByZXBsYWNlIGFuIGFzc2V0IHVzaW5nIGEgZmlsZSB1cGxvYWRlZCB0aHJvdWdoIGEgZm9ybVxuICAgICAgICAqICAgICAgIC8vIHRoaXMgc2FtcGxlIGNvZGUgZ29lcyB3aXRoIGFuIGh0bWwgZm9ybSB0aGF0IGxvb2tzIGxpa2UgdGhpczpcbiAgICAgICAgKiAgICAgICAvL1xuICAgICAgICAqICAgICAgIC8vIDxmb3JtIGlkPVwicmVwbGFjZS1maWxlXCI+XG4gICAgICAgICogICAgICAgLy8gICA8aW5wdXQgaWQ9XCJmaWxlXCIgdHlwZT1cImZpbGVcIj5cbiAgICAgICAgKiAgICAgICAvLyAgIDxpbnB1dCBpZD1cInJlcGxhY2UtZmlsZW5hbWVcIiB0eXBlPVwidGV4dFwiIHZhbHVlPVwibXlGaWxlLnR4dFwiPlxuICAgICAgICAqICAgICAgIC8vICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCI+UmVwbGFjZSBteUZpbGU8L2J1dHRvbj5cbiAgICAgICAgKiAgICAgICAvLyA8L2Zvcm0+XG4gICAgICAgICogICAgICAgLy9cbiAgICAgICAgKiAgICAgICAkKCcjcmVwbGFjZS1maWxlJykub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICogICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAqICAgICAgICAgIHZhciBmaWxlbmFtZSA9ICQoJyNyZXBsYWNlLWZpbGVuYW1lJykudmFsKCk7XG4gICAgICAgICogICAgICAgICAgdmFyIGRhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgICAgKiAgICAgICAgICB2YXIgaW5wdXRDb250cm9sID0gJCgnI2ZpbGUnKVswXTtcbiAgICAgICAgKiAgICAgICAgICBkYXRhLmFwcGVuZCgnZmlsZScsIGlucHV0Q29udHJvbC5maWxlc1swXSwgZmlsZW5hbWUpO1xuICAgICAgICAqXG4gICAgICAgICogICAgICAgICAgYWEucmVwbGFjZShmaWxlbmFtZSwgZGF0YSwgeyBzY29wZTogJ3VzZXInIH0pO1xuICAgICAgICAqICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGBmaWxlbmFtZWAgKFJlcXVpcmVkKSBOYW1lIG9mIHRoZSBmaWxlIGJlaW5nIHJlcGxhY2VkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgcGFyYW1zYCAoT3B0aW9uYWwpIEJvZHkgcGFyYW1ldGVycyB0byBzZW5kIHRvIHRoZSBBc3NldCBBUEkuIFJlcXVpcmVkIGlmIHRoZSBgb3B0aW9ucy50cmFuc3BvcnQuY29udGVudFR5cGVgIGlzIGBhcHBsaWNhdGlvbi9qc29uYCwgb3RoZXJ3aXNlIGlnbm9yZWQuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGBwYXJhbXMuZW5jb2RpbmdgIEVpdGhlciBgSEVYYCBvciBgQkFTRV82NGAuIFJlcXVpcmVkIGlmIGBvcHRpb25zLnRyYW5zcG9ydC5jb250ZW50VHlwZWAgaXMgYGFwcGxpY2F0aW9uL2pzb25gLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgcGFyYW1zLmRhdGFgIFRoZSBlbmNvZGVkIGRhdGEgZm9yIHRoZSBmaWxlLiBSZXF1aXJlZCBpZiBgb3B0aW9ucy50cmFuc3BvcnQuY29udGVudFR5cGVgIGlzIGBhcHBsaWNhdGlvbi9qc29uYC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYHBhcmFtcy5jb250ZW50VHlwZWAgVGhlIG1pbWUgdHlwZSBvZiB0aGUgZmlsZS4gT3B0aW9uYWwuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqXG4gICAgICAgICovXG4gICAgICAgIHJlcGxhY2U6IGZ1bmN0aW9uIChmaWxlbmFtZSwgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gdXBsb2FkKCdwdXQnLCBmaWxlbmFtZSwgcGFyYW1zLCBvcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBEZWxldGVzIGEgZmlsZSBmcm9tIHRoZSBBc3NldCBBUEkuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgYWEuZGVsZXRlKHNhbXBsZUZpbGVOYW1lKTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgZmlsZW5hbWVgIChSZXF1aXJlZCkgTmFtZSBvZiB0aGUgZmlsZSB0byBkZWxldGUuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqXG4gICAgICAgICovXG4gICAgICAgIGRlbGV0ZTogZnVuY3Rpb24gKGZpbGVuYW1lLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gdXBsb2FkKCdkZWxldGUnLCBmaWxlbmFtZSwge30sIG9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFzc2V0VXJsOiBmdW5jdGlvbiAoZmlsZW5hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciB1cmxPcHRpb25zID0gJC5leHRlbmQoe30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBidWlsZFVybChmaWxlbmFtZSwgdXJsT3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiLyoqXG4gKlxuICogIyNBdXRoZW50aWNhdGlvbiBBUEkgU2VydmljZVxuICpcbiAqIFRoZSBBdXRoZW50aWNhdGlvbiBBUEkgU2VydmljZSBwcm92aWRlcyBtZXRob2RzIGZvciBsb2dnaW5nIGluIGFuZCBsb2dnaW5nIG91dC4gT24gbG9naW4sIHRoaXMgc2VydmljZSBjcmVhdGVzIGFuZCByZXR1cm5zIGEgdXNlciBhY2Nlc3MgdG9rZW4uXG4gKlxuICogVXNlciBhY2Nlc3MgdG9rZW5zIGFyZSByZXF1aXJlZCBmb3IgZWFjaCBjYWxsIHRvIEVwaWNlbnRlci4gKFNlZSBbUHJvamVjdCBBY2Nlc3NdKC4uLy4uLy4uL3Byb2plY3RfYWNjZXNzLykgZm9yIG1vcmUgaW5mb3JtYXRpb24uKVxuICpcbiAqIElmIHlvdSBuZWVkIGFkZGl0aW9uYWwgZnVuY3Rpb25hbGl0eSAtLSBzdWNoIGFzIHRyYWNraW5nIHNlc3Npb24gaW5mb3JtYXRpb24sIGVhc2lseSByZXRyaWV2aW5nIHRoZSB1c2VyIHRva2VuLCBvciBnZXR0aW5nIHRoZSBncm91cHMgdG8gd2hpY2ggYW4gZW5kIHVzZXIgYmVsb25ncyAtLSBjb25zaWRlciB1c2luZyB0aGUgW0F1dGhvcml6YXRpb24gTWFuYWdlcl0oLi4vYXV0aC1tYW5hZ2VyLykgaW5zdGVhZC5cbiAqXG4gKiAgICAgIHZhciBhdXRoID0gbmV3IEYuc2VydmljZS5BdXRoKCk7XG4gKiAgICAgIGF1dGgubG9naW4oeyB1c2VyTmFtZTogJ2pzbWl0aEBhY21lc2ltdWxhdGlvbnMuY29tJyxcbiAqICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6ICdwYXNzdzByZCcgfSk7XG4gKiAgICAgIGF1dGgubG9nb3V0KCk7XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEVtYWlsIG9yIHVzZXJuYW1lIHRvIHVzZSBmb3IgbG9nZ2luZyBpbi4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdXNlck5hbWU6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQYXNzd29yZCBmb3Igc3BlY2lmaWVkIGB1c2VyTmFtZWAuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHBhc3N3b3JkOiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGFjY291bnQgaWQgZm9yIHRoaXMgYHVzZXJOYW1lYC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKSBvciB0aGUgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuIFJlcXVpcmVkIGlmIHRoZSBgdXNlck5hbWVgIGlzIGZvciBhbiBbZW5kIHVzZXJdKC4uLy4uLy4uL2dsb3NzYXJ5LyN1c2VycykuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPcHRpb25zIHRvIHBhc3Mgb24gdG8gdGhlIHVuZGVybHlpbmcgdHJhbnNwb3J0IGxheWVyLiBBbGwganF1ZXJ5LmFqYXggb3B0aW9ucyBhdCBodHRwOi8vYXBpLmpxdWVyeS5jb20valF1ZXJ5LmFqYXgvIGFyZSBhdmFpbGFibGUuIERlZmF1bHRzIHRvIGVtcHR5IG9iamVjdC5cbiAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRyYW5zcG9ydDoge31cbiAgICB9O1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG5cbiAgICB2YXIgdHJhbnNwb3J0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aCgnYXV0aGVudGljYXRpb24nKVxuICAgIH0pO1xuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkodHJhbnNwb3J0T3B0aW9ucyk7XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMb2dzIHVzZXIgaW4sIHJldHVybmluZyB0aGUgdXNlciBhY2Nlc3MgdG9rZW4uXG4gICAgICAgICAqXG4gICAgICAgICAqIElmIG5vIGB1c2VyTmFtZWAgb3IgYHBhc3N3b3JkYCB3ZXJlIHByb3ZpZGVkIGluIHRoZSBpbml0aWFsIGNvbmZpZ3VyYXRpb24gb3B0aW9ucywgdGhleSBhcmUgcmVxdWlyZWQgaW4gdGhlIGBvcHRpb25zYCBoZXJlLiBJZiBubyBgYWNjb3VudGAgd2FzIHByb3ZpZGVkIGluIHRoZSBpbml0aWFsIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBhbmQgdGhlIGB1c2VyTmFtZWAgaXMgZm9yIGFuIFtlbmQgdXNlcl0oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKSwgdGhlIGBhY2NvdW50YCBpcyByZXF1aXJlZCBhcyB3ZWxsLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIGF1dGgubG9naW4oe1xuICAgICAgICAgKiAgICAgICAgICB1c2VyTmFtZTogJ2pzbWl0aCcsXG4gICAgICAgICAqICAgICAgICAgIHBhc3N3b3JkOiAncGFzc3cwcmQnLFxuICAgICAgICAgKiAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycgfSlcbiAgICAgICAgICogICAgICAudGhlbihmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgICogICAgICAgICAgY29uc29sZS5sb2coXCJ1c2VyIGFjY2VzcyB0b2tlbiBpczogXCIsIHRva2VuLmFjY2Vzc190b2tlbik7XG4gICAgICAgICAqICAgICAgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIGxvZ2luOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwgeyBzdWNjZXNzOiAkLm5vb3AgfSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKCFodHRwT3B0aW9ucy51c2VyTmFtZSB8fCAhaHR0cE9wdGlvbnMucGFzc3dvcmQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzcCA9IHsgc3RhdHVzOiA0MDEsIHN0YXR1c01lc3NhZ2U6ICdObyB1c2VybmFtZSBvciBwYXNzd29yZCBzcGVjaWZpZWQuJyB9O1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZXJyb3IuY2FsbCh0aGlzLCByZXNwKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdChyZXNwKS5wcm9taXNlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBwb3N0UGFyYW1zID0ge1xuICAgICAgICAgICAgICAgIHVzZXJOYW1lOiBodHRwT3B0aW9ucy51c2VyTmFtZSxcbiAgICAgICAgICAgICAgICBwYXNzd29yZDogaHR0cE9wdGlvbnMucGFzc3dvcmQsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKGh0dHBPcHRpb25zLmFjY291bnQpIHtcbiAgICAgICAgICAgICAgICAvL3Bhc3MgaW4gbnVsbCBmb3IgYWNjb3VudCB1bmRlciBvcHRpb25zIGlmIHlvdSBkb24ndCB3YW50IGl0IHRvIGJlIHNlbnRcbiAgICAgICAgICAgICAgICBwb3N0UGFyYW1zLmFjY291bnQgPSBodHRwT3B0aW9ucy5hY2NvdW50O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHBvc3RQYXJhbXMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogTG9ncyB1c2VyIG91dCBmcm9tIHNwZWNpZmllZCBhY2NvdW50cy5cbiAgICAgICAgICogRXBpY2VudGVyIGxvZ291dCBpcyBub3QgaW1wbGVtZW50ZWQgeWV0LCBhZGRlZCBhIGR1bW15IHByb21pc2UgdGhhdCBnZXRzIGF1dG9tYXRpY2FsbHkgcmVzb2x2ZWQuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgYXV0aC5sb2dvdXQoKTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgbG9nb3V0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGR0ZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgICAgIGR0ZC5yZXNvbHZlKCk7XG4gICAgICAgICAgICByZXR1cm4gZHRkLnByb21pc2UoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiAjIyBDaGFubmVsIFNlcnZpY2VcbiAqXG4gKiBUaGUgRXBpY2VudGVyIHBsYXRmb3JtIHByb3ZpZGVzIGEgcHVzaCBjaGFubmVsLCB3aGljaCBhbGxvd3MgeW91IHRvIHB1Ymxpc2ggYW5kIHN1YnNjcmliZSB0byBtZXNzYWdlcyB3aXRoaW4gYSBbcHJvamVjdF0oLi4vLi4vLi4vZ2xvc3NhcnkvI3Byb2plY3RzKSwgW2dyb3VwXSguLi8uLi8uLi9nbG9zc2FyeS8jZ3JvdXBzKSwgb3IgW211bHRpcGxheWVyIHdvcmxkXSguLi8uLi8uLi9nbG9zc2FyeS8jd29ybGQpLiBUaGVyZSBhcmUgdHdvIG1haW4gdXNlIGNhc2VzIGZvciB0aGUgY2hhbm5lbDogZXZlbnQgbm90aWZpY2F0aW9ucyBhbmQgY2hhdCBtZXNzYWdlcy5cbiAqXG4gKiBUaGUgQ2hhbm5lbCBTZXJ2aWNlIGlzIGEgYnVpbGRpbmcgYmxvY2sgZm9yIHRoaXMgZnVuY3Rpb25hbGl0eS4gSXQgY3JlYXRlcyBhIHB1Ymxpc2gtc3Vic2NyaWJlIG9iamVjdCwgYWxsb3dpbmcgeW91IHRvIHB1Ymxpc2ggbWVzc2FnZXMsIHN1YnNjcmliZSB0byBtZXNzYWdlcywgb3IgdW5zdWJzY3JpYmUgZnJvbSBtZXNzYWdlcyBmb3IgYSBnaXZlbiAndG9waWMnIG9uIGEgYCQuY29tZXRkYCB0cmFuc3BvcnQgaW5zdGFuY2UuXG4gKlxuICogVHlwaWNhbGx5LCB5b3UgdXNlIHRoZSBbRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlcl0oLi4vZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlci8pIHRvIGNyZWF0ZSBvciByZXRyaWV2ZSBjaGFubmVscywgdGhlbiB1c2UgdGhlIENoYW5uZWwgU2VydmljZSBgc3Vic2NyaWJlKClgIGFuZCBgcHVibGlzaCgpYCBtZXRob2RzIHRvIGxpc3RlbiB0byBvciB1cGRhdGUgZGF0YS4gKEZvciBhZGRpdGlvbmFsIGJhY2tncm91bmQgb24gRXBpY2VudGVyJ3MgcHVzaCBjaGFubmVsLCBzZWUgdGhlIGludHJvZHVjdG9yeSBub3RlcyBvbiB0aGUgW1B1c2ggQ2hhbm5lbCBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9tdWx0aXBsYXllci9jaGFubmVsLykgcGFnZS4pXG4gKlxuICogWW91J2xsIG5lZWQgdG8gaW5jbHVkZSB0aGUgYGVwaWNlbnRlci1tdWx0aXBsYXllci1kZXBlbmRlbmNpZXMuanNgIGxpYnJhcnkgaW4gYWRkaXRpb24gdG8gdGhlIGBlcGljZW50ZXIuanNgIGxpYnJhcnkgaW4geW91ciBwcm9qZWN0IHRvIHVzZSB0aGUgQ2hhbm5lbCBTZXJ2aWNlLiBTZWUgW0luY2x1ZGluZyBFcGljZW50ZXIuanNdKC4uLy4uLyNpbmNsdWRlKS5cbiAqXG4gKiBUbyB1c2UgdGhlIENoYW5uZWwgU2VydmljZSwgaW5zdGFudGlhdGUgaXQsIHRoZW4gbWFrZSBjYWxscyB0byBhbnkgb2YgdGhlIG1ldGhvZHMgeW91IG5lZWQuXG4gKlxuICogICAgICAgIHZhciBjcyA9IG5ldyBGLnNlcnZpY2UuQ2hhbm5lbCgpO1xuICogICAgICAgIGNzLnB1Ymxpc2goJy9hY21lLXNpbXVsYXRpb25zL3N1cHBseS1jaGFpbi1nYW1lL2ZhbGwtc2VtaW5hci9ydW4vdmFyaWFibGVzJywgeyBwcmljZTogNTAgfSk7XG4gKlxuICogVGhlIHBhcmFtZXRlcnMgZm9yIGluc3RhbnRpYXRpbmcgYSBDaGFubmVsIFNlcnZpY2UgaW5jbHVkZTpcbiAqXG4gKiAqIGBvcHRpb25zYCBUaGUgb3B0aW9ucyBvYmplY3QgdG8gY29uZmlndXJlIHRoZSBDaGFubmVsIFNlcnZpY2UuXG4gKiAqIGBvcHRpb25zLmJhc2VgIFRoZSBiYXNlIHRvcGljLiBUaGlzIGlzIGFkZGVkIGFzIGEgcHJlZml4IHRvIGFsbCBmdXJ0aGVyIHRvcGljcyB5b3UgcHVibGlzaCBvciBzdWJzY3JpYmUgdG8gd2hpbGUgd29ya2luZyB3aXRoIHRoaXMgQ2hhbm5lbCBTZXJ2aWNlLlxuICogKiBgb3B0aW9ucy50b3BpY1Jlc29sdmVyYCBBIGZ1bmN0aW9uIHRoYXQgcHJvY2Vzc2VzIGFsbCAndG9waWNzJyBwYXNzZWQgaW50byB0aGUgYHB1Ymxpc2hgIGFuZCBgc3Vic2NyaWJlYCBtZXRob2RzLiBUaGlzIGlzIHVzZWZ1bCBpZiB5b3Ugd2FudCB0byBpbXBsZW1lbnQgeW91ciBvd24gc2VyaWFsaXplIGZ1bmN0aW9ucyBmb3IgY29udmVydGluZyBjdXN0b20gb2JqZWN0cyB0byB0b3BpYyBuYW1lcy4gUmV0dXJucyBhIFN0cmluZy4gQnkgZGVmYXVsdCwgaXQganVzdCBlY2hvZXMgdGhlIHRvcGljLlxuICogKiBgb3B0aW9ucy50cmFuc3BvcnRgIFRoZSBpbnN0YW5jZSBvZiBgJC5jb21ldGRgIHRvIGhvb2sgb250by4gU2VlIGh0dHA6Ly9kb2NzLmNvbWV0ZC5vcmcvcmVmZXJlbmNlL2phdmFzY3JpcHQuaHRtbCBmb3IgYWRkaXRpb25hbCBiYWNrZ3JvdW5kIG9uIGNvbWV0ZC5cbiAqL1xudmFyIENoYW5uZWwgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGJhc2UgdG9waWMuIFRoaXMgaXMgYWRkZWQgYXMgYSBwcmVmaXggdG8gYWxsIGZ1cnRoZXIgdG9waWNzIHlvdSBwdWJsaXNoIG9yIHN1YnNjcmliZSB0byB3aGlsZSB3b3JraW5nIHdpdGggdGhpcyBDaGFubmVsIFNlcnZpY2UuXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBiYXNlOiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQSBmdW5jdGlvbiB0aGF0IHByb2Nlc3NlcyBhbGwgJ3RvcGljcycgcGFzc2VkIGludG8gdGhlIGBwdWJsaXNoYCBhbmQgYHN1YnNjcmliZWAgbWV0aG9kcy4gVGhpcyBpcyB1c2VmdWwgaWYgeW91IHdhbnQgdG8gaW1wbGVtZW50IHlvdXIgb3duIHNlcmlhbGl6ZSBmdW5jdGlvbnMgZm9yIGNvbnZlcnRpbmcgY3VzdG9tIG9iamVjdHMgdG8gdG9waWMgbmFtZXMuIEJ5IGRlZmF1bHQsIGl0IGp1c3QgZWNob2VzIHRoZSB0b3BpYy5cbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICpcbiAgICAgICAgICogKiBgdG9waWNgIFRvcGljIHRvIHBhcnNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKlJldHVybiBWYWx1ZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICogKlN0cmluZyo6IFRoaXMgZnVuY3Rpb24gc2hvdWxkIHJldHVybiBhIHN0cmluZyB0b3BpYy5cbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgICAgICAgKi9cbiAgICAgICAgdG9waWNSZXNvbHZlcjogZnVuY3Rpb24gKHRvcGljKSB7XG4gICAgICAgICAgICByZXR1cm4gdG9waWM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBpbnN0YW5jZSBvZiBgJC5jb21ldGRgIHRvIGhvb2sgb250by5cbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRyYW5zcG9ydDogbnVsbFxuICAgIH07XG4gICAgdGhpcy5jaGFubmVsT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG59O1xuXG52YXIgbWFrZU5hbWUgPSBmdW5jdGlvbiAoY2hhbm5lbE5hbWUsIHRvcGljKSB7XG4gICAgLy9SZXBsYWNlIHRyYWlsaW5nL2RvdWJsZSBzbGFzaGVzXG4gICAgdmFyIG5ld05hbWUgPSAoY2hhbm5lbE5hbWUgPyAoY2hhbm5lbE5hbWUgKyAnLycgKyB0b3BpYykgOiB0b3BpYykucmVwbGFjZSgvXFwvXFwvL2csICcvJykucmVwbGFjZSgvXFwvJC8sJycpO1xuICAgIHJldHVybiBuZXdOYW1lO1xufTtcblxuXG5DaGFubmVsLnByb3RvdHlwZSA9ICQuZXh0ZW5kKENoYW5uZWwucHJvdG90eXBlLCB7XG5cbiAgICAvLyBmdXR1cmUgZnVuY3Rpb25hbGl0eTpcbiAgICAvLyAgICAgIC8vIFNldCB0aGUgY29udGV4dCBmb3IgdGhlIGNhbGxiYWNrXG4gICAgLy8gICAgICBjcy5zdWJzY3JpYmUoJ3J1bicsIGZ1bmN0aW9uICgpIHsgdGhpcy5pbm5lckhUTUwgPSAnVHJpZ2dlcmVkJ30sIGRvY3VtZW50LmJvZHkpO1xuICAgICAvL1xuICAgICAvLyAgICAgIC8vIENvbnRyb2wgdGhlIG9yZGVyIG9mIG9wZXJhdGlvbnMgYnkgc2V0dGluZyB0aGUgYHByaW9yaXR5YFxuICAgICAvLyAgICAgIGNzLnN1YnNjcmliZSgncnVuJywgY2IsIHRoaXMsIHtwcmlvcml0eTogOX0pO1xuICAgICAvL1xuICAgICAvLyAgICAgIC8vIE9ubHkgZXhlY3V0ZSB0aGUgY2FsbGJhY2ssIGBjYmAsIGlmIHRoZSB2YWx1ZSBvZiB0aGUgYHByaWNlYCB2YXJpYWJsZSBpcyA1MFxuICAgICAvLyAgICAgIGNzLnN1YnNjcmliZSgncnVuL3ZhcmlhYmxlcy9wcmljZScsIGNiLCB0aGlzLCB7cHJpb3JpdHk6IDMwLCB2YWx1ZTogNTB9KTtcbiAgICAgLy9cbiAgICAgLy8gICAgICAvLyBPbmx5IGV4ZWN1dGUgdGhlIGNhbGxiYWNrLCBgY2JgLCBpZiB0aGUgdmFsdWUgb2YgdGhlIGBwcmljZWAgdmFyaWFibGUgaXMgZ3JlYXRlciB0aGFuIDUwXG4gICAgIC8vICAgICAgc3Vic2NyaWJlKCdydW4vdmFyaWFibGVzL3ByaWNlJywgY2IsIHRoaXMsIHtwcmlvcml0eTogMzAsIHZhbHVlOiAnPjUwJ30pO1xuICAgICAvL1xuICAgICAvLyAgICAgIC8vIE9ubHkgZXhlY3V0ZSB0aGUgY2FsbGJhY2ssIGBjYmAsIGlmIHRoZSB2YWx1ZSBvZiB0aGUgYHByaWNlYCB2YXJpYWJsZSBpcyBldmVuXG4gICAgIC8vICAgICAgc3Vic2NyaWJlKCdydW4vdmFyaWFibGVzL3ByaWNlJywgY2IsIHRoaXMsIHtwcmlvcml0eTogMzAsIHZhbHVlOiBmdW5jdGlvbiAodmFsKSB7cmV0dXJuIHZhbCAlIDIgPT09IDB9fSk7XG5cblxuICAgIC8qKlxuICAgICAqIFN1YnNjcmliZSB0byBjaGFuZ2VzIG9uIGEgdG9waWMuXG4gICAgICpcbiAgICAgKiBUaGUgdG9waWMgc2hvdWxkIGluY2x1ZGUgdGhlIGZ1bGwgcGF0aCBvZiB0aGUgYWNjb3VudCBpZCAoKipUZWFtIElEKiogZm9yIHRlYW0gcHJvamVjdHMpLCBwcm9qZWN0IGlkLCBhbmQgZ3JvdXAgbmFtZS4gKEluIG1vc3QgY2FzZXMsIGl0IGlzIHNpbXBsZXIgdG8gdXNlIHRoZSBbRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlcl0oLi4vZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlci8pIGluc3RlYWQsIGluIHdoaWNoIGNhc2UgdGhpcyBpcyBjb25maWd1cmVkIGZvciB5b3UuKVxuICAgICAqXG4gICAgICogICoqRXhhbXBsZXMqKlxuICAgICAqXG4gICAgICogICAgICB2YXIgY2IgPSBmdW5jdGlvbih2YWwpIHsgY29uc29sZS5sb2codmFsLmRhdGEpOyB9O1xuICAgICAqXG4gICAgICogICAgICAvLyBTdWJzY3JpYmUgdG8gY2hhbmdlcyBvbiBhIHRvcC1sZXZlbCAncnVuJyB0b3BpY1xuICAgICAqICAgICAgY3Muc3Vic2NyaWJlKCcvYWNtZS1zaW11bGF0aW9ucy9zdXBwbHktY2hhaW4tZ2FtZS9mYWxsLXNlbWluYXIvcnVuJywgY2IpO1xuICAgICAqXG4gICAgICogICAgICAvLyBTdWJzY3JpYmUgdG8gY2hhbmdlcyBvbiBjaGlsZHJlbiBvZiB0aGUgJ3J1bicgdG9waWMuIE5vdGUgdGhpcyB3aWxsIGFsc28gYmUgdHJpZ2dlcmVkIGZvciBjaGFuZ2VzIHRvIHJ1bi54Lnkuei5cbiAgICAgKiAgICAgIGNzLnN1YnNjcmliZSgnL2FjbWUtc2ltdWxhdGlvbnMvc3VwcGx5LWNoYWluLWdhbWUvZmFsbC1zZW1pbmFyL3J1bi8qJywgY2IpO1xuICAgICAqXG4gICAgICogICAgICAvLyBTdWJzY3JpYmUgdG8gY2hhbmdlcyBvbiBib3RoIHRoZSB0b3AtbGV2ZWwgJ3J1bicgdG9waWMgYW5kIGl0cyBjaGlsZHJlblxuICAgICAqICAgICAgY3Muc3Vic2NyaWJlKFsnL2FjbWUtc2ltdWxhdGlvbnMvc3VwcGx5LWNoYWluLWdhbWUvZmFsbC1zZW1pbmFyL3J1bicsXG4gICAgICogICAgICAgICAgJy9hY21lLXNpbXVsYXRpb25zL3N1cHBseS1jaGFpbi1nYW1lL2ZhbGwtc2VtaW5hci9ydW4vKiddLCBjYik7XG4gICAgICpcbiAgICAgKiAgICAgIC8vIFN1YnNjcmliZSB0byBjaGFuZ2VzIG9uIGEgcGFydGljdWxhciB2YXJpYWJsZVxuICAgICAqICAgICAgc3Vic2NyaWJlKCcvYWNtZS1zaW11bGF0aW9ucy9zdXBwbHktY2hhaW4tZ2FtZS9mYWxsLXNlbWluYXIvcnVuL3ZhcmlhYmxlcy9wcmljZScsIGNiKTtcbiAgICAgKlxuICAgICAqXG4gICAgICogKipSZXR1cm4gVmFsdWUqKlxuICAgICAqXG4gICAgICogKiAqU3RyaW5nKiBSZXR1cm5zIGEgdG9rZW4geW91IGNhbiBsYXRlciB1c2UgdG8gdW5zdWJzY3JpYmUuXG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ3xBcnJheX0gICBgdG9waWNgICAgIExpc3Qgb2YgdG9waWNzIHRvIGxpc3RlbiBmb3IgY2hhbmdlcyBvbi5cbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gYGNhbGxiYWNrYCBDYWxsYmFjayBmdW5jdGlvbiB0byBleGVjdXRlLiBDYWxsYmFjayBpcyBjYWxsZWQgd2l0aCBzaWduYXR1cmUgYChldnQsIHBheWxvYWQsIG1ldGFkYXRhKWAuXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSAgIGBjb250ZXh0YCAgQ29udGV4dCBpbiB3aGljaCB0aGUgYGNhbGxiYWNrYCBpcyBleGVjdXRlZC5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgYG9wdGlvbnNgICAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gICBgb3B0aW9ucy5wcmlvcml0eWAgIFVzZWQgdG8gY29udHJvbCBvcmRlciBvZiBvcGVyYXRpb25zLiBEZWZhdWx0cyB0byAwLiBDYW4gYmUgYW55ICt2ZSBvciAtdmUgbnVtYmVyLlxuICAgICAqIEBwYXJhbSAge1N0cmluZ3xOdW1iZXJ8RnVuY3Rpb259ICAgYG9wdGlvbnMudmFsdWVgIFRoZSBgY2FsbGJhY2tgIGlzIG9ubHkgdHJpZ2dlcmVkIGlmIHRoaXMgY29uZGl0aW9uIG1hdGNoZXMuIFNlZSBleGFtcGxlcyBmb3IgZGV0YWlscy5cbiAgICAgKlxuICAgICAqL1xuICAgIHN1YnNjcmliZTogZnVuY3Rpb24gKHRvcGljLCBjYWxsYmFjaywgY29udGV4dCwgb3B0aW9ucykge1xuXG4gICAgICAgIHZhciB0b3BpY3MgPSBbXS5jb25jYXQodG9waWMpO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICB2YXIgc3Vic2NyaXB0aW9uSWRzID0gW107XG4gICAgICAgIHZhciBvcHRzID0gbWUuY2hhbm5lbE9wdGlvbnM7XG5cbiAgICAgICAgb3B0cy50cmFuc3BvcnQuYmF0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJC5lYWNoKHRvcGljcywgZnVuY3Rpb24gKGluZGV4LCB0b3BpYykge1xuICAgICAgICAgICAgICAgIHRvcGljID0gbWFrZU5hbWUob3B0cy5iYXNlLCBvcHRzLnRvcGljUmVzb2x2ZXIodG9waWMpKTtcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZHMucHVzaChvcHRzLnRyYW5zcG9ydC5zdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiAoc3Vic2NyaXB0aW9uSWRzWzFdID8gc3Vic2NyaXB0aW9uSWRzIDogc3Vic2NyaXB0aW9uSWRzWzBdKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHVibGlzaCBkYXRhIHRvIGEgdG9waWMuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGVzKipcbiAgICAgKlxuICAgICAqICAgICAgLy8gU2VuZCBkYXRhIHRvIGFsbCBzdWJzY3JpYmVycyBvZiB0aGUgJ3J1bicgdG9waWNcbiAgICAgKiAgICAgIGNzLnB1Ymxpc2goJy9hY21lLXNpbXVsYXRpb25zL3N1cHBseS1jaGFpbi1nYW1lL2ZhbGwtc2VtaW5hci9ydW4nLCB7IGNvbXBsZXRlZDogZmFsc2UgfSk7XG4gICAgICpcbiAgICAgKiAgICAgIC8vIFNlbmQgZGF0YSB0byBhbGwgc3Vic2NyaWJlcnMgb2YgdGhlICdydW4vdmFyaWFibGVzJyB0b3BpY1xuICAgICAqICAgICAgY3MucHVibGlzaCgnL2FjbWUtc2ltdWxhdGlvbnMvc3VwcGx5LWNoYWluLWdhbWUvZmFsbC1zZW1pbmFyL3J1bi92YXJpYWJsZXMnLCB7IHByaWNlOiA1MCB9KTtcbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGB0b3BpY2AgVG9waWMgdG8gcHVibGlzaCB0by5cbiAgICAgKiBAcGFyYW0gIHsqfSBgZGF0YWAgIERhdGEgdG8gcHVibGlzaCB0byB0b3BpYy5cbiAgICAgKlxuICAgICAqL1xuICAgIHB1Ymxpc2g6IGZ1bmN0aW9uICh0b3BpYywgZGF0YSkge1xuICAgICAgICB2YXIgdG9waWNzID0gW10uY29uY2F0KHRvcGljKTtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgdmFyIHJldHVybk9ianMgPSBbXTtcbiAgICAgICAgdmFyIG9wdHMgPSBtZS5jaGFubmVsT3B0aW9ucztcblxuXG4gICAgICAgIG9wdHMudHJhbnNwb3J0LmJhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQuZWFjaCh0b3BpY3MsIGZ1bmN0aW9uIChpbmRleCwgdG9waWMpIHtcbiAgICAgICAgICAgICAgICB0b3BpYyA9IG1ha2VOYW1lKG9wdHMuYmFzZSwgb3B0cy50b3BpY1Jlc29sdmVyKHRvcGljKSk7XG4gICAgICAgICAgICAgICAgaWYgKHRvcGljLmNoYXJBdCh0b3BpYy5sZW5ndGggLSAxKSA9PT0gJyonKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvcGljID0gdG9waWMucmVwbGFjZSgvXFwqKyQvLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignWW91IGNhbiBjYW5ub3QgcHVibGlzaCB0byBjaGFubmVscyB3aXRoIHdpbGRjYXJkcy4gUHVibGlzaGluZyB0byAnLCB0b3BpYywgJ2luc3RlYWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuT2Jqcy5wdXNoKG9wdHMudHJhbnNwb3J0LnB1Ymxpc2godG9waWMsIGRhdGEpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIChyZXR1cm5PYmpzWzFdID8gcmV0dXJuT2JqcyA6IHJldHVybk9ianNbMF0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVbnN1YnNjcmliZSBmcm9tIGNoYW5nZXMgdG8gYSB0b3BpYy5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIGNzLnVuc3Vic2NyaWJlKCdzYW1wbGVUb2tlbicpO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGB0b2tlbmAgVGhlIHRva2VuIGZvciB0b3BpYyBpcyByZXR1cm5lZCB3aGVuIHlvdSBpbml0aWFsbHkgc3Vic2NyaWJlLiBQYXNzIGl0IGhlcmUgdG8gdW5zdWJzY3JpYmUgZnJvbSB0aGF0IHRvcGljLlxuICAgICAqL1xuICAgIHVuc3Vic2NyaWJlOiBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgdGhpcy5jaGFubmVsT3B0aW9ucy50cmFuc3BvcnQudW5zdWJzY3JpYmUodG9rZW4pO1xuICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IGxpc3RlbmluZyBmb3IgZXZlbnRzIG9uIHRoaXMgaW5zdGFuY2UuIFNpZ25hdHVyZSBpcyBzYW1lIGFzIGZvciBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vb24vLlxuICAgICAqXG4gICAgICogU3VwcG9ydGVkIGV2ZW50cyBhcmU6IGBjb25uZWN0YCwgYGRpc2Nvbm5lY3RgLCBgc3Vic2NyaWJlYCwgYHVuc3Vic2NyaWJlYCwgYHB1Ymxpc2hgLCBgZXJyb3JgLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgZXZlbnRgIFRoZSBldmVudCB0eXBlLiBTZWUgbW9yZSBkZXRhaWwgYXQgalF1ZXJ5IEV2ZW50czogaHR0cDovL2FwaS5qcXVlcnkuY29tL29uLy5cbiAgICAgKi9cbiAgICBvbjogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICQodGhpcykub24uYXBwbHkoJCh0aGlzKSwgYXJndW1lbnRzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RvcCBsaXN0ZW5pbmcgZm9yIGV2ZW50cyBvbiB0aGlzIGluc3RhbmNlLiBTaWduYXR1cmUgaXMgc2FtZSBhcyBmb3IgalF1ZXJ5IEV2ZW50czogaHR0cDovL2FwaS5qcXVlcnkuY29tL29mZi8uXG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGBldmVudGAgVGhlIGV2ZW50IHR5cGUuIFNlZSBtb3JlIGRldGFpbCBhdCBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vb2ZmLy5cbiAgICAgKi9cbiAgICBvZmY6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAkKHRoaXMpLm9mZi5hcHBseSgkKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUcmlnZ2VyIGV2ZW50cyBhbmQgZXhlY3V0ZSBoYW5kbGVycy4gU2lnbmF0dXJlIGlzIHNhbWUgYXMgZm9yIGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS90cmlnZ2VyLy5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYGV2ZW50YCBUaGUgZXZlbnQgdHlwZS4gU2VlIG1vcmUgZGV0YWlsIGF0IGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS90cmlnZ2VyLy5cbiAgICAgKi9cbiAgICB0cmlnZ2VyOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgJCh0aGlzKS50cmlnZ2VyLmFwcGx5KCQodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDaGFubmVsO1xuIiwiLyoqXG4gKiBAY2xhc3MgQ29uZmlndXJhdGlvblNlcnZpY2VcbiAqXG4gKiBBbGwgc2VydmljZXMgdGFrZSBpbiBhIGNvbmZpZ3VyYXRpb24gc2V0dGluZ3Mgb2JqZWN0IHRvIGNvbmZpZ3VyZSB0aGVtc2VsdmVzLiBBIEpTIGhhc2gge30gaXMgYSB2YWxpZCBjb25maWd1cmF0aW9uIG9iamVjdCwgYnV0IG9wdGlvbmFsbHkgeW91IGNhbiB1c2UgdGhlIGNvbmZpZ3VyYXRpb24gc2VydmljZSB0byB0b2dnbGUgY29uZmlncyBiYXNlZCBvbiB0aGUgZW52aXJvbm1lbnRcbiAqXG4gKiBAZXhhbXBsZVxuICogICAgIHZhciBjcyA9IHJlcXVpcmUoJ2NvbmZpZ3VyYXRpb24tc2VydmljZScpKHtcbiAqICAgICAgICAgIGRldjogeyAvL2Vudmlyb25tZW50XG4gICAgICAgICAgICAgICAgcG9ydDogMzAwMCxcbiAgICAgICAgICAgICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9kOiB7XG4gICAgICAgICAgICAgICAgcG9ydDogODA4MCxcbiAgICAgICAgICAgICAgICBob3N0OiAnYXBpLmZvcmlvLmNvbScsXG4gICAgICAgICAgICAgICAgbG9nTGV2ZWw6ICdub25lJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxvZ0xldmVsOiAnREVCVUcnIC8vZ2xvYmFsXG4gKiAgICAgfSk7XG4gKlxuICogICAgICBjcy5nZXQoJ2xvZ0xldmVsJyk7IC8vcmV0dXJucyAnREVCVUcnXG4gKlxuICogICAgICBjcy5zZXRFbnYoJ2RldicpO1xuICogICAgICBjcy5nZXQoJ2xvZ0xldmVsJyk7IC8vcmV0dXJucyAnREVCVUcnXG4gKlxuICogICAgICBjcy5zZXRFbnYoJ3Byb2QnKTtcbiAqICAgICAgY3MuZ2V0KCdsb2dMZXZlbCcpOyAvL3JldHVybnMgJ25vbmUnXG4gKlxuICovXG5cbid1c2Ugc3RyaWN0JztcbnZhciB1cmxTZXJ2aWNlID0gcmVxdWlyZSgnLi91cmwtY29uZmlnLXNlcnZpY2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgLy9UT0RPOiBFbnZpcm9ubWVudHNcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIGxvZ0xldmVsOiAnTk9ORSdcbiAgICB9O1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcbiAgICBzZXJ2aWNlT3B0aW9ucy5zZXJ2ZXIgPSB1cmxTZXJ2aWNlKHNlcnZpY2VPcHRpb25zLnNlcnZlcik7XG5cbiAgICByZXR1cm4ge1xuXG4gICAgICAgIGRhdGE6IHNlcnZpY2VPcHRpb25zLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgdGhlIGVudmlyb25tZW50IGtleSB0byBnZXQgY29uZmlndXJhdGlvbiBvcHRpb25zIGZyb21cbiAgICAgICAgICogQHBhcmFtIHsgc3RyaW5nfSBlbnZcbiAgICAgICAgICovXG4gICAgICAgIHNldEVudjogZnVuY3Rpb24gKGVudikge1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBjb25maWd1cmF0aW9uLlxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfSBwcm9wZXJ0eSBvcHRpb25hbFxuICAgICAgICAgKiBAcmV0dXJuIHsqfSAgICAgICAgICBWYWx1ZSBvZiBwcm9wZXJ0eSBpZiBzcGVjaWZpZWQsIHRoZSBlbnRpcmUgY29uZmlnIG9iamVjdCBvdGhlcndpc2VcbiAgICAgICAgICovXG4gICAgICAgIGdldDogZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICByZXR1cm4gc2VydmljZU9wdGlvbnNbcHJvcGVydHldO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgY29uZmlndXJhdGlvbi5cbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xPYmplY3R9IGtleSBpZiBhIGtleSBpcyBwcm92aWRlZCwgc2V0IGEga2V5IHRvIHRoYXQgdmFsdWUuIE90aGVyd2lzZSBtZXJnZSBvYmplY3Qgd2l0aCBjdXJyZW50IGNvbmZpZ1xuICAgICAgICAgKiBAcGFyYW0gIHsqfSB2YWx1ZSAgdmFsdWUgZm9yIHByb3ZpZGVkIGtleVxuICAgICAgICAgKi9cbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnNba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbiIsIi8qKlxuICogIyNEYXRhIEFQSSBTZXJ2aWNlXG4gKlxuICogVGhlIERhdGEgQVBJIFNlcnZpY2UgYWxsb3dzIHlvdSB0byBjcmVhdGUsIGFjY2VzcywgYW5kIG1hbmlwdWxhdGUgZGF0YSByZWxhdGVkIHRvIGFueSBvZiB5b3VyIHByb2plY3RzLiBEYXRhIGFyZSBvcmdhbml6ZWQgaW4gY29sbGVjdGlvbnMuIEVhY2ggY29sbGVjdGlvbiBjb250YWlucyBhIGRvY3VtZW50OyBlYWNoIGVsZW1lbnQgb2YgdGhpcyB0b3AtbGV2ZWwgZG9jdW1lbnQgaXMgYSBKU09OIG9iamVjdC4gKFNlZSBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIG9uIHRoZSB1bmRlcmx5aW5nIFtEYXRhIEFQSV0oLi4vLi4vLi4vcmVzdF9hcGlzL2RhdGFfYXBpLykuKVxuICpcbiAqIEFsbCBBUEkgY2FsbHMgdGFrZSBpbiBhbiBcIm9wdGlvbnNcIiBvYmplY3QgYXMgdGhlIGxhc3QgcGFyYW1ldGVyLiBUaGUgb3B0aW9ucyBjYW4gYmUgdXNlZCB0byBleHRlbmQvb3ZlcnJpZGUgdGhlIERhdGEgQVBJIFNlcnZpY2UgZGVmYXVsdHMuIEluIHBhcnRpY3VsYXIsIHRoZXJlIGFyZSB0aHJlZSByZXF1aXJlZCBwYXJhbWV0ZXJzIHdoZW4geW91IGluc3RhbnRpYXRlIHRoZSBEYXRhIFNlcnZpY2U6XG4gKlxuICogKiBgYWNjb3VudGA6IEVwaWNlbnRlciBhY2NvdW50IGlkICgqKlRlYW0gSUQqKiBmb3IgdGVhbSBwcm9qZWN0cywgKipVc2VyIElEKiogZm9yIHBlcnNvbmFsIHByb2plY3RzKS5cbiAqICogYHByb2plY3RgOiBFcGljZW50ZXIgcHJvamVjdCBpZC5cbiAqICogYHJvb3RgOiBUaGUgdGhlIG5hbWUgb2YgdGhlIGNvbGxlY3Rpb24uIElmIHlvdSBoYXZlIG11bHRpcGxlIGNvbGxlY3Rpb25zIHdpdGhpbiBlYWNoIG9mIHlvdXIgcHJvamVjdHMsIHlvdSBjYW4gYWxzbyBwYXNzIHRoZSBjb2xsZWN0aW9uIG5hbWUgYXMgYW4gb3B0aW9uIGZvciBlYWNoIGNhbGwuXG4gKlxuICogICAgICAgdmFyIGRzID0gbmV3IEYuc2VydmljZS5EYXRhKHtcbiAqICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAqICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gKiAgICAgICAgICByb290OiAnc3VydmV5LXJlc3BvbnNlcycsXG4gKiAgICAgICAgICBzZXJ2ZXI6IHsgaG9zdDogJ2FwaS5mb3Jpby5jb20nIH1cbiAqICAgICAgIH0pO1xuICogICAgICAgZHMuc2F2ZUFzKCd1c2VyMScsXG4gKiAgICAgICAgICB7ICdxdWVzdGlvbjEnOiAyLCAncXVlc3Rpb24yJzogMTAsXG4gKiAgICAgICAgICAncXVlc3Rpb24zJzogZmFsc2UsICdxdWVzdGlvbjQnOiAnc29tZXRpbWVzJyB9ICk7XG4gKiAgICAgICBkcy5zYXZlQXMoJ3VzZXIyJyxcbiAqICAgICAgICAgIHsgJ3F1ZXN0aW9uMSc6IDMsICdxdWVzdGlvbjInOiA4LFxuICogICAgICAgICAgJ3F1ZXN0aW9uMyc6IHRydWUsICdxdWVzdGlvbjQnOiAnYWx3YXlzJyB9ICk7XG4gKiAgICAgICBkcy5xdWVyeSgnJyx7ICdxdWVzdGlvbjInOiB7ICckZ3QnOiA5fSB9KTtcbiAqXG4gKiBOb3RlIHRoYXQgaW4gYWRkaXRpb24gdG8gdGhlIGBhY2NvdW50YCwgYHByb2plY3RgLCBhbmQgYHJvb3RgLCB0aGUgRGF0YSBTZXJ2aWNlIHBhcmFtZXRlcnMgb3B0aW9uYWxseSBpbmNsdWRlIGEgYHNlcnZlcmAgb2JqZWN0LCB3aG9zZSBgaG9zdGAgZmllbGQgY29udGFpbnMgdGhlIFVSSSBvZiB0aGUgRm9yaW8gc2VydmVyLiBUaGlzIGlzIGF1dG9tYXRpY2FsbHkgc2V0LCBidXQgeW91IGNhbiBwYXNzIGl0IGV4cGxpY2l0bHkgaWYgZGVzaXJlZC4gSXQgaXMgbW9zdCBjb21tb25seSB1c2VkIGZvciBjbGFyaXR5IHdoZW4geW91IGFyZSBbaG9zdGluZyBhbiBFcGljZW50ZXIgcHJvamVjdCBvbiB5b3VyIG93biBzZXJ2ZXJdKC4uLy4uLy4uL2hvd190by9zZWxmX2hvc3RpbmcvKS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBTdG9yYWdlRmFjdG9yeSA9IHJlcXVpcmUoJy4uL3N0b3JlL3N0b3JlLWZhY3RvcnknKTtcbnZhciBxdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvcXVlcnktdXRpbCcpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgc3RvcmUgPSBuZXcgU3RvcmFnZUZhY3RvcnkoeyBzeW5jaHJvbm91czogdHJ1ZSB9KTtcblxuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIE5hbWUgb2YgY29sbGVjdGlvbi4gRGVmYXVsdHMgdG8gYC9gLCB0aGF0IGlzLCB0aGUgcm9vdCBsZXZlbCBvZiB5b3VyIHByb2plY3QgYXQgYGZvcmlvLmNvbS9hcHAveW91ci1hY2NvdW50LWlkL3lvdXItcHJvamVjdC1pZC9gLiBSZXF1aXJlZC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHJvb3Q6ICcvJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGFjY291bnQgaWQuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcHJvamVjdCBpZC4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgVVJMLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcHJvamVjdDogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvciBvcGVyYXRpb25zIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZykuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdG9rZW46IHN0b3JlLmdldCgnZXBpY2VudGVyLnByb2plY3QudG9rZW4nKSB8fCAnJyxcblxuICAgICAgICBkb21haW46ICdmb3Jpby5jb20nLFxuXG4gICAgICAgIC8vT3B0aW9ucyB0byBwYXNzIG9uIHRvIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBsYXllclxuICAgICAgICB0cmFuc3BvcnQ6IHt9XG4gICAgfTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG5cbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLmFjY291bnQpIHtcbiAgICAgICAgdXJsQ29uZmlnLmFjY291bnRQYXRoID0gc2VydmljZU9wdGlvbnMuYWNjb3VudDtcbiAgICB9XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnByb2plY3QpIHtcbiAgICAgICAgdXJsQ29uZmlnLnByb2plY3RQYXRoID0gc2VydmljZU9wdGlvbnMucHJvamVjdDtcbiAgICB9XG5cbiAgICB2YXIgZ2V0VVJMID0gZnVuY3Rpb24gKGtleSwgcm9vdCkge1xuICAgICAgICBpZiAoIXJvb3QpIHtcbiAgICAgICAgICAgIHJvb3QgPSBzZXJ2aWNlT3B0aW9ucy5yb290O1xuICAgICAgICB9XG4gICAgICAgIHZhciB1cmwgPSB1cmxDb25maWcuZ2V0QVBJUGF0aCgnZGF0YScpICsgcXV0aWwuYWRkVHJhaWxpbmdTbGFzaChyb290KTtcbiAgICAgICAgaWYgKGtleSkge1xuICAgICAgICAgICAgdXJsKz0gcXV0aWwuYWRkVHJhaWxpbmdTbGFzaChrZXkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfTtcblxuICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgdXJsOiBnZXRVUkxcbiAgICB9KTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgaHR0cE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeShodHRwT3B0aW9ucyk7XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZWFyY2ggZm9yIGRhdGEgd2l0aGluIGEgY29sbGVjdGlvbi5cbiAgICAgICAgICpcbiAgICAgICAgICogU2VhcmNoaW5nIHVzaW5nIGNvbXBhcmlzb24gb3IgbG9naWNhbCBvcGVyYXRvcnMgKGFzIG9wcG9zZWQgdG8gZXhhY3QgbWF0Y2hlcykgcmVxdWlyZXMgTW9uZ29EQiBzeW50YXguIFNlZSB0aGUgdW5kZXJseWluZyBbRGF0YSBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9kYXRhX2FwaS8jc2VhcmNoaW5nKSBmb3IgYWRkaXRpb25hbCBkZXRhaWxzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGVzKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyByZXF1ZXN0IGFsbCBkYXRhIGFzc29jaWF0ZWQgd2l0aCBkb2N1bWVudCAndXNlcjEnXG4gICAgICAgICAqICAgICAgZHMucXVlcnkoJ3VzZXIxJyk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gZXhhY3QgbWF0Y2hpbmc6XG4gICAgICAgICAqICAgICAgLy8gcmVxdWVzdCBhbGwgZG9jdW1lbnRzIGluIGNvbGxlY3Rpb24gd2hlcmUgJ3F1ZXN0aW9uMicgaXMgOVxuICAgICAgICAgKiAgICAgIGRzLnF1ZXJ5KCcnLCB7ICdxdWVzdGlvbjInOiA5fSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gY29tcGFyaXNvbiBvcGVyYXRvcnM6XG4gICAgICAgICAqICAgICAgLy8gcmVxdWVzdCBhbGwgZG9jdW1lbnRzIGluIGNvbGxlY3Rpb25cbiAgICAgICAgICogICAgICAvLyB3aGVyZSAncXVlc3Rpb24yJyBpcyBncmVhdGVyIHRoYW4gOVxuICAgICAgICAgKiAgICAgIGRzLnF1ZXJ5KCcnLCB7ICdxdWVzdGlvbjInOiB7ICckZ3QnOiA5fSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyBsb2dpY2FsIG9wZXJhdG9yczpcbiAgICAgICAgICogICAgICAvLyByZXF1ZXN0IGFsbCBkb2N1bWVudHMgaW4gY29sbGVjdGlvblxuICAgICAgICAgKiAgICAgIC8vIHdoZXJlICdxdWVzdGlvbjInIGlzIGxlc3MgdGhhbiAxMCwgYW5kICdxdWVzdGlvbjMnIGlzIGZhbHNlXG4gICAgICAgICAqICAgICAgZHMucXVlcnkoJycsIHsgJyRhbmQnOiBbIHsgJ3F1ZXN0aW9uMic6IHsgJyRsdCc6MTB9IH0sIHsgJ3F1ZXN0aW9uMyc6IGZhbHNlIH1dIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIHJlZ3VsYXIgZXhwcmVzc3Npb25zOiB1c2UgYW55IFBlcmwtY29tcGF0aWJsZSByZWd1bGFyIGV4cHJlc3Npb25zXG4gICAgICAgICAqICAgICAgLy8gcmVxdWVzdCBhbGwgZG9jdW1lbnRzIGluIGNvbGxlY3Rpb25cbiAgICAgICAgICogICAgICAvLyB3aGVyZSAncXVlc3Rpb241JyBjb250YWlucyB0aGUgc3RyaW5nICcuKmRheSdcbiAgICAgICAgICogICAgICBkcy5xdWVyeSgnJywgeyAncXVlc3Rpb241JzogeyAnJHJlZ2V4JzogJy4qZGF5JyB9IH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gYGtleWAgVGhlIG5hbWUgb2YgdGhlIGRvY3VtZW50IHRvIHNlYXJjaC4gUGFzcyB0aGUgZW1wdHkgc3RyaW5nICgnJykgdG8gc2VhcmNoIHRoZSBlbnRpcmUgY29sbGVjdGlvbi5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBxdWVyeWAgVGhlIHF1ZXJ5IG9iamVjdC4gRm9yIGV4YWN0IG1hdGNoaW5nLCB0aGlzIG9iamVjdCBjb250YWlucyB0aGUgZmllbGQgbmFtZSBhbmQgZmllbGQgdmFsdWUgdG8gbWF0Y2guIEZvciBtYXRjaGluZyBiYXNlZCBvbiBjb21wYXJpc29uLCB0aGlzIG9iamVjdCBjb250YWlucyB0aGUgZmllbGQgbmFtZSBhbmQgdGhlIGNvbXBhcmlzb24gZXhwcmVzc2lvbi4gRm9yIG1hdGNoaW5nIGJhc2VkIG9uIGxvZ2ljYWwgb3BlcmF0b3JzLCB0aGlzIG9iamVjdCBjb250YWlucyBhbiBleHByZXNzaW9uIHVzaW5nIE1vbmdvREIgc3ludGF4LiBTZWUgdGhlIHVuZGVybHlpbmcgW0RhdGEgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvZGF0YV9hcGkvI3NlYXJjaGluZykgZm9yIGFkZGl0aW9uYWwgZXhhbXBsZXMuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3V0cHV0TW9kaWZpZXJgIChPcHRpb25hbCkgQXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICpcbiAgICAgICAgICovXG4gICAgICAgIHF1ZXJ5OiBmdW5jdGlvbiAoa2V5LCBxdWVyeSwgb3V0cHV0TW9kaWZpZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSAkLmV4dGVuZCh0cnVlLCB7IHE6IHF1ZXJ5IH0sIG91dHB1dE1vZGlmaWVyKTtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBodHRwT3B0aW9ucy51cmwgPSBnZXRVUkwoa2V5LCBodHRwT3B0aW9ucy5yb290KTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChwYXJhbXMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2F2ZSBkYXRhIHRvIGFuIGFub255bW91cyBkb2N1bWVudCB3aXRoaW4gdGhlIGNvbGxlY3Rpb24uXG4gICAgICAgICAqXG4gICAgICAgICAqIChEb2N1bWVudHMgYXJlIHRvcC1sZXZlbCBlbGVtZW50cyB3aXRoaW4gYSBjb2xsZWN0aW9uLiBDb2xsZWN0aW9ucyBtdXN0IGJlIHVuaXF1ZSB3aXRoaW4gdGhpcyBhY2NvdW50ICh0ZWFtIG9yIHBlcnNvbmFsIGFjY291bnQpIGFuZCBwcm9qZWN0IGFuZCBhcmUgc2V0IHdpdGggdGhlIGByb290YCBmaWVsZCBpbiB0aGUgYG9wdGlvbmAgcGFyYW1ldGVyLiBTZWUgdGhlIHVuZGVybHlpbmcgW0RhdGEgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvZGF0YV9hcGkvKSBmb3IgYWRkaXRpb25hbCBiYWNrZ3JvdW5kLilcbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICBkcy5zYXZlKCdxdWVzdGlvbjEnLCAneWVzJyk7XG4gICAgICAgICAqICAgICAgZHMuc2F2ZSh7cXVlc3Rpb24xOid5ZXMnLCBxdWVzdGlvbjI6IDMyIH0pO1xuICAgICAgICAgKiAgICAgIGRzLnNhdmUoeyBuYW1lOidKb2huJywgY2xhc3NOYW1lOiAnQ1MxMDEnIH0sIHsgcm9vdDogJ3N0dWRlbnRzJyB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBga2V5YCBJZiBga2V5YCBpcyBhIHN0cmluZywgaXQgaXMgdGhlIGlkIG9mIHRoZSBlbGVtZW50IHRvIHNhdmUgKGNyZWF0ZSkgaW4gdGhpcyBkb2N1bWVudC4gSWYgYGtleWAgaXMgYW4gb2JqZWN0LCB0aGUgb2JqZWN0IGlzIHRoZSBkYXRhIHRvIHNhdmUgKGNyZWF0ZSkgaW4gdGhpcyBkb2N1bWVudC4gSW4gYm90aCBjYXNlcywgdGhlIGlkIGZvciB0aGUgZG9jdW1lbnQgaXMgZ2VuZXJhdGVkIGF1dG9tYXRpY2FsbHkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgdmFsdWVgIChPcHRpb25hbCkgVGhlIGRhdGEgdG8gc2F2ZS4gSWYgYGtleWAgaXMgYSBzdHJpbmcsIHRoaXMgaXMgdGhlIHZhbHVlIHRvIHNhdmUuIElmIGBrZXlgIGlzIGFuIG9iamVjdCwgdGhlIHZhbHVlKHMpIHRvIHNhdmUgYXJlIGFscmVhZHkgcGFydCBvZiBga2V5YCBhbmQgdGhpcyBhcmd1bWVudCBpcyBub3QgcmVxdWlyZWQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIHNhdmU6IGZ1bmN0aW9uIChrZXksIHZhbHVlLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgYXR0cnM7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBhdHRycyA9IGtleTtcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIChhdHRycyA9IHt9KVtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaHR0cE9wdGlvbnMudXJsID0gZ2V0VVJMKCcnLCBodHRwT3B0aW9ucy5yb290KTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChhdHRycywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTYXZlIGRhdGEgdG8gYSBuYW1lZCBkb2N1bWVudCBvciBlbGVtZW50IHdpdGhpbiB0aGUgY29sbGVjdGlvbi4gVGhlIGByb290YCBvZiB0aGUgY29sbGVjdGlvbiBtdXN0IGJlIHNwZWNpZmllZCBzZXBhcmF0ZWx5IGluIGNvbmZpZ3VyYXRpb24gb3B0aW9ucywgZWl0aGVyIGFzIHBhcnQgb2YgdGhlIGNhbGwgb3IgYXMgcGFydCBvZiB0aGUgaW5pdGlhbGl6YXRpb24gb2YgZHMuXG4gICAgICAgICAqXG4gICAgICAgICAqIChEb2N1bWVudHMgYXJlIHRvcC1sZXZlbCBlbGVtZW50cyB3aXRoaW4gYSBjb2xsZWN0aW9uLiBDb2xsZWN0aW9ucyBtdXN0IGJlIHVuaXF1ZSB3aXRoaW4gdGhpcyBhY2NvdW50ICh0ZWFtIG9yIHBlcnNvbmFsIGFjY291bnQpIGFuZCBwcm9qZWN0IGFuZCBhcmUgc2V0IHdpdGggdGhlIGByb290YCBmaWVsZCBpbiB0aGUgYG9wdGlvbmAgcGFyYW1ldGVyLiBTZWUgdGhlIHVuZGVybHlpbmcgW0RhdGEgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvZGF0YV9hcGkvKSBmb3IgYWRkaXRpb25hbCBiYWNrZ3JvdW5kLilcbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICBkcy5zYXZlQXMoJ3VzZXIxJyxcbiAgICAgICAgICogICAgICAgICAgeyAncXVlc3Rpb24xJzogMiwgJ3F1ZXN0aW9uMic6IDEwLFxuICAgICAgICAgKiAgICAgICAgICAgJ3F1ZXN0aW9uMyc6IGZhbHNlLCAncXVlc3Rpb240JzogJ3NvbWV0aW1lcycgfSApO1xuICAgICAgICAgKiAgICAgIGRzLnNhdmVBcygnc3R1ZGVudDEnLFxuICAgICAgICAgKiAgICAgICAgICB7IGZpcnN0TmFtZTogJ2pvaG4nLCBsYXN0TmFtZTogJ3NtaXRoJyB9LFxuICAgICAgICAgKiAgICAgICAgICB7IHJvb3Q6ICdzdHVkZW50cycgfSk7XG4gICAgICAgICAqICAgICAgZHMuc2F2ZUFzKCdtZ210MTAwL2dyb3VwQicsXG4gICAgICAgICAqICAgICAgICAgIHsgc2NlbmFyaW9ZZWFyOiAnMjAxNScgfSxcbiAgICAgICAgICogICAgICAgICAgeyByb290OiAnbXljbGFzc2VzJyB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGBrZXlgIElkIG9mIHRoZSBkb2N1bWVudC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGB2YWx1ZWAgKE9wdGlvbmFsKSBUaGUgZGF0YSB0byBzYXZlLCBpbiBrZXk6dmFsdWUgcGFpcnMuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIHNhdmVBczogZnVuY3Rpb24gKGtleSwgdmFsdWUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBodHRwT3B0aW9ucy51cmwgPSBnZXRVUkwoa2V5LCBodHRwT3B0aW9ucy5yb290KTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucHV0KHZhbHVlLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBkYXRhIGZvciBhIHNwZWNpZmljIGRvY3VtZW50IG9yIGZpZWxkLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIGRzLmxvYWQoJ3VzZXIxJyk7XG4gICAgICAgICAqICAgICAgZHMubG9hZCgndXNlcjEvcXVlc3Rpb24zJyk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSAge1N0cmluZ3xPYmplY3R9IGBrZXlgIFRoZSBpZCBvZiB0aGUgZGF0YSB0byByZXR1cm4uIENhbiBiZSB0aGUgaWQgb2YgYSBkb2N1bWVudCwgb3IgYSBwYXRoIHRvIGRhdGEgd2l0aGluIHRoYXQgZG9jdW1lbnQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3V0cHV0TW9kaWZpZXJgIChPcHRpb25hbCkgQXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICBsb2FkOiBmdW5jdGlvbiAoa2V5LCBvdXRwdXRNb2RpZmllciwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGh0dHBPcHRpb25zLnVybCA9IGdldFVSTChrZXksIGh0dHBPcHRpb25zLnJvb3QpO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KG91dHB1dE1vZGlmaWVyLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZXMgZGF0YSBmcm9tIGNvbGxlY3Rpb24uIE9ubHkgZG9jdW1lbnRzICh0b3AtbGV2ZWwgZWxlbWVudHMgaW4gZWFjaCBjb2xsZWN0aW9uKSBjYW4gYmUgZGVsZXRlZC5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIGRzLnJlbW92ZSgndXNlcjEnKTtcbiAgICAgICAgICpcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd8QXJyYXl9IGBrZXlzYCBUaGUgaWQgb2YgdGhlIGRvY3VtZW50IHRvIHJlbW92ZSBmcm9tIHRoaXMgY29sbGVjdGlvbiwgb3IgYW4gYXJyYXkgb2Ygc3VjaCBpZHMuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24gKGtleXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgcGFyYW1zO1xuICAgICAgICAgICAgaWYgKCQuaXNBcnJheShrZXlzKSkge1xuICAgICAgICAgICAgICAgIHBhcmFtcyA9IHsgaWQ6IGtleXMgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zID0gJyc7XG4gICAgICAgICAgICAgICAgaHR0cE9wdGlvbnMudXJsID0gZ2V0VVJMKGtleXMsIGh0dHBPcHRpb25zLnJvb3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZGVsZXRlKHBhcmFtcywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRXBpY2VudGVyIGRvZXNuJ3QgYWxsb3cgbnVraW5nIGNvbGxlY3Rpb25zXG4gICAgICAgIC8vICAgICAvKipcbiAgICAgICAgLy8gICAgICAqIFJlbW92ZXMgY29sbGVjdGlvbiBiZWluZyByZWZlcmVuY2VkXG4gICAgICAgIC8vICAgICAgKiBAcmV0dXJuIG51bGxcbiAgICAgICAgLy8gICAgICAqL1xuICAgICAgICAvLyAgICAgZGVzdHJveTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgLy8gICAgICAgICByZXR1cm4gdGhpcy5yZW1vdmUoJycsIG9wdGlvbnMpO1xuICAgICAgICAvLyAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIi8qKlxuICpcbiAqICMjTWVtYmVyIEFQSSBBZGFwdGVyXG4gKlxuICogVGhlIE1lbWJlciBBUEkgQWRhcHRlciBwcm92aWRlcyBtZXRob2RzIHRvIGxvb2sgdXAgaW5mb3JtYXRpb24gYWJvdXQgZW5kIHVzZXJzIGZvciB5b3VyIHByb2plY3QgYW5kIGhvdyB0aGV5IGFyZSBkaXZpZGVkIGFjcm9zcyBncm91cHMuIEl0IGlzIGJhc2VkIG9uIHF1ZXJ5IGNhcGFiaWxpdGllcyBvZiB0aGUgdW5kZXJseWluZyBSRVNUZnVsIFtNZW1iZXIgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvdXNlcl9tYW5hZ2VtZW50L21lbWJlci8pLlxuICpcbiAqIFRoaXMgaXMgb25seSBuZWVkZWQgZm9yIEF1dGhlbnRpY2F0ZWQgcHJvamVjdHMsIHRoYXQgaXMsIHRlYW0gcHJvamVjdHMgd2l0aCBbZW5kIHVzZXJzIGFuZCBncm91cHNdKC4uLy4uLy4uL2dyb3Vwc19hbmRfZW5kX3VzZXJzLykuIEZvciBleGFtcGxlLCBpZiBzb21lIG9mIHlvdXIgZW5kIHVzZXJzIGFyZSBmYWNpbGl0YXRvcnMsIG9yIGlmIHlvdXIgZW5kIHVzZXJzIHNob3VsZCBiZSB0cmVhdGVkIGRpZmZlcmVudGx5IGJhc2VkIG9uIHdoaWNoIGdyb3VwIHRoZXkgYXJlIGluLCB1c2UgdGhlIE1lbWJlciBBUEkgdG8gZmluZCB0aGF0IGluZm9ybWF0aW9uLlxuICpcbiAqICAgICAgdmFyIG1hID0gbmV3IEYuc2VydmljZS5NZW1iZXIoeyB0b2tlbjogJ3VzZXItb3ItcHJvamVjdC1hY2Nlc3MtdG9rZW4nIH0pO1xuICogICAgICBtYS5nZXRHcm91cHNGb3JVc2VyKHsgdXNlcklkOiAnYjZiMzEzYTMtYWI4NC00NzljLWJhZWEtMjA2ZjZiZmYzMzcnIH0pO1xuICogICAgICBtYS5nZXRHcm91cERldGFpbHMoeyBncm91cElkOiAnMDBiNTMzMDgtOTgzMy00N2YyLWIyMWUtMTI3OGMwN2Q1M2I4JyB9KTtcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbnZhciBfcGljayA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0LXV0aWwnKS5fcGljaztcbnZhciBhcGlFbmRwb2ludCA9ICdtZW1iZXIvbG9jYWwnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFcGljZW50ZXIgdXNlciBpZC4gRGVmYXVsdHMgdG8gYSBibGFuayBzdHJpbmcuXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB1c2VySWQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFcGljZW50ZXIgZ3JvdXAgaWQuIERlZmF1bHRzIHRvIGEgYmxhbmsgc3RyaW5nLiBOb3RlIHRoYXQgdGhpcyBpcyB0aGUgZ3JvdXAgKmlkKiwgbm90IHRoZSBncm91cCAqbmFtZSouXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBncm91cElkOiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucyB0byBwYXNzIG9uIHRvIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBsYXllci4gQWxsIGpxdWVyeS5hamF4IG9wdGlvbnMgYXQgaHR0cDovL2FwaS5qcXVlcnkuY29tL2pRdWVyeS5hamF4LyBhcmUgYXZhaWxhYmxlLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IHt9XG4gICAgfTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgdmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKHNlcnZpY2VPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuXG4gICAgdmFyIHRyYW5zcG9ydE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpXG4gICAgfSk7XG5cbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgdHJhbnNwb3J0T3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBzZXJ2aWNlT3B0aW9ucy50b2tlblxuICAgICAgICB9O1xuICAgIH1cbiAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KHRyYW5zcG9ydE9wdGlvbnMsIHNlcnZpY2VPcHRpb25zKTtcblxuICAgIHZhciBnZXRGaW5hbFBhcmFtcyA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwYXJhbXMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICByZXR1cm4gJC5leHRlbmQodHJ1ZSwgc2VydmljZU9wdGlvbnMsIHBhcmFtcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNlcnZpY2VPcHRpb25zO1xuICAgIH07XG5cbiAgICB2YXIgcGF0Y2hVc2VyQWN0aXZlRmllbGQgPSBmdW5jdGlvbiAocGFyYW1zLCBhY3RpdmUsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMsIHtcbiAgICAgICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgcGFyYW1zLmdyb3VwSWQgKyAnLycgKyBwYXJhbXMudXNlcklkXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBodHRwLnBhdGNoKHsgYWN0aXZlOiBhY3RpdmUgfSwgaHR0cE9wdGlvbnMpO1xuICAgIH07XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFJldHJpZXZlIGRldGFpbHMgYWJvdXQgYWxsIG9mIHRoZSBncm91cCBtZW1iZXJzaGlwcyBmb3Igb25lIGVuZCB1c2VyLiBUaGUgbWVtYmVyc2hpcCBkZXRhaWxzIGFyZSByZXR1cm5lZCBpbiBhbiBhcnJheSwgd2l0aCBvbmUgZWxlbWVudCAoZ3JvdXAgcmVjb3JkKSBmb3IgZWFjaCBncm91cCB0byB3aGljaCB0aGUgZW5kIHVzZXIgYmVsb25ncy5cbiAgICAgICAgKlxuICAgICAgICAqIEluIHRoZSBtZW1iZXJzaGlwIGFycmF5LCBlYWNoIGdyb3VwIHJlY29yZCBpbmNsdWRlcyB0aGUgZ3JvdXAgaWQsIHByb2plY3QgaWQsIGFjY291bnQgKHRlYW0pIGlkLCBhbmQgYW4gYXJyYXkgb2YgbWVtYmVycy4gSG93ZXZlciwgb25seSB0aGUgdXNlciB3aG9zZSB1c2VySWQgaXMgaW5jbHVkZWQgaW4gdGhlIGNhbGwgaXMgbGlzdGVkIGluIHRoZSBtZW1iZXJzIGFycmF5IChyZWdhcmRsZXNzIG9mIHdoZXRoZXIgdGhlcmUgYXJlIG90aGVyIG1lbWJlcnMgaW4gdGhpcyBncm91cCkuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgdmFyIG1hID0gbmV3IEYuc2VydmljZS5NZW1iZXIoeyB0b2tlbjogJ3VzZXItb3ItcHJvamVjdC1hY2Nlc3MtdG9rZW4nIH0pO1xuICAgICAgICAqICAgICAgIG1hLmdldEdyb3Vwc0ZvclVzZXIoJzQyODM2ZDRiLTViNjEtNGZlNC04MGViLTMxMzZlOTU2ZWU1YycpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKG1lbWJlcnNoaXBzKXtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxtZW1iZXJzaGlwcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAqICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKG1lbWJlcnNoaXBzW2ldLmdyb3VwSWQpO1xuICAgICAgICAqICAgICAgICAgICAgICAgfVxuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIG1hLmdldEdyb3Vwc0ZvclVzZXIoeyB1c2VySWQ6ICc0MjgzNmQ0Yi01YjYxLTRmZTQtODBlYi0zMTM2ZTk1NmVlNWMnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ3xvYmplY3R9IGBwYXJhbXNgIFRoZSB1c2VyIGlkIGZvciB0aGUgZW5kIHVzZXIuIEFsdGVybmF0aXZlbHksIGFuIG9iamVjdCB3aXRoIGZpZWxkIGB1c2VySWRgIGFuZCB2YWx1ZSB0aGUgdXNlciBpZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICovXG5cbiAgICAgICAgZ2V0R3JvdXBzRm9yVXNlcjogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgaXNTdHJpbmcgPSB0eXBlb2YgcGFyYW1zID09PSAnc3RyaW5nJztcbiAgICAgICAgICAgIHZhciBvYmpQYXJhbXMgPSBnZXRGaW5hbFBhcmFtcyhwYXJhbXMpO1xuICAgICAgICAgICAgaWYgKCFpc1N0cmluZyAmJiAhb2JqUGFyYW1zLnVzZXJJZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gdXNlcklkIHNwZWNpZmllZC4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGdldFBhcm1zID0gaXNTdHJpbmcgPyB7IHVzZXJJZDogcGFyYW1zIH0gOiBfcGljayhvYmpQYXJhbXMsICd1c2VySWQnKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChnZXRQYXJtcywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFJldHJpZXZlIGRldGFpbHMgYWJvdXQgb25lIGdyb3VwLCBpbmNsdWRpbmcgYW4gYXJyYXkgb2YgYWxsIGl0cyBtZW1iZXJzLlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIHZhciBtYSA9IG5ldyBGLnNlcnZpY2UuTWVtYmVyKHsgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJyB9KTtcbiAgICAgICAgKiAgICAgICBtYS5nZXRHcm91cERldGFpbHMoJzgwMjU3YTI1LWFhMTAtNDk1OS05NjhiLWZkMDUzOTAxZjcyZicpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGdyb3VwKXtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxncm91cC5tZW1iZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICogICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZ3JvdXAubWVtYmVyc1tpXS51c2VyTmFtZSk7XG4gICAgICAgICogICAgICAgICAgICAgICB9XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICAgbWEuZ2V0R3JvdXBEZXRhaWxzKHsgZ3JvdXBJZDogJzgwMjU3YTI1LWFhMTAtNDk1OS05NjhiLWZkMDUzOTAxZjcyZicgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfG9iamVjdH0gYHBhcmFtc2AgVGhlIGdyb3VwIGlkLiBBbHRlcm5hdGl2ZWx5LCBhbiBvYmplY3Qgd2l0aCBmaWVsZCBgZ3JvdXBJZGAgYW5kIHZhbHVlIHRoZSBncm91cCBpZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICovXG4gICAgICAgIGdldEdyb3VwRGV0YWlsczogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICB2YXIgaXNTdHJpbmcgPSB0eXBlb2YgcGFyYW1zID09PSAnc3RyaW5nJztcbiAgICAgICAgICAgIHZhciBvYmpQYXJhbXMgPSBnZXRGaW5hbFBhcmFtcyhwYXJhbXMpO1xuICAgICAgICAgICAgaWYgKCFpc1N0cmluZyAmJiAhb2JqUGFyYW1zLmdyb3VwSWQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGdyb3VwSWQgc3BlY2lmaWVkLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZ3JvdXBJZCA9IGlzU3RyaW5nID8gcGFyYW1zIDogb2JqUGFyYW1zLmdyb3VwSWQ7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBncm91cElkIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldCh7fSwgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFNldCBhIHBhcnRpY3VsYXIgZW5kIHVzZXIgYXMgYGFjdGl2ZWAuIEFjdGl2ZSBlbmQgdXNlcnMgY2FuIGJlIGFzc2lnbmVkIHRvIFt3b3JsZHNdKC4uL3dvcmxkLW1hbmFnZXIvKSBpbiBtdWx0aXBsYXllciBnYW1lcyBkdXJpbmcgYXV0b21hdGljIGFzc2lnbm1lbnQuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgdmFyIG1hID0gbmV3IEYuc2VydmljZS5NZW1iZXIoeyB0b2tlbjogJ3VzZXItb3ItcHJvamVjdC1hY2Nlc3MtdG9rZW4nIH0pO1xuICAgICAgICAqICAgICAgIG1hLm1ha2VVc2VyQWN0aXZlKHsgdXNlcklkOiAnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyxcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwSWQ6ICc4MDI1N2EyNS1hYTEwLTQ5NTktOTY4Yi1mZDA1MzkwMWY3MmYnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYHBhcmFtc2AgVGhlIGVuZCB1c2VyIGFuZCBncm91cCBpbmZvcm1hdGlvbi5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYHBhcmFtcy51c2VySWRgIFRoZSBpZCBvZiB0aGUgZW5kIHVzZXIgdG8gbWFrZSBhY3RpdmUuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGBwYXJhbXMuZ3JvdXBJZGAgVGhlIGlkIG9mIHRoZSBncm91cCB0byB3aGljaCB0aGlzIGVuZCB1c2VyIGJlbG9uZ3MsIGFuZCBpbiB3aGljaCB0aGUgZW5kIHVzZXIgc2hvdWxkIGJlY29tZSBhY3RpdmUuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAqL1xuICAgICAgICBtYWtlVXNlckFjdGl2ZTogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHBhdGNoVXNlckFjdGl2ZUZpZWxkKHBhcmFtcywgdHJ1ZSwgb3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogU2V0IGEgcGFydGljdWxhciBlbmQgdXNlciBhcyBgaW5hY3RpdmVgLiBJbmFjdGl2ZSBlbmQgdXNlcnMgYXJlIG5vdCBhc3NpZ25lZCB0byBbd29ybGRzXSguLi93b3JsZC1tYW5hZ2VyLykgaW4gbXVsdGlwbGF5ZXIgZ2FtZXMgZHVyaW5nIGF1dG9tYXRpYyBhc3NpZ25tZW50LlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIHZhciBtYSA9IG5ldyBGLnNlcnZpY2UuTWVtYmVyKHsgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJyB9KTtcbiAgICAgICAgKiAgICAgICBtYS5tYWtlVXNlckluYWN0aXZlKHsgdXNlcklkOiAnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyxcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwSWQ6ICc4MDI1N2EyNS1hYTEwLTQ5NTktOTY4Yi1mZDA1MzkwMWY3MmYnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYHBhcmFtc2AgVGhlIGVuZCB1c2VyIGFuZCBncm91cCBpbmZvcm1hdGlvbi5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYHBhcmFtcy51c2VySWRgIFRoZSBpZCBvZiB0aGUgZW5kIHVzZXIgdG8gbWFrZSBpbmFjdGl2ZS5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYHBhcmFtcy5ncm91cElkYCBUaGUgaWQgb2YgdGhlIGdyb3VwIHRvIHdoaWNoIHRoaXMgZW5kIHVzZXIgYmVsb25ncywgYW5kIGluIHdoaWNoIHRoZSBlbmQgdXNlciBzaG91bGQgYmVjb21lIGluYWN0aXZlLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgKi9cbiAgICAgICAgbWFrZVVzZXJJbmFjdGl2ZTogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHBhdGNoVXNlckFjdGl2ZUZpZWxkKHBhcmFtcywgZmFsc2UsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiLyoqXG4gKlxuICogIyNSdW4gQVBJIFNlcnZpY2VcbiAqXG4gKiBUaGUgUnVuIEFQSSBTZXJ2aWNlIGFsbG93cyB5b3UgdG8gcGVyZm9ybSBjb21tb24gdGFza3MgYXJvdW5kIGNyZWF0aW5nIGFuZCB1cGRhdGluZyBydW5zLCB2YXJpYWJsZXMsIGFuZCBkYXRhLlxuICpcbiAqIFdoZW4gYnVpbGRpbmcgaW50ZXJmYWNlcyB0byBzaG93IHJ1biBvbmUgYXQgYSB0aW1lIChhcyBmb3Igc3RhbmRhcmQgZW5kIHVzZXJzKSwgdHlwaWNhbGx5IHlvdSBmaXJzdCBpbnN0YW50aWF0ZSBhIFtSdW4gTWFuYWdlcl0oLi4vcnVuLW1hbmFnZXIvKSBhbmQgdGhlbiBhY2Nlc3MgdGhlIFJ1biBTZXJ2aWNlIHRoYXQgaXMgYXV0b21hdGljYWxseSBwYXJ0IG9mIHRoZSBtYW5hZ2VyLCByYXRoZXIgdGhhbiBpbnN0YW50aWF0aW5nIHRoZSBSdW4gU2VydmljZSBkaXJlY3RseS4gVGhpcyBpcyBiZWNhdXNlIHRoZSBSdW4gTWFuYWdlciBnaXZlcyB5b3UgY29udHJvbCBvdmVyIHJ1biBjcmVhdGlvbiBkZXBlbmRpbmcgb24gcnVuIHN0YXRlcy5cbiAqXG4gKiBIb3dldmVyLCBtYW55IG9mIHRoZSBFcGljZW50ZXIgc2FtcGxlIHByb2plY3RzIHVzZSBhIFJ1biBTZXJ2aWNlLCBiZWNhdXNlIGdlbmVyYWxseSB0aGUgc2FtcGxlIHByb2plY3RzIGFyZSBwbGF5ZWQgaW4gb25lIGVuZCB1c2VyIHNlc3Npb24gYW5kIGRvbid0IGNhcmUgYWJvdXQgcnVuIHN0YXRlcyBvciBbcnVuIHN0cmF0ZWdpZXNdKC4uLy4uL3N0cmF0ZWd5LykuIFRoZSBSdW4gQVBJIFNlcnZpY2UgaXMgYWxzbyB1c2VmdWwgZm9yIGJ1aWxkaW5nIGFuIGludGVyZmFjZSBmb3IgYSBmYWNpbGl0YXRvciwgYmVjYXVzZSBpdCBtYWtlcyBpdCBlYXN5IHRvIGxpc3QgZGF0YSBhY3Jvc3MgbXVsdGlwbGUgcnVucyAodXNpbmcgdGhlIGBmaWx0ZXIoKWAgYW5kIGBxdWVyeSgpYCBtZXRob2RzKS5cbiAqXG4gKiBUbyB1c2UgdGhlIFJ1biBBUEkgU2VydmljZSwgaW5zdGFudGlhdGUgaXQgYnkgcGFzc2luZyBpbjpcbiAqXG4gKiAqIGBhY2NvdW50YDogRXBpY2VudGVyIGFjY291bnQgaWQgKCoqVGVhbSBJRCoqIGZvciB0ZWFtIHByb2plY3RzLCAqKlVzZXIgSUQqKiBmb3IgcGVyc29uYWwgcHJvamVjdHMpLlxuICogKiBgcHJvamVjdGA6IEVwaWNlbnRlciBwcm9qZWN0IGlkLlxuICpcbiAqIEZvciBleGFtcGxlLFxuICpcbiAqICAgICAgIHZhciBycyA9IG5ldyBGLnNlcnZpY2UuUnVuKHtcbiAqICAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICogICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICogICAgICB9KTtcbiAqICAgICAgcnMuY3JlYXRlKCdzdXBwbHlfY2hhaW5fZ2FtZS5weScpLnRoZW4oZnVuY3Rpb24ocnVuKSB7XG4gKiAgICAgICAgICAgICBycy5kbygnc29tZU9wZXJhdGlvbicpO1xuICogICAgICB9KTtcbiAqXG4gKlxuICogQWRkaXRpb25hbGx5LCBhbGwgQVBJIGNhbGxzIHRha2UgaW4gYW4gXCJvcHRpb25zXCIgb2JqZWN0IGFzIHRoZSBsYXN0IHBhcmFtZXRlci4gVGhlIG9wdGlvbnMgY2FuIGJlIHVzZWQgdG8gZXh0ZW5kL292ZXJyaWRlIHRoZSBSdW4gQVBJIFNlcnZpY2UgZGVmYXVsdHMgbGlzdGVkIGJlbG93LlxuICpcbiAqIE5vdGUgdGhhdCBpbiBhZGRpdGlvbiB0byB0aGUgYGFjY291bnRgLCBgcHJvamVjdGAsIGFuZCBgbW9kZWxgLCB0aGUgUnVuIFNlcnZpY2UgcGFyYW1ldGVycyBvcHRpb25hbGx5IGluY2x1ZGUgYSBgc2VydmVyYCBvYmplY3QsIHdob3NlIGBob3N0YCBmaWVsZCBjb250YWlucyB0aGUgVVJJIG9mIHRoZSBGb3JpbyBzZXJ2ZXIuIFRoaXMgaXMgYXV0b21hdGljYWxseSBzZXQsIGJ1dCB5b3UgY2FuIHBhc3MgaXQgZXhwbGljaXRseSBpZiBkZXNpcmVkLiBJdCBpcyBtb3N0IGNvbW1vbmx5IHVzZWQgZm9yIGNsYXJpdHkgd2hlbiB5b3UgYXJlIFtob3N0aW5nIGFuIEVwaWNlbnRlciBwcm9qZWN0IG9uIHlvdXIgb3duIHNlcnZlcl0oLi4vLi4vLi4vaG93X3RvL3NlbGZfaG9zdGluZy8pLlxuICpcbiAqICAgICAgIHZhciBybSA9IG5ldyBGLm1hbmFnZXIuUnVuTWFuYWdlcih7XG4gKiAgICAgICAgICAgcnVuOiB7XG4gKiAgICAgICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAqICAgICAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAqICAgICAgICAgICAgICAgbW9kZWw6ICdzdXBwbHlfY2hhaW5fZ2FtZS5weScsXG4gKiAgICAgICAgICAgICAgIHNlcnZlcjogeyBob3N0OiAnYXBpLmZvcmlvLmNvbScgfVxuICogICAgICAgICAgIH1cbiAqICAgICAgIH0pO1xuICogICAgICAgcm0uZ2V0UnVuKClcbiAqICAgICAgICAgICAudGhlbihmdW5jdGlvbihydW4pIHtcbiAqICAgICAgICAgICAgICAgLy8gdGhlIFJ1bk1hbmFnZXIucnVuIGNvbnRhaW5zIHRoZSBpbnN0YW50aWF0ZWQgUnVuIFNlcnZpY2UsXG4gKiAgICAgICAgICAgICAgIC8vIHNvIGFueSBSdW4gU2VydmljZSBtZXRob2QgaXMgdmFsaWQgaGVyZVxuICogICAgICAgICAgICAgICB2YXIgcnMgPSBybS5ydW47XG4gKiAgICAgICAgICAgICAgIHJzLmRvKCdzb21lT3BlcmF0aW9uJyk7XG4gKiAgICAgICB9KVxuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBTdG9yYWdlRmFjdG9yeSA9IHJlcXVpcmUoJy4uL3N0b3JlL3N0b3JlLWZhY3RvcnknKTtcbnZhciBxdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvcXVlcnktdXRpbCcpO1xudmFyIHJ1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9ydW4tdXRpbCcpO1xudmFyIF9waWNrID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QtdXRpbCcpLl9waWNrO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xudmFyIFZhcmlhYmxlc1NlcnZpY2UgPSByZXF1aXJlKCcuL3ZhcmlhYmxlcy1hcGktc2VydmljZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAvLyBjb25maWcgfHwgKGNvbmZpZyA9IGNvbmZpZ1NlcnZpY2UuZ2V0KCkpO1xuICAgIHZhciBzdG9yZSA9IG5ldyBTdG9yYWdlRmFjdG9yeSh7IHN5bmNocm9ub3VzOiB0cnVlIH0pO1xuXG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRm9yIHByb2plY3RzIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZykuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdG9rZW46IHN0b3JlLmdldCgnZXBpY2VudGVyLnByb2plY3QudG9rZW4nKSB8fCBzdG9yZS5nZXQoJ2VwaWNlbnRlci50b2tlbicpIHx8ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWNjb3VudCBpZC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKSBvciAqKlVzZXIgSUQqKiAoZm9yIHBlcnNvbmFsIHByb2plY3RzKS4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgVVJMLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgYWNjb3VudDogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBwcm9qZWN0IGlkLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBwcm9qZWN0OiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3JpdGVyaWEgYnkgd2hpY2ggdG8gZmlsdGVyIHJ1bnMuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGZpbHRlcjogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbnZlbmllbmNlIGFsaWFzIGZvciBmaWx0ZXIuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBpZDogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZsYWcgZGV0ZXJtaW5lcyBpZiBgWC1BdXRvUmVzdG9yZTogdHJ1ZWAgaGVhZGVyIGlzIHNlbnQgdG8gRXBpY2VudGVyLiBEZWZhdWx0cyB0byBgdHJ1ZWAuXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgYXV0b1Jlc3RvcmU6IHRydWUsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGxlZCB3aGVuIHRoZSBjYWxsIGNvbXBsZXRlcyBzdWNjZXNzZnVsbHkuIERlZmF1bHRzIHRvIGAkLm5vb3BgLlxuICAgICAgICAgKiBAdHlwZSB7ZnVuY3Rpb259XG4gICAgICAgICAqL1xuICAgICAgICBzdWNjZXNzOiAkLm5vb3AsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGxlZCB3aGVuIHRoZSBjYWxsIGZhaWxzLiBEZWZhdWx0cyB0byBgJC5ub29wYC5cbiAgICAgICAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgICAgICAgKi9cbiAgICAgICAgZXJyb3I6ICQubm9vcCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucyB0byBwYXNzIG9uIHRvIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBsYXllci4gQWxsIGpxdWVyeS5hamF4IG9wdGlvbnMgYXQgaHR0cDovL2FwaS5qcXVlcnkuY29tL2pRdWVyeS5hamF4LyBhcmUgYXZhaWxhYmxlLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IHt9XG4gICAgfTtcblxuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMuaWQpIHtcbiAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gc2VydmljZU9wdGlvbnMuaWQ7XG4gICAgfVxuXG4gICAgdmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKHNlcnZpY2VPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy5hY2NvdW50KSB7XG4gICAgICAgIHVybENvbmZpZy5hY2NvdW50UGF0aCA9IHNlcnZpY2VPcHRpb25zLmFjY291bnQ7XG4gICAgfVxuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0KSB7XG4gICAgICAgIHVybENvbmZpZy5wcm9qZWN0UGF0aCA9IHNlcnZpY2VPcHRpb25zLnByb2plY3Q7XG4gICAgfVxuXG4gICAgdXJsQ29uZmlnLmZpbHRlciA9ICc7JztcbiAgICB1cmxDb25maWcuZ2V0RmlsdGVyVVJMID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdXJsID0gdXJsQ29uZmlnLmdldEFQSVBhdGgoJ3J1bicpO1xuICAgICAgICB2YXIgZmlsdGVyID0gcXV0aWwudG9NYXRyaXhGb3JtYXQoc2VydmljZU9wdGlvbnMuZmlsdGVyKTtcblxuICAgICAgICBpZiAoZmlsdGVyKSB7XG4gICAgICAgICAgICB1cmwgKz0gZmlsdGVyICsgJy8nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfTtcblxuICAgIHVybENvbmZpZy5hZGRBdXRvUmVzdG9yZUhlYWRlciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciBmaWx0ZXIgPSBzZXJ2aWNlT3B0aW9ucy5maWx0ZXI7XG4gICAgICAgIC8vIFRoZSBzZW1pY29sb24gc2VwYXJhdGVkIGZpbHRlciBpcyB1c2VkIHdoZW4gZmlsdGVyIGlzIGFuIG9iamVjdFxuICAgICAgICB2YXIgaXNGaWx0ZXJSdW5JZCA9IGZpbHRlciAmJiAkLnR5cGUoZmlsdGVyKSA9PT0gJ3N0cmluZyc7XG4gICAgICAgIGlmIChzZXJ2aWNlT3B0aW9ucy5hdXRvUmVzdG9yZSAmJiBpc0ZpbHRlclJ1bklkKSB7XG4gICAgICAgICAgICAvLyBCeSBkZWZhdWx0IGF1dG9yZXBsYXkgdGhlIHJ1biBieSBzZW5kaW5nIHRoaXMgaGVhZGVyIHRvIGVwaWNlbnRlclxuICAgICAgICAgICAgLy8gaHR0cHM6Ly9mb3Jpby5jb20vZXBpY2VudGVyL2RvY3MvcHVibGljL3Jlc3RfYXBpcy9hZ2dyZWdhdGVfcnVuX2FwaS8jcmV0cmlldmluZ1xuICAgICAgICAgICAgdmFyIGF1dG9yZXN0b3JlT3B0cyA9IHtcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICdYLUF1dG9SZXN0b3JlJzogdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gJC5leHRlbmQodHJ1ZSwgYXV0b3Jlc3RvcmVPcHRzLCBvcHRpb25zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvcHRpb25zO1xuICAgIH07XG5cbiAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogdXJsQ29uZmlnLmdldEZpbHRlclVSTFxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIGh0dHBPcHRpb25zLmhlYWRlcnMgPSB7XG4gICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkoaHR0cE9wdGlvbnMpO1xuICAgIGh0dHAuc3BsaXRHZXQgPSBydXRpbC5zcGxpdEdldEZhY3RvcnkoaHR0cE9wdGlvbnMpO1xuXG4gICAgdmFyIHNldEZpbHRlck9yVGhyb3dFcnJvciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmlkKSB7XG4gICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSBvcHRpb25zLmlkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmZpbHRlcikge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gb3B0aW9ucy5maWx0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFzZXJ2aWNlT3B0aW9ucy5maWx0ZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZmlsdGVyIHNwZWNpZmllZCB0byBhcHBseSBvcGVyYXRpb25zIGFnYWluc3QnKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgcHVibGljQXN5bmNBUEkgPSB7XG4gICAgICAgIHVybENvbmZpZzogdXJsQ29uZmlnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGUgYSBuZXcgcnVuLlxuICAgICAgICAgKlxuICAgICAgICAgKiBOT1RFOiBUeXBpY2FsbHkgdGhpcyBpcyBub3QgdXNlZCEgVXNlIGBSdW5NYW5hZ2VyLmdldFJ1bigpYCB3aXRoIGEgYHN0cmF0ZWd5YCBvZiBgYWx3YXlzLW5ld2AsIG9yIHVzZSBgUnVuTWFuYWdlci5yZXNldCgpYC4gU2VlIFtSdW4gTWFuYWdlcl0oLi4vcnVuLW1hbmFnZXIvKSBmb3IgbW9yZSBkZXRhaWxzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICBycy5jcmVhdGUoJ2hlbGxvX3dvcmxkLmpsJyk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IGBwYXJhbXNgIElmIGEgc3RyaW5nLCB0aGUgbmFtZSBvZiB0aGUgcHJpbWFyeSBbbW9kZWwgZmlsZV0oLi4vLi4vLi4vd3JpdGluZ195b3VyX21vZGVsLykuIFRoaXMgaXMgdGhlIG9uZSBmaWxlIGluIHRoZSBwcm9qZWN0IHRoYXQgZXhwbGljaXRseSBleHBvc2VzIHZhcmlhYmxlcyBhbmQgbWV0aG9kcywgYW5kIGl0IG11c3QgYmUgc3RvcmVkIGluIHRoZSBNb2RlbCBmb2xkZXIgb2YgeW91ciBFcGljZW50ZXIgcHJvamVjdC4gSWYgYW4gb2JqZWN0LCBtYXkgaW5jbHVkZSBgbW9kZWxgLCBgc2NvcGVgLCBhbmQgYGZpbGVzYC4gKFNlZSB0aGUgW1J1biBNYW5hZ2VyXSguLi9ydW5fbWFuYWdlci8pIGZvciBtb3JlIGluZm9ybWF0aW9uIG9uIGBzY29wZWAgYW5kIGBmaWxlc2AuKVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqXG4gICAgICAgICAqL1xuICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBjcmVhdGVPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zLCB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoJ3J1bicpIH0pO1xuICAgICAgICAgICAgdmFyIHJ1bkFwaVBhcmFtcyA9IFsnbW9kZWwnLCAnc2NvcGUnLCAnZmlsZXMnXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyYW1zID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXMganVzdCB0aGUgbW9kZWwgbmFtZVxuICAgICAgICAgICAgICAgIHBhcmFtcyA9IHsgbW9kZWw6IHBhcmFtcyB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyB3aGl0ZWxpc3QgdGhlIGZpZWxkcyB0aGF0IHdlIGFjdHVhbGx5IGNhbiBzZW5kIHRvIHRoZSBhcGlcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSBfcGljayhwYXJhbXMsIHJ1bkFwaVBhcmFtcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBvbGRTdWNjZXNzID0gY3JlYXRlT3B0aW9ucy5zdWNjZXNzO1xuICAgICAgICAgICAgY3JlYXRlT3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gcmVzcG9uc2UuaWQ7IC8vYWxsIGZ1dHVyZSBjaGFpbmVkIGNhbGxzIHRvIG9wZXJhdGUgb24gdGhpcyBpZFxuICAgICAgICAgICAgICAgIHJldHVybiBvbGRTdWNjZXNzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHBhcmFtcywgY3JlYXRlT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgcGFydGljdWxhciBydW5zLCBiYXNlZCBvbiBjb25kaXRpb25zIHNwZWNpZmllZCBpbiB0aGUgYHFzYCBvYmplY3QuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBlbGVtZW50cyBvZiB0aGUgYHFzYCBvYmplY3QgYXJlIEFORGVkIHRvZ2V0aGVyIHdpdGhpbiBhIHNpbmdsZSBjYWxsIHRvIGAucXVlcnkoKWAuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gcmV0dXJucyBydW5zIHdpdGggc2F2ZWQgPSB0cnVlIGFuZCB2YXJpYWJsZXMucHJpY2UgPiAxLFxuICAgICAgICAgKiAgICAgIC8vIHdoZXJlIHZhcmlhYmxlcy5wcmljZSBoYXMgYmVlbiBwZXJzaXN0ZWQgKHJlY29yZGVkKVxuICAgICAgICAgKiAgICAgIC8vIGluIHRoZSBtb2RlbC5cbiAgICAgICAgICogICAgIHJzLnF1ZXJ5KHtcbiAgICAgICAgICogICAgICAgICAgJ3NhdmVkJzogJ3RydWUnLFxuICAgICAgICAgKiAgICAgICAgICAnLnByaWNlJzogJz4xJ1xuICAgICAgICAgKiAgICAgICB9LFxuICAgICAgICAgKiAgICAgICB7XG4gICAgICAgICAqICAgICAgICAgIHN0YXJ0cmVjb3JkOiAyLFxuICAgICAgICAgKiAgICAgICAgICBlbmRyZWNvcmQ6IDVcbiAgICAgICAgICogICAgICAgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgcXNgIFF1ZXJ5IG9iamVjdC4gRWFjaCBrZXkgY2FuIGJlIGEgcHJvcGVydHkgb2YgdGhlIHJ1biBvciB0aGUgbmFtZSBvZiB2YXJpYWJsZSB0aGF0IGhhcyBiZWVuIHNhdmVkIGluIHRoZSBydW4gKHByZWZhY2VkIGJ5IGB2YXJpYWJsZXMuYCkuIEVhY2ggdmFsdWUgY2FuIGJlIGEgbGl0ZXJhbCB2YWx1ZSwgb3IgYSBjb21wYXJpc29uIG9wZXJhdG9yIGFuZCB2YWx1ZS4gKFNlZSBbbW9yZSBvbiBmaWx0ZXJpbmddKC4uLy4uLy4uL3Jlc3RfYXBpcy9hZ2dyZWdhdGVfcnVuX2FwaS8jZmlsdGVycykgYWxsb3dlZCBpbiB0aGUgdW5kZXJseWluZyBSdW4gQVBJLikgUXVlcnlpbmcgZm9yIHZhcmlhYmxlcyBpcyBhdmFpbGFibGUgZm9yIHJ1bnMgW2luIG1lbW9yeV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLW1lbW9yeSkgYW5kIGZvciBydW5zIFtpbiB0aGUgZGF0YWJhc2VdKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpIGlmIHRoZSB2YXJpYWJsZXMgYXJlIHBlcnNpc3RlZCAoZS5nLiB0aGF0IGhhdmUgYmVlbiBgcmVjb3JkYGVkIGluIHlvdXIgSnVsaWEgbW9kZWwpLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG91dHB1dE1vZGlmaWVyYCAoT3B0aW9uYWwpIEF2YWlsYWJsZSBmaWVsZHMgaW5jbHVkZTogYHN0YXJ0cmVjb3JkYCwgYGVuZHJlY29yZGAsIGBzb3J0YCwgYW5kIGBkaXJlY3Rpb25gIChgYXNjYCBvciBgZGVzY2ApLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICBxdWVyeTogZnVuY3Rpb24gKHFzLCBvdXRwdXRNb2RpZmllciwgb3B0aW9ucykge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gcXM7IC8vc2hvdWxkbid0IGJlIGFibGUgdG8gb3Zlci1yaWRlXG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaHR0cE9wdGlvbnMgPSB1cmxDb25maWcuYWRkQXV0b1Jlc3RvcmVIZWFkZXIoaHR0cE9wdGlvbnMpO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5zcGxpdEdldChvdXRwdXRNb2RpZmllciwgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIHBhcnRpY3VsYXIgcnVucywgYmFzZWQgb24gY29uZGl0aW9ucyBzcGVjaWZpZWQgaW4gdGhlIGBxc2Agb2JqZWN0LlxuICAgICAgICAgKlxuICAgICAgICAgKiBTaW1pbGFyIHRvIGAucXVlcnkoKWAuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgZmlsdGVyYCBGaWx0ZXIgb2JqZWN0LiBFYWNoIGtleSBjYW4gYmUgYSBwcm9wZXJ0eSBvZiB0aGUgcnVuIG9yIHRoZSBuYW1lIG9mIHZhcmlhYmxlIHRoYXQgaGFzIGJlZW4gc2F2ZWQgaW4gdGhlIHJ1biAocHJlZmFjZWQgYnkgYHZhcmlhYmxlcy5gKS4gRWFjaCB2YWx1ZSBjYW4gYmUgYSBsaXRlcmFsIHZhbHVlLCBvciBhIGNvbXBhcmlzb24gb3BlcmF0b3IgYW5kIHZhbHVlLiAoU2VlIFttb3JlIG9uIGZpbHRlcmluZ10oLi4vLi4vLi4vcmVzdF9hcGlzL2FnZ3JlZ2F0ZV9ydW5fYXBpLyNmaWx0ZXJzKSBhbGxvd2VkIGluIHRoZSB1bmRlcmx5aW5nIFJ1biBBUEkuKSBGaWx0ZXJpbmcgZm9yIHZhcmlhYmxlcyBpcyBhdmFpbGFibGUgZm9yIHJ1bnMgW2luIG1lbW9yeV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLW1lbW9yeSkgYW5kIGZvciBydW5zIFtpbiB0aGUgZGF0YWJhc2VdKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpIGlmIHRoZSB2YXJpYWJsZXMgYXJlIHBlcnNpc3RlZCAoZS5nLiB0aGF0IGhhdmUgYmVlbiBgcmVjb3JkYGVkIGluIHlvdXIgSnVsaWEgbW9kZWwpLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG91dHB1dE1vZGlmaWVyYCAoT3B0aW9uYWwpIEF2YWlsYWJsZSBmaWVsZHMgaW5jbHVkZTogYHN0YXJ0cmVjb3JkYCwgYGVuZHJlY29yZGAsIGBzb3J0YCwgYW5kIGBkaXJlY3Rpb25gIChgYXNjYCBvciBgZGVzY2ApLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICBmaWx0ZXI6IGZ1bmN0aW9uIChmaWx0ZXIsIG91dHB1dE1vZGlmaWVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHNlcnZpY2VPcHRpb25zLmZpbHRlcikpIHtcbiAgICAgICAgICAgICAgICAkLmV4dGVuZChzZXJ2aWNlT3B0aW9ucy5maWx0ZXIsIGZpbHRlcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IGZpbHRlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBodHRwT3B0aW9ucyA9IHVybENvbmZpZy5hZGRBdXRvUmVzdG9yZUhlYWRlcihodHRwT3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5zcGxpdEdldChvdXRwdXRNb2RpZmllciwgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgZGF0YSBmb3IgYSBzcGVjaWZpYyBydW4uIFRoaXMgaW5jbHVkZXMgc3RhbmRhcmQgcnVuIGRhdGEgc3VjaCBhcyB0aGUgYWNjb3VudCwgbW9kZWwsIHByb2plY3QsIGFuZCBjcmVhdGVkIGFuZCBsYXN0IG1vZGlmaWVkIGRhdGVzLiBUbyByZXF1ZXN0IHNwZWNpZmljIG1vZGVsIHZhcmlhYmxlcywgcGFzcyB0aGVtIGFzIHBhcnQgb2YgdGhlIGBmaWx0ZXJzYCBwYXJhbWV0ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIE5vdGUgdGhhdCBpZiB0aGUgcnVuIGlzIFtpbiBtZW1vcnldKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpLCBhbnkgbW9kZWwgdmFyaWFibGVzIGFyZSBhdmFpbGFibGU7IGlmIHRoZSBydW4gaXMgW2luIHRoZSBkYXRhYmFzZV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLWRiKSwgb25seSBtb2RlbCB2YXJpYWJsZXMgdGhhdCBoYXZlIGJlZW4gcGVyc2lzdGVkICZtZGFzaDsgdGhhdCBpcywgYHJlY29yZGBlZCBpbiB5b3VyIEp1bGlhIG1vZGVsICZtZGFzaDsgYXJlIGF2YWlsYWJsZS5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIHJzLmxvYWQoJ2JiNTg5Njc3LWQ0NzYtNDk3MS1hNjhlLTBjNThkMTkxZTQ1MCcsIHsgaW5jbHVkZTogWycucHJpY2UnLCAnLnNhbGVzJ10gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBgcnVuSURgIFRoZSBydW4gaWQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgZmlsdGVyc2AgKE9wdGlvbmFsKSBPYmplY3QgY29udGFpbmluZyBmaWx0ZXJzIGFuZCBvcGVyYXRpb24gbW9kaWZpZXJzLiBVc2Uga2V5IGBpbmNsdWRlYCB0byBsaXN0IG1vZGVsIHZhcmlhYmxlcyB0aGF0IHlvdSB3YW50IHRvIGluY2x1ZGUgaW4gdGhlIHJlc3BvbnNlLiBPdGhlciBhdmFpbGFibGUgZmllbGRzIGluY2x1ZGU6IGBzdGFydHJlY29yZGAsIGBlbmRyZWNvcmRgLCBgc29ydGAsIGFuZCBgZGlyZWN0aW9uYCAoYGFzY2Agb3IgYGRlc2NgKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKHJ1bklELCBmaWx0ZXJzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAocnVuSUQpIHtcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSBydW5JRDsgLy9zaG91bGRuJ3QgYmUgYWJsZSB0byBvdmVyLXJpZGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBodHRwT3B0aW9ucyA9IHVybENvbmZpZy5hZGRBdXRvUmVzdG9yZUhlYWRlcihodHRwT3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoZmlsdGVycywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNhdmUgYXR0cmlidXRlcyAoZGF0YSwgbW9kZWwgdmFyaWFibGVzKSBvZiB0aGUgcnVuLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGVzKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIGFkZCAnY29tcGxldGVkJyBmaWVsZCB0byBydW4gcmVjb3JkXG4gICAgICAgICAqICAgICBycy5zYXZlKHsgY29tcGxldGVkOiB0cnVlIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gdXBkYXRlICdzYXZlZCcgZmllbGQgb2YgcnVuIHJlY29yZCwgYW5kIHVwZGF0ZSB2YWx1ZXMgb2YgbW9kZWwgdmFyaWFibGVzIGZvciB0aGlzIHJ1blxuICAgICAgICAgKiAgICAgcnMuc2F2ZSh7IHNhdmVkOiB0cnVlLCB2YXJpYWJsZXM6IHsgYTogMjMsIGI6IDIzIH0gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgYXR0cmlidXRlc2AgVGhlIHJ1biBkYXRhIGFuZCB2YXJpYWJsZXMgdG8gc2F2ZS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBhdHRyaWJ1dGVzLnZhcmlhYmxlc2AgTW9kZWwgdmFyaWFibGVzIG11c3QgYmUgaW5jbHVkZWQgaW4gYSBgdmFyaWFibGVzYCBmaWVsZCB3aXRoaW4gdGhlIGBhdHRyaWJ1dGVzYCBvYmplY3QuIChPdGhlcndpc2UgdGhleSBhcmUgdHJlYXRlZCBhcyBydW4gZGF0YSBhbmQgYWRkZWQgdG8gdGhlIHJ1biByZWNvcmQgZGlyZWN0bHkuKVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICBzYXZlOiBmdW5jdGlvbiAoYXR0cmlidXRlcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHNldEZpbHRlck9yVGhyb3dFcnJvcihodHRwT3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wYXRjaChhdHRyaWJ1dGVzLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGwgYSBtZXRob2QgZnJvbSB0aGUgbW9kZWwuXG4gICAgICAgICAqXG4gICAgICAgICAqIERlcGVuZGluZyBvbiB0aGUgbGFuZ3VhZ2UgaW4gd2hpY2ggeW91IGhhdmUgd3JpdHRlbiB5b3VyIG1vZGVsLCB0aGUgbWV0aG9kIG1heSBuZWVkIHRvIGJlIGV4cG9zZWQgKGUuZy4gYGV4cG9ydGAgZm9yIGEgSnVsaWEgbW9kZWwpIGluIHRoZSBtb2RlbCBmaWxlIGluIG9yZGVyIHRvIGJlIGNhbGxlZCB0aHJvdWdoIHRoZSBBUEkuIFNlZSBbV3JpdGluZyB5b3VyIE1vZGVsXSguLi8uLi8uLi93cml0aW5nX3lvdXJfbW9kZWwvKSkuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBgcGFyYW1zYCBhcmd1bWVudCBpcyBub3JtYWxseSBhbiBhcnJheSBvZiBhcmd1bWVudHMgdG8gdGhlIGBvcGVyYXRpb25gLiBJbiB0aGUgc3BlY2lhbCBjYXNlIHdoZXJlIGBvcGVyYXRpb25gIG9ubHkgdGFrZXMgb25lIGFyZ3VtZW50LCB5b3UgYXJlIG5vdCByZXF1aXJlZCB0byBwdXQgdGhhdCBhcmd1bWVudCBpbnRvIGFuIGFycmF5LlxuICAgICAgICAgKlxuICAgICAgICAgKiBOb3RlIHRoYXQgeW91IGNhbiBjb21iaW5lIHRoZSBgb3BlcmF0aW9uYCBhbmQgYHBhcmFtc2AgYXJndW1lbnRzIGludG8gYSBzaW5nbGUgb2JqZWN0IGlmIHlvdSBwcmVmZXIsIGFzIGluIHRoZSBsYXN0IGV4YW1wbGUuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZXMqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZCBcInNvbHZlXCIgdGFrZXMgbm8gYXJndW1lbnRzXG4gICAgICAgICAqICAgICBycy5kbygnc29sdmUnKTtcbiAgICAgICAgICogICAgICAvLyBtZXRob2QgXCJlY2hvXCIgdGFrZXMgb25lIGFyZ3VtZW50LCBhIHN0cmluZ1xuICAgICAgICAgKiAgICAgcnMuZG8oJ2VjaG8nLCBbJ2hlbGxvJ10pO1xuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZCBcImVjaG9cIiB0YWtlcyBvbmUgYXJndW1lbnQsIGEgc3RyaW5nXG4gICAgICAgICAqICAgICBycy5kbygnZWNobycsICdoZWxsbycpO1xuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZCBcInN1bUFycmF5XCIgdGFrZXMgb25lIGFyZ3VtZW50LCBhbiBhcnJheVxuICAgICAgICAgKiAgICAgcnMuZG8oJ3N1bUFycmF5JywgW1s0LDIsMV1dKTtcbiAgICAgICAgICogICAgICAvLyBtZXRob2QgXCJhZGRcIiB0YWtlcyB0d28gYXJndW1lbnRzLCBib3RoIGludGVnZXJzXG4gICAgICAgICAqICAgICBycy5kbyh7IG5hbWU6J2FkZCcsIHBhcmFtczpbMiw0XSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGBvcGVyYXRpb25gIE5hbWUgb2YgbWV0aG9kLlxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBgcGFyYW1zYCAoT3B0aW9uYWwpIEFueSBwYXJhbWV0ZXJzIHRoZSBvcGVyYXRpb24gdGFrZXMsIHBhc3NlZCBhcyBhbiBhcnJheS4gSW4gdGhlIHNwZWNpYWwgY2FzZSB3aGVyZSBgb3BlcmF0aW9uYCBvbmx5IHRha2VzIG9uZSBhcmd1bWVudCwgeW91IGFyZSBub3QgcmVxdWlyZWQgdG8gcHV0IHRoYXQgYXJndW1lbnQgaW50byBhbiBhcnJheSwgYW5kIGNhbiBqdXN0IHBhc3MgaXQgZGlyZWN0bHkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIGRvOiBmdW5jdGlvbiAob3BlcmF0aW9uLCBwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdkbycsIG9wZXJhdGlvbiwgcGFyYW1zKTtcbiAgICAgICAgICAgIHZhciBvcHNBcmdzO1xuICAgICAgICAgICAgdmFyIHBvc3RPcHRpb25zO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBvcHNBcmdzID0gcGFyYW1zO1xuICAgICAgICAgICAgICAgIHBvc3RPcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdChwYXJhbXMpKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wc0FyZ3MgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBwb3N0T3B0aW9ucyA9IHBhcmFtcztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvcHNBcmdzID0gcGFyYW1zO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBydXRpbC5ub3JtYWxpemVPcGVyYXRpb25zKG9wZXJhdGlvbiwgb3BzQXJncyk7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIHBvc3RPcHRpb25zKTtcblxuICAgICAgICAgICAgc2V0RmlsdGVyT3JUaHJvd0Vycm9yKGh0dHBPcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIHBybXMgPSAocmVzdWx0LmFyZ3NbMF0ubGVuZ3RoICYmIChyZXN1bHQuYXJnc1swXSAhPT0gbnVsbCAmJiByZXN1bHQuYXJnc1swXSAhPT0gdW5kZWZpbmVkKSkgPyByZXN1bHQuYXJnc1swXSA6IFtdO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdCh7IGFyZ3VtZW50czogcHJtcyB9LCAkLmV4dGVuZCh0cnVlLCB7fSwgaHR0cE9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRGaWx0ZXJVUkwoKSArICdvcGVyYXRpb25zLycgKyByZXN1bHQub3BzWzBdICsgJy8nXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGwgc2V2ZXJhbCBtZXRob2RzIGZyb20gdGhlIG1vZGVsLCBzZXF1ZW50aWFsbHkuXG4gICAgICAgICAqXG4gICAgICAgICAqIERlcGVuZGluZyBvbiB0aGUgbGFuZ3VhZ2UgaW4gd2hpY2ggeW91IGhhdmUgd3JpdHRlbiB5b3VyIG1vZGVsLCB0aGUgbWV0aG9kcyBtYXkgbmVlZCB0byBiZSBleHBvc2VkIChlLmcuIGBleHBvcnRgIGZvciBhIEp1bGlhIG1vZGVsKSBpbiB0aGUgbW9kZWwgZmlsZSBpbiBvcmRlciB0byBiZSBjYWxsZWQgdGhyb3VnaCB0aGUgQVBJLiBTZWUgW1dyaXRpbmcgeW91ciBNb2RlbF0oLi4vLi4vLi4vd3JpdGluZ195b3VyX21vZGVsLykpLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGVzKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyBtZXRob2RzIFwiaW5pdGlhbGl6ZVwiIGFuZCBcInNvbHZlXCIgZG8gbm90IHRha2UgYW55IGFyZ3VtZW50c1xuICAgICAgICAgKiAgICAgcnMuc2VyaWFsKFsnaW5pdGlhbGl6ZScsICdzb2x2ZSddKTtcbiAgICAgICAgICogICAgICAvLyBtZXRob2RzIFwiaW5pdFwiIGFuZCBcInJlc2V0XCIgdGFrZSB0d28gYXJndW1lbnRzIGVhY2hcbiAgICAgICAgICogICAgIHJzLnNlcmlhbChbICB7IG5hbWU6ICdpbml0JywgcGFyYW1zOiBbMSwyXSB9LFxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ3Jlc2V0JywgcGFyYW1zOiBbMiwzXSB9XSk7XG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kIFwiaW5pdFwiIHRha2VzIHR3byBhcmd1bWVudHMsXG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kIFwicnVubW9kZWxcIiB0YWtlcyBub25lXG4gICAgICAgICAqICAgICBycy5zZXJpYWwoWyAgeyBuYW1lOiAnaW5pdCcsIHBhcmFtczogWzEsMl0gfSxcbiAgICAgICAgICogICAgICAgICAgICAgICAgICB7IG5hbWU6ICdydW5tb2RlbCcsIHBhcmFtczogW10gfV0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBgb3BlcmF0aW9uc2AgSWYgbm9uZSBvZiB0aGUgbWV0aG9kcyB0YWtlIHBhcmFtZXRlcnMsIHBhc3MgYW4gYXJyYXkgb2YgdGhlIG1ldGhvZCBuYW1lcyAoc3RyaW5ncykuIElmIGFueSBvZiB0aGUgbWV0aG9kcyBkbyB0YWtlIHBhcmFtZXRlcnMsIHBhc3MgYW4gYXJyYXkgb2Ygb2JqZWN0cywgZWFjaCBvZiB3aGljaCBjb250YWlucyBhIG1ldGhvZCBuYW1lIGFuZCBpdHMgb3duIChwb3NzaWJseSBlbXB0eSkgYXJyYXkgb2YgcGFyYW1ldGVycy5cbiAgICAgICAgICogQHBhcmFtIHsqfSBgcGFyYW1zYCBQYXJhbWV0ZXJzIHRvIHBhc3MgdG8gb3BlcmF0aW9ucy5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgc2VyaWFsOiBmdW5jdGlvbiAob3BlcmF0aW9ucywgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgb3BQYXJhbXMgPSBydXRpbC5ub3JtYWxpemVPcGVyYXRpb25zKG9wZXJhdGlvbnMsIHBhcmFtcyk7XG4gICAgICAgICAgICB2YXIgb3BzID0gb3BQYXJhbXMub3BzO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBvcFBhcmFtcy5hcmdzO1xuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcblxuICAgICAgICAgICAgdmFyICRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICAgICAgdmFyIHBvc3RPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIGRvU2luZ2xlT3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wID0gb3BzLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgdmFyIGFyZyA9IGFyZ3Muc2hpZnQoKTtcblxuICAgICAgICAgICAgICAgIG1lLmRvKG9wLCBhcmcsIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb1NpbmdsZU9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRkLnJlc29sdmUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3N0T3B0aW9ucy5zdWNjZXNzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZC5yZWplY3QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3RPcHRpb25zLmVycm9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGRvU2luZ2xlT3AoKTtcblxuICAgICAgICAgICAgcmV0dXJuICRkLnByb21pc2UoKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbCBzZXZlcmFsIG1ldGhvZHMgZnJvbSB0aGUgbW9kZWwsIGV4ZWN1dGluZyB0aGVtIGluIHBhcmFsbGVsLlxuICAgICAgICAgKlxuICAgICAgICAgKiBEZXBlbmRpbmcgb24gdGhlIGxhbmd1YWdlIGluIHdoaWNoIHlvdSBoYXZlIHdyaXR0ZW4geW91ciBtb2RlbCwgdGhlIG1ldGhvZHMgbWF5IG5lZWQgdG8gYmUgZXhwb3NlZCAoZS5nLiBgZXhwb3J0YCBmb3IgYSBKdWxpYSBtb2RlbCkgaW4gdGhlIG1vZGVsIGZpbGUgaW4gb3JkZXIgdG8gYmUgY2FsbGVkIHRocm91Z2ggdGhlIEFQSS4gU2VlIFtXcml0aW5nIHlvdXIgTW9kZWxdKC4uLy4uLy4uL3dyaXRpbmdfeW91cl9tb2RlbC8pKS5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyBtZXRob2RzIFwic29sdmVcIiBhbmQgXCJyZXNldFwiIGRvIG5vdCB0YWtlIGFueSBhcmd1bWVudHNcbiAgICAgICAgICogICAgIHJzLnBhcmFsbGVsKFsnc29sdmUnLCAncmVzZXQnXSk7XG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kcyBcImFkZFwiIGFuZCBcInN1YnRyYWN0XCIgdGFrZSB0d28gYXJndW1lbnRzIGVhY2hcbiAgICAgICAgICogICAgIHJzLnBhcmFsbGVsKFsgeyBuYW1lOiAnYWRkJywgcGFyYW1zOiBbMSwyXSB9LFxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdzdWJ0cmFjdCcsIHBhcmFtczpbMiwzXSB9XSk7XG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kcyBcImFkZFwiIGFuZCBcInN1YnRyYWN0XCIgdGFrZSB0d28gYXJndW1lbnRzIGVhY2hcbiAgICAgICAgICogICAgIHJzLnBhcmFsbGVsKHsgYWRkOiBbMSwyXSwgc3VidHJhY3Q6IFsyLDRdIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdH0gYG9wZXJhdGlvbnNgIElmIG5vbmUgb2YgdGhlIG1ldGhvZHMgdGFrZSBwYXJhbWV0ZXJzLCBwYXNzIGFuIGFycmF5IG9mIHRoZSBtZXRob2QgbmFtZXMgKGFzIHN0cmluZ3MpLiBJZiBhbnkgb2YgdGhlIG1ldGhvZHMgZG8gdGFrZSBwYXJhbWV0ZXJzLCB5b3UgaGF2ZSB0d28gb3B0aW9ucy4gWW91IGNhbiBwYXNzIGFuIGFycmF5IG9mIG9iamVjdHMsIGVhY2ggb2Ygd2hpY2ggY29udGFpbnMgYSBtZXRob2QgbmFtZSBhbmQgaXRzIG93biAocG9zc2libHkgZW1wdHkpIGFycmF5IG9mIHBhcmFtZXRlcnMuIEFsdGVybmF0aXZlbHksIHlvdSBjYW4gcGFzcyBhIHNpbmdsZSBvYmplY3Qgd2l0aCB0aGUgbWV0aG9kIG5hbWUgYW5kIGEgKHBvc3NpYmx5IGVtcHR5KSBhcnJheSBvZiBwYXJhbWV0ZXJzLlxuICAgICAgICAgKiBAcGFyYW0geyp9IGBwYXJhbXNgIFBhcmFtZXRlcnMgdG8gcGFzcyB0byBvcGVyYXRpb25zLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICBwYXJhbGxlbDogZnVuY3Rpb24gKG9wZXJhdGlvbnMsIHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyICRkID0gJC5EZWZlcnJlZCgpO1xuXG4gICAgICAgICAgICB2YXIgb3BQYXJhbXMgPSBydXRpbC5ub3JtYWxpemVPcGVyYXRpb25zKG9wZXJhdGlvbnMsIHBhcmFtcyk7XG4gICAgICAgICAgICB2YXIgb3BzID0gb3BQYXJhbXMub3BzO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBvcFBhcmFtcy5hcmdzO1xuICAgICAgICAgICAgdmFyIHBvc3RPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIHF1ZXVlICA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGk8IG9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHF1ZXVlLnB1c2goXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG8ob3BzW2ldLCBhcmdzW2ldKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkLndoZW4uYXBwbHkodGhpcywgcXVldWUpXG4gICAgICAgICAgICAgICAgLmRvbmUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkZC5yZXNvbHZlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIHBvc3RPcHRpb25zLnN1Y2Nlc3MuYXBwbHkodGhpcy5hcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZhaWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkZC5yZWplY3QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgcG9zdE9wdGlvbnMuZXJyb3IuYXBwbHkodGhpcy5hcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gJGQucHJvbWlzZSgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBwdWJsaWNTeW5jQVBJID0ge1xuICAgICAgICBnZXRDdXJyZW50Q29uZmlnOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VydmljZU9wdGlvbnM7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgICogUmV0dXJucyBhIFZhcmlhYmxlcyBTZXJ2aWNlIGluc3RhbmNlLiBVc2UgdGhlIHZhcmlhYmxlcyBpbnN0YW5jZSB0byBsb2FkLCBzYXZlLCBhbmQgcXVlcnkgZm9yIHNwZWNpZmljIG1vZGVsIHZhcmlhYmxlcy4gU2VlIHRoZSBbVmFyaWFibGUgQVBJIFNlcnZpY2VdKC4uL3ZhcmlhYmxlcy1hcGktc2VydmljZS8pIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgICAgICAgICpcbiAgICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAgKlxuICAgICAgICAgICogICAgICB2YXIgdnMgPSBycy52YXJpYWJsZXMoKTtcbiAgICAgICAgICAqICAgICAgdnMuc2F2ZSh7IHNhbXBsZV9pbnQ6IDQgfSk7XG4gICAgICAgICAgKlxuICAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgY29uZmlnYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgICovXG4gICAgICAgIHZhcmlhYmxlczogZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICAgICAgdmFyIHZzID0gbmV3IFZhcmlhYmxlc1NlcnZpY2UoJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBjb25maWcsIHtcbiAgICAgICAgICAgICAgICBydW5TZXJ2aWNlOiB0aGlzXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICByZXR1cm4gdnM7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQXN5bmNBUEkpO1xuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY1N5bmNBUEkpO1xufTtcbiIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuICogIyNTdGF0ZSBBUEkgQWRhcHRlclxuICpcbiAqIFRoZSBTdGF0ZSBBUEkgQWRhcHRlciBhbGxvd3MgeW91IHRvIHJlcGxheSBvciBjbG9uZSBydW5zLiBJdCBicmluZ3MgZXhpc3RpbmcsIHBlcnNpc3RlZCBydW4gZGF0YSBmcm9tIHRoZSBkYXRhYmFzZSBiYWNrIGludG8gbWVtb3J5LCB1c2luZyB0aGUgc2FtZSBydW4gaWQgKGByZXBsYXlgKSBvciBhIG5ldyBydW4gaWQgKGBjbG9uZWApLiBSdW5zIG11c3QgYmUgaW4gbWVtb3J5IGluIG9yZGVyIGZvciB5b3UgdG8gdXBkYXRlIHZhcmlhYmxlcyBvciBjYWxsIG9wZXJhdGlvbnMgb24gdGhlbS5cbiAqXG4gKiBTcGVjaWZpY2FsbHksIHRoZSBTdGF0ZSBBUEkgQWRhcHRlciB3b3JrcyBieSBcInJlLXJ1bm5pbmdcIiB0aGUgcnVuICh1c2VyIGludGVyYWN0aW9ucykgZnJvbSB0aGUgY3JlYXRpb24gb2YgdGhlIHJ1biB1cCB0byB0aGUgdGltZSBpdCB3YXMgbGFzdCBwZXJzaXN0ZWQgaW4gdGhlIGRhdGFiYXNlLiBUaGlzIHByb2Nlc3MgdXNlcyB0aGUgY3VycmVudCB2ZXJzaW9uIG9mIHRoZSBydW4ncyBtb2RlbC4gVGhlcmVmb3JlLCBpZiB0aGUgbW9kZWwgaGFzIGNoYW5nZWQgc2luY2UgdGhlIG9yaWdpbmFsIHJ1biB3YXMgY3JlYXRlZCwgdGhlIHJldHJpZXZlZCBydW4gd2lsbCB1c2UgdGhlIG5ldyBtb2RlbCDigJQgYW5kIG1heSBlbmQgdXAgaGF2aW5nIGRpZmZlcmVudCB2YWx1ZXMgb3IgYmVoYXZpb3IgYXMgYSByZXN1bHQuIFVzZSB3aXRoIGNhcmUhXG4gKlxuICogVG8gdXNlIHRoZSBTdGF0ZSBBUEkgQWRhcHRlciwgaW5zdGFudGlhdGUgaXQgYW5kIHRoZW4gY2FsbCBpdHMgbWV0aG9kczpcbiAqXG4gKiAgICAgIHZhciBzYSA9IG5ldyBGLnNlcnZpY2UuU3RhdGUoKTtcbiAqICAgICAgc2EucmVwbGF5KHtydW5JZDogJzE4NDJiYjVjLTgzYWQtNGJhOC1hOTU1LWJkMTNjYzJmZGI0Zid9KTtcbiAqXG4gKiBUaGUgY29uc3RydWN0b3IgdGFrZXMgYW4gb3B0aW9uYWwgYG9wdGlvbnNgIHBhcmFtZXRlciBpbiB3aGljaCB5b3UgY2FuIHNwZWNpZnkgdGhlIGBhY2NvdW50YCBhbmQgYHByb2plY3RgIGlmIHRoZXkgYXJlIG5vdCBhbHJlYWR5IGF2YWlsYWJsZSBpbiB0aGUgY3VycmVudCBjb250ZXh0LlxuICpcbiAqL1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG52YXIgX3BpY2sgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdC11dGlsJykuX3BpY2s7XG52YXIgYXBpRW5kcG9pbnQgPSAnbW9kZWwvc3RhdGUnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcblxuICAgIHZhciBkZWZhdWx0cyA9IHtcblxuICAgIH07XG5cbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgdmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKHNlcnZpY2VPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuXG4gICAgdmFyIHRyYW5zcG9ydE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpXG4gICAgfSk7XG5cbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgdHJhbnNwb3J0T3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBzZXJ2aWNlT3B0aW9ucy50b2tlblxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkodHJhbnNwb3J0T3B0aW9ucyk7XG4gICAgdmFyIHBhcnNlUnVuSWRPckVycm9yID0gZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHBhcmFtcykgJiYgcGFyYW1zLnJ1bklkKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyYW1zLnJ1bklkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2UgcGFzcyBpbiBhIHJ1biBpZCcpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIFJlcGxheSBhIHJ1bi4gQWZ0ZXIgdGhpcyBjYWxsLCB0aGUgcnVuLCB3aXRoIGl0cyBvcmlnaW5hbCBydW4gaWQsIGlzIG5vdyBhdmFpbGFibGUgW2luIG1lbW9yeV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLW1lbW9yeSkuIChJdCBjb250aW51ZXMgdG8gYmUgcGVyc2lzdGVkIGludG8gdGhlIEVwaWNlbnRlciBkYXRhYmFzZSBhdCByZWd1bGFyIGludGVydmFscy4pXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHNhID0gbmV3IEYuc2VydmljZS5TdGF0ZSgpO1xuICAgICAgICAqICAgICAgc2EucmVwbGF5KHtydW5JZDogJzE4NDJiYjVjLTgzYWQtNGJhOC1hOTU1LWJkMTNjYzJmZGI0ZicsIHN0b3BCZWZvcmU6ICdjYWxjdWxhdGVTY29yZSd9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgcGFyYW1zYCBQYXJhbWV0ZXJzIG9iamVjdC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYHBhcmFtcy5ydW5JZGAgVGhlIGlkIG9mIHRoZSBydW4gdG8gYnJpbmcgYmFjayB0byBtZW1vcnkuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGBwYXJhbXMuc3RvcEJlZm9yZWAgKE9wdGlvbmFsKSBUaGUgcnVuIGlzIGFkdmFuY2VkIG9ubHkgdXAgdG8gdGhlIGZpcnN0IG9jY3VycmVuY2Ugb2YgdGhpcyBtZXRob2QuXG4gICAgICAgICogQHBhcmFtIHthcnJheX0gYHBhcmFtcy5leGNsdWRlYCAoT3B0aW9uYWwpIEFycmF5IG9mIG1ldGhvZHMgdG8gZXhjbHVkZSB3aGVuIGFkdmFuY2luZyB0aGUgcnVuLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgKi9cbiAgICAgICAgcmVwbGF5OiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgcnVuSWQgPSBwYXJzZVJ1bklkT3JFcnJvcihwYXJhbXMpO1xuXG4gICAgICAgICAgICB2YXIgcmVwbGF5T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHJ1bklkIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHBhcmFtcyA9ICQuZXh0ZW5kKHRydWUsIHsgYWN0aW9uOiAncmVwbGF5JyB9LCBfcGljayhwYXJhbXMsIFsnc3RvcEJlZm9yZScsICdleGNsdWRlJ10pKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChwYXJhbXMsIHJlcGxheU9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIENsb25lIGEgZ2l2ZW4gcnVuIGFuZCByZXR1cm4gYSBuZXcgcnVuIGluIHRoZSBzYW1lIHN0YXRlIGFzIHRoZSBnaXZlbiBydW4uXG4gICAgICAgICpcbiAgICAgICAgKiBUaGUgbmV3IHJ1biBpZCBpcyBub3cgYXZhaWxhYmxlIFtpbiBtZW1vcnldKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpLiBUaGUgbmV3IHJ1biBpbmNsdWRlcyBhIGNvcHkgb2YgYWxsIG9mIHRoZSBkYXRhIGZyb20gdGhlIG9yaWdpbmFsIHJ1biwgRVhDRVBUOlxuICAgICAgICAqXG4gICAgICAgICogKiBUaGUgYHNhdmVkYCBmaWVsZCBpbiB0aGUgbmV3IHJ1biByZWNvcmQgaXMgbm90IGNvcGllZCBmcm9tIHRoZSBvcmlnaW5hbCBydW4gcmVjb3JkLiBJdCBkZWZhdWx0cyB0byBgZmFsc2VgLlxuICAgICAgICAqICogVGhlIGBpbml0aWFsaXplZGAgZmllbGQgaW4gdGhlIG5ldyBydW4gcmVjb3JkIGlzIG5vdCBjb3BpZWQgZnJvbSB0aGUgb3JpZ2luYWwgcnVuIHJlY29yZC4gSXQgZGVmYXVsdHMgdG8gYGZhbHNlYCBidXQgbWF5IGNoYW5nZSB0byBgdHJ1ZWAgYXMgdGhlIG5ldyBydW4gaXMgYWR2YW5jZWQuIEZvciBleGFtcGxlLCBpZiB0aGVyZSBoYXMgYmVlbiBhIGNhbGwgdG8gdGhlIGBzdGVwYCBmdW5jdGlvbiAoZm9yIFZlbnNpbSBtb2RlbHMpLCB0aGUgYGluaXRpYWxpemVkYCBmaWVsZCBpcyBzZXQgdG8gYHRydWVgLlxuICAgICAgICAqICogVGhlIGBjcmVhdGVkYCBmaWVsZCBpbiB0aGUgbmV3IHJ1biByZWNvcmQgaXMgdGhlIGRhdGUgYW5kIHRpbWUgYXQgd2hpY2ggdGhlIGNsb25lIHdhcyBjcmVhdGVkIChub3QgdGhlIHRpbWUgdGhhdCB0aGUgb3JpZ2luYWwgcnVuIHdhcyBjcmVhdGVkLilcbiAgICAgICAgKlxuICAgICAgICAqIFRoZSBvcmlnaW5hbCBydW4gcmVtYWlucyBvbmx5IFtpbiB0aGUgZGF0YWJhc2VdKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1kYikuXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHNhID0gbmV3IEYuc2VydmljZS5TdGF0ZSgpO1xuICAgICAgICAqICAgICAgc2EuY2xvbmUoe3J1bklkOiAnMTg0MmJiNWMtODNhZC00YmE4LWE5NTUtYmQxM2NjMmZkYjRmJywgc3RvcEJlZm9yZTogJ2NhbGN1bGF0ZVNjb3JlJywgZXhjbHVkZTogWydpbnRlcmltQ2FsY3VsYXRpb24nXSB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgcGFyYW1zYCBQYXJhbWV0ZXJzIG9iamVjdC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYHBhcmFtcy5ydW5JZGAgVGhlIGlkIG9mIHRoZSBydW4gdG8gY2xvbmUgZnJvbSBtZW1vcnkuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGBwYXJhbXMuc3RvcEJlZm9yZWAgKE9wdGlvbmFsKSBUaGUgbmV3bHkgY2xvbmVkIHJ1biBpcyBhZHZhbmNlZCBvbmx5IHVwIHRvIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIHRoaXMgbWV0aG9kLlxuICAgICAgICAqIEBwYXJhbSB7YXJyYXl9IGBwYXJhbXMuZXhjbHVkZWAgKE9wdGlvbmFsKSBBcnJheSBvZiBtZXRob2RzIHRvIGV4Y2x1ZGUgd2hlbiBhZHZhbmNpbmcgdGhlIG5ld2x5IGNsb25lZCBydW4uXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAqL1xuICAgICAgICBjbG9uZTogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHJ1bklkID0gcGFyc2VSdW5JZE9yRXJyb3IocGFyYW1zKTtcblxuICAgICAgICAgICAgdmFyIHJlcGxheU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBydW5JZCB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBwYXJhbXMgPSAkLmV4dGVuZCh0cnVlLCB7IGFjdGlvbjogJ2Nsb25lJyB9LCBfcGljayhwYXJhbXMsIFsnc3RvcEJlZm9yZScsICdleGNsdWRlJ10pKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChwYXJhbXMsIHJlcGxheU9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZXBpVmVyc2lvbiA9IHJlcXVpcmUoJy4uL2FwaS12ZXJzaW9uLmpzb24nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgLy9UT0RPOiB1cmx1dGlscyB0byBnZXQgaG9zdCwgc2luY2Ugbm8gd2luZG93IG9uIG5vZGVcblxuICAgIHZhciBBUElfUFJPVE9DT0wgPSAnaHR0cHMnO1xuICAgIHZhciBIT1NUX0FQSV9NQVBQSU5HID0ge1xuICAgICAgICAnZm9yaW8uY29tJzogJ2FwaS5mb3Jpby5jb20nLFxuICAgICAgICAnZm9yaW9kZXYuY29tJzogJ2FwaS5lcGljZW50ZXIuZm9yaW9kZXYuY29tJ1xuICAgIH07XG5cbiAgICB2YXIgcHVibGljRXhwb3J0cyA9IHtcbiAgICAgICAgcHJvdG9jb2w6IEFQSV9QUk9UT0NPTCxcblxuICAgICAgICBhcGk6ICcnLFxuXG4gICAgICAgIGhvc3Q6IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaG9zdCA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuICAgICAgICAgICAgaWYgKCFob3N0IHx8IGhvc3QuaW5kZXhPZignbG9jYWwnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBob3N0ID0gJ2ZvcmlvLmNvbSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gKEhPU1RfQVBJX01BUFBJTkdbaG9zdF0pID8gSE9TVF9BUElfTUFQUElOR1tob3N0XSA6ICdhcGkuJyArIGhvc3Q7XG4gICAgICAgIH0oKSksXG5cbiAgICAgICAgYXBwUGF0aDogKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBwYXRoID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnNwbGl0KCdcXC8nKTtcblxuICAgICAgICAgICAgcmV0dXJuIHBhdGggJiYgcGF0aFsxXSB8fCAnJztcbiAgICAgICAgfSgpKSxcblxuICAgICAgICBhY2NvdW50UGF0aDogKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhY2NudCA9ICcnO1xuICAgICAgICAgICAgdmFyIHBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUuc3BsaXQoJ1xcLycpO1xuICAgICAgICAgICAgaWYgKHBhdGggJiYgcGF0aFsxXSA9PT0gJ2FwcCcpIHtcbiAgICAgICAgICAgICAgICBhY2NudCA9IHBhdGhbMl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYWNjbnQ7XG4gICAgICAgIH0oKSksXG5cbiAgICAgICAgcHJvamVjdFBhdGg6IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcHJqID0gJyc7XG4gICAgICAgICAgICB2YXIgcGF0aCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zcGxpdCgnXFwvJyk7XG4gICAgICAgICAgICBpZiAocGF0aCAmJiBwYXRoWzFdID09PSAnYXBwJykge1xuICAgICAgICAgICAgICAgIHByaiA9IHBhdGhbM107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcHJqO1xuICAgICAgICB9KCkpLFxuXG4gICAgICAgIHZlcnNpb25QYXRoOiAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHZlcnNpb24gPSBlcGlWZXJzaW9uLnZlcnNpb24gPyBlcGlWZXJzaW9uLnZlcnNpb24gKyAnLycgOiAnJztcbiAgICAgICAgICAgIHJldHVybiB2ZXJzaW9uO1xuICAgICAgICB9KCkpLFxuXG4gICAgICAgIGlzTG9jYWxob3N0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaG9zdCA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuICAgICAgICAgICAgcmV0dXJuICghaG9zdCB8fCBob3N0LmluZGV4T2YoJ2xvY2FsJykgIT09IC0xKTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRBUElQYXRoOiBmdW5jdGlvbiAoYXBpKSB7XG4gICAgICAgICAgICB2YXIgUFJPSkVDVF9BUElTID0gWydydW4nLCAnZGF0YScsICdmaWxlJ107XG5cbiAgICAgICAgICAgIHZhciBhcGlQYXRoID0gdGhpcy5wcm90b2NvbCArICc6Ly8nICsgdGhpcy5ob3N0ICsgJy8nICsgdGhpcy52ZXJzaW9uUGF0aCArIGFwaSArICcvJztcblxuICAgICAgICAgICAgaWYgKCQuaW5BcnJheShhcGksIFBST0pFQ1RfQVBJUykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgYXBpUGF0aCArPSB0aGlzLmFjY291bnRQYXRoICsgJy8nICsgdGhpcy5wcm9qZWN0UGF0aCAgKyAnLyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXBpUGF0aDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZChwdWJsaWNFeHBvcnRzLCBjb25maWcpO1xuICAgIHJldHVybiBwdWJsaWNFeHBvcnRzO1xufTtcbiIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiAjI1VzZXIgQVBJIEFkYXB0ZXJcbipcbiogVGhlIFVzZXIgQVBJIEFkYXB0ZXIgYWxsb3dzIHlvdSB0byByZXRyaWV2ZSBkZXRhaWxzIGFib3V0IGVuZCB1c2VycyBpbiB5b3VyIHRlYW0gKGFjY291bnQpLiBJdCBpcyBiYXNlZCBvbiB0aGUgcXVlcnlpbmcgY2FwYWJpbGl0aWVzIG9mIHRoZSB1bmRlcmx5aW5nIFJFU1RmdWwgW1VzZXIgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvdXNlcl9tYW5hZ2VtZW50L3VzZXIvKS5cbipcbiogVG8gdXNlIHRoZSBVc2VyIEFQSSBBZGFwdGVyLCBpbnN0YW50aWF0ZSBpdCBhbmQgdGhlbiBjYWxsIGl0cyBtZXRob2RzLlxuKlxuKiAgICAgICB2YXIgdWEgPSBuZXcgRi5zZXJ2aWNlLlVzZXIoe1xuKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuKiAgICAgICAgICAgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJ1xuKiAgICAgICB9KTtcbiogICAgICAgdWEuZ2V0QnlJZCgnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyk7XG4qICAgICAgIHVhLmdldCh7IHVzZXJOYW1lOiAnanNtaXRoJyB9KTtcbiogICAgICAgdWEuZ2V0KHsgaWQ6IFsnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyxcbiogICAgICAgICAgICAgICAgICAgJzRlYTc1NjMxLTRjOGQtNDg3Mi05ZDgwLWI0NjAwMTQ2NDc4ZSddIH0pO1xuKlxuKiBUaGUgY29uc3RydWN0b3IgdGFrZXMgYW4gb3B0aW9uYWwgYG9wdGlvbnNgIHBhcmFtZXRlciBpbiB3aGljaCB5b3UgY2FuIHNwZWNpZnkgdGhlIGBhY2NvdW50YCBhbmQgYHRva2VuYCBpZiB0aGV5IGFyZSBub3QgYWxyZWFkeSBhdmFpbGFibGUgaW4gdGhlIGN1cnJlbnQgY29udGV4dC5cbiovXG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbnZhciBxdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvcXVlcnktdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY2NvdW50IGlkLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpIG9yICoqVXNlciBJRCoqIChmb3IgcGVyc29uYWwgcHJvamVjdHMpLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgIGFjY291bnQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWNjZXNzIHRva2VuIHRvIHVzZSB3aGVuIHNlYXJjaGluZyBmb3IgZW5kIHVzZXJzLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgIHRva2VuOiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucyB0byBwYXNzIG9uIHRvIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBsYXllci4gQWxsIGpxdWVyeS5hamF4IG9wdGlvbnMgYXQgaHR0cDovL2FwaS5qcXVlcnkuY29tL2pRdWVyeS5hamF4LyBhcmUgYXZhaWxhYmxlLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IHt9XG4gICAgfTtcblxuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG4gICAgdmFyIHRyYW5zcG9ydE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoJ3VzZXInKVxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIHRyYW5zcG9ydE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KHRyYW5zcG9ydE9wdGlvbnMpO1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBSZXRyaWV2ZSBkZXRhaWxzIGFib3V0IHBhcnRpY3VsYXIgZW5kIHVzZXJzIGluIHlvdXIgdGVhbSwgYmFzZWQgb24gdXNlciBuYW1lIG9yIHVzZXIgaWQuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgdmFyIHVhID0gbmV3IEYuc2VydmljZS5Vc2VyKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICB0b2tlbjogJ3VzZXItb3ItcHJvamVjdC1hY2Nlc3MtdG9rZW4nXG4gICAgICAgICogICAgICAgfSk7XG4gICAgICAgICogICAgICAgdWEuZ2V0KHsgdXNlck5hbWU6ICdqc21pdGgnIH0pO1xuICAgICAgICAqICAgICAgIHVhLmdldCh7IGlkOiBbJzQyODM2ZDRiLTViNjEtNGZlNC04MGViLTMxMzZlOTU2ZWU1YycsXG4gICAgICAgICogICAgICAgICAgICAgICAgICAgJzRlYTc1NjMxLTRjOGQtNDg3Mi05ZDgwLWI0NjAwMTQ2NDc4ZSddIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYGZpbHRlcmAgT2JqZWN0IHdpdGggZmllbGQgYHVzZXJOYW1lYCBhbmQgdmFsdWUgb2YgdGhlIHVzZXJuYW1lLiBBbHRlcm5hdGl2ZWx5LCBvYmplY3Qgd2l0aCBmaWVsZCBgaWRgIGFuZCB2YWx1ZSBvZiBhbiBhcnJheSBvZiB1c2VyIGlkcy5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICovXG5cbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoZmlsdGVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgICAgIGZpbHRlciA9IGZpbHRlciB8fCB7fTtcblxuICAgICAgICAgICAgdmFyIGdldE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICB2YXIgdG9RRmlsdGVyID0gZnVuY3Rpb24gKGZpbHRlcikge1xuICAgICAgICAgICAgICAgIHZhciByZXMgPSB7fTtcblxuICAgICAgICAgICAgICAgIC8vIEFQSSBvbmx5IHN1cHBvcnRzIGZpbHRlcmluZyBieSB1c2VybmFtZSBmb3Igbm93XG4gICAgICAgICAgICAgICAgaWYgKGZpbHRlci51c2VyTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXMucSA9IGZpbHRlci51c2VyTmFtZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHRvSWRGaWx0ZXJzID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWQgPSAkLmlzQXJyYXkoaWQpID8gaWQgOiBbaWRdO1xuICAgICAgICAgICAgICAgIHJldHVybiAnaWQ9JyArIGlkLmpvaW4oJyZpZD0nKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBnZXRGaWx0ZXJzID0gW1xuICAgICAgICAgICAgICAgICdhY2NvdW50PScgKyBnZXRPcHRpb25zLmFjY291bnQsXG4gICAgICAgICAgICAgICAgdG9JZEZpbHRlcnMoZmlsdGVyLmlkKSxcbiAgICAgICAgICAgICAgICBxdXRpbC50b1F1ZXJ5Rm9ybWF0KHRvUUZpbHRlcihmaWx0ZXIpKVxuICAgICAgICAgICAgXS5qb2luKCcmJyk7XG5cbiAgICAgICAgICAgIC8vIHNwZWNpYWwgY2FzZSBmb3IgcXVlcmllcyB3aXRoIGxhcmdlIG51bWJlciBvZiBpZHNcbiAgICAgICAgICAgIC8vIG1ha2UgaXQgYXMgYSBwb3N0IHdpdGggR0VUIHNlbWFudGljc1xuICAgICAgICAgICAgdmFyIHRocmVzaG9sZCA9IDMwO1xuICAgICAgICAgICAgaWYgKGZpbHRlci5pZCAmJiAkLmlzQXJyYXkoZmlsdGVyLmlkKSAmJiBmaWx0ZXIuaWQubGVuZ3RoID49IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGdldE9wdGlvbnMudXJsID0gdXJsQ29uZmlnLmdldEFQSVBhdGgoJ3VzZXInKSArICc/X21ldGhvZD1HRVQnO1xuICAgICAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QoeyBpZDogZmlsdGVyLmlkIH0sIGdldE9wdGlvbnMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoZ2V0RmlsdGVycywgZ2V0T3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogUmV0cmlldmUgZGV0YWlscyBhYm91dCBhIHNpbmdsZSBlbmQgdXNlciBpbiB5b3VyIHRlYW0sIGJhc2VkIG9uIHVzZXIgaWQuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgdmFyIHVhID0gbmV3IEYuc2VydmljZS5Vc2VyKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICB0b2tlbjogJ3VzZXItb3ItcHJvamVjdC1hY2Nlc3MtdG9rZW4nXG4gICAgICAgICogICAgICAgfSk7XG4gICAgICAgICogICAgICAgdWEuZ2V0QnlJZCgnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgdXNlcklkYCBUaGUgdXNlciBpZCBmb3IgdGhlIGVuZCB1c2VyIGluIHlvdXIgdGVhbS5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICovXG5cbiAgICAgICAgZ2V0QnlJZDogZnVuY3Rpb24gKHVzZXJJZCwgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHB1YmxpY0FQSS5nZXQoeyBpZDogdXNlcklkIH0sIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuXG5cblxuXG4iLCIvKipcbiAqXG4gKiAjI1ZhcmlhYmxlcyBBUEkgU2VydmljZVxuICpcbiAqIFVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCB0aGUgW1J1biBBUEkgU2VydmljZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLykgdG8gcmVhZCwgd3JpdGUsIGFuZCBzZWFyY2ggZm9yIHNwZWNpZmljIG1vZGVsIHZhcmlhYmxlcy5cbiAqXG4gKiAgICAgdmFyIHJtID0gbmV3IEYubWFuYWdlci5SdW5NYW5hZ2VyKHtcbiAqICAgICAgICAgICBydW46IHtcbiAqICAgICAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICogICAgICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICogICAgICAgICAgICAgICBtb2RlbDogJ3N1cHBseS1jaGFpbi1tb2RlbC5qbCdcbiAqICAgICAgICAgICB9XG4gKiAgICAgIH0pO1xuICogICAgIHJtLmdldFJ1bigpXG4gKiAgICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAqICAgICAgICAgIHZhciB2cyA9IHJtLnJ1bi52YXJpYWJsZXMoKTtcbiAqICAgICAgICAgIHZzLnNhdmUoe3NhbXBsZV9pbnQ6IDR9KTtcbiAqICAgICAgICB9KTtcbiAqXG4gKi9cblxuXG4gJ3VzZSBzdHJpY3QnO1xuXG4gdmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xuIHZhciBydXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvcnVuLXV0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHJ1bnMgb2JqZWN0IHRvIHdoaWNoIHRoZSB2YXJpYWJsZSBmaWx0ZXJzIGFwcGx5LiBEZWZhdWx0cyB0byBudWxsLlxuICAgICAgICAgKiBAdHlwZSB7cnVuU2VydmljZX1cbiAgICAgICAgICovXG4gICAgICAgIHJ1blNlcnZpY2U6IG51bGxcbiAgICB9O1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcblxuICAgIHZhciBnZXRVUkwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzZXJ2aWNlT3B0aW9ucy5ydW5TZXJ2aWNlLnVybENvbmZpZy5nZXRGaWx0ZXJVUkwoKSArICd2YXJpYWJsZXMvJztcbiAgICB9O1xuXG4gICAgdmFyIGFkZEF1dG9SZXN0b3JlSGVhZGVyID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHNlcnZpY2VPcHRpb25zLnJ1blNlcnZpY2UudXJsQ29uZmlnLmFkZEF1dG9SZXN0b3JlSGVhZGVyKG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICB2YXIgaHR0cE9wdGlvbnMgPSB7XG4gICAgICAgIHVybDogZ2V0VVJMXG4gICAgfTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgaHR0cE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeShodHRwT3B0aW9ucyk7XG4gICAgaHR0cC5zcGxpdEdldCA9IHJ1dGlsLnNwbGl0R2V0RmFjdG9yeShodHRwT3B0aW9ucyk7XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdmFsdWVzIGZvciBhIHZhcmlhYmxlLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIHZzLmxvYWQoJ3NhbXBsZV9pbnQnKVxuICAgICAgICAgKiAgICAgICAgICAudGhlbihmdW5jdGlvbih2YWwpe1xuICAgICAgICAgKiAgICAgICAgICAgICAgLy8gdmFsIGNvbnRhaW5zIHRoZSB2YWx1ZSBvZiBzYW1wbGVfaW50XG4gICAgICAgICAqICAgICAgICAgIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gYHZhcmlhYmxlYCBOYW1lIG9mIHZhcmlhYmxlIHRvIGxvYWQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3V0cHV0TW9kaWZpZXJgIChPcHRpb25hbCkgQXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIGxvYWQ6IGZ1bmN0aW9uICh2YXJpYWJsZSwgb3V0cHV0TW9kaWZpZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBodHRwT3B0aW9ucyA9IGFkZEF1dG9SZXN0b3JlSGVhZGVyKGh0dHBPcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChvdXRwdXRNb2RpZmllciwgJC5leHRlbmQoe30sIGh0dHBPcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgdXJsOiBnZXRVUkwoKSArIHZhcmlhYmxlICsgJy8nXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgcGFydGljdWxhciB2YXJpYWJsZXMsIGJhc2VkIG9uIGNvbmRpdGlvbnMgc3BlY2lmaWVkIGluIHRoZSBgcXVlcnlgIG9iamVjdC5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICB2cy5xdWVyeShbJ3ByaWNlJywgJ3NhbGVzJ10pXG4gICAgICAgICAqICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICAgKiAgICAgICAgICAgICAgLy8gdmFsIGlzIGFuIG9iamVjdCB3aXRoIHRoZSB2YWx1ZXMgb2YgdGhlIHJlcXVlc3RlZCB2YXJpYWJsZXM6IHZhbC5wcmljZSwgdmFsLnNhbGVzXG4gICAgICAgICAqICAgICAgICAgIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIHZzLnF1ZXJ5KHsgaW5jbHVkZTpbJ3ByaWNlJywgJ3NhbGVzJ10gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fEFycmF5fSBgcXVlcnlgIFRoZSBuYW1lcyBvZiB0aGUgdmFyaWFibGVzIHJlcXVlc3RlZC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvdXRwdXRNb2RpZmllcmAgKE9wdGlvbmFsKSBBdmFpbGFibGUgZmllbGRzIGluY2x1ZGU6IGBzdGFydHJlY29yZGAsIGBlbmRyZWNvcmRgLCBgc29ydGAsIGFuZCBgZGlyZWN0aW9uYCAoYGFzY2Agb3IgYGRlc2NgKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKlxuICAgICAgICAgKi9cbiAgICAgICAgcXVlcnk6IGZ1bmN0aW9uIChxdWVyeSwgb3V0cHV0TW9kaWZpZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vUXVlcnkgYW5kIG91dHB1dE1vZGlmaWVyIGFyZSBib3RoIHF1ZXJ5c3RyaW5ncyBpbiB0aGUgdXJsOyBvbmx5IGNhbGxpbmcgdGhlbSBvdXQgc2VwYXJhdGVseSBoZXJlIHRvIGJlIGNvbnNpc3RlbnQgd2l0aCB0aGUgb3RoZXIgY2FsbHNcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBodHRwT3B0aW9ucyA9IGFkZEF1dG9SZXN0b3JlSGVhZGVyKGh0dHBPcHRpb25zKTtcblxuICAgICAgICAgICAgaWYgKCQuaXNBcnJheShxdWVyeSkpIHtcbiAgICAgICAgICAgICAgICBxdWVyeSA9IHsgaW5jbHVkZTogcXVlcnkgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICQuZXh0ZW5kKHF1ZXJ5LCBvdXRwdXRNb2RpZmllcik7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5zcGxpdEdldChxdWVyeSwgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTYXZlIHZhbHVlcyB0byBtb2RlbCB2YXJpYWJsZXMuIE92ZXJ3cml0ZXMgZXhpc3RpbmcgdmFsdWVzLiBOb3RlIHRoYXQgeW91IGNhbiBvbmx5IHVwZGF0ZSBtb2RlbCB2YXJpYWJsZXMgaWYgdGhlIHJ1biBpcyBbaW4gbWVtb3J5XSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KS4gKEFuIGFsdGVybmF0ZSB3YXkgdG8gdXBkYXRlIG1vZGVsIHZhcmlhYmxlcyBpcyB0byBjYWxsIGEgbWV0aG9kIGZyb20gdGhlIG1vZGVsIGFuZCBtYWtlIHN1cmUgdGhhdCB0aGUgbWV0aG9kIHBlcnNpc3RzIHRoZSB2YXJpYWJsZXMuIFNlZSBgZG9gLCBgc2VyaWFsYCwgYW5kIGBwYXJhbGxlbGAgaW4gdGhlIFtSdW4gQVBJIFNlcnZpY2VdKC4uL3J1bi1hcGktc2VydmljZS8pIGZvciBjYWxsaW5nIG1ldGhvZHMgZnJvbSB0aGUgbW9kZWwuKVxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIHZzLnNhdmUoJ3ByaWNlJywgNCk7XG4gICAgICAgICAqICAgICAgdnMuc2F2ZSh7IHByaWNlOiA0LCBxdWFudGl0eTogNSwgcHJvZHVjdHM6IFsyLDMsNF0gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fFN0cmluZ30gYHZhcmlhYmxlYCBBbiBvYmplY3QgY29tcG9zZWQgb2YgdGhlIG1vZGVsIHZhcmlhYmxlcyBhbmQgdGhlIHZhbHVlcyB0byBzYXZlLiBBbHRlcm5hdGl2ZWx5LCBhIHN0cmluZyB3aXRoIHRoZSBuYW1lIG9mIHRoZSB2YXJpYWJsZS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGB2YWxgIChPcHRpb25hbCkgSWYgcGFzc2luZyBhIHN0cmluZyBmb3IgYHZhcmlhYmxlYCwgdXNlIHRoaXMgYXJndW1lbnQgZm9yIHRoZSB2YWx1ZSB0byBzYXZlLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICBzYXZlOiBmdW5jdGlvbiAodmFyaWFibGUsIHZhbCwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGF0dHJzO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YXJpYWJsZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBhdHRycyA9IHZhcmlhYmxlO1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSB2YWw7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIChhdHRycyA9IHt9KVt2YXJpYWJsZV0gPSB2YWw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wYXRjaC5jYWxsKHRoaXMsIGF0dHJzLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOb3QgQXZhaWxhYmxlIHVudGlsIHVuZGVybHlpbmcgQVBJIHN1cHBvcnRzIFBVVC4gT3RoZXJ3aXNlIHNhdmUgd291bGQgYmUgUFVUIGFuZCBtZXJnZSB3b3VsZCBiZSBQQVRDSFxuICAgICAgICAvLyAqXG4gICAgICAgIC8vICAqIFNhdmUgdmFsdWVzIHRvIHRoZSBhcGkuIE1lcmdlcyBhcnJheXMsIGJ1dCBvdGhlcndpc2Ugc2FtZSBhcyBzYXZlXG4gICAgICAgIC8vICAqIEBwYXJhbSB7T2JqZWN0fFN0cmluZ30gdmFyaWFibGUgT2JqZWN0IHdpdGggYXR0cmlidXRlcywgb3Igc3RyaW5nIGtleVxuICAgICAgICAvLyAgKiBAcGFyYW0ge09iamVjdH0gdmFsIE9wdGlvbmFsIGlmIHByZXYgcGFyYW1ldGVyIHdhcyBhIHN0cmluZywgc2V0IHZhbHVlIGhlcmVcbiAgICAgICAgLy8gICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnNcbiAgICAgICAgLy8gICpcbiAgICAgICAgLy8gICogQGV4YW1wbGVcbiAgICAgICAgLy8gICogICAgIHZzLm1lcmdlKHsgcHJpY2U6IDQsIHF1YW50aXR5OiA1LCBwcm9kdWN0czogWzIsMyw0XSB9KVxuICAgICAgICAvLyAgKiAgICAgdnMubWVyZ2UoJ3ByaWNlJywgNCk7XG5cbiAgICAgICAgLy8gbWVyZ2U6IGZ1bmN0aW9uICh2YXJpYWJsZSwgdmFsLCBvcHRpb25zKSB7XG4gICAgICAgIC8vICAgICB2YXIgYXR0cnM7XG4gICAgICAgIC8vICAgICBpZiAodHlwZW9mIHZhcmlhYmxlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAvLyAgICAgICBhdHRycyA9IHZhcmlhYmxlO1xuICAgICAgICAvLyAgICAgICBvcHRpb25zID0gdmFsO1xuICAgICAgICAvLyAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gICAgICAgKGF0dHJzID0ge30pW3ZhcmlhYmxlXSA9IHZhbDtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgLy8gICAgIHJldHVybiBodHRwLnBhdGNoLmNhbGwodGhpcywgYXR0cnMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgLy8gfVxuICAgIH07XG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG4iLCIvKipcbiAqICMjV29ybGQgQVBJIEFkYXB0ZXJcbiAqXG4gKiBBIFtydW5dKC4uLy4uLy4uL2dsb3NzYXJ5LyNydW4pIGlzIGEgY29sbGVjdGlvbiBvZiBlbmQgdXNlciBpbnRlcmFjdGlvbnMgd2l0aCBhIHByb2plY3QgYW5kIGl0cyBtb2RlbCAtLSBpbmNsdWRpbmcgc2V0dGluZyB2YXJpYWJsZXMsIG1ha2luZyBkZWNpc2lvbnMsIGFuZCBjYWxsaW5nIG9wZXJhdGlvbnMuIEZvciBidWlsZGluZyBtdWx0aXBsYXllciBzaW11bGF0aW9ucyB5b3UgdHlwaWNhbGx5IHdhbnQgbXVsdGlwbGUgZW5kIHVzZXJzIHRvIHNoYXJlIHRoZSBzYW1lIHNldCBvZiBpbnRlcmFjdGlvbnMsIGFuZCB3b3JrIHdpdGhpbiBhIGNvbW1vbiBzdGF0ZS4gRXBpY2VudGVyIGFsbG93cyB5b3UgdG8gY3JlYXRlIFwid29ybGRzXCIgdG8gaGFuZGxlIHN1Y2ggY2FzZXMuIE9ubHkgW3RlYW0gcHJvamVjdHNdKC4uLy4uLy4uL2dsb3NzYXJ5LyN0ZWFtKSBjYW4gYmUgbXVsdGlwbGF5ZXIuXG4gKlxuICogVGhlIFdvcmxkIEFQSSBBZGFwdGVyIGFsbG93cyB5b3UgdG8gY3JlYXRlLCBhY2Nlc3MsIGFuZCBtYW5pcHVsYXRlIG11bHRpcGxheWVyIHdvcmxkcyB3aXRoaW4geW91ciBFcGljZW50ZXIgcHJvamVjdC4gWW91IGNhbiB1c2UgdGhpcyB0byBhZGQgYW5kIHJlbW92ZSBlbmQgdXNlcnMgZnJvbSB0aGUgd29ybGQsIGFuZCB0byBjcmVhdGUsIGFjY2VzcywgYW5kIHJlbW92ZSB0aGVpciBydW5zLiBCZWNhdXNlIG9mIHRoaXMsIHR5cGljYWxseSB0aGUgV29ybGQgQWRhcHRlciBpcyB1c2VkIGZvciBmYWNpbGl0YXRvciBwYWdlcyBpbiB5b3VyIHByb2plY3QuIChUaGUgcmVsYXRlZCBbV29ybGQgTWFuYWdlcl0oLi4vd29ybGQtbWFuYWdlci8pIHByb3ZpZGVzIGFuIGVhc3kgd2F5IHRvIGFjY2VzcyBydW5zIGFuZCB3b3JsZHMgZm9yIHBhcnRpY3VsYXIgZW5kIHVzZXJzLCBzbyBpcyB0eXBpY2FsbHkgdXNlZCBpbiBwYWdlcyB0aGF0IGVuZCB1c2VycyB3aWxsIGludGVyYWN0IHdpdGguKVxuICpcbiAqIEFzIHdpdGggYWxsIHRoZSBvdGhlciBbQVBJIEFkYXB0ZXJzXSguLi8uLi8pLCBhbGwgbWV0aG9kcyB0YWtlIGluIGFuIFwib3B0aW9uc1wiIG9iamVjdCBhcyB0aGUgbGFzdCBwYXJhbWV0ZXIuIFRoZSBvcHRpb25zIGNhbiBiZSB1c2VkIHRvIGV4dGVuZC9vdmVycmlkZSB0aGUgV29ybGQgQVBJIFNlcnZpY2UgZGVmYXVsdHMuXG4gKlxuICogVG8gdXNlIHRoZSBXb3JsZCBBZGFwdGVyLCBpbnN0YW50aWF0ZSBpdCBhbmQgdGhlbiBhY2Nlc3MgdGhlIG1ldGhvZHMgcHJvdmlkZWQuIEluc3RhbnRpYXRpbmcgcmVxdWlyZXMgdGhlIGFjY291bnQgaWQgKCoqVGVhbSBJRCoqIGluIHRoZSBFcGljZW50ZXIgdXNlciBpbnRlcmZhY2UpLCBwcm9qZWN0IGlkICgqKlByb2plY3QgSUQqKiksIGFuZCBncm91cCAoKipHcm91cCBOYW1lKiopLlxuICpcbiAqICAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICogICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICogICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAqICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICogICAgICAgd2EuY3JlYXRlKClcbiAqICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHdvcmxkKSB7XG4gKiAgICAgICAgICAgICAgLy8gY2FsbCBtZXRob2RzLCBlLmcuIHdhLmFkZFVzZXJzKClcbiAqICAgICAgICAgIH0pO1xuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIFN0b3JhZ2VGYWN0b3J5ID0gcmVxdWlyZSgnLi4vc3RvcmUvc3RvcmUtZmFjdG9yeScpO1xuLy8gdmFyIHF1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9xdWVyeS11dGlsJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG52YXIgX3BpY2sgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdC11dGlsJykuX3BpY2s7XG5cbnZhciBhcGlCYXNlID0gJ211bHRpcGxheWVyLyc7XG52YXIgYXNzaWdubWVudEVuZHBvaW50ID0gYXBpQmFzZSArICdhc3NpZ24nO1xudmFyIGFwaUVuZHBvaW50ID0gYXBpQmFzZSArICd3b3JsZCc7XG52YXIgcHJvamVjdEVuZHBvaW50ID0gYXBpQmFzZSArICdwcm9qZWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIHN0b3JlID0gbmV3IFN0b3JhZ2VGYWN0b3J5KHsgc3luY2hyb25vdXM6IHRydWUgfSk7XG5cbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGb3IgcHJvamVjdHMgdGhhdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uLCBwYXNzIGluIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiAoZGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nKS4gSWYgdGhlIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW4gdG8gRXBpY2VudGVyLCB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gaXMgYWxyZWFkeSBzZXQgaW4gYSBjb29raWUgYW5kIGF1dG9tYXRpY2FsbHkgbG9hZGVkIGZyb20gdGhlcmUuIChTZWUgW21vcmUgYmFja2dyb3VuZCBvbiBhY2Nlc3MgdG9rZW5zXSguLi8uLi8uLi9wcm9qZWN0X2FjY2Vzcy8pKS5cbiAgICAgICAgICogQHNlZSBbQXV0aGVudGljYXRpb24gQVBJIFNlcnZpY2VdKC4uL2F1dGgtYXBpLXNlcnZpY2UvKSBmb3IgZ2V0dGluZyB0b2tlbnMuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgIHRva2VuOiBzdG9yZS5nZXQoJ2VwaWNlbnRlci5wcm9qZWN0LnRva2VuJykgfHwgJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBwcm9qZWN0IGlkLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgVVJMLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICBwcm9qZWN0OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY2NvdW50IGlkLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgVVJMLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICBhY2NvdW50OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBncm91cCBuYW1lLiBEZWZhdWx0cyB0byB1bmRlZmluZWQuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgIGdyb3VwOiB1bmRlZmluZWQsXG5cbiAgICAgICAvKipcbiAgICAgICAgICogVGhlIG1vZGVsIGZpbGUgdG8gdXNlIHRvIGNyZWF0ZSBydW5zIGluIHRoaXMgd29ybGQuIERlZmF1bHRzIHRvIHVuZGVmaW5lZC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIG1vZGVsOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyaXRlcmlhIGJ5IHdoaWNoIHRvIGZpbHRlciB3b3JsZC4gQ3VycmVudGx5IG9ubHkgc3VwcG9ydHMgd29ybGQtaWRzIGFzIGZpbHRlcnMuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmaWx0ZXI6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb252ZW5pZW5jZSBhbGlhcyBmb3IgZmlsdGVyXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBpZDogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXIuIEFsbCBqcXVlcnkuYWpheCBvcHRpb25zIGF0IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuYWpheC8gYXJlIGF2YWlsYWJsZS4gRGVmYXVsdHMgdG8gZW1wdHkgb2JqZWN0LlxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7fSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbGVkIHdoZW4gdGhlIGNhbGwgY29tcGxldGVzIHN1Y2Nlc3NmdWxseS4gRGVmYXVsdHMgdG8gYCQubm9vcGAuXG4gICAgICAgICAqIEB0eXBlIHtmdW5jdGlvbn1cbiAgICAgICAgICovXG4gICAgICAgIHN1Y2Nlc3M6ICQubm9vcCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbGVkIHdoZW4gdGhlIGNhbGwgZmFpbHMuIERlZmF1bHRzIHRvIGAkLm5vb3BgLlxuICAgICAgICAgKiBAdHlwZSB7ZnVuY3Rpb259XG4gICAgICAgICAqL1xuICAgICAgICBlcnJvcjogJC5ub29wXG4gICAgfTtcblxuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMuaWQpIHtcbiAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gc2VydmljZU9wdGlvbnMuaWQ7XG4gICAgfVxuXG4gICAgdmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKHNlcnZpY2VPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuXG4gICAgaWYgKCFzZXJ2aWNlT3B0aW9ucy5hY2NvdW50KSB7XG4gICAgICAgIHNlcnZpY2VPcHRpb25zLmFjY291bnQgPSB1cmxDb25maWcuYWNjb3VudFBhdGg7XG4gICAgfVxuXG4gICAgaWYgKCFzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0KSB7XG4gICAgICAgIHNlcnZpY2VPcHRpb25zLnByb2plY3QgPSB1cmxDb25maWcucHJvamVjdFBhdGg7XG4gICAgfVxuXG4gICAgdmFyIHRyYW5zcG9ydE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpXG4gICAgfSk7XG5cbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgdHJhbnNwb3J0T3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBzZXJ2aWNlT3B0aW9ucy50b2tlblxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkodHJhbnNwb3J0T3B0aW9ucyk7XG5cbiAgICB2YXIgc2V0SWRGaWx0ZXJPclRocm93RXJyb3IgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucy5pZCkge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gb3B0aW9ucy5pZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5maWx0ZXIpIHtcbiAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IG9wdGlvbnMuZmlsdGVyO1xuICAgICAgICB9XG4gICAgICAgIGlmICghc2VydmljZU9wdGlvbnMuZmlsdGVyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHdvcmxkIGlkIHNwZWNpZmllZCB0byBhcHBseSBvcGVyYXRpb25zIGFnYWluc3QuIFRoaXMgY291bGQgaGFwcGVuIGlmIHRoZSB1c2VyIGlzIG5vdCBhc3NpZ25lZCB0byBhIHdvcmxkIGFuZCBpcyB0cnlpbmcgdG8gd29yayB3aXRoIHJ1bnMgZnJvbSB0aGF0IHdvcmxkLicpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciB2YWxpZGF0ZU1vZGVsT3JUaHJvd0Vycm9yID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCFvcHRpb25zLm1vZGVsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIG1vZGVsIHNwZWNpZmllZCB0byBnZXQgdGhlIGN1cnJlbnQgcnVuJyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBDcmVhdGVzIGEgbmV3IFdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogVXNpbmcgdGhpcyBtZXRob2QgaXMgcmFyZS4gSXQgaXMgbW9yZSBjb21tb24gdG8gY3JlYXRlIHdvcmxkcyBhdXRvbWF0aWNhbGx5IHdoaWxlIHlvdSBgYXV0b0Fzc2lnbigpYCBlbmQgdXNlcnMgdG8gd29ybGRzLiAoSW4gdGhpcyBjYXNlLCBjb25maWd1cmF0aW9uIGRhdGEgZm9yIHRoZSB3b3JsZCwgc3VjaCBhcyB0aGUgcm9sZXMsIGFyZSByZWFkIGZyb20gdGhlIHByb2plY3QtbGV2ZWwgd29ybGQgY29uZmlndXJhdGlvbiBpbmZvcm1hdGlvbiwgZm9yIGV4YW1wbGUgYnkgYGdldFByb2plY3RTZXR0aW5ncygpYC4pXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gICAgICAgICogICAgICB3YS5jcmVhdGUoe1xuICAgICAgICAqICAgICAgICAgICByb2xlczogWydWUCBNYXJrZXRpbmcnLCAnVlAgU2FsZXMnLCAnVlAgRW5naW5lZXJpbmcnXVxuICAgICAgICAqICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBwYXJhbXNgIFBhcmFtZXRlcnMgdG8gY3JlYXRlIHRoZSB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYHBhcmFtcy5ncm91cGAgKE9wdGlvbmFsKSBUaGUgKipHcm91cCBOYW1lKiogdG8gY3JlYXRlIHRoaXMgd29ybGQgdW5kZXIuIE9ubHkgZW5kIHVzZXJzIGluIHRoaXMgZ3JvdXAgYXJlIGVsaWdpYmxlIHRvIGpvaW4gdGhlIHdvcmxkLiBPcHRpb25hbCBoZXJlOyByZXF1aXJlZCB3aGVuIGluc3RhbnRpYXRpbmcgdGhlIHNlcnZpY2UgKGBuZXcgRi5zZXJ2aWNlLldvcmxkKClgKS5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYHBhcmFtcy5yb2xlc2AgKE9wdGlvbmFsKSBUaGUgbGlzdCBvZiByb2xlcyAoc3RyaW5ncykgZm9yIHRoaXMgd29ybGQuIFNvbWUgd29ybGRzIGhhdmUgc3BlY2lmaWMgcm9sZXMgdGhhdCAqKm11c3QqKiBiZSBmaWxsZWQgYnkgZW5kIHVzZXJzLiBMaXN0aW5nIHRoZSByb2xlcyBhbGxvd3MgeW91IHRvIGF1dG9hc3NpZ24gdXNlcnMgdG8gd29ybGRzIGFuZCBlbnN1cmUgdGhhdCBhbGwgcm9sZXMgYXJlIGZpbGxlZCBpbiBlYWNoIHdvcmxkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgcGFyYW1zLm9wdGlvbmFsUm9sZXNgIChPcHRpb25hbCkgVGhlIGxpc3Qgb2Ygb3B0aW9uYWwgcm9sZXMgKHN0cmluZ3MpIGZvciB0aGlzIHdvcmxkLiBTb21lIHdvcmxkcyBoYXZlIHNwZWNpZmljIHJvbGVzIHRoYXQgKiptYXkqKiBiZSBmaWxsZWQgYnkgZW5kIHVzZXJzLiBMaXN0aW5nIHRoZSBvcHRpb25hbCByb2xlcyBhcyBwYXJ0IG9mIHRoZSB3b3JsZCBvYmplY3QgYWxsb3dzIHlvdSB0byBhdXRvYXNzaWduIHVzZXJzIHRvIHdvcmxkcyBhbmQgZW5zdXJlIHRoYXQgYWxsIHJvbGVzIGFyZSBmaWxsZWQgaW4gZWFjaCB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge2ludGVnZXJ9IGBwYXJhbXMubWluVXNlcnNgIChPcHRpb25hbCkgVGhlIG1pbmltdW0gbnVtYmVyIG9mIHVzZXJzIGZvciB0aGUgd29ybGQuIEluY2x1ZGluZyB0aGlzIG51bWJlciBhbGxvd3MgeW91IHRvIGF1dG9hc3NpZ24gZW5kIHVzZXJzIHRvIHdvcmxkcyBhbmQgZW5zdXJlIHRoYXQgdGhlIGNvcnJlY3QgbnVtYmVyIG9mIHVzZXJzIGFyZSBpbiBlYWNoIHdvcmxkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKlxuICAgICAgICAqL1xuICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBjcmVhdGVPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zLCB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpIH0pO1xuICAgICAgICAgICAgdmFyIHdvcmxkQXBpUGFyYW1zID0gWydzY29wZScsICdmaWxlcycsICdyb2xlcycsICdvcHRpb25hbFJvbGVzJywgJ21pblVzZXJzJywgJ2dyb3VwJywgJ25hbWUnXTtcbiAgICAgICAgICAgIC8vIHdoaXRlbGlzdCB0aGUgZmllbGRzIHRoYXQgd2UgYWN0dWFsbHkgY2FuIHNlbmQgdG8gdGhlIGFwaVxuICAgICAgICAgICAgcGFyYW1zID0gX3BpY2socGFyYW1zLCB3b3JsZEFwaVBhcmFtcyk7XG5cbiAgICAgICAgICAgIC8vIGFjY291bnQgYW5kIHByb2plY3QgZ28gaW4gdGhlIGJvZHksIG5vdCBpbiB0aGUgdXJsXG4gICAgICAgICAgICAkLmV4dGVuZChwYXJhbXMsIF9waWNrKHNlcnZpY2VPcHRpb25zLCBbJ2FjY291bnQnLCAncHJvamVjdCcsICdncm91cCddKSk7XG5cbiAgICAgICAgICAgIHZhciBvbGRTdWNjZXNzID0gY3JlYXRlT3B0aW9ucy5zdWNjZXNzO1xuICAgICAgICAgICAgY3JlYXRlT3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gcmVzcG9uc2UuaWQ7IC8vYWxsIGZ1dHVyZSBjaGFpbmVkIGNhbGxzIHRvIG9wZXJhdGUgb24gdGhpcyBpZFxuICAgICAgICAgICAgICAgIHJldHVybiBvbGRTdWNjZXNzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHBhcmFtcywgY3JlYXRlT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogVXBkYXRlcyBhIFdvcmxkLCBmb3IgZXhhbXBsZSB0byByZXBsYWNlIHRoZSByb2xlcyBpbiB0aGUgd29ybGQuXG4gICAgICAgICpcbiAgICAgICAgKiBUeXBpY2FsbHksIHlvdSBjb21wbGV0ZSB3b3JsZCBjb25maWd1cmF0aW9uIGF0IHRoZSBwcm9qZWN0IGxldmVsLCByYXRoZXIgdGhhbiBhdCB0aGUgd29ybGQgbGV2ZWwuIEZvciBleGFtcGxlLCBlYWNoIHdvcmxkIGluIHlvdXIgcHJvamVjdCBwcm9iYWJseSBoYXMgdGhlIHNhbWUgcm9sZXMgZm9yIGVuZCB1c2Vycy4gQW5kIHlvdXIgcHJvamVjdCBpcyBwcm9iYWJseSBlaXRoZXIgY29uZmlndXJlZCBzbyB0aGF0IGFsbCBlbmQgdXNlcnMgc2hhcmUgdGhlIHNhbWUgd29ybGQgKGFuZCBydW4pLCBvciBzbWFsbGVyIHNldHMgb2YgZW5kIHVzZXJzIHNoYXJlIHdvcmxkcyDigJQgYnV0IG5vdCBib3RoLiBIb3dldmVyLCB0aGlzIG1ldGhvZCBpcyBhdmFpbGFibGUgaWYgeW91IG5lZWQgdG8gdXBkYXRlIHRoZSBjb25maWd1cmF0aW9uIG9mIGEgcGFydGljdWxhciB3b3JsZC5cbiAgICAgICAgKlxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKiAgICAgIHdhLmNyZWF0ZSgpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHdvcmxkKSB7XG4gICAgICAgICogICAgICAgICAgICAgICB3YS51cGRhdGUoeyByb2xlczogWydWUCBNYXJrZXRpbmcnLCAnVlAgU2FsZXMnLCAnVlAgRW5naW5lZXJpbmcnXSB9KTtcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYHBhcmFtc2AgUGFyYW1ldGVycyB0byB1cGRhdGUgdGhlIHdvcmxkLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgcGFyYW1zLm5hbWVgIEEgc3RyaW5nIGlkZW50aWZpZXIgZm9yIHRoZSBsaW5rZWQgZW5kIHVzZXJzLCBmb3IgZXhhbXBsZSwgXCJuYW1lXCI6IFwiT3VyIFRlYW1cIi5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYHBhcmFtcy5yb2xlc2AgKE9wdGlvbmFsKSBUaGUgbGlzdCBvZiByb2xlcyAoc3RyaW5ncykgZm9yIHRoaXMgd29ybGQuIFNvbWUgd29ybGRzIGhhdmUgc3BlY2lmaWMgcm9sZXMgdGhhdCAqKm11c3QqKiBiZSBmaWxsZWQgYnkgZW5kIHVzZXJzLiBMaXN0aW5nIHRoZSByb2xlcyBhbGxvd3MgeW91IHRvIGF1dG9hc3NpZ24gdXNlcnMgdG8gd29ybGRzIGFuZCBlbnN1cmUgdGhhdCBhbGwgcm9sZXMgYXJlIGZpbGxlZCBpbiBlYWNoIHdvcmxkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgcGFyYW1zLm9wdGlvbmFsUm9sZXNgIChPcHRpb25hbCkgVGhlIGxpc3Qgb2Ygb3B0aW9uYWwgcm9sZXMgKHN0cmluZ3MpIGZvciB0aGlzIHdvcmxkLiBTb21lIHdvcmxkcyBoYXZlIHNwZWNpZmljIHJvbGVzIHRoYXQgKiptYXkqKiBiZSBmaWxsZWQgYnkgZW5kIHVzZXJzLiBMaXN0aW5nIHRoZSBvcHRpb25hbCByb2xlcyBhcyBwYXJ0IG9mIHRoZSB3b3JsZCBvYmplY3QgYWxsb3dzIHlvdSB0byBhdXRvYXNzaWduIHVzZXJzIHRvIHdvcmxkcyBhbmQgZW5zdXJlIHRoYXQgYWxsIHJvbGVzIGFyZSBmaWxsZWQgaW4gZWFjaCB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge2ludGVnZXJ9IGBwYXJhbXMubWluVXNlcnNgIChPcHRpb25hbCkgVGhlIG1pbmltdW0gbnVtYmVyIG9mIHVzZXJzIGZvciB0aGUgd29ybGQuIEluY2x1ZGluZyB0aGlzIG51bWJlciBhbGxvd3MgeW91IHRvIGF1dG9hc3NpZ24gZW5kIHVzZXJzIHRvIHdvcmxkcyBhbmQgZW5zdXJlIHRoYXQgdGhlIGNvcnJlY3QgbnVtYmVyIG9mIHVzZXJzIGFyZSBpbiBlYWNoIHdvcmxkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKlxuICAgICAgICAqL1xuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciB3aGl0ZWxpc3QgPSBbJ3JvbGVzJywgJ29wdGlvbmFsUm9sZXMnLCAnbWluVXNlcnMnXTtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciB1cGRhdGVPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHBhcmFtcyA9IF9waWNrKHBhcmFtcyB8fCB7fSwgd2hpdGVsaXN0KTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucGF0Y2gocGFyYW1zLCB1cGRhdGVPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBEZWxldGVzIGFuIGV4aXN0aW5nIHdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogVGhpcyBmdW5jdGlvbiBvcHRpb25hbGx5IHRha2VzIG9uZSBhcmd1bWVudC4gSWYgdGhlIGFyZ3VtZW50IGlzIGEgc3RyaW5nLCBpdCBpcyB0aGUgaWQgb2YgdGhlIHdvcmxkIHRvIGRlbGV0ZS4gSWYgdGhlIGFyZ3VtZW50IGlzIGFuIG9iamVjdCwgaXQgaXMgdGhlIG92ZXJyaWRlIGZvciBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKlxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKiAgICAgIHdhLmNyZWF0ZSgpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHdvcmxkKSB7XG4gICAgICAgICogICAgICAgICAgICAgICB3YS5kZWxldGUoKTtcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIFRoZSBpZCBvZiB0aGUgd29ybGQgdG8gZGVsZXRlLCBvciBvcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKlxuICAgICAgICAqL1xuICAgICAgICBkZWxldGU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gKG9wdGlvbnMgJiYgKHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJykpID8geyBmaWx0ZXI6IG9wdGlvbnMgfSA6IHt9O1xuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBkZWxldGVPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmRlbGV0ZShudWxsLCBkZWxldGVPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBVcGRhdGVzIHRoZSBjb25maWd1cmF0aW9uIGZvciB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGUgV29ybGQgQVBJIEFkYXB0ZXIgKGluY2x1ZGluZyBhbGwgc3Vic2VxdWVudCBmdW5jdGlvbiBjYWxscywgdW50aWwgdGhlIGNvbmZpZ3VyYXRpb24gaXMgdXBkYXRlZCBhZ2FpbikuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHsuLi59KS51cGRhdGVDb25maWcoeyBmaWx0ZXI6ICcxMjMnIH0pLmFkZFVzZXIoeyB1c2VySWQ6ICcxMjMnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYGNvbmZpZ2AgVGhlIGNvbmZpZ3VyYXRpb24gb2JqZWN0IHRvIHVzZSBpbiB1cGRhdGluZyBleGlzdGluZyBjb25maWd1cmF0aW9uLlxuICAgICAgICAqL1xuICAgICAgICB1cGRhdGVDb25maWc6IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgICAgICQuZXh0ZW5kKHNlcnZpY2VPcHRpb25zLCBjb25maWcpO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBMaXN0cyBhbGwgd29ybGRzIGZvciBhIGdpdmVuIGFjY291bnQsIHByb2plY3QsIGFuZCBncm91cC4gQWxsIHRocmVlIGFyZSByZXF1aXJlZCwgYW5kIGlmIG5vdCBzcGVjaWZpZWQgYXMgcGFyYW1ldGVycywgYXJlIHJlYWQgZnJvbSB0aGUgc2VydmljZS5cbiAgICAgICAgKlxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKiAgICAgIHdhLmNyZWF0ZSgpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHdvcmxkKSB7XG4gICAgICAgICogICAgICAgICAgICAgICAvLyBsaXN0cyBhbGwgd29ybGRzIGluIGdyb3VwIFwidGVhbTFcIlxuICAgICAgICAqICAgICAgICAgICAgICAgd2EubGlzdCgpO1xuICAgICAgICAqXG4gICAgICAgICogICAgICAgICAgICAgICAvLyBsaXN0cyBhbGwgd29ybGRzIGluIGdyb3VwIFwib3RoZXItZ3JvdXAtbmFtZVwiXG4gICAgICAgICogICAgICAgICAgICAgICB3YS5saXN0KHsgZ3JvdXA6ICdvdGhlci1ncm91cC1uYW1lJyB9KTtcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICpcbiAgICAgICAgKi9cbiAgICAgICAgbGlzdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICB2YXIgZ2V0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICB2YXIgZmlsdGVycyA9IF9waWNrKGdldE9wdGlvbnMsIFsnYWNjb3VudCcsICdwcm9qZWN0JywgJ2dyb3VwJ10pO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoZmlsdGVycywgZ2V0T3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogR2V0cyBhbGwgd29ybGRzIHRoYXQgYW4gZW5kIHVzZXIgYmVsb25ncyB0byBmb3IgYSBnaXZlbiBhY2NvdW50ICh0ZWFtKSwgcHJvamVjdCwgYW5kIGdyb3VwLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmdldFdvcmxkc0ZvclVzZXIoJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMycpXG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKiogUGFyYW1ldGVycyAqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgdXNlcklkYCBUaGUgYHVzZXJJZGAgb2YgdGhlIHVzZXIgd2hvc2Ugd29ybGRzIGFyZSBiZWluZyByZXRyaWV2ZWQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqL1xuICAgICAgICBnZXRXb3JsZHNGb3JVc2VyOiBmdW5jdGlvbiAodXNlcklkLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgdmFyIGdldE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgdmFyIGZpbHRlcnMgPSAkLmV4dGVuZChcbiAgICAgICAgICAgICAgICBfcGljayhnZXRPcHRpb25zLCBbJ2FjY291bnQnLCAncHJvamVjdCcsICdncm91cCddKSxcbiAgICAgICAgICAgICAgICB7IHVzZXJJZDogdXNlcklkIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChmaWx0ZXJzLCBnZXRPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogTG9hZCBpbmZvcm1hdGlvbiBmb3IgYSBzcGVjaWZpYyB3b3JsZC4gQWxsIGZ1cnRoZXIgY2FsbHMgdG8gdGhlIHdvcmxkIHNlcnZpY2Ugd2lsbCB1c2UgdGhlIGlkIHByb3ZpZGVkLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gYHdvcmxkSWRgIFRoZSBpZCBvZiB0aGUgd29ybGQgdG8gbG9hZC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKHdvcmxkSWQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmICh3b3JsZElkKSB7XG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gd29ybGRJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc2VydmljZU9wdGlvbnMuZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2UgcHJvdmlkZSBhIHdvcmxkaWQgdG8gbG9hZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zLCAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHNlcnZpY2VPcHRpb25zLmZpbHRlciArICcvJyB9KTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldCgnJywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEFkZHMgYW4gZW5kIHVzZXIgb3IgbGlzdCBvZiBlbmQgdXNlcnMgdG8gYSBnaXZlbiB3b3JsZC4gVGhlIGVuZCB1c2VyIG11c3QgYmUgYSBtZW1iZXIgb2YgdGhlIGBncm91cGAgdGhhdCBpcyBhc3NvY2lhdGVkIHdpdGggdGhpcyB3b3JsZC5cbiAgICAgICAgKlxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKiAgICAgIHdhLmNyZWF0ZSgpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHdvcmxkKSB7XG4gICAgICAgICogICAgICAgICAgICAgICAvLyBhZGQgb25lIHVzZXJcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmFkZFVzZXJzKCdiMWMxOWRkYS0yZDJlLTQ3NzctYWQ1ZC0zOTI5ZjE3ZTg2ZDMnKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmFkZFVzZXJzKFsnYjFjMTlkZGEtMmQyZS00Nzc3LWFkNWQtMzkyOWYxN2U4NmQzJ10pO1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EuYWRkVXNlcnMoeyB1c2VySWQ6ICdiMWMxOWRkYS0yZDJlLTQ3NzctYWQ1ZC0zOTI5ZjE3ZTg2ZDMnLCByb2xlOiAnVlAgU2FsZXMnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICAgICAgICAgICAvLyBhZGQgc2V2ZXJhbCB1c2Vyc1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EuYWRkVXNlcnMoW1xuICAgICAgICAqICAgICAgICAgICAgICAgICAgIHsgdXNlcklkOiAnYTZmZTBjMWUtZjRiOC00ZjAxLTlmNWYtMDFjY2Y0YzJlZDQ0JyxcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICAgIHJvbGU6ICdWUCBNYXJrZXRpbmcnIH0sXG4gICAgICAgICogICAgICAgICAgICAgICAgICAgeyB1c2VySWQ6ICc4ZjI2MDRjZi05NmNkLTQ0OWYtODJmYS1lMzMxNTMwNzM0ZWUnLFxuICAgICAgICAqICAgICAgICAgICAgICAgICAgICAgcm9sZTogJ1ZQIEVuZ2luZWVyaW5nJyB9XG4gICAgICAgICogICAgICAgICAgICAgICBdKTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgICAgICAgICAgLy8gYWRkIG9uZSB1c2VyIHRvIGEgc3BlY2lmaWMgd29ybGRcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmFkZFVzZXJzKCdiMWMxOWRkYS0yZDJlLTQ3NzctYWQ1ZC0zOTI5ZjE3ZTg2ZDMnLCB3b3JsZC5pZCk7XG4gICAgICAgICogICAgICAgICAgICAgICB3YS5hZGRVc2VycygnYjFjMTlkZGEtMmQyZS00Nzc3LWFkNWQtMzkyOWYxN2U4NmQzJywgeyBmaWx0ZXI6IHdvcmxkLmlkIH0pO1xuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqIFBhcmFtZXRlcnMgKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ3xvYmplY3R8YXJyYXl9IGB1c2Vyc2AgVXNlciBpZCwgYXJyYXkgb2YgdXNlciBpZHMsIG9iamVjdCwgb3IgYXJyYXkgb2Ygb2JqZWN0cyBvZiB0aGUgdXNlcnMgdG8gYWRkIHRvIHRoaXMgd29ybGQuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGB1c2Vycy5yb2xlYCBUaGUgYHJvbGVgIHRoZSB1c2VyIHNob3VsZCBoYXZlIGluIHRoZSB3b3JsZC4gSXQgaXMgdXAgdG8gdGhlIGNhbGxlciB0byBlbnN1cmUsIGlmIG5lZWRlZCwgdGhhdCB0aGUgYHJvbGVgIHBhc3NlZCBpbiBpcyBvbmUgb2YgdGhlIGByb2xlc2Agb3IgYG9wdGlvbmFsUm9sZXNgIG9mIHRoaXMgd29ybGQuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGB3b3JsZElkYCBUaGUgd29ybGQgdG8gd2hpY2ggdGhlIHVzZXJzIHNob3VsZCBiZSBhZGRlZC4gSWYgbm90IHNwZWNpZmllZCwgdGhlIGZpbHRlciBwYXJhbWV0ZXIgb2YgdGhlIGBvcHRpb25zYCBvYmplY3QgaXMgdXNlZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICovXG4gICAgICAgIGFkZFVzZXJzOiBmdW5jdGlvbiAodXNlcnMsIHdvcmxkSWQsIG9wdGlvbnMpIHtcblxuICAgICAgICAgICAgaWYgKCF1c2Vycykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHByb3ZpZGUgYSBsaXN0IG9mIHVzZXJzIHRvIGFkZCB0byB0aGUgd29ybGQnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gbm9ybWFsaXplIHRoZSBsaXN0IG9mIHVzZXJzIHRvIGFuIGFycmF5IG9mIHVzZXIgb2JqZWN0c1xuICAgICAgICAgICAgdXNlcnMgPSAkLm1hcChbXS5jb25jYXQodXNlcnMpLCBmdW5jdGlvbiAodSkge1xuICAgICAgICAgICAgICAgIHZhciBpc09iamVjdCA9ICQuaXNQbGFpbk9iamVjdCh1KTtcblxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdSAhPT0gJ3N0cmluZycgJiYgIWlzT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU29tZSBvZiB0aGUgdXNlcnMgaW4gdGhlIGxpc3QgYXJlIG5vdCBpbiB0aGUgdmFsaWQgZm9ybWF0OiAnICsgdSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzT2JqZWN0ID8gdSA6IHsgdXNlcklkOiB1IH07XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gY2hlY2sgaWYgb3B0aW9ucyB3ZXJlIHBhc3NlZCBhcyB0aGUgc2Vjb25kIHBhcmFtZXRlclxuICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdCh3b3JsZElkKSAmJiAhb3B0aW9ucykge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSB3b3JsZElkO1xuICAgICAgICAgICAgICAgIHdvcmxkSWQgPSBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgLy8gd2UgbXVzdCBoYXZlIG9wdGlvbnMgYnkgbm93XG4gICAgICAgICAgICBpZiAodHlwZW9mIHdvcmxkSWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5maWx0ZXIgPSB3b3JsZElkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZXRJZEZpbHRlck9yVGhyb3dFcnJvcihvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIHVwZGF0ZU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgKyAnL3VzZXJzJyB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHVzZXJzLCB1cGRhdGVPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBVcGRhdGVzIHRoZSByb2xlIG9mIGFuIGVuZCB1c2VyIGluIGEgZ2l2ZW4gd29ybGQuIChZb3UgY2FuIG9ubHkgdXBkYXRlIG9uZSBlbmQgdXNlciBhdCBhIHRpbWUuKVxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHdhLmNyZWF0ZSgpLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgd2EuYWRkVXNlcnMoJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMycpO1xuICAgICAgICAqICAgICAgICAgICB3YS51cGRhdGVVc2VyKHsgdXNlcklkOiAnYjFjMTlkZGEtMmQyZS00Nzc3LWFkNWQtMzkyOWYxN2U4NmQzJywgcm9sZTogJ2xlYWRlcicgfSk7XG4gICAgICAgICogICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGB1c2VyYCBVc2VyIG9iamVjdCB3aXRoIGB1c2VySWRgIGFuZCB0aGUgbmV3IGByb2xlYC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICpcbiAgICAgICAgKi9cbiAgICAgICAgdXBkYXRlVXNlcjogZnVuY3Rpb24gKHVzZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICBpZiAoIXVzZXIgfHwgIXVzZXIudXNlcklkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgbmVlZCB0byBwYXNzIGEgdXNlcklkIHRvIHVwZGF0ZSBmcm9tIHRoZSB3b3JsZCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZXRJZEZpbHRlck9yVGhyb3dFcnJvcihvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIHBhdGNoT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHNlcnZpY2VPcHRpb25zLmZpbHRlciArICcvdXNlcnMvJyArIHVzZXIudXNlcklkIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBhdGNoKF9waWNrKHVzZXIsICdyb2xlJyksIHBhdGNoT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogUmVtb3ZlcyBhbiBlbmQgdXNlciBmcm9tIGEgZ2l2ZW4gd29ybGQuXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gICAgICAgICogICAgICB3YS5jcmVhdGUoKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbih3b3JsZCkge1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EuYWRkVXNlcnMoWydhNmZlMGMxZS1mNGI4LTRmMDEtOWY1Zi0wMWNjZjRjMmVkNDQnLCAnOGYyNjA0Y2YtOTZjZC00NDlmLTgyZmEtZTMzMTUzMDczNGVlJ10pO1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EucmVtb3ZlVXNlcignYTZmZTBjMWUtZjRiOC00ZjAxLTlmNWYtMDFjY2Y0YzJlZDQ0Jyk7XG4gICAgICAgICogICAgICAgICAgICAgICB3YS5yZW1vdmVVc2VyKHsgdXNlcklkOiAnOGYyNjA0Y2YtOTZjZC00NDlmLTgyZmEtZTMzMTUzMDczNGVlJyB9KTtcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKiBQYXJhbWV0ZXJzICoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R8c3RyaW5nfSBgdXNlcmAgVGhlIGB1c2VySWRgIG9mIHRoZSB1c2VyIHRvIHJlbW92ZSBmcm9tIHRoZSB3b3JsZCwgb3IgYW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGB1c2VySWRgIGZpZWxkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKi9cbiAgICAgICAgcmVtb3ZlVXNlcjogZnVuY3Rpb24gKHVzZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHVzZXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdXNlciA9IHsgdXNlcklkOiB1c2VyIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghdXNlci51c2VySWQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBuZWVkIHRvIHBhc3MgYSB1c2VySWQgdG8gcmVtb3ZlIGZyb20gdGhlIHdvcmxkJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNldElkRmlsdGVyT3JUaHJvd0Vycm9yKG9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgZ2V0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHNlcnZpY2VPcHRpb25zLmZpbHRlciArICcvdXNlcnMvJyArIHVzZXIudXNlcklkIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmRlbGV0ZShudWxsLCBnZXRPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBHZXRzIHRoZSBydW4gaWQgb2YgY3VycmVudCBydW4gZm9yIHRoZSBnaXZlbiB3b3JsZC4gSWYgdGhlIHdvcmxkIGRvZXMgbm90IGhhdmUgYSBydW4sIGNyZWF0ZXMgYSBuZXcgb25lIGFuZCByZXR1cm5zIHRoZSBydW4gaWQuXG4gICAgICAgICpcbiAgICAgICAgKiBSZW1lbWJlciB0aGF0IGEgW3J1bl0oLi4vLi4vZ2xvc3NhcnkvI3J1bikgaXMgYSBjb2xsZWN0aW9uIG9mIGludGVyYWN0aW9ucyB3aXRoIGEgcHJvamVjdCBhbmQgaXRzIG1vZGVsLiBJbiB0aGUgY2FzZSBvZiBtdWx0aXBsYXllciBwcm9qZWN0cywgdGhlIHJ1biBpcyBzaGFyZWQgYnkgYWxsIGVuZCB1c2VycyBpbiB0aGUgd29ybGQuXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gICAgICAgICogICAgICB3YS5jcmVhdGUoKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbih3b3JsZCkge1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EuZ2V0Q3VycmVudFJ1bklkKHsgbW9kZWw6ICdtb2RlbC5weScgfSk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKiogUGFyYW1ldGVycyAqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnMubW9kZWxgIFRoZSBtb2RlbCBmaWxlIHRvIHVzZSB0byBjcmVhdGUgYSBydW4gaWYgbmVlZGVkLlxuICAgICAgICAqL1xuICAgICAgICBnZXRDdXJyZW50UnVuSWQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBnZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyICsgJy9ydW4nIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHZhbGlkYXRlTW9kZWxPclRocm93RXJyb3IoZ2V0T3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KF9waWNrKGdldE9wdGlvbnMsICdtb2RlbCcpLCBnZXRPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBHZXRzIHRoZSBjdXJyZW50IChtb3N0IHJlY2VudCkgd29ybGQgZm9yIHRoZSBnaXZlbiBlbmQgdXNlciBpbiB0aGUgZ2l2ZW4gZ3JvdXAuIEJyaW5ncyB0aGlzIG1vc3QgcmVjZW50IHdvcmxkIGludG8gbWVtb3J5IGlmIG5lZWRlZC5cbiAgICAgICAgKlxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKiAgICAgIHdhLmdldEN1cnJlbnRXb3JsZEZvclVzZXIoJzhmMjYwNGNmLTk2Y2QtNDQ5Zi04MmZhLWUzMzE1MzA3MzRlZScpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHdvcmxkKSB7XG4gICAgICAgICogICAgICAgICAgICAgICAvLyB1c2UgZGF0YSBmcm9tIHdvcmxkXG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKiogUGFyYW1ldGVycyAqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgdXNlcklkYCBUaGUgYHVzZXJJZGAgb2YgdGhlIHVzZXIgd2hvc2UgY3VycmVudCAobW9zdCByZWNlbnQpIHdvcmxkIGlzIGJlaW5nIHJldHJpZXZlZC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYGdyb3VwTmFtZWAgKE9wdGlvbmFsKSBUaGUgbmFtZSBvZiB0aGUgZ3JvdXAuIElmIG5vdCBwcm92aWRlZCwgZGVmYXVsdHMgdG8gdGhlIGdyb3VwIHVzZWQgdG8gY3JlYXRlIHRoZSBzZXJ2aWNlLlxuICAgICAgICAqL1xuICAgICAgICBnZXRDdXJyZW50V29ybGRGb3JVc2VyOiBmdW5jdGlvbiAodXNlcklkLCBncm91cE5hbWUpIHtcbiAgICAgICAgICAgIHZhciBkdGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICAgICAgdGhpcy5nZXRXb3JsZHNGb3JVc2VyKHVzZXJJZCwgeyBncm91cDogZ3JvdXBOYW1lIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHdvcmxkcykge1xuICAgICAgICAgICAgICAgICAgICAvLyBhc3N1bWUgdGhlIG1vc3QgcmVjZW50IHdvcmxkIGFzIHRoZSAnYWN0aXZlJyB3b3JsZFxuICAgICAgICAgICAgICAgICAgICB3b3JsZHMuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gbmV3IERhdGUoYi5sYXN0TW9kaWZpZWQpIC0gbmV3IERhdGUoYS5sYXN0TW9kaWZpZWQpOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRXb3JsZCA9IHdvcmxkc1swXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudFdvcmxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSAgY3VycmVudFdvcmxkLmlkO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZHRkLnJlc29sdmUoY3VycmVudFdvcmxkLCBtZSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmFpbChkdGQucmVqZWN0KTtcblxuICAgICAgICAgICAgcmV0dXJuIGR0ZC5wcm9taXNlKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogRGVsZXRlcyB0aGUgY3VycmVudCBydW4gZnJvbSB0aGUgd29ybGQuXG4gICAgICAgICpcbiAgICAgICAgKiAoTm90ZSB0aGF0IHRoZSB3b3JsZCBpZCByZW1haW5zIHBhcnQgb2YgdGhlIHJ1biByZWNvcmQsIGluZGljYXRpbmcgdGhhdCB0aGUgcnVuIHdhcyBmb3JtZXJseSBhbiBhY3RpdmUgcnVuIGZvciB0aGUgd29ybGQuKVxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICB3YS5kZWxldGVSdW4oJ3NhbXBsZS13b3JsZC1pZCcpO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGB3b3JsZElkYCBUaGUgYHdvcmxkSWRgIG9mIHRoZSB3b3JsZCBmcm9tIHdoaWNoIHRoZSBjdXJyZW50IHJ1biBpcyBiZWluZyBkZWxldGVkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKi9cbiAgICAgICAgZGVsZXRlUnVuOiBmdW5jdGlvbiAod29ybGRJZCwgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgICAgIGlmICh3b3JsZElkKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5maWx0ZXIgPSB3b3JsZElkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZXRJZEZpbHRlck9yVGhyb3dFcnJvcihvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIGRlbGV0ZU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgKyAnL3J1bicgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZGVsZXRlKG51bGwsIGRlbGV0ZU9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIENyZWF0ZXMgYSBuZXcgcnVuIGZvciB0aGUgd29ybGQuXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHdhLmdldEN1cnJlbnRXb3JsZEZvclVzZXIoJzhmMjYwNGNmLTk2Y2QtNDQ5Zi04MmZhLWUzMzE1MzA3MzRlZScpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICh3b3JsZCkge1xuICAgICAgICAqICAgICAgICAgICAgICAgICAgIHdhLm5ld1J1bkZvcldvcmxkKHdvcmxkLmlkKTtcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYHdvcmxkSWRgIHdvcmxkSWQgaW4gd2hpY2ggd2UgY3JlYXRlIHRoZSBuZXcgcnVuLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnMubW9kZWxgIFRoZSBtb2RlbCBmaWxlIHRvIHVzZSB0byBjcmVhdGUgYSBydW4gaWYgbmVlZGVkLlxuICAgICAgICAqL1xuICAgICAgICBuZXdSdW5Gb3JXb3JsZDogZnVuY3Rpb24gKHdvcmxkSWQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBjdXJyZW50UnVuT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyBmaWx0ZXI6IHdvcmxkSWQgfHwgc2VydmljZU9wdGlvbnMuZmlsdGVyIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgICAgICB2YWxpZGF0ZU1vZGVsT3JUaHJvd0Vycm9yKGN1cnJlbnRSdW5PcHRpb25zKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGVsZXRlUnVuKHdvcmxkSWQsIG9wdGlvbnMpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMuZ2V0Q3VycmVudFJ1bklkKGN1cnJlbnRSdW5PcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBBc3NpZ25zIGVuZCB1c2VycyB0byB3b3JsZHMsIGNyZWF0aW5nIG5ldyB3b3JsZHMgYXMgYXBwcm9wcmlhdGUsIGF1dG9tYXRpY2FsbHkuIEFzc2lnbnMgYWxsIGVuZCB1c2VycyBpbiB0aGUgZ3JvdXAsIGFuZCBjcmVhdGVzIG5ldyB3b3JsZHMgYXMgbmVlZGVkIGJhc2VkIG9uIHRoZSBwcm9qZWN0LWxldmVsIHdvcmxkIGNvbmZpZ3VyYXRpb24gKHJvbGVzLCBvcHRpb25hbCByb2xlcywgYW5kIG1pbmltdW0gZW5kIHVzZXJzIHBlciB3b3JsZCkuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgd2EuYXV0b0Fzc2lnbigpO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICpcbiAgICAgICAgKi9cbiAgICAgICAgYXV0b0Fzc2lnbjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICB2YXIgb3B0ID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXNzaWdubWVudEVuZHBvaW50KSB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICAgICAgICAgIGFjY291bnQ6IG9wdC5hY2NvdW50LFxuICAgICAgICAgICAgICAgIHByb2plY3Q6IG9wdC5wcm9qZWN0LFxuICAgICAgICAgICAgICAgIGdyb3VwOiBvcHQuZ3JvdXBcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChvcHQubWF4VXNlcnMpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMubWF4VXNlcnMgPSBvcHQubWF4VXNlcnM7XG4gICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChwYXJhbXMsIG9wdCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogR2V0cyB0aGUgcHJvamVjdCdzIHdvcmxkIGNvbmZpZ3VyYXRpb24uXG4gICAgICAgICpcbiAgICAgICAgKiBUeXBpY2FsbHksIGV2ZXJ5IGludGVyYWN0aW9uIHdpdGggeW91ciBwcm9qZWN0IHVzZXMgdGhlIHNhbWUgY29uZmlndXJhdGlvbiBvZiBlYWNoIHdvcmxkLiBGb3IgZXhhbXBsZSwgZWFjaCB3b3JsZCBpbiB5b3VyIHByb2plY3QgcHJvYmFibHkgaGFzIHRoZSBzYW1lIHJvbGVzIGZvciBlbmQgdXNlcnMuIEFuZCB5b3VyIHByb2plY3QgaXMgcHJvYmFibHkgZWl0aGVyIGNvbmZpZ3VyZWQgc28gdGhhdCBhbGwgZW5kIHVzZXJzIHNoYXJlIHRoZSBzYW1lIHdvcmxkIChhbmQgcnVuKSwgb3Igc21hbGxlciBzZXRzIG9mIGVuZCB1c2VycyBzaGFyZSB3b3JsZHMg4oCUIGJ1dCBub3QgYm90aC5cbiAgICAgICAgKlxuICAgICAgICAqIChUaGUgW011bHRpcGxheWVyIFByb2plY3QgUkVTVCBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9tdWx0aXBsYXllci9tdWx0aXBsYXllcl9wcm9qZWN0LykgYWxsb3dzIHlvdSB0byBzZXQgdGhlc2UgcHJvamVjdC1sZXZlbCB3b3JsZCBjb25maWd1cmF0aW9ucy4gVGhlIFdvcmxkIEFkYXB0ZXIgc2ltcGx5IHJldHJpZXZlcyB0aGVtLCBmb3IgZXhhbXBsZSBzbyB0aGV5IGNhbiBiZSB1c2VkIGluIGF1dG8tYXNzaWdubWVudCBvZiBlbmQgdXNlcnMgdG8gd29ybGRzLilcbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICB3YS5nZXRQcm9qZWN0U2V0dGluZ3MoKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbihzZXR0aW5ncykge1xuICAgICAgICAqICAgICAgICAgICAgICAgY29uc29sZS5sb2coc2V0dGluZ3Mucm9sZXMpO1xuICAgICAgICAqICAgICAgICAgICAgICAgY29uc29sZS5sb2coc2V0dGluZ3Mub3B0aW9uYWxSb2xlcyk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICovXG4gICAgICAgIGdldFByb2plY3RTZXR0aW5nczogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICB2YXIgb3B0ID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgocHJvamVjdEVuZHBvaW50KSB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBvcHQudXJsICs9IFtvcHQuYWNjb3VudCwgb3B0LnByb2plY3RdLmpvaW4oJy8nKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KG51bGwsIG9wdCk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIi8qKlxuICogQGNsYXNzIENvb2tpZSBTdG9yYWdlIFNlcnZpY2VcbiAqXG4gKiBAZXhhbXBsZVxuICogICAgICB2YXIgcGVvcGxlID0gcmVxdWlyZSgnY29va2llLXN0b3JlJykoeyByb290OiAncGVvcGxlJyB9KTtcbiAgICAgICAgcGVvcGxlXG4gICAgICAgICAgICAuc2F2ZSh7bGFzdE5hbWU6ICdzbWl0aCcgfSlcblxuICovXG5cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOYW1lIG9mIGNvbGxlY3Rpb25cbiAgICAgICAgICogQHR5cGUgeyBzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICByb290OiAnLycsXG5cbiAgICAgICAgZG9tYWluOiAnLmZvcmlvLmNvbSdcbiAgICB9O1xuICAgIHRoaXMuc2VydmljZU9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuICAgICAgICAvLyAqIFRCRFxuICAgICAgICAvLyAgKiBRdWVyeSBjb2xsZWN0aW9uOyB1c2VzIE1vbmdvREIgc3ludGF4XG4gICAgICAgIC8vICAqIEBzZWUgIDxUQkQ6IERhdGEgQVBJIFVSTD5cbiAgICAgICAgLy8gICpcbiAgICAgICAgLy8gICogQHBhcmFtIHsgc3RyaW5nfSBxcyBRdWVyeSBGaWx0ZXJcbiAgICAgICAgLy8gICogQHBhcmFtIHsgc3RyaW5nfSBsaW1pdGVycyBAc2VlIDxUQkQ6IHVybCBmb3IgbGltaXRzLCBwYWdpbmcgZXRjPlxuICAgICAgICAvLyAgKlxuICAgICAgICAvLyAgKiBAZXhhbXBsZVxuICAgICAgICAvLyAgKiAgICAgY3MucXVlcnkoXG4gICAgICAgIC8vICAqICAgICAgeyBuYW1lOiAnSm9obicsIGNsYXNzTmFtZTogJ0NTQzEwMScgfSxcbiAgICAgICAgLy8gICogICAgICB7bGltaXQ6IDEwfVxuICAgICAgICAvLyAgKiAgICAgKVxuXG4gICAgICAgIC8vIHF1ZXJ5OiBmdW5jdGlvbiAocXMsIGxpbWl0ZXJzKSB7XG5cbiAgICAgICAgLy8gfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2F2ZSBjb29raWUgdmFsdWVcbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xPYmplY3R9IGtleSAgIElmIGdpdmVuIGEga2V5IHNhdmUgdmFsdWVzIHVuZGVyIGl0LCBpZiBnaXZlbiBhbiBvYmplY3QgZGlyZWN0bHksIHNhdmUgdG8gdG9wLWxldmVsIGFwaVxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IHZhbHVlIChPcHRpb25hbClcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgT3ZlcnJpZGVzIGZvciBzZXJ2aWNlIG9wdGlvbnNcbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybiB7Kn0gVGhlIHNhdmVkIHZhbHVlXG4gICAgICAgICAqXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqICAgICBjcy5zZXQoJ3BlcnNvbicsIHsgZmlyc3ROYW1lOiAnam9obicsIGxhc3ROYW1lOiAnc21pdGgnIH0pO1xuICAgICAgICAgKiAgICAgY3Muc2V0KHsgbmFtZTonc21pdGgnLCBhZ2U6JzMyJyB9KTtcbiAgICAgICAgICovXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGtleSwgdmFsdWUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBzZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHRoaXMuc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgZG9tYWluID0gc2V0T3B0aW9ucy5kb21haW47XG4gICAgICAgICAgICB2YXIgcGF0aCA9IHNldE9wdGlvbnMucm9vdDtcblxuICAgICAgICAgICAgZG9jdW1lbnQuY29va2llID0gZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyAnPScgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGRvbWFpbiA/ICc7IGRvbWFpbj0nICsgZG9tYWluIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHBhdGggPyAnOyBwYXRoPScgKyBwYXRoIDogJycpO1xuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExvYWQgY29va2llIHZhbHVlXG4gICAgICAgICAqIEBwYXJhbSAgeyBzdHJpbmd8T2JqZWN0fSBrZXkgICBJZiBnaXZlbiBhIGtleSBzYXZlIHZhbHVlcyB1bmRlciBpdCwgaWYgZ2l2ZW4gYW4gb2JqZWN0IGRpcmVjdGx5LCBzYXZlIHRvIHRvcC1sZXZlbCBhcGlcbiAgICAgICAgICogQHJldHVybiB7Kn0gVGhlIHZhbHVlIHN0b3JlZFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiAgICAgY3MuZ2V0KCdwZXJzb24nKTtcbiAgICAgICAgICovXG4gICAgICAgIGdldDogZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgdmFyIGNvb2tpZVJlZyA9IG5ldyBSZWdFeHAoJyg/Oig/Ol58Lio7KVxcXFxzKicgKyBlbmNvZGVVUklDb21wb25lbnQoa2V5KS5yZXBsYWNlKC9bXFwtXFwuXFwrXFwqXS9nLCAnXFxcXCQmJykgKyAnXFxcXHMqXFxcXD1cXFxccyooW147XSopLiokKXxeLiokJyk7XG4gICAgICAgICAgICB2YXIgdmFsID0gZG9jdW1lbnQuY29va2llLnJlcGxhY2UoY29va2llUmVnLCAnJDEnKTtcbiAgICAgICAgICAgIHZhbCA9IGRlY29kZVVSSUNvbXBvbmVudCh2YWwpIHx8IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmVzIGtleSBmcm9tIGNvbGxlY3Rpb25cbiAgICAgICAgICogQHBhcmFtIHsgc3RyaW5nfSBrZXkga2V5IHRvIHJlbW92ZVxuICAgICAgICAgKiBAcmV0dXJuIHsgc3RyaW5nfSBrZXkgVGhlIGtleSByZW1vdmVkXG4gICAgICAgICAqXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqICAgICBjcy5yZW1vdmUoJ3BlcnNvbicpO1xuICAgICAgICAgKi9cbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbiAoa2V5LCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgcmVtT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCB0aGlzLnNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIGRvbWFpbiA9IHJlbU9wdGlvbnMuZG9tYWluO1xuICAgICAgICAgICAgdmFyIHBhdGggPSByZW1PcHRpb25zLnJvb3Q7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LmNvb2tpZSA9IGVuY29kZVVSSUNvbXBvbmVudChrZXkpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPTsgZXhwaXJlcz1UaHUsIDAxIEphbiAxOTcwIDAwOjAwOjAwIEdNVCcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChkb21haW4gPyAnOyBkb21haW49JyArIGRvbWFpbiA6ICcnKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHBhdGggPyAnOyBwYXRoPScgKyBwYXRoIDogJycpO1xuICAgICAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBjb2xsZWN0aW9uIGJlaW5nIHJlZmVyZW5jZWRcbiAgICAgICAgICogQHJldHVybiB7IGFycmF5fSBrZXlzIEFsbCB0aGUga2V5cyByZW1vdmVkXG4gICAgICAgICAqL1xuICAgICAgICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYUtleXMgPSBkb2N1bWVudC5jb29raWUucmVwbGFjZSgvKCg/Ol58XFxzKjspW15cXD1dKykoPz07fCQpfF5cXHMqfFxccyooPzpcXD1bXjtdKik/KD86XFwxfCQpL2csICcnKS5zcGxpdCgvXFxzKig/OlxcPVteO10qKT87XFxzKi8pO1xuICAgICAgICAgICAgZm9yICh2YXIgbklkeCA9IDA7IG5JZHggPCBhS2V5cy5sZW5ndGg7IG5JZHgrKykge1xuICAgICAgICAgICAgICAgIHZhciBjb29raWVLZXkgPSBkZWNvZGVVUklDb21wb25lbnQoYUtleXNbbklkeF0pO1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlKGNvb2tpZUtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYUtleXM7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG4iLCIvKipcbiAgICBEZWNpZGVzIHR5cGUgb2Ygc3RvcmUgdG8gcHJvdmlkZVxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuLy8gdmFyIGlzTm9kZSA9IGZhbHNlOyBGSVhNRTogQnJvd3NlcmlmeS9taW5pZnlpZnkgaGFzIGlzc3VlcyB3aXRoIHRoZSBuZXh0IGxpbmtcbi8vIHZhciBzdG9yZSA9IChpc05vZGUpID8gcmVxdWlyZSgnLi9zZXNzaW9uLXN0b3JlJykgOiByZXF1aXJlKCcuL2Nvb2tpZS1zdG9yZScpO1xudmFyIHN0b3JlID0gcmVxdWlyZSgnLi9jb29raWUtc3RvcmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBzdG9yZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHF1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWwvcXVlcnktdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcblxuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgdXJsOiAnJyxcblxuICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICBoZWFkZXJzOiB7fSxcbiAgICAgICAgc3RhdHVzQ29kZToge1xuICAgICAgICAgICAgNDA0OiAkLm5vb3BcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT05MWSBmb3Igc3RyaW5ncyBpbiB0aGUgdXJsLiBBbGwgR0VUICYgREVMRVRFIHBhcmFtcyBhcmUgcnVuIHRocm91Z2ggdGhpc1xuICAgICAgICAgKiBAdHlwZSB7W3R5cGVdIH1cbiAgICAgICAgICovXG4gICAgICAgIHBhcmFtZXRlclBhcnNlcjogcXV0aWxzLnRvUXVlcnlGb3JtYXQsXG5cbiAgICAgICAgLy8gVG8gYWxsb3cgZXBpY2VudGVyLnRva2VuIGFuZCBvdGhlciBzZXNzaW9uIGNvb2tpZXMgdG8gYmUgcGFzc2VkXG4gICAgICAgIC8vIHdpdGggdGhlIHJlcXVlc3RzXG4gICAgICAgIHhockZpZWxkczoge1xuICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHRyYW5zcG9ydE9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG5cbiAgICB2YXIgcmVzdWx0ID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcmV0dXJuICgkLmlzRnVuY3Rpb24oZCkpID8gZCgpIDogZDtcbiAgICB9O1xuXG4gICAgdmFyIGNvbm5lY3QgPSBmdW5jdGlvbiAobWV0aG9kLCBwYXJhbXMsIGNvbm5lY3RPcHRpb25zKSB7XG4gICAgICAgIHBhcmFtcyA9IHJlc3VsdChwYXJhbXMpO1xuICAgICAgICBwYXJhbXMgPSAoJC5pc1BsYWluT2JqZWN0KHBhcmFtcykgfHwgJC5pc0FycmF5KHBhcmFtcykpID8gSlNPTi5zdHJpbmdpZnkocGFyYW1zKSA6IHBhcmFtcztcblxuICAgICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCB0cmFuc3BvcnRPcHRpb25zLCBjb25uZWN0T3B0aW9ucywge1xuICAgICAgICAgICAgdHlwZTogbWV0aG9kLFxuICAgICAgICAgICAgZGF0YTogcGFyYW1zXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgQUxMT1dFRF9UT19CRV9GVU5DVElPTlMgPSBbJ2RhdGEnLCAndXJsJ107XG4gICAgICAgICQuZWFjaChvcHRpb25zLCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbih2YWx1ZSkgJiYgJC5pbkFycmF5KGtleSwgQUxMT1dFRF9UT19CRV9GVU5DVElPTlMpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnNba2V5XSA9IHZhbHVlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChvcHRpb25zLmxvZ0xldmVsICYmIG9wdGlvbnMubG9nTGV2ZWwgPT09ICdERUJVRycpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG9wdGlvbnMudXJsKTtcbiAgICAgICAgICAgIHZhciBvbGRTdWNjZXNzRm4gPSBvcHRpb25zLnN1Y2Nlc3MgfHwgJC5ub29wO1xuICAgICAgICAgICAgb3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24gKHJlc3BvbnNlLCBhamF4U3RhdHVzLCBhamF4UmVxKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIG9sZFN1Y2Nlc3NGbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBiZWZvcmVTZW5kID0gb3B0aW9ucy5iZWZvcmVTZW5kO1xuICAgICAgICBvcHRpb25zLmJlZm9yZVNlbmQgPSBmdW5jdGlvbiAoeGhyLCBzZXR0aW5ncykge1xuICAgICAgICAgICAgeGhyLnJlcXVlc3RVcmwgPSAoY29ubmVjdE9wdGlvbnMgfHwge30pLnVybDtcbiAgICAgICAgICAgIGlmIChiZWZvcmVTZW5kKSB7XG4gICAgICAgICAgICAgICAgYmVmb3JlU2VuZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiAkLmFqYXgob3B0aW9ucyk7XG4gICAgfTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG4gICAgICAgIGdldDpmdW5jdGlvbiAocGFyYW1zLCBhamF4T3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdHJhbnNwb3J0T3B0aW9ucywgYWpheE9wdGlvbnMpO1xuICAgICAgICAgICAgcGFyYW1zID0gb3B0aW9ucy5wYXJhbWV0ZXJQYXJzZXIocmVzdWx0KHBhcmFtcykpO1xuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuY2FsbCh0aGlzLCAnR0VUJywgcGFyYW1zLCBvcHRpb25zKTtcbiAgICAgICAgfSxcbiAgICAgICAgc3BsaXRHZXQ6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB9LFxuICAgICAgICBwb3N0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdC5hcHBseSh0aGlzLCBbJ3Bvc3QnXS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH0sXG4gICAgICAgIHBhdGNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdC5hcHBseSh0aGlzLCBbJ3BhdGNoJ10uY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9LFxuICAgICAgICBwdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0LmFwcGx5KHRoaXMsIFsncHV0J10uY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9LFxuICAgICAgICBkZWxldGU6IGZ1bmN0aW9uIChwYXJhbXMsIGFqYXhPcHRpb25zKSB7XG4gICAgICAgICAgICAvL0RFTEVURSBkb2Vzbid0IHN1cHBvcnQgYm9keSBwYXJhbXMsIGJ1dCBqUXVlcnkgdGhpbmtzIGl0IGRvZXMuXG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCB0cmFuc3BvcnRPcHRpb25zLCBhamF4T3B0aW9ucyk7XG4gICAgICAgICAgICBwYXJhbXMgPSBvcHRpb25zLnBhcmFtZXRlclBhcnNlcihyZXN1bHQocGFyYW1zKSk7XG4gICAgICAgICAgICBpZiAoJC50cmltKHBhcmFtcykpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVsaW1pdGVyID0gKHJlc3VsdChvcHRpb25zLnVybCkuaW5kZXhPZignPycpID09PSAtMSkgPyAnPycgOiAnJic7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy51cmwgPSByZXN1bHQob3B0aW9ucy51cmwpICsgZGVsaW1pdGVyICsgcGFyYW1zO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuY2FsbCh0aGlzLCAnREVMRVRFJywgbnVsbCwgb3B0aW9ucyk7XG4gICAgICAgIH0sXG4gICAgICAgIGhlYWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0LmFwcGx5KHRoaXMsIFsnaGVhZCddLmNvbmNhdChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgfSxcbiAgICAgICAgb3B0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuYXBwbHkodGhpcywgWydvcHRpb25zJ10uY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gdmFyIGlzTm9kZSA9IGZhbHNlOyBGSVhNRTogQnJvd3NlcmlmeS9taW5pZnlpZnkgaGFzIGlzc3VlcyB3aXRoIHRoZSBuZXh0IGxpbmtcbi8vIHZhciB0cmFuc3BvcnQgPSAoaXNOb2RlKSA/IHJlcXVpcmUoJy4vbm9kZS1odHRwLXRyYW5zcG9ydCcpIDogcmVxdWlyZSgnLi9hamF4LWh0dHAtdHJhbnNwb3J0Jyk7XG52YXIgdHJhbnNwb3J0ID0gcmVxdWlyZSgnLi9hamF4LWh0dHAtdHJhbnNwb3J0Jyk7XG5tb2R1bGUuZXhwb3J0cyA9IHRyYW5zcG9ydDtcbiIsIi8qKlxuLyogSW5oZXJpdCBmcm9tIGEgY2xhc3MgKHVzaW5nIHByb3RvdHlwZSBib3Jyb3dpbmcpXG4qL1xuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBpbmhlcml0KEMsIFApIHtcbiAgICB2YXIgRiA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIEYucHJvdG90eXBlID0gUC5wcm90b3R5cGU7XG4gICAgQy5wcm90b3R5cGUgPSBuZXcgRigpO1xuICAgIEMuX19zdXBlciA9IFAucHJvdG90eXBlO1xuICAgIEMucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQztcbn1cblxuLyoqXG4qIFNoYWxsb3cgY29weSBvZiBhbiBvYmplY3RcbiovXG52YXIgZXh0ZW5kID0gZnVuY3Rpb24gKGRlc3QgLyosIHZhcl9hcmdzKi8pIHtcbiAgICB2YXIgb2JqID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICB2YXIgY3VycmVudDtcbiAgICBmb3IgKHZhciBqID0gMDsgajxvYmoubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKCEoY3VycmVudCA9IG9ialtqXSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZG8gbm90IHdyYXAgaW5uZXIgaW4gZGVzdC5oYXNPd25Qcm9wZXJ0eSBvciBiYWQgdGhpbmdzIHdpbGwgaGFwcGVuXG4gICAgICAgIC8qanNoaW50IC1XMDg5ICovXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBjdXJyZW50KSB7XG4gICAgICAgICAgICBkZXN0W2tleV0gPSBjdXJyZW50W2tleV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGVzdDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGJhc2UsIHByb3BzLCBzdGF0aWNQcm9wcykge1xuICAgIHZhciBwYXJlbnQgPSBiYXNlO1xuICAgIHZhciBjaGlsZDtcblxuICAgIGNoaWxkID0gcHJvcHMgJiYgcHJvcHMuaGFzT3duUHJvcGVydHkoJ2NvbnN0cnVjdG9yJykgPyBwcm9wcy5jb25zdHJ1Y3RvciA6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHBhcmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9O1xuXG4gICAgLy8gYWRkIHN0YXRpYyBwcm9wZXJ0aWVzIHRvIHRoZSBjaGlsZCBjb25zdHJ1Y3RvciBmdW5jdGlvblxuICAgIGV4dGVuZChjaGlsZCwgcGFyZW50LCBzdGF0aWNQcm9wcyk7XG5cbiAgICAvLyBhc3NvY2lhdGUgcHJvdG90eXBlIGNoYWluXG4gICAgaW5oZXJpdChjaGlsZCwgcGFyZW50KTtcblxuICAgIC8vIGFkZCBpbnN0YW5jZSBwcm9wZXJ0aWVzXG4gICAgaWYgKHByb3BzKSB7XG4gICAgICAgIGV4dGVuZChjaGlsZC5wcm90b3R5cGUsIHByb3BzKTtcbiAgICB9XG5cbiAgICAvLyBkb25lXG4gICAgcmV0dXJuIGNoaWxkO1xufTtcbiIsIid1c2Ugc3RyaWN0Jztcbi8qanNoaW50IGxvb3BmdW5jOmZhbHNlICovXG5cbmZ1bmN0aW9uIF93KHZhbCkge1xuICAgIGlmICh2YWwgJiYgdmFsLnRoZW4pIHtcbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9XG4gICAgdmFyIHAgPSAkLkRlZmVycmVkKCk7XG4gICAgcC5yZXNvbHZlKHZhbCk7XG5cbiAgICByZXR1cm4gcC5wcm9taXNlKCk7XG59XG5cbmZ1bmN0aW9uIHNlcSgpIHtcbiAgICB2YXIgbGlzdCA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShhcmd1bWVudHMpO1xuXG4gICAgZnVuY3Rpb24gbmV4dChwKSB7XG4gICAgICAgIHZhciBjdXIgPSBsaXN0LnNwbGljZSgwLDEpWzBdO1xuXG4gICAgICAgIGlmICghY3VyKSB7XG4gICAgICAgICAgICByZXR1cm4gcDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBfdyhjdXIocCkpLnRoZW4obmV4dCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChzZWVkKSB7XG4gICAgICAgIHJldHVybiBuZXh0KHNlZWQpLmZhaWwoc2VxLmZhaWwpO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIE1ha2VTZXEob2JqKSB7XG4gICAgdmFyIHJlcyA9IHtcbiAgICAgICAgX19jYWxsczogW10sXG5cbiAgICAgICAgb3JpZ2luYWw6IG9iaixcblxuICAgICAgICB0aGVuOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgIHRoaXMuX19jYWxscy5wdXNoKGZuKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgICAgICAvLyBjbGVhbiB1cFxuICAgICAgICAgICAgdGhpcy50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5fX2NhbGxzLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gc2VxLmFwcGx5KG51bGwsIHRoaXMuX19jYWxscykoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBmYWlsOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgIHNlcS5mYWlsID0gZm47XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgZnVuY01ha2VyID0gZnVuY3Rpb24gKHAsIG9iaikge1xuICAgICAgICB2YXIgZm4gPSBvYmpbcF0uYmluZChvYmopO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoYXJndW1lbnRzKTtcbiAgICAgICAgICAgIHRoaXMuX19jYWxscy5wdXNoKEZ1bmN0aW9uLmJpbmQuYXBwbHkoZm4sIFtudWxsXS5jb25jYXQoYXJncykpKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xuICAgICAgICBpZiAodHlwZW9mIG9ialtwcm9wXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmVzW3Byb3BdID0gZnVuY01ha2VyKHByb3AsIG9iaik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXNbcHJvcF0gPSBvYmpbcHJvcF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1ha2VTZXE7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIF9waWNrOiBmdW5jdGlvbiAob2JqLCBwcm9wcykge1xuICAgICAgICB2YXIgcmVzID0ge307XG4gICAgICAgIGZvciAodmFyIHAgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAocHJvcHMuaW5kZXhPZihwKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXNbcF0gPSBvYmpbcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbn07XG4iLCIvKipcbiAqIFV0aWxpdGllcyBmb3Igd29ya2luZyB3aXRoIHF1ZXJ5IHN0cmluZ3NcbiovXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb252ZXJ0cyB0byBtYXRyaXggZm9ybWF0XG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gcXMgT2JqZWN0IHRvIGNvbnZlcnQgdG8gcXVlcnkgc3RyaW5nXG4gICAgICAgICAqIEByZXR1cm4geyBzdHJpbmd9ICAgIE1hdHJpeC1mb3JtYXQgcXVlcnkgcGFyYW1ldGVyc1xuICAgICAgICAgKi9cbiAgICAgICAgdG9NYXRyaXhGb3JtYXQ6IGZ1bmN0aW9uIChxcykge1xuICAgICAgICAgICAgaWYgKHFzID09PSBudWxsIHx8IHFzID09PSB1bmRlZmluZWQgfHwgcXMgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICc7JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgcXMgPT09ICdzdHJpbmcnIHx8IHFzIGluc3RhbmNlb2YgU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHFzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcmV0dXJuQXJyYXkgPSBbXTtcbiAgICAgICAgICAgIHZhciBPUEVSQVRPUlMgPSBbJzwnLCAnPicsICchJ107XG4gICAgICAgICAgICAkLmVhY2gocXMsIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgfHwgJC5pbkFycmF5KCQudHJpbSh2YWx1ZSkuY2hhckF0KDApLCBPUEVSQVRPUlMpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9ICc9JyArIHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm5BcnJheS5wdXNoKGtleSArIHZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2YXIgbXRyeCA9ICc7JyArIHJldHVybkFycmF5LmpvaW4oJzsnKTtcbiAgICAgICAgICAgIHJldHVybiBtdHJ4O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb252ZXJ0cyBzdHJpbmdzL2FycmF5cy9vYmplY3RzIHRvIHR5cGUgJ2E9YiZiPWMnXG4gICAgICAgICAqIEBwYXJhbSAgeyBzdHJpbmd8QXJyYXl8T2JqZWN0fSBxc1xuICAgICAgICAgKiBAcmV0dXJuIHsgc3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdG9RdWVyeUZvcm1hdDogZnVuY3Rpb24gKHFzKSB7XG4gICAgICAgICAgICBpZiAocXMgPT09IG51bGwgfHwgcXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgcXMgPT09ICdzdHJpbmcnIHx8IHFzIGluc3RhbmNlb2YgU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHFzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcmV0dXJuQXJyYXkgPSBbXTtcbiAgICAgICAgICAgICQuZWFjaChxcywgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoJC5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLmpvaW4oJywnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy9Nb3N0bHkgZm9yIGRhdGEgYXBpXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm5BcnJheS5wdXNoKGtleSArICc9JyArIHZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gcmV0dXJuQXJyYXkuam9pbignJicpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29udmVydHMgc3RyaW5ncyBvZiB0eXBlICdhPWImYj1jJyB0byB7IGE6YiwgYjpjfVxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfSBxc1xuICAgICAgICAgKiBAcmV0dXJuIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBxc1RvT2JqZWN0OiBmdW5jdGlvbiAocXMpIHtcbiAgICAgICAgICAgIGlmIChxcyA9PT0gbnVsbCB8fCBxcyA9PT0gdW5kZWZpbmVkIHx8IHFzID09PSAnJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHFzQXJyYXkgPSBxcy5zcGxpdCgnJicpO1xuICAgICAgICAgICAgdmFyIHJldHVybk9iaiA9IHt9O1xuICAgICAgICAgICAgJC5lYWNoKHFzQXJyYXksIGZ1bmN0aW9uIChpbmRleCwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcUtleSA9IHZhbHVlLnNwbGl0KCc9JylbMF07XG4gICAgICAgICAgICAgICAgdmFyIHFWYWwgPSB2YWx1ZS5zcGxpdCgnPScpWzFdO1xuXG4gICAgICAgICAgICAgICAgaWYgKHFWYWwuaW5kZXhPZignLCcpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBxVmFsID0gcVZhbC5zcGxpdCgnLCcpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybk9ialtxS2V5XSA9IHFWYWw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHJldHVybk9iajtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogTm9ybWFsaXplcyBhbmQgbWVyZ2VzIHN0cmluZ3Mgb2YgdHlwZSAnYT1iJywgeyBiOmN9IHRvIHsgYTpiLCBiOmN9XG4gICAgICAgICAqIEBwYXJhbSAgeyBzdHJpbmd8QXJyYXl8T2JqZWN0fSBxczFcbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xBcnJheXxPYmplY3R9IHFzMlxuICAgICAgICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBtZXJnZVFTOiBmdW5jdGlvbiAocXMxLCBxczIpIHtcbiAgICAgICAgICAgIHZhciBvYmoxID0gdGhpcy5xc1RvT2JqZWN0KHRoaXMudG9RdWVyeUZvcm1hdChxczEpKTtcbiAgICAgICAgICAgIHZhciBvYmoyID0gdGhpcy5xc1RvT2JqZWN0KHRoaXMudG9RdWVyeUZvcm1hdChxczIpKTtcbiAgICAgICAgICAgIHJldHVybiAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqMSwgb2JqMik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWRkVHJhaWxpbmdTbGFzaDogZnVuY3Rpb24gKHVybCkge1xuICAgICAgICAgICAgaWYgKCF1cmwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gKHVybC5jaGFyQXQodXJsLmxlbmd0aCAtIDEpID09PSAnLycpID8gdXJsIDogKHVybCArICcvJyk7XG4gICAgICAgIH1cbiAgICB9O1xufSgpKTtcblxuXG5cbiIsIi8qKlxuICogVXRpbGl0aWVzIGZvciB3b3JraW5nIHdpdGggdGhlIHJ1biBzZXJ2aWNlXG4qL1xuJ3VzZSBzdHJpY3QnO1xudmFyIHF1dGlsID0gcmVxdWlyZSgnLi9xdWVyeS11dGlsJyk7XG52YXIgTUFYX1VSTF9MRU5HVEggPSAyMDQ4O1xuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIHJldHVybnMgb3BlcmF0aW9ucyBvZiB0aGUgZm9ybSBgW1tvcDEsb3AyXSwgW2FyZzEsIGFyZzJdXWBcbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fEFycmF5fFN0cmluZ30gYG9wZXJhdGlvbnNgIG9wZXJhdGlvbnMgdG8gcGVyZm9ybVxuICAgICAgICAgKiBAcGFyYW0gIHtBcnJheX0gYGFyZ3NgIGFyZ3VtZW50cyBmb3Igb3BlcmF0aW9uXG4gICAgICAgICAqIEByZXR1cm4ge1N0cmluZ30gICAgTWF0cml4LWZvcm1hdCBxdWVyeSBwYXJhbWV0ZXJzXG4gICAgICAgICAqL1xuICAgICAgICBub3JtYWxpemVPcGVyYXRpb25zOiBmdW5jdGlvbiAob3BlcmF0aW9ucywgYXJncykge1xuICAgICAgICAgICAgaWYgKCFhcmdzKSB7XG4gICAgICAgICAgICAgICAgYXJncyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHJldHVybkxpc3QgPSB7XG4gICAgICAgICAgICAgICAgb3BzOiBbXSxcbiAgICAgICAgICAgICAgICBhcmdzOiBbXVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIF9jb25jYXQgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChhcnIgIT09IG51bGwgJiYgYXJyICE9PSB1bmRlZmluZWQpID8gW10uY29uY2F0KGFycikgOiBbXTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8veyBhZGQ6IFsxLDJdLCBzdWJ0cmFjdDogWzIsNF0gfVxuICAgICAgICAgICAgdmFyIF9ub3JtYWxpemVQbGFpbk9iamVjdHMgPSBmdW5jdGlvbiAob3BlcmF0aW9ucywgcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgIGlmICghcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5MaXN0ID0geyBvcHM6IFtdLCBhcmdzOiBbXSB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkLmVhY2gob3BlcmF0aW9ucywgZnVuY3Rpb24gKG9wbiwgYXJnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybkxpc3Qub3BzLnB1c2gob3BuKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuTGlzdC5hcmdzLnB1c2goX2NvbmNhdChhcmcpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0dXJuTGlzdDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvL3sgbmFtZTogJ2FkZCcsIHBhcmFtczogWzFdIH1cbiAgICAgICAgICAgIHZhciBfbm9ybWFsaXplU3RydWN0dXJlZE9iamVjdHMgPSBmdW5jdGlvbiAob3BlcmF0aW9uLCByZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybkxpc3QgPSB7IG9wczogW10sIGFyZ3M6IFtdIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybkxpc3Qub3BzLnB1c2gob3BlcmF0aW9uLm5hbWUpO1xuICAgICAgICAgICAgICAgIHJldHVybkxpc3QuYXJncy5wdXNoKF9jb25jYXQob3BlcmF0aW9uLnBhcmFtcykpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXR1cm5MaXN0O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIF9ub3JtYWxpemVPYmplY3QgPSBmdW5jdGlvbiAob3BlcmF0aW9uLCByZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICgob3BlcmF0aW9uLm5hbWUpID8gX25vcm1hbGl6ZVN0cnVjdHVyZWRPYmplY3RzIDogX25vcm1hbGl6ZVBsYWluT2JqZWN0cykob3BlcmF0aW9uLCByZXR1cm5MaXN0KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBfbm9ybWFsaXplTGl0ZXJhbHMgPSBmdW5jdGlvbiAob3BlcmF0aW9uLCBhcmdzLCByZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybkxpc3QgPSB7IG9wczogW10sIGFyZ3M6IFtdIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybkxpc3Qub3BzLnB1c2gob3BlcmF0aW9uKTtcbiAgICAgICAgICAgICAgICByZXR1cm5MaXN0LmFyZ3MucHVzaChfY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0dXJuTGlzdDtcbiAgICAgICAgICAgIH07XG5cblxuICAgICAgICAgICAgdmFyIF9ub3JtYWxpemVBcnJheXMgPSBmdW5jdGlvbiAob3BlcmF0aW9ucywgYXJnLCByZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybkxpc3QgPSB7IG9wczogW10sIGFyZ3M6IFtdIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICQuZWFjaChvcGVyYXRpb25zLCBmdW5jdGlvbiAoaW5kZXgsIG9wbikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KG9wbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9ub3JtYWxpemVPYmplY3Qob3BuLCByZXR1cm5MaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9ub3JtYWxpemVMaXRlcmFscyhvcG4sIGFyZ3NbaW5kZXhdLCByZXR1cm5MaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXR1cm5MaXN0O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdChvcGVyYXRpb25zKSkge1xuICAgICAgICAgICAgICAgIF9ub3JtYWxpemVPYmplY3Qob3BlcmF0aW9ucywgcmV0dXJuTGlzdCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCQuaXNBcnJheShvcGVyYXRpb25zKSkge1xuICAgICAgICAgICAgICAgIF9ub3JtYWxpemVBcnJheXMob3BlcmF0aW9ucywgYXJncywgcmV0dXJuTGlzdCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIF9ub3JtYWxpemVMaXRlcmFscyhvcGVyYXRpb25zLCBhcmdzLCByZXR1cm5MaXN0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJldHVybkxpc3Q7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3BsaXRHZXRGYWN0b3J5OiBmdW5jdGlvbiAoaHR0cE9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyIGh0dHAgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHZhciBnZXRWYWx1ZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IG9wdGlvbnNbbmFtZV0gfHwgaHR0cE9wdGlvbnNbbmFtZV07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB2YXIgZ2V0RmluYWxVcmwgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB1cmwgPSBnZXRWYWx1ZSgndXJsJywgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gcGFyYW1zO1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGVyZSBpcyBlYXN5IChvciBrbm93bikgd2F5IHRvIGdldCB0aGUgZmluYWwgVVJMIGpxdWVyeSBpcyBnb2luZyB0byBzZW5kIHNvXG4gICAgICAgICAgICAgICAgICAgIC8vIHdlJ3JlIHJlcGxpY2F0aW5nIGl0LiBUaGUgcHJvY2VzcyBtaWdodCBjaGFuZ2UgYXQgc29tZSBwb2ludCBidXQgaXQgcHJvYmFibHkgd2lsbCBub3QuXG4gICAgICAgICAgICAgICAgICAgIC8vIDEuIFJlbW92ZSBoYXNoXG4gICAgICAgICAgICAgICAgICAgIHVybCA9IHVybC5yZXBsYWNlKC8jLiokLywgJycpO1xuICAgICAgICAgICAgICAgICAgICAvLyAxLiBBcHBlbmQgcXVlcnkgc3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIHZhciBxdWVyeVBhcmFtcyA9IHF1dGlsLnRvUXVlcnlGb3JtYXQoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBxdWVzdGlvbklkeCA9IHVybC5pbmRleE9mKCc/Jyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChxdWVyeVBhcmFtcyAmJiBxdWVzdGlvbklkeCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdXJsICsgJyYnICsgcXVlcnlQYXJhbXM7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocXVlcnlQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1cmwgKyAnPycgKyBxdWVyeVBhcmFtcztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdXJsO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdmFyIHVybCA9IGdldEZpbmFsVXJsKHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgLy8gV2UgbXVzdCBzcGxpdCB0aGUgR0VUIGluIG11bHRpcGxlIHNob3J0IFVSTCdzXG4gICAgICAgICAgICAgICAgLy8gVGhlIG9ubHkgcHJvcGVydHkgYWxsb3dlZCB0byBiZSBzcGxpdCBpcyBcImluY2x1ZGVcIlxuICAgICAgICAgICAgICAgIGlmIChwYXJhbXMgJiYgcGFyYW1zLmluY2x1ZGUgJiYgdXJsLmxlbmd0aCA+IE1BWF9VUkxfTEVOR1RIKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkdGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJhbXNDb3B5ID0gJC5leHRlbmQodHJ1ZSwge30sIHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBwYXJhbXNDb3B5LmluY2x1ZGU7XG4gICAgICAgICAgICAgICAgICAgIHZhciB1cmxOb0luY2x1ZGVzID0gZ2V0RmluYWxVcmwocGFyYW1zQ29weSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaWZmID0gTUFYX1VSTF9MRU5HVEggLSB1cmxOb0luY2x1ZGVzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9sZFN1Y2Nlc3MgPSBvcHRpb25zLnN1Y2Nlc3MgfHwgaHR0cE9wdGlvbnMuc3VjY2VzcyB8fCAkLm5vb3A7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvbGRFcnJvciA9IG9wdGlvbnMuZXJyb3IgfHwgaHR0cE9wdGlvbnMuZXJyb3IgfHwgJC5ub29wO1xuICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIG9yaWdpbmFsIHN1Y2Nlc3MgYW5kIGVycm9yIGNhbGxiYWNrc1xuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnN1Y2Nlc3MgPSAkLm5vb3A7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZXJyb3IgPSAkLm5vb3A7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGluY2x1ZGUgPSBwYXJhbXMuaW5jbHVkZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJJbmNsdWRlcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5jbHVkZU9wdHMgPSBbY3VyckluY2x1ZGVzXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJMZW5ndGggPSAnP2luY2x1ZGU9Jy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YXJpYWJsZSA9IGluY2x1ZGUucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICh2YXJpYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXNlIGEgZ3JlZWR5IGFwcHJvYWNoIGZvciBub3csIGNhbiBiZSBvcHRpbWl6ZWQgdG8gYmUgc29sdmVkIGluIGEgbW9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZWZmaWNpZW50IHdheVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gKyAxIGlzIHRoZSBjb21tYVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJMZW5ndGggKyB2YXJpYWJsZS5sZW5ndGggKyAxIDwgZGlmZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJJbmNsdWRlcy5wdXNoKHZhcmlhYmxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyTGVuZ3RoICs9IHZhcmlhYmxlLmxlbmd0aCArIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJJbmNsdWRlcyA9IFt2YXJpYWJsZV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZU9wdHMucHVzaChjdXJySW5jbHVkZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJMZW5ndGggPSAnP2luY2x1ZGU9Jy5sZW5ndGggKyB2YXJpYWJsZS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZSA9IGluY2x1ZGUucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlcXMgPSAkLm1hcChpbmNsdWRlT3B0cywgZnVuY3Rpb24gKGluY2x1ZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXFQYXJhbXMgPSAkLmV4dGVuZCh7fSwgcGFyYW1zLCB7IGluY2x1ZGU6IGluY2x1ZGUgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQocmVxUGFyYW1zLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICQud2hlbi5hcHBseSgkLCByZXFzKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVhY2ggYXJndW1lbnQgYXJlIGFycmF5cyBvZiB0aGUgYXJndW1lbnRzIG9mIGVhY2ggZG9uZSByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTbyB0aGUgZmlyc3QgYXJndW1lbnQgb2YgdGhlIGZpcnN0IGFycmF5IG9mIGFyZ3VtZW50cyBpcyB0aGUgZGF0YVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzVmFsaWQgPSBhcmd1bWVudHNbMF0gJiYgYXJndW1lbnRzWzBdWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2hvdWxkIG5ldmVyIGhhcHBlbi4uLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZEVycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGR0ZC5yZWplY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmaXJzdFJlc3BvbnNlID0gYXJndW1lbnRzWzBdWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzT2JqZWN0ID0gJC5pc1BsYWluT2JqZWN0KGZpcnN0UmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzUnVuQVBJID0gKGlzT2JqZWN0ICYmICQuaXNQbGFpbk9iamVjdChmaXJzdFJlc3BvbnNlLnZhcmlhYmxlcykpIHx8ICFpc09iamVjdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1J1bkFQSSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc09iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhZ2dyZWdhdGUgdGhlIHZhcmlhYmxlcyBwcm9wZXJ0eSBvbmx5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhZ2dyZWdhdGVSdW4gPSBhcmd1bWVudHNbMF1bMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChhcmd1bWVudHMsIGZ1bmN0aW9uIChpZHgsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBydW4gPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5leHRlbmQodHJ1ZSwgYWdncmVnYXRlUnVuLnZhcmlhYmxlcywgcnVuLnZhcmlhYmxlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRTdWNjZXNzKGFnZ3JlZ2F0ZVJ1biwgYXJndW1lbnRzWzBdWzFdLCBhcmd1bWVudHNbMF1bMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZShhZ2dyZWdhdGVSdW4sIGFyZ3VtZW50c1swXVsxXSwgYXJndW1lbnRzWzBdWzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhcnJheSBvZiBydW5zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFncmVnYXRlIHZhcmlhYmxlcyBpbiBlYWNoIHJ1blxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWdncmVnYXRlZFJ1bnMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGFyZ3VtZW50cywgZnVuY3Rpb24gKGlkeCwgYXJncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJ1bnMgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkLmlzQXJyYXkocnVucykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2gocnVucywgZnVuY3Rpb24gKGlkeFJ1biwgcnVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bi5pZCAmJiAhYWdncmVnYXRlZFJ1bnNbcnVuLmlkXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBydW4udmFyaWFibGVzID0gcnVuLnZhcmlhYmxlcyB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlZFJ1bnNbcnVuLmlkXSA9IHJ1bjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJ1bi5pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCBhZ2dyZWdhdGVkUnVuc1tydW4uaWRdLnZhcmlhYmxlcywgcnVuLnZhcmlhYmxlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0dXJuIGl0IGludG8gYW4gYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlZFJ1bnMgPSAkLm1hcChhZ2dyZWdhdGVkUnVucywgZnVuY3Rpb24gKHJ1bikgeyByZXR1cm4gcnVuOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkU3VjY2VzcyhhZ2dyZWdhdGVkUnVucywgYXJndW1lbnRzWzBdWzFdLCBhcmd1bWVudHNbMF1bMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZShhZ2dyZWdhdGVkUnVucywgYXJndW1lbnRzWzBdWzFdLCBhcmd1bWVudHNbMF1bMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXMgdmFyaWFibGVzIEFQSVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFnZ3JlZ2F0ZSB0aGUgcmVzcG9uc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWdncmVnYXRlZFZhcmlhYmxlcyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChhcmd1bWVudHMsIGZ1bmN0aW9uIChpZHgsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhcnMgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCBhZ2dyZWdhdGVkVmFyaWFibGVzLCB2YXJzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRTdWNjZXNzKGFnZ3JlZ2F0ZWRWYXJpYWJsZXMsIGFyZ3VtZW50c1swXVsxXSwgYXJndW1lbnRzWzBdWzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZShhZ2dyZWdhdGVkVmFyaWFibGVzLCBhcmd1bWVudHNbMF1bMV0sIGFyZ3VtZW50c1swXVsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9sZEVycm9yLmFwcGx5KGh0dHAsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkdGQucmVqZWN0LmFwcGx5KGR0ZCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkdGQucHJvbWlzZSgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBodHRwLmdldChwYXJhbXMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9O1xufSgpKTtcbiJdfQ==
