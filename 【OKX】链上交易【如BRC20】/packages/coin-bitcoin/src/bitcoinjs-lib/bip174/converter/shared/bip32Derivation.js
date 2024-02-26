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
exports.makeConverter = void 0;
var range = function (n) { return __spreadArray([], Array(n).keys(), true); };
var isValidDERKey = function (pubkey) {
    return (pubkey.length === 33 && [2, 3].includes(pubkey[0])) ||
        (pubkey.length === 65 && 4 === pubkey[0]);
};
function makeConverter(TYPE_BYTE, isValidPubkey) {
    if (isValidPubkey === void 0) { isValidPubkey = isValidDERKey; }
    function decode(keyVal) {
        if (keyVal.key[0] !== TYPE_BYTE) {
            throw new Error('Decode Error: could not decode bip32Derivation with key 0x' +
                keyVal.key.toString('hex'));
        }
        var pubkey = keyVal.key.slice(1);
        if (!isValidPubkey(pubkey)) {
            throw new Error('Decode Error: bip32Derivation has invalid pubkey in key 0x' +
                keyVal.key.toString('hex'));
        }
        if ((keyVal.value.length / 4) % 1 !== 0) {
            throw new Error('Decode Error: Input BIP32_DERIVATION value length should be multiple of 4');
        }
        var data = {
            masterFingerprint: keyVal.value.slice(0, 4),
            pubkey: pubkey,
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
    function encode(data) {
        var head = Buffer.from([TYPE_BYTE]);
        var key = Buffer.concat([head, data.pubkey]);
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
    var expected = '{ masterFingerprint: Buffer; pubkey: Buffer; path: string; }';
    function check(data) {
        return (Buffer.isBuffer(data.pubkey) &&
            Buffer.isBuffer(data.masterFingerprint) &&
            typeof data.path === 'string' &&
            isValidPubkey(data.pubkey) &&
            data.masterFingerprint.length === 4);
    }
    function canAddToArray(array, item, dupeSet) {
        var dupeString = item.pubkey.toString('hex');
        if (dupeSet.has(dupeString))
            return false;
        dupeSet.add(dupeString);
        return array.filter(function (v) { return v.pubkey.equals(item.pubkey); }).length === 0;
    }
    return {
        decode: decode,
        encode: encode,
        check: check,
        expected: expected,
        canAddToArray: canAddToArray,
    };
}
exports.makeConverter = makeConverter;
