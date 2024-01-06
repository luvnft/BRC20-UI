"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = exports.vectorSize = exports.varSliceSize = void 0;
/**
 * The following methods are based on `bitcoinjs`, thanks for their work
 * https://github.com/bitcoinjs/bitcoinjs-lib
 */
var bufferutils_1 = require("./bufferutils");
var bcrypto = require("./crypto");
var bscript = require("./script");
var script_1 = require("./script");
var types = require("./types");
var typeforce = types.typeforce;
function varSliceSize(someScript) {
    var length = someScript.length;
    return bufferutils_1.varuint.encodingLength(length) + length;
}
exports.varSliceSize = varSliceSize;
function vectorSize(someVector) {
    var length = someVector.length;
    return (bufferutils_1.varuint.encodingLength(length) +
        someVector.reduce(function (sum, witness) {
            return sum + varSliceSize(witness);
        }, 0));
}
exports.vectorSize = vectorSize;
var EMPTY_BUFFER = Buffer.allocUnsafe(0);
var EMPTY_WITNESS = [];
var ZERO = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
var ONE = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');
var VALUE_UINT64_MAX = Buffer.from('ffffffffffffffff', 'hex');
var BLANK_OUTPUT = {
    script: EMPTY_BUFFER,
    valueBuffer: VALUE_UINT64_MAX,
};
function isOutput(out) {
    return out.value !== undefined;
}
var Transaction = /** @class */ (function () {
    function Transaction() {
        this.version = 1;
        this.locktime = 0;
        this.ins = [];
        this.outs = [];
    }
    Transaction.fromBuffer = function (buffer, _NO_STRICT) {
        var bufferReader = new bufferutils_1.BufferReader(buffer);
        var tx = new Transaction();
        tx.version = bufferReader.readInt32();
        var marker = bufferReader.readUInt8();
        var flag = bufferReader.readUInt8();
        var hasWitnesses = false;
        if (marker === Transaction.ADVANCED_TRANSACTION_MARKER &&
            flag === Transaction.ADVANCED_TRANSACTION_FLAG) {
            hasWitnesses = true;
        }
        else {
            bufferReader.offset -= 2;
        }
        var vinLen = bufferReader.readVarInt();
        for (var i = 0; i < vinLen; ++i) {
            tx.ins.push({
                hash: bufferReader.readSlice(32),
                index: bufferReader.readUInt32(),
                script: bufferReader.readVarSlice(),
                sequence: bufferReader.readUInt32(),
                witness: EMPTY_WITNESS,
            });
        }
        var voutLen = bufferReader.readVarInt();
        for (var i = 0; i < voutLen; ++i) {
            tx.outs.push({
                value: bufferReader.readUInt64(),
                script: bufferReader.readVarSlice(),
            });
        }
        if (hasWitnesses) {
            for (var i = 0; i < vinLen; ++i) {
                tx.ins[i].witness = bufferReader.readVector();
            }
            // was this pointless?
            if (!tx.hasWitnesses())
                throw new Error('Transaction has superfluous witness data');
        }
        tx.locktime = bufferReader.readUInt32();
        if (_NO_STRICT)
            return tx;
        if (bufferReader.offset !== buffer.length)
            throw new Error('Transaction has unexpected data');
        return tx;
    };
    Transaction.fromHex = function (hex) {
        return Transaction.fromBuffer(Buffer.from(hex, 'hex'), false);
    };
    Transaction.isCoinbaseHash = function (buffer) {
        typeforce(types.Hash256bit, buffer);
        for (var i = 0; i < 32; ++i) {
            if (buffer[i] !== 0)
                return false;
        }
        return true;
    };
    Transaction.prototype.isCoinbase = function () {
        return (this.ins.length === 1 && Transaction.isCoinbaseHash(this.ins[0].hash));
    };
    Transaction.prototype.addInput = function (hash, index, sequence, scriptSig) {
        typeforce(types.tuple(types.Hash256bit, types.UInt32, types.maybe(types.UInt32), types.maybe(types.Buffer)), arguments);
        if (types.Null(sequence)) {
            sequence = Transaction.DEFAULT_SEQUENCE;
        }
        // Add the input and return the input's index
        return (this.ins.push({
            hash: hash,
            index: index,
            script: scriptSig || EMPTY_BUFFER,
            sequence: sequence,
            witness: EMPTY_WITNESS,
        }) - 1);
    };
    Transaction.prototype.addOutput = function (scriptPubKey, value) {
        typeforce(types.tuple(types.Buffer, types.Satoshi), arguments);
        // Add the output and return the output's index
        return (this.outs.push({
            script: scriptPubKey,
            value: value,
        }) - 1);
    };
    Transaction.prototype.hasWitnesses = function () {
        return this.ins.some(function (x) {
            return x.witness.length !== 0;
        });
    };
    Transaction.prototype.weight = function () {
        var base = this.byteLength(false);
        var total = this.byteLength(true);
        return base * 3 + total;
    };
    Transaction.prototype.virtualSize = function () {
        return Math.ceil(this.weight() / 4);
    };
    Transaction.prototype.byteLength = function (_ALLOW_WITNESS) {
        if (_ALLOW_WITNESS === void 0) { _ALLOW_WITNESS = true; }
        var hasWitnesses = _ALLOW_WITNESS && this.hasWitnesses();
        return ((hasWitnesses ? 10 : 8) +
            bufferutils_1.varuint.encodingLength(this.ins.length) +
            bufferutils_1.varuint.encodingLength(this.outs.length) +
            this.ins.reduce(function (sum, input) {
                return sum + 40 + varSliceSize(input.script);
            }, 0) +
            this.outs.reduce(function (sum, output) {
                return sum + 8 + varSliceSize(output.script);
            }, 0) +
            (hasWitnesses
                ? this.ins.reduce(function (sum, input) {
                    return sum + vectorSize(input.witness);
                }, 0)
                : 0));
    };
    Transaction.prototype.clone = function () {
        var newTx = new Transaction();
        newTx.version = this.version;
        newTx.locktime = this.locktime;
        newTx.ins = this.ins.map(function (txIn) {
            return {
                hash: txIn.hash,
                index: txIn.index,
                script: txIn.script,
                sequence: txIn.sequence,
                witness: txIn.witness,
            };
        });
        newTx.outs = this.outs.map(function (txOut) {
            return {
                script: txOut.script,
                value: txOut.value,
            };
        });
        return newTx;
    };
    /**
     * Hash transaction for signing a specific input.
     *
     * Bitcoin uses a different hash for each signed transaction input.
     * This method copies the transaction, makes the necessary changes based on the
     * hashType, and then hashes the result.
     * This hash can then be used to sign the provided transaction input.
     */
    Transaction.prototype.hashForSignature = function (inIndex, prevOutScript, hashType) {
        typeforce(types.tuple(types.UInt32, types.Buffer, /* types.UInt8 */ types.Number), arguments);
        // https://github.com/bitcoin/bitcoin/blob/master/src/test/sighash_tests.cpp#L29
        if (inIndex >= this.ins.length)
            return ONE;
        // ignore OP_CODESEPARATOR
        var ourScript = bscript.compile(bscript.decompile(prevOutScript).filter(function (x) {
            return x !== script_1.OPS.OP_CODESEPARATOR;
        }));
        var txTmp = this.clone();
        // SIGHASH_NONE: ignore all outputs? (wildcard payee)
        if ((hashType & 0x1f) === Transaction.SIGHASH_NONE) {
            txTmp.outs = [];
            // ignore sequence numbers (except at inIndex)
            txTmp.ins.forEach(function (input, i) {
                if (i === inIndex)
                    return;
                input.sequence = 0;
            });
            // SIGHASH_SINGLE: ignore all outputs, except at the same index?
        }
        else if ((hashType & 0x1f) === Transaction.SIGHASH_SINGLE) {
            // https://github.com/bitcoin/bitcoin/blob/master/src/test/sighash_tests.cpp#L60
            if (inIndex >= this.outs.length)
                return ONE;
            // truncate outputs after
            txTmp.outs.length = inIndex + 1;
            // "blank" outputs before
            for (var i = 0; i < inIndex; i++) {
                txTmp.outs[i] = BLANK_OUTPUT;
            }
            // ignore sequence numbers (except at inIndex)
            txTmp.ins.forEach(function (input, y) {
                if (y === inIndex)
                    return;
                input.sequence = 0;
            });
        }
        // SIGHASH_ANYONECANPAY: ignore inputs entirely?
        if (hashType & Transaction.SIGHASH_ANYONECANPAY) {
            txTmp.ins = [txTmp.ins[inIndex]];
            txTmp.ins[0].script = ourScript;
            // SIGHASH_ALL: only ignore input scripts
        }
        else {
            // "blank" others input scripts
            txTmp.ins.forEach(function (input) {
                input.script = EMPTY_BUFFER;
            });
            txTmp.ins[inIndex].script = ourScript;
        }
        // serialize and hash
        var buffer = Buffer.allocUnsafe(txTmp.byteLength(false) + 4);
        buffer.writeInt32LE(hashType, buffer.length - 4);
        txTmp.__toBuffer(buffer, 0, false);
        return bcrypto.hash256(buffer);
    };
    Transaction.prototype.hashForCashSignature = function (inIndex, prevOutScript, inAmount, hashType) {
        // This function works the way it does because Bitcoin Cash
        // uses BIP143 as their replay protection, AND their algo
        // includes `forkId | hashType`, AND since their forkId=0,
        // this is a NOP, and has no difference to segwit. To support
        // other forks, another parameter is required, and a new parameter
        // would be required in the hashForWitnessV0 function, or
        // it could be broken into two..
        // BIP143 sighash activated in BitcoinCash via 0x40 bit
        if (hashType & Transaction.SIGHASH_BITCOINCASHBIP143) {
            if (types.Null(inAmount)) {
                throw new Error('Bitcoin Cash sighash requires value of input to be signed.');
            }
            return this.hashForWitnessV0(inIndex, prevOutScript, inAmount, hashType);
        }
        else {
            return this.hashForSignature(inIndex, prevOutScript, hashType);
        }
    };
    Transaction.prototype.hashForWitnessV1 = function (inIndex, prevOutScripts, values, hashType, leafHash, annex) {
        // https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki#common-signature-message
        typeforce(types.tuple(types.UInt32, typeforce.arrayOf(types.Buffer), typeforce.arrayOf(types.Satoshi), types.UInt32), arguments);
        if (values.length !== this.ins.length ||
            prevOutScripts.length !== this.ins.length) {
            throw new Error('Must supply prevout script and value for all inputs');
        }
        var outputType = hashType === Transaction.SIGHASH_DEFAULT
            ? Transaction.SIGHASH_ALL
            : hashType & Transaction.SIGHASH_OUTPUT_MASK;
        var inputType = hashType & Transaction.SIGHASH_INPUT_MASK;
        var isAnyoneCanPay = inputType === Transaction.SIGHASH_ANYONECANPAY;
        var isNone = outputType === Transaction.SIGHASH_NONE;
        var isSingle = outputType === Transaction.SIGHASH_SINGLE;
        var hashPrevouts = EMPTY_BUFFER;
        var hashAmounts = EMPTY_BUFFER;
        var hashScriptPubKeys = EMPTY_BUFFER;
        var hashSequences = EMPTY_BUFFER;
        var hashOutputs = EMPTY_BUFFER;
        if (!isAnyoneCanPay) {
            var bufferWriter_1 = bufferutils_1.BufferWriter.withCapacity(36 * this.ins.length);
            this.ins.forEach(function (txIn) {
                bufferWriter_1.writeSlice(txIn.hash);
                bufferWriter_1.writeUInt32(txIn.index);
            });
            hashPrevouts = bcrypto.sha256(bufferWriter_1.end());
            bufferWriter_1 = bufferutils_1.BufferWriter.withCapacity(8 * this.ins.length);
            values.forEach(function (value) { return bufferWriter_1.writeUInt64(value); });
            hashAmounts = bcrypto.sha256(bufferWriter_1.end());
            bufferWriter_1 = bufferutils_1.BufferWriter.withCapacity(prevOutScripts.map(varSliceSize).reduce(function (a, b) { return a + b; }));
            prevOutScripts.forEach(function (prevOutScript) {
                return bufferWriter_1.writeVarSlice(prevOutScript);
            });
            hashScriptPubKeys = bcrypto.sha256(bufferWriter_1.end());
            bufferWriter_1 = bufferutils_1.BufferWriter.withCapacity(4 * this.ins.length);
            this.ins.forEach(function (txIn) { return bufferWriter_1.writeUInt32(txIn.sequence); });
            hashSequences = bcrypto.sha256(bufferWriter_1.end());
        }
        if (!(isNone || isSingle)) {
            var txOutsSize = this.outs
                .map(function (output) { return 8 + varSliceSize(output.script); })
                .reduce(function (a, b) { return a + b; });
            var bufferWriter_2 = bufferutils_1.BufferWriter.withCapacity(txOutsSize);
            this.outs.forEach(function (out) {
                bufferWriter_2.writeUInt64(out.value);
                bufferWriter_2.writeVarSlice(out.script);
            });
            hashOutputs = bcrypto.sha256(bufferWriter_2.end());
        }
        else if (isSingle && inIndex < this.outs.length) {
            var output = this.outs[inIndex];
            var bufferWriter = bufferutils_1.BufferWriter.withCapacity(8 + varSliceSize(output.script));
            bufferWriter.writeUInt64(output.value);
            bufferWriter.writeVarSlice(output.script);
            hashOutputs = bcrypto.sha256(bufferWriter.end());
        }
        var spendType = (leafHash ? 2 : 0) + (annex ? 1 : 0);
        // Length calculation from:
        // https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki#cite_note-14
        // With extension from:
        // https://github.com/bitcoin/bips/blob/master/bip-0342.mediawiki#signature-validation
        var sigMsgSize = 174 -
            (isAnyoneCanPay ? 49 : 0) -
            (isNone ? 32 : 0) +
            (annex ? 32 : 0) +
            (leafHash ? 37 : 0);
        var sigMsgWriter = bufferutils_1.BufferWriter.withCapacity(sigMsgSize);
        sigMsgWriter.writeUInt8(hashType);
        // Transaction
        sigMsgWriter.writeInt32(this.version);
        sigMsgWriter.writeUInt32(this.locktime);
        sigMsgWriter.writeSlice(hashPrevouts);
        sigMsgWriter.writeSlice(hashAmounts);
        sigMsgWriter.writeSlice(hashScriptPubKeys);
        sigMsgWriter.writeSlice(hashSequences);
        if (!(isNone || isSingle)) {
            sigMsgWriter.writeSlice(hashOutputs);
        }
        // Input
        sigMsgWriter.writeUInt8(spendType);
        if (isAnyoneCanPay) {
            var input = this.ins[inIndex];
            sigMsgWriter.writeSlice(input.hash);
            sigMsgWriter.writeUInt32(input.index);
            sigMsgWriter.writeUInt64(values[inIndex]);
            sigMsgWriter.writeVarSlice(prevOutScripts[inIndex]);
            sigMsgWriter.writeUInt32(input.sequence);
        }
        else {
            sigMsgWriter.writeUInt32(inIndex);
        }
        if (annex) {
            var bufferWriter = bufferutils_1.BufferWriter.withCapacity(varSliceSize(annex));
            bufferWriter.writeVarSlice(annex);
            sigMsgWriter.writeSlice(bcrypto.sha256(bufferWriter.end()));
        }
        // Output
        if (isSingle) {
            sigMsgWriter.writeSlice(hashOutputs);
        }
        // BIP342 extension
        if (leafHash) {
            sigMsgWriter.writeSlice(leafHash);
            sigMsgWriter.writeUInt8(0);
            sigMsgWriter.writeUInt32(0xffffffff);
        }
        // Extra zero byte because:
        // https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki#cite_note-19
        return bcrypto.taggedHash('TapSighash', Buffer.concat([Buffer.of(0x00), sigMsgWriter.end()]));
    };
    Transaction.prototype.hashForWitnessV0 = function (inIndex, prevOutScript, value, hashType) {
        typeforce(types.tuple(types.UInt32, types.Buffer, types.Satoshi, types.UInt32), arguments);
        var tbuffer = Buffer.from([]);
        var bufferWriter;
        var hashOutputs = ZERO;
        var hashPrevouts = ZERO;
        var hashSequence = ZERO;
        if (!(hashType & Transaction.SIGHASH_ANYONECANPAY)) {
            tbuffer = Buffer.allocUnsafe(36 * this.ins.length);
            bufferWriter = new bufferutils_1.BufferWriter(tbuffer, 0);
            this.ins.forEach(function (txIn) {
                bufferWriter.writeSlice(txIn.hash);
                bufferWriter.writeUInt32(txIn.index);
            });
            hashPrevouts = bcrypto.hash256(tbuffer);
        }
        if (!(hashType & Transaction.SIGHASH_ANYONECANPAY) &&
            (hashType & 0x1f) !== Transaction.SIGHASH_SINGLE &&
            (hashType & 0x1f) !== Transaction.SIGHASH_NONE) {
            tbuffer = Buffer.allocUnsafe(4 * this.ins.length);
            bufferWriter = new bufferutils_1.BufferWriter(tbuffer, 0);
            this.ins.forEach(function (txIn) {
                bufferWriter.writeUInt32(txIn.sequence);
            });
            hashSequence = bcrypto.hash256(tbuffer);
        }
        if ((hashType & 0x1f) !== Transaction.SIGHASH_SINGLE &&
            (hashType & 0x1f) !== Transaction.SIGHASH_NONE) {
            var txOutsSize = this.outs.reduce(function (sum, output) {
                return sum + 8 + varSliceSize(output.script);
            }, 0);
            tbuffer = Buffer.allocUnsafe(txOutsSize);
            bufferWriter = new bufferutils_1.BufferWriter(tbuffer, 0);
            this.outs.forEach(function (out) {
                bufferWriter.writeUInt64(out.value);
                bufferWriter.writeVarSlice(out.script);
            });
            hashOutputs = bcrypto.hash256(tbuffer);
        }
        else if ((hashType & 0x1f) === Transaction.SIGHASH_SINGLE &&
            inIndex < this.outs.length) {
            var output = this.outs[inIndex];
            tbuffer = Buffer.allocUnsafe(8 + varSliceSize(output.script));
            bufferWriter = new bufferutils_1.BufferWriter(tbuffer, 0);
            bufferWriter.writeUInt64(output.value);
            bufferWriter.writeVarSlice(output.script);
            hashOutputs = bcrypto.hash256(tbuffer);
        }
        tbuffer = Buffer.allocUnsafe(156 + varSliceSize(prevOutScript));
        bufferWriter = new bufferutils_1.BufferWriter(tbuffer, 0);
        var input = this.ins[inIndex];
        bufferWriter.writeInt32(this.version);
        bufferWriter.writeSlice(hashPrevouts);
        bufferWriter.writeSlice(hashSequence);
        bufferWriter.writeSlice(input.hash);
        bufferWriter.writeUInt32(input.index);
        bufferWriter.writeVarSlice(prevOutScript);
        bufferWriter.writeUInt64(value);
        bufferWriter.writeUInt32(input.sequence);
        bufferWriter.writeSlice(hashOutputs);
        bufferWriter.writeUInt32(this.locktime);
        bufferWriter.writeUInt32(hashType);
        return bcrypto.hash256(tbuffer);
    };
    Transaction.prototype.getHash = function (forWitness) {
        // wtxid for coinbase is always 32 bytes of 0x00
        if (forWitness && this.isCoinbase())
            return Buffer.alloc(32, 0);
        return bcrypto.hash256(this.__toBuffer(undefined, undefined, forWitness));
    };
    Transaction.prototype.getId = function () {
        // transaction hash's are displayed in reverse order
        return (0, bufferutils_1.reverseBuffer)(this.getHash(false)).toString('hex');
    };
    Transaction.prototype.toBuffer = function (buffer, initialOffset) {
        return this.__toBuffer(buffer, initialOffset, true);
    };
    Transaction.prototype.toHex = function () {
        return this.toBuffer(undefined, undefined).toString('hex');
    };
    Transaction.prototype.setInputScript = function (index, scriptSig) {
        typeforce(types.tuple(types.Number, types.Buffer), arguments);
        this.ins[index].script = scriptSig;
    };
    Transaction.prototype.setWitness = function (index, witness) {
        typeforce(types.tuple(types.Number, [types.Buffer]), arguments);
        this.ins[index].witness = witness;
    };
    Transaction.prototype.__toBuffer = function (buffer, initialOffset, _ALLOW_WITNESS) {
        if (_ALLOW_WITNESS === void 0) { _ALLOW_WITNESS = false; }
        if (!buffer)
            buffer = Buffer.allocUnsafe(this.byteLength(_ALLOW_WITNESS));
        var bufferWriter = new bufferutils_1.BufferWriter(buffer, initialOffset || 0);
        bufferWriter.writeInt32(this.version);
        var hasWitnesses = _ALLOW_WITNESS && this.hasWitnesses();
        if (hasWitnesses) {
            bufferWriter.writeUInt8(Transaction.ADVANCED_TRANSACTION_MARKER);
            bufferWriter.writeUInt8(Transaction.ADVANCED_TRANSACTION_FLAG);
        }
        bufferWriter.writeVarInt(this.ins.length);
        this.ins.forEach(function (txIn) {
            bufferWriter.writeSlice(txIn.hash);
            bufferWriter.writeUInt32(txIn.index);
            bufferWriter.writeVarSlice(txIn.script);
            bufferWriter.writeUInt32(txIn.sequence);
        });
        bufferWriter.writeVarInt(this.outs.length);
        this.outs.forEach(function (txOut) {
            if (isOutput(txOut)) {
                bufferWriter.writeUInt64(txOut.value);
            }
            else {
                bufferWriter.writeSlice(txOut.valueBuffer);
            }
            bufferWriter.writeVarSlice(txOut.script);
        });
        if (hasWitnesses) {
            this.ins.forEach(function (input) {
                bufferWriter.writeVector(input.witness);
            });
        }
        bufferWriter.writeUInt32(this.locktime);
        // avoid slicing unless necessary
        if (initialOffset !== undefined)
            return buffer.slice(initialOffset, bufferWriter.offset);
        return buffer;
    };
    Transaction.prototype.hashForWitness = function (inIndex, prevOutScript, value, hashType) {
        typeforce(types.tuple(types.UInt32, types.Buffer, types.Satoshi, types.UInt32), arguments);
        var tbuffer = Buffer.from([]);
        var bufferWriter;
        var hashOutputs = ZERO;
        var hashPrevouts = ZERO;
        var hashSequence = ZERO;
        if (!(hashType & Transaction.SIGHASH_ANYONECANPAY)) {
            tbuffer = Buffer.allocUnsafe(36 * this.ins.length);
            bufferWriter = new bufferutils_1.BufferWriter(tbuffer, 0);
            this.ins.forEach(function (txIn) {
                bufferWriter.writeSlice(txIn.hash);
                bufferWriter.writeUInt32(txIn.index);
            });
            hashPrevouts = bcrypto.hash256(tbuffer);
        }
        if (!(hashType & Transaction.SIGHASH_ANYONECANPAY) &&
            (hashType & 0x1f) !== Transaction.SIGHASH_SINGLE &&
            (hashType & 0x1f) !== Transaction.SIGHASH_NONE) {
            tbuffer = Buffer.allocUnsafe(4 * this.ins.length);
            bufferWriter = new bufferutils_1.BufferWriter(tbuffer, 0);
            this.ins.forEach(function (txIn) {
                bufferWriter.writeUInt32(txIn.sequence);
            });
            hashSequence = bcrypto.hash256(tbuffer);
        }
        if ((hashType & 0x1f) !== Transaction.SIGHASH_SINGLE &&
            (hashType & 0x1f) !== Transaction.SIGHASH_NONE) {
            var txOutsSize = this.outs.reduce(function (sum, output) {
                return sum + 8 + varSliceSize(output.script);
            }, 0);
            tbuffer = Buffer.allocUnsafe(txOutsSize);
            bufferWriter = new bufferutils_1.BufferWriter(tbuffer, 0);
            this.outs.forEach(function (out) {
                bufferWriter.writeUInt64(out.value);
                bufferWriter.writeVarSlice(out.script);
            });
            hashOutputs = bcrypto.hash256(tbuffer);
        }
        else if ((hashType & 0x1f) === Transaction.SIGHASH_SINGLE &&
            inIndex < this.outs.length) {
            var output = this.outs[inIndex];
            tbuffer = Buffer.allocUnsafe(8 + varSliceSize(output.script));
            bufferWriter = new bufferutils_1.BufferWriter(tbuffer, 0);
            bufferWriter.writeUInt64(output.value);
            bufferWriter.writeVarSlice(output.script);
            hashOutputs = bcrypto.hash256(tbuffer);
        }
        tbuffer = Buffer.allocUnsafe(156 + prevOutScript.length);
        bufferWriter = new bufferutils_1.BufferWriter(tbuffer, 0);
        var input = this.ins[inIndex];
        bufferWriter.writeInt32(this.version);
        bufferWriter.writeSlice(hashPrevouts);
        bufferWriter.writeSlice(hashSequence);
        bufferWriter.writeSlice(input.hash);
        bufferWriter.writeUInt32(input.index);
        bufferWriter.writeSlice(prevOutScript);
        bufferWriter.writeUInt64(value);
        bufferWriter.writeUInt32(input.sequence);
        bufferWriter.writeSlice(hashOutputs);
        bufferWriter.writeUInt32(this.locktime);
        bufferWriter.writeUInt32(hashType);
        return bcrypto.hash256(tbuffer);
    };
    Transaction.DEFAULT_SEQUENCE = 0xffffffff;
    Transaction.SIGHASH_DEFAULT = 0x00;
    Transaction.SIGHASH_ALL = 0x01;
    Transaction.SIGHASH_NONE = 0x02;
    Transaction.SIGHASH_SINGLE = 0x03;
    Transaction.SIGHASH_ANYONECANPAY = 0x80;
    Transaction.SIGHASH_OUTPUT_MASK = 0x03;
    Transaction.SIGHASH_INPUT_MASK = 0x80;
    Transaction.SIGHASH_BITCOINCASHBIP143 = 0x40;
    Transaction.ADVANCED_TRANSACTION_MARKER = 0x00;
    Transaction.ADVANCED_TRANSACTION_FLAG = 0x01;
    return Transaction;
}());
exports.Transaction = Transaction;
