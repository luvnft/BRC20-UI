"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.p2sh = void 0;
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
function stacksEqual(a, b) {
    if (a.length !== b.length)
        return false;
    return a.every(function (x, i) {
        return x.equals(b[i]);
    });
}
// input: [redeemScriptSig ...] {redeemScript}
// witness: <?>
// output: OP_HASH160 {hash160(redeemScript)} OP_EQUAL
function p2sh(a, opts) {
    if (!a.address && !a.hash && !a.output && !a.redeem && !a.input)
        throw new TypeError('Not enough data');
    opts = Object.assign({ validate: true }, opts || {});
    (0, types_1.typeforce)({
        network: types_1.typeforce.maybe(types_1.typeforce.Object),
        address: types_1.typeforce.maybe(types_1.typeforce.String),
        hash: types_1.typeforce.maybe(types_1.typeforce.BufferN(20)),
        output: types_1.typeforce.maybe(types_1.typeforce.BufferN(23)),
        redeem: types_1.typeforce.maybe({
            network: types_1.typeforce.maybe(types_1.typeforce.Object),
            output: types_1.typeforce.maybe(types_1.typeforce.Buffer),
            input: types_1.typeforce.maybe(types_1.typeforce.Buffer),
            witness: types_1.typeforce.maybe(types_1.typeforce.arrayOf(types_1.typeforce.Buffer)),
        }),
        input: types_1.typeforce.maybe(types_1.typeforce.Buffer),
        witness: types_1.typeforce.maybe(types_1.typeforce.arrayOf(types_1.typeforce.Buffer)),
    }, a);
    var network = a.network;
    if (!network) {
        network = (a.redeem && a.redeem.network) || networks_1.bitcoin;
    }
    var o = { network: network };
    var _address = lazy.value(function () {
        var payload = crypto_lib_1.base.fromBase58Check(a.address);
        var version = payload.readUInt8(0);
        var hash = payload.slice(1);
        return { version: version, hash: hash };
    });
    var _chunks = lazy.value(function () {
        return bscript.decompile(a.input);
    });
    var _redeem = lazy.value(function () {
        var chunks = _chunks();
        return {
            network: network,
            output: chunks[chunks.length - 1],
            input: bscript.compile(chunks.slice(0, -1)),
            witness: a.witness || [],
        };
    });
    // output dependents
    lazy.prop(o, 'address', function () {
        if (!o.hash)
            return;
        var payload = Buffer.allocUnsafe(21);
        payload.writeUInt8(o.network.scriptHash, 0);
        o.hash.copy(payload, 1);
        return crypto_lib_1.base.toBase58Check(payload);
    });
    lazy.prop(o, 'hash', function () {
        // in order of least effort
        if (a.output)
            return a.output.slice(2, 22);
        if (a.address)
            return _address().hash;
        if (o.redeem && o.redeem.output)
            return bcrypto.hash160(o.redeem.output);
    });
    lazy.prop(o, 'output', function () {
        if (!o.hash)
            return;
        return bscript.compile([OPS.OP_HASH160, o.hash, OPS.OP_EQUAL]);
    });
    // input dependents
    lazy.prop(o, 'redeem', function () {
        if (!a.input)
            return;
        return _redeem();
    });
    lazy.prop(o, 'input', function () {
        if (!a.redeem || !a.redeem.input || !a.redeem.output)
            return;
        return bscript.compile([].concat(bscript.decompile(a.redeem.input), a.redeem.output));
    });
    lazy.prop(o, 'witness', function () {
        if (o.redeem && o.redeem.witness)
            return o.redeem.witness;
        if (o.input)
            return [];
    });
    lazy.prop(o, 'name', function () {
        var nameParts = ['p2sh'];
        if (o.redeem !== undefined && o.redeem.name !== undefined)
            nameParts.push(o.redeem.name);
        return nameParts.join('-');
    });
    if (opts.validate) {
        var hash_1 = Buffer.from([]);
        if (a.address) {
            if (_address().version !== network.scriptHash)
                throw new TypeError('Invalid version or Network mismatch');
            if (_address().hash.length !== 20)
                throw new TypeError('Invalid address');
            hash_1 = _address().hash;
        }
        if (a.hash) {
            if (hash_1.length > 0 && !hash_1.equals(a.hash))
                throw new TypeError('Hash mismatch');
            else
                hash_1 = a.hash;
        }
        if (a.output) {
            if (a.output.length !== 23 ||
                a.output[0] !== OPS.OP_HASH160 ||
                a.output[1] !== 0x14 ||
                a.output[22] !== OPS.OP_EQUAL)
                throw new TypeError('Output is invalid');
            var hash2 = a.output.slice(2, 22);
            if (hash_1.length > 0 && !hash_1.equals(hash2))
                throw new TypeError('Hash mismatch');
            else
                hash_1 = hash2;
        }
        // inlined to prevent 'no-inner-declarations' failing
        var checkRedeem = function (redeem) {
            // is the redeem output empty/invalid?
            if (redeem.output) {
                var decompile = bscript.decompile(redeem.output);
                if (!decompile || decompile.length < 1)
                    throw new TypeError('Redeem.output too short');
                // match hash against other sources
                var hash2 = bcrypto.hash160(redeem.output);
                if (hash_1.length > 0 && !hash_1.equals(hash2))
                    throw new TypeError('Hash mismatch');
                else
                    hash_1 = hash2;
            }
            if (redeem.input) {
                var hasInput = redeem.input.length > 0;
                var hasWitness = redeem.witness && redeem.witness.length > 0;
                if (!hasInput && !hasWitness)
                    throw new TypeError('Empty input');
                if (hasInput && hasWitness)
                    throw new TypeError('Input and witness provided');
                if (hasInput) {
                    var richunks = bscript.decompile(redeem.input);
                    if (!bscript.isPushOnly(richunks))
                        throw new TypeError('Non push-only scriptSig');
                }
            }
        };
        if (a.input) {
            var chunks = _chunks();
            if (!chunks || chunks.length < 1)
                throw new TypeError('Input too short');
            if (!Buffer.isBuffer(_redeem().output))
                throw new TypeError('Input is invalid');
            checkRedeem(_redeem());
        }
        if (a.redeem) {
            if (a.redeem.network && a.redeem.network !== network)
                throw new TypeError('Network mismatch');
            if (a.input) {
                var redeem = _redeem();
                if (a.redeem.output && !a.redeem.output.equals(redeem.output))
                    throw new TypeError('Redeem.output mismatch');
                if (a.redeem.input && !a.redeem.input.equals(redeem.input))
                    throw new TypeError('Redeem.input mismatch');
            }
            checkRedeem(a.redeem);
        }
        if (a.witness) {
            if (a.redeem &&
                a.redeem.witness &&
                !stacksEqual(a.redeem.witness, a.witness))
                throw new TypeError('Witness and redeem.witness mismatch');
        }
    }
    return Object.assign(o, a);
}
exports.p2sh = p2sh;
