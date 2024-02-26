"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTaprootInputForSigs = exports.tapTreeFromList = exports.tapTreeToList = exports.tweakInternalPubKey = exports.checkTaprootOutputFields = exports.checkTaprootInputFields = exports.isTaprootOutput = exports.isTaprootInput = exports.serializeTaprootSignature = exports.tapScriptFinalizer = exports.toXOnly = void 0;
/**
 * The following methods are based on `bitcoinjs`, thanks for their work
 * https://github.com/bitcoinjs/bitcoinjs-lib
 */
var types_1 = require("../types");
var transaction_1 = require("../transaction");
var psbtutils_1 = require("./psbtutils");
var bip341_1 = require("../payments/bip341");
var payments_1 = require("../payments");
var psbtutils_2 = require("./psbtutils");
var toXOnly = function (pubKey) {
    return pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);
};
exports.toXOnly = toXOnly;
/**
 * Default tapscript finalizer. It searches for the `tapLeafHashToFinalize` if provided.
 * Otherwise it will search for the tapleaf that has at least one signature and has the shortest path.
 * @param inputIndex the position of the PSBT input.
 * @param input the PSBT input.
 * @param tapLeafHashToFinalize optional, if provided the finalizer will search for a tapleaf that has this hash
 *                              and will try to build the finalScriptWitness.
 * @returns the finalScriptWitness or throws an exception if no tapleaf found.
 */
function tapScriptFinalizer(inputIndex, input, tapLeafHashToFinalize) {
    var tapLeaf = findTapLeafToFinalize(input, inputIndex, tapLeafHashToFinalize);
    try {
        var sigs = sortSignatures(input, tapLeaf);
        var witness = sigs.concat(tapLeaf.script).concat(tapLeaf.controlBlock);
        return { finalScriptWitness: (0, psbtutils_1.witnessStackToScriptWitness)(witness) };
    }
    catch (err) {
        throw new Error("Can not finalize taproot input #".concat(inputIndex, ": ").concat(err));
    }
}
exports.tapScriptFinalizer = tapScriptFinalizer;
function serializeTaprootSignature(sig, sighashType) {
    var sighashTypeByte = sighashType
        ? Buffer.from([sighashType])
        : Buffer.from([]);
    return Buffer.concat([sig, sighashTypeByte]);
}
exports.serializeTaprootSignature = serializeTaprootSignature;
function isTaprootInput(input) {
    return (input &&
        !!(input.tapInternalKey ||
            input.tapMerkleRoot ||
            (input.tapLeafScript && input.tapLeafScript.length) ||
            (input.tapBip32Derivation && input.tapBip32Derivation.length) ||
            (input.witnessUtxo && (0, psbtutils_1.isP2TR)(input.witnessUtxo.script))));
}
exports.isTaprootInput = isTaprootInput;
function isTaprootOutput(output, script) {
    return (output &&
        !!(output.tapInternalKey ||
            output.tapTree ||
            (output.tapBip32Derivation && output.tapBip32Derivation.length) ||
            (script && (0, psbtutils_1.isP2TR)(script))));
}
exports.isTaprootOutput = isTaprootOutput;
function checkTaprootInputFields(inputData, newInputData, action) {
    checkMixedTaprootAndNonTaprootInputFields(inputData, newInputData, action);
    checkIfTapLeafInTree(inputData, newInputData, action);
}
exports.checkTaprootInputFields = checkTaprootInputFields;
function checkTaprootOutputFields(outputData, newOutputData, action) {
    checkMixedTaprootAndNonTaprootOutputFields(outputData, newOutputData, action);
    checkTaprootScriptPubkey(outputData, newOutputData);
}
exports.checkTaprootOutputFields = checkTaprootOutputFields;
function checkTaprootScriptPubkey(outputData, newOutputData) {
    if (!newOutputData.tapTree && !newOutputData.tapInternalKey)
        return;
    var tapInternalKey = newOutputData.tapInternalKey || outputData.tapInternalKey;
    var tapTree = newOutputData.tapTree || outputData.tapTree;
    if (tapInternalKey) {
        var scriptPubkey = outputData.script;
        var script = getTaprootScripPubkey(tapInternalKey, tapTree);
        if (scriptPubkey && !scriptPubkey.equals(script))
            throw new Error('Error adding output. Script or address missmatch.');
    }
}
function getTaprootScripPubkey(tapInternalKey, tapTree) {
    var scriptTree = tapTree && tapTreeFromList(tapTree.leaves);
    var output = (0, payments_1.p2tr)({
        internalPubkey: tapInternalKey,
        scriptTree: scriptTree,
    }).output;
    return output;
}
function tweakInternalPubKey(inputIndex, input) {
    var tapInternalKey = input.tapInternalKey;
    var outputKey = tapInternalKey && (0, bip341_1.tweakKey)(tapInternalKey, input.tapMerkleRoot);
    if (!outputKey)
        throw new Error("Cannot tweak tap internal key for input #".concat(inputIndex, ". Public key: ").concat(tapInternalKey && tapInternalKey.toString('hex')));
    return outputKey.x;
}
exports.tweakInternalPubKey = tweakInternalPubKey;
/**
 * Convert a binary tree to a BIP371 type list. Each element of the list is (according to BIP371):
 * One or more tuples representing the depth, leaf version, and script for a leaf in the Taproot tree,
 * allowing the entire tree to be reconstructed. The tuples must be in depth first search order so that
 * the tree is correctly reconstructed.
 * @param tree the binary tap tree
 * @returns a list of BIP 371 tapleaves
 */
function tapTreeToList(tree) {
    if (!(0, types_1.isTaptree)(tree))
        throw new Error('Cannot convert taptree to tapleaf list. Expecting a tapree structure.');
    return _tapTreeToList(tree);
}
exports.tapTreeToList = tapTreeToList;
/**
 * Convert a BIP371 TapLeaf list to a TapTree (binary).
 * @param leaves a list of tapleaves where each element of the list is (according to BIP371):
 * One or more tuples representing the depth, leaf version, and script for a leaf in the Taproot tree,
 * allowing the entire tree to be reconstructed. The tuples must be in depth first search order so that
 * the tree is correctly reconstructed.
 * @returns the corresponding taptree, or throws an exception if the tree cannot be reconstructed
 */
function tapTreeFromList(leaves) {
    if (leaves === void 0) { leaves = []; }
    if (leaves.length === 1 && leaves[0].depth === 0)
        return {
            output: leaves[0].script,
            version: leaves[0].leafVersion,
        };
    return instertLeavesInTree(leaves);
}
exports.tapTreeFromList = tapTreeFromList;
function checkTaprootInputForSigs(input, action) {
    var sigs = extractTaprootSigs(input);
    return sigs.some(function (sig) {
        return (0, psbtutils_2.signatureBlocksAction)(sig, decodeSchnorrSignature, action);
    });
}
exports.checkTaprootInputForSigs = checkTaprootInputForSigs;
function decodeSchnorrSignature(signature) {
    return {
        signature: signature.slice(0, 64),
        hashType: signature.slice(64)[0] || transaction_1.Transaction.SIGHASH_DEFAULT,
    };
}
function extractTaprootSigs(input) {
    var sigs = [];
    if (input.tapKeySig)
        sigs.push(input.tapKeySig);
    if (input.tapScriptSig)
        sigs.push.apply(sigs, input.tapScriptSig.map(function (s) { return s.signature; }));
    if (!sigs.length) {
        var finalTapKeySig = getTapKeySigFromWithness(input.finalScriptWitness);
        if (finalTapKeySig)
            sigs.push(finalTapKeySig);
    }
    return sigs;
}
function getTapKeySigFromWithness(finalScriptWitness) {
    if (!finalScriptWitness)
        return;
    var witness = finalScriptWitness.slice(2);
    // todo: add schnorr signature validation
    if (witness.length === 64 || witness.length === 65)
        return witness;
}
function _tapTreeToList(tree, leaves, depth) {
    if (leaves === void 0) { leaves = []; }
    if (depth === void 0) { depth = 0; }
    if (depth > bip341_1.MAX_TAPTREE_DEPTH)
        throw new Error('Max taptree depth exceeded.');
    if (!tree)
        return [];
    if ((0, types_1.isTapleaf)(tree)) {
        leaves.push({
            depth: depth,
            leafVersion: tree.version || bip341_1.LEAF_VERSION_TAPSCRIPT,
            script: tree.output,
        });
        return leaves;
    }
    if (tree[0])
        _tapTreeToList(tree[0], leaves, depth + 1);
    if (tree[1])
        _tapTreeToList(tree[1], leaves, depth + 1);
    return leaves;
}
function instertLeavesInTree(leaves) {
    var tree;
    for (var _i = 0, leaves_1 = leaves; _i < leaves_1.length; _i++) {
        var leaf = leaves_1[_i];
        tree = instertLeafInTree(leaf, tree);
        if (!tree)
            throw new Error("No room left to insert tapleaf in tree");
    }
    return tree;
}
function instertLeafInTree(leaf, tree, depth) {
    if (depth === void 0) { depth = 0; }
    if (depth > bip341_1.MAX_TAPTREE_DEPTH)
        throw new Error('Max taptree depth exceeded.');
    if (leaf.depth === depth) {
        if (!tree)
            return {
                output: leaf.script,
                version: leaf.leafVersion,
            };
        return;
    }
    if ((0, types_1.isTapleaf)(tree))
        return;
    var leftSide = instertLeafInTree(leaf, tree && tree[0], depth + 1);
    if (leftSide)
        return [leftSide, tree && tree[1]];
    var rightSide = instertLeafInTree(leaf, tree && tree[1], depth + 1);
    if (rightSide)
        return [tree && tree[0], rightSide];
}
function checkMixedTaprootAndNonTaprootInputFields(inputData, newInputData, action) {
    var isBadTaprootUpdate = isTaprootInput(inputData) && hasNonTaprootFields(newInputData);
    var isBadNonTaprootUpdate = hasNonTaprootFields(inputData) && isTaprootInput(newInputData);
    var hasMixedFields = inputData === newInputData &&
        isTaprootInput(newInputData) &&
        hasNonTaprootFields(newInputData); // todo: bad? use !===
    if (isBadTaprootUpdate || isBadNonTaprootUpdate || hasMixedFields)
        throw new Error("Invalid arguments for Psbt.".concat(action, ". ") +
            "Cannot use both taproot and non-taproot fields.");
}
function checkMixedTaprootAndNonTaprootOutputFields(inputData, newInputData, action) {
    var isBadTaprootUpdate = isTaprootOutput(inputData) && hasNonTaprootFields(newInputData);
    var isBadNonTaprootUpdate = hasNonTaprootFields(inputData) && isTaprootOutput(newInputData);
    var hasMixedFields = inputData === newInputData &&
        isTaprootOutput(newInputData) &&
        hasNonTaprootFields(newInputData);
    if (isBadTaprootUpdate || isBadNonTaprootUpdate || hasMixedFields)
        throw new Error("Invalid arguments for Psbt.".concat(action, ". ") +
            "Cannot use both taproot and non-taproot fields.");
}
function checkIfTapLeafInTree(inputData, newInputData, action) {
    if (newInputData.tapMerkleRoot) {
        var newLeafsInTree = (newInputData.tapLeafScript || []).every(function (l) {
            return isTapLeafInTree(l, newInputData.tapMerkleRoot);
        });
        var oldLeafsInTree = (inputData.tapLeafScript || []).every(function (l) {
            return isTapLeafInTree(l, newInputData.tapMerkleRoot);
        });
        if (!newLeafsInTree || !oldLeafsInTree)
            throw new Error("Invalid arguments for Psbt.".concat(action, ". Tapleaf not part of taptree."));
    }
    else if (inputData.tapMerkleRoot) {
        var newLeafsInTree = (newInputData.tapLeafScript || []).every(function (l) {
            return isTapLeafInTree(l, inputData.tapMerkleRoot);
        });
        if (!newLeafsInTree)
            throw new Error("Invalid arguments for Psbt.".concat(action, ". Tapleaf not part of taptree."));
    }
}
function isTapLeafInTree(tapLeaf, merkleRoot) {
    if (!merkleRoot)
        return true;
    var leafHash = (0, bip341_1.tapleafHash)({
        output: tapLeaf.script,
        version: tapLeaf.leafVersion,
    });
    var rootHash = (0, bip341_1.rootHashFromPath)(tapLeaf.controlBlock, leafHash);
    return rootHash.equals(merkleRoot);
}
function sortSignatures(input, tapLeaf) {
    var leafHash = (0, bip341_1.tapleafHash)({
        output: tapLeaf.script,
        version: tapLeaf.leafVersion,
    });
    return (input.tapScriptSig || [])
        .filter(function (tss) { return tss.leafHash.equals(leafHash); })
        .map(function (tss) { return addPubkeyPositionInScript(tapLeaf.script, tss); })
        .sort(function (t1, t2) { return t2.positionInScript - t1.positionInScript; })
        .map(function (t) { return t.signature; });
}
function addPubkeyPositionInScript(script, tss) {
    return Object.assign({
        positionInScript: (0, psbtutils_1.pubkeyPositionInScript)(tss.pubkey, script),
    }, tss);
}
/**
 * Find tapleaf by hash, or get the signed tapleaf with the shortest path.
 */
function findTapLeafToFinalize(input, inputIndex, leafHashToFinalize) {
    if (!input.tapScriptSig || !input.tapScriptSig.length)
        throw new Error("Can not finalize taproot input #".concat(inputIndex, ". No tapleaf script signature provided."));
    var tapLeaf = (input.tapLeafScript || [])
        .sort(function (a, b) { return a.controlBlock.length - b.controlBlock.length; })
        .find(function (leaf) {
        return canFinalizeLeaf(leaf, input.tapScriptSig, leafHashToFinalize);
    });
    if (!tapLeaf)
        throw new Error("Can not finalize taproot input #".concat(inputIndex, ". Signature for tapleaf script not found."));
    return tapLeaf;
}
function canFinalizeLeaf(leaf, tapScriptSig, hash) {
    var leafHash = (0, bip341_1.tapleafHash)({
        output: leaf.script,
        version: leaf.leafVersion,
    });
    var whiteListedHash = !hash || hash.equals(leafHash);
    return (whiteListedHash &&
        tapScriptSig.find(function (tss) { return tss.leafHash.equals(leafHash); }) !== undefined);
}
function hasNonTaprootFields(io) {
    return (io &&
        !!(io.redeemScript ||
            io.witnessScript ||
            (io.bip32Derivation && io.bip32Derivation.length)));
}
