"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Psbt = void 0;
/**
 * The following methods are based on `bitcoinjs`, thanks for their work
 * https://github.com/bitcoinjs/bitcoinjs-lib
 */
var combiner_1 = require("./combiner");
var parser_1 = require("./parser");
var typeFields_1 = require("./typeFields");
var utils_1 = require("./utils");
var Psbt = /** @class */ (function () {
    function Psbt(tx) {
        this.inputs = [];
        this.outputs = [];
        this.globalMap = {
            unsignedTx: tx,
        };
    }
    Psbt.fromBase64 = function (data, txFromBuffer) {
        var buffer = Buffer.from(data, 'base64');
        return this.fromBuffer(buffer, txFromBuffer);
    };
    Psbt.fromHex = function (data, txFromBuffer) {
        var buffer = Buffer.from(data, 'hex');
        return this.fromBuffer(buffer, txFromBuffer);
    };
    Psbt.fromBuffer = function (buffer, txFromBuffer) {
        var results = (0, parser_1.psbtFromBuffer)(buffer, txFromBuffer);
        var psbt = new this(results.globalMap.unsignedTx);
        Object.assign(psbt, results);
        return psbt;
    };
    Psbt.prototype.toBase64 = function () {
        var buffer = this.toBuffer();
        return buffer.toString('base64');
    };
    Psbt.prototype.toHex = function () {
        var buffer = this.toBuffer();
        return buffer.toString('hex');
    };
    Psbt.prototype.toBuffer = function () {
        return (0, parser_1.psbtToBuffer)(this);
    };
    Psbt.prototype.updateGlobal = function (updateData) {
        (0, utils_1.updateGlobal)(updateData, this.globalMap);
        return this;
    };
    Psbt.prototype.updateInput = function (inputIndex, updateData) {
        var input = (0, utils_1.checkForInput)(this.inputs, inputIndex);
        (0, utils_1.updateInput)(updateData, input);
        return this;
    };
    Psbt.prototype.updateOutput = function (outputIndex, updateData) {
        var output = (0, utils_1.checkForOutput)(this.outputs, outputIndex);
        (0, utils_1.updateOutput)(updateData, output);
        return this;
    };
    Psbt.prototype.addUnknownKeyValToGlobal = function (keyVal) {
        (0, utils_1.checkHasKey)(keyVal, this.globalMap.unknownKeyVals, (0, utils_1.getEnumLength)(typeFields_1.GlobalTypes));
        if (!this.globalMap.unknownKeyVals)
            this.globalMap.unknownKeyVals = [];
        this.globalMap.unknownKeyVals.push(keyVal);
        return this;
    };
    Psbt.prototype.addUnknownKeyValToInput = function (inputIndex, keyVal) {
        var input = (0, utils_1.checkForInput)(this.inputs, inputIndex);
        (0, utils_1.checkHasKey)(keyVal, input.unknownKeyVals, (0, utils_1.getEnumLength)(typeFields_1.InputTypes));
        if (!input.unknownKeyVals)
            input.unknownKeyVals = [];
        input.unknownKeyVals.push(keyVal);
        return this;
    };
    Psbt.prototype.addUnknownKeyValToOutput = function (outputIndex, keyVal) {
        var output = (0, utils_1.checkForOutput)(this.outputs, outputIndex);
        (0, utils_1.checkHasKey)(keyVal, output.unknownKeyVals, (0, utils_1.getEnumLength)(typeFields_1.OutputTypes));
        if (!output.unknownKeyVals)
            output.unknownKeyVals = [];
        output.unknownKeyVals.push(keyVal);
        return this;
    };
    Psbt.prototype.addInput = function (inputData) {
        var _this = this;
        this.globalMap.unsignedTx.addInput(inputData);
        this.inputs.push({
            unknownKeyVals: [],
        });
        var addKeyVals = inputData.unknownKeyVals || [];
        var inputIndex = this.inputs.length - 1;
        if (!Array.isArray(addKeyVals)) {
            throw new Error('unknownKeyVals must be an Array');
        }
        addKeyVals.forEach(function (keyVal) {
            return _this.addUnknownKeyValToInput(inputIndex, keyVal);
        });
        (0, utils_1.addInputAttributes)(this.inputs, inputData);
        return this;
    };
    Psbt.prototype.addOutput = function (outputData) {
        var _this = this;
        this.globalMap.unsignedTx.addOutput(outputData);
        this.outputs.push({
            unknownKeyVals: [],
        });
        var addKeyVals = outputData.unknownKeyVals || [];
        var outputIndex = this.outputs.length - 1;
        if (!Array.isArray(addKeyVals)) {
            throw new Error('unknownKeyVals must be an Array');
        }
        addKeyVals.forEach(function (keyVal) {
            return _this.addUnknownKeyValToInput(outputIndex, keyVal);
        });
        (0, utils_1.addOutputAttributes)(this.outputs, outputData);
        return this;
    };
    Psbt.prototype.clearFinalizedInput = function (inputIndex) {
        var input = (0, utils_1.checkForInput)(this.inputs, inputIndex);
        (0, utils_1.inputCheckUncleanFinalized)(inputIndex, input);
        for (var _i = 0, _a = Object.keys(input); _i < _a.length; _i++) {
            var key = _a[_i];
            if (![
                'witnessUtxo',
                'nonWitnessUtxo',
                'finalScriptSig',
                'finalScriptWitness',
                'unknownKeyVals',
            ].includes(key)) {
                // @ts-ignore
                delete input[key];
            }
        }
        return this;
    };
    Psbt.prototype.combine = function () {
        var those = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            those[_i] = arguments[_i];
        }
        // Combine this with those.
        // Return self for chaining.
        var result = (0, combiner_1.combine)([this].concat(those));
        Object.assign(this, result);
        return this;
    };
    Psbt.prototype.getTransaction = function () {
        return this.globalMap.unsignedTx.toBuffer();
    };
    return Psbt;
}());
exports.Psbt = Psbt;
