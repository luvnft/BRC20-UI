"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combine = void 0;
var parser_1 = require("../parser");
function combine(psbts) {
    var self = psbts[0];
    var selfKeyVals = (0, parser_1.psbtToKeyVals)(self);
    var others = psbts.slice(1);
    if (others.length === 0)
        throw new Error('Combine: Nothing to combine');
    var selfTx = getTx(self);
    if (selfTx === undefined) {
        throw new Error('Combine: Self missing transaction');
    }
    var selfGlobalSet = getKeySet(selfKeyVals.globalKeyVals);
    var selfInputSets = selfKeyVals.inputKeyVals.map(getKeySet);
    var selfOutputSets = selfKeyVals.outputKeyVals.map(getKeySet);
    var _loop_1 = function (other) {
        var otherTx = getTx(other);
        if (otherTx === undefined ||
            !otherTx.toBuffer().equals(selfTx.toBuffer())) {
            throw new Error('Combine: One of the Psbts does not have the same transaction.');
        }
        var otherKeyVals = (0, parser_1.psbtToKeyVals)(other);
        var otherGlobalSet = getKeySet(otherKeyVals.globalKeyVals);
        otherGlobalSet.forEach(keyPusher(selfGlobalSet, selfKeyVals.globalKeyVals, otherKeyVals.globalKeyVals));
        var otherInputSets = otherKeyVals.inputKeyVals.map(getKeySet);
        otherInputSets.forEach(function (inputSet, idx) {
            return inputSet.forEach(keyPusher(selfInputSets[idx], selfKeyVals.inputKeyVals[idx], otherKeyVals.inputKeyVals[idx]));
        });
        var otherOutputSets = otherKeyVals.outputKeyVals.map(getKeySet);
        otherOutputSets.forEach(function (outputSet, idx) {
            return outputSet.forEach(keyPusher(selfOutputSets[idx], selfKeyVals.outputKeyVals[idx], otherKeyVals.outputKeyVals[idx]));
        });
    };
    for (var _i = 0, others_1 = others; _i < others_1.length; _i++) {
        var other = others_1[_i];
        _loop_1(other);
    }
    return (0, parser_1.psbtFromKeyVals)(selfTx, {
        globalMapKeyVals: selfKeyVals.globalKeyVals,
        inputKeyVals: selfKeyVals.inputKeyVals,
        outputKeyVals: selfKeyVals.outputKeyVals,
    });
}
exports.combine = combine;
function keyPusher(selfSet, selfKeyVals, otherKeyVals) {
    return function (key) {
        if (selfSet.has(key))
            return;
        var newKv = otherKeyVals.filter(function (kv) { return kv.key.toString('hex') === key; })[0];
        selfKeyVals.push(newKv);
        selfSet.add(key);
    };
}
function getTx(psbt) {
    return psbt.globalMap.unsignedTx;
}
function getKeySet(keyVals) {
    var set = new Set();
    keyVals.forEach(function (keyVal) {
        var hex = keyVal.key.toString('hex');
        if (set.has(hex))
            throw new Error('Combine: KeyValue Map keys should be unique');
        set.add(hex);
    });
    return set;
}
