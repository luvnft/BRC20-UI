"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.p2tr = void 0;
/**
 * The following methods are based on `bitcoinjs`, thanks for their work
 * https://github.com/bitcoinjs/bitcoinjs-lib
 */
var buffer_1 = require("buffer");
var networks_1 = require("../networks");
var bscript = require("../script");
var types_1 = require("../types");
var bip341_1 = require("./bip341");
var lazy = require("./lazy");
var crypto_lib_1 = require("@okxweb3/crypto-lib");
var OPS = bscript.OPS;
var TAPROOT_WITNESS_VERSION = 0x01;
var ANNEX_PREFIX = 0x50;
function p2tr(a, opts) {
    if (!a.address &&
        !a.output &&
        !a.pubkey &&
        !a.internalPubkey &&
        !(a.witness && a.witness.length > 1))
        throw new TypeError('Not enough data');
    opts = Object.assign({ validate: true }, opts || {});
    (0, types_1.typeforce)({
        address: types_1.typeforce.maybe(types_1.typeforce.String),
        input: types_1.typeforce.maybe(types_1.typeforce.BufferN(0)),
        network: types_1.typeforce.maybe(types_1.typeforce.Object),
        output: types_1.typeforce.maybe(types_1.typeforce.BufferN(34)),
        internalPubkey: types_1.typeforce.maybe(types_1.typeforce.BufferN(32)),
        hash: types_1.typeforce.maybe(types_1.typeforce.BufferN(32)), // merkle root hash, the tweak
        pubkey: types_1.typeforce.maybe(types_1.typeforce.BufferN(32)), // tweaked with `hash` from `internalPubkey`
        // signature: typef.maybe(typef.BufferN(64)),
        witness: types_1.typeforce.maybe(types_1.typeforce.arrayOf(types_1.typeforce.Buffer)),
        scriptTree: types_1.typeforce.maybe(types_1.isTaptree),
        redeem: types_1.typeforce.maybe({
            output: types_1.typeforce.maybe(types_1.typeforce.Buffer), // tapleaf script
            redeemVersion: types_1.typeforce.maybe(types_1.typeforce.Number), // tapleaf version
            witness: types_1.typeforce.maybe(types_1.typeforce.arrayOf(types_1.typeforce.Buffer)),
        }),
        redeemVersion: types_1.typeforce.maybe(types_1.typeforce.Number),
    }, a);
    var _address = lazy.value(function () {
        var result = crypto_lib_1.base.bech32m.decode(a.address);
        var version = result.words.shift();
        var data = crypto_lib_1.base.bech32m.fromWords(result.words);
        return {
            version: version,
            prefix: result.prefix,
            data: buffer_1.Buffer.from(data),
        };
    });
    // remove annex if present, ignored by taproot
    var _witness = lazy.value(function () {
        if (!a.witness || !a.witness.length)
            return;
        if (a.witness.length >= 2 &&
            a.witness[a.witness.length - 1][0] === ANNEX_PREFIX) {
            return a.witness.slice(0, -1);
        }
        return a.witness.slice();
    });
    var _hashTree = lazy.value(function () {
        if (a.scriptTree)
            return (0, bip341_1.toHashTree)(a.scriptTree);
        if (a.hash)
            return { hash: a.hash };
        return;
    });
    var network = a.network || networks_1.bitcoin;
    var o = { name: 'p2tr', network: network };
    lazy.prop(o, 'address', function () {
        if (!o.pubkey)
            return;
        var words = crypto_lib_1.base.bech32m.toWords(o.pubkey);
        words.unshift(TAPROOT_WITNESS_VERSION);
        return crypto_lib_1.base.bech32m.encode(network.bech32, words);
    });
    lazy.prop(o, 'hash', function () {
        var hashTree = _hashTree();
        if (hashTree)
            return hashTree.hash;
        var w = _witness();
        if (w && w.length > 1) {
            var controlBlock = w[w.length - 1];
            var leafVersion = controlBlock[0] & types_1.TAPLEAF_VERSION_MASK;
            var script = w[w.length - 2];
            var leafHash = (0, bip341_1.tapleafHash)({ output: script, version: leafVersion });
            return (0, bip341_1.rootHashFromPath)(controlBlock, leafHash);
        }
        return null;
    });
    lazy.prop(o, 'output', function () {
        if (!o.pubkey)
            return;
        return bscript.compile([OPS.OP_1, o.pubkey]);
    });
    lazy.prop(o, 'redeemVersion', function () {
        if (a.redeemVersion)
            return a.redeemVersion;
        if (a.redeem &&
            a.redeem.redeemVersion !== undefined &&
            a.redeem.redeemVersion !== null) {
            return a.redeem.redeemVersion;
        }
        return bip341_1.LEAF_VERSION_TAPSCRIPT;
    });
    lazy.prop(o, 'redeem', function () {
        var witness = _witness(); // witness without annex
        if (!witness || witness.length < 2)
            return;
        return {
            output: witness[witness.length - 2],
            witness: witness.slice(0, -2),
            redeemVersion: witness[witness.length - 1][0] & types_1.TAPLEAF_VERSION_MASK,
        };
    });
    lazy.prop(o, 'pubkey', function () {
        if (a.pubkey)
            return a.pubkey;
        if (a.output)
            return a.output.slice(2);
        if (a.address)
            return _address().data;
        if (o.internalPubkey) {
            var tweakedKey = (0, bip341_1.tweakKey)(o.internalPubkey, o.hash);
            if (tweakedKey)
                return tweakedKey.x;
        }
    });
    lazy.prop(o, 'internalPubkey', function () {
        if (a.internalPubkey)
            return a.internalPubkey;
        var witness = _witness();
        if (witness && witness.length > 1)
            return witness[witness.length - 1].slice(1, 33);
    });
    lazy.prop(o, 'signature', function () {
        if (a.signature)
            return a.signature;
        var witness = _witness(); // witness without annex
        if (!witness || witness.length !== 1)
            return;
        return witness[0];
    });
    lazy.prop(o, 'witness', function () {
        if (a.witness)
            return a.witness;
        var hashTree = _hashTree();
        if (hashTree && a.redeem && a.redeem.output && a.internalPubkey) {
            var leafHash = (0, bip341_1.tapleafHash)({
                output: a.redeem.output,
                version: o.redeemVersion,
            });
            var path = (0, bip341_1.findScriptPath)(hashTree, leafHash);
            if (!path)
                return;
            var outputKey = (0, bip341_1.tweakKey)(a.internalPubkey, hashTree.hash);
            if (!outputKey)
                return;
            var controlBock = buffer_1.Buffer.concat([
                buffer_1.Buffer.from([o.redeemVersion | outputKey.parity]),
                a.internalPubkey,
            ].concat(path));
            return [a.redeem.output, controlBock];
        }
        if (a.signature)
            return [a.signature];
    });
    // extended validation
    if (opts.validate) {
        var pubkey = buffer_1.Buffer.from([]);
        if (a.address) {
            if (network && network.bech32 !== _address().prefix)
                throw new TypeError('Invalid prefix or Network mismatch');
            if (_address().version !== TAPROOT_WITNESS_VERSION)
                throw new TypeError('Invalid address version');
            if (_address().data.length !== 32)
                throw new TypeError('Invalid address data');
            pubkey = _address().data;
        }
        if (a.pubkey) {
            if (pubkey.length > 0 && !pubkey.equals(a.pubkey))
                throw new TypeError('Pubkey mismatch');
            else
                pubkey = a.pubkey;
        }
        if (a.output) {
            if (a.output.length !== 34 ||
                a.output[0] !== OPS.OP_1 ||
                a.output[1] !== 0x20)
                throw new TypeError('Output is invalid');
            if (pubkey.length > 0 && !pubkey.equals(a.output.slice(2)))
                throw new TypeError('Pubkey mismatch');
            else
                pubkey = a.output.slice(2);
        }
        if (a.internalPubkey) {
            var tweakedKey = (0, bip341_1.tweakKey)(a.internalPubkey, o.hash);
            if (pubkey.length > 0 && !pubkey.equals(tweakedKey.x))
                throw new TypeError('Pubkey mismatch');
            else
                pubkey = tweakedKey.x;
        }
        if (pubkey && pubkey.length) {
            if (pubkey.length !== 32)
                throw new TypeError('Invalid pubkey for p2tr');
        }
        var hashTree = _hashTree();
        if (a.hash && hashTree) {
            if (!a.hash.equals(hashTree.hash))
                throw new TypeError('Hash mismatch');
        }
        if (a.redeem && a.redeem.output && hashTree) {
            var leafHash = (0, bip341_1.tapleafHash)({
                output: a.redeem.output,
                version: o.redeemVersion,
            });
            if (!(0, bip341_1.findScriptPath)(hashTree, leafHash))
                throw new TypeError('Redeem script not in tree');
        }
        var witness = _witness();
        // compare the provided redeem data with the one computed from witness
        if (a.redeem && o.redeem) {
            if (a.redeem.redeemVersion) {
                if (a.redeem.redeemVersion !== o.redeem.redeemVersion)
                    throw new TypeError('Redeem.redeemVersion and witness mismatch');
            }
            if (a.redeem.output) {
                if (bscript.decompile(a.redeem.output).length === 0)
                    throw new TypeError('Redeem.output is invalid');
                // output redeem is constructed from the witness
                if (o.redeem.output && !a.redeem.output.equals(o.redeem.output))
                    throw new TypeError('Redeem.output and witness mismatch');
            }
            if (a.redeem.witness) {
                if (o.redeem.witness &&
                    !stacksEqual(a.redeem.witness, o.redeem.witness))
                    throw new TypeError('Redeem.witness and witness mismatch');
            }
        }
        if (witness && witness.length) {
            if (witness.length === 1) {
                // key spending
                if (a.signature && !a.signature.equals(witness[0]))
                    throw new TypeError('Signature mismatch');
            }
            else {
                // script path spending
                var controlBlock = witness[witness.length - 1];
                if (controlBlock.length < 33)
                    throw new TypeError("The control-block length is too small. Got ".concat(controlBlock.length, ", expected min 33."));
                if ((controlBlock.length - 33) % 32 !== 0)
                    throw new TypeError("The control-block length of ".concat(controlBlock.length, " is incorrect!"));
                var m = (controlBlock.length - 33) / 32;
                if (m > 128)
                    throw new TypeError("The script path is too long. Got ".concat(m, ", expected max 128."));
                var internalPubkey = controlBlock.slice(1, 33);
                if (a.internalPubkey && !a.internalPubkey.equals(internalPubkey))
                    throw new TypeError('Internal pubkey mismatch');
                if (internalPubkey.length !== 32)
                    throw new TypeError('Invalid internalPubkey for p2tr witness');
                var leafVersion = controlBlock[0] & types_1.TAPLEAF_VERSION_MASK;
                var script = witness[witness.length - 2];
                var leafHash = (0, bip341_1.tapleafHash)({ output: script, version: leafVersion });
                var hash = (0, bip341_1.rootHashFromPath)(controlBlock, leafHash);
                var outputKey = (0, bip341_1.tweakKey)(internalPubkey, hash);
                if (!outputKey)
                    // todo: needs test data
                    throw new TypeError('Invalid outputKey for p2tr witness');
                if (pubkey.length && !pubkey.equals(outputKey.x))
                    throw new TypeError('Pubkey mismatch for p2tr witness');
                if (outputKey.parity !== (controlBlock[0] & 1))
                    throw new Error('Incorrect parity');
            }
        }
    }
    return Object.assign(o, a);
}
exports.p2tr = p2tr;
function stacksEqual(a, b) {
    if (a.length !== b.length)
        return false;
    return a.every(function (x, i) {
        return x.equals(b[i]);
    });
}
