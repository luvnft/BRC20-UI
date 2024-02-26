"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signatureBlocksAction = exports.checkInputForSig = exports.pubkeyInScript = exports.pubkeyPositionInScript = exports.witnessStackToScriptWitness = exports.isP2TR = exports.isP2SHScript = exports.isP2WSHScript = exports.isP2WPKH = exports.isP2PKH = exports.isP2PK = exports.isP2MS = void 0;
/**
 * The following methods are based on `bitcoinjs`, thanks for their work
 * https://github.com/bitcoinjs/bitcoinjs-lib
 */
var varuint = require("../bip174/converter/varint");
var bscript = require("../script");
var transaction_1 = require("../transaction");
var crypto_1 = require("../crypto");
var payments = require("../payments");
function isPaymentFactory(payment) {
    return function (script) {
        try {
            payment({ output: script });
            return true;
        }
        catch (err) {
            return false;
        }
    };
}
exports.isP2MS = isPaymentFactory(payments.p2ms);
exports.isP2PK = isPaymentFactory(payments.p2pk);
exports.isP2PKH = isPaymentFactory(payments.p2pkh);
exports.isP2WPKH = isPaymentFactory(payments.p2wpkh);
exports.isP2WSHScript = isPaymentFactory(payments.p2wsh);
exports.isP2SHScript = isPaymentFactory(payments.p2sh);
exports.isP2TR = isPaymentFactory(payments.p2tr);
function witnessStackToScriptWitness(witness) {
    var buffer = Buffer.allocUnsafe(0);
    function writeSlice(slice) {
        buffer = Buffer.concat([buffer, Buffer.from(slice)]);
    }
    function writeVarInt(i) {
        var currentLen = buffer.length;
        var varintLen = varuint.encodingLength(i);
        buffer = Buffer.concat([buffer, Buffer.allocUnsafe(varintLen)]);
        varuint.encode(i, buffer, currentLen);
    }
    function writeVarSlice(slice) {
        writeVarInt(slice.length);
        writeSlice(slice);
    }
    function writeVector(vector) {
        writeVarInt(vector.length);
        vector.forEach(writeVarSlice);
    }
    writeVector(witness);
    return buffer;
}
exports.witnessStackToScriptWitness = witnessStackToScriptWitness;
function pubkeyPositionInScript(pubkey, script) {
    var pubkeyHash = (0, crypto_1.hash160)(pubkey);
    var pubkeyXOnly = pubkey.slice(1, 33); // slice before calling?
    var decompiled = bscript.decompile(script);
    if (decompiled === null)
        throw new Error('Unknown script error');
    return decompiled.findIndex(function (element) {
        if (typeof element === 'number')
            return false;
        return (element.equals(pubkey) ||
            element.equals(pubkeyHash) ||
            element.equals(pubkeyXOnly));
    });
}
exports.pubkeyPositionInScript = pubkeyPositionInScript;
function pubkeyInScript(pubkey, script) {
    return pubkeyPositionInScript(pubkey, script) !== -1;
}
exports.pubkeyInScript = pubkeyInScript;
function checkInputForSig(input, action) {
    var pSigs = extractPartialSigs(input);
    return pSigs.some(function (pSig) {
        return signatureBlocksAction(pSig, bscript.signature.decode, action);
    });
}
exports.checkInputForSig = checkInputForSig;
function signatureBlocksAction(signature, signatureDecodeFn, action) {
    var hashType = signatureDecodeFn(signature).hashType;
    var whitelist = [];
    var isAnyoneCanPay = hashType & transaction_1.Transaction.SIGHASH_ANYONECANPAY;
    if (isAnyoneCanPay)
        whitelist.push('addInput');
    var hashMod = hashType & 0x1f;
    switch (hashMod) {
        case transaction_1.Transaction.SIGHASH_ALL:
            break;
        case transaction_1.Transaction.SIGHASH_SINGLE:
        case transaction_1.Transaction.SIGHASH_NONE:
            whitelist.push('addOutput');
            whitelist.push('setInputSequence');
            break;
    }
    if (whitelist.indexOf(action) === -1) {
        return true;
    }
    return false;
}
exports.signatureBlocksAction = signatureBlocksAction;
function extractPartialSigs(input) {
    var pSigs = [];
    if ((input.partialSig || []).length === 0) {
        if (!input.finalScriptSig && !input.finalScriptWitness)
            return [];
        pSigs = getPsigsFromInputFinalScripts(input);
    }
    else {
        pSigs = input.partialSig;
    }
    return pSigs.map(function (p) { return p.signature; });
}
function getPsigsFromInputFinalScripts(input) {
    var scriptItems = !input.finalScriptSig
        ? []
        : bscript.decompile(input.finalScriptSig) || [];
    var witnessItems = !input.finalScriptWitness
        ? []
        : bscript.decompile(input.finalScriptWitness) || [];
    return scriptItems
        .concat(witnessItems)
        .filter(function (item) {
        return Buffer.isBuffer(item) && bscript.isCanonicalScriptSignature(item);
    })
        .map(function (sig) { return ({ signature: sig }); });
}
