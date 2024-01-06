"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = exports.bip0322 = exports.script = exports.payments = exports.networks = exports.crypto = exports.address = void 0;
/**
 * The following methods are based on `bitcoinjs`, thanks for their work
 * https://github.com/bitcoinjs/bitcoinjs-lib
 */
var address = require("./address");
exports.address = address;
var crypto = require("./crypto");
exports.crypto = crypto;
var networks = require("./networks");
exports.networks = networks;
var payments = require("./payments");
exports.payments = payments;
var script = require("./script");
exports.script = script;
var bip0322 = require("./bip0322");
exports.bip0322 = bip0322;
var transaction_1 = require("./transaction");
Object.defineProperty(exports, "Transaction", { enumerable: true, get: function () { return transaction_1.Transaction; } });
