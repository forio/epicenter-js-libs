(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var kMaxLength = 0x3fffffff
var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = (function () {
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

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
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Find the length
  var length
  if (type === 'number') {
    length = +subject
  } else if (type === 'string') {
    length = Buffer.byteLength(subject, encoding)
  } else if (type === 'object' && subject !== null) { // assume object is array-like
    if (subject.type === 'Buffer' && isArray(subject.data))
      subject = subject.data
    length = +subject.length
  } else {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (length > kMaxLength)
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
      'size: 0x' + kMaxLength.toString(16) + ' bytes')

  if (length < 0)
    length = 0
  else
    length >>>= 0 // Coerce to uint32.

  var self = this
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    /*eslint-disable consistent-this */
    self = Buffer._augment(new Uint8Array(length))
    /*eslint-enable consistent-this */
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    self.length = length
    self._isBuffer = true
  }

  var i
  if (Buffer.TYPED_ARRAY_SUPPORT && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    self._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    if (Buffer.isBuffer(subject)) {
      for (i = 0; i < length; i++)
        self[i] = subject.readUInt8(i)
    } else {
      for (i = 0; i < length; i++)
        self[i] = ((subject[i] % 256) + 256) % 256
    }
  } else if (type === 'string') {
    self.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer.TYPED_ARRAY_SUPPORT && !noZero) {
    for (i = 0; i < length; i++) {
      self[i] = 0
    }
  }

  if (length > 0 && length <= Buffer.poolSize)
    self.parent = rootParent

  return self
}

function SlowBuffer (subject, encoding, noZero) {
  if (!(this instanceof SlowBuffer))
    return new SlowBuffer(subject, encoding, noZero)

  var buf = new Buffer(subject, encoding, noZero)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b))
    throw new TypeError('Arguments must be Buffers')

  if (a === b) return 0

  var x = a.length
  var y = b.length
  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
  if (i !== len) {
    x = a[i]
    y = b[i]
  }
  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function (encoding) {
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

Buffer.concat = function (list, totalLength) {
  if (!isArray(list)) throw new TypeError('Usage: Buffer.concat(list[, length])')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (totalLength === undefined) {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    case 'hex':
      ret = str.length >>> 1
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    default:
      ret = str.length
  }
  return ret
}

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function (encoding, start, end) {
  var loweredCase = false

  start = start >>> 0
  end = end === undefined || end === Infinity ? this.length : end >>> 0

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
        if (loweredCase)
          throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.equals = function (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max)
      str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
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
    var byte = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(byte)) throw new Error('Invalid hex string')
    buf[offset + i] = byte
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
  return charsWritten
}

function asciiWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function utf16leWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0

  if (length < 0 || offset < 0 || offset > this.length)
    throw new RangeError('attempt to write outside buffer bounds')

  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leWrite(this, string, offset, length)
      break
    default:
      throw new TypeError('Unknown encoding: ' + encoding)
  }
  return ret
}

Buffer.prototype.toJSON = function () {
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
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
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

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0)
      start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0)
      end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start)
    end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length)
    newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0)
    throw new RangeError('offset is not uint')
  if (offset + ext > length)
    throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert)
    checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100))
    val += this[offset + i] * mul

  return val
}

Buffer.prototype.readUIntBE = function (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert)
    checkOffset(offset, byteLength, this.length)

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100))
    val += this[offset + --byteLength] * mul

  return val
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
      ((this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      this[offset + 3])
}

Buffer.prototype.readIntLE = function (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert)
    checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100))
    val += this[offset + i] * mul
  mul *= 0x80

  if (val >= mul)
    val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert)
    checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100))
    val += this[offset + --i] * mul
  mul *= 0x80

  if (val >= mul)
    val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80))
    return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
      (this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      (this[offset + 3])
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert)
    checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100))
    this[offset + i] = (value / mul) >>> 0 & 0xFF

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert)
    checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100))
    this[offset + i] = (value / mul) >>> 0 & 0xFF

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else objectWriteUInt16(this, value, offset, true)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else objectWriteUInt16(this, value, offset, false)
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else objectWriteUInt32(this, value, offset, true)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else objectWriteUInt32(this, value, offset, false)
  return offset + 4
}

Buffer.prototype.writeIntLE = function (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkInt(this,
             value,
             offset,
             byteLength,
             Math.pow(2, 8 * byteLength - 1) - 1,
             -Math.pow(2, 8 * byteLength - 1))
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100))
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkInt(this,
             value,
             offset,
             byteLength,
             Math.pow(2, 8 * byteLength - 1) - 1,
             -Math.pow(2, 8 * byteLength - 1))
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100))
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else objectWriteUInt16(this, value, offset, true)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else objectWriteUInt16(this, value, offset, false)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else objectWriteUInt32(this, value, offset, true)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else objectWriteUInt32(this, value, offset, false)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert)
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert)
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var self = this // source

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (target_start >= target.length) target_start = target.length
  if (!target_start) target_start = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || self.length === 0) return 0

  // Fatal error conditions
  if (target_start < 0)
    throw new RangeError('targetStart out of bounds')
  if (start < 0 || start >= self.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + target_start] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
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
Buffer.prototype.toArrayBuffer = function () {
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
Buffer._augment = function (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
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

var INVALID_BASE64_RE = /[^+\/0-9A-z\-]/g

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

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
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
  var i = 0

  for (; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (leadSurrogate) {
        // 2 leads in a row
        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          leadSurrogate = codePoint
          continue
        } else {
          // valid surrogate pair
          codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
          leadSurrogate = null
        }
      } else {
        // no lead yet

        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else {
          // valid lead
          leadSurrogate = codePoint
          continue
        }
      }
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
      leadSurrogate = null
    }

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
    } else if (codePoint < 0x200000) {
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
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

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
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

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
/**
 * Epicenter Javascript libraries
 * v1.4.0
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
F.service.Variables = require('./service/variables-api-service');
F.service.Data = require('./service/data-api-service');
F.service.Auth = require('./service/auth-api-service');
F.service.World = require('./service/world-api-adapter');

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

F.version = '1.4.0';
window.F = F;


},{"./managers/auth-manager":6,"./managers/epicenter-channel-manager":8,"./managers/run-manager":10,"./managers/run-strategies/always-new-strategy":11,"./managers/run-strategies/conditional-creation-strategy":12,"./managers/run-strategies/identity-strategy":13,"./managers/run-strategies/new-if-initialized-strategy":15,"./managers/run-strategies/new-if-missing-strategy":16,"./managers/run-strategies/new-if-persisted-strategy":17,"./managers/scenario-manager":20,"./managers/world-manager":22,"./service/auth-api-service":23,"./service/channel-service":24,"./service/configuration-service":25,"./service/data-api-service":26,"./service/run-api-service":28,"./service/url-config-service":30,"./service/variables-api-service":31,"./service/world-api-adapter":32,"./store/cookie-store":33,"./store/store-factory":35,"./transport/ajax-http-transport":36,"./transport/http-transport-factory":37,"./util/inherit":39,"./util/make-sequence":40,"./util/query-util":42,"./util/run-util":43}],6:[function(require,module,exports){
/**
* ## Authorization Manager
*
*
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
     * @type { string}
     */
    store: { synchronous: true }
};

var EPI_COOKIE_KEY = keyNames.EPI_COOKIE_KEY;
var EPI_SESSION_KEY = keyNames.EPI_SESSION_KEY;
var store;
var token;

function saveSession(userInfo) {
    var serialized = JSON.stringify(userInfo);
    store.set(EPI_SESSION_KEY, serialized);

    //jshint camelcase: false
    //jscs:disable
    store.set(EPI_COOKIE_KEY, userInfo.auth_token);
}

function getSession() {
    var session = store.get(EPI_SESSION_KEY) || '{}';
    return JSON.parse(session);
}

function AuthManager(options) {
    this.options = $.extend(true, {}, defaults, options);
    this.authAdapter = new AuthAdapter(this.options);
    this.memberAdapter = new MemberAdapter(this.options);

    var urlConfig = new ConfigService(this.options).get('server');
    if (!this.options.account) {
        this.options.account = urlConfig.accountPath;
    }

    // null might specified to disable project filtering
    if (this.options.project === undefined) {
        this.options.project = urlConfig.projectPath;
    }

    store = new StorageFactory(this.options.store);
    token = store.get(EPI_COOKIE_KEY) || '';
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
    login: function (options) {
        var _this = this;
        var $d = $.Deferred();
        var adapterOptions = $.extend(true, { success: $.noop, error: $.noop }, this.options, options);
        var outSuccess = adapterOptions.success;
        var outError = adapterOptions.error;
        var groupId = adapterOptions.groupId;

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
            var userGroupOpts = $.extend(true, {}, adapterOptions, {userId: userInfo.user_id, success: $.noop });
            _this.getUserGroups(userGroupOpts).done( function (memberInfo) {
                var data = {auth: response, user: userInfo, userGroups: memberInfo, groupSelection: {} };

                var sessionInfo = {
                    'auth_token': token,
                    'account': adapterOptions.account,
                    'project': adapterOptions.project,
                    'userId': userInfo.user_id
                };
                // The group is not required if the user is not logging into a project
                if (!adapterOptions.project) {
                    saveSession(sessionInfo);
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
                    saveSession(sessionInfoWithGroup);
                    outSuccess.apply(this, [data]);
                    $d.resolve(data);
                } else {
                    handleGroupError('This account is associated with more that one group. Please specify a group id to log into and try again', 403, data);
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

    logout: function (options) {
        var $d = $.Deferred();
        var adapterOptions = $.extend(true, {success: $.noop, token: token }, this.options, options);

        var removeCookieFn = function (response) {
            store.remove(EPI_COOKIE_KEY, adapterOptions);
            store.remove(EPI_SESSION_KEY, adapterOptions);
            token = '';
        };

        var outSuccess = adapterOptions.success;
        adapterOptions.success = function (response) {
            removeCookieFn(response);
            outSuccess.apply(this, arguments);
        };

        // Epicenter returns a bad request when trying to delete a token. It seems like the API call is not implemented yet
        // Once it's implemented this error handler should not be necessary.
        adapterOptions.error = function (response) {
            removeCookieFn(response);
            outSuccess.apply(this, arguments);
            $d.resolve();
        };

        this.authAdapter.logout(adapterOptions).done($d.resolve);
        return $d.promise();
    },

    /**
     * Returns existing user access token if already logged in, or creates a new one otherwise. (See [more background on access tokens](../../../project_access/)).
     *
     * **Example**
     *
     *      auth.getToken().then(function (token) { console.log('my token is', token); });
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

    getUserGroups: function (options) {
        var adapterOptions = $.extend(true, {success: $.noop }, this.options, options);
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

        this.memberAdapter.getGroupsByUser(adapterOptions).fail($d.reject);
        return $d.promise();
    },

    getCurrentUserSessionInfo: function (options) {
        return getSession(options);
    }
});

module.exports = AuthManager;

},{"../service/auth-api-service":23,"../service/configuration-service":25,"../service/member-api-adapter":27,"../store/store-factory":35,"./key-names":9,"buffer":1}],7:[function(require,module,exports){
'use strict';

var Channel = require('../service/channel-service');

/**
 * Generic wrapper around $.cometd. This provides a few nice features the default cometd wrapper doesn't
 *
 * - Automatic re-subscription to channels if you lose your connection in-between
 * - Online/ Offline notifications
 * - 'Events' for cometd notifications, instead of having to listen on specific meta channels
 *
 * @param {Object} options
 * @param {String} url Cometd endpoint url
 * @param {Boolean} websocketEnabled Determine if websocket support is to be activated
 * @param {Object} Channel Defaults to pass on to channel instances. See @ChannelService for more info
 *
 * See http://docs.cometd.org/reference/javascript.html for other supported options
 */
var ChannelManager = function (options) {
    if (!$.cometd) {
        throw new Error('Cometd library not found. Please include epicenter-multiplayer-dependencies.js');
    }
    if (!options || !options.url) {
        throw new Error('Please provide an url for the cometd server');
    }

    var cometd = new $.Cometd();

    var defaults = {
        url: '',
        logLevel: 'info',
        websocketEnabled: false, //needs to be turned on on the server

        //Everything provided here will be provided as defaults for channel created through getChannel
        channel: {

        }
    };
    var defaultCometOptions = $.extend(true, {}, defaults, options);

    cometd.websocketEnabled = defaultCometOptions.websocketEnabled;

    this.isConnected = false;
    this.currentSubscriptions = [];
    this.options = defaultCometOptions;

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

ChannelManager.prototype.getChannel = function (options) {
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
};

/**
 * Listen for events on this instance. Signature is same as for jQuery Events. Supported events are:
 *  connect, disconnect, subscribe, unsubscribe, publish, error
 */
ChannelManager.prototype.on = function () {
    $(this).on.apply($(this), arguments);
};
/**
 * Stop listening for events. Signature is same as for jQuery Events
 */
ChannelManager.prototype.off = function () {
    $(this).off.apply($(this), arguments);
};
/**
 * Trigger events. Signature is same as for jQuery Events
 */
ChannelManager.prototype.trigger = function () {
    $(this).trigger.apply($(this), arguments);
};

module.exports = ChannelManager;

},{"../service/channel-service":24}],8:[function(require,module,exports){
'use strict';

/**
 * Wrapper around channel manager to instantiate it with epicenter-specific defaults
 */

var ChannelManager = require('./channel-manager');
var classFrom = require('../util/inherit');
var urlService = require('../service/url-config-service');

var AuthManager = require('./auth-manager');

var session = new AuthManager();
var getFromSessionOrError = function (value, sessionKeyName) {
    if (!value) {
        var userInfo = session.getCurrentUserSessionInfo();
        if (userInfo[sessionKeyName]) {
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
            //See docs for url config service
            server: {
                account: userInfo.account,
                project: userInfo.project
            }
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
     * Get a pub/sub channel for the given group. There will be no default notifications from Epicenter on this channel, all messages will be user-orginated
     *
     * ** Example usage **
     *     var cm = new F.manager.Channel();
     *     var gc = cm.getgetGroupChannel();
     *     gc.subscribe('broadcasts', callback);
     *
     * @param  {String} groupName (optional) Group to broadcast to. If not provided, picks up group from current session if logged in.
     * @return {Channel}
     */
    getGroupChannel: function (groupName) {
        groupName = getFromSessionOrError(groupName, 'groupName');
        var baseTopic = ['/group', this.options.server.account, this.options.server.project, groupName].join('/');
        return __super.getChannel.call(this, { base: baseTopic });
    },

    /**
     * Get a pub/sub channel for the given world. Note: You'll not get notifications for worlds which're not in memory. Typically used with the WorldManager
     *
     * ** Example usage **
     *     var cm = new F.manager.Channel();
     *     var worldManager = new F.manager.WorldManager({
     *         account: 'X',
     *         project: 'Y',
     *         model: 'model.eqn'
     *     });
     *     worldManager.getCurrentWorld().then(function (worldObject, worldService) {
     *         var worldChannel = cm.getWorldChannel(worldObject);
     *         worldChannel.subscribe('', function (data) {
     *             console.log(data);
     *         });
     *      });
     *
     * @param  {String|Object} world     world object or id
     * @param  {String} groupName (optional) Group the world exists in. If not provided, picks up group from current session if logged in.
     * @return {Channel}
     */
    getWorldChannel: function (world, groupName) {
        var worldid = ($.isPlainObject(world) && world.id) ? world.id : world;
        if (!worldid) {
            throw new Error('Please specify a world id');
        }
        groupName = getFromSessionOrError(groupName, 'groupName');
        var baseTopic = ['/game', this.options.server.account, this.options.server.project, groupName, worldid].join('/');
        return __super.getChannel.call(this, { base: baseTopic });
    },

    /**
     * Get a pub/sub channel for the current user. Needs the user's current world to work. Note: You'll not get notifications for worlds which're not in memory. Typically used with the WorldManager
     *
     * ** Example usage **
     *     var cm = new F.manager.Channel();
     *     var worldManager = new F.manager.WorldManager({
     *         account: 'X',
     *         project: 'Y',
     *         model: 'model.eqn'
     *     });
     *     worldManager.getCurrentWorld().then(function (worldObject, worldService) {
     *         var worldChannel = cm.getWorldChannel(worldObject);
     *         worldChannel.subscribe('', function (data) {
     *             console.log(data);
     *         });
     *      });
     *
     * @param  {String|Object} world     world object or id
     * @param  {String|Object} user (Optional)    user object or id. If not provided, picks up user id from current session if logged in.
     * @param  {String} groupName (optional) Group the world exists in. If not provided, picks up group from current session if logged in.
     * @return {Channel}
     */
    getUserChannel: function (world, user, groupName) {
        var userid = ($.isPlainObject(user) && user.id) ? user.id : user;
        var worldid = ($.isPlainObject(world) && world.id) ? world.id : world;
        if (!worldid) {
            throw new Error('Please specify a world id');
        }
        userid = getFromSessionOrError(userid, 'userId');
        groupName = getFromSessionOrError(groupName, 'groupName');

        var baseTopic = ['/users', this.options.server.account, this.options.server.project, groupName, worldid, userid].join('/');
        return __super.getChannel.call(this, { base: baseTopic });
    }
});

module.exports = EpicenterChannelManager;

},{"../service/url-config-service":30,"../util/inherit":39,"./auth-manager":6,"./channel-manager":7}],9:[function(require,module,exports){
'use strict';

module.exports = {
    EPI_COOKIE_KEY: 'epicenter.project.token',
    EPI_SESSION_KEY: 'epicenter.user.session',
    STRATEGY_SESSION_KEY: 'epicenter-scenario'
};
},{}],10:[function(require,module,exports){
/**
* ## Run Manager
*
* The Run Manager gives you control over run creation depending on run states. Specifically, you can select run creation strategies (rules) for which runs end users of your project work with when they log in to your project.
*
* Underlying Epicenter APIs -- including the [Model Run API](../../../model_apis/run/), the [Run API](../../../aggregate_run_api), and Epicenter.js's own [F.service.Run.create()](../run-api-service/) -- all allow you to create new runs. However, for some projects it makes more sense to pick up where the user left off, using an existing run. And in some projects, whether to create a new one or use an existing one is conditional, for example based on characteristics of the existing run or your own knowledge about the model. The Run Manager provides this level of control.
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
*       * `files`: (optional) If and only if you are using a Vensim model and you have additional data to pass in to your model, you can pass a `files` object with the names of the files, for example: `"files": {"data": "myExtraData.xls"}`. (Note that you'll also need to add this same files object to your Vensim [configuration file](../../../model_code/vensim/).) See the [underlying Model Run API](../../../model_apis/run/#post-creating-a-new-run-for-this-project) for additional information.
*
*   * `strategy`: (optional) Run creation strategy for when to create a new run and when to reuse an end user's existing run. See [Run Manager Strategies](../../strategy/) for details. Defaults to `new-if-initialized`.
*
*   * `sessionKey`: (optional) Name of browser cookie in which to store run information, including run id. Many conditional strategies, including the provided strategies, rely on this browser cookie to store the run id and help make the decision of whether to create a new run or use an existing one. The name of this cookie defaults to `epicenter-scenario` and can be set with the `sessionKey` parameter.
*
*
* After instantiating a Run Manager, make a call to `getRun()` whenever you need to access a run for this end user. The `RunManager.run` contains the instantiated [Run Service](../run-api-service/).
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
*               // the return value of getRun() is an instance of Run Service
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
     *          run.do('runModel');
     *      });
     *
     * **Parameters**
     * @param {None} None
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
     *          // use the Run Service object
     *          run.do('runModel');
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

},{"../service/run-api-service":28,"./run-strategies/strategies-map":19,"./special-operations":21}],11:[function(require,module,exports){
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

},{"../../util/inherit":39,"./conditional-creation-strategy":12}],12:[function(require,module,exports){
'use strict';

var makeSeq = require('../../util/make-sequence');
var Base = require('./identity-strategy');
var SessionStore = require('../../store/store-factory');
var classFrom = require('../../util/inherit');
var UrlService = require('../../service/url-config-service');

var sessionStore = new SessionStore({});
var urlService = new UrlService();
var keyNames = require('../key-names');

var defaults = {
    sessionKey: keyNames.STRATEGY_SESSION_KEY
};

function setRunInSession(sessionKey, run) {
    var path = '/' + [urlService.appPath, urlService.accountPath, urlService.projectPath].join('/');

    // make sure we don't get consecuteive '/' so we have a valid path for the session
    path = path.replace(/\/{2,}/g,'/');

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

        this.run = makeSeq(runService);
        this.condition = typeof condition !== 'function' ? function () { return condition; } : condition;
        this.options = $.extend(true, {}, defaults, options);
        this.runOptions = this.options.run;
    },

    reset: function (runServiceOptions) {
        var _this = this;

        return this.run
                .create(this.runOptions, runServiceOptions)
            .then(function (run) {
                setRunInSession(_this.options.sessionKey, run);
                run.freshlyCreated = true;
                return run;
            })
            .start();
    },

    getRun: function () {
        var session = JSON.parse(sessionStore.get(this.options.sessionKey));

        if (session && session.runId) {
            return this._loadAndCheck(session);
        } else {
            return this.reset();
        }
    },

    _loadAndCheck: function (session) {
        var shouldCreate = false;
        var _this = this;

        return this.run
            .load(session.runId, null, {
                success: function (run, msg, headers) {
                    shouldCreate = _this.condition.call(_this, run, headers);
                }
            })
            .then(function (run) {
                if (shouldCreate) {
                    // we need to do this, on the original runService (ie not sequencialized)
                    // so we don't get in the middle of the queue
                    return _this.run.original.create(_this.runOptions)
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

},{"../../service/url-config-service":30,"../../store/store-factory":35,"../../util/inherit":39,"../../util/make-sequence":40,"../key-names":9,"./identity-strategy":13}],13:[function(require,module,exports){
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

},{"../../util/inherit":39}],14:[function(require,module,exports){
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
        var _this = this;
        var dtd = $.Deferred();

        if (!curUserId) {
            return dtd.reject({ statusCode: 400, error: 'We need an authenticated user to join a multiplayer world. (ERR: no userId in session)' }, session).promise();
        }

        var loadRunFromWorld = function (world) {
            if (!world) {
                return dtd.reject({ statusCode: 404, error: 'The user is not in any world.' }, { options: this.options, session: session });
            }

            return worldApi.getCurrentRunId({ filter: world.id })
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

},{"../../service/world-api-adapter":32,"../../util/inherit":39,"../auth-manager":6,"./identity-strategy":13}],15:[function(require,module,exports){
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

},{"../../util/inherit":39,"./conditional-creation-strategy":12}],16:[function(require,module,exports){
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

},{"../../util/inherit":39,"./conditional-creation-strategy":12}],17:[function(require,module,exports){
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

},{"../../util/inherit":39,"./conditional-creation-strategy":12}],18:[function(require,module,exports){
'use strict';

var classFrom = require('../../util/inherit');
var IdentityStrategy = require('./identity-strategy');
var StorageFactory = require('../../store/store-factory');
var StateApi = require('../../service/state-api-adapter');

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

        this._loadAndCheck = this._loadAndCheck.bind(this);
        this._restoreRun = this._restoreRun.bind(this);
        this._getAllRuns = this._getAllRuns.bind(this);
        this._loadRun = this._loadRun.bind(this);
    },

    reset: function (runServiceOptions) {
        return this.run
            .create(this.runOptions, runServiceOptions)
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

},{"../../service/state-api-adapter":29,"../../store/store-factory":35,"../../util/inherit":39,"../key-names":9,"./identity-strategy":13}],19:[function(require,module,exports){
module.exports = {
    'new-if-initialized': require('./new-if-initialized-strategy'),
    'new-if-persisted': require('./new-if-persisted-strategy'),
    'new-if-missing': require('./new-if-missing-strategy'),
    'always-new': require('./always-new-strategy'),
    'multiplayer': require('./multiplayer-strategy'),
    'persistent-single-player': require('./persistent-single-player-strategy'),
    'none': require('./identity-strategy')
};

},{"./always-new-strategy":11,"./identity-strategy":13,"./multiplayer-strategy":14,"./new-if-initialized-strategy":15,"./new-if-missing-strategy":16,"./new-if-persisted-strategy":17,"./persistent-single-player-strategy":18}],20:[function(require,module,exports){
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


},{"../service/run-api-service":28}],21:[function(require,module,exports){
'use strict';


module.exports = {
    reset: function (params, options, manager) {
        return manager.reset(options);
    }
};

},{}],22:[function(require,module,exports){
'use strict';

var WorldApi = require('../service/world-api-adapter');
var RunManager =  require('./run-manager');
var AuthManager = require('./auth-manager');
// var _pick = require('../util/object-util')._pick;
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
                return worldApi.getCurrentRunId({ filter: worldId })
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
    this.options = options || {};

    $.extend(true, this.options, options.run);
    $.extend(true, this.options, options.world);


    worldApi = new WorldApi(this.options);
    this._auth = new AuthManager();
    var _this = this;

    var api = {
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

        getCurrentRun: function () {
            var dtd = $.Deferred();
            var session = this._auth.getCurrentUserSessionInfo();
            var curUserId = session.userId;
            var curGroupName = session.groupName;

            function getAndRestoreLatestRun(world) {
                var currentWorldId = world.id;
                var strategy = buildStrategy(currentWorldId, dtd);
                var opt = $.extend(true, {}, {
                    strategy: strategy,
                    run: _this.options
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

},{"../service/world-api-adapter":32,"./auth-manager":6,"./run-manager":10}],23:[function(require,module,exports){
/**
 *
 * ##Authentication API Service
 *
 * The Authentication API Service provides methods for logging in and creating user access tokens.
 * User access tokens are required for each call to Epicenter. (See [Creating access tokens](../../../project_access/) for more information.)
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
         * Password for specified username. Defaults to empty string.
         * @type {String}
         */
        password: '',

        /**
         * Account to log in into. Required to log in as an end user. Defaults to picking it up from the path.
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
         * Logs user in. If no username or password was provided in the initial configuration options, they are required here.
         *
         * **Example**
         *
         *      auth.login({ userName: 'jsmith@acmesimulations.com',
         *                  password: 'passw0rd',
         *                  account: 'acme' });
         *
         * **Parameters**
         * @param  {Object} `options` (Optional) Overrides for configuration options.
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
         *
         * **Example**
         *
         *      auth.logout();
         *
         * **Parameters**
         * @param {Object} `options` (Optional) Overrides for configuration options.
         */
        logout: function (options) {
            var httpOptions = $.extend(true, serviceOptions, transportOptions, options);
            if (!httpOptions.token) {
                throw new Error('No token was specified.');
            }
            var slash = httpOptions.url.slice(-1) === '/' ? '' : '/';
            httpOptions.url = httpOptions.url + slash + httpOptions.token;
            var deleteParams = {};

            return http.delete(deleteParams, httpOptions);
        }
    };

    $.extend(this, publicAPI);
};

},{"../transport/http-transport-factory":37,"./configuration-service":25}],24:[function(require,module,exports){
'use strict';

/**
 * A 'pub/sub' object
 * @param {Object} options
 * @param {String} options.base Base-topic. This will be pre-pended to all further topics you publish or subscribe to
 * @param {Function} topicResolver A function into which all 'topics' passed into the `publish` and `subscribe` methods are sent through. By default it just echoes.
 * @param {Cometd} transport instance of cometd to hook onto
 */
var Channel = function (options) {
    var defaults = {
        base: '',

        /**
         * This is useful if you want to implement your own serialize functions for converting custom objects to topic names.
         * @param  {*} token Token to parse
         * @return {String} this function should return a string topic
         */
        topicResolver: function (topic) {
            return topic;
        },

        //cometd instance
        transport: null
    };
    this.channelOptions = $.extend(true, {}, defaults, options);
};

var makeName = function (channelName, topic) {
    //Replace trailing/double slashes
    var newName = (channelName ? (channelName + '/' + topic) : topic).replace(/\/\//g, '/').replace(/\/$/,'');
    return newName;
};

/**
 * Subscribe to changes on a topic.
 *
 * @param  {String | Array}   topic    List of topics to listen for changes on
 * @param  {Function} callback Callback to execute. Callback will be called with signature (evt, payload, metadata)
 * @param  {Object}   context  Context in which the callback will be executed
 * @param  {Object}   options  Object with defaults
 * @param  {Number}   options.priority  Can be used to control order of operations, defaults to 0, can be any +ve or -ve number
 * @param  {String|Number|Function}   options.value  Callback will only be triggered if this condition matches. See Examples for details
 * @return {string}            Returns a token you can later use to un-subscribe
 *
 *  **Examples**
 *  subscribe('run', cb) - subscribe to changes on a top-level 'run' topic
 *  subscribe('run/*') - changes on children of the run object. Note this not also be triggered for changes to run.x.y.z
 *  subscribe(['run', 'run/*']) - changes to run and children
 *  subscribe('run/variables/price', cb) - changes to price
 *
 *  subscribe('run', function () { this.innerHTML = 'Triggered'}, document.body); - set the context for the callback
 *  subscribe('run', cb, this, {priority: 9}); - by default priority is 0. Can be used to control order of operations
 *  subscribe('run/variables/price', cb, this, {priority: 30, value: 50}); - only exec callback if value of price is 50
 *  subscribe('run/variables/price', cb, this, {priority: 30, value: '>50'}); - only exec callback if value of price is > 50
 *  subscribe('run/variables/price', cb, this, {priority: 30, value: function (val) {return val % 2 ===0}}); - only exec callback if value of price is even
 *
 */
Channel.prototype.subscribe = function (topic, callback, context, options) {
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
};

/**
 * Publish data to a topic
 * @param  {String} topic Topic to publish to
 * @param  {*} payload  Data to publish to topic
 *
 * **Examples**
 * publish('run', {completed: false}); - send payload to all subscribers
 * publish('run/variables', {price: 50});
 */
Channel.prototype.publish = function (topic, data) {
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
};

/**
 * Unsubscribe from changes
 * @param  {String} token
 */
Channel.prototype.unsubscribe = function (token) {
    this.channelOptions.transport.unsubscribe(token);
    return token;
};

module.exports = Channel;

},{}],25:[function(require,module,exports){
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


},{"./url-config-service":30}],26:[function(require,module,exports){
/**
 * ##Data API Service
 *
 * The Data API Service allows you to create, access, and manipulate data related to any of your projects. Data are organized in collections. Each collection contains a document; each element of this top-level document is a JSON object. (See additional information on the underlying [Data API](../../../data_api/).)
 *
 * All API calls take in an "options" object as the last parameter. The options can be used to extend/override the Data API Service defaults. In particular, the `root` option contains the name of the collection. If you have multiple collections within each of your projects, you can pass the collection name as an option for each call.
 *
 *      var ds = new F.service.Data({ root: 'survey-responses' });
 *      ds.saveAs('user1',
 *          { 'question1': 2, 'question2': 10,
 *           'question3': false, 'question4': 'sometimes' } );
 *      ds.saveAs('user2',
 *          { 'question1': 3, 'question2': 8,
 *           'question3': true, 'question4': 'always' } );
 *      ds.query('',{ 'question2': { '$gt': 9} });
 *
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
         * For operations that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: store.get('epicenter.project.token') || '',

        apiKey: '',
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
         * Searching using comparison or logical operators (as opposed to exact matches) requires MongoDB syntax. See the underlying [Data API](../../../data_api/#searching) for additional details.
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
         *      // where 'question5' contains the string '*day'
         *      ds.query('', { 'question5': { '$regex': '*day' } });
         *
         * **Parameters**
         * @param {String} `key` The name of the document to search. Pass the empty string ('') to search the entire collection.
         * @param {Object} `query` The query object. For exact matching, this object contains the field name and field value to match. For matching based on comparison, this object contains the field name and the comparison expression. For matching based on logical operators, this object contains an expression using MongoDB syntax. See the underlying [Data API](../../../data_api/#searching) for additional examples.
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
         * (Documents are top-level elements within a collection. Collections must be unique within this account (team or personal account) and project and are set with the `root` field in the `option` parameter. See the underlying [Data API](../../../data_api/) for additional background.)
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
         * (Documents are top-level elements within a collection. Collections must be unique within this account (team or personal account) and project and are set with the `root` field in the `option` parameter. See the underlying [Data API](../../../data_api/) for additional background.)
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
         * @param {String} `key` The id of the document to remove from this collection.
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

},{"../store/store-factory":35,"../transport/http-transport-factory":37,"../util/query-util":42,"./configuration-service":25}],27:[function(require,module,exports){
/**
 *
 * ##Member API Adapter
 *
 * The Member API Adapter provides methods to lookup user details or group details
 *
 *      var auth = new F.adapter.Member();
 *      auth.getGroupsByUser({ userId: 'b6b313a3-ab84-479c-baea-206f6bff337' });
 *      auth.getGroupDetails({ groupId: '00b53308-9833-47f2-b21e-1278c07d53b8' });
 */

'use strict';

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');

module.exports = function (config) {
    var defaults = {
        /**
         * Epicenter userId. Defaults to a blank string
         * @type { string}
         */
        userId: '',

        /**
         * Epicenter groupId. Defaults to a blank string
         * @type { string}
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
        url: urlConfig.getAPIPath('member/local')
    });
    var http = new TransportFactory(transportOptions);

    var publicAPI = {

        getGroupsByUser: function (options) {
            var httpOptions = $.extend(true, serviceOptions, options);
            if (!httpOptions.userId) {
                throw new Error('No userId specified.');
            }

            var getParms = {
                userId: httpOptions.userId
            };
            return http.get(getParms, httpOptions);
        },

        getGroupDetails: function (options) {
            var httpOptions = $.extend(true, serviceOptions, transportOptions, options);
            if (!httpOptions.groupId) {
                throw new Error('No groupId specified.');
            }

            var slash = httpOptions.url.slice(-1) === '/' ? '' : '/';
            httpOptions.url = httpOptions.url + slash + httpOptions.groupId;

            var getParms = {};
            return http.get(getParms, httpOptions);
        }
    };

    $.extend(this, publicAPI);
};

},{"../transport/http-transport-factory":37,"./configuration-service":25}],28:[function(require,module,exports){
/**
 *
 * ##Run API Service
 *
 * The Run API Service allows you to perform common tasks around creating and updating runs, variables, and data.
 *
 * All API calls take in an "options" object as the last parameter. The options can be used to extend/override the Run API Service defaults.
 *
 * Typically, you first instantiate a [Run Manager](../run-manager/) and then access the Run Service that is automatically part of the manager.
 *
 *       var rm = new F.manager.RunManager({
 *           run: {
 *               account: 'acme-simulations',
 *               project: 'supply-chain-game',
 *               model: 'supply-chain-model.jl'
 *           }
 *       });
 *       rm.getRun()
 *           .then(function() {
 *               // the RunManager.run contains the instantiated Run Service,
 *               // so any Run Service method is valid here
 *               var rs = rm.run;
 *               rs.do('runModel');
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
        token: store.get('epicenter.project.token') || '',

        /**
         * The account id. In the Epicenter UI, this is the "Team ID" (for team projects) or "User ID" (for personal projects). Defaults to empty string.
         * @type {String}
         */
        account: '',

        /**
         * The project id. Defaults to empty string.
         * @type {String}
         */
        project: '',

        /**
         * Criteria by which to filter runs. Defaults to empty string.
         * @type {String}
         */
        filter: '',

        /**
         * Called when the call completes successfully. Defaults to `$.noop`.
         */
        success: $.noop,

        /**
         * Called when the call fails. Defaults to `$.noop`.
         */
        error: $.noop,

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

    urlConfig.filter = ';';
    urlConfig.getFilterURL = function () {
        var url = urlConfig.getAPIPath('run');
        var filter = qutil.toMatrixFormat(serviceOptions.filter);

        if (filter) {
            url += filter + '/';
        }
        return url;
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

    var setFilterOrThrowError = function (options) {
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
         * @param {String} `model` The name of the primary [model file](../../../writing_your_model/). This is the one file in the project that explicitly exposes variables and methods, and it must be stored in the Model folder of your Epicenter project.
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
         * @param {Object} `qs` Query object. Each key can be a property of the run or the name of variable that has been saved in the run (prefaced by `variables.`). Each value can be a literal value, or a comparison operator and value. (See [more on filtering](../../../aggregate_run_api/#filters) allowed in the underlying Run API.) Querying for variables is available for runs [in memory](../../../run_persistence/#runs-in-memory) and for runs [in the database](../../../run_persistence/#runs-in-memory) if the variables are persisted (e.g. that have been `record`ed in your Julia model).
         * @param {Object} `outputModifier` (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} `options` (Optional) Overrides for configuration options.
         */
        query: function (qs, outputModifier, options) {
            serviceOptions.filter = qs; //shouldn't be able to over-ride
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            return http.get(outputModifier, httpOptions);
        },

        /**
         * Returns particular runs, based on conditions specified in the `qs` object.
         *
         * Similar to `.query()`.
         *
         * **Parameters**
         * @param {Object} `filter` Filter object. Each key can be a property of the run or the name of variable that has been saved in the run (prefaced by `variables.`). Each value can be a literal value, or a comparison operator and value. (See [more on filtering](../../../aggregate_run_api/#filters) allowed in the underlying Run API.) Filtering for variables is available for runs [in memory](../../../run_persistence/#runs-in-memory) and for runs [in the database](../../../run_persistence/#runs-in-memory) if the variables are persisted (e.g. that have been `record`ed in your Julia model).
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
            return http.get(outputModifier, httpOptions);
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
            serviceOptions.filter = runID; //shouldn't be able to over-ride
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            return http.get(filters, httpOptions);
        },


        //Saving data
        /**
         * Save attributes (data, model variables) of the run.
         *
         * **Examples**
         *
         *     rs.save({ completed: true });
         *     rs.save({ saved: true, variables: { a: 23, b: 23 } });
         *
         * **Parameters**
         * @param {Object} `attributes` The run data and variables to save. Model variables must be included in a `variables` field within the `attributes` object (otherwise they are treated as run data and added to the run record directly).
         * @param {Object} `options` (Optional) Overrides for configuration options.
         */
        save: function (attributes, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            setFilterOrThrowError(httpOptions);
            return http.patch(attributes, httpOptions);
        },

        //##Operations
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
         * @param {Array[String]|Array[Object]} `operations` If none of the methods take parameters, pass an array of the method names (strings). If any of the methods do take parameters, pass an array of objects, each of which contains a method name and its own (possibly empty) array of parameters.
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
        /**
         * Returns a Variables Service instance. Use the variables instance to load, save, and query for specific model variables. See the [Variable API Service](../variables-api-service/) for more information.
         *
         * **Example**
         *
         *      var vs = rs.variables();
         *      vs.save({ sample_int: 4});
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


},{"../store/store-factory":35,"../transport/http-transport-factory":37,"../util/object-util":41,"../util/query-util":42,"../util/run-util":43,"./configuration-service":25,"./variables-api-service":31}],29:[function(require,module,exports){
'use strict';
/**
 * ##State API Adapter
 *
 * The State API Adapter allows you to replay or clone runs
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

    var publicAPI = {
        /**
        * Replays a run to get it back into memory
        *
        *
        * **PARAMETERS**
        * @param {object} `params` Parameters object
        * @param {string} `params.runId` id of the run to bring back to memory
        * @param {string} (Optional) `param.stopBefore` - the run is advanced only up to the first occurrence of that method
        * @param {object} (Optional) `options` - Options override
        */
        replay: function (params, options) {
            var replayOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + params.runId }
            );

            params = $.extend(true, { action: 'replay' }, _pick(params, 'stopBefore'));

            return http.post(params, replayOptions);
        },

        /**
        * Clones a given run and returns a new run in the same state as the given run
        *
        *
        * **PARAMETERS**
        * @param {object} `params` Parameters object
        * @param {string} `params.runId` id of the run to bring back to memory
        * @param {string} (Optional) `param.stopBefore` - the run is advanced only up to the first occurrence of that method
        * @param {object} (Optional) `options` - Options override
        */
        clone: function (params, options) {
            var replayOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + params.runId }
            );

            params = $.extend(true, { action: 'clone' }, _pick(params, 'stopBefore'));

            return http.post(params, replayOptions);
        }
    };

    $.extend(this, publicAPI);
};
},{"../transport/http-transport-factory":37,"../util/object-util":41,"./configuration-service":25}],30:[function(require,module,exports){
'use strict';

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
            if (!host || host.indexOf('localhost') !== -1) {
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

        getAPIPath: function (api) {
            var PROJECT_APIS = ['run', 'data'];
            var apiPath = this.protocol + '://' + this.host + '/' + api + '/';

            if ($.inArray(api, PROJECT_APIS) !== -1) {
                apiPath += this.accountPath + '/' + this.projectPath  + '/';
            }
            return apiPath;
        }
    };

    $.extend(publicExports, config);
    return publicExports;
};

},{}],31:[function(require,module,exports){
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

    var httpOptions = {
        url: getURL
    };
    if (serviceOptions.token) {
        httpOptions.headers = {
            'Authorization': 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(httpOptions);

    var publicAPI = {

        /**
         * Get values for a variable.
         *
         * **Example**
         *
         *      vs.load('sample_int');
         *
         * **Parameters**
         * @param {String} `variable` Name of variable to load.
         * @param {Object} `outputModifier` (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} `options` (Optional) Overrides for configuration options.
         */
        load: function (variable, outputModifier, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            return http.get(outputModifier, $.extend({}, httpOptions, {
                url: getURL() + variable + '/'
            }));
        },

        /**
         * Returns particular variables, based on conditions specified in the `query` object.
         *
         * **Example**
         *
         *      vs.query(['price', 'sales']);
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

            if ($.isArray(query)) {
                query = { include: query };
            }
            $.extend(query, outputModifier);
            return http.get(query, httpOptions);
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

},{"../transport/http-transport-factory":37}],32:[function(require,module,exports){
/**
 * ##World API Adapter
 *
 * The World API Adapter allows you to create, access, and manipulate multiplayer worlds its users and runs
 *
 * All API calls take in an "options" object as the last parameter. The options can be used to extend/override the World API Service defaults.
 *
 *
 */

'use strict';

var ConfigService = require('./configuration-service');
var StorageFactory = require('../store/store-factory');
// var qutil = require('../util/query-util');
var TransportFactory = require('../transport/http-transport-factory');
var _pick = require('../util/object-util')._pick;

var apiEndpoint = 'multiplayer/game';

module.exports = function (config) {
    var store = new StorageFactory({ synchronous: true });

    var defaults = {

       token: store.get('epicenter.project.token') || '',

       project: '',

       account: '',

       group: '',

//        apiKey: '',

//        domain: 'forio.com',

        //Options to pass on to the underlying transport layer
        transport: {},

        success: $.noop,

        error: $.noop
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

    var setIdFilterOrThrowError = function (options) {
        if (options.filter) {
            serviceOptions.filter = options.filter;
        }
        if (!serviceOptions.filter) {
            throw new Error('No filter specified to apply operations against');
        }
    };

    var publicAPI = {

        /**
        * Create a new World
        *
        * ** Example **
        *   var gm = new F.service.World({ account: 'account', project: 'project' });
        *   gm.create({ model: 'model.py', group: 'group-name' });
        *
        * ** Parameters **
        * @param {object} `params` Parameters to create the world
        * @param {string} `params.model` The model file to use to create runs in this world
        * @param {string} `params.group` the group _name_ to create this world under
        * @param {string} `params.roles` (Optional) The list of roles for this world
        * @param {string} `params.opionalRoles` (Optional) The list of optional roles for this world
        * @param {string} `params.minUsers` (Optional) The minimum number of users for the world
        * @param {object} `options` Options object to override global options
        *
        */
        create: function (params, options) {
            var createOptions = $.extend(true, {}, serviceOptions, options, { url: urlConfig.getAPIPath(apiEndpoint) });
            var worldApiParams = ['model', 'scope', 'files', 'roles', 'optionalRoles', 'minUsers', 'group'];
            if (typeof params === 'string') {
                // this is just the model name
                params = { model: params };
            } else {
                // whitelist the fields that we actually can send to the api
                params = _pick(params, worldApiParams);
            }

            // account and project go in the body, not in the url
            $.extend(params, _pick(serviceOptions, ['account', 'project']));

            var oldSuccess = createOptions.success;
            createOptions.success = function (response) {
                serviceOptions.filter = response.id; //all future chained calls to operate on this id
                return oldSuccess.apply(this, arguments);
            };

            return http.post(params, createOptions);
        },

        /**
        * Update a World object, for example to add the roles to the world
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
        * Delete an existing world
        *
        */
        delete: function (options) {
            options = options || {};
            setIdFilterOrThrowError(options);

            var deleteOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter }
            );

            return http.delete(null, deleteOptions);
        },

        /**
        * List all worlds for a given account/project/group
        *
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
        * Get all worlds that a user belongs to for the given account/project/group
        *
        * ** Parameters **
        * @param {string} `userId` - userId of the user you need the world for
        * @param {object} `options` (optional) - overrides to the global options object
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
        * Add a user or list of users to a given world
        *
        */
        addUsers: function (users, options) {
            options = options || {};

            setIdFilterOrThrowError(options);

            var updateOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/users' }
            );

            return http.post(users, updateOptions);
        },

        /**
        * Remove a user from a given world
        *
        */
        removeUser: function (userId, options) {
            options = options || {};

            setIdFilterOrThrowError(options);

            var getOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/users/' + userId }
            );

            return http.delete(null, getOptions);
        },

        /**
        * Get's (or creates) the current run for the given world
        *
        */
        getCurrentRunId: function (options) {
            options = options || {};

            setIdFilterOrThrowError(options);

            var getOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + serviceOptions.filter + '/run' }
            );

            return http.post(null, getOptions);
        },

        /**
        * Get's the current (latest) world for the given user at the given group
        *
        */
        getCurrentWorldForUser: function (userId, groupName) {
            var dtd = $.Deferred();
            var me = this;
            this.getWorldsForUser(userId, { group: groupName })
                .then(function (worlds) {
                    // assume the most recent world as the 'active' world
                    worlds.sort(function (a, b) { return new Date(b.lastModified) - new Date(a.lastModified); });
                    var currentWorld = worlds[0];
                    dtd.resolve(currentWorld, me);
                })
                .fail(dtd.reject);

            return dtd.promise();
        },

        /**
        * Delete's the current run from the world
        *
        */
        deleteRun: function (worldId, options) {
            throw new Error('not implemented');
        },

        newRunForWorld: function (worldId, options) {
            return this.deleteRun(worldId)
                .then(function () {
                    return this.getCurrentRunId({ filter: worldId });
                });
        }
    };

    $.extend(this, publicAPI);
};

},{"../store/store-factory":35,"../transport/http-transport-factory":37,"../util/object-util":41,"./configuration-service":25}],33:[function(require,module,exports){
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
    var serviceOptions = $.extend({}, defaults, config);

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
            var setOptions = $.extend(true, {}, serviceOptions, options);

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
            var remOptions = $.extend(true, {}, serviceOptions, options);

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

},{}],34:[function(require,module,exports){
/**
 * @class session Storage Service
 *
 *  Cookie equivalent for nodejs
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
    var serviceOptions = $.extend({}, defaults, config);

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
         * Save session value
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
            var setOptions = $.extend(true, {}, serviceOptions, options);

            var domain = setOptions.domain;
            var path = setOptions.root;

            document.session = encodeURIComponent(key) + '=' +
                                encodeURIComponent(value) +
                                (domain ? '; domain=' + domain : '') +
                                (path ? '; path=' + path : '');

            return value;
        },

        /**
         * Load session value
         * @param  { string|Object} key   If given a key save values under it, if given an object directly, save to top-level api
         * @return {*} The value stored
         *
         * @example
         *     cs.get('person');
         */
        get: function (key) {
            var sessionReg = new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(key).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$');
            var val = document.session.replace(sessionReg, '$1');
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
            var remOptions = $.extend(true, {}, serviceOptions, options);

            var domain = remOptions.domain;
            var path = remOptions.root;

            document.session = encodeURIComponent(key) +
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
            var aKeys = document.session.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, '').split(/\s*(?:\=[^;]*)?;\s*/);
            for (var nIdx = 0; nIdx < aKeys.length; nIdx++) {
                var sessionKey = decodeURIComponent(aKeys[nIdx]);
                this.remove(sessionKey);
            }
            return aKeys;
        }
    };

    $.extend(this, publicAPI);
};


},{}],35:[function(require,module,exports){
/**
    Decides type of store to provide
*/

'use strict';
var isNode = false;
var store = (isNode) ? require('./session-store') : require('./cookie-store');

module.exports = store;

},{"./cookie-store":33,"./session-store":34}],36:[function(require,module,exports){
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

},{"../util/query-util":42}],37:[function(require,module,exports){
'use strict';

var isNode = false;
var transport = (isNode) ? require('./node-http-transport') : require('./ajax-http-transport');
module.exports = transport;

},{"./ajax-http-transport":36,"./node-http-transport":38}],38:[function(require,module,exports){

},{}],39:[function(require,module,exports){
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

},{}],40:[function(require,module,exports){
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

},{}],41:[function(require,module,exports){
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

},{}],42:[function(require,module,exports){
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




},{}],43:[function(require,module,exports){
/**
 * Utilities for working with the run service
*/
'use strict';

module.exports = (function () {
    return {
        /**
         * returns operations of the form [[op1,op2], [arg1, arg2]]
         * @param  {Object|Array|String} operations operations to perform
         * @param  { array} arugments for operation
         * @return { string}    Matrix-format query parameters
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
        }
    };
}());

},{}]},{},[5])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCJub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaXMtYXJyYXkvaW5kZXguanMiLCJzcmMvYXBwLmpzIiwic3JjL21hbmFnZXJzL2F1dGgtbWFuYWdlci5qcyIsInNyYy9tYW5hZ2Vycy9jaGFubmVsLW1hbmFnZXIuanMiLCJzcmMvbWFuYWdlcnMvZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlci5qcyIsInNyYy9tYW5hZ2Vycy9rZXktbmFtZXMuanMiLCJzcmMvbWFuYWdlcnMvcnVuLW1hbmFnZXIuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvYWx3YXlzLW5ldy1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9jb25kaXRpb25hbC1jcmVhdGlvbi1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9pZGVudGl0eS1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9tdWx0aXBsYXllci1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9uZXctaWYtaW5pdGlhbGl6ZWQtc3RyYXRlZ3kuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvbmV3LWlmLW1pc3Npbmctc3RyYXRlZ3kuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvbmV3LWlmLXBlcnNpc3RlZC1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9wZXJzaXN0ZW50LXNpbmdsZS1wbGF5ZXItc3RyYXRlZ3kuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvc3RyYXRlZ2llcy1tYXAuanMiLCJzcmMvbWFuYWdlcnMvc2NlbmFyaW8tbWFuYWdlci5qcyIsInNyYy9tYW5hZ2Vycy9zcGVjaWFsLW9wZXJhdGlvbnMuanMiLCJzcmMvbWFuYWdlcnMvd29ybGQtbWFuYWdlci5qcyIsInNyYy9zZXJ2aWNlL2F1dGgtYXBpLXNlcnZpY2UuanMiLCJzcmMvc2VydmljZS9jaGFubmVsLXNlcnZpY2UuanMiLCJzcmMvc2VydmljZS9jb25maWd1cmF0aW9uLXNlcnZpY2UuanMiLCJzcmMvc2VydmljZS9kYXRhLWFwaS1zZXJ2aWNlLmpzIiwic3JjL3NlcnZpY2UvbWVtYmVyLWFwaS1hZGFwdGVyLmpzIiwic3JjL3NlcnZpY2UvcnVuLWFwaS1zZXJ2aWNlLmpzIiwic3JjL3NlcnZpY2Uvc3RhdGUtYXBpLWFkYXB0ZXIuanMiLCJzcmMvc2VydmljZS91cmwtY29uZmlnLXNlcnZpY2UuanMiLCJzcmMvc2VydmljZS92YXJpYWJsZXMtYXBpLXNlcnZpY2UuanMiLCJzcmMvc2VydmljZS93b3JsZC1hcGktYWRhcHRlci5qcyIsInNyYy9zdG9yZS9jb29raWUtc3RvcmUuanMiLCJzcmMvc3RvcmUvc2Vzc2lvbi1zdG9yZS5qcyIsInNyYy9zdG9yZS9zdG9yZS1mYWN0b3J5LmpzIiwic3JjL3RyYW5zcG9ydC9hamF4LWh0dHAtdHJhbnNwb3J0LmpzIiwic3JjL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5LmpzIiwic3JjL3RyYW5zcG9ydC9ub2RlLWh0dHAtdHJhbnNwb3J0LmpzIiwic3JjL3V0aWwvaW5oZXJpdC5qcyIsInNyYy91dGlsL21ha2Utc2VxdWVuY2UuanMiLCJzcmMvdXRpbC9vYmplY3QtdXRpbC5qcyIsInNyYy91dGlsL3F1ZXJ5LXV0aWwuanMiLCJzcmMvdXRpbC9ydW4tdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5eENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8ZmVyb3NzQGZlcm9zcy5vcmc+IDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoJ2lzLWFycmF5JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IFNsb3dCdWZmZXJcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MFxuQnVmZmVyLnBvb2xTaXplID0gODE5MiAvLyBub3QgdXNlZCBieSB0aGlzIGltcGxlbWVudGF0aW9uXG5cbnZhciBrTWF4TGVuZ3RoID0gMHgzZmZmZmZmZlxudmFyIHJvb3RQYXJlbnQgPSB7fVxuXG4vKipcbiAqIElmIGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGA6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBVc2UgT2JqZWN0IGltcGxlbWVudGF0aW9uIChtb3N0IGNvbXBhdGlibGUsIGV2ZW4gSUU2KVxuICpcbiAqIEJyb3dzZXJzIHRoYXQgc3VwcG9ydCB0eXBlZCBhcnJheXMgYXJlIElFIDEwKywgRmlyZWZveCA0KywgQ2hyb21lIDcrLCBTYWZhcmkgNS4xKyxcbiAqIE9wZXJhIDExLjYrLCBpT1MgNC4yKy5cbiAqXG4gKiBOb3RlOlxuICpcbiAqIC0gSW1wbGVtZW50YXRpb24gbXVzdCBzdXBwb3J0IGFkZGluZyBuZXcgcHJvcGVydGllcyB0byBgVWludDhBcnJheWAgaW5zdGFuY2VzLlxuICogICBGaXJlZm94IDQtMjkgbGFja2VkIHN1cHBvcnQsIGZpeGVkIGluIEZpcmVmb3ggMzArLlxuICogICBTZWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOC5cbiAqXG4gKiAgLSBDaHJvbWUgOS0xMCBpcyBtaXNzaW5nIHRoZSBgVHlwZWRBcnJheS5wcm90b3R5cGUuc3ViYXJyYXlgIGZ1bmN0aW9uLlxuICpcbiAqICAtIElFMTAgaGFzIGEgYnJva2VuIGBUeXBlZEFycmF5LnByb3RvdHlwZS5zdWJhcnJheWAgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBhcnJheXMgb2ZcbiAqICAgIGluY29ycmVjdCBsZW5ndGggaW4gc29tZSBzaXR1YXRpb25zLlxuICpcbiAqIFdlIGRldGVjdCB0aGVzZSBidWdneSBicm93c2VycyBhbmQgc2V0IGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGAgdG8gYGZhbHNlYCBzbyB0aGV5IHdpbGxcbiAqIGdldCB0aGUgT2JqZWN0IGltcGxlbWVudGF0aW9uLCB3aGljaCBpcyBzbG93ZXIgYnV0IHdpbGwgd29yayBjb3JyZWN0bHkuXG4gKi9cbkJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUID0gKGZ1bmN0aW9uICgpIHtcbiAgdHJ5IHtcbiAgICB2YXIgYnVmID0gbmV3IEFycmF5QnVmZmVyKDApXG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KGJ1ZilcbiAgICBhcnIuZm9vID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfVxuICAgIHJldHVybiBhcnIuZm9vKCkgPT09IDQyICYmIC8vIHR5cGVkIGFycmF5IGluc3RhbmNlcyBjYW4gYmUgYXVnbWVudGVkXG4gICAgICAgIHR5cGVvZiBhcnIuc3ViYXJyYXkgPT09ICdmdW5jdGlvbicgJiYgLy8gY2hyb21lIDktMTAgbGFjayBgc3ViYXJyYXlgXG4gICAgICAgIG5ldyBVaW50OEFycmF5KDEpLnN1YmFycmF5KDEsIDEpLmJ5dGVMZW5ndGggPT09IDAgLy8gaWUxMCBoYXMgYnJva2VuIGBzdWJhcnJheWBcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59KSgpXG5cbi8qKlxuICogQ2xhc3M6IEJ1ZmZlclxuICogPT09PT09PT09PT09PVxuICpcbiAqIFRoZSBCdWZmZXIgY29uc3RydWN0b3IgcmV0dXJucyBpbnN0YW5jZXMgb2YgYFVpbnQ4QXJyYXlgIHRoYXQgYXJlIGF1Z21lbnRlZFxuICogd2l0aCBmdW5jdGlvbiBwcm9wZXJ0aWVzIGZvciBhbGwgdGhlIG5vZGUgYEJ1ZmZlcmAgQVBJIGZ1bmN0aW9ucy4gV2UgdXNlXG4gKiBgVWludDhBcnJheWAgc28gdGhhdCBzcXVhcmUgYnJhY2tldCBub3RhdGlvbiB3b3JrcyBhcyBleHBlY3RlZCAtLSBpdCByZXR1cm5zXG4gKiBhIHNpbmdsZSBvY3RldC5cbiAqXG4gKiBCeSBhdWdtZW50aW5nIHRoZSBpbnN0YW5jZXMsIHdlIGNhbiBhdm9pZCBtb2RpZnlpbmcgdGhlIGBVaW50OEFycmF5YFxuICogcHJvdG90eXBlLlxuICovXG5mdW5jdGlvbiBCdWZmZXIgKHN1YmplY3QsIGVuY29kaW5nLCBub1plcm8pIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEJ1ZmZlcikpXG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoc3ViamVjdCwgZW5jb2RpbmcsIG5vWmVybylcblxuICB2YXIgdHlwZSA9IHR5cGVvZiBzdWJqZWN0XG5cbiAgLy8gRmluZCB0aGUgbGVuZ3RoXG4gIHZhciBsZW5ndGhcbiAgaWYgKHR5cGUgPT09ICdudW1iZXInKSB7XG4gICAgbGVuZ3RoID0gK3N1YmplY3RcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuICAgIGxlbmd0aCA9IEJ1ZmZlci5ieXRlTGVuZ3RoKHN1YmplY3QsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnICYmIHN1YmplY3QgIT09IG51bGwpIHsgLy8gYXNzdW1lIG9iamVjdCBpcyBhcnJheS1saWtlXG4gICAgaWYgKHN1YmplY3QudHlwZSA9PT0gJ0J1ZmZlcicgJiYgaXNBcnJheShzdWJqZWN0LmRhdGEpKVxuICAgICAgc3ViamVjdCA9IHN1YmplY3QuZGF0YVxuICAgIGxlbmd0aCA9ICtzdWJqZWN0Lmxlbmd0aFxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ211c3Qgc3RhcnQgd2l0aCBudW1iZXIsIGJ1ZmZlciwgYXJyYXkgb3Igc3RyaW5nJylcbiAgfVxuXG4gIGlmIChsZW5ndGggPiBrTWF4TGVuZ3RoKVxuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIGFsbG9jYXRlIEJ1ZmZlciBsYXJnZXIgdGhhbiBtYXhpbXVtICcgK1xuICAgICAgJ3NpemU6IDB4JyArIGtNYXhMZW5ndGgudG9TdHJpbmcoMTYpICsgJyBieXRlcycpXG5cbiAgaWYgKGxlbmd0aCA8IDApXG4gICAgbGVuZ3RoID0gMFxuICBlbHNlXG4gICAgbGVuZ3RoID4+Pj0gMCAvLyBDb2VyY2UgdG8gdWludDMyLlxuXG4gIHZhciBzZWxmID0gdGhpc1xuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBQcmVmZXJyZWQ6IFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgLyplc2xpbnQtZGlzYWJsZSBjb25zaXN0ZW50LXRoaXMgKi9cbiAgICBzZWxmID0gQnVmZmVyLl9hdWdtZW50KG5ldyBVaW50OEFycmF5KGxlbmd0aCkpXG4gICAgLyplc2xpbnQtZW5hYmxlIGNvbnNpc3RlbnQtdGhpcyAqL1xuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gVEhJUyBpbnN0YW5jZSBvZiBCdWZmZXIgKGNyZWF0ZWQgYnkgYG5ld2ApXG4gICAgc2VsZi5sZW5ndGggPSBsZW5ndGhcbiAgICBzZWxmLl9pc0J1ZmZlciA9IHRydWVcbiAgfVxuXG4gIHZhciBpXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiB0eXBlb2Ygc3ViamVjdC5ieXRlTGVuZ3RoID09PSAnbnVtYmVyJykge1xuICAgIC8vIFNwZWVkIG9wdGltaXphdGlvbiAtLSB1c2Ugc2V0IGlmIHdlJ3JlIGNvcHlpbmcgZnJvbSBhIHR5cGVkIGFycmF5XG4gICAgc2VsZi5fc2V0KHN1YmplY3QpXG4gIH0gZWxzZSBpZiAoaXNBcnJheWlzaChzdWJqZWN0KSkge1xuICAgIC8vIFRyZWF0IGFycmF5LWlzaCBvYmplY3RzIGFzIGEgYnl0ZSBhcnJheVxuICAgIGlmIChCdWZmZXIuaXNCdWZmZXIoc3ViamVjdCkpIHtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKylcbiAgICAgICAgc2VsZltpXSA9IHN1YmplY3QucmVhZFVJbnQ4KGkpXG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKylcbiAgICAgICAgc2VsZltpXSA9ICgoc3ViamVjdFtpXSAlIDI1NikgKyAyNTYpICUgMjU2XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgc2VsZi53cml0ZShzdWJqZWN0LCAwLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnbnVtYmVyJyAmJiAhQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgJiYgIW5vWmVybykge1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgc2VsZltpXSA9IDBcbiAgICB9XG4gIH1cblxuICBpZiAobGVuZ3RoID4gMCAmJiBsZW5ndGggPD0gQnVmZmVyLnBvb2xTaXplKVxuICAgIHNlbGYucGFyZW50ID0gcm9vdFBhcmVudFxuXG4gIHJldHVybiBzZWxmXG59XG5cbmZ1bmN0aW9uIFNsb3dCdWZmZXIgKHN1YmplY3QsIGVuY29kaW5nLCBub1plcm8pIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFNsb3dCdWZmZXIpKVxuICAgIHJldHVybiBuZXcgU2xvd0J1ZmZlcihzdWJqZWN0LCBlbmNvZGluZywgbm9aZXJvKVxuXG4gIHZhciBidWYgPSBuZXcgQnVmZmVyKHN1YmplY3QsIGVuY29kaW5nLCBub1plcm8pXG4gIGRlbGV0ZSBidWYucGFyZW50XG4gIHJldHVybiBidWZcbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gKGIpIHtcbiAgcmV0dXJuICEhKGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlcilcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiAoYSwgYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhKSB8fCAhQnVmZmVyLmlzQnVmZmVyKGIpKVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyBtdXN0IGJlIEJ1ZmZlcnMnKVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gTWF0aC5taW4oeCwgeSk7IGkgPCBsZW4gJiYgYVtpXSA9PT0gYltpXTsgaSsrKSB7fVxuICBpZiAoaSAhPT0gbGVuKSB7XG4gICAgeCA9IGFbaV1cbiAgICB5ID0gYltpXVxuICB9XG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiAobGlzdCwgdG90YWxMZW5ndGgpIHtcbiAgaWYgKCFpc0FycmF5KGxpc3QpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVc2FnZTogQnVmZmVyLmNvbmNhdChsaXN0WywgbGVuZ3RoXSknKVxuXG4gIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBuZXcgQnVmZmVyKDApXG4gIH0gZWxzZSBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICByZXR1cm4gbGlzdFswXVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKHRvdGFsTGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICB0b3RhbExlbmd0aCA9IDBcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgdG90YWxMZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmID0gbmV3IEJ1ZmZlcih0b3RhbExlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaXRlbSA9IGxpc3RbaV1cbiAgICBpdGVtLmNvcHkoYnVmLCBwb3MpXG4gICAgcG9zICs9IGl0ZW0ubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGZ1bmN0aW9uIChzdHIsIGVuY29kaW5nKSB7XG4gIHZhciByZXRcbiAgc3RyID0gc3RyICsgJydcbiAgc3dpdGNoIChlbmNvZGluZyB8fCAndXRmOCcpIHtcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdyYXcnOlxuICAgICAgcmV0ID0gc3RyLmxlbmd0aFxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0ID0gc3RyLmxlbmd0aCAqIDJcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGggPj4+IDFcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gdXRmOFRvQnl0ZXMoc3RyKS5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IGJhc2U2NFRvQnl0ZXMoc3RyKS5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGhcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbi8vIHByZS1zZXQgZm9yIHZhbHVlcyB0aGF0IG1heSBleGlzdCBpbiB0aGUgZnV0dXJlXG5CdWZmZXIucHJvdG90eXBlLmxlbmd0aCA9IHVuZGVmaW5lZFxuQnVmZmVyLnByb3RvdHlwZS5wYXJlbnQgPSB1bmRlZmluZWRcblxuLy8gdG9TdHJpbmcoZW5jb2RpbmcsIHN0YXJ0PTAsIGVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIChlbmNvZGluZywgc3RhcnQsIGVuZCkge1xuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuXG4gIHN0YXJ0ID0gc3RhcnQgPj4+IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID09PSBJbmZpbml0eSA/IHRoaXMubGVuZ3RoIDogZW5kID4+PiAwXG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcbiAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKGVuZCA8PSBzdGFydCkgcmV0dXJuICcnXG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gYmluYXJ5U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1dGYxNmxlU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKVxuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoZW5jb2RpbmcgKyAnJykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVNcbiAgaWYgKHRoaXMubGVuZ3RoID4gMCkge1xuICAgIHN0ciA9IHRoaXMudG9TdHJpbmcoJ2hleCcsIDAsIG1heCkubWF0Y2goLy57Mn0vZykuam9pbignICcpXG4gICAgaWYgKHRoaXMubGVuZ3RoID4gbWF4KVxuICAgICAgc3RyICs9ICcgLi4uICdcbiAgfVxuICByZXR1cm4gJzxCdWZmZXIgJyArIHN0ciArICc+J1xufVxuXG5CdWZmZXIucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gMFxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYilcbn1cblxuLy8gYGdldGAgd2lsbCBiZSByZW1vdmVkIGluIE5vZGUgMC4xMytcbkJ1ZmZlci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKG9mZnNldCkge1xuICBjb25zb2xlLmxvZygnLmdldCgpIGlzIGRlcHJlY2F0ZWQuIEFjY2VzcyB1c2luZyBhcnJheSBpbmRleGVzIGluc3RlYWQuJylcbiAgcmV0dXJuIHRoaXMucmVhZFVJbnQ4KG9mZnNldClcbn1cblxuLy8gYHNldGAgd2lsbCBiZSByZW1vdmVkIGluIE5vZGUgMC4xMytcbkJ1ZmZlci5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKHYsIG9mZnNldCkge1xuICBjb25zb2xlLmxvZygnLnNldCgpIGlzIGRlcHJlY2F0ZWQuIEFjY2VzcyB1c2luZyBhcnJheSBpbmRleGVzIGluc3RlYWQuJylcbiAgcmV0dXJuIHRoaXMud3JpdGVVSW50OCh2LCBvZmZzZXQpXG59XG5cbmZ1bmN0aW9uIGhleFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gYnVmLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG5cbiAgLy8gbXVzdCBiZSBhbiBldmVuIG51bWJlciBvZiBkaWdpdHNcbiAgdmFyIHN0ckxlbiA9IHN0cmluZy5sZW5ndGhcbiAgaWYgKHN0ckxlbiAlIDIgIT09IDApIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBoZXggc3RyaW5nJylcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGJ5dGUgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgaWYgKGlzTmFOKGJ5dGUpKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaGV4IHN0cmluZycpXG4gICAgYnVmW29mZnNldCArIGldID0gYnl0ZVxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIHV0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBibGl0QnVmZmVyKHV0ZjhUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG4gIHJldHVybiBjaGFyc1dyaXR0ZW5cbn1cblxuZnVuY3Rpb24gYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIGJpbmFyeVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGFzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5mdW5jdGlvbiB1dGYxNmxlV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gU3VwcG9ydCBib3RoIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZylcbiAgLy8gYW5kIHRoZSBsZWdhY3kgKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIGlmICghaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfSBlbHNlIHsgIC8vIGxlZ2FjeVxuICAgIHZhciBzd2FwID0gZW5jb2RpbmdcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIG9mZnNldCA9IGxlbmd0aFxuICAgIGxlbmd0aCA9IHN3YXBcbiAgfVxuXG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcblxuICBpZiAobGVuZ3RoIDwgMCB8fCBvZmZzZXQgPCAwIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKVxuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdhdHRlbXB0IHRvIHdyaXRlIG91dHNpZGUgYnVmZmVyIGJvdW5kcycpXG5cbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cbiAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcgfHwgJ3V0ZjgnKS50b0xvd2VyQ2FzZSgpXG5cbiAgdmFyIHJldFxuICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IGhleFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIHJldCA9IHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgICByZXQgPSBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICByZXQgPSBiaW5hcnlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgcmV0ID0gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IHV0ZjE2bGVXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0J1ZmZlcicsXG4gICAgZGF0YTogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodGhpcy5fYXJyIHx8IHRoaXMsIDApXG4gIH1cbn1cblxuZnVuY3Rpb24gYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIHV0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXMgPSAnJ1xuICB2YXIgdG1wID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgaWYgKGJ1ZltpXSA8PSAweDdGKSB7XG4gICAgICByZXMgKz0gZGVjb2RlVXRmOENoYXIodG1wKSArIFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICAgICAgdG1wID0gJydcbiAgICB9IGVsc2Uge1xuICAgICAgdG1wICs9ICclJyArIGJ1ZltpXS50b1N0cmluZygxNilcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzICsgZGVjb2RlVXRmOENoYXIodG1wKVxufVxuXG5mdW5jdGlvbiBhc2NpaVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSAmIDB4N0YpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBiaW5hcnlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBoZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgYnl0ZXNbaSArIDFdICogMjU2KVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIChzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBzdGFydCA9IH5+c3RhcnRcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyBsZW4gOiB+fmVuZFxuXG4gIGlmIChzdGFydCA8IDApIHtcbiAgICBzdGFydCArPSBsZW5cbiAgICBpZiAoc3RhcnQgPCAwKVxuICAgICAgc3RhcnQgPSAwXG4gIH0gZWxzZSBpZiAoc3RhcnQgPiBsZW4pIHtcbiAgICBzdGFydCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IDApIHtcbiAgICBlbmQgKz0gbGVuXG4gICAgaWYgKGVuZCA8IDApXG4gICAgICBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpXG4gICAgZW5kID0gc3RhcnRcblxuICB2YXIgbmV3QnVmXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIG5ld0J1ZiA9IEJ1ZmZlci5fYXVnbWVudCh0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpKVxuICB9IGVsc2Uge1xuICAgIHZhciBzbGljZUxlbiA9IGVuZCAtIHN0YXJ0XG4gICAgbmV3QnVmID0gbmV3IEJ1ZmZlcihzbGljZUxlbiwgdW5kZWZpbmVkLCB0cnVlKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2xpY2VMZW47IGkrKykge1xuICAgICAgbmV3QnVmW2ldID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9XG5cbiAgaWYgKG5ld0J1Zi5sZW5ndGgpXG4gICAgbmV3QnVmLnBhcmVudCA9IHRoaXMucGFyZW50IHx8IHRoaXNcblxuICByZXR1cm4gbmV3QnVmXG59XG5cbi8qXG4gKiBOZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IGJ1ZmZlciBpc24ndCB0cnlpbmcgdG8gd3JpdGUgb3V0IG9mIGJvdW5kcy5cbiAqL1xuZnVuY3Rpb24gY2hlY2tPZmZzZXQgKG9mZnNldCwgZXh0LCBsZW5ndGgpIHtcbiAgaWYgKChvZmZzZXQgJSAxKSAhPT0gMCB8fCBvZmZzZXQgPCAwKVxuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKVxuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludExFID0gZnVuY3Rpb24gKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSlcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludEJFID0gZnVuY3Rpb24gKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSlcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdICogbXVsXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCA4KSB8IHRoaXNbb2Zmc2V0ICsgMV1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICgodGhpc1tvZmZzZXRdKSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikpICtcbiAgICAgICh0aGlzW29mZnNldCArIDNdICogMHgxMDAwMDAwKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSAqIDB4MTAwMDAwMCkgK1xuICAgICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgICB0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpXG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bClcbiAgICB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoXG4gIHZhciBtdWwgPSAxXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0taV1cbiAgd2hpbGUgKGkgPiAwICYmIChtdWwgKj0gMHgxMDApKVxuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0taV0gKiBtdWxcbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bClcbiAgICB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQ4ID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSlcbiAgICByZXR1cm4gKHRoaXNbb2Zmc2V0XSlcbiAgcmV0dXJuICgoMHhmZiAtIHRoaXNbb2Zmc2V0XSArIDEpICogLTEpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIDFdIHwgKHRoaXNbb2Zmc2V0XSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0pIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAzXSA8PCAyNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCAyNCkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0QkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDUyLCA4KVxufVxuXG5mdW5jdGlvbiBjaGVja0ludCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2J1ZmZlciBtdXN0IGJlIGEgQnVmZmVyIGluc3RhbmNlJylcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndmFsdWUgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCksIDApXG5cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSlcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSA+Pj4gMCAmIDB4RkZcblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludEJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSwgMClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpID4+PiAwICYgMHhGRlxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweGZmLCAwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbmZ1bmN0aW9uIG9iamVjdFdyaXRlVUludDE2IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbikge1xuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZiArIHZhbHVlICsgMVxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBvZmZzZXQsIDIpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID0gKHZhbHVlICYgKDB4ZmYgPDwgKDggKiAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSkpKSA+Pj5cbiAgICAgIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpICogOFxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgfSBlbHNlIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDFdID0gdmFsdWVcbiAgfSBlbHNlIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5mdW5jdGlvbiBvYmplY3RXcml0ZVVJbnQzMiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4pIHtcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4oYnVmLmxlbmd0aCAtIG9mZnNldCwgNCk7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSAodmFsdWUgPj4+IChsaXR0bGVFbmRpYW4gPyBpIDogMyAtIGkpICogOCkgJiAweGZmXG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgfSBlbHNlIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9IHZhbHVlXG4gIH0gZWxzZSBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludExFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJbnQodGhpcyxcbiAgICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgICBvZmZzZXQsXG4gICAgICAgICAgICAgYnl0ZUxlbmd0aCxcbiAgICAgICAgICAgICBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCAtIDEpIC0gMSxcbiAgICAgICAgICAgICAtTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGggLSAxKSlcbiAgfVxuXG4gIHZhciBpID0gMFxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gdmFsdWUgPCAwID8gMSA6IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50QkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0ludCh0aGlzLFxuICAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgIG9mZnNldCxcbiAgICAgICAgICAgICBieXRlTGVuZ3RoLFxuICAgICAgICAgICAgIE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoIC0gMSkgLSAxLFxuICAgICAgICAgICAgIC1NYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCAtIDEpKVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gdmFsdWUgPCAwID8gMSA6IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpXG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgfSBlbHNlIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSB2YWx1ZVxuICB9IGVsc2Ugb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIH0gZWxzZSBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDNdID0gdmFsdWVcbiAgfSBlbHNlIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5mdW5jdGlvbiBjaGVja0lFRUU3NTQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCd2YWx1ZSBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAob2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDQsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gd3JpdGVEb3VibGUgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDgsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gY29weSh0YXJnZXRCdWZmZXIsIHRhcmdldFN0YXJ0PTAsIHNvdXJjZVN0YXJ0PTAsIHNvdXJjZUVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gKHRhcmdldCwgdGFyZ2V0X3N0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIHZhciBzZWxmID0gdGhpcyAvLyBzb3VyY2VcblxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0X3N0YXJ0ID49IHRhcmdldC5sZW5ndGgpIHRhcmdldF9zdGFydCA9IHRhcmdldC5sZW5ndGhcbiAgaWYgKCF0YXJnZXRfc3RhcnQpIHRhcmdldF9zdGFydCA9IDBcbiAgaWYgKGVuZCA+IDAgJiYgZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm4gMFxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCBzZWxmLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGlmICh0YXJnZXRfc3RhcnQgPCAwKVxuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSBzZWxmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZVN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoZW5kIDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpXG4gICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRfc3RhcnQgPCBlbmQgLSBzdGFydClcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0ICsgc3RhcnRcblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcblxuICBpZiAobGVuIDwgMTAwMCB8fCAhQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldF9zdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGFyZ2V0Ll9zZXQodGhpcy5zdWJhcnJheShzdGFydCwgc3RhcnQgKyBsZW4pLCB0YXJnZXRfc3RhcnQpXG4gIH1cblxuICByZXR1cm4gbGVuXG59XG5cbi8vIGZpbGwodmFsdWUsIHN0YXJ0PTAsIGVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gKHZhbHVlLCBzdGFydCwgZW5kKSB7XG4gIGlmICghdmFsdWUpIHZhbHVlID0gMFxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQpIGVuZCA9IHRoaXMubGVuZ3RoXG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignZW5kIDwgc3RhcnQnKVxuXG4gIC8vIEZpbGwgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3N0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoZW5kIDwgMCB8fCBlbmQgPiB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2VuZCBvdXQgb2YgYm91bmRzJylcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSB2YWx1ZVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSB1dGY4VG9CeXRlcyh2YWx1ZS50b1N0cmluZygpKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgYEFycmF5QnVmZmVyYCB3aXRoIHRoZSAqY29waWVkKiBtZW1vcnkgb2YgdGhlIGJ1ZmZlciBpbnN0YW5jZS5cbiAqIEFkZGVkIGluIE5vZGUgMC4xMi4gT25seSBhdmFpbGFibGUgaW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IEFycmF5QnVmZmVyLlxuICovXG5CdWZmZXIucHJvdG90eXBlLnRvQXJyYXlCdWZmZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAgIHJldHVybiAobmV3IEJ1ZmZlcih0aGlzKSkuYnVmZmVyXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBidWYgPSBuZXcgVWludDhBcnJheSh0aGlzLmxlbmd0aClcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBidWYubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgYnVmW2ldID0gdGhpc1tpXVxuICAgICAgfVxuICAgICAgcmV0dXJuIGJ1Zi5idWZmZXJcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQnVmZmVyLnRvQXJyYXlCdWZmZXIgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGJyb3dzZXInKVxuICB9XG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIEJQID0gQnVmZmVyLnByb3RvdHlwZVxuXG4vKipcbiAqIEF1Z21lbnQgYSBVaW50OEFycmF5ICppbnN0YW5jZSogKG5vdCB0aGUgVWludDhBcnJheSBjbGFzcyEpIHdpdGggQnVmZmVyIG1ldGhvZHNcbiAqL1xuQnVmZmVyLl9hdWdtZW50ID0gZnVuY3Rpb24gKGFycikge1xuICBhcnIuY29uc3RydWN0b3IgPSBCdWZmZXJcbiAgYXJyLl9pc0J1ZmZlciA9IHRydWVcblxuICAvLyBzYXZlIHJlZmVyZW5jZSB0byBvcmlnaW5hbCBVaW50OEFycmF5IGdldC9zZXQgbWV0aG9kcyBiZWZvcmUgb3ZlcndyaXRpbmdcbiAgYXJyLl9nZXQgPSBhcnIuZ2V0XG4gIGFyci5fc2V0ID0gYXJyLnNldFxuXG4gIC8vIGRlcHJlY2F0ZWQsIHdpbGwgYmUgcmVtb3ZlZCBpbiBub2RlIDAuMTMrXG4gIGFyci5nZXQgPSBCUC5nZXRcbiAgYXJyLnNldCA9IEJQLnNldFxuXG4gIGFyci53cml0ZSA9IEJQLndyaXRlXG4gIGFyci50b1N0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0xvY2FsZVN0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0pTT04gPSBCUC50b0pTT05cbiAgYXJyLmVxdWFscyA9IEJQLmVxdWFsc1xuICBhcnIuY29tcGFyZSA9IEJQLmNvbXBhcmVcbiAgYXJyLmNvcHkgPSBCUC5jb3B5XG4gIGFyci5zbGljZSA9IEJQLnNsaWNlXG4gIGFyci5yZWFkVUludExFID0gQlAucmVhZFVJbnRMRVxuICBhcnIucmVhZFVJbnRCRSA9IEJQLnJlYWRVSW50QkVcbiAgYXJyLnJlYWRVSW50OCA9IEJQLnJlYWRVSW50OFxuICBhcnIucmVhZFVJbnQxNkxFID0gQlAucmVhZFVJbnQxNkxFXG4gIGFyci5yZWFkVUludDE2QkUgPSBCUC5yZWFkVUludDE2QkVcbiAgYXJyLnJlYWRVSW50MzJMRSA9IEJQLnJlYWRVSW50MzJMRVxuICBhcnIucmVhZFVJbnQzMkJFID0gQlAucmVhZFVJbnQzMkJFXG4gIGFyci5yZWFkSW50TEUgPSBCUC5yZWFkSW50TEVcbiAgYXJyLnJlYWRJbnRCRSA9IEJQLnJlYWRJbnRCRVxuICBhcnIucmVhZEludDggPSBCUC5yZWFkSW50OFxuICBhcnIucmVhZEludDE2TEUgPSBCUC5yZWFkSW50MTZMRVxuICBhcnIucmVhZEludDE2QkUgPSBCUC5yZWFkSW50MTZCRVxuICBhcnIucmVhZEludDMyTEUgPSBCUC5yZWFkSW50MzJMRVxuICBhcnIucmVhZEludDMyQkUgPSBCUC5yZWFkSW50MzJCRVxuICBhcnIucmVhZEZsb2F0TEUgPSBCUC5yZWFkRmxvYXRMRVxuICBhcnIucmVhZEZsb2F0QkUgPSBCUC5yZWFkRmxvYXRCRVxuICBhcnIucmVhZERvdWJsZUxFID0gQlAucmVhZERvdWJsZUxFXG4gIGFyci5yZWFkRG91YmxlQkUgPSBCUC5yZWFkRG91YmxlQkVcbiAgYXJyLndyaXRlVUludDggPSBCUC53cml0ZVVJbnQ4XG4gIGFyci53cml0ZVVJbnRMRSA9IEJQLndyaXRlVUludExFXG4gIGFyci53cml0ZVVJbnRCRSA9IEJQLndyaXRlVUludEJFXG4gIGFyci53cml0ZVVJbnQxNkxFID0gQlAud3JpdGVVSW50MTZMRVxuICBhcnIud3JpdGVVSW50MTZCRSA9IEJQLndyaXRlVUludDE2QkVcbiAgYXJyLndyaXRlVUludDMyTEUgPSBCUC53cml0ZVVJbnQzMkxFXG4gIGFyci53cml0ZVVJbnQzMkJFID0gQlAud3JpdGVVSW50MzJCRVxuICBhcnIud3JpdGVJbnRMRSA9IEJQLndyaXRlSW50TEVcbiAgYXJyLndyaXRlSW50QkUgPSBCUC53cml0ZUludEJFXG4gIGFyci53cml0ZUludDggPSBCUC53cml0ZUludDhcbiAgYXJyLndyaXRlSW50MTZMRSA9IEJQLndyaXRlSW50MTZMRVxuICBhcnIud3JpdGVJbnQxNkJFID0gQlAud3JpdGVJbnQxNkJFXG4gIGFyci53cml0ZUludDMyTEUgPSBCUC53cml0ZUludDMyTEVcbiAgYXJyLndyaXRlSW50MzJCRSA9IEJQLndyaXRlSW50MzJCRVxuICBhcnIud3JpdGVGbG9hdExFID0gQlAud3JpdGVGbG9hdExFXG4gIGFyci53cml0ZUZsb2F0QkUgPSBCUC53cml0ZUZsb2F0QkVcbiAgYXJyLndyaXRlRG91YmxlTEUgPSBCUC53cml0ZURvdWJsZUxFXG4gIGFyci53cml0ZURvdWJsZUJFID0gQlAud3JpdGVEb3VibGVCRVxuICBhcnIuZmlsbCA9IEJQLmZpbGxcbiAgYXJyLmluc3BlY3QgPSBCUC5pbnNwZWN0XG4gIGFyci50b0FycmF5QnVmZmVyID0gQlAudG9BcnJheUJ1ZmZlclxuXG4gIHJldHVybiBhcnJcbn1cblxudmFyIElOVkFMSURfQkFTRTY0X1JFID0gL1teK1xcLzAtOUEtelxcLV0vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHJpbmd0cmltKHN0cikucmVwbGFjZShJTlZBTElEX0JBU0U2NF9SRSwgJycpXG4gIC8vIE5vZGUgY29udmVydHMgc3RyaW5ncyB3aXRoIGxlbmd0aCA8IDIgdG8gJydcbiAgaWYgKHN0ci5sZW5ndGggPCAyKSByZXR1cm4gJydcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gc3RyaW5ndHJpbSAoc3RyKSB7XG4gIGlmIChzdHIudHJpbSkgcmV0dXJuIHN0ci50cmltKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcbn1cblxuZnVuY3Rpb24gaXNBcnJheWlzaCAoc3ViamVjdCkge1xuICByZXR1cm4gaXNBcnJheShzdWJqZWN0KSB8fCBCdWZmZXIuaXNCdWZmZXIoc3ViamVjdCkgfHxcbiAgICAgIHN1YmplY3QgJiYgdHlwZW9mIHN1YmplY3QgPT09ICdvYmplY3QnICYmXG4gICAgICB0eXBlb2Ygc3ViamVjdC5sZW5ndGggPT09ICdudW1iZXInXG59XG5cbmZ1bmN0aW9uIHRvSGV4IChuKSB7XG4gIGlmIChuIDwgMTYpIHJldHVybiAnMCcgKyBuLnRvU3RyaW5nKDE2KVxuICByZXR1cm4gbi50b1N0cmluZygxNilcbn1cblxuZnVuY3Rpb24gdXRmOFRvQnl0ZXMgKHN0cmluZywgdW5pdHMpIHtcbiAgdW5pdHMgPSB1bml0cyB8fCBJbmZpbml0eVxuICB2YXIgY29kZVBvaW50XG4gIHZhciBsZW5ndGggPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBsZWFkU3Vycm9nYXRlID0gbnVsbFxuICB2YXIgYnl0ZXMgPSBbXVxuICB2YXIgaSA9IDBcblxuICBmb3IgKDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgY29kZVBvaW50ID0gc3RyaW5nLmNoYXJDb2RlQXQoaSlcblxuICAgIC8vIGlzIHN1cnJvZ2F0ZSBjb21wb25lbnRcbiAgICBpZiAoY29kZVBvaW50ID4gMHhEN0ZGICYmIGNvZGVQb2ludCA8IDB4RTAwMCkge1xuICAgICAgLy8gbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmIChsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAgIC8vIDIgbGVhZHMgaW4gYSByb3dcbiAgICAgICAgaWYgKGNvZGVQb2ludCA8IDB4REMwMCkge1xuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIHZhbGlkIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICAgICAgY29kZVBvaW50ID0gbGVhZFN1cnJvZ2F0ZSAtIDB4RDgwMCA8PCAxMCB8IGNvZGVQb2ludCAtIDB4REMwMCB8IDB4MTAwMDBcbiAgICAgICAgICBsZWFkU3Vycm9nYXRlID0gbnVsbFxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBubyBsZWFkIHlldFxuXG4gICAgICAgIGlmIChjb2RlUG9pbnQgPiAweERCRkYpIHtcbiAgICAgICAgICAvLyB1bmV4cGVjdGVkIHRyYWlsXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIGlmIChpICsgMSA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gdW5wYWlyZWQgbGVhZFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gdmFsaWQgbGVhZFxuICAgICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAvLyB2YWxpZCBibXAgY2hhciwgYnV0IGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgIGxlYWRTdXJyb2dhdGUgPSBudWxsXG4gICAgfVxuXG4gICAgLy8gZW5jb2RlIHV0ZjhcbiAgICBpZiAoY29kZVBvaW50IDwgMHg4MCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAxKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKGNvZGVQb2ludClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4ODAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgfCAweEMwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAzKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDIHwgMHhFMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgyMDAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gNCkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4MTIgfCAweEYwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvZGUgcG9pbnQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBieXRlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyLCB1bml0cykge1xuICB2YXIgYywgaGksIGxvXG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuXG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoYmFzZTY0Y2xlYW4oc3RyKSlcbn1cblxuZnVuY3Rpb24gYmxpdEJ1ZmZlciAoc3JjLCBkc3QsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoKGkgKyBvZmZzZXQgPj0gZHN0Lmxlbmd0aCkgfHwgKGkgPj0gc3JjLmxlbmd0aCkpXG4gICAgICBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIGRlY29kZVV0ZjhDaGFyIChzdHIpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHN0cilcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoMHhGRkZEKSAvLyBVVEYgOCBpbnZhbGlkIGNoYXJcbiAgfVxufVxuIiwidmFyIGxvb2t1cCA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcblxuOyhmdW5jdGlvbiAoZXhwb3J0cykge1xuXHQndXNlIHN0cmljdCc7XG5cbiAgdmFyIEFyciA9ICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgPyBVaW50OEFycmF5XG4gICAgOiBBcnJheVxuXG5cdHZhciBQTFVTICAgPSAnKycuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0ggID0gJy8nLmNoYXJDb2RlQXQoMClcblx0dmFyIE5VTUJFUiA9ICcwJy5jaGFyQ29kZUF0KDApXG5cdHZhciBMT1dFUiAgPSAnYScuY2hhckNvZGVBdCgwKVxuXHR2YXIgVVBQRVIgID0gJ0EnLmNoYXJDb2RlQXQoMClcblx0dmFyIFBMVVNfVVJMX1NBRkUgPSAnLScuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0hfVVJMX1NBRkUgPSAnXycuY2hhckNvZGVBdCgwKVxuXG5cdGZ1bmN0aW9uIGRlY29kZSAoZWx0KSB7XG5cdFx0dmFyIGNvZGUgPSBlbHQuY2hhckNvZGVBdCgwKVxuXHRcdGlmIChjb2RlID09PSBQTFVTIHx8XG5cdFx0ICAgIGNvZGUgPT09IFBMVVNfVVJMX1NBRkUpXG5cdFx0XHRyZXR1cm4gNjIgLy8gJysnXG5cdFx0aWYgKGNvZGUgPT09IFNMQVNIIHx8XG5cdFx0ICAgIGNvZGUgPT09IFNMQVNIX1VSTF9TQUZFKVxuXHRcdFx0cmV0dXJuIDYzIC8vICcvJ1xuXHRcdGlmIChjb2RlIDwgTlVNQkVSKVxuXHRcdFx0cmV0dXJuIC0xIC8vbm8gbWF0Y2hcblx0XHRpZiAoY29kZSA8IE5VTUJFUiArIDEwKVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBOVU1CRVIgKyAyNiArIDI2XG5cdFx0aWYgKGNvZGUgPCBVUFBFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBVUFBFUlxuXHRcdGlmIChjb2RlIDwgTE9XRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gTE9XRVIgKyAyNlxuXHR9XG5cblx0ZnVuY3Rpb24gYjY0VG9CeXRlQXJyYXkgKGI2NCkge1xuXHRcdHZhciBpLCBqLCBsLCB0bXAsIHBsYWNlSG9sZGVycywgYXJyXG5cblx0XHRpZiAoYjY0Lmxlbmd0aCAlIDQgPiAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuXHRcdH1cblxuXHRcdC8vIHRoZSBudW1iZXIgb2YgZXF1YWwgc2lnbnMgKHBsYWNlIGhvbGRlcnMpXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHR3byBwbGFjZWhvbGRlcnMsIHRoYW4gdGhlIHR3byBjaGFyYWN0ZXJzIGJlZm9yZSBpdFxuXHRcdC8vIHJlcHJlc2VudCBvbmUgYnl0ZVxuXHRcdC8vIGlmIHRoZXJlIGlzIG9ubHkgb25lLCB0aGVuIHRoZSB0aHJlZSBjaGFyYWN0ZXJzIGJlZm9yZSBpdCByZXByZXNlbnQgMiBieXRlc1xuXHRcdC8vIHRoaXMgaXMganVzdCBhIGNoZWFwIGhhY2sgdG8gbm90IGRvIGluZGV4T2YgdHdpY2Vcblx0XHR2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXHRcdHBsYWNlSG9sZGVycyA9ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAyKSA/IDIgOiAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMSkgPyAxIDogMFxuXG5cdFx0Ly8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5cdFx0YXJyID0gbmV3IEFycihiNjQubGVuZ3RoICogMyAvIDQgLSBwbGFjZUhvbGRlcnMpXG5cblx0XHQvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG5cdFx0bCA9IHBsYWNlSG9sZGVycyA+IDAgPyBiNjQubGVuZ3RoIC0gNCA6IGI2NC5sZW5ndGhcblxuXHRcdHZhciBMID0gMFxuXG5cdFx0ZnVuY3Rpb24gcHVzaCAodikge1xuXHRcdFx0YXJyW0wrK10gPSB2XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMCwgaiA9IDA7IGkgPCBsOyBpICs9IDQsIGogKz0gMykge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxOCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCAxMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA8PCA2KSB8IGRlY29kZShiNjQuY2hhckF0KGkgKyAzKSlcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMDAwKSA+PiAxNilcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMCkgPj4gOClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRpZiAocGxhY2VIb2xkZXJzID09PSAyKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPj4gNClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9IGVsc2UgaWYgKHBsYWNlSG9sZGVycyA9PT0gMSkge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxMCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCA0KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpID4+IDIpXG5cdFx0XHRwdXNoKCh0bXAgPj4gOCkgJiAweEZGKVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdHJldHVybiBhcnJcblx0fVxuXG5cdGZ1bmN0aW9uIHVpbnQ4VG9CYXNlNjQgKHVpbnQ4KSB7XG5cdFx0dmFyIGksXG5cdFx0XHRleHRyYUJ5dGVzID0gdWludDgubGVuZ3RoICUgMywgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcblx0XHRcdG91dHB1dCA9IFwiXCIsXG5cdFx0XHR0ZW1wLCBsZW5ndGhcblxuXHRcdGZ1bmN0aW9uIGVuY29kZSAobnVtKSB7XG5cdFx0XHRyZXR1cm4gbG9va3VwLmNoYXJBdChudW0pXG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcblx0XHRcdHJldHVybiBlbmNvZGUobnVtID4+IDE4ICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDEyICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDYgJiAweDNGKSArIGVuY29kZShudW0gJiAweDNGKVxuXHRcdH1cblxuXHRcdC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcblx0XHRmb3IgKGkgPSAwLCBsZW5ndGggPSB1aW50OC5sZW5ndGggLSBleHRyYUJ5dGVzOyBpIDwgbGVuZ3RoOyBpICs9IDMpIHtcblx0XHRcdHRlbXAgPSAodWludDhbaV0gPDwgMTYpICsgKHVpbnQ4W2kgKyAxXSA8PCA4KSArICh1aW50OFtpICsgMl0pXG5cdFx0XHRvdXRwdXQgKz0gdHJpcGxldFRvQmFzZTY0KHRlbXApXG5cdFx0fVxuXG5cdFx0Ly8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuXHRcdHN3aXRjaCAoZXh0cmFCeXRlcykge1xuXHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHR0ZW1wID0gdWludDhbdWludDgubGVuZ3RoIC0gMV1cblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDIpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz09J1xuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSAyOlxuXHRcdFx0XHR0ZW1wID0gKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDJdIDw8IDgpICsgKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMTApXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPj4gNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDIpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9J1xuXHRcdFx0XHRicmVha1xuXHRcdH1cblxuXHRcdHJldHVybiBvdXRwdXRcblx0fVxuXG5cdGV4cG9ydHMudG9CeXRlQXJyYXkgPSBiNjRUb0J5dGVBcnJheVxuXHRleHBvcnRzLmZyb21CeXRlQXJyYXkgPSB1aW50OFRvQmFzZTY0XG59KHR5cGVvZiBleHBvcnRzID09PSAndW5kZWZpbmVkJyA/ICh0aGlzLmJhc2U2NGpzID0ge30pIDogZXhwb3J0cykpXG4iLCJleHBvcnRzLnJlYWQgPSBmdW5jdGlvbihidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLFxuICAgICAgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMSxcbiAgICAgIGVNYXggPSAoMSA8PCBlTGVuKSAtIDEsXG4gICAgICBlQmlhcyA9IGVNYXggPj4gMSxcbiAgICAgIG5CaXRzID0gLTcsXG4gICAgICBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDAsXG4gICAgICBkID0gaXNMRSA/IC0xIDogMSxcbiAgICAgIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV07XG5cbiAgaSArPSBkO1xuXG4gIGUgPSBzICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpO1xuICBzID4+PSAoLW5CaXRzKTtcbiAgbkJpdHMgKz0gZUxlbjtcbiAgZm9yICg7IG5CaXRzID4gMDsgZSA9IGUgKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCk7XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSk7XG4gIGUgPj49ICgtbkJpdHMpO1xuICBuQml0cyArPSBtTGVuO1xuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gbSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KTtcblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXM7XG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KTtcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pO1xuICAgIGUgPSBlIC0gZUJpYXM7XG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbik7XG59O1xuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24oYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGMsXG4gICAgICBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxLFxuICAgICAgZU1heCA9ICgxIDw8IGVMZW4pIC0gMSxcbiAgICAgIGVCaWFzID0gZU1heCA+PiAxLFxuICAgICAgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApLFxuICAgICAgaSA9IGlzTEUgPyAwIDogKG5CeXRlcyAtIDEpLFxuICAgICAgZCA9IGlzTEUgPyAxIDogLTEsXG4gICAgICBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwO1xuXG4gIHZhbHVlID0gTWF0aC5hYnModmFsdWUpO1xuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwO1xuICAgIGUgPSBlTWF4O1xuICB9IGVsc2Uge1xuICAgIGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4yKTtcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS07XG4gICAgICBjICo9IDI7XG4gICAgfVxuICAgIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgdmFsdWUgKz0gcnQgLyBjO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcyk7XG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrO1xuICAgICAgYyAvPSAyO1xuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDA7XG4gICAgICBlID0gZU1heDtcbiAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICBtID0gKHZhbHVlICogYyAtIDEpICogTWF0aC5wb3coMiwgbUxlbik7XG4gICAgICBlID0gZSArIGVCaWFzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbik7XG4gICAgICBlID0gMDtcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KTtcblxuICBlID0gKGUgPDwgbUxlbikgfCBtO1xuICBlTGVuICs9IG1MZW47XG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCk7XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4O1xufTtcbiIsIlxuLyoqXG4gKiBpc0FycmF5XG4gKi9cblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuXG4vKipcbiAqIHRvU3RyaW5nXG4gKi9cblxudmFyIHN0ciA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbi8qKlxuICogV2hldGhlciBvciBub3QgdGhlIGdpdmVuIGB2YWxgXG4gKiBpcyBhbiBhcnJheS5cbiAqXG4gKiBleGFtcGxlOlxuICpcbiAqICAgICAgICBpc0FycmF5KFtdKTtcbiAqICAgICAgICAvLyA+IHRydWVcbiAqICAgICAgICBpc0FycmF5KGFyZ3VtZW50cyk7XG4gKiAgICAgICAgLy8gPiBmYWxzZVxuICogICAgICAgIGlzQXJyYXkoJycpO1xuICogICAgICAgIC8vID4gZmFsc2VcbiAqXG4gKiBAcGFyYW0ge21peGVkfSB2YWxcbiAqIEByZXR1cm4ge2Jvb2x9XG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBpc0FycmF5IHx8IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuICEhIHZhbCAmJiAnW29iamVjdCBBcnJheV0nID09IHN0ci5jYWxsKHZhbCk7XG59O1xuIiwiLyoqXG4gKiBFcGljZW50ZXIgSmF2YXNjcmlwdCBsaWJyYXJpZXNcbiAqIHY8JT0gdmVyc2lvbiAlPlxuICogaHR0cHM6Ly9naXRodWIuY29tL2ZvcmlvL2VwaWNlbnRlci1qcy1saWJzXG4gKi9cblxudmFyIEYgPSB7XG4gICAgdXRpbDoge30sXG4gICAgZmFjdG9yeToge30sXG4gICAgdHJhbnNwb3J0OiB7fSxcbiAgICBzdG9yZToge30sXG4gICAgc2VydmljZToge30sXG4gICAgbWFuYWdlcjoge1xuICAgICAgICBzdHJhdGVneToge31cbiAgICB9LFxuXG59O1xuXG5GLnV0aWwucXVlcnkgPSByZXF1aXJlKCcuL3V0aWwvcXVlcnktdXRpbCcpO1xuRi51dGlsLm1ha2VTZXF1ZW5jZSA9IHJlcXVpcmUoJy4vdXRpbC9tYWtlLXNlcXVlbmNlJyk7XG5GLnV0aWwucnVuID0gcmVxdWlyZSgnLi91dGlsL3J1bi11dGlsJyk7XG5GLnV0aWwuY2xhc3NGcm9tID0gcmVxdWlyZSgnLi91dGlsL2luaGVyaXQnKTtcblxuRi5mYWN0b3J5LlRyYW5zcG9ydCA9IHJlcXVpcmUoJy4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbkYudHJhbnNwb3J0LkFqYXggPSByZXF1aXJlKCcuL3RyYW5zcG9ydC9hamF4LWh0dHAtdHJhbnNwb3J0Jyk7XG5cbkYuc2VydmljZS5VUkwgPSByZXF1aXJlKCcuL3NlcnZpY2UvdXJsLWNvbmZpZy1zZXJ2aWNlJyk7XG5GLnNlcnZpY2UuQ29uZmlnID0gcmVxdWlyZSgnLi9zZXJ2aWNlL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xuRi5zZXJ2aWNlLlJ1biA9IHJlcXVpcmUoJy4vc2VydmljZS9ydW4tYXBpLXNlcnZpY2UnKTtcbkYuc2VydmljZS5WYXJpYWJsZXMgPSByZXF1aXJlKCcuL3NlcnZpY2UvdmFyaWFibGVzLWFwaS1zZXJ2aWNlJyk7XG5GLnNlcnZpY2UuRGF0YSA9IHJlcXVpcmUoJy4vc2VydmljZS9kYXRhLWFwaS1zZXJ2aWNlJyk7XG5GLnNlcnZpY2UuQXV0aCA9IHJlcXVpcmUoJy4vc2VydmljZS9hdXRoLWFwaS1zZXJ2aWNlJyk7XG5GLnNlcnZpY2UuV29ybGQgPSByZXF1aXJlKCcuL3NlcnZpY2Uvd29ybGQtYXBpLWFkYXB0ZXInKTtcblxuRi5zdG9yZS5Db29raWUgPSByZXF1aXJlKCcuL3N0b3JlL2Nvb2tpZS1zdG9yZScpO1xuRi5mYWN0b3J5LlN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZS9zdG9yZS1mYWN0b3J5Jyk7XG5cbkYubWFuYWdlci5TY2VuYXJpb01hbmFnZXIgPSByZXF1aXJlKCcuL21hbmFnZXJzL3NjZW5hcmlvLW1hbmFnZXInKTtcbkYubWFuYWdlci5SdW5NYW5hZ2VyID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9ydW4tbWFuYWdlcicpO1xuRi5tYW5hZ2VyLkF1dGhNYW5hZ2VyID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9hdXRoLW1hbmFnZXInKTtcbkYubWFuYWdlci5Xb3JsZE1hbmFnZXIgPSByZXF1aXJlKCcuL21hbmFnZXJzL3dvcmxkLW1hbmFnZXInKTtcblxuRi5tYW5hZ2VyLnN0cmF0ZWd5WydhbHdheXMtbmV3J10gPSByZXF1aXJlKCcuL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL2Fsd2F5cy1uZXctc3RyYXRlZ3knKTtcbkYubWFuYWdlci5zdHJhdGVneVsnY29uZGl0aW9uYWwtY3JlYXRpb24nXSA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvY29uZGl0aW9uYWwtY3JlYXRpb24tc3RyYXRlZ3knKTtcbkYubWFuYWdlci5zdHJhdGVneS5pZGVudGl0eSA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvaWRlbnRpdHktc3RyYXRlZ3knKTtcbkYubWFuYWdlci5zdHJhdGVneVsnbmV3LWlmLW1pc3NpbmcnXSA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvbmV3LWlmLW1pc3Npbmctc3RyYXRlZ3knKTtcbkYubWFuYWdlci5zdHJhdGVneVsnbmV3LWlmLW1pc3NpbmcnXSA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvbmV3LWlmLW1pc3Npbmctc3RyYXRlZ3knKTtcbkYubWFuYWdlci5zdHJhdGVneVsnbmV3LWlmLXBlcnNpc3RlZCddID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9uZXctaWYtcGVyc2lzdGVkLXN0cmF0ZWd5Jyk7XG5GLm1hbmFnZXIuc3RyYXRlZ3lbJ25ldy1pZi1pbml0aWFsaXplZCddID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9uZXctaWYtaW5pdGlhbGl6ZWQtc3RyYXRlZ3knKTtcblxuRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9lcGljZW50ZXItY2hhbm5lbC1tYW5hZ2VyJyk7XG5GLnNlcnZpY2UuQ2hhbm5lbCA9IHJlcXVpcmUoJy4vc2VydmljZS9jaGFubmVsLXNlcnZpY2UnKTtcblxuRi52ZXJzaW9uID0gJzwlPSB2ZXJzaW9uICU+JztcbndpbmRvdy5GID0gRjtcblxuIiwiLyoqXG4qICMjIEF1dGhvcml6YXRpb24gTWFuYWdlclxuKlxuKlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIEF1dGhBZGFwdGVyID0gcmVxdWlyZSgnLi4vc2VydmljZS9hdXRoLWFwaS1zZXJ2aWNlJyk7XG52YXIgTWVtYmVyQWRhcHRlciA9IHJlcXVpcmUoJy4uL3NlcnZpY2UvbWVtYmVyLWFwaS1hZGFwdGVyJyk7XG52YXIgU3RvcmFnZUZhY3RvcnkgPSByZXF1aXJlKCcuLi9zdG9yZS9zdG9yZS1mYWN0b3J5Jyk7XG52YXIgQnVmZmVyID0gcmVxdWlyZSgnYnVmZmVyJykuQnVmZmVyO1xudmFyIGtleU5hbWVzID0gcmVxdWlyZSgnLi9rZXktbmFtZXMnKTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIC8qKlxuICAgICAqIFdoZXJlIHRvIHN0b3JlIHVzZXIgYWNjZXNzIHRva2VucyBmb3IgdGVtcG9yYXJ5IGFjY2Vzcy4gRGVmYXVsdHMgdG8gc3RvcmluZyBpbiBhIGNvb2tpZSBpbiB0aGUgYnJvd3Nlci5cbiAgICAgKiBAdHlwZSB7IHN0cmluZ31cbiAgICAgKi9cbiAgICBzdG9yZTogeyBzeW5jaHJvbm91czogdHJ1ZSB9XG59O1xuXG52YXIgRVBJX0NPT0tJRV9LRVkgPSBrZXlOYW1lcy5FUElfQ09PS0lFX0tFWTtcbnZhciBFUElfU0VTU0lPTl9LRVkgPSBrZXlOYW1lcy5FUElfU0VTU0lPTl9LRVk7XG52YXIgc3RvcmU7XG52YXIgdG9rZW47XG5cbmZ1bmN0aW9uIHNhdmVTZXNzaW9uKHVzZXJJbmZvKSB7XG4gICAgdmFyIHNlcmlhbGl6ZWQgPSBKU09OLnN0cmluZ2lmeSh1c2VySW5mbyk7XG4gICAgc3RvcmUuc2V0KEVQSV9TRVNTSU9OX0tFWSwgc2VyaWFsaXplZCk7XG5cbiAgICAvL2pzaGludCBjYW1lbGNhc2U6IGZhbHNlXG4gICAgLy9qc2NzOmRpc2FibGVcbiAgICBzdG9yZS5zZXQoRVBJX0NPT0tJRV9LRVksIHVzZXJJbmZvLmF1dGhfdG9rZW4pO1xufVxuXG5mdW5jdGlvbiBnZXRTZXNzaW9uKCkge1xuICAgIHZhciBzZXNzaW9uID0gc3RvcmUuZ2V0KEVQSV9TRVNTSU9OX0tFWSkgfHwgJ3t9JztcbiAgICByZXR1cm4gSlNPTi5wYXJzZShzZXNzaW9uKTtcbn1cblxuZnVuY3Rpb24gQXV0aE1hbmFnZXIob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG4gICAgdGhpcy5hdXRoQWRhcHRlciA9IG5ldyBBdXRoQWRhcHRlcih0aGlzLm9wdGlvbnMpO1xuICAgIHRoaXMubWVtYmVyQWRhcHRlciA9IG5ldyBNZW1iZXJBZGFwdGVyKHRoaXMub3B0aW9ucyk7XG5cbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2UodGhpcy5vcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuICAgIGlmICghdGhpcy5vcHRpb25zLmFjY291bnQpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLmFjY291bnQgPSB1cmxDb25maWcuYWNjb3VudFBhdGg7XG4gICAgfVxuXG4gICAgLy8gbnVsbCBtaWdodCBzcGVjaWZpZWQgdG8gZGlzYWJsZSBwcm9qZWN0IGZpbHRlcmluZ1xuICAgIGlmICh0aGlzLm9wdGlvbnMucHJvamVjdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5wcm9qZWN0ID0gdXJsQ29uZmlnLnByb2plY3RQYXRoO1xuICAgIH1cblxuICAgIHN0b3JlID0gbmV3IFN0b3JhZ2VGYWN0b3J5KHRoaXMub3B0aW9ucy5zdG9yZSk7XG4gICAgdG9rZW4gPSBzdG9yZS5nZXQoRVBJX0NPT0tJRV9LRVkpIHx8ICcnO1xufVxuXG52YXIgX2ZpbmRVc2VySW5Hcm91cCA9IGZ1bmN0aW9uIChtZW1iZXJzLCBpZCkge1xuICAgIGZvciAodmFyIGogPSAwOyBqPG1lbWJlcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKG1lbWJlcnNbal0udXNlcklkID09PSBpZCkge1xuICAgICAgICAgICAgcmV0dXJuIG1lbWJlcnNbal07XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHJldHVybiBudWxsO1xufTtcblxuQXV0aE1hbmFnZXIucHJvdG90eXBlID0gJC5leHRlbmQoQXV0aE1hbmFnZXIucHJvdG90eXBlLCB7XG4gICAgbG9naW46IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciAkZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgdmFyIGFkYXB0ZXJPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwgeyBzdWNjZXNzOiAkLm5vb3AsIGVycm9yOiAkLm5vb3AgfSwgdGhpcy5vcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgdmFyIG91dFN1Y2Nlc3MgPSBhZGFwdGVyT3B0aW9ucy5zdWNjZXNzO1xuICAgICAgICB2YXIgb3V0RXJyb3IgPSBhZGFwdGVyT3B0aW9ucy5lcnJvcjtcbiAgICAgICAgdmFyIGdyb3VwSWQgPSBhZGFwdGVyT3B0aW9ucy5ncm91cElkO1xuXG4gICAgICAgIHZhciBkZWNvZGVUb2tlbiA9IGZ1bmN0aW9uICh0b2tlbikge1xuICAgICAgICAgICAgdmFyIGVuY29kZWQgPSB0b2tlbi5zcGxpdCgnLicpWzFdO1xuICAgICAgICAgICAgd2hpbGUgKGVuY29kZWQubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIGVuY29kZWQgKz0gJz0nO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZGVjb2RlID0gd2luZG93LmF0b2IgPyB3aW5kb3cuYXRvYiA6IGZ1bmN0aW9uIChlbmNvZGVkKSB7IHJldHVybiBuZXcgQnVmZmVyKGVuY29kZWQsICdiYXNlNjQnKS50b1N0cmluZygnYXNjaWknKTsgfTtcblxuICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoZGVjb2RlKGVuY29kZWQpKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaGFuZGxlR3JvdXBFcnJvciA9IGZ1bmN0aW9uIChtZXNzYWdlLCBzdGF0dXNDb2RlLCBkYXRhKSB7XG4gICAgICAgICAgICAvLyBsb2dvdXQgdGhlIHVzZXIgc2luY2UgaXQncyBpbiBhbiBpbnZhbGlkIHN0YXRlIHdpdGggbm8gZ3JvdXAgc2VsZWN0ZWRcbiAgICAgICAgICAgIF90aGlzLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBlcnJvciA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkYXRhLCB7IHN0YXR1c1RleHQ6IG1lc3NhZ2UsIHN0YXR1czogc3RhdHVzQ29kZSB9KTtcbiAgICAgICAgICAgICAgICAkZC5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZVN1Y2Nlc3MgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIC8vanNoaW50IGNhbWVsY2FzZTogZmFsc2VcbiAgICAgICAgICAgIC8vanNjczpkaXNhYmxlXG4gICAgICAgICAgICB0b2tlbiA9IHJlc3BvbnNlLmFjY2Vzc190b2tlbjtcblxuICAgICAgICAgICAgdmFyIHVzZXJJbmZvID0gZGVjb2RlVG9rZW4odG9rZW4pO1xuICAgICAgICAgICAgdmFyIHVzZXJHcm91cE9wdHMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgYWRhcHRlck9wdGlvbnMsIHt1c2VySWQ6IHVzZXJJbmZvLnVzZXJfaWQsIHN1Y2Nlc3M6ICQubm9vcCB9KTtcbiAgICAgICAgICAgIF90aGlzLmdldFVzZXJHcm91cHModXNlckdyb3VwT3B0cykuZG9uZSggZnVuY3Rpb24gKG1lbWJlckluZm8pIHtcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHthdXRoOiByZXNwb25zZSwgdXNlcjogdXNlckluZm8sIHVzZXJHcm91cHM6IG1lbWJlckluZm8sIGdyb3VwU2VsZWN0aW9uOiB7fSB9O1xuXG4gICAgICAgICAgICAgICAgdmFyIHNlc3Npb25JbmZvID0ge1xuICAgICAgICAgICAgICAgICAgICAnYXV0aF90b2tlbic6IHRva2VuLFxuICAgICAgICAgICAgICAgICAgICAnYWNjb3VudCc6IGFkYXB0ZXJPcHRpb25zLmFjY291bnQsXG4gICAgICAgICAgICAgICAgICAgICdwcm9qZWN0JzogYWRhcHRlck9wdGlvbnMucHJvamVjdCxcbiAgICAgICAgICAgICAgICAgICAgJ3VzZXJJZCc6IHVzZXJJbmZvLnVzZXJfaWRcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIC8vIFRoZSBncm91cCBpcyBub3QgcmVxdWlyZWQgaWYgdGhlIHVzZXIgaXMgbm90IGxvZ2dpbmcgaW50byBhIHByb2plY3RcbiAgICAgICAgICAgICAgICBpZiAoIWFkYXB0ZXJPcHRpb25zLnByb2plY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgc2F2ZVNlc3Npb24oc2Vzc2lvbkluZm8pO1xuICAgICAgICAgICAgICAgICAgICBvdXRTdWNjZXNzLmFwcGx5KHRoaXMsIFtkYXRhXSk7XG4gICAgICAgICAgICAgICAgICAgICRkLnJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgZ3JvdXAgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlmIChtZW1iZXJJbmZvLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVHcm91cEVycm9yKCdUaGUgdXNlciBoYXMgbm8gZ3JvdXBzIGFzc29jaWF0ZWQgaW4gdGhpcyBhY2NvdW50JywgNDAxLCBkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWVtYmVySW5mby5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gU2VsZWN0IHRoZSBvbmx5IGdyb3VwXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwID0gbWVtYmVySW5mb1swXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1lbWJlckluZm8ubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZ3JvdXBJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZpbHRlcmVkR3JvdXBzID0gJC5ncmVwKG1lbWJlckluZm8sIGZ1bmN0aW9uIChyZXNHcm91cCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNHcm91cC5ncm91cElkID09PSBncm91cElkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cCA9IGZpbHRlcmVkR3JvdXBzLmxlbmd0aCA9PT0gMSA/IGZpbHRlcmVkR3JvdXBzWzBdIDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChncm91cCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZ3JvdXBTZWxlY3Rpb24gPSBncm91cC5ncm91cElkO1xuICAgICAgICAgICAgICAgICAgICBkYXRhLmdyb3VwU2VsZWN0aW9uW2FkYXB0ZXJPcHRpb25zLnByb2plY3RdID0gZ3JvdXBTZWxlY3Rpb247XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZXNzaW9uSW5mb1dpdGhHcm91cCA9ICQuZXh0ZW5kKHt9LCBzZXNzaW9uSW5mbywge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2dyb3VwSWQnOiBncm91cC5ncm91cElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2dyb3VwTmFtZSc6IGdyb3VwLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnaXNGYWMnOiBfZmluZFVzZXJJbkdyb3VwKGdyb3VwLm1lbWJlcnMsIHVzZXJJbmZvLnVzZXJfaWQpLnJvbGUgPT09ICdmYWNpbGl0YXRvcidcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHNhdmVTZXNzaW9uKHNlc3Npb25JbmZvV2l0aEdyb3VwKTtcbiAgICAgICAgICAgICAgICAgICAgb3V0U3VjY2Vzcy5hcHBseSh0aGlzLCBbZGF0YV0pO1xuICAgICAgICAgICAgICAgICAgICAkZC5yZXNvbHZlKGRhdGEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZUdyb3VwRXJyb3IoJ1RoaXMgYWNjb3VudCBpcyBhc3NvY2lhdGVkIHdpdGggbW9yZSB0aGF0IG9uZSBncm91cC4gUGxlYXNlIHNwZWNpZnkgYSBncm91cCBpZCB0byBsb2cgaW50byBhbmQgdHJ5IGFnYWluJywgNDAzLCBkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS5mYWlsKCRkLnJlamVjdCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgYWRhcHRlck9wdGlvbnMuc3VjY2VzcyA9IGhhbmRsZVN1Y2Nlc3M7XG4gICAgICAgIGFkYXB0ZXJPcHRpb25zLmVycm9yID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBpZiAoYWRhcHRlck9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICAgICAgICAgIC8vIFRyeSB0byBsb2dpbiBhcyBhIHN5c3RlbSB1c2VyXG4gICAgICAgICAgICAgICAgYWRhcHRlck9wdGlvbnMuYWNjb3VudCA9IG51bGw7XG4gICAgICAgICAgICAgICAgYWRhcHRlck9wdGlvbnMuZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dEVycm9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgICRkLnJlamVjdChyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIF90aGlzLmF1dGhBZGFwdGVyLmxvZ2luKGFkYXB0ZXJPcHRpb25zKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG91dEVycm9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAkZC5yZWplY3QocmVzcG9uc2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuYXV0aEFkYXB0ZXIubG9naW4oYWRhcHRlck9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gJGQucHJvbWlzZSgpO1xuICAgIH0sXG5cbiAgICBsb2dvdXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciAkZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgdmFyIGFkYXB0ZXJPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge3N1Y2Nlc3M6ICQubm9vcCwgdG9rZW46IHRva2VuIH0sIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgdmFyIHJlbW92ZUNvb2tpZUZuID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBzdG9yZS5yZW1vdmUoRVBJX0NPT0tJRV9LRVksIGFkYXB0ZXJPcHRpb25zKTtcbiAgICAgICAgICAgIHN0b3JlLnJlbW92ZShFUElfU0VTU0lPTl9LRVksIGFkYXB0ZXJPcHRpb25zKTtcbiAgICAgICAgICAgIHRva2VuID0gJyc7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIG91dFN1Y2Nlc3MgPSBhZGFwdGVyT3B0aW9ucy5zdWNjZXNzO1xuICAgICAgICBhZGFwdGVyT3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZW1vdmVDb29raWVGbihyZXNwb25zZSk7XG4gICAgICAgICAgICBvdXRTdWNjZXNzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gRXBpY2VudGVyIHJldHVybnMgYSBiYWQgcmVxdWVzdCB3aGVuIHRyeWluZyB0byBkZWxldGUgYSB0b2tlbi4gSXQgc2VlbXMgbGlrZSB0aGUgQVBJIGNhbGwgaXMgbm90IGltcGxlbWVudGVkIHlldFxuICAgICAgICAvLyBPbmNlIGl0J3MgaW1wbGVtZW50ZWQgdGhpcyBlcnJvciBoYW5kbGVyIHNob3VsZCBub3QgYmUgbmVjZXNzYXJ5LlxuICAgICAgICBhZGFwdGVyT3B0aW9ucy5lcnJvciA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgcmVtb3ZlQ29va2llRm4ocmVzcG9uc2UpO1xuICAgICAgICAgICAgb3V0U3VjY2Vzcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgJGQucmVzb2x2ZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuYXV0aEFkYXB0ZXIubG9nb3V0KGFkYXB0ZXJPcHRpb25zKS5kb25lKCRkLnJlc29sdmUpO1xuICAgICAgICByZXR1cm4gJGQucHJvbWlzZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGV4aXN0aW5nIHVzZXIgYWNjZXNzIHRva2VuIGlmIGFscmVhZHkgbG9nZ2VkIGluLCBvciBjcmVhdGVzIGEgbmV3IG9uZSBvdGhlcndpc2UuIChTZWUgW21vcmUgYmFja2dyb3VuZCBvbiBhY2Nlc3MgdG9rZW5zXSguLi8uLi8uLi9wcm9qZWN0X2FjY2Vzcy8pKS5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIGF1dGguZ2V0VG9rZW4oKS50aGVuKGZ1bmN0aW9uICh0b2tlbikgeyBjb25zb2xlLmxvZygnbXkgdG9rZW4gaXMnLCB0b2tlbik7IH0pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICovXG4gICAgZ2V0VG9rZW46IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgdmFyICRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICBpZiAodG9rZW4pIHtcbiAgICAgICAgICAgICRkLnJlc29sdmUodG9rZW4pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sb2dpbihodHRwT3B0aW9ucykudGhlbigkZC5yZXNvbHZlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJGQucHJvbWlzZSgpO1xuICAgIH0sXG5cbiAgICBnZXRVc2VyR3JvdXBzOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgYWRhcHRlck9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7c3VjY2VzczogJC5ub29wIH0sIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgIHZhciAkZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgdmFyIG91dFN1Y2Nlc3MgPSBhZGFwdGVyT3B0aW9ucy5zdWNjZXNzO1xuXG4gICAgICAgIGFkYXB0ZXJPcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbiAobWVtYmVySW5mbykge1xuICAgICAgICAgICAgLy8gVGhlIG1lbWJlciBBUEkgaXMgYXQgdGhlIGFjY291bnQgc2NvcGUsIHdlIGZpbHRlciBieSBwcm9qZWN0XG4gICAgICAgICAgICBpZiAoYWRhcHRlck9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICAgICAgICAgIG1lbWJlckluZm8gPSAkLmdyZXAobWVtYmVySW5mbywgZnVuY3Rpb24gKGdyb3VwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBncm91cC5wcm9qZWN0ID09PSBhZGFwdGVyT3B0aW9ucy5wcm9qZWN0O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvdXRTdWNjZXNzLmFwcGx5KHRoaXMsIFttZW1iZXJJbmZvXSk7XG4gICAgICAgICAgICAkZC5yZXNvbHZlKG1lbWJlckluZm8pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubWVtYmVyQWRhcHRlci5nZXRHcm91cHNCeVVzZXIoYWRhcHRlck9wdGlvbnMpLmZhaWwoJGQucmVqZWN0KTtcbiAgICAgICAgcmV0dXJuICRkLnByb21pc2UoKTtcbiAgICB9LFxuXG4gICAgZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbzogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIGdldFNlc3Npb24ob3B0aW9ucyk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXV0aE1hbmFnZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBDaGFubmVsID0gcmVxdWlyZSgnLi4vc2VydmljZS9jaGFubmVsLXNlcnZpY2UnKTtcblxuLyoqXG4gKiBHZW5lcmljIHdyYXBwZXIgYXJvdW5kICQuY29tZXRkLiBUaGlzIHByb3ZpZGVzIGEgZmV3IG5pY2UgZmVhdHVyZXMgdGhlIGRlZmF1bHQgY29tZXRkIHdyYXBwZXIgZG9lc24ndFxuICpcbiAqIC0gQXV0b21hdGljIHJlLXN1YnNjcmlwdGlvbiB0byBjaGFubmVscyBpZiB5b3UgbG9zZSB5b3VyIGNvbm5lY3Rpb24gaW4tYmV0d2VlblxuICogLSBPbmxpbmUvIE9mZmxpbmUgbm90aWZpY2F0aW9uc1xuICogLSAnRXZlbnRzJyBmb3IgY29tZXRkIG5vdGlmaWNhdGlvbnMsIGluc3RlYWQgb2YgaGF2aW5nIHRvIGxpc3RlbiBvbiBzcGVjaWZpYyBtZXRhIGNoYW5uZWxzXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgQ29tZXRkIGVuZHBvaW50IHVybFxuICogQHBhcmFtIHtCb29sZWFufSB3ZWJzb2NrZXRFbmFibGVkIERldGVybWluZSBpZiB3ZWJzb2NrZXQgc3VwcG9ydCBpcyB0byBiZSBhY3RpdmF0ZWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBDaGFubmVsIERlZmF1bHRzIHRvIHBhc3Mgb24gdG8gY2hhbm5lbCBpbnN0YW5jZXMuIFNlZSBAQ2hhbm5lbFNlcnZpY2UgZm9yIG1vcmUgaW5mb1xuICpcbiAqIFNlZSBodHRwOi8vZG9jcy5jb21ldGQub3JnL3JlZmVyZW5jZS9qYXZhc2NyaXB0Lmh0bWwgZm9yIG90aGVyIHN1cHBvcnRlZCBvcHRpb25zXG4gKi9cbnZhciBDaGFubmVsTWFuYWdlciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgaWYgKCEkLmNvbWV0ZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbWV0ZCBsaWJyYXJ5IG5vdCBmb3VuZC4gUGxlYXNlIGluY2x1ZGUgZXBpY2VudGVyLW11bHRpcGxheWVyLWRlcGVuZGVuY2llcy5qcycpO1xuICAgIH1cbiAgICBpZiAoIW9wdGlvbnMgfHwgIW9wdGlvbnMudXJsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHByb3ZpZGUgYW4gdXJsIGZvciB0aGUgY29tZXRkIHNlcnZlcicpO1xuICAgIH1cblxuICAgIHZhciBjb21ldGQgPSBuZXcgJC5Db21ldGQoKTtcblxuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgdXJsOiAnJyxcbiAgICAgICAgbG9nTGV2ZWw6ICdpbmZvJyxcbiAgICAgICAgd2Vic29ja2V0RW5hYmxlZDogZmFsc2UsIC8vbmVlZHMgdG8gYmUgdHVybmVkIG9uIG9uIHRoZSBzZXJ2ZXJcblxuICAgICAgICAvL0V2ZXJ5dGhpbmcgcHJvdmlkZWQgaGVyZSB3aWxsIGJlIHByb3ZpZGVkIGFzIGRlZmF1bHRzIGZvciBjaGFubmVsIGNyZWF0ZWQgdGhyb3VnaCBnZXRDaGFubmVsXG4gICAgICAgIGNoYW5uZWw6IHtcblxuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgZGVmYXVsdENvbWV0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG5cbiAgICBjb21ldGQud2Vic29ja2V0RW5hYmxlZCA9IGRlZmF1bHRDb21ldE9wdGlvbnMud2Vic29ja2V0RW5hYmxlZDtcblxuICAgIHRoaXMuaXNDb25uZWN0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLmN1cnJlbnRTdWJzY3JpcHRpb25zID0gW107XG4gICAgdGhpcy5vcHRpb25zID0gZGVmYXVsdENvbWV0T3B0aW9ucztcblxuICAgIHZhciBjb25uZWN0aW9uQnJva2VuID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgJCh0aGlzKS50cmlnZ2VyKCdkaXNjb25uZWN0JywgbWVzc2FnZSk7XG4gICAgfTtcbiAgICB2YXIgY29ubmVjdGlvblN1Y2NlZWRlZCA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICQodGhpcykudHJpZ2dlcignY29ubmVjdCcsIG1lc3NhZ2UpO1xuICAgIH07XG4gICAgdmFyIG1lID0gdGhpcztcblxuICAgIGNvbWV0ZC5jb25maWd1cmUoZGVmYXVsdENvbWV0T3B0aW9ucyk7XG5cbiAgICBjb21ldGQuYWRkTGlzdGVuZXIoJy9tZXRhL2Nvbm5lY3QnLCBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICB2YXIgd2FzQ29ubmVjdGVkID0gdGhpcy5pc0Nvbm5lY3RlZDtcbiAgICAgICAgdGhpcy5pc0Nvbm5lY3RlZCA9IChtZXNzYWdlLnN1Y2Nlc3NmdWwgPT09IHRydWUpO1xuICAgICAgICBpZiAoIXdhc0Nvbm5lY3RlZCAmJiB0aGlzLmlzQ29ubmVjdGVkKSB7IC8vQ29ubmVjdGluZyBmb3IgdGhlIGZpcnN0IHRpbWVcbiAgICAgICAgICAgIGNvbm5lY3Rpb25TdWNjZWVkZWQuY2FsbCh0aGlzLCBtZXNzYWdlKTtcbiAgICAgICAgfSBlbHNlIGlmICh3YXNDb25uZWN0ZWQgJiYgIXRoaXMuaXNDb25uZWN0ZWQpIHsgLy9Pbmx5IHRocm93IGRpc2Nvbm5lY3RlZCBtZXNzYWdlIGZybyB0aGUgZmlyc3QgZGlzY29ubmVjdCwgbm90IG9uY2UgcGVyIHRyeVxuICAgICAgICAgICAgY29ubmVjdGlvbkJyb2tlbi5jYWxsKHRoaXMsIG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcblxuICAgIGNvbWV0ZC5hZGRMaXN0ZW5lcignL21ldGEvZGlzY29ubmVjdCcsIGNvbm5lY3Rpb25Ccm9rZW4pO1xuXG4gICAgY29tZXRkLmFkZExpc3RlbmVyKCcvbWV0YS9oYW5kc2hha2UnLCBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICBpZiAobWVzc2FnZS5zdWNjZXNzZnVsKSB7XG4gICAgICAgICAgICAvL2h0dHA6Ly9kb2NzLmNvbWV0ZC5vcmcvcmVmZXJlbmNlL2phdmFzY3JpcHRfc3Vic2NyaWJlLmh0bWwjamF2YXNjcmlwdF9zdWJzY3JpYmVfbWV0YV9jaGFubmVsc1xuICAgICAgICAgICAgLy8gXiBcImR5bmFtaWMgc3Vic2NyaXB0aW9ucyBhcmUgY2xlYXJlZCAobGlrZSBhbnkgb3RoZXIgc3Vic2NyaXB0aW9uKSBhbmQgdGhlIGFwcGxpY2F0aW9uIG5lZWRzIHRvIGZpZ3VyZSBvdXQgd2hpY2ggZHluYW1pYyBzdWJzY3JpcHRpb24gbXVzdCBiZSBwZXJmb3JtZWQgYWdhaW5cIlxuICAgICAgICAgICAgY29tZXRkLmJhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkKG1lLmN1cnJlbnRTdWJzY3JpcHRpb25zKS5lYWNoKGZ1bmN0aW9uIChpbmRleCwgc3Vicykge1xuICAgICAgICAgICAgICAgICAgICBjb21ldGQucmVzdWJzY3JpYmUoc3Vicyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy9PdGhlciBpbnRlcmVzdGluZyBldmVudHMgZm9yIHJlZmVyZW5jZVxuICAgIGNvbWV0ZC5hZGRMaXN0ZW5lcignL21ldGEvc3Vic2NyaWJlJywgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgJChtZSkudHJpZ2dlcignc3Vic2NyaWJlJywgbWVzc2FnZSk7XG4gICAgfSk7XG4gICAgY29tZXRkLmFkZExpc3RlbmVyKCcvbWV0YS91bnN1YnNjcmliZScsIGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICQobWUpLnRyaWdnZXIoJ3Vuc3Vic2NyaWJlJywgbWVzc2FnZSk7XG4gICAgfSk7XG4gICAgY29tZXRkLmFkZExpc3RlbmVyKCcvbWV0YS9wdWJsaXNoJywgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgJChtZSkudHJpZ2dlcigncHVibGlzaCcsIG1lc3NhZ2UpO1xuICAgIH0pO1xuICAgIGNvbWV0ZC5hZGRMaXN0ZW5lcignL21ldGEvdW5zdWNjZXNzZnVsJywgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgJChtZSkudHJpZ2dlcignZXJyb3InLCBtZXNzYWdlKTtcbiAgICB9KTtcblxuICAgIGNvbWV0ZC5oYW5kc2hha2UoKTtcblxuICAgIHRoaXMuY29tZXRkID0gY29tZXRkO1xufTtcblxuQ2hhbm5lbE1hbmFnZXIucHJvdG90eXBlLmdldENoYW5uZWwgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIC8vSWYgeW91IGp1c3Qgd2FudCB0byBwYXNzIGluIGEgc3RyaW5nXG4gICAgaWYgKG9wdGlvbnMgJiYgISQuaXNQbGFpbk9iamVjdChvcHRpb25zKSkge1xuICAgICAgICBvcHRpb25zID0ge1xuICAgICAgICAgICAgYmFzZTogb3B0aW9uc1xuICAgICAgICB9O1xuICAgIH1cbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIHRyYW5zcG9ydDogdGhpcy5jb21ldGRcbiAgICB9O1xuICAgIHZhciBjaGFubmVsID0gbmV3IENoYW5uZWwoJC5leHRlbmQodHJ1ZSwge30sIHRoaXMub3B0aW9ucy5jaGFubmVsLCBkZWZhdWx0cywgb3B0aW9ucykpO1xuXG5cbiAgICAvL1dyYXAgc3VicyBhbmQgdW5zdWJzIHNvIHdlIGNhbiB1c2UgaXQgdG8gcmUtYXR0YWNoIGhhbmRsZXJzIGFmdGVyIGJlaW5nIGRpc2Nvbm5lY3RlZFxuICAgIHZhciBzdWJzID0gY2hhbm5lbC5zdWJzY3JpYmU7XG4gICAgY2hhbm5lbC5zdWJzY3JpYmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzdWJpZCA9IHN1YnMuYXBwbHkoY2hhbm5lbCwgYXJndW1lbnRzKTtcbiAgICAgICAgdGhpcy5jdXJyZW50U3Vic2NyaXB0aW9ucyAgPSB0aGlzLmN1cnJlbnRTdWJzY3JpcHRpb25zLmNvbmNhdChzdWJpZCk7XG4gICAgICAgIHJldHVybiBzdWJpZDtcbiAgICB9LmJpbmQodGhpcyk7XG5cblxuICAgIHZhciB1bnN1YnMgPSBjaGFubmVsLnVuc3Vic2NyaWJlO1xuICAgIGNoYW5uZWwudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZW1vdmVkID0gdW5zdWJzLmFwcGx5KGNoYW5uZWwsIGFyZ3VtZW50cyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jdXJyZW50U3Vic2NyaXB0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudFN1YnNjcmlwdGlvbnNbaV0uaWQgPT09IHJlbW92ZWQuaWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRTdWJzY3JpcHRpb25zLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVtb3ZlZDtcbiAgICB9LmJpbmQodGhpcyk7XG5cbiAgICByZXR1cm4gY2hhbm5lbDtcbn07XG5cbi8qKlxuICogTGlzdGVuIGZvciBldmVudHMgb24gdGhpcyBpbnN0YW5jZS4gU2lnbmF0dXJlIGlzIHNhbWUgYXMgZm9yIGpRdWVyeSBFdmVudHMuIFN1cHBvcnRlZCBldmVudHMgYXJlOlxuICogIGNvbm5lY3QsIGRpc2Nvbm5lY3QsIHN1YnNjcmliZSwgdW5zdWJzY3JpYmUsIHB1Ymxpc2gsIGVycm9yXG4gKi9cbkNoYW5uZWxNYW5hZ2VyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAkKHRoaXMpLm9uLmFwcGx5KCQodGhpcyksIGFyZ3VtZW50cyk7XG59O1xuLyoqXG4gKiBTdG9wIGxpc3RlbmluZyBmb3IgZXZlbnRzLiBTaWduYXR1cmUgaXMgc2FtZSBhcyBmb3IgalF1ZXJ5IEV2ZW50c1xuICovXG5DaGFubmVsTWFuYWdlci5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24gKCkge1xuICAgICQodGhpcykub2ZmLmFwcGx5KCQodGhpcyksIGFyZ3VtZW50cyk7XG59O1xuLyoqXG4gKiBUcmlnZ2VyIGV2ZW50cy4gU2lnbmF0dXJlIGlzIHNhbWUgYXMgZm9yIGpRdWVyeSBFdmVudHNcbiAqL1xuQ2hhbm5lbE1hbmFnZXIucHJvdG90eXBlLnRyaWdnZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgJCh0aGlzKS50cmlnZ2VyLmFwcGx5KCQodGhpcyksIGFyZ3VtZW50cyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENoYW5uZWxNYW5hZ2VyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFdyYXBwZXIgYXJvdW5kIGNoYW5uZWwgbWFuYWdlciB0byBpbnN0YW50aWF0ZSBpdCB3aXRoIGVwaWNlbnRlci1zcGVjaWZpYyBkZWZhdWx0c1xuICovXG5cbnZhciBDaGFubmVsTWFuYWdlciA9IHJlcXVpcmUoJy4vY2hhbm5lbC1tYW5hZ2VyJyk7XG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgdXJsU2VydmljZSA9IHJlcXVpcmUoJy4uL3NlcnZpY2UvdXJsLWNvbmZpZy1zZXJ2aWNlJyk7XG5cbnZhciBBdXRoTWFuYWdlciA9IHJlcXVpcmUoJy4vYXV0aC1tYW5hZ2VyJyk7XG5cbnZhciBzZXNzaW9uID0gbmV3IEF1dGhNYW5hZ2VyKCk7XG52YXIgZ2V0RnJvbVNlc3Npb25PckVycm9yID0gZnVuY3Rpb24gKHZhbHVlLCBzZXNzaW9uS2V5TmFtZSkge1xuICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgdmFyIHVzZXJJbmZvID0gc2Vzc2lvbi5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICAgIGlmICh1c2VySW5mb1tzZXNzaW9uS2V5TmFtZV0pIHtcbiAgICAgICAgICAgIHZhbHVlID0gdXNlckluZm9bc2Vzc2lvbktleU5hbWVdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHNlc3Npb25LZXlOYW1lICsgJyBub3QgZm91bmQuIFBsZWFzZSBsb2ctaW4gYWdhaW4sIG9yIHNwZWNpZnkgJyArIHNlc3Npb25LZXlOYW1lICsgJyBleHBsaWNpdGx5Jyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufTtcbnZhciBfX3N1cGVyID0gQ2hhbm5lbE1hbmFnZXIucHJvdG90eXBlO1xudmFyIEVwaWNlbnRlckNoYW5uZWxNYW5hZ2VyID0gY2xhc3NGcm9tKENoYW5uZWxNYW5hZ2VyLCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciB1c2VySW5mbyA9IHNlc3Npb24uZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbygpO1xuXG4gICAgICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgICAgIC8vU2VlIGRvY3MgZm9yIHVybCBjb25maWcgc2VydmljZVxuICAgICAgICAgICAgc2VydmVyOiB7XG4gICAgICAgICAgICAgICAgYWNjb3VudDogdXNlckluZm8uYWNjb3VudCxcbiAgICAgICAgICAgICAgICBwcm9qZWN0OiB1c2VySW5mby5wcm9qZWN0XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBkZWZhdWx0Q29tZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCB1c2VySW5mbywgb3B0aW9ucyk7XG5cbiAgICAgICAgdmFyIHVybE9wdHMgPSB1cmxTZXJ2aWNlKGRlZmF1bHRDb21ldE9wdGlvbnMuc2VydmVyKTtcbiAgICAgICAgaWYgKCFkZWZhdWx0Q29tZXRPcHRpb25zLnVybCkge1xuICAgICAgICAgICAgLy9EZWZhdWx0IGVwaWNlbnRlciBjb21ldGQgZW5kcG9pbnRcbiAgICAgICAgICAgIGRlZmF1bHRDb21ldE9wdGlvbnMudXJsID0gdXJsT3B0cy5wcm90b2NvbCArICc6Ly8nICsgdXJsT3B0cy5ob3N0ICsgJy9jaGFubmVsL3N1YnNjcmliZSc7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBkZWZhdWx0Q29tZXRPcHRpb25zO1xuICAgICAgICByZXR1cm4gX19zdXBlci5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIGRlZmF1bHRDb21ldE9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYSBwdWIvc3ViIGNoYW5uZWwgZm9yIHRoZSBnaXZlbiBncm91cC4gVGhlcmUgd2lsbCBiZSBubyBkZWZhdWx0IG5vdGlmaWNhdGlvbnMgZnJvbSBFcGljZW50ZXIgb24gdGhpcyBjaGFubmVsLCBhbGwgbWVzc2FnZXMgd2lsbCBiZSB1c2VyLW9yZ2luYXRlZFxuICAgICAqXG4gICAgICogKiogRXhhbXBsZSB1c2FnZSAqKlxuICAgICAqICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWwoKTtcbiAgICAgKiAgICAgdmFyIGdjID0gY20uZ2V0Z2V0R3JvdXBDaGFubmVsKCk7XG4gICAgICogICAgIGdjLnN1YnNjcmliZSgnYnJvYWRjYXN0cycsIGNhbGxiYWNrKTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gZ3JvdXBOYW1lIChvcHRpb25hbCkgR3JvdXAgdG8gYnJvYWRjYXN0IHRvLiBJZiBub3QgcHJvdmlkZWQsIHBpY2tzIHVwIGdyb3VwIGZyb20gY3VycmVudCBzZXNzaW9uIGlmIGxvZ2dlZCBpbi5cbiAgICAgKiBAcmV0dXJuIHtDaGFubmVsfVxuICAgICAqL1xuICAgIGdldEdyb3VwQ2hhbm5lbDogZnVuY3Rpb24gKGdyb3VwTmFtZSkge1xuICAgICAgICBncm91cE5hbWUgPSBnZXRGcm9tU2Vzc2lvbk9yRXJyb3IoZ3JvdXBOYW1lLCAnZ3JvdXBOYW1lJyk7XG4gICAgICAgIHZhciBiYXNlVG9waWMgPSBbJy9ncm91cCcsIHRoaXMub3B0aW9ucy5zZXJ2ZXIuYWNjb3VudCwgdGhpcy5vcHRpb25zLnNlcnZlci5wcm9qZWN0LCBncm91cE5hbWVdLmpvaW4oJy8nKTtcbiAgICAgICAgcmV0dXJuIF9fc3VwZXIuZ2V0Q2hhbm5lbC5jYWxsKHRoaXMsIHsgYmFzZTogYmFzZVRvcGljIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYSBwdWIvc3ViIGNoYW5uZWwgZm9yIHRoZSBnaXZlbiB3b3JsZC4gTm90ZTogWW91J2xsIG5vdCBnZXQgbm90aWZpY2F0aW9ucyBmb3Igd29ybGRzIHdoaWNoJ3JlIG5vdCBpbiBtZW1vcnkuIFR5cGljYWxseSB1c2VkIHdpdGggdGhlIFdvcmxkTWFuYWdlclxuICAgICAqXG4gICAgICogKiogRXhhbXBsZSB1c2FnZSAqKlxuICAgICAqICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWwoKTtcbiAgICAgKiAgICAgdmFyIHdvcmxkTWFuYWdlciA9IG5ldyBGLm1hbmFnZXIuV29ybGRNYW5hZ2VyKHtcbiAgICAgKiAgICAgICAgIGFjY291bnQ6ICdYJyxcbiAgICAgKiAgICAgICAgIHByb2plY3Q6ICdZJyxcbiAgICAgKiAgICAgICAgIG1vZGVsOiAnbW9kZWwuZXFuJ1xuICAgICAqICAgICB9KTtcbiAgICAgKiAgICAgd29ybGRNYW5hZ2VyLmdldEN1cnJlbnRXb3JsZCgpLnRoZW4oZnVuY3Rpb24gKHdvcmxkT2JqZWN0LCB3b3JsZFNlcnZpY2UpIHtcbiAgICAgKiAgICAgICAgIHZhciB3b3JsZENoYW5uZWwgPSBjbS5nZXRXb3JsZENoYW5uZWwod29ybGRPYmplY3QpO1xuICAgICAqICAgICAgICAgd29ybGRDaGFubmVsLnN1YnNjcmliZSgnJywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgKiAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgKiAgICAgICAgIH0pO1xuICAgICAqICAgICAgfSk7XG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd8T2JqZWN0fSB3b3JsZCAgICAgd29ybGQgb2JqZWN0IG9yIGlkXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBncm91cE5hbWUgKG9wdGlvbmFsKSBHcm91cCB0aGUgd29ybGQgZXhpc3RzIGluLiBJZiBub3QgcHJvdmlkZWQsIHBpY2tzIHVwIGdyb3VwIGZyb20gY3VycmVudCBzZXNzaW9uIGlmIGxvZ2dlZCBpbi5cbiAgICAgKiBAcmV0dXJuIHtDaGFubmVsfVxuICAgICAqL1xuICAgIGdldFdvcmxkQ2hhbm5lbDogZnVuY3Rpb24gKHdvcmxkLCBncm91cE5hbWUpIHtcbiAgICAgICAgdmFyIHdvcmxkaWQgPSAoJC5pc1BsYWluT2JqZWN0KHdvcmxkKSAmJiB3b3JsZC5pZCkgPyB3b3JsZC5pZCA6IHdvcmxkO1xuICAgICAgICBpZiAoIXdvcmxkaWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHNwZWNpZnkgYSB3b3JsZCBpZCcpO1xuICAgICAgICB9XG4gICAgICAgIGdyb3VwTmFtZSA9IGdldEZyb21TZXNzaW9uT3JFcnJvcihncm91cE5hbWUsICdncm91cE5hbWUnKTtcbiAgICAgICAgdmFyIGJhc2VUb3BpYyA9IFsnL2dhbWUnLCB0aGlzLm9wdGlvbnMuc2VydmVyLmFjY291bnQsIHRoaXMub3B0aW9ucy5zZXJ2ZXIucHJvamVjdCwgZ3JvdXBOYW1lLCB3b3JsZGlkXS5qb2luKCcvJyk7XG4gICAgICAgIHJldHVybiBfX3N1cGVyLmdldENoYW5uZWwuY2FsbCh0aGlzLCB7IGJhc2U6IGJhc2VUb3BpYyB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGEgcHViL3N1YiBjaGFubmVsIGZvciB0aGUgY3VycmVudCB1c2VyLiBOZWVkcyB0aGUgdXNlcidzIGN1cnJlbnQgd29ybGQgdG8gd29yay4gTm90ZTogWW91J2xsIG5vdCBnZXQgbm90aWZpY2F0aW9ucyBmb3Igd29ybGRzIHdoaWNoJ3JlIG5vdCBpbiBtZW1vcnkuIFR5cGljYWxseSB1c2VkIHdpdGggdGhlIFdvcmxkTWFuYWdlclxuICAgICAqXG4gICAgICogKiogRXhhbXBsZSB1c2FnZSAqKlxuICAgICAqICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWwoKTtcbiAgICAgKiAgICAgdmFyIHdvcmxkTWFuYWdlciA9IG5ldyBGLm1hbmFnZXIuV29ybGRNYW5hZ2VyKHtcbiAgICAgKiAgICAgICAgIGFjY291bnQ6ICdYJyxcbiAgICAgKiAgICAgICAgIHByb2plY3Q6ICdZJyxcbiAgICAgKiAgICAgICAgIG1vZGVsOiAnbW9kZWwuZXFuJ1xuICAgICAqICAgICB9KTtcbiAgICAgKiAgICAgd29ybGRNYW5hZ2VyLmdldEN1cnJlbnRXb3JsZCgpLnRoZW4oZnVuY3Rpb24gKHdvcmxkT2JqZWN0LCB3b3JsZFNlcnZpY2UpIHtcbiAgICAgKiAgICAgICAgIHZhciB3b3JsZENoYW5uZWwgPSBjbS5nZXRXb3JsZENoYW5uZWwod29ybGRPYmplY3QpO1xuICAgICAqICAgICAgICAgd29ybGRDaGFubmVsLnN1YnNjcmliZSgnJywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgKiAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgKiAgICAgICAgIH0pO1xuICAgICAqICAgICAgfSk7XG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd8T2JqZWN0fSB3b3JsZCAgICAgd29ybGQgb2JqZWN0IG9yIGlkXG4gICAgICogQHBhcmFtICB7U3RyaW5nfE9iamVjdH0gdXNlciAoT3B0aW9uYWwpICAgIHVzZXIgb2JqZWN0IG9yIGlkLiBJZiBub3QgcHJvdmlkZWQsIHBpY2tzIHVwIHVzZXIgaWQgZnJvbSBjdXJyZW50IHNlc3Npb24gaWYgbG9nZ2VkIGluLlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gZ3JvdXBOYW1lIChvcHRpb25hbCkgR3JvdXAgdGhlIHdvcmxkIGV4aXN0cyBpbi4gSWYgbm90IHByb3ZpZGVkLCBwaWNrcyB1cCBncm91cCBmcm9tIGN1cnJlbnQgc2Vzc2lvbiBpZiBsb2dnZWQgaW4uXG4gICAgICogQHJldHVybiB7Q2hhbm5lbH1cbiAgICAgKi9cbiAgICBnZXRVc2VyQ2hhbm5lbDogZnVuY3Rpb24gKHdvcmxkLCB1c2VyLCBncm91cE5hbWUpIHtcbiAgICAgICAgdmFyIHVzZXJpZCA9ICgkLmlzUGxhaW5PYmplY3QodXNlcikgJiYgdXNlci5pZCkgPyB1c2VyLmlkIDogdXNlcjtcbiAgICAgICAgdmFyIHdvcmxkaWQgPSAoJC5pc1BsYWluT2JqZWN0KHdvcmxkKSAmJiB3b3JsZC5pZCkgPyB3b3JsZC5pZCA6IHdvcmxkO1xuICAgICAgICBpZiAoIXdvcmxkaWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHNwZWNpZnkgYSB3b3JsZCBpZCcpO1xuICAgICAgICB9XG4gICAgICAgIHVzZXJpZCA9IGdldEZyb21TZXNzaW9uT3JFcnJvcih1c2VyaWQsICd1c2VySWQnKTtcbiAgICAgICAgZ3JvdXBOYW1lID0gZ2V0RnJvbVNlc3Npb25PckVycm9yKGdyb3VwTmFtZSwgJ2dyb3VwTmFtZScpO1xuXG4gICAgICAgIHZhciBiYXNlVG9waWMgPSBbJy91c2VycycsIHRoaXMub3B0aW9ucy5zZXJ2ZXIuYWNjb3VudCwgdGhpcy5vcHRpb25zLnNlcnZlci5wcm9qZWN0LCBncm91cE5hbWUsIHdvcmxkaWQsIHVzZXJpZF0uam9pbignLycpO1xuICAgICAgICByZXR1cm4gX19zdXBlci5nZXRDaGFubmVsLmNhbGwodGhpcywgeyBiYXNlOiBiYXNlVG9waWMgfSk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRXBpY2VudGVyQ2hhbm5lbE1hbmFnZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIEVQSV9DT09LSUVfS0VZOiAnZXBpY2VudGVyLnByb2plY3QudG9rZW4nLFxuICAgIEVQSV9TRVNTSU9OX0tFWTogJ2VwaWNlbnRlci51c2VyLnNlc3Npb24nLFxuICAgIFNUUkFURUdZX1NFU1NJT05fS0VZOiAnZXBpY2VudGVyLXNjZW5hcmlvJ1xufTsiLCIvKipcbiogIyMgUnVuIE1hbmFnZXJcbipcbiogVGhlIFJ1biBNYW5hZ2VyIGdpdmVzIHlvdSBjb250cm9sIG92ZXIgcnVuIGNyZWF0aW9uIGRlcGVuZGluZyBvbiBydW4gc3RhdGVzLiBTcGVjaWZpY2FsbHksIHlvdSBjYW4gc2VsZWN0IHJ1biBjcmVhdGlvbiBzdHJhdGVnaWVzIChydWxlcykgZm9yIHdoaWNoIHJ1bnMgZW5kIHVzZXJzIG9mIHlvdXIgcHJvamVjdCB3b3JrIHdpdGggd2hlbiB0aGV5IGxvZyBpbiB0byB5b3VyIHByb2plY3QuXG4qXG4qIFVuZGVybHlpbmcgRXBpY2VudGVyIEFQSXMgLS0gaW5jbHVkaW5nIHRoZSBbTW9kZWwgUnVuIEFQSV0oLi4vLi4vLi4vbW9kZWxfYXBpcy9ydW4vKSwgdGhlIFtSdW4gQVBJXSguLi8uLi8uLi9hZ2dyZWdhdGVfcnVuX2FwaSksIGFuZCBFcGljZW50ZXIuanMncyBvd24gW0Yuc2VydmljZS5SdW4uY3JlYXRlKCldKC4uL3J1bi1hcGktc2VydmljZS8pIC0tIGFsbCBhbGxvdyB5b3UgdG8gY3JlYXRlIG5ldyBydW5zLiBIb3dldmVyLCBmb3Igc29tZSBwcm9qZWN0cyBpdCBtYWtlcyBtb3JlIHNlbnNlIHRvIHBpY2sgdXAgd2hlcmUgdGhlIHVzZXIgbGVmdCBvZmYsIHVzaW5nIGFuIGV4aXN0aW5nIHJ1bi4gQW5kIGluIHNvbWUgcHJvamVjdHMsIHdoZXRoZXIgdG8gY3JlYXRlIGEgbmV3IG9uZSBvciB1c2UgYW4gZXhpc3Rpbmcgb25lIGlzIGNvbmRpdGlvbmFsLCBmb3IgZXhhbXBsZSBiYXNlZCBvbiBjaGFyYWN0ZXJpc3RpY3Mgb2YgdGhlIGV4aXN0aW5nIHJ1biBvciB5b3VyIG93biBrbm93bGVkZ2UgYWJvdXQgdGhlIG1vZGVsLiBUaGUgUnVuIE1hbmFnZXIgcHJvdmlkZXMgdGhpcyBsZXZlbCBvZiBjb250cm9sLlxuKlxuKiAjIyMgVXNpbmcgdGhlIFJ1biBNYW5hZ2VyIHRvIGNyZWF0ZSBhbmQgYWNjZXNzIHJ1bnNcbipcbiogVG8gdXNlIHRoZSBSdW4gTWFuYWdlciwgaW5zdGFudGlhdGUgaXQgYnkgcGFzc2luZyBpbjpcbipcbiogICAqIGBydW5gOiAocmVxdWlyZWQpIFJ1biBvYmplY3QuIE11c3QgY29udGFpbjpcbiogICAgICAgKiBgYWNjb3VudGA6IEVwaWNlbnRlciBhY2NvdW50IGlkICgqKlRlYW0gSUQqKiBmb3IgdGVhbSBwcm9qZWN0cywgKipVc2VyIElEKiogZm9yIHBlcnNvbmFsIHByb2plY3RzKS5cbiogICAgICAgKiBgcHJvamVjdGA6IEVwaWNlbnRlciBwcm9qZWN0IGlkLlxuKiAgICAgICAqIGBtb2RlbGA6IFRoZSBuYW1lIG9mIHlvdXIgcHJpbWFyeSBtb2RlbCBmaWxlLiAoU2VlIG1vcmUgb24gW1dyaXRpbmcgeW91ciBNb2RlbF0oLi4vLi4vLi4vd3JpdGluZ195b3VyX21vZGVsLykuKVxuKiAgICAgICAqIGBzY29wZWA6IChvcHRpb25hbCkgU2NvcGUgb2JqZWN0IGZvciB0aGUgcnVuLCBmb3IgZXhhbXBsZSBgc2NvcGUuZ3JvdXBgIHdpdGggdmFsdWUgb2YgdGhlIG5hbWUgb2YgdGhlIGdyb3VwLlxuKiAgICAgICAqIGBmaWxlc2A6IChvcHRpb25hbCkgSWYgYW5kIG9ubHkgaWYgeW91IGFyZSB1c2luZyBhIFZlbnNpbSBtb2RlbCBhbmQgeW91IGhhdmUgYWRkaXRpb25hbCBkYXRhIHRvIHBhc3MgaW4gdG8geW91ciBtb2RlbCwgeW91IGNhbiBwYXNzIGEgYGZpbGVzYCBvYmplY3Qgd2l0aCB0aGUgbmFtZXMgb2YgdGhlIGZpbGVzLCBmb3IgZXhhbXBsZTogYFwiZmlsZXNcIjoge1wiZGF0YVwiOiBcIm15RXh0cmFEYXRhLnhsc1wifWAuIChOb3RlIHRoYXQgeW91J2xsIGFsc28gbmVlZCB0byBhZGQgdGhpcyBzYW1lIGZpbGVzIG9iamVjdCB0byB5b3VyIFZlbnNpbSBbY29uZmlndXJhdGlvbiBmaWxlXSguLi8uLi8uLi9tb2RlbF9jb2RlL3ZlbnNpbS8pLikgU2VlIHRoZSBbdW5kZXJseWluZyBNb2RlbCBSdW4gQVBJXSguLi8uLi8uLi9tb2RlbF9hcGlzL3J1bi8jcG9zdC1jcmVhdGluZy1hLW5ldy1ydW4tZm9yLXRoaXMtcHJvamVjdCkgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24uXG4qXG4qICAgKiBgc3RyYXRlZ3lgOiAob3B0aW9uYWwpIFJ1biBjcmVhdGlvbiBzdHJhdGVneSBmb3Igd2hlbiB0byBjcmVhdGUgYSBuZXcgcnVuIGFuZCB3aGVuIHRvIHJldXNlIGFuIGVuZCB1c2VyJ3MgZXhpc3RpbmcgcnVuLiBTZWUgW1J1biBNYW5hZ2VyIFN0cmF0ZWdpZXNdKC4uLy4uL3N0cmF0ZWd5LykgZm9yIGRldGFpbHMuIERlZmF1bHRzIHRvIGBuZXctaWYtaW5pdGlhbGl6ZWRgLlxuKlxuKiAgICogYHNlc3Npb25LZXlgOiAob3B0aW9uYWwpIE5hbWUgb2YgYnJvd3NlciBjb29raWUgaW4gd2hpY2ggdG8gc3RvcmUgcnVuIGluZm9ybWF0aW9uLCBpbmNsdWRpbmcgcnVuIGlkLiBNYW55IGNvbmRpdGlvbmFsIHN0cmF0ZWdpZXMsIGluY2x1ZGluZyB0aGUgcHJvdmlkZWQgc3RyYXRlZ2llcywgcmVseSBvbiB0aGlzIGJyb3dzZXIgY29va2llIHRvIHN0b3JlIHRoZSBydW4gaWQgYW5kIGhlbHAgbWFrZSB0aGUgZGVjaXNpb24gb2Ygd2hldGhlciB0byBjcmVhdGUgYSBuZXcgcnVuIG9yIHVzZSBhbiBleGlzdGluZyBvbmUuIFRoZSBuYW1lIG9mIHRoaXMgY29va2llIGRlZmF1bHRzIHRvIGBlcGljZW50ZXItc2NlbmFyaW9gIGFuZCBjYW4gYmUgc2V0IHdpdGggdGhlIGBzZXNzaW9uS2V5YCBwYXJhbWV0ZXIuXG4qXG4qXG4qIEFmdGVyIGluc3RhbnRpYXRpbmcgYSBSdW4gTWFuYWdlciwgbWFrZSBhIGNhbGwgdG8gYGdldFJ1bigpYCB3aGVuZXZlciB5b3UgbmVlZCB0byBhY2Nlc3MgYSBydW4gZm9yIHRoaXMgZW5kIHVzZXIuIFRoZSBgUnVuTWFuYWdlci5ydW5gIGNvbnRhaW5zIHRoZSBpbnN0YW50aWF0ZWQgW1J1biBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKS5cbipcbiogKipFeGFtcGxlKipcbipcbiogICAgICAgdmFyIHJtID0gbmV3IEYubWFuYWdlci5SdW5NYW5hZ2VyKHtcbiogICAgICAgICAgIHJ1bjoge1xuKiAgICAgICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiogICAgICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuKiAgICAgICAgICAgICAgIG1vZGVsOiAnc3VwcGx5LWNoYWluLW1vZGVsLmpsJyxcbiogICAgICAgICAgICAgICBzZXJ2ZXI6IHsgaG9zdDogJ2FwaS5mb3Jpby5jb20nIH1cbiogICAgICAgICAgIH0sXG4qICAgICAgICAgICBzdHJhdGVneTogJ2Fsd2F5cy1uZXcnLFxuKiAgICAgICAgICAgc2Vzc2lvbktleTogJ2VwaWNlbnRlci1zZXNzaW9uJ1xuKiAgICAgICB9KTtcbiogICAgICAgcm0uZ2V0UnVuKClcbiogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJ1bikge1xuKiAgICAgICAgICAgICAgIC8vIHRoZSByZXR1cm4gdmFsdWUgb2YgZ2V0UnVuKCkgaXMgYW4gaW5zdGFuY2Ugb2YgUnVuIFNlcnZpY2VcbiogICAgICAgICAgICAgICB2YXIgdGhpc1J1bklkID0gcnVuLmlkO1xuKiAgICAgICAgICAgICAgIC8vIHRoZSBSdW5NYW5hZ2VyLnJ1biBhbHNvIGNvbnRhaW5zIHRoZSBpbnN0YW50aWF0ZWQgUnVuIFNlcnZpY2UsXG4qICAgICAgICAgICAgICAgLy8gc28gYW55IFJ1biBTZXJ2aWNlIG1ldGhvZCBpcyB2YWxpZCBoZXJlXG4qICAgICAgICAgICAgICAgcm0ucnVuLmRvKCdydW5Nb2RlbCcpO1xuKiAgICAgICB9KVxuKlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xudmFyIHN0cmF0ZWdpZXNNYXAgPSByZXF1aXJlKCcuL3J1bi1zdHJhdGVnaWVzL3N0cmF0ZWdpZXMtbWFwJyk7XG52YXIgc3BlY2lhbE9wZXJhdGlvbnMgPSByZXF1aXJlKCcuL3NwZWNpYWwtb3BlcmF0aW9ucycpO1xudmFyIFJ1blNlcnZpY2UgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL3J1bi1hcGktc2VydmljZScpO1xuXG5cbmZ1bmN0aW9uIHBhdGNoUnVuU2VydmljZShzZXJ2aWNlLCBtYW5hZ2VyKSB7XG4gICAgaWYgKHNlcnZpY2UucGF0Y2hlZCkge1xuICAgICAgICByZXR1cm4gc2VydmljZTtcbiAgICB9XG5cbiAgICB2YXIgb3JpZyA9IHNlcnZpY2UuZG87XG4gICAgc2VydmljZS5kbyA9IGZ1bmN0aW9uIChvcGVyYXRpb24sIHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICB2YXIgcmVzZXJ2ZWRPcHMgPSBPYmplY3Qua2V5cyhzcGVjaWFsT3BlcmF0aW9ucyk7XG4gICAgICAgIGlmIChyZXNlcnZlZE9wcy5pbmRleE9mKG9wZXJhdGlvbikgPT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gb3JpZy5hcHBseShzZXJ2aWNlLCBhcmd1bWVudHMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHNwZWNpYWxPcGVyYXRpb25zW29wZXJhdGlvbl0uY2FsbChzZXJ2aWNlLCBwYXJhbXMsIG9wdGlvbnMsIG1hbmFnZXIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlcnZpY2UucGF0Y2hlZCA9IHRydWU7XG5cbiAgICByZXR1cm4gc2VydmljZTtcbn1cblxuXG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICAvKipcbiAgICAgKiBSdW4gY3JlYXRpb24gc3RyYXRlZ3kgZm9yIHdoZW4gdG8gY3JlYXRlIGEgbmV3IHJ1biBhbmQgd2hlbiB0byByZXVzZSBhbiBlbmQgdXNlcidzIGV4aXN0aW5nIHJ1bi4gU2VlIFtSdW4gTWFuYWdlciBTdHJhdGVnaWVzXSguLi8uLi9zdHJhdGVneS8pIGZvciBkZXRhaWxzLiBEZWZhdWx0cyB0byBgbmV3LWlmLWluaXRpYWxpemVkYC5cbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAqL1xuXG4gICAgc3RyYXRlZ3k6ICduZXctaWYtaW5pdGlhbGl6ZWQnXG59O1xuXG5mdW5jdGlvbiBSdW5NYW5hZ2VyKG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5ydW4gaW5zdGFuY2VvZiBSdW5TZXJ2aWNlKSB7XG4gICAgICAgIHRoaXMucnVuID0gdGhpcy5vcHRpb25zLnJ1bjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJ1biA9IG5ldyBSdW5TZXJ2aWNlKHRoaXMub3B0aW9ucy5ydW4pO1xuICAgIH1cblxuICAgIHBhdGNoUnVuU2VydmljZSh0aGlzLnJ1biwgdGhpcyk7XG5cbiAgICB2YXIgU3RyYXRlZ3lDdG9yID0gdHlwZW9mIHRoaXMub3B0aW9ucy5zdHJhdGVneSA9PT0gJ2Z1bmN0aW9uJyA/IHRoaXMub3B0aW9ucy5zdHJhdGVneSA6IHN0cmF0ZWdpZXNNYXBbdGhpcy5vcHRpb25zLnN0cmF0ZWd5XTtcblxuICAgIGlmICghU3RyYXRlZ3lDdG9yKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU3BlY2lmaWVkIHJ1biBjcmVhdGlvbiBzdHJhdGVneSB3YXMgaW52YWxpZDonLCB0aGlzLm9wdGlvbnMuc3RyYXRlZ3kpO1xuICAgIH1cblxuICAgIHRoaXMuc3RyYXRlZ3kgPSBuZXcgU3RyYXRlZ3lDdG9yKHRoaXMucnVuLCB0aGlzLm9wdGlvbnMpO1xufVxuXG5SdW5NYW5hZ2VyLnByb3RvdHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBydW4gb2JqZWN0IGZvciBhICdnb29kJyBydW4uXG4gICAgICpcbiAgICAgKiBBIGdvb2QgcnVuIGlzIGRlZmluZWQgYnkgdGhlIHN0cmF0ZWd5LiBGb3IgZXhhbXBsZSwgaWYgdGhlIHN0cmF0ZWd5IGlzIGBhbHdheXMtbmV3YCwgdGhlIGNhbGxcbiAgICAgKiB0byBgZ2V0UnVuKClgIGFsd2F5cyByZXR1cm5zIGEgbmV3bHkgY3JlYXRlZCBydW47IGlmIHRoZSBzdHJhdGVneSBpcyBgbmV3LWlmLXBlcnNpc3RlZGAsXG4gICAgICogYGdldFJ1bigpYCBjcmVhdGVzIGEgbmV3IHJ1biBpZiB0aGUgcHJldmlvdXMgcnVuIGlzIGluIGEgcGVyc2lzdGVkIHN0YXRlLCBvdGhlcndpc2VcbiAgICAgKiBpdCByZXR1cm5zIHRoZSBwcmV2aW91cyBydW4uIFNlZSBbUnVuIE1hbmFnZXIgU3RyYXRlZ2llc10oLi4vLi4vc3RyYXRlZ3kvKSBmb3IgbW9yZSBvbiBzdHJhdGVnaWVzLlxuICAgICAqXG4gICAgICogICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIHJtLmdldFJ1bigpLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAqICAgICAgICAgIC8vIHVzZSB0aGUgcnVuIG9iamVjdFxuICAgICAqICAgICAgICAgIHZhciB0aGlzUnVuSWQgPSBydW4uaWQ7XG4gICAgICpcbiAgICAgKiAgICAgICAgICAvLyB1c2UgdGhlIFJ1biBTZXJ2aWNlIG9iamVjdFxuICAgICAqICAgICAgICAgIHJ1bi5kbygncnVuTW9kZWwnKTtcbiAgICAgKiAgICAgIH0pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0ge05vbmV9IE5vbmVcbiAgICAgKi9cbiAgICBnZXRSdW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RyYXRlZ3lcbiAgICAgICAgICAgICAgICAuZ2V0UnVuKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHJ1biBvYmplY3QgZm9yIGEgbmV3IHJ1biwgcmVnYXJkbGVzcyBvZiBzdHJhdGVneTogZm9yY2UgY3JlYXRpb24gb2YgYSBuZXcgcnVuLlxuICAgICAqXG4gICAgICogICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIHJtLnJlc2V0KCkudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICogICAgICAgICAgLy8gdXNlIHRoZSAobmV3KSBydW4gb2JqZWN0XG4gICAgICogICAgICAgICAgdmFyIHRoaXNSdW5JZCA9IHJ1bi5pZDtcbiAgICAgKiAgICAgICAgICAvLyB1c2UgdGhlIFJ1biBTZXJ2aWNlIG9iamVjdFxuICAgICAqICAgICAgICAgIHJ1bi5kbygncnVuTW9kZWwnKTtcbiAgICAgKiAgICAgIH0pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gYHJ1blNlcnZpY2VPcHRpb25zYCBUaGUgb3B0aW9ucyBvYmplY3QgdG8gY29uZmlndXJlIHRoZSBSdW4gU2VydmljZS4gU2VlIFtSdW4gQVBJIFNlcnZpY2VdKC4uL3J1bi1hcGktc2VydmljZS8pIGZvciBtb3JlLlxuICAgICAqL1xuICAgIHJlc2V0OiBmdW5jdGlvbiAocnVuU2VydmljZU9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RyYXRlZ3kucmVzZXQocnVuU2VydmljZU9wdGlvbnMpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUnVuTWFuYWdlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIENvbmRpdGlvbmFsU3RyYXRlZ3kgPSByZXF1aXJlKCcuL2NvbmRpdGlvbmFsLWNyZWF0aW9uLXN0cmF0ZWd5Jyk7XG5cbnZhciBfX3N1cGVyID0gQ29uZGl0aW9uYWxTdHJhdGVneS5wcm90b3R5cGU7XG5cbnZhciBTdHJhdGVneSA9IGNsYXNzRnJvbShDb25kaXRpb25hbFN0cmF0ZWd5LCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChydW5TZXJ2aWNlLCBvcHRpb25zKSB7XG4gICAgICAgIF9fc3VwZXIuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBydW5TZXJ2aWNlLCB0aGlzLmNyZWF0ZUlmLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgY3JlYXRlSWY6IGZ1bmN0aW9uIChydW4sIGhlYWRlcnMpIHtcbiAgICAgICAgLy8gYWx3YXlzIGNyZWF0ZSBhIG5ldyBydW4hXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmF0ZWd5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgbWFrZVNlcSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvbWFrZS1zZXF1ZW5jZScpO1xudmFyIEJhc2UgPSByZXF1aXJlKCcuL2lkZW50aXR5LXN0cmF0ZWd5Jyk7XG52YXIgU2Vzc2lvblN0b3JlID0gcmVxdWlyZSgnLi4vLi4vc3RvcmUvc3RvcmUtZmFjdG9yeScpO1xudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIFVybFNlcnZpY2UgPSByZXF1aXJlKCcuLi8uLi9zZXJ2aWNlL3VybC1jb25maWctc2VydmljZScpO1xuXG52YXIgc2Vzc2lvblN0b3JlID0gbmV3IFNlc3Npb25TdG9yZSh7fSk7XG52YXIgdXJsU2VydmljZSA9IG5ldyBVcmxTZXJ2aWNlKCk7XG52YXIga2V5TmFtZXMgPSByZXF1aXJlKCcuLi9rZXktbmFtZXMnKTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHNlc3Npb25LZXk6IGtleU5hbWVzLlNUUkFURUdZX1NFU1NJT05fS0VZXG59O1xuXG5mdW5jdGlvbiBzZXRSdW5JblNlc3Npb24oc2Vzc2lvbktleSwgcnVuKSB7XG4gICAgdmFyIHBhdGggPSAnLycgKyBbdXJsU2VydmljZS5hcHBQYXRoLCB1cmxTZXJ2aWNlLmFjY291bnRQYXRoLCB1cmxTZXJ2aWNlLnByb2plY3RQYXRoXS5qb2luKCcvJyk7XG5cbiAgICAvLyBtYWtlIHN1cmUgd2UgZG9uJ3QgZ2V0IGNvbnNlY3V0ZWl2ZSAnLycgc28gd2UgaGF2ZSBhIHZhbGlkIHBhdGggZm9yIHRoZSBzZXNzaW9uXG4gICAgcGF0aCA9IHBhdGgucmVwbGFjZSgvXFwvezIsfS9nLCcvJyk7XG5cbiAgICAvLyBzZXQgdGhlIHNlZXNpb25LZXkgZm9yIHRoZSBydW5cbiAgICBzZXNzaW9uU3RvcmUuc2V0KHNlc3Npb25LZXksIEpTT04uc3RyaW5naWZ5KHsgcnVuSWQ6IHJ1bi5pZCB9KSwgeyByb290OiBwYXRoIH0pO1xufVxuXG4vKipcbiogQ29uZGl0aW9uYWwgQ3JlYXRpb24gU3RyYXRlZ3lcbiogVGhpcyBzdHJhdGVneSB3aWxsIHRyeSB0byBnZXQgdGhlIHJ1biBzdG9yZWQgaW4gdGhlIGNvb2tpZSBhbmRcbiogZXZhbHVhdGUgaWYgbmVlZHMgdG8gY3JlYXRlIGEgbmV3IHJ1biBieSBjYWxsaW5nIHRoZSAnY29uZGl0aW9uJyBmdW5jdGlvblxuKi9cblxuLyoganNoaW50IGVxbnVsbDogdHJ1ZSAqL1xudmFyIFN0cmF0ZWd5ID0gY2xhc3NGcm9tKEJhc2UsIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gU3RyYXRlZ3kocnVuU2VydmljZSwgY29uZGl0aW9uLCBvcHRpb25zKSB7XG5cbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbmRpdGlvbmFsIHN0cmF0ZWd5IG5lZWRzIGEgY29uZGl0aW9uIHRvIGNyZWF0ZXRlIGEgcnVuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJ1biA9IG1ha2VTZXEocnVuU2VydmljZSk7XG4gICAgICAgIHRoaXMuY29uZGl0aW9uID0gdHlwZW9mIGNvbmRpdGlvbiAhPT0gJ2Z1bmN0aW9uJyA/IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGNvbmRpdGlvbjsgfSA6IGNvbmRpdGlvbjtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5ydW5PcHRpb25zID0gdGhpcy5vcHRpb25zLnJ1bjtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uIChydW5TZXJ2aWNlT3B0aW9ucykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnJ1blxuICAgICAgICAgICAgICAgIC5jcmVhdGUodGhpcy5ydW5PcHRpb25zLCBydW5TZXJ2aWNlT3B0aW9ucylcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgICAgICAgICBzZXRSdW5JblNlc3Npb24oX3RoaXMub3B0aW9ucy5zZXNzaW9uS2V5LCBydW4pO1xuICAgICAgICAgICAgICAgIHJ1bi5mcmVzaGx5Q3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3RhcnQoKTtcbiAgICB9LFxuXG4gICAgZ2V0UnVuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzZXNzaW9uID0gSlNPTi5wYXJzZShzZXNzaW9uU3RvcmUuZ2V0KHRoaXMub3B0aW9ucy5zZXNzaW9uS2V5KSk7XG5cbiAgICAgICAgaWYgKHNlc3Npb24gJiYgc2Vzc2lvbi5ydW5JZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRBbmRDaGVjayhzZXNzaW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc2V0KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2xvYWRBbmRDaGVjazogZnVuY3Rpb24gKHNlc3Npb24pIHtcbiAgICAgICAgdmFyIHNob3VsZENyZWF0ZSA9IGZhbHNlO1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnJ1blxuICAgICAgICAgICAgLmxvYWQoc2Vzc2lvbi5ydW5JZCwgbnVsbCwge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChydW4sIG1zZywgaGVhZGVycykge1xuICAgICAgICAgICAgICAgICAgICBzaG91bGRDcmVhdGUgPSBfdGhpcy5jb25kaXRpb24uY2FsbChfdGhpcywgcnVuLCBoZWFkZXJzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgICAgIGlmIChzaG91bGRDcmVhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gd2UgbmVlZCB0byBkbyB0aGlzLCBvbiB0aGUgb3JpZ2luYWwgcnVuU2VydmljZSAoaWUgbm90IHNlcXVlbmNpYWxpemVkKVxuICAgICAgICAgICAgICAgICAgICAvLyBzbyB3ZSBkb24ndCBnZXQgaW4gdGhlIG1pZGRsZSBvZiB0aGUgcXVldWVcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLnJ1bi5vcmlnaW5hbC5jcmVhdGUoX3RoaXMucnVuT3B0aW9ucylcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0UnVuSW5TZXNzaW9uKF90aGlzLm9wdGlvbnMuc2Vzc2lvbktleSwgcnVuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bi5mcmVzaGx5Q3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGFydCgpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmF0ZWd5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgQmFzZSA9IHt9O1xuXG4vLyBJbnRlcmZhY2UgdGhhdCBhbGwgc3RyYXRlZ2llcyBuZWVkIHRvIGltcGxlbWVudFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzc0Zyb20oQmFzZSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAocnVuU2VydmljZSwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLnJ1blNlcnZpY2UgID0gcnVuU2VydmljZTtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gcmV0dXJuIGEgbmV3bHkgY3JlYXRlZCBydW5cbiAgICAgICAgcmV0dXJuICQuRGVmZXJyZWQoKS5yZXNvbHZlKCkucHJvbWlzZSgpO1xuICAgIH0sXG5cbiAgICBnZXRSdW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gcmV0dXJuIGEgdXNhYmxlIHJ1blxuICAgICAgICByZXR1cm4gJC5EZWZlcnJlZCgpLnJlc29sdmUodGhpcy5ydW5TZXJ2aWNlKS5wcm9taXNlKCk7XG4gICAgfVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcblxudmFyIElkZW50aXR5U3RyYXRlZ3kgPSByZXF1aXJlKCcuL2lkZW50aXR5LXN0cmF0ZWd5Jyk7XG52YXIgV29ybGRBcGlBZGFwdGVyID0gcmVxdWlyZSgnLi4vLi4vc2VydmljZS93b3JsZC1hcGktYWRhcHRlcicpO1xudmFyIEF1dGhNYW5hZ2VyID0gcmVxdWlyZSgnLi4vYXV0aC1tYW5hZ2VyJyk7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICBzdG9yZToge1xuICAgICAgICBzeW5jaHJvbm91czogdHJ1ZVxuICAgIH1cbn07XG5cbnZhciBTdHJhdGVneSA9IGNsYXNzRnJvbShJZGVudGl0eVN0cmF0ZWd5LCB7XG5cbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5ydW5TZXJ2aWNlID0gcnVuU2VydmljZTtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fYXV0aCA9IG5ldyBBdXRoTWFuYWdlcigpO1xuICAgICAgICB0aGlzLl9sb2FkUnVuID0gdGhpcy5fbG9hZFJ1bi5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLndvcmxkQXBpID0gbmV3IFdvcmxkQXBpQWRhcHRlcih0aGlzLm9wdGlvbnMucnVuKTtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLl9hdXRoLmdldEN1cnJlbnRVc2VyU2Vzc2lvbkluZm8oKTtcbiAgICAgICAgdmFyIGN1clVzZXJJZCA9IHNlc3Npb24udXNlcklkO1xuICAgICAgICB2YXIgY3VyR3JvdXBOYW1lID0gc2Vzc2lvbi5ncm91cE5hbWU7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMud29ybGRBcGlcbiAgICAgICAgICAgIC5nZXRDdXJyZW50V29ybGRGb3JVc2VyKGN1clVzZXJJZCwgY3VyR3JvdXBOYW1lKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHdvcmxkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMud29ybGRBcGkubmV3UnVuRm9yV29ybGQod29ybGQuaWQpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgZ2V0UnVuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5fYXV0aC5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICAgIHZhciBjdXJVc2VySWQgPSBzZXNzaW9uLnVzZXJJZDtcbiAgICAgICAgdmFyIGN1ckdyb3VwTmFtZSA9IHNlc3Npb24uZ3JvdXBOYW1lO1xuICAgICAgICB2YXIgd29ybGRBcGkgPSB0aGlzLndvcmxkQXBpO1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgZHRkID0gJC5EZWZlcnJlZCgpO1xuXG4gICAgICAgIGlmICghY3VyVXNlcklkKSB7XG4gICAgICAgICAgICByZXR1cm4gZHRkLnJlamVjdCh7IHN0YXR1c0NvZGU6IDQwMCwgZXJyb3I6ICdXZSBuZWVkIGFuIGF1dGhlbnRpY2F0ZWQgdXNlciB0byBqb2luIGEgbXVsdGlwbGF5ZXIgd29ybGQuIChFUlI6IG5vIHVzZXJJZCBpbiBzZXNzaW9uKScgfSwgc2Vzc2lvbikucHJvbWlzZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxvYWRSdW5Gcm9tV29ybGQgPSBmdW5jdGlvbiAod29ybGQpIHtcbiAgICAgICAgICAgIGlmICghd29ybGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZHRkLnJlamVjdCh7IHN0YXR1c0NvZGU6IDQwNCwgZXJyb3I6ICdUaGUgdXNlciBpcyBub3QgaW4gYW55IHdvcmxkLicgfSwgeyBvcHRpb25zOiB0aGlzLm9wdGlvbnMsIHNlc3Npb246IHNlc3Npb24gfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB3b3JsZEFwaS5nZXRDdXJyZW50UnVuSWQoeyBmaWx0ZXI6IHdvcmxkLmlkIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4oX3RoaXMuX2xvYWRSdW4pXG4gICAgICAgICAgICAgICAgLnRoZW4oZHRkLnJlc29sdmUpXG4gICAgICAgICAgICAgICAgLmZhaWwoZHRkLnJlamVjdCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHNlcnZlckVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBpcyB0aGlzIHBvc3NpYmxlP1xuICAgICAgICAgICAgZHRkLnJlamVjdChlcnJvciwgc2Vzc2lvbiwgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLndvcmxkQXBpXG4gICAgICAgICAgICAuZ2V0Q3VycmVudFdvcmxkRm9yVXNlcihjdXJVc2VySWQsIGN1ckdyb3VwTmFtZSlcbiAgICAgICAgICAgIC50aGVuKGxvYWRSdW5Gcm9tV29ybGQpXG4gICAgICAgICAgICAuZmFpbChzZXJ2ZXJFcnJvcik7XG5cbiAgICAgICAgcmV0dXJuIGR0ZC5wcm9taXNlKCk7XG4gICAgfSxcblxuICAgIF9sb2FkUnVuOiBmdW5jdGlvbiAoaWQsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuU2VydmljZS5sb2FkKGlkLCBudWxsLCBvcHRpb25zKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJhdGVneTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBDb25kaXRpb25hbFN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9jb25kaXRpb25hbC1jcmVhdGlvbi1zdHJhdGVneScpO1xuXG52YXIgX19zdXBlciA9IENvbmRpdGlvbmFsU3RyYXRlZ3kucHJvdG90eXBlO1xuXG52YXIgU3RyYXRlZ3kgPSBjbGFzc0Zyb20oQ29uZGl0aW9uYWxTdHJhdGVneSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAocnVuU2VydmljZSwgb3B0aW9ucykge1xuICAgICAgICBfX3N1cGVyLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgcnVuU2VydmljZSwgdGhpcy5jcmVhdGVJZiwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIGNyZWF0ZUlmOiBmdW5jdGlvbiAocnVuLCBoZWFkZXJzKSB7XG4gICAgICAgIHJldHVybiBoZWFkZXJzLmdldFJlc3BvbnNlSGVhZGVyKCdwcmFnbWEnKSA9PT0gJ3BlcnNpc3RlbnQnIHx8IHJ1bi5pbml0aWFsaXplZDtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJhdGVneTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIENvbmRpdGlvbmFsU3RyYXRlZ3kgPSByZXF1aXJlKCcuL2NvbmRpdGlvbmFsLWNyZWF0aW9uLXN0cmF0ZWd5Jyk7XG5cbnZhciBfX3N1cGVyID0gQ29uZGl0aW9uYWxTdHJhdGVneS5wcm90b3R5cGU7XG5cbi8qXG4qICBjcmVhdGUgYSBuZXcgcnVuIG9ubHkgaWYgbm90aGluZyBpcyBzdG9yZWQgaW4gdGhlIGNvb2tpZVxuKiAgdGhpcyBpcyB1c2VmdWwgZm9yIGJhc2VSdW5zLlxuKi9cbnZhciBTdHJhdGVneSA9IGNsYXNzRnJvbShDb25kaXRpb25hbFN0cmF0ZWd5LCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChydW5TZXJ2aWNlLCBvcHRpb25zKSB7XG4gICAgICAgIF9fc3VwZXIuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBydW5TZXJ2aWNlLCB0aGlzLmNyZWF0ZUlmLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgY3JlYXRlSWY6IGZ1bmN0aW9uIChydW4sIGhlYWRlcnMpIHtcbiAgICAgICAgLy8gaWYgd2UgYXJlIGhlcmUsIGl0IG1lYW5zIHRoYXQgdGhlIHJ1biBleGlzdHMuLi4gc28gd2UgZG9uJ3QgbmVlZCBhIG5ldyBvbmVcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmF0ZWd5O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIENvbmRpdGlvbmFsU3RyYXRlZ3kgPSByZXF1aXJlKCcuL2NvbmRpdGlvbmFsLWNyZWF0aW9uLXN0cmF0ZWd5Jyk7XG5cbnZhciBfX3N1cGVyID0gQ29uZGl0aW9uYWxTdHJhdGVneS5wcm90b3R5cGU7XG5cbnZhciBTdHJhdGVneSA9IGNsYXNzRnJvbShDb25kaXRpb25hbFN0cmF0ZWd5LCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChydW5TZXJ2aWNlLCBvcHRpb25zKSB7XG4gICAgICAgIF9fc3VwZXIuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBydW5TZXJ2aWNlLCB0aGlzLmNyZWF0ZUlmLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgY3JlYXRlSWY6IGZ1bmN0aW9uIChydW4sIGhlYWRlcnMpIHtcbiAgICAgICAgcmV0dXJuIGhlYWRlcnMuZ2V0UmVzcG9uc2VIZWFkZXIoJ3ByYWdtYScpID09PSAncGVyc2lzdGVudCc7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RyYXRlZ3k7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBJZGVudGl0eVN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9pZGVudGl0eS1zdHJhdGVneScpO1xudmFyIFN0b3JhZ2VGYWN0b3J5ID0gcmVxdWlyZSgnLi4vLi4vc3RvcmUvc3RvcmUtZmFjdG9yeScpO1xudmFyIFN0YXRlQXBpID0gcmVxdWlyZSgnLi4vLi4vc2VydmljZS9zdGF0ZS1hcGktYWRhcHRlcicpO1xuXG52YXIga2V5TmFtZXMgPSByZXF1aXJlKCcuLi9rZXktbmFtZXMnKTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHN0b3JlOiB7XG4gICAgICAgIHN5bmNocm9ub3VzOiB0cnVlXG4gICAgfVxufTtcblxudmFyIFN0cmF0ZWd5ID0gY2xhc3NGcm9tKElkZW50aXR5U3RyYXRlZ3ksIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gU3RyYXRlZ3kocnVuU2VydmljZSwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLnJ1biA9IHJ1blNlcnZpY2U7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMucnVuT3B0aW9ucyA9IHRoaXMub3B0aW9ucy5ydW47XG4gICAgICAgIHRoaXMuX3N0b3JlID0gbmV3IFN0b3JhZ2VGYWN0b3J5KHRoaXMub3B0aW9ucy5zdG9yZSk7XG4gICAgICAgIHRoaXMuc3RhdGVBcGkgPSBuZXcgU3RhdGVBcGkoKTtcblxuICAgICAgICB0aGlzLl9sb2FkQW5kQ2hlY2sgPSB0aGlzLl9sb2FkQW5kQ2hlY2suYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fcmVzdG9yZVJ1biA9IHRoaXMuX3Jlc3RvcmVSdW4uYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fZ2V0QWxsUnVucyA9IHRoaXMuX2dldEFsbFJ1bnMuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fbG9hZFJ1biA9IHRoaXMuX2xvYWRSdW4uYmluZCh0aGlzKTtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uIChydW5TZXJ2aWNlT3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW5cbiAgICAgICAgICAgIC5jcmVhdGUodGhpcy5ydW5PcHRpb25zLCBydW5TZXJ2aWNlT3B0aW9ucylcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgICAgICAgICBydW4uZnJlc2hseUNyZWF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBydW47XG4gICAgICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZ2V0UnVuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRBbGxSdW5zKClcbiAgICAgICAgICAgIC50aGVuKHRoaXMuX2xvYWRBbmRDaGVjayk7XG4gICAgfSxcblxuICAgIF9nZXRBbGxSdW5zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzZXNzaW9uID0gSlNPTi5wYXJzZSh0aGlzLl9zdG9yZS5nZXQoa2V5TmFtZXMuRVBJX1NFU1NJT05fS0VZKSB8fCAne30nKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuLnF1ZXJ5KHtcbiAgICAgICAgICAgICd1c2VyLmlkJzogc2Vzc2lvbi51c2VySWQgfHwgJzAwMDAnLFxuICAgICAgICAgICAgJ3Njb3BlLmdyb3VwJzogc2Vzc2lvbi5ncm91cE5hbWVcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9sb2FkQW5kQ2hlY2s6IGZ1bmN0aW9uIChydW5zKSB7XG4gICAgICAgIGlmICghcnVucyB8fCAhcnVucy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc2V0KCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZGF0ZUNvbXAgPSBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gbmV3IERhdGUoYi5kYXRlKSAtIG5ldyBEYXRlKGEuZGF0ZSk7IH07XG4gICAgICAgIHZhciBsYXRlc3RSdW4gPSBydW5zLnNvcnQoZGF0ZUNvbXApWzBdO1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgc2hvdWxkUmVwbGF5ID0gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMucnVuLmxvYWQobGF0ZXN0UnVuLmlkLCBudWxsLCB7XG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocnVuLCBtc2csIGhlYWRlcnMpIHtcbiAgICAgICAgICAgICAgICBzaG91bGRSZXBsYXkgPSBoZWFkZXJzLmdldFJlc3BvbnNlSGVhZGVyKCdwcmFnbWEnKSA9PT0gJ3BlcnNpc3RlbnQnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgICAgIHJldHVybiBzaG91bGRSZXBsYXkgPyBfdGhpcy5fcmVzdG9yZVJ1bihydW4uaWQpIDogcnVuO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX3Jlc3RvcmVSdW46IGZ1bmN0aW9uIChydW5JZCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZUFwaS5yZXBsYXkoeyBydW5JZDogcnVuSWQgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLl9sb2FkUnVuKHJlc3AucnVuKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfbG9hZFJ1bjogZnVuY3Rpb24gKGlkLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1bi5sb2FkKGlkLCBudWxsLCBvcHRpb25zKTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmF0ZWd5O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgJ25ldy1pZi1pbml0aWFsaXplZCc6IHJlcXVpcmUoJy4vbmV3LWlmLWluaXRpYWxpemVkLXN0cmF0ZWd5JyksXG4gICAgJ25ldy1pZi1wZXJzaXN0ZWQnOiByZXF1aXJlKCcuL25ldy1pZi1wZXJzaXN0ZWQtc3RyYXRlZ3knKSxcbiAgICAnbmV3LWlmLW1pc3NpbmcnOiByZXF1aXJlKCcuL25ldy1pZi1taXNzaW5nLXN0cmF0ZWd5JyksXG4gICAgJ2Fsd2F5cy1uZXcnOiByZXF1aXJlKCcuL2Fsd2F5cy1uZXctc3RyYXRlZ3knKSxcbiAgICAnbXVsdGlwbGF5ZXInOiByZXF1aXJlKCcuL211bHRpcGxheWVyLXN0cmF0ZWd5JyksXG4gICAgJ3BlcnNpc3RlbnQtc2luZ2xlLXBsYXllcic6IHJlcXVpcmUoJy4vcGVyc2lzdGVudC1zaW5nbGUtcGxheWVyLXN0cmF0ZWd5JyksXG4gICAgJ25vbmUnOiByZXF1aXJlKCcuL2lkZW50aXR5LXN0cmF0ZWd5Jylcbn07XG4iLCIndXNlIHN0cmljdCc7XG52YXIgUnVuU2VydmljZSA9IHJlcXVpcmUoJy4uL3NlcnZpY2UvcnVuLWFwaS1zZXJ2aWNlJyk7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICB2YWxpZEZpbHRlcjogeyBzYXZlZDogdHJ1ZSB9XG59O1xuXG5mdW5jdGlvbiBTY2VuYXJpb01hbmFnZXIob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG4gICAgdGhpcy5ydW5TZXJ2aWNlID0gdGhpcy5vcHRpb25zLnJ1biB8fCBuZXcgUnVuU2VydmljZSh0aGlzLm9wdGlvbnMpO1xufVxuXG5TY2VuYXJpb01hbmFnZXIucHJvdG90eXBlID0ge1xuICAgIGdldFJ1bnM6IGZ1bmN0aW9uIChmaWx0ZXIpIHtcbiAgICAgICAgdGhpcy5maWx0ZXIgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdGhpcy5vcHRpb25zLnZhbGlkRmlsdGVyLCBmaWx0ZXIpO1xuICAgICAgICByZXR1cm4gdGhpcy5ydW5TZXJ2aWNlLnF1ZXJ5KHRoaXMuZmlsdGVyKTtcbiAgICB9LFxuXG4gICAgbG9hZFZhcmlhYmxlczogZnVuY3Rpb24gKHZhcnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuU2VydmljZS5xdWVyeSh0aGlzLmZpbHRlciwgeyBpbmNsdWRlOiB2YXJzIH0pO1xuICAgIH0sXG5cbiAgICBzYXZlOiBmdW5jdGlvbiAocnVuLCBtZXRhKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRTZXJ2aWNlKHJ1bikuc2F2ZSgkLmV4dGVuZCh0cnVlLCB7fSwgeyBzYXZlZDogdHJ1ZSB9LCBtZXRhKSk7XG4gICAgfSxcblxuICAgIGFyY2hpdmU6IGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldFNlcnZpY2UocnVuKS5zYXZlKHsgc2F2ZWQ6IGZhbHNlIH0pO1xuICAgIH0sXG5cbiAgICBfZ2V0U2VydmljZTogZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICBpZiAodHlwZW9mIHJ1biA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUnVuU2VydmljZSgkLmV4dGVuZCh0cnVlLCB7fSwgIHRoaXMub3B0aW9ucywgeyBmaWx0ZXI6IHJ1biB9KSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIHJ1biA9PT0gJ29iamVjdCcgJiYgcnVuIGluc3RhbmNlb2YgUnVuU2VydmljZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU2F2ZSBtZXRob2QgcmVxdWlyZXMgYSBydW4gc2VydmljZSBvciBhIHJ1bklkJyk7XG4gICAgfSxcblxuICAgIGdldFJ1bjogZnVuY3Rpb24gKHJ1bklkKSB7XG4gICAgICAgIHJldHVybiBuZXcgUnVuU2VydmljZSgkLmV4dGVuZCh0cnVlLCB7fSwgIHRoaXMub3B0aW9ucywgeyBmaWx0ZXI6IHJ1bklkIH0pKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNjZW5hcmlvTWFuYWdlcjtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHJlc2V0OiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zLCBtYW5hZ2VyKSB7XG4gICAgICAgIHJldHVybiBtYW5hZ2VyLnJlc2V0KG9wdGlvbnMpO1xuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBXb3JsZEFwaSA9IHJlcXVpcmUoJy4uL3NlcnZpY2Uvd29ybGQtYXBpLWFkYXB0ZXInKTtcbnZhciBSdW5NYW5hZ2VyID0gIHJlcXVpcmUoJy4vcnVuLW1hbmFnZXInKTtcbnZhciBBdXRoTWFuYWdlciA9IHJlcXVpcmUoJy4vYXV0aC1tYW5hZ2VyJyk7XG4vLyB2YXIgX3BpY2sgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdC11dGlsJykuX3BpY2s7XG52YXIgd29ybGRBcGk7XG5cbi8vIHZhciBkZWZhdWx0cyA9IHtcbi8vICBhY2NvdW50OiAnJyxcbi8vICBwcm9qZWN0OiAnJyxcbi8vICBncm91cDogJycsXG4vLyAgdHJhbnNwb3J0OiB7XG4vLyAgfVxuLy8gfTtcblxuXG5mdW5jdGlvbiBidWlsZFN0cmF0ZWd5KHdvcmxkSWQsIGR0ZCkge1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIEN0b3IocnVuU2VydmljZSwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLnJ1blNlcnZpY2UgPSBydW5TZXJ2aWNlO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG4gICAgICAgICQuZXh0ZW5kKHRoaXMsIHtcbiAgICAgICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdub3QgaW1wbGVtZW50ZC4gTmVlZCBhcGkgY2hhbmdlcycpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZ2V0UnVuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgICAgICByZXR1cm4gd29ybGRBcGkuZ2V0Q3VycmVudFJ1bklkKHsgZmlsdGVyOiB3b3JsZElkIH0pXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChydW5JZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLnJ1blNlcnZpY2UubG9hZChydW5JZCk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlLmNhbGwodGhpcywgcnVuLCBfdGhpcy5ydW5TZXJ2aWNlKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmZhaWwoZHRkLnJlamVjdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgIH07XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAkLmV4dGVuZCh0cnVlLCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMucnVuKTtcbiAgICAkLmV4dGVuZCh0cnVlLCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMud29ybGQpO1xuXG5cbiAgICB3b3JsZEFwaSA9IG5ldyBXb3JsZEFwaSh0aGlzLm9wdGlvbnMpO1xuICAgIHRoaXMuX2F1dGggPSBuZXcgQXV0aE1hbmFnZXIoKTtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdmFyIGFwaSA9IHtcbiAgICAgICAgZ2V0Q3VycmVudFdvcmxkOiBmdW5jdGlvbiAodXNlcklkLCBncm91cE5hbWUpIHtcbiAgICAgICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5fYXV0aC5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICAgICAgICBpZiAoIXVzZXJJZCkge1xuICAgICAgICAgICAgICAgIHVzZXJJZCA9IHNlc3Npb24udXNlcklkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFncm91cE5hbWUpIHtcbiAgICAgICAgICAgICAgICBncm91cE5hbWUgPSBzZXNzaW9uLmdyb3VwTmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB3b3JsZEFwaS5nZXRDdXJyZW50V29ybGRGb3JVc2VyKHVzZXJJZCwgZ3JvdXBOYW1lKTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRDdXJyZW50UnVuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZHRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLl9hdXRoLmdldEN1cnJlbnRVc2VyU2Vzc2lvbkluZm8oKTtcbiAgICAgICAgICAgIHZhciBjdXJVc2VySWQgPSBzZXNzaW9uLnVzZXJJZDtcbiAgICAgICAgICAgIHZhciBjdXJHcm91cE5hbWUgPSBzZXNzaW9uLmdyb3VwTmFtZTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0QW5kUmVzdG9yZUxhdGVzdFJ1bih3b3JsZCkge1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50V29ybGRJZCA9IHdvcmxkLmlkO1xuICAgICAgICAgICAgICAgIHZhciBzdHJhdGVneSA9IGJ1aWxkU3RyYXRlZ3koY3VycmVudFdvcmxkSWQsIGR0ZCk7XG4gICAgICAgICAgICAgICAgdmFyIG9wdCA9ICQuZXh0ZW5kKHRydWUsIHt9LCB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmF0ZWd5OiBzdHJhdGVneSxcbiAgICAgICAgICAgICAgICAgICAgcnVuOiBfdGhpcy5vcHRpb25zXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdmFyIHJtID0gbmV3IFJ1bk1hbmFnZXIob3B0KTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBybS5nZXRSdW4oKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZShydW4sIHJtLnJ1blNlcnZpY2UsIHJtKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0Q3VycmVudFdvcmxkKGN1clVzZXJJZCwgY3VyR3JvdXBOYW1lKVxuICAgICAgICAgICAgICAgIC50aGVuKGdldEFuZFJlc3RvcmVMYXRlc3RSdW4pO1xuXG4gICAgICAgICAgICByZXR1cm4gZHRkLnByb21pc2UoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBhcGkpO1xufTtcbiIsIi8qKlxuICpcbiAqICMjQXV0aGVudGljYXRpb24gQVBJIFNlcnZpY2VcbiAqXG4gKiBUaGUgQXV0aGVudGljYXRpb24gQVBJIFNlcnZpY2UgcHJvdmlkZXMgbWV0aG9kcyBmb3IgbG9nZ2luZyBpbiBhbmQgY3JlYXRpbmcgdXNlciBhY2Nlc3MgdG9rZW5zLlxuICogVXNlciBhY2Nlc3MgdG9rZW5zIGFyZSByZXF1aXJlZCBmb3IgZWFjaCBjYWxsIHRvIEVwaWNlbnRlci4gKFNlZSBbQ3JlYXRpbmcgYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSBmb3IgbW9yZSBpbmZvcm1hdGlvbi4pXG4gKlxuICogICAgICB2YXIgYXV0aCA9IG5ldyBGLnNlcnZpY2UuQXV0aCgpO1xuICogICAgICBhdXRoLmxvZ2luKHsgdXNlck5hbWU6ICdqc21pdGhAYWNtZXNpbXVsYXRpb25zLmNvbScsXG4gKiAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiAncGFzc3cwcmQnIH0pO1xuICogICAgICBhdXRoLmxvZ291dCgpO1xuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFbWFpbCBvciB1c2VybmFtZSB0byB1c2UgZm9yIGxvZ2dpbmcgaW4uIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHVzZXJOYW1lOiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUGFzc3dvcmQgZm9yIHNwZWNpZmllZCB1c2VybmFtZS4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcGFzc3dvcmQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBY2NvdW50IHRvIGxvZyBpbiBpbnRvLiBSZXF1aXJlZCB0byBsb2cgaW4gYXMgYW4gZW5kIHVzZXIuIERlZmF1bHRzIHRvIHBpY2tpbmcgaXQgdXAgZnJvbSB0aGUgcGF0aC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPcHRpb25zIHRvIHBhc3Mgb24gdG8gdGhlIHVuZGVybHlpbmcgdHJhbnNwb3J0IGxheWVyLiBBbGwganF1ZXJ5LmFqYXggb3B0aW9ucyBhdCBodHRwOi8vYXBpLmpxdWVyeS5jb20valF1ZXJ5LmFqYXgvIGFyZSBhdmFpbGFibGUuIERlZmF1bHRzIHRvIGVtcHR5IG9iamVjdC5cbiAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRyYW5zcG9ydDoge31cbiAgICB9O1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG5cbiAgICB2YXIgdHJhbnNwb3J0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aCgnYXV0aGVudGljYXRpb24nKVxuICAgIH0pO1xuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkodHJhbnNwb3J0T3B0aW9ucyk7XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMb2dzIHVzZXIgaW4uIElmIG5vIHVzZXJuYW1lIG9yIHBhc3N3b3JkIHdhcyBwcm92aWRlZCBpbiB0aGUgaW5pdGlhbCBjb25maWd1cmF0aW9uIG9wdGlvbnMsIHRoZXkgYXJlIHJlcXVpcmVkIGhlcmUuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgYXV0aC5sb2dpbih7IHVzZXJOYW1lOiAnanNtaXRoQGFjbWVzaW11bGF0aW9ucy5jb20nLFxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiAncGFzc3cwcmQnLFxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgIGFjY291bnQ6ICdhY21lJyB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIGxvZ2luOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwgeyBzdWNjZXNzOiAkLm5vb3AgfSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKCFodHRwT3B0aW9ucy51c2VyTmFtZSB8fCAhaHR0cE9wdGlvbnMucGFzc3dvcmQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzcCA9IHsgc3RhdHVzOiA0MDEsIHN0YXR1c01lc3NhZ2U6ICdObyB1c2VybmFtZSBvciBwYXNzd29yZCBzcGVjaWZpZWQuJyB9O1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZXJyb3IuY2FsbCh0aGlzLCByZXNwKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdChyZXNwKS5wcm9taXNlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBwb3N0UGFyYW1zID0ge1xuICAgICAgICAgICAgICAgIHVzZXJOYW1lOiBodHRwT3B0aW9ucy51c2VyTmFtZSxcbiAgICAgICAgICAgICAgICBwYXNzd29yZDogaHR0cE9wdGlvbnMucGFzc3dvcmQsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKGh0dHBPcHRpb25zLmFjY291bnQpIHtcbiAgICAgICAgICAgICAgICAvL3Bhc3MgaW4gbnVsbCBmb3IgYWNjb3VudCB1bmRlciBvcHRpb25zIGlmIHlvdSBkb24ndCB3YW50IGl0IHRvIGJlIHNlbnRcbiAgICAgICAgICAgICAgICBwb3N0UGFyYW1zLmFjY291bnQgPSBodHRwT3B0aW9ucy5hY2NvdW50O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHBvc3RQYXJhbXMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogTG9ncyB1c2VyIG91dCBmcm9tIHNwZWNpZmllZCBhY2NvdW50cy5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICBhdXRoLmxvZ291dCgpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICBsb2dvdXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCBzZXJ2aWNlT3B0aW9ucywgdHJhbnNwb3J0T3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBpZiAoIWh0dHBPcHRpb25zLnRva2VuKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyB0b2tlbiB3YXMgc3BlY2lmaWVkLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHNsYXNoID0gaHR0cE9wdGlvbnMudXJsLnNsaWNlKC0xKSA9PT0gJy8nID8gJycgOiAnLyc7XG4gICAgICAgICAgICBodHRwT3B0aW9ucy51cmwgPSBodHRwT3B0aW9ucy51cmwgKyBzbGFzaCArIGh0dHBPcHRpb25zLnRva2VuO1xuICAgICAgICAgICAgdmFyIGRlbGV0ZVBhcmFtcyA9IHt9O1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5kZWxldGUoZGVsZXRlUGFyYW1zLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQSAncHViL3N1Yicgb2JqZWN0XG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtTdHJpbmd9IG9wdGlvbnMuYmFzZSBCYXNlLXRvcGljLiBUaGlzIHdpbGwgYmUgcHJlLXBlbmRlZCB0byBhbGwgZnVydGhlciB0b3BpY3MgeW91IHB1Ymxpc2ggb3Igc3Vic2NyaWJlIHRvXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSB0b3BpY1Jlc29sdmVyIEEgZnVuY3Rpb24gaW50byB3aGljaCBhbGwgJ3RvcGljcycgcGFzc2VkIGludG8gdGhlIGBwdWJsaXNoYCBhbmQgYHN1YnNjcmliZWAgbWV0aG9kcyBhcmUgc2VudCB0aHJvdWdoLiBCeSBkZWZhdWx0IGl0IGp1c3QgZWNob2VzLlxuICogQHBhcmFtIHtDb21ldGR9IHRyYW5zcG9ydCBpbnN0YW5jZSBvZiBjb21ldGQgdG8gaG9vayBvbnRvXG4gKi9cbnZhciBDaGFubmVsID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIGJhc2U6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGlzIGlzIHVzZWZ1bCBpZiB5b3Ugd2FudCB0byBpbXBsZW1lbnQgeW91ciBvd24gc2VyaWFsaXplIGZ1bmN0aW9ucyBmb3IgY29udmVydGluZyBjdXN0b20gb2JqZWN0cyB0byB0b3BpYyBuYW1lcy5cbiAgICAgICAgICogQHBhcmFtICB7Kn0gdG9rZW4gVG9rZW4gdG8gcGFyc2VcbiAgICAgICAgICogQHJldHVybiB7U3RyaW5nfSB0aGlzIGZ1bmN0aW9uIHNob3VsZCByZXR1cm4gYSBzdHJpbmcgdG9waWNcbiAgICAgICAgICovXG4gICAgICAgIHRvcGljUmVzb2x2ZXI6IGZ1bmN0aW9uICh0b3BpYykge1xuICAgICAgICAgICAgcmV0dXJuIHRvcGljO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vY29tZXRkIGluc3RhbmNlXG4gICAgICAgIHRyYW5zcG9ydDogbnVsbFxuICAgIH07XG4gICAgdGhpcy5jaGFubmVsT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG59O1xuXG52YXIgbWFrZU5hbWUgPSBmdW5jdGlvbiAoY2hhbm5lbE5hbWUsIHRvcGljKSB7XG4gICAgLy9SZXBsYWNlIHRyYWlsaW5nL2RvdWJsZSBzbGFzaGVzXG4gICAgdmFyIG5ld05hbWUgPSAoY2hhbm5lbE5hbWUgPyAoY2hhbm5lbE5hbWUgKyAnLycgKyB0b3BpYykgOiB0b3BpYykucmVwbGFjZSgvXFwvXFwvL2csICcvJykucmVwbGFjZSgvXFwvJC8sJycpO1xuICAgIHJldHVybiBuZXdOYW1lO1xufTtcblxuLyoqXG4gKiBTdWJzY3JpYmUgdG8gY2hhbmdlcyBvbiBhIHRvcGljLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZyB8IEFycmF5fSAgIHRvcGljICAgIExpc3Qgb2YgdG9waWNzIHRvIGxpc3RlbiBmb3IgY2hhbmdlcyBvblxuICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIENhbGxiYWNrIHRvIGV4ZWN1dGUuIENhbGxiYWNrIHdpbGwgYmUgY2FsbGVkIHdpdGggc2lnbmF0dXJlIChldnQsIHBheWxvYWQsIG1ldGFkYXRhKVxuICogQHBhcmFtICB7T2JqZWN0fSAgIGNvbnRleHQgIENvbnRleHQgaW4gd2hpY2ggdGhlIGNhbGxiYWNrIHdpbGwgYmUgZXhlY3V0ZWRcbiAqIEBwYXJhbSAge09iamVjdH0gICBvcHRpb25zICBPYmplY3Qgd2l0aCBkZWZhdWx0c1xuICogQHBhcmFtICB7TnVtYmVyfSAgIG9wdGlvbnMucHJpb3JpdHkgIENhbiBiZSB1c2VkIHRvIGNvbnRyb2wgb3JkZXIgb2Ygb3BlcmF0aW9ucywgZGVmYXVsdHMgdG8gMCwgY2FuIGJlIGFueSArdmUgb3IgLXZlIG51bWJlclxuICogQHBhcmFtICB7U3RyaW5nfE51bWJlcnxGdW5jdGlvbn0gICBvcHRpb25zLnZhbHVlICBDYWxsYmFjayB3aWxsIG9ubHkgYmUgdHJpZ2dlcmVkIGlmIHRoaXMgY29uZGl0aW9uIG1hdGNoZXMuIFNlZSBFeGFtcGxlcyBmb3IgZGV0YWlsc1xuICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgIFJldHVybnMgYSB0b2tlbiB5b3UgY2FuIGxhdGVyIHVzZSB0byB1bi1zdWJzY3JpYmVcbiAqXG4gKiAgKipFeGFtcGxlcyoqXG4gKiAgc3Vic2NyaWJlKCdydW4nLCBjYikgLSBzdWJzY3JpYmUgdG8gY2hhbmdlcyBvbiBhIHRvcC1sZXZlbCAncnVuJyB0b3BpY1xuICogIHN1YnNjcmliZSgncnVuLyonKSAtIGNoYW5nZXMgb24gY2hpbGRyZW4gb2YgdGhlIHJ1biBvYmplY3QuIE5vdGUgdGhpcyBub3QgYWxzbyBiZSB0cmlnZ2VyZWQgZm9yIGNoYW5nZXMgdG8gcnVuLngueS56XG4gKiAgc3Vic2NyaWJlKFsncnVuJywgJ3J1bi8qJ10pIC0gY2hhbmdlcyB0byBydW4gYW5kIGNoaWxkcmVuXG4gKiAgc3Vic2NyaWJlKCdydW4vdmFyaWFibGVzL3ByaWNlJywgY2IpIC0gY2hhbmdlcyB0byBwcmljZVxuICpcbiAqICBzdWJzY3JpYmUoJ3J1bicsIGZ1bmN0aW9uICgpIHsgdGhpcy5pbm5lckhUTUwgPSAnVHJpZ2dlcmVkJ30sIGRvY3VtZW50LmJvZHkpOyAtIHNldCB0aGUgY29udGV4dCBmb3IgdGhlIGNhbGxiYWNrXG4gKiAgc3Vic2NyaWJlKCdydW4nLCBjYiwgdGhpcywge3ByaW9yaXR5OiA5fSk7IC0gYnkgZGVmYXVsdCBwcmlvcml0eSBpcyAwLiBDYW4gYmUgdXNlZCB0byBjb250cm9sIG9yZGVyIG9mIG9wZXJhdGlvbnNcbiAqICBzdWJzY3JpYmUoJ3J1bi92YXJpYWJsZXMvcHJpY2UnLCBjYiwgdGhpcywge3ByaW9yaXR5OiAzMCwgdmFsdWU6IDUwfSk7IC0gb25seSBleGVjIGNhbGxiYWNrIGlmIHZhbHVlIG9mIHByaWNlIGlzIDUwXG4gKiAgc3Vic2NyaWJlKCdydW4vdmFyaWFibGVzL3ByaWNlJywgY2IsIHRoaXMsIHtwcmlvcml0eTogMzAsIHZhbHVlOiAnPjUwJ30pOyAtIG9ubHkgZXhlYyBjYWxsYmFjayBpZiB2YWx1ZSBvZiBwcmljZSBpcyA+IDUwXG4gKiAgc3Vic2NyaWJlKCdydW4vdmFyaWFibGVzL3ByaWNlJywgY2IsIHRoaXMsIHtwcmlvcml0eTogMzAsIHZhbHVlOiBmdW5jdGlvbiAodmFsKSB7cmV0dXJuIHZhbCAlIDIgPT09MH19KTsgLSBvbmx5IGV4ZWMgY2FsbGJhY2sgaWYgdmFsdWUgb2YgcHJpY2UgaXMgZXZlblxuICpcbiAqL1xuQ2hhbm5lbC5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24gKHRvcGljLCBjYWxsYmFjaywgY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciB0b3BpY3MgPSBbXS5jb25jYXQodG9waWMpO1xuICAgIHZhciBtZSA9IHRoaXM7XG4gICAgdmFyIHN1YnNjcmlwdGlvbklkcyA9IFtdO1xuICAgIHZhciBvcHRzID0gbWUuY2hhbm5lbE9wdGlvbnM7XG5cbiAgICBvcHRzLnRyYW5zcG9ydC5iYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICQuZWFjaCh0b3BpY3MsIGZ1bmN0aW9uIChpbmRleCwgdG9waWMpIHtcbiAgICAgICAgICAgIHRvcGljID0gbWFrZU5hbWUob3B0cy5iYXNlLCBvcHRzLnRvcGljUmVzb2x2ZXIodG9waWMpKTtcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkcy5wdXNoKG9wdHMudHJhbnNwb3J0LnN1YnNjcmliZSh0b3BpYywgY2FsbGJhY2spKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIChzdWJzY3JpcHRpb25JZHNbMV0gPyBzdWJzY3JpcHRpb25JZHMgOiBzdWJzY3JpcHRpb25JZHNbMF0pO1xufTtcblxuLyoqXG4gKiBQdWJsaXNoIGRhdGEgdG8gYSB0b3BpY1xuICogQHBhcmFtICB7U3RyaW5nfSB0b3BpYyBUb3BpYyB0byBwdWJsaXNoIHRvXG4gKiBAcGFyYW0gIHsqfSBwYXlsb2FkICBEYXRhIHRvIHB1Ymxpc2ggdG8gdG9waWNcbiAqXG4gKiAqKkV4YW1wbGVzKipcbiAqIHB1Ymxpc2goJ3J1bicsIHtjb21wbGV0ZWQ6IGZhbHNlfSk7IC0gc2VuZCBwYXlsb2FkIHRvIGFsbCBzdWJzY3JpYmVyc1xuICogcHVibGlzaCgncnVuL3ZhcmlhYmxlcycsIHtwcmljZTogNTB9KTtcbiAqL1xuQ2hhbm5lbC5wcm90b3R5cGUucHVibGlzaCA9IGZ1bmN0aW9uICh0b3BpYywgZGF0YSkge1xuICAgIHZhciB0b3BpY3MgPSBbXS5jb25jYXQodG9waWMpO1xuICAgIHZhciBtZSA9IHRoaXM7XG4gICAgdmFyIHJldHVybk9ianMgPSBbXTtcbiAgICB2YXIgb3B0cyA9IG1lLmNoYW5uZWxPcHRpb25zO1xuXG5cbiAgICBvcHRzLnRyYW5zcG9ydC5iYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICQuZWFjaCh0b3BpY3MsIGZ1bmN0aW9uIChpbmRleCwgdG9waWMpIHtcbiAgICAgICAgICAgIHRvcGljID0gbWFrZU5hbWUob3B0cy5iYXNlLCBvcHRzLnRvcGljUmVzb2x2ZXIodG9waWMpKTtcbiAgICAgICAgICAgIGlmICh0b3BpYy5jaGFyQXQodG9waWMubGVuZ3RoIC0gMSkgPT09ICcqJykge1xuICAgICAgICAgICAgICAgIHRvcGljID0gdG9waWMucmVwbGFjZSgvXFwqKyQvLCAnJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdZb3UgY2FuIGNhbm5vdCBwdWJsaXNoIHRvIGNoYW5uZWxzIHdpdGggd2lsZGNhcmRzLiBQdWJsaXNoaW5nIHRvICcsIHRvcGljLCAnaW5zdGVhZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuT2Jqcy5wdXNoKG9wdHMudHJhbnNwb3J0LnB1Ymxpc2godG9waWMsIGRhdGEpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIChyZXR1cm5PYmpzWzFdID8gcmV0dXJuT2JqcyA6IHJldHVybk9ianNbMF0pO1xufTtcblxuLyoqXG4gKiBVbnN1YnNjcmliZSBmcm9tIGNoYW5nZXNcbiAqIEBwYXJhbSAge1N0cmluZ30gdG9rZW5cbiAqL1xuQ2hhbm5lbC5wcm90b3R5cGUudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICB0aGlzLmNoYW5uZWxPcHRpb25zLnRyYW5zcG9ydC51bnN1YnNjcmliZSh0b2tlbik7XG4gICAgcmV0dXJuIHRva2VuO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDaGFubmVsO1xuIiwiLyoqXG4gKiBAY2xhc3MgQ29uZmlndXJhdGlvblNlcnZpY2VcbiAqXG4gKiBBbGwgc2VydmljZXMgdGFrZSBpbiBhIGNvbmZpZ3VyYXRpb24gc2V0dGluZ3Mgb2JqZWN0IHRvIGNvbmZpZ3VyZSB0aGVtc2VsdmVzLiBBIEpTIGhhc2gge30gaXMgYSB2YWxpZCBjb25maWd1cmF0aW9uIG9iamVjdCwgYnV0IG9wdGlvbmFsbHkgeW91IGNhbiB1c2UgdGhlIGNvbmZpZ3VyYXRpb24gc2VydmljZSB0byB0b2dnbGUgY29uZmlncyBiYXNlZCBvbiB0aGUgZW52aXJvbm1lbnRcbiAqXG4gKiBAZXhhbXBsZVxuICogICAgIHZhciBjcyA9IHJlcXVpcmUoJ2NvbmZpZ3VyYXRpb24tc2VydmljZScpKHtcbiAqICAgICAgICAgIGRldjogeyAvL2Vudmlyb25tZW50XG4gICAgICAgICAgICAgICAgcG9ydDogMzAwMCxcbiAgICAgICAgICAgICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9kOiB7XG4gICAgICAgICAgICAgICAgcG9ydDogODA4MCxcbiAgICAgICAgICAgICAgICBob3N0OiAnYXBpLmZvcmlvLmNvbScsXG4gICAgICAgICAgICAgICAgbG9nTGV2ZWw6ICdub25lJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxvZ0xldmVsOiAnREVCVUcnIC8vZ2xvYmFsXG4gKiAgICAgfSk7XG4gKlxuICogICAgICBjcy5nZXQoJ2xvZ0xldmVsJyk7IC8vcmV0dXJucyAnREVCVUcnXG4gKlxuICogICAgICBjcy5zZXRFbnYoJ2RldicpO1xuICogICAgICBjcy5nZXQoJ2xvZ0xldmVsJyk7IC8vcmV0dXJucyAnREVCVUcnXG4gKlxuICogICAgICBjcy5zZXRFbnYoJ3Byb2QnKTtcbiAqICAgICAgY3MuZ2V0KCdsb2dMZXZlbCcpOyAvL3JldHVybnMgJ25vbmUnXG4gKlxuICovXG5cbid1c2Ugc3RyaWN0JztcbnZhciB1cmxTZXJ2aWNlID0gcmVxdWlyZSgnLi91cmwtY29uZmlnLXNlcnZpY2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgLy9UT0RPOiBFbnZpcm9ubWVudHNcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIGxvZ0xldmVsOiAnTk9ORSdcbiAgICB9O1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcbiAgICBzZXJ2aWNlT3B0aW9ucy5zZXJ2ZXIgPSB1cmxTZXJ2aWNlKHNlcnZpY2VPcHRpb25zLnNlcnZlcik7XG5cbiAgICByZXR1cm4ge1xuXG4gICAgICAgIGRhdGE6IHNlcnZpY2VPcHRpb25zLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgdGhlIGVudmlyb25tZW50IGtleSB0byBnZXQgY29uZmlndXJhdGlvbiBvcHRpb25zIGZyb21cbiAgICAgICAgICogQHBhcmFtIHsgc3RyaW5nfSBlbnZcbiAgICAgICAgICovXG4gICAgICAgIHNldEVudjogZnVuY3Rpb24gKGVudikge1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBjb25maWd1cmF0aW9uLlxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfSBwcm9wZXJ0eSBvcHRpb25hbFxuICAgICAgICAgKiBAcmV0dXJuIHsqfSAgICAgICAgICBWYWx1ZSBvZiBwcm9wZXJ0eSBpZiBzcGVjaWZpZWQsIHRoZSBlbnRpcmUgY29uZmlnIG9iamVjdCBvdGhlcndpc2VcbiAgICAgICAgICovXG4gICAgICAgIGdldDogZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICByZXR1cm4gc2VydmljZU9wdGlvbnNbcHJvcGVydHldO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgY29uZmlndXJhdGlvbi5cbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xPYmplY3R9IGtleSBpZiBhIGtleSBpcyBwcm92aWRlZCwgc2V0IGEga2V5IHRvIHRoYXQgdmFsdWUuIE90aGVyd2lzZSBtZXJnZSBvYmplY3Qgd2l0aCBjdXJyZW50IGNvbmZpZ1xuICAgICAgICAgKiBAcGFyYW0gIHsqfSB2YWx1ZSAgdmFsdWUgZm9yIHByb3ZpZGVkIGtleVxuICAgICAgICAgKi9cbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnNba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbiIsIi8qKlxuICogIyNEYXRhIEFQSSBTZXJ2aWNlXG4gKlxuICogVGhlIERhdGEgQVBJIFNlcnZpY2UgYWxsb3dzIHlvdSB0byBjcmVhdGUsIGFjY2VzcywgYW5kIG1hbmlwdWxhdGUgZGF0YSByZWxhdGVkIHRvIGFueSBvZiB5b3VyIHByb2plY3RzLiBEYXRhIGFyZSBvcmdhbml6ZWQgaW4gY29sbGVjdGlvbnMuIEVhY2ggY29sbGVjdGlvbiBjb250YWlucyBhIGRvY3VtZW50OyBlYWNoIGVsZW1lbnQgb2YgdGhpcyB0b3AtbGV2ZWwgZG9jdW1lbnQgaXMgYSBKU09OIG9iamVjdC4gKFNlZSBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIG9uIHRoZSB1bmRlcmx5aW5nIFtEYXRhIEFQSV0oLi4vLi4vLi4vZGF0YV9hcGkvKS4pXG4gKlxuICogQWxsIEFQSSBjYWxscyB0YWtlIGluIGFuIFwib3B0aW9uc1wiIG9iamVjdCBhcyB0aGUgbGFzdCBwYXJhbWV0ZXIuIFRoZSBvcHRpb25zIGNhbiBiZSB1c2VkIHRvIGV4dGVuZC9vdmVycmlkZSB0aGUgRGF0YSBBUEkgU2VydmljZSBkZWZhdWx0cy4gSW4gcGFydGljdWxhciwgdGhlIGByb290YCBvcHRpb24gY29udGFpbnMgdGhlIG5hbWUgb2YgdGhlIGNvbGxlY3Rpb24uIElmIHlvdSBoYXZlIG11bHRpcGxlIGNvbGxlY3Rpb25zIHdpdGhpbiBlYWNoIG9mIHlvdXIgcHJvamVjdHMsIHlvdSBjYW4gcGFzcyB0aGUgY29sbGVjdGlvbiBuYW1lIGFzIGFuIG9wdGlvbiBmb3IgZWFjaCBjYWxsLlxuICpcbiAqICAgICAgdmFyIGRzID0gbmV3IEYuc2VydmljZS5EYXRhKHsgcm9vdDogJ3N1cnZleS1yZXNwb25zZXMnIH0pO1xuICogICAgICBkcy5zYXZlQXMoJ3VzZXIxJyxcbiAqICAgICAgICAgIHsgJ3F1ZXN0aW9uMSc6IDIsICdxdWVzdGlvbjInOiAxMCxcbiAqICAgICAgICAgICAncXVlc3Rpb24zJzogZmFsc2UsICdxdWVzdGlvbjQnOiAnc29tZXRpbWVzJyB9ICk7XG4gKiAgICAgIGRzLnNhdmVBcygndXNlcjInLFxuICogICAgICAgICAgeyAncXVlc3Rpb24xJzogMywgJ3F1ZXN0aW9uMic6IDgsXG4gKiAgICAgICAgICAgJ3F1ZXN0aW9uMyc6IHRydWUsICdxdWVzdGlvbjQnOiAnYWx3YXlzJyB9ICk7XG4gKiAgICAgIGRzLnF1ZXJ5KCcnLHsgJ3F1ZXN0aW9uMic6IHsgJyRndCc6IDl9IH0pO1xuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBTdG9yYWdlRmFjdG9yeSA9IHJlcXVpcmUoJy4uL3N0b3JlL3N0b3JlLWZhY3RvcnknKTtcbnZhciBxdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvcXVlcnktdXRpbCcpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgc3RvcmUgPSBuZXcgU3RvcmFnZUZhY3RvcnkoeyBzeW5jaHJvbm91czogdHJ1ZSB9KTtcblxuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIE5hbWUgb2YgY29sbGVjdGlvbi4gRGVmYXVsdHMgdG8gYC9gLCB0aGF0IGlzLCB0aGUgcm9vdCBsZXZlbCBvZiB5b3VyIHByb2plY3QgYXQgYGZvcmlvLmNvbS9hcHAveW91ci1hY2NvdW50LWlkL3lvdXItcHJvamVjdC1pZC9gLiBSZXF1aXJlZC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHJvb3Q6ICcvJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRm9yIG9wZXJhdGlvbnMgdGhhdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uLCBwYXNzIGluIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiAoZGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nKS4gSWYgdGhlIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW4gdG8gRXBpY2VudGVyLCB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gaXMgYWxyZWFkeSBzZXQgaW4gYSBjb29raWUgYW5kIGF1dG9tYXRpY2FsbHkgbG9hZGVkIGZyb20gdGhlcmUuIChTZWUgW21vcmUgYmFja2dyb3VuZCBvbiBhY2Nlc3MgdG9rZW5zXSguLi8uLi8uLi9wcm9qZWN0X2FjY2Vzcy8pKS5cbiAgICAgICAgICogQHNlZSBbQXV0aGVudGljYXRpb24gQVBJIFNlcnZpY2VdKC4uL2F1dGgtYXBpLXNlcnZpY2UvKSBmb3IgZ2V0dGluZyB0b2tlbnMuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0b2tlbjogc3RvcmUuZ2V0KCdlcGljZW50ZXIucHJvamVjdC50b2tlbicpIHx8ICcnLFxuXG4gICAgICAgIGFwaUtleTogJycsXG4gICAgICAgIGRvbWFpbjogJ2ZvcmlvLmNvbScsXG5cbiAgICAgICAgLy9PcHRpb25zIHRvIHBhc3Mgb24gdG8gdGhlIHVuZGVybHlpbmcgdHJhbnNwb3J0IGxheWVyXG4gICAgICAgIHRyYW5zcG9ydDoge31cbiAgICB9O1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcblxuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICB1cmxDb25maWcuYWNjb3VudFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5hY2NvdW50O1xuICAgIH1cbiAgICBpZiAoc2VydmljZU9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICB1cmxDb25maWcucHJvamVjdFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0O1xuICAgIH1cblxuICAgIHZhciBnZXRVUkwgPSBmdW5jdGlvbiAoa2V5LCByb290KSB7XG4gICAgICAgIGlmICghcm9vdCkge1xuICAgICAgICAgICAgcm9vdCA9IHNlcnZpY2VPcHRpb25zLnJvb3Q7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHVybCA9IHVybENvbmZpZy5nZXRBUElQYXRoKCdkYXRhJykgKyBxdXRpbC5hZGRUcmFpbGluZ1NsYXNoKHJvb3QpO1xuICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICB1cmwrPSBxdXRpbC5hZGRUcmFpbGluZ1NsYXNoKGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9O1xuXG4gICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IGdldFVSTFxuICAgIH0pO1xuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy50b2tlbikge1xuICAgICAgICBodHRwT3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBzZXJ2aWNlT3B0aW9ucy50b2tlblxuICAgICAgICB9O1xuICAgIH1cbiAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KGh0dHBPcHRpb25zKTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlYXJjaCBmb3IgZGF0YSB3aXRoaW4gYSBjb2xsZWN0aW9uLlxuICAgICAgICAgKlxuICAgICAgICAgKiBTZWFyY2hpbmcgdXNpbmcgY29tcGFyaXNvbiBvciBsb2dpY2FsIG9wZXJhdG9ycyAoYXMgb3Bwb3NlZCB0byBleGFjdCBtYXRjaGVzKSByZXF1aXJlcyBNb25nb0RCIHN5bnRheC4gU2VlIHRoZSB1bmRlcmx5aW5nIFtEYXRhIEFQSV0oLi4vLi4vLi4vZGF0YV9hcGkvI3NlYXJjaGluZykgZm9yIGFkZGl0aW9uYWwgZGV0YWlscy5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlcyoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gcmVxdWVzdCBhbGwgZGF0YSBhc3NvY2lhdGVkIHdpdGggZG9jdW1lbnQgJ3VzZXIxJ1xuICAgICAgICAgKiAgICAgIGRzLnF1ZXJ5KCd1c2VyMScpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIGV4YWN0IG1hdGNoaW5nOlxuICAgICAgICAgKiAgICAgIC8vIHJlcXVlc3QgYWxsIGRvY3VtZW50cyBpbiBjb2xsZWN0aW9uIHdoZXJlICdxdWVzdGlvbjInIGlzIDlcbiAgICAgICAgICogICAgICBkcy5xdWVyeSgnJywgeyAncXVlc3Rpb24yJzogOX0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIGNvbXBhcmlzb24gb3BlcmF0b3JzOlxuICAgICAgICAgKiAgICAgIC8vIHJlcXVlc3QgYWxsIGRvY3VtZW50cyBpbiBjb2xsZWN0aW9uXG4gICAgICAgICAqICAgICAgLy8gd2hlcmUgJ3F1ZXN0aW9uMicgaXMgZ3JlYXRlciB0aGFuIDlcbiAgICAgICAgICogICAgICBkcy5xdWVyeSgnJywgeyAncXVlc3Rpb24yJzogeyAnJGd0JzogOX0gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gbG9naWNhbCBvcGVyYXRvcnM6XG4gICAgICAgICAqICAgICAgLy8gcmVxdWVzdCBhbGwgZG9jdW1lbnRzIGluIGNvbGxlY3Rpb25cbiAgICAgICAgICogICAgICAvLyB3aGVyZSAncXVlc3Rpb24yJyBpcyBsZXNzIHRoYW4gMTAsIGFuZCAncXVlc3Rpb24zJyBpcyBmYWxzZVxuICAgICAgICAgKiAgICAgIGRzLnF1ZXJ5KCcnLCB7ICckYW5kJzogWyB7ICdxdWVzdGlvbjInOiB7ICckbHQnOjEwfSB9LCB7ICdxdWVzdGlvbjMnOiBmYWxzZSB9XSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyByZWd1bGFyIGV4cHJlc3NzaW9uczogdXNlIGFueSBQZXJsLWNvbXBhdGlibGUgcmVndWxhciBleHByZXNzaW9uc1xuICAgICAgICAgKiAgICAgIC8vIHJlcXVlc3QgYWxsIGRvY3VtZW50cyBpbiBjb2xsZWN0aW9uXG4gICAgICAgICAqICAgICAgLy8gd2hlcmUgJ3F1ZXN0aW9uNScgY29udGFpbnMgdGhlIHN0cmluZyAnKmRheSdcbiAgICAgICAgICogICAgICBkcy5xdWVyeSgnJywgeyAncXVlc3Rpb241JzogeyAnJHJlZ2V4JzogJypkYXknIH0gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBga2V5YCBUaGUgbmFtZSBvZiB0aGUgZG9jdW1lbnQgdG8gc2VhcmNoLiBQYXNzIHRoZSBlbXB0eSBzdHJpbmcgKCcnKSB0byBzZWFyY2ggdGhlIGVudGlyZSBjb2xsZWN0aW9uLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYHF1ZXJ5YCBUaGUgcXVlcnkgb2JqZWN0LiBGb3IgZXhhY3QgbWF0Y2hpbmcsIHRoaXMgb2JqZWN0IGNvbnRhaW5zIHRoZSBmaWVsZCBuYW1lIGFuZCBmaWVsZCB2YWx1ZSB0byBtYXRjaC4gRm9yIG1hdGNoaW5nIGJhc2VkIG9uIGNvbXBhcmlzb24sIHRoaXMgb2JqZWN0IGNvbnRhaW5zIHRoZSBmaWVsZCBuYW1lIGFuZCB0aGUgY29tcGFyaXNvbiBleHByZXNzaW9uLiBGb3IgbWF0Y2hpbmcgYmFzZWQgb24gbG9naWNhbCBvcGVyYXRvcnMsIHRoaXMgb2JqZWN0IGNvbnRhaW5zIGFuIGV4cHJlc3Npb24gdXNpbmcgTW9uZ29EQiBzeW50YXguIFNlZSB0aGUgdW5kZXJseWluZyBbRGF0YSBBUEldKC4uLy4uLy4uL2RhdGFfYXBpLyNzZWFyY2hpbmcpIGZvciBhZGRpdGlvbmFsIGV4YW1wbGVzLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG91dHB1dE1vZGlmaWVyYCAoT3B0aW9uYWwpIEF2YWlsYWJsZSBmaWVsZHMgaW5jbHVkZTogYHN0YXJ0cmVjb3JkYCwgYGVuZHJlY29yZGAsIGBzb3J0YCwgYW5kIGBkaXJlY3Rpb25gIChgYXNjYCBvciBgZGVzY2ApLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqXG4gICAgICAgICAqL1xuICAgICAgICBxdWVyeTogZnVuY3Rpb24gKGtleSwgcXVlcnksIG91dHB1dE1vZGlmaWVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgcGFyYW1zID0gJC5leHRlbmQodHJ1ZSwgeyBxOiBxdWVyeSB9LCBvdXRwdXRNb2RpZmllcik7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaHR0cE9wdGlvbnMudXJsID0gZ2V0VVJMKGtleSwgaHR0cE9wdGlvbnMucm9vdCk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQocGFyYW1zLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNhdmUgZGF0YSB0byBhbiBhbm9ueW1vdXMgZG9jdW1lbnQgd2l0aGluIHRoZSBjb2xsZWN0aW9uLlxuICAgICAgICAgKlxuICAgICAgICAgKiAoRG9jdW1lbnRzIGFyZSB0b3AtbGV2ZWwgZWxlbWVudHMgd2l0aGluIGEgY29sbGVjdGlvbi4gQ29sbGVjdGlvbnMgbXVzdCBiZSB1bmlxdWUgd2l0aGluIHRoaXMgYWNjb3VudCAodGVhbSBvciBwZXJzb25hbCBhY2NvdW50KSBhbmQgcHJvamVjdCBhbmQgYXJlIHNldCB3aXRoIHRoZSBgcm9vdGAgZmllbGQgaW4gdGhlIGBvcHRpb25gIHBhcmFtZXRlci4gU2VlIHRoZSB1bmRlcmx5aW5nIFtEYXRhIEFQSV0oLi4vLi4vLi4vZGF0YV9hcGkvKSBmb3IgYWRkaXRpb25hbCBiYWNrZ3JvdW5kLilcbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICBkcy5zYXZlKCdxdWVzdGlvbjEnLCAneWVzJyk7XG4gICAgICAgICAqICAgICAgZHMuc2F2ZSh7cXVlc3Rpb24xOid5ZXMnLCBxdWVzdGlvbjI6IDMyIH0pO1xuICAgICAgICAgKiAgICAgIGRzLnNhdmUoeyBuYW1lOidKb2huJywgY2xhc3NOYW1lOiAnQ1MxMDEnIH0sIHsgcm9vdDogJ3N0dWRlbnRzJyB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBga2V5YCBJZiBga2V5YCBpcyBhIHN0cmluZywgaXQgaXMgdGhlIGlkIG9mIHRoZSBlbGVtZW50IHRvIHNhdmUgKGNyZWF0ZSkgaW4gdGhpcyBkb2N1bWVudC4gSWYgYGtleWAgaXMgYW4gb2JqZWN0LCB0aGUgb2JqZWN0IGlzIHRoZSBkYXRhIHRvIHNhdmUgKGNyZWF0ZSkgaW4gdGhpcyBkb2N1bWVudC4gSW4gYm90aCBjYXNlcywgdGhlIGlkIGZvciB0aGUgZG9jdW1lbnQgaXMgZ2VuZXJhdGVkIGF1dG9tYXRpY2FsbHkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgdmFsdWVgIChPcHRpb25hbCkgVGhlIGRhdGEgdG8gc2F2ZS4gSWYgYGtleWAgaXMgYSBzdHJpbmcsIHRoaXMgaXMgdGhlIHZhbHVlIHRvIHNhdmUuIElmIGBrZXlgIGlzIGFuIG9iamVjdCwgdGhlIHZhbHVlKHMpIHRvIHNhdmUgYXJlIGFscmVhZHkgcGFydCBvZiBga2V5YCBhbmQgdGhpcyBhcmd1bWVudCBpcyBub3QgcmVxdWlyZWQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIHNhdmU6IGZ1bmN0aW9uIChrZXksIHZhbHVlLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgYXR0cnM7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBhdHRycyA9IGtleTtcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIChhdHRycyA9IHt9KVtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaHR0cE9wdGlvbnMudXJsID0gZ2V0VVJMKCcnLCBodHRwT3B0aW9ucy5yb290KTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChhdHRycywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTYXZlIGRhdGEgdG8gYSBuYW1lZCBkb2N1bWVudCBvciBlbGVtZW50IHdpdGhpbiB0aGUgY29sbGVjdGlvbi4gVGhlIGByb290YCBvZiB0aGUgY29sbGVjdGlvbiBtdXN0IGJlIHNwZWNpZmllZCBzZXBhcmF0ZWx5IGluIGNvbmZpZ3VyYXRpb24gb3B0aW9ucywgZWl0aGVyIGFzIHBhcnQgb2YgdGhlIGNhbGwgb3IgYXMgcGFydCBvZiB0aGUgaW5pdGlhbGl6YXRpb24gb2YgZHMuXG4gICAgICAgICAqXG4gICAgICAgICAqIChEb2N1bWVudHMgYXJlIHRvcC1sZXZlbCBlbGVtZW50cyB3aXRoaW4gYSBjb2xsZWN0aW9uLiBDb2xsZWN0aW9ucyBtdXN0IGJlIHVuaXF1ZSB3aXRoaW4gdGhpcyBhY2NvdW50ICh0ZWFtIG9yIHBlcnNvbmFsIGFjY291bnQpIGFuZCBwcm9qZWN0IGFuZCBhcmUgc2V0IHdpdGggdGhlIGByb290YCBmaWVsZCBpbiB0aGUgYG9wdGlvbmAgcGFyYW1ldGVyLiBTZWUgdGhlIHVuZGVybHlpbmcgW0RhdGEgQVBJXSguLi8uLi8uLi9kYXRhX2FwaS8pIGZvciBhZGRpdGlvbmFsIGJhY2tncm91bmQuKVxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIGRzLnNhdmVBcygndXNlcjEnLFxuICAgICAgICAgKiAgICAgICAgICB7ICdxdWVzdGlvbjEnOiAyLCAncXVlc3Rpb24yJzogMTAsXG4gICAgICAgICAqICAgICAgICAgICAncXVlc3Rpb24zJzogZmFsc2UsICdxdWVzdGlvbjQnOiAnc29tZXRpbWVzJyB9ICk7XG4gICAgICAgICAqICAgICAgZHMuc2F2ZUFzKCdzdHVkZW50MScsXG4gICAgICAgICAqICAgICAgICAgIHsgZmlyc3ROYW1lOiAnam9obicsIGxhc3ROYW1lOiAnc21pdGgnIH0sXG4gICAgICAgICAqICAgICAgICAgIHsgcm9vdDogJ3N0dWRlbnRzJyB9KTtcbiAgICAgICAgICogICAgICBkcy5zYXZlQXMoJ21nbXQxMDAvZ3JvdXBCJyxcbiAgICAgICAgICogICAgICAgICAgeyBzY2VuYXJpb1llYXI6ICcyMDE1JyB9LFxuICAgICAgICAgKiAgICAgICAgICB7IHJvb3Q6ICdteWNsYXNzZXMnIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gYGtleWAgSWQgb2YgdGhlIGRvY3VtZW50LlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYHZhbHVlYCAoT3B0aW9uYWwpIFRoZSBkYXRhIHRvIHNhdmUsIGluIGtleTp2YWx1ZSBwYWlycy5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgc2F2ZUFzOiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGh0dHBPcHRpb25zLnVybCA9IGdldFVSTChrZXksIGh0dHBPcHRpb25zLnJvb3QpO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wdXQodmFsdWUsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IGRhdGEgZm9yIGEgc3BlY2lmaWMgZG9jdW1lbnQgb3IgZmllbGQuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgZHMubG9hZCgndXNlcjEnKTtcbiAgICAgICAgICogICAgICBkcy5sb2FkKCd1c2VyMS9xdWVzdGlvbjMnKTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtICB7U3RyaW5nfE9iamVjdH0gYGtleWAgVGhlIGlkIG9mIHRoZSBkYXRhIHRvIHJldHVybi4gQ2FuIGJlIHRoZSBpZCBvZiBhIGRvY3VtZW50LCBvciBhIHBhdGggdG8gZGF0YSB3aXRoaW4gdGhhdCBkb2N1bWVudC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvdXRwdXRNb2RpZmllcmAgKE9wdGlvbmFsKSBBdmFpbGFibGUgZmllbGRzIGluY2x1ZGU6IGBzdGFydHJlY29yZGAsIGBlbmRyZWNvcmRgLCBgc29ydGAsIGFuZCBgZGlyZWN0aW9uYCAoYGFzY2Agb3IgYGRlc2NgKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIGxvYWQ6IGZ1bmN0aW9uIChrZXksIG91dHB1dE1vZGlmaWVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaHR0cE9wdGlvbnMudXJsID0gZ2V0VVJMKGtleSwgaHR0cE9wdGlvbnMucm9vdCk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQob3V0cHV0TW9kaWZpZXIsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBkYXRhIGZyb20gY29sbGVjdGlvbi4gT25seSBkb2N1bWVudHMgKHRvcC1sZXZlbCBlbGVtZW50cyBpbiBlYWNoIGNvbGxlY3Rpb24pIGNhbiBiZSBkZWxldGVkLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgZHMucmVtb3ZlKCd1c2VyMScpO1xuICAgICAgICAgKlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gYGtleWAgVGhlIGlkIG9mIHRoZSBkb2N1bWVudCB0byByZW1vdmUgZnJvbSB0aGlzIGNvbGxlY3Rpb24uXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24gKGtleXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgcGFyYW1zO1xuICAgICAgICAgICAgaWYgKCQuaXNBcnJheShrZXlzKSkge1xuICAgICAgICAgICAgICAgIHBhcmFtcyA9IHsgaWQ6IGtleXMgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zID0gJyc7XG4gICAgICAgICAgICAgICAgaHR0cE9wdGlvbnMudXJsID0gZ2V0VVJMKGtleXMsIGh0dHBPcHRpb25zLnJvb3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZGVsZXRlKHBhcmFtcywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRXBpY2VudGVyIGRvZXNuJ3QgYWxsb3cgbnVraW5nIGNvbGxlY3Rpb25zXG4gICAgICAgIC8vICAgICAvKipcbiAgICAgICAgLy8gICAgICAqIFJlbW92ZXMgY29sbGVjdGlvbiBiZWluZyByZWZlcmVuY2VkXG4gICAgICAgIC8vICAgICAgKiBAcmV0dXJuIG51bGxcbiAgICAgICAgLy8gICAgICAqL1xuICAgICAgICAvLyAgICAgZGVzdHJveTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgLy8gICAgICAgICByZXR1cm4gdGhpcy5yZW1vdmUoJycsIG9wdGlvbnMpO1xuICAgICAgICAvLyAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIi8qKlxuICpcbiAqICMjTWVtYmVyIEFQSSBBZGFwdGVyXG4gKlxuICogVGhlIE1lbWJlciBBUEkgQWRhcHRlciBwcm92aWRlcyBtZXRob2RzIHRvIGxvb2t1cCB1c2VyIGRldGFpbHMgb3IgZ3JvdXAgZGV0YWlsc1xuICpcbiAqICAgICAgdmFyIGF1dGggPSBuZXcgRi5hZGFwdGVyLk1lbWJlcigpO1xuICogICAgICBhdXRoLmdldEdyb3Vwc0J5VXNlcih7IHVzZXJJZDogJ2I2YjMxM2EzLWFiODQtNDc5Yy1iYWVhLTIwNmY2YmZmMzM3JyB9KTtcbiAqICAgICAgYXV0aC5nZXRHcm91cERldGFpbHMoeyBncm91cElkOiAnMDBiNTMzMDgtOTgzMy00N2YyLWIyMWUtMTI3OGMwN2Q1M2I4JyB9KTtcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRXBpY2VudGVyIHVzZXJJZC4gRGVmYXVsdHMgdG8gYSBibGFuayBzdHJpbmdcbiAgICAgICAgICogQHR5cGUgeyBzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB1c2VySWQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFcGljZW50ZXIgZ3JvdXBJZC4gRGVmYXVsdHMgdG8gYSBibGFuayBzdHJpbmdcbiAgICAgICAgICogQHR5cGUgeyBzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBncm91cElkOiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucyB0byBwYXNzIG9uIHRvIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBsYXllci4gQWxsIGpxdWVyeS5hamF4IG9wdGlvbnMgYXQgaHR0cDovL2FwaS5qcXVlcnkuY29tL2pRdWVyeS5hamF4LyBhcmUgYXZhaWxhYmxlLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IHt9XG4gICAgfTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgdmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKHNlcnZpY2VPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuXG4gICAgdmFyIHRyYW5zcG9ydE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoJ21lbWJlci9sb2NhbCcpXG4gICAgfSk7XG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zKTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG5cbiAgICAgICAgZ2V0R3JvdXBzQnlVc2VyOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKCFodHRwT3B0aW9ucy51c2VySWQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHVzZXJJZCBzcGVjaWZpZWQuJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBnZXRQYXJtcyA9IHtcbiAgICAgICAgICAgICAgICB1c2VySWQ6IGh0dHBPcHRpb25zLnVzZXJJZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChnZXRQYXJtcywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldEdyb3VwRGV0YWlsczogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHNlcnZpY2VPcHRpb25zLCB0cmFuc3BvcnRPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGlmICghaHR0cE9wdGlvbnMuZ3JvdXBJZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZ3JvdXBJZCBzcGVjaWZpZWQuJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBzbGFzaCA9IGh0dHBPcHRpb25zLnVybC5zbGljZSgtMSkgPT09ICcvJyA/ICcnIDogJy8nO1xuICAgICAgICAgICAgaHR0cE9wdGlvbnMudXJsID0gaHR0cE9wdGlvbnMudXJsICsgc2xhc2ggKyBodHRwT3B0aW9ucy5ncm91cElkO1xuXG4gICAgICAgICAgICB2YXIgZ2V0UGFybXMgPSB7fTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChnZXRQYXJtcywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiLyoqXG4gKlxuICogIyNSdW4gQVBJIFNlcnZpY2VcbiAqXG4gKiBUaGUgUnVuIEFQSSBTZXJ2aWNlIGFsbG93cyB5b3UgdG8gcGVyZm9ybSBjb21tb24gdGFza3MgYXJvdW5kIGNyZWF0aW5nIGFuZCB1cGRhdGluZyBydW5zLCB2YXJpYWJsZXMsIGFuZCBkYXRhLlxuICpcbiAqIEFsbCBBUEkgY2FsbHMgdGFrZSBpbiBhbiBcIm9wdGlvbnNcIiBvYmplY3QgYXMgdGhlIGxhc3QgcGFyYW1ldGVyLiBUaGUgb3B0aW9ucyBjYW4gYmUgdXNlZCB0byBleHRlbmQvb3ZlcnJpZGUgdGhlIFJ1biBBUEkgU2VydmljZSBkZWZhdWx0cy5cbiAqXG4gKiBUeXBpY2FsbHksIHlvdSBmaXJzdCBpbnN0YW50aWF0ZSBhIFtSdW4gTWFuYWdlcl0oLi4vcnVuLW1hbmFnZXIvKSBhbmQgdGhlbiBhY2Nlc3MgdGhlIFJ1biBTZXJ2aWNlIHRoYXQgaXMgYXV0b21hdGljYWxseSBwYXJ0IG9mIHRoZSBtYW5hZ2VyLlxuICpcbiAqICAgICAgIHZhciBybSA9IG5ldyBGLm1hbmFnZXIuUnVuTWFuYWdlcih7XG4gKiAgICAgICAgICAgcnVuOiB7XG4gKiAgICAgICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAqICAgICAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAqICAgICAgICAgICAgICAgbW9kZWw6ICdzdXBwbHktY2hhaW4tbW9kZWwuamwnXG4gKiAgICAgICAgICAgfVxuICogICAgICAgfSk7XG4gKiAgICAgICBybS5nZXRSdW4oKVxuICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICogICAgICAgICAgICAgICAvLyB0aGUgUnVuTWFuYWdlci5ydW4gY29udGFpbnMgdGhlIGluc3RhbnRpYXRlZCBSdW4gU2VydmljZSxcbiAqICAgICAgICAgICAgICAgLy8gc28gYW55IFJ1biBTZXJ2aWNlIG1ldGhvZCBpcyB2YWxpZCBoZXJlXG4gKiAgICAgICAgICAgICAgIHZhciBycyA9IHJtLnJ1bjtcbiAqICAgICAgICAgICAgICAgcnMuZG8oJ3J1bk1vZGVsJyk7XG4gKiAgICAgICB9KVxuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBTdG9yYWdlRmFjdG9yeSA9IHJlcXVpcmUoJy4uL3N0b3JlL3N0b3JlLWZhY3RvcnknKTtcbnZhciBxdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvcXVlcnktdXRpbCcpO1xudmFyIHJ1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9ydW4tdXRpbCcpO1xudmFyIF9waWNrID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QtdXRpbCcpLl9waWNrO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xudmFyIFZhcmlhYmxlc1NlcnZpY2UgPSByZXF1aXJlKCcuL3ZhcmlhYmxlcy1hcGktc2VydmljZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAvLyBjb25maWcgfHwgKGNvbmZpZyA9IGNvbmZpZ1NlcnZpY2UuZ2V0KCkpO1xuICAgIHZhciBzdG9yZSA9IG5ldyBTdG9yYWdlRmFjdG9yeSh7IHN5bmNocm9ub3VzOiB0cnVlIH0pO1xuXG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRm9yIHByb2plY3RzIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZykuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdG9rZW46IHN0b3JlLmdldCgnZXBpY2VudGVyLnByb2plY3QudG9rZW4nKSB8fCAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGFjY291bnQgaWQuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlIFwiVGVhbSBJRFwiIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgXCJVc2VyIElEXCIgKGZvciBwZXJzb25hbCBwcm9qZWN0cykuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcHJvamVjdCBpZC4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcHJvamVjdDogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyaXRlcmlhIGJ5IHdoaWNoIHRvIGZpbHRlciBydW5zLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmaWx0ZXI6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsZWQgd2hlbiB0aGUgY2FsbCBjb21wbGV0ZXMgc3VjY2Vzc2Z1bGx5LiBEZWZhdWx0cyB0byBgJC5ub29wYC5cbiAgICAgICAgICovXG4gICAgICAgIHN1Y2Nlc3M6ICQubm9vcCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbGVkIHdoZW4gdGhlIGNhbGwgZmFpbHMuIERlZmF1bHRzIHRvIGAkLm5vb3BgLlxuICAgICAgICAgKi9cbiAgICAgICAgZXJyb3I6ICQubm9vcCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucyB0byBwYXNzIG9uIHRvIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBsYXllci4gQWxsIGpxdWVyeS5hamF4IG9wdGlvbnMgYXQgaHR0cDovL2FwaS5qcXVlcnkuY29tL2pRdWVyeS5hamF4LyBhcmUgYXZhaWxhYmxlLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IHt9XG4gICAgfTtcblxuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcblxuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICB1cmxDb25maWcuYWNjb3VudFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5hY2NvdW50O1xuICAgIH1cbiAgICBpZiAoc2VydmljZU9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICB1cmxDb25maWcucHJvamVjdFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0O1xuICAgIH1cblxuICAgIHVybENvbmZpZy5maWx0ZXIgPSAnOyc7XG4gICAgdXJsQ29uZmlnLmdldEZpbHRlclVSTCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHVybCA9IHVybENvbmZpZy5nZXRBUElQYXRoKCdydW4nKTtcbiAgICAgICAgdmFyIGZpbHRlciA9IHF1dGlsLnRvTWF0cml4Rm9ybWF0KHNlcnZpY2VPcHRpb25zLmZpbHRlcik7XG5cbiAgICAgICAgaWYgKGZpbHRlcikge1xuICAgICAgICAgICAgdXJsICs9IGZpbHRlciArICcvJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH07XG5cbiAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogdXJsQ29uZmlnLmdldEZpbHRlclVSTFxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIGh0dHBPcHRpb25zLmhlYWRlcnMgPSB7XG4gICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkoaHR0cE9wdGlvbnMpO1xuXG4gICAgdmFyIHNldEZpbHRlck9yVGhyb3dFcnJvciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmZpbHRlcikge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gb3B0aW9ucy5maWx0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFzZXJ2aWNlT3B0aW9ucy5maWx0ZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZmlsdGVyIHNwZWNpZmllZCB0byBhcHBseSBvcGVyYXRpb25zIGFnYWluc3QnKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgcHVibGljQXN5bmNBUEkgPSB7XG4gICAgICAgIHVybENvbmZpZzogdXJsQ29uZmlnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGUgYSBuZXcgcnVuLlxuICAgICAgICAgKlxuICAgICAgICAgKiBOT1RFOiBUeXBpY2FsbHkgdGhpcyBpcyBub3QgdXNlZCEgVXNlIGBSdW5NYW5hZ2VyLmdldFJ1bigpYCB3aXRoIGEgYHN0cmF0ZWd5YCBvZiBgYWx3YXlzLW5ld2AsIG9yIHVzZSBgUnVuTWFuYWdlci5yZXNldCgpYC4gU2VlIFtSdW4gTWFuYWdlcl0oLi4vcnVuLW1hbmFnZXIvKSBmb3IgbW9yZSBkZXRhaWxzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICBycy5jcmVhdGUoJ2hlbGxvX3dvcmxkLmpsJyk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gYG1vZGVsYCBUaGUgbmFtZSBvZiB0aGUgcHJpbWFyeSBbbW9kZWwgZmlsZV0oLi4vLi4vLi4vd3JpdGluZ195b3VyX21vZGVsLykuIFRoaXMgaXMgdGhlIG9uZSBmaWxlIGluIHRoZSBwcm9qZWN0IHRoYXQgZXhwbGljaXRseSBleHBvc2VzIHZhcmlhYmxlcyBhbmQgbWV0aG9kcywgYW5kIGl0IG11c3QgYmUgc3RvcmVkIGluIHRoZSBNb2RlbCBmb2xkZXIgb2YgeW91ciBFcGljZW50ZXIgcHJvamVjdC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKlxuICAgICAgICAgKi9cbiAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgY3JlYXRlT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucywgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKCdydW4nKSB9KTtcbiAgICAgICAgICAgIHZhciBydW5BcGlQYXJhbXMgPSBbJ21vZGVsJywgJ3Njb3BlJywgJ2ZpbGVzJ107XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIGp1c3QgdGhlIG1vZGVsIG5hbWVcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSB7IG1vZGVsOiBwYXJhbXMgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gd2hpdGVsaXN0IHRoZSBmaWVsZHMgdGhhdCB3ZSBhY3R1YWxseSBjYW4gc2VuZCB0byB0aGUgYXBpXG4gICAgICAgICAgICAgICAgcGFyYW1zID0gX3BpY2socGFyYW1zLCBydW5BcGlQYXJhbXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgb2xkU3VjY2VzcyA9IGNyZWF0ZU9wdGlvbnMuc3VjY2VzcztcbiAgICAgICAgICAgIGNyZWF0ZU9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IHJlc3BvbnNlLmlkOyAvL2FsbCBmdXR1cmUgY2hhaW5lZCBjYWxscyB0byBvcGVyYXRlIG9uIHRoaXMgaWRcbiAgICAgICAgICAgICAgICByZXR1cm4gb2xkU3VjY2Vzcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChwYXJhbXMsIGNyZWF0ZU9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIHBhcnRpY3VsYXIgcnVucywgYmFzZWQgb24gY29uZGl0aW9ucyBzcGVjaWZpZWQgaW4gdGhlIGBxc2Agb2JqZWN0LlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgZWxlbWVudHMgb2YgdGhlIGBxc2Agb2JqZWN0IGFyZSBBTkRlZCB0b2dldGhlciB3aXRoaW4gYSBzaW5nbGUgY2FsbCB0byBgLnF1ZXJ5KClgLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIHJldHVybnMgcnVucyB3aXRoIHNhdmVkID0gdHJ1ZSBhbmQgdmFyaWFibGVzLnByaWNlID4gMSxcbiAgICAgICAgICogICAgICAvLyB3aGVyZSB2YXJpYWJsZXMucHJpY2UgaGFzIGJlZW4gcGVyc2lzdGVkIChyZWNvcmRlZClcbiAgICAgICAgICogICAgICAvLyBpbiB0aGUgbW9kZWwuXG4gICAgICAgICAqICAgICBycy5xdWVyeSh7XG4gICAgICAgICAqICAgICAgICAgICdzYXZlZCc6ICd0cnVlJyxcbiAgICAgICAgICogICAgICAgICAgJy5wcmljZSc6ICc+MSdcbiAgICAgICAgICogICAgICAgfSxcbiAgICAgICAgICogICAgICAge1xuICAgICAgICAgKiAgICAgICAgICBzdGFydHJlY29yZDogMixcbiAgICAgICAgICogICAgICAgICAgZW5kcmVjb3JkOiA1XG4gICAgICAgICAqICAgICAgIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYHFzYCBRdWVyeSBvYmplY3QuIEVhY2gga2V5IGNhbiBiZSBhIHByb3BlcnR5IG9mIHRoZSBydW4gb3IgdGhlIG5hbWUgb2YgdmFyaWFibGUgdGhhdCBoYXMgYmVlbiBzYXZlZCBpbiB0aGUgcnVuIChwcmVmYWNlZCBieSBgdmFyaWFibGVzLmApLiBFYWNoIHZhbHVlIGNhbiBiZSBhIGxpdGVyYWwgdmFsdWUsIG9yIGEgY29tcGFyaXNvbiBvcGVyYXRvciBhbmQgdmFsdWUuIChTZWUgW21vcmUgb24gZmlsdGVyaW5nXSguLi8uLi8uLi9hZ2dyZWdhdGVfcnVuX2FwaS8jZmlsdGVycykgYWxsb3dlZCBpbiB0aGUgdW5kZXJseWluZyBSdW4gQVBJLikgUXVlcnlpbmcgZm9yIHZhcmlhYmxlcyBpcyBhdmFpbGFibGUgZm9yIHJ1bnMgW2luIG1lbW9yeV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLW1lbW9yeSkgYW5kIGZvciBydW5zIFtpbiB0aGUgZGF0YWJhc2VdKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpIGlmIHRoZSB2YXJpYWJsZXMgYXJlIHBlcnNpc3RlZCAoZS5nLiB0aGF0IGhhdmUgYmVlbiBgcmVjb3JkYGVkIGluIHlvdXIgSnVsaWEgbW9kZWwpLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG91dHB1dE1vZGlmaWVyYCAoT3B0aW9uYWwpIEF2YWlsYWJsZSBmaWVsZHMgaW5jbHVkZTogYHN0YXJ0cmVjb3JkYCwgYGVuZHJlY29yZGAsIGBzb3J0YCwgYW5kIGBkaXJlY3Rpb25gIChgYXNjYCBvciBgZGVzY2ApLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICBxdWVyeTogZnVuY3Rpb24gKHFzLCBvdXRwdXRNb2RpZmllciwgb3B0aW9ucykge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gcXM7IC8vc2hvdWxkbid0IGJlIGFibGUgdG8gb3Zlci1yaWRlXG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KG91dHB1dE1vZGlmaWVyLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgcGFydGljdWxhciBydW5zLCBiYXNlZCBvbiBjb25kaXRpb25zIHNwZWNpZmllZCBpbiB0aGUgYHFzYCBvYmplY3QuXG4gICAgICAgICAqXG4gICAgICAgICAqIFNpbWlsYXIgdG8gYC5xdWVyeSgpYC5cbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBmaWx0ZXJgIEZpbHRlciBvYmplY3QuIEVhY2gga2V5IGNhbiBiZSBhIHByb3BlcnR5IG9mIHRoZSBydW4gb3IgdGhlIG5hbWUgb2YgdmFyaWFibGUgdGhhdCBoYXMgYmVlbiBzYXZlZCBpbiB0aGUgcnVuIChwcmVmYWNlZCBieSBgdmFyaWFibGVzLmApLiBFYWNoIHZhbHVlIGNhbiBiZSBhIGxpdGVyYWwgdmFsdWUsIG9yIGEgY29tcGFyaXNvbiBvcGVyYXRvciBhbmQgdmFsdWUuIChTZWUgW21vcmUgb24gZmlsdGVyaW5nXSguLi8uLi8uLi9hZ2dyZWdhdGVfcnVuX2FwaS8jZmlsdGVycykgYWxsb3dlZCBpbiB0aGUgdW5kZXJseWluZyBSdW4gQVBJLikgRmlsdGVyaW5nIGZvciB2YXJpYWJsZXMgaXMgYXZhaWxhYmxlIGZvciBydW5zIFtpbiBtZW1vcnldKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpIGFuZCBmb3IgcnVucyBbaW4gdGhlIGRhdGFiYXNlXSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KSBpZiB0aGUgdmFyaWFibGVzIGFyZSBwZXJzaXN0ZWQgKGUuZy4gdGhhdCBoYXZlIGJlZW4gYHJlY29yZGBlZCBpbiB5b3VyIEp1bGlhIG1vZGVsKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvdXRwdXRNb2RpZmllcmAgKE9wdGlvbmFsKSBBdmFpbGFibGUgZmllbGRzIGluY2x1ZGU6IGBzdGFydHJlY29yZGAsIGBlbmRyZWNvcmRgLCBgc29ydGAsIGFuZCBgZGlyZWN0aW9uYCAoYGFzY2Agb3IgYGRlc2NgKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgZmlsdGVyOiBmdW5jdGlvbiAoZmlsdGVyLCBvdXRwdXRNb2RpZmllciwgb3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdChzZXJ2aWNlT3B0aW9ucy5maWx0ZXIpKSB7XG4gICAgICAgICAgICAgICAgJC5leHRlbmQoc2VydmljZU9wdGlvbnMuZmlsdGVyLCBmaWx0ZXIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSBmaWx0ZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KG91dHB1dE1vZGlmaWVyLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBkYXRhIGZvciBhIHNwZWNpZmljIHJ1bi4gVGhpcyBpbmNsdWRlcyBzdGFuZGFyZCBydW4gZGF0YSBzdWNoIGFzIHRoZSBhY2NvdW50LCBtb2RlbCwgcHJvamVjdCwgYW5kIGNyZWF0ZWQgYW5kIGxhc3QgbW9kaWZpZWQgZGF0ZXMuIFRvIHJlcXVlc3Qgc3BlY2lmaWMgbW9kZWwgdmFyaWFibGVzLCBwYXNzIHRoZW0gYXMgcGFydCBvZiB0aGUgYGZpbHRlcnNgIHBhcmFtZXRlci5cbiAgICAgICAgICpcbiAgICAgICAgICogTm90ZSB0aGF0IGlmIHRoZSBydW4gaXMgW2luIG1lbW9yeV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLW1lbW9yeSksIGFueSBtb2RlbCB2YXJpYWJsZXMgYXJlIGF2YWlsYWJsZTsgaWYgdGhlIHJ1biBpcyBbaW4gdGhlIGRhdGFiYXNlXSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tZGIpLCBvbmx5IG1vZGVsIHZhcmlhYmxlcyB0aGF0IGhhdmUgYmVlbiBwZXJzaXN0ZWQgJm1kYXNoOyB0aGF0IGlzLCBgcmVjb3JkYGVkIGluIHlvdXIgSnVsaWEgbW9kZWwgJm1kYXNoOyBhcmUgYXZhaWxhYmxlLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgcnMubG9hZCgnYmI1ODk2NzctZDQ3Ni00OTcxLWE2OGUtMGM1OGQxOTFlNDUwJywgeyBpbmNsdWRlOiBbJy5wcmljZScsICcuc2FsZXMnXSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGBydW5JRGAgVGhlIHJ1biBpZC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBmaWx0ZXJzYCAoT3B0aW9uYWwpIE9iamVjdCBjb250YWluaW5nIGZpbHRlcnMgYW5kIG9wZXJhdGlvbiBtb2RpZmllcnMuIFVzZSBrZXkgYGluY2x1ZGVgIHRvIGxpc3QgbW9kZWwgdmFyaWFibGVzIHRoYXQgeW91IHdhbnQgdG8gaW5jbHVkZSBpbiB0aGUgcmVzcG9uc2UuIE90aGVyIGF2YWlsYWJsZSBmaWVsZHMgaW5jbHVkZTogYHN0YXJ0cmVjb3JkYCwgYGVuZHJlY29yZGAsIGBzb3J0YCwgYW5kIGBkaXJlY3Rpb25gIChgYXNjYCBvciBgZGVzY2ApLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICBsb2FkOiBmdW5jdGlvbiAocnVuSUQsIGZpbHRlcnMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IHJ1bklEOyAvL3Nob3VsZG4ndCBiZSBhYmxlIHRvIG92ZXItcmlkZVxuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChmaWx0ZXJzLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cblxuICAgICAgICAvL1NhdmluZyBkYXRhXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTYXZlIGF0dHJpYnV0ZXMgKGRhdGEsIG1vZGVsIHZhcmlhYmxlcykgb2YgdGhlIHJ1bi5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlcyoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICBycy5zYXZlKHsgY29tcGxldGVkOiB0cnVlIH0pO1xuICAgICAgICAgKiAgICAgcnMuc2F2ZSh7IHNhdmVkOiB0cnVlLCB2YXJpYWJsZXM6IHsgYTogMjMsIGI6IDIzIH0gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgYXR0cmlidXRlc2AgVGhlIHJ1biBkYXRhIGFuZCB2YXJpYWJsZXMgdG8gc2F2ZS4gTW9kZWwgdmFyaWFibGVzIG11c3QgYmUgaW5jbHVkZWQgaW4gYSBgdmFyaWFibGVzYCBmaWVsZCB3aXRoaW4gdGhlIGBhdHRyaWJ1dGVzYCBvYmplY3QgKG90aGVyd2lzZSB0aGV5IGFyZSB0cmVhdGVkIGFzIHJ1biBkYXRhIGFuZCBhZGRlZCB0byB0aGUgcnVuIHJlY29yZCBkaXJlY3RseSkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIHNhdmU6IGZ1bmN0aW9uIChhdHRyaWJ1dGVzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgc2V0RmlsdGVyT3JUaHJvd0Vycm9yKGh0dHBPcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLnBhdGNoKGF0dHJpYnV0ZXMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyMjT3BlcmF0aW9uc1xuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbCBhIG1ldGhvZCBmcm9tIHRoZSBtb2RlbC5cbiAgICAgICAgICpcbiAgICAgICAgICogRGVwZW5kaW5nIG9uIHRoZSBsYW5ndWFnZSBpbiB3aGljaCB5b3UgaGF2ZSB3cml0dGVuIHlvdXIgbW9kZWwsIHRoZSBtZXRob2QgbWF5IG5lZWQgdG8gYmUgZXhwb3NlZCAoZS5nLiBgZXhwb3J0YCBmb3IgYSBKdWxpYSBtb2RlbCkgaW4gdGhlIG1vZGVsIGZpbGUgaW4gb3JkZXIgdG8gYmUgY2FsbGVkIHRocm91Z2ggdGhlIEFQSS4gU2VlIFtXcml0aW5nIHlvdXIgTW9kZWxdKC4uLy4uLy4uL3dyaXRpbmdfeW91cl9tb2RlbC8pKS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGBwYXJhbXNgIGFyZ3VtZW50IGlzIG5vcm1hbGx5IGFuIGFycmF5IG9mIGFyZ3VtZW50cyB0byB0aGUgYG9wZXJhdGlvbmAuIEluIHRoZSBzcGVjaWFsIGNhc2Ugd2hlcmUgYG9wZXJhdGlvbmAgb25seSB0YWtlcyBvbmUgYXJndW1lbnQsIHlvdSBhcmUgbm90IHJlcXVpcmVkIHRvIHB1dCB0aGF0IGFyZ3VtZW50IGludG8gYW4gYXJyYXkuXG4gICAgICAgICAqXG4gICAgICAgICAqIE5vdGUgdGhhdCB5b3UgY2FuIGNvbWJpbmUgdGhlIGBvcGVyYXRpb25gIGFuZCBgcGFyYW1zYCBhcmd1bWVudHMgaW50byBhIHNpbmdsZSBvYmplY3QgaWYgeW91IHByZWZlciwgYXMgaW4gdGhlIGxhc3QgZXhhbXBsZS5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlcyoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kIFwic29sdmVcIiB0YWtlcyBubyBhcmd1bWVudHNcbiAgICAgICAgICogICAgIHJzLmRvKCdzb2x2ZScpO1xuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZCBcImVjaG9cIiB0YWtlcyBvbmUgYXJndW1lbnQsIGEgc3RyaW5nXG4gICAgICAgICAqICAgICBycy5kbygnZWNobycsIFsnaGVsbG8nXSk7XG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kIFwiZWNob1wiIHRha2VzIG9uZSBhcmd1bWVudCwgYSBzdHJpbmdcbiAgICAgICAgICogICAgIHJzLmRvKCdlY2hvJywgJ2hlbGxvJyk7XG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kIFwic3VtQXJyYXlcIiB0YWtlcyBvbmUgYXJndW1lbnQsIGFuIGFycmF5XG4gICAgICAgICAqICAgICBycy5kbygnc3VtQXJyYXknLCBbWzQsMiwxXV0pO1xuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZCBcImFkZFwiIHRha2VzIHR3byBhcmd1bWVudHMsIGJvdGggaW50ZWdlcnNcbiAgICAgICAgICogICAgIHJzLmRvKHsgbmFtZTonYWRkJywgcGFyYW1zOlsyLDRdIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gYG9wZXJhdGlvbmAgTmFtZSBvZiBtZXRob2QuXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IGBwYXJhbXNgIChPcHRpb25hbCkgQW55IHBhcmFtZXRlcnMgdGhlIG9wZXJhdGlvbiB0YWtlcywgcGFzc2VkIGFzIGFuIGFycmF5LiBJbiB0aGUgc3BlY2lhbCBjYXNlIHdoZXJlIGBvcGVyYXRpb25gIG9ubHkgdGFrZXMgb25lIGFyZ3VtZW50LCB5b3UgYXJlIG5vdCByZXF1aXJlZCB0byBwdXQgdGhhdCBhcmd1bWVudCBpbnRvIGFuIGFycmF5LCBhbmQgY2FuIGp1c3QgcGFzcyBpdCBkaXJlY3RseS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgZG86IGZ1bmN0aW9uIChvcGVyYXRpb24sIHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2RvJywgb3BlcmF0aW9uLCBwYXJhbXMpO1xuICAgICAgICAgICAgdmFyIG9wc0FyZ3M7XG4gICAgICAgICAgICB2YXIgcG9zdE9wdGlvbnM7XG4gICAgICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgICAgICAgIG9wc0FyZ3MgPSBwYXJhbXM7XG4gICAgICAgICAgICAgICAgcG9zdE9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHBhcmFtcykpIHtcbiAgICAgICAgICAgICAgICAgICAgb3BzQXJncyA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHBvc3RPcHRpb25zID0gcGFyYW1zO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9wc0FyZ3MgPSBwYXJhbXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHJ1dGlsLm5vcm1hbGl6ZU9wZXJhdGlvbnMob3BlcmF0aW9uLCBvcHNBcmdzKTtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgcG9zdE9wdGlvbnMpO1xuXG4gICAgICAgICAgICBzZXRGaWx0ZXJPclRocm93RXJyb3IoaHR0cE9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgcHJtcyA9IChyZXN1bHQuYXJnc1swXS5sZW5ndGggJiYgKHJlc3VsdC5hcmdzWzBdICE9PSBudWxsICYmIHJlc3VsdC5hcmdzWzBdICE9PSB1bmRlZmluZWQpKSA/IHJlc3VsdC5hcmdzWzBdIDogW107XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHsgYXJndW1lbnRzOiBwcm1zIH0sICQuZXh0ZW5kKHRydWUsIHt9LCBodHRwT3B0aW9ucywge1xuICAgICAgICAgICAgICAgIHVybDogdXJsQ29uZmlnLmdldEZpbHRlclVSTCgpICsgJ29wZXJhdGlvbnMvJyArIHJlc3VsdC5vcHNbMF0gKyAnLydcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbCBzZXZlcmFsIG1ldGhvZHMgZnJvbSB0aGUgbW9kZWwsIHNlcXVlbnRpYWxseS5cbiAgICAgICAgICpcbiAgICAgICAgICogRGVwZW5kaW5nIG9uIHRoZSBsYW5ndWFnZSBpbiB3aGljaCB5b3UgaGF2ZSB3cml0dGVuIHlvdXIgbW9kZWwsIHRoZSBtZXRob2RzIG1heSBuZWVkIHRvIGJlIGV4cG9zZWQgKGUuZy4gYGV4cG9ydGAgZm9yIGEgSnVsaWEgbW9kZWwpIGluIHRoZSBtb2RlbCBmaWxlIGluIG9yZGVyIHRvIGJlIGNhbGxlZCB0aHJvdWdoIHRoZSBBUEkuIFNlZSBbV3JpdGluZyB5b3VyIE1vZGVsXSguLi8uLi8uLi93cml0aW5nX3lvdXJfbW9kZWwvKSkuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZXMqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZHMgXCJpbml0aWFsaXplXCIgYW5kIFwic29sdmVcIiBkbyBub3QgdGFrZSBhbnkgYXJndW1lbnRzXG4gICAgICAgICAqICAgICBycy5zZXJpYWwoWydpbml0aWFsaXplJywgJ3NvbHZlJ10pO1xuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZHMgXCJpbml0XCIgYW5kIFwicmVzZXRcIiB0YWtlIHR3byBhcmd1bWVudHMgZWFjaFxuICAgICAgICAgKiAgICAgcnMuc2VyaWFsKFsgIHsgbmFtZTogJ2luaXQnLCBwYXJhbXM6IFsxLDJdIH0sXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgeyBuYW1lOiAncmVzZXQnLCBwYXJhbXM6IFsyLDNdIH1dKTtcbiAgICAgICAgICogICAgICAvLyBtZXRob2QgXCJpbml0XCIgdGFrZXMgdHdvIGFyZ3VtZW50cyxcbiAgICAgICAgICogICAgICAvLyBtZXRob2QgXCJydW5tb2RlbFwiIHRha2VzIG5vbmVcbiAgICAgICAgICogICAgIHJzLnNlcmlhbChbICB7IG5hbWU6ICdpbml0JywgcGFyYW1zOiBbMSwyXSB9LFxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ3J1bm1vZGVsJywgcGFyYW1zOiBbXSB9XSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXlbU3RyaW5nXXxBcnJheVtPYmplY3RdfSBgb3BlcmF0aW9uc2AgSWYgbm9uZSBvZiB0aGUgbWV0aG9kcyB0YWtlIHBhcmFtZXRlcnMsIHBhc3MgYW4gYXJyYXkgb2YgdGhlIG1ldGhvZCBuYW1lcyAoc3RyaW5ncykuIElmIGFueSBvZiB0aGUgbWV0aG9kcyBkbyB0YWtlIHBhcmFtZXRlcnMsIHBhc3MgYW4gYXJyYXkgb2Ygb2JqZWN0cywgZWFjaCBvZiB3aGljaCBjb250YWlucyBhIG1ldGhvZCBuYW1lIGFuZCBpdHMgb3duIChwb3NzaWJseSBlbXB0eSkgYXJyYXkgb2YgcGFyYW1ldGVycy5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgc2VyaWFsOiBmdW5jdGlvbiAob3BlcmF0aW9ucywgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgb3BQYXJhbXMgPSBydXRpbC5ub3JtYWxpemVPcGVyYXRpb25zKG9wZXJhdGlvbnMsIHBhcmFtcyk7XG4gICAgICAgICAgICB2YXIgb3BzID0gb3BQYXJhbXMub3BzO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBvcFBhcmFtcy5hcmdzO1xuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcblxuICAgICAgICAgICAgdmFyICRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICAgICAgdmFyIHBvc3RPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIGRvU2luZ2xlT3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wID0gb3BzLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgdmFyIGFyZyA9IGFyZ3Muc2hpZnQoKTtcblxuICAgICAgICAgICAgICAgIG1lLmRvKG9wLCBhcmcsIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb1NpbmdsZU9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRkLnJlc29sdmUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3N0T3B0aW9ucy5zdWNjZXNzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZC5yZWplY3QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3RPcHRpb25zLmVycm9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGRvU2luZ2xlT3AoKTtcblxuICAgICAgICAgICAgcmV0dXJuICRkLnByb21pc2UoKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbCBzZXZlcmFsIG1ldGhvZHMgZnJvbSB0aGUgbW9kZWwsIGV4ZWN1dGluZyB0aGVtIGluIHBhcmFsbGVsLlxuICAgICAgICAgKlxuICAgICAgICAgKiBEZXBlbmRpbmcgb24gdGhlIGxhbmd1YWdlIGluIHdoaWNoIHlvdSBoYXZlIHdyaXR0ZW4geW91ciBtb2RlbCwgdGhlIG1ldGhvZHMgbWF5IG5lZWQgdG8gYmUgZXhwb3NlZCAoZS5nLiBgZXhwb3J0YCBmb3IgYSBKdWxpYSBtb2RlbCkgaW4gdGhlIG1vZGVsIGZpbGUgaW4gb3JkZXIgdG8gYmUgY2FsbGVkIHRocm91Z2ggdGhlIEFQSS4gU2VlIFtXcml0aW5nIHlvdXIgTW9kZWxdKC4uLy4uLy4uL3dyaXRpbmdfeW91cl9tb2RlbC8pKS5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyBtZXRob2RzIFwic29sdmVcIiBhbmQgXCJyZXNldFwiIGRvIG5vdCB0YWtlIGFueSBhcmd1bWVudHNcbiAgICAgICAgICogICAgIHJzLnBhcmFsbGVsKFsnc29sdmUnLCAncmVzZXQnXSk7XG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kcyBcImFkZFwiIGFuZCBcInN1YnRyYWN0XCIgdGFrZSB0d28gYXJndW1lbnRzIGVhY2hcbiAgICAgICAgICogICAgIHJzLnBhcmFsbGVsKFsgeyBuYW1lOiAnYWRkJywgcGFyYW1zOiBbMSwyXSB9LFxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdzdWJ0cmFjdCcsIHBhcmFtczpbMiwzXSB9XSk7XG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kcyBcImFkZFwiIGFuZCBcInN1YnRyYWN0XCIgdGFrZSB0d28gYXJndW1lbnRzIGVhY2hcbiAgICAgICAgICogICAgIHJzLnBhcmFsbGVsKHsgYWRkOiBbMSwyXSwgc3VidHJhY3Q6IFsyLDRdIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdH0gYG9wZXJhdGlvbnNgIElmIG5vbmUgb2YgdGhlIG1ldGhvZHMgdGFrZSBwYXJhbWV0ZXJzLCBwYXNzIGFuIGFycmF5IG9mIHRoZSBtZXRob2QgbmFtZXMgKGFzIHN0cmluZ3MpLiBJZiBhbnkgb2YgdGhlIG1ldGhvZHMgZG8gdGFrZSBwYXJhbWV0ZXJzLCB5b3UgaGF2ZSB0d28gb3B0aW9ucy4gWW91IGNhbiBwYXNzIGFuIGFycmF5IG9mIG9iamVjdHMsIGVhY2ggb2Ygd2hpY2ggY29udGFpbnMgYSBtZXRob2QgbmFtZSBhbmQgaXRzIG93biAocG9zc2libHkgZW1wdHkpIGFycmF5IG9mIHBhcmFtZXRlcnMuIEFsdGVybmF0aXZlbHksIHlvdSBjYW4gcGFzcyBhIHNpbmdsZSBvYmplY3Qgd2l0aCB0aGUgbWV0aG9kIG5hbWUgYW5kIGEgKHBvc3NpYmx5IGVtcHR5KSBhcnJheSBvZiBwYXJhbWV0ZXJzLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICBwYXJhbGxlbDogZnVuY3Rpb24gKG9wZXJhdGlvbnMsIHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyICRkID0gJC5EZWZlcnJlZCgpO1xuXG4gICAgICAgICAgICB2YXIgb3BQYXJhbXMgPSBydXRpbC5ub3JtYWxpemVPcGVyYXRpb25zKG9wZXJhdGlvbnMsIHBhcmFtcyk7XG4gICAgICAgICAgICB2YXIgb3BzID0gb3BQYXJhbXMub3BzO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBvcFBhcmFtcy5hcmdzO1xuICAgICAgICAgICAgdmFyIHBvc3RPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIHF1ZXVlICA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGk8IG9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHF1ZXVlLnB1c2goXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG8ob3BzW2ldLCBhcmdzW2ldKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkLndoZW4uYXBwbHkodGhpcywgcXVldWUpXG4gICAgICAgICAgICAgICAgLmRvbmUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkZC5yZXNvbHZlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIHBvc3RPcHRpb25zLnN1Y2Nlc3MuYXBwbHkodGhpcy5hcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZhaWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkZC5yZWplY3QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgcG9zdE9wdGlvbnMuZXJyb3IuYXBwbHkodGhpcy5hcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gJGQucHJvbWlzZSgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBwdWJsaWNTeW5jQVBJID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyBhIFZhcmlhYmxlcyBTZXJ2aWNlIGluc3RhbmNlLiBVc2UgdGhlIHZhcmlhYmxlcyBpbnN0YW5jZSB0byBsb2FkLCBzYXZlLCBhbmQgcXVlcnkgZm9yIHNwZWNpZmljIG1vZGVsIHZhcmlhYmxlcy4gU2VlIHRoZSBbVmFyaWFibGUgQVBJIFNlcnZpY2VdKC4uL3ZhcmlhYmxlcy1hcGktc2VydmljZS8pIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIHZhciB2cyA9IHJzLnZhcmlhYmxlcygpO1xuICAgICAgICAgKiAgICAgIHZzLnNhdmUoeyBzYW1wbGVfaW50OiA0fSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgY29uZmlnYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cblxuICAgICAgICB2YXJpYWJsZXM6IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgICAgIHZhciB2cyA9IG5ldyBWYXJpYWJsZXNTZXJ2aWNlKCQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgY29uZmlnLCB7XG4gICAgICAgICAgICAgICAgcnVuU2VydmljZTogdGhpc1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgcmV0dXJuIHZzO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FzeW5jQVBJKTtcbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNTeW5jQVBJKTtcbn07XG5cbiIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuICogIyNTdGF0ZSBBUEkgQWRhcHRlclxuICpcbiAqIFRoZSBTdGF0ZSBBUEkgQWRhcHRlciBhbGxvd3MgeW91IHRvIHJlcGxheSBvciBjbG9uZSBydW5zXG4gKlxuICovXG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbnZhciBfcGljayA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0LXV0aWwnKS5fcGljaztcbnZhciBhcGlFbmRwb2ludCA9ICdtb2RlbC9zdGF0ZSc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuXG4gICAgdmFyIGRlZmF1bHRzID0ge1xuXG4gICAgfTtcblxuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG5cbiAgICB2YXIgdHJhbnNwb3J0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludClcbiAgICB9KTtcblxuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy50b2tlbikge1xuICAgICAgICB0cmFuc3BvcnRPcHRpb25zLmhlYWRlcnMgPSB7XG4gICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zKTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIFJlcGxheXMgYSBydW4gdG8gZ2V0IGl0IGJhY2sgaW50byBtZW1vcnlcbiAgICAgICAgKlxuICAgICAgICAqXG4gICAgICAgICogKipQQVJBTUVURVJTKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYHBhcmFtc2AgUGFyYW1ldGVycyBvYmplY3RcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYHBhcmFtcy5ydW5JZGAgaWQgb2YgdGhlIHJ1biB0byBicmluZyBiYWNrIHRvIG1lbW9yeVxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSAoT3B0aW9uYWwpIGBwYXJhbS5zdG9wQmVmb3JlYCAtIHRoZSBydW4gaXMgYWR2YW5jZWQgb25seSB1cCB0byB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiB0aGF0IG1ldGhvZFxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSAoT3B0aW9uYWwpIGBvcHRpb25zYCAtIE9wdGlvbnMgb3ZlcnJpZGVcbiAgICAgICAgKi9cbiAgICAgICAgcmVwbGF5OiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgcmVwbGF5T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHBhcmFtcy5ydW5JZCB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBwYXJhbXMgPSAkLmV4dGVuZCh0cnVlLCB7IGFjdGlvbjogJ3JlcGxheScgfSwgX3BpY2socGFyYW1zLCAnc3RvcEJlZm9yZScpKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChwYXJhbXMsIHJlcGxheU9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIENsb25lcyBhIGdpdmVuIHJ1biBhbmQgcmV0dXJucyBhIG5ldyBydW4gaW4gdGhlIHNhbWUgc3RhdGUgYXMgdGhlIGdpdmVuIHJ1blxuICAgICAgICAqXG4gICAgICAgICpcbiAgICAgICAgKiAqKlBBUkFNRVRFUlMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgcGFyYW1zYCBQYXJhbWV0ZXJzIG9iamVjdFxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgcGFyYW1zLnJ1bklkYCBpZCBvZiB0aGUgcnVuIHRvIGJyaW5nIGJhY2sgdG8gbWVtb3J5XG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IChPcHRpb25hbCkgYHBhcmFtLnN0b3BCZWZvcmVgIC0gdGhlIHJ1biBpcyBhZHZhbmNlZCBvbmx5IHVwIHRvIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIHRoYXQgbWV0aG9kXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IChPcHRpb25hbCkgYG9wdGlvbnNgIC0gT3B0aW9ucyBvdmVycmlkZVxuICAgICAgICAqL1xuICAgICAgICBjbG9uZTogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHJlcGxheU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBwYXJhbXMucnVuSWQgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcGFyYW1zID0gJC5leHRlbmQodHJ1ZSwgeyBhY3Rpb246ICdjbG9uZScgfSwgX3BpY2socGFyYW1zLCAnc3RvcEJlZm9yZScpKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChwYXJhbXMsIHJlcGxheU9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59OyIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgLy9UT0RPOiB1cmx1dGlscyB0byBnZXQgaG9zdCwgc2luY2Ugbm8gd2luZG93IG9uIG5vZGVcblxuICAgIHZhciBBUElfUFJPVE9DT0wgPSAnaHR0cHMnO1xuICAgIHZhciBIT1NUX0FQSV9NQVBQSU5HID0ge1xuICAgICAgICAnZm9yaW8uY29tJzogJ2FwaS5mb3Jpby5jb20nLFxuICAgICAgICAnZm9yaW9kZXYuY29tJzogJ2FwaS5lcGljZW50ZXIuZm9yaW9kZXYuY29tJ1xuICAgIH07XG5cbiAgICB2YXIgcHVibGljRXhwb3J0cyA9IHtcbiAgICAgICAgcHJvdG9jb2w6IEFQSV9QUk9UT0NPTCxcblxuICAgICAgICBhcGk6ICcnLFxuXG4gICAgICAgIGhvc3Q6IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaG9zdCA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuICAgICAgICAgICAgaWYgKCFob3N0IHx8IGhvc3QuaW5kZXhPZignbG9jYWxob3N0JykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgaG9zdCA9ICdmb3Jpby5jb20nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIChIT1NUX0FQSV9NQVBQSU5HW2hvc3RdKSA/IEhPU1RfQVBJX01BUFBJTkdbaG9zdF0gOiAnYXBpLicgKyBob3N0O1xuICAgICAgICB9KCkpLFxuXG4gICAgICAgIGFwcFBhdGg6IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcGF0aCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zcGxpdCgnXFwvJyk7XG5cbiAgICAgICAgICAgIHJldHVybiBwYXRoICYmIHBhdGhbMV0gfHwgJyc7XG4gICAgICAgIH0oKSksXG5cbiAgICAgICAgYWNjb3VudFBhdGg6IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYWNjbnQgPSAnJztcbiAgICAgICAgICAgIHZhciBwYXRoID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnNwbGl0KCdcXC8nKTtcbiAgICAgICAgICAgIGlmIChwYXRoICYmIHBhdGhbMV0gPT09ICdhcHAnKSB7XG4gICAgICAgICAgICAgICAgYWNjbnQgPSBwYXRoWzJdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFjY250O1xuICAgICAgICB9KCkpLFxuXG4gICAgICAgIHByb2plY3RQYXRoOiAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHByaiA9ICcnO1xuICAgICAgICAgICAgdmFyIHBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUuc3BsaXQoJ1xcLycpO1xuICAgICAgICAgICAgaWYgKHBhdGggJiYgcGF0aFsxXSA9PT0gJ2FwcCcpIHtcbiAgICAgICAgICAgICAgICBwcmogPSBwYXRoWzNdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHByajtcbiAgICAgICAgfSgpKSxcblxuICAgICAgICBnZXRBUElQYXRoOiBmdW5jdGlvbiAoYXBpKSB7XG4gICAgICAgICAgICB2YXIgUFJPSkVDVF9BUElTID0gWydydW4nLCAnZGF0YSddO1xuICAgICAgICAgICAgdmFyIGFwaVBhdGggPSB0aGlzLnByb3RvY29sICsgJzovLycgKyB0aGlzLmhvc3QgKyAnLycgKyBhcGkgKyAnLyc7XG5cbiAgICAgICAgICAgIGlmICgkLmluQXJyYXkoYXBpLCBQUk9KRUNUX0FQSVMpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGFwaVBhdGggKz0gdGhpcy5hY2NvdW50UGF0aCArICcvJyArIHRoaXMucHJvamVjdFBhdGggICsgJy8nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFwaVBhdGg7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQocHVibGljRXhwb3J0cywgY29uZmlnKTtcbiAgICByZXR1cm4gcHVibGljRXhwb3J0cztcbn07XG4iLCIvKipcbiAqXG4gKiAjI1ZhcmlhYmxlcyBBUEkgU2VydmljZVxuICpcbiAqIFVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCB0aGUgW1J1biBBUEkgU2VydmljZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLykgdG8gcmVhZCwgd3JpdGUsIGFuZCBzZWFyY2ggZm9yIHNwZWNpZmljIG1vZGVsIHZhcmlhYmxlcy5cbiAqXG4gKiAgICAgdmFyIHJtID0gbmV3IEYubWFuYWdlci5SdW5NYW5hZ2VyKHtcbiAqICAgICAgICAgICBydW46IHtcbiAqICAgICAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICogICAgICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICogICAgICAgICAgICAgICBtb2RlbDogJ3N1cHBseS1jaGFpbi1tb2RlbC5qbCdcbiAqICAgICAgICAgICB9XG4gKiAgICAgIH0pO1xuICogICAgIHJtLmdldFJ1bigpXG4gKiAgICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAqICAgICAgICAgIHZhciB2cyA9IHJtLnJ1bi52YXJpYWJsZXMoKTtcbiAqICAgICAgICAgIHZzLnNhdmUoe3NhbXBsZV9pbnQ6IDR9KTtcbiAqICAgICAgICB9KTtcbiAqXG4gKi9cblxuXG4gJ3VzZSBzdHJpY3QnO1xuXG4gdmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcnVucyBvYmplY3QgdG8gd2hpY2ggdGhlIHZhcmlhYmxlIGZpbHRlcnMgYXBwbHkuIERlZmF1bHRzIHRvIG51bGwuXG4gICAgICAgICAqIEB0eXBlIHtydW5TZXJ2aWNlfVxuICAgICAgICAgKi9cbiAgICAgICAgcnVuU2VydmljZTogbnVsbFxuICAgIH07XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCBjb25maWcpO1xuXG4gICAgdmFyIGdldFVSTCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHNlcnZpY2VPcHRpb25zLnJ1blNlcnZpY2UudXJsQ29uZmlnLmdldEZpbHRlclVSTCgpICsgJ3ZhcmlhYmxlcy8nO1xuICAgIH07XG5cbiAgICB2YXIgaHR0cE9wdGlvbnMgPSB7XG4gICAgICAgIHVybDogZ2V0VVJMXG4gICAgfTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgaHR0cE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeShodHRwT3B0aW9ucyk7XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdmFsdWVzIGZvciBhIHZhcmlhYmxlLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIHZzLmxvYWQoJ3NhbXBsZV9pbnQnKTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGB2YXJpYWJsZWAgTmFtZSBvZiB2YXJpYWJsZSB0byBsb2FkLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG91dHB1dE1vZGlmaWVyYCAoT3B0aW9uYWwpIEF2YWlsYWJsZSBmaWVsZHMgaW5jbHVkZTogYHN0YXJ0cmVjb3JkYCwgYGVuZHJlY29yZGAsIGBzb3J0YCwgYW5kIGBkaXJlY3Rpb25gIChgYXNjYCBvciBgZGVzY2ApLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICBsb2FkOiBmdW5jdGlvbiAodmFyaWFibGUsIG91dHB1dE1vZGlmaWVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KG91dHB1dE1vZGlmaWVyLCAkLmV4dGVuZCh7fSwgaHR0cE9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICB1cmw6IGdldFVSTCgpICsgdmFyaWFibGUgKyAnLydcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyBwYXJ0aWN1bGFyIHZhcmlhYmxlcywgYmFzZWQgb24gY29uZGl0aW9ucyBzcGVjaWZpZWQgaW4gdGhlIGBxdWVyeWAgb2JqZWN0LlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIHZzLnF1ZXJ5KFsncHJpY2UnLCAnc2FsZXMnXSk7XG4gICAgICAgICAqICAgICAgdnMucXVlcnkoeyBpbmNsdWRlOlsncHJpY2UnLCAnc2FsZXMnXSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R8QXJyYXl9IGBxdWVyeWAgVGhlIG5hbWVzIG9mIHRoZSB2YXJpYWJsZXMgcmVxdWVzdGVkLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG91dHB1dE1vZGlmaWVyYCAoT3B0aW9uYWwpIEF2YWlsYWJsZSBmaWVsZHMgaW5jbHVkZTogYHN0YXJ0cmVjb3JkYCwgYGVuZHJlY29yZGAsIGBzb3J0YCwgYW5kIGBkaXJlY3Rpb25gIChgYXNjYCBvciBgZGVzY2ApLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqXG4gICAgICAgICAqL1xuICAgICAgICBxdWVyeTogZnVuY3Rpb24gKHF1ZXJ5LCBvdXRwdXRNb2RpZmllciwgb3B0aW9ucykge1xuICAgICAgICAgICAgLy9RdWVyeSBhbmQgb3V0cHV0TW9kaWZpZXIgYXJlIGJvdGggcXVlcnlzdHJpbmdzIGluIHRoZSB1cmw7IG9ubHkgY2FsbGluZyB0aGVtIG91dCBzZXBhcmF0ZWx5IGhlcmUgdG8gYmUgY29uc2lzdGVudCB3aXRoIHRoZSBvdGhlciBjYWxsc1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgaWYgKCQuaXNBcnJheShxdWVyeSkpIHtcbiAgICAgICAgICAgICAgICBxdWVyeSA9IHsgaW5jbHVkZTogcXVlcnkgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICQuZXh0ZW5kKHF1ZXJ5LCBvdXRwdXRNb2RpZmllcik7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQocXVlcnksIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2F2ZSB2YWx1ZXMgdG8gbW9kZWwgdmFyaWFibGVzLiBPdmVyd3JpdGVzIGV4aXN0aW5nIHZhbHVlcy4gTm90ZSB0aGF0IHlvdSBjYW4gb25seSB1cGRhdGUgbW9kZWwgdmFyaWFibGVzIGlmIHRoZSBydW4gaXMgW2luIG1lbW9yeV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLW1lbW9yeSkuIChBbiBhbHRlcm5hdGUgd2F5IHRvIHVwZGF0ZSBtb2RlbCB2YXJpYWJsZXMgaXMgdG8gY2FsbCBhIG1ldGhvZCBmcm9tIHRoZSBtb2RlbCBhbmQgbWFrZSBzdXJlIHRoYXQgdGhlIG1ldGhvZCBwZXJzaXN0cyB0aGUgdmFyaWFibGVzLiBTZWUgYGRvYCwgYHNlcmlhbGAsIGFuZCBgcGFyYWxsZWxgIGluIHRoZSBbUnVuIEFQSSBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKSBmb3IgY2FsbGluZyBtZXRob2RzIGZyb20gdGhlIG1vZGVsLilcbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICB2cy5zYXZlKCdwcmljZScsIDQpO1xuICAgICAgICAgKiAgICAgIHZzLnNhdmUoeyBwcmljZTogNCwgcXVhbnRpdHk6IDUsIHByb2R1Y3RzOiBbMiwzLDRdIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdHxTdHJpbmd9IGB2YXJpYWJsZWAgQW4gb2JqZWN0IGNvbXBvc2VkIG9mIHRoZSBtb2RlbCB2YXJpYWJsZXMgYW5kIHRoZSB2YWx1ZXMgdG8gc2F2ZS4gQWx0ZXJuYXRpdmVseSwgYSBzdHJpbmcgd2l0aCB0aGUgbmFtZSBvZiB0aGUgdmFyaWFibGUuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgdmFsYCAoT3B0aW9uYWwpIElmIHBhc3NpbmcgYSBzdHJpbmcgZm9yIGB2YXJpYWJsZWAsIHVzZSB0aGlzIGFyZ3VtZW50IGZvciB0aGUgdmFsdWUgdG8gc2F2ZS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgc2F2ZTogZnVuY3Rpb24gKHZhcmlhYmxlLCB2YWwsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBhdHRycztcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFyaWFibGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgYXR0cnMgPSB2YXJpYWJsZTtcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gdmFsO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAoYXR0cnMgPSB7fSlbdmFyaWFibGVdID0gdmFsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucGF0Y2guY2FsbCh0aGlzLCBhdHRycywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTm90IEF2YWlsYWJsZSB1bnRpbCB1bmRlcmx5aW5nIEFQSSBzdXBwb3J0cyBQVVQuIE90aGVyd2lzZSBzYXZlIHdvdWxkIGJlIFBVVCBhbmQgbWVyZ2Ugd291bGQgYmUgUEFUQ0hcbiAgICAgICAgLy8gKlxuICAgICAgICAvLyAgKiBTYXZlIHZhbHVlcyB0byB0aGUgYXBpLiBNZXJnZXMgYXJyYXlzLCBidXQgb3RoZXJ3aXNlIHNhbWUgYXMgc2F2ZVxuICAgICAgICAvLyAgKiBAcGFyYW0ge09iamVjdHxTdHJpbmd9IHZhcmlhYmxlIE9iamVjdCB3aXRoIGF0dHJpYnV0ZXMsIG9yIHN0cmluZyBrZXlcbiAgICAgICAgLy8gICogQHBhcmFtIHtPYmplY3R9IHZhbCBPcHRpb25hbCBpZiBwcmV2IHBhcmFtZXRlciB3YXMgYSBzdHJpbmcsIHNldCB2YWx1ZSBoZXJlXG4gICAgICAgIC8vICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zXG4gICAgICAgIC8vICAqXG4gICAgICAgIC8vICAqIEBleGFtcGxlXG4gICAgICAgIC8vICAqICAgICB2cy5tZXJnZSh7IHByaWNlOiA0LCBxdWFudGl0eTogNSwgcHJvZHVjdHM6IFsyLDMsNF0gfSlcbiAgICAgICAgLy8gICogICAgIHZzLm1lcmdlKCdwcmljZScsIDQpO1xuXG4gICAgICAgIC8vIG1lcmdlOiBmdW5jdGlvbiAodmFyaWFibGUsIHZhbCwgb3B0aW9ucykge1xuICAgICAgICAvLyAgICAgdmFyIGF0dHJzO1xuICAgICAgICAvLyAgICAgaWYgKHR5cGVvZiB2YXJpYWJsZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgLy8gICAgICAgYXR0cnMgPSB2YXJpYWJsZTtcbiAgICAgICAgLy8gICAgICAgb3B0aW9ucyA9IHZhbDtcbiAgICAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICAgIChhdHRycyA9IHt9KVt2YXJpYWJsZV0gPSB2YWw7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgIC8vICAgICByZXR1cm4gaHR0cC5wYXRjaC5jYWxsKHRoaXMsIGF0dHJzLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIC8vIH1cbiAgICB9O1xuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiLyoqXG4gKiAjI1dvcmxkIEFQSSBBZGFwdGVyXG4gKlxuICogVGhlIFdvcmxkIEFQSSBBZGFwdGVyIGFsbG93cyB5b3UgdG8gY3JlYXRlLCBhY2Nlc3MsIGFuZCBtYW5pcHVsYXRlIG11bHRpcGxheWVyIHdvcmxkcyBpdHMgdXNlcnMgYW5kIHJ1bnNcbiAqXG4gKiBBbGwgQVBJIGNhbGxzIHRha2UgaW4gYW4gXCJvcHRpb25zXCIgb2JqZWN0IGFzIHRoZSBsYXN0IHBhcmFtZXRlci4gVGhlIG9wdGlvbnMgY2FuIGJlIHVzZWQgdG8gZXh0ZW5kL292ZXJyaWRlIHRoZSBXb3JsZCBBUEkgU2VydmljZSBkZWZhdWx0cy5cbiAqXG4gKlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIFN0b3JhZ2VGYWN0b3J5ID0gcmVxdWlyZSgnLi4vc3RvcmUvc3RvcmUtZmFjdG9yeScpO1xuLy8gdmFyIHF1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9xdWVyeS11dGlsJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG52YXIgX3BpY2sgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdC11dGlsJykuX3BpY2s7XG5cbnZhciBhcGlFbmRwb2ludCA9ICdtdWx0aXBsYXllci9nYW1lJztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIHN0b3JlID0gbmV3IFN0b3JhZ2VGYWN0b3J5KHsgc3luY2hyb25vdXM6IHRydWUgfSk7XG5cbiAgICB2YXIgZGVmYXVsdHMgPSB7XG5cbiAgICAgICB0b2tlbjogc3RvcmUuZ2V0KCdlcGljZW50ZXIucHJvamVjdC50b2tlbicpIHx8ICcnLFxuXG4gICAgICAgcHJvamVjdDogJycsXG5cbiAgICAgICBhY2NvdW50OiAnJyxcblxuICAgICAgIGdyb3VwOiAnJyxcblxuLy8gICAgICAgIGFwaUtleTogJycsXG5cbi8vICAgICAgICBkb21haW46ICdmb3Jpby5jb20nLFxuXG4gICAgICAgIC8vT3B0aW9ucyB0byBwYXNzIG9uIHRvIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBsYXllclxuICAgICAgICB0cmFuc3BvcnQ6IHt9LFxuXG4gICAgICAgIHN1Y2Nlc3M6ICQubm9vcCxcblxuICAgICAgICBlcnJvcjogJC5ub29wXG4gICAgfTtcblxuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG5cbiAgICB2YXIgdHJhbnNwb3J0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludClcbiAgICB9KTtcblxuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy50b2tlbikge1xuICAgICAgICB0cmFuc3BvcnRPcHRpb25zLmhlYWRlcnMgPSB7XG4gICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zKTtcblxuICAgIHZhciBzZXRJZEZpbHRlck9yVGhyb3dFcnJvciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmZpbHRlcikge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gb3B0aW9ucy5maWx0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFzZXJ2aWNlT3B0aW9ucy5maWx0ZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZmlsdGVyIHNwZWNpZmllZCB0byBhcHBseSBvcGVyYXRpb25zIGFnYWluc3QnKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIENyZWF0ZSBhIG5ldyBXb3JsZFxuICAgICAgICAqXG4gICAgICAgICogKiogRXhhbXBsZSAqKlxuICAgICAgICAqICAgdmFyIGdtID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7IGFjY291bnQ6ICdhY2NvdW50JywgcHJvamVjdDogJ3Byb2plY3QnIH0pO1xuICAgICAgICAqICAgZ20uY3JlYXRlKHsgbW9kZWw6ICdtb2RlbC5weScsIGdyb3VwOiAnZ3JvdXAtbmFtZScgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKiBQYXJhbWV0ZXJzICoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBwYXJhbXNgIFBhcmFtZXRlcnMgdG8gY3JlYXRlIHRoZSB3b3JsZFxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgcGFyYW1zLm1vZGVsYCBUaGUgbW9kZWwgZmlsZSB0byB1c2UgdG8gY3JlYXRlIHJ1bnMgaW4gdGhpcyB3b3JsZFxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgcGFyYW1zLmdyb3VwYCB0aGUgZ3JvdXAgX25hbWVfIHRvIGNyZWF0ZSB0aGlzIHdvcmxkIHVuZGVyXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGBwYXJhbXMucm9sZXNgIChPcHRpb25hbCkgVGhlIGxpc3Qgb2Ygcm9sZXMgZm9yIHRoaXMgd29ybGRcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYHBhcmFtcy5vcGlvbmFsUm9sZXNgIChPcHRpb25hbCkgVGhlIGxpc3Qgb2Ygb3B0aW9uYWwgcm9sZXMgZm9yIHRoaXMgd29ybGRcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYHBhcmFtcy5taW5Vc2Vyc2AgKE9wdGlvbmFsKSBUaGUgbWluaW11bSBudW1iZXIgb2YgdXNlcnMgZm9yIHRoZSB3b3JsZFxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgb3B0aW9uc2AgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnNcbiAgICAgICAgKlxuICAgICAgICAqL1xuICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBjcmVhdGVPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zLCB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpIH0pO1xuICAgICAgICAgICAgdmFyIHdvcmxkQXBpUGFyYW1zID0gWydtb2RlbCcsICdzY29wZScsICdmaWxlcycsICdyb2xlcycsICdvcHRpb25hbFJvbGVzJywgJ21pblVzZXJzJywgJ2dyb3VwJ107XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIGp1c3QgdGhlIG1vZGVsIG5hbWVcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSB7IG1vZGVsOiBwYXJhbXMgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gd2hpdGVsaXN0IHRoZSBmaWVsZHMgdGhhdCB3ZSBhY3R1YWxseSBjYW4gc2VuZCB0byB0aGUgYXBpXG4gICAgICAgICAgICAgICAgcGFyYW1zID0gX3BpY2socGFyYW1zLCB3b3JsZEFwaVBhcmFtcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGFjY291bnQgYW5kIHByb2plY3QgZ28gaW4gdGhlIGJvZHksIG5vdCBpbiB0aGUgdXJsXG4gICAgICAgICAgICAkLmV4dGVuZChwYXJhbXMsIF9waWNrKHNlcnZpY2VPcHRpb25zLCBbJ2FjY291bnQnLCAncHJvamVjdCddKSk7XG5cbiAgICAgICAgICAgIHZhciBvbGRTdWNjZXNzID0gY3JlYXRlT3B0aW9ucy5zdWNjZXNzO1xuICAgICAgICAgICAgY3JlYXRlT3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gcmVzcG9uc2UuaWQ7IC8vYWxsIGZ1dHVyZSBjaGFpbmVkIGNhbGxzIHRvIG9wZXJhdGUgb24gdGhpcyBpZFxuICAgICAgICAgICAgICAgIHJldHVybiBvbGRTdWNjZXNzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHBhcmFtcywgY3JlYXRlT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogVXBkYXRlIGEgV29ybGQgb2JqZWN0LCBmb3IgZXhhbXBsZSB0byBhZGQgdGhlIHJvbGVzIHRvIHRoZSB3b3JsZFxuICAgICAgICAqXG4gICAgICAgICovXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHdoaXRlbGlzdCA9IFsncm9sZXMnLCAnb3B0aW9uYWxSb2xlcycsICdtaW5Vc2VycyddO1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICBzZXRJZEZpbHRlck9yVGhyb3dFcnJvcihvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIHVwZGF0ZU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcGFyYW1zID0gX3BpY2socGFyYW1zIHx8IHt9LCB3aGl0ZWxpc3QpO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wYXRjaChwYXJhbXMsIHVwZGF0ZU9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIERlbGV0ZSBhbiBleGlzdGluZyB3b3JsZFxuICAgICAgICAqXG4gICAgICAgICovXG4gICAgICAgIGRlbGV0ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBkZWxldGVPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmRlbGV0ZShudWxsLCBkZWxldGVPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBMaXN0IGFsbCB3b3JsZHMgZm9yIGEgZ2l2ZW4gYWNjb3VudC9wcm9qZWN0L2dyb3VwXG4gICAgICAgICpcbiAgICAgICAgKlxuICAgICAgICAqL1xuICAgICAgICBsaXN0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgICAgIHZhciBnZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHZhciBmaWx0ZXJzID0gX3BpY2soZ2V0T3B0aW9ucywgWydhY2NvdW50JywgJ3Byb2plY3QnLCAnZ3JvdXAnXSk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChmaWx0ZXJzLCBnZXRPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBHZXQgYWxsIHdvcmxkcyB0aGF0IGEgdXNlciBiZWxvbmdzIHRvIGZvciB0aGUgZ2l2ZW4gYWNjb3VudC9wcm9qZWN0L2dyb3VwXG4gICAgICAgICpcbiAgICAgICAgKiAqKiBQYXJhbWV0ZXJzICoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGB1c2VySWRgIC0gdXNlcklkIG9mIHRoZSB1c2VyIHlvdSBuZWVkIHRoZSB3b3JsZCBmb3JcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChvcHRpb25hbCkgLSBvdmVycmlkZXMgdG8gdGhlIGdsb2JhbCBvcHRpb25zIG9iamVjdFxuICAgICAgICAqL1xuICAgICAgICBnZXRXb3JsZHNGb3JVc2VyOiBmdW5jdGlvbiAodXNlcklkLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgdmFyIGdldE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgdmFyIGZpbHRlcnMgPSAkLmV4dGVuZChcbiAgICAgICAgICAgICAgICBfcGljayhnZXRPcHRpb25zLCBbJ2FjY291bnQnLCAncHJvamVjdCcsICdncm91cCddKSxcbiAgICAgICAgICAgICAgICB7IHVzZXJJZDogdXNlcklkIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChmaWx0ZXJzLCBnZXRPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBBZGQgYSB1c2VyIG9yIGxpc3Qgb2YgdXNlcnMgdG8gYSBnaXZlbiB3b3JsZFxuICAgICAgICAqXG4gICAgICAgICovXG4gICAgICAgIGFkZFVzZXJzOiBmdW5jdGlvbiAodXNlcnMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICBzZXRJZEZpbHRlck9yVGhyb3dFcnJvcihvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIHVwZGF0ZU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgKyAnL3VzZXJzJyB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHVzZXJzLCB1cGRhdGVPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBSZW1vdmUgYSB1c2VyIGZyb20gYSBnaXZlbiB3b3JsZFxuICAgICAgICAqXG4gICAgICAgICovXG4gICAgICAgIHJlbW92ZVVzZXI6IGZ1bmN0aW9uICh1c2VySWQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICBzZXRJZEZpbHRlck9yVGhyb3dFcnJvcihvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIGdldE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgKyAnL3VzZXJzLycgKyB1c2VySWQgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZGVsZXRlKG51bGwsIGdldE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEdldCdzIChvciBjcmVhdGVzKSB0aGUgY3VycmVudCBydW4gZm9yIHRoZSBnaXZlbiB3b3JsZFxuICAgICAgICAqXG4gICAgICAgICovXG4gICAgICAgIGdldEN1cnJlbnRSdW5JZDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICBzZXRJZEZpbHRlck9yVGhyb3dFcnJvcihvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIGdldE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgKyAnL3J1bicgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChudWxsLCBnZXRPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBHZXQncyB0aGUgY3VycmVudCAobGF0ZXN0KSB3b3JsZCBmb3IgdGhlIGdpdmVuIHVzZXIgYXQgdGhlIGdpdmVuIGdyb3VwXG4gICAgICAgICpcbiAgICAgICAgKi9cbiAgICAgICAgZ2V0Q3VycmVudFdvcmxkRm9yVXNlcjogZnVuY3Rpb24gKHVzZXJJZCwgZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICB2YXIgZHRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgICAgIHRoaXMuZ2V0V29ybGRzRm9yVXNlcih1c2VySWQsIHsgZ3JvdXA6IGdyb3VwTmFtZSB9KVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICh3b3JsZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYXNzdW1lIHRoZSBtb3N0IHJlY2VudCB3b3JsZCBhcyB0aGUgJ2FjdGl2ZScgd29ybGRcbiAgICAgICAgICAgICAgICAgICAgd29ybGRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIG5ldyBEYXRlKGIubGFzdE1vZGlmaWVkKSAtIG5ldyBEYXRlKGEubGFzdE1vZGlmaWVkKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50V29ybGQgPSB3b3JsZHNbMF07XG4gICAgICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlKGN1cnJlbnRXb3JsZCwgbWUpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZhaWwoZHRkLnJlamVjdCk7XG5cbiAgICAgICAgICAgIHJldHVybiBkdGQucHJvbWlzZSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIERlbGV0ZSdzIHRoZSBjdXJyZW50IHJ1biBmcm9tIHRoZSB3b3JsZFxuICAgICAgICAqXG4gICAgICAgICovXG4gICAgICAgIGRlbGV0ZVJ1bjogZnVuY3Rpb24gKHdvcmxkSWQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm90IGltcGxlbWVudGVkJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbmV3UnVuRm9yV29ybGQ6IGZ1bmN0aW9uICh3b3JsZElkLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kZWxldGVSdW4od29ybGRJZClcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEN1cnJlbnRSdW5JZCh7IGZpbHRlcjogd29ybGRJZCB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIi8qKlxuICogQGNsYXNzIENvb2tpZSBTdG9yYWdlIFNlcnZpY2VcbiAqXG4gKiBAZXhhbXBsZVxuICogICAgICB2YXIgcGVvcGxlID0gcmVxdWlyZSgnY29va2llLXN0b3JlJykoeyByb290OiAncGVvcGxlJyB9KTtcbiAgICAgICAgcGVvcGxlXG4gICAgICAgICAgICAuc2F2ZSh7bGFzdE5hbWU6ICdzbWl0aCcgfSlcblxuICovXG5cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOYW1lIG9mIGNvbGxlY3Rpb25cbiAgICAgICAgICogQHR5cGUgeyBzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICByb290OiAnLycsXG5cbiAgICAgICAgZG9tYWluOiAnLmZvcmlvLmNvbSdcbiAgICB9O1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG4gICAgICAgIC8vICogVEJEXG4gICAgICAgIC8vICAqIFF1ZXJ5IGNvbGxlY3Rpb247IHVzZXMgTW9uZ29EQiBzeW50YXhcbiAgICAgICAgLy8gICogQHNlZSAgPFRCRDogRGF0YSBBUEkgVVJMPlxuICAgICAgICAvLyAgKlxuICAgICAgICAvLyAgKiBAcGFyYW0geyBzdHJpbmd9IHFzIFF1ZXJ5IEZpbHRlclxuICAgICAgICAvLyAgKiBAcGFyYW0geyBzdHJpbmd9IGxpbWl0ZXJzIEBzZWUgPFRCRDogdXJsIGZvciBsaW1pdHMsIHBhZ2luZyBldGM+XG4gICAgICAgIC8vICAqXG4gICAgICAgIC8vICAqIEBleGFtcGxlXG4gICAgICAgIC8vICAqICAgICBjcy5xdWVyeShcbiAgICAgICAgLy8gICogICAgICB7IG5hbWU6ICdKb2huJywgY2xhc3NOYW1lOiAnQ1NDMTAxJyB9LFxuICAgICAgICAvLyAgKiAgICAgIHtsaW1pdDogMTB9XG4gICAgICAgIC8vICAqICAgICApXG5cbiAgICAgICAgLy8gcXVlcnk6IGZ1bmN0aW9uIChxcywgbGltaXRlcnMpIHtcblxuICAgICAgICAvLyB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTYXZlIGNvb2tpZSB2YWx1ZVxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfE9iamVjdH0ga2V5ICAgSWYgZ2l2ZW4gYSBrZXkgc2F2ZSB2YWx1ZXMgdW5kZXIgaXQsIGlmIGdpdmVuIGFuIG9iamVjdCBkaXJlY3RseSwgc2F2ZSB0byB0b3AtbGV2ZWwgYXBpXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gdmFsdWUgKE9wdGlvbmFsKVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBPdmVycmlkZXMgZm9yIHNlcnZpY2Ugb3B0aW9uc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJuIHsqfSBUaGUgc2F2ZWQgdmFsdWVcbiAgICAgICAgICpcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogICAgIGNzLnNldCgncGVyc29uJywgeyBmaXJzdE5hbWU6ICdqb2huJywgbGFzdE5hbWU6ICdzbWl0aCcgfSk7XG4gICAgICAgICAqICAgICBjcy5zZXQoeyBuYW1lOidzbWl0aCcsIGFnZTonMzInIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHNldE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgZG9tYWluID0gc2V0T3B0aW9ucy5kb21haW47XG4gICAgICAgICAgICB2YXIgcGF0aCA9IHNldE9wdGlvbnMucm9vdDtcblxuICAgICAgICAgICAgZG9jdW1lbnQuY29va2llID0gZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyAnPScgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGRvbWFpbiA/ICc7IGRvbWFpbj0nICsgZG9tYWluIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHBhdGggPyAnOyBwYXRoPScgKyBwYXRoIDogJycpO1xuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExvYWQgY29va2llIHZhbHVlXG4gICAgICAgICAqIEBwYXJhbSAgeyBzdHJpbmd8T2JqZWN0fSBrZXkgICBJZiBnaXZlbiBhIGtleSBzYXZlIHZhbHVlcyB1bmRlciBpdCwgaWYgZ2l2ZW4gYW4gb2JqZWN0IGRpcmVjdGx5LCBzYXZlIHRvIHRvcC1sZXZlbCBhcGlcbiAgICAgICAgICogQHJldHVybiB7Kn0gVGhlIHZhbHVlIHN0b3JlZFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiAgICAgY3MuZ2V0KCdwZXJzb24nKTtcbiAgICAgICAgICovXG4gICAgICAgIGdldDogZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgdmFyIGNvb2tpZVJlZyA9IG5ldyBSZWdFeHAoJyg/Oig/Ol58Lio7KVxcXFxzKicgKyBlbmNvZGVVUklDb21wb25lbnQoa2V5KS5yZXBsYWNlKC9bXFwtXFwuXFwrXFwqXS9nLCAnXFxcXCQmJykgKyAnXFxcXHMqXFxcXD1cXFxccyooW147XSopLiokKXxeLiokJyk7XG4gICAgICAgICAgICB2YXIgdmFsID0gZG9jdW1lbnQuY29va2llLnJlcGxhY2UoY29va2llUmVnLCAnJDEnKTtcbiAgICAgICAgICAgIHZhbCA9IGRlY29kZVVSSUNvbXBvbmVudCh2YWwpIHx8IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmVzIGtleSBmcm9tIGNvbGxlY3Rpb25cbiAgICAgICAgICogQHBhcmFtIHsgc3RyaW5nfSBrZXkga2V5IHRvIHJlbW92ZVxuICAgICAgICAgKiBAcmV0dXJuIHsgc3RyaW5nfSBrZXkgVGhlIGtleSByZW1vdmVkXG4gICAgICAgICAqXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqICAgICBjcy5yZW1vdmUoJ3BlcnNvbicpO1xuICAgICAgICAgKi9cbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbiAoa2V5LCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgcmVtT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBkb21haW4gPSByZW1PcHRpb25zLmRvbWFpbjtcbiAgICAgICAgICAgIHZhciBwYXRoID0gcmVtT3B0aW9ucy5yb290O1xuXG4gICAgICAgICAgICBkb2N1bWVudC5jb29raWUgPSBlbmNvZGVVUklDb21wb25lbnQoa2V5KSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJz07IGV4cGlyZXM9VGh1LCAwMSBKYW4gMTk3MCAwMDowMDowMCBHTVQnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZG9tYWluID8gJzsgZG9tYWluPScgKyBkb21haW4gOiAnJykgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChwYXRoID8gJzsgcGF0aD0nICsgcGF0aCA6ICcnKTtcbiAgICAgICAgICAgIHJldHVybiBrZXk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZXMgY29sbGVjdGlvbiBiZWluZyByZWZlcmVuY2VkXG4gICAgICAgICAqIEByZXR1cm4geyBhcnJheX0ga2V5cyBBbGwgdGhlIGtleXMgcmVtb3ZlZFxuICAgICAgICAgKi9cbiAgICAgICAgZGVzdHJveTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFLZXlzID0gZG9jdW1lbnQuY29va2llLnJlcGxhY2UoLygoPzpefFxccyo7KVteXFw9XSspKD89O3wkKXxeXFxzKnxcXHMqKD86XFw9W147XSopPyg/OlxcMXwkKS9nLCAnJykuc3BsaXQoL1xccyooPzpcXD1bXjtdKik/O1xccyovKTtcbiAgICAgICAgICAgIGZvciAodmFyIG5JZHggPSAwOyBuSWR4IDwgYUtleXMubGVuZ3RoOyBuSWR4KyspIHtcbiAgICAgICAgICAgICAgICB2YXIgY29va2llS2V5ID0gZGVjb2RlVVJJQ29tcG9uZW50KGFLZXlzW25JZHhdKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZShjb29raWVLZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFLZXlzO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiLyoqXG4gKiBAY2xhc3Mgc2Vzc2lvbiBTdG9yYWdlIFNlcnZpY2VcbiAqXG4gKiAgQ29va2llIGVxdWl2YWxlbnQgZm9yIG5vZGVqc1xuICovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogTmFtZSBvZiBjb2xsZWN0aW9uXG4gICAgICAgICAqIEB0eXBlIHsgc3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcm9vdDogJy8nLFxuXG4gICAgICAgIGRvbWFpbjogJy5mb3Jpby5jb20nXG4gICAgfTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuICAgICAgICAvLyAqIFRCRFxuICAgICAgICAvLyAgKiBRdWVyeSBjb2xsZWN0aW9uOyB1c2VzIE1vbmdvREIgc3ludGF4XG4gICAgICAgIC8vICAqIEBzZWUgIDxUQkQ6IERhdGEgQVBJIFVSTD5cbiAgICAgICAgLy8gICpcbiAgICAgICAgLy8gICogQHBhcmFtIHsgc3RyaW5nfSBxcyBRdWVyeSBGaWx0ZXJcbiAgICAgICAgLy8gICogQHBhcmFtIHsgc3RyaW5nfSBsaW1pdGVycyBAc2VlIDxUQkQ6IHVybCBmb3IgbGltaXRzLCBwYWdpbmcgZXRjPlxuICAgICAgICAvLyAgKlxuICAgICAgICAvLyAgKiBAZXhhbXBsZVxuICAgICAgICAvLyAgKiAgICAgY3MucXVlcnkoXG4gICAgICAgIC8vICAqICAgICAgeyBuYW1lOiAnSm9obicsIGNsYXNzTmFtZTogJ0NTQzEwMScgfSxcbiAgICAgICAgLy8gICogICAgICB7bGltaXQ6IDEwfVxuICAgICAgICAvLyAgKiAgICAgKVxuXG4gICAgICAgIC8vIHF1ZXJ5OiBmdW5jdGlvbiAocXMsIGxpbWl0ZXJzKSB7XG5cbiAgICAgICAgLy8gfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2F2ZSBzZXNzaW9uIHZhbHVlXG4gICAgICAgICAqIEBwYXJhbSAgeyBzdHJpbmd8T2JqZWN0fSBrZXkgICBJZiBnaXZlbiBhIGtleSBzYXZlIHZhbHVlcyB1bmRlciBpdCwgaWYgZ2l2ZW4gYW4gb2JqZWN0IGRpcmVjdGx5LCBzYXZlIHRvIHRvcC1sZXZlbCBhcGlcbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSB2YWx1ZSAoT3B0aW9uYWwpXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIE92ZXJyaWRlcyBmb3Igc2VydmljZSBvcHRpb25zXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm4geyp9IFRoZSBzYXZlZCB2YWx1ZVxuICAgICAgICAgKlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiAgICAgY3Muc2V0KCdwZXJzb24nLCB7IGZpcnN0TmFtZTogJ2pvaG4nLCBsYXN0TmFtZTogJ3NtaXRoJyB9KTtcbiAgICAgICAgICogICAgIGNzLnNldCh7IG5hbWU6J3NtaXRoJywgYWdlOiczMicgfSk7XG4gICAgICAgICAqL1xuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChrZXksIHZhbHVlLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgc2V0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBkb21haW4gPSBzZXRPcHRpb25zLmRvbWFpbjtcbiAgICAgICAgICAgIHZhciBwYXRoID0gc2V0T3B0aW9ucy5yb290O1xuXG4gICAgICAgICAgICBkb2N1bWVudC5zZXNzaW9uID0gZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyAnPScgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGRvbWFpbiA/ICc7IGRvbWFpbj0nICsgZG9tYWluIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHBhdGggPyAnOyBwYXRoPScgKyBwYXRoIDogJycpO1xuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExvYWQgc2Vzc2lvbiB2YWx1ZVxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfE9iamVjdH0ga2V5ICAgSWYgZ2l2ZW4gYSBrZXkgc2F2ZSB2YWx1ZXMgdW5kZXIgaXQsIGlmIGdpdmVuIGFuIG9iamVjdCBkaXJlY3RseSwgc2F2ZSB0byB0b3AtbGV2ZWwgYXBpXG4gICAgICAgICAqIEByZXR1cm4geyp9IFRoZSB2YWx1ZSBzdG9yZWRcbiAgICAgICAgICpcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogICAgIGNzLmdldCgncGVyc29uJyk7XG4gICAgICAgICAqL1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHZhciBzZXNzaW9uUmVnID0gbmV3IFJlZ0V4cCgnKD86KD86XnwuKjspXFxcXHMqJyArIGVuY29kZVVSSUNvbXBvbmVudChrZXkpLnJlcGxhY2UoL1tcXC1cXC5cXCtcXCpdL2csICdcXFxcJCYnKSArICdcXFxccypcXFxcPVxcXFxzKihbXjtdKikuKiQpfF4uKiQnKTtcbiAgICAgICAgICAgIHZhciB2YWwgPSBkb2N1bWVudC5zZXNzaW9uLnJlcGxhY2Uoc2Vzc2lvblJlZywgJyQxJyk7XG4gICAgICAgICAgICB2YWwgPSBkZWNvZGVVUklDb21wb25lbnQodmFsKSB8fCBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBrZXkgZnJvbSBjb2xsZWN0aW9uXG4gICAgICAgICAqIEBwYXJhbSB7IHN0cmluZ30ga2V5IGtleSB0byByZW1vdmVcbiAgICAgICAgICogQHJldHVybiB7IHN0cmluZ30ga2V5IFRoZSBrZXkgcmVtb3ZlZFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiAgICAgY3MucmVtb3ZlKCdwZXJzb24nKTtcbiAgICAgICAgICovXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24gKGtleSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHJlbU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgZG9tYWluID0gcmVtT3B0aW9ucy5kb21haW47XG4gICAgICAgICAgICB2YXIgcGF0aCA9IHJlbU9wdGlvbnMucm9vdDtcblxuICAgICAgICAgICAgZG9jdW1lbnQuc2Vzc2lvbiA9IGVuY29kZVVSSUNvbXBvbmVudChrZXkpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPTsgZXhwaXJlcz1UaHUsIDAxIEphbiAxOTcwIDAwOjAwOjAwIEdNVCcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChkb21haW4gPyAnOyBkb21haW49JyArIGRvbWFpbiA6ICcnKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHBhdGggPyAnOyBwYXRoPScgKyBwYXRoIDogJycpO1xuICAgICAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBjb2xsZWN0aW9uIGJlaW5nIHJlZmVyZW5jZWRcbiAgICAgICAgICogQHJldHVybiB7IGFycmF5fSBrZXlzIEFsbCB0aGUga2V5cyByZW1vdmVkXG4gICAgICAgICAqL1xuICAgICAgICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYUtleXMgPSBkb2N1bWVudC5zZXNzaW9uLnJlcGxhY2UoLygoPzpefFxccyo7KVteXFw9XSspKD89O3wkKXxeXFxzKnxcXHMqKD86XFw9W147XSopPyg/OlxcMXwkKS9nLCAnJykuc3BsaXQoL1xccyooPzpcXD1bXjtdKik/O1xccyovKTtcbiAgICAgICAgICAgIGZvciAodmFyIG5JZHggPSAwOyBuSWR4IDwgYUtleXMubGVuZ3RoOyBuSWR4KyspIHtcbiAgICAgICAgICAgICAgICB2YXIgc2Vzc2lvbktleSA9IGRlY29kZVVSSUNvbXBvbmVudChhS2V5c1tuSWR4XSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmUoc2Vzc2lvbktleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYUtleXM7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG5cbiIsIi8qKlxuICAgIERlY2lkZXMgdHlwZSBvZiBzdG9yZSB0byBwcm92aWRlXG4qL1xuXG4ndXNlIHN0cmljdCc7XG52YXIgaXNOb2RlID0gZmFsc2U7XG52YXIgc3RvcmUgPSAoaXNOb2RlKSA/IHJlcXVpcmUoJy4vc2Vzc2lvbi1zdG9yZScpIDogcmVxdWlyZSgnLi9jb29raWUtc3RvcmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBzdG9yZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHF1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWwvcXVlcnktdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcblxuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgdXJsOiAnJyxcblxuICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICBoZWFkZXJzOiB7fSxcbiAgICAgICAgc3RhdHVzQ29kZToge1xuICAgICAgICAgICAgNDA0OiAkLm5vb3BcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT05MWSBmb3Igc3RyaW5ncyBpbiB0aGUgdXJsLiBBbGwgR0VUICYgREVMRVRFIHBhcmFtcyBhcmUgcnVuIHRocm91Z2ggdGhpc1xuICAgICAgICAgKiBAdHlwZSB7W3R5cGVdIH1cbiAgICAgICAgICovXG4gICAgICAgIHBhcmFtZXRlclBhcnNlcjogcXV0aWxzLnRvUXVlcnlGb3JtYXQsXG5cbiAgICAgICAgLy8gVG8gYWxsb3cgZXBpY2VudGVyLnRva2VuIGFuZCBvdGhlciBzZXNzaW9uIGNvb2tpZXMgdG8gYmUgcGFzc2VkXG4gICAgICAgIC8vIHdpdGggdGhlIHJlcXVlc3RzXG4gICAgICAgIHhockZpZWxkczoge1xuICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHRyYW5zcG9ydE9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG5cbiAgICB2YXIgcmVzdWx0ID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcmV0dXJuICgkLmlzRnVuY3Rpb24oZCkpID8gZCgpIDogZDtcbiAgICB9O1xuXG4gICAgdmFyIGNvbm5lY3QgPSBmdW5jdGlvbiAobWV0aG9kLCBwYXJhbXMsIGNvbm5lY3RPcHRpb25zKSB7XG4gICAgICAgIHBhcmFtcyA9IHJlc3VsdChwYXJhbXMpO1xuICAgICAgICBwYXJhbXMgPSAoJC5pc1BsYWluT2JqZWN0KHBhcmFtcykgfHwgJC5pc0FycmF5KHBhcmFtcykpID8gSlNPTi5zdHJpbmdpZnkocGFyYW1zKSA6IHBhcmFtcztcblxuICAgICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCB0cmFuc3BvcnRPcHRpb25zLCBjb25uZWN0T3B0aW9ucywge1xuICAgICAgICAgICAgdHlwZTogbWV0aG9kLFxuICAgICAgICAgICAgZGF0YTogcGFyYW1zXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgQUxMT1dFRF9UT19CRV9GVU5DVElPTlMgPSBbJ2RhdGEnLCAndXJsJ107XG4gICAgICAgICQuZWFjaChvcHRpb25zLCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbih2YWx1ZSkgJiYgJC5pbkFycmF5KGtleSwgQUxMT1dFRF9UT19CRV9GVU5DVElPTlMpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnNba2V5XSA9IHZhbHVlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChvcHRpb25zLmxvZ0xldmVsICYmIG9wdGlvbnMubG9nTGV2ZWwgPT09ICdERUJVRycpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG9wdGlvbnMudXJsKTtcbiAgICAgICAgICAgIHZhciBvbGRTdWNjZXNzRm4gPSBvcHRpb25zLnN1Y2Nlc3MgfHwgJC5ub29wO1xuICAgICAgICAgICAgb3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24gKHJlc3BvbnNlLCBhamF4U3RhdHVzLCBhamF4UmVxKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIG9sZFN1Y2Nlc3NGbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBiZWZvcmVTZW5kID0gb3B0aW9ucy5iZWZvcmVTZW5kO1xuICAgICAgICBvcHRpb25zLmJlZm9yZVNlbmQgPSBmdW5jdGlvbiAoeGhyLCBzZXR0aW5ncykge1xuICAgICAgICAgICAgeGhyLnJlcXVlc3RVcmwgPSAoY29ubmVjdE9wdGlvbnMgfHwge30pLnVybDtcbiAgICAgICAgICAgIGlmIChiZWZvcmVTZW5kKSB7XG4gICAgICAgICAgICAgICAgYmVmb3JlU2VuZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiAkLmFqYXgob3B0aW9ucyk7XG4gICAgfTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG4gICAgICAgIGdldDpmdW5jdGlvbiAocGFyYW1zLCBhamF4T3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdHJhbnNwb3J0T3B0aW9ucywgYWpheE9wdGlvbnMpO1xuICAgICAgICAgICAgcGFyYW1zID0gb3B0aW9ucy5wYXJhbWV0ZXJQYXJzZXIocmVzdWx0KHBhcmFtcykpO1xuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuY2FsbCh0aGlzLCAnR0VUJywgcGFyYW1zLCBvcHRpb25zKTtcbiAgICAgICAgfSxcbiAgICAgICAgcG9zdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuYXBwbHkodGhpcywgWydwb3N0J10uY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9LFxuICAgICAgICBwYXRjaDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuYXBwbHkodGhpcywgWydwYXRjaCddLmNvbmNhdChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgfSxcbiAgICAgICAgcHV0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdC5hcHBseSh0aGlzLCBbJ3B1dCddLmNvbmNhdChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgfSxcbiAgICAgICAgZGVsZXRlOiBmdW5jdGlvbiAocGFyYW1zLCBhamF4T3B0aW9ucykge1xuICAgICAgICAgICAgLy9ERUxFVEUgZG9lc24ndCBzdXBwb3J0IGJvZHkgcGFyYW1zLCBidXQgalF1ZXJ5IHRoaW5rcyBpdCBkb2VzLlxuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdHJhbnNwb3J0T3B0aW9ucywgYWpheE9wdGlvbnMpO1xuICAgICAgICAgICAgcGFyYW1zID0gb3B0aW9ucy5wYXJhbWV0ZXJQYXJzZXIocmVzdWx0KHBhcmFtcykpO1xuICAgICAgICAgICAgaWYgKCQudHJpbShwYXJhbXMpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlbGltaXRlciA9IChyZXN1bHQob3B0aW9ucy51cmwpLmluZGV4T2YoJz8nKSA9PT0gLTEpID8gJz8nIDogJyYnO1xuICAgICAgICAgICAgICAgIG9wdGlvbnMudXJsID0gcmVzdWx0KG9wdGlvbnMudXJsKSArIGRlbGltaXRlciArIHBhcmFtcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0LmNhbGwodGhpcywgJ0RFTEVURScsIG51bGwsIG9wdGlvbnMpO1xuICAgICAgICB9LFxuICAgICAgICBoZWFkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdC5hcHBseSh0aGlzLCBbJ2hlYWQnXS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9wdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0LmFwcGx5KHRoaXMsIFsnb3B0aW9ucyddLmNvbmNhdChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc05vZGUgPSBmYWxzZTtcbnZhciB0cmFuc3BvcnQgPSAoaXNOb2RlKSA/IHJlcXVpcmUoJy4vbm9kZS1odHRwLXRyYW5zcG9ydCcpIDogcmVxdWlyZSgnLi9hamF4LWh0dHAtdHJhbnNwb3J0Jyk7XG5tb2R1bGUuZXhwb3J0cyA9IHRyYW5zcG9ydDtcbiIsbnVsbCwiLyoqXG4vKiBJbmhlcml0IGZyb20gYSBjbGFzcyAodXNpbmcgcHJvdG90eXBlIGJvcnJvd2luZylcbiovXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGluaGVyaXQoQywgUCkge1xuICAgIHZhciBGID0gZnVuY3Rpb24gKCkge307XG4gICAgRi5wcm90b3R5cGUgPSBQLnByb3RvdHlwZTtcbiAgICBDLnByb3RvdHlwZSA9IG5ldyBGKCk7XG4gICAgQy5fX3N1cGVyID0gUC5wcm90b3R5cGU7XG4gICAgQy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDO1xufVxuXG4vKipcbiogU2hhbGxvdyBjb3B5IG9mIGFuIG9iamVjdFxuKi9cbnZhciBleHRlbmQgPSBmdW5jdGlvbiAoZGVzdCAvKiwgdmFyX2FyZ3MqLykge1xuICAgIHZhciBvYmogPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHZhciBjdXJyZW50O1xuICAgIGZvciAodmFyIGogPSAwOyBqPG9iai5sZW5ndGg7IGorKykge1xuICAgICAgICBpZiAoIShjdXJyZW50ID0gb2JqW2pdKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBkbyBub3Qgd3JhcCBpbm5lciBpbiBkZXN0Lmhhc093blByb3BlcnR5IG9yIGJhZCB0aGluZ3Mgd2lsbCBoYXBwZW5cbiAgICAgICAgLypqc2hpbnQgLVcwODkgKi9cbiAgICAgICAgZm9yICh2YXIga2V5IGluIGN1cnJlbnQpIHtcbiAgICAgICAgICAgIGRlc3Rba2V5XSA9IGN1cnJlbnRba2V5XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZXN0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYmFzZSwgcHJvcHMsIHN0YXRpY1Byb3BzKSB7XG4gICAgdmFyIHBhcmVudCA9IGJhc2U7XG4gICAgdmFyIGNoaWxkO1xuXG4gICAgY2hpbGQgPSBwcm9wcyAmJiBwcm9wcy5oYXNPd25Qcm9wZXJ0eSgnY29uc3RydWN0b3InKSA/IHByb3BzLmNvbnN0cnVjdG9yIDogZnVuY3Rpb24gKCkgeyByZXR1cm4gcGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH07XG5cbiAgICAvLyBhZGQgc3RhdGljIHByb3BlcnRpZXMgdG8gdGhlIGNoaWxkIGNvbnN0cnVjdG9yIGZ1bmN0aW9uXG4gICAgZXh0ZW5kKGNoaWxkLCBwYXJlbnQsIHN0YXRpY1Byb3BzKTtcblxuICAgIC8vIGFzc29jaWF0ZSBwcm90b3R5cGUgY2hhaW5cbiAgICBpbmhlcml0KGNoaWxkLCBwYXJlbnQpO1xuXG4gICAgLy8gYWRkIGluc3RhbmNlIHByb3BlcnRpZXNcbiAgICBpZiAocHJvcHMpIHtcbiAgICAgICAgZXh0ZW5kKGNoaWxkLnByb3RvdHlwZSwgcHJvcHMpO1xuICAgIH1cblxuICAgIC8vIGRvbmVcbiAgICByZXR1cm4gY2hpbGQ7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuLypqc2hpbnQgbG9vcGZ1bmM6ZmFsc2UgKi9cblxuZnVuY3Rpb24gX3codmFsKSB7XG4gICAgaWYgKHZhbCAmJiB2YWwudGhlbikge1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH1cbiAgICB2YXIgcCA9ICQuRGVmZXJyZWQoKTtcbiAgICBwLnJlc29sdmUodmFsKTtcblxuICAgIHJldHVybiBwLnByb21pc2UoKTtcbn1cblxuZnVuY3Rpb24gc2VxKCkge1xuICAgIHZhciBsaXN0ID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGFyZ3VtZW50cyk7XG5cbiAgICBmdW5jdGlvbiBuZXh0KHApIHtcbiAgICAgICAgdmFyIGN1ciA9IGxpc3Quc3BsaWNlKDAsMSlbMF07XG5cbiAgICAgICAgaWYgKCFjdXIpIHtcbiAgICAgICAgICAgIHJldHVybiBwO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIF93KGN1cihwKSkudGhlbihuZXh0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKHNlZWQpIHtcbiAgICAgICAgcmV0dXJuIG5leHQoc2VlZCkuZmFpbChzZXEuZmFpbCk7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gTWFrZVNlcShvYmopIHtcbiAgICB2YXIgcmVzID0ge1xuICAgICAgICBfX2NhbGxzOiBbXSxcblxuICAgICAgICBvcmlnaW5hbDogb2JqLFxuXG4gICAgICAgIHRoZW46IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgdGhpcy5fX2NhbGxzLnB1c2goZm4pO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgICAgIC8vIGNsZWFuIHVwXG4gICAgICAgICAgICB0aGlzLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgICAgIF90aGlzLl9fY2FsbHMubGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBzZXEuYXBwbHkobnVsbCwgdGhpcy5fX2NhbGxzKSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZhaWw6IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgc2VxLmZhaWwgPSBmbjtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBmdW5jTWFrZXIgPSBmdW5jdGlvbiAocCwgb2JqKSB7XG4gICAgICAgIHZhciBmbiA9IG9ialtwXS5iaW5kKG9iaik7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShhcmd1bWVudHMpO1xuICAgICAgICAgICAgdGhpcy5fX2NhbGxzLnB1c2goRnVuY3Rpb24uYmluZC5hcHBseShmbiwgW251bGxdLmNvbmNhdChhcmdzKSkpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqW3Byb3BdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXNbcHJvcF0gPSBmdW5jTWFrZXIocHJvcCwgb2JqKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc1twcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWFrZVNlcTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgX3BpY2s6IGZ1bmN0aW9uIChvYmosIHByb3BzKSB7XG4gICAgICAgIHZhciByZXMgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgcCBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmIChwcm9wcy5pbmRleE9mKHApICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJlc1twXSA9IG9ialtwXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxufTtcbiIsIi8qKlxuICogVXRpbGl0aWVzIGZvciB3b3JraW5nIHdpdGggcXVlcnkgc3RyaW5nc1xuKi9cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbnZlcnRzIHRvIG1hdHJpeCBmb3JtYXRcbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBxcyBPYmplY3QgdG8gY29udmVydCB0byBxdWVyeSBzdHJpbmdcbiAgICAgICAgICogQHJldHVybiB7IHN0cmluZ30gICAgTWF0cml4LWZvcm1hdCBxdWVyeSBwYXJhbWV0ZXJzXG4gICAgICAgICAqL1xuICAgICAgICB0b01hdHJpeEZvcm1hdDogZnVuY3Rpb24gKHFzKSB7XG4gICAgICAgICAgICBpZiAocXMgPT09IG51bGwgfHwgcXMgPT09IHVuZGVmaW5lZCB8fCBxcyA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJzsnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBxcyA9PT0gJ3N0cmluZycgfHwgcXMgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciByZXR1cm5BcnJheSA9IFtdO1xuICAgICAgICAgICAgdmFyIE9QRVJBVE9SUyA9IFsnPCcsICc+JywgJyEnXTtcbiAgICAgICAgICAgICQuZWFjaChxcywgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyB8fCAkLmluQXJyYXkoJC50cmltKHZhbHVlKS5jaGFyQXQoMCksIE9QRVJBVE9SUykgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gJz0nICsgdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybkFycmF5LnB1c2goa2V5ICsgdmFsdWUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHZhciBtdHJ4ID0gJzsnICsgcmV0dXJuQXJyYXkuam9pbignOycpO1xuICAgICAgICAgICAgcmV0dXJuIG10cng7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbnZlcnRzIHN0cmluZ3MvYXJyYXlzL29iamVjdHMgdG8gdHlwZSAnYT1iJmI9YydcbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xBcnJheXxPYmplY3R9IHFzXG4gICAgICAgICAqIEByZXR1cm4geyBzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0b1F1ZXJ5Rm9ybWF0OiBmdW5jdGlvbiAocXMpIHtcbiAgICAgICAgICAgIGlmIChxcyA9PT0gbnVsbCB8fCBxcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBxcyA9PT0gJ3N0cmluZycgfHwgcXMgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciByZXR1cm5BcnJheSA9IFtdO1xuICAgICAgICAgICAgJC5lYWNoKHFzLCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICgkLmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuam9pbignLCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAvL01vc3RseSBmb3IgZGF0YSBhcGlcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybkFycmF5LnB1c2goa2V5ICsgJz0nICsgdmFsdWUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHZhciByZXN1bHQgPSByZXR1cm5BcnJheS5qb2luKCcmJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb252ZXJ0cyBzdHJpbmdzIG9mIHR5cGUgJ2E9YiZiPWMnIHRvIHsgYTpiLCBiOmN9XG4gICAgICAgICAqIEBwYXJhbSAgeyBzdHJpbmd9IHFzXG4gICAgICAgICAqIEByZXR1cm4ge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHFzVG9PYmplY3Q6IGZ1bmN0aW9uIChxcykge1xuICAgICAgICAgICAgaWYgKHFzID09PSBudWxsIHx8IHFzID09PSB1bmRlZmluZWQgfHwgcXMgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcXNBcnJheSA9IHFzLnNwbGl0KCcmJyk7XG4gICAgICAgICAgICB2YXIgcmV0dXJuT2JqID0ge307XG4gICAgICAgICAgICAkLmVhY2gocXNBcnJheSwgZnVuY3Rpb24gKGluZGV4LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBxS2V5ID0gdmFsdWUuc3BsaXQoJz0nKVswXTtcbiAgICAgICAgICAgICAgICB2YXIgcVZhbCA9IHZhbHVlLnNwbGl0KCc9JylbMV07XG5cbiAgICAgICAgICAgICAgICBpZiAocVZhbC5pbmRleE9mKCcsJykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHFWYWwgPSBxVmFsLnNwbGl0KCcsJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuT2JqW3FLZXldID0gcVZhbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuT2JqO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOb3JtYWxpemVzIGFuZCBtZXJnZXMgc3RyaW5ncyBvZiB0eXBlICdhPWInLCB7IGI6Y30gdG8geyBhOmIsIGI6Y31cbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xBcnJheXxPYmplY3R9IHFzMVxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfEFycmF5fE9iamVjdH0gcXMyXG4gICAgICAgICAqIEByZXR1cm4ge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIG1lcmdlUVM6IGZ1bmN0aW9uIChxczEsIHFzMikge1xuICAgICAgICAgICAgdmFyIG9iajEgPSB0aGlzLnFzVG9PYmplY3QodGhpcy50b1F1ZXJ5Rm9ybWF0KHFzMSkpO1xuICAgICAgICAgICAgdmFyIG9iajIgPSB0aGlzLnFzVG9PYmplY3QodGhpcy50b1F1ZXJ5Rm9ybWF0KHFzMikpO1xuICAgICAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHt9LCBvYmoxLCBvYmoyKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGRUcmFpbGluZ1NsYXNoOiBmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgICAgICBpZiAoIXVybCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAodXJsLmNoYXJBdCh1cmwubGVuZ3RoIC0gMSkgPT09ICcvJykgPyB1cmwgOiAodXJsICsgJy8nKTtcbiAgICAgICAgfVxuICAgIH07XG59KCkpO1xuXG5cblxuIiwiLyoqXG4gKiBVdGlsaXRpZXMgZm9yIHdvcmtpbmcgd2l0aCB0aGUgcnVuIHNlcnZpY2VcbiovXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogcmV0dXJucyBvcGVyYXRpb25zIG9mIHRoZSBmb3JtIFtbb3AxLG9wMl0sIFthcmcxLCBhcmcyXV1cbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fEFycmF5fFN0cmluZ30gb3BlcmF0aW9ucyBvcGVyYXRpb25zIHRvIHBlcmZvcm1cbiAgICAgICAgICogQHBhcmFtICB7IGFycmF5fSBhcnVnbWVudHMgZm9yIG9wZXJhdGlvblxuICAgICAgICAgKiBAcmV0dXJuIHsgc3RyaW5nfSAgICBNYXRyaXgtZm9ybWF0IHF1ZXJ5IHBhcmFtZXRlcnNcbiAgICAgICAgICovXG4gICAgICAgIG5vcm1hbGl6ZU9wZXJhdGlvbnM6IGZ1bmN0aW9uIChvcGVyYXRpb25zLCBhcmdzKSB7XG4gICAgICAgICAgICBpZiAoIWFyZ3MpIHtcbiAgICAgICAgICAgICAgICBhcmdzID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcmV0dXJuTGlzdCA9IHtcbiAgICAgICAgICAgICAgICBvcHM6IFtdLFxuICAgICAgICAgICAgICAgIGFyZ3M6IFtdXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgX2NvbmNhdCA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGFyciAhPT0gbnVsbCAmJiBhcnIgIT09IHVuZGVmaW5lZCkgPyBbXS5jb25jYXQoYXJyKSA6IFtdO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy97IGFkZDogWzEsMl0sIHN1YnRyYWN0OiBbMiw0XSB9XG4gICAgICAgICAgICB2YXIgX25vcm1hbGl6ZVBsYWluT2JqZWN0cyA9IGZ1bmN0aW9uIChvcGVyYXRpb25zLCByZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybkxpc3QgPSB7IG9wczogW10sIGFyZ3M6IFtdIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICQuZWFjaChvcGVyYXRpb25zLCBmdW5jdGlvbiAob3BuLCBhcmcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuTGlzdC5vcHMucHVzaChvcG4pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5MaXN0LmFyZ3MucHVzaChfY29uY2F0KGFyZykpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXR1cm5MaXN0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8veyBuYW1lOiAnYWRkJywgcGFyYW1zOiBbMV0gfVxuICAgICAgICAgICAgdmFyIF9ub3JtYWxpemVTdHJ1Y3R1cmVkT2JqZWN0cyA9IGZ1bmN0aW9uIChvcGVyYXRpb24sIHJldHVybkxpc3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXJldHVybkxpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuTGlzdCA9IHsgb3BzOiBbXSwgYXJnczogW10gfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuTGlzdC5vcHMucHVzaChvcGVyYXRpb24ubmFtZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuTGlzdC5hcmdzLnB1c2goX2NvbmNhdChvcGVyYXRpb24ucGFyYW1zKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldHVybkxpc3Q7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgX25vcm1hbGl6ZU9iamVjdCA9IGZ1bmN0aW9uIChvcGVyYXRpb24sIHJldHVybkxpc3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKChvcGVyYXRpb24ubmFtZSkgPyBfbm9ybWFsaXplU3RydWN0dXJlZE9iamVjdHMgOiBfbm9ybWFsaXplUGxhaW5PYmplY3RzKShvcGVyYXRpb24sIHJldHVybkxpc3QpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIF9ub3JtYWxpemVMaXRlcmFscyA9IGZ1bmN0aW9uIChvcGVyYXRpb24sIGFyZ3MsIHJldHVybkxpc3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXJldHVybkxpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuTGlzdCA9IHsgb3BzOiBbXSwgYXJnczogW10gfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuTGlzdC5vcHMucHVzaChvcGVyYXRpb24pO1xuICAgICAgICAgICAgICAgIHJldHVybkxpc3QuYXJncy5wdXNoKF9jb25jYXQoYXJncykpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXR1cm5MaXN0O1xuICAgICAgICAgICAgfTtcblxuXG4gICAgICAgICAgICB2YXIgX25vcm1hbGl6ZUFycmF5cyA9IGZ1bmN0aW9uIChvcGVyYXRpb25zLCBhcmcsIHJldHVybkxpc3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXJldHVybkxpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuTGlzdCA9IHsgb3BzOiBbXSwgYXJnczogW10gfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJC5lYWNoKG9wZXJhdGlvbnMsIGZ1bmN0aW9uIChpbmRleCwgb3BuKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3Qob3BuKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX25vcm1hbGl6ZU9iamVjdChvcG4sIHJldHVybkxpc3QpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgX25vcm1hbGl6ZUxpdGVyYWxzKG9wbiwgYXJnc1tpbmRleF0sIHJldHVybkxpc3QpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldHVybkxpc3Q7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KG9wZXJhdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgX25vcm1hbGl6ZU9iamVjdChvcGVyYXRpb25zLCByZXR1cm5MaXN0KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoJC5pc0FycmF5KG9wZXJhdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgX25vcm1hbGl6ZUFycmF5cyhvcGVyYXRpb25zLCBhcmdzLCByZXR1cm5MaXN0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgX25vcm1hbGl6ZUxpdGVyYWxzKG9wZXJhdGlvbnMsIGFyZ3MsIHJldHVybkxpc3QpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuTGlzdDtcbiAgICAgICAgfVxuICAgIH07XG59KCkpO1xuIl19
