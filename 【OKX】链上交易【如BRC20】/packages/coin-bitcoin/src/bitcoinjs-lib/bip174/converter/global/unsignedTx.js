"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encode = void 0;
var typeFields_1 = require("../../typeFields");
function encode(data) {
    return {
        key: Buffer.from([typeFields_1.GlobalTypes.UNSIGNED_TX]),
        value: data.toBuffer(),
    };
}
exports.encode = encode;
