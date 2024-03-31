"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convert2LegacyAddress = exports.isCashAddress = exports.ValidateBitcashP2PkHAddress = exports.GetBitcashP2PkHAddressByPublicKey = exports.GetBitcashAddressByPublicKey = exports.GetBitcashAddressByHash = void 0;
var crypto_1 = require("../bitcoinjs-lib/crypto");
var cashAddrJs = require("./cashaddr");
var payments = require("../bitcoinjs-lib/payments");
function GetBitcashAddressByHash(prefix, type, hash) {
    return cashAddrJs.encode(prefix, type, hash);
}
exports.GetBitcashAddressByHash = GetBitcashAddressByHash;
function GetBitcashAddressByPublicKey(prefix, type, publicKey) {
    var hash = (0, crypto_1.hash160)(Buffer.from(publicKey));
    return GetBitcashAddressByHash(prefix, type, hash);
}
exports.GetBitcashAddressByPublicKey = GetBitcashAddressByPublicKey;
function GetBitcashP2PkHAddressByPublicKey(publicKey) {
    var hash = (0, crypto_1.hash160)(Buffer.from(publicKey));
    return GetBitcashAddressByHash("bitcoincash", "P2PKH", hash);
}
exports.GetBitcashP2PkHAddressByPublicKey = GetBitcashP2PkHAddressByPublicKey;
function ValidateBitcashP2PkHAddress(address) {
    try {
        if (address.indexOf(":") === -1) {
            address = "bitcoincash:" + address;
        }
        var _a = cashAddrJs.decode(address), prefix = _a.prefix, type = _a.type, hash = _a.hash;
        return type === "P2PKH" && hash.length === 20;
    }
    catch (e) {
        return false;
    }
}
exports.ValidateBitcashP2PkHAddress = ValidateBitcashP2PkHAddress;
function isCashAddress(address) {
    try {
        if (address.startsWith("bitcoincash:")) {
            return true;
        }
        address = "bitcoincash:" + address;
        cashAddrJs.decode(address);
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.isCashAddress = isCashAddress;
function convert2LegacyAddress(address, network) {
    if (address.indexOf(":") === -1) {
        address = "bitcoincash:" + address;
    }
    var _a = cashAddrJs.decode(address), type = _a.type, hash = _a.hash;
    if (type == "P2PKH") {
        var result = payments.p2pkh({ hash: Buffer.from(hash), network: network });
        return result.address;
    }
    else if (type == "P2SH") {
        var result = payments.p2sh({ hash: Buffer.from(hash), network: network });
        return result.address;
    }
    else {
        throw new Error("convert2LegacyAddress error");
    }
}
exports.convert2LegacyAddress = convert2LegacyAddress;
