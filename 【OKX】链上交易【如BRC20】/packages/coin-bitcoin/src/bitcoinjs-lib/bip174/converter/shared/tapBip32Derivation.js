"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var varuint = require("../varint");
var bip32Derivation = require("./bip32Derivation");
var isValidBIP340Key = function (pubkey) { return pubkey.length === 32; };
function makeConverter(TYPE_BYTE) {
    var parent = bip32Derivation.makeConverter(TYPE_BYTE, isValidBIP340Key);
    function decode(keyVal) {
        var nHashes = varuint.decode(keyVal.value);
        var nHashesLen = varuint.encodingLength(nHashes);
        var base = parent.decode({
            key: keyVal.key,
            value: keyVal.value.slice(nHashesLen + nHashes * 32),
        });
        var leafHashes = new Array(nHashes);
        for (var i = 0, _offset = nHashesLen; i < nHashes; i++, _offset += 32) {
            leafHashes[i] = keyVal.value.slice(_offset, _offset + 32);
        }
        return __assign(__assign({}, base), { leafHashes: leafHashes });
    }
    function encode(data) {
        var base = parent.encode(data);
        var nHashesLen = varuint.encodingLength(data.leafHashes.length);
        var nHashesBuf = Buffer.allocUnsafe(nHashesLen);
        varuint.encode(data.leafHashes.length, nHashesBuf);
        var value = Buffer.concat(__spreadArray(__spreadArray([nHashesBuf], data.leafHashes, true), [base.value], false));
        return __assign(__assign({}, base), { value: value });
    }
    var expected = '{ ' +
        'masterFingerprint: Buffer; ' +
        'pubkey: Buffer; ' +
        'path: string; ' +
        'leafHashes: Buffer[]; ' +
        '}';
    function check(data) {
        return (Array.isArray(data.leafHashes) &&
            data.leafHashes.every(function (leafHash) { return Buffer.isBuffer(leafHash) && leafHash.length === 32; }) &&
            parent.check(data));
    }
    return {
        decode: decode,
        encode: encode,
        check: check,
        expected: expected,
        canAddToArray: parent.canAddToArray,
    };
}
exports.makeConverter = makeConverter;
