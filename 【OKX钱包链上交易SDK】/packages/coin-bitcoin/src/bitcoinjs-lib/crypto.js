"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taggedHash = exports.hash256 = exports.hash160 = exports.sha256 = exports.ripemd160 = void 0;
/**
 * The following methods are based on `bitcoinjs`, thanks for their work
 * https://github.com/bitcoinjs/bitcoinjs-lib
 */
var crypto_lib_1 = require("@okxweb3/crypto-lib");
function ripemd160(buffer) {
    return Buffer.from(crypto_lib_1.base.ripemd160(buffer));
}
exports.ripemd160 = ripemd160;
function sha256(buffer) {
    return Buffer.from(crypto_lib_1.base.sha256(buffer));
}
exports.sha256 = sha256;
function hash160(buffer) {
    return ripemd160(sha256(buffer));
}
exports.hash160 = hash160;
function hash256(buffer) {
    return sha256(sha256(buffer));
}
exports.hash256 = hash256;
var TAGS = [
    'BIP0340/challenge',
    'BIP0340/aux',
    'BIP0340/nonce',
    'TapLeaf',
    'TapBranch',
    'TapSighash',
    'TapTweak',
    'KeyAgg list',
    'KeyAgg coefficient',
];
/** An object mapping tags to their tagged hash prefix of [SHA256(tag) | SHA256(tag)] */
var TAGGED_HASH_PREFIXES = Object.fromEntries(TAGS.map(function (tag) {
    var tagHash = sha256(Buffer.from(tag));
    return [tag, Buffer.concat([tagHash, tagHash])];
}));
function taggedHash(prefix, data) {
    return sha256(Buffer.concat([TAGGED_HASH_PREFIXES[prefix], data]));
}
exports.taggedHash = taggedHash;
