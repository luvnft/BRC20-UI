"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLocktimeSetter = exports.defaultVersionSetter = exports.addOutputAttributes = exports.addInputAttributes = exports.updateOutput = exports.updateInput = exports.updateGlobal = exports.inputCheckUncleanFinalized = exports.getEnumLength = exports.checkHasKey = exports.checkForOutput = exports.checkForInput = void 0;
/**
 * The following methods are based on `bitcoinjs`, thanks for their work
 * https://github.com/bitcoinjs/bitcoinjs-lib
 */
var converter = require("./converter");
function checkForInput(inputs, inputIndex) {
    var input = inputs[inputIndex];
    if (input === undefined)
        throw new Error("No input #".concat(inputIndex));
    return input;
}
exports.checkForInput = checkForInput;
function checkForOutput(outputs, outputIndex) {
    var output = outputs[outputIndex];
    if (output === undefined)
        throw new Error("No output #".concat(outputIndex));
    return output;
}
exports.checkForOutput = checkForOutput;
function checkHasKey(checkKeyVal, keyVals, enumLength) {
    if (checkKeyVal.key[0] < enumLength) {
        throw new Error("Use the method for your specific key instead of addUnknownKeyVal*");
    }
    if (keyVals &&
        keyVals.filter(function (kv) { return kv.key.equals(checkKeyVal.key); }).length !== 0) {
        throw new Error("Duplicate Key: ".concat(checkKeyVal.key.toString('hex')));
    }
}
exports.checkHasKey = checkHasKey;
function getEnumLength(myenum) {
    var count = 0;
    Object.keys(myenum).forEach(function (val) {
        if (Number(isNaN(Number(val)))) {
            count++;
        }
    });
    return count;
}
exports.getEnumLength = getEnumLength;
function inputCheckUncleanFinalized(inputIndex, input) {
    var result = false;
    if (input.nonWitnessUtxo || input.witnessUtxo) {
        var needScriptSig = !!input.redeemScript;
        var needWitnessScript = !!input.witnessScript;
        var scriptSigOK = !needScriptSig || !!input.finalScriptSig;
        var witnessScriptOK = !needWitnessScript || !!input.finalScriptWitness;
        var hasOneFinal = !!input.finalScriptSig || !!input.finalScriptWitness;
        result = scriptSigOK && witnessScriptOK && hasOneFinal;
    }
    if (result === false) {
        throw new Error("Input #".concat(inputIndex, " has too much or too little data to clean"));
    }
}
exports.inputCheckUncleanFinalized = inputCheckUncleanFinalized;
function throwForUpdateMaker(typeName, name, expected, data) {
    throw new Error("Data for ".concat(typeName, " key ").concat(name, " is incorrect: Expected ") +
        "".concat(expected, " and got ").concat(JSON.stringify(data)));
}
function updateMaker(typeName) {
    return function (updateData, mainData) {
        var _loop_1 = function (name_1) {
            // @ts-ignore
            var data = updateData[name_1];
            // @ts-ignore
            var _b = 
            // @ts-ignore
            converter[typeName + 's'][name_1] || {}, canAdd = _b.canAdd, canAddToArray = _b.canAddToArray, check = _b.check, expected = _b.expected;
            var isArray = !!canAddToArray;
            // If unknown data. ignore and do not add
            if (check) {
                if (isArray) {
                    if (!Array.isArray(data) ||
                        // @ts-ignore
                        (mainData[name_1] && !Array.isArray(mainData[name_1]))) {
                        throw new Error("Key type ".concat(name_1, " must be an array"));
                    }
                    if (!data.every(check)) {
                        throwForUpdateMaker(typeName, name_1, expected, data);
                    }
                    // @ts-ignore
                    var arr_1 = mainData[name_1] || [];
                    var dupeCheckSet_1 = new Set();
                    if (!data.every(function (v) { return canAddToArray(arr_1, v, dupeCheckSet_1); })) {
                        throw new Error('Can not add duplicate data to array');
                    }
                    // @ts-ignore
                    mainData[name_1] = arr_1.concat(data);
                }
                else {
                    if (!check(data)) {
                        throwForUpdateMaker(typeName, name_1, expected, data);
                    }
                    if (!canAdd(mainData, data)) {
                        throw new Error("Can not add duplicate data to ".concat(typeName));
                    }
                    // @ts-ignore
                    mainData[name_1] = data;
                }
            }
        };
        // @ts-ignore
        for (var _i = 0, _a = Object.keys(updateData); _i < _a.length; _i++) {
            var name_1 = _a[_i];
            _loop_1(name_1);
        }
    };
}
exports.updateGlobal = updateMaker('global');
exports.updateInput = updateMaker('input');
exports.updateOutput = updateMaker('output');
function addInputAttributes(inputs, data) {
    var index = inputs.length - 1;
    var input = checkForInput(inputs, index);
    (0, exports.updateInput)(data, input);
}
exports.addInputAttributes = addInputAttributes;
function addOutputAttributes(outputs, data) {
    var index = outputs.length - 1;
    var output = checkForOutput(outputs, index);
    (0, exports.updateOutput)(data, output);
}
exports.addOutputAttributes = addOutputAttributes;
function defaultVersionSetter(version, txBuf) {
    if (!Buffer.isBuffer(txBuf) || txBuf.length < 4) {
        throw new Error('Set Version: Invalid Transaction');
    }
    txBuf.writeUInt32LE(version, 0);
    return txBuf;
}
exports.defaultVersionSetter = defaultVersionSetter;
function defaultLocktimeSetter(locktime, txBuf) {
    if (!Buffer.isBuffer(txBuf) || txBuf.length < 4) {
        throw new Error('Set Locktime: Invalid Transaction');
    }
    txBuf.writeUInt32LE(locktime, txBuf.length - 4);
    return txBuf;
}
exports.defaultLocktimeSetter = defaultLocktimeSetter;
