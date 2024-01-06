"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canAdd = exports.check = exports.expected = exports.encode = exports.decode = void 0;
var typeFields_1 = require("../../typeFields");
function decode(keyVal) {
    if (keyVal.key[0] !== typeFields_1.InputTypes.TAP_MERKLE_ROOT || keyVal.key.length !== 1) {
        throw new Error('Decode Error: could not decode tapMerkleRoot with key 0x' +
            keyVal.key.toString('hex'));
    }
    if (!check(keyVal.value)) {
        throw new Error('Decode Error: tapMerkleRoot not a 32-byte hash');
    }
    return keyVal.value;
}
exports.decode = decode;
function encode(value) {
    var key = Buffer.from([typeFields_1.InputTypes.TAP_MERKLE_ROOT]);
    return { key: key, value: value };
}
exports.encode = encode;
exports.expected = 'Buffer';
function check(data) {
    return Buffer.isBuffer(data) && data.length === 32;
}
exports.check = check;
function canAdd(currentData, newData) {
    return !!currentData && !!newData && currentData.tapMerkleRoot === undefined;
}
exports.canAdd = canAdd;
