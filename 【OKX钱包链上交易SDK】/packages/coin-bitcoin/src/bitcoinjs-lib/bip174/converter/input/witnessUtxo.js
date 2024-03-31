"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canAdd = exports.check = exports.expected = exports.encode = exports.decode = void 0;
var typeFields_1 = require("../../typeFields");
var tools_1 = require("../tools");
var varuint = require("../varint");
function decode(keyVal) {
    if (keyVal.key[0] !== typeFields_1.InputTypes.WITNESS_UTXO) {
        throw new Error('Decode Error: could not decode witnessUtxo with key 0x' +
            keyVal.key.toString('hex'));
    }
    var value = (0, tools_1.readUInt64LE)(keyVal.value, 0);
    var _offset = 8;
    var scriptLen = varuint.decode(keyVal.value, _offset);
    _offset += varuint.encodingLength(scriptLen);
    var script = keyVal.value.slice(_offset);
    if (script.length !== scriptLen) {
        throw new Error('Decode Error: WITNESS_UTXO script is not proper length');
    }
    return {
        script: script,
        value: value,
    };
}
exports.decode = decode;
function encode(data) {
    var script = data.script, value = data.value;
    var varintLen = varuint.encodingLength(script.length);
    var result = Buffer.allocUnsafe(8 + varintLen + script.length);
    (0, tools_1.writeUInt64LE)(result, value, 0);
    varuint.encode(script.length, result, 8);
    script.copy(result, 8 + varintLen);
    return {
        key: Buffer.from([typeFields_1.InputTypes.WITNESS_UTXO]),
        value: result,
    };
}
exports.encode = encode;
exports.expected = '{ script: Buffer; value: number; }';
function check(data) {
    return Buffer.isBuffer(data.script) && typeof data.value === 'number';
}
exports.check = check;
function canAdd(currentData, newData) {
    return !!currentData && !!newData && currentData.witnessUtxo === undefined;
}
exports.canAdd = canAdd;
