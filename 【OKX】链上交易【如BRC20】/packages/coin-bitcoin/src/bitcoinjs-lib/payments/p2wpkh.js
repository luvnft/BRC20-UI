"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.p2wpkh = void 0;
/**
 * The following methods are based on `bitcoinjs`, thanks for their work
 * https://github.com/bitcoinjs/bitcoinjs-lib
 */
var bcrypto = require("../crypto");
var networks_1 = require("../networks");
var bscript = require("../script");
var types_1 = require("../types");
var lazy = require("./lazy");
var crypto_lib_1 = require("@okxweb3/crypto-lib");
var OPS = bscript.OPS;
var EMPTY_BUFFER = Buffer.alloc(0);
// witness: {signature} {pubKey}
// input: <>
// output: OP_0 {pubKeyHash}
function p2wpkh(a, opts) {
    if (!a.address && !a.hash && !a.output && !a.pubkey && !a.witness)
        throw new TypeError('Not enough data');
    opts = Object.assign({ validate: true }, opts || {});
    (0, types_1.typeforce)({
        address: types_1.typeforce.maybe(types_1.typeforce.String),
        hash: types_1.typeforce.maybe(types_1.typeforce.BufferN(20)),
        input: types_1.typeforce.maybe(types_1.typeforce.BufferN(0)),
        network: types_1.typeforce.maybe(types_1.typeforce.Object),
        output: types_1.typeforce.maybe(types_1.typeforce.BufferN(22)),
        pubkey: types_1.typeforce.maybe(types_1.isPoint),
        signature: types_1.typeforce.maybe(bscript.isCanonicalScriptSignature),
        witness: types_1.typeforce.maybe(types_1.typeforce.arrayOf(types_1.typeforce.Buffer)),
    }, a);
    var _address = lazy.value(function () {
        var result = crypto_lib_1.base.bech32.decode(a.address);
        var version = result.words.shift();
        var data = crypto_lib_1.base.bech32.fromWords(result.words);
        return {
            version: version,
            prefix: result.prefix,
            data: Buffer.from(data),
        };
    });
    var network = a.network || networks_1.bitcoin;
    var o = { name: 'p2wpkh', network: network };
    lazy.prop(o, 'address', function () {
        if (!o.hash)
            return;
        var words = crypto_lib_1.base.bech32.toWords(o.hash);
        words.unshift(0x00);
        return crypto_lib_1.base.bech32.encode(network.bech32, words);
    });
    lazy.prop(o, 'hash', function () {
        if (a.output)
            return a.output.slice(2, 22);
        if (a.address)
            return _address().data;
        if (a.pubkey || o.pubkey)
            return bcrypto.hash160(a.pubkey || o.pubkey);
    });
    lazy.prop(o, 'output', function () {
        if (!o.hash)
            return;
        return bscript.compile([OPS.OP_0, o.hash]);
    });
    lazy.prop(o, 'pubkey', function () {
        if (a.pubkey)
            return a.pubkey;
        if (!a.witness)
            return;
        return a.witness[1];
    });
    lazy.prop(o, 'signature', function () {
        if (!a.witness)
            return;
        return a.witness[0];
    });
    lazy.prop(o, 'input', function () {
        if (!o.witness)
            return;
        return EMPTY_BUFFER;
    });
    lazy.prop(o, 'witness', function () {
        if (!a.pubkey)
            return;
        if (!a.signature)
            return;
        return [a.signature, a.pubkey];
    });
    // extended validation
    if (opts.validate) {
        var hash = Buffer.from([]);
        if (a.address) {
            if (network && network.bech32 !== _address().prefix)
                throw new TypeError('Invalid prefix or Network mismatch');
            if (_address().version !== 0x00)
                throw new TypeError('Invalid address version');
            if (_address().data.length !== 20)
                throw new TypeError('Invalid address data');
            hash = _address().data;
        }
        if (a.hash) {
            if (hash.length > 0 && !hash.equals(a.hash))
                throw new TypeError('Hash mismatch');
            else
                hash = a.hash;
        }
        if (a.output) {
            if (a.output.length !== 22 ||
                a.output[0] !== OPS.OP_0 ||
                a.output[1] !== 0x14)
                throw new TypeError('Output is invalid');
            if (hash.length > 0 && !hash.equals(a.output.slice(2)))
                throw new TypeError('Hash mismatch');
            else
                hash = a.output.slice(2);
        }
        if (a.pubkey) {
            var pkh = bcrypto.hash160(a.pubkey);
            if (hash.length > 0 && !hash.equals(pkh))
                throw new TypeError('Hash mismatch');
            else
                hash = pkh;
            if (!(0, types_1.isPoint)(a.pubkey) || a.pubkey.length !== 33)
                throw new TypeError('Invalid pubkey for p2wpkh');
        }
        if (a.witness) {
            if (a.witness.length !== 2)
                throw new TypeError('Witness is invalid');
            if (!bscript.isCanonicalScriptSignature(a.witness[0]))
                throw new TypeError('Witness has invalid signature');
            if (!(0, types_1.isPoint)(a.witness[1]) || a.witness[1].length !== 33)
                throw new TypeError('Witness has invalid pubkey');
            if (a.signature && !a.signature.equals(a.witness[0]))
                throw new TypeError('Signature mismatch');
            if (a.pubkey && !a.pubkey.equals(a.witness[1]))
                throw new TypeError('Pubkey mismatch');
            var pkh = bcrypto.hash160(a.witness[1]);
            if (hash.length > 0 && !hash.equals(pkh))
                throw new TypeError('Hash mismatch');
        }
    }
    return Object.assign(o, a);
}
exports.p2wpkh = p2wpkh;
