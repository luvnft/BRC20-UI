"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.p2pk = void 0;
/**
 * The following methods are based on `bitcoinjs`, thanks for their work
 * https://github.com/bitcoinjs/bitcoinjs-lib
 */
var networks_1 = require("../networks");
var bscript = require("../script");
var types_1 = require("../types");
var lazy = require("./lazy");
var OPS = bscript.OPS;
// input: {signature}
// output: {pubKey} OP_CHECKSIG
function p2pk(a, opts) {
    if (!a.input && !a.output && !a.pubkey && !a.input && !a.signature)
        throw new TypeError('Not enough data');
    opts = Object.assign({ validate: true }, opts || {});
    (0, types_1.typeforce)({
        network: types_1.typeforce.maybe(types_1.typeforce.Object),
        output: types_1.typeforce.maybe(types_1.typeforce.Buffer),
        pubkey: types_1.typeforce.maybe(types_1.isPoint),
        signature: types_1.typeforce.maybe(bscript.isCanonicalScriptSignature),
        input: types_1.typeforce.maybe(types_1.typeforce.Buffer),
    }, a);
    var _chunks = lazy.value(function () {
        return bscript.decompile(a.input);
    });
    var network = a.network || networks_1.bitcoin;
    var o = { name: 'p2pk', network: network };
    lazy.prop(o, 'output', function () {
        if (!a.pubkey)
            return;
        return bscript.compile([a.pubkey, OPS.OP_CHECKSIG]);
    });
    lazy.prop(o, 'pubkey', function () {
        if (!a.output)
            return;
        return a.output.slice(1, -1);
    });
    lazy.prop(o, 'signature', function () {
        if (!a.input)
            return;
        return _chunks()[0];
    });
    lazy.prop(o, 'input', function () {
        if (!a.signature)
            return;
        return bscript.compile([a.signature]);
    });
    lazy.prop(o, 'witness', function () {
        if (!o.input)
            return;
        return [];
    });
    // extended validation
    if (opts.validate) {
        if (a.output) {
            if (a.output[a.output.length - 1] !== OPS.OP_CHECKSIG)
                throw new TypeError('Output is invalid');
            if (!(0, types_1.isPoint)(o.pubkey))
                throw new TypeError('Output pubkey is invalid');
            if (a.pubkey && !a.pubkey.equals(o.pubkey))
                throw new TypeError('Pubkey mismatch');
        }
        if (a.signature) {
            if (a.input && !a.input.equals(o.input))
                throw new TypeError('Signature mismatch');
        }
        if (a.input) {
            if (_chunks().length !== 1)
                throw new TypeError('Input is invalid');
            if (!bscript.isCanonicalScriptSignature(o.signature))
                throw new TypeError('Input has invalid signature');
        }
    }
    return Object.assign(o, a);
}
exports.p2pk = p2pk;
