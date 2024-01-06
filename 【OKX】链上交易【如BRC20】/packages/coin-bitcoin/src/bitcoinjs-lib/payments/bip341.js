"use strict";
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
exports.tweakKey = exports.tapTweakHash = exports.tapleafHash = exports.findScriptPath = exports.toHashTree = exports.rootHashFromPath = exports.MAX_TAPTREE_DEPTH = exports.LEAF_VERSION_TAPSCRIPT = void 0;
/**
 * The following methods are based on `bitcoinjs`, thanks for their work
 * https://github.com/bitcoinjs/bitcoinjs-lib
 */
var buffer_1 = require("buffer");
var bcrypto = require("../crypto");
var bufferutils_1 = require("../bufferutils");
var types_1 = require("../types");
var taproot_1 = require("../../taproot");
exports.LEAF_VERSION_TAPSCRIPT = 0xc0;
exports.MAX_TAPTREE_DEPTH = 128;
var isHashBranch = function (ht) {
    return 'left' in ht && 'right' in ht;
};
function rootHashFromPath(controlBlock, leafHash) {
    if (controlBlock.length < 33)
        throw new TypeError("The control-block length is too small. Got ".concat(controlBlock.length, ", expected min 33."));
    var m = (controlBlock.length - 33) / 32;
    var kj = leafHash;
    for (var j = 0; j < m; j++) {
        var ej = controlBlock.slice(33 + 32 * j, 65 + 32 * j);
        if (kj.compare(ej) < 0) {
            kj = tapBranchHash(kj, ej);
        }
        else {
            kj = tapBranchHash(ej, kj);
        }
    }
    return kj;
}
exports.rootHashFromPath = rootHashFromPath;
/**
 * Build a hash tree of merkle nodes from the scripts binary tree.
 * @param scriptTree - the tree of scripts to pairwise hash.
 */
function toHashTree(scriptTree) {
    if ((0, types_1.isTapleaf)(scriptTree))
        return { hash: tapleafHash(scriptTree) };
    var hashes = [toHashTree(scriptTree[0]), toHashTree(scriptTree[1])];
    hashes.sort(function (a, b) { return a.hash.compare(b.hash); });
    var left = hashes[0], right = hashes[1];
    return {
        hash: tapBranchHash(left.hash, right.hash),
        left: left,
        right: right,
    };
}
exports.toHashTree = toHashTree;
/**
 * Given a HashTree, finds the path from a particular hash to the root.
 * @param node - the root of the tree
 * @param hash - the hash to search for
 * @returns - array of sibling hashes, from leaf (inclusive) to root
 * (exclusive) needed to prove inclusion of the specified hash. undefined if no
 * path is found
 */
function findScriptPath(node, hash) {
    if (isHashBranch(node)) {
        var leftPath = findScriptPath(node.left, hash);
        if (leftPath !== undefined)
            return __spreadArray(__spreadArray([], leftPath, true), [node.right.hash], false);
        var rightPath = findScriptPath(node.right, hash);
        if (rightPath !== undefined)
            return __spreadArray(__spreadArray([], rightPath, true), [node.left.hash], false);
    }
    else if (node.hash.equals(hash)) {
        return [];
    }
    return undefined;
}
exports.findScriptPath = findScriptPath;
function tapleafHash(leaf) {
    var version = leaf.version || exports.LEAF_VERSION_TAPSCRIPT;
    return bcrypto.taggedHash('TapLeaf', buffer_1.Buffer.concat([buffer_1.Buffer.from([version]), serializeScript(leaf.output)]));
}
exports.tapleafHash = tapleafHash;
function tapTweakHash(pubKey, h) {
    return bcrypto.taggedHash('TapTweak', buffer_1.Buffer.concat(h ? [pubKey, h] : [pubKey]));
}
exports.tapTweakHash = tapTweakHash;
function tweakKey(pubKey, h) {
    if (!buffer_1.Buffer.isBuffer(pubKey))
        return null;
    if (pubKey.length !== 32)
        return null;
    if (h && h.length !== 32)
        return null;
    var res = (0, taproot_1.taprootTweakPubkey)(pubKey, h);
    return {
        parity: res[1],
        x: buffer_1.Buffer.from(res[0]),
    };
}
exports.tweakKey = tweakKey;
function tapBranchHash(a, b) {
    return bcrypto.taggedHash('TapBranch', buffer_1.Buffer.concat([a, b]));
}
function serializeScript(s) {
    var varintLen = bufferutils_1.varuint.encodingLength(s.length);
    var buffer = buffer_1.Buffer.allocUnsafe(varintLen); // better
    bufferutils_1.varuint.encode(s.length, buffer);
    return buffer_1.Buffer.concat([buffer, s]);
}
