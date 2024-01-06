"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canAdd = exports.check = exports.expected = exports.encode = exports.decode = void 0;
var typeFields_1 = require("../../typeFields");
var varuint = require("../varint");
function decode(keyVal) {
    if (keyVal.key[0] !== typeFields_1.OutputTypes.TAP_TREE || keyVal.key.length !== 1) {
        throw new Error('Decode Error: could not decode tapTree with key 0x' +
            keyVal.key.toString('hex'));
    }
    var _offset = 0;
    var data = [];
    while (_offset < keyVal.value.length) {
        var depth = keyVal.value[_offset++];
        var leafVersion = keyVal.value[_offset++];
        var scriptLen = varuint.decode(keyVal.value, _offset);
        _offset += varuint.encodingLength(scriptLen);
        data.push({
            depth: depth,
            leafVersion: leafVersion,
            script: keyVal.value.slice(_offset, _offset + scriptLen),
        });
        _offset += scriptLen;
    }
    return { leaves: data };
}
exports.decode = decode;
function encode(tree) {
    var _a;
    var key = Buffer.from([typeFields_1.OutputTypes.TAP_TREE]);
    var bufs = (_a = []).concat.apply(_a, tree.leaves.map(function (tapLeaf) { return [
        Buffer.of(tapLeaf.depth, tapLeaf.leafVersion),
        varuint.encode(tapLeaf.script.length),
        tapLeaf.script,
    ]; }));
    return {
        key: key,
        value: Buffer.concat(bufs),
    };
}
exports.encode = encode;
exports.expected = '{ leaves: [{ depth: number; leafVersion: number, script: Buffer; }] }';
function check(data) {
    return (Array.isArray(data.leaves) &&
        data.leaves.every(function (tapLeaf) {
            return tapLeaf.depth >= 0 &&
                tapLeaf.depth <= 128 &&
                (tapLeaf.leafVersion & 0xfe) === tapLeaf.leafVersion &&
                Buffer.isBuffer(tapLeaf.script);
        }));
}
exports.check = check;
function canAdd(currentData, newData) {
    return !!currentData && !!newData && currentData.tapTree === undefined;
}
exports.canAdd = canAdd;
