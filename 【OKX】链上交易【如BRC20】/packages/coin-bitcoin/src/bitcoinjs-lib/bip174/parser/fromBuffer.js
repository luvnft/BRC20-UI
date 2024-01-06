"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.psbtFromKeyVals = exports.checkKeyBuffer = exports.psbtFromBuffer = void 0;
/**
 * The following methods are based on `bitcoinjs`, thanks for their work
 * https://github.com/bitcoinjs/bitcoinjs-lib
 */
var convert = require("../converter");
var tools_1 = require("../converter/tools");
var varuint = require("../converter/varint");
var typeFields_1 = require("../typeFields");
function psbtFromBuffer(buffer, txGetter) {
    var offset = 0;
    function varSlice() {
        var keyLen = varuint.decode(buffer, offset);
        offset += varuint.encodingLength(keyLen);
        var key = buffer.slice(offset, offset + keyLen);
        offset += keyLen;
        return key;
    }
    function readUInt32BE() {
        var num = buffer.readUInt32BE(offset);
        offset += 4;
        return num;
    }
    function readUInt8() {
        var num = buffer.readUInt8(offset);
        offset += 1;
        return num;
    }
    function getKeyValue() {
        var key = varSlice();
        var value = varSlice();
        return {
            key: key,
            value: value,
        };
    }
    function checkEndOfKeyValPairs() {
        if (offset >= buffer.length) {
            throw new Error('Format Error: Unexpected End of PSBT');
        }
        var isEnd = buffer.readUInt8(offset) === 0;
        if (isEnd) {
            offset++;
        }
        return isEnd;
    }
    if (readUInt32BE() !== 0x70736274) {
        throw new Error('Format Error: Invalid Magic Number');
    }
    if (readUInt8() !== 0xff) {
        throw new Error('Format Error: Magic Number must be followed by 0xff separator');
    }
    var globalMapKeyVals = [];
    var globalKeyIndex = {};
    while (!checkEndOfKeyValPairs()) {
        var keyVal = getKeyValue();
        var hexKey = keyVal.key.toString('hex');
        if (globalKeyIndex[hexKey]) {
            throw new Error('Format Error: Keys must be unique for global keymap: key ' + hexKey);
        }
        globalKeyIndex[hexKey] = 1;
        globalMapKeyVals.push(keyVal);
    }
    var unsignedTxMaps = globalMapKeyVals.filter(function (keyVal) { return keyVal.key[0] === typeFields_1.GlobalTypes.UNSIGNED_TX; });
    if (unsignedTxMaps.length !== 1) {
        throw new Error('Format Error: Only one UNSIGNED_TX allowed');
    }
    var unsignedTx = txGetter(unsignedTxMaps[0].value);
    // Get input and output counts to loop the respective fields
    var _a = unsignedTx.getInputOutputCounts(), inputCount = _a.inputCount, outputCount = _a.outputCount;
    var inputKeyVals = [];
    var outputKeyVals = [];
    // Get input fields
    for (var _i = 0, _b = (0, tools_1.range)(inputCount); _i < _b.length; _i++) {
        var index = _b[_i];
        var inputKeyIndex = {};
        var input = [];
        while (!checkEndOfKeyValPairs()) {
            var keyVal = getKeyValue();
            var hexKey = keyVal.key.toString('hex');
            if (inputKeyIndex[hexKey]) {
                throw new Error('Format Error: Keys must be unique for each input: ' +
                    'input index ' +
                    index +
                    ' key ' +
                    hexKey);
            }
            inputKeyIndex[hexKey] = 1;
            input.push(keyVal);
        }
        inputKeyVals.push(input);
    }
    for (var _c = 0, _d = (0, tools_1.range)(outputCount); _c < _d.length; _c++) {
        var index = _d[_c];
        var outputKeyIndex = {};
        var output = [];
        while (!checkEndOfKeyValPairs()) {
            var keyVal = getKeyValue();
            var hexKey = keyVal.key.toString('hex');
            if (outputKeyIndex[hexKey]) {
                throw new Error('Format Error: Keys must be unique for each output: ' +
                    'output index ' +
                    index +
                    ' key ' +
                    hexKey);
            }
            outputKeyIndex[hexKey] = 1;
            output.push(keyVal);
        }
        outputKeyVals.push(output);
    }
    return psbtFromKeyVals(unsignedTx, {
        globalMapKeyVals: globalMapKeyVals,
        inputKeyVals: inputKeyVals,
        outputKeyVals: outputKeyVals,
    });
}
exports.psbtFromBuffer = psbtFromBuffer;
function checkKeyBuffer(type, keyBuf, keyNum) {
    if (!keyBuf.equals(Buffer.from([keyNum]))) {
        throw new Error("Format Error: Invalid ".concat(type, " key: ").concat(keyBuf.toString('hex')));
    }
}
exports.checkKeyBuffer = checkKeyBuffer;
function psbtFromKeyVals(unsignedTx, _a) {
    var globalMapKeyVals = _a.globalMapKeyVals, inputKeyVals = _a.inputKeyVals, outputKeyVals = _a.outputKeyVals;
    // That was easy :-)
    var globalMap = {
        unsignedTx: unsignedTx,
    };
    var txCount = 0;
    for (var _i = 0, globalMapKeyVals_1 = globalMapKeyVals; _i < globalMapKeyVals_1.length; _i++) {
        var keyVal = globalMapKeyVals_1[_i];
        // If a globalMap item needs pubkey, uncomment
        // const pubkey = convert.globals.checkPubkey(keyVal);
        switch (keyVal.key[0]) {
            case typeFields_1.GlobalTypes.UNSIGNED_TX:
                checkKeyBuffer('global', keyVal.key, typeFields_1.GlobalTypes.UNSIGNED_TX);
                if (txCount > 0) {
                    throw new Error('Format Error: GlobalMap has multiple UNSIGNED_TX');
                }
                txCount++;
                break;
            case typeFields_1.GlobalTypes.GLOBAL_XPUB:
                if (globalMap.globalXpub === undefined) {
                    globalMap.globalXpub = [];
                }
                globalMap.globalXpub.push(convert.globals.globalXpub.decode(keyVal));
                break;
            default:
                // This will allow inclusion during serialization.
                if (!globalMap.unknownKeyVals)
                    globalMap.unknownKeyVals = [];
                globalMap.unknownKeyVals.push(keyVal);
        }
    }
    // Get input and output counts to loop the respective fields
    var inputCount = inputKeyVals.length;
    var outputCount = outputKeyVals.length;
    var inputs = [];
    var outputs = [];
    // Get input fields
    for (var _b = 0, _c = (0, tools_1.range)(inputCount); _b < _c.length; _b++) {
        var index = _c[_b];
        var input = {};
        for (var _d = 0, _e = inputKeyVals[index]; _d < _e.length; _d++) {
            var keyVal = _e[_d];
            convert.inputs.checkPubkey(keyVal);
            switch (keyVal.key[0]) {
                case typeFields_1.InputTypes.NON_WITNESS_UTXO:
                    checkKeyBuffer('input', keyVal.key, typeFields_1.InputTypes.NON_WITNESS_UTXO);
                    if (input.nonWitnessUtxo !== undefined) {
                        throw new Error('Format Error: Input has multiple NON_WITNESS_UTXO');
                    }
                    input.nonWitnessUtxo = convert.inputs.nonWitnessUtxo.decode(keyVal);
                    break;
                case typeFields_1.InputTypes.WITNESS_UTXO:
                    checkKeyBuffer('input', keyVal.key, typeFields_1.InputTypes.WITNESS_UTXO);
                    if (input.witnessUtxo !== undefined) {
                        throw new Error('Format Error: Input has multiple WITNESS_UTXO');
                    }
                    input.witnessUtxo = convert.inputs.witnessUtxo.decode(keyVal);
                    break;
                case typeFields_1.InputTypes.PARTIAL_SIG:
                    if (input.partialSig === undefined) {
                        input.partialSig = [];
                    }
                    input.partialSig.push(convert.inputs.partialSig.decode(keyVal));
                    break;
                case typeFields_1.InputTypes.SIGHASH_TYPE:
                    checkKeyBuffer('input', keyVal.key, typeFields_1.InputTypes.SIGHASH_TYPE);
                    if (input.sighashType !== undefined) {
                        throw new Error('Format Error: Input has multiple SIGHASH_TYPE');
                    }
                    input.sighashType = convert.inputs.sighashType.decode(keyVal);
                    break;
                case typeFields_1.InputTypes.REDEEM_SCRIPT:
                    checkKeyBuffer('input', keyVal.key, typeFields_1.InputTypes.REDEEM_SCRIPT);
                    if (input.redeemScript !== undefined) {
                        throw new Error('Format Error: Input has multiple REDEEM_SCRIPT');
                    }
                    input.redeemScript = convert.inputs.redeemScript.decode(keyVal);
                    break;
                case typeFields_1.InputTypes.WITNESS_SCRIPT:
                    checkKeyBuffer('input', keyVal.key, typeFields_1.InputTypes.WITNESS_SCRIPT);
                    if (input.witnessScript !== undefined) {
                        throw new Error('Format Error: Input has multiple WITNESS_SCRIPT');
                    }
                    input.witnessScript = convert.inputs.witnessScript.decode(keyVal);
                    break;
                case typeFields_1.InputTypes.BIP32_DERIVATION:
                    if (input.bip32Derivation === undefined) {
                        input.bip32Derivation = [];
                    }
                    input.bip32Derivation.push(convert.inputs.bip32Derivation.decode(keyVal));
                    break;
                case typeFields_1.InputTypes.FINAL_SCRIPTSIG:
                    checkKeyBuffer('input', keyVal.key, typeFields_1.InputTypes.FINAL_SCRIPTSIG);
                    input.finalScriptSig = convert.inputs.finalScriptSig.decode(keyVal);
                    break;
                case typeFields_1.InputTypes.FINAL_SCRIPTWITNESS:
                    checkKeyBuffer('input', keyVal.key, typeFields_1.InputTypes.FINAL_SCRIPTWITNESS);
                    input.finalScriptWitness = convert.inputs.finalScriptWitness.decode(keyVal);
                    break;
                case typeFields_1.InputTypes.POR_COMMITMENT:
                    checkKeyBuffer('input', keyVal.key, typeFields_1.InputTypes.POR_COMMITMENT);
                    input.porCommitment = convert.inputs.porCommitment.decode(keyVal);
                    break;
                case typeFields_1.InputTypes.TAP_KEY_SIG:
                    checkKeyBuffer('input', keyVal.key, typeFields_1.InputTypes.TAP_KEY_SIG);
                    input.tapKeySig = convert.inputs.tapKeySig.decode(keyVal);
                    break;
                case typeFields_1.InputTypes.TAP_SCRIPT_SIG:
                    if (input.tapScriptSig === undefined) {
                        input.tapScriptSig = [];
                    }
                    input.tapScriptSig.push(convert.inputs.tapScriptSig.decode(keyVal));
                    break;
                case typeFields_1.InputTypes.TAP_LEAF_SCRIPT:
                    if (input.tapLeafScript === undefined) {
                        input.tapLeafScript = [];
                    }
                    input.tapLeafScript.push(convert.inputs.tapLeafScript.decode(keyVal));
                    break;
                case typeFields_1.InputTypes.TAP_BIP32_DERIVATION:
                    if (input.tapBip32Derivation === undefined) {
                        input.tapBip32Derivation = [];
                    }
                    input.tapBip32Derivation.push(convert.inputs.tapBip32Derivation.decode(keyVal));
                    break;
                case typeFields_1.InputTypes.TAP_INTERNAL_KEY:
                    checkKeyBuffer('input', keyVal.key, typeFields_1.InputTypes.TAP_INTERNAL_KEY);
                    input.tapInternalKey = convert.inputs.tapInternalKey.decode(keyVal);
                    break;
                case typeFields_1.InputTypes.TAP_MERKLE_ROOT:
                    checkKeyBuffer('input', keyVal.key, typeFields_1.InputTypes.TAP_MERKLE_ROOT);
                    input.tapMerkleRoot = convert.inputs.tapMerkleRoot.decode(keyVal);
                    break;
                default:
                    // This will allow inclusion during serialization.
                    if (!input.unknownKeyVals)
                        input.unknownKeyVals = [];
                    input.unknownKeyVals.push(keyVal);
            }
        }
        inputs.push(input);
    }
    for (var _f = 0, _g = (0, tools_1.range)(outputCount); _f < _g.length; _f++) {
        var index = _g[_f];
        var output = {};
        for (var _h = 0, _j = outputKeyVals[index]; _h < _j.length; _h++) {
            var keyVal = _j[_h];
            convert.outputs.checkPubkey(keyVal);
            switch (keyVal.key[0]) {
                case typeFields_1.OutputTypes.REDEEM_SCRIPT:
                    checkKeyBuffer('output', keyVal.key, typeFields_1.OutputTypes.REDEEM_SCRIPT);
                    if (output.redeemScript !== undefined) {
                        throw new Error('Format Error: Output has multiple REDEEM_SCRIPT');
                    }
                    output.redeemScript = convert.outputs.redeemScript.decode(keyVal);
                    break;
                case typeFields_1.OutputTypes.WITNESS_SCRIPT:
                    checkKeyBuffer('output', keyVal.key, typeFields_1.OutputTypes.WITNESS_SCRIPT);
                    if (output.witnessScript !== undefined) {
                        throw new Error('Format Error: Output has multiple WITNESS_SCRIPT');
                    }
                    output.witnessScript = convert.outputs.witnessScript.decode(keyVal);
                    break;
                case typeFields_1.OutputTypes.BIP32_DERIVATION:
                    if (output.bip32Derivation === undefined) {
                        output.bip32Derivation = [];
                    }
                    output.bip32Derivation.push(convert.outputs.bip32Derivation.decode(keyVal));
                    break;
                case typeFields_1.OutputTypes.TAP_INTERNAL_KEY:
                    checkKeyBuffer('output', keyVal.key, typeFields_1.OutputTypes.TAP_INTERNAL_KEY);
                    output.tapInternalKey = convert.outputs.tapInternalKey.decode(keyVal);
                    break;
                case typeFields_1.OutputTypes.TAP_TREE:
                    checkKeyBuffer('output', keyVal.key, typeFields_1.OutputTypes.TAP_TREE);
                    output.tapTree = convert.outputs.tapTree.decode(keyVal);
                    break;
                case typeFields_1.OutputTypes.TAP_BIP32_DERIVATION:
                    if (output.tapBip32Derivation === undefined) {
                        output.tapBip32Derivation = [];
                    }
                    output.tapBip32Derivation.push(convert.outputs.tapBip32Derivation.decode(keyVal));
                    break;
                default:
                    if (!output.unknownKeyVals)
                        output.unknownKeyVals = [];
                    output.unknownKeyVals.push(keyVal);
            }
        }
        outputs.push(output);
    }
    return { globalMap: globalMap, inputs: inputs, outputs: outputs };
}
exports.psbtFromKeyVals = psbtFromKeyVals;
