"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toOutputScript = exports.fromOutputScript = exports.toBech32 = exports.toBase58Check = exports.fromBech32 = exports.fromBase58Check = void 0;
var networks = require("./networks");
var payments = require("./payments");
var bscript = require("./script");
var types = require("./types");
var crypto_lib_1 = require("@okxweb3/crypto-lib");
var typeforce = types.typeforce;
var FUTURE_SEGWIT_MAX_SIZE = 40;
var FUTURE_SEGWIT_MIN_SIZE = 2;
var FUTURE_SEGWIT_MAX_VERSION = 16;
var FUTURE_SEGWIT_MIN_VERSION = 2;
var FUTURE_SEGWIT_VERSION_DIFF = 0x50;
var FUTURE_SEGWIT_VERSION_WARNING = 'WARNING: Sending to a future segwit version address can lead to loss of funds. ' +
    'End users MUST be warned carefully in the GUI and asked if they wish to proceed ' +
    'with caution. Wallets should verify the segwit version from the output of fromBech32, ' +
    'then decide when it is safe to use which version of segwit.';
function _toFutureSegwitAddress(output, network) {
    var data = output.slice(2);
    if (data.length < FUTURE_SEGWIT_MIN_SIZE ||
        data.length > FUTURE_SEGWIT_MAX_SIZE)
        throw new TypeError('Invalid program length for segwit address');
    var version = output[0] - FUTURE_SEGWIT_VERSION_DIFF;
    if (version < FUTURE_SEGWIT_MIN_VERSION ||
        version > FUTURE_SEGWIT_MAX_VERSION)
        throw new TypeError('Invalid version for segwit address');
    if (output[1] !== data.length)
        throw new TypeError('Invalid script for segwit address');
    console.warn(FUTURE_SEGWIT_VERSION_WARNING);
    return toBech32(data, version, network.bech32);
}
function fromBase58Check(address) {
    var payload = crypto_lib_1.base.fromBase58Check(address);
    // TODO: 4.0.0, move to "toOutputScript"
    if (payload.length < 21)
        throw new TypeError(address + ' is too short');
    if (payload.length > 21)
        throw new TypeError(address + ' is too long');
    var version = payload.readUInt8(0);
    var hash = payload.slice(1);
    return { version: version, hash: hash };
}
exports.fromBase58Check = fromBase58Check;
function fromBech32(address) {
    var result;
    var version;
    try {
        result = crypto_lib_1.base.bech32.decode(address);
    }
    catch (e) { }
    if (result) {
        version = result.words[0];
        if (version !== 0)
            throw new TypeError(address + ' uses wrong encoding');
    }
    else {
        result = crypto_lib_1.base.bech32m.decode(address);
        version = result.words[0];
        if (version === 0)
            throw new TypeError(address + ' uses wrong encoding');
    }
    var data = crypto_lib_1.base.bech32.fromWords(result.words.slice(1));
    return {
        version: version,
        prefix: result.prefix,
        data: Buffer.from(data),
    };
}
exports.fromBech32 = fromBech32;
function toBase58Check(hash, version) {
    typeforce(types.tuple(types.Hash160bit, types.UInt8), arguments);
    var payload = Buffer.allocUnsafe(21);
    payload.writeUInt8(version, 0);
    hash.copy(payload, 1);
    return crypto_lib_1.base.toBase58Check(payload);
}
exports.toBase58Check = toBase58Check;
function toBech32(data, version, prefix) {
    var words = crypto_lib_1.base.bech32.toWords(data);
    words.unshift(version);
    return version === 0
        ? crypto_lib_1.base.bech32.encode(prefix, words)
        : crypto_lib_1.base.bech32m.encode(prefix, words);
}
exports.toBech32 = toBech32;
function fromOutputScript(output, network) {
    // TODO: Network
    network = network || networks.bitcoin;
    try {
        return payments.p2pkh({ output: output, network: network }).address;
    }
    catch (e) { }
    try {
        return payments.p2sh({ output: output, network: network }).address;
    }
    catch (e) { }
    try {
        return payments.p2wpkh({ output: output, network: network }).address;
    }
    catch (e) { }
    try {
        return payments.p2wsh({ output: output, network: network }).address;
    }
    catch (e) { }
    try {
        return payments.p2tr({ output: output, network: network }).address;
    }
    catch (e) { }
    try {
        return _toFutureSegwitAddress(output, network);
    }
    catch (e) { }
    throw new Error(bscript.toASM(output) + ' has no matching Address');
}
exports.fromOutputScript = fromOutputScript;
function toOutputScript(address, network) {
    network = network || networks.bitcoin;
    var decodeBase58;
    var decodeBech32;
    try {
        decodeBase58 = fromBase58Check(address);
    }
    catch (e) { }
    if (decodeBase58) {
        if (decodeBase58.version === network.pubKeyHash)
            return payments.p2pkh({ hash: decodeBase58.hash }).output;
        if (decodeBase58.version === network.scriptHash)
            return payments.p2sh({ hash: decodeBase58.hash }).output;
    }
    else {
        try {
            decodeBech32 = fromBech32(address);
        }
        catch (e) { }
        if (decodeBech32) {
            if (decodeBech32.prefix !== network.bech32)
                throw new Error(address + ' has an invalid prefix');
            if (decodeBech32.version === 0) {
                if (decodeBech32.data.length === 20)
                    return payments.p2wpkh({ hash: decodeBech32.data }).output;
                if (decodeBech32.data.length === 32)
                    return payments.p2wsh({ hash: decodeBech32.data }).output;
            }
            else if (decodeBech32.version === 1) {
                if (decodeBech32.data.length === 32)
                    return payments.p2tr({ pubkey: decodeBech32.data }).output;
            }
            else if (decodeBech32.version >= FUTURE_SEGWIT_MIN_VERSION &&
                decodeBech32.version <= FUTURE_SEGWIT_MAX_VERSION &&
                decodeBech32.data.length >= FUTURE_SEGWIT_MIN_SIZE &&
                decodeBech32.data.length <= FUTURE_SEGWIT_MAX_SIZE) {
                console.warn(FUTURE_SEGWIT_VERSION_WARNING);
                return bscript.compile([
                    decodeBech32.version + FUTURE_SEGWIT_VERSION_DIFF,
                    decodeBech32.data,
                ]);
            }
        }
    }
    throw new Error(address + ' has no matching Script');
}
exports.toOutputScript = toOutputScript;
