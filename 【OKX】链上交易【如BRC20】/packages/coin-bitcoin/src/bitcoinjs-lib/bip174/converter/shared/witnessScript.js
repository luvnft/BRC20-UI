"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeConverter = void 0;
function makeConverter(TYPE_BYTE) {
    function decode(keyVal) {
        if (keyVal.key[0] !== TYPE_BYTE) {
            throw new Error('Decode Error: could not decode witnessScript with key 0x' +
                keyVal.key.toString('hex'));
        }
        return keyVal.value;
    }
    function encode(data) {
        var key = Buffer.from([TYPE_BYTE]);
        return {
            key: key,
            value: data,
        };
    }
    var expected = 'Buffer';
    function check(data) {
        return Buffer.isBuffer(data);
    }
    function canAdd(currentData, newData) {
        return (!!currentData && !!newData && currentData.witnessScript === undefined);
    }
    return {
        decode: decode,
        encode: encode,
        check: check,
        expected: expected,
        canAdd: canAdd,
    };
}
exports.makeConverter = makeConverter;
