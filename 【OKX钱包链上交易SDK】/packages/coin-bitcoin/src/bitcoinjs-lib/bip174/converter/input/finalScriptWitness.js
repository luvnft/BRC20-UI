"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canAdd = exports.check = exports.expected = exports.encode = exports.decode = void 0;
var typeFields_1 = require("../../typeFields");
function decode(keyVal) {
    if (keyVal.key[0] !== typeFields_1.InputTypes.FINAL_SCRIPTWITNESS) {
        throw new Error('Decode Error: could not decode finalScriptWitness with key 0x' +
            keyVal.key.toString('hex'));
    }
    return keyVal.value;
}
exports.decode = decode;
function encode(data) {
    var key = Buffer.from([typeFields_1.InputTypes.FINAL_SCRIPTWITNESS]);
    return {
        key: key,
        value: data,
    };
}
exports.encode = encode;
exports.expected = 'Buffer';
function check(data) {
    return Buffer.isBuffer(data);
}
exports.check = check;
function canAdd(currentData, newData) {
    return (!!currentData && !!newData && currentData.finalScriptWitness === undefined);
}
exports.canAdd = canAdd;
