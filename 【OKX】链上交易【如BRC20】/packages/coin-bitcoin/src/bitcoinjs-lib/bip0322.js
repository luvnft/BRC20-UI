"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySimple = exports.signSimple = void 0;
/**
 * The following methods are based on `bitcoinjs`, thanks for their work
 * https://github.com/bitcoinjs/bitcoinjs-lib
 */
var crypto_lib_1 = require("@okxweb3/crypto-lib");
var address_1 = require("./address");
var transaction_1 = require("./transaction");
var psbt_1 = require("./psbt");
var varuint_1 = require("./varuint");
var psbtSign_1 = require("../psbtSign");
var txBuild_1 = require("../txBuild");
var psbtutils_1 = require("./psbt/psbtutils");
function bip0322_hash(message) {
    var tag = 'BIP0322-signed-message';
    var tagHash = crypto_lib_1.base.sha256(Buffer.from(tag));
    var result = crypto_lib_1.base.sha256(Buffer.concat([tagHash, tagHash, Buffer.from(message)]));
    return crypto_lib_1.base.toHex(result);
}
function signSimple(message, address, privateKey, network) {
    return __awaiter(this, void 0, void 0, function () {
        function encodeVarString(b) {
            return Buffer.concat([(0, varuint_1.encode)(b.byteLength), b]);
        }
        var outputScript, prevoutHash, prevoutIndex, sequence, scriptSig, txToSpend, psbtToSign, txToSign, len, result;
        return __generator(this, function (_a) {
            outputScript = (0, address_1.toOutputScript)(address, network);
            prevoutHash = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
            prevoutIndex = 0xffffffff;
            sequence = 0;
            scriptSig = Buffer.concat([Buffer.from('0020', 'hex'), Buffer.from(bip0322_hash(message), 'hex')]);
            txToSpend = new transaction_1.Transaction();
            txToSpend.version = 0;
            txToSpend.addInput(prevoutHash, prevoutIndex, sequence, scriptSig);
            txToSpend.addOutput(outputScript, 0);
            psbtToSign = new psbt_1.Psbt({ network: network });
            psbtToSign.setVersion(0);
            psbtToSign.addInput({
                hash: txToSpend.getHash(),
                index: 0,
                sequence: 0,
                witnessUtxo: {
                    script: outputScript,
                    value: 0
                },
            });
            if ((0, psbtutils_1.isP2TR)(outputScript)) {
                psbtToSign.updateInput(0, {
                    tapInternalKey: (0, txBuild_1.wif2Public)(privateKey, network).slice(1),
                });
            }
            psbtToSign.addOutput({ script: Buffer.from('6a', 'hex'), value: 0 });
            (0, psbtSign_1.psbtSignImpl)(psbtToSign, privateKey, network);
            psbtToSign.finalizeAllInputs();
            txToSign = psbtToSign.extractTransaction();
            len = (0, varuint_1.encode)(txToSign.ins[0].witness.length);
            result = Buffer.concat(__spreadArray([len], txToSign.ins[0].witness.map(function (w) { return encodeVarString(w); }), true));
            return [2 /*return*/, crypto_lib_1.base.toBase64(result)];
        });
    });
}
exports.signSimple = signSimple;
function verifySimple(message, address, witness, publicKey, network) {
    var outputScript = (0, address_1.toOutputScript)(address, network);
    var prevoutHash = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
    var prevoutIndex = 0xffffffff;
    var sequence = 0;
    var scriptSig = Buffer.concat([Buffer.from('0020', 'hex'), Buffer.from(bip0322_hash(message), 'hex')]);
    var txToSpend = new transaction_1.Transaction();
    txToSpend.version = 0;
    txToSpend.addInput(prevoutHash, prevoutIndex, sequence, scriptSig);
    txToSpend.addOutput(outputScript, 0);
    var psbtToSign = new psbt_1.Psbt();
    psbtToSign.setVersion(0);
    psbtToSign.addInput({
        hash: txToSpend.getHash(),
        index: 0,
        sequence: 0,
        witnessUtxo: {
            script: outputScript,
            value: 0
        },
    });
    var pubBuf = crypto_lib_1.base.fromHex(publicKey);
    if ((0, psbtutils_1.isP2TR)(outputScript)) {
        psbtToSign.updateInput(0, {
            tapInternalKey: pubBuf.slice(1),
        });
    }
    psbtToSign.addOutput({ script: Buffer.from('6a', 'hex'), value: 0 });
    return psbtToSign.verify(pubBuf, Buffer.from(crypto_lib_1.base.fromBase64(witness)));
}
exports.verifySimple = verifySimple;
