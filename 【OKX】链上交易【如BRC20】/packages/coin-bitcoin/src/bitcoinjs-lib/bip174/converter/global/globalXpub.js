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
exports.canAddToArray = exports.check = exports.expected = exports.encode = exports.decode = void 0;
var typeFields_1 = require("../../typeFields");
var range = function (n) { return __spreadArray([], Array(n).keys(), true); };
function decode(keyVal) {
    if (keyVal.key[0] !== typeFields_1.GlobalTypes.GLOBAL_XPUB) {
        throw new Error('Decode Error: could not decode globalXpub with key 0x' +
            keyVal.key.toString('hex'));
    }
    if (keyVal.key.length !== 79 || ![2, 3].includes(keyVal.key[46])) {
        throw new Error('Decode Error: globalXpub has invalid extended pubkey in key 0x' +
            keyVal.key.toString('hex'));
    }
    if ((keyVal.value.length / 4) % 1 !== 0) {
        throw new Error('Decode Error: Global GLOBAL_XPUB value length should be multiple of 4');
    }
    var extendedPubkey = keyVal.key.slice(1);
    var data = {
        masterFingerprint: keyVal.value.slice(0, 4),
        extendedPubkey: extendedPubkey,
        path: 'm',
    };
    for (var _i = 0, _a = range(keyVal.value.length / 4 - 1); _i < _a.length; _i++) {
        var i = _a[_i];
        var val = keyVal.value.readUInt32LE(i * 4 + 4);
        var isHard = !!(val & 0x80000000);
        var idx = val & 0x7fffffff;
        data.path += '/' + idx.toString(10) + (isHard ? "'" : '');
    }
    return data;
}
exports.decode = decode;
function encode(data) {
    var head = Buffer.from([typeFields_1.GlobalTypes.GLOBAL_XPUB]);
    var key = Buffer.concat([head, data.extendedPubkey]);
    var splitPath = data.path.split('/');
    var value = Buffer.allocUnsafe(splitPath.length * 4);
    data.masterFingerprint.copy(value, 0);
    var offset = 4;
    splitPath.slice(1).forEach(function (level) {
        var isHard = level.slice(-1) === "'";
        var num = 0x7fffffff & parseInt(isHard ? level.slice(0, -1) : level, 10);
        if (isHard)
            num += 0x80000000;
        value.writeUInt32LE(num, offset);
        offset += 4;
    });
    return {
        key: key,
        value: value,
    };
}
exports.encode = encode;
exports.expected = '{ masterFingerprint: Buffer; extendedPubkey: Buffer; path: string; }';
function check(data) {
    var epk = data.extendedPubkey;
    var mfp = data.masterFingerprint;
    var p = data.path;
    return (Buffer.isBuffer(epk) &&
        epk.length === 78 &&
        [2, 3].indexOf(epk[45]) > -1 &&
        Buffer.isBuffer(mfp) &&
        mfp.length === 4 &&
        typeof p === 'string' &&
        !!p.match(/^m(\/\d+'?)*$/));
}
exports.check = check;
function canAddToArray(array, item, dupeSet) {
    var dupeString = item.extendedPubkey.toString('hex');
    if (dupeSet.has(dupeString))
        return false;
    dupeSet.add(dupeString);
    return (array.filter(function (v) { return v.extendedPubkey.equals(item.extendedPubkey); }).length === 0);
}
exports.canAddToArray = canAddToArray;
