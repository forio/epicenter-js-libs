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
  if (type === 'number')
    length = +subject
  else if (type === 'string') {
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
  var charsWritten = blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length, 2)
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

function blitBuffer (src, dst, offset, length, unitSize) {
  if (unitSize) length -= length % unitSize
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
(function (global){
/**
 * Epicenter Javascript libraries
 * v1.6.1
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
F.service.File = require('./service/admin-file-api');
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

F.version = '1.6.1';


global.F = F;
module.exports = F;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./managers/auth-manager":6,"./managers/epicenter-channel-manager":8,"./managers/run-manager":10,"./managers/run-strategies/always-new-strategy":11,"./managers/run-strategies/conditional-creation-strategy":12,"./managers/run-strategies/identity-strategy":13,"./managers/run-strategies/new-if-initialized-strategy":15,"./managers/run-strategies/new-if-missing-strategy":16,"./managers/run-strategies/new-if-persisted-strategy":17,"./managers/scenario-manager":20,"./managers/world-manager":22,"./service/admin-file-api":23,"./service/asset-api-adapter":24,"./service/auth-api-service":25,"./service/channel-service":26,"./service/configuration-service":27,"./service/data-api-service":28,"./service/member-api-adapter":29,"./service/run-api-service":30,"./service/state-api-adapter":31,"./service/url-config-service":32,"./service/user-api-adapter":33,"./service/variables-api-service":34,"./service/world-api-adapter":35,"./store/cookie-store":36,"./store/store-factory":37,"./transport/ajax-http-transport":38,"./transport/http-transport-factory":39,"./util/inherit":40,"./util/make-sequence":41,"./util/query-util":43,"./util/run-util":44}],6:[function(require,module,exports){
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
var store;
var token;
var session;

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

    var urlConfig = new ConfigService(this.options).get('server');
    if (!this.options.account) {
        this.options.account = urlConfig.accountPath;
    }

    // null might specified to disable project filtering
    if (this.options.project === undefined) {
        this.options.project = urlConfig.projectPath;
    }

    store = new StorageFactory(this.options.store);
    session = getSession();
    token = store.get(EPI_COOKIE_KEY) || '';
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
        return getSession(options);
    }
});

module.exports = AuthManager;

},{"../service/auth-api-service":25,"../service/configuration-service":27,"../service/member-api-adapter":29,"../store/store-factory":37,"./key-names":9,"buffer":1}],7:[function(require,module,exports){
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

},{"../service/channel-service":26}],8:[function(require,module,exports){
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

},{"../service/url-config-service":32,"../util/inherit":40,"./auth-manager":6,"./channel-manager":7}],9:[function(require,module,exports){
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
* Underlying Epicenter APIs -- including the [Model Run API](../../../rest_apis/other_apis/model_apis/run/), the [Run API](../../../rest_apis/aggregate_run_api), and Epicenter.js's own [F.service.Run.create()](../run-api-service/) -- all allow you to create new runs. However, for some projects it makes more sense to pick up where the user left off, using an existing run. And in some projects, whether to create a new one or use an existing one is conditional, for example based on characteristics of the existing run or your own knowledge about the model. The Run Manager provides this level of control.
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
*       * `files`: (optional) If and only if you are using a Vensim model and you have additional data to pass in to your model, you can pass a `files` object with the names of the files, for example: `"files": {"data": "myExtraData.xls"}`. (Note that you'll also need to add this same files object to your Vensim [configuration file](../../../model_code/vensim/).) See the [underlying Model Run API](../../../rest_apis/other_apis/model_apis/run/#post-creating-a-new-run-for-this-project) for additional information.
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

},{"../service/run-api-service":30,"./run-strategies/strategies-map":19,"./special-operations":21}],11:[function(require,module,exports){
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

},{"../../util/inherit":40,"./conditional-creation-strategy":12}],12:[function(require,module,exports){
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

    reset: function (runServiceOptions) {
        var _this = this;
        var userSession = this._auth.getCurrentUserSessionInfo();
        var opt = $.extend({
            scope: { group: userSession.groupId }
        }, this.runOptions);

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

},{"../../service/url-config-service":32,"../../store/store-factory":37,"../../util/inherit":40,"../../util/make-sequence":41,"../auth-manager":6,"../key-names":9,"./identity-strategy":13}],13:[function(require,module,exports){
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

},{"../../util/inherit":40}],14:[function(require,module,exports){
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

},{"../../service/world-api-adapter":35,"../../util/inherit":40,"../auth-manager":6,"./identity-strategy":13}],15:[function(require,module,exports){
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

},{"../../util/inherit":40,"./conditional-creation-strategy":12}],16:[function(require,module,exports){
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

},{"../../util/inherit":40,"./conditional-creation-strategy":12}],17:[function(require,module,exports){
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

},{"../../util/inherit":40,"./conditional-creation-strategy":12}],18:[function(require,module,exports){
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

},{"../../service/state-api-adapter":31,"../../store/store-factory":37,"../../util/inherit":40,"../auth-manager":6,"../key-names":9,"./identity-strategy":13}],19:[function(require,module,exports){
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


},{"../service/run-api-service":30}],21:[function(require,module,exports){
'use strict';


module.exports = {
    reset: function (params, options, manager) {
        return manager.reset(options);
    }
};

},{}],22:[function(require,module,exports){
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

},{"../service/world-api-adapter":35,"./auth-manager":6,"./run-manager":10}],23:[function(require,module,exports){
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
        token: store.get('epicenter.project.token') || '',

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
        getFileContents: function (fileName, folder, options) {
            var path = folder + '/' + fileName;
            var httpOptions = $.extend(true, {}, serviceOptions, options, {
                url: urlConfig.getAPIPath('file') + path
            });
            return http.get('', httpOptions);
        }
    };

    $.extend(this, publicAsyncAPI);
};

},{"../store/store-factory":37,"../transport/http-transport-factory":39,"./configuration-service":27}],24:[function(require,module,exports){
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
 *       var aa = new F.service.Asset({
 *          account: 'acme-simulations',
 *          project: 'supply-chain-game',
 *          group: 'team1',
 *          userId: ''
 *       });
 *       aa.create('test.txt', {
            encoding: 'BASE_64',
            data: 'VGhpcyBpcyBhIHRlc3QgZmlsZS4=',
            contentType: 'text/plain'
 *       }, { scope: 'user' });
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
        *       aa.create('test.txt', {
        *           encoding: 'BASE_64',
        *           data: 'VGhpcyBpcyBhIHRlc3QgZmlsZS4=',
        *           contentType: 'text/plain'
        *       }, { scope: 'user' });
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
        *       aa.replace('test.txt', {
        *           encoding: 'BASE_64',
        *           data: 'VGhpcyBpcyBhIHNlY29uZCB0ZXN0IGZpbGUu',
        *           contentType: 'text/plain'
        *       }, { scope: 'user' });
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

},{"../managers/key-names":9,"../store/store-factory":37,"../transport/http-transport-factory":39,"../util/object-util":42,"./configuration-service":27}],25:[function(require,module,exports){
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

},{"../transport/http-transport-factory":39,"./configuration-service":27}],26:[function(require,module,exports){
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

},{}],27:[function(require,module,exports){
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


},{"./url-config-service":32}],28:[function(require,module,exports){
/**
 * ##Data API Service
 *
 * The Data API Service allows you to create, access, and manipulate data related to any of your projects. Data are organized in collections. Each collection contains a document; each element of this top-level document is a JSON object. (See additional information on the underlying [Data API](../../../rest_apis/data_api/).)
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

},{"../store/store-factory":37,"../transport/http-transport-factory":39,"../util/query-util":43,"./configuration-service":27}],29:[function(require,module,exports){
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

},{"../transport/http-transport-factory":39,"../util/object-util":42,"./configuration-service":27}],30:[function(require,module,exports){
/**
 *
 * ##Run API Service
 *
 * The Run API Service allows you to perform common tasks around creating and updating runs, variables, and data.
 *
 * To use the Run API Service, instantiate it by passing in:
 *
 * * `account`: Epicenter account id (**Team ID** for team projects, **User ID** for personal projects).
 * * `project`: Epicenter project id.
 *
 * For example,
 *
 *      var rs = new F.service.Run({
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
 * The Run API Service is most useful for building an interface for a facilitator, because it makes it easy to list data across multiple runs. When building interfaces to show run one at a time (as for standard end users), typically you first instantiate a [Run Manager](../run-manager/) and then access the Run Service that is automatically part of the manager, rather than instantiating the Run Service directly.
 *
 *       var rm = new F.manager.RunManager({
 *           run: {
 *               account: 'acme-simulations',
 *               project: 'supply-chain-game',
 *               model: 'supply_chain_game.py'
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
        token: store.get('epicenter.project.token') || '',

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

},{"../store/store-factory":37,"../transport/http-transport-factory":39,"../util/object-util":42,"../util/query-util":43,"../util/run-util":44,"./configuration-service":27,"./variables-api-service":34}],31:[function(require,module,exports){
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

},{"../transport/http-transport-factory":39,"../util/object-util":42,"./configuration-service":27}],32:[function(require,module,exports){
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

        isLocalhost: function () {
            var host = window.location.host;
            return (!host || host.indexOf('local') !== -1);
        },

        getAPIPath: function (api) {
            var PROJECT_APIS = ['run', 'data', 'file'];
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

},{}],33:[function(require,module,exports){
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





},{"../transport/http-transport-factory":39,"../util/query-util":43,"./configuration-service":27}],34:[function(require,module,exports){
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

},{"../transport/http-transport-factory":39,"../util/run-util":44}],35:[function(require,module,exports){
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

},{"../store/store-factory":37,"../transport/http-transport-factory":39,"../util/object-util":42,"./configuration-service":27}],36:[function(require,module,exports){
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

},{}],37:[function(require,module,exports){
/**
    Decides type of store to provide
*/

'use strict';
// var isNode = false; FIXME: Browserify/minifyify has issues with the next link
// var store = (isNode) ? require('./session-store') : require('./cookie-store');
var store = require('./cookie-store');

module.exports = store;

},{"./cookie-store":36}],38:[function(require,module,exports){
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

},{"../util/query-util":43}],39:[function(require,module,exports){
'use strict';

// var isNode = false; FIXME: Browserify/minifyify has issues with the next link
// var transport = (isNode) ? require('./node-http-transport') : require('./ajax-http-transport');
var transport = require('./ajax-http-transport');
module.exports = transport;

},{"./ajax-http-transport":38}],40:[function(require,module,exports){
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

},{}],41:[function(require,module,exports){
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

},{}],42:[function(require,module,exports){
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

},{}],43:[function(require,module,exports){
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




},{}],44:[function(require,module,exports){
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

},{"./query-util":43}]},{},[5])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCJub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaXMtYXJyYXkvaW5kZXguanMiLCJzcmMvYXBwLmpzIiwic3JjL21hbmFnZXJzL2F1dGgtbWFuYWdlci5qcyIsInNyYy9tYW5hZ2Vycy9jaGFubmVsLW1hbmFnZXIuanMiLCJzcmMvbWFuYWdlcnMvZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlci5qcyIsInNyYy9tYW5hZ2Vycy9rZXktbmFtZXMuanMiLCJzcmMvbWFuYWdlcnMvcnVuLW1hbmFnZXIuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvYWx3YXlzLW5ldy1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9jb25kaXRpb25hbC1jcmVhdGlvbi1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9pZGVudGl0eS1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9tdWx0aXBsYXllci1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9uZXctaWYtaW5pdGlhbGl6ZWQtc3RyYXRlZ3kuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvbmV3LWlmLW1pc3Npbmctc3RyYXRlZ3kuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvbmV3LWlmLXBlcnNpc3RlZC1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9wZXJzaXN0ZW50LXNpbmdsZS1wbGF5ZXItc3RyYXRlZ3kuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvc3RyYXRlZ2llcy1tYXAuanMiLCJzcmMvbWFuYWdlcnMvc2NlbmFyaW8tbWFuYWdlci5qcyIsInNyYy9tYW5hZ2Vycy9zcGVjaWFsLW9wZXJhdGlvbnMuanMiLCJzcmMvbWFuYWdlcnMvd29ybGQtbWFuYWdlci5qcyIsInNyYy9zZXJ2aWNlL2FkbWluLWZpbGUtYXBpLmpzIiwic3JjL3NlcnZpY2UvYXNzZXQtYXBpLWFkYXB0ZXIuanMiLCJzcmMvc2VydmljZS9hdXRoLWFwaS1zZXJ2aWNlLmpzIiwic3JjL3NlcnZpY2UvY2hhbm5lbC1zZXJ2aWNlLmpzIiwic3JjL3NlcnZpY2UvY29uZmlndXJhdGlvbi1zZXJ2aWNlLmpzIiwic3JjL3NlcnZpY2UvZGF0YS1hcGktc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL21lbWJlci1hcGktYWRhcHRlci5qcyIsInNyYy9zZXJ2aWNlL3J1bi1hcGktc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL3N0YXRlLWFwaS1hZGFwdGVyLmpzIiwic3JjL3NlcnZpY2UvdXJsLWNvbmZpZy1zZXJ2aWNlLmpzIiwic3JjL3NlcnZpY2UvdXNlci1hcGktYWRhcHRlci5qcyIsInNyYy9zZXJ2aWNlL3ZhcmlhYmxlcy1hcGktc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL3dvcmxkLWFwaS1hZGFwdGVyLmpzIiwic3JjL3N0b3JlL2Nvb2tpZS1zdG9yZS5qcyIsInNyYy9zdG9yZS9zdG9yZS1mYWN0b3J5LmpzIiwic3JjL3RyYW5zcG9ydC9hamF4LWh0dHAtdHJhbnNwb3J0LmpzIiwic3JjL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5LmpzIiwic3JjL3V0aWwvaW5oZXJpdC5qcyIsInNyYy91dGlsL21ha2Utc2VxdWVuY2UuanMiLCJzcmMvdXRpbC9vYmplY3QtdXRpbC5qcyIsInNyYy91dGlsL3F1ZXJ5LXV0aWwuanMiLCJzcmMvdXRpbC9ydW4tdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy94Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDektBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4ZUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM3VCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxudmFyIGlzQXJyYXkgPSByZXF1aXJlKCdpcy1hcnJheScpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTIgLy8gbm90IHVzZWQgYnkgdGhpcyBpbXBsZW1lbnRhdGlvblxuXG52YXIga01heExlbmd0aCA9IDB4M2ZmZmZmZmZcbnZhciByb290UGFyZW50ID0ge31cblxuLyoqXG4gKiBJZiBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgVXNlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiAobW9zdCBjb21wYXRpYmxlLCBldmVuIElFNilcbiAqXG4gKiBCcm93c2VycyB0aGF0IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssIENocm9tZSA3KywgU2FmYXJpIDUuMSssXG4gKiBPcGVyYSAxMS42KywgaU9TIDQuMisuXG4gKlxuICogTm90ZTpcbiAqXG4gKiAtIEltcGxlbWVudGF0aW9uIG11c3Qgc3VwcG9ydCBhZGRpbmcgbmV3IHByb3BlcnRpZXMgdG8gYFVpbnQ4QXJyYXlgIGluc3RhbmNlcy5cbiAqICAgRmlyZWZveCA0LTI5IGxhY2tlZCBzdXBwb3J0LCBmaXhlZCBpbiBGaXJlZm94IDMwKy5cbiAqICAgU2VlOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzguXG4gKlxuICogIC0gQ2hyb21lIDktMTAgaXMgbWlzc2luZyB0aGUgYFR5cGVkQXJyYXkucHJvdG90eXBlLnN1YmFycmF5YCBmdW5jdGlvbi5cbiAqXG4gKiAgLSBJRTEwIGhhcyBhIGJyb2tlbiBgVHlwZWRBcnJheS5wcm90b3R5cGUuc3ViYXJyYXlgIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYXJyYXlzIG9mXG4gKiAgICBpbmNvcnJlY3QgbGVuZ3RoIGluIHNvbWUgc2l0dWF0aW9ucy5cbiAqXG4gKiBXZSBkZXRlY3QgdGhlc2UgYnVnZ3kgYnJvd3NlcnMgYW5kIHNldCBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgIHRvIGBmYWxzZWAgc28gdGhleSB3aWxsXG4gKiBnZXQgdGhlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiwgd2hpY2ggaXMgc2xvd2VyIGJ1dCB3aWxsIHdvcmsgY29ycmVjdGx5LlxuICovXG5CdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCA9IChmdW5jdGlvbiAoKSB7XG4gIHRyeSB7XG4gICAgdmFyIGJ1ZiA9IG5ldyBBcnJheUJ1ZmZlcigwKVxuICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheShidWYpXG4gICAgYXJyLmZvbyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH1cbiAgICByZXR1cm4gYXJyLmZvbygpID09PSA0MiAmJiAvLyB0eXBlZCBhcnJheSBpbnN0YW5jZXMgY2FuIGJlIGF1Z21lbnRlZFxuICAgICAgICB0eXBlb2YgYXJyLnN1YmFycmF5ID09PSAnZnVuY3Rpb24nICYmIC8vIGNocm9tZSA5LTEwIGxhY2sgYHN1YmFycmF5YFxuICAgICAgICBuZXcgVWludDhBcnJheSgxKS5zdWJhcnJheSgxLCAxKS5ieXRlTGVuZ3RoID09PSAwIC8vIGllMTAgaGFzIGJyb2tlbiBgc3ViYXJyYXlgXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufSkoKVxuXG4vKipcbiAqIENsYXNzOiBCdWZmZXJcbiAqID09PT09PT09PT09PT1cbiAqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGFyZSBhdWdtZW50ZWRcbiAqIHdpdGggZnVuY3Rpb24gcHJvcGVydGllcyBmb3IgYWxsIHRoZSBub2RlIGBCdWZmZXJgIEFQSSBmdW5jdGlvbnMuIFdlIHVzZVxuICogYFVpbnQ4QXJyYXlgIHNvIHRoYXQgc3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXQgcmV0dXJuc1xuICogYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogQnkgYXVnbWVudGluZyB0aGUgaW5zdGFuY2VzLCB3ZSBjYW4gYXZvaWQgbW9kaWZ5aW5nIHRoZSBgVWludDhBcnJheWBcbiAqIHByb3RvdHlwZS5cbiAqL1xuZnVuY3Rpb24gQnVmZmVyIChzdWJqZWN0LCBlbmNvZGluZywgbm9aZXJvKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBCdWZmZXIpKVxuICAgIHJldHVybiBuZXcgQnVmZmVyKHN1YmplY3QsIGVuY29kaW5nLCBub1plcm8pXG5cbiAgdmFyIHR5cGUgPSB0eXBlb2Ygc3ViamVjdFxuXG4gIC8vIEZpbmQgdGhlIGxlbmd0aFxuICB2YXIgbGVuZ3RoXG4gIGlmICh0eXBlID09PSAnbnVtYmVyJylcbiAgICBsZW5ndGggPSArc3ViamVjdFxuICBlbHNlIGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuICAgIGxlbmd0aCA9IEJ1ZmZlci5ieXRlTGVuZ3RoKHN1YmplY3QsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnICYmIHN1YmplY3QgIT09IG51bGwpIHsgLy8gYXNzdW1lIG9iamVjdCBpcyBhcnJheS1saWtlXG4gICAgaWYgKHN1YmplY3QudHlwZSA9PT0gJ0J1ZmZlcicgJiYgaXNBcnJheShzdWJqZWN0LmRhdGEpKVxuICAgICAgc3ViamVjdCA9IHN1YmplY3QuZGF0YVxuICAgIGxlbmd0aCA9ICtzdWJqZWN0Lmxlbmd0aFxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ211c3Qgc3RhcnQgd2l0aCBudW1iZXIsIGJ1ZmZlciwgYXJyYXkgb3Igc3RyaW5nJylcbiAgfVxuXG4gIGlmIChsZW5ndGggPiBrTWF4TGVuZ3RoKVxuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIGFsbG9jYXRlIEJ1ZmZlciBsYXJnZXIgdGhhbiBtYXhpbXVtICcgK1xuICAgICAgJ3NpemU6IDB4JyArIGtNYXhMZW5ndGgudG9TdHJpbmcoMTYpICsgJyBieXRlcycpXG5cbiAgaWYgKGxlbmd0aCA8IDApXG4gICAgbGVuZ3RoID0gMFxuICBlbHNlXG4gICAgbGVuZ3RoID4+Pj0gMCAvLyBDb2VyY2UgdG8gdWludDMyLlxuXG4gIHZhciBzZWxmID0gdGhpc1xuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBQcmVmZXJyZWQ6IFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgLyplc2xpbnQtZGlzYWJsZSBjb25zaXN0ZW50LXRoaXMgKi9cbiAgICBzZWxmID0gQnVmZmVyLl9hdWdtZW50KG5ldyBVaW50OEFycmF5KGxlbmd0aCkpXG4gICAgLyplc2xpbnQtZW5hYmxlIGNvbnNpc3RlbnQtdGhpcyAqL1xuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gVEhJUyBpbnN0YW5jZSBvZiBCdWZmZXIgKGNyZWF0ZWQgYnkgYG5ld2ApXG4gICAgc2VsZi5sZW5ndGggPSBsZW5ndGhcbiAgICBzZWxmLl9pc0J1ZmZlciA9IHRydWVcbiAgfVxuXG4gIHZhciBpXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiB0eXBlb2Ygc3ViamVjdC5ieXRlTGVuZ3RoID09PSAnbnVtYmVyJykge1xuICAgIC8vIFNwZWVkIG9wdGltaXphdGlvbiAtLSB1c2Ugc2V0IGlmIHdlJ3JlIGNvcHlpbmcgZnJvbSBhIHR5cGVkIGFycmF5XG4gICAgc2VsZi5fc2V0KHN1YmplY3QpXG4gIH0gZWxzZSBpZiAoaXNBcnJheWlzaChzdWJqZWN0KSkge1xuICAgIC8vIFRyZWF0IGFycmF5LWlzaCBvYmplY3RzIGFzIGEgYnl0ZSBhcnJheVxuICAgIGlmIChCdWZmZXIuaXNCdWZmZXIoc3ViamVjdCkpIHtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKylcbiAgICAgICAgc2VsZltpXSA9IHN1YmplY3QucmVhZFVJbnQ4KGkpXG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKylcbiAgICAgICAgc2VsZltpXSA9ICgoc3ViamVjdFtpXSAlIDI1NikgKyAyNTYpICUgMjU2XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgc2VsZi53cml0ZShzdWJqZWN0LCAwLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnbnVtYmVyJyAmJiAhQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgJiYgIW5vWmVybykge1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgc2VsZltpXSA9IDBcbiAgICB9XG4gIH1cblxuICBpZiAobGVuZ3RoID4gMCAmJiBsZW5ndGggPD0gQnVmZmVyLnBvb2xTaXplKVxuICAgIHNlbGYucGFyZW50ID0gcm9vdFBhcmVudFxuXG4gIHJldHVybiBzZWxmXG59XG5cbmZ1bmN0aW9uIFNsb3dCdWZmZXIgKHN1YmplY3QsIGVuY29kaW5nLCBub1plcm8pIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFNsb3dCdWZmZXIpKVxuICAgIHJldHVybiBuZXcgU2xvd0J1ZmZlcihzdWJqZWN0LCBlbmNvZGluZywgbm9aZXJvKVxuXG4gIHZhciBidWYgPSBuZXcgQnVmZmVyKHN1YmplY3QsIGVuY29kaW5nLCBub1plcm8pXG4gIGRlbGV0ZSBidWYucGFyZW50XG4gIHJldHVybiBidWZcbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gKGIpIHtcbiAgcmV0dXJuICEhKGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlcilcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiAoYSwgYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhKSB8fCAhQnVmZmVyLmlzQnVmZmVyKGIpKVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyBtdXN0IGJlIEJ1ZmZlcnMnKVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gTWF0aC5taW4oeCwgeSk7IGkgPCBsZW4gJiYgYVtpXSA9PT0gYltpXTsgaSsrKSB7fVxuICBpZiAoaSAhPT0gbGVuKSB7XG4gICAgeCA9IGFbaV1cbiAgICB5ID0gYltpXVxuICB9XG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiAobGlzdCwgdG90YWxMZW5ndGgpIHtcbiAgaWYgKCFpc0FycmF5KGxpc3QpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVc2FnZTogQnVmZmVyLmNvbmNhdChsaXN0WywgbGVuZ3RoXSknKVxuXG4gIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBuZXcgQnVmZmVyKDApXG4gIH0gZWxzZSBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICByZXR1cm4gbGlzdFswXVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKHRvdGFsTGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICB0b3RhbExlbmd0aCA9IDBcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgdG90YWxMZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmID0gbmV3IEJ1ZmZlcih0b3RhbExlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaXRlbSA9IGxpc3RbaV1cbiAgICBpdGVtLmNvcHkoYnVmLCBwb3MpXG4gICAgcG9zICs9IGl0ZW0ubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGZ1bmN0aW9uIChzdHIsIGVuY29kaW5nKSB7XG4gIHZhciByZXRcbiAgc3RyID0gc3RyICsgJydcbiAgc3dpdGNoIChlbmNvZGluZyB8fCAndXRmOCcpIHtcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdyYXcnOlxuICAgICAgcmV0ID0gc3RyLmxlbmd0aFxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0ID0gc3RyLmxlbmd0aCAqIDJcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGggPj4+IDFcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gdXRmOFRvQnl0ZXMoc3RyKS5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IGJhc2U2NFRvQnl0ZXMoc3RyKS5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGhcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbi8vIHByZS1zZXQgZm9yIHZhbHVlcyB0aGF0IG1heSBleGlzdCBpbiB0aGUgZnV0dXJlXG5CdWZmZXIucHJvdG90eXBlLmxlbmd0aCA9IHVuZGVmaW5lZFxuQnVmZmVyLnByb3RvdHlwZS5wYXJlbnQgPSB1bmRlZmluZWRcblxuLy8gdG9TdHJpbmcoZW5jb2RpbmcsIHN0YXJ0PTAsIGVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIChlbmNvZGluZywgc3RhcnQsIGVuZCkge1xuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuXG4gIHN0YXJ0ID0gc3RhcnQgPj4+IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID09PSBJbmZpbml0eSA/IHRoaXMubGVuZ3RoIDogZW5kID4+PiAwXG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcbiAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKGVuZCA8PSBzdGFydCkgcmV0dXJuICcnXG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gYmluYXJ5U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1dGYxNmxlU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKVxuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoZW5jb2RpbmcgKyAnJykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVNcbiAgaWYgKHRoaXMubGVuZ3RoID4gMCkge1xuICAgIHN0ciA9IHRoaXMudG9TdHJpbmcoJ2hleCcsIDAsIG1heCkubWF0Y2goLy57Mn0vZykuam9pbignICcpXG4gICAgaWYgKHRoaXMubGVuZ3RoID4gbWF4KVxuICAgICAgc3RyICs9ICcgLi4uICdcbiAgfVxuICByZXR1cm4gJzxCdWZmZXIgJyArIHN0ciArICc+J1xufVxuXG5CdWZmZXIucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gMFxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYilcbn1cblxuLy8gYGdldGAgd2lsbCBiZSByZW1vdmVkIGluIE5vZGUgMC4xMytcbkJ1ZmZlci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKG9mZnNldCkge1xuICBjb25zb2xlLmxvZygnLmdldCgpIGlzIGRlcHJlY2F0ZWQuIEFjY2VzcyB1c2luZyBhcnJheSBpbmRleGVzIGluc3RlYWQuJylcbiAgcmV0dXJuIHRoaXMucmVhZFVJbnQ4KG9mZnNldClcbn1cblxuLy8gYHNldGAgd2lsbCBiZSByZW1vdmVkIGluIE5vZGUgMC4xMytcbkJ1ZmZlci5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKHYsIG9mZnNldCkge1xuICBjb25zb2xlLmxvZygnLnNldCgpIGlzIGRlcHJlY2F0ZWQuIEFjY2VzcyB1c2luZyBhcnJheSBpbmRleGVzIGluc3RlYWQuJylcbiAgcmV0dXJuIHRoaXMud3JpdGVVSW50OCh2LCBvZmZzZXQpXG59XG5cbmZ1bmN0aW9uIGhleFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gYnVmLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG5cbiAgLy8gbXVzdCBiZSBhbiBldmVuIG51bWJlciBvZiBkaWdpdHNcbiAgdmFyIHN0ckxlbiA9IHN0cmluZy5sZW5ndGhcbiAgaWYgKHN0ckxlbiAlIDIgIT09IDApIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBoZXggc3RyaW5nJylcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGJ5dGUgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgaWYgKGlzTmFOKGJ5dGUpKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaGV4IHN0cmluZycpXG4gICAgYnVmW29mZnNldCArIGldID0gYnl0ZVxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIHV0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBibGl0QnVmZmVyKHV0ZjhUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG4gIHJldHVybiBjaGFyc1dyaXR0ZW5cbn1cblxuZnVuY3Rpb24gYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIGJpbmFyeVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGFzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5mdW5jdGlvbiB1dGYxNmxlV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoLCAyKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gU3VwcG9ydCBib3RoIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZylcbiAgLy8gYW5kIHRoZSBsZWdhY3kgKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIGlmICghaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfSBlbHNlIHsgIC8vIGxlZ2FjeVxuICAgIHZhciBzd2FwID0gZW5jb2RpbmdcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIG9mZnNldCA9IGxlbmd0aFxuICAgIGxlbmd0aCA9IHN3YXBcbiAgfVxuXG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcblxuICBpZiAobGVuZ3RoIDwgMCB8fCBvZmZzZXQgPCAwIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKVxuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdhdHRlbXB0IHRvIHdyaXRlIG91dHNpZGUgYnVmZmVyIGJvdW5kcycpXG5cbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cbiAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcgfHwgJ3V0ZjgnKS50b0xvd2VyQ2FzZSgpXG5cbiAgdmFyIHJldFxuICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IGhleFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIHJldCA9IHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgICByZXQgPSBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICByZXQgPSBiaW5hcnlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgcmV0ID0gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IHV0ZjE2bGVXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0J1ZmZlcicsXG4gICAgZGF0YTogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodGhpcy5fYXJyIHx8IHRoaXMsIDApXG4gIH1cbn1cblxuZnVuY3Rpb24gYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIHV0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXMgPSAnJ1xuICB2YXIgdG1wID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgaWYgKGJ1ZltpXSA8PSAweDdGKSB7XG4gICAgICByZXMgKz0gZGVjb2RlVXRmOENoYXIodG1wKSArIFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICAgICAgdG1wID0gJydcbiAgICB9IGVsc2Uge1xuICAgICAgdG1wICs9ICclJyArIGJ1ZltpXS50b1N0cmluZygxNilcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzICsgZGVjb2RlVXRmOENoYXIodG1wKVxufVxuXG5mdW5jdGlvbiBhc2NpaVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSAmIDB4N0YpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBiaW5hcnlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBoZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgYnl0ZXNbaSArIDFdICogMjU2KVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIChzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBzdGFydCA9IH5+c3RhcnRcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyBsZW4gOiB+fmVuZFxuXG4gIGlmIChzdGFydCA8IDApIHtcbiAgICBzdGFydCArPSBsZW5cbiAgICBpZiAoc3RhcnQgPCAwKVxuICAgICAgc3RhcnQgPSAwXG4gIH0gZWxzZSBpZiAoc3RhcnQgPiBsZW4pIHtcbiAgICBzdGFydCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IDApIHtcbiAgICBlbmQgKz0gbGVuXG4gICAgaWYgKGVuZCA8IDApXG4gICAgICBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpXG4gICAgZW5kID0gc3RhcnRcblxuICB2YXIgbmV3QnVmXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIG5ld0J1ZiA9IEJ1ZmZlci5fYXVnbWVudCh0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpKVxuICB9IGVsc2Uge1xuICAgIHZhciBzbGljZUxlbiA9IGVuZCAtIHN0YXJ0XG4gICAgbmV3QnVmID0gbmV3IEJ1ZmZlcihzbGljZUxlbiwgdW5kZWZpbmVkLCB0cnVlKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2xpY2VMZW47IGkrKykge1xuICAgICAgbmV3QnVmW2ldID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9XG5cbiAgaWYgKG5ld0J1Zi5sZW5ndGgpXG4gICAgbmV3QnVmLnBhcmVudCA9IHRoaXMucGFyZW50IHx8IHRoaXNcblxuICByZXR1cm4gbmV3QnVmXG59XG5cbi8qXG4gKiBOZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IGJ1ZmZlciBpc24ndCB0cnlpbmcgdG8gd3JpdGUgb3V0IG9mIGJvdW5kcy5cbiAqL1xuZnVuY3Rpb24gY2hlY2tPZmZzZXQgKG9mZnNldCwgZXh0LCBsZW5ndGgpIHtcbiAgaWYgKChvZmZzZXQgJSAxKSAhPT0gMCB8fCBvZmZzZXQgPCAwKVxuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKVxuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludExFID0gZnVuY3Rpb24gKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSlcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludEJFID0gZnVuY3Rpb24gKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSlcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdICogbXVsXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCA4KSB8IHRoaXNbb2Zmc2V0ICsgMV1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICgodGhpc1tvZmZzZXRdKSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikpICtcbiAgICAgICh0aGlzW29mZnNldCArIDNdICogMHgxMDAwMDAwKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSAqIDB4MTAwMDAwMCkgK1xuICAgICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgICB0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpXG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bClcbiAgICB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoXG4gIHZhciBtdWwgPSAxXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0taV1cbiAgd2hpbGUgKGkgPiAwICYmIChtdWwgKj0gMHgxMDApKVxuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0taV0gKiBtdWxcbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bClcbiAgICB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQ4ID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSlcbiAgICByZXR1cm4gKHRoaXNbb2Zmc2V0XSlcbiAgcmV0dXJuICgoMHhmZiAtIHRoaXNbb2Zmc2V0XSArIDEpICogLTEpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIDFdIHwgKHRoaXNbb2Zmc2V0XSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0pIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAzXSA8PCAyNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCAyNCkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0QkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDUyLCA4KVxufVxuXG5mdW5jdGlvbiBjaGVja0ludCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2J1ZmZlciBtdXN0IGJlIGEgQnVmZmVyIGluc3RhbmNlJylcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndmFsdWUgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCksIDApXG5cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSlcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSA+Pj4gMCAmIDB4RkZcblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludEJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSwgMClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpID4+PiAwICYgMHhGRlxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweGZmLCAwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbmZ1bmN0aW9uIG9iamVjdFdyaXRlVUludDE2IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbikge1xuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZiArIHZhbHVlICsgMVxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBvZmZzZXQsIDIpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID0gKHZhbHVlICYgKDB4ZmYgPDwgKDggKiAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSkpKSA+Pj5cbiAgICAgIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpICogOFxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgfSBlbHNlIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDFdID0gdmFsdWVcbiAgfSBlbHNlIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5mdW5jdGlvbiBvYmplY3RXcml0ZVVJbnQzMiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4pIHtcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4oYnVmLmxlbmd0aCAtIG9mZnNldCwgNCk7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSAodmFsdWUgPj4+IChsaXR0bGVFbmRpYW4gPyBpIDogMyAtIGkpICogOCkgJiAweGZmXG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgfSBlbHNlIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9IHZhbHVlXG4gIH0gZWxzZSBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludExFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJbnQodGhpcyxcbiAgICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgICBvZmZzZXQsXG4gICAgICAgICAgICAgYnl0ZUxlbmd0aCxcbiAgICAgICAgICAgICBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCAtIDEpIC0gMSxcbiAgICAgICAgICAgICAtTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGggLSAxKSlcbiAgfVxuXG4gIHZhciBpID0gMFxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gdmFsdWUgPCAwID8gMSA6IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50QkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0ludCh0aGlzLFxuICAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgIG9mZnNldCxcbiAgICAgICAgICAgICBieXRlTGVuZ3RoLFxuICAgICAgICAgICAgIE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoIC0gMSkgLSAxLFxuICAgICAgICAgICAgIC1NYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCAtIDEpKVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gdmFsdWUgPCAwID8gMSA6IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpXG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgfSBlbHNlIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSB2YWx1ZVxuICB9IGVsc2Ugb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIH0gZWxzZSBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDNdID0gdmFsdWVcbiAgfSBlbHNlIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5mdW5jdGlvbiBjaGVja0lFRUU3NTQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCd2YWx1ZSBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAob2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDQsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gd3JpdGVEb3VibGUgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDgsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gY29weSh0YXJnZXRCdWZmZXIsIHRhcmdldFN0YXJ0PTAsIHNvdXJjZVN0YXJ0PTAsIHNvdXJjZUVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gKHRhcmdldCwgdGFyZ2V0X3N0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIHZhciBzZWxmID0gdGhpcyAvLyBzb3VyY2VcblxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0X3N0YXJ0ID49IHRhcmdldC5sZW5ndGgpIHRhcmdldF9zdGFydCA9IHRhcmdldC5sZW5ndGhcbiAgaWYgKCF0YXJnZXRfc3RhcnQpIHRhcmdldF9zdGFydCA9IDBcbiAgaWYgKGVuZCA+IDAgJiYgZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm4gMFxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCBzZWxmLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGlmICh0YXJnZXRfc3RhcnQgPCAwKVxuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSBzZWxmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZVN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoZW5kIDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpXG4gICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRfc3RhcnQgPCBlbmQgLSBzdGFydClcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0ICsgc3RhcnRcblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcblxuICBpZiAobGVuIDwgMTAwMCB8fCAhQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldF9zdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGFyZ2V0Ll9zZXQodGhpcy5zdWJhcnJheShzdGFydCwgc3RhcnQgKyBsZW4pLCB0YXJnZXRfc3RhcnQpXG4gIH1cblxuICByZXR1cm4gbGVuXG59XG5cbi8vIGZpbGwodmFsdWUsIHN0YXJ0PTAsIGVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gKHZhbHVlLCBzdGFydCwgZW5kKSB7XG4gIGlmICghdmFsdWUpIHZhbHVlID0gMFxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQpIGVuZCA9IHRoaXMubGVuZ3RoXG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignZW5kIDwgc3RhcnQnKVxuXG4gIC8vIEZpbGwgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3N0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoZW5kIDwgMCB8fCBlbmQgPiB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2VuZCBvdXQgb2YgYm91bmRzJylcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSB2YWx1ZVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSB1dGY4VG9CeXRlcyh2YWx1ZS50b1N0cmluZygpKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgYEFycmF5QnVmZmVyYCB3aXRoIHRoZSAqY29waWVkKiBtZW1vcnkgb2YgdGhlIGJ1ZmZlciBpbnN0YW5jZS5cbiAqIEFkZGVkIGluIE5vZGUgMC4xMi4gT25seSBhdmFpbGFibGUgaW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IEFycmF5QnVmZmVyLlxuICovXG5CdWZmZXIucHJvdG90eXBlLnRvQXJyYXlCdWZmZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAgIHJldHVybiAobmV3IEJ1ZmZlcih0aGlzKSkuYnVmZmVyXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBidWYgPSBuZXcgVWludDhBcnJheSh0aGlzLmxlbmd0aClcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBidWYubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgYnVmW2ldID0gdGhpc1tpXVxuICAgICAgfVxuICAgICAgcmV0dXJuIGJ1Zi5idWZmZXJcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQnVmZmVyLnRvQXJyYXlCdWZmZXIgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGJyb3dzZXInKVxuICB9XG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIEJQID0gQnVmZmVyLnByb3RvdHlwZVxuXG4vKipcbiAqIEF1Z21lbnQgYSBVaW50OEFycmF5ICppbnN0YW5jZSogKG5vdCB0aGUgVWludDhBcnJheSBjbGFzcyEpIHdpdGggQnVmZmVyIG1ldGhvZHNcbiAqL1xuQnVmZmVyLl9hdWdtZW50ID0gZnVuY3Rpb24gKGFycikge1xuICBhcnIuY29uc3RydWN0b3IgPSBCdWZmZXJcbiAgYXJyLl9pc0J1ZmZlciA9IHRydWVcblxuICAvLyBzYXZlIHJlZmVyZW5jZSB0byBvcmlnaW5hbCBVaW50OEFycmF5IGdldC9zZXQgbWV0aG9kcyBiZWZvcmUgb3ZlcndyaXRpbmdcbiAgYXJyLl9nZXQgPSBhcnIuZ2V0XG4gIGFyci5fc2V0ID0gYXJyLnNldFxuXG4gIC8vIGRlcHJlY2F0ZWQsIHdpbGwgYmUgcmVtb3ZlZCBpbiBub2RlIDAuMTMrXG4gIGFyci5nZXQgPSBCUC5nZXRcbiAgYXJyLnNldCA9IEJQLnNldFxuXG4gIGFyci53cml0ZSA9IEJQLndyaXRlXG4gIGFyci50b1N0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0xvY2FsZVN0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0pTT04gPSBCUC50b0pTT05cbiAgYXJyLmVxdWFscyA9IEJQLmVxdWFsc1xuICBhcnIuY29tcGFyZSA9IEJQLmNvbXBhcmVcbiAgYXJyLmNvcHkgPSBCUC5jb3B5XG4gIGFyci5zbGljZSA9IEJQLnNsaWNlXG4gIGFyci5yZWFkVUludExFID0gQlAucmVhZFVJbnRMRVxuICBhcnIucmVhZFVJbnRCRSA9IEJQLnJlYWRVSW50QkVcbiAgYXJyLnJlYWRVSW50OCA9IEJQLnJlYWRVSW50OFxuICBhcnIucmVhZFVJbnQxNkxFID0gQlAucmVhZFVJbnQxNkxFXG4gIGFyci5yZWFkVUludDE2QkUgPSBCUC5yZWFkVUludDE2QkVcbiAgYXJyLnJlYWRVSW50MzJMRSA9IEJQLnJlYWRVSW50MzJMRVxuICBhcnIucmVhZFVJbnQzMkJFID0gQlAucmVhZFVJbnQzMkJFXG4gIGFyci5yZWFkSW50TEUgPSBCUC5yZWFkSW50TEVcbiAgYXJyLnJlYWRJbnRCRSA9IEJQLnJlYWRJbnRCRVxuICBhcnIucmVhZEludDggPSBCUC5yZWFkSW50OFxuICBhcnIucmVhZEludDE2TEUgPSBCUC5yZWFkSW50MTZMRVxuICBhcnIucmVhZEludDE2QkUgPSBCUC5yZWFkSW50MTZCRVxuICBhcnIucmVhZEludDMyTEUgPSBCUC5yZWFkSW50MzJMRVxuICBhcnIucmVhZEludDMyQkUgPSBCUC5yZWFkSW50MzJCRVxuICBhcnIucmVhZEZsb2F0TEUgPSBCUC5yZWFkRmxvYXRMRVxuICBhcnIucmVhZEZsb2F0QkUgPSBCUC5yZWFkRmxvYXRCRVxuICBhcnIucmVhZERvdWJsZUxFID0gQlAucmVhZERvdWJsZUxFXG4gIGFyci5yZWFkRG91YmxlQkUgPSBCUC5yZWFkRG91YmxlQkVcbiAgYXJyLndyaXRlVUludDggPSBCUC53cml0ZVVJbnQ4XG4gIGFyci53cml0ZVVJbnRMRSA9IEJQLndyaXRlVUludExFXG4gIGFyci53cml0ZVVJbnRCRSA9IEJQLndyaXRlVUludEJFXG4gIGFyci53cml0ZVVJbnQxNkxFID0gQlAud3JpdGVVSW50MTZMRVxuICBhcnIud3JpdGVVSW50MTZCRSA9IEJQLndyaXRlVUludDE2QkVcbiAgYXJyLndyaXRlVUludDMyTEUgPSBCUC53cml0ZVVJbnQzMkxFXG4gIGFyci53cml0ZVVJbnQzMkJFID0gQlAud3JpdGVVSW50MzJCRVxuICBhcnIud3JpdGVJbnRMRSA9IEJQLndyaXRlSW50TEVcbiAgYXJyLndyaXRlSW50QkUgPSBCUC53cml0ZUludEJFXG4gIGFyci53cml0ZUludDggPSBCUC53cml0ZUludDhcbiAgYXJyLndyaXRlSW50MTZMRSA9IEJQLndyaXRlSW50MTZMRVxuICBhcnIud3JpdGVJbnQxNkJFID0gQlAud3JpdGVJbnQxNkJFXG4gIGFyci53cml0ZUludDMyTEUgPSBCUC53cml0ZUludDMyTEVcbiAgYXJyLndyaXRlSW50MzJCRSA9IEJQLndyaXRlSW50MzJCRVxuICBhcnIud3JpdGVGbG9hdExFID0gQlAud3JpdGVGbG9hdExFXG4gIGFyci53cml0ZUZsb2F0QkUgPSBCUC53cml0ZUZsb2F0QkVcbiAgYXJyLndyaXRlRG91YmxlTEUgPSBCUC53cml0ZURvdWJsZUxFXG4gIGFyci53cml0ZURvdWJsZUJFID0gQlAud3JpdGVEb3VibGVCRVxuICBhcnIuZmlsbCA9IEJQLmZpbGxcbiAgYXJyLmluc3BlY3QgPSBCUC5pbnNwZWN0XG4gIGFyci50b0FycmF5QnVmZmVyID0gQlAudG9BcnJheUJ1ZmZlclxuXG4gIHJldHVybiBhcnJcbn1cblxudmFyIElOVkFMSURfQkFTRTY0X1JFID0gL1teK1xcLzAtOUEtelxcLV0vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHJpbmd0cmltKHN0cikucmVwbGFjZShJTlZBTElEX0JBU0U2NF9SRSwgJycpXG4gIC8vIE5vZGUgY29udmVydHMgc3RyaW5ncyB3aXRoIGxlbmd0aCA8IDIgdG8gJydcbiAgaWYgKHN0ci5sZW5ndGggPCAyKSByZXR1cm4gJydcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gc3RyaW5ndHJpbSAoc3RyKSB7XG4gIGlmIChzdHIudHJpbSkgcmV0dXJuIHN0ci50cmltKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcbn1cblxuZnVuY3Rpb24gaXNBcnJheWlzaCAoc3ViamVjdCkge1xuICByZXR1cm4gaXNBcnJheShzdWJqZWN0KSB8fCBCdWZmZXIuaXNCdWZmZXIoc3ViamVjdCkgfHxcbiAgICAgIHN1YmplY3QgJiYgdHlwZW9mIHN1YmplY3QgPT09ICdvYmplY3QnICYmXG4gICAgICB0eXBlb2Ygc3ViamVjdC5sZW5ndGggPT09ICdudW1iZXInXG59XG5cbmZ1bmN0aW9uIHRvSGV4IChuKSB7XG4gIGlmIChuIDwgMTYpIHJldHVybiAnMCcgKyBuLnRvU3RyaW5nKDE2KVxuICByZXR1cm4gbi50b1N0cmluZygxNilcbn1cblxuZnVuY3Rpb24gdXRmOFRvQnl0ZXMgKHN0cmluZywgdW5pdHMpIHtcbiAgdW5pdHMgPSB1bml0cyB8fCBJbmZpbml0eVxuICB2YXIgY29kZVBvaW50XG4gIHZhciBsZW5ndGggPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBsZWFkU3Vycm9nYXRlID0gbnVsbFxuICB2YXIgYnl0ZXMgPSBbXVxuICB2YXIgaSA9IDBcblxuICBmb3IgKDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgY29kZVBvaW50ID0gc3RyaW5nLmNoYXJDb2RlQXQoaSlcblxuICAgIC8vIGlzIHN1cnJvZ2F0ZSBjb21wb25lbnRcbiAgICBpZiAoY29kZVBvaW50ID4gMHhEN0ZGICYmIGNvZGVQb2ludCA8IDB4RTAwMCkge1xuICAgICAgLy8gbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmIChsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAgIC8vIDIgbGVhZHMgaW4gYSByb3dcbiAgICAgICAgaWYgKGNvZGVQb2ludCA8IDB4REMwMCkge1xuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIHZhbGlkIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICAgICAgY29kZVBvaW50ID0gbGVhZFN1cnJvZ2F0ZSAtIDB4RDgwMCA8PCAxMCB8IGNvZGVQb2ludCAtIDB4REMwMCB8IDB4MTAwMDBcbiAgICAgICAgICBsZWFkU3Vycm9nYXRlID0gbnVsbFxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBubyBsZWFkIHlldFxuXG4gICAgICAgIGlmIChjb2RlUG9pbnQgPiAweERCRkYpIHtcbiAgICAgICAgICAvLyB1bmV4cGVjdGVkIHRyYWlsXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIGlmIChpICsgMSA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gdW5wYWlyZWQgbGVhZFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gdmFsaWQgbGVhZFxuICAgICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAvLyB2YWxpZCBibXAgY2hhciwgYnV0IGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgIGxlYWRTdXJyb2dhdGUgPSBudWxsXG4gICAgfVxuXG4gICAgLy8gZW5jb2RlIHV0ZjhcbiAgICBpZiAoY29kZVBvaW50IDwgMHg4MCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAxKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKGNvZGVQb2ludClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4ODAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgfCAweEMwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAzKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDIHwgMHhFMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgyMDAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gNCkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4MTIgfCAweEYwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvZGUgcG9pbnQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBieXRlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyLCB1bml0cykge1xuICB2YXIgYywgaGksIGxvXG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuXG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoYmFzZTY0Y2xlYW4oc3RyKSlcbn1cblxuZnVuY3Rpb24gYmxpdEJ1ZmZlciAoc3JjLCBkc3QsIG9mZnNldCwgbGVuZ3RoLCB1bml0U2l6ZSkge1xuICBpZiAodW5pdFNpemUpIGxlbmd0aCAtPSBsZW5ndGggJSB1bml0U2l6ZVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKVxuICAgICAgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiBkZWNvZGVVdGY4Q2hhciAoc3RyKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChzdHIpXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4RkZGRCkgLy8gVVRGIDggaW52YWxpZCBjaGFyXG4gIH1cbn1cbiIsInZhciBsb29rdXAgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLyc7XG5cbjsoZnVuY3Rpb24gKGV4cG9ydHMpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG4gIHZhciBBcnIgPSAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKVxuICAgID8gVWludDhBcnJheVxuICAgIDogQXJyYXlcblxuXHR2YXIgUExVUyAgID0gJysnLmNoYXJDb2RlQXQoMClcblx0dmFyIFNMQVNIICA9ICcvJy5jaGFyQ29kZUF0KDApXG5cdHZhciBOVU1CRVIgPSAnMCcuY2hhckNvZGVBdCgwKVxuXHR2YXIgTE9XRVIgID0gJ2EnLmNoYXJDb2RlQXQoMClcblx0dmFyIFVQUEVSICA9ICdBJy5jaGFyQ29kZUF0KDApXG5cdHZhciBQTFVTX1VSTF9TQUZFID0gJy0nLmNoYXJDb2RlQXQoMClcblx0dmFyIFNMQVNIX1VSTF9TQUZFID0gJ18nLmNoYXJDb2RlQXQoMClcblxuXHRmdW5jdGlvbiBkZWNvZGUgKGVsdCkge1xuXHRcdHZhciBjb2RlID0gZWx0LmNoYXJDb2RlQXQoMClcblx0XHRpZiAoY29kZSA9PT0gUExVUyB8fFxuXHRcdCAgICBjb2RlID09PSBQTFVTX1VSTF9TQUZFKVxuXHRcdFx0cmV0dXJuIDYyIC8vICcrJ1xuXHRcdGlmIChjb2RlID09PSBTTEFTSCB8fFxuXHRcdCAgICBjb2RlID09PSBTTEFTSF9VUkxfU0FGRSlcblx0XHRcdHJldHVybiA2MyAvLyAnLydcblx0XHRpZiAoY29kZSA8IE5VTUJFUilcblx0XHRcdHJldHVybiAtMSAvL25vIG1hdGNoXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIgKyAxMClcblx0XHRcdHJldHVybiBjb2RlIC0gTlVNQkVSICsgMjYgKyAyNlxuXHRcdGlmIChjb2RlIDwgVVBQRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gVVBQRVJcblx0XHRpZiAoY29kZSA8IExPV0VSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIExPV0VSICsgMjZcblx0fVxuXG5cdGZ1bmN0aW9uIGI2NFRvQnl0ZUFycmF5IChiNjQpIHtcblx0XHR2YXIgaSwgaiwgbCwgdG1wLCBwbGFjZUhvbGRlcnMsIGFyclxuXG5cdFx0aWYgKGI2NC5sZW5ndGggJSA0ID4gMCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0Jylcblx0XHR9XG5cblx0XHQvLyB0aGUgbnVtYmVyIG9mIGVxdWFsIHNpZ25zIChwbGFjZSBob2xkZXJzKVxuXHRcdC8vIGlmIHRoZXJlIGFyZSB0d28gcGxhY2Vob2xkZXJzLCB0aGFuIHRoZSB0d28gY2hhcmFjdGVycyBiZWZvcmUgaXRcblx0XHQvLyByZXByZXNlbnQgb25lIGJ5dGVcblx0XHQvLyBpZiB0aGVyZSBpcyBvbmx5IG9uZSwgdGhlbiB0aGUgdGhyZWUgY2hhcmFjdGVycyBiZWZvcmUgaXQgcmVwcmVzZW50IDIgYnl0ZXNcblx0XHQvLyB0aGlzIGlzIGp1c3QgYSBjaGVhcCBoYWNrIHRvIG5vdCBkbyBpbmRleE9mIHR3aWNlXG5cdFx0dmFyIGxlbiA9IGI2NC5sZW5ndGhcblx0XHRwbGFjZUhvbGRlcnMgPSAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMikgPyAyIDogJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDEpID8gMSA6IDBcblxuXHRcdC8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuXHRcdGFyciA9IG5ldyBBcnIoYjY0Lmxlbmd0aCAqIDMgLyA0IC0gcGxhY2VIb2xkZXJzKVxuXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuXHRcdGwgPSBwbGFjZUhvbGRlcnMgPiAwID8gYjY0Lmxlbmd0aCAtIDQgOiBiNjQubGVuZ3RoXG5cblx0XHR2YXIgTCA9IDBcblxuXHRcdGZ1bmN0aW9uIHB1c2ggKHYpIHtcblx0XHRcdGFycltMKytdID0gdlxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDAsIGogPSAwOyBpIDwgbDsgaSArPSA0LCBqICs9IDMpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTgpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgMTIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPDwgNikgfCBkZWNvZGUoYjY0LmNoYXJBdChpICsgMykpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDAwMCkgPj4gMTYpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDApID4+IDgpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0aWYgKHBsYWNlSG9sZGVycyA9PT0gMikge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpID4+IDQpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fSBlbHNlIGlmIChwbGFjZUhvbGRlcnMgPT09IDEpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTApIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgNCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA+PiAyKVxuXHRcdFx0cHVzaCgodG1wID4+IDgpICYgMHhGRilcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRyZXR1cm4gYXJyXG5cdH1cblxuXHRmdW5jdGlvbiB1aW50OFRvQmFzZTY0ICh1aW50OCkge1xuXHRcdHZhciBpLFxuXHRcdFx0ZXh0cmFCeXRlcyA9IHVpbnQ4Lmxlbmd0aCAlIDMsIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG5cdFx0XHRvdXRwdXQgPSBcIlwiLFxuXHRcdFx0dGVtcCwgbGVuZ3RoXG5cblx0XHRmdW5jdGlvbiBlbmNvZGUgKG51bSkge1xuXHRcdFx0cmV0dXJuIGxvb2t1cC5jaGFyQXQobnVtKVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG5cdFx0XHRyZXR1cm4gZW5jb2RlKG51bSA+PiAxOCAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiAxMiAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiA2ICYgMHgzRikgKyBlbmNvZGUobnVtICYgMHgzRilcblx0XHR9XG5cblx0XHQvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG5cdFx0Zm9yIChpID0gMCwgbGVuZ3RoID0gdWludDgubGVuZ3RoIC0gZXh0cmFCeXRlczsgaSA8IGxlbmd0aDsgaSArPSAzKSB7XG5cdFx0XHR0ZW1wID0gKHVpbnQ4W2ldIDw8IDE2KSArICh1aW50OFtpICsgMV0gPDwgOCkgKyAodWludDhbaSArIDJdKVxuXHRcdFx0b3V0cHV0ICs9IHRyaXBsZXRUb0Jhc2U2NCh0ZW1wKVxuXHRcdH1cblxuXHRcdC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcblx0XHRzd2l0Y2ggKGV4dHJhQnl0ZXMpIHtcblx0XHRcdGNhc2UgMTpcblx0XHRcdFx0dGVtcCA9IHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAyKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9PSdcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgMjpcblx0XHRcdFx0dGVtcCA9ICh1aW50OFt1aW50OC5sZW5ndGggLSAyXSA8PCA4KSArICh1aW50OFt1aW50OC5sZW5ndGggLSAxXSlcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDEwKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wID4+IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCAyKSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPSdcblx0XHRcdFx0YnJlYWtcblx0XHR9XG5cblx0XHRyZXR1cm4gb3V0cHV0XG5cdH1cblxuXHRleHBvcnRzLnRvQnl0ZUFycmF5ID0gYjY0VG9CeXRlQXJyYXlcblx0ZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gdWludDhUb0Jhc2U2NFxufSh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcgPyAodGhpcy5iYXNlNjRqcyA9IHt9KSA6IGV4cG9ydHMpKVxuIiwiZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24oYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSxcbiAgICAgIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDEsXG4gICAgICBlTWF4ID0gKDEgPDwgZUxlbikgLSAxLFxuICAgICAgZUJpYXMgPSBlTWF4ID4+IDEsXG4gICAgICBuQml0cyA9IC03LFxuICAgICAgaSA9IGlzTEUgPyAobkJ5dGVzIC0gMSkgOiAwLFxuICAgICAgZCA9IGlzTEUgPyAtMSA6IDEsXG4gICAgICBzID0gYnVmZmVyW29mZnNldCArIGldO1xuXG4gIGkgKz0gZDtcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKTtcbiAgcyA+Pj0gKC1uQml0cyk7XG4gIG5CaXRzICs9IGVMZW47XG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSBlICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpO1xuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpO1xuICBlID4+PSAoLW5CaXRzKTtcbiAgbkJpdHMgKz0gbUxlbjtcbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IG0gKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCk7XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzO1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSk7XG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKTtcbiAgICBlID0gZSAtIGVCaWFzO1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pO1xufTtcblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjLFxuICAgICAgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMSxcbiAgICAgIGVNYXggPSAoMSA8PCBlTGVuKSAtIDEsXG4gICAgICBlQmlhcyA9IGVNYXggPj4gMSxcbiAgICAgIHJ0ID0gKG1MZW4gPT09IDIzID8gTWF0aC5wb3coMiwgLTI0KSAtIE1hdGgucG93KDIsIC03NykgOiAwKSxcbiAgICAgIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKSxcbiAgICAgIGQgPSBpc0xFID8gMSA6IC0xLFxuICAgICAgcyA9IHZhbHVlIDwgMCB8fCAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkgPyAxIDogMDtcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKTtcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMDtcbiAgICBlID0gZU1heDtcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMik7XG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tO1xuICAgICAgYyAqPSAyO1xuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gYztcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpO1xuICAgIH1cbiAgICBpZiAodmFsdWUgKiBjID49IDIpIHtcbiAgICAgIGUrKztcbiAgICAgIGMgLz0gMjtcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwO1xuICAgICAgZSA9IGVNYXg7XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICh2YWx1ZSAqIGMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pO1xuICAgICAgZSA9IGUgKyBlQmlhcztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHZhbHVlICogTWF0aC5wb3coMiwgZUJpYXMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pO1xuICAgICAgZSA9IDA7XG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCk7XG5cbiAgZSA9IChlIDw8IG1MZW4pIHwgbTtcbiAgZUxlbiArPSBtTGVuO1xuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpO1xuXG4gIGJ1ZmZlcltvZmZzZXQgKyBpIC0gZF0gfD0gcyAqIDEyODtcbn07XG4iLCJcbi8qKlxuICogaXNBcnJheVxuICovXG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcblxuLyoqXG4gKiB0b1N0cmluZ1xuICovXG5cbnZhciBzdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vKipcbiAqIFdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBgdmFsYFxuICogaXMgYW4gYXJyYXkuXG4gKlxuICogZXhhbXBsZTpcbiAqXG4gKiAgICAgICAgaXNBcnJheShbXSk7XG4gKiAgICAgICAgLy8gPiB0cnVlXG4gKiAgICAgICAgaXNBcnJheShhcmd1bWVudHMpO1xuICogICAgICAgIC8vID4gZmFsc2VcbiAqICAgICAgICBpc0FycmF5KCcnKTtcbiAqICAgICAgICAvLyA+IGZhbHNlXG4gKlxuICogQHBhcmFtIHttaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtib29sfVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheSB8fCBmdW5jdGlvbiAodmFsKSB7XG4gIHJldHVybiAhISB2YWwgJiYgJ1tvYmplY3QgQXJyYXldJyA9PSBzdHIuY2FsbCh2YWwpO1xufTtcbiIsIi8qKlxuICogRXBpY2VudGVyIEphdmFzY3JpcHQgbGlicmFyaWVzXG4gKiB2PCU9IHZlcnNpb24gJT5cbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9mb3Jpby9lcGljZW50ZXItanMtbGlic1xuICovXG5cbnZhciBGID0ge1xuICAgIHV0aWw6IHt9LFxuICAgIGZhY3Rvcnk6IHt9LFxuICAgIHRyYW5zcG9ydDoge30sXG4gICAgc3RvcmU6IHt9LFxuICAgIHNlcnZpY2U6IHt9LFxuICAgIG1hbmFnZXI6IHtcbiAgICAgICAgc3RyYXRlZ3k6IHt9XG4gICAgfSxcblxufTtcblxuRi51dGlsLnF1ZXJ5ID0gcmVxdWlyZSgnLi91dGlsL3F1ZXJ5LXV0aWwnKTtcbkYudXRpbC5tYWtlU2VxdWVuY2UgPSByZXF1aXJlKCcuL3V0aWwvbWFrZS1zZXF1ZW5jZScpO1xuRi51dGlsLnJ1biA9IHJlcXVpcmUoJy4vdXRpbC9ydW4tdXRpbCcpO1xuRi51dGlsLmNsYXNzRnJvbSA9IHJlcXVpcmUoJy4vdXRpbC9pbmhlcml0Jyk7XG5cbkYuZmFjdG9yeS5UcmFuc3BvcnQgPSByZXF1aXJlKCcuL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG5GLnRyYW5zcG9ydC5BamF4ID0gcmVxdWlyZSgnLi90cmFuc3BvcnQvYWpheC1odHRwLXRyYW5zcG9ydCcpO1xuXG5GLnNlcnZpY2UuVVJMID0gcmVxdWlyZSgnLi9zZXJ2aWNlL3VybC1jb25maWctc2VydmljZScpO1xuRi5zZXJ2aWNlLkNvbmZpZyA9IHJlcXVpcmUoJy4vc2VydmljZS9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbkYuc2VydmljZS5SdW4gPSByZXF1aXJlKCcuL3NlcnZpY2UvcnVuLWFwaS1zZXJ2aWNlJyk7XG5GLnNlcnZpY2UuRmlsZSA9IHJlcXVpcmUoJy4vc2VydmljZS9hZG1pbi1maWxlLWFwaScpO1xuRi5zZXJ2aWNlLlZhcmlhYmxlcyA9IHJlcXVpcmUoJy4vc2VydmljZS92YXJpYWJsZXMtYXBpLXNlcnZpY2UnKTtcbkYuc2VydmljZS5EYXRhID0gcmVxdWlyZSgnLi9zZXJ2aWNlL2RhdGEtYXBpLXNlcnZpY2UnKTtcbkYuc2VydmljZS5BdXRoID0gcmVxdWlyZSgnLi9zZXJ2aWNlL2F1dGgtYXBpLXNlcnZpY2UnKTtcbkYuc2VydmljZS5Xb3JsZCA9IHJlcXVpcmUoJy4vc2VydmljZS93b3JsZC1hcGktYWRhcHRlcicpO1xuRi5zZXJ2aWNlLlN0YXRlID0gcmVxdWlyZSgnLi9zZXJ2aWNlL3N0YXRlLWFwaS1hZGFwdGVyJyk7XG5GLnNlcnZpY2UuVXNlciA9IHJlcXVpcmUoJy4vc2VydmljZS91c2VyLWFwaS1hZGFwdGVyJyk7XG5GLnNlcnZpY2UuTWVtYmVyID0gcmVxdWlyZSgnLi9zZXJ2aWNlL21lbWJlci1hcGktYWRhcHRlcicpO1xuRi5zZXJ2aWNlLkFzc2V0ID0gcmVxdWlyZSgnLi9zZXJ2aWNlL2Fzc2V0LWFwaS1hZGFwdGVyJyk7XG5cbkYuc3RvcmUuQ29va2llID0gcmVxdWlyZSgnLi9zdG9yZS9jb29raWUtc3RvcmUnKTtcbkYuZmFjdG9yeS5TdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmUvc3RvcmUtZmFjdG9yeScpO1xuXG5GLm1hbmFnZXIuU2NlbmFyaW9NYW5hZ2VyID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9zY2VuYXJpby1tYW5hZ2VyJyk7XG5GLm1hbmFnZXIuUnVuTWFuYWdlciA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvcnVuLW1hbmFnZXInKTtcbkYubWFuYWdlci5BdXRoTWFuYWdlciA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvYXV0aC1tYW5hZ2VyJyk7XG5GLm1hbmFnZXIuV29ybGRNYW5hZ2VyID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy93b3JsZC1tYW5hZ2VyJyk7XG5cbkYubWFuYWdlci5zdHJhdGVneVsnYWx3YXlzLW5ldyddID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9hbHdheXMtbmV3LXN0cmF0ZWd5Jyk7XG5GLm1hbmFnZXIuc3RyYXRlZ3lbJ2NvbmRpdGlvbmFsLWNyZWF0aW9uJ10gPSByZXF1aXJlKCcuL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL2NvbmRpdGlvbmFsLWNyZWF0aW9uLXN0cmF0ZWd5Jyk7XG5GLm1hbmFnZXIuc3RyYXRlZ3kuaWRlbnRpdHkgPSByZXF1aXJlKCcuL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL2lkZW50aXR5LXN0cmF0ZWd5Jyk7XG5GLm1hbmFnZXIuc3RyYXRlZ3lbJ25ldy1pZi1taXNzaW5nJ10gPSByZXF1aXJlKCcuL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL25ldy1pZi1taXNzaW5nLXN0cmF0ZWd5Jyk7XG5GLm1hbmFnZXIuc3RyYXRlZ3lbJ25ldy1pZi1taXNzaW5nJ10gPSByZXF1aXJlKCcuL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL25ldy1pZi1taXNzaW5nLXN0cmF0ZWd5Jyk7XG5GLm1hbmFnZXIuc3RyYXRlZ3lbJ25ldy1pZi1wZXJzaXN0ZWQnXSA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvbmV3LWlmLXBlcnNpc3RlZC1zdHJhdGVneScpO1xuRi5tYW5hZ2VyLnN0cmF0ZWd5WyduZXctaWYtaW5pdGlhbGl6ZWQnXSA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvbmV3LWlmLWluaXRpYWxpemVkLXN0cmF0ZWd5Jyk7XG5cbkYubWFuYWdlci5DaGFubmVsTWFuYWdlciA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlcicpO1xuRi5zZXJ2aWNlLkNoYW5uZWwgPSByZXF1aXJlKCcuL3NlcnZpY2UvY2hhbm5lbC1zZXJ2aWNlJyk7XG5cbkYudmVyc2lvbiA9ICc8JT0gdmVyc2lvbiAlPic7XG5cblxuZ2xvYmFsLkYgPSBGO1xubW9kdWxlLmV4cG9ydHMgPSBGO1xuIiwiLyoqXG4qICMjIEF1dGhvcml6YXRpb24gTWFuYWdlclxuKlxuKiBUaGUgQXV0aG9yaXphdGlvbiBNYW5hZ2VyIHByb3ZpZGVzIGFuIGVhc3kgd2F5IHRvIG1hbmFnZSB1c2VyIGF1dGhlbnRpY2F0aW9uIChsb2dnaW5nIGluIGFuZCBvdXQpIGFuZCBhdXRob3JpemF0aW9uIChrZWVwaW5nIHRyYWNrIG9mIHRva2Vucywgc2Vzc2lvbnMsIGFuZCBncm91cHMpIGZvciBwcm9qZWN0cy5cbipcbiogVGhlIEF1dGhvcml6YXRpb24gTWFuYWdlciBpcyBtb3N0IHVzZWZ1bCBmb3IgW3RlYW0gcHJvamVjdHNdKC4uLy4uLy4uL2dsb3NzYXJ5LyN0ZWFtKSB3aXRoIGFuIGFjY2VzcyBsZXZlbCBvZiBbQXV0aGVudGljYXRlZF0oLi4vLi4vLi4vZ2xvc3NhcnkvI2FjY2VzcykuIFRoZXNlIHByb2plY3RzIGFyZSBhY2Nlc3NlZCBieSBbZW5kIHVzZXJzXSguLi8uLi8uLi9nbG9zc2FyeS8jdXNlcnMpIHdobyBhcmUgbWVtYmVycyBvZiBvbmUgb3IgbW9yZSBbZ3JvdXBzXSguLi8uLi8uLi9nbG9zc2FyeS8jZ3JvdXBzKS5cbipcbiogIyMjI1VzaW5nIHRoZSBBdXRob3JpemF0aW9uIE1hbmFnZXJcbipcbiogVG8gdXNlIHRoZSBBdXRob3JpemF0aW9uIE1hbmFnZXIsIGluc3RhbnRpYXRlIGl0LiBUaGVuLCBtYWtlIGNhbGxzIHRvIGFueSBvZiB0aGUgbWV0aG9kcyB5b3UgbmVlZDpcbipcbiogICAgICAgdmFyIGF1dGhNZ3IgPSBuZXcgRi5tYW5hZ2VyLkF1dGhNYW5hZ2VyKHtcbiogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiogICAgICAgICAgIHVzZXJOYW1lOiAnZW5kdXNlcjEnLFxuKiAgICAgICAgICAgcGFzc3dvcmQ6ICdwYXNzdzByZCdcbiogICAgICAgfSk7XG4qICAgICAgIGF1dGhNZ3IubG9naW4oKS50aGVuKGZ1bmN0aW9uICgpIHtcbiogICAgICAgICAgIGF1dGhNZ3IuZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbygpO1xuKiAgICAgICB9KTtcbipcbipcbiogVGhlIGBvcHRpb25zYCBvYmplY3QgcGFzc2VkIHRvIHRoZSBgRi5tYW5hZ2VyLkF1dGhNYW5hZ2VyKClgIGNhbGwgY2FuIGluY2x1ZGU6XG4qXG4qICAgKiBgYWNjb3VudGA6IFRoZSBhY2NvdW50IGlkIGZvciB0aGlzIGB1c2VyTmFtZWAuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgdGhlICoqVXNlciBJRCoqIChmb3IgcGVyc29uYWwgcHJvamVjdHMpLlxuKiAgICogYHVzZXJOYW1lYDogRW1haWwgb3IgdXNlcm5hbWUgdG8gdXNlIGZvciBsb2dnaW5nIGluLlxuKiAgICogYHBhc3N3b3JkYDogUGFzc3dvcmQgZm9yIHNwZWNpZmllZCBgdXNlck5hbWVgLlxuKiAgICogYHByb2plY3RgOiBUaGUgKipQcm9qZWN0IElEKiogZm9yIHRoZSBwcm9qZWN0IHRvIGxvZyB0aGlzIHVzZXIgaW50by4gT3B0aW9uYWwuXG4qICAgKiBgZ3JvdXBJZGA6IElkIG9mIHRoZSBncm91cCB0byB3aGljaCBgdXNlck5hbWVgIGJlbG9uZ3MuIFJlcXVpcmVkIGZvciBlbmQgdXNlcnMgaWYgdGhlIGBwcm9qZWN0YCBpcyBzcGVjaWZpZWQuXG4qXG4qIElmIHlvdSBwcmVmZXIgc3RhcnRpbmcgZnJvbSBhIHRlbXBsYXRlLCB0aGUgRXBpY2VudGVyIEpTIExpYnMgW0xvZ2luIENvbXBvbmVudF0oLi4vLi4vI2NvbXBvbmVudHMpIHVzZXMgdGhlIEF1dGhvcml6YXRpb24gTWFuYWdlciBhcyB3ZWxsLiBUaGlzIHNhbXBsZSBIVE1MIHBhZ2UgKGFuZCBhc3NvY2lhdGVkIENTUyBhbmQgSlMgZmlsZXMpIHByb3ZpZGVzIGEgbG9naW4gZm9ybSBmb3IgdGVhbSBtZW1iZXJzIGFuZCBlbmQgdXNlcnMgb2YgeW91ciBwcm9qZWN0LiBJdCBhbHNvIGluY2x1ZGVzIGEgZ3JvdXAgc2VsZWN0b3IgZm9yIGVuZCB1c2VycyB0aGF0IGFyZSBtZW1iZXJzIG9mIG11bHRpcGxlIGdyb3Vwcy5cbiovXG5cbid1c2Ugc3RyaWN0JztcbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi4vc2VydmljZS9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBBdXRoQWRhcHRlciA9IHJlcXVpcmUoJy4uL3NlcnZpY2UvYXV0aC1hcGktc2VydmljZScpO1xudmFyIE1lbWJlckFkYXB0ZXIgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL21lbWJlci1hcGktYWRhcHRlcicpO1xudmFyIFN0b3JhZ2VGYWN0b3J5ID0gcmVxdWlyZSgnLi4vc3RvcmUvc3RvcmUtZmFjdG9yeScpO1xudmFyIEJ1ZmZlciA9IHJlcXVpcmUoJ2J1ZmZlcicpLkJ1ZmZlcjtcbnZhciBrZXlOYW1lcyA9IHJlcXVpcmUoJy4va2V5LW5hbWVzJyk7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICAvKipcbiAgICAgKiBXaGVyZSB0byBzdG9yZSB1c2VyIGFjY2VzcyB0b2tlbnMgZm9yIHRlbXBvcmFyeSBhY2Nlc3MuIERlZmF1bHRzIHRvIHN0b3JpbmcgaW4gYSBjb29raWUgaW4gdGhlIGJyb3dzZXIuXG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cbiAgICBzdG9yZTogeyBzeW5jaHJvbm91czogdHJ1ZSB9XG59O1xuXG52YXIgRVBJX0NPT0tJRV9LRVkgPSBrZXlOYW1lcy5FUElfQ09PS0lFX0tFWTtcbnZhciBFUElfU0VTU0lPTl9LRVkgPSBrZXlOYW1lcy5FUElfU0VTU0lPTl9LRVk7XG52YXIgc3RvcmU7XG52YXIgdG9rZW47XG52YXIgc2Vzc2lvbjtcblxuZnVuY3Rpb24gc2F2ZVNlc3Npb24odXNlckluZm8pIHtcbiAgICB2YXIgc2VyaWFsaXplZCA9IEpTT04uc3RyaW5naWZ5KHVzZXJJbmZvKTtcbiAgICBzdG9yZS5zZXQoRVBJX1NFU1NJT05fS0VZLCBzZXJpYWxpemVkKTtcblxuICAgIC8vanNoaW50IGNhbWVsY2FzZTogZmFsc2VcbiAgICAvL2pzY3M6ZGlzYWJsZVxuICAgIHN0b3JlLnNldChFUElfQ09PS0lFX0tFWSwgdXNlckluZm8uYXV0aF90b2tlbik7XG59XG5cbmZ1bmN0aW9uIGdldFNlc3Npb24oKSB7XG4gICAgdmFyIHNlc3Npb24gPSBzdG9yZS5nZXQoRVBJX1NFU1NJT05fS0VZKSB8fCAne30nO1xuICAgIHJldHVybiBKU09OLnBhcnNlKHNlc3Npb24pO1xufVxuXG5mdW5jdGlvbiBBdXRoTWFuYWdlcihvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBvcHRpb25zKTtcblxuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZSh0aGlzLm9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMuYWNjb3VudCA9IHVybENvbmZpZy5hY2NvdW50UGF0aDtcbiAgICB9XG5cbiAgICAvLyBudWxsIG1pZ2h0IHNwZWNpZmllZCB0byBkaXNhYmxlIHByb2plY3QgZmlsdGVyaW5nXG4gICAgaWYgKHRoaXMub3B0aW9ucy5wcm9qZWN0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnByb2plY3QgPSB1cmxDb25maWcucHJvamVjdFBhdGg7XG4gICAgfVxuXG4gICAgc3RvcmUgPSBuZXcgU3RvcmFnZUZhY3RvcnkodGhpcy5vcHRpb25zLnN0b3JlKTtcbiAgICBzZXNzaW9uID0gZ2V0U2Vzc2lvbigpO1xuICAgIHRva2VuID0gc3RvcmUuZ2V0KEVQSV9DT09LSUVfS0VZKSB8fCAnJztcbiAgICAvL2pzaGludCBjYW1lbGNhc2U6IGZhbHNlXG4gICAgLy9qc2NzOmRpc2FibGVcbiAgICB0aGlzLmF1dGhBZGFwdGVyID0gbmV3IEF1dGhBZGFwdGVyKHRoaXMub3B0aW9ucywgeyB0b2tlbjogc2Vzc2lvbi5hdXRoX3Rva2VuIH0pO1xufVxuXG52YXIgX2ZpbmRVc2VySW5Hcm91cCA9IGZ1bmN0aW9uIChtZW1iZXJzLCBpZCkge1xuICAgIGZvciAodmFyIGogPSAwOyBqPG1lbWJlcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKG1lbWJlcnNbal0udXNlcklkID09PSBpZCkge1xuICAgICAgICAgICAgcmV0dXJuIG1lbWJlcnNbal07XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHJldHVybiBudWxsO1xufTtcblxuQXV0aE1hbmFnZXIucHJvdG90eXBlID0gJC5leHRlbmQoQXV0aE1hbmFnZXIucHJvdG90eXBlLCB7XG5cbiAgICAvKipcbiAgICAqIExvZ3MgdXNlciBpbi5cbiAgICAqXG4gICAgKiAqKkV4YW1wbGUqKlxuICAgICpcbiAgICAqICAgICAgIGF1dGhNZ3IubG9naW4oe1xuICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLCBcbiAgICAqICAgICAgICAgICB1c2VyTmFtZTogJ2VuZHVzZXIxJyxcbiAgICAqICAgICAgICAgICBwYXNzd29yZDogJ3Bhc3N3MHJkJyBcbiAgICAqICAgICAgIH0pXG4gICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oc3RhdHVzT2JqKSB7XG4gICAgKiAgICAgICAgICAgICAgIC8vIGlmIGVuZHVzZXIxIGJlbG9uZ3MgdG8gZXhhY3RseSBvbmUgZ3JvdXBcbiAgICAqICAgICAgICAgICAgICAgLy8gKG9yIGlmIHRoZSBsb2dpbigpIGNhbGwgaXMgbW9kaWZpZWQgdG8gaW5jbHVkZSB0aGUgZ3JvdXAgaWQpXG4gICAgKiAgICAgICAgICAgICAgIC8vIGNvbnRpbnVlIGhlcmVcbiAgICAqICAgICAgICAgICB9KVxuICAgICogICAgICAgICAgIC5mYWlsKGZ1bmN0aW9uKHN0YXR1c09iaikge1xuICAgICogICAgICAgICAgICAgICAvLyBpZiBlbmR1c2VyMSBiZWxvbmdzIHRvIG11bHRpcGxlIGdyb3VwcywgXG4gICAgKiAgICAgICAgICAgICAgIC8vIHRoZSBsb2dpbigpIGNhbGwgZmFpbHMgXG4gICAgKiAgICAgICAgICAgICAgIC8vIGFuZCByZXR1cm5zIGFsbCBncm91cHMgb2Ygd2hpY2ggdGhlIHVzZXIgaXMgYSBtZW1iZXJcbiAgICAqICAgICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpIDwgc3RhdHVzT2JqLnVzZXJHcm91cHMubGVuZ3RoOyBpKyspIHtcbiAgICAqICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHN0YXR1c09iai51c2VyR3JvdXBzW2ldLm5hbWUsIHN0YXR1c09iai51c2VyR3JvdXBzW2ldLmdyb3VwSWQpO1xuICAgICogICAgICAgICAgICAgICB9XG4gICAgKiAgICAgICAgICAgfSk7XG4gICAgKlxuICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAqXG4gICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuIElmIG5vdCBwYXNzZWQgaW4gd2hlbiBjcmVhdGluZyBhbiBpbnN0YW5jZSBvZiB0aGUgbWFuYWdlciAoYEYubWFuYWdlci5BdXRoTWFuYWdlcigpYCksIHRoZXNlIG9wdGlvbnMgc2hvdWxkIGluY2x1ZGU6IFxuICAgICogQHBhcmFtIHtzdHJpbmd9IGBvcHRpb25zLmFjY291bnRgIFRoZSBhY2NvdW50IGlkIGZvciB0aGlzIGB1c2VyTmFtZWAuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgdGhlICoqVXNlciBJRCoqIChmb3IgcGVyc29uYWwgcHJvamVjdHMpLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IGBvcHRpb25zLnVzZXJOYW1lYCBFbWFpbCBvciB1c2VybmFtZSB0byB1c2UgZm9yIGxvZ2dpbmcgaW4uXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gYG9wdGlvbnMucGFzc3dvcmRgIFBhc3N3b3JkIGZvciBzcGVjaWZpZWQgYHVzZXJOYW1lYC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBgb3B0aW9ucy5wcm9qZWN0YCAoT3B0aW9uYWwpIFRoZSAqKlByb2plY3QgSUQqKiBmb3IgdGhlIHByb2plY3QgdG8gbG9nIHRoaXMgdXNlciBpbnRvLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IGBvcHRpb25zLmdyb3VwSWRgIFRoZSBpZCBvZiB0aGUgZ3JvdXAgdG8gd2hpY2ggYHVzZXJOYW1lYCBiZWxvbmdzLiBSZXF1aXJlZCBmb3IgW2VuZCB1c2Vyc10oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKSBpZiB0aGUgYHByb2plY3RgIGlzIHNwZWNpZmllZCBhbmQgaWYgdGhlIGVuZCB1c2VycyBhcmUgbWVtYmVycyBvZiBtdWx0aXBsZSBbZ3JvdXBzXSguLi8uLi8uLi9nbG9zc2FyeS8jZ3JvdXBzKSwgb3RoZXJ3aXNlIG9wdGlvbmFsLiBcbiAgICAqL1xuICAgIGxvZ2luOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgJGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgIHZhciBhZGFwdGVyT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHsgc3VjY2VzczogJC5ub29wLCBlcnJvcjogJC5ub29wIH0sIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgIHZhciBvdXRTdWNjZXNzID0gYWRhcHRlck9wdGlvbnMuc3VjY2VzcztcbiAgICAgICAgdmFyIG91dEVycm9yID0gYWRhcHRlck9wdGlvbnMuZXJyb3I7XG4gICAgICAgIHZhciBncm91cElkID0gYWRhcHRlck9wdGlvbnMuZ3JvdXBJZDtcblxuICAgICAgICB2YXIgZGVjb2RlVG9rZW4gPSBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgICAgIHZhciBlbmNvZGVkID0gdG9rZW4uc3BsaXQoJy4nKVsxXTtcbiAgICAgICAgICAgIHdoaWxlIChlbmNvZGVkLmxlbmd0aCAlIDQgIT09IDApIHtcbiAgICAgICAgICAgICAgICBlbmNvZGVkICs9ICc9JztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGRlY29kZSA9IHdpbmRvdy5hdG9iID8gd2luZG93LmF0b2IgOiBmdW5jdGlvbiAoZW5jb2RlZCkgeyByZXR1cm4gbmV3IEJ1ZmZlcihlbmNvZGVkLCAnYmFzZTY0JykudG9TdHJpbmcoJ2FzY2lpJyk7IH07XG5cbiAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKGRlY29kZShlbmNvZGVkKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZUdyb3VwRXJyb3IgPSBmdW5jdGlvbiAobWVzc2FnZSwgc3RhdHVzQ29kZSwgZGF0YSkge1xuICAgICAgICAgICAgLy8gbG9nb3V0IHRoZSB1c2VyIHNpbmNlIGl0J3MgaW4gYW4gaW52YWxpZCBzdGF0ZSB3aXRoIG5vIGdyb3VwIHNlbGVjdGVkXG4gICAgICAgICAgICBfdGhpcy5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXJyb3IgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGF0YSwgeyBzdGF0dXNUZXh0OiBtZXNzYWdlLCBzdGF0dXM6IHN0YXR1c0NvZGUgfSk7XG4gICAgICAgICAgICAgICAgJGQucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBoYW5kbGVTdWNjZXNzID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAvL2pzaGludCBjYW1lbGNhc2U6IGZhbHNlXG4gICAgICAgICAgICAvL2pzY3M6ZGlzYWJsZVxuICAgICAgICAgICAgdG9rZW4gPSByZXNwb25zZS5hY2Nlc3NfdG9rZW47XG5cbiAgICAgICAgICAgIHZhciB1c2VySW5mbyA9IGRlY29kZVRva2VuKHRva2VuKTtcbiAgICAgICAgICAgIHZhciB1c2VyR3JvdXBPcHRzID0gJC5leHRlbmQodHJ1ZSwge30sIGFkYXB0ZXJPcHRpb25zLCB7IHN1Y2Nlc3M6ICQubm9vcCwgdG9rZW46IHRva2VuIH0pO1xuICAgICAgICAgICAgX3RoaXMuZ2V0VXNlckdyb3Vwcyh7IHVzZXJJZDogdXNlckluZm8udXNlcl9pZCwgdG9rZW46IHRva2VuIH0sIHVzZXJHcm91cE9wdHMpLmRvbmUoIGZ1bmN0aW9uIChtZW1iZXJJbmZvKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRhdGEgPSB7YXV0aDogcmVzcG9uc2UsIHVzZXI6IHVzZXJJbmZvLCB1c2VyR3JvdXBzOiBtZW1iZXJJbmZvLCBncm91cFNlbGVjdGlvbjoge30gfTtcblxuICAgICAgICAgICAgICAgIHZhciBzZXNzaW9uSW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgJ2F1dGhfdG9rZW4nOiB0b2tlbixcbiAgICAgICAgICAgICAgICAgICAgJ2FjY291bnQnOiBhZGFwdGVyT3B0aW9ucy5hY2NvdW50LFxuICAgICAgICAgICAgICAgICAgICAncHJvamVjdCc6IGFkYXB0ZXJPcHRpb25zLnByb2plY3QsXG4gICAgICAgICAgICAgICAgICAgICd1c2VySWQnOiB1c2VySW5mby51c2VyX2lkXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvLyBUaGUgZ3JvdXAgaXMgbm90IHJlcXVpcmVkIGlmIHRoZSB1c2VyIGlzIG5vdCBsb2dnaW5nIGludG8gYSBwcm9qZWN0XG4gICAgICAgICAgICAgICAgaWYgKCFhZGFwdGVyT3B0aW9ucy5wcm9qZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHNhdmVTZXNzaW9uKHNlc3Npb25JbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgb3V0U3VjY2Vzcy5hcHBseSh0aGlzLCBbZGF0YV0pO1xuICAgICAgICAgICAgICAgICAgICAkZC5yZXNvbHZlKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGdyb3VwID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAobWVtYmVySW5mby5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlR3JvdXBFcnJvcignVGhlIHVzZXIgaGFzIG5vIGdyb3VwcyBhc3NvY2lhdGVkIGluIHRoaXMgYWNjb3VudCcsIDQwMSwgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1lbWJlckluZm8ubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFNlbGVjdCB0aGUgb25seSBncm91cFxuICAgICAgICAgICAgICAgICAgICBncm91cCA9IG1lbWJlckluZm9bMF07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtZW1iZXJJbmZvLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdyb3VwSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmaWx0ZXJlZEdyb3VwcyA9ICQuZ3JlcChtZW1iZXJJbmZvLCBmdW5jdGlvbiAocmVzR3JvdXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzR3JvdXAuZ3JvdXBJZCA9PT0gZ3JvdXBJZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXAgPSBmaWx0ZXJlZEdyb3Vwcy5sZW5ndGggPT09IDEgPyBmaWx0ZXJlZEdyb3Vwc1swXSA6IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZ3JvdXApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGdyb3VwU2VsZWN0aW9uID0gZ3JvdXAuZ3JvdXBJZDtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5ncm91cFNlbGVjdGlvblthZGFwdGVyT3B0aW9ucy5wcm9qZWN0XSA9IGdyb3VwU2VsZWN0aW9uO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2Vzc2lvbkluZm9XaXRoR3JvdXAgPSAkLmV4dGVuZCh7fSwgc2Vzc2lvbkluZm8sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdncm91cElkJzogZ3JvdXAuZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICdncm91cE5hbWUnOiBncm91cC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2lzRmFjJzogX2ZpbmRVc2VySW5Hcm91cChncm91cC5tZW1iZXJzLCB1c2VySW5mby51c2VyX2lkKS5yb2xlID09PSAnZmFjaWxpdGF0b3InXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzYXZlU2Vzc2lvbihzZXNzaW9uSW5mb1dpdGhHcm91cCk7XG4gICAgICAgICAgICAgICAgICAgIG91dFN1Y2Nlc3MuYXBwbHkodGhpcywgW2RhdGFdKTtcbiAgICAgICAgICAgICAgICAgICAgJGQucmVzb2x2ZShkYXRhKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVHcm91cEVycm9yKCdUaGlzIHVzZXIgaXMgYXNzb2NpYXRlZCB3aXRoIG1vcmUgdGhhbiBvbmUgZ3JvdXAuIFBsZWFzZSBzcGVjaWZ5IGEgZ3JvdXAgaWQgdG8gbG9nIGludG8gYW5kIHRyeSBhZ2FpbicsIDQwMywgZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuZmFpbCgkZC5yZWplY3QpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGFkYXB0ZXJPcHRpb25zLnN1Y2Nlc3MgPSBoYW5kbGVTdWNjZXNzO1xuICAgICAgICBhZGFwdGVyT3B0aW9ucy5lcnJvciA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgaWYgKGFkYXB0ZXJPcHRpb25zLmFjY291bnQpIHtcbiAgICAgICAgICAgICAgICAvLyBUcnkgdG8gbG9naW4gYXMgYSBzeXN0ZW0gdXNlclxuICAgICAgICAgICAgICAgIGFkYXB0ZXJPcHRpb25zLmFjY291bnQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGFkYXB0ZXJPcHRpb25zLmVycm9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBvdXRFcnJvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICAkZC5yZWplY3QocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBfdGhpcy5hdXRoQWRhcHRlci5sb2dpbihhZGFwdGVyT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvdXRFcnJvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgJGQucmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmF1dGhBZGFwdGVyLmxvZ2luKGFkYXB0ZXJPcHRpb25zKTtcbiAgICAgICAgcmV0dXJuICRkLnByb21pc2UoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgKiBMb2dzIHVzZXIgb3V0LlxuICAgICpcbiAgICAqICoqRXhhbXBsZSoqXG4gICAgKlxuICAgICogICAgICAgYXV0aE1nci5sb2dvdXQoKTtcbiAgICAqXG4gICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICpcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAqL1xuICAgIGxvZ291dDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyICRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICB2YXIgYWRhcHRlck9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7c3VjY2VzczogJC5ub29wLCB0b2tlbjogdG9rZW4gfSwgdGhpcy5vcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICB2YXIgcmVtb3ZlQ29va2llRm4gPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHN0b3JlLnJlbW92ZShFUElfQ09PS0lFX0tFWSwgYWRhcHRlck9wdGlvbnMpO1xuICAgICAgICAgICAgc3RvcmUucmVtb3ZlKEVQSV9TRVNTSU9OX0tFWSwgYWRhcHRlck9wdGlvbnMpO1xuICAgICAgICAgICAgdG9rZW4gPSAnJztcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgb3V0U3VjY2VzcyA9IGFkYXB0ZXJPcHRpb25zLnN1Y2Nlc3M7XG4gICAgICAgIGFkYXB0ZXJPcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHJlbW92ZUNvb2tpZUZuKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIG91dFN1Y2Nlc3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBFcGljZW50ZXIgcmV0dXJucyBhIGJhZCByZXF1ZXN0IHdoZW4gdHJ5aW5nIHRvIGRlbGV0ZSBhIHRva2VuLiBJdCBzZWVtcyBsaWtlIHRoZSBBUEkgY2FsbCBpcyBub3QgaW1wbGVtZW50ZWQgeWV0XG4gICAgICAgIC8vIE9uY2UgaXQncyBpbXBsZW1lbnRlZCB0aGlzIGVycm9yIGhhbmRsZXIgc2hvdWxkIG5vdCBiZSBuZWNlc3NhcnkuXG4gICAgICAgIGFkYXB0ZXJPcHRpb25zLmVycm9yID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZW1vdmVDb29raWVGbihyZXNwb25zZSk7XG4gICAgICAgICAgICBvdXRTdWNjZXNzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAkZC5yZXNvbHZlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5hdXRoQWRhcHRlci5sb2dvdXQoYWRhcHRlck9wdGlvbnMpLmRvbmUoJGQucmVzb2x2ZSk7XG4gICAgICAgIHJldHVybiAkZC5wcm9taXNlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGV4aXN0aW5nIHVzZXIgYWNjZXNzIHRva2VuIGlmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluLiBPdGhlcndpc2UsIGxvZ3MgdGhlIHVzZXIgaW4sIGNyZWF0aW5nIGEgbmV3IHVzZXIgYWNjZXNzIHRva2VuLCBhbmQgcmV0dXJucyB0aGUgbmV3IHRva2VuLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICBhdXRoTWdyLmdldFRva2VuKClcbiAgICAgKiAgICAgICAgICAudGhlbihmdW5jdGlvbiAodG9rZW4pIHsgXG4gICAgICogICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNeSB0b2tlbiBpcyAnLCB0b2tlbik7IFxuICAgICAqICAgICAgICAgIH0pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICovXG4gICAgZ2V0VG9rZW46IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgdmFyICRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICBpZiAodG9rZW4pIHtcbiAgICAgICAgICAgICRkLnJlc29sdmUodG9rZW4pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sb2dpbihodHRwT3B0aW9ucykudGhlbigkZC5yZXNvbHZlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJGQucHJvbWlzZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGdyb3VwIHJlY29yZHMsIG9uZSBmb3IgZWFjaCBncm91cCBvZiB3aGljaCB0aGUgY3VycmVudCB1c2VyIGlzIGEgbWVtYmVyLiBFYWNoIGdyb3VwIHJlY29yZCBpbmNsdWRlcyB0aGUgZ3JvdXAgYG5hbWVgLCBgYWNjb3VudGAsIGBwcm9qZWN0YCwgYW5kIGBncm91cElkYC5cbiAgICAgKlxuICAgICAqIElmIHNvbWUgZW5kIHVzZXJzIGluIHlvdXIgcHJvamVjdCBhcmUgbWVtYmVycyBvZiBtdWx0aXBsZSBncm91cHMsIHRoaXMgaXMgYSB1c2VmdWwgbWV0aG9kIHRvIGNhbGwgb24geW91ciBwcm9qZWN0J3MgbG9naW4gcGFnZS4gV2hlbiB0aGUgdXNlciBhdHRlbXB0cyB0byBsb2cgaW4sIHlvdSBjYW4gdXNlIHRoaXMgdG8gZGlzcGxheSB0aGUgZ3JvdXBzIG9mIHdoaWNoIHRoZSB1c2VyIGlzIG1lbWJlciwgYW5kIGhhdmUgdGhlIHVzZXIgc2VsZWN0IHRoZSBjb3JyZWN0IGdyb3VwIHRvIGxvZyBpbiB0byBmb3IgdGhpcyBzZXNzaW9uLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgLy8gZ2V0IGdyb3VwcyBmb3IgY3VycmVudCB1c2VyXG4gICAgICogICAgICB2YXIgc2Vzc2lvbk9iaiA9IGF1dGhNZ3IuZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbygpO1xuICAgICAqICAgICAgYXV0aE1nci5nZXRVc2VyR3JvdXBzKHsgdXNlcklkOiBzZXNzaW9uT2JqLnVzZXJJZCwgdG9rZW46IHNlc3Npb25PYmouYXV0aF90b2tlbiB9KVxuICAgICAqICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChncm91cHMpIHsgXG4gICAgICogICAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaSA8IGdyb3Vwcy5sZW5ndGg7IGkrKykgXG4gICAgICogICAgICAgICAgICAgICAgICB7IGNvbnNvbGUubG9nKGdyb3Vwc1tpXS5uYW1lKTsgfVxuICAgICAqICAgICAgICAgIH0pO1xuICAgICAqXG4gICAgICogICAgICAvLyBnZXQgZ3JvdXBzIGZvciBwYXJ0aWN1bGFyIHVzZXJcbiAgICAgKiAgICAgIGF1dGhNZ3IuZ2V0VXNlckdyb3Vwcyh7dXNlcklkOiAnYjFjMTlkZGEtMmQyZS00Nzc3LWFkNWQtMzkyOWYxN2U4NmQzJywgdG9rZW46IHNhdmVkUHJvakFjY2Vzc1Rva2VuIH0pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gYHBhcmFtc2AgT2JqZWN0IHdpdGggYSB1c2VySWQgYW5kIHRva2VuIHByb3BlcnRpZXMuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGBwYXJhbXMudXNlcklkYCBUaGUgdXNlcklkLiBJZiBsb29raW5nIHVwIGdyb3VwcyBmb3IgdGhlIGN1cnJlbnRseSBsb2dnZWQgaW4gdXNlciwgdGhpcyBpcyBpbiB0aGUgc2Vzc2lvbiBpbmZvcm1hdGlvbi4gT3RoZXJ3aXNlLCBwYXNzIGEgc3RyaW5nLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBgcGFyYW1zLnRva2VuYCBUaGUgYXV0aG9yaXphdGlvbiBjcmVkZW50aWFscyAoYWNjZXNzIHRva2VuKSB0byB1c2UgZm9yIGNoZWNraW5nIHRoZSBncm91cHMgZm9yIHRoaXMgdXNlci4gSWYgbG9va2luZyB1cCBncm91cHMgZm9yIHRoZSBjdXJyZW50bHkgbG9nZ2VkIGluIHVzZXIsIHRoaXMgaXMgaW4gdGhlIHNlc3Npb24gaW5mb3JtYXRpb24uIEEgdGVhbSBtZW1iZXIncyB0b2tlbiBvciBhIHByb2plY3QgYWNjZXNzIHRva2VuIGNhbiBhY2Nlc3MgYWxsIHRoZSBncm91cHMgZm9yIGFsbCBlbmQgdXNlcnMgaW4gdGhlIHRlYW0gb3IgcHJvamVjdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICovXG4gICAgZ2V0VXNlckdyb3VwczogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICB2YXIgYWRhcHRlck9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7IHN1Y2Nlc3M6ICQubm9vcCB9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICB2YXIgJGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgIHZhciBvdXRTdWNjZXNzID0gYWRhcHRlck9wdGlvbnMuc3VjY2VzcztcblxuICAgICAgICBhZGFwdGVyT3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24gKG1lbWJlckluZm8pIHtcbiAgICAgICAgICAgIC8vIFRoZSBtZW1iZXIgQVBJIGlzIGF0IHRoZSBhY2NvdW50IHNjb3BlLCB3ZSBmaWx0ZXIgYnkgcHJvamVjdFxuICAgICAgICAgICAgaWYgKGFkYXB0ZXJPcHRpb25zLnByb2plY3QpIHtcbiAgICAgICAgICAgICAgICBtZW1iZXJJbmZvID0gJC5ncmVwKG1lbWJlckluZm8sIGZ1bmN0aW9uIChncm91cCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ3JvdXAucHJvamVjdCA9PT0gYWRhcHRlck9wdGlvbnMucHJvamVjdDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3V0U3VjY2Vzcy5hcHBseSh0aGlzLCBbbWVtYmVySW5mb10pO1xuICAgICAgICAgICAgJGQucmVzb2x2ZShtZW1iZXJJbmZvKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgbWVtYmVyQWRhcHRlciA9IG5ldyBNZW1iZXJBZGFwdGVyKHsgdG9rZW46IHBhcmFtcy50b2tlbiB9KTtcbiAgICAgICAgbWVtYmVyQWRhcHRlci5nZXRHcm91cHNGb3JVc2VyKHBhcmFtcywgYWRhcHRlck9wdGlvbnMpLmZhaWwoJGQucmVqZWN0KTtcbiAgICAgICAgcmV0dXJuICRkLnByb21pc2UoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBzZXNzaW9uIGluZm9ybWF0aW9uIGZvciB0aGUgY3VycmVudCB1c2VyLCBpbmNsdWRpbmcgdGhlIGB1c2VySWRgLCBgYWNjb3VudGAsIGBwcm9qZWN0YCwgYGdyb3VwSWRgLCBgZ3JvdXBOYW1lYCwgYGlzRmFjYCAod2hldGhlciB0aGUgZW5kIHVzZXIgaXMgYSBmYWNpbGl0YXRvciBvZiB0aGlzIGdyb3VwKSwgYW5kIGBhdXRoX3Rva2VuYCAodXNlciBhY2Nlc3MgdG9rZW4pLlxuICAgICAqXG4gICAgICogKkltcG9ydGFudCo6IFRoaXMgbWV0aG9kIGlzIHN5bmNocm9ub3VzLiBUaGUgc2Vzc2lvbiBpbmZvcm1hdGlvbiBpcyByZXR1cm5lZCBpbW1lZGlhdGVseSBpbiBhbiBvYmplY3Q7IG5vIGNhbGxiYWNrcyBvciBwcm9taXNlcyBhcmUgbmVlZGVkLlxuICAgICAqXG4gICAgICogQnkgZGVmYXVsdCwgc2Vzc2lvbiBpbmZvcm1hdGlvbiBpcyBzdG9yZWQgaW4gYSBjb29raWUgaW4gdGhlIGJyb3dzZXIuIFlvdSBjYW4gY2hhbmdlIHRoaXMgd2l0aCB0aGUgYHN0b3JlYCBjb25maWd1cmF0aW9uIG9wdGlvbi4gXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICB2YXIgc2Vzc2lvbk9iaiA9IGF1dGhNZ3IuZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbygpO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICovXG4gICAgZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbzogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIGdldFNlc3Npb24ob3B0aW9ucyk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXV0aE1hbmFnZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBDaGFubmVsID0gcmVxdWlyZSgnLi4vc2VydmljZS9jaGFubmVsLXNlcnZpY2UnKTtcblxuLyoqXG4gKiAjIyBDaGFubmVsIE1hbmFnZXJcbiAqXG4gKiBUaGVyZSBhcmUgdHdvIG1haW4gdXNlIGNhc2VzIGZvciB0aGUgY2hhbm5lbDogZXZlbnQgbm90aWZpY2F0aW9ucyBhbmQgY2hhdCBtZXNzYWdlcy5cbiAqXG4gKiBUaGUgQ2hhbm5lbCBNYW5hZ2VyIGlzIGEgd3JhcHBlciBhcm91bmQgdGhlIGRlZmF1bHQgW2NvbWV0ZCBKYXZhU2NyaXB0IGxpYnJhcnldKGh0dHA6Ly9kb2NzLmNvbWV0ZC5vcmcvMi9yZWZlcmVuY2UvamF2YXNjcmlwdC5odG1sKSwgYCQuY29tZXRkYC4gSXQgcHJvdmlkZXMgYSBmZXcgbmljZSBmZWF0dXJlcyB0aGF0IGAkLmNvbWV0ZGAgZG9lc24ndCwgaW5jbHVkaW5nOlxuICpcbiAqICogQXV0b21hdGljIHJlLXN1YnNjcmlwdGlvbiB0byBjaGFubmVscyBpZiB5b3UgbG9zZSB5b3VyIGNvbm5lY3Rpb25cbiAqICogT25saW5lIC8gT2ZmbGluZSBub3RpZmljYXRpb25zXG4gKiAqICdFdmVudHMnIGZvciBjb21ldGQgbm90aWZpY2F0aW9ucyAoaW5zdGVhZCBvZiBoYXZpbmcgdG8gbGlzdGVuIG9uIHNwZWNpZmljIG1ldGEgY2hhbm5lbHMpXG4gKlxuICogV2hpbGUgeW91IGNhbiB3b3JrIGRpcmVjdGx5IHdpdGggdGhlIENoYW5uZWwgTWFuYWdlciB0aHJvdWdoIE5vZGUuanMgKGZvciBleGFtcGxlLCBgcmVxdWlyZSgnbWFuYWdlci9jaGFubmVsLW1hbmFnZXInKWApIC0tIG9yIGV2ZW4gd29yayBkaXJlY3RseSB3aXRoIGAkLmNvbWV0ZGAgYW5kIEVwaWNlbnRlcidzIHVuZGVybHlpbmcgW1B1c2ggQ2hhbm5lbCBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9tdWx0aXBsYXllci9jaGFubmVsLykgLS0gbW9zdCBvZnRlbiBpdCB3aWxsIGJlIGVhc2llc3QgdG8gd29yayB3aXRoIHRoZSBbRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlcl0oLi4vZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlci8pLiBUaGUgRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlciBpcyBhIHdyYXBwZXIgdGhhdCBpbnN0YW50aWF0ZXMgYSBDaGFubmVsIE1hbmFnZXIgd2l0aCBFcGljZW50ZXItc3BlY2lmaWMgZGVmYXVsdHMuXG4gKlxuICogWW91J2xsIG5lZWQgdG8gaW5jbHVkZSB0aGUgYGVwaWNlbnRlci1tdWx0aXBsYXllci1kZXBlbmRlbmNpZXMuanNgIGxpYnJhcnkgaW4gYWRkaXRpb24gdG8gdGhlIGBlcGljZW50ZXIuanNgIGxpYnJhcnkgaW4geW91ciBwcm9qZWN0IHRvIHVzZSB0aGUgQ2hhbm5lbCBNYW5hZ2VyLiAoU2VlIFtJbmNsdWRpbmcgRXBpY2VudGVyLmpzXSguLi8uLi8jaW5jbHVkZSkuKVxuICpcbiAqIFRvIHVzZSB0aGUgQ2hhbm5lbCBNYW5hZ2VyIGluIGNsaWVudC1zaWRlIEphdmFTY3JpcHQsIGluc3RhbnRpYXRlIHRoZSBbRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlcl0oLi4vZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlci8pLCBnZXQgdGhlIGNoYW5uZWwsIHRoZW4gdXNlIHRoZSBjaGFubmVsJ3MgYHN1YnNjcmliZSgpYCBhbmQgYHB1Ymxpc2goKWAgbWV0aG9kcyB0byBzdWJzY3JpYmUgdG8gdG9waWNzIG9yIHB1Ymxpc2ggZGF0YSB0byB0b3BpY3MuXG4gKlxuICogICAgICAgIHZhciBjbSA9IG5ldyBGLm1hbmFnZXIuQ2hhbm5lbE1hbmFnZXIoKTtcbiAqICAgICAgICB2YXIgY2hhbm5lbCA9IGNtLmdldENoYW5uZWwoKTtcbiAqXG4gKiAgICAgICAgY2hhbm5lbC5zdWJzY3JpYmUoJ3RvcGljJywgY2FsbGJhY2spO1xuICogICAgICAgIGNoYW5uZWwucHVibGlzaCgndG9waWMnLCB7IG15RGF0YTogMTAwIH0pO1xuICpcbiAqIFRoZSBwYXJhbWV0ZXJzIGZvciBpbnN0YW50aWF0aW5nIGEgQ2hhbm5lbCBNYW5hZ2VyIGluY2x1ZGU6XG4gKlxuICogKiBgb3B0aW9uc2AgVGhlIG9wdGlvbnMgb2JqZWN0IHRvIGNvbmZpZ3VyZSB0aGUgQ2hhbm5lbCBNYW5hZ2VyLiBCZXNpZGVzIHRoZSBjb21tb24gb3B0aW9ucyBsaXN0ZWQgaGVyZSwgc2VlIGh0dHA6Ly9kb2NzLmNvbWV0ZC5vcmcvcmVmZXJlbmNlL2phdmFzY3JpcHQuaHRtbCBmb3Igb3RoZXIgc3VwcG9ydGVkIG9wdGlvbnMuXG4gKiAqIGBvcHRpb25zLnVybGAgVGhlIENvbWV0ZCBlbmRwb2ludCBVUkwuXG4gKiAqIGBvcHRpb25zLndlYnNvY2tldEVuYWJsZWRgIFdoZXRoZXIgd2Vic29ja2V0IHN1cHBvcnQgaXMgYWN0aXZlIChib29sZWFuKS5cbiAqICogYG9wdGlvbnMuY2hhbm5lbGAgT3RoZXIgZGVmYXVsdHMgdG8gcGFzcyBvbiB0byBpbnN0YW5jZXMgb2YgdGhlIHVuZGVybHlpbmcgQ2hhbm5lbCBTZXJ2aWNlLiBTZWUgW0NoYW5uZWwgU2VydmljZV0oLi4vY2hhbm5lbC1zZXJ2aWNlLykgZm9yIGRldGFpbHMuXG4gKlxuICovXG52YXIgQ2hhbm5lbE1hbmFnZXIgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIGlmICghJC5jb21ldGQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb21ldGQgbGlicmFyeSBub3QgZm91bmQuIFBsZWFzZSBpbmNsdWRlIGVwaWNlbnRlci1tdWx0aXBsYXllci1kZXBlbmRlbmNpZXMuanMnKTtcbiAgICB9XG4gICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLnVybCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSBwcm92aWRlIGFuIHVybCBmb3IgdGhlIGNvbWV0ZCBzZXJ2ZXInKTtcbiAgICB9XG5cbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgQ29tZXRkIGVuZHBvaW50IFVSTC5cbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHVybDogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBsb2cgbGV2ZWwgZm9yIHRoZSBjaGFubmVsIChsb2dzIHRvIGNvbnNvbGUpLlxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgbG9nTGV2ZWw6ICdpbmZvJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB3ZWJzb2NrZXQgc3VwcG9ydCBpcyBhY3RpdmUuIERlZmF1bHRzIHRvIGBmYWxzZWA7IEVwaWNlbnRlciBkb2Vzbid0IGN1cnJlbnRseSBzdXBwb3J0IGNvbW11bmljYXRpb24gdGhyb3VnaCB3ZWJzb2NrZXRzLlxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHdlYnNvY2tldEVuYWJsZWQ6IGZhbHNlLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiBmYWxzZSBlYWNoIGluc3RhbmNlIG9mIENoYW5uZWwgd2lsbCBoYXZlIGEgc2VwYXJhdGUgY29tZXRkIGNvbm5lY3Rpb24gdG8gc2VydmVyLCB3aGljaCBjb3VsZCBiZSBub2lzeS4gU2V0IHRvIHRydWUgdG8gcmUtdXNlIHRoZSBzYW1lIGNvbm5lY3Rpb24gYWNyb3NzIGluc3RhbmNlcy5cbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBzaGFyZUNvbm5lY3Rpb246IGZhbHNlLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPdGhlciBkZWZhdWx0cyB0byBwYXNzIG9uIHRvIGluc3RhbmNlcyBvZiB0aGUgdW5kZXJseWluZyBbQ2hhbm5lbCBTZXJ2aWNlXSguLi9jaGFubmVsLXNlcnZpY2UvKSwgd2hpY2ggYXJlIGNyZWF0ZWQgdGhyb3VnaCBgZ2V0Q2hhbm5lbCgpYC5cbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIGNoYW5uZWw6IHtcblxuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgZGVmYXVsdENvbWV0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG4gICAgdGhpcy5jdXJyZW50U3Vic2NyaXB0aW9ucyA9IFtdO1xuICAgIHRoaXMub3B0aW9ucyA9IGRlZmF1bHRDb21ldE9wdGlvbnM7XG5cbiAgICBpZiAoZGVmYXVsdENvbWV0T3B0aW9ucy5zaGFyZUNvbm5lY3Rpb24gJiYgQ2hhbm5lbE1hbmFnZXIucHJvdG90eXBlLl9jb21ldGQpIHtcbiAgICAgICAgdGhpcy5jb21ldGQgPSBDaGFubmVsTWFuYWdlci5wcm90b3R5cGUuX2NvbWV0ZDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHZhciBjb21ldGQgPSBuZXcgJC5Db21ldGQoKTtcbiAgICBDaGFubmVsTWFuYWdlci5wcm90b3R5cGUuX2NvbWV0ZCA9IGNvbWV0ZDtcblxuICAgIGNvbWV0ZC53ZWJzb2NrZXRFbmFibGVkID0gZGVmYXVsdENvbWV0T3B0aW9ucy53ZWJzb2NrZXRFbmFibGVkO1xuXG4gICAgdGhpcy5pc0Nvbm5lY3RlZCA9IGZhbHNlO1xuICAgIHZhciBjb25uZWN0aW9uQnJva2VuID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgJCh0aGlzKS50cmlnZ2VyKCdkaXNjb25uZWN0JywgbWVzc2FnZSk7XG4gICAgfTtcbiAgICB2YXIgY29ubmVjdGlvblN1Y2NlZWRlZCA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICQodGhpcykudHJpZ2dlcignY29ubmVjdCcsIG1lc3NhZ2UpO1xuICAgIH07XG4gICAgdmFyIG1lID0gdGhpcztcblxuICAgIGNvbWV0ZC5jb25maWd1cmUoZGVmYXVsdENvbWV0T3B0aW9ucyk7XG5cbiAgICBjb21ldGQuYWRkTGlzdGVuZXIoJy9tZXRhL2Nvbm5lY3QnLCBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICB2YXIgd2FzQ29ubmVjdGVkID0gdGhpcy5pc0Nvbm5lY3RlZDtcbiAgICAgICAgdGhpcy5pc0Nvbm5lY3RlZCA9IChtZXNzYWdlLnN1Y2Nlc3NmdWwgPT09IHRydWUpO1xuICAgICAgICBpZiAoIXdhc0Nvbm5lY3RlZCAmJiB0aGlzLmlzQ29ubmVjdGVkKSB7IC8vQ29ubmVjdGluZyBmb3IgdGhlIGZpcnN0IHRpbWVcbiAgICAgICAgICAgIGNvbm5lY3Rpb25TdWNjZWVkZWQuY2FsbCh0aGlzLCBtZXNzYWdlKTtcbiAgICAgICAgfSBlbHNlIGlmICh3YXNDb25uZWN0ZWQgJiYgIXRoaXMuaXNDb25uZWN0ZWQpIHsgLy9Pbmx5IHRocm93IGRpc2Nvbm5lY3RlZCBtZXNzYWdlIGZybyB0aGUgZmlyc3QgZGlzY29ubmVjdCwgbm90IG9uY2UgcGVyIHRyeVxuICAgICAgICAgICAgY29ubmVjdGlvbkJyb2tlbi5jYWxsKHRoaXMsIG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcblxuICAgIGNvbWV0ZC5hZGRMaXN0ZW5lcignL21ldGEvZGlzY29ubmVjdCcsIGNvbm5lY3Rpb25Ccm9rZW4pO1xuXG4gICAgY29tZXRkLmFkZExpc3RlbmVyKCcvbWV0YS9oYW5kc2hha2UnLCBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICBpZiAobWVzc2FnZS5zdWNjZXNzZnVsKSB7XG4gICAgICAgICAgICAvL2h0dHA6Ly9kb2NzLmNvbWV0ZC5vcmcvcmVmZXJlbmNlL2phdmFzY3JpcHRfc3Vic2NyaWJlLmh0bWwjamF2YXNjcmlwdF9zdWJzY3JpYmVfbWV0YV9jaGFubmVsc1xuICAgICAgICAgICAgLy8gXiBcImR5bmFtaWMgc3Vic2NyaXB0aW9ucyBhcmUgY2xlYXJlZCAobGlrZSBhbnkgb3RoZXIgc3Vic2NyaXB0aW9uKSBhbmQgdGhlIGFwcGxpY2F0aW9uIG5lZWRzIHRvIGZpZ3VyZSBvdXQgd2hpY2ggZHluYW1pYyBzdWJzY3JpcHRpb24gbXVzdCBiZSBwZXJmb3JtZWQgYWdhaW5cIlxuICAgICAgICAgICAgY29tZXRkLmJhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkKG1lLmN1cnJlbnRTdWJzY3JpcHRpb25zKS5lYWNoKGZ1bmN0aW9uIChpbmRleCwgc3Vicykge1xuICAgICAgICAgICAgICAgICAgICBjb21ldGQucmVzdWJzY3JpYmUoc3Vicyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy9PdGhlciBpbnRlcmVzdGluZyBldmVudHMgZm9yIHJlZmVyZW5jZVxuICAgIGNvbWV0ZC5hZGRMaXN0ZW5lcignL21ldGEvc3Vic2NyaWJlJywgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgJChtZSkudHJpZ2dlcignc3Vic2NyaWJlJywgbWVzc2FnZSk7XG4gICAgfSk7XG4gICAgY29tZXRkLmFkZExpc3RlbmVyKCcvbWV0YS91bnN1YnNjcmliZScsIGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICQobWUpLnRyaWdnZXIoJ3Vuc3Vic2NyaWJlJywgbWVzc2FnZSk7XG4gICAgfSk7XG4gICAgY29tZXRkLmFkZExpc3RlbmVyKCcvbWV0YS9wdWJsaXNoJywgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgJChtZSkudHJpZ2dlcigncHVibGlzaCcsIG1lc3NhZ2UpO1xuICAgIH0pO1xuICAgIGNvbWV0ZC5hZGRMaXN0ZW5lcignL21ldGEvdW5zdWNjZXNzZnVsJywgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgJChtZSkudHJpZ2dlcignZXJyb3InLCBtZXNzYWdlKTtcbiAgICB9KTtcblxuICAgIGNvbWV0ZC5oYW5kc2hha2UoKTtcblxuICAgIHRoaXMuY29tZXRkID0gY29tZXRkO1xufTtcblxuXG5DaGFubmVsTWFuYWdlci5wcm90b3R5cGUgPSAkLmV4dGVuZChDaGFubmVsTWFuYWdlci5wcm90b3R5cGUsIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW5kIHJldHVybnMgYSBjaGFubmVsLCB0aGF0IGlzLCBhbiBpbnN0YW5jZSBvZiBhIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGNtID0gbmV3IEYubWFuYWdlci5DaGFubmVsTWFuYWdlcigpO1xuICAgICAqICAgICAgdmFyIGNoYW5uZWwgPSBjbS5nZXRDaGFubmVsKCk7XG4gICAgICpcbiAgICAgKiAgICAgIGNoYW5uZWwuc3Vic2NyaWJlKCd0b3BpYycsIGNhbGxiYWNrKTtcbiAgICAgKiAgICAgIGNoYW5uZWwucHVibGlzaCgndG9waWMnLCB7IG15RGF0YTogMTAwIH0pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0ge09iamVjdHxTdHJpbmd9IGBvcHRpb25zYCAoT3B0aW9uYWwpIElmIHN0cmluZywgYXNzdW1lZCB0byBiZSB0aGUgYmFzZSBjaGFubmVsIHVybC4gSWYgb2JqZWN0LCBhc3N1bWVkIHRvIGJlIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIGNvbnN0cnVjdG9yLlxuICAgICAqL1xuICAgIGdldENoYW5uZWw6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIC8vSWYgeW91IGp1c3Qgd2FudCB0byBwYXNzIGluIGEgc3RyaW5nXG4gICAgICAgIGlmIChvcHRpb25zICYmICEkLmlzUGxhaW5PYmplY3Qob3B0aW9ucykpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgYmFzZTogb3B0aW9uc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgICAgICB0cmFuc3BvcnQ6IHRoaXMuY29tZXRkXG4gICAgICAgIH07XG4gICAgICAgIHZhciBjaGFubmVsID0gbmV3IENoYW5uZWwoJC5leHRlbmQodHJ1ZSwge30sIHRoaXMub3B0aW9ucy5jaGFubmVsLCBkZWZhdWx0cywgb3B0aW9ucykpO1xuXG5cbiAgICAgICAgLy9XcmFwIHN1YnMgYW5kIHVuc3VicyBzbyB3ZSBjYW4gdXNlIGl0IHRvIHJlLWF0dGFjaCBoYW5kbGVycyBhZnRlciBiZWluZyBkaXNjb25uZWN0ZWRcbiAgICAgICAgdmFyIHN1YnMgPSBjaGFubmVsLnN1YnNjcmliZTtcbiAgICAgICAgY2hhbm5lbC5zdWJzY3JpYmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc3ViaWQgPSBzdWJzLmFwcGx5KGNoYW5uZWwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTdWJzY3JpcHRpb25zICA9IHRoaXMuY3VycmVudFN1YnNjcmlwdGlvbnMuY29uY2F0KHN1YmlkKTtcbiAgICAgICAgICAgIHJldHVybiBzdWJpZDtcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG5cbiAgICAgICAgdmFyIHVuc3VicyA9IGNoYW5uZWwudW5zdWJzY3JpYmU7XG4gICAgICAgIGNoYW5uZWwudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcmVtb3ZlZCA9IHVuc3Vicy5hcHBseShjaGFubmVsLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmN1cnJlbnRTdWJzY3JpcHRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudFN1YnNjcmlwdGlvbnNbaV0uaWQgPT09IHJlbW92ZWQuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50U3Vic2NyaXB0aW9ucy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlbW92ZWQ7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICByZXR1cm4gY2hhbm5lbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RhcnQgbGlzdGVuaW5nIGZvciBldmVudHMgb24gdGhpcyBpbnN0YW5jZS4gU2lnbmF0dXJlIGlzIHNhbWUgYXMgZm9yIGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9vbi8uXG4gICAgICpcbiAgICAgKiBTdXBwb3J0ZWQgZXZlbnRzIGFyZTogYGNvbm5lY3RgLCBgZGlzY29ubmVjdGAsIGBzdWJzY3JpYmVgLCBgdW5zdWJzY3JpYmVgLCBgcHVibGlzaGAsIGBlcnJvcmAuXG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGBldmVudGAgVGhlIGV2ZW50IHR5cGUuIFNlZSBtb3JlIGRldGFpbCBhdCBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vb24vLlxuICAgICAqL1xuICAgIG9uOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgJCh0aGlzKS5vbi5hcHBseSgkKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdG9wIGxpc3RlbmluZyBmb3IgZXZlbnRzIG9uIHRoaXMgaW5zdGFuY2UuIFNpZ25hdHVyZSBpcyBzYW1lIGFzIGZvciBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vb2ZmLy5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYGV2ZW50YCBUaGUgZXZlbnQgdHlwZS4gU2VlIG1vcmUgZGV0YWlsIGF0IGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9vZmYvLlxuICAgICAqL1xuICAgIG9mZjogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICQodGhpcykub2ZmLmFwcGx5KCQodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRyaWdnZXIgZXZlbnRzIGFuZCBleGVjdXRlIGhhbmRsZXJzLiBTaWduYXR1cmUgaXMgc2FtZSBhcyBmb3IgalF1ZXJ5IEV2ZW50czogaHR0cDovL2FwaS5qcXVlcnkuY29tL3RyaWdnZXIvLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgZXZlbnRgIFRoZSBldmVudCB0eXBlLiBTZWUgbW9yZSBkZXRhaWwgYXQgalF1ZXJ5IEV2ZW50czogaHR0cDovL2FwaS5qcXVlcnkuY29tL3RyaWdnZXIvLlxuICAgICAqL1xuICAgIHRyaWdnZXI6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAkKHRoaXMpLnRyaWdnZXIuYXBwbHkoJCh0aGlzKSwgYXJndW1lbnRzKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDaGFubmVsTWFuYWdlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiAjIyBFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyXG4gKlxuICogVGhlIEVwaWNlbnRlciBwbGF0Zm9ybSBwcm92aWRlcyBhIHB1c2ggY2hhbm5lbCwgd2hpY2ggYWxsb3dzIHlvdSB0byBwdWJsaXNoIGFuZCBzdWJzY3JpYmUgdG8gbWVzc2FnZXMgd2l0aGluIGEgW3Byb2plY3RdKC4uLy4uLy4uL2dsb3NzYXJ5LyNwcm9qZWN0cyksIFtncm91cF0oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3VwcyksIG9yIFttdWx0aXBsYXllciB3b3JsZF0oLi4vLi4vLi4vZ2xvc3NhcnkvI3dvcmxkKS4gVGhlcmUgYXJlIHR3byBtYWluIHVzZSBjYXNlcyBmb3IgdGhlIGNoYW5uZWw6IGV2ZW50IG5vdGlmaWNhdGlvbnMgYW5kIGNoYXQgbWVzc2FnZXMuXG4gKlxuICogVGhlIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXIgaXMgYSB3cmFwcGVyIGFyb3VuZCB0aGUgKG1vcmUgZ2VuZXJpYykgW0NoYW5uZWwgTWFuYWdlcl0oLi4vY2hhbm5lbC1tYW5hZ2VyLyksIHRvIGluc3RhbnRpYXRlIGl0IHdpdGggRXBpY2VudGVyLXNwZWNpZmljIGRlZmF1bHRzLiBJZiB5b3UgYXJlIGludGVyZXN0ZWQgaW4gaW5jbHVkaW5nIGEgbm90aWZpY2F0aW9uIG9yIGNoYXQgZmVhdHVyZSBpbiB5b3VyIHByb2plY3QsIHVzaW5nIGFuIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXIgaXMgcHJvYmFibHkgdGhlIGVhc2llc3Qgd2F5IHRvIGdldCBzdGFydGVkLlxuICpcbiAqIFlvdSdsbCBuZWVkIHRvIGluY2x1ZGUgdGhlIGBlcGljZW50ZXItbXVsdGlwbGF5ZXItZGVwZW5kZW5jaWVzLmpzYCBsaWJyYXJ5IGluIGFkZGl0aW9uIHRvIHRoZSBgZXBpY2VudGVyLmpzYCBsaWJyYXJ5IGluIHlvdXIgcHJvamVjdCB0byB1c2UgdGhlIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXIuIFNlZSBbSW5jbHVkaW5nIEVwaWNlbnRlci5qc10oLi4vLi4vI2luY2x1ZGUpLlxuICpcbiAqIFRvIHVzZSB0aGUgRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlcjogaW5zdGFudGlhdGUgaXQsIGdldCB0aGUgY2hhbm5lbCBvZiB0aGUgc2NvcGUgeW91IHdhbnQgKFt1c2VyXSguLi8uLi8uLi9nbG9zc2FyeS8jdXNlcnMpLCBbd29ybGRdKC4uLy4uLy4uL2dsb3NzYXJ5LyN3b3JsZCksIG9yIFtncm91cF0oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3VwcykpLCB0aGVuIHVzZSB0aGUgY2hhbm5lbCdzIGBzdWJzY3JpYmUoKWAgYW5kIGBwdWJsaXNoKClgIG1ldGhvZHMgdG8gc3Vic2NyaWJlIHRvIHRvcGljcyBvciBwdWJsaXNoIGRhdGEgdG8gdG9waWNzLlxuICpcbiAqICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyKCk7XG4gKiAgICAgdmFyIGdjID0gY20uZ2V0R3JvdXBDaGFubmVsKCk7XG4gKiAgICAgZ2Muc3Vic2NyaWJlKCdicm9hZGNhc3RzJywgY2FsbGJhY2spO1xuICpcbiAqIEZvciBhZGRpdGlvbmFsIGJhY2tncm91bmQgb24gRXBpY2VudGVyJ3MgcHVzaCBjaGFubmVsLCBzZWUgdGhlIGludHJvZHVjdG9yeSBub3RlcyBvbiB0aGUgW1B1c2ggQ2hhbm5lbCBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9tdWx0aXBsYXllci9jaGFubmVsLykgcGFnZS5cbiAqXG4gKiBUaGUgcGFyYW1ldGVycyBmb3IgaW5zdGFudGlhdGluZyBhbiBFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyIGluY2x1ZGU6XG4gKlxuICogKiBgc2VydmVyYCBPYmplY3Qgd2l0aCBkZXRhaWxzIGFib3V0IHRoZSBFcGljZW50ZXIgcHJvamVjdCBmb3IgdGhpcyBFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyIGluc3RhbmNlLlxuICogKiBgc2VydmVyLmFjY291bnRgIFRoZSBFcGljZW50ZXIgYWNjb3VudCBpZCAoKipUZWFtIElEKiogZm9yIHRlYW0gcHJvamVjdHMsICoqVXNlciBJRCoqIGZvciBwZXJzb25hbCBwcm9qZWN0cykuXG4gKiAqIGBzZXJ2ZXIucHJvamVjdGAgRXBpY2VudGVyIHByb2plY3QgaWQuXG4gKi9cblxudmFyIENoYW5uZWxNYW5hZ2VyID0gcmVxdWlyZSgnLi9jaGFubmVsLW1hbmFnZXInKTtcbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi91dGlsL2luaGVyaXQnKTtcbnZhciB1cmxTZXJ2aWNlID0gcmVxdWlyZSgnLi4vc2VydmljZS91cmwtY29uZmlnLXNlcnZpY2UnKTtcblxudmFyIEF1dGhNYW5hZ2VyID0gcmVxdWlyZSgnLi9hdXRoLW1hbmFnZXInKTtcblxudmFyIHNlc3Npb24gPSBuZXcgQXV0aE1hbmFnZXIoKTtcbnZhciBnZXRGcm9tU2V0dGluZ3NPclNlc3Npb25PckVycm9yID0gZnVuY3Rpb24gKHZhbHVlLCBzZXNzaW9uS2V5TmFtZSwgc2V0dGluZ3MpIHtcbiAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgIHZhciB1c2VySW5mbyA9IHNlc3Npb24uZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbygpO1xuICAgICAgICBpZiAoc2V0dGluZ3MgJiYgc2V0dGluZ3Nbc2Vzc2lvbktleU5hbWVdKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHNldHRpbmdzW3Nlc3Npb25LZXlOYW1lXTtcbiAgICAgICAgfSBlbHNlIGlmICh1c2VySW5mb1tzZXNzaW9uS2V5TmFtZV0pIHtcbiAgICAgICAgICAgIHZhbHVlID0gdXNlckluZm9bc2Vzc2lvbktleU5hbWVdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHNlc3Npb25LZXlOYW1lICsgJyBub3QgZm91bmQuIFBsZWFzZSBsb2ctaW4gYWdhaW4sIG9yIHNwZWNpZnkgJyArIHNlc3Npb25LZXlOYW1lICsgJyBleHBsaWNpdGx5Jyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufTtcbnZhciBfX3N1cGVyID0gQ2hhbm5lbE1hbmFnZXIucHJvdG90eXBlO1xudmFyIEVwaWNlbnRlckNoYW5uZWxNYW5hZ2VyID0gY2xhc3NGcm9tKENoYW5uZWxNYW5hZ2VyLCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciB1c2VySW5mbyA9IHNlc3Npb24uZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbygpO1xuXG4gICAgICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgICAgIGFjY291bnQ6IHVzZXJJbmZvLmFjY291bnQsXG4gICAgICAgICAgICBwcm9qZWN0OiB1c2VySW5mby5wcm9qZWN0LFxuICAgICAgICB9O1xuICAgICAgICB2YXIgZGVmYXVsdENvbWV0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgdXNlckluZm8sIG9wdGlvbnMpO1xuXG4gICAgICAgIHZhciB1cmxPcHRzID0gdXJsU2VydmljZShkZWZhdWx0Q29tZXRPcHRpb25zLnNlcnZlcik7XG4gICAgICAgIGlmICghZGVmYXVsdENvbWV0T3B0aW9ucy51cmwpIHtcbiAgICAgICAgICAgIC8vRGVmYXVsdCBlcGljZW50ZXIgY29tZXRkIGVuZHBvaW50XG4gICAgICAgICAgICBkZWZhdWx0Q29tZXRPcHRpb25zLnVybCA9IHVybE9wdHMucHJvdG9jb2wgKyAnOi8vJyArIHVybE9wdHMuaG9zdCArICcvY2hhbm5lbC9zdWJzY3JpYmUnO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vcHRpb25zID0gZGVmYXVsdENvbWV0T3B0aW9ucztcbiAgICAgICAgcmV0dXJuIF9fc3VwZXIuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBkZWZhdWx0Q29tZXRPcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGFuZCByZXR1cm4gYSBwdWJsaXNoL3N1YnNjcmliZSBjaGFubmVsIChmcm9tIHRoZSB1bmRlcmx5aW5nIFtDaGFubmVsIE1hbmFnZXJdKC4uL2NoYW5uZWwtbWFuYWdlci8pKSBmb3IgdGhlIGdpdmVuIFtncm91cF0oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3VwcykuIFRoZSBncm91cCBtdXN0IGV4aXN0IGluIHRoZSBhY2NvdW50ICh0ZWFtKSBhbmQgcHJvamVjdCBwcm92aWRlZC5cbiAgICAgKlxuICAgICAqIFRoZXJlIGFyZSBubyBub3RpZmljYXRpb25zIGZyb20gRXBpY2VudGVyIG9uIHRoaXMgY2hhbm5lbDsgYWxsIG1lc3NhZ2VzIGFyZSB1c2VyLW9yaWdpbmF0ZWQuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgIHZhciBjbSA9IG5ldyBGLm1hbmFnZXIuQ2hhbm5lbE1hbmFnZXIoKTtcbiAgICAgKiAgICAgdmFyIGdjID0gY20uZ2V0R3JvdXBDaGFubmVsKCk7XG4gICAgICogICAgIGdjLnN1YnNjcmliZSgnYnJvYWRjYXN0cycsIGNhbGxiYWNrKTtcbiAgICAgKlxuICAgICAqICoqUmV0dXJuIFZhbHVlKipcbiAgICAgKlxuICAgICAqICogKkNoYW5uZWwqIFJldHVybnMgdGhlIGNoYW5uZWwgKGFuIGluc3RhbmNlIG9mIHRoZSBbQ2hhbm5lbCBTZXJ2aWNlXSguLi9jaGFubmVsLXNlcnZpY2UvKSkuXG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBgZ3JvdXBOYW1lYCAoT3B0aW9uYWwpIEdyb3VwIHRvIGJyb2FkY2FzdCB0by4gSWYgbm90IHByb3ZpZGVkLCBwaWNrcyB1cCBncm91cCBmcm9tIGN1cnJlbnQgc2Vzc2lvbiBpZiBlbmQgdXNlciBpcyBsb2dnZWQgaW4uXG4gICAgICovXG4gICAgZ2V0R3JvdXBDaGFubmVsOiBmdW5jdGlvbiAoZ3JvdXBOYW1lKSB7XG4gICAgICAgIGdyb3VwTmFtZSA9IGdldEZyb21TZXR0aW5nc09yU2Vzc2lvbk9yRXJyb3IoZ3JvdXBOYW1lLCAnZ3JvdXBOYW1lJyk7XG4gICAgICAgIHZhciBhY2NvdW50ID0gZ2V0RnJvbVNldHRpbmdzT3JTZXNzaW9uT3JFcnJvcignJywgJ2FjY291bnQnLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICB2YXIgcHJvamVjdCA9IGdldEZyb21TZXR0aW5nc09yU2Vzc2lvbk9yRXJyb3IoJycsICdwcm9qZWN0JywgdGhpcy5vcHRpb25zKTtcblxuICAgICAgICB2YXIgYmFzZVRvcGljID0gWycvZ3JvdXAnLCBhY2NvdW50LCBwcm9qZWN0LCBncm91cE5hbWVdLmpvaW4oJy8nKTtcbiAgICAgICAgcmV0dXJuIF9fc3VwZXIuZ2V0Q2hhbm5lbC5jYWxsKHRoaXMsIHsgYmFzZTogYmFzZVRvcGljIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYW5kIHJldHVybiBhIHB1Ymxpc2gvc3Vic2NyaWJlIGNoYW5uZWwgKGZyb20gdGhlIHVuZGVybHlpbmcgW0NoYW5uZWwgTWFuYWdlcl0oLi4vY2hhbm5lbC1tYW5hZ2VyLykpIGZvciB0aGUgZ2l2ZW4gW3dvcmxkXSguLi8uLi8uLi9nbG9zc2FyeS8jd29ybGQpLlxuICAgICAqXG4gICAgICogVGhpcyBpcyB0eXBpY2FsbHkgdXNlZCB0b2dldGhlciB3aXRoIHRoZSBbV29ybGQgTWFuYWdlcl0oLi4vd29ybGQtbWFuYWdlcikuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgIHZhciBjbSA9IG5ldyBGLm1hbmFnZXIuQ2hhbm5lbE1hbmFnZXIoKTtcbiAgICAgKiAgICAgdmFyIHdvcmxkTWFuYWdlciA9IG5ldyBGLm1hbmFnZXIuV29ybGRNYW5hZ2VyKHtcbiAgICAgKiAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgKiAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICogICAgICAgICBncm91cDogJ3RlYW0xJyxcbiAgICAgKiAgICAgICAgIHJ1bjogeyBtb2RlbDogJ21vZGVsLmVxbicgfVxuICAgICAqICAgICB9KTtcbiAgICAgKiAgICAgd29ybGRNYW5hZ2VyLmdldEN1cnJlbnRXb3JsZCgpLnRoZW4oZnVuY3Rpb24gKHdvcmxkT2JqZWN0LCB3b3JsZEFkYXB0ZXIpIHtcbiAgICAgKiAgICAgICAgIHZhciB3b3JsZENoYW5uZWwgPSBjbS5nZXRXb3JsZENoYW5uZWwod29ybGRPYmplY3QpO1xuICAgICAqICAgICAgICAgd29ybGRDaGFubmVsLnN1YnNjcmliZSgnJywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgKiAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgKiAgICAgICAgIH0pO1xuICAgICAqICAgICAgfSk7XG4gICAgICpcbiAgICAgKiAqKlJldHVybiBWYWx1ZSoqXG4gICAgICpcbiAgICAgKiAqICpDaGFubmVsKiBSZXR1cm5zIHRoZSBjaGFubmVsIChhbiBpbnN0YW5jZSBvZiB0aGUgW0NoYW5uZWwgU2VydmljZV0oLi4vY2hhbm5lbC1zZXJ2aWNlLykpLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ3xPYmplY3R9IGB3b3JsZGAgVGhlIHdvcmxkIG9iamVjdCBvciBpZC5cbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGBncm91cE5hbWVgIChPcHRpb25hbCkgR3JvdXAgdGhlIHdvcmxkIGV4aXN0cyBpbi4gSWYgbm90IHByb3ZpZGVkLCBwaWNrcyB1cCBncm91cCBmcm9tIGN1cnJlbnQgc2Vzc2lvbiBpZiBlbmQgdXNlciBpcyBsb2dnZWQgaW4uXG4gICAgICovXG4gICAgZ2V0V29ybGRDaGFubmVsOiBmdW5jdGlvbiAod29ybGQsIGdyb3VwTmFtZSkge1xuICAgICAgICB2YXIgd29ybGRpZCA9ICgkLmlzUGxhaW5PYmplY3Qod29ybGQpICYmIHdvcmxkLmlkKSA/IHdvcmxkLmlkIDogd29ybGQ7XG4gICAgICAgIGlmICghd29ybGRpZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2Ugc3BlY2lmeSBhIHdvcmxkIGlkJyk7XG4gICAgICAgIH1cbiAgICAgICAgZ3JvdXBOYW1lID0gZ2V0RnJvbVNldHRpbmdzT3JTZXNzaW9uT3JFcnJvcihncm91cE5hbWUsICdncm91cE5hbWUnKTtcbiAgICAgICAgdmFyIGFjY291bnQgPSBnZXRGcm9tU2V0dGluZ3NPclNlc3Npb25PckVycm9yKCcnLCAnYWNjb3VudCcsIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIHZhciBwcm9qZWN0ID0gZ2V0RnJvbVNldHRpbmdzT3JTZXNzaW9uT3JFcnJvcignJywgJ3Byb2plY3QnLCB0aGlzLm9wdGlvbnMpO1xuXG4gICAgICAgIHZhciBiYXNlVG9waWMgPSBbJy93b3JsZCcsIGFjY291bnQsIHByb2plY3QsIGdyb3VwTmFtZSwgd29ybGRpZF0uam9pbignLycpO1xuICAgICAgICByZXR1cm4gX19zdXBlci5nZXRDaGFubmVsLmNhbGwodGhpcywgeyBiYXNlOiBiYXNlVG9waWMgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgcHVibGlzaC9zdWJzY3JpYmUgY2hhbm5lbCAoZnJvbSB0aGUgdW5kZXJseWluZyBbQ2hhbm5lbCBNYW5hZ2VyXSguLi9jaGFubmVsLW1hbmFnZXIvKSkgZm9yIHRoZSBjdXJyZW50IFtlbmQgdXNlcl0oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKSBpbiB0aGF0IHVzZXIncyBjdXJyZW50IFt3b3JsZF0oLi4vLi4vLi4vZ2xvc3NhcnkvI3dvcmxkKS5cbiAgICAgKlxuICAgICAqIFRoaXMgaXMgdHlwaWNhbGx5IHVzZWQgdG9nZXRoZXIgd2l0aCB0aGUgW1dvcmxkIE1hbmFnZXJdKC4uL3dvcmxkLW1hbmFnZXIpLiBOb3RlIHRoYXQgdGhpcyBjaGFubmVsIG9ubHkgZ2V0cyBub3RpZmljYXRpb25zIGZvciB3b3JsZHMgY3VycmVudGx5IGluIG1lbW9yeS4gKFNlZSBtb3JlIGJhY2tncm91bmQgb24gW3BlcnNpc3RlbmNlXSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UpLilcbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgdmFyIGNtID0gbmV3IEYubWFuYWdlci5DaGFubmVsTWFuYWdlcigpO1xuICAgICAqICAgICB2YXIgd29ybGRNYW5hZ2VyID0gbmV3IEYubWFuYWdlci5Xb3JsZE1hbmFnZXIoe1xuICAgICAqICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAqICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgKiAgICAgICAgIGdyb3VwOiAndGVhbTEnLFxuICAgICAqICAgICAgICAgcnVuOiB7IG1vZGVsOiAnbW9kZWwuZXFuJyB9XG4gICAgICogICAgIH0pO1xuICAgICAqICAgICB3b3JsZE1hbmFnZXIuZ2V0Q3VycmVudFdvcmxkKCkudGhlbihmdW5jdGlvbiAod29ybGRPYmplY3QsIHdvcmxkQWRhcHRlcikge1xuICAgICAqICAgICAgICAgdmFyIHVzZXJDaGFubmVsID0gY20uZ2V0VXNlckNoYW5uZWwod29ybGRPYmplY3QpO1xuICAgICAqICAgICAgICAgdXNlckNoYW5uZWwuc3Vic2NyaWJlKCcnLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAqICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAqICAgICAgICAgfSk7XG4gICAgICogICAgICB9KTtcbiAgICAgKlxuICAgICAqXG4gICAgICogKipSZXR1cm4gVmFsdWUqKlxuICAgICAqXG4gICAgICogKiAqQ2hhbm5lbCogUmV0dXJucyB0aGUgY2hhbm5lbCAoYW4gaW5zdGFuY2Ugb2YgdGhlIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pKS5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd8T2JqZWN0fSBgd29ybGRgIFdvcmxkIG9iamVjdCBvciBpZC5cbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd8T2JqZWN0fSBgdXNlcmAgKE9wdGlvbmFsKSBVc2VyIG9iamVjdCBvciBpZC4gSWYgbm90IHByb3ZpZGVkLCBwaWNrcyB1cCB1c2VyIGlkIGZyb20gY3VycmVudCBzZXNzaW9uIGlmIGVuZCB1c2VyIGlzIGxvZ2dlZCBpbi5cbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGBncm91cE5hbWVgIChPcHRpb25hbCkgR3JvdXAgdGhlIHdvcmxkIGV4aXN0cyBpbi4gSWYgbm90IHByb3ZpZGVkLCBwaWNrcyB1cCBncm91cCBmcm9tIGN1cnJlbnQgc2Vzc2lvbiBpZiBlbmQgdXNlciBpcyBsb2dnZWQgaW4uXG4gICAgICovXG4gICAgZ2V0VXNlckNoYW5uZWw6IGZ1bmN0aW9uICh3b3JsZCwgdXNlciwgZ3JvdXBOYW1lKSB7XG4gICAgICAgIHZhciB3b3JsZGlkID0gKCQuaXNQbGFpbk9iamVjdCh3b3JsZCkgJiYgd29ybGQuaWQpID8gd29ybGQuaWQgOiB3b3JsZDtcbiAgICAgICAgaWYgKCF3b3JsZGlkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSBzcGVjaWZ5IGEgd29ybGQgaWQnKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdXNlcmlkID0gKCQuaXNQbGFpbk9iamVjdCh1c2VyKSAmJiB1c2VyLmlkKSA/IHVzZXIuaWQgOiB1c2VyO1xuICAgICAgICB1c2VyaWQgPSBnZXRGcm9tU2V0dGluZ3NPclNlc3Npb25PckVycm9yKHVzZXJpZCwgJ3VzZXJJZCcpO1xuICAgICAgICBncm91cE5hbWUgPSBnZXRGcm9tU2V0dGluZ3NPclNlc3Npb25PckVycm9yKGdyb3VwTmFtZSwgJ2dyb3VwTmFtZScpO1xuXG4gICAgICAgIHZhciBhY2NvdW50ID0gZ2V0RnJvbVNldHRpbmdzT3JTZXNzaW9uT3JFcnJvcignJywgJ2FjY291bnQnLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICB2YXIgcHJvamVjdCA9IGdldEZyb21TZXR0aW5nc09yU2Vzc2lvbk9yRXJyb3IoJycsICdwcm9qZWN0JywgdGhpcy5vcHRpb25zKTtcblxuICAgICAgICB2YXIgYmFzZVRvcGljID0gWycvdXNlcnMnLCBhY2NvdW50LCBwcm9qZWN0LCBncm91cE5hbWUsIHdvcmxkaWQsIHVzZXJpZF0uam9pbignLycpO1xuICAgICAgICByZXR1cm4gX19zdXBlci5nZXRDaGFubmVsLmNhbGwodGhpcywgeyBiYXNlOiBiYXNlVG9waWMgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgcHVibGlzaC9zdWJzY3JpYmUgY2hhbm5lbCAoZnJvbSB0aGUgdW5kZXJseWluZyBbQ2hhbm5lbCBNYW5hZ2VyXSguLi9jaGFubmVsLW1hbmFnZXIvKSkgdGhhdCBhdXRvbWF0aWNhbGx5IHRyYWNrcyB0aGUgcHJlc2VuY2Ugb2YgYW4gW2VuZCB1c2VyXSguLi8uLi8uLi9nbG9zc2FyeS8jdXNlcnMpLCB0aGF0IGlzLCB3aGV0aGVyIHRoZSBlbmQgdXNlciBpcyBjdXJyZW50bHkgb25saW5lIGluIHRoaXMgZ3JvdXAgYW5kIHdvcmxkLiBOb3RpZmljYXRpb25zIGFyZSBhdXRvbWF0aWNhbGx5IHNlbnQgd2hlbiB0aGUgZW5kIHVzZXIgY29tZXMgb25saW5lLCBhbmQgd2hlbiB0aGUgZW5kIHVzZXIgZ29lcyBvZmZsaW5lIChub3QgcHJlc2VudCBmb3IgbW9yZSB0aGFuIDIgbWludXRlcykuIFVzZWZ1bCBpbiBtdWx0aXBsYXllciBnYW1lcyBmb3IgbGV0dGluZyBlYWNoIGVuZCB1c2VyIGtub3cgd2hldGhlciBvdGhlciB1c2VycyBpbiB0aGVpciBzaGFyZWQgd29ybGQgYXJlIGFsc28gb25saW5lLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyKCk7XG4gICAgICogICAgIHZhciB3b3JsZE1hbmFnZXIgPSBuZXcgRi5tYW5hZ2VyLldvcmxkTWFuYWdlcih7XG4gICAgICogICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICogICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAqICAgICAgICAgbW9kZWw6ICdtb2RlbC5lcW4nXG4gICAgICogICAgIH0pO1xuICAgICAqICAgICB3b3JsZE1hbmFnZXIuZ2V0Q3VycmVudFdvcmxkKCkudGhlbihmdW5jdGlvbiAod29ybGRPYmplY3QsIHdvcmxkU2VydmljZSkge1xuICAgICAqICAgICAgICAgdmFyIHByZXNlbmNlQ2hhbm5lbCA9IGNtLmdldFByZXNlbmNlQ2hhbm5lbCh3b3JsZE9iamVjdCk7XG4gICAgICogICAgICAgICBwcmVzZW5jZUNoYW5uZWwub24oJ3ByZXNlbmNlJywgZnVuY3Rpb24gKGV2dCwgbm90aWZpY2F0aW9uKSB7XG4gICAgICogICAgICAgICAgICAgIGNvbnNvbGUubG9nKG5vdGlmaWNhdGlvbi5vbmxpbmUsIG5vdGlmaWNhdGlvbi51c2VySWQpO1xuICAgICAqICAgICAgICAgIH0pO1xuICAgICAqICAgICAgfSk7XG4gICAgICpcbiAgICAgKlxuICAgICAqICoqUmV0dXJuIFZhbHVlKipcbiAgICAgKlxuICAgICAqICogKkNoYW5uZWwqIFJldHVybnMgdGhlIGNoYW5uZWwgKGFuIGluc3RhbmNlIG9mIHRoZSBbQ2hhbm5lbCBTZXJ2aWNlXSguLi9jaGFubmVsLXNlcnZpY2UvKSkuXG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqXG4gICAgICogQHBhcmFtICB7U3RyaW5nfE9iamVjdH0gYHdvcmxkYCBXb3JsZCBvYmplY3Qgb3IgaWQuXG4gICAgICogQHBhcmFtICB7U3RyaW5nfE9iamVjdH0gYHVzZXJpZGAgKE9wdGlvbmFsKSBVc2VyIG9iamVjdCBvciBpZC4gSWYgbm90IHByb3ZpZGVkLCBwaWNrcyB1cCB1c2VyIGlkIGZyb20gY3VycmVudCBzZXNzaW9uIGlmIGVuZCB1c2VyIGlzIGxvZ2dlZCBpbi5cbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGBncm91cE5hbWVgIChPcHRpb25hbCkgR3JvdXAgdGhlIHdvcmxkIGV4aXN0cyBpbi4gSWYgbm90IHByb3ZpZGVkLCBwaWNrcyB1cCBncm91cCBmcm9tIGN1cnJlbnQgc2Vzc2lvbiBpZiBlbmQgdXNlciBpcyBsb2dnZWQgaW4uXG4gICAgICovXG4gICAgZ2V0UHJlc2VuY2VDaGFubmVsOiBmdW5jdGlvbiAod29ybGQsIHVzZXJpZCwgZ3JvdXBOYW1lKSB7XG4gICAgICAgIHZhciB3b3JsZGlkID0gKCQuaXNQbGFpbk9iamVjdCh3b3JsZCkgJiYgd29ybGQuaWQpID8gd29ybGQuaWQgOiB3b3JsZDtcbiAgICAgICAgaWYgKCF3b3JsZGlkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSBzcGVjaWZ5IGEgd29ybGQgaWQnKTtcbiAgICAgICAgfVxuICAgICAgICB1c2VyaWQgPSBnZXRGcm9tU2V0dGluZ3NPclNlc3Npb25PckVycm9yKHVzZXJpZCwgJ3VzZXJJZCcpO1xuICAgICAgICBncm91cE5hbWUgPSBnZXRGcm9tU2V0dGluZ3NPclNlc3Npb25PckVycm9yKGdyb3VwTmFtZSwgJ2dyb3VwTmFtZScpO1xuXG4gICAgICAgIHZhciBhY2NvdW50ID0gZ2V0RnJvbVNldHRpbmdzT3JTZXNzaW9uT3JFcnJvcignJywgJ2FjY291bnQnLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICB2YXIgcHJvamVjdCA9IGdldEZyb21TZXR0aW5nc09yU2Vzc2lvbk9yRXJyb3IoJycsICdwcm9qZWN0JywgdGhpcy5vcHRpb25zKTtcblxuICAgICAgICB2YXIgYmFzZVRvcGljID0gWycvdXNlcnMnLCBhY2NvdW50LCBwcm9qZWN0LCBncm91cE5hbWUsIHdvcmxkaWRdLmpvaW4oJy8nKTtcbiAgICAgICAgdmFyIGNoYW5uZWwgPSBfX3N1cGVyLmdldENoYW5uZWwuY2FsbCh0aGlzLCB7IGJhc2U6IGJhc2VUb3BpYyB9KTtcblxuICAgICAgICB2YXIgbGFzdFBpbmdUaW1lID0geyB9O1xuXG4gICAgICAgIHZhciBQSU5HX0lOVEVSVkFMID0gNjAwMDtcbiAgICAgICAgY2hhbm5lbC5zdWJzY3JpYmUoJ2ludGVybmFsLXBpbmctY2hhbm5lbCcsIGZ1bmN0aW9uIChub3RpZmljYXRpb24pIHtcbiAgICAgICAgICAgIHZhciBpbmNvbWluZ1VzZXJJZCA9IG5vdGlmaWNhdGlvbi5kYXRhLnVzZXI7XG4gICAgICAgICAgICBpZiAoIWxhc3RQaW5nVGltZVtpbmNvbWluZ1VzZXJJZF0gJiYgaW5jb21pbmdVc2VySWQgIT09IHVzZXJpZCkge1xuICAgICAgICAgICAgICAgIGNoYW5uZWwudHJpZ2dlci5jYWxsKGNoYW5uZWwsICdwcmVzZW5jZScsIHsgdXNlcklkOiBpbmNvbWluZ1VzZXJJZCwgb25saW5lOiB0cnVlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGFzdFBpbmdUaW1lW2luY29taW5nVXNlcklkXSA9IChuZXcgRGF0ZSgpKS52YWx1ZU9mKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNoYW5uZWwucHVibGlzaCgnaW50ZXJuYWwtcGluZy1jaGFubmVsJywgeyB1c2VyOiB1c2VyaWQgfSk7XG5cbiAgICAgICAgICAgICQuZWFjaChsYXN0UGluZ1RpbWUsIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vdyA9IChuZXcgRGF0ZSgpKS52YWx1ZU9mKCk7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlICsgKFBJTkdfSU5URVJWQUwgKiAyKSA8IG5vdykge1xuICAgICAgICAgICAgICAgICAgICBsYXN0UGluZ1RpbWVba2V5XSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGNoYW5uZWwudHJpZ2dlci5jYWxsKGNoYW5uZWwsICdwcmVzZW5jZScsIHsgdXNlcklkOiBrZXksIG9ubGluZTogZmFsc2UgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIFBJTkdfSU5URVJWQUwpO1xuXG4gICAgICAgIHJldHVybiBjaGFubmVsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYW5kIHJldHVybiBhIHB1Ymxpc2gvc3Vic2NyaWJlIGNoYW5uZWwgKGZyb20gdGhlIHVuZGVybHlpbmcgW0NoYW5uZWwgTWFuYWdlcl0oLi4vY2hhbm5lbC1tYW5hZ2VyLykpIGZvciB0aGUgZ2l2ZW4gY29sbGVjdGlvbi4gKFRoZSBjb2xsZWN0aW9uIG5hbWUgaXMgc3BlY2lmaWVkIGluIHRoZSBgcm9vdGAgYXJndW1lbnQgd2hlbiB0aGUgW0RhdGEgU2VydmljZV0oLi4vZGF0YS1hcGktc2VydmljZS8pIGlzIGluc3RhbnRpYXRlZC4pIE11c3QgYmUgb25lIG9mIHRoZSBjb2xsZWN0aW9ucyBpbiB0aGlzIGFjY291bnQgKHRlYW0pIGFuZCBwcm9qZWN0LlxuICAgICAqXG4gICAgICogVGhlcmUgYXJlIGF1dG9tYXRpYyBub3RpZmljYXRpb25zIGZyb20gRXBpY2VudGVyIG9uIHRoaXMgY2hhbm5lbCB3aGVuIGRhdGEgaXMgY3JlYXRlZCwgdXBkYXRlZCwgb3IgZGVsZXRlZCBpbiB0aGlzIGNvbGxlY3Rpb24uIFNlZSBtb3JlIG9uIFthdXRvbWF0aWMgbWVzc2FnZXMgdG8gdGhlIGRhdGEgY2hhbm5lbF0oLi4vLi4vLi4vcmVzdF9hcGlzL211bHRpcGxheWVyL2NoYW5uZWwvI2RhdGEtbWVzc2FnZXMpLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyKCk7XG4gICAgICogICAgIHZhciBnYyA9IGNtLmdldERhdGFDaGFubmVsKCdzdXJ2ZXktcmVzcG9uc2VzJyk7XG4gICAgICogICAgIGdjLnN1YnNjcmliZSgnJywgZnVuY3Rpb24oZGF0YSwgbWV0YSkge1xuICAgICAqICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAqXG4gICAgICogICAgICAgICAgLy8gbWV0YS5kYXRlIGlzIHRpbWUgb2YgY2hhbmdlLFxuICAgICAqICAgICAgICAgIC8vIG1ldGEuc3ViVHlwZSBpcyB0aGUga2luZCBvZiBjaGFuZ2U6IG5ldywgdXBkYXRlLCBvciBkZWxldGVcbiAgICAgKiAgICAgICAgICAvLyBtZXRhLnBhdGggaXMgdGhlIGZ1bGwgcGF0aCB0byB0aGUgY2hhbmdlZCBkYXRhXG4gICAgICogICAgICAgICAgY29uc29sZS5sb2cobWV0YSk7XG4gICAgICogICAgIH0pO1xuICAgICAqXG4gICAgICogKipSZXR1cm4gVmFsdWUqKlxuICAgICAqXG4gICAgICogKiAqQ2hhbm5lbCogUmV0dXJucyB0aGUgY2hhbm5lbCAoYW4gaW5zdGFuY2Ugb2YgdGhlIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pKS5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGBjb2xsZWN0aW9uYCBOYW1lIG9mIGNvbGxlY3Rpb24gd2hvc2UgYXV0b21hdGljIG5vdGlmaWNhdGlvbnMgeW91IHdhbnQgdG8gcmVjZWl2ZS5cbiAgICAgKi9cbiAgICBnZXREYXRhQ2hhbm5lbDogZnVuY3Rpb24gKGNvbGxlY3Rpb24pIHtcbiAgICAgICAgaWYgKCFjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSBzcGVjaWZ5IGEgY29sbGVjdGlvbiB0byBsaXN0ZW4gb24uJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGFjY291bnQgPSBnZXRGcm9tU2V0dGluZ3NPclNlc3Npb25PckVycm9yKCcnLCAnYWNjb3VudCcsIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIHZhciBwcm9qZWN0ID0gZ2V0RnJvbVNldHRpbmdzT3JTZXNzaW9uT3JFcnJvcignJywgJ3Byb2plY3QnLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICB2YXIgYmFzZVRvcGljID0gWycvZGF0YScsIGFjY291bnQsIHByb2plY3QsIGNvbGxlY3Rpb25dLmpvaW4oJy8nKTtcbiAgICAgICAgdmFyIGNoYW5uZWwgPSBfX3N1cGVyLmdldENoYW5uZWwuY2FsbCh0aGlzLCB7IGJhc2U6IGJhc2VUb3BpYyB9KTtcblxuICAgICAgICAvL1RPRE86IEZpeCBhZnRlciBFcGljZW50ZXIgYnVnIGlzIHJlc29sdmVkXG4gICAgICAgIHZhciBvbGRzdWJzID0gY2hhbm5lbC5zdWJzY3JpYmU7XG4gICAgICAgIGNoYW5uZWwuc3Vic2NyaWJlID0gZnVuY3Rpb24gKHRvcGljLCBjYWxsYmFjaywgY29udGV4dCwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrV2l0aENsZWFuRGF0YSA9IGZ1bmN0aW9uIChwYXlsb2FkKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1ldGEgPSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IHBheWxvYWQuY2hhbm5lbCxcbiAgICAgICAgICAgICAgICAgICAgc3ViVHlwZTogcGF5bG9hZC5kYXRhLnN1YlR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGU6IHBheWxvYWQuZGF0YS5kYXRlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB2YXIgYWN0dWFsRGF0YSA9IHBheWxvYWQuZGF0YS5kYXRhO1xuICAgICAgICAgICAgICAgIGlmIChhY3R1YWxEYXRhLmRhdGEpIHsgLy9EZWxldGUgbm90aWZpY2F0aW9ucyBhcmUgb25lIGRhdGEtbGV2ZWwgYmVoaW5kIG9mIGNvdXJzZVxuICAgICAgICAgICAgICAgICAgICBhY3R1YWxEYXRhID0gYWN0dWFsRGF0YS5kYXRhO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgYWN0dWFsRGF0YSwgbWV0YSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIG9sZHN1YnMuY2FsbChjaGFubmVsLCB0b3BpYywgY2FsbGJhY2tXaXRoQ2xlYW5EYXRhLCBjb250ZXh0LCBvcHRpb25zKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gY2hhbm5lbDtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBFcGljZW50ZXJDaGFubmVsTWFuYWdlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgRVBJX0NPT0tJRV9LRVk6ICdlcGljZW50ZXIucHJvamVjdC50b2tlbicsXG4gICAgRVBJX1NFU1NJT05fS0VZOiAnZXBpY2VudGVyLnVzZXIuc2Vzc2lvbicsXG4gICAgU1RSQVRFR1lfU0VTU0lPTl9LRVk6ICdlcGljZW50ZXItc2NlbmFyaW8nXG59OyIsIi8qKlxuKiAjIyBSdW4gTWFuYWdlclxuKlxuKiBUaGUgUnVuIE1hbmFnZXIgZ2l2ZXMgeW91IGNvbnRyb2wgb3ZlciBydW4gY3JlYXRpb24gZGVwZW5kaW5nIG9uIHJ1biBzdGF0ZXMuIFNwZWNpZmljYWxseSwgeW91IGNhbiBzZWxlY3QgcnVuIGNyZWF0aW9uIHN0cmF0ZWdpZXMgKHJ1bGVzKSBmb3Igd2hpY2ggcnVucyBlbmQgdXNlcnMgb2YgeW91ciBwcm9qZWN0IHdvcmsgd2l0aCB3aGVuIHRoZXkgbG9nIGluIHRvIHlvdXIgcHJvamVjdC5cbipcbiogVW5kZXJseWluZyBFcGljZW50ZXIgQVBJcyAtLSBpbmNsdWRpbmcgdGhlIFtNb2RlbCBSdW4gQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvb3RoZXJfYXBpcy9tb2RlbF9hcGlzL3J1bi8pLCB0aGUgW1J1biBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9hZ2dyZWdhdGVfcnVuX2FwaSksIGFuZCBFcGljZW50ZXIuanMncyBvd24gW0Yuc2VydmljZS5SdW4uY3JlYXRlKCldKC4uL3J1bi1hcGktc2VydmljZS8pIC0tIGFsbCBhbGxvdyB5b3UgdG8gY3JlYXRlIG5ldyBydW5zLiBIb3dldmVyLCBmb3Igc29tZSBwcm9qZWN0cyBpdCBtYWtlcyBtb3JlIHNlbnNlIHRvIHBpY2sgdXAgd2hlcmUgdGhlIHVzZXIgbGVmdCBvZmYsIHVzaW5nIGFuIGV4aXN0aW5nIHJ1bi4gQW5kIGluIHNvbWUgcHJvamVjdHMsIHdoZXRoZXIgdG8gY3JlYXRlIGEgbmV3IG9uZSBvciB1c2UgYW4gZXhpc3Rpbmcgb25lIGlzIGNvbmRpdGlvbmFsLCBmb3IgZXhhbXBsZSBiYXNlZCBvbiBjaGFyYWN0ZXJpc3RpY3Mgb2YgdGhlIGV4aXN0aW5nIHJ1biBvciB5b3VyIG93biBrbm93bGVkZ2UgYWJvdXQgdGhlIG1vZGVsLiBUaGUgUnVuIE1hbmFnZXIgcHJvdmlkZXMgdGhpcyBsZXZlbCBvZiBjb250cm9sLlxuKlxuKiAjIyMgVXNpbmcgdGhlIFJ1biBNYW5hZ2VyIHRvIGNyZWF0ZSBhbmQgYWNjZXNzIHJ1bnNcbipcbiogVG8gdXNlIHRoZSBSdW4gTWFuYWdlciwgaW5zdGFudGlhdGUgaXQgYnkgcGFzc2luZyBpbjpcbipcbiogICAqIGBydW5gOiAocmVxdWlyZWQpIFJ1biBvYmplY3QuIE11c3QgY29udGFpbjpcbiogICAgICAgKiBgYWNjb3VudGA6IEVwaWNlbnRlciBhY2NvdW50IGlkICgqKlRlYW0gSUQqKiBmb3IgdGVhbSBwcm9qZWN0cywgKipVc2VyIElEKiogZm9yIHBlcnNvbmFsIHByb2plY3RzKS5cbiogICAgICAgKiBgcHJvamVjdGA6IEVwaWNlbnRlciBwcm9qZWN0IGlkLlxuKiAgICAgICAqIGBtb2RlbGA6IFRoZSBuYW1lIG9mIHlvdXIgcHJpbWFyeSBtb2RlbCBmaWxlLiAoU2VlIG1vcmUgb24gW1dyaXRpbmcgeW91ciBNb2RlbF0oLi4vLi4vLi4vd3JpdGluZ195b3VyX21vZGVsLykuKVxuKiAgICAgICAqIGBzY29wZWA6IChvcHRpb25hbCkgU2NvcGUgb2JqZWN0IGZvciB0aGUgcnVuLCBmb3IgZXhhbXBsZSBgc2NvcGUuZ3JvdXBgIHdpdGggdmFsdWUgb2YgdGhlIG5hbWUgb2YgdGhlIGdyb3VwLlxuKiAgICAgICAqIGBmaWxlc2A6IChvcHRpb25hbCkgSWYgYW5kIG9ubHkgaWYgeW91IGFyZSB1c2luZyBhIFZlbnNpbSBtb2RlbCBhbmQgeW91IGhhdmUgYWRkaXRpb25hbCBkYXRhIHRvIHBhc3MgaW4gdG8geW91ciBtb2RlbCwgeW91IGNhbiBwYXNzIGEgYGZpbGVzYCBvYmplY3Qgd2l0aCB0aGUgbmFtZXMgb2YgdGhlIGZpbGVzLCBmb3IgZXhhbXBsZTogYFwiZmlsZXNcIjoge1wiZGF0YVwiOiBcIm15RXh0cmFEYXRhLnhsc1wifWAuIChOb3RlIHRoYXQgeW91J2xsIGFsc28gbmVlZCB0byBhZGQgdGhpcyBzYW1lIGZpbGVzIG9iamVjdCB0byB5b3VyIFZlbnNpbSBbY29uZmlndXJhdGlvbiBmaWxlXSguLi8uLi8uLi9tb2RlbF9jb2RlL3ZlbnNpbS8pLikgU2VlIHRoZSBbdW5kZXJseWluZyBNb2RlbCBSdW4gQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvb3RoZXJfYXBpcy9tb2RlbF9hcGlzL3J1bi8jcG9zdC1jcmVhdGluZy1hLW5ldy1ydW4tZm9yLXRoaXMtcHJvamVjdCkgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24uXG4qXG4qICAgKiBgc3RyYXRlZ3lgOiAob3B0aW9uYWwpIFJ1biBjcmVhdGlvbiBzdHJhdGVneSBmb3Igd2hlbiB0byBjcmVhdGUgYSBuZXcgcnVuIGFuZCB3aGVuIHRvIHJldXNlIGFuIGVuZCB1c2VyJ3MgZXhpc3RpbmcgcnVuLiBTZWUgW1J1biBNYW5hZ2VyIFN0cmF0ZWdpZXNdKC4uLy4uL3N0cmF0ZWd5LykgZm9yIGRldGFpbHMuIERlZmF1bHRzIHRvIGBuZXctaWYtaW5pdGlhbGl6ZWRgLlxuKlxuKiAgICogYHNlc3Npb25LZXlgOiAob3B0aW9uYWwpIE5hbWUgb2YgYnJvd3NlciBjb29raWUgaW4gd2hpY2ggdG8gc3RvcmUgcnVuIGluZm9ybWF0aW9uLCBpbmNsdWRpbmcgcnVuIGlkLiBNYW55IGNvbmRpdGlvbmFsIHN0cmF0ZWdpZXMsIGluY2x1ZGluZyB0aGUgcHJvdmlkZWQgc3RyYXRlZ2llcywgcmVseSBvbiB0aGlzIGJyb3dzZXIgY29va2llIHRvIHN0b3JlIHRoZSBydW4gaWQgYW5kIGhlbHAgbWFrZSB0aGUgZGVjaXNpb24gb2Ygd2hldGhlciB0byBjcmVhdGUgYSBuZXcgcnVuIG9yIHVzZSBhbiBleGlzdGluZyBvbmUuIFRoZSBuYW1lIG9mIHRoaXMgY29va2llIGRlZmF1bHRzIHRvIGBlcGljZW50ZXItc2NlbmFyaW9gIGFuZCBjYW4gYmUgc2V0IHdpdGggdGhlIGBzZXNzaW9uS2V5YCBwYXJhbWV0ZXIuXG4qXG4qXG4qIEFmdGVyIGluc3RhbnRpYXRpbmcgYSBSdW4gTWFuYWdlciwgbWFrZSBhIGNhbGwgdG8gYGdldFJ1bigpYCB3aGVuZXZlciB5b3UgbmVlZCB0byBhY2Nlc3MgYSBydW4gZm9yIHRoaXMgZW5kIHVzZXIuIFRoZSBgUnVuTWFuYWdlci5ydW5gIGNvbnRhaW5zIHRoZSBpbnN0YW50aWF0ZWQgW1J1biBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKS5cbipcbiogKipFeGFtcGxlKipcbipcbiogICAgICAgdmFyIHJtID0gbmV3IEYubWFuYWdlci5SdW5NYW5hZ2VyKHtcbiogICAgICAgICAgIHJ1bjoge1xuKiAgICAgICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiogICAgICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuKiAgICAgICAgICAgICAgIG1vZGVsOiAnc3VwcGx5LWNoYWluLW1vZGVsLmpsJyxcbiogICAgICAgICAgICAgICBzZXJ2ZXI6IHsgaG9zdDogJ2FwaS5mb3Jpby5jb20nIH1cbiogICAgICAgICAgIH0sXG4qICAgICAgICAgICBzdHJhdGVneTogJ2Fsd2F5cy1uZXcnLFxuKiAgICAgICAgICAgc2Vzc2lvbktleTogJ2VwaWNlbnRlci1zZXNzaW9uJ1xuKiAgICAgICB9KTtcbiogICAgICAgcm0uZ2V0UnVuKClcbiogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJ1bikge1xuKiAgICAgICAgICAgICAgIC8vIHRoZSByZXR1cm4gdmFsdWUgb2YgZ2V0UnVuKCkgaXMgYSBydW4gb2JqZWN0XG4qICAgICAgICAgICAgICAgdmFyIHRoaXNSdW5JZCA9IHJ1bi5pZDtcbiogICAgICAgICAgICAgICAvLyB0aGUgUnVuTWFuYWdlci5ydW4gYWxzbyBjb250YWlucyB0aGUgaW5zdGFudGlhdGVkIFJ1biBTZXJ2aWNlLFxuKiAgICAgICAgICAgICAgIC8vIHNvIGFueSBSdW4gU2VydmljZSBtZXRob2QgaXMgdmFsaWQgaGVyZVxuKiAgICAgICAgICAgICAgIHJtLnJ1bi5kbygncnVuTW9kZWwnKTtcbiogICAgICAgfSlcbipcbiovXG5cbid1c2Ugc3RyaWN0JztcbnZhciBzdHJhdGVnaWVzTWFwID0gcmVxdWlyZSgnLi9ydW4tc3RyYXRlZ2llcy9zdHJhdGVnaWVzLW1hcCcpO1xudmFyIHNwZWNpYWxPcGVyYXRpb25zID0gcmVxdWlyZSgnLi9zcGVjaWFsLW9wZXJhdGlvbnMnKTtcbnZhciBSdW5TZXJ2aWNlID0gcmVxdWlyZSgnLi4vc2VydmljZS9ydW4tYXBpLXNlcnZpY2UnKTtcblxuXG5mdW5jdGlvbiBwYXRjaFJ1blNlcnZpY2Uoc2VydmljZSwgbWFuYWdlcikge1xuICAgIGlmIChzZXJ2aWNlLnBhdGNoZWQpIHtcbiAgICAgICAgcmV0dXJuIHNlcnZpY2U7XG4gICAgfVxuXG4gICAgdmFyIG9yaWcgPSBzZXJ2aWNlLmRvO1xuICAgIHNlcnZpY2UuZG8gPSBmdW5jdGlvbiAob3BlcmF0aW9uLCBwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHJlc2VydmVkT3BzID0gT2JqZWN0LmtleXMoc3BlY2lhbE9wZXJhdGlvbnMpO1xuICAgICAgICBpZiAocmVzZXJ2ZWRPcHMuaW5kZXhPZihvcGVyYXRpb24pID09PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIG9yaWcuYXBwbHkoc2VydmljZSwgYXJndW1lbnRzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBzcGVjaWFsT3BlcmF0aW9uc1tvcGVyYXRpb25dLmNhbGwoc2VydmljZSwgcGFyYW1zLCBvcHRpb25zLCBtYW5hZ2VyKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzZXJ2aWNlLnBhdGNoZWQgPSB0cnVlO1xuXG4gICAgcmV0dXJuIHNlcnZpY2U7XG59XG5cblxuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgLyoqXG4gICAgICogUnVuIGNyZWF0aW9uIHN0cmF0ZWd5IGZvciB3aGVuIHRvIGNyZWF0ZSBhIG5ldyBydW4gYW5kIHdoZW4gdG8gcmV1c2UgYW4gZW5kIHVzZXIncyBleGlzdGluZyBydW4uIFNlZSBbUnVuIE1hbmFnZXIgU3RyYXRlZ2llc10oLi4vLi4vc3RyYXRlZ3kvKSBmb3IgZGV0YWlscy4gRGVmYXVsdHMgdG8gYG5ldy1pZi1pbml0aWFsaXplZGAuXG4gICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgKi9cblxuICAgIHN0cmF0ZWd5OiAnbmV3LWlmLWluaXRpYWxpemVkJ1xufTtcblxuZnVuY3Rpb24gUnVuTWFuYWdlcihvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBvcHRpb25zKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMucnVuIGluc3RhbmNlb2YgUnVuU2VydmljZSkge1xuICAgICAgICB0aGlzLnJ1biA9IHRoaXMub3B0aW9ucy5ydW47XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5ydW4gPSBuZXcgUnVuU2VydmljZSh0aGlzLm9wdGlvbnMucnVuKTtcbiAgICB9XG5cbiAgICBwYXRjaFJ1blNlcnZpY2UodGhpcy5ydW4sIHRoaXMpO1xuXG4gICAgdmFyIFN0cmF0ZWd5Q3RvciA9IHR5cGVvZiB0aGlzLm9wdGlvbnMuc3RyYXRlZ3kgPT09ICdmdW5jdGlvbicgPyB0aGlzLm9wdGlvbnMuc3RyYXRlZ3kgOiBzdHJhdGVnaWVzTWFwW3RoaXMub3B0aW9ucy5zdHJhdGVneV07XG5cbiAgICBpZiAoIVN0cmF0ZWd5Q3Rvcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NwZWNpZmllZCBydW4gY3JlYXRpb24gc3RyYXRlZ3kgd2FzIGludmFsaWQ6JywgdGhpcy5vcHRpb25zLnN0cmF0ZWd5KTtcbiAgICB9XG5cbiAgICB0aGlzLnN0cmF0ZWd5ID0gbmV3IFN0cmF0ZWd5Q3Rvcih0aGlzLnJ1biwgdGhpcy5vcHRpb25zKTtcbn1cblxuUnVuTWFuYWdlci5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcnVuIG9iamVjdCBmb3IgYSAnZ29vZCcgcnVuLlxuICAgICAqXG4gICAgICogQSBnb29kIHJ1biBpcyBkZWZpbmVkIGJ5IHRoZSBzdHJhdGVneS4gRm9yIGV4YW1wbGUsIGlmIHRoZSBzdHJhdGVneSBpcyBgYWx3YXlzLW5ld2AsIHRoZSBjYWxsXG4gICAgICogdG8gYGdldFJ1bigpYCBhbHdheXMgcmV0dXJucyBhIG5ld2x5IGNyZWF0ZWQgcnVuOyBpZiB0aGUgc3RyYXRlZ3kgaXMgYG5ldy1pZi1wZXJzaXN0ZWRgLFxuICAgICAqIGBnZXRSdW4oKWAgY3JlYXRlcyBhIG5ldyBydW4gaWYgdGhlIHByZXZpb3VzIHJ1biBpcyBpbiBhIHBlcnNpc3RlZCBzdGF0ZSwgb3RoZXJ3aXNlXG4gICAgICogaXQgcmV0dXJucyB0aGUgcHJldmlvdXMgcnVuLiBTZWUgW1J1biBNYW5hZ2VyIFN0cmF0ZWdpZXNdKC4uLy4uL3N0cmF0ZWd5LykgZm9yIG1vcmUgb24gc3RyYXRlZ2llcy5cbiAgICAgKlxuICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICBybS5nZXRSdW4oKS50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgKiAgICAgICAgICAvLyB1c2UgdGhlIHJ1biBvYmplY3RcbiAgICAgKiAgICAgICAgICB2YXIgdGhpc1J1bklkID0gcnVuLmlkO1xuICAgICAqXG4gICAgICogICAgICAgICAgLy8gdXNlIHRoZSBSdW4gU2VydmljZSBvYmplY3RcbiAgICAgKiAgICAgICAgICBybS5ydW4uZG8oJ3J1bk1vZGVsJyk7XG4gICAgICogICAgICB9KTtcbiAgICAgKlxuICAgICAqIEByZXR1cm4geyRwcm9taXNlfSBQcm9taXNlIHRvIGNvbXBsZXRlIHRoZSBjYWxsLlxuICAgICAqL1xuICAgIGdldFJ1bjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdHJhdGVneVxuICAgICAgICAgICAgICAgIC5nZXRSdW4oKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcnVuIG9iamVjdCBmb3IgYSBuZXcgcnVuLCByZWdhcmRsZXNzIG9mIHN0cmF0ZWd5OiBmb3JjZSBjcmVhdGlvbiBvZiBhIG5ldyBydW4uXG4gICAgICpcbiAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgcm0ucmVzZXQoKS50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgKiAgICAgICAgICAvLyB1c2UgdGhlIChuZXcpIHJ1biBvYmplY3RcbiAgICAgKiAgICAgICAgICB2YXIgdGhpc1J1bklkID0gcnVuLmlkO1xuICAgICAqXG4gICAgICogICAgICAgICAgLy8gdXNlIHRoZSBSdW4gU2VydmljZSBvYmplY3RcbiAgICAgKiAgICAgICAgICBybS5ydW4uZG8oJ3J1bk1vZGVsJyk7XG4gICAgICogICAgICB9KTtcbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGBydW5TZXJ2aWNlT3B0aW9uc2AgVGhlIG9wdGlvbnMgb2JqZWN0IHRvIGNvbmZpZ3VyZSB0aGUgUnVuIFNlcnZpY2UuIFNlZSBbUnVuIEFQSSBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKSBmb3IgbW9yZS5cbiAgICAgKi9cbiAgICByZXNldDogZnVuY3Rpb24gKHJ1blNlcnZpY2VPcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0cmF0ZWd5LnJlc2V0KHJ1blNlcnZpY2VPcHRpb25zKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJ1bk1hbmFnZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBDb25kaXRpb25hbFN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9jb25kaXRpb25hbC1jcmVhdGlvbi1zdHJhdGVneScpO1xuXG52YXIgX19zdXBlciA9IENvbmRpdGlvbmFsU3RyYXRlZ3kucHJvdG90eXBlO1xuXG52YXIgU3RyYXRlZ3kgPSBjbGFzc0Zyb20oQ29uZGl0aW9uYWxTdHJhdGVneSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAocnVuU2VydmljZSwgb3B0aW9ucykge1xuICAgICAgICBfX3N1cGVyLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgcnVuU2VydmljZSwgdGhpcy5jcmVhdGVJZiwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIGNyZWF0ZUlmOiBmdW5jdGlvbiAocnVuLCBoZWFkZXJzKSB7XG4gICAgICAgIC8vIGFsd2F5cyBjcmVhdGUgYSBuZXcgcnVuIVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJhdGVneTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG1ha2VTZXEgPSByZXF1aXJlKCcuLi8uLi91dGlsL21ha2Utc2VxdWVuY2UnKTtcbnZhciBCYXNlID0gcmVxdWlyZSgnLi9pZGVudGl0eS1zdHJhdGVneScpO1xudmFyIFNlc3Npb25TdG9yZSA9IHJlcXVpcmUoJy4uLy4uL3N0b3JlL3N0b3JlLWZhY3RvcnknKTtcbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBVcmxTZXJ2aWNlID0gcmVxdWlyZSgnLi4vLi4vc2VydmljZS91cmwtY29uZmlnLXNlcnZpY2UnKTtcbnZhciBBdXRoTWFuYWdlciA9IHJlcXVpcmUoJy4uL2F1dGgtbWFuYWdlcicpO1xuXG52YXIgc2Vzc2lvblN0b3JlID0gbmV3IFNlc3Npb25TdG9yZSh7fSk7XG52YXIgdXJsU2VydmljZSA9IG5ldyBVcmxTZXJ2aWNlKCk7XG52YXIga2V5TmFtZXMgPSByZXF1aXJlKCcuLi9rZXktbmFtZXMnKTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHNlc3Npb25LZXk6IGtleU5hbWVzLlNUUkFURUdZX1NFU1NJT05fS0VZLFxuICAgIHBhdGg6ICcnXG59O1xuXG5mdW5jdGlvbiBzZXRSdW5JblNlc3Npb24oc2Vzc2lvbktleSwgcnVuLCBwYXRoKSB7XG4gICAgaWYgKCFwYXRoKSB7XG4gICAgICAgIGlmICghdXJsU2VydmljZS5pc0xvY2FsaG9zdCgpKSB7XG4gICAgICAgICAgICBwYXRoID0gJy8nICsgW3VybFNlcnZpY2UuYXBwUGF0aCwgdXJsU2VydmljZS5hY2NvdW50UGF0aCwgdXJsU2VydmljZS5wcm9qZWN0UGF0aF0uam9pbignLycpO1xuICAgICAgICAgICAgLy8gbWFrZSBzdXJlIHdlIGRvbid0IGdldCBjb25zZWN1dGVpdmUgJy8nIHNvIHdlIGhhdmUgYSB2YWxpZCBwYXRoIGZvciB0aGUgc2Vzc2lvblxuICAgICAgICAgICAgcGF0aCA9IHBhdGgucmVwbGFjZSgvXFwvezIsfS9nLCcvJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYXRoID0gJyc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gc2V0IHRoZSBzZWVzaW9uS2V5IGZvciB0aGUgcnVuXG4gICAgc2Vzc2lvblN0b3JlLnNldChzZXNzaW9uS2V5LCBKU09OLnN0cmluZ2lmeSh7IHJ1bklkOiBydW4uaWQgfSksIHsgcm9vdDogcGF0aCB9KTtcbn1cblxuLyoqXG4qIENvbmRpdGlvbmFsIENyZWF0aW9uIFN0cmF0ZWd5XG4qIFRoaXMgc3RyYXRlZ3kgd2lsbCB0cnkgdG8gZ2V0IHRoZSBydW4gc3RvcmVkIGluIHRoZSBjb29raWUgYW5kXG4qIGV2YWx1YXRlIGlmIG5lZWRzIHRvIGNyZWF0ZSBhIG5ldyBydW4gYnkgY2FsbGluZyB0aGUgJ2NvbmRpdGlvbicgZnVuY3Rpb25cbiovXG5cbi8qIGpzaGludCBlcW51bGw6IHRydWUgKi9cbnZhciBTdHJhdGVneSA9IGNsYXNzRnJvbShCYXNlLCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIFN0cmF0ZWd5KHJ1blNlcnZpY2UsIGNvbmRpdGlvbiwgb3B0aW9ucykge1xuXG4gICAgICAgIGlmIChjb25kaXRpb24gPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb25kaXRpb25hbCBzdHJhdGVneSBuZWVkcyBhIGNvbmRpdGlvbiB0byBjcmVhdGV0ZSBhIHJ1bicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fYXV0aCA9IG5ldyBBdXRoTWFuYWdlcigpO1xuICAgICAgICB0aGlzLnJ1biA9IG1ha2VTZXEocnVuU2VydmljZSk7XG4gICAgICAgIHRoaXMuY29uZGl0aW9uID0gdHlwZW9mIGNvbmRpdGlvbiAhPT0gJ2Z1bmN0aW9uJyA/IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGNvbmRpdGlvbjsgfSA6IGNvbmRpdGlvbjtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5ydW5PcHRpb25zID0gdGhpcy5vcHRpb25zLnJ1bjtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uIChydW5TZXJ2aWNlT3B0aW9ucykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgdXNlclNlc3Npb24gPSB0aGlzLl9hdXRoLmdldEN1cnJlbnRVc2VyU2Vzc2lvbkluZm8oKTtcbiAgICAgICAgdmFyIG9wdCA9ICQuZXh0ZW5kKHtcbiAgICAgICAgICAgIHNjb3BlOiB7IGdyb3VwOiB1c2VyU2Vzc2lvbi5ncm91cElkIH1cbiAgICAgICAgfSwgdGhpcy5ydW5PcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5ydW5cbiAgICAgICAgICAgICAgICAuY3JlYXRlKG9wdCwgcnVuU2VydmljZU9wdGlvbnMpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgICAgICAgICAgc2V0UnVuSW5TZXNzaW9uKF90aGlzLm9wdGlvbnMuc2Vzc2lvbktleSwgcnVuLCBfdGhpcy5vcHRpb25zLnBhdGgpO1xuICAgICAgICAgICAgICAgIHJ1bi5mcmVzaGx5Q3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3RhcnQoKTtcbiAgICB9LFxuXG4gICAgZ2V0UnVuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBydW5TZXNzaW9uID0gSlNPTi5wYXJzZShzZXNzaW9uU3RvcmUuZ2V0KHRoaXMub3B0aW9ucy5zZXNzaW9uS2V5KSk7XG5cbiAgICAgICAgaWYgKHJ1blNlc3Npb24gJiYgcnVuU2Vzc2lvbi5ydW5JZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRBbmRDaGVjayhydW5TZXNzaW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc2V0KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2xvYWRBbmRDaGVjazogZnVuY3Rpb24gKHJ1blNlc3Npb24pIHtcbiAgICAgICAgdmFyIHNob3VsZENyZWF0ZSA9IGZhbHNlO1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnJ1blxuICAgICAgICAgICAgLmxvYWQocnVuU2Vzc2lvbi5ydW5JZCwgbnVsbCwge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChydW4sIG1zZywgaGVhZGVycykge1xuICAgICAgICAgICAgICAgICAgICBzaG91bGRDcmVhdGUgPSBfdGhpcy5jb25kaXRpb24uY2FsbChfdGhpcywgcnVuLCBoZWFkZXJzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgICAgIGlmIChzaG91bGRDcmVhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gd2UgbmVlZCB0byBkbyB0aGlzLCBvbiB0aGUgb3JpZ2luYWwgcnVuU2VydmljZSAoaWUgbm90IHNlcXVlbmNpYWxpemVkKVxuICAgICAgICAgICAgICAgICAgICAvLyBzbyB3ZSBkb24ndCBnZXQgaW4gdGhlIG1pZGRsZSBvZiB0aGUgcXVldWVcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLnJ1bi5vcmlnaW5hbC5jcmVhdGUoX3RoaXMucnVuT3B0aW9ucylcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0UnVuSW5TZXNzaW9uKF90aGlzLm9wdGlvbnMuc2Vzc2lvbktleSwgcnVuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bi5mcmVzaGx5Q3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGFydCgpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmF0ZWd5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgQmFzZSA9IHt9O1xuXG4vLyBJbnRlcmZhY2UgdGhhdCBhbGwgc3RyYXRlZ2llcyBuZWVkIHRvIGltcGxlbWVudFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzc0Zyb20oQmFzZSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAocnVuU2VydmljZSwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLnJ1blNlcnZpY2UgID0gcnVuU2VydmljZTtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gcmV0dXJuIGEgbmV3bHkgY3JlYXRlZCBydW5cbiAgICAgICAgcmV0dXJuICQuRGVmZXJyZWQoKS5yZXNvbHZlKCkucHJvbWlzZSgpO1xuICAgIH0sXG5cbiAgICBnZXRSdW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gcmV0dXJuIGEgdXNhYmxlIHJ1blxuICAgICAgICByZXR1cm4gJC5EZWZlcnJlZCgpLnJlc29sdmUodGhpcy5ydW5TZXJ2aWNlKS5wcm9taXNlKCk7XG4gICAgfVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcblxudmFyIElkZW50aXR5U3RyYXRlZ3kgPSByZXF1aXJlKCcuL2lkZW50aXR5LXN0cmF0ZWd5Jyk7XG52YXIgV29ybGRBcGlBZGFwdGVyID0gcmVxdWlyZSgnLi4vLi4vc2VydmljZS93b3JsZC1hcGktYWRhcHRlcicpO1xudmFyIEF1dGhNYW5hZ2VyID0gcmVxdWlyZSgnLi4vYXV0aC1tYW5hZ2VyJyk7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICBzdG9yZToge1xuICAgICAgICBzeW5jaHJvbm91czogdHJ1ZVxuICAgIH1cbn07XG5cbnZhciBTdHJhdGVneSA9IGNsYXNzRnJvbShJZGVudGl0eVN0cmF0ZWd5LCB7XG5cbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5ydW5TZXJ2aWNlID0gcnVuU2VydmljZTtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fYXV0aCA9IG5ldyBBdXRoTWFuYWdlcigpO1xuICAgICAgICB0aGlzLl9sb2FkUnVuID0gdGhpcy5fbG9hZFJ1bi5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLndvcmxkQXBpID0gbmV3IFdvcmxkQXBpQWRhcHRlcih0aGlzLm9wdGlvbnMucnVuKTtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLl9hdXRoLmdldEN1cnJlbnRVc2VyU2Vzc2lvbkluZm8oKTtcbiAgICAgICAgdmFyIGN1clVzZXJJZCA9IHNlc3Npb24udXNlcklkO1xuICAgICAgICB2YXIgY3VyR3JvdXBOYW1lID0gc2Vzc2lvbi5ncm91cE5hbWU7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMud29ybGRBcGlcbiAgICAgICAgICAgIC5nZXRDdXJyZW50V29ybGRGb3JVc2VyKGN1clVzZXJJZCwgY3VyR3JvdXBOYW1lKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHdvcmxkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMud29ybGRBcGkubmV3UnVuRm9yV29ybGQod29ybGQuaWQpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgZ2V0UnVuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5fYXV0aC5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICAgIHZhciBjdXJVc2VySWQgPSBzZXNzaW9uLnVzZXJJZDtcbiAgICAgICAgdmFyIGN1ckdyb3VwTmFtZSA9IHNlc3Npb24uZ3JvdXBOYW1lO1xuICAgICAgICB2YXIgd29ybGRBcGkgPSB0aGlzLndvcmxkQXBpO1xuICAgICAgICB2YXIgbW9kZWwgPSB0aGlzLm9wdGlvbnMubW9kZWw7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBkdGQgPSAkLkRlZmVycmVkKCk7XG5cbiAgICAgICAgaWYgKCFjdXJVc2VySWQpIHtcbiAgICAgICAgICAgIHJldHVybiBkdGQucmVqZWN0KHsgc3RhdHVzQ29kZTogNDAwLCBlcnJvcjogJ1dlIG5lZWQgYW4gYXV0aGVudGljYXRlZCB1c2VyIHRvIGpvaW4gYSBtdWx0aXBsYXllciB3b3JsZC4gKEVSUjogbm8gdXNlcklkIGluIHNlc3Npb24pJyB9LCBzZXNzaW9uKS5wcm9taXNlKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbG9hZFJ1bkZyb21Xb3JsZCA9IGZ1bmN0aW9uICh3b3JsZCkge1xuICAgICAgICAgICAgaWYgKCF3b3JsZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkdGQucmVqZWN0KHsgc3RhdHVzQ29kZTogNDA0LCBlcnJvcjogJ1RoZSB1c2VyIGlzIG5vdCBpbiBhbnkgd29ybGQuJyB9LCB7IG9wdGlvbnM6IHRoaXMub3B0aW9ucywgc2Vzc2lvbjogc2Vzc2lvbiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkQXBpLmdldEN1cnJlbnRSdW5JZCh7IG1vZGVsOiBtb2RlbCwgZmlsdGVyOiB3b3JsZC5pZCB9KVxuICAgICAgICAgICAgICAgIC50aGVuKF90aGlzLl9sb2FkUnVuKVxuICAgICAgICAgICAgICAgIC50aGVuKGR0ZC5yZXNvbHZlKVxuICAgICAgICAgICAgICAgIC5mYWlsKGR0ZC5yZWplY3QpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBzZXJ2ZXJFcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgLy8gaXMgdGhpcyBwb3NzaWJsZT9cbiAgICAgICAgICAgIGR0ZC5yZWplY3QoZXJyb3IsIHNlc3Npb24sIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy53b3JsZEFwaVxuICAgICAgICAgICAgLmdldEN1cnJlbnRXb3JsZEZvclVzZXIoY3VyVXNlcklkLCBjdXJHcm91cE5hbWUpXG4gICAgICAgICAgICAudGhlbihsb2FkUnVuRnJvbVdvcmxkKVxuICAgICAgICAgICAgLmZhaWwoc2VydmVyRXJyb3IpO1xuXG4gICAgICAgIHJldHVybiBkdGQucHJvbWlzZSgpO1xuICAgIH0sXG5cbiAgICBfbG9hZFJ1bjogZnVuY3Rpb24gKGlkLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1blNlcnZpY2UubG9hZChpZCwgbnVsbCwgb3B0aW9ucyk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RyYXRlZ3k7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgQ29uZGl0aW9uYWxTdHJhdGVneSA9IHJlcXVpcmUoJy4vY29uZGl0aW9uYWwtY3JlYXRpb24tc3RyYXRlZ3knKTtcblxudmFyIF9fc3VwZXIgPSBDb25kaXRpb25hbFN0cmF0ZWd5LnByb3RvdHlwZTtcblxudmFyIFN0cmF0ZWd5ID0gY2xhc3NGcm9tKENvbmRpdGlvbmFsU3RyYXRlZ3ksIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIG9wdGlvbnMpIHtcbiAgICAgICAgX19zdXBlci5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIHJ1blNlcnZpY2UsIHRoaXMuY3JlYXRlSWYsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICBjcmVhdGVJZjogZnVuY3Rpb24gKHJ1biwgaGVhZGVycykge1xuICAgICAgICByZXR1cm4gaGVhZGVycy5nZXRSZXNwb25zZUhlYWRlcigncHJhZ21hJykgPT09ICdwZXJzaXN0ZW50JyB8fCBydW4uaW5pdGlhbGl6ZWQ7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RyYXRlZ3k7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBDb25kaXRpb25hbFN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9jb25kaXRpb25hbC1jcmVhdGlvbi1zdHJhdGVneScpO1xuXG52YXIgX19zdXBlciA9IENvbmRpdGlvbmFsU3RyYXRlZ3kucHJvdG90eXBlO1xuXG4vKlxuKiAgY3JlYXRlIGEgbmV3IHJ1biBvbmx5IGlmIG5vdGhpbmcgaXMgc3RvcmVkIGluIHRoZSBjb29raWVcbiogIHRoaXMgaXMgdXNlZnVsIGZvciBiYXNlUnVucy5cbiovXG52YXIgU3RyYXRlZ3kgPSBjbGFzc0Zyb20oQ29uZGl0aW9uYWxTdHJhdGVneSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAocnVuU2VydmljZSwgb3B0aW9ucykge1xuICAgICAgICBfX3N1cGVyLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgcnVuU2VydmljZSwgdGhpcy5jcmVhdGVJZiwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIGNyZWF0ZUlmOiBmdW5jdGlvbiAocnVuLCBoZWFkZXJzKSB7XG4gICAgICAgIC8vIGlmIHdlIGFyZSBoZXJlLCBpdCBtZWFucyB0aGF0IHRoZSBydW4gZXhpc3RzLi4uIHNvIHdlIGRvbid0IG5lZWQgYSBuZXcgb25lXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJhdGVneTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBDb25kaXRpb25hbFN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9jb25kaXRpb25hbC1jcmVhdGlvbi1zdHJhdGVneScpO1xuXG52YXIgX19zdXBlciA9IENvbmRpdGlvbmFsU3RyYXRlZ3kucHJvdG90eXBlO1xuXG52YXIgU3RyYXRlZ3kgPSBjbGFzc0Zyb20oQ29uZGl0aW9uYWxTdHJhdGVneSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAocnVuU2VydmljZSwgb3B0aW9ucykge1xuICAgICAgICBfX3N1cGVyLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgcnVuU2VydmljZSwgdGhpcy5jcmVhdGVJZiwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIGNyZWF0ZUlmOiBmdW5jdGlvbiAocnVuLCBoZWFkZXJzKSB7XG4gICAgICAgIHJldHVybiBoZWFkZXJzLmdldFJlc3BvbnNlSGVhZGVyKCdwcmFnbWEnKSA9PT0gJ3BlcnNpc3RlbnQnO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmF0ZWd5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgSWRlbnRpdHlTdHJhdGVneSA9IHJlcXVpcmUoJy4vaWRlbnRpdHktc3RyYXRlZ3knKTtcbnZhciBTdG9yYWdlRmFjdG9yeSA9IHJlcXVpcmUoJy4uLy4uL3N0b3JlL3N0b3JlLWZhY3RvcnknKTtcbnZhciBTdGF0ZUFwaSA9IHJlcXVpcmUoJy4uLy4uL3NlcnZpY2Uvc3RhdGUtYXBpLWFkYXB0ZXInKTtcbnZhciBBdXRoTWFuYWdlciA9IHJlcXVpcmUoJy4uL2F1dGgtbWFuYWdlcicpO1xuXG52YXIga2V5TmFtZXMgPSByZXF1aXJlKCcuLi9rZXktbmFtZXMnKTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHN0b3JlOiB7XG4gICAgICAgIHN5bmNocm9ub3VzOiB0cnVlXG4gICAgfVxufTtcblxudmFyIFN0cmF0ZWd5ID0gY2xhc3NGcm9tKElkZW50aXR5U3RyYXRlZ3ksIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gU3RyYXRlZ3kocnVuU2VydmljZSwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLnJ1biA9IHJ1blNlcnZpY2U7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMucnVuT3B0aW9ucyA9IHRoaXMub3B0aW9ucy5ydW47XG4gICAgICAgIHRoaXMuX3N0b3JlID0gbmV3IFN0b3JhZ2VGYWN0b3J5KHRoaXMub3B0aW9ucy5zdG9yZSk7XG4gICAgICAgIHRoaXMuc3RhdGVBcGkgPSBuZXcgU3RhdGVBcGkoKTtcbiAgICAgICAgdGhpcy5fYXV0aCA9IG5ldyBBdXRoTWFuYWdlcigpO1xuXG4gICAgICAgIHRoaXMuX2xvYWRBbmRDaGVjayA9IHRoaXMuX2xvYWRBbmRDaGVjay5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9yZXN0b3JlUnVuID0gdGhpcy5fcmVzdG9yZVJ1bi5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9nZXRBbGxSdW5zID0gdGhpcy5fZ2V0QWxsUnVucy5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9sb2FkUnVuID0gdGhpcy5fbG9hZFJ1bi5iaW5kKHRoaXMpO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gKHJ1blNlcnZpY2VPcHRpb25zKSB7XG4gICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5fYXV0aC5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICAgIHZhciBvcHQgPSAkLmV4dGVuZCh7XG4gICAgICAgICAgICBzY29wZTogeyBncm91cDogc2Vzc2lvbi5ncm91cE5hbWUgfVxuICAgICAgICB9LCB0aGlzLnJ1bk9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnJ1blxuICAgICAgICAgICAgLmNyZWF0ZShvcHQsIHJ1blNlcnZpY2VPcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgICAgIHJ1bi5mcmVzaGx5Q3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBnZXRSdW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldEFsbFJ1bnMoKVxuICAgICAgICAgICAgLnRoZW4odGhpcy5fbG9hZEFuZENoZWNrKTtcbiAgICB9LFxuXG4gICAgX2dldEFsbFJ1bnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHNlc3Npb24gPSBKU09OLnBhcnNlKHRoaXMuX3N0b3JlLmdldChrZXlOYW1lcy5FUElfU0VTU0lPTl9LRVkpIHx8ICd7fScpO1xuICAgICAgICByZXR1cm4gdGhpcy5ydW4ucXVlcnkoe1xuICAgICAgICAgICAgJ3VzZXIuaWQnOiBzZXNzaW9uLnVzZXJJZCB8fCAnMDAwMCcsXG4gICAgICAgICAgICAnc2NvcGUuZ3JvdXAnOiBzZXNzaW9uLmdyb3VwTmFtZVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX2xvYWRBbmRDaGVjazogZnVuY3Rpb24gKHJ1bnMpIHtcbiAgICAgICAgaWYgKCFydW5zIHx8ICFydW5zLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVzZXQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkYXRlQ29tcCA9IGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBuZXcgRGF0ZShiLmRhdGUpIC0gbmV3IERhdGUoYS5kYXRlKTsgfTtcbiAgICAgICAgdmFyIGxhdGVzdFJ1biA9IHJ1bnMuc29ydChkYXRlQ29tcClbMF07XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBzaG91bGRSZXBsYXkgPSBmYWxzZTtcblxuICAgICAgICByZXR1cm4gdGhpcy5ydW4ubG9hZChsYXRlc3RSdW4uaWQsIG51bGwsIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChydW4sIG1zZywgaGVhZGVycykge1xuICAgICAgICAgICAgICAgIHNob3VsZFJlcGxheSA9IGhlYWRlcnMuZ2V0UmVzcG9uc2VIZWFkZXIoJ3ByYWdtYScpID09PSAncGVyc2lzdGVudCc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgcmV0dXJuIHNob3VsZFJlcGxheSA/IF90aGlzLl9yZXN0b3JlUnVuKHJ1bi5pZCkgOiBydW47XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfcmVzdG9yZVJ1bjogZnVuY3Rpb24gKHJ1bklkKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlQXBpLnJlcGxheSh7IHJ1bklkOiBydW5JZCB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMuX2xvYWRSdW4ocmVzcC5ydW4pO1xuICAgICAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9sb2FkUnVuOiBmdW5jdGlvbiAoaWQsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuLmxvYWQoaWQsIG51bGwsIG9wdGlvbnMpO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RyYXRlZ3k7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnbmV3LWlmLWluaXRpYWxpemVkJzogcmVxdWlyZSgnLi9uZXctaWYtaW5pdGlhbGl6ZWQtc3RyYXRlZ3knKSxcbiAgICAnbmV3LWlmLXBlcnNpc3RlZCc6IHJlcXVpcmUoJy4vbmV3LWlmLXBlcnNpc3RlZC1zdHJhdGVneScpLFxuICAgICduZXctaWYtbWlzc2luZyc6IHJlcXVpcmUoJy4vbmV3LWlmLW1pc3Npbmctc3RyYXRlZ3knKSxcbiAgICAnYWx3YXlzLW5ldyc6IHJlcXVpcmUoJy4vYWx3YXlzLW5ldy1zdHJhdGVneScpLFxuICAgICdtdWx0aXBsYXllcic6IHJlcXVpcmUoJy4vbXVsdGlwbGF5ZXItc3RyYXRlZ3knKSxcbiAgICAncGVyc2lzdGVudC1zaW5nbGUtcGxheWVyJzogcmVxdWlyZSgnLi9wZXJzaXN0ZW50LXNpbmdsZS1wbGF5ZXItc3RyYXRlZ3knKSxcbiAgICAnbm9uZSc6IHJlcXVpcmUoJy4vaWRlbnRpdHktc3RyYXRlZ3knKVxufTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBSdW5TZXJ2aWNlID0gcmVxdWlyZSgnLi4vc2VydmljZS9ydW4tYXBpLXNlcnZpY2UnKTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHZhbGlkRmlsdGVyOiB7IHNhdmVkOiB0cnVlIH1cbn07XG5cbmZ1bmN0aW9uIFNjZW5hcmlvTWFuYWdlcihvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICB0aGlzLnJ1blNlcnZpY2UgPSB0aGlzLm9wdGlvbnMucnVuIHx8IG5ldyBSdW5TZXJ2aWNlKHRoaXMub3B0aW9ucyk7XG59XG5cblNjZW5hcmlvTWFuYWdlci5wcm90b3R5cGUgPSB7XG4gICAgZ2V0UnVuczogZnVuY3Rpb24gKGZpbHRlcikge1xuICAgICAgICB0aGlzLmZpbHRlciA9ICQuZXh0ZW5kKHRydWUsIHt9LCB0aGlzLm9wdGlvbnMudmFsaWRGaWx0ZXIsIGZpbHRlcik7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1blNlcnZpY2UucXVlcnkodGhpcy5maWx0ZXIpO1xuICAgIH0sXG5cbiAgICBsb2FkVmFyaWFibGVzOiBmdW5jdGlvbiAodmFycykge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW5TZXJ2aWNlLnF1ZXJ5KHRoaXMuZmlsdGVyLCB7IGluY2x1ZGU6IHZhcnMgfSk7XG4gICAgfSxcblxuICAgIHNhdmU6IGZ1bmN0aW9uIChydW4sIG1ldGEpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldFNlcnZpY2UocnVuKS5zYXZlKCQuZXh0ZW5kKHRydWUsIHt9LCB7IHNhdmVkOiB0cnVlIH0sIG1ldGEpKTtcbiAgICB9LFxuXG4gICAgYXJjaGl2ZTogZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0U2VydmljZShydW4pLnNhdmUoeyBzYXZlZDogZmFsc2UgfSk7XG4gICAgfSxcblxuICAgIF9nZXRTZXJ2aWNlOiBmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcnVuID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBSdW5TZXJ2aWNlKCQuZXh0ZW5kKHRydWUsIHt9LCAgdGhpcy5vcHRpb25zLCB7IGZpbHRlcjogcnVuIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgcnVuID09PSAnb2JqZWN0JyAmJiBydW4gaW5zdGFuY2VvZiBSdW5TZXJ2aWNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTYXZlIG1ldGhvZCByZXF1aXJlcyBhIHJ1biBzZXJ2aWNlIG9yIGEgcnVuSWQnKTtcbiAgICB9LFxuXG4gICAgZ2V0UnVuOiBmdW5jdGlvbiAocnVuSWQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSdW5TZXJ2aWNlKCQuZXh0ZW5kKHRydWUsIHt9LCAgdGhpcy5vcHRpb25zLCB7IGZpbHRlcjogcnVuSWQgfSkpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2NlbmFyaW9NYW5hZ2VyO1xuXG4iLCIndXNlIHN0cmljdCc7XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcmVzZXQ6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMsIG1hbmFnZXIpIHtcbiAgICAgICAgcmV0dXJuIG1hbmFnZXIucmVzZXQob3B0aW9ucyk7XG4gICAgfVxufTtcbiIsIi8qKlxuKiAjIyBXb3JsZCBNYW5hZ2VyXG4qXG4qIEFzIGRpc2N1c3NlZCB1bmRlciB0aGUgW1dvcmxkIEFQSSBBZGFwdGVyXSguLi93b3JsZC1hcGktYWRhcHRlci8pLCBhIFtydW5dKC4uLy4uLy4uL2dsb3NzYXJ5LyNydW4pIGlzIGEgY29sbGVjdGlvbiBvZiBlbmQgdXNlciBpbnRlcmFjdGlvbnMgd2l0aCBhIHByb2plY3QgYW5kIGl0cyBtb2RlbC4gRm9yIGJ1aWxkaW5nIG11bHRpcGxheWVyIHNpbXVsYXRpb25zIHlvdSB0eXBpY2FsbHkgd2FudCBtdWx0aXBsZSBlbmQgdXNlcnMgdG8gc2hhcmUgdGhlIHNhbWUgc2V0IG9mIGludGVyYWN0aW9ucywgYW5kIHdvcmsgd2l0aGluIGEgY29tbW9uIHN0YXRlLiBFcGljZW50ZXIgYWxsb3dzIHlvdSB0byBjcmVhdGUgXCJ3b3JsZHNcIiB0byBoYW5kbGUgc3VjaCBjYXNlcy5cbipcbiogVGhlIFdvcmxkIE1hbmFnZXIgcHJvdmlkZXMgYW4gZWFzeSB3YXkgdG8gdHJhY2sgYW5kIGFjY2VzcyB0aGUgY3VycmVudCB3b3JsZCBhbmQgcnVuIGZvciBwYXJ0aWN1bGFyIGVuZCB1c2Vycy4gSXQgaXMgdHlwaWNhbGx5IHVzZWQgaW4gcGFnZXMgdGhhdCBlbmQgdXNlcnMgd2lsbCBpbnRlcmFjdCB3aXRoLiAoVGhlIHJlbGF0ZWQgW1dvcmxkIEFQSSBBZGFwdGVyXSguLi93b3JsZC1hcGktYWRhcHRlci8pIGhhbmRsZXMgY3JlYXRpbmcgbXVsdGlwbGF5ZXIgd29ybGRzLCBhbmQgYWRkaW5nIGFuZCByZW1vdmluZyBlbmQgdXNlcnMgYW5kIHJ1bnMgZnJvbSBhIHdvcmxkLiBCZWNhdXNlIG9mIHRoaXMsIHR5cGljYWxseSB0aGUgV29ybGQgQWRhcHRlciBpcyB1c2VkIGZvciBmYWNpbGl0YXRvciBwYWdlcyBpbiB5b3VyIHByb2plY3QuKVxuKlxuKiAjIyMgVXNpbmcgdGhlIFdvcmxkIE1hbmFnZXJcbipcbiogVG8gdXNlIHRoZSBXb3JsZCBNYW5hZ2VyLCBpbnN0YW50aWF0ZSBpdC4gVGhlbiwgbWFrZSBjYWxscyB0byBhbnkgb2YgdGhlIG1ldGhvZHMgeW91IG5lZWQuXG4qXG4qIFdoZW4geW91IGluc3RhbnRpYXRlIGEgV29ybGQgTWFuYWdlciwgdGhlIHdvcmxkJ3MgYWNjb3VudCBpZCwgcHJvamVjdCBpZCwgYW5kIGdyb3VwIGFyZSBhdXRvbWF0aWNhbGx5IHRha2VuIGZyb20gdGhlIHNlc3Npb24gKHRoYW5rcyB0byB0aGUgW0F1dGhlbnRpY2F0aW9uIFNlcnZpY2VdKC4uL2F1dGgtYXBpLXNlcnZpY2UpKS5cbipcbiogTm90ZSB0aGF0IHRoZSBXb3JsZCBNYW5hZ2VyIGRvZXMgKm5vdCogY3JlYXRlIHdvcmxkcyBhdXRvbWF0aWNhbGx5LiAoVGhpcyBpcyBkaWZmZXJlbnQgdGhhbiB0aGUgW1J1biBNYW5hZ2VyXSguLi9ydW4tbWFuYWdlcikuKSBIb3dldmVyLCB5b3UgY2FuIHBhc3MgaW4gc3BlY2lmaWMgb3B0aW9ucyB0byBhbnkgcnVucyBjcmVhdGVkIGJ5IHRoZSBtYW5hZ2VyLCB1c2luZyBhIGBydW5gIG9iamVjdC5cbipcbiogVGhlIHBhcmFtZXRlcnMgZm9yIGNyZWF0aW5nIGEgV29ybGQgTWFuYWdlciBhcmU6XG4qXG4qICAgKiBgYWNjb3VudGA6IFRoZSAqKlRlYW0gSUQqKiBpbiB0aGUgRXBpY2VudGVyIHVzZXIgaW50ZXJmYWNlIGZvciB0aGlzIHByb2plY3QuXG4qICAgKiBgcHJvamVjdGA6IFRoZSAqKlByb2plY3QgSUQqKiBmb3IgdGhpcyBwcm9qZWN0LlxuKiAgICogYGdyb3VwYDogVGhlICoqR3JvdXAgTmFtZSoqIGZvciB0aGlzIHdvcmxkLlxuKiAgICogYHJ1bmA6IE9wdGlvbnMgdG8gdXNlIHdoZW4gY3JlYXRpbmcgbmV3IHJ1bnMgd2l0aCB0aGUgbWFuYWdlciwgZS5nLiBgcnVuOiB7IGZpbGVzOiBbJ2RhdGEueGxzJ10gfWAuXG4qICAgKiBgcnVuLm1vZGVsYDogVGhlIG5hbWUgb2YgdGhlIHByaW1hcnkgbW9kZWwgZmlsZSBmb3IgdGhpcyBwcm9qZWN0LiBSZXF1aXJlZCBpZiB5b3UgaGF2ZSBub3QgYWxyZWFkeSBwYXNzZWQgaXQgaW4gYXMgcGFydCBvZiB0aGUgYG9wdGlvbnNgIHBhcmFtZXRlciBmb3IgYW4gZW5jbG9zaW5nIGNhbGwuXG4qXG4qIEZvciBleGFtcGxlOlxuKlxuKiAgICAgICB2YXIgd01nciA9IG5ldyBGLm1hbmFnZXIuV29ybGRNYW5hZ2VyKHtcbiogICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuKiAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuKiAgICAgICAgICBydW46IHsgbW9kZWw6ICdzdXBwbHktY2hhaW4ucHknIH0sXG4qICAgICAgICAgIGdyb3VwOiAndGVhbTEnXG4qICAgICAgIH0pO1xuKlxuKiAgICAgICB3TWdyLmdldEN1cnJlbnRSdW4oKTtcbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFdvcmxkQXBpID0gcmVxdWlyZSgnLi4vc2VydmljZS93b3JsZC1hcGktYWRhcHRlcicpO1xudmFyIFJ1bk1hbmFnZXIgPSAgcmVxdWlyZSgnLi9ydW4tbWFuYWdlcicpO1xudmFyIEF1dGhNYW5hZ2VyID0gcmVxdWlyZSgnLi9hdXRoLW1hbmFnZXInKTtcbnZhciB3b3JsZEFwaTtcblxuLy8gdmFyIGRlZmF1bHRzID0ge1xuLy8gIGFjY291bnQ6ICcnLFxuLy8gIHByb2plY3Q6ICcnLFxuLy8gIGdyb3VwOiAnJyxcbi8vICB0cmFuc3BvcnQ6IHtcbi8vICB9XG4vLyB9O1xuXG5cbmZ1bmN0aW9uIGJ1aWxkU3RyYXRlZ3kod29ybGRJZCwgZHRkKSB7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gQ3RvcihydW5TZXJ2aWNlLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMucnVuU2VydmljZSA9IHJ1blNlcnZpY2U7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICAgICAgJC5leHRlbmQodGhpcywge1xuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vdCBpbXBsZW1lbnRkLiBOZWVkIGFwaSBjaGFuZ2VzJyk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBnZXRSdW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgIC8vZ2V0IG9yIGNyZWF0ZSFcbiAgICAgICAgICAgICAgICAvLyBNb2RlbCBpcyByZXF1aXJlZCBpbiB0aGUgb3B0aW9uc1xuICAgICAgICAgICAgICAgIHZhciBtb2RlbCA9IHRoaXMub3B0aW9ucy5ydW4ubW9kZWwgfHwgdGhpcy5vcHRpb25zLm1vZGVsO1xuICAgICAgICAgICAgICAgIHJldHVybiB3b3JsZEFwaS5nZXRDdXJyZW50UnVuSWQoeyBtb2RlbDogbW9kZWwsIGZpbHRlcjogd29ybGRJZCB9KVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocnVuSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5ydW5TZXJ2aWNlLmxvYWQocnVuSWQpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZS5jYWxsKHRoaXMsIHJ1biwgX3RoaXMucnVuU2VydmljZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5mYWlsKGR0ZC5yZWplY3QpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9O1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHsgcnVuOiB7fSwgd29ybGQ6IHt9IH07XG5cbiAgICAkLmV4dGVuZCh0cnVlLCB0aGlzLm9wdGlvbnMsIHRoaXMub3B0aW9ucy5ydW4pO1xuICAgICQuZXh0ZW5kKHRydWUsIHRoaXMub3B0aW9ucywgdGhpcy5vcHRpb25zLndvcmxkKTtcblxuICAgIHdvcmxkQXBpID0gbmV3IFdvcmxkQXBpKHRoaXMub3B0aW9ucyk7XG4gICAgdGhpcy5fYXV0aCA9IG5ldyBBdXRoTWFuYWdlcigpO1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB2YXIgYXBpID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgd29ybGQgKG9iamVjdCkgYW5kIGFuIGluc3RhbmNlIG9mIHRoZSBbV29ybGQgQVBJIEFkYXB0ZXJdKC4uL3dvcmxkLWFwaS1hZGFwdGVyLykuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgd01nci5nZXRDdXJyZW50V29ybGQoKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbih3b3JsZCwgd29ybGRBZGFwdGVyKSB7XG4gICAgICAgICogICAgICAgICAgICAgICBjb25zb2xlLmxvZyh3b3JsZC5pZCk7XG4gICAgICAgICogICAgICAgICAgICAgICB3b3JsZEFkYXB0ZXIuZ2V0Q3VycmVudFJ1bklkKCk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYHVzZXJJZGAgKE9wdGlvbmFsKSBUaGUgaWQgb2YgdGhlIHVzZXIgd2hvc2Ugd29ybGQgaXMgYmVpbmcgYWNjZXNzZWQuIERlZmF1bHRzIHRvIHRoZSB1c2VyIGluIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGBncm91cE5hbWVgIChPcHRpb25hbCkgVGhlIG5hbWUgb2YgdGhlIGdyb3VwIHdob3NlIHdvcmxkIGlzIGJlaW5nIGFjY2Vzc2VkLiBEZWZhdWx0cyB0byB0aGUgZ3JvdXAgZm9yIHRoZSB1c2VyIGluIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAgICAgICovXG4gICAgICAgIGdldEN1cnJlbnRXb3JsZDogZnVuY3Rpb24gKHVzZXJJZCwgZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuX2F1dGguZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbygpO1xuICAgICAgICAgICAgaWYgKCF1c2VySWQpIHtcbiAgICAgICAgICAgICAgICB1c2VySWQgPSBzZXNzaW9uLnVzZXJJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICAgICAgZ3JvdXBOYW1lID0gc2Vzc2lvbi5ncm91cE5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gd29ybGRBcGkuZ2V0Q3VycmVudFdvcmxkRm9yVXNlcih1c2VySWQsIGdyb3VwTmFtZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogUmV0dXJucyB0aGUgY3VycmVudCBydW4gKG9iamVjdCkgYW5kIGFuIGluc3RhbmNlIG9mIHRoZSBbUnVuIEFQSSBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKS5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICB3TWdyLmdldEN1cnJlbnRSdW4oe21vZGVsOiAnbXlNb2RlbC5weSd9KVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbihydW4sIHJ1blNlcnZpY2UpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJ1bi5pZCk7XG4gICAgICAgICogICAgICAgICAgICAgICBydW5TZXJ2aWNlLmRvKCdzdGFydEdhbWUnKTtcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgbW9kZWxgIChPcHRpb25hbCkgVGhlIG5hbWUgb2YgdGhlIG1vZGVsIGZpbGUuIFJlcXVpcmVkIGlmIG5vdCBhbHJlYWR5IHBhc3NlZCBpbiBhcyBgcnVuLm1vZGVsYCB3aGVuIHRoZSBXb3JsZCBNYW5hZ2VyIGlzIGNyZWF0ZWQuXG4gICAgICAgICovXG4gICAgICAgIGdldEN1cnJlbnRSdW46IGZ1bmN0aW9uIChtb2RlbCkge1xuICAgICAgICAgICAgdmFyIGR0ZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5fYXV0aC5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICAgICAgICB2YXIgY3VyVXNlcklkID0gc2Vzc2lvbi51c2VySWQ7XG4gICAgICAgICAgICB2YXIgY3VyR3JvdXBOYW1lID0gc2Vzc2lvbi5ncm91cE5hbWU7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldEFuZFJlc3RvcmVMYXRlc3RSdW4od29ybGQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXdvcmxkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkdGQucmVqZWN0KHsgZXJyb3I6ICdUaGUgdXNlciBpcyBub3QgcGFydCBvZiBhbnkgd29ybGQhJyB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudFdvcmxkSWQgPSB3b3JsZC5pZDtcbiAgICAgICAgICAgICAgICB2YXIgcnVuT3B0cyA9ICQuZXh0ZW5kKHRydWUsIF90aGlzLm9wdGlvbnMsIHsgbW9kZWw6IG1vZGVsIH0pO1xuICAgICAgICAgICAgICAgIHZhciBzdHJhdGVneSA9IGJ1aWxkU3RyYXRlZ3koY3VycmVudFdvcmxkSWQsIGR0ZCk7XG4gICAgICAgICAgICAgICAgdmFyIG9wdCA9ICQuZXh0ZW5kKHRydWUsIHt9LCB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmF0ZWd5OiBzdHJhdGVneSxcbiAgICAgICAgICAgICAgICAgICAgcnVuOiBydW5PcHRzXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdmFyIHJtID0gbmV3IFJ1bk1hbmFnZXIob3B0KTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBybS5nZXRSdW4oKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZShydW4sIHJtLnJ1blNlcnZpY2UsIHJtKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0Q3VycmVudFdvcmxkKGN1clVzZXJJZCwgY3VyR3JvdXBOYW1lKVxuICAgICAgICAgICAgICAgIC50aGVuKGdldEFuZFJlc3RvcmVMYXRlc3RSdW4pO1xuXG4gICAgICAgICAgICByZXR1cm4gZHRkLnByb21pc2UoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBhcGkpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIFN0b3JhZ2VGYWN0b3J5ID0gcmVxdWlyZSgnLi4vc3RvcmUvc3RvcmUtZmFjdG9yeScpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAvLyBjb25maWcgfHwgKGNvbmZpZyA9IGNvbmZpZ1NlcnZpY2UuZ2V0KCkpO1xuICAgIHZhciBzdG9yZSA9IG5ldyBTdG9yYWdlRmFjdG9yeSh7IHN5bmNocm9ub3VzOiB0cnVlIH0pO1xuXG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRm9yIHByb2plY3RzIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZykuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdG9rZW46IHN0b3JlLmdldCgnZXBpY2VudGVyLnByb2plY3QudG9rZW4nKSB8fCAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGFjY291bnQgaWQuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcHJvamVjdCBpZC4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcHJvamVjdDogJycsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucyB0byBwYXNzIG9uIHRvIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBsYXllci4gQWxsIGpxdWVyeS5hamF4IG9wdGlvbnMgYXQgaHR0cDovL2FwaS5qcXVlcnkuY29tL2pRdWVyeS5hamF4LyBhcmUgYXZhaWxhYmxlLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IHt9XG4gICAgfTtcblxuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLmFjY291bnQpIHtcbiAgICAgICAgdXJsQ29uZmlnLmFjY291bnRQYXRoID0gc2VydmljZU9wdGlvbnMuYWNjb3VudDtcbiAgICB9XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnByb2plY3QpIHtcbiAgICAgICAgdXJsQ29uZmlnLnByb2plY3RQYXRoID0gc2VydmljZU9wdGlvbnMucHJvamVjdDtcbiAgICB9XG5cbiAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoJ2ZpbGUnKVxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIGh0dHBPcHRpb25zLmhlYWRlcnMgPSB7XG4gICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkoaHR0cE9wdGlvbnMpO1xuXG5cbiAgICB2YXIgcHVibGljQXN5bmNBUEkgPSB7XG4gICAgICAgIGdldEZpbGVDb250ZW50czogZnVuY3Rpb24gKGZpbGVOYW1lLCBmb2xkZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBwYXRoID0gZm9sZGVyICsgJy8nICsgZmlsZU5hbWU7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKCdmaWxlJykgKyBwYXRoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldCgnJywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FzeW5jQVBJKTtcbn07XG4iLCIvKipcbiAqICMjQXNzZXQgQVBJIEFkYXB0ZXJcbiAqXG4gKiBUaGUgQXNzZXQgQVBJIEFkYXB0ZXIgYWxsb3dzIHlvdSB0byBzdG9yZSBhc3NldHMgLS0gcmVzb3VyY2VzIG9yIGZpbGVzIG9mIGFueSBraW5kIC0tIHVzZWQgYnkgYSBwcm9qZWN0IHdpdGggYSBzY29wZSB0aGF0IGlzIHNwZWNpZmljIHRvIHByb2plY3QsIGdyb3VwLCBvciBlbmQgdXNlci5cbiAqXG4gKiBBc3NldHMgYXJlIHVzZWQgd2l0aCBbdGVhbSBwcm9qZWN0c10oLi4vLi4vLi4vcHJvamVjdF9hZG1pbi8jdGVhbSkuIE9uZSBjb21tb24gdXNlIGNhc2UgaXMgaGF2aW5nIGVuZCB1c2VycyBpbiBhIFtncm91cF0oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3Vwcykgb3IgaW4gYSBbbXVsdGlwbGF5ZXIgd29ybGRdKC4uLy4uLy4uL2dsb3NzYXJ5LyN3b3JsZCkgdXBsb2FkIGRhdGEgLS0gdmlkZW9zIGNyZWF0ZWQgZHVyaW5nIGdhbWUgcGxheSwgcHJvZmlsZSBwaWN0dXJlcyBmb3IgY3VzdG9taXppbmcgdGhlaXIgZXhwZXJpZW5jZSwgZXRjLiAtLSBhcyBwYXJ0IG9mIHBsYXlpbmcgdGhyb3VnaCB0aGUgcHJvamVjdC5cbiAqXG4gKiBSZXNvdXJjZXMgY3JlYXRlZCB1c2luZyB0aGUgQXNzZXQgQWRhcHRlciBhcmUgc2NvcGVkOlxuICpcbiAqICAqIFByb2plY3QgYXNzZXRzIGFyZSB3cml0YWJsZSBvbmx5IGJ5IFt0ZWFtIG1lbWJlcnNdKC4uLy4uLy4uL2dsb3NzYXJ5LyN0ZWFtKSwgdGhhdCBpcywgRXBpY2VudGVyIGF1dGhvcnMuXG4gKiAgKiBHcm91cCBhc3NldHMgYXJlIHdyaXRhYmxlIGJ5IGFueW9uZSB3aXRoIGFjY2VzcyB0byB0aGUgcHJvamVjdCB0aGF0IGlzIHBhcnQgb2YgdGhhdCBwYXJ0aWN1bGFyIFtncm91cF0oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3VwcykuIFRoaXMgaW5jbHVkZXMgYWxsIFt0ZWFtIG1lbWJlcnNdKC4uLy4uLy4uL2dsb3NzYXJ5LyN0ZWFtKSAoRXBpY2VudGVyIGF1dGhvcnMpIGFuZCBhbnkgW2VuZCB1c2Vyc10oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKSB3aG8gYXJlIG1lbWJlcnMgb2YgdGhlIGdyb3VwIC0tIGJvdGggZmFjaWxpdGF0b3JzIGFuZCBzdGFuZGFyZCBlbmQgdXNlcnMuXG4gKiAgKiBVc2VyIGFzc2V0cyBhcmUgd3JpdGFibGUgYnkgdGhlIHNwZWNpZmljIGVuZCB1c2VyLCBhbmQgYnkgdGhlIGZhY2lsaXRhdG9yIG9mIHRoZSBncm91cC5cbiAqICAqIEFsbCBhc3NldHMgYXJlIHJlYWRhYmxlIGJ5IGFueW9uZSB3aXRoIHRoZSBleGFjdCBVUkkuXG4gKlxuICogVG8gdXNlIHRoZSBBc3NldCBBZGFwdGVyLCBpbnN0YW50aWF0ZSBpdCBhbmQgdGhlbiBhY2Nlc3MgdGhlIG1ldGhvZHMgcHJvdmlkZWQuIEluc3RhbnRpYXRpbmcgcmVxdWlyZXMgdGhlIGFjY291bnQgaWQgKCoqVGVhbSBJRCoqIGluIHRoZSBFcGljZW50ZXIgdXNlciBpbnRlcmZhY2UpIGFuZCBwcm9qZWN0IGlkICgqKlByb2plY3QgSUQqKikuIFRoZSBncm91cCBuYW1lIGlzIHJlcXVpcmVkIGZvciBhc3NldHMgd2l0aCBhIGdyb3VwIHNjb3BlLCBhbmQgdGhlIGdyb3VwIG5hbWUgYW5kIHVzZXJJZCBhcmUgcmVxdWlyZWQgZm9yIGFzc2V0cyB3aXRoIGEgdXNlciBzY29wZS4gSWYgbm90IGluY2x1ZGVkLCB0aGV5IGFyZSB0YWtlbiBmcm9tIHRoZSBsb2dnZWQgaW4gdXNlcidzIHNlc3Npb24gaW5mb3JtYXRpb24gaWYgbmVlZGVkLlxuICpcbiAqICAgICAgIHZhciBhYSA9IG5ldyBGLnNlcnZpY2UuQXNzZXQoe1xuICogICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICogICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAqICAgICAgICAgIGdyb3VwOiAndGVhbTEnLFxuICogICAgICAgICAgdXNlcklkOiAnJ1xuICogICAgICAgfSk7XG4gKiAgICAgICBhYS5jcmVhdGUoJ3Rlc3QudHh0Jywge1xuICAgICAgICAgICAgZW5jb2Rpbmc6ICdCQVNFXzY0JyxcbiAgICAgICAgICAgIGRhdGE6ICdWR2hwY3lCcGN5QmhJSFJsYzNRZ1ptbHNaUzQ9JyxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiAndGV4dC9wbGFpbidcbiAqICAgICAgIH0sIHsgc2NvcGU6ICd1c2VyJyB9KTtcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBTdG9yYWdlRmFjdG9yeSA9IHJlcXVpcmUoJy4uL3N0b3JlL3N0b3JlLWZhY3RvcnknKTtcbi8vIHZhciBxdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvcXVlcnktdXRpbCcpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xudmFyIF9waWNrID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QtdXRpbCcpLl9waWNrO1xudmFyIGtleU5hbWVzID0gcmVxdWlyZSgnLi4vbWFuYWdlcnMva2V5LW5hbWVzJyk7XG5cbnZhciBhcGlFbmRwb2ludCA9ICdhc3NldCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIHZhciBzdG9yZSA9IG5ldyBTdG9yYWdlRmFjdG9yeSh7IHN5bmNocm9ub3VzOiB0cnVlIH0pO1xuICAgIHZhciBzZXNzaW9uID0gSlNPTi5wYXJzZShzdG9yZS5nZXQoa2V5TmFtZXMuRVBJX1NFU1NJT05fS0VZKSB8fCAne30nKTtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGb3IgcHJvamVjdHMgdGhhdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uLCBwYXNzIGluIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiAoZGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nKS4gSWYgdGhlIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW4gdG8gRXBpY2VudGVyLCB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gaXMgYWxyZWFkeSBzZXQgaW4gYSBjb29raWUgYW5kIGF1dG9tYXRpY2FsbHkgbG9hZGVkIGZyb20gdGhlcmUuIChTZWUgW21vcmUgYmFja2dyb3VuZCBvbiBhY2Nlc3MgdG9rZW5zXSguLi8uLi8uLi9wcm9qZWN0X2FjY2Vzcy8pKS5cbiAgICAgICAgICogQHNlZSBbQXV0aGVudGljYXRpb24gQVBJIFNlcnZpY2VdKC4uL2F1dGgtYXBpLXNlcnZpY2UvKSBmb3IgZ2V0dGluZyB0b2tlbnMuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0b2tlbjogc3RvcmUuZ2V0KGtleU5hbWVzLkVQSV9DT09LSUVfS0VZKSB8fCAnJyxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY2NvdW50IGlkLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgVVJMLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgYWNjb3VudDogdW5kZWZpbmVkLFxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHByb2plY3QgaWQuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBwcm9qZWN0OiB1bmRlZmluZWQsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgZ3JvdXAgbmFtZS4gRGVmYXVsdHMgdG8gc2Vzc2lvbidzIGBncm91cE5hbWVgLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZ3JvdXA6IHNlc3Npb24uZ3JvdXBOYW1lLFxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHVzZXIgaWQuIERlZmF1bHRzIHRvIHNlc3Npb24ncyBgdXNlcklkYC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHVzZXJJZDogc2Vzc2lvbi51c2VySWQsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgc2NvcGUgZm9yIHRoZSBhc3NldC4gVmFsaWQgdmFsdWVzIGFyZTogYHVzZXJgLCBgZ3JvdXBgLCBhbmQgYHByb2plY3RgLiBTZWUgYWJvdmUgZm9yIHRoZSByZXF1aXJlZCBwZXJtaXNzaW9ucyB0byB3cml0ZSB0byBlYWNoIHNjb3BlLiBEZWZhdWx0cyB0byBgdXNlcmAsIG1lYW5pbmcgdGhlIGN1cnJlbnQgZW5kIHVzZXIgb3IgYSBmYWNpbGl0YXRvciBpbiB0aGUgZW5kIHVzZXIncyBncm91cCBjYW4gZWRpdCB0aGUgYXNzZXQuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBzY29wZTogJ3VzZXInLFxuICAgICAgICAvKipcbiAgICAgICAgICogRGV0ZXJtaW5lcyBpZiBhIHJlcXVlc3QgdG8gbGlzdCB0aGUgYXNzZXRzIGluIGEgc2NvcGUgaW5jbHVkZXMgdGhlIGNvbXBsZXRlIFVSTCBmb3IgZWFjaCBhc3NldCAoYHRydWVgKSwgb3Igb25seSB0aGUgZmlsZSBuYW1lcyBvZiB0aGUgYXNzZXRzIChgZmFsc2VgKS4gRGVmYXVsdHMgdG8gYHRydWVgLlxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bGxVcmw6IHRydWUsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgdHJhbnNwb3J0IG9iamVjdCBjb250YWlucyB0aGUgb3B0aW9ucyBwYXNzZWQgdG8gdGhlIFhIUiByZXF1ZXN0LlxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7XG4gICAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2VcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBjb25maWcpO1xuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcblxuICAgIGlmICghc2VydmljZU9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICBzZXJ2aWNlT3B0aW9ucy5hY2NvdW50ID0gdXJsQ29uZmlnLmFjY291bnRQYXRoO1xuICAgIH1cblxuICAgIGlmICghc2VydmljZU9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICBzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0ID0gdXJsQ29uZmlnLnByb2plY3RQYXRoO1xuICAgIH1cblxuICAgIHZhciB0cmFuc3BvcnRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KVxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIHRyYW5zcG9ydE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KHRyYW5zcG9ydE9wdGlvbnMpO1xuXG4gICAgdmFyIGFzc2V0QXBpUGFyYW1zID0gWydlbmNvZGluZycsICdkYXRhJywgJ2NvbnRlbnRUeXBlJ107XG4gICAgdmFyIHNjb3BlQ29uZmlnID0ge1xuICAgICAgICB1c2VyOiBbJ3Njb3BlJywgJ2FjY291bnQnLCAncHJvamVjdCcsICdncm91cCcsICd1c2VySWQnXSxcbiAgICAgICAgZ3JvdXA6IFsnc2NvcGUnLCAnYWNjb3VudCcsICdwcm9qZWN0JywgJ2dyb3VwJ10sXG4gICAgICAgIHByb2plY3Q6IFsnc2NvcGUnLCAnYWNjb3VudCcsICdwcm9qZWN0J10sXG4gICAgfTtcblxuICAgIHZhciB2YWxpZGF0ZUZpbGVuYW1lID0gZnVuY3Rpb24gKGZpbGVuYW1lKSB7XG4gICAgICAgIGlmICghZmlsZW5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignZmlsZW5hbWUgaXMgbmVlZGVkLicpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciB2YWxpZGF0ZVVybFBhcmFtcyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciBwYXJ0S2V5cyA9IHNjb3BlQ29uZmlnW29wdGlvbnMuc2NvcGVdO1xuICAgICAgICBpZiAoIXBhcnRLZXlzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Njb3BlIHBhcmFtZXRlciBpcyBuZWVkZWQuJyk7XG4gICAgICAgIH1cblxuICAgICAgICAkLmVhY2gocGFydEtleXMsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghb3B0aW9uc1t0aGlzXSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcih0aGlzICsgJyBwYXJhbWV0ZXIgaXMgbmVlZGVkLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgdmFyIGJ1aWxkVXJsID0gZnVuY3Rpb24gKGZpbGVuYW1lLCBvcHRpb25zKSB7XG4gICAgICAgIHZhbGlkYXRlVXJsUGFyYW1zKG9wdGlvbnMpO1xuICAgICAgICB2YXIgcGFydEtleXMgPSBzY29wZUNvbmZpZ1tvcHRpb25zLnNjb3BlXTtcbiAgICAgICAgdmFyIHBhcnRzID0gJC5tYXAocGFydEtleXMsIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zW2tleV07XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoZmlsZW5hbWUpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgcHJldmVudHMgYWRkaW5nIGEgdHJhaWxpbmcgLyBpbiB0aGUgVVJMIGFzIHRoZSBBc3NldCBBUElcbiAgICAgICAgICAgIC8vIGRvZXMgbm90IHdvcmsgY29ycmVjdGx5IHdpdGggaXRcbiAgICAgICAgICAgIGZpbGVuYW1lID0gJy8nICsgZmlsZW5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHBhcnRzLmpvaW4oJy8nKSArIGZpbGVuYW1lO1xuICAgIH07XG5cbiAgICAvLyBQcml2YXRlIGZ1bmN0aW9uLCBhbGwgcmVxdWVzdHMgZm9sbG93IGEgbW9yZSBvciBsZXNzIHNhbWUgYXBwcm9hY2ggdG9cbiAgICAvLyB1c2UgdGhlIEFzc2V0IEFQSSBhbmQgdGhlIGRpZmZlcmVuY2UgaXMgdGhlIEhUVFAgdmVyYlxuICAgIC8vXG4gICAgLy8gQHBhcmFtIHtzdHJpbmd9IGBtZXRob2RgIChSZXF1aXJlZCkgSFRUUCB2ZXJiXG4gICAgLy8gQHBhcmFtIHtzdHJpbmd9IGBmaWxlbmFtZWAgKFJlcXVpcmVkKSBOYW1lIG9mIHRoZSBmaWxlIHRvIGRlbGV0ZS9yZXBsYWNlL2NyZWF0ZVxuICAgIC8vIEBwYXJhbSB7b2JqZWN0fSBgcGFyYW1zYCAoT3B0aW9uYWwpIEJvZHkgcGFyYW1ldGVycyB0byBzZW5kIHRvIHRoZSBBc3NldCBBUElcbiAgICAvLyBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgdmFyIHVwbG9hZCA9IGZ1bmN0aW9uIChtZXRob2QsIGZpbGVuYW1lLCBwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFsaWRhdGVGaWxlbmFtZShmaWxlbmFtZSk7XG4gICAgICAgIC8vIG1ha2Ugc3VyZSB0aGUgcGFyYW1ldGVyIGlzIGNsZWFuXG4gICAgICAgIG1ldGhvZCA9IG1ldGhvZC50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB2YXIgY29udGVudFR5cGUgPSBwYXJhbXMgaW5zdGFuY2VvZiBGb3JtRGF0YSA9PT0gdHJ1ZSA/IGZhbHNlIDogJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgICBpZiAoY29udGVudFR5cGUgPT09ICdhcHBsaWNhdGlvbi9qc29uJykge1xuICAgICAgICAgICAgLy8gd2hpdGVsaXN0IHRoZSBmaWVsZHMgdGhhdCB3ZSBhY3R1YWxseSBjYW4gc2VuZCB0byB0aGUgYXBpXG4gICAgICAgICAgICBwYXJhbXMgPSBfcGljayhwYXJhbXMsIGFzc2V0QXBpUGFyYW1zKTtcbiAgICAgICAgfSBlbHNlIHsgLy8gZWxzZSB3ZSdyZSBzZW5kaW5nIGZvcm0gZGF0YSB3aGljaCBnb2VzIGRpcmVjdGx5IGluIHJlcXVlc3QgYm9keVxuICAgICAgICAgICAgLy8gRm9yIG11bHRpcGFydC9mb3JtLWRhdGEgdXBsb2FkcyB0aGUgZmlsZW5hbWUgaXMgbm90IHNldCBpbiB0aGUgVVJMLFxuICAgICAgICAgICAgLy8gaXQncyBnZXR0aW5nIHBpY2tlZCBieSB0aGUgRm9ybURhdGEgZmllbGQgZmlsZW5hbWUuXG4gICAgICAgICAgICBmaWxlbmFtZSA9IG1ldGhvZCA9PT0gJ3Bvc3QnIHx8IG1ldGhvZCA9PT0gJ3B1dCcgPyAnJyA6IGZpbGVuYW1lO1xuICAgICAgICB9XG4gICAgICAgIHZhciB1cmxPcHRpb25zID0gJC5leHRlbmQoe30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgdmFyIHVybCA9IGJ1aWxkVXJsKGZpbGVuYW1lLCB1cmxPcHRpb25zKTtcbiAgICAgICAgdmFyIGNyZWF0ZU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdXJsT3B0aW9ucywgeyB1cmw6IHVybCwgY29udGVudFR5cGU6IGNvbnRlbnRUeXBlIH0pO1xuXG4gICAgICAgIHJldHVybiBodHRwW21ldGhvZF0ocGFyYW1zLCBjcmVhdGVPcHRpb25zKTtcbiAgICB9O1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICogQ3JlYXRlcyBhIGZpbGUgaW4gdGhlIEFzc2V0IEFQSS4gVGhlIHNlcnZlciByZXR1cm5zIGFuIGVycm9yIChzdGF0dXMgY29kZSBgNDA5YCwgY29uZmxpY3QpIGlmIHRoZSBmaWxlIGFscmVhZHkgZXhpc3RzLCBzb1xuICAgICAgICAqIGNoZWNrIGZpcnN0IHdpdGggYSBgbGlzdCgpYCBvciBhIGBnZXQoKWAuXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIHZhciBhYSA9IG5ldyBGLnNlcnZpY2UuQXNzZXQoe1xuICAgICAgICAqICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgIGdyb3VwOiAndGVhbTEnLFxuICAgICAgICAqICAgICAgICAgIHVzZXJJZDogJydcbiAgICAgICAgKiAgICAgICB9KTtcbiAgICAgICAgKiAgICAgICBhYS5jcmVhdGUoJ3Rlc3QudHh0Jywge1xuICAgICAgICAqICAgICAgICAgICBlbmNvZGluZzogJ0JBU0VfNjQnLFxuICAgICAgICAqICAgICAgICAgICBkYXRhOiAnVkdocGN5QnBjeUJoSUhSbGMzUWdabWxzWlM0PScsXG4gICAgICAgICogICAgICAgICAgIGNvbnRlbnRUeXBlOiAndGV4dC9wbGFpbidcbiAgICAgICAgKiAgICAgICB9LCB7IHNjb3BlOiAndXNlcicgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYGZpbGVuYW1lYCAoUmVxdWlyZWQpIE5hbWUgb2YgdGhlIGZpbGUgdG8gY3JlYXRlLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgcGFyYW1zYCAoT3B0aW9uYWwpIEJvZHkgcGFyYW1ldGVycyB0byBzZW5kIHRvIHRoZSBBc3NldCBBUEkuIFJlcXVpcmVkIGlmIHRoZSBgb3B0aW9ucy50cmFuc3BvcnQuY29udGVudFR5cGVgIGlzIGBhcHBsaWNhdGlvbi9qc29uYCwgb3RoZXJ3aXNlIGlnbm9yZWQuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGBwYXJhbXMuZW5jb2RpbmdgIEVpdGhlciBgSEVYYCBvciBgQkFTRV82NGAuIFJlcXVpcmVkIGlmIGBvcHRpb25zLnRyYW5zcG9ydC5jb250ZW50VHlwZWAgaXMgYGFwcGxpY2F0aW9uL2pzb25gLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgcGFyYW1zLmRhdGFgIFRoZSBlbmNvZGVkIGRhdGEgZm9yIHRoZSBmaWxlLiBSZXF1aXJlZCBpZiBgb3B0aW9ucy50cmFuc3BvcnQuY29udGVudFR5cGVgIGlzIGBhcHBsaWNhdGlvbi9qc29uYC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYHBhcmFtcy5jb250ZW50VHlwZWAgVGhlIG1pbWUgdHlwZSBvZiB0aGUgZmlsZS4gT3B0aW9uYWwuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqXG4gICAgICAgICovXG4gICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gKGZpbGVuYW1lLCBwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiB1cGxvYWQoJ3Bvc3QnLCBmaWxlbmFtZSwgcGFyYW1zLCBvcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBHZXRzIGEgZmlsZSBmcm9tIHRoZSBBc3NldCBBUEksIGZldGNoaW5nIHRoZSBhc3NldCBjb250ZW50LiAoVG8gZ2V0IGEgbGlzdFxuICAgICAgICAqIG9mIHRoZSBhc3NldHMgaW4gYSBzY29wZSwgdXNlIGBsaXN0KClgLilcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgZmlsZW5hbWVgIChSZXF1aXJlZCkgTmFtZSBvZiB0aGUgZmlsZSB0byByZXRyaWV2ZS5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICpcbiAgICAgICAgKi9cbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoZmlsZW5hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBnZXRTZXJ2aWNlT3B0aW9ucyA9IF9waWNrKHNlcnZpY2VPcHRpb25zLCBbJ3Njb3BlJywgJ2FjY291bnQnLCAncHJvamVjdCcsICdncm91cCcsICd1c2VySWQnXSk7XG4gICAgICAgICAgICB2YXIgdXJsT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBnZXRTZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgdXJsID0gYnVpbGRVcmwoZmlsZW5hbWUsIHVybE9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIGdldE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdXJsT3B0aW9ucywgeyB1cmw6IHVybCB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KHt9LCBnZXRPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBHZXRzIHRoZSBsaXN0IG9mIHRoZSBhc3NldHMgaW4gYSBzY29wZS5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICBhYS5saXN0KHsgZnVsbFVybDogdHJ1ZSB9KS50aGVuKGZ1bmN0aW9uKGZpbGVMaXN0KXtcbiAgICAgICAgKiAgICAgICAgICAgY29uc29sZS5sb2coJ2FycmF5IG9mIGZpbGVzID0gJywgZmlsZUxpc3QpO1xuICAgICAgICAqICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgb3B0aW9ucy5zY29wZWAgKE9wdGlvbmFsKSBUaGUgc2NvcGUgKGB1c2VyYCwgYGdyb3VwYCwgYHByb2plY3RgKS5cbiAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGBvcHRpb25zLmZ1bGxVcmxgIChPcHRpb25hbCkgRGV0ZXJtaW5lcyBpZiB0aGUgbGlzdCBvZiBhc3NldHMgaW4gYSBzY29wZSBpbmNsdWRlcyB0aGUgY29tcGxldGUgVVJMIGZvciBlYWNoIGFzc2V0IChgdHJ1ZWApLCBvciBvbmx5IHRoZSBmaWxlIG5hbWVzIG9mIHRoZSBhc3NldHMgKGBmYWxzZWApLlxuICAgICAgICAqXG4gICAgICAgICovXG4gICAgICAgIGxpc3Q6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgZHRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgICAgIHZhciB1cmxPcHRpb25zID0gJC5leHRlbmQoe30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHZhciB1cmwgPSBidWlsZFVybCgnJywgdXJsT3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgZ2V0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCB1cmxPcHRpb25zLCB7IHVybDogdXJsIH0pO1xuICAgICAgICAgICAgdmFyIGZ1bGxVcmwgPSBnZXRPcHRpb25zLmZ1bGxVcmw7XG5cbiAgICAgICAgICAgIGlmICghZnVsbFVybCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBodHRwLmdldCh7fSwgZ2V0T3B0aW9ucyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGh0dHAuZ2V0KHt9LCBnZXRPcHRpb25zKVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChmaWxlcykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZnVsbFBhdGhGaWxlcyA9ICQubWFwKGZpbGVzLCBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJ1aWxkVXJsKGZpbGUsIHVybE9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgZHRkLnJlc29sdmUoZnVsbFBhdGhGaWxlcywgbWUpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZhaWwoZHRkLnJlamVjdCk7XG5cbiAgICAgICAgICAgIHJldHVybiBkdGQucHJvbWlzZSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFJlcGxhY2VzIGFuIGV4aXN0aW5nIGZpbGUgaW4gdGhlIEFzc2V0IEFQSS5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICBhYS5yZXBsYWNlKCd0ZXN0LnR4dCcsIHtcbiAgICAgICAgKiAgICAgICAgICAgZW5jb2Rpbmc6ICdCQVNFXzY0JyxcbiAgICAgICAgKiAgICAgICAgICAgZGF0YTogJ1ZHaHBjeUJwY3lCaElITmxZMjl1WkNCMFpYTjBJR1pwYkdVdScsXG4gICAgICAgICogICAgICAgICAgIGNvbnRlbnRUeXBlOiAndGV4dC9wbGFpbidcbiAgICAgICAgKiAgICAgICB9LCB7IHNjb3BlOiAndXNlcicgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYGZpbGVuYW1lYCAoUmVxdWlyZWQpIE5hbWUgb2YgdGhlIGZpbGUgYmVpbmcgcmVwbGFjZWQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBwYXJhbXNgIChPcHRpb25hbCkgQm9keSBwYXJhbWV0ZXJzIHRvIHNlbmQgdG8gdGhlIEFzc2V0IEFQSS4gUmVxdWlyZWQgaWYgdGhlIGBvcHRpb25zLnRyYW5zcG9ydC5jb250ZW50VHlwZWAgaXMgYGFwcGxpY2F0aW9uL2pzb25gLCBvdGhlcndpc2UgaWdub3JlZC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYHBhcmFtcy5lbmNvZGluZ2AgRWl0aGVyIGBIRVhgIG9yIGBCQVNFXzY0YC4gUmVxdWlyZWQgaWYgYG9wdGlvbnMudHJhbnNwb3J0LmNvbnRlbnRUeXBlYCBpcyBgYXBwbGljYXRpb24vanNvbmAuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGBwYXJhbXMuZGF0YWAgVGhlIGVuY29kZWQgZGF0YSBmb3IgdGhlIGZpbGUuIFJlcXVpcmVkIGlmIGBvcHRpb25zLnRyYW5zcG9ydC5jb250ZW50VHlwZWAgaXMgYGFwcGxpY2F0aW9uL2pzb25gLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgcGFyYW1zLmNvbnRlbnRUeXBlYCBUaGUgbWltZSB0eXBlIG9mIHRoZSBmaWxlLiBPcHRpb25hbC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICpcbiAgICAgICAgKi9cbiAgICAgICAgcmVwbGFjZTogZnVuY3Rpb24gKGZpbGVuYW1lLCBwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiB1cGxvYWQoJ3B1dCcsIGZpbGVuYW1lLCBwYXJhbXMsIG9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIERlbGV0ZXMgYSBmaWxlIGZyb20gdGhlIEFzc2V0IEFQSS5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICBhYS5kZWxldGUoc2FtcGxlRmlsZU5hbWUpO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGBmaWxlbmFtZWAgKFJlcXVpcmVkKSBOYW1lIG9mIHRoZSBmaWxlIHRvIGRlbGV0ZS5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICpcbiAgICAgICAgKi9cbiAgICAgICAgZGVsZXRlOiBmdW5jdGlvbiAoZmlsZW5hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiB1cGxvYWQoJ2RlbGV0ZScsIGZpbGVuYW1lLCB7fSwgb3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXNzZXRVcmw6IGZ1bmN0aW9uIChmaWxlbmFtZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHVybE9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIGJ1aWxkVXJsKGZpbGVuYW1lLCB1cmxPcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG4iLCIvKipcbiAqXG4gKiAjI0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXG4gKlxuICogVGhlIEF1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlIHByb3ZpZGVzIG1ldGhvZHMgZm9yIGxvZ2dpbmcgaW4gYW5kIGxvZ2dpbmcgb3V0LiBPbiBsb2dpbiwgdGhpcyBzZXJ2aWNlIGNyZWF0ZXMgYW5kIHJldHVybnMgYSB1c2VyIGFjY2VzcyB0b2tlbi5cbiAqXG4gKiBVc2VyIGFjY2VzcyB0b2tlbnMgYXJlIHJlcXVpcmVkIGZvciBlYWNoIGNhbGwgdG8gRXBpY2VudGVyLiAoU2VlIFtQcm9qZWN0IEFjY2Vzc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSBmb3IgbW9yZSBpbmZvcm1hdGlvbi4pXG4gKlxuICogSWYgeW91IG5lZWQgYWRkaXRpb25hbCBmdW5jdGlvbmFsaXR5IC0tIHN1Y2ggYXMgdHJhY2tpbmcgc2Vzc2lvbiBpbmZvcm1hdGlvbiwgZWFzaWx5IHJldHJpZXZpbmcgdGhlIHVzZXIgdG9rZW4sIG9yIGdldHRpbmcgdGhlIGdyb3VwcyB0byB3aGljaCBhbiBlbmQgdXNlciBiZWxvbmdzIC0tIGNvbnNpZGVyIHVzaW5nIHRoZSBbQXV0aG9yaXphdGlvbiBNYW5hZ2VyXSguLi9hdXRoLW1hbmFnZXIvKSBpbnN0ZWFkLlxuICpcbiAqICAgICAgdmFyIGF1dGggPSBuZXcgRi5zZXJ2aWNlLkF1dGgoKTtcbiAqICAgICAgYXV0aC5sb2dpbih7IHVzZXJOYW1lOiAnanNtaXRoQGFjbWVzaW11bGF0aW9ucy5jb20nLFxuICogICAgICAgICAgICAgICAgICBwYXNzd29yZDogJ3Bhc3N3MHJkJyB9KTtcbiAqICAgICAgYXV0aC5sb2dvdXQoKTtcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRW1haWwgb3IgdXNlcm5hbWUgdG8gdXNlIGZvciBsb2dnaW5nIGluLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB1c2VyTmFtZTogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBhc3N3b3JkIGZvciBzcGVjaWZpZWQgYHVzZXJOYW1lYC4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcGFzc3dvcmQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWNjb3VudCBpZCBmb3IgdGhpcyBgdXNlck5hbWVgLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpIG9yIHRoZSAqKlVzZXIgSUQqKiAoZm9yIHBlcnNvbmFsIHByb2plY3RzKS4gUmVxdWlyZWQgaWYgdGhlIGB1c2VyTmFtZWAgaXMgZm9yIGFuIFtlbmQgdXNlcl0oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKS4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgYWNjb3VudDogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXIuIEFsbCBqcXVlcnkuYWpheCBvcHRpb25zIGF0IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuYWpheC8gYXJlIGF2YWlsYWJsZS4gRGVmYXVsdHMgdG8gZW1wdHkgb2JqZWN0LlxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7fVxuICAgIH07XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCBjb25maWcpO1xuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcblxuICAgIHZhciB0cmFuc3BvcnRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKCdhdXRoZW50aWNhdGlvbicpXG4gICAgfSk7XG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zKTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExvZ3MgdXNlciBpbiwgcmV0dXJuaW5nIHRoZSB1c2VyIGFjY2VzcyB0b2tlbi5cbiAgICAgICAgICpcbiAgICAgICAgICogSWYgbm8gYHVzZXJOYW1lYCBvciBgcGFzc3dvcmRgIHdlcmUgcHJvdmlkZWQgaW4gdGhlIGluaXRpYWwgY29uZmlndXJhdGlvbiBvcHRpb25zLCB0aGV5IGFyZSByZXF1aXJlZCBpbiB0aGUgYG9wdGlvbnNgIGhlcmUuIElmIG5vIGBhY2NvdW50YCB3YXMgcHJvdmlkZWQgaW4gdGhlIGluaXRpYWwgY29uZmlndXJhdGlvbiBvcHRpb25zIGFuZCB0aGUgYHVzZXJOYW1lYCBpcyBmb3IgYW4gW2VuZCB1c2VyXSguLi8uLi8uLi9nbG9zc2FyeS8jdXNlcnMpLCB0aGUgYGFjY291bnRgIGlzIHJlcXVpcmVkIGFzIHdlbGwuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgYXV0aC5sb2dpbih7XG4gICAgICAgICAqICAgICAgICAgIHVzZXJOYW1lOiAnanNtaXRoJyxcbiAgICAgICAgICogICAgICAgICAgcGFzc3dvcmQ6ICdwYXNzdzByZCcsXG4gICAgICAgICAqICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyB9KVxuICAgICAgICAgKiAgICAgIC50aGVuKGZ1bmN0aW9uICh0b2tlbikge1xuICAgICAgICAgKiAgICAgICAgICBjb25zb2xlLmxvZyhcInVzZXIgYWNjZXNzIHRva2VuIGlzOiBcIiwgdG9rZW4uYWNjZXNzX3Rva2VuKTtcbiAgICAgICAgICogICAgICB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgbG9naW46IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7IHN1Y2Nlc3M6ICQubm9vcCB9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBpZiAoIWh0dHBPcHRpb25zLnVzZXJOYW1lIHx8ICFodHRwT3B0aW9ucy5wYXNzd29yZCkge1xuICAgICAgICAgICAgICAgIHZhciByZXNwID0geyBzdGF0dXM6IDQwMSwgc3RhdHVzTWVzc2FnZTogJ05vIHVzZXJuYW1lIG9yIHBhc3N3b3JkIHNwZWNpZmllZC4nIH07XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5lcnJvci5jYWxsKHRoaXMsIHJlc3ApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KHJlc3ApLnByb21pc2UoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHBvc3RQYXJhbXMgPSB7XG4gICAgICAgICAgICAgICAgdXNlck5hbWU6IGh0dHBPcHRpb25zLnVzZXJOYW1lLFxuICAgICAgICAgICAgICAgIHBhc3N3b3JkOiBodHRwT3B0aW9ucy5wYXNzd29yZCxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoaHR0cE9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICAgICAgICAgIC8vcGFzcyBpbiBudWxsIGZvciBhY2NvdW50IHVuZGVyIG9wdGlvbnMgaWYgeW91IGRvbid0IHdhbnQgaXQgdG8gYmUgc2VudFxuICAgICAgICAgICAgICAgIHBvc3RQYXJhbXMuYWNjb3VudCA9IGh0dHBPcHRpb25zLmFjY291bnQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QocG9zdFBhcmFtcywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMb2dzIHVzZXIgb3V0IGZyb20gc3BlY2lmaWVkIGFjY291bnRzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIGF1dGgubG9nb3V0KCk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIGxvZ291dDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHNlcnZpY2VPcHRpb25zLCB0cmFuc3BvcnRPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGlmICghaHR0cE9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHRva2VuIHdhcyBzcGVjaWZpZWQuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgc2xhc2ggPSBodHRwT3B0aW9ucy51cmwuc2xpY2UoLTEpID09PSAnLycgPyAnJyA6ICcvJztcbiAgICAgICAgICAgIGh0dHBPcHRpb25zLnVybCA9IGh0dHBPcHRpb25zLnVybCArIHNsYXNoICsgaHR0cE9wdGlvbnMudG9rZW47XG4gICAgICAgICAgICB2YXIgZGVsZXRlUGFyYW1zID0ge307XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmRlbGV0ZShkZWxldGVQYXJhbXMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiAjIyBDaGFubmVsIFNlcnZpY2VcbiAqXG4gKiBUaGUgRXBpY2VudGVyIHBsYXRmb3JtIHByb3ZpZGVzIGEgcHVzaCBjaGFubmVsLCB3aGljaCBhbGxvd3MgeW91IHRvIHB1Ymxpc2ggYW5kIHN1YnNjcmliZSB0byBtZXNzYWdlcyB3aXRoaW4gYSBbcHJvamVjdF0oLi4vLi4vLi4vZ2xvc3NhcnkvI3Byb2plY3RzKSwgW2dyb3VwXSguLi8uLi8uLi9nbG9zc2FyeS8jZ3JvdXBzKSwgb3IgW211bHRpcGxheWVyIHdvcmxkXSguLi8uLi8uLi9nbG9zc2FyeS8jd29ybGQpLiBUaGVyZSBhcmUgdHdvIG1haW4gdXNlIGNhc2VzIGZvciB0aGUgY2hhbm5lbDogZXZlbnQgbm90aWZpY2F0aW9ucyBhbmQgY2hhdCBtZXNzYWdlcy5cbiAqXG4gKiBUaGUgQ2hhbm5lbCBTZXJ2aWNlIGlzIGEgYnVpbGRpbmcgYmxvY2sgZm9yIHRoaXMgZnVuY3Rpb25hbGl0eS4gSXQgY3JlYXRlcyBhIHB1Ymxpc2gtc3Vic2NyaWJlIG9iamVjdCwgYWxsb3dpbmcgeW91IHRvIHB1Ymxpc2ggbWVzc2FnZXMsIHN1YnNjcmliZSB0byBtZXNzYWdlcywgb3IgdW5zdWJzY3JpYmUgZnJvbSBtZXNzYWdlcyBmb3IgYSBnaXZlbiAndG9waWMnIG9uIGEgYCQuY29tZXRkYCB0cmFuc3BvcnQgaW5zdGFuY2UuXG4gKlxuICogVHlwaWNhbGx5LCB5b3UgdXNlIHRoZSBbRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlcl0oLi4vZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlci8pIHRvIGNyZWF0ZSBvciByZXRyaWV2ZSBjaGFubmVscywgdGhlbiB1c2UgdGhlIENoYW5uZWwgU2VydmljZSBgc3Vic2NyaWJlKClgIGFuZCBgcHVibGlzaCgpYCBtZXRob2RzIHRvIGxpc3RlbiB0byBvciB1cGRhdGUgZGF0YS4gKEZvciBhZGRpdGlvbmFsIGJhY2tncm91bmQgb24gRXBpY2VudGVyJ3MgcHVzaCBjaGFubmVsLCBzZWUgdGhlIGludHJvZHVjdG9yeSBub3RlcyBvbiB0aGUgW1B1c2ggQ2hhbm5lbCBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9tdWx0aXBsYXllci9jaGFubmVsLykgcGFnZS4pXG4gKlxuICogWW91J2xsIG5lZWQgdG8gaW5jbHVkZSB0aGUgYGVwaWNlbnRlci1tdWx0aXBsYXllci1kZXBlbmRlbmNpZXMuanNgIGxpYnJhcnkgaW4gYWRkaXRpb24gdG8gdGhlIGBlcGljZW50ZXIuanNgIGxpYnJhcnkgaW4geW91ciBwcm9qZWN0IHRvIHVzZSB0aGUgQ2hhbm5lbCBTZXJ2aWNlLiBTZWUgW0luY2x1ZGluZyBFcGljZW50ZXIuanNdKC4uLy4uLyNpbmNsdWRlKS5cbiAqXG4gKiBUbyB1c2UgdGhlIENoYW5uZWwgU2VydmljZSwgaW5zdGFudGlhdGUgaXQsIHRoZW4gbWFrZSBjYWxscyB0byBhbnkgb2YgdGhlIG1ldGhvZHMgeW91IG5lZWQuXG4gKlxuICogICAgICAgIHZhciBjcyA9IG5ldyBGLnNlcnZpY2UuQ2hhbm5lbCgpO1xuICogICAgICAgIGNzLnB1Ymxpc2goJy9hY21lLXNpbXVsYXRpb25zL3N1cHBseS1jaGFpbi1nYW1lL2ZhbGwtc2VtaW5hci9ydW4vdmFyaWFibGVzJywgeyBwcmljZTogNTAgfSk7XG4gKlxuICogVGhlIHBhcmFtZXRlcnMgZm9yIGluc3RhbnRpYXRpbmcgYSBDaGFubmVsIFNlcnZpY2UgaW5jbHVkZTpcbiAqXG4gKiAqIGBvcHRpb25zYCBUaGUgb3B0aW9ucyBvYmplY3QgdG8gY29uZmlndXJlIHRoZSBDaGFubmVsIFNlcnZpY2UuXG4gKiAqIGBvcHRpb25zLmJhc2VgIFRoZSBiYXNlIHRvcGljLiBUaGlzIGlzIGFkZGVkIGFzIGEgcHJlZml4IHRvIGFsbCBmdXJ0aGVyIHRvcGljcyB5b3UgcHVibGlzaCBvciBzdWJzY3JpYmUgdG8gd2hpbGUgd29ya2luZyB3aXRoIHRoaXMgQ2hhbm5lbCBTZXJ2aWNlLlxuICogKiBgb3B0aW9ucy50b3BpY1Jlc29sdmVyYCBBIGZ1bmN0aW9uIHRoYXQgcHJvY2Vzc2VzIGFsbCAndG9waWNzJyBwYXNzZWQgaW50byB0aGUgYHB1Ymxpc2hgIGFuZCBgc3Vic2NyaWJlYCBtZXRob2RzLiBUaGlzIGlzIHVzZWZ1bCBpZiB5b3Ugd2FudCB0byBpbXBsZW1lbnQgeW91ciBvd24gc2VyaWFsaXplIGZ1bmN0aW9ucyBmb3IgY29udmVydGluZyBjdXN0b20gb2JqZWN0cyB0byB0b3BpYyBuYW1lcy4gUmV0dXJucyBhIFN0cmluZy4gQnkgZGVmYXVsdCwgaXQganVzdCBlY2hvZXMgdGhlIHRvcGljLlxuICogKiBgb3B0aW9ucy50cmFuc3BvcnRgIFRoZSBpbnN0YW5jZSBvZiBgJC5jb21ldGRgIHRvIGhvb2sgb250by4gU2VlIGh0dHA6Ly9kb2NzLmNvbWV0ZC5vcmcvcmVmZXJlbmNlL2phdmFzY3JpcHQuaHRtbCBmb3IgYWRkaXRpb25hbCBiYWNrZ3JvdW5kIG9uIGNvbWV0ZC5cbiAqL1xudmFyIENoYW5uZWwgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGJhc2UgdG9waWMuIFRoaXMgaXMgYWRkZWQgYXMgYSBwcmVmaXggdG8gYWxsIGZ1cnRoZXIgdG9waWNzIHlvdSBwdWJsaXNoIG9yIHN1YnNjcmliZSB0byB3aGlsZSB3b3JraW5nIHdpdGggdGhpcyBDaGFubmVsIFNlcnZpY2UuXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBiYXNlOiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQSBmdW5jdGlvbiB0aGF0IHByb2Nlc3NlcyBhbGwgJ3RvcGljcycgcGFzc2VkIGludG8gdGhlIGBwdWJsaXNoYCBhbmQgYHN1YnNjcmliZWAgbWV0aG9kcy4gVGhpcyBpcyB1c2VmdWwgaWYgeW91IHdhbnQgdG8gaW1wbGVtZW50IHlvdXIgb3duIHNlcmlhbGl6ZSBmdW5jdGlvbnMgZm9yIGNvbnZlcnRpbmcgY3VzdG9tIG9iamVjdHMgdG8gdG9waWMgbmFtZXMuIEJ5IGRlZmF1bHQsIGl0IGp1c3QgZWNob2VzIHRoZSB0b3BpYy5cbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICpcbiAgICAgICAgICogKiBgdG9waWNgIFRvcGljIHRvIHBhcnNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKlJldHVybiBWYWx1ZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICogKlN0cmluZyo6IFRoaXMgZnVuY3Rpb24gc2hvdWxkIHJldHVybiBhIHN0cmluZyB0b3BpYy5cbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgICAgICAgKi9cbiAgICAgICAgdG9waWNSZXNvbHZlcjogZnVuY3Rpb24gKHRvcGljKSB7XG4gICAgICAgICAgICByZXR1cm4gdG9waWM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBpbnN0YW5jZSBvZiBgJC5jb21ldGRgIHRvIGhvb2sgb250by5cbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRyYW5zcG9ydDogbnVsbFxuICAgIH07XG4gICAgdGhpcy5jaGFubmVsT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG59O1xuXG52YXIgbWFrZU5hbWUgPSBmdW5jdGlvbiAoY2hhbm5lbE5hbWUsIHRvcGljKSB7XG4gICAgLy9SZXBsYWNlIHRyYWlsaW5nL2RvdWJsZSBzbGFzaGVzXG4gICAgdmFyIG5ld05hbWUgPSAoY2hhbm5lbE5hbWUgPyAoY2hhbm5lbE5hbWUgKyAnLycgKyB0b3BpYykgOiB0b3BpYykucmVwbGFjZSgvXFwvXFwvL2csICcvJykucmVwbGFjZSgvXFwvJC8sJycpO1xuICAgIHJldHVybiBuZXdOYW1lO1xufTtcblxuXG5DaGFubmVsLnByb3RvdHlwZSA9ICQuZXh0ZW5kKENoYW5uZWwucHJvdG90eXBlLCB7XG5cbiAgICAvLyBmdXR1cmUgZnVuY3Rpb25hbGl0eTpcbiAgICAvLyAgICAgIC8vIFNldCB0aGUgY29udGV4dCBmb3IgdGhlIGNhbGxiYWNrXG4gICAgLy8gICAgICBjcy5zdWJzY3JpYmUoJ3J1bicsIGZ1bmN0aW9uICgpIHsgdGhpcy5pbm5lckhUTUwgPSAnVHJpZ2dlcmVkJ30sIGRvY3VtZW50LmJvZHkpO1xuICAgICAvL1xuICAgICAvLyAgICAgIC8vIENvbnRyb2wgdGhlIG9yZGVyIG9mIG9wZXJhdGlvbnMgYnkgc2V0dGluZyB0aGUgYHByaW9yaXR5YFxuICAgICAvLyAgICAgIGNzLnN1YnNjcmliZSgncnVuJywgY2IsIHRoaXMsIHtwcmlvcml0eTogOX0pO1xuICAgICAvL1xuICAgICAvLyAgICAgIC8vIE9ubHkgZXhlY3V0ZSB0aGUgY2FsbGJhY2ssIGBjYmAsIGlmIHRoZSB2YWx1ZSBvZiB0aGUgYHByaWNlYCB2YXJpYWJsZSBpcyA1MFxuICAgICAvLyAgICAgIGNzLnN1YnNjcmliZSgncnVuL3ZhcmlhYmxlcy9wcmljZScsIGNiLCB0aGlzLCB7cHJpb3JpdHk6IDMwLCB2YWx1ZTogNTB9KTtcbiAgICAgLy9cbiAgICAgLy8gICAgICAvLyBPbmx5IGV4ZWN1dGUgdGhlIGNhbGxiYWNrLCBgY2JgLCBpZiB0aGUgdmFsdWUgb2YgdGhlIGBwcmljZWAgdmFyaWFibGUgaXMgZ3JlYXRlciB0aGFuIDUwXG4gICAgIC8vICAgICAgc3Vic2NyaWJlKCdydW4vdmFyaWFibGVzL3ByaWNlJywgY2IsIHRoaXMsIHtwcmlvcml0eTogMzAsIHZhbHVlOiAnPjUwJ30pO1xuICAgICAvL1xuICAgICAvLyAgICAgIC8vIE9ubHkgZXhlY3V0ZSB0aGUgY2FsbGJhY2ssIGBjYmAsIGlmIHRoZSB2YWx1ZSBvZiB0aGUgYHByaWNlYCB2YXJpYWJsZSBpcyBldmVuXG4gICAgIC8vICAgICAgc3Vic2NyaWJlKCdydW4vdmFyaWFibGVzL3ByaWNlJywgY2IsIHRoaXMsIHtwcmlvcml0eTogMzAsIHZhbHVlOiBmdW5jdGlvbiAodmFsKSB7cmV0dXJuIHZhbCAlIDIgPT09IDB9fSk7XG5cblxuICAgIC8qKlxuICAgICAqIFN1YnNjcmliZSB0byBjaGFuZ2VzIG9uIGEgdG9waWMuXG4gICAgICpcbiAgICAgKiBUaGUgdG9waWMgc2hvdWxkIGluY2x1ZGUgdGhlIGZ1bGwgcGF0aCBvZiB0aGUgYWNjb3VudCBpZCAoKipUZWFtIElEKiogZm9yIHRlYW0gcHJvamVjdHMpLCBwcm9qZWN0IGlkLCBhbmQgZ3JvdXAgbmFtZS4gKEluIG1vc3QgY2FzZXMsIGl0IGlzIHNpbXBsZXIgdG8gdXNlIHRoZSBbRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlcl0oLi4vZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlci8pIGluc3RlYWQsIGluIHdoaWNoIGNhc2UgdGhpcyBpcyBjb25maWd1cmVkIGZvciB5b3UuKVxuICAgICAqXG4gICAgICogICoqRXhhbXBsZXMqKlxuICAgICAqXG4gICAgICogICAgICB2YXIgY2IgPSBmdW5jdGlvbih2YWwpIHsgY29uc29sZS5sb2codmFsLmRhdGEpOyB9O1xuICAgICAqXG4gICAgICogICAgICAvLyBTdWJzY3JpYmUgdG8gY2hhbmdlcyBvbiBhIHRvcC1sZXZlbCAncnVuJyB0b3BpY1xuICAgICAqICAgICAgY3Muc3Vic2NyaWJlKCcvYWNtZS1zaW11bGF0aW9ucy9zdXBwbHktY2hhaW4tZ2FtZS9mYWxsLXNlbWluYXIvcnVuJywgY2IpO1xuICAgICAqXG4gICAgICogICAgICAvLyBTdWJzY3JpYmUgdG8gY2hhbmdlcyBvbiBjaGlsZHJlbiBvZiB0aGUgJ3J1bicgdG9waWMuIE5vdGUgdGhpcyB3aWxsIGFsc28gYmUgdHJpZ2dlcmVkIGZvciBjaGFuZ2VzIHRvIHJ1bi54Lnkuei5cbiAgICAgKiAgICAgIGNzLnN1YnNjcmliZSgnL2FjbWUtc2ltdWxhdGlvbnMvc3VwcGx5LWNoYWluLWdhbWUvZmFsbC1zZW1pbmFyL3J1bi8qJywgY2IpO1xuICAgICAqXG4gICAgICogICAgICAvLyBTdWJzY3JpYmUgdG8gY2hhbmdlcyBvbiBib3RoIHRoZSB0b3AtbGV2ZWwgJ3J1bicgdG9waWMgYW5kIGl0cyBjaGlsZHJlblxuICAgICAqICAgICAgY3Muc3Vic2NyaWJlKFsnL2FjbWUtc2ltdWxhdGlvbnMvc3VwcGx5LWNoYWluLWdhbWUvZmFsbC1zZW1pbmFyL3J1bicsXG4gICAgICogICAgICAgICAgJy9hY21lLXNpbXVsYXRpb25zL3N1cHBseS1jaGFpbi1nYW1lL2ZhbGwtc2VtaW5hci9ydW4vKiddLCBjYik7XG4gICAgICpcbiAgICAgKiAgICAgIC8vIFN1YnNjcmliZSB0byBjaGFuZ2VzIG9uIGEgcGFydGljdWxhciB2YXJpYWJsZVxuICAgICAqICAgICAgc3Vic2NyaWJlKCcvYWNtZS1zaW11bGF0aW9ucy9zdXBwbHktY2hhaW4tZ2FtZS9mYWxsLXNlbWluYXIvcnVuL3ZhcmlhYmxlcy9wcmljZScsIGNiKTtcbiAgICAgKlxuICAgICAqXG4gICAgICogKipSZXR1cm4gVmFsdWUqKlxuICAgICAqXG4gICAgICogKiAqU3RyaW5nKiBSZXR1cm5zIGEgdG9rZW4geW91IGNhbiBsYXRlciB1c2UgdG8gdW5zdWJzY3JpYmUuXG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ3xBcnJheX0gICBgdG9waWNgICAgIExpc3Qgb2YgdG9waWNzIHRvIGxpc3RlbiBmb3IgY2hhbmdlcyBvbi5cbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gYGNhbGxiYWNrYCBDYWxsYmFjayBmdW5jdGlvbiB0byBleGVjdXRlLiBDYWxsYmFjayBpcyBjYWxsZWQgd2l0aCBzaWduYXR1cmUgYChldnQsIHBheWxvYWQsIG1ldGFkYXRhKWAuXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSAgIGBjb250ZXh0YCAgQ29udGV4dCBpbiB3aGljaCB0aGUgYGNhbGxiYWNrYCBpcyBleGVjdXRlZC5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgYG9wdGlvbnNgICAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gICBgb3B0aW9ucy5wcmlvcml0eWAgIFVzZWQgdG8gY29udHJvbCBvcmRlciBvZiBvcGVyYXRpb25zLiBEZWZhdWx0cyB0byAwLiBDYW4gYmUgYW55ICt2ZSBvciAtdmUgbnVtYmVyLlxuICAgICAqIEBwYXJhbSAge1N0cmluZ3xOdW1iZXJ8RnVuY3Rpb259ICAgYG9wdGlvbnMudmFsdWVgIFRoZSBgY2FsbGJhY2tgIGlzIG9ubHkgdHJpZ2dlcmVkIGlmIHRoaXMgY29uZGl0aW9uIG1hdGNoZXMuIFNlZSBleGFtcGxlcyBmb3IgZGV0YWlscy5cbiAgICAgKlxuICAgICAqL1xuICAgIHN1YnNjcmliZTogZnVuY3Rpb24gKHRvcGljLCBjYWxsYmFjaywgY29udGV4dCwgb3B0aW9ucykge1xuXG4gICAgICAgIHZhciB0b3BpY3MgPSBbXS5jb25jYXQodG9waWMpO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICB2YXIgc3Vic2NyaXB0aW9uSWRzID0gW107XG4gICAgICAgIHZhciBvcHRzID0gbWUuY2hhbm5lbE9wdGlvbnM7XG5cbiAgICAgICAgb3B0cy50cmFuc3BvcnQuYmF0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJC5lYWNoKHRvcGljcywgZnVuY3Rpb24gKGluZGV4LCB0b3BpYykge1xuICAgICAgICAgICAgICAgIHRvcGljID0gbWFrZU5hbWUob3B0cy5iYXNlLCBvcHRzLnRvcGljUmVzb2x2ZXIodG9waWMpKTtcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZHMucHVzaChvcHRzLnRyYW5zcG9ydC5zdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiAoc3Vic2NyaXB0aW9uSWRzWzFdID8gc3Vic2NyaXB0aW9uSWRzIDogc3Vic2NyaXB0aW9uSWRzWzBdKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHVibGlzaCBkYXRhIHRvIGEgdG9waWMuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGVzKipcbiAgICAgKlxuICAgICAqICAgICAgLy8gU2VuZCBkYXRhIHRvIGFsbCBzdWJzY3JpYmVycyBvZiB0aGUgJ3J1bicgdG9waWNcbiAgICAgKiAgICAgIGNzLnB1Ymxpc2goJy9hY21lLXNpbXVsYXRpb25zL3N1cHBseS1jaGFpbi1nYW1lL2ZhbGwtc2VtaW5hci9ydW4nLCB7IGNvbXBsZXRlZDogZmFsc2UgfSk7XG4gICAgICpcbiAgICAgKiAgICAgIC8vIFNlbmQgZGF0YSB0byBhbGwgc3Vic2NyaWJlcnMgb2YgdGhlICdydW4vdmFyaWFibGVzJyB0b3BpY1xuICAgICAqICAgICAgY3MucHVibGlzaCgnL2FjbWUtc2ltdWxhdGlvbnMvc3VwcGx5LWNoYWluLWdhbWUvZmFsbC1zZW1pbmFyL3J1bi92YXJpYWJsZXMnLCB7IHByaWNlOiA1MCB9KTtcbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGB0b3BpY2AgVG9waWMgdG8gcHVibGlzaCB0by5cbiAgICAgKiBAcGFyYW0gIHsqfSBgZGF0YWAgIERhdGEgdG8gcHVibGlzaCB0byB0b3BpYy5cbiAgICAgKlxuICAgICAqL1xuICAgIHB1Ymxpc2g6IGZ1bmN0aW9uICh0b3BpYywgZGF0YSkge1xuICAgICAgICB2YXIgdG9waWNzID0gW10uY29uY2F0KHRvcGljKTtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgdmFyIHJldHVybk9ianMgPSBbXTtcbiAgICAgICAgdmFyIG9wdHMgPSBtZS5jaGFubmVsT3B0aW9ucztcblxuXG4gICAgICAgIG9wdHMudHJhbnNwb3J0LmJhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQuZWFjaCh0b3BpY3MsIGZ1bmN0aW9uIChpbmRleCwgdG9waWMpIHtcbiAgICAgICAgICAgICAgICB0b3BpYyA9IG1ha2VOYW1lKG9wdHMuYmFzZSwgb3B0cy50b3BpY1Jlc29sdmVyKHRvcGljKSk7XG4gICAgICAgICAgICAgICAgaWYgKHRvcGljLmNoYXJBdCh0b3BpYy5sZW5ndGggLSAxKSA9PT0gJyonKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvcGljID0gdG9waWMucmVwbGFjZSgvXFwqKyQvLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignWW91IGNhbiBjYW5ub3QgcHVibGlzaCB0byBjaGFubmVscyB3aXRoIHdpbGRjYXJkcy4gUHVibGlzaGluZyB0byAnLCB0b3BpYywgJ2luc3RlYWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuT2Jqcy5wdXNoKG9wdHMudHJhbnNwb3J0LnB1Ymxpc2godG9waWMsIGRhdGEpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIChyZXR1cm5PYmpzWzFdID8gcmV0dXJuT2JqcyA6IHJldHVybk9ianNbMF0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVbnN1YnNjcmliZSBmcm9tIGNoYW5nZXMgdG8gYSB0b3BpYy5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIGNzLnVuc3Vic2NyaWJlKCdzYW1wbGVUb2tlbicpO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGB0b2tlbmAgVGhlIHRva2VuIGZvciB0b3BpYyBpcyByZXR1cm5lZCB3aGVuIHlvdSBpbml0aWFsbHkgc3Vic2NyaWJlLiBQYXNzIGl0IGhlcmUgdG8gdW5zdWJzY3JpYmUgZnJvbSB0aGF0IHRvcGljLlxuICAgICAqL1xuICAgIHVuc3Vic2NyaWJlOiBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgdGhpcy5jaGFubmVsT3B0aW9ucy50cmFuc3BvcnQudW5zdWJzY3JpYmUodG9rZW4pO1xuICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IGxpc3RlbmluZyBmb3IgZXZlbnRzIG9uIHRoaXMgaW5zdGFuY2UuIFNpZ25hdHVyZSBpcyBzYW1lIGFzIGZvciBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vb24vLlxuICAgICAqXG4gICAgICogU3VwcG9ydGVkIGV2ZW50cyBhcmU6IGBjb25uZWN0YCwgYGRpc2Nvbm5lY3RgLCBgc3Vic2NyaWJlYCwgYHVuc3Vic2NyaWJlYCwgYHB1Ymxpc2hgLCBgZXJyb3JgLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgZXZlbnRgIFRoZSBldmVudCB0eXBlLiBTZWUgbW9yZSBkZXRhaWwgYXQgalF1ZXJ5IEV2ZW50czogaHR0cDovL2FwaS5qcXVlcnkuY29tL29uLy5cbiAgICAgKi9cbiAgICBvbjogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICQodGhpcykub24uYXBwbHkoJCh0aGlzKSwgYXJndW1lbnRzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RvcCBsaXN0ZW5pbmcgZm9yIGV2ZW50cyBvbiB0aGlzIGluc3RhbmNlLiBTaWduYXR1cmUgaXMgc2FtZSBhcyBmb3IgalF1ZXJ5IEV2ZW50czogaHR0cDovL2FwaS5qcXVlcnkuY29tL29mZi8uXG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGBldmVudGAgVGhlIGV2ZW50IHR5cGUuIFNlZSBtb3JlIGRldGFpbCBhdCBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vb2ZmLy5cbiAgICAgKi9cbiAgICBvZmY6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAkKHRoaXMpLm9mZi5hcHBseSgkKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUcmlnZ2VyIGV2ZW50cyBhbmQgZXhlY3V0ZSBoYW5kbGVycy4gU2lnbmF0dXJlIGlzIHNhbWUgYXMgZm9yIGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS90cmlnZ2VyLy5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYGV2ZW50YCBUaGUgZXZlbnQgdHlwZS4gU2VlIG1vcmUgZGV0YWlsIGF0IGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS90cmlnZ2VyLy5cbiAgICAgKi9cbiAgICB0cmlnZ2VyOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgJCh0aGlzKS50cmlnZ2VyLmFwcGx5KCQodGhpcyksIGFyZ3VtZW50cyk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDaGFubmVsO1xuIiwiLyoqXG4gKiBAY2xhc3MgQ29uZmlndXJhdGlvblNlcnZpY2VcbiAqXG4gKiBBbGwgc2VydmljZXMgdGFrZSBpbiBhIGNvbmZpZ3VyYXRpb24gc2V0dGluZ3Mgb2JqZWN0IHRvIGNvbmZpZ3VyZSB0aGVtc2VsdmVzLiBBIEpTIGhhc2gge30gaXMgYSB2YWxpZCBjb25maWd1cmF0aW9uIG9iamVjdCwgYnV0IG9wdGlvbmFsbHkgeW91IGNhbiB1c2UgdGhlIGNvbmZpZ3VyYXRpb24gc2VydmljZSB0byB0b2dnbGUgY29uZmlncyBiYXNlZCBvbiB0aGUgZW52aXJvbm1lbnRcbiAqXG4gKiBAZXhhbXBsZVxuICogICAgIHZhciBjcyA9IHJlcXVpcmUoJ2NvbmZpZ3VyYXRpb24tc2VydmljZScpKHtcbiAqICAgICAgICAgIGRldjogeyAvL2Vudmlyb25tZW50XG4gICAgICAgICAgICAgICAgcG9ydDogMzAwMCxcbiAgICAgICAgICAgICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9kOiB7XG4gICAgICAgICAgICAgICAgcG9ydDogODA4MCxcbiAgICAgICAgICAgICAgICBob3N0OiAnYXBpLmZvcmlvLmNvbScsXG4gICAgICAgICAgICAgICAgbG9nTGV2ZWw6ICdub25lJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxvZ0xldmVsOiAnREVCVUcnIC8vZ2xvYmFsXG4gKiAgICAgfSk7XG4gKlxuICogICAgICBjcy5nZXQoJ2xvZ0xldmVsJyk7IC8vcmV0dXJucyAnREVCVUcnXG4gKlxuICogICAgICBjcy5zZXRFbnYoJ2RldicpO1xuICogICAgICBjcy5nZXQoJ2xvZ0xldmVsJyk7IC8vcmV0dXJucyAnREVCVUcnXG4gKlxuICogICAgICBjcy5zZXRFbnYoJ3Byb2QnKTtcbiAqICAgICAgY3MuZ2V0KCdsb2dMZXZlbCcpOyAvL3JldHVybnMgJ25vbmUnXG4gKlxuICovXG5cbid1c2Ugc3RyaWN0JztcbnZhciB1cmxTZXJ2aWNlID0gcmVxdWlyZSgnLi91cmwtY29uZmlnLXNlcnZpY2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgLy9UT0RPOiBFbnZpcm9ubWVudHNcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIGxvZ0xldmVsOiAnTk9ORSdcbiAgICB9O1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcbiAgICBzZXJ2aWNlT3B0aW9ucy5zZXJ2ZXIgPSB1cmxTZXJ2aWNlKHNlcnZpY2VPcHRpb25zLnNlcnZlcik7XG5cbiAgICByZXR1cm4ge1xuXG4gICAgICAgIGRhdGE6IHNlcnZpY2VPcHRpb25zLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgdGhlIGVudmlyb25tZW50IGtleSB0byBnZXQgY29uZmlndXJhdGlvbiBvcHRpb25zIGZyb21cbiAgICAgICAgICogQHBhcmFtIHsgc3RyaW5nfSBlbnZcbiAgICAgICAgICovXG4gICAgICAgIHNldEVudjogZnVuY3Rpb24gKGVudikge1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBjb25maWd1cmF0aW9uLlxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfSBwcm9wZXJ0eSBvcHRpb25hbFxuICAgICAgICAgKiBAcmV0dXJuIHsqfSAgICAgICAgICBWYWx1ZSBvZiBwcm9wZXJ0eSBpZiBzcGVjaWZpZWQsIHRoZSBlbnRpcmUgY29uZmlnIG9iamVjdCBvdGhlcndpc2VcbiAgICAgICAgICovXG4gICAgICAgIGdldDogZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICByZXR1cm4gc2VydmljZU9wdGlvbnNbcHJvcGVydHldO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgY29uZmlndXJhdGlvbi5cbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xPYmplY3R9IGtleSBpZiBhIGtleSBpcyBwcm92aWRlZCwgc2V0IGEga2V5IHRvIHRoYXQgdmFsdWUuIE90aGVyd2lzZSBtZXJnZSBvYmplY3Qgd2l0aCBjdXJyZW50IGNvbmZpZ1xuICAgICAgICAgKiBAcGFyYW0gIHsqfSB2YWx1ZSAgdmFsdWUgZm9yIHByb3ZpZGVkIGtleVxuICAgICAgICAgKi9cbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnNba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbiIsIi8qKlxuICogIyNEYXRhIEFQSSBTZXJ2aWNlXG4gKlxuICogVGhlIERhdGEgQVBJIFNlcnZpY2UgYWxsb3dzIHlvdSB0byBjcmVhdGUsIGFjY2VzcywgYW5kIG1hbmlwdWxhdGUgZGF0YSByZWxhdGVkIHRvIGFueSBvZiB5b3VyIHByb2plY3RzLiBEYXRhIGFyZSBvcmdhbml6ZWQgaW4gY29sbGVjdGlvbnMuIEVhY2ggY29sbGVjdGlvbiBjb250YWlucyBhIGRvY3VtZW50OyBlYWNoIGVsZW1lbnQgb2YgdGhpcyB0b3AtbGV2ZWwgZG9jdW1lbnQgaXMgYSBKU09OIG9iamVjdC4gKFNlZSBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIG9uIHRoZSB1bmRlcmx5aW5nIFtEYXRhIEFQSV0oLi4vLi4vLi4vcmVzdF9hcGlzL2RhdGFfYXBpLykuKVxuICpcbiAqIEFsbCBBUEkgY2FsbHMgdGFrZSBpbiBhbiBcIm9wdGlvbnNcIiBvYmplY3QgYXMgdGhlIGxhc3QgcGFyYW1ldGVyLiBUaGUgb3B0aW9ucyBjYW4gYmUgdXNlZCB0byBleHRlbmQvb3ZlcnJpZGUgdGhlIERhdGEgQVBJIFNlcnZpY2UgZGVmYXVsdHMuIEluIHBhcnRpY3VsYXIsIHRoZSBgcm9vdGAgb3B0aW9uIGNvbnRhaW5zIHRoZSBuYW1lIG9mIHRoZSBjb2xsZWN0aW9uLiBJZiB5b3UgaGF2ZSBtdWx0aXBsZSBjb2xsZWN0aW9ucyB3aXRoaW4gZWFjaCBvZiB5b3VyIHByb2plY3RzLCB5b3UgY2FuIHBhc3MgdGhlIGNvbGxlY3Rpb24gbmFtZSBhcyBhbiBvcHRpb24gZm9yIGVhY2ggY2FsbC5cbiAqXG4gKiAgICAgIHZhciBkcyA9IG5ldyBGLnNlcnZpY2UuRGF0YSh7IHJvb3Q6ICdzdXJ2ZXktcmVzcG9uc2VzJyB9KTtcbiAqICAgICAgZHMuc2F2ZUFzKCd1c2VyMScsXG4gKiAgICAgICAgICB7ICdxdWVzdGlvbjEnOiAyLCAncXVlc3Rpb24yJzogMTAsXG4gKiAgICAgICAgICAgJ3F1ZXN0aW9uMyc6IGZhbHNlLCAncXVlc3Rpb240JzogJ3NvbWV0aW1lcycgfSApO1xuICogICAgICBkcy5zYXZlQXMoJ3VzZXIyJyxcbiAqICAgICAgICAgIHsgJ3F1ZXN0aW9uMSc6IDMsICdxdWVzdGlvbjInOiA4LFxuICogICAgICAgICAgICdxdWVzdGlvbjMnOiB0cnVlLCAncXVlc3Rpb240JzogJ2Fsd2F5cycgfSApO1xuICogICAgICBkcy5xdWVyeSgnJyx7ICdxdWVzdGlvbjInOiB7ICckZ3QnOiA5fSB9KTtcbiAqXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgU3RvcmFnZUZhY3RvcnkgPSByZXF1aXJlKCcuLi9zdG9yZS9zdG9yZS1mYWN0b3J5Jyk7XG52YXIgcXV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3F1ZXJ5LXV0aWwnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIHN0b3JlID0gbmV3IFN0b3JhZ2VGYWN0b3J5KHsgc3luY2hyb25vdXM6IHRydWUgfSk7XG5cbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOYW1lIG9mIGNvbGxlY3Rpb24uIERlZmF1bHRzIHRvIGAvYCwgdGhhdCBpcywgdGhlIHJvb3QgbGV2ZWwgb2YgeW91ciBwcm9qZWN0IGF0IGBmb3Jpby5jb20vYXBwL3lvdXItYWNjb3VudC1pZC95b3VyLXByb2plY3QtaWQvYC4gUmVxdWlyZWQuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICByb290OiAnLycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY2NvdW50IGlkLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpIG9yICoqVXNlciBJRCoqIChmb3IgcGVyc29uYWwgcHJvamVjdHMpLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBhY2NvdW50OiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHByb2plY3QgaWQuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHByb2plY3Q6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGb3Igb3BlcmF0aW9ucyB0aGF0IHJlcXVpcmUgYXV0aGVudGljYXRpb24sIHBhc3MgaW4gdGhlIHVzZXIgYWNjZXNzIHRva2VuIChkZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcpLiBJZiB0aGUgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbiB0byBFcGljZW50ZXIsIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiBpcyBhbHJlYWR5IHNldCBpbiBhIGNvb2tpZSBhbmQgYXV0b21hdGljYWxseSBsb2FkZWQgZnJvbSB0aGVyZS4gKFNlZSBbbW9yZSBiYWNrZ3JvdW5kIG9uIGFjY2VzcyB0b2tlbnNdKC4uLy4uLy4uL3Byb2plY3RfYWNjZXNzLykpLlxuICAgICAgICAgKiBAc2VlIFtBdXRoZW50aWNhdGlvbiBBUEkgU2VydmljZV0oLi4vYXV0aC1hcGktc2VydmljZS8pIGZvciBnZXR0aW5nIHRva2Vucy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRva2VuOiBzdG9yZS5nZXQoJ2VwaWNlbnRlci5wcm9qZWN0LnRva2VuJykgfHwgJycsXG5cbiAgICAgICAgZG9tYWluOiAnZm9yaW8uY29tJyxcblxuICAgICAgICAvL09wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXJcbiAgICAgICAgdHJhbnNwb3J0OiB7fVxuICAgIH07XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCBjb25maWcpO1xuXG4gICAgdmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKHNlcnZpY2VPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy5hY2NvdW50KSB7XG4gICAgICAgIHVybENvbmZpZy5hY2NvdW50UGF0aCA9IHNlcnZpY2VPcHRpb25zLmFjY291bnQ7XG4gICAgfVxuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0KSB7XG4gICAgICAgIHVybENvbmZpZy5wcm9qZWN0UGF0aCA9IHNlcnZpY2VPcHRpb25zLnByb2plY3Q7XG4gICAgfVxuXG4gICAgdmFyIGdldFVSTCA9IGZ1bmN0aW9uIChrZXksIHJvb3QpIHtcbiAgICAgICAgaWYgKCFyb290KSB7XG4gICAgICAgICAgICByb290ID0gc2VydmljZU9wdGlvbnMucm9vdDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdXJsID0gdXJsQ29uZmlnLmdldEFQSVBhdGgoJ2RhdGEnKSArIHF1dGlsLmFkZFRyYWlsaW5nU2xhc2gocm9vdCk7XG4gICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgIHVybCs9IHF1dGlsLmFkZFRyYWlsaW5nU2xhc2goa2V5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH07XG5cbiAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogZ2V0VVJMXG4gICAgfSk7XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIGh0dHBPcHRpb25zLmhlYWRlcnMgPSB7XG4gICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkoaHR0cE9wdGlvbnMpO1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2VhcmNoIGZvciBkYXRhIHdpdGhpbiBhIGNvbGxlY3Rpb24uXG4gICAgICAgICAqXG4gICAgICAgICAqIFNlYXJjaGluZyB1c2luZyBjb21wYXJpc29uIG9yIGxvZ2ljYWwgb3BlcmF0b3JzIChhcyBvcHBvc2VkIHRvIGV4YWN0IG1hdGNoZXMpIHJlcXVpcmVzIE1vbmdvREIgc3ludGF4LiBTZWUgdGhlIHVuZGVybHlpbmcgW0RhdGEgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvZGF0YV9hcGkvI3NlYXJjaGluZykgZm9yIGFkZGl0aW9uYWwgZGV0YWlscy5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlcyoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gcmVxdWVzdCBhbGwgZGF0YSBhc3NvY2lhdGVkIHdpdGggZG9jdW1lbnQgJ3VzZXIxJ1xuICAgICAgICAgKiAgICAgIGRzLnF1ZXJ5KCd1c2VyMScpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIGV4YWN0IG1hdGNoaW5nOlxuICAgICAgICAgKiAgICAgIC8vIHJlcXVlc3QgYWxsIGRvY3VtZW50cyBpbiBjb2xsZWN0aW9uIHdoZXJlICdxdWVzdGlvbjInIGlzIDlcbiAgICAgICAgICogICAgICBkcy5xdWVyeSgnJywgeyAncXVlc3Rpb24yJzogOX0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIGNvbXBhcmlzb24gb3BlcmF0b3JzOlxuICAgICAgICAgKiAgICAgIC8vIHJlcXVlc3QgYWxsIGRvY3VtZW50cyBpbiBjb2xsZWN0aW9uXG4gICAgICAgICAqICAgICAgLy8gd2hlcmUgJ3F1ZXN0aW9uMicgaXMgZ3JlYXRlciB0aGFuIDlcbiAgICAgICAgICogICAgICBkcy5xdWVyeSgnJywgeyAncXVlc3Rpb24yJzogeyAnJGd0JzogOX0gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gbG9naWNhbCBvcGVyYXRvcnM6XG4gICAgICAgICAqICAgICAgLy8gcmVxdWVzdCBhbGwgZG9jdW1lbnRzIGluIGNvbGxlY3Rpb25cbiAgICAgICAgICogICAgICAvLyB3aGVyZSAncXVlc3Rpb24yJyBpcyBsZXNzIHRoYW4gMTAsIGFuZCAncXVlc3Rpb24zJyBpcyBmYWxzZVxuICAgICAgICAgKiAgICAgIGRzLnF1ZXJ5KCcnLCB7ICckYW5kJzogWyB7ICdxdWVzdGlvbjInOiB7ICckbHQnOjEwfSB9LCB7ICdxdWVzdGlvbjMnOiBmYWxzZSB9XSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyByZWd1bGFyIGV4cHJlc3NzaW9uczogdXNlIGFueSBQZXJsLWNvbXBhdGlibGUgcmVndWxhciBleHByZXNzaW9uc1xuICAgICAgICAgKiAgICAgIC8vIHJlcXVlc3QgYWxsIGRvY3VtZW50cyBpbiBjb2xsZWN0aW9uXG4gICAgICAgICAqICAgICAgLy8gd2hlcmUgJ3F1ZXN0aW9uNScgY29udGFpbnMgdGhlIHN0cmluZyAnLipkYXknXG4gICAgICAgICAqICAgICAgZHMucXVlcnkoJycsIHsgJ3F1ZXN0aW9uNSc6IHsgJyRyZWdleCc6ICcuKmRheScgfSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGBrZXlgIFRoZSBuYW1lIG9mIHRoZSBkb2N1bWVudCB0byBzZWFyY2guIFBhc3MgdGhlIGVtcHR5IHN0cmluZyAoJycpIHRvIHNlYXJjaCB0aGUgZW50aXJlIGNvbGxlY3Rpb24uXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgcXVlcnlgIFRoZSBxdWVyeSBvYmplY3QuIEZvciBleGFjdCBtYXRjaGluZywgdGhpcyBvYmplY3QgY29udGFpbnMgdGhlIGZpZWxkIG5hbWUgYW5kIGZpZWxkIHZhbHVlIHRvIG1hdGNoLiBGb3IgbWF0Y2hpbmcgYmFzZWQgb24gY29tcGFyaXNvbiwgdGhpcyBvYmplY3QgY29udGFpbnMgdGhlIGZpZWxkIG5hbWUgYW5kIHRoZSBjb21wYXJpc29uIGV4cHJlc3Npb24uIEZvciBtYXRjaGluZyBiYXNlZCBvbiBsb2dpY2FsIG9wZXJhdG9ycywgdGhpcyBvYmplY3QgY29udGFpbnMgYW4gZXhwcmVzc2lvbiB1c2luZyBNb25nb0RCIHN5bnRheC4gU2VlIHRoZSB1bmRlcmx5aW5nIFtEYXRhIEFQSV0oLi4vLi4vLi4vcmVzdF9hcGlzL2RhdGFfYXBpLyNzZWFyY2hpbmcpIGZvciBhZGRpdGlvbmFsIGV4YW1wbGVzLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG91dHB1dE1vZGlmaWVyYCAoT3B0aW9uYWwpIEF2YWlsYWJsZSBmaWVsZHMgaW5jbHVkZTogYHN0YXJ0cmVjb3JkYCwgYGVuZHJlY29yZGAsIGBzb3J0YCwgYW5kIGBkaXJlY3Rpb25gIChgYXNjYCBvciBgZGVzY2ApLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqXG4gICAgICAgICAqL1xuICAgICAgICBxdWVyeTogZnVuY3Rpb24gKGtleSwgcXVlcnksIG91dHB1dE1vZGlmaWVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgcGFyYW1zID0gJC5leHRlbmQodHJ1ZSwgeyBxOiBxdWVyeSB9LCBvdXRwdXRNb2RpZmllcik7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaHR0cE9wdGlvbnMudXJsID0gZ2V0VVJMKGtleSwgaHR0cE9wdGlvbnMucm9vdCk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQocGFyYW1zLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNhdmUgZGF0YSB0byBhbiBhbm9ueW1vdXMgZG9jdW1lbnQgd2l0aGluIHRoZSBjb2xsZWN0aW9uLlxuICAgICAgICAgKlxuICAgICAgICAgKiAoRG9jdW1lbnRzIGFyZSB0b3AtbGV2ZWwgZWxlbWVudHMgd2l0aGluIGEgY29sbGVjdGlvbi4gQ29sbGVjdGlvbnMgbXVzdCBiZSB1bmlxdWUgd2l0aGluIHRoaXMgYWNjb3VudCAodGVhbSBvciBwZXJzb25hbCBhY2NvdW50KSBhbmQgcHJvamVjdCBhbmQgYXJlIHNldCB3aXRoIHRoZSBgcm9vdGAgZmllbGQgaW4gdGhlIGBvcHRpb25gIHBhcmFtZXRlci4gU2VlIHRoZSB1bmRlcmx5aW5nIFtEYXRhIEFQSV0oLi4vLi4vLi4vcmVzdF9hcGlzL2RhdGFfYXBpLykgZm9yIGFkZGl0aW9uYWwgYmFja2dyb3VuZC4pXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgZHMuc2F2ZSgncXVlc3Rpb24xJywgJ3llcycpO1xuICAgICAgICAgKiAgICAgIGRzLnNhdmUoe3F1ZXN0aW9uMToneWVzJywgcXVlc3Rpb24yOiAzMiB9KTtcbiAgICAgICAgICogICAgICBkcy5zYXZlKHsgbmFtZTonSm9obicsIGNsYXNzTmFtZTogJ0NTMTAxJyB9LCB7IHJvb3Q6ICdzdHVkZW50cycgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gYGtleWAgSWYgYGtleWAgaXMgYSBzdHJpbmcsIGl0IGlzIHRoZSBpZCBvZiB0aGUgZWxlbWVudCB0byBzYXZlIChjcmVhdGUpIGluIHRoaXMgZG9jdW1lbnQuIElmIGBrZXlgIGlzIGFuIG9iamVjdCwgdGhlIG9iamVjdCBpcyB0aGUgZGF0YSB0byBzYXZlIChjcmVhdGUpIGluIHRoaXMgZG9jdW1lbnQuIEluIGJvdGggY2FzZXMsIHRoZSBpZCBmb3IgdGhlIGRvY3VtZW50IGlzIGdlbmVyYXRlZCBhdXRvbWF0aWNhbGx5LlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYHZhbHVlYCAoT3B0aW9uYWwpIFRoZSBkYXRhIHRvIHNhdmUuIElmIGBrZXlgIGlzIGEgc3RyaW5nLCB0aGlzIGlzIHRoZSB2YWx1ZSB0byBzYXZlLiBJZiBga2V5YCBpcyBhbiBvYmplY3QsIHRoZSB2YWx1ZShzKSB0byBzYXZlIGFyZSBhbHJlYWR5IHBhcnQgb2YgYGtleWAgYW5kIHRoaXMgYXJndW1lbnQgaXMgbm90IHJlcXVpcmVkLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICBzYXZlOiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGF0dHJzO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgYXR0cnMgPSBrZXk7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAoYXR0cnMgPSB7fSlba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGh0dHBPcHRpb25zLnVybCA9IGdldFVSTCgnJywgaHR0cE9wdGlvbnMucm9vdCk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QoYXR0cnMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2F2ZSBkYXRhIHRvIGEgbmFtZWQgZG9jdW1lbnQgb3IgZWxlbWVudCB3aXRoaW4gdGhlIGNvbGxlY3Rpb24uIFRoZSBgcm9vdGAgb2YgdGhlIGNvbGxlY3Rpb24gbXVzdCBiZSBzcGVjaWZpZWQgc2VwYXJhdGVseSBpbiBjb25maWd1cmF0aW9uIG9wdGlvbnMsIGVpdGhlciBhcyBwYXJ0IG9mIHRoZSBjYWxsIG9yIGFzIHBhcnQgb2YgdGhlIGluaXRpYWxpemF0aW9uIG9mIGRzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAoRG9jdW1lbnRzIGFyZSB0b3AtbGV2ZWwgZWxlbWVudHMgd2l0aGluIGEgY29sbGVjdGlvbi4gQ29sbGVjdGlvbnMgbXVzdCBiZSB1bmlxdWUgd2l0aGluIHRoaXMgYWNjb3VudCAodGVhbSBvciBwZXJzb25hbCBhY2NvdW50KSBhbmQgcHJvamVjdCBhbmQgYXJlIHNldCB3aXRoIHRoZSBgcm9vdGAgZmllbGQgaW4gdGhlIGBvcHRpb25gIHBhcmFtZXRlci4gU2VlIHRoZSB1bmRlcmx5aW5nIFtEYXRhIEFQSV0oLi4vLi4vLi4vcmVzdF9hcGlzL2RhdGFfYXBpLykgZm9yIGFkZGl0aW9uYWwgYmFja2dyb3VuZC4pXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgZHMuc2F2ZUFzKCd1c2VyMScsXG4gICAgICAgICAqICAgICAgICAgIHsgJ3F1ZXN0aW9uMSc6IDIsICdxdWVzdGlvbjInOiAxMCxcbiAgICAgICAgICogICAgICAgICAgICdxdWVzdGlvbjMnOiBmYWxzZSwgJ3F1ZXN0aW9uNCc6ICdzb21ldGltZXMnIH0gKTtcbiAgICAgICAgICogICAgICBkcy5zYXZlQXMoJ3N0dWRlbnQxJyxcbiAgICAgICAgICogICAgICAgICAgeyBmaXJzdE5hbWU6ICdqb2huJywgbGFzdE5hbWU6ICdzbWl0aCcgfSxcbiAgICAgICAgICogICAgICAgICAgeyByb290OiAnc3R1ZGVudHMnIH0pO1xuICAgICAgICAgKiAgICAgIGRzLnNhdmVBcygnbWdtdDEwMC9ncm91cEInLFxuICAgICAgICAgKiAgICAgICAgICB7IHNjZW5hcmlvWWVhcjogJzIwMTUnIH0sXG4gICAgICAgICAqICAgICAgICAgIHsgcm9vdDogJ215Y2xhc3NlcycgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBga2V5YCBJZCBvZiB0aGUgZG9jdW1lbnQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgdmFsdWVgIChPcHRpb25hbCkgVGhlIGRhdGEgdG8gc2F2ZSwgaW4ga2V5OnZhbHVlIHBhaXJzLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICBzYXZlQXM6IGZ1bmN0aW9uIChrZXksIHZhbHVlLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaHR0cE9wdGlvbnMudXJsID0gZ2V0VVJMKGtleSwgaHR0cE9wdGlvbnMucm9vdCk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnB1dCh2YWx1ZSwgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgZGF0YSBmb3IgYSBzcGVjaWZpYyBkb2N1bWVudCBvciBmaWVsZC5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICBkcy5sb2FkKCd1c2VyMScpO1xuICAgICAgICAgKiAgICAgIGRzLmxvYWQoJ3VzZXIxL3F1ZXN0aW9uMycpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd8T2JqZWN0fSBga2V5YCBUaGUgaWQgb2YgdGhlIGRhdGEgdG8gcmV0dXJuLiBDYW4gYmUgdGhlIGlkIG9mIGEgZG9jdW1lbnQsIG9yIGEgcGF0aCB0byBkYXRhIHdpdGhpbiB0aGF0IGRvY3VtZW50LlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG91dHB1dE1vZGlmaWVyYCAoT3B0aW9uYWwpIEF2YWlsYWJsZSBmaWVsZHMgaW5jbHVkZTogYHN0YXJ0cmVjb3JkYCwgYGVuZHJlY29yZGAsIGBzb3J0YCwgYW5kIGBkaXJlY3Rpb25gIChgYXNjYCBvciBgZGVzY2ApLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKGtleSwgb3V0cHV0TW9kaWZpZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBodHRwT3B0aW9ucy51cmwgPSBnZXRVUkwoa2V5LCBodHRwT3B0aW9ucy5yb290KTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChvdXRwdXRNb2RpZmllciwgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmVzIGRhdGEgZnJvbSBjb2xsZWN0aW9uLiBPbmx5IGRvY3VtZW50cyAodG9wLWxldmVsIGVsZW1lbnRzIGluIGVhY2ggY29sbGVjdGlvbikgY2FuIGJlIGRlbGV0ZWQuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICBkcy5yZW1vdmUoJ3VzZXIxJyk7XG4gICAgICAgICAqXG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fSBga2V5c2AgVGhlIGlkIG9mIHRoZSBkb2N1bWVudCB0byByZW1vdmUgZnJvbSB0aGlzIGNvbGxlY3Rpb24sIG9yIGFuIGFycmF5IG9mIHN1Y2ggaWRzLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uIChrZXlzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIHBhcmFtcztcbiAgICAgICAgICAgIGlmICgkLmlzQXJyYXkoa2V5cykpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSB7IGlkOiBrZXlzIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhcmFtcyA9ICcnO1xuICAgICAgICAgICAgICAgIGh0dHBPcHRpb25zLnVybCA9IGdldFVSTChrZXlzLCBodHRwT3B0aW9ucy5yb290KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBodHRwLmRlbGV0ZShwYXJhbXMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEVwaWNlbnRlciBkb2Vzbid0IGFsbG93IG51a2luZyBjb2xsZWN0aW9uc1xuICAgICAgICAvLyAgICAgLyoqXG4gICAgICAgIC8vICAgICAgKiBSZW1vdmVzIGNvbGxlY3Rpb24gYmVpbmcgcmVmZXJlbmNlZFxuICAgICAgICAvLyAgICAgICogQHJldHVybiBudWxsXG4gICAgICAgIC8vICAgICAgKi9cbiAgICAgICAgLy8gICAgIGRlc3Ryb3k6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIC8vICAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlKCcnLCBvcHRpb25zKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG4iLCIvKipcbiAqXG4gKiAjI01lbWJlciBBUEkgQWRhcHRlclxuICpcbiAqIFRoZSBNZW1iZXIgQVBJIEFkYXB0ZXIgcHJvdmlkZXMgbWV0aG9kcyB0byBsb29rIHVwIGluZm9ybWF0aW9uIGFib3V0IGVuZCB1c2VycyBmb3IgeW91ciBwcm9qZWN0IGFuZCBob3cgdGhleSBhcmUgZGl2aWRlZCBhY3Jvc3MgZ3JvdXBzLiBJdCBpcyBiYXNlZCBvbiBxdWVyeSBjYXBhYmlsaXRpZXMgb2YgdGhlIHVuZGVybHlpbmcgUkVTVGZ1bCBbTWVtYmVyIEFQSV0oLi4vLi4vLi4vcmVzdF9hcGlzL3VzZXJfbWFuYWdlbWVudC9tZW1iZXIvKS5cbiAqXG4gKiBUaGlzIGlzIG9ubHkgbmVlZGVkIGZvciBBdXRoZW50aWNhdGVkIHByb2plY3RzLCB0aGF0IGlzLCB0ZWFtIHByb2plY3RzIHdpdGggW2VuZCB1c2VycyBhbmQgZ3JvdXBzXSguLi8uLi8uLi9ncm91cHNfYW5kX2VuZF91c2Vycy8pLiBGb3IgZXhhbXBsZSwgaWYgc29tZSBvZiB5b3VyIGVuZCB1c2VycyBhcmUgZmFjaWxpdGF0b3JzLCBvciBpZiB5b3VyIGVuZCB1c2VycyBzaG91bGQgYmUgdHJlYXRlZCBkaWZmZXJlbnRseSBiYXNlZCBvbiB3aGljaCBncm91cCB0aGV5IGFyZSBpbiwgdXNlIHRoZSBNZW1iZXIgQVBJIHRvIGZpbmQgdGhhdCBpbmZvcm1hdGlvbi5cbiAqXG4gKiAgICAgIHZhciBtYSA9IG5ldyBGLnNlcnZpY2UuTWVtYmVyKHsgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJyB9KTtcbiAqICAgICAgbWEuZ2V0R3JvdXBzRm9yVXNlcih7IHVzZXJJZDogJ2I2YjMxM2EzLWFiODQtNDc5Yy1iYWVhLTIwNmY2YmZmMzM3JyB9KTtcbiAqICAgICAgbWEuZ2V0R3JvdXBEZXRhaWxzKHsgZ3JvdXBJZDogJzAwYjUzMzA4LTk4MzMtNDdmMi1iMjFlLTEyNzhjMDdkNTNiOCcgfSk7XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG52YXIgX3BpY2sgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdC11dGlsJykuX3BpY2s7XG52YXIgYXBpRW5kcG9pbnQgPSAnbWVtYmVyL2xvY2FsJztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRXBpY2VudGVyIHVzZXIgaWQuIERlZmF1bHRzIHRvIGEgYmxhbmsgc3RyaW5nLlxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdXNlcklkOiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRXBpY2VudGVyIGdyb3VwIGlkLiBEZWZhdWx0cyB0byBhIGJsYW5rIHN0cmluZy4gTm90ZSB0aGF0IHRoaXMgaXMgdGhlIGdyb3VwICppZCosIG5vdCB0aGUgZ3JvdXAgKm5hbWUqLlxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZ3JvdXBJZDogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXIuIEFsbCBqcXVlcnkuYWpheCBvcHRpb25zIGF0IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuYWpheC8gYXJlIGF2YWlsYWJsZS4gRGVmYXVsdHMgdG8gZW1wdHkgb2JqZWN0LlxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7fVxuICAgIH07XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCBjb25maWcpO1xuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcblxuICAgIHZhciB0cmFuc3BvcnRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KVxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIHRyYW5zcG9ydE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zLCBzZXJ2aWNlT3B0aW9ucyk7XG5cbiAgICB2YXIgZ2V0RmluYWxQYXJhbXMgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcGFyYW1zID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHNlcnZpY2VPcHRpb25zLCBwYXJhbXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZXJ2aWNlT3B0aW9ucztcbiAgICB9O1xuXG4gICAgdmFyIHBhdGNoVXNlckFjdGl2ZUZpZWxkID0gZnVuY3Rpb24gKHBhcmFtcywgYWN0aXZlLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zLCB7XG4gICAgICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHBhcmFtcy5ncm91cElkICsgJy8nICsgcGFyYW1zLnVzZXJJZFxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gaHR0cC5wYXRjaCh7IGFjdGl2ZTogYWN0aXZlIH0sIGh0dHBPcHRpb25zKTtcbiAgICB9O1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBSZXRyaWV2ZSBkZXRhaWxzIGFib3V0IGFsbCBvZiB0aGUgZ3JvdXAgbWVtYmVyc2hpcHMgZm9yIG9uZSBlbmQgdXNlci4gVGhlIG1lbWJlcnNoaXAgZGV0YWlscyBhcmUgcmV0dXJuZWQgaW4gYW4gYXJyYXksIHdpdGggb25lIGVsZW1lbnQgKGdyb3VwIHJlY29yZCkgZm9yIGVhY2ggZ3JvdXAgdG8gd2hpY2ggdGhlIGVuZCB1c2VyIGJlbG9uZ3MuXG4gICAgICAgICpcbiAgICAgICAgKiBJbiB0aGUgbWVtYmVyc2hpcCBhcnJheSwgZWFjaCBncm91cCByZWNvcmQgaW5jbHVkZXMgdGhlIGdyb3VwIGlkLCBwcm9qZWN0IGlkLCBhY2NvdW50ICh0ZWFtKSBpZCwgYW5kIGFuIGFycmF5IG9mIG1lbWJlcnMuIEhvd2V2ZXIsIG9ubHkgdGhlIHVzZXIgd2hvc2UgdXNlcklkIGlzIGluY2x1ZGVkIGluIHRoZSBjYWxsIGlzIGxpc3RlZCBpbiB0aGUgbWVtYmVycyBhcnJheSAocmVnYXJkbGVzcyBvZiB3aGV0aGVyIHRoZXJlIGFyZSBvdGhlciBtZW1iZXJzIGluIHRoaXMgZ3JvdXApLlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIHZhciBtYSA9IG5ldyBGLnNlcnZpY2UuTWVtYmVyKHsgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJyB9KTtcbiAgICAgICAgKiAgICAgICBtYS5nZXRHcm91cHNGb3JVc2VyKCc0MjgzNmQ0Yi01YjYxLTRmZTQtODBlYi0zMTM2ZTk1NmVlNWMnKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbihtZW1iZXJzaGlwcyl7XG4gICAgICAgICogICAgICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8bWVtYmVyc2hpcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhtZW1iZXJzaGlwc1tpXS5ncm91cElkKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIH1cbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICBtYS5nZXRHcm91cHNGb3JVc2VyKHsgdXNlcklkOiAnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd8b2JqZWN0fSBgcGFyYW1zYCBUaGUgdXNlciBpZCBmb3IgdGhlIGVuZCB1c2VyLiBBbHRlcm5hdGl2ZWx5LCBhbiBvYmplY3Qgd2l0aCBmaWVsZCBgdXNlcklkYCBhbmQgdmFsdWUgdGhlIHVzZXIgaWQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAqL1xuXG4gICAgICAgIGdldEdyb3Vwc0ZvclVzZXI6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIGlzU3RyaW5nID0gdHlwZW9mIHBhcmFtcyA9PT0gJ3N0cmluZyc7XG4gICAgICAgICAgICB2YXIgb2JqUGFyYW1zID0gZ2V0RmluYWxQYXJhbXMocGFyYW1zKTtcbiAgICAgICAgICAgIGlmICghaXNTdHJpbmcgJiYgIW9ialBhcmFtcy51c2VySWQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHVzZXJJZCBzcGVjaWZpZWQuJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBnZXRQYXJtcyA9IGlzU3RyaW5nID8geyB1c2VySWQ6IHBhcmFtcyB9IDogX3BpY2sob2JqUGFyYW1zLCAndXNlcklkJyk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoZ2V0UGFybXMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBSZXRyaWV2ZSBkZXRhaWxzIGFib3V0IG9uZSBncm91cCwgaW5jbHVkaW5nIGFuIGFycmF5IG9mIGFsbCBpdHMgbWVtYmVycy5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICB2YXIgbWEgPSBuZXcgRi5zZXJ2aWNlLk1lbWJlcih7IHRva2VuOiAndXNlci1vci1wcm9qZWN0LWFjY2Vzcy10b2tlbicgfSk7XG4gICAgICAgICogICAgICAgbWEuZ2V0R3JvdXBEZXRhaWxzKCc4MDI1N2EyNS1hYTEwLTQ5NTktOTY4Yi1mZDA1MzkwMWY3MmYnKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbihncm91cCl7XG4gICAgICAgICogICAgICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8Z3JvdXAubWVtYmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAqICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGdyb3VwLm1lbWJlcnNbaV0udXNlck5hbWUpO1xuICAgICAgICAqICAgICAgICAgICAgICAgfVxuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIG1hLmdldEdyb3VwRGV0YWlscyh7IGdyb3VwSWQ6ICc4MDI1N2EyNS1hYTEwLTQ5NTktOTY4Yi1mZDA1MzkwMWY3MmYnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ3xvYmplY3R9IGBwYXJhbXNgIFRoZSBncm91cCBpZC4gQWx0ZXJuYXRpdmVseSwgYW4gb2JqZWN0IHdpdGggZmllbGQgYGdyb3VwSWRgIGFuZCB2YWx1ZSB0aGUgZ3JvdXAgaWQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAqL1xuICAgICAgICBnZXRHcm91cERldGFpbHM6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICAgICAgdmFyIGlzU3RyaW5nID0gdHlwZW9mIHBhcmFtcyA9PT0gJ3N0cmluZyc7XG4gICAgICAgICAgICB2YXIgb2JqUGFyYW1zID0gZ2V0RmluYWxQYXJhbXMocGFyYW1zKTtcbiAgICAgICAgICAgIGlmICghaXNTdHJpbmcgJiYgIW9ialBhcmFtcy5ncm91cElkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBncm91cElkIHNwZWNpZmllZC4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGdyb3VwSWQgPSBpc1N0cmluZyA/IHBhcmFtcyA6IG9ialBhcmFtcy5ncm91cElkO1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgZ3JvdXBJZCB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoe30sIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBTZXQgYSBwYXJ0aWN1bGFyIGVuZCB1c2VyIGFzIGBhY3RpdmVgLiBBY3RpdmUgZW5kIHVzZXJzIGNhbiBiZSBhc3NpZ25lZCB0byBbd29ybGRzXSguLi93b3JsZC1tYW5hZ2VyLykgaW4gbXVsdGlwbGF5ZXIgZ2FtZXMgZHVyaW5nIGF1dG9tYXRpYyBhc3NpZ25tZW50LlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIHZhciBtYSA9IG5ldyBGLnNlcnZpY2UuTWVtYmVyKHsgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJyB9KTtcbiAgICAgICAgKiAgICAgICBtYS5tYWtlVXNlckFjdGl2ZSh7IHVzZXJJZDogJzQyODM2ZDRiLTViNjEtNGZlNC04MGViLTMxMzZlOTU2ZWU1YycsXG4gICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cElkOiAnODAyNTdhMjUtYWExMC00OTU5LTk2OGItZmQwNTM5MDFmNzJmJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBwYXJhbXNgIFRoZSBlbmQgdXNlciBhbmQgZ3JvdXAgaW5mb3JtYXRpb24uXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGBwYXJhbXMudXNlcklkYCBUaGUgaWQgb2YgdGhlIGVuZCB1c2VyIHRvIG1ha2UgYWN0aXZlLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgcGFyYW1zLmdyb3VwSWRgIFRoZSBpZCBvZiB0aGUgZ3JvdXAgdG8gd2hpY2ggdGhpcyBlbmQgdXNlciBiZWxvbmdzLCBhbmQgaW4gd2hpY2ggdGhlIGVuZCB1c2VyIHNob3VsZCBiZWNvbWUgYWN0aXZlLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgKi9cbiAgICAgICAgbWFrZVVzZXJBY3RpdmU6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXRjaFVzZXJBY3RpdmVGaWVsZChwYXJhbXMsIHRydWUsIG9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFNldCBhIHBhcnRpY3VsYXIgZW5kIHVzZXIgYXMgYGluYWN0aXZlYC4gSW5hY3RpdmUgZW5kIHVzZXJzIGFyZSBub3QgYXNzaWduZWQgdG8gW3dvcmxkc10oLi4vd29ybGQtbWFuYWdlci8pIGluIG11bHRpcGxheWVyIGdhbWVzIGR1cmluZyBhdXRvbWF0aWMgYXNzaWdubWVudC5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICB2YXIgbWEgPSBuZXcgRi5zZXJ2aWNlLk1lbWJlcih7IHRva2VuOiAndXNlci1vci1wcm9qZWN0LWFjY2Vzcy10b2tlbicgfSk7XG4gICAgICAgICogICAgICAgbWEubWFrZVVzZXJJbmFjdGl2ZSh7IHVzZXJJZDogJzQyODM2ZDRiLTViNjEtNGZlNC04MGViLTMxMzZlOTU2ZWU1YycsXG4gICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cElkOiAnODAyNTdhMjUtYWExMC00OTU5LTk2OGItZmQwNTM5MDFmNzJmJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBwYXJhbXNgIFRoZSBlbmQgdXNlciBhbmQgZ3JvdXAgaW5mb3JtYXRpb24uXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGBwYXJhbXMudXNlcklkYCBUaGUgaWQgb2YgdGhlIGVuZCB1c2VyIHRvIG1ha2UgaW5hY3RpdmUuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGBwYXJhbXMuZ3JvdXBJZGAgVGhlIGlkIG9mIHRoZSBncm91cCB0byB3aGljaCB0aGlzIGVuZCB1c2VyIGJlbG9uZ3MsIGFuZCBpbiB3aGljaCB0aGUgZW5kIHVzZXIgc2hvdWxkIGJlY29tZSBpbmFjdGl2ZS5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICovXG4gICAgICAgIG1ha2VVc2VySW5hY3RpdmU6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXRjaFVzZXJBY3RpdmVGaWVsZChwYXJhbXMsIGZhbHNlLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIi8qKlxuICpcbiAqICMjUnVuIEFQSSBTZXJ2aWNlXG4gKlxuICogVGhlIFJ1biBBUEkgU2VydmljZSBhbGxvd3MgeW91IHRvIHBlcmZvcm0gY29tbW9uIHRhc2tzIGFyb3VuZCBjcmVhdGluZyBhbmQgdXBkYXRpbmcgcnVucywgdmFyaWFibGVzLCBhbmQgZGF0YS5cbiAqXG4gKiBUbyB1c2UgdGhlIFJ1biBBUEkgU2VydmljZSwgaW5zdGFudGlhdGUgaXQgYnkgcGFzc2luZyBpbjpcbiAqXG4gKiAqIGBhY2NvdW50YDogRXBpY2VudGVyIGFjY291bnQgaWQgKCoqVGVhbSBJRCoqIGZvciB0ZWFtIHByb2plY3RzLCAqKlVzZXIgSUQqKiBmb3IgcGVyc29uYWwgcHJvamVjdHMpLlxuICogKiBgcHJvamVjdGA6IEVwaWNlbnRlciBwcm9qZWN0IGlkLlxuICpcbiAqIEZvciBleGFtcGxlLFxuICpcbiAqICAgICAgdmFyIHJzID0gbmV3IEYuc2VydmljZS5SdW4oe1xuICogICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gKiAgICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gKiAgICAgIH0pO1xuICogICAgICBycy5jcmVhdGUoJ3N1cHBseV9jaGFpbl9nYW1lLnB5JykudGhlbihmdW5jdGlvbihydW4pIHtcbiAqICAgICAgICAgICAgIHJzLmRvKCdzb21lT3BlcmF0aW9uJyk7XG4gKiAgICAgIH0pO1xuICpcbiAqXG4gKiBBZGRpdGlvbmFsbHksIGFsbCBBUEkgY2FsbHMgdGFrZSBpbiBhbiBcIm9wdGlvbnNcIiBvYmplY3QgYXMgdGhlIGxhc3QgcGFyYW1ldGVyLiBUaGUgb3B0aW9ucyBjYW4gYmUgdXNlZCB0byBleHRlbmQvb3ZlcnJpZGUgdGhlIFJ1biBBUEkgU2VydmljZSBkZWZhdWx0cyBsaXN0ZWQgYmVsb3cuXG4gKlxuICogVGhlIFJ1biBBUEkgU2VydmljZSBpcyBtb3N0IHVzZWZ1bCBmb3IgYnVpbGRpbmcgYW4gaW50ZXJmYWNlIGZvciBhIGZhY2lsaXRhdG9yLCBiZWNhdXNlIGl0IG1ha2VzIGl0IGVhc3kgdG8gbGlzdCBkYXRhIGFjcm9zcyBtdWx0aXBsZSBydW5zLiBXaGVuIGJ1aWxkaW5nIGludGVyZmFjZXMgdG8gc2hvdyBydW4gb25lIGF0IGEgdGltZSAoYXMgZm9yIHN0YW5kYXJkIGVuZCB1c2VycyksIHR5cGljYWxseSB5b3UgZmlyc3QgaW5zdGFudGlhdGUgYSBbUnVuIE1hbmFnZXJdKC4uL3J1bi1tYW5hZ2VyLykgYW5kIHRoZW4gYWNjZXNzIHRoZSBSdW4gU2VydmljZSB0aGF0IGlzIGF1dG9tYXRpY2FsbHkgcGFydCBvZiB0aGUgbWFuYWdlciwgcmF0aGVyIHRoYW4gaW5zdGFudGlhdGluZyB0aGUgUnVuIFNlcnZpY2UgZGlyZWN0bHkuXG4gKlxuICogICAgICAgdmFyIHJtID0gbmV3IEYubWFuYWdlci5SdW5NYW5hZ2VyKHtcbiAqICAgICAgICAgICBydW46IHtcbiAqICAgICAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICogICAgICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICogICAgICAgICAgICAgICBtb2RlbDogJ3N1cHBseV9jaGFpbl9nYW1lLnB5J1xuICogICAgICAgICAgIH1cbiAqICAgICAgIH0pO1xuICogICAgICAgcm0uZ2V0UnVuKClcbiAqICAgICAgICAgICAudGhlbihmdW5jdGlvbihydW4pIHtcbiAqICAgICAgICAgICAgICAgLy8gdGhlIFJ1bk1hbmFnZXIucnVuIGNvbnRhaW5zIHRoZSBpbnN0YW50aWF0ZWQgUnVuIFNlcnZpY2UsXG4gKiAgICAgICAgICAgICAgIC8vIHNvIGFueSBSdW4gU2VydmljZSBtZXRob2QgaXMgdmFsaWQgaGVyZVxuICogICAgICAgICAgICAgICB2YXIgcnMgPSBybS5ydW47XG4gKiAgICAgICAgICAgICAgIHJzLmRvKCdzb21lT3BlcmF0aW9uJyk7XG4gKiAgICAgICB9KVxuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBTdG9yYWdlRmFjdG9yeSA9IHJlcXVpcmUoJy4uL3N0b3JlL3N0b3JlLWZhY3RvcnknKTtcbnZhciBxdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvcXVlcnktdXRpbCcpO1xudmFyIHJ1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9ydW4tdXRpbCcpO1xudmFyIF9waWNrID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QtdXRpbCcpLl9waWNrO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xudmFyIFZhcmlhYmxlc1NlcnZpY2UgPSByZXF1aXJlKCcuL3ZhcmlhYmxlcy1hcGktc2VydmljZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAvLyBjb25maWcgfHwgKGNvbmZpZyA9IGNvbmZpZ1NlcnZpY2UuZ2V0KCkpO1xuICAgIHZhciBzdG9yZSA9IG5ldyBTdG9yYWdlRmFjdG9yeSh7IHN5bmNocm9ub3VzOiB0cnVlIH0pO1xuXG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRm9yIHByb2plY3RzIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZykuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdG9rZW46IHN0b3JlLmdldCgnZXBpY2VudGVyLnByb2plY3QudG9rZW4nKSB8fCAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGFjY291bnQgaWQuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuIERlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcHJvamVjdCBpZC4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcHJvamVjdDogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyaXRlcmlhIGJ5IHdoaWNoIHRvIGZpbHRlciBydW5zLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmaWx0ZXI6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb252ZW5pZW5jZSBhbGlhcyBmb3IgZmlsdGVyLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgaWQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGbGFnIGRldGVybWluZXMgaWYgYFgtQXV0b1Jlc3RvcmU6IHRydWVgIGhlYWRlciBpcyBzZW50IHRvIEVwaWNlbnRlci4gRGVmYXVsdHMgdG8gYHRydWVgLlxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIGF1dG9SZXN0b3JlOiB0cnVlLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsZWQgd2hlbiB0aGUgY2FsbCBjb21wbGV0ZXMgc3VjY2Vzc2Z1bGx5LiBEZWZhdWx0cyB0byBgJC5ub29wYC5cbiAgICAgICAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgICAgICAgKi9cbiAgICAgICAgc3VjY2VzczogJC5ub29wLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsZWQgd2hlbiB0aGUgY2FsbCBmYWlscy4gRGVmYXVsdHMgdG8gYCQubm9vcGAuXG4gICAgICAgICAqIEB0eXBlIHtmdW5jdGlvbn1cbiAgICAgICAgICovXG4gICAgICAgIGVycm9yOiAkLm5vb3AsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXIuIEFsbCBqcXVlcnkuYWpheCBvcHRpb25zIGF0IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuYWpheC8gYXJlIGF2YWlsYWJsZS4gRGVmYXVsdHMgdG8gZW1wdHkgb2JqZWN0LlxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7fVxuICAgIH07XG5cbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLmlkKSB7XG4gICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IHNlcnZpY2VPcHRpb25zLmlkO1xuICAgIH1cblxuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICB1cmxDb25maWcuYWNjb3VudFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5hY2NvdW50O1xuICAgIH1cbiAgICBpZiAoc2VydmljZU9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICB1cmxDb25maWcucHJvamVjdFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0O1xuICAgIH1cblxuICAgIHVybENvbmZpZy5maWx0ZXIgPSAnOyc7XG4gICAgdXJsQ29uZmlnLmdldEZpbHRlclVSTCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHVybCA9IHVybENvbmZpZy5nZXRBUElQYXRoKCdydW4nKTtcbiAgICAgICAgdmFyIGZpbHRlciA9IHF1dGlsLnRvTWF0cml4Rm9ybWF0KHNlcnZpY2VPcHRpb25zLmZpbHRlcik7XG5cbiAgICAgICAgaWYgKGZpbHRlcikge1xuICAgICAgICAgICAgdXJsICs9IGZpbHRlciArICcvJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH07XG5cbiAgICB1cmxDb25maWcuYWRkQXV0b1Jlc3RvcmVIZWFkZXIgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgZmlsdGVyID0gc2VydmljZU9wdGlvbnMuZmlsdGVyO1xuICAgICAgICAvLyBUaGUgc2VtaWNvbG9uIHNlcGFyYXRlZCBmaWx0ZXIgaXMgdXNlZCB3aGVuIGZpbHRlciBpcyBhbiBvYmplY3RcbiAgICAgICAgdmFyIGlzRmlsdGVyUnVuSWQgPSBmaWx0ZXIgJiYgJC50eXBlKGZpbHRlcikgPT09ICdzdHJpbmcnO1xuICAgICAgICBpZiAoc2VydmljZU9wdGlvbnMuYXV0b1Jlc3RvcmUgJiYgaXNGaWx0ZXJSdW5JZCkge1xuICAgICAgICAgICAgLy8gQnkgZGVmYXVsdCBhdXRvcmVwbGF5IHRoZSBydW4gYnkgc2VuZGluZyB0aGlzIGhlYWRlciB0byBlcGljZW50ZXJcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZm9yaW8uY29tL2VwaWNlbnRlci9kb2NzL3B1YmxpYy9yZXN0X2FwaXMvYWdncmVnYXRlX3J1bl9hcGkvI3JldHJpZXZpbmdcbiAgICAgICAgICAgIHZhciBhdXRvcmVzdG9yZU9wdHMgPSB7XG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAnWC1BdXRvUmVzdG9yZSc6IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIGF1dG9yZXN0b3JlT3B0cywgb3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3B0aW9ucztcbiAgICB9O1xuXG4gICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRGaWx0ZXJVUkxcbiAgICB9KTtcblxuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy50b2tlbikge1xuICAgICAgICBodHRwT3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBzZXJ2aWNlT3B0aW9ucy50b2tlblxuICAgICAgICB9O1xuICAgIH1cbiAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KGh0dHBPcHRpb25zKTtcbiAgICBodHRwLnNwbGl0R2V0ID0gcnV0aWwuc3BsaXRHZXRGYWN0b3J5KGh0dHBPcHRpb25zKTtcblxuICAgIHZhciBzZXRGaWx0ZXJPclRocm93RXJyb3IgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucy5pZCkge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gb3B0aW9ucy5pZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5maWx0ZXIpIHtcbiAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IG9wdGlvbnMuZmlsdGVyO1xuICAgICAgICB9XG4gICAgICAgIGlmICghc2VydmljZU9wdGlvbnMuZmlsdGVyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGZpbHRlciBzcGVjaWZpZWQgdG8gYXBwbHkgb3BlcmF0aW9ucyBhZ2FpbnN0Jyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHB1YmxpY0FzeW5jQVBJID0ge1xuICAgICAgICB1cmxDb25maWc6IHVybENvbmZpZyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlIGEgbmV3IHJ1bi5cbiAgICAgICAgICpcbiAgICAgICAgICogTk9URTogVHlwaWNhbGx5IHRoaXMgaXMgbm90IHVzZWQhIFVzZSBgUnVuTWFuYWdlci5nZXRSdW4oKWAgd2l0aCBhIGBzdHJhdGVneWAgb2YgYGFsd2F5cy1uZXdgLCBvciB1c2UgYFJ1bk1hbmFnZXIucmVzZXQoKWAuIFNlZSBbUnVuIE1hbmFnZXJdKC4uL3J1bi1tYW5hZ2VyLykgZm9yIG1vcmUgZGV0YWlscy5cbiAgICAgICAgICpcbiAgICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgcnMuY3JlYXRlKCdoZWxsb193b3JsZC5qbCcpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBgcGFyYW1zYCBJZiBhIHN0cmluZywgdGhlIG5hbWUgb2YgdGhlIHByaW1hcnkgW21vZGVsIGZpbGVdKC4uLy4uLy4uL3dyaXRpbmdfeW91cl9tb2RlbC8pLiBUaGlzIGlzIHRoZSBvbmUgZmlsZSBpbiB0aGUgcHJvamVjdCB0aGF0IGV4cGxpY2l0bHkgZXhwb3NlcyB2YXJpYWJsZXMgYW5kIG1ldGhvZHMsIGFuZCBpdCBtdXN0IGJlIHN0b3JlZCBpbiB0aGUgTW9kZWwgZm9sZGVyIG9mIHlvdXIgRXBpY2VudGVyIHByb2plY3QuIElmIGFuIG9iamVjdCwgbWF5IGluY2x1ZGUgYG1vZGVsYCwgYHNjb3BlYCwgYW5kIGBmaWxlc2AuIChTZWUgdGhlIFtSdW4gTWFuYWdlcl0oLi4vcnVuX21hbmFnZXIvKSBmb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiBgc2NvcGVgIGFuZCBgZmlsZXNgLilcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKlxuICAgICAgICAgKi9cbiAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgY3JlYXRlT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucywgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKCdydW4nKSB9KTtcbiAgICAgICAgICAgIHZhciBydW5BcGlQYXJhbXMgPSBbJ21vZGVsJywgJ3Njb3BlJywgJ2ZpbGVzJ107XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIGp1c3QgdGhlIG1vZGVsIG5hbWVcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSB7IG1vZGVsOiBwYXJhbXMgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gd2hpdGVsaXN0IHRoZSBmaWVsZHMgdGhhdCB3ZSBhY3R1YWxseSBjYW4gc2VuZCB0byB0aGUgYXBpXG4gICAgICAgICAgICAgICAgcGFyYW1zID0gX3BpY2socGFyYW1zLCBydW5BcGlQYXJhbXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgb2xkU3VjY2VzcyA9IGNyZWF0ZU9wdGlvbnMuc3VjY2VzcztcbiAgICAgICAgICAgIGNyZWF0ZU9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IHJlc3BvbnNlLmlkOyAvL2FsbCBmdXR1cmUgY2hhaW5lZCBjYWxscyB0byBvcGVyYXRlIG9uIHRoaXMgaWRcbiAgICAgICAgICAgICAgICByZXR1cm4gb2xkU3VjY2Vzcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChwYXJhbXMsIGNyZWF0ZU9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIHBhcnRpY3VsYXIgcnVucywgYmFzZWQgb24gY29uZGl0aW9ucyBzcGVjaWZpZWQgaW4gdGhlIGBxc2Agb2JqZWN0LlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgZWxlbWVudHMgb2YgdGhlIGBxc2Agb2JqZWN0IGFyZSBBTkRlZCB0b2dldGhlciB3aXRoaW4gYSBzaW5nbGUgY2FsbCB0byBgLnF1ZXJ5KClgLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIHJldHVybnMgcnVucyB3aXRoIHNhdmVkID0gdHJ1ZSBhbmQgdmFyaWFibGVzLnByaWNlID4gMSxcbiAgICAgICAgICogICAgICAvLyB3aGVyZSB2YXJpYWJsZXMucHJpY2UgaGFzIGJlZW4gcGVyc2lzdGVkIChyZWNvcmRlZClcbiAgICAgICAgICogICAgICAvLyBpbiB0aGUgbW9kZWwuXG4gICAgICAgICAqICAgICBycy5xdWVyeSh7XG4gICAgICAgICAqICAgICAgICAgICdzYXZlZCc6ICd0cnVlJyxcbiAgICAgICAgICogICAgICAgICAgJy5wcmljZSc6ICc+MSdcbiAgICAgICAgICogICAgICAgfSxcbiAgICAgICAgICogICAgICAge1xuICAgICAgICAgKiAgICAgICAgICBzdGFydHJlY29yZDogMixcbiAgICAgICAgICogICAgICAgICAgZW5kcmVjb3JkOiA1XG4gICAgICAgICAqICAgICAgIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYHFzYCBRdWVyeSBvYmplY3QuIEVhY2gga2V5IGNhbiBiZSBhIHByb3BlcnR5IG9mIHRoZSBydW4gb3IgdGhlIG5hbWUgb2YgdmFyaWFibGUgdGhhdCBoYXMgYmVlbiBzYXZlZCBpbiB0aGUgcnVuIChwcmVmYWNlZCBieSBgdmFyaWFibGVzLmApLiBFYWNoIHZhbHVlIGNhbiBiZSBhIGxpdGVyYWwgdmFsdWUsIG9yIGEgY29tcGFyaXNvbiBvcGVyYXRvciBhbmQgdmFsdWUuIChTZWUgW21vcmUgb24gZmlsdGVyaW5nXSguLi8uLi8uLi9yZXN0X2FwaXMvYWdncmVnYXRlX3J1bl9hcGkvI2ZpbHRlcnMpIGFsbG93ZWQgaW4gdGhlIHVuZGVybHlpbmcgUnVuIEFQSS4pIFF1ZXJ5aW5nIGZvciB2YXJpYWJsZXMgaXMgYXZhaWxhYmxlIGZvciBydW5zIFtpbiBtZW1vcnldKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpIGFuZCBmb3IgcnVucyBbaW4gdGhlIGRhdGFiYXNlXSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KSBpZiB0aGUgdmFyaWFibGVzIGFyZSBwZXJzaXN0ZWQgKGUuZy4gdGhhdCBoYXZlIGJlZW4gYHJlY29yZGBlZCBpbiB5b3VyIEp1bGlhIG1vZGVsKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvdXRwdXRNb2RpZmllcmAgKE9wdGlvbmFsKSBBdmFpbGFibGUgZmllbGRzIGluY2x1ZGU6IGBzdGFydHJlY29yZGAsIGBlbmRyZWNvcmRgLCBgc29ydGAsIGFuZCBgZGlyZWN0aW9uYCAoYGFzY2Agb3IgYGRlc2NgKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgcXVlcnk6IGZ1bmN0aW9uIChxcywgb3V0cHV0TW9kaWZpZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IHFzOyAvL3Nob3VsZG4ndCBiZSBhYmxlIHRvIG92ZXItcmlkZVxuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGh0dHBPcHRpb25zID0gdXJsQ29uZmlnLmFkZEF1dG9SZXN0b3JlSGVhZGVyKGh0dHBPcHRpb25zKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAuc3BsaXRHZXQob3V0cHV0TW9kaWZpZXIsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyBwYXJ0aWN1bGFyIHJ1bnMsIGJhc2VkIG9uIGNvbmRpdGlvbnMgc3BlY2lmaWVkIGluIHRoZSBgcXNgIG9iamVjdC5cbiAgICAgICAgICpcbiAgICAgICAgICogU2ltaWxhciB0byBgLnF1ZXJ5KClgLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYGZpbHRlcmAgRmlsdGVyIG9iamVjdC4gRWFjaCBrZXkgY2FuIGJlIGEgcHJvcGVydHkgb2YgdGhlIHJ1biBvciB0aGUgbmFtZSBvZiB2YXJpYWJsZSB0aGF0IGhhcyBiZWVuIHNhdmVkIGluIHRoZSBydW4gKHByZWZhY2VkIGJ5IGB2YXJpYWJsZXMuYCkuIEVhY2ggdmFsdWUgY2FuIGJlIGEgbGl0ZXJhbCB2YWx1ZSwgb3IgYSBjb21wYXJpc29uIG9wZXJhdG9yIGFuZCB2YWx1ZS4gKFNlZSBbbW9yZSBvbiBmaWx0ZXJpbmddKC4uLy4uLy4uL3Jlc3RfYXBpcy9hZ2dyZWdhdGVfcnVuX2FwaS8jZmlsdGVycykgYWxsb3dlZCBpbiB0aGUgdW5kZXJseWluZyBSdW4gQVBJLikgRmlsdGVyaW5nIGZvciB2YXJpYWJsZXMgaXMgYXZhaWxhYmxlIGZvciBydW5zIFtpbiBtZW1vcnldKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpIGFuZCBmb3IgcnVucyBbaW4gdGhlIGRhdGFiYXNlXSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KSBpZiB0aGUgdmFyaWFibGVzIGFyZSBwZXJzaXN0ZWQgKGUuZy4gdGhhdCBoYXZlIGJlZW4gYHJlY29yZGBlZCBpbiB5b3VyIEp1bGlhIG1vZGVsKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvdXRwdXRNb2RpZmllcmAgKE9wdGlvbmFsKSBBdmFpbGFibGUgZmllbGRzIGluY2x1ZGU6IGBzdGFydHJlY29yZGAsIGBlbmRyZWNvcmRgLCBgc29ydGAsIGFuZCBgZGlyZWN0aW9uYCAoYGFzY2Agb3IgYGRlc2NgKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgZmlsdGVyOiBmdW5jdGlvbiAoZmlsdGVyLCBvdXRwdXRNb2RpZmllciwgb3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdChzZXJ2aWNlT3B0aW9ucy5maWx0ZXIpKSB7XG4gICAgICAgICAgICAgICAgJC5leHRlbmQoc2VydmljZU9wdGlvbnMuZmlsdGVyLCBmaWx0ZXIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSBmaWx0ZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaHR0cE9wdGlvbnMgPSB1cmxDb25maWcuYWRkQXV0b1Jlc3RvcmVIZWFkZXIoaHR0cE9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuc3BsaXRHZXQob3V0cHV0TW9kaWZpZXIsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IGRhdGEgZm9yIGEgc3BlY2lmaWMgcnVuLiBUaGlzIGluY2x1ZGVzIHN0YW5kYXJkIHJ1biBkYXRhIHN1Y2ggYXMgdGhlIGFjY291bnQsIG1vZGVsLCBwcm9qZWN0LCBhbmQgY3JlYXRlZCBhbmQgbGFzdCBtb2RpZmllZCBkYXRlcy4gVG8gcmVxdWVzdCBzcGVjaWZpYyBtb2RlbCB2YXJpYWJsZXMsIHBhc3MgdGhlbSBhcyBwYXJ0IG9mIHRoZSBgZmlsdGVyc2AgcGFyYW1ldGVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBOb3RlIHRoYXQgaWYgdGhlIHJ1biBpcyBbaW4gbWVtb3J5XSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KSwgYW55IG1vZGVsIHZhcmlhYmxlcyBhcmUgYXZhaWxhYmxlOyBpZiB0aGUgcnVuIGlzIFtpbiB0aGUgZGF0YWJhc2VdKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1kYiksIG9ubHkgbW9kZWwgdmFyaWFibGVzIHRoYXQgaGF2ZSBiZWVuIHBlcnNpc3RlZCAmbWRhc2g7IHRoYXQgaXMsIGByZWNvcmRgZWQgaW4geW91ciBKdWxpYSBtb2RlbCAmbWRhc2g7IGFyZSBhdmFpbGFibGUuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICBycy5sb2FkKCdiYjU4OTY3Ny1kNDc2LTQ5NzEtYTY4ZS0wYzU4ZDE5MWU0NTAnLCB7IGluY2x1ZGU6IFsnLnByaWNlJywgJy5zYWxlcyddIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gYHJ1bklEYCBUaGUgcnVuIGlkLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYGZpbHRlcnNgIChPcHRpb25hbCkgT2JqZWN0IGNvbnRhaW5pbmcgZmlsdGVycyBhbmQgb3BlcmF0aW9uIG1vZGlmaWVycy4gVXNlIGtleSBgaW5jbHVkZWAgdG8gbGlzdCBtb2RlbCB2YXJpYWJsZXMgdGhhdCB5b3Ugd2FudCB0byBpbmNsdWRlIGluIHRoZSByZXNwb25zZS4gT3RoZXIgYXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIGxvYWQ6IGZ1bmN0aW9uIChydW5JRCwgZmlsdGVycywgb3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKHJ1bklEKSB7XG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gcnVuSUQ7IC8vc2hvdWxkbid0IGJlIGFibGUgdG8gb3Zlci1yaWRlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaHR0cE9wdGlvbnMgPSB1cmxDb25maWcuYWRkQXV0b1Jlc3RvcmVIZWFkZXIoaHR0cE9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KGZpbHRlcnMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTYXZlIGF0dHJpYnV0ZXMgKGRhdGEsIG1vZGVsIHZhcmlhYmxlcykgb2YgdGhlIHJ1bi5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlcyoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBhZGQgJ2NvbXBsZXRlZCcgZmllbGQgdG8gcnVuIHJlY29yZFxuICAgICAgICAgKiAgICAgcnMuc2F2ZSh7IGNvbXBsZXRlZDogdHJ1ZSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHVwZGF0ZSAnc2F2ZWQnIGZpZWxkIG9mIHJ1biByZWNvcmQsIGFuZCB1cGRhdGUgdmFsdWVzIG9mIG1vZGVsIHZhcmlhYmxlcyBmb3IgdGhpcyBydW5cbiAgICAgICAgICogICAgIHJzLnNhdmUoeyBzYXZlZDogdHJ1ZSwgdmFyaWFibGVzOiB7IGE6IDIzLCBiOiAyMyB9IH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYGF0dHJpYnV0ZXNgIFRoZSBydW4gZGF0YSBhbmQgdmFyaWFibGVzIHRvIHNhdmUuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgYXR0cmlidXRlcy52YXJpYWJsZXNgIE1vZGVsIHZhcmlhYmxlcyBtdXN0IGJlIGluY2x1ZGVkIGluIGEgYHZhcmlhYmxlc2AgZmllbGQgd2l0aGluIHRoZSBgYXR0cmlidXRlc2Agb2JqZWN0LiAoT3RoZXJ3aXNlIHRoZXkgYXJlIHRyZWF0ZWQgYXMgcnVuIGRhdGEgYW5kIGFkZGVkIHRvIHRoZSBydW4gcmVjb3JkIGRpcmVjdGx5LilcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgc2F2ZTogZnVuY3Rpb24gKGF0dHJpYnV0ZXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBzZXRGaWx0ZXJPclRocm93RXJyb3IoaHR0cE9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAucGF0Y2goYXR0cmlidXRlcywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsIGEgbWV0aG9kIGZyb20gdGhlIG1vZGVsLlxuICAgICAgICAgKlxuICAgICAgICAgKiBEZXBlbmRpbmcgb24gdGhlIGxhbmd1YWdlIGluIHdoaWNoIHlvdSBoYXZlIHdyaXR0ZW4geW91ciBtb2RlbCwgdGhlIG1ldGhvZCBtYXkgbmVlZCB0byBiZSBleHBvc2VkIChlLmcuIGBleHBvcnRgIGZvciBhIEp1bGlhIG1vZGVsKSBpbiB0aGUgbW9kZWwgZmlsZSBpbiBvcmRlciB0byBiZSBjYWxsZWQgdGhyb3VnaCB0aGUgQVBJLiBTZWUgW1dyaXRpbmcgeW91ciBNb2RlbF0oLi4vLi4vLi4vd3JpdGluZ195b3VyX21vZGVsLykpLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgYHBhcmFtc2AgYXJndW1lbnQgaXMgbm9ybWFsbHkgYW4gYXJyYXkgb2YgYXJndW1lbnRzIHRvIHRoZSBgb3BlcmF0aW9uYC4gSW4gdGhlIHNwZWNpYWwgY2FzZSB3aGVyZSBgb3BlcmF0aW9uYCBvbmx5IHRha2VzIG9uZSBhcmd1bWVudCwgeW91IGFyZSBub3QgcmVxdWlyZWQgdG8gcHV0IHRoYXQgYXJndW1lbnQgaW50byBhbiBhcnJheS5cbiAgICAgICAgICpcbiAgICAgICAgICogTm90ZSB0aGF0IHlvdSBjYW4gY29tYmluZSB0aGUgYG9wZXJhdGlvbmAgYW5kIGBwYXJhbXNgIGFyZ3VtZW50cyBpbnRvIGEgc2luZ2xlIG9iamVjdCBpZiB5b3UgcHJlZmVyLCBhcyBpbiB0aGUgbGFzdCBleGFtcGxlLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGVzKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyBtZXRob2QgXCJzb2x2ZVwiIHRha2VzIG5vIGFyZ3VtZW50c1xuICAgICAgICAgKiAgICAgcnMuZG8oJ3NvbHZlJyk7XG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kIFwiZWNob1wiIHRha2VzIG9uZSBhcmd1bWVudCwgYSBzdHJpbmdcbiAgICAgICAgICogICAgIHJzLmRvKCdlY2hvJywgWydoZWxsbyddKTtcbiAgICAgICAgICogICAgICAvLyBtZXRob2QgXCJlY2hvXCIgdGFrZXMgb25lIGFyZ3VtZW50LCBhIHN0cmluZ1xuICAgICAgICAgKiAgICAgcnMuZG8oJ2VjaG8nLCAnaGVsbG8nKTtcbiAgICAgICAgICogICAgICAvLyBtZXRob2QgXCJzdW1BcnJheVwiIHRha2VzIG9uZSBhcmd1bWVudCwgYW4gYXJyYXlcbiAgICAgICAgICogICAgIHJzLmRvKCdzdW1BcnJheScsIFtbNCwyLDFdXSk7XG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kIFwiYWRkXCIgdGFrZXMgdHdvIGFyZ3VtZW50cywgYm90aCBpbnRlZ2Vyc1xuICAgICAgICAgKiAgICAgcnMuZG8oeyBuYW1lOidhZGQnLCBwYXJhbXM6WzIsNF0gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBgb3BlcmF0aW9uYCBOYW1lIG9mIG1ldGhvZC5cbiAgICAgICAgICogQHBhcmFtIHtBcnJheX0gYHBhcmFtc2AgKE9wdGlvbmFsKSBBbnkgcGFyYW1ldGVycyB0aGUgb3BlcmF0aW9uIHRha2VzLCBwYXNzZWQgYXMgYW4gYXJyYXkuIEluIHRoZSBzcGVjaWFsIGNhc2Ugd2hlcmUgYG9wZXJhdGlvbmAgb25seSB0YWtlcyBvbmUgYXJndW1lbnQsIHlvdSBhcmUgbm90IHJlcXVpcmVkIHRvIHB1dCB0aGF0IGFyZ3VtZW50IGludG8gYW4gYXJyYXksIGFuZCBjYW4ganVzdCBwYXNzIGl0IGRpcmVjdGx5LlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICBkbzogZnVuY3Rpb24gKG9wZXJhdGlvbiwgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZG8nLCBvcGVyYXRpb24sIHBhcmFtcyk7XG4gICAgICAgICAgICB2YXIgb3BzQXJncztcbiAgICAgICAgICAgIHZhciBwb3N0T3B0aW9ucztcbiAgICAgICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgb3BzQXJncyA9IHBhcmFtcztcbiAgICAgICAgICAgICAgICBwb3N0T3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3QocGFyYW1zKSkge1xuICAgICAgICAgICAgICAgICAgICBvcHNBcmdzID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgcG9zdE9wdGlvbnMgPSBwYXJhbXM7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3BzQXJncyA9IHBhcmFtcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gcnV0aWwubm9ybWFsaXplT3BlcmF0aW9ucyhvcGVyYXRpb24sIG9wc0FyZ3MpO1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBwb3N0T3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHNldEZpbHRlck9yVGhyb3dFcnJvcihodHRwT3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBwcm1zID0gKHJlc3VsdC5hcmdzWzBdLmxlbmd0aCAmJiAocmVzdWx0LmFyZ3NbMF0gIT09IG51bGwgJiYgcmVzdWx0LmFyZ3NbMF0gIT09IHVuZGVmaW5lZCkpID8gcmVzdWx0LmFyZ3NbMF0gOiBbXTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QoeyBhcmd1bWVudHM6IHBybXMgfSwgJC5leHRlbmQodHJ1ZSwge30sIGh0dHBPcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0RmlsdGVyVVJMKCkgKyAnb3BlcmF0aW9ucy8nICsgcmVzdWx0Lm9wc1swXSArICcvJ1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsIHNldmVyYWwgbWV0aG9kcyBmcm9tIHRoZSBtb2RlbCwgc2VxdWVudGlhbGx5LlxuICAgICAgICAgKlxuICAgICAgICAgKiBEZXBlbmRpbmcgb24gdGhlIGxhbmd1YWdlIGluIHdoaWNoIHlvdSBoYXZlIHdyaXR0ZW4geW91ciBtb2RlbCwgdGhlIG1ldGhvZHMgbWF5IG5lZWQgdG8gYmUgZXhwb3NlZCAoZS5nLiBgZXhwb3J0YCBmb3IgYSBKdWxpYSBtb2RlbCkgaW4gdGhlIG1vZGVsIGZpbGUgaW4gb3JkZXIgdG8gYmUgY2FsbGVkIHRocm91Z2ggdGhlIEFQSS4gU2VlIFtXcml0aW5nIHlvdXIgTW9kZWxdKC4uLy4uLy4uL3dyaXRpbmdfeW91cl9tb2RlbC8pKS5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlcyoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kcyBcImluaXRpYWxpemVcIiBhbmQgXCJzb2x2ZVwiIGRvIG5vdCB0YWtlIGFueSBhcmd1bWVudHNcbiAgICAgICAgICogICAgIHJzLnNlcmlhbChbJ2luaXRpYWxpemUnLCAnc29sdmUnXSk7XG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kcyBcImluaXRcIiBhbmQgXCJyZXNldFwiIHRha2UgdHdvIGFyZ3VtZW50cyBlYWNoXG4gICAgICAgICAqICAgICBycy5zZXJpYWwoWyAgeyBuYW1lOiAnaW5pdCcsIHBhcmFtczogWzEsMl0gfSxcbiAgICAgICAgICogICAgICAgICAgICAgICAgICB7IG5hbWU6ICdyZXNldCcsIHBhcmFtczogWzIsM10gfV0pO1xuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZCBcImluaXRcIiB0YWtlcyB0d28gYXJndW1lbnRzLFxuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZCBcInJ1bm1vZGVsXCIgdGFrZXMgbm9uZVxuICAgICAgICAgKiAgICAgcnMuc2VyaWFsKFsgIHsgbmFtZTogJ2luaXQnLCBwYXJhbXM6IFsxLDJdIH0sXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgeyBuYW1lOiAncnVubW9kZWwnLCBwYXJhbXM6IFtdIH1dKTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtBcnJheX0gYG9wZXJhdGlvbnNgIElmIG5vbmUgb2YgdGhlIG1ldGhvZHMgdGFrZSBwYXJhbWV0ZXJzLCBwYXNzIGFuIGFycmF5IG9mIHRoZSBtZXRob2QgbmFtZXMgKHN0cmluZ3MpLiBJZiBhbnkgb2YgdGhlIG1ldGhvZHMgZG8gdGFrZSBwYXJhbWV0ZXJzLCBwYXNzIGFuIGFycmF5IG9mIG9iamVjdHMsIGVhY2ggb2Ygd2hpY2ggY29udGFpbnMgYSBtZXRob2QgbmFtZSBhbmQgaXRzIG93biAocG9zc2libHkgZW1wdHkpIGFycmF5IG9mIHBhcmFtZXRlcnMuXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gYHBhcmFtc2AgUGFyYW1ldGVycyB0byBwYXNzIHRvIG9wZXJhdGlvbnMuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIHNlcmlhbDogZnVuY3Rpb24gKG9wZXJhdGlvbnMsIHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIG9wUGFyYW1zID0gcnV0aWwubm9ybWFsaXplT3BlcmF0aW9ucyhvcGVyYXRpb25zLCBwYXJhbXMpO1xuICAgICAgICAgICAgdmFyIG9wcyA9IG9wUGFyYW1zLm9wcztcbiAgICAgICAgICAgIHZhciBhcmdzID0gb3BQYXJhbXMuYXJncztcbiAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG5cbiAgICAgICAgICAgIHZhciAkZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgICAgIHZhciBwb3N0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBkb1NpbmdsZU9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBvcCA9IG9wcy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgIHZhciBhcmcgPSBhcmdzLnNoaWZ0KCk7XG5cbiAgICAgICAgICAgICAgICBtZS5kbyhvcCwgYXJnLCB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9TaW5nbGVPcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZC5yZXNvbHZlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zdE9wdGlvbnMuc3VjY2Vzcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGQucmVqZWN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0T3B0aW9ucy5lcnJvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBkb1NpbmdsZU9wKCk7XG5cbiAgICAgICAgICAgIHJldHVybiAkZC5wcm9taXNlKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGwgc2V2ZXJhbCBtZXRob2RzIGZyb20gdGhlIG1vZGVsLCBleGVjdXRpbmcgdGhlbSBpbiBwYXJhbGxlbC5cbiAgICAgICAgICpcbiAgICAgICAgICogRGVwZW5kaW5nIG9uIHRoZSBsYW5ndWFnZSBpbiB3aGljaCB5b3UgaGF2ZSB3cml0dGVuIHlvdXIgbW9kZWwsIHRoZSBtZXRob2RzIG1heSBuZWVkIHRvIGJlIGV4cG9zZWQgKGUuZy4gYGV4cG9ydGAgZm9yIGEgSnVsaWEgbW9kZWwpIGluIHRoZSBtb2RlbCBmaWxlIGluIG9yZGVyIHRvIGJlIGNhbGxlZCB0aHJvdWdoIHRoZSBBUEkuIFNlZSBbV3JpdGluZyB5b3VyIE1vZGVsXSguLi8uLi8uLi93cml0aW5nX3lvdXJfbW9kZWwvKSkuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kcyBcInNvbHZlXCIgYW5kIFwicmVzZXRcIiBkbyBub3QgdGFrZSBhbnkgYXJndW1lbnRzXG4gICAgICAgICAqICAgICBycy5wYXJhbGxlbChbJ3NvbHZlJywgJ3Jlc2V0J10pO1xuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZHMgXCJhZGRcIiBhbmQgXCJzdWJ0cmFjdFwiIHRha2UgdHdvIGFyZ3VtZW50cyBlYWNoXG4gICAgICAgICAqICAgICBycy5wYXJhbGxlbChbIHsgbmFtZTogJ2FkZCcsIHBhcmFtczogWzEsMl0gfSxcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnc3VidHJhY3QnLCBwYXJhbXM6WzIsM10gfV0pO1xuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZHMgXCJhZGRcIiBhbmQgXCJzdWJ0cmFjdFwiIHRha2UgdHdvIGFyZ3VtZW50cyBlYWNoXG4gICAgICAgICAqICAgICBycy5wYXJhbGxlbCh7IGFkZDogWzEsMl0sIHN1YnRyYWN0OiBbMiw0XSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R9IGBvcGVyYXRpb25zYCBJZiBub25lIG9mIHRoZSBtZXRob2RzIHRha2UgcGFyYW1ldGVycywgcGFzcyBhbiBhcnJheSBvZiB0aGUgbWV0aG9kIG5hbWVzIChhcyBzdHJpbmdzKS4gSWYgYW55IG9mIHRoZSBtZXRob2RzIGRvIHRha2UgcGFyYW1ldGVycywgeW91IGhhdmUgdHdvIG9wdGlvbnMuIFlvdSBjYW4gcGFzcyBhbiBhcnJheSBvZiBvYmplY3RzLCBlYWNoIG9mIHdoaWNoIGNvbnRhaW5zIGEgbWV0aG9kIG5hbWUgYW5kIGl0cyBvd24gKHBvc3NpYmx5IGVtcHR5KSBhcnJheSBvZiBwYXJhbWV0ZXJzLiBBbHRlcm5hdGl2ZWx5LCB5b3UgY2FuIHBhc3MgYSBzaW5nbGUgb2JqZWN0IHdpdGggdGhlIG1ldGhvZCBuYW1lIGFuZCBhIChwb3NzaWJseSBlbXB0eSkgYXJyYXkgb2YgcGFyYW1ldGVycy5cbiAgICAgICAgICogQHBhcmFtIHsqfSBgcGFyYW1zYCBQYXJhbWV0ZXJzIHRvIHBhc3MgdG8gb3BlcmF0aW9ucy5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgcGFyYWxsZWw6IGZ1bmN0aW9uIChvcGVyYXRpb25zLCBwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciAkZCA9ICQuRGVmZXJyZWQoKTtcblxuICAgICAgICAgICAgdmFyIG9wUGFyYW1zID0gcnV0aWwubm9ybWFsaXplT3BlcmF0aW9ucyhvcGVyYXRpb25zLCBwYXJhbXMpO1xuICAgICAgICAgICAgdmFyIG9wcyA9IG9wUGFyYW1zLm9wcztcbiAgICAgICAgICAgIHZhciBhcmdzID0gb3BQYXJhbXMuYXJncztcbiAgICAgICAgICAgIHZhciBwb3N0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBxdWV1ZSAgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpPCBvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBxdWV1ZS5wdXNoKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvKG9wc1tpXSwgYXJnc1tpXSlcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJC53aGVuLmFwcGx5KHRoaXMsIHF1ZXVlKVxuICAgICAgICAgICAgICAgIC5kb25lKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgJGQucmVzb2x2ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICBwb3N0T3B0aW9ucy5zdWNjZXNzLmFwcGx5KHRoaXMuYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5mYWlsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgJGQucmVqZWN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIHBvc3RPcHRpb25zLmVycm9yLmFwcGx5KHRoaXMuYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuICRkLnByb21pc2UoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgcHVibGljU3luY0FQSSA9IHtcbiAgICAgICAgZ2V0Q3VycmVudENvbmZpZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHNlcnZpY2VPcHRpb25zO1xuICAgICAgICB9LFxuICAgICAgICB2YXJpYWJsZXM6IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgICAgIHZhciB2cyA9IG5ldyBWYXJpYWJsZXNTZXJ2aWNlKCQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgY29uZmlnLCB7XG4gICAgICAgICAgICAgICAgcnVuU2VydmljZTogdGhpc1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgcmV0dXJuIHZzO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FzeW5jQVBJKTtcbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNTeW5jQVBJKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG4vKipcbiAqICMjU3RhdGUgQVBJIEFkYXB0ZXJcbiAqXG4gKiBUaGUgU3RhdGUgQVBJIEFkYXB0ZXIgYWxsb3dzIHlvdSB0byByZXBsYXkgb3IgY2xvbmUgcnVucy4gSXQgYnJpbmdzIGV4aXN0aW5nLCBwZXJzaXN0ZWQgcnVuIGRhdGEgZnJvbSB0aGUgZGF0YWJhc2UgYmFjayBpbnRvIG1lbW9yeSwgdXNpbmcgdGhlIHNhbWUgcnVuIGlkIChgcmVwbGF5YCkgb3IgYSBuZXcgcnVuIGlkIChgY2xvbmVgKS4gUnVucyBtdXN0IGJlIGluIG1lbW9yeSBpbiBvcmRlciBmb3IgeW91IHRvIHVwZGF0ZSB2YXJpYWJsZXMgb3IgY2FsbCBvcGVyYXRpb25zIG9uIHRoZW0uXG4gKlxuICogU3BlY2lmaWNhbGx5LCB0aGUgU3RhdGUgQVBJIEFkYXB0ZXIgd29ya3MgYnkgXCJyZS1ydW5uaW5nXCIgdGhlIHJ1biAodXNlciBpbnRlcmFjdGlvbnMpIGZyb20gdGhlIGNyZWF0aW9uIG9mIHRoZSBydW4gdXAgdG8gdGhlIHRpbWUgaXQgd2FzIGxhc3QgcGVyc2lzdGVkIGluIHRoZSBkYXRhYmFzZS4gVGhpcyBwcm9jZXNzIHVzZXMgdGhlIGN1cnJlbnQgdmVyc2lvbiBvZiB0aGUgcnVuJ3MgbW9kZWwuIFRoZXJlZm9yZSwgaWYgdGhlIG1vZGVsIGhhcyBjaGFuZ2VkIHNpbmNlIHRoZSBvcmlnaW5hbCBydW4gd2FzIGNyZWF0ZWQsIHRoZSByZXRyaWV2ZWQgcnVuIHdpbGwgdXNlIHRoZSBuZXcgbW9kZWwg4oCUIGFuZCBtYXkgZW5kIHVwIGhhdmluZyBkaWZmZXJlbnQgdmFsdWVzIG9yIGJlaGF2aW9yIGFzIGEgcmVzdWx0LiBVc2Ugd2l0aCBjYXJlIVxuICpcbiAqIFRvIHVzZSB0aGUgU3RhdGUgQVBJIEFkYXB0ZXIsIGluc3RhbnRpYXRlIGl0IGFuZCB0aGVuIGNhbGwgaXRzIG1ldGhvZHM6XG4gKlxuICogICAgICB2YXIgc2EgPSBuZXcgRi5zZXJ2aWNlLlN0YXRlKCk7XG4gKiAgICAgIHNhLnJlcGxheSh7cnVuSWQ6ICcxODQyYmI1Yy04M2FkLTRiYTgtYTk1NS1iZDEzY2MyZmRiNGYnfSk7XG4gKlxuICogVGhlIGNvbnN0cnVjdG9yIHRha2VzIGFuIG9wdGlvbmFsIGBvcHRpb25zYCBwYXJhbWV0ZXIgaW4gd2hpY2ggeW91IGNhbiBzcGVjaWZ5IHRoZSBgYWNjb3VudGAgYW5kIGBwcm9qZWN0YCBpZiB0aGV5IGFyZSBub3QgYWxyZWFkeSBhdmFpbGFibGUgaW4gdGhlIGN1cnJlbnQgY29udGV4dC5cbiAqXG4gKi9cblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xudmFyIF9waWNrID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QtdXRpbCcpLl9waWNrO1xudmFyIGFwaUVuZHBvaW50ID0gJ21vZGVsL3N0YXRlJztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG5cbiAgICB2YXIgZGVmYXVsdHMgPSB7XG5cbiAgICB9O1xuXG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCBjb25maWcpO1xuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcblxuICAgIHZhciB0cmFuc3BvcnRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KVxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIHRyYW5zcG9ydE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KHRyYW5zcG9ydE9wdGlvbnMpO1xuICAgIHZhciBwYXJzZVJ1bklkT3JFcnJvciA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdChwYXJhbXMpICYmIHBhcmFtcy5ydW5JZCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcmFtcy5ydW5JZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHBhc3MgaW4gYSBydW4gaWQnKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuICAgICAgICAvKipcbiAgICAgICAgKiBSZXBsYXkgYSBydW4uIEFmdGVyIHRoaXMgY2FsbCwgdGhlIHJ1biwgd2l0aCBpdHMgb3JpZ2luYWwgcnVuIGlkLCBpcyBub3cgYXZhaWxhYmxlIFtpbiBtZW1vcnldKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpLiAoSXQgY29udGludWVzIHRvIGJlIHBlcnNpc3RlZCBpbnRvIHRoZSBFcGljZW50ZXIgZGF0YWJhc2UgYXQgcmVndWxhciBpbnRlcnZhbHMuKVxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciBzYSA9IG5ldyBGLnNlcnZpY2UuU3RhdGUoKTtcbiAgICAgICAgKiAgICAgIHNhLnJlcGxheSh7cnVuSWQ6ICcxODQyYmI1Yy04M2FkLTRiYTgtYTk1NS1iZDEzY2MyZmRiNGYnLCBzdG9wQmVmb3JlOiAnY2FsY3VsYXRlU2NvcmUnfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYHBhcmFtc2AgUGFyYW1ldGVycyBvYmplY3QuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGBwYXJhbXMucnVuSWRgIFRoZSBpZCBvZiB0aGUgcnVuIHRvIGJyaW5nIGJhY2sgdG8gbWVtb3J5LlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgcGFyYW1zLnN0b3BCZWZvcmVgIChPcHRpb25hbCkgVGhlIHJ1biBpcyBhZHZhbmNlZCBvbmx5IHVwIHRvIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIHRoaXMgbWV0aG9kLlxuICAgICAgICAqIEBwYXJhbSB7YXJyYXl9IGBwYXJhbXMuZXhjbHVkZWAgKE9wdGlvbmFsKSBBcnJheSBvZiBtZXRob2RzIHRvIGV4Y2x1ZGUgd2hlbiBhZHZhbmNpbmcgdGhlIHJ1bi5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICovXG4gICAgICAgIHJlcGxheTogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHJ1bklkID0gcGFyc2VSdW5JZE9yRXJyb3IocGFyYW1zKTtcblxuICAgICAgICAgICAgdmFyIHJlcGxheU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBydW5JZCB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBwYXJhbXMgPSAkLmV4dGVuZCh0cnVlLCB7IGFjdGlvbjogJ3JlcGxheScgfSwgX3BpY2socGFyYW1zLCBbJ3N0b3BCZWZvcmUnLCAnZXhjbHVkZSddKSk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QocGFyYW1zLCByZXBsYXlPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBDbG9uZSBhIGdpdmVuIHJ1biBhbmQgcmV0dXJuIGEgbmV3IHJ1biBpbiB0aGUgc2FtZSBzdGF0ZSBhcyB0aGUgZ2l2ZW4gcnVuLlxuICAgICAgICAqXG4gICAgICAgICogVGhlIG5ldyBydW4gaWQgaXMgbm93IGF2YWlsYWJsZSBbaW4gbWVtb3J5XSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KS4gVGhlIG5ldyBydW4gaW5jbHVkZXMgYSBjb3B5IG9mIGFsbCBvZiB0aGUgZGF0YSBmcm9tIHRoZSBvcmlnaW5hbCBydW4sIEVYQ0VQVDpcbiAgICAgICAgKlxuICAgICAgICAqICogVGhlIGBzYXZlZGAgZmllbGQgaW4gdGhlIG5ldyBydW4gcmVjb3JkIGlzIG5vdCBjb3BpZWQgZnJvbSB0aGUgb3JpZ2luYWwgcnVuIHJlY29yZC4gSXQgZGVmYXVsdHMgdG8gYGZhbHNlYC5cbiAgICAgICAgKiAqIFRoZSBgaW5pdGlhbGl6ZWRgIGZpZWxkIGluIHRoZSBuZXcgcnVuIHJlY29yZCBpcyBub3QgY29waWVkIGZyb20gdGhlIG9yaWdpbmFsIHJ1biByZWNvcmQuIEl0IGRlZmF1bHRzIHRvIGBmYWxzZWAgYnV0IG1heSBjaGFuZ2UgdG8gYHRydWVgIGFzIHRoZSBuZXcgcnVuIGlzIGFkdmFuY2VkLiBGb3IgZXhhbXBsZSwgaWYgdGhlcmUgaGFzIGJlZW4gYSBjYWxsIHRvIHRoZSBgc3RlcGAgZnVuY3Rpb24gKGZvciBWZW5zaW0gbW9kZWxzKSwgdGhlIGBpbml0aWFsaXplZGAgZmllbGQgaXMgc2V0IHRvIGB0cnVlYC5cbiAgICAgICAgKiAqIFRoZSBgY3JlYXRlZGAgZmllbGQgaW4gdGhlIG5ldyBydW4gcmVjb3JkIGlzIHRoZSBkYXRlIGFuZCB0aW1lIGF0IHdoaWNoIHRoZSBjbG9uZSB3YXMgY3JlYXRlZCAobm90IHRoZSB0aW1lIHRoYXQgdGhlIG9yaWdpbmFsIHJ1biB3YXMgY3JlYXRlZC4pXG4gICAgICAgICpcbiAgICAgICAgKiBUaGUgb3JpZ2luYWwgcnVuIHJlbWFpbnMgb25seSBbaW4gdGhlIGRhdGFiYXNlXSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tZGIpLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciBzYSA9IG5ldyBGLnNlcnZpY2UuU3RhdGUoKTtcbiAgICAgICAgKiAgICAgIHNhLmNsb25lKHtydW5JZDogJzE4NDJiYjVjLTgzYWQtNGJhOC1hOTU1LWJkMTNjYzJmZGI0ZicsIHN0b3BCZWZvcmU6ICdjYWxjdWxhdGVTY29yZScsIGV4Y2x1ZGU6IFsnaW50ZXJpbUNhbGN1bGF0aW9uJ10gfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYHBhcmFtc2AgUGFyYW1ldGVycyBvYmplY3QuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGBwYXJhbXMucnVuSWRgIFRoZSBpZCBvZiB0aGUgcnVuIHRvIGNsb25lIGZyb20gbWVtb3J5LlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgcGFyYW1zLnN0b3BCZWZvcmVgIChPcHRpb25hbCkgVGhlIG5ld2x5IGNsb25lZCBydW4gaXMgYWR2YW5jZWQgb25seSB1cCB0byB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiB0aGlzIG1ldGhvZC5cbiAgICAgICAgKiBAcGFyYW0ge2FycmF5fSBgcGFyYW1zLmV4Y2x1ZGVgIChPcHRpb25hbCkgQXJyYXkgb2YgbWV0aG9kcyB0byBleGNsdWRlIHdoZW4gYWR2YW5jaW5nIHRoZSBuZXdseSBjbG9uZWQgcnVuLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgKi9cbiAgICAgICAgY2xvbmU6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBydW5JZCA9IHBhcnNlUnVuSWRPckVycm9yKHBhcmFtcyk7XG5cbiAgICAgICAgICAgIHZhciByZXBsYXlPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgcnVuSWQgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcGFyYW1zID0gJC5leHRlbmQodHJ1ZSwgeyBhY3Rpb246ICdjbG9uZScgfSwgX3BpY2socGFyYW1zLCBbJ3N0b3BCZWZvcmUnLCAnZXhjbHVkZSddKSk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QocGFyYW1zLCByZXBsYXlPcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgLy9UT0RPOiB1cmx1dGlscyB0byBnZXQgaG9zdCwgc2luY2Ugbm8gd2luZG93IG9uIG5vZGVcblxuICAgIHZhciBBUElfUFJPVE9DT0wgPSAnaHR0cHMnO1xuICAgIHZhciBIT1NUX0FQSV9NQVBQSU5HID0ge1xuICAgICAgICAnZm9yaW8uY29tJzogJ2FwaS5mb3Jpby5jb20nLFxuICAgICAgICAnZm9yaW9kZXYuY29tJzogJ2FwaS5lcGljZW50ZXIuZm9yaW9kZXYuY29tJ1xuICAgIH07XG5cbiAgICB2YXIgcHVibGljRXhwb3J0cyA9IHtcbiAgICAgICAgcHJvdG9jb2w6IEFQSV9QUk9UT0NPTCxcblxuICAgICAgICBhcGk6ICcnLFxuXG4gICAgICAgIGhvc3Q6IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaG9zdCA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuICAgICAgICAgICAgaWYgKCFob3N0IHx8IGhvc3QuaW5kZXhPZignbG9jYWwnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBob3N0ID0gJ2ZvcmlvLmNvbSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gKEhPU1RfQVBJX01BUFBJTkdbaG9zdF0pID8gSE9TVF9BUElfTUFQUElOR1tob3N0XSA6ICdhcGkuJyArIGhvc3Q7XG4gICAgICAgIH0oKSksXG5cbiAgICAgICAgYXBwUGF0aDogKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBwYXRoID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnNwbGl0KCdcXC8nKTtcblxuICAgICAgICAgICAgcmV0dXJuIHBhdGggJiYgcGF0aFsxXSB8fCAnJztcbiAgICAgICAgfSgpKSxcblxuICAgICAgICBhY2NvdW50UGF0aDogKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhY2NudCA9ICcnO1xuICAgICAgICAgICAgdmFyIHBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUuc3BsaXQoJ1xcLycpO1xuICAgICAgICAgICAgaWYgKHBhdGggJiYgcGF0aFsxXSA9PT0gJ2FwcCcpIHtcbiAgICAgICAgICAgICAgICBhY2NudCA9IHBhdGhbMl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYWNjbnQ7XG4gICAgICAgIH0oKSksXG5cbiAgICAgICAgcHJvamVjdFBhdGg6IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcHJqID0gJyc7XG4gICAgICAgICAgICB2YXIgcGF0aCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zcGxpdCgnXFwvJyk7XG4gICAgICAgICAgICBpZiAocGF0aCAmJiBwYXRoWzFdID09PSAnYXBwJykge1xuICAgICAgICAgICAgICAgIHByaiA9IHBhdGhbM107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcHJqO1xuICAgICAgICB9KCkpLFxuXG4gICAgICAgIGlzTG9jYWxob3N0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaG9zdCA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuICAgICAgICAgICAgcmV0dXJuICghaG9zdCB8fCBob3N0LmluZGV4T2YoJ2xvY2FsJykgIT09IC0xKTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRBUElQYXRoOiBmdW5jdGlvbiAoYXBpKSB7XG4gICAgICAgICAgICB2YXIgUFJPSkVDVF9BUElTID0gWydydW4nLCAnZGF0YScsICdmaWxlJ107XG4gICAgICAgICAgICB2YXIgYXBpUGF0aCA9IHRoaXMucHJvdG9jb2wgKyAnOi8vJyArIHRoaXMuaG9zdCArICcvJyArIGFwaSArICcvJztcblxuICAgICAgICAgICAgaWYgKCQuaW5BcnJheShhcGksIFBST0pFQ1RfQVBJUykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgYXBpUGF0aCArPSB0aGlzLmFjY291bnRQYXRoICsgJy8nICsgdGhpcy5wcm9qZWN0UGF0aCAgKyAnLyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXBpUGF0aDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZChwdWJsaWNFeHBvcnRzLCBjb25maWcpO1xuICAgIHJldHVybiBwdWJsaWNFeHBvcnRzO1xufTtcbiIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuKiAjI1VzZXIgQVBJIEFkYXB0ZXJcbipcbiogVGhlIFVzZXIgQVBJIEFkYXB0ZXIgYWxsb3dzIHlvdSB0byByZXRyaWV2ZSBkZXRhaWxzIGFib3V0IGVuZCB1c2VycyBpbiB5b3VyIHRlYW0gKGFjY291bnQpLiBJdCBpcyBiYXNlZCBvbiB0aGUgcXVlcnlpbmcgY2FwYWJpbGl0aWVzIG9mIHRoZSB1bmRlcmx5aW5nIFJFU1RmdWwgW1VzZXIgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvdXNlcl9tYW5hZ2VtZW50L3VzZXIvKS5cbipcbiogVG8gdXNlIHRoZSBVc2VyIEFQSSBBZGFwdGVyLCBpbnN0YW50aWF0ZSBpdCBhbmQgdGhlbiBjYWxsIGl0cyBtZXRob2RzLlxuKlxuKiAgICAgICB2YXIgdWEgPSBuZXcgRi5zZXJ2aWNlLlVzZXIoe1xuKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuKiAgICAgICAgICAgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJ1xuKiAgICAgICB9KTtcbiogICAgICAgdWEuZ2V0QnlJZCgnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyk7XG4qICAgICAgIHVhLmdldCh7IHVzZXJOYW1lOiAnanNtaXRoJyB9KTtcbiogICAgICAgdWEuZ2V0KHsgaWQ6IFsnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyxcbiogICAgICAgICAgICAgICAgICAgJzRlYTc1NjMxLTRjOGQtNDg3Mi05ZDgwLWI0NjAwMTQ2NDc4ZSddIH0pO1xuKlxuKiBUaGUgY29uc3RydWN0b3IgdGFrZXMgYW4gb3B0aW9uYWwgYG9wdGlvbnNgIHBhcmFtZXRlciBpbiB3aGljaCB5b3UgY2FuIHNwZWNpZnkgdGhlIGBhY2NvdW50YCBhbmQgYHRva2VuYCBpZiB0aGV5IGFyZSBub3QgYWxyZWFkeSBhdmFpbGFibGUgaW4gdGhlIGN1cnJlbnQgY29udGV4dC5cbiovXG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbnZhciBxdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvcXVlcnktdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY2NvdW50IGlkLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpIG9yICoqVXNlciBJRCoqIChmb3IgcGVyc29uYWwgcHJvamVjdHMpLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgIGFjY291bnQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWNjZXNzIHRva2VuIHRvIHVzZSB3aGVuIHNlYXJjaGluZyBmb3IgZW5kIHVzZXJzLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgIHRva2VuOiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucyB0byBwYXNzIG9uIHRvIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBsYXllci4gQWxsIGpxdWVyeS5hamF4IG9wdGlvbnMgYXQgaHR0cDovL2FwaS5qcXVlcnkuY29tL2pRdWVyeS5hamF4LyBhcmUgYXZhaWxhYmxlLiBEZWZhdWx0cyB0byBlbXB0eSBvYmplY3QuXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IHt9XG4gICAgfTtcblxuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG4gICAgdmFyIHRyYW5zcG9ydE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoJ3VzZXInKVxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIHRyYW5zcG9ydE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KHRyYW5zcG9ydE9wdGlvbnMpO1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBSZXRyaWV2ZSBkZXRhaWxzIGFib3V0IHBhcnRpY3VsYXIgZW5kIHVzZXJzIGluIHlvdXIgdGVhbSwgYmFzZWQgb24gdXNlciBuYW1lIG9yIHVzZXIgaWQuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgdmFyIHVhID0gbmV3IEYuc2VydmljZS5Vc2VyKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICB0b2tlbjogJ3VzZXItb3ItcHJvamVjdC1hY2Nlc3MtdG9rZW4nXG4gICAgICAgICogICAgICAgfSk7XG4gICAgICAgICogICAgICAgdWEuZ2V0KHsgdXNlck5hbWU6ICdqc21pdGgnIH0pO1xuICAgICAgICAqICAgICAgIHVhLmdldCh7IGlkOiBbJzQyODM2ZDRiLTViNjEtNGZlNC04MGViLTMxMzZlOTU2ZWU1YycsXG4gICAgICAgICogICAgICAgICAgICAgICAgICAgJzRlYTc1NjMxLTRjOGQtNDg3Mi05ZDgwLWI0NjAwMTQ2NDc4ZSddIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYGZpbHRlcmAgT2JqZWN0IHdpdGggZmllbGQgYHVzZXJOYW1lYCBhbmQgdmFsdWUgb2YgdGhlIHVzZXJuYW1lLiBBbHRlcm5hdGl2ZWx5LCBvYmplY3Qgd2l0aCBmaWVsZCBgaWRgIGFuZCB2YWx1ZSBvZiBhbiBhcnJheSBvZiB1c2VyIGlkcy5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICovXG5cbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoZmlsdGVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgICAgIGZpbHRlciA9IGZpbHRlciB8fCB7fTtcblxuICAgICAgICAgICAgdmFyIGdldE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICB2YXIgdG9RRmlsdGVyID0gZnVuY3Rpb24gKGZpbHRlcikge1xuICAgICAgICAgICAgICAgIHZhciByZXMgPSB7fTtcblxuICAgICAgICAgICAgICAgIC8vIEFQSSBvbmx5IHN1cHBvcnRzIGZpbHRlcmluZyBieSB1c2VybmFtZSBmb3Igbm93XG4gICAgICAgICAgICAgICAgaWYgKGZpbHRlci51c2VyTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXMucSA9IGZpbHRlci51c2VyTmFtZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHRvSWRGaWx0ZXJzID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWQgPSAkLmlzQXJyYXkoaWQpID8gaWQgOiBbaWRdO1xuICAgICAgICAgICAgICAgIHJldHVybiAnaWQ9JyArIGlkLmpvaW4oJyZpZD0nKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBnZXRGaWx0ZXJzID0gW1xuICAgICAgICAgICAgICAgICdhY2NvdW50PScgKyBnZXRPcHRpb25zLmFjY291bnQsXG4gICAgICAgICAgICAgICAgdG9JZEZpbHRlcnMoZmlsdGVyLmlkKSxcbiAgICAgICAgICAgICAgICBxdXRpbC50b1F1ZXJ5Rm9ybWF0KHRvUUZpbHRlcihmaWx0ZXIpKVxuICAgICAgICAgICAgXS5qb2luKCcmJyk7XG5cbiAgICAgICAgICAgIC8vIHNwZWNpYWwgY2FzZSBmb3IgcXVlcmllcyB3aXRoIGxhcmdlIG51bWJlciBvZiBpZHNcbiAgICAgICAgICAgIC8vIG1ha2UgaXQgYXMgYSBwb3N0IHdpdGggR0VUIHNlbWFudGljc1xuICAgICAgICAgICAgdmFyIHRocmVzaG9sZCA9IDMwO1xuICAgICAgICAgICAgaWYgKGZpbHRlci5pZCAmJiAkLmlzQXJyYXkoZmlsdGVyLmlkKSAmJiBmaWx0ZXIuaWQubGVuZ3RoID49IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGdldE9wdGlvbnMudXJsID0gdXJsQ29uZmlnLmdldEFQSVBhdGgoJ3VzZXInKSArICc/X21ldGhvZD1HRVQnO1xuICAgICAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QoeyBpZDogZmlsdGVyLmlkIH0sIGdldE9wdGlvbnMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoZ2V0RmlsdGVycywgZ2V0T3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogUmV0cmlldmUgZGV0YWlscyBhYm91dCBhIHNpbmdsZSBlbmQgdXNlciBpbiB5b3VyIHRlYW0sIGJhc2VkIG9uIHVzZXIgaWQuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgdmFyIHVhID0gbmV3IEYuc2VydmljZS5Vc2VyKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICB0b2tlbjogJ3VzZXItb3ItcHJvamVjdC1hY2Nlc3MtdG9rZW4nXG4gICAgICAgICogICAgICAgfSk7XG4gICAgICAgICogICAgICAgdWEuZ2V0QnlJZCgnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgdXNlcklkYCBUaGUgdXNlciBpZCBmb3IgdGhlIGVuZCB1c2VyIGluIHlvdXIgdGVhbS5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICovXG5cbiAgICAgICAgZ2V0QnlJZDogZnVuY3Rpb24gKHVzZXJJZCwgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHB1YmxpY0FQSS5nZXQoeyBpZDogdXNlcklkIH0sIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuXG5cblxuXG4iLCIvKipcbiAqXG4gKiAjI1ZhcmlhYmxlcyBBUEkgU2VydmljZVxuICpcbiAqIFVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCB0aGUgW1J1biBBUEkgU2VydmljZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLykgdG8gcmVhZCwgd3JpdGUsIGFuZCBzZWFyY2ggZm9yIHNwZWNpZmljIG1vZGVsIHZhcmlhYmxlcy5cbiAqXG4gKiAgICAgdmFyIHJtID0gbmV3IEYubWFuYWdlci5SdW5NYW5hZ2VyKHtcbiAqICAgICAgICAgICBydW46IHtcbiAqICAgICAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICogICAgICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICogICAgICAgICAgICAgICBtb2RlbDogJ3N1cHBseS1jaGFpbi1tb2RlbC5qbCdcbiAqICAgICAgICAgICB9XG4gKiAgICAgIH0pO1xuICogICAgIHJtLmdldFJ1bigpXG4gKiAgICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAqICAgICAgICAgIHZhciB2cyA9IHJtLnJ1bi52YXJpYWJsZXMoKTtcbiAqICAgICAgICAgIHZzLnNhdmUoe3NhbXBsZV9pbnQ6IDR9KTtcbiAqICAgICAgICB9KTtcbiAqXG4gKi9cblxuXG4gJ3VzZSBzdHJpY3QnO1xuXG4gdmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xuIHZhciBydXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvcnVuLXV0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHJ1bnMgb2JqZWN0IHRvIHdoaWNoIHRoZSB2YXJpYWJsZSBmaWx0ZXJzIGFwcGx5LiBEZWZhdWx0cyB0byBudWxsLlxuICAgICAgICAgKiBAdHlwZSB7cnVuU2VydmljZX1cbiAgICAgICAgICovXG4gICAgICAgIHJ1blNlcnZpY2U6IG51bGxcbiAgICB9O1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcblxuICAgIHZhciBnZXRVUkwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzZXJ2aWNlT3B0aW9ucy5ydW5TZXJ2aWNlLnVybENvbmZpZy5nZXRGaWx0ZXJVUkwoKSArICd2YXJpYWJsZXMvJztcbiAgICB9O1xuXG4gICAgdmFyIGFkZEF1dG9SZXN0b3JlSGVhZGVyID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHNlcnZpY2VPcHRpb25zLnJ1blNlcnZpY2UudXJsQ29uZmlnLmFkZEF1dG9SZXN0b3JlSGVhZGVyKG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICB2YXIgaHR0cE9wdGlvbnMgPSB7XG4gICAgICAgIHVybDogZ2V0VVJMXG4gICAgfTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgaHR0cE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeShodHRwT3B0aW9ucyk7XG4gICAgaHR0cC5zcGxpdEdldCA9IHJ1dGlsLnNwbGl0R2V0RmFjdG9yeShodHRwT3B0aW9ucyk7XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdmFsdWVzIGZvciBhIHZhcmlhYmxlLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIHZzLmxvYWQoJ3NhbXBsZV9pbnQnKVxuICAgICAgICAgKiAgICAgICAgICAudGhlbihmdW5jdGlvbih2YWwpe1xuICAgICAgICAgKiAgICAgICAgICAgICAgLy8gdmFsIGNvbnRhaW5zIHRoZSB2YWx1ZSBvZiBzYW1wbGVfaW50XG4gICAgICAgICAqICAgICAgICAgIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gYHZhcmlhYmxlYCBOYW1lIG9mIHZhcmlhYmxlIHRvIGxvYWQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3V0cHV0TW9kaWZpZXJgIChPcHRpb25hbCkgQXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIGxvYWQ6IGZ1bmN0aW9uICh2YXJpYWJsZSwgb3V0cHV0TW9kaWZpZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBodHRwT3B0aW9ucyA9IGFkZEF1dG9SZXN0b3JlSGVhZGVyKGh0dHBPcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChvdXRwdXRNb2RpZmllciwgJC5leHRlbmQoe30sIGh0dHBPcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgdXJsOiBnZXRVUkwoKSArIHZhcmlhYmxlICsgJy8nXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgcGFydGljdWxhciB2YXJpYWJsZXMsIGJhc2VkIG9uIGNvbmRpdGlvbnMgc3BlY2lmaWVkIGluIHRoZSBgcXVlcnlgIG9iamVjdC5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICB2cy5xdWVyeShbJ3ByaWNlJywgJ3NhbGVzJ10pXG4gICAgICAgICAqICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICAgKiAgICAgICAgICAgICAgLy8gdmFsIGlzIGFuIG9iamVjdCB3aXRoIHRoZSB2YWx1ZXMgb2YgdGhlIHJlcXVlc3RlZCB2YXJpYWJsZXM6IHZhbC5wcmljZSwgdmFsLnNhbGVzXG4gICAgICAgICAqICAgICAgICAgIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIHZzLnF1ZXJ5KHsgaW5jbHVkZTpbJ3ByaWNlJywgJ3NhbGVzJ10gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fEFycmF5fSBgcXVlcnlgIFRoZSBuYW1lcyBvZiB0aGUgdmFyaWFibGVzIHJlcXVlc3RlZC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvdXRwdXRNb2RpZmllcmAgKE9wdGlvbmFsKSBBdmFpbGFibGUgZmllbGRzIGluY2x1ZGU6IGBzdGFydHJlY29yZGAsIGBlbmRyZWNvcmRgLCBgc29ydGAsIGFuZCBgZGlyZWN0aW9uYCAoYGFzY2Agb3IgYGRlc2NgKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKlxuICAgICAgICAgKi9cbiAgICAgICAgcXVlcnk6IGZ1bmN0aW9uIChxdWVyeSwgb3V0cHV0TW9kaWZpZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vUXVlcnkgYW5kIG91dHB1dE1vZGlmaWVyIGFyZSBib3RoIHF1ZXJ5c3RyaW5ncyBpbiB0aGUgdXJsOyBvbmx5IGNhbGxpbmcgdGhlbSBvdXQgc2VwYXJhdGVseSBoZXJlIHRvIGJlIGNvbnNpc3RlbnQgd2l0aCB0aGUgb3RoZXIgY2FsbHNcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIGlmICgkLmlzQXJyYXkocXVlcnkpKSB7XG4gICAgICAgICAgICAgICAgcXVlcnkgPSB7IGluY2x1ZGU6IHF1ZXJ5IH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkLmV4dGVuZChxdWVyeSwgb3V0cHV0TW9kaWZpZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuc3BsaXRHZXQocXVlcnksIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2F2ZSB2YWx1ZXMgdG8gbW9kZWwgdmFyaWFibGVzLiBPdmVyd3JpdGVzIGV4aXN0aW5nIHZhbHVlcy4gTm90ZSB0aGF0IHlvdSBjYW4gb25seSB1cGRhdGUgbW9kZWwgdmFyaWFibGVzIGlmIHRoZSBydW4gaXMgW2luIG1lbW9yeV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLW1lbW9yeSkuIChBbiBhbHRlcm5hdGUgd2F5IHRvIHVwZGF0ZSBtb2RlbCB2YXJpYWJsZXMgaXMgdG8gY2FsbCBhIG1ldGhvZCBmcm9tIHRoZSBtb2RlbCBhbmQgbWFrZSBzdXJlIHRoYXQgdGhlIG1ldGhvZCBwZXJzaXN0cyB0aGUgdmFyaWFibGVzLiBTZWUgYGRvYCwgYHNlcmlhbGAsIGFuZCBgcGFyYWxsZWxgIGluIHRoZSBbUnVuIEFQSSBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKSBmb3IgY2FsbGluZyBtZXRob2RzIGZyb20gdGhlIG1vZGVsLilcbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICB2cy5zYXZlKCdwcmljZScsIDQpO1xuICAgICAgICAgKiAgICAgIHZzLnNhdmUoeyBwcmljZTogNCwgcXVhbnRpdHk6IDUsIHByb2R1Y3RzOiBbMiwzLDRdIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdHxTdHJpbmd9IGB2YXJpYWJsZWAgQW4gb2JqZWN0IGNvbXBvc2VkIG9mIHRoZSBtb2RlbCB2YXJpYWJsZXMgYW5kIHRoZSB2YWx1ZXMgdG8gc2F2ZS4gQWx0ZXJuYXRpdmVseSwgYSBzdHJpbmcgd2l0aCB0aGUgbmFtZSBvZiB0aGUgdmFyaWFibGUuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgdmFsYCAoT3B0aW9uYWwpIElmIHBhc3NpbmcgYSBzdHJpbmcgZm9yIGB2YXJpYWJsZWAsIHVzZSB0aGlzIGFyZ3VtZW50IGZvciB0aGUgdmFsdWUgdG8gc2F2ZS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgc2F2ZTogZnVuY3Rpb24gKHZhcmlhYmxlLCB2YWwsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBhdHRycztcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFyaWFibGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgYXR0cnMgPSB2YXJpYWJsZTtcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gdmFsO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAoYXR0cnMgPSB7fSlbdmFyaWFibGVdID0gdmFsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucGF0Y2guY2FsbCh0aGlzLCBhdHRycywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTm90IEF2YWlsYWJsZSB1bnRpbCB1bmRlcmx5aW5nIEFQSSBzdXBwb3J0cyBQVVQuIE90aGVyd2lzZSBzYXZlIHdvdWxkIGJlIFBVVCBhbmQgbWVyZ2Ugd291bGQgYmUgUEFUQ0hcbiAgICAgICAgLy8gKlxuICAgICAgICAvLyAgKiBTYXZlIHZhbHVlcyB0byB0aGUgYXBpLiBNZXJnZXMgYXJyYXlzLCBidXQgb3RoZXJ3aXNlIHNhbWUgYXMgc2F2ZVxuICAgICAgICAvLyAgKiBAcGFyYW0ge09iamVjdHxTdHJpbmd9IHZhcmlhYmxlIE9iamVjdCB3aXRoIGF0dHJpYnV0ZXMsIG9yIHN0cmluZyBrZXlcbiAgICAgICAgLy8gICogQHBhcmFtIHtPYmplY3R9IHZhbCBPcHRpb25hbCBpZiBwcmV2IHBhcmFtZXRlciB3YXMgYSBzdHJpbmcsIHNldCB2YWx1ZSBoZXJlXG4gICAgICAgIC8vICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zXG4gICAgICAgIC8vICAqXG4gICAgICAgIC8vICAqIEBleGFtcGxlXG4gICAgICAgIC8vICAqICAgICB2cy5tZXJnZSh7IHByaWNlOiA0LCBxdWFudGl0eTogNSwgcHJvZHVjdHM6IFsyLDMsNF0gfSlcbiAgICAgICAgLy8gICogICAgIHZzLm1lcmdlKCdwcmljZScsIDQpO1xuXG4gICAgICAgIC8vIG1lcmdlOiBmdW5jdGlvbiAodmFyaWFibGUsIHZhbCwgb3B0aW9ucykge1xuICAgICAgICAvLyAgICAgdmFyIGF0dHJzO1xuICAgICAgICAvLyAgICAgaWYgKHR5cGVvZiB2YXJpYWJsZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgLy8gICAgICAgYXR0cnMgPSB2YXJpYWJsZTtcbiAgICAgICAgLy8gICAgICAgb3B0aW9ucyA9IHZhbDtcbiAgICAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICAgIChhdHRycyA9IHt9KVt2YXJpYWJsZV0gPSB2YWw7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgIC8vICAgICByZXR1cm4gaHR0cC5wYXRjaC5jYWxsKHRoaXMsIGF0dHJzLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIC8vIH1cbiAgICB9O1xuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiLyoqXG4gKiAjI1dvcmxkIEFQSSBBZGFwdGVyXG4gKlxuICogQSBbcnVuXSguLi8uLi8uLi9nbG9zc2FyeS8jcnVuKSBpcyBhIGNvbGxlY3Rpb24gb2YgZW5kIHVzZXIgaW50ZXJhY3Rpb25zIHdpdGggYSBwcm9qZWN0IGFuZCBpdHMgbW9kZWwgLS0gaW5jbHVkaW5nIHNldHRpbmcgdmFyaWFibGVzLCBtYWtpbmcgZGVjaXNpb25zLCBhbmQgY2FsbGluZyBvcGVyYXRpb25zLiBGb3IgYnVpbGRpbmcgbXVsdGlwbGF5ZXIgc2ltdWxhdGlvbnMgeW91IHR5cGljYWxseSB3YW50IG11bHRpcGxlIGVuZCB1c2VycyB0byBzaGFyZSB0aGUgc2FtZSBzZXQgb2YgaW50ZXJhY3Rpb25zLCBhbmQgd29yayB3aXRoaW4gYSBjb21tb24gc3RhdGUuIEVwaWNlbnRlciBhbGxvd3MgeW91IHRvIGNyZWF0ZSBcIndvcmxkc1wiIHRvIGhhbmRsZSBzdWNoIGNhc2VzLiBPbmx5IFt0ZWFtIHByb2plY3RzXSguLi8uLi8uLi9nbG9zc2FyeS8jdGVhbSkgY2FuIGJlIG11bHRpcGxheWVyLlxuICpcbiAqIFRoZSBXb3JsZCBBUEkgQWRhcHRlciBhbGxvd3MgeW91IHRvIGNyZWF0ZSwgYWNjZXNzLCBhbmQgbWFuaXB1bGF0ZSBtdWx0aXBsYXllciB3b3JsZHMgd2l0aGluIHlvdXIgRXBpY2VudGVyIHByb2plY3QuIFlvdSBjYW4gdXNlIHRoaXMgdG8gYWRkIGFuZCByZW1vdmUgZW5kIHVzZXJzIGZyb20gdGhlIHdvcmxkLCBhbmQgdG8gY3JlYXRlLCBhY2Nlc3MsIGFuZCByZW1vdmUgdGhlaXIgcnVucy4gQmVjYXVzZSBvZiB0aGlzLCB0eXBpY2FsbHkgdGhlIFdvcmxkIEFkYXB0ZXIgaXMgdXNlZCBmb3IgZmFjaWxpdGF0b3IgcGFnZXMgaW4geW91ciBwcm9qZWN0LiAoVGhlIHJlbGF0ZWQgW1dvcmxkIE1hbmFnZXJdKC4uL3dvcmxkLW1hbmFnZXIvKSBwcm92aWRlcyBhbiBlYXN5IHdheSB0byBhY2Nlc3MgcnVucyBhbmQgd29ybGRzIGZvciBwYXJ0aWN1bGFyIGVuZCB1c2Vycywgc28gaXMgdHlwaWNhbGx5IHVzZWQgaW4gcGFnZXMgdGhhdCBlbmQgdXNlcnMgd2lsbCBpbnRlcmFjdCB3aXRoLilcbiAqXG4gKiBBcyB3aXRoIGFsbCB0aGUgb3RoZXIgW0FQSSBBZGFwdGVyc10oLi4vLi4vKSwgYWxsIG1ldGhvZHMgdGFrZSBpbiBhbiBcIm9wdGlvbnNcIiBvYmplY3QgYXMgdGhlIGxhc3QgcGFyYW1ldGVyLiBUaGUgb3B0aW9ucyBjYW4gYmUgdXNlZCB0byBleHRlbmQvb3ZlcnJpZGUgdGhlIFdvcmxkIEFQSSBTZXJ2aWNlIGRlZmF1bHRzLlxuICpcbiAqIFRvIHVzZSB0aGUgV29ybGQgQWRhcHRlciwgaW5zdGFudGlhdGUgaXQgYW5kIHRoZW4gYWNjZXNzIHRoZSBtZXRob2RzIHByb3ZpZGVkLiBJbnN0YW50aWF0aW5nIHJlcXVpcmVzIHRoZSBhY2NvdW50IGlkICgqKlRlYW0gSUQqKiBpbiB0aGUgRXBpY2VudGVyIHVzZXIgaW50ZXJmYWNlKSwgcHJvamVjdCBpZCAoKipQcm9qZWN0IElEKiopLCBhbmQgZ3JvdXAgKCoqR3JvdXAgTmFtZSoqKS5cbiAqXG4gKiAgICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAqICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAqICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gKiAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAqICAgICAgIHdhLmNyZWF0ZSgpXG4gKiAgICAgICAgICAudGhlbihmdW5jdGlvbih3b3JsZCkge1xuICogICAgICAgICAgICAgIC8vIGNhbGwgbWV0aG9kcywgZS5nLiB3YS5hZGRVc2VycygpXG4gKiAgICAgICAgICB9KTtcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBTdG9yYWdlRmFjdG9yeSA9IHJlcXVpcmUoJy4uL3N0b3JlL3N0b3JlLWZhY3RvcnknKTtcbi8vIHZhciBxdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvcXVlcnktdXRpbCcpO1xudmFyIFRyYW5zcG9ydEZhY3RvcnkgPSByZXF1aXJlKCcuLi90cmFuc3BvcnQvaHR0cC10cmFuc3BvcnQtZmFjdG9yeScpO1xudmFyIF9waWNrID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QtdXRpbCcpLl9waWNrO1xuXG52YXIgYXBpQmFzZSA9ICdtdWx0aXBsYXllci8nO1xudmFyIGFzc2lnbm1lbnRFbmRwb2ludCA9IGFwaUJhc2UgKyAnYXNzaWduJztcbnZhciBhcGlFbmRwb2ludCA9IGFwaUJhc2UgKyAnd29ybGQnO1xudmFyIHByb2plY3RFbmRwb2ludCA9IGFwaUJhc2UgKyAncHJvamVjdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIHZhciBzdG9yZSA9IG5ldyBTdG9yYWdlRmFjdG9yeSh7IHN5bmNocm9ub3VzOiB0cnVlIH0pO1xuXG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRm9yIHByb2plY3RzIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZykuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICB0b2tlbjogc3RvcmUuZ2V0KCdlcGljZW50ZXIucHJvamVjdC50b2tlbicpIHx8ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcHJvamVjdCBpZC4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgcHJvamVjdDogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWNjb3VudCBpZC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKS4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgYWNjb3VudDogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgZ3JvdXAgbmFtZS4gRGVmYXVsdHMgdG8gdW5kZWZpbmVkLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICBncm91cDogdW5kZWZpbmVkLFxuXG4gICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBtb2RlbCBmaWxlIHRvIHVzZSB0byBjcmVhdGUgcnVucyBpbiB0aGlzIHdvcmxkLiBEZWZhdWx0cyB0byB1bmRlZmluZWQuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBtb2RlbDogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcml0ZXJpYSBieSB3aGljaCB0byBmaWx0ZXIgd29ybGQuIEN1cnJlbnRseSBvbmx5IHN1cHBvcnRzIHdvcmxkLWlkcyBhcyBmaWx0ZXJzLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZmlsdGVyOiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29udmVuaWVuY2UgYWxpYXMgZm9yIGZpbHRlclxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgaWQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPcHRpb25zIHRvIHBhc3Mgb24gdG8gdGhlIHVuZGVybHlpbmcgdHJhbnNwb3J0IGxheWVyLiBBbGwganF1ZXJ5LmFqYXggb3B0aW9ucyBhdCBodHRwOi8vYXBpLmpxdWVyeS5jb20valF1ZXJ5LmFqYXgvIGFyZSBhdmFpbGFibGUuIERlZmF1bHRzIHRvIGVtcHR5IG9iamVjdC5cbiAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRyYW5zcG9ydDoge30sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGxlZCB3aGVuIHRoZSBjYWxsIGNvbXBsZXRlcyBzdWNjZXNzZnVsbHkuIERlZmF1bHRzIHRvIGAkLm5vb3BgLlxuICAgICAgICAgKiBAdHlwZSB7ZnVuY3Rpb259XG4gICAgICAgICAqL1xuICAgICAgICBzdWNjZXNzOiAkLm5vb3AsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGxlZCB3aGVuIHRoZSBjYWxsIGZhaWxzLiBEZWZhdWx0cyB0byBgJC5ub29wYC5cbiAgICAgICAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgICAgICAgKi9cbiAgICAgICAgZXJyb3I6ICQubm9vcFxuICAgIH07XG5cbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLmlkKSB7XG4gICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IHNlcnZpY2VPcHRpb25zLmlkO1xuICAgIH1cblxuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcblxuICAgIGlmICghc2VydmljZU9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICBzZXJ2aWNlT3B0aW9ucy5hY2NvdW50ID0gdXJsQ29uZmlnLmFjY291bnRQYXRoO1xuICAgIH1cblxuICAgIGlmICghc2VydmljZU9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICBzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0ID0gdXJsQ29uZmlnLnByb2plY3RQYXRoO1xuICAgIH1cblxuICAgIHZhciB0cmFuc3BvcnRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KVxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIHRyYW5zcG9ydE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KHRyYW5zcG9ydE9wdGlvbnMpO1xuXG4gICAgdmFyIHNldElkRmlsdGVyT3JUaHJvd0Vycm9yID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaWQpIHtcbiAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IG9wdGlvbnMuaWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuZmlsdGVyKSB7XG4gICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSBvcHRpb25zLmZpbHRlcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXNlcnZpY2VPcHRpb25zLmZpbHRlcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyB3b3JsZCBpZCBzcGVjaWZpZWQgdG8gYXBwbHkgb3BlcmF0aW9ucyBhZ2FpbnN0LiBUaGlzIGNvdWxkIGhhcHBlbiBpZiB0aGUgdXNlciBpcyBub3QgYXNzaWduZWQgdG8gYSB3b3JsZCBhbmQgaXMgdHJ5aW5nIHRvIHdvcmsgd2l0aCBydW5zIGZyb20gdGhhdCB3b3JsZC4nKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgdmFsaWRhdGVNb2RlbE9yVGhyb3dFcnJvciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmICghb3B0aW9ucy5tb2RlbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBtb2RlbCBzcGVjaWZpZWQgdG8gZ2V0IHRoZSBjdXJyZW50IHJ1bicpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogQ3JlYXRlcyBhIG5ldyBXb3JsZC5cbiAgICAgICAgKlxuICAgICAgICAqIFVzaW5nIHRoaXMgbWV0aG9kIGlzIHJhcmUuIEl0IGlzIG1vcmUgY29tbW9uIHRvIGNyZWF0ZSB3b3JsZHMgYXV0b21hdGljYWxseSB3aGlsZSB5b3UgYGF1dG9Bc3NpZ24oKWAgZW5kIHVzZXJzIHRvIHdvcmxkcy4gKEluIHRoaXMgY2FzZSwgY29uZmlndXJhdGlvbiBkYXRhIGZvciB0aGUgd29ybGQsIHN1Y2ggYXMgdGhlIHJvbGVzLCBhcmUgcmVhZCBmcm9tIHRoZSBwcm9qZWN0LWxldmVsIHdvcmxkIGNvbmZpZ3VyYXRpb24gaW5mb3JtYXRpb24sIGZvciBleGFtcGxlIGJ5IGBnZXRQcm9qZWN0U2V0dGluZ3MoKWAuKVxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKHtcbiAgICAgICAgKiAgICAgICAgICAgcm9sZXM6IFsnVlAgTWFya2V0aW5nJywgJ1ZQIFNhbGVzJywgJ1ZQIEVuZ2luZWVyaW5nJ11cbiAgICAgICAgKiAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgcGFyYW1zYCBQYXJhbWV0ZXJzIHRvIGNyZWF0ZSB0aGUgd29ybGQuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGBwYXJhbXMuZ3JvdXBgIChPcHRpb25hbCkgVGhlICoqR3JvdXAgTmFtZSoqIHRvIGNyZWF0ZSB0aGlzIHdvcmxkIHVuZGVyLiBPbmx5IGVuZCB1c2VycyBpbiB0aGlzIGdyb3VwIGFyZSBlbGlnaWJsZSB0byBqb2luIHRoZSB3b3JsZC4gT3B0aW9uYWwgaGVyZTsgcmVxdWlyZWQgd2hlbiBpbnN0YW50aWF0aW5nIHRoZSBzZXJ2aWNlIChgbmV3IEYuc2VydmljZS5Xb3JsZCgpYCkuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBwYXJhbXMucm9sZXNgIChPcHRpb25hbCkgVGhlIGxpc3Qgb2Ygcm9sZXMgKHN0cmluZ3MpIGZvciB0aGlzIHdvcmxkLiBTb21lIHdvcmxkcyBoYXZlIHNwZWNpZmljIHJvbGVzIHRoYXQgKiptdXN0KiogYmUgZmlsbGVkIGJ5IGVuZCB1c2Vycy4gTGlzdGluZyB0aGUgcm9sZXMgYWxsb3dzIHlvdSB0byBhdXRvYXNzaWduIHVzZXJzIHRvIHdvcmxkcyBhbmQgZW5zdXJlIHRoYXQgYWxsIHJvbGVzIGFyZSBmaWxsZWQgaW4gZWFjaCB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYHBhcmFtcy5vcHRpb25hbFJvbGVzYCAoT3B0aW9uYWwpIFRoZSBsaXN0IG9mIG9wdGlvbmFsIHJvbGVzIChzdHJpbmdzKSBmb3IgdGhpcyB3b3JsZC4gU29tZSB3b3JsZHMgaGF2ZSBzcGVjaWZpYyByb2xlcyB0aGF0ICoqbWF5KiogYmUgZmlsbGVkIGJ5IGVuZCB1c2Vycy4gTGlzdGluZyB0aGUgb3B0aW9uYWwgcm9sZXMgYXMgcGFydCBvZiB0aGUgd29ybGQgb2JqZWN0IGFsbG93cyB5b3UgdG8gYXV0b2Fzc2lnbiB1c2VycyB0byB3b3JsZHMgYW5kIGVuc3VyZSB0aGF0IGFsbCByb2xlcyBhcmUgZmlsbGVkIGluIGVhY2ggd29ybGQuXG4gICAgICAgICogQHBhcmFtIHtpbnRlZ2VyfSBgcGFyYW1zLm1pblVzZXJzYCAoT3B0aW9uYWwpIFRoZSBtaW5pbXVtIG51bWJlciBvZiB1c2VycyBmb3IgdGhlIHdvcmxkLiBJbmNsdWRpbmcgdGhpcyBudW1iZXIgYWxsb3dzIHlvdSB0byBhdXRvYXNzaWduIGVuZCB1c2VycyB0byB3b3JsZHMgYW5kIGVuc3VyZSB0aGF0IHRoZSBjb3JyZWN0IG51bWJlciBvZiB1c2VycyBhcmUgaW4gZWFjaCB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICpcbiAgICAgICAgKi9cbiAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgY3JlYXRlT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucywgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSB9KTtcbiAgICAgICAgICAgIHZhciB3b3JsZEFwaVBhcmFtcyA9IFsnc2NvcGUnLCAnZmlsZXMnLCAncm9sZXMnLCAnb3B0aW9uYWxSb2xlcycsICdtaW5Vc2VycycsICdncm91cCcsICduYW1lJ107XG4gICAgICAgICAgICAvLyB3aGl0ZWxpc3QgdGhlIGZpZWxkcyB0aGF0IHdlIGFjdHVhbGx5IGNhbiBzZW5kIHRvIHRoZSBhcGlcbiAgICAgICAgICAgIHBhcmFtcyA9IF9waWNrKHBhcmFtcywgd29ybGRBcGlQYXJhbXMpO1xuXG4gICAgICAgICAgICAvLyBhY2NvdW50IGFuZCBwcm9qZWN0IGdvIGluIHRoZSBib2R5LCBub3QgaW4gdGhlIHVybFxuICAgICAgICAgICAgJC5leHRlbmQocGFyYW1zLCBfcGljayhzZXJ2aWNlT3B0aW9ucywgWydhY2NvdW50JywgJ3Byb2plY3QnLCAnZ3JvdXAnXSkpO1xuXG4gICAgICAgICAgICB2YXIgb2xkU3VjY2VzcyA9IGNyZWF0ZU9wdGlvbnMuc3VjY2VzcztcbiAgICAgICAgICAgIGNyZWF0ZU9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IHJlc3BvbnNlLmlkOyAvL2FsbCBmdXR1cmUgY2hhaW5lZCBjYWxscyB0byBvcGVyYXRlIG9uIHRoaXMgaWRcbiAgICAgICAgICAgICAgICByZXR1cm4gb2xkU3VjY2Vzcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChwYXJhbXMsIGNyZWF0ZU9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFVwZGF0ZXMgYSBXb3JsZCwgZm9yIGV4YW1wbGUgdG8gcmVwbGFjZSB0aGUgcm9sZXMgaW4gdGhlIHdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogVHlwaWNhbGx5LCB5b3UgY29tcGxldGUgd29ybGQgY29uZmlndXJhdGlvbiBhdCB0aGUgcHJvamVjdCBsZXZlbCwgcmF0aGVyIHRoYW4gYXQgdGhlIHdvcmxkIGxldmVsLiBGb3IgZXhhbXBsZSwgZWFjaCB3b3JsZCBpbiB5b3VyIHByb2plY3QgcHJvYmFibHkgaGFzIHRoZSBzYW1lIHJvbGVzIGZvciBlbmQgdXNlcnMuIEFuZCB5b3VyIHByb2plY3QgaXMgcHJvYmFibHkgZWl0aGVyIGNvbmZpZ3VyZWQgc28gdGhhdCBhbGwgZW5kIHVzZXJzIHNoYXJlIHRoZSBzYW1lIHdvcmxkIChhbmQgcnVuKSwgb3Igc21hbGxlciBzZXRzIG9mIGVuZCB1c2VycyBzaGFyZSB3b3JsZHMg4oCUIGJ1dCBub3QgYm90aC4gSG93ZXZlciwgdGhpcyBtZXRob2QgaXMgYXZhaWxhYmxlIGlmIHlvdSBuZWVkIHRvIHVwZGF0ZSB0aGUgY29uZmlndXJhdGlvbiBvZiBhIHBhcnRpY3VsYXIgd29ybGQuXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gICAgICAgICogICAgICB3YS5jcmVhdGUoKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbih3b3JsZCkge1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EudXBkYXRlKHsgcm9sZXM6IFsnVlAgTWFya2V0aW5nJywgJ1ZQIFNhbGVzJywgJ1ZQIEVuZ2luZWVyaW5nJ10gfSk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBwYXJhbXNgIFBhcmFtZXRlcnMgdG8gdXBkYXRlIHRoZSB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYHBhcmFtcy5uYW1lYCBBIHN0cmluZyBpZGVudGlmaWVyIGZvciB0aGUgbGlua2VkIGVuZCB1c2VycywgZm9yIGV4YW1wbGUsIFwibmFtZVwiOiBcIk91ciBUZWFtXCIuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBwYXJhbXMucm9sZXNgIChPcHRpb25hbCkgVGhlIGxpc3Qgb2Ygcm9sZXMgKHN0cmluZ3MpIGZvciB0aGlzIHdvcmxkLiBTb21lIHdvcmxkcyBoYXZlIHNwZWNpZmljIHJvbGVzIHRoYXQgKiptdXN0KiogYmUgZmlsbGVkIGJ5IGVuZCB1c2Vycy4gTGlzdGluZyB0aGUgcm9sZXMgYWxsb3dzIHlvdSB0byBhdXRvYXNzaWduIHVzZXJzIHRvIHdvcmxkcyBhbmQgZW5zdXJlIHRoYXQgYWxsIHJvbGVzIGFyZSBmaWxsZWQgaW4gZWFjaCB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYHBhcmFtcy5vcHRpb25hbFJvbGVzYCAoT3B0aW9uYWwpIFRoZSBsaXN0IG9mIG9wdGlvbmFsIHJvbGVzIChzdHJpbmdzKSBmb3IgdGhpcyB3b3JsZC4gU29tZSB3b3JsZHMgaGF2ZSBzcGVjaWZpYyByb2xlcyB0aGF0ICoqbWF5KiogYmUgZmlsbGVkIGJ5IGVuZCB1c2Vycy4gTGlzdGluZyB0aGUgb3B0aW9uYWwgcm9sZXMgYXMgcGFydCBvZiB0aGUgd29ybGQgb2JqZWN0IGFsbG93cyB5b3UgdG8gYXV0b2Fzc2lnbiB1c2VycyB0byB3b3JsZHMgYW5kIGVuc3VyZSB0aGF0IGFsbCByb2xlcyBhcmUgZmlsbGVkIGluIGVhY2ggd29ybGQuXG4gICAgICAgICogQHBhcmFtIHtpbnRlZ2VyfSBgcGFyYW1zLm1pblVzZXJzYCAoT3B0aW9uYWwpIFRoZSBtaW5pbXVtIG51bWJlciBvZiB1c2VycyBmb3IgdGhlIHdvcmxkLiBJbmNsdWRpbmcgdGhpcyBudW1iZXIgYWxsb3dzIHlvdSB0byBhdXRvYXNzaWduIGVuZCB1c2VycyB0byB3b3JsZHMgYW5kIGVuc3VyZSB0aGF0IHRoZSBjb3JyZWN0IG51bWJlciBvZiB1c2VycyBhcmUgaW4gZWFjaCB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICpcbiAgICAgICAgKi9cbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgd2hpdGVsaXN0ID0gWydyb2xlcycsICdvcHRpb25hbFJvbGVzJywgJ21pblVzZXJzJ107XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgICAgIHNldElkRmlsdGVyT3JUaHJvd0Vycm9yKG9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgdXBkYXRlT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHNlcnZpY2VPcHRpb25zLmZpbHRlciB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBwYXJhbXMgPSBfcGljayhwYXJhbXMgfHwge30sIHdoaXRlbGlzdCk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBhdGNoKHBhcmFtcywgdXBkYXRlT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogRGVsZXRlcyBhbiBleGlzdGluZyB3b3JsZC5cbiAgICAgICAgKlxuICAgICAgICAqIFRoaXMgZnVuY3Rpb24gb3B0aW9uYWxseSB0YWtlcyBvbmUgYXJndW1lbnQuIElmIHRoZSBhcmd1bWVudCBpcyBhIHN0cmluZywgaXQgaXMgdGhlIGlkIG9mIHRoZSB3b3JsZCB0byBkZWxldGUuIElmIHRoZSBhcmd1bWVudCBpcyBhbiBvYmplY3QsIGl0IGlzIHRoZSBvdmVycmlkZSBmb3IgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gICAgICAgICogICAgICB3YS5jcmVhdGUoKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbih3b3JsZCkge1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EuZGVsZXRlKCk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBUaGUgaWQgb2YgdGhlIHdvcmxkIHRvIGRlbGV0ZSwgb3Igb3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICpcbiAgICAgICAgKi9cbiAgICAgICAgZGVsZXRlOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IChvcHRpb25zICYmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ3N0cmluZycpKSA/IHsgZmlsdGVyOiBvcHRpb25zIH0gOiB7fTtcbiAgICAgICAgICAgIHNldElkRmlsdGVyT3JUaHJvd0Vycm9yKG9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgZGVsZXRlT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHNlcnZpY2VPcHRpb25zLmZpbHRlciB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5kZWxldGUobnVsbCwgZGVsZXRlT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogVXBkYXRlcyB0aGUgY29uZmlndXJhdGlvbiBmb3IgdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhlIFdvcmxkIEFQSSBBZGFwdGVyIChpbmNsdWRpbmcgYWxsIHN1YnNlcXVlbnQgZnVuY3Rpb24gY2FsbHMsIHVudGlsIHRoZSBjb25maWd1cmF0aW9uIGlzIHVwZGF0ZWQgYWdhaW4pLlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7Li4ufSkudXBkYXRlQ29uZmlnKHsgZmlsdGVyOiAnMTIzJyB9KS5hZGRVc2VyKHsgdXNlcklkOiAnMTIzJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBjb25maWdgIFRoZSBjb25maWd1cmF0aW9uIG9iamVjdCB0byB1c2UgaW4gdXBkYXRpbmcgZXhpc3RpbmcgY29uZmlndXJhdGlvbi5cbiAgICAgICAgKi9cbiAgICAgICAgdXBkYXRlQ29uZmlnOiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgICAgICAkLmV4dGVuZChzZXJ2aWNlT3B0aW9ucywgY29uZmlnKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogTGlzdHMgYWxsIHdvcmxkcyBmb3IgYSBnaXZlbiBhY2NvdW50LCBwcm9qZWN0LCBhbmQgZ3JvdXAuIEFsbCB0aHJlZSBhcmUgcmVxdWlyZWQsIGFuZCBpZiBub3Qgc3BlY2lmaWVkIGFzIHBhcmFtZXRlcnMsIGFyZSByZWFkIGZyb20gdGhlIHNlcnZpY2UuXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gICAgICAgICogICAgICB3YS5jcmVhdGUoKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbih3b3JsZCkge1xuICAgICAgICAqICAgICAgICAgICAgICAgLy8gbGlzdHMgYWxsIHdvcmxkcyBpbiBncm91cCBcInRlYW0xXCJcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmxpc3QoKTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgICAgICAgICAgLy8gbGlzdHMgYWxsIHdvcmxkcyBpbiBncm91cCBcIm90aGVyLWdyb3VwLW5hbWVcIlxuICAgICAgICAqICAgICAgICAgICAgICAgd2EubGlzdCh7IGdyb3VwOiAnb3RoZXItZ3JvdXAtbmFtZScgfSk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqXG4gICAgICAgICovXG4gICAgICAgIGxpc3Q6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgdmFyIGdldE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgdmFyIGZpbHRlcnMgPSBfcGljayhnZXRPcHRpb25zLCBbJ2FjY291bnQnLCAncHJvamVjdCcsICdncm91cCddKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KGZpbHRlcnMsIGdldE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEdldHMgYWxsIHdvcmxkcyB0aGF0IGFuIGVuZCB1c2VyIGJlbG9uZ3MgdG8gZm9yIGEgZ2l2ZW4gYWNjb3VudCAodGVhbSksIHByb2plY3QsIGFuZCBncm91cC5cbiAgICAgICAgKlxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKiAgICAgIHdhLmNyZWF0ZSgpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHdvcmxkKSB7XG4gICAgICAgICogICAgICAgICAgICAgICB3YS5nZXRXb3JsZHNGb3JVc2VyKCdiMWMxOWRkYS0yZDJlLTQ3NzctYWQ1ZC0zOTI5ZjE3ZTg2ZDMnKVxuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqIFBhcmFtZXRlcnMgKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYHVzZXJJZGAgVGhlIGB1c2VySWRgIG9mIHRoZSB1c2VyIHdob3NlIHdvcmxkcyBhcmUgYmVpbmcgcmV0cmlldmVkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKi9cbiAgICAgICAgZ2V0V29ybGRzRm9yVXNlcjogZnVuY3Rpb24gKHVzZXJJZCwgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgICAgIHZhciBnZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHZhciBmaWx0ZXJzID0gJC5leHRlbmQoXG4gICAgICAgICAgICAgICAgX3BpY2soZ2V0T3B0aW9ucywgWydhY2NvdW50JywgJ3Byb2plY3QnLCAnZ3JvdXAnXSksXG4gICAgICAgICAgICAgICAgeyB1c2VySWQ6IHVzZXJJZCB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoZmlsdGVycywgZ2V0T3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExvYWQgaW5mb3JtYXRpb24gZm9yIGEgc3BlY2lmaWMgd29ybGQuIEFsbCBmdXJ0aGVyIGNhbGxzIHRvIHRoZSB3b3JsZCBzZXJ2aWNlIHdpbGwgdXNlIHRoZSBpZCBwcm92aWRlZC5cbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGB3b3JsZElkYCBUaGUgaWQgb2YgdGhlIHdvcmxkIHRvIGxvYWQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIGxvYWQ6IGZ1bmN0aW9uICh3b3JsZElkLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAod29ybGRJZCkge1xuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IHdvcmxkSWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXNlcnZpY2VPcHRpb25zLmZpbHRlcikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHByb3ZpZGUgYSB3b3JsZGlkIHRvIGxvYWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucywgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgKyAnLycgfSk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoJycsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBBZGRzIGFuIGVuZCB1c2VyIG9yIGxpc3Qgb2YgZW5kIHVzZXJzIHRvIGEgZ2l2ZW4gd29ybGQuIFRoZSBlbmQgdXNlciBtdXN0IGJlIGEgbWVtYmVyIG9mIHRoZSBgZ3JvdXBgIHRoYXQgaXMgYXNzb2NpYXRlZCB3aXRoIHRoaXMgd29ybGQuXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gICAgICAgICogICAgICB3YS5jcmVhdGUoKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbih3b3JsZCkge1xuICAgICAgICAqICAgICAgICAgICAgICAgLy8gYWRkIG9uZSB1c2VyXG4gICAgICAgICogICAgICAgICAgICAgICB3YS5hZGRVc2VycygnYjFjMTlkZGEtMmQyZS00Nzc3LWFkNWQtMzkyOWYxN2U4NmQzJyk7XG4gICAgICAgICogICAgICAgICAgICAgICB3YS5hZGRVc2VycyhbJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMyddKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmFkZFVzZXJzKHsgdXNlcklkOiAnYjFjMTlkZGEtMmQyZS00Nzc3LWFkNWQtMzkyOWYxN2U4NmQzJywgcm9sZTogJ1ZQIFNhbGVzJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgICAgICAgICAgLy8gYWRkIHNldmVyYWwgdXNlcnNcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmFkZFVzZXJzKFtcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICB7IHVzZXJJZDogJ2E2ZmUwYzFlLWY0YjgtNGYwMS05ZjVmLTAxY2NmNGMyZWQ0NCcsXG4gICAgICAgICogICAgICAgICAgICAgICAgICAgICByb2xlOiAnVlAgTWFya2V0aW5nJyB9LFxuICAgICAgICAqICAgICAgICAgICAgICAgICAgIHsgdXNlcklkOiAnOGYyNjA0Y2YtOTZjZC00NDlmLTgyZmEtZTMzMTUzMDczNGVlJyxcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICAgIHJvbGU6ICdWUCBFbmdpbmVlcmluZycgfVxuICAgICAgICAqICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICAgICAgICAgIC8vIGFkZCBvbmUgdXNlciB0byBhIHNwZWNpZmljIHdvcmxkXG4gICAgICAgICogICAgICAgICAgICAgICB3YS5hZGRVc2VycygnYjFjMTlkZGEtMmQyZS00Nzc3LWFkNWQtMzkyOWYxN2U4NmQzJywgd29ybGQuaWQpO1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EuYWRkVXNlcnMoJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMycsIHsgZmlsdGVyOiB3b3JsZC5pZCB9KTtcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKiBQYXJhbWV0ZXJzICoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd8b2JqZWN0fGFycmF5fSBgdXNlcnNgIFVzZXIgaWQsIGFycmF5IG9mIHVzZXIgaWRzLCBvYmplY3QsIG9yIGFycmF5IG9mIG9iamVjdHMgb2YgdGhlIHVzZXJzIHRvIGFkZCB0byB0aGlzIHdvcmxkLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgdXNlcnMucm9sZWAgVGhlIGByb2xlYCB0aGUgdXNlciBzaG91bGQgaGF2ZSBpbiB0aGUgd29ybGQuIEl0IGlzIHVwIHRvIHRoZSBjYWxsZXIgdG8gZW5zdXJlLCBpZiBuZWVkZWQsIHRoYXQgdGhlIGByb2xlYCBwYXNzZWQgaW4gaXMgb25lIG9mIHRoZSBgcm9sZXNgIG9yIGBvcHRpb25hbFJvbGVzYCBvZiB0aGlzIHdvcmxkLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgd29ybGRJZGAgVGhlIHdvcmxkIHRvIHdoaWNoIHRoZSB1c2VycyBzaG91bGQgYmUgYWRkZWQuIElmIG5vdCBzcGVjaWZpZWQsIHRoZSBmaWx0ZXIgcGFyYW1ldGVyIG9mIHRoZSBgb3B0aW9uc2Agb2JqZWN0IGlzIHVzZWQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqL1xuICAgICAgICBhZGRVc2VyczogZnVuY3Rpb24gKHVzZXJzLCB3b3JsZElkLCBvcHRpb25zKSB7XG5cbiAgICAgICAgICAgIGlmICghdXNlcnMpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSBwcm92aWRlIGEgbGlzdCBvZiB1c2VycyB0byBhZGQgdG8gdGhlIHdvcmxkJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIG5vcm1hbGl6ZSB0aGUgbGlzdCBvZiB1c2VycyB0byBhbiBhcnJheSBvZiB1c2VyIG9iamVjdHNcbiAgICAgICAgICAgIHVzZXJzID0gJC5tYXAoW10uY29uY2F0KHVzZXJzKSwgZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgICAgICB2YXIgaXNPYmplY3QgPSAkLmlzUGxhaW5PYmplY3QodSk7XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHUgIT09ICdzdHJpbmcnICYmICFpc09iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NvbWUgb2YgdGhlIHVzZXJzIGluIHRoZSBsaXN0IGFyZSBub3QgaW4gdGhlIHZhbGlkIGZvcm1hdDogJyArIHUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBpc09iamVjdCA/IHUgOiB7IHVzZXJJZDogdSB9O1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIG9wdGlvbnMgd2VyZSBwYXNzZWQgYXMgdGhlIHNlY29uZCBwYXJhbWV0ZXJcbiAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3Qod29ybGRJZCkgJiYgIW9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gd29ybGRJZDtcbiAgICAgICAgICAgICAgICB3b3JsZElkID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgICAgIC8vIHdlIG11c3QgaGF2ZSBvcHRpb25zIGJ5IG5vd1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3b3JsZElkID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuZmlsdGVyID0gd29ybGRJZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciB1cGRhdGVPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyICsgJy91c2VycycgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdCh1c2VycywgdXBkYXRlT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogVXBkYXRlcyB0aGUgcm9sZSBvZiBhbiBlbmQgdXNlciBpbiBhIGdpdmVuIHdvcmxkLiAoWW91IGNhbiBvbmx5IHVwZGF0ZSBvbmUgZW5kIHVzZXIgYXQgYSB0aW1lLilcbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICB3YS5jcmVhdGUoKS50aGVuKGZ1bmN0aW9uKHdvcmxkKSB7XG4gICAgICAgICogICAgICAgICAgIHdhLmFkZFVzZXJzKCdiMWMxOWRkYS0yZDJlLTQ3NzctYWQ1ZC0zOTI5ZjE3ZTg2ZDMnKTtcbiAgICAgICAgKiAgICAgICAgICAgd2EudXBkYXRlVXNlcih7IHVzZXJJZDogJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMycsIHJvbGU6ICdsZWFkZXInIH0pO1xuICAgICAgICAqICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBgdXNlcmAgVXNlciBvYmplY3Qgd2l0aCBgdXNlcklkYCBhbmQgdGhlIG5ldyBgcm9sZWAuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqXG4gICAgICAgICovXG4gICAgICAgIHVwZGF0ZVVzZXI6IGZ1bmN0aW9uICh1c2VyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgaWYgKCF1c2VyIHx8ICF1c2VyLnVzZXJJZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignWW91IG5lZWQgdG8gcGFzcyBhIHVzZXJJZCB0byB1cGRhdGUgZnJvbSB0aGUgd29ybGQnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBwYXRjaE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgKyAnL3VzZXJzLycgKyB1c2VyLnVzZXJJZCB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wYXRjaChfcGljayh1c2VyLCAncm9sZScpLCBwYXRjaE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFJlbW92ZXMgYW4gZW5kIHVzZXIgZnJvbSBhIGdpdmVuIHdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmFkZFVzZXJzKFsnYTZmZTBjMWUtZjRiOC00ZjAxLTlmNWYtMDFjY2Y0YzJlZDQ0JywgJzhmMjYwNGNmLTk2Y2QtNDQ5Zi04MmZhLWUzMzE1MzA3MzRlZSddKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLnJlbW92ZVVzZXIoJ2E2ZmUwYzFlLWY0YjgtNGYwMS05ZjVmLTAxY2NmNGMyZWQ0NCcpO1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EucmVtb3ZlVXNlcih7IHVzZXJJZDogJzhmMjYwNGNmLTk2Y2QtNDQ5Zi04MmZhLWUzMzE1MzA3MzRlZScgfSk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKiogUGFyYW1ldGVycyAqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fHN0cmluZ30gYHVzZXJgIFRoZSBgdXNlcklkYCBvZiB0aGUgdXNlciB0byByZW1vdmUgZnJvbSB0aGUgd29ybGQsIG9yIGFuIG9iamVjdCBjb250YWluaW5nIHRoZSBgdXNlcklkYCBmaWVsZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICovXG4gICAgICAgIHJlbW92ZVVzZXI6IGZ1bmN0aW9uICh1c2VyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB1c2VyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHVzZXIgPSB7IHVzZXJJZDogdXNlciB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXVzZXIudXNlcklkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgbmVlZCB0byBwYXNzIGEgdXNlcklkIHRvIHJlbW92ZSBmcm9tIHRoZSB3b3JsZCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZXRJZEZpbHRlck9yVGhyb3dFcnJvcihvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIGdldE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgKyAnL3VzZXJzLycgKyB1c2VyLnVzZXJJZCB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5kZWxldGUobnVsbCwgZ2V0T3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogR2V0cyB0aGUgcnVuIGlkIG9mIGN1cnJlbnQgcnVuIGZvciB0aGUgZ2l2ZW4gd29ybGQuIElmIHRoZSB3b3JsZCBkb2VzIG5vdCBoYXZlIGEgcnVuLCBjcmVhdGVzIGEgbmV3IG9uZSBhbmQgcmV0dXJucyB0aGUgcnVuIGlkLlxuICAgICAgICAqXG4gICAgICAgICogUmVtZW1iZXIgdGhhdCBhIFtydW5dKC4uLy4uL2dsb3NzYXJ5LyNydW4pIGlzIGEgY29sbGVjdGlvbiBvZiBpbnRlcmFjdGlvbnMgd2l0aCBhIHByb2plY3QgYW5kIGl0cyBtb2RlbC4gSW4gdGhlIGNhc2Ugb2YgbXVsdGlwbGF5ZXIgcHJvamVjdHMsIHRoZSBydW4gaXMgc2hhcmVkIGJ5IGFsbCBlbmQgdXNlcnMgaW4gdGhlIHdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmdldEN1cnJlbnRSdW5JZCh7IG1vZGVsOiAnbW9kZWwucHknIH0pO1xuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqIFBhcmFtZXRlcnMgKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zLm1vZGVsYCBUaGUgbW9kZWwgZmlsZSB0byB1c2UgdG8gY3JlYXRlIGEgcnVuIGlmIG5lZWRlZC5cbiAgICAgICAgKi9cbiAgICAgICAgZ2V0Q3VycmVudFJ1bklkOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgICAgIHNldElkRmlsdGVyT3JUaHJvd0Vycm9yKG9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgZ2V0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHNlcnZpY2VPcHRpb25zLmZpbHRlciArICcvcnVuJyB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICB2YWxpZGF0ZU1vZGVsT3JUaHJvd0Vycm9yKGdldE9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChfcGljayhnZXRPcHRpb25zLCAnbW9kZWwnKSwgZ2V0T3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogR2V0cyB0aGUgY3VycmVudCAobW9zdCByZWNlbnQpIHdvcmxkIGZvciB0aGUgZ2l2ZW4gZW5kIHVzZXIgaW4gdGhlIGdpdmVuIGdyb3VwLiBCcmluZ3MgdGhpcyBtb3N0IHJlY2VudCB3b3JsZCBpbnRvIG1lbW9yeSBpZiBuZWVkZWQuXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gICAgICAgICogICAgICB3YS5nZXRDdXJyZW50V29ybGRGb3JVc2VyKCc4ZjI2MDRjZi05NmNkLTQ0OWYtODJmYS1lMzMxNTMwNzM0ZWUnKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbih3b3JsZCkge1xuICAgICAgICAqICAgICAgICAgICAgICAgLy8gdXNlIGRhdGEgZnJvbSB3b3JsZFxuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqIFBhcmFtZXRlcnMgKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gYHVzZXJJZGAgVGhlIGB1c2VySWRgIG9mIHRoZSB1c2VyIHdob3NlIGN1cnJlbnQgKG1vc3QgcmVjZW50KSB3b3JsZCBpcyBiZWluZyByZXRyaWV2ZWQuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGBncm91cE5hbWVgIChPcHRpb25hbCkgVGhlIG5hbWUgb2YgdGhlIGdyb3VwLiBJZiBub3QgcHJvdmlkZWQsIGRlZmF1bHRzIHRvIHRoZSBncm91cCB1c2VkIHRvIGNyZWF0ZSB0aGUgc2VydmljZS5cbiAgICAgICAgKi9cbiAgICAgICAgZ2V0Q3VycmVudFdvcmxkRm9yVXNlcjogZnVuY3Rpb24gKHVzZXJJZCwgZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICB2YXIgZHRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgICAgIHRoaXMuZ2V0V29ybGRzRm9yVXNlcih1c2VySWQsIHsgZ3JvdXA6IGdyb3VwTmFtZSB9KVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICh3b3JsZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYXNzdW1lIHRoZSBtb3N0IHJlY2VudCB3b3JsZCBhcyB0aGUgJ2FjdGl2ZScgd29ybGRcbiAgICAgICAgICAgICAgICAgICAgd29ybGRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIG5ldyBEYXRlKGIubGFzdE1vZGlmaWVkKSAtIG5ldyBEYXRlKGEubGFzdE1vZGlmaWVkKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50V29ybGQgPSB3b3JsZHNbMF07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRXb3JsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gIGN1cnJlbnRXb3JsZC5pZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlKGN1cnJlbnRXb3JsZCwgbWUpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZhaWwoZHRkLnJlamVjdCk7XG5cbiAgICAgICAgICAgIHJldHVybiBkdGQucHJvbWlzZSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIERlbGV0ZXMgdGhlIGN1cnJlbnQgcnVuIGZyb20gdGhlIHdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogKE5vdGUgdGhhdCB0aGUgd29ybGQgaWQgcmVtYWlucyBwYXJ0IG9mIHRoZSBydW4gcmVjb3JkLCBpbmRpY2F0aW5nIHRoYXQgdGhlIHJ1biB3YXMgZm9ybWVybHkgYW4gYWN0aXZlIHJ1biBmb3IgdGhlIHdvcmxkLilcbiAgICAgICAgKlxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgd2EuZGVsZXRlUnVuKCdzYW1wbGUtd29ybGQtaWQnKTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBgd29ybGRJZGAgVGhlIGB3b3JsZElkYCBvZiB0aGUgd29ybGQgZnJvbSB3aGljaCB0aGUgY3VycmVudCBydW4gaXMgYmVpbmcgZGVsZXRlZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICovXG4gICAgICAgIGRlbGV0ZVJ1bjogZnVuY3Rpb24gKHdvcmxkSWQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICBpZiAod29ybGRJZCkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuZmlsdGVyID0gd29ybGRJZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBkZWxldGVPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyICsgJy9ydW4nIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmRlbGV0ZShudWxsLCBkZWxldGVPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBDcmVhdGVzIGEgbmV3IHJ1biBmb3IgdGhlIHdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICB3YS5nZXRDdXJyZW50V29ybGRGb3JVc2VyKCc4ZjI2MDRjZi05NmNkLTQ0OWYtODJmYS1lMzMxNTMwNzM0ZWUnKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbiAod29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICB3YS5uZXdSdW5Gb3JXb3JsZCh3b3JsZC5pZCk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGB3b3JsZElkYCB3b3JsZElkIGluIHdoaWNoIHdlIGNyZWF0ZSB0aGUgbmV3IHJ1bi5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gYG9wdGlvbnNgIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zLm1vZGVsYCBUaGUgbW9kZWwgZmlsZSB0byB1c2UgdG8gY3JlYXRlIGEgcnVuIGlmIG5lZWRlZC5cbiAgICAgICAgKi9cbiAgICAgICAgbmV3UnVuRm9yV29ybGQ6IGZ1bmN0aW9uICh3b3JsZElkLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgY3VycmVudFJ1bk9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgZmlsdGVyOiB3b3JsZElkIHx8IHNlcnZpY2VPcHRpb25zLmZpbHRlciB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICAgICAgdmFsaWRhdGVNb2RlbE9yVGhyb3dFcnJvcihjdXJyZW50UnVuT3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRlbGV0ZVJ1bih3b3JsZElkLCBvcHRpb25zKVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLmdldEN1cnJlbnRSdW5JZChjdXJyZW50UnVuT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogQXNzaWducyBlbmQgdXNlcnMgdG8gd29ybGRzLCBjcmVhdGluZyBuZXcgd29ybGRzIGFzIGFwcHJvcHJpYXRlLCBhdXRvbWF0aWNhbGx5LiBBc3NpZ25zIGFsbCBlbmQgdXNlcnMgaW4gdGhlIGdyb3VwLCBhbmQgY3JlYXRlcyBuZXcgd29ybGRzIGFzIG5lZWRlZCBiYXNlZCBvbiB0aGUgcHJvamVjdC1sZXZlbCB3b3JsZCBjb25maWd1cmF0aW9uIChyb2xlcywgb3B0aW9uYWwgcm9sZXMsIGFuZCBtaW5pbXVtIGVuZCB1c2VycyBwZXIgd29ybGQpLlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAgICAgICAgKiAgICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHdhLmF1dG9Bc3NpZ24oKTtcbiAgICAgICAgKlxuICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqXG4gICAgICAgICovXG4gICAgICAgIGF1dG9Bc3NpZ246IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgdmFyIG9wdCA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFzc2lnbm1lbnRFbmRwb2ludCkgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgICAgICAgICBhY2NvdW50OiBvcHQuYWNjb3VudCxcbiAgICAgICAgICAgICAgICBwcm9qZWN0OiBvcHQucHJvamVjdCxcbiAgICAgICAgICAgICAgICBncm91cDogb3B0Lmdyb3VwXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAob3B0Lm1heFVzZXJzKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zLm1heFVzZXJzID0gb3B0Lm1heFVzZXJzO1xuICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QocGFyYW1zLCBvcHQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEdldHMgdGhlIHByb2plY3QncyB3b3JsZCBjb25maWd1cmF0aW9uLlxuICAgICAgICAqXG4gICAgICAgICogVHlwaWNhbGx5LCBldmVyeSBpbnRlcmFjdGlvbiB3aXRoIHlvdXIgcHJvamVjdCB1c2VzIHRoZSBzYW1lIGNvbmZpZ3VyYXRpb24gb2YgZWFjaCB3b3JsZC4gRm9yIGV4YW1wbGUsIGVhY2ggd29ybGQgaW4geW91ciBwcm9qZWN0IHByb2JhYmx5IGhhcyB0aGUgc2FtZSByb2xlcyBmb3IgZW5kIHVzZXJzLiBBbmQgeW91ciBwcm9qZWN0IGlzIHByb2JhYmx5IGVpdGhlciBjb25maWd1cmVkIHNvIHRoYXQgYWxsIGVuZCB1c2VycyBzaGFyZSB0aGUgc2FtZSB3b3JsZCAoYW5kIHJ1biksIG9yIHNtYWxsZXIgc2V0cyBvZiBlbmQgdXNlcnMgc2hhcmUgd29ybGRzIOKAlCBidXQgbm90IGJvdGguXG4gICAgICAgICpcbiAgICAgICAgKiAoVGhlIFtNdWx0aXBsYXllciBQcm9qZWN0IFJFU1QgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvbXVsdGlwbGF5ZXIvbXVsdGlwbGF5ZXJfcHJvamVjdC8pIGFsbG93cyB5b3UgdG8gc2V0IHRoZXNlIHByb2plY3QtbGV2ZWwgd29ybGQgY29uZmlndXJhdGlvbnMuIFRoZSBXb3JsZCBBZGFwdGVyIHNpbXBseSByZXRyaWV2ZXMgdGhlbSwgZm9yIGV4YW1wbGUgc28gdGhleSBjYW4gYmUgdXNlZCBpbiBhdXRvLWFzc2lnbm1lbnQgb2YgZW5kIHVzZXJzIHRvIHdvcmxkcy4pXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgd2EuZ2V0UHJvamVjdFNldHRpbmdzKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oc2V0dGluZ3MpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNldHRpbmdzLnJvbGVzKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNldHRpbmdzLm9wdGlvbmFsUm9sZXMpO1xuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IGBvcHRpb25zYCAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqL1xuICAgICAgICBnZXRQcm9qZWN0U2V0dGluZ3M6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgdmFyIG9wdCA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKHByb2plY3RFbmRwb2ludCkgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgb3B0LnVybCArPSBbb3B0LmFjY291bnQsIG9wdC5wcm9qZWN0XS5qb2luKCcvJyk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChudWxsLCBvcHQpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG4iLCIvKipcbiAqIEBjbGFzcyBDb29raWUgU3RvcmFnZSBTZXJ2aWNlXG4gKlxuICogQGV4YW1wbGVcbiAqICAgICAgdmFyIHBlb3BsZSA9IHJlcXVpcmUoJ2Nvb2tpZS1zdG9yZScpKHsgcm9vdDogJ3Blb3BsZScgfSk7XG4gICAgICAgIHBlb3BsZVxuICAgICAgICAgICAgLnNhdmUoe2xhc3ROYW1lOiAnc21pdGgnIH0pXG5cbiAqL1xuXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogTmFtZSBvZiBjb2xsZWN0aW9uXG4gICAgICAgICAqIEB0eXBlIHsgc3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcm9vdDogJy8nLFxuXG4gICAgICAgIGRvbWFpbjogJy5mb3Jpby5jb20nXG4gICAgfTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuICAgICAgICAvLyAqIFRCRFxuICAgICAgICAvLyAgKiBRdWVyeSBjb2xsZWN0aW9uOyB1c2VzIE1vbmdvREIgc3ludGF4XG4gICAgICAgIC8vICAqIEBzZWUgIDxUQkQ6IERhdGEgQVBJIFVSTD5cbiAgICAgICAgLy8gICpcbiAgICAgICAgLy8gICogQHBhcmFtIHsgc3RyaW5nfSBxcyBRdWVyeSBGaWx0ZXJcbiAgICAgICAgLy8gICogQHBhcmFtIHsgc3RyaW5nfSBsaW1pdGVycyBAc2VlIDxUQkQ6IHVybCBmb3IgbGltaXRzLCBwYWdpbmcgZXRjPlxuICAgICAgICAvLyAgKlxuICAgICAgICAvLyAgKiBAZXhhbXBsZVxuICAgICAgICAvLyAgKiAgICAgY3MucXVlcnkoXG4gICAgICAgIC8vICAqICAgICAgeyBuYW1lOiAnSm9obicsIGNsYXNzTmFtZTogJ0NTQzEwMScgfSxcbiAgICAgICAgLy8gICogICAgICB7bGltaXQ6IDEwfVxuICAgICAgICAvLyAgKiAgICAgKVxuXG4gICAgICAgIC8vIHF1ZXJ5OiBmdW5jdGlvbiAocXMsIGxpbWl0ZXJzKSB7XG5cbiAgICAgICAgLy8gfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2F2ZSBjb29raWUgdmFsdWVcbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xPYmplY3R9IGtleSAgIElmIGdpdmVuIGEga2V5IHNhdmUgdmFsdWVzIHVuZGVyIGl0LCBpZiBnaXZlbiBhbiBvYmplY3QgZGlyZWN0bHksIHNhdmUgdG8gdG9wLWxldmVsIGFwaVxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IHZhbHVlIChPcHRpb25hbClcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgT3ZlcnJpZGVzIGZvciBzZXJ2aWNlIG9wdGlvbnNcbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybiB7Kn0gVGhlIHNhdmVkIHZhbHVlXG4gICAgICAgICAqXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqICAgICBjcy5zZXQoJ3BlcnNvbicsIHsgZmlyc3ROYW1lOiAnam9obicsIGxhc3ROYW1lOiAnc21pdGgnIH0pO1xuICAgICAgICAgKiAgICAgY3Muc2V0KHsgbmFtZTonc21pdGgnLCBhZ2U6JzMyJyB9KTtcbiAgICAgICAgICovXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGtleSwgdmFsdWUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBzZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIGRvbWFpbiA9IHNldE9wdGlvbnMuZG9tYWluO1xuICAgICAgICAgICAgdmFyIHBhdGggPSBzZXRPcHRpb25zLnJvb3Q7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LmNvb2tpZSA9IGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgJz0nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChkb21haW4gPyAnOyBkb21haW49JyArIGRvbWFpbiA6ICcnKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChwYXRoID8gJzsgcGF0aD0nICsgcGF0aCA6ICcnKTtcblxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMb2FkIGNvb2tpZSB2YWx1ZVxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfE9iamVjdH0ga2V5ICAgSWYgZ2l2ZW4gYSBrZXkgc2F2ZSB2YWx1ZXMgdW5kZXIgaXQsIGlmIGdpdmVuIGFuIG9iamVjdCBkaXJlY3RseSwgc2F2ZSB0byB0b3AtbGV2ZWwgYXBpXG4gICAgICAgICAqIEByZXR1cm4geyp9IFRoZSB2YWx1ZSBzdG9yZWRcbiAgICAgICAgICpcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogICAgIGNzLmdldCgncGVyc29uJyk7XG4gICAgICAgICAqL1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHZhciBjb29raWVSZWcgPSBuZXcgUmVnRXhwKCcoPzooPzpefC4qOylcXFxccyonICsgZW5jb2RlVVJJQ29tcG9uZW50KGtleSkucmVwbGFjZSgvW1xcLVxcLlxcK1xcKl0vZywgJ1xcXFwkJicpICsgJ1xcXFxzKlxcXFw9XFxcXHMqKFteO10qKS4qJCl8Xi4qJCcpO1xuICAgICAgICAgICAgdmFyIHZhbCA9IGRvY3VtZW50LmNvb2tpZS5yZXBsYWNlKGNvb2tpZVJlZywgJyQxJyk7XG4gICAgICAgICAgICB2YWwgPSBkZWNvZGVVUklDb21wb25lbnQodmFsKSB8fCBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBrZXkgZnJvbSBjb2xsZWN0aW9uXG4gICAgICAgICAqIEBwYXJhbSB7IHN0cmluZ30ga2V5IGtleSB0byByZW1vdmVcbiAgICAgICAgICogQHJldHVybiB7IHN0cmluZ30ga2V5IFRoZSBrZXkgcmVtb3ZlZFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiAgICAgY3MucmVtb3ZlKCdwZXJzb24nKTtcbiAgICAgICAgICovXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24gKGtleSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHJlbU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgZG9tYWluID0gcmVtT3B0aW9ucy5kb21haW47XG4gICAgICAgICAgICB2YXIgcGF0aCA9IHJlbU9wdGlvbnMucm9vdDtcblxuICAgICAgICAgICAgZG9jdW1lbnQuY29va2llID0gZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc9OyBleHBpcmVzPVRodSwgMDEgSmFuIDE5NzAgMDA6MDA6MDAgR01UJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGRvbWFpbiA/ICc7IGRvbWFpbj0nICsgZG9tYWluIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAocGF0aCA/ICc7IHBhdGg9JyArIHBhdGggOiAnJyk7XG4gICAgICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmVzIGNvbGxlY3Rpb24gYmVpbmcgcmVmZXJlbmNlZFxuICAgICAgICAgKiBAcmV0dXJuIHsgYXJyYXl9IGtleXMgQWxsIHRoZSBrZXlzIHJlbW92ZWRcbiAgICAgICAgICovXG4gICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhS2V5cyA9IGRvY3VtZW50LmNvb2tpZS5yZXBsYWNlKC8oKD86XnxcXHMqOylbXlxcPV0rKSg/PTt8JCl8Xlxccyp8XFxzKig/OlxcPVteO10qKT8oPzpcXDF8JCkvZywgJycpLnNwbGl0KC9cXHMqKD86XFw9W147XSopPztcXHMqLyk7XG4gICAgICAgICAgICBmb3IgKHZhciBuSWR4ID0gMDsgbklkeCA8IGFLZXlzLmxlbmd0aDsgbklkeCsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvb2tpZUtleSA9IGRlY29kZVVSSUNvbXBvbmVudChhS2V5c1tuSWR4XSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmUoY29va2llS2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhS2V5cztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIi8qKlxuICAgIERlY2lkZXMgdHlwZSBvZiBzdG9yZSB0byBwcm92aWRlXG4qL1xuXG4ndXNlIHN0cmljdCc7XG4vLyB2YXIgaXNOb2RlID0gZmFsc2U7IEZJWE1FOiBCcm93c2VyaWZ5L21pbmlmeWlmeSBoYXMgaXNzdWVzIHdpdGggdGhlIG5leHQgbGlua1xuLy8gdmFyIHN0b3JlID0gKGlzTm9kZSkgPyByZXF1aXJlKCcuL3Nlc3Npb24tc3RvcmUnKSA6IHJlcXVpcmUoJy4vY29va2llLXN0b3JlJyk7XG52YXIgc3RvcmUgPSByZXF1aXJlKCcuL2Nvb2tpZS1zdG9yZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHN0b3JlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcXV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbC9xdWVyeS11dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuXG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICB1cmw6ICcnLFxuXG4gICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIGhlYWRlcnM6IHt9LFxuICAgICAgICBzdGF0dXNDb2RlOiB7XG4gICAgICAgICAgICA0MDQ6ICQubm9vcFxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPTkxZIGZvciBzdHJpbmdzIGluIHRoZSB1cmwuIEFsbCBHRVQgJiBERUxFVEUgcGFyYW1zIGFyZSBydW4gdGhyb3VnaCB0aGlzXG4gICAgICAgICAqIEB0eXBlIHtbdHlwZV0gfVxuICAgICAgICAgKi9cbiAgICAgICAgcGFyYW1ldGVyUGFyc2VyOiBxdXRpbHMudG9RdWVyeUZvcm1hdCxcblxuICAgICAgICAvLyBUbyBhbGxvdyBlcGljZW50ZXIudG9rZW4gYW5kIG90aGVyIHNlc3Npb24gY29va2llcyB0byBiZSBwYXNzZWRcbiAgICAgICAgLy8gd2l0aCB0aGUgcmVxdWVzdHNcbiAgICAgICAgeGhyRmllbGRzOiB7XG4gICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWVcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgdHJhbnNwb3J0T3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcblxuICAgIHZhciByZXN1bHQgPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gKCQuaXNGdW5jdGlvbihkKSkgPyBkKCkgOiBkO1xuICAgIH07XG5cbiAgICB2YXIgY29ubmVjdCA9IGZ1bmN0aW9uIChtZXRob2QsIHBhcmFtcywgY29ubmVjdE9wdGlvbnMpIHtcbiAgICAgICAgcGFyYW1zID0gcmVzdWx0KHBhcmFtcyk7XG4gICAgICAgIHBhcmFtcyA9ICgkLmlzUGxhaW5PYmplY3QocGFyYW1zKSB8fCAkLmlzQXJyYXkocGFyYW1zKSkgPyBKU09OLnN0cmluZ2lmeShwYXJhbXMpIDogcGFyYW1zO1xuXG4gICAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHRyYW5zcG9ydE9wdGlvbnMsIGNvbm5lY3RPcHRpb25zLCB7XG4gICAgICAgICAgICB0eXBlOiBtZXRob2QsXG4gICAgICAgICAgICBkYXRhOiBwYXJhbXNcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBBTExPV0VEX1RPX0JFX0ZVTkNUSU9OUyA9IFsnZGF0YScsICd1cmwnXTtcbiAgICAgICAgJC5lYWNoKG9wdGlvbnMsIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKHZhbHVlKSAmJiAkLmluQXJyYXkoa2V5LCBBTExPV0VEX1RPX0JFX0ZVTkNUSU9OUykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9uc1trZXldID0gdmFsdWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMubG9nTGV2ZWwgJiYgb3B0aW9ucy5sb2dMZXZlbCA9PT0gJ0RFQlVHJykge1xuICAgICAgICAgICAgY29uc29sZS5sb2cob3B0aW9ucy51cmwpO1xuICAgICAgICAgICAgdmFyIG9sZFN1Y2Nlc3NGbiA9IG9wdGlvbnMuc3VjY2VzcyB8fCAkLm5vb3A7XG4gICAgICAgICAgICBvcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbiAocmVzcG9uc2UsIGFqYXhTdGF0dXMsIGFqYXhSZXEpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgb2xkU3VjY2Vzc0ZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGJlZm9yZVNlbmQgPSBvcHRpb25zLmJlZm9yZVNlbmQ7XG4gICAgICAgIG9wdGlvbnMuYmVmb3JlU2VuZCA9IGZ1bmN0aW9uICh4aHIsIHNldHRpbmdzKSB7XG4gICAgICAgICAgICB4aHIucmVxdWVzdFVybCA9IChjb25uZWN0T3B0aW9ucyB8fCB7fSkudXJsO1xuICAgICAgICAgICAgaWYgKGJlZm9yZVNlbmQpIHtcbiAgICAgICAgICAgICAgICBiZWZvcmVTZW5kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuICQuYWpheChvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcbiAgICAgICAgZ2V0OmZ1bmN0aW9uIChwYXJhbXMsIGFqYXhPcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCB0cmFuc3BvcnRPcHRpb25zLCBhamF4T3B0aW9ucyk7XG4gICAgICAgICAgICBwYXJhbXMgPSBvcHRpb25zLnBhcmFtZXRlclBhcnNlcihyZXN1bHQocGFyYW1zKSk7XG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdC5jYWxsKHRoaXMsICdHRVQnLCBwYXJhbXMsIG9wdGlvbnMpO1xuICAgICAgICB9LFxuICAgICAgICBzcGxpdEdldDogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIH0sXG4gICAgICAgIHBvc3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0LmFwcGx5KHRoaXMsIFsncG9zdCddLmNvbmNhdChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgfSxcbiAgICAgICAgcGF0Y2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0LmFwcGx5KHRoaXMsIFsncGF0Y2gnXS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH0sXG4gICAgICAgIHB1dDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuYXBwbHkodGhpcywgWydwdXQnXS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH0sXG4gICAgICAgIGRlbGV0ZTogZnVuY3Rpb24gKHBhcmFtcywgYWpheE9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vREVMRVRFIGRvZXNuJ3Qgc3VwcG9ydCBib2R5IHBhcmFtcywgYnV0IGpRdWVyeSB0aGlua3MgaXQgZG9lcy5cbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoe30sIHRyYW5zcG9ydE9wdGlvbnMsIGFqYXhPcHRpb25zKTtcbiAgICAgICAgICAgIHBhcmFtcyA9IG9wdGlvbnMucGFyYW1ldGVyUGFyc2VyKHJlc3VsdChwYXJhbXMpKTtcbiAgICAgICAgICAgIGlmICgkLnRyaW0ocGFyYW1zKSkge1xuICAgICAgICAgICAgICAgIHZhciBkZWxpbWl0ZXIgPSAocmVzdWx0KG9wdGlvbnMudXJsKS5pbmRleE9mKCc/JykgPT09IC0xKSA/ICc/JyA6ICcmJztcbiAgICAgICAgICAgICAgICBvcHRpb25zLnVybCA9IHJlc3VsdChvcHRpb25zLnVybCkgKyBkZWxpbWl0ZXIgKyBwYXJhbXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdC5jYWxsKHRoaXMsICdERUxFVEUnLCBudWxsLCBvcHRpb25zKTtcbiAgICAgICAgfSxcbiAgICAgICAgaGVhZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuYXBwbHkodGhpcywgWydoZWFkJ10uY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9LFxuICAgICAgICBvcHRpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdC5hcHBseSh0aGlzLCBbJ29wdGlvbnMnXS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyB2YXIgaXNOb2RlID0gZmFsc2U7IEZJWE1FOiBCcm93c2VyaWZ5L21pbmlmeWlmeSBoYXMgaXNzdWVzIHdpdGggdGhlIG5leHQgbGlua1xuLy8gdmFyIHRyYW5zcG9ydCA9IChpc05vZGUpID8gcmVxdWlyZSgnLi9ub2RlLWh0dHAtdHJhbnNwb3J0JykgOiByZXF1aXJlKCcuL2FqYXgtaHR0cC10cmFuc3BvcnQnKTtcbnZhciB0cmFuc3BvcnQgPSByZXF1aXJlKCcuL2FqYXgtaHR0cC10cmFuc3BvcnQnKTtcbm1vZHVsZS5leHBvcnRzID0gdHJhbnNwb3J0O1xuIiwiLyoqXG4vKiBJbmhlcml0IGZyb20gYSBjbGFzcyAodXNpbmcgcHJvdG90eXBlIGJvcnJvd2luZylcbiovXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGluaGVyaXQoQywgUCkge1xuICAgIHZhciBGID0gZnVuY3Rpb24gKCkge307XG4gICAgRi5wcm90b3R5cGUgPSBQLnByb3RvdHlwZTtcbiAgICBDLnByb3RvdHlwZSA9IG5ldyBGKCk7XG4gICAgQy5fX3N1cGVyID0gUC5wcm90b3R5cGU7XG4gICAgQy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDO1xufVxuXG4vKipcbiogU2hhbGxvdyBjb3B5IG9mIGFuIG9iamVjdFxuKi9cbnZhciBleHRlbmQgPSBmdW5jdGlvbiAoZGVzdCAvKiwgdmFyX2FyZ3MqLykge1xuICAgIHZhciBvYmogPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHZhciBjdXJyZW50O1xuICAgIGZvciAodmFyIGogPSAwOyBqPG9iai5sZW5ndGg7IGorKykge1xuICAgICAgICBpZiAoIShjdXJyZW50ID0gb2JqW2pdKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBkbyBub3Qgd3JhcCBpbm5lciBpbiBkZXN0Lmhhc093blByb3BlcnR5IG9yIGJhZCB0aGluZ3Mgd2lsbCBoYXBwZW5cbiAgICAgICAgLypqc2hpbnQgLVcwODkgKi9cbiAgICAgICAgZm9yICh2YXIga2V5IGluIGN1cnJlbnQpIHtcbiAgICAgICAgICAgIGRlc3Rba2V5XSA9IGN1cnJlbnRba2V5XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZXN0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYmFzZSwgcHJvcHMsIHN0YXRpY1Byb3BzKSB7XG4gICAgdmFyIHBhcmVudCA9IGJhc2U7XG4gICAgdmFyIGNoaWxkO1xuXG4gICAgY2hpbGQgPSBwcm9wcyAmJiBwcm9wcy5oYXNPd25Qcm9wZXJ0eSgnY29uc3RydWN0b3InKSA/IHByb3BzLmNvbnN0cnVjdG9yIDogZnVuY3Rpb24gKCkgeyByZXR1cm4gcGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH07XG5cbiAgICAvLyBhZGQgc3RhdGljIHByb3BlcnRpZXMgdG8gdGhlIGNoaWxkIGNvbnN0cnVjdG9yIGZ1bmN0aW9uXG4gICAgZXh0ZW5kKGNoaWxkLCBwYXJlbnQsIHN0YXRpY1Byb3BzKTtcblxuICAgIC8vIGFzc29jaWF0ZSBwcm90b3R5cGUgY2hhaW5cbiAgICBpbmhlcml0KGNoaWxkLCBwYXJlbnQpO1xuXG4gICAgLy8gYWRkIGluc3RhbmNlIHByb3BlcnRpZXNcbiAgICBpZiAocHJvcHMpIHtcbiAgICAgICAgZXh0ZW5kKGNoaWxkLnByb3RvdHlwZSwgcHJvcHMpO1xuICAgIH1cblxuICAgIC8vIGRvbmVcbiAgICByZXR1cm4gY2hpbGQ7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuLypqc2hpbnQgbG9vcGZ1bmM6ZmFsc2UgKi9cblxuZnVuY3Rpb24gX3codmFsKSB7XG4gICAgaWYgKHZhbCAmJiB2YWwudGhlbikge1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH1cbiAgICB2YXIgcCA9ICQuRGVmZXJyZWQoKTtcbiAgICBwLnJlc29sdmUodmFsKTtcblxuICAgIHJldHVybiBwLnByb21pc2UoKTtcbn1cblxuZnVuY3Rpb24gc2VxKCkge1xuICAgIHZhciBsaXN0ID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGFyZ3VtZW50cyk7XG5cbiAgICBmdW5jdGlvbiBuZXh0KHApIHtcbiAgICAgICAgdmFyIGN1ciA9IGxpc3Quc3BsaWNlKDAsMSlbMF07XG5cbiAgICAgICAgaWYgKCFjdXIpIHtcbiAgICAgICAgICAgIHJldHVybiBwO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIF93KGN1cihwKSkudGhlbihuZXh0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKHNlZWQpIHtcbiAgICAgICAgcmV0dXJuIG5leHQoc2VlZCkuZmFpbChzZXEuZmFpbCk7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gTWFrZVNlcShvYmopIHtcbiAgICB2YXIgcmVzID0ge1xuICAgICAgICBfX2NhbGxzOiBbXSxcblxuICAgICAgICBvcmlnaW5hbDogb2JqLFxuXG4gICAgICAgIHRoZW46IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgdGhpcy5fX2NhbGxzLnB1c2goZm4pO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgICAgIC8vIGNsZWFuIHVwXG4gICAgICAgICAgICB0aGlzLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgICAgIF90aGlzLl9fY2FsbHMubGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBzZXEuYXBwbHkobnVsbCwgdGhpcy5fX2NhbGxzKSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZhaWw6IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgc2VxLmZhaWwgPSBmbjtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBmdW5jTWFrZXIgPSBmdW5jdGlvbiAocCwgb2JqKSB7XG4gICAgICAgIHZhciBmbiA9IG9ialtwXS5iaW5kKG9iaik7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShhcmd1bWVudHMpO1xuICAgICAgICAgICAgdGhpcy5fX2NhbGxzLnB1c2goRnVuY3Rpb24uYmluZC5hcHBseShmbiwgW251bGxdLmNvbmNhdChhcmdzKSkpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqW3Byb3BdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXNbcHJvcF0gPSBmdW5jTWFrZXIocHJvcCwgb2JqKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc1twcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWFrZVNlcTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgX3BpY2s6IGZ1bmN0aW9uIChvYmosIHByb3BzKSB7XG4gICAgICAgIHZhciByZXMgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgcCBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmIChwcm9wcy5pbmRleE9mKHApICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJlc1twXSA9IG9ialtwXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxufTtcbiIsIi8qKlxuICogVXRpbGl0aWVzIGZvciB3b3JraW5nIHdpdGggcXVlcnkgc3RyaW5nc1xuKi9cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbnZlcnRzIHRvIG1hdHJpeCBmb3JtYXRcbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBxcyBPYmplY3QgdG8gY29udmVydCB0byBxdWVyeSBzdHJpbmdcbiAgICAgICAgICogQHJldHVybiB7IHN0cmluZ30gICAgTWF0cml4LWZvcm1hdCBxdWVyeSBwYXJhbWV0ZXJzXG4gICAgICAgICAqL1xuICAgICAgICB0b01hdHJpeEZvcm1hdDogZnVuY3Rpb24gKHFzKSB7XG4gICAgICAgICAgICBpZiAocXMgPT09IG51bGwgfHwgcXMgPT09IHVuZGVmaW5lZCB8fCBxcyA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJzsnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBxcyA9PT0gJ3N0cmluZycgfHwgcXMgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciByZXR1cm5BcnJheSA9IFtdO1xuICAgICAgICAgICAgdmFyIE9QRVJBVE9SUyA9IFsnPCcsICc+JywgJyEnXTtcbiAgICAgICAgICAgICQuZWFjaChxcywgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyB8fCAkLmluQXJyYXkoJC50cmltKHZhbHVlKS5jaGFyQXQoMCksIE9QRVJBVE9SUykgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gJz0nICsgdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybkFycmF5LnB1c2goa2V5ICsgdmFsdWUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHZhciBtdHJ4ID0gJzsnICsgcmV0dXJuQXJyYXkuam9pbignOycpO1xuICAgICAgICAgICAgcmV0dXJuIG10cng7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbnZlcnRzIHN0cmluZ3MvYXJyYXlzL29iamVjdHMgdG8gdHlwZSAnYT1iJmI9YydcbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xBcnJheXxPYmplY3R9IHFzXG4gICAgICAgICAqIEByZXR1cm4geyBzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0b1F1ZXJ5Rm9ybWF0OiBmdW5jdGlvbiAocXMpIHtcbiAgICAgICAgICAgIGlmIChxcyA9PT0gbnVsbCB8fCBxcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBxcyA9PT0gJ3N0cmluZycgfHwgcXMgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciByZXR1cm5BcnJheSA9IFtdO1xuICAgICAgICAgICAgJC5lYWNoKHFzLCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICgkLmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuam9pbignLCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAvL01vc3RseSBmb3IgZGF0YSBhcGlcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybkFycmF5LnB1c2goa2V5ICsgJz0nICsgdmFsdWUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHZhciByZXN1bHQgPSByZXR1cm5BcnJheS5qb2luKCcmJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb252ZXJ0cyBzdHJpbmdzIG9mIHR5cGUgJ2E9YiZiPWMnIHRvIHsgYTpiLCBiOmN9XG4gICAgICAgICAqIEBwYXJhbSAgeyBzdHJpbmd9IHFzXG4gICAgICAgICAqIEByZXR1cm4ge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHFzVG9PYmplY3Q6IGZ1bmN0aW9uIChxcykge1xuICAgICAgICAgICAgaWYgKHFzID09PSBudWxsIHx8IHFzID09PSB1bmRlZmluZWQgfHwgcXMgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcXNBcnJheSA9IHFzLnNwbGl0KCcmJyk7XG4gICAgICAgICAgICB2YXIgcmV0dXJuT2JqID0ge307XG4gICAgICAgICAgICAkLmVhY2gocXNBcnJheSwgZnVuY3Rpb24gKGluZGV4LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBxS2V5ID0gdmFsdWUuc3BsaXQoJz0nKVswXTtcbiAgICAgICAgICAgICAgICB2YXIgcVZhbCA9IHZhbHVlLnNwbGl0KCc9JylbMV07XG5cbiAgICAgICAgICAgICAgICBpZiAocVZhbC5pbmRleE9mKCcsJykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHFWYWwgPSBxVmFsLnNwbGl0KCcsJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuT2JqW3FLZXldID0gcVZhbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuT2JqO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOb3JtYWxpemVzIGFuZCBtZXJnZXMgc3RyaW5ncyBvZiB0eXBlICdhPWInLCB7IGI6Y30gdG8geyBhOmIsIGI6Y31cbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ3xBcnJheXxPYmplY3R9IHFzMVxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfEFycmF5fE9iamVjdH0gcXMyXG4gICAgICAgICAqIEByZXR1cm4ge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIG1lcmdlUVM6IGZ1bmN0aW9uIChxczEsIHFzMikge1xuICAgICAgICAgICAgdmFyIG9iajEgPSB0aGlzLnFzVG9PYmplY3QodGhpcy50b1F1ZXJ5Rm9ybWF0KHFzMSkpO1xuICAgICAgICAgICAgdmFyIG9iajIgPSB0aGlzLnFzVG9PYmplY3QodGhpcy50b1F1ZXJ5Rm9ybWF0KHFzMikpO1xuICAgICAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHt9LCBvYmoxLCBvYmoyKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGRUcmFpbGluZ1NsYXNoOiBmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgICAgICBpZiAoIXVybCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAodXJsLmNoYXJBdCh1cmwubGVuZ3RoIC0gMSkgPT09ICcvJykgPyB1cmwgOiAodXJsICsgJy8nKTtcbiAgICAgICAgfVxuICAgIH07XG59KCkpO1xuXG5cblxuIiwiLyoqXG4gKiBVdGlsaXRpZXMgZm9yIHdvcmtpbmcgd2l0aCB0aGUgcnVuIHNlcnZpY2VcbiovXG4ndXNlIHN0cmljdCc7XG52YXIgcXV0aWwgPSByZXF1aXJlKCcuL3F1ZXJ5LXV0aWwnKTtcbnZhciBNQVhfVVJMX0xFTkdUSCA9IDIwNDg7XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogcmV0dXJucyBvcGVyYXRpb25zIG9mIHRoZSBmb3JtIGBbW29wMSxvcDJdLCBbYXJnMSwgYXJnMl1dYFxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R8QXJyYXl8U3RyaW5nfSBgb3BlcmF0aW9uc2Agb3BlcmF0aW9ucyB0byBwZXJmb3JtXG4gICAgICAgICAqIEBwYXJhbSAge0FycmF5fSBgYXJnc2AgYXJndW1lbnRzIGZvciBvcGVyYXRpb25cbiAgICAgICAgICogQHJldHVybiB7U3RyaW5nfSAgICBNYXRyaXgtZm9ybWF0IHF1ZXJ5IHBhcmFtZXRlcnNcbiAgICAgICAgICovXG4gICAgICAgIG5vcm1hbGl6ZU9wZXJhdGlvbnM6IGZ1bmN0aW9uIChvcGVyYXRpb25zLCBhcmdzKSB7XG4gICAgICAgICAgICBpZiAoIWFyZ3MpIHtcbiAgICAgICAgICAgICAgICBhcmdzID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcmV0dXJuTGlzdCA9IHtcbiAgICAgICAgICAgICAgICBvcHM6IFtdLFxuICAgICAgICAgICAgICAgIGFyZ3M6IFtdXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgX2NvbmNhdCA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGFyciAhPT0gbnVsbCAmJiBhcnIgIT09IHVuZGVmaW5lZCkgPyBbXS5jb25jYXQoYXJyKSA6IFtdO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy97IGFkZDogWzEsMl0sIHN1YnRyYWN0OiBbMiw0XSB9XG4gICAgICAgICAgICB2YXIgX25vcm1hbGl6ZVBsYWluT2JqZWN0cyA9IGZ1bmN0aW9uIChvcGVyYXRpb25zLCByZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXR1cm5MaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybkxpc3QgPSB7IG9wczogW10sIGFyZ3M6IFtdIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICQuZWFjaChvcGVyYXRpb25zLCBmdW5jdGlvbiAob3BuLCBhcmcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuTGlzdC5vcHMucHVzaChvcG4pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5MaXN0LmFyZ3MucHVzaChfY29uY2F0KGFyZykpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXR1cm5MaXN0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8veyBuYW1lOiAnYWRkJywgcGFyYW1zOiBbMV0gfVxuICAgICAgICAgICAgdmFyIF9ub3JtYWxpemVTdHJ1Y3R1cmVkT2JqZWN0cyA9IGZ1bmN0aW9uIChvcGVyYXRpb24sIHJldHVybkxpc3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXJldHVybkxpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuTGlzdCA9IHsgb3BzOiBbXSwgYXJnczogW10gfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuTGlzdC5vcHMucHVzaChvcGVyYXRpb24ubmFtZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuTGlzdC5hcmdzLnB1c2goX2NvbmNhdChvcGVyYXRpb24ucGFyYW1zKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldHVybkxpc3Q7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgX25vcm1hbGl6ZU9iamVjdCA9IGZ1bmN0aW9uIChvcGVyYXRpb24sIHJldHVybkxpc3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKChvcGVyYXRpb24ubmFtZSkgPyBfbm9ybWFsaXplU3RydWN0dXJlZE9iamVjdHMgOiBfbm9ybWFsaXplUGxhaW5PYmplY3RzKShvcGVyYXRpb24sIHJldHVybkxpc3QpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIF9ub3JtYWxpemVMaXRlcmFscyA9IGZ1bmN0aW9uIChvcGVyYXRpb24sIGFyZ3MsIHJldHVybkxpc3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXJldHVybkxpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuTGlzdCA9IHsgb3BzOiBbXSwgYXJnczogW10gfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuTGlzdC5vcHMucHVzaChvcGVyYXRpb24pO1xuICAgICAgICAgICAgICAgIHJldHVybkxpc3QuYXJncy5wdXNoKF9jb25jYXQoYXJncykpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXR1cm5MaXN0O1xuICAgICAgICAgICAgfTtcblxuXG4gICAgICAgICAgICB2YXIgX25vcm1hbGl6ZUFycmF5cyA9IGZ1bmN0aW9uIChvcGVyYXRpb25zLCBhcmcsIHJldHVybkxpc3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXJldHVybkxpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuTGlzdCA9IHsgb3BzOiBbXSwgYXJnczogW10gfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJC5lYWNoKG9wZXJhdGlvbnMsIGZ1bmN0aW9uIChpbmRleCwgb3BuKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3Qob3BuKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX25vcm1hbGl6ZU9iamVjdChvcG4sIHJldHVybkxpc3QpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgX25vcm1hbGl6ZUxpdGVyYWxzKG9wbiwgYXJnc1tpbmRleF0sIHJldHVybkxpc3QpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldHVybkxpc3Q7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KG9wZXJhdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgX25vcm1hbGl6ZU9iamVjdChvcGVyYXRpb25zLCByZXR1cm5MaXN0KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoJC5pc0FycmF5KG9wZXJhdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgX25vcm1hbGl6ZUFycmF5cyhvcGVyYXRpb25zLCBhcmdzLCByZXR1cm5MaXN0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgX25vcm1hbGl6ZUxpdGVyYWxzKG9wZXJhdGlvbnMsIGFyZ3MsIHJldHVybkxpc3QpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuTGlzdDtcbiAgICAgICAgfSxcblxuICAgICAgICBzcGxpdEdldEZhY3Rvcnk6IGZ1bmN0aW9uIChodHRwT3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgaHR0cCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIGdldFZhbHVlID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gb3B0aW9uc1tuYW1lXSB8fCBodHRwT3B0aW9uc1tuYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciBnZXRGaW5hbFVybCA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVybCA9IGdldFZhbHVlKCd1cmwnLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBwYXJhbXM7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZXJlIGlzIGVhc3kgKG9yIGtub3duKSB3YXkgdG8gZ2V0IHRoZSBmaW5hbCBVUkwganF1ZXJ5IGlzIGdvaW5nIHRvIHNlbmQgc29cbiAgICAgICAgICAgICAgICAgICAgLy8gd2UncmUgcmVwbGljYXRpbmcgaXQuIFRoZSBwcm9jZXNzIG1pZ2h0IGNoYW5nZSBhdCBzb21lIHBvaW50IGJ1dCBpdCBwcm9iYWJseSB3aWxsIG5vdC5cbiAgICAgICAgICAgICAgICAgICAgLy8gMS4gUmVtb3ZlIGhhc2hcbiAgICAgICAgICAgICAgICAgICAgdXJsID0gdXJsLnJlcGxhY2UoLyMuKiQvLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIDEuIEFwcGVuZCBxdWVyeSBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgdmFyIHF1ZXJ5UGFyYW1zID0gcXV0aWwudG9RdWVyeUZvcm1hdChkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHF1ZXN0aW9uSWR4ID0gdXJsLmluZGV4T2YoJz8nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXJ5UGFyYW1zICYmIHF1ZXN0aW9uSWR4ID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1cmwgKyAnJicgKyBxdWVyeVBhcmFtcztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChxdWVyeVBhcmFtcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVybCArICc/JyArIHF1ZXJ5UGFyYW1zO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1cmw7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB2YXIgdXJsID0gZ2V0RmluYWxVcmwocGFyYW1zKTtcbiAgICAgICAgICAgICAgICAvLyBXZSBtdXN0IHNwbGl0IHRoZSBHRVQgaW4gbXVsdGlwbGUgc2hvcnQgVVJMJ3NcbiAgICAgICAgICAgICAgICAvLyBUaGUgb25seSBwcm9wZXJ0eSBhbGxvd2VkIHRvIGJlIHNwbGl0IGlzIFwiaW5jbHVkZVwiXG4gICAgICAgICAgICAgICAgaWYgKHBhcmFtcyAmJiBwYXJhbXMuaW5jbHVkZSAmJiB1cmwubGVuZ3RoID4gTUFYX1VSTF9MRU5HVEgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGR0ZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmFtc0NvcHkgPSAkLmV4dGVuZCh0cnVlLCB7fSwgcGFyYW1zKTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHBhcmFtc0NvcHkuaW5jbHVkZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVybE5vSW5jbHVkZXMgPSBnZXRGaW5hbFVybChwYXJhbXNDb3B5KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpZmYgPSBNQVhfVVJMX0xFTkdUSCAtIHVybE5vSW5jbHVkZXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICB2YXIgb2xkU3VjY2VzcyA9IG9wdGlvbnMuc3VjY2VzcyB8fCBodHRwT3B0aW9ucy5zdWNjZXNzIHx8ICQubm9vcDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9sZEVycm9yID0gb3B0aW9ucy5lcnJvciB8fCBodHRwT3B0aW9ucy5lcnJvciB8fCAkLm5vb3A7XG4gICAgICAgICAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgb3JpZ2luYWwgc3VjY2VzcyBhbmQgZXJyb3IgY2FsbGJhY2tzXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuc3VjY2VzcyA9ICQubm9vcDtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5lcnJvciA9ICQubm9vcDtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgaW5jbHVkZSA9IHBhcmFtcy5pbmNsdWRlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3VyckluY2x1ZGVzID0gW107XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmNsdWRlT3B0cyA9IFtjdXJySW5jbHVkZXNdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3Vyckxlbmd0aCA9ICc/aW5jbHVkZT0nLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhcmlhYmxlID0gaW5jbHVkZS5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHZhcmlhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBVc2UgYSBncmVlZHkgYXBwcm9hY2ggZm9yIG5vdywgY2FuIGJlIG9wdGltaXplZCB0byBiZSBzb2x2ZWQgaW4gYSBtb3JlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBlZmZpY2llbnQgd2F5XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyArIDEgaXMgdGhlIGNvbW1hXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3Vyckxlbmd0aCArIHZhcmlhYmxlLmxlbmd0aCArIDEgPCBkaWZmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VyckluY2x1ZGVzLnB1c2godmFyaWFibGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJMZW5ndGggKz0gdmFyaWFibGUubGVuZ3RoICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VyckluY2x1ZGVzID0gW3ZhcmlhYmxlXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlT3B0cy5wdXNoKGN1cnJJbmNsdWRlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyckxlbmd0aCA9ICc/aW5jbHVkZT0nLmxlbmd0aCArIHZhcmlhYmxlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlID0gaW5jbHVkZS5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVxcyA9ICQubWFwKGluY2x1ZGVPcHRzLCBmdW5jdGlvbiAoaW5jbHVkZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlcVBhcmFtcyA9ICQuZXh0ZW5kKHt9LCBwYXJhbXMsIHsgaW5jbHVkZTogaW5jbHVkZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBodHRwLmdldChyZXFQYXJhbXMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJC53aGVuLmFwcGx5KCQsIHJlcXMpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRWFjaCBhcmd1bWVudCBhcmUgYXJyYXlzIG9mIHRoZSBhcmd1bWVudHMgb2YgZWFjaCBkb25lIHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNvIHRoZSBmaXJzdCBhcmd1bWVudCBvZiB0aGUgZmlyc3QgYXJyYXkgb2YgYXJndW1lbnRzIGlzIHRoZSBkYXRhXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXNWYWxpZCA9IGFyZ3VtZW50c1swXSAmJiBhcmd1bWVudHNbMF1bMF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTaG91bGQgbmV2ZXIgaGFwcGVuLi4uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkRXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZHRkLnJlamVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZpcnN0UmVzcG9uc2UgPSBhcmd1bWVudHNbMF1bMF07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXNPYmplY3QgPSAkLmlzUGxhaW5PYmplY3QoZmlyc3RSZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXNSdW5BUEkgPSAoaXNPYmplY3QgJiYgJC5pc1BsYWluT2JqZWN0KGZpcnN0UmVzcG9uc2UudmFyaWFibGVzKSkgfHwgIWlzT2JqZWN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzUnVuQVBJKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFnZ3JlZ2F0ZSB0aGUgdmFyaWFibGVzIHByb3BlcnR5IG9ubHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFnZ3JlZ2F0ZVJ1biA9IGFyZ3VtZW50c1swXVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGFyZ3VtZW50cywgZnVuY3Rpb24gKGlkeCwgYXJncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJ1biA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCBhZ2dyZWdhdGVSdW4udmFyaWFibGVzLCBydW4udmFyaWFibGVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFN1Y2Nlc3MoYWdncmVnYXRlUnVuLCBhcmd1bWVudHNbMF1bMV0sIGFyZ3VtZW50c1swXVsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlKGFnZ3JlZ2F0ZVJ1biwgYXJndW1lbnRzWzBdWzFdLCBhcmd1bWVudHNbMF1bMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFycmF5IG9mIHJ1bnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWdyZWdhdGUgdmFyaWFibGVzIGluIGVhY2ggcnVuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhZ2dyZWdhdGVkUnVucyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goYXJndW1lbnRzLCBmdW5jdGlvbiAoaWR4LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcnVucyA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoISQuaXNBcnJheShydW5zKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChydW5zLCBmdW5jdGlvbiAoaWR4UnVuLCBydW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocnVuLmlkICYmICFhZ2dyZWdhdGVkUnVuc1tydW4uaWRdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bi52YXJpYWJsZXMgPSBydW4udmFyaWFibGVzIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVkUnVuc1tydW4uaWRdID0gcnVuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocnVuLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZXh0ZW5kKHRydWUsIGFnZ3JlZ2F0ZWRSdW5zW3J1bi5pZF0udmFyaWFibGVzLCBydW4udmFyaWFibGVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHR1cm4gaXQgaW50byBhbiBhcnJheVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVkUnVucyA9ICQubWFwKGFnZ3JlZ2F0ZWRSdW5zLCBmdW5jdGlvbiAocnVuKSB7IHJldHVybiBydW47IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRTdWNjZXNzKGFnZ3JlZ2F0ZWRSdW5zLCBhcmd1bWVudHNbMF1bMV0sIGFyZ3VtZW50c1swXVsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlKGFnZ3JlZ2F0ZWRSdW5zLCBhcmd1bWVudHNbMF1bMV0sIGFyZ3VtZW50c1swXVsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpcyB2YXJpYWJsZXMgQVBJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWdncmVnYXRlIHRoZSByZXNwb25zZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhZ2dyZWdhdGVkVmFyaWFibGVzID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGFyZ3VtZW50cywgZnVuY3Rpb24gKGlkeCwgYXJncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFycyA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZXh0ZW5kKHRydWUsIGFnZ3JlZ2F0ZWRWYXJpYWJsZXMsIHZhcnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFN1Y2Nlc3MoYWdncmVnYXRlZFZhcmlhYmxlcywgYXJndW1lbnRzWzBdWzFdLCBhcmd1bWVudHNbMF1bMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlKGFnZ3JlZ2F0ZWRWYXJpYWJsZXMsIGFyZ3VtZW50c1swXVsxXSwgYXJndW1lbnRzWzBdWzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2xkRXJyb3IuYXBwbHkoaHR0cCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGR0ZC5yZWplY3QuYXBwbHkoZHRkLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGR0ZC5wcm9taXNlKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KHBhcmFtcywgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH07XG59KCkpO1xuIl19
