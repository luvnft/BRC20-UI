"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.outputs = exports.inputs = exports.globals = void 0;
/**
 * The following methods are based on `bitcoinjs`, thanks for their work
 * https://github.com/bitcoinjs/bitcoinjs-lib
 */
var typeFields_1 = require("../typeFields");
var globalXpub = require("./global/globalXpub");
var unsignedTx = require("./global/unsignedTx");
var finalScriptSig = require("./input/finalScriptSig");
var finalScriptWitness = require("./input/finalScriptWitness");
var nonWitnessUtxo = require("./input/nonWitnessUtxo");
var partialSig = require("./input/partialSig");
var porCommitment = require("./input/porCommitment");
var sighashType = require("./input/sighashType");
var tapKeySig = require("./input/tapKeySig");
var tapLeafScript = require("./input/tapLeafScript");
var tapMerkleRoot = require("./input/tapMerkleRoot");
var tapScriptSig = require("./input/tapScriptSig");
var witnessUtxo = require("./input/witnessUtxo");
var tapTree = require("./output/tapTree");
var bip32Derivation = require("./shared/bip32Derivation");
var checkPubkey = require("./shared/checkPubkey");
var redeemScript = require("./shared/redeemScript");
var tapBip32Derivation = require("./shared/tapBip32Derivation");
var tapInternalKey = require("./shared/tapInternalKey");
var witnessScript = require("./shared/witnessScript");
var globals = {
    unsignedTx: unsignedTx,
    globalXpub: globalXpub,
    // pass an Array of key bytes that require pubkey beside the key
    checkPubkey: checkPubkey.makeChecker([]),
};
exports.globals = globals;
var inputs = {
    nonWitnessUtxo: nonWitnessUtxo,
    partialSig: partialSig,
    sighashType: sighashType,
    finalScriptSig: finalScriptSig,
    finalScriptWitness: finalScriptWitness,
    porCommitment: porCommitment,
    witnessUtxo: witnessUtxo,
    bip32Derivation: bip32Derivation.makeConverter(typeFields_1.InputTypes.BIP32_DERIVATION),
    redeemScript: redeemScript.makeConverter(typeFields_1.InputTypes.REDEEM_SCRIPT),
    witnessScript: witnessScript.makeConverter(typeFields_1.InputTypes.WITNESS_SCRIPT),
    checkPubkey: checkPubkey.makeChecker([
        typeFields_1.InputTypes.PARTIAL_SIG,
        typeFields_1.InputTypes.BIP32_DERIVATION,
    ]),
    tapKeySig: tapKeySig,
    tapScriptSig: tapScriptSig,
    tapLeafScript: tapLeafScript,
    tapBip32Derivation: tapBip32Derivation.makeConverter(typeFields_1.InputTypes.TAP_BIP32_DERIVATION),
    tapInternalKey: tapInternalKey.makeConverter(typeFields_1.InputTypes.TAP_INTERNAL_KEY),
    tapMerkleRoot: tapMerkleRoot,
};
exports.inputs = inputs;
var outputs = {
    bip32Derivation: bip32Derivation.makeConverter(typeFields_1.OutputTypes.BIP32_DERIVATION),
    redeemScript: redeemScript.makeConverter(typeFields_1.OutputTypes.REDEEM_SCRIPT),
    witnessScript: witnessScript.makeConverter(typeFields_1.OutputTypes.WITNESS_SCRIPT),
    checkPubkey: checkPubkey.makeChecker([typeFields_1.OutputTypes.BIP32_DERIVATION]),
    tapBip32Derivation: tapBip32Derivation.makeConverter(typeFields_1.OutputTypes.TAP_BIP32_DERIVATION),
    tapTree: tapTree,
    tapInternalKey: tapInternalKey.makeConverter(typeFields_1.OutputTypes.TAP_INTERNAL_KEY),
};
exports.outputs = outputs;
