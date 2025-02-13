"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canAddToArray = exports.check = exports.expected = exports.encode = exports.decode = void 0;
var typeFields_1 = require("../../typeFields");
function decode(keyVal) {
    if (keyVal.key[0] !== typeFields_1.InputTypes.TAP_SCRIPT_SIG) {
        throw new Error('Decode Error: could not decode tapScriptSig with key 0x' +
            keyVal.key.toString('hex'));
    }
    if (keyVal.key.length !== 65) {
        throw new Error('Decode Error: tapScriptSig has invalid key 0x' +
            keyVal.key.toString('hex'));
    }
    if (keyVal.value.length !== 64 && keyVal.value.length !== 65) {
        throw new Error('Decode Error: tapScriptSig has invalid signature in key 0x' +
            keyVal.key.toString('hex'));
    }
    var pubkey = keyVal.key.slice(1, 33);
    var leafHash = keyVal.key.slice(33);
    return {
        pubkey: pubkey,
        leafHash: leafHash,
        signature: keyVal.value,
    };
}
exports.decode = decode;
function encode(tSig) {
    var head = Buffer.from([typeFields_1.InputTypes.TAP_SCRIPT_SIG]);
    return {
        key: Buffer.concat([head, tSig.pubkey, tSig.leafHash]),
        value: tSig.signature,
    };
}
exports.encode = encode;
exports.expected = '{ pubkey: Buffer; leafHash: Buffer; signature: Buffer; }';
function check(data) {
    return (Buffer.isBuffer(data.pubkey) &&
        Buffer.isBuffer(data.leafHash) &&
        Buffer.isBuffer(data.signature) &&
        data.pubkey.length === 32 &&
        data.leafHash.length === 32 &&
        (data.signature.length === 64 || data.signature.length === 65));
}
exports.check = check;
function canAddToArray(array, item, dupeSet) {
    var dupeString = item.pubkey.toString('hex') + item.leafHash.toString('hex');
    if (dupeSet.has(dupeString))
        return false;
    dupeSet.add(dupeString);
    return (array.filter(function (v) { return v.pubkey.equals(item.pubkey) && v.leafHash.equals(item.leafHash); }).length === 0);
}
exports.canAddToArray = canAddToArray;
