"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeUInt64LE = exports.readUInt64LE = exports.keyValToBuffer = exports.keyValsToBuffer = exports.reverseBuffer = exports.range = void 0;
var varuint = require("./varint");
var range = function (n) { return __spreadArray([], Array(n).keys(), true); };
exports.range = range;
function reverseBuffer(buffer) {
    if (buffer.length < 1)
        return buffer;
    var j = buffer.length - 1;
    var tmp = 0;
    for (var i = 0; i < buffer.length / 2; i++) {
        tmp = buffer[i];
        buffer[i] = buffer[j];
        buffer[j] = tmp;
        j--;
    }
    return buffer;
}
exports.reverseBuffer = reverseBuffer;
function keyValsToBuffer(keyVals) {
    var buffers = keyVals.map(keyValToBuffer);
    buffers.push(Buffer.from([0]));
    return Buffer.concat(buffers);
}
exports.keyValsToBuffer = keyValsToBuffer;
function keyValToBuffer(keyVal) {
    var keyLen = keyVal.key.length;
    var valLen = keyVal.value.length;
    var keyVarIntLen = varuint.encodingLength(keyLen);
    var valVarIntLen = varuint.encodingLength(valLen);
    var buffer = Buffer.allocUnsafe(keyVarIntLen + keyLen + valVarIntLen + valLen);
    varuint.encode(keyLen, buffer, 0);
    keyVal.key.copy(buffer, keyVarIntLen);
    varuint.encode(valLen, buffer, keyVarIntLen + keyLen);
    keyVal.value.copy(buffer, keyVarIntLen + keyLen + valVarIntLen);
    return buffer;
}
exports.keyValToBuffer = keyValToBuffer;
// https://github.com/feross/buffer/blob/master/index.js#L1127
function verifuint(value, max) {
    if (typeof value !== 'number')
        throw new Error('cannot write a non-number as a number');
    if (value < 0)
        throw new Error('specified a negative value for writing an unsigned value');
    if (value > max)
        throw new Error('RangeError: value out of range');
    if (Math.floor(value) !== value)
        throw new Error('value has a fractional component');
}
function readUInt64LE(buffer, offset) {
    var a = buffer.readUInt32LE(offset);
    var b = buffer.readUInt32LE(offset + 4);
    b *= 0x100000000;
    verifuint(b + a, 0x001fffffffffffff);
    return b + a;
}
exports.readUInt64LE = readUInt64LE;
function writeUInt64LE(buffer, value, offset) {
    verifuint(value, 0x001fffffffffffff);
    buffer.writeInt32LE(value & -1, offset);
    buffer.writeUInt32LE(Math.floor(value / 0x100000000), offset + 4);
    return offset + 8;
}
exports.writeUInt64LE = writeUInt64LE;
