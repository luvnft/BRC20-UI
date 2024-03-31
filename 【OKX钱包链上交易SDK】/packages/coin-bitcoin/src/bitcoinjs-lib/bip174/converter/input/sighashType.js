"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canAdd = exports.check = exports.expected = exports.encode = exports.decode = void 0;
var typeFields_1 = require("../../typeFields");
function decode(keyVal) {
    if (keyVal.key[0] !== typeFields_1.InputTypes.SIGHASH_TYPE) {
        throw new Error('Decode Error: could not decode sighashType with key 0x' +
            keyVal.key.toString('hex'));
    }
    return keyVal.value.readUInt32LE(0);
}
exports.decode = decode;
function encode(data) {
    var key = Buffer.from([typeFields_1.InputTypes.SIGHASH_TYPE]);
    var value = Buffer.allocUnsafe(4);
    value.writeUInt32LE(data, 0);
    return {
        key: key,
        value: value,
    };
}
exports.encode = encode;
exports.expected = 'number';
function check(data) {
    return typeof data === 'number';
}
exports.check = check;
function canAdd(currentData, newData) {
    return !!currentData && !!newData && currentData.sighashType === undefined;
}
exports.canAdd = canAdd;
