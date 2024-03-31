"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.psbtToKeyVals = exports.psbtToBuffer = void 0;
/**
 * The following methods are based on `bitcoinjs`, thanks for their work
 * https://github.com/bitcoinjs/bitcoinjs-lib
 */
var convert = require("../converter");
var tools_1 = require("../converter/tools");
function psbtToBuffer(_a) {
    var globalMap = _a.globalMap, inputs = _a.inputs, outputs = _a.outputs;
    var _b = psbtToKeyVals({
        globalMap: globalMap,
        inputs: inputs,
        outputs: outputs,
    }), globalKeyVals = _b.globalKeyVals, inputKeyVals = _b.inputKeyVals, outputKeyVals = _b.outputKeyVals;
    var globalBuffer = (0, tools_1.keyValsToBuffer)(globalKeyVals);
    var keyValsOrEmptyToBuffer = function (keyVals) {
        return keyVals.length === 0 ? [Buffer.from([0])] : keyVals.map(tools_1.keyValsToBuffer);
    };
    var inputBuffers = keyValsOrEmptyToBuffer(inputKeyVals);
    var outputBuffers = keyValsOrEmptyToBuffer(outputKeyVals);
    var header = Buffer.allocUnsafe(5);
    header.writeUIntBE(0x70736274ff, 0, 5);
    return Buffer.concat([header, globalBuffer].concat(inputBuffers, outputBuffers));
}
exports.psbtToBuffer = psbtToBuffer;
var sortKeyVals = function (a, b) {
    return a.key.compare(b.key);
};
function keyValsFromMap(keyValMap, converterFactory) {
    var keyHexSet = new Set();
    var keyVals = Object.entries(keyValMap).reduce(function (result, _a) {
        var key = _a[0], value = _a[1];
        if (key === 'unknownKeyVals')
            return result;
        // We are checking for undefined anyways. So ignore TS error
        // @ts-ignore
        var converter = converterFactory[key];
        if (converter === undefined)
            return result;
        var encodedKeyVals = (Array.isArray(value) ? value : [value]).map(converter.encode);
        var keyHexes = encodedKeyVals.map(function (kv) { return kv.key.toString('hex'); });
        keyHexes.forEach(function (hex) {
            if (keyHexSet.has(hex))
                throw new Error('Serialize Error: Duplicate key: ' + hex);
            keyHexSet.add(hex);
        });
        return result.concat(encodedKeyVals);
    }, []);
    // Get other keyVals that have not yet been gotten
    var otherKeyVals = keyValMap.unknownKeyVals
        ? keyValMap.unknownKeyVals.filter(function (keyVal) {
            return !keyHexSet.has(keyVal.key.toString('hex'));
        })
        : [];
    return keyVals.concat(otherKeyVals).sort(sortKeyVals);
}
function psbtToKeyVals(_a) {
    var globalMap = _a.globalMap, inputs = _a.inputs, outputs = _a.outputs;
    // First parse the global keyVals
    // Get any extra keyvals to pass along
    return {
        globalKeyVals: keyValsFromMap(globalMap, convert.globals),
        inputKeyVals: inputs.map(function (i) { return keyValsFromMap(i, convert.inputs); }),
        outputKeyVals: outputs.map(function (o) { return keyValsFromMap(o, convert.outputs); }),
    };
}
exports.psbtToKeyVals = psbtToKeyVals;
