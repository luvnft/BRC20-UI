"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.p2data = void 0;
/**
 * The following methods are based on `bitcoinjs`, thanks for their work
 * https://github.com/bitcoinjs/bitcoinjs-lib
 */
var networks_1 = require("../networks");
var bscript = require("../script");
var types_1 = require("../types");
var lazy = require("./lazy");
var OPS = bscript.OPS;
function stacksEqual(a, b) {
    if (a.length !== b.length)
        return false;
    return a.every(function (x, i) {
        return x.equals(b[i]);
    });
}
// output: OP_RETURN ...
function p2data(a, opts) {
    if (!a.data && !a.output)
        throw new TypeError('Not enough data');
    opts = Object.assign({ validate: true }, opts || {});
    (0, types_1.typeforce)({
        network: types_1.typeforce.maybe(types_1.typeforce.Object),
        output: types_1.typeforce.maybe(types_1.typeforce.Buffer),
        data: types_1.typeforce.maybe(types_1.typeforce.arrayOf(types_1.typeforce.Buffer)),
    }, a);
    var network = a.network || networks_1.bitcoin;
    var o = { name: 'embed', network: network };
    lazy.prop(o, 'output', function () {
        if (!a.data)
            return;
        return bscript.compile([OPS.OP_RETURN].concat(a.data));
    });
    lazy.prop(o, 'data', function () {
        if (!a.output)
            return;
        return bscript.decompile(a.output).slice(1);
    });
    // extended validation
    if (opts.validate) {
        if (a.output) {
            var chunks = bscript.decompile(a.output);
            if (chunks[0] !== OPS.OP_RETURN)
                throw new TypeError('Output is invalid');
            if (!chunks.slice(1).every(types_1.typeforce.Buffer))
                throw new TypeError('Output is invalid');
            if (a.data && !stacksEqual(a.data, o.data))
                throw new TypeError('Data mismatch');
        }
    }
    return Object.assign(o, a);
}
exports.p2data = p2data;
