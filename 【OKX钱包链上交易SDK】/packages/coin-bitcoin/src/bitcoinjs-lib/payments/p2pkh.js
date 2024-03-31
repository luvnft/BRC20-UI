"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.p2pkh = void 0;
/**
 * The following methods are based on `bitcoinjs`, thanks for their work
 * https://github.com/bitcoinjs/bitcoinjs-lib
 */
var bcrypto = require("../crypto");
var networks_1 = require("../networks");
var bscript = require("../script");
var types_1 = require("../types");
var lazy = require("./lazy");
var OPS = bscript.OPS;
var crypto_lib_1 = require("@okxweb3/crypto-lib");
// input: {signature} {pubkey}
// output: OP_DUP OP_HASH160 {hash160(pubkey)} OP_EQUALVERIFY OP_CHECKSIG
function p2pkh(a, opts) {
    if (!a.address && !a.hash && !a.output && !a.pubkey && !a.input)
        throw new TypeError('Not enough data');
    opts = Object.assign({ validate: true }, opts || {});
    (0, types_1.typeforce)({
        network: types_1.typeforce.maybe(types_1.typeforce.Object),
        address: types_1.typeforce.maybe(types_1.typeforce.String),
        hash: types_1.typeforce.maybe(types_1.typeforce.BufferN(20)),
        output: types_1.typeforce.maybe(types_1.typeforce.BufferN(25)),
        pubkey: types_1.typeforce.maybe(types_1.isPoint),
        signature: types_1.typeforce.maybe(bscript.isCanonicalScriptSignature),
        input: types_1.typeforce.maybe(types_1.typeforce.Buffer),
    }, a);
    var _address = lazy.value(function () {
        var payload = crypto_lib_1.base.fromBase58Check(a.address);
        var version = payload.readUInt8(0);
        var hash = payload.slice(1);
        return { version: version, hash: hash };
    });
    var _chunks = lazy.value(function () {
        return bscript.decompile(a.input);
    });
    var network = a.network || networks_1.bitcoin;
    var o = { name: 'p2pkh', network: network };
    lazy.prop(o, 'address', function () {
        if (!o.hash)
            return;
        var payload = Buffer.allocUnsafe(21);
        payload.writeUInt8(network.pubKeyHash, 0);
        o.hash.copy(payload, 1);
        return crypto_lib_1.base.toBase58Check(payload);
    });
    lazy.prop(o, 'hash', function () {
        if (a.output)
            return a.output.slice(3, 23);
        if (a.address)
            return _address().hash;
        if (a.pubkey || o.pubkey)
            return bcrypto.hash160(a.pubkey || o.pubkey);
    });
    lazy.prop(o, 'output', function () {
        if (!o.hash)
            return;
        return bscript.compile([
            OPS.OP_DUP,
            OPS.OP_HASH160,
            o.hash,
            OPS.OP_EQUALVERIFY,
            OPS.OP_CHECKSIG,
        ]);
    });
    lazy.prop(o, 'pubkey', function () {
        if (!a.input)
            return;
        return _chunks()[1];
    });
    lazy.prop(o, 'signature', function () {
        if (!a.input)
            return;
        return _chunks()[0];
    });
    lazy.prop(o, 'input', function () {
        if (!a.pubkey)
            return;
        if (!a.signature)
            return;
        return bscript.compile([a.signature, a.pubkey]);
    });
    lazy.prop(o, 'witness', function () {
        if (!o.input)
            return;
        return [];
    });
    // extended validation
    if (opts.validate) {
        var hash = Buffer.from([]);
        if (a.address) {
            if (_address().version !== network.pubKeyHash)
                throw new TypeError('Invalid version or Network mismatch');
            if (_address().hash.length !== 20)
                throw new TypeError('Invalid address');
            hash = _address().hash;
        }
        if (a.hash) {
            if (hash.length > 0 && !hash.equals(a.hash))
                throw new TypeError('Hash mismatch');
            else
                hash = a.hash;
        }
        if (a.output) {
            if (a.output.length !== 25 ||
                a.output[0] !== OPS.OP_DUP ||
                a.output[1] !== OPS.OP_HASH160 ||
                a.output[2] !== 0x14 ||
                a.output[23] !== OPS.OP_EQUALVERIFY ||
                a.output[24] !== OPS.OP_CHECKSIG)
                throw new TypeError('Output is invalid');
            var hash2 = a.output.slice(3, 23);
            if (hash.length > 0 && !hash.equals(hash2))
                throw new TypeError('Hash mismatch');
            else
                hash = hash2;
        }
        if (a.pubkey) {
            var pkh = bcrypto.hash160(a.pubkey);
            if (hash.length > 0 && !hash.equals(pkh))
                throw new TypeError('Hash mismatch');
            else
                hash = pkh;
        }
        if (a.input) {
            var chunks = _chunks();
            if (chunks.length !== 2)
                throw new TypeError('Input is invalid');
            if (!bscript.isCanonicalScriptSignature(chunks[0]))
                throw new TypeError('Input has invalid signature');
            if (!(0, types_1.isPoint)(chunks[1]))
                throw new TypeError('Input has invalid pubkey');
            if (a.signature && !a.signature.equals(chunks[0]))
                throw new TypeError('Signature mismatch');
            if (a.pubkey && !a.pubkey.equals(chunks[1]))
                throw new TypeError('Pubkey mismatch');
            var pkh = bcrypto.hash160(chunks[1]);
            if (hash.length > 0 && !hash.equals(pkh))
                throw new TypeError('Hash mismatch');
        }
    }
    return Object.assign(o, a);
}
exports.p2pkh = p2pkh;
