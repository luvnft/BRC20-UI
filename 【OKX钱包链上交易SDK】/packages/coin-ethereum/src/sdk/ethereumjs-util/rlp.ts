/**
 * The following methods are based on `ethereumjs/util`, thanks for their work
 * https://github.com/ethereumjs/ethereumjs-monorepo/tree/master/packages/util
 * Distributed under the Mozilla Public License Version 2.0 software license, see the accompanying
 * file LICENSE or https://opensource.org/license/mpl-2-0/.
 */

import {BN} from '@okxweb3/crypto-lib'

export type Input = Buffer | string | number | bigint | Uint8Array | BN | List | null

// Use interface extension instead of type alias to
// make circular declaration possible.
export interface List extends Array<Input> {}

export interface Decoded {
    data: Buffer | Buffer[]
    remainder: Buffer
}

/**
 * RLP Encoding based on: https://github.com/ethereum/wiki/wiki/%5BEnglish%5D-RLP
 * This function takes in a data, convert it to buffer if not, and a length for recursion
 * @param input - will be converted to buffer
 * @returns returns buffer of encoded data
 **/
export function encode(input: Input): Buffer {
    if (Array.isArray(input)) {
        const output: Buffer[] = []
        for (let i = 0; i < input.length; i++) {
            output.push(encode(input[i]))
        }
        const buf = Buffer.concat(output)
        return Buffer.concat([encodeLength(buf.length, 192), buf])
    } else {
        const inputBuf = toBuffer(input)
        return inputBuf.length === 1 && inputBuf[0] < 128
            ? inputBuf
            : Buffer.concat([encodeLength(inputBuf.length, 128), inputBuf])
    }
}

/**
 * Parse integers. Check if there is no leading zeros
 * @param v The value to parse
 * @param base The base to parse the integer into
 */
function safeParseInt(v: string, base: number): number {
    if (v[0] === '0' && v[1] === '0') {
        throw new Error('invalid RLP: extra zeros')
    }

    return parseInt(v, base)
}

function encodeLength(len: number, offset: number): Buffer {
    if (len < 56) {
        return Buffer.from([len + offset])
    } else {
        const hexLength = intToHex(len)
        const lLength = hexLength.length / 2
        const firstByte = intToHex(offset + 55 + lLength)
        return Buffer.from(firstByte + hexLength, 'hex')
    }
}

/**
 * RLP Decoding based on: {@link https://github.com/ethereum/wiki/wiki/%5BEnglish%5D-RLP|RLP}
 * @param input - will be converted to buffer
 * @param stream - Is the input a stream (false by default)
 * @returns - returns decode Array of Buffers containg the original message
 **/
export function decode(input: Buffer, stream?: boolean): Buffer
export function decode(input: Buffer[], stream?: boolean): Buffer[]
export function decode(input: Input, stream?: boolean): Buffer[] | Buffer | Decoded
export function decode(input: Input, stream: boolean = false): Buffer[] | Buffer | Decoded {
    if (!input || (input as any).length === 0) {
        return Buffer.from([])
    }

    const inputBuffer = toBuffer(input)
    const decoded = _decode(inputBuffer)

    if (stream) {
        return decoded
    }
    if (decoded.remainder.length !== 0) {
        throw new Error('invalid remainder')
    }

    return decoded.data
}

/**
 * Get the length of the RLP input
 * @param input
 * @returns The length of the input or an empty Buffer if no input
 */
export function getLength(input: Input): Buffer | number {
    if (!input || (input as any).length === 0) {
        return Buffer.from([])
    }

    const inputBuffer = toBuffer(input)
    const firstByte = inputBuffer[0]

    if (firstByte <= 0x7f) {
        return inputBuffer.length
    } else if (firstByte <= 0xb7) {
        return firstByte - 0x7f
    } else if (firstByte <= 0xbf) {
        return firstByte - 0xb6
    } else if (firstByte <= 0xf7) {
        // a list between  0-55 bytes long
        return firstByte - 0xbf
    } else {
        // a list  over 55 bytes long
        const llength = firstByte - 0xf6
        const length = safeParseInt(inputBuffer.slice(1, llength).toString('hex'), 16)
        return llength + length
    }
}

/** Decode an input with RLP */
function _decode(input: Buffer): Decoded {
    let length, llength, data, innerRemainder, d
    const decoded = []
    const firstByte = input[0]

    if (firstByte <= 0x7f) {
        // a single byte whose value is in the [0x00, 0x7f] range, that byte is its own RLP encoding.
        return {
            data: input.slice(0, 1),
            remainder: input.slice(1),
        }
    } else if (firstByte <= 0xb7) {
        // string is 0-55 bytes long. A single byte with value 0x80 plus the length of the string followed by the string
        // The range of the first byte is [0x80, 0xb7]
        length = firstByte - 0x7f

        // set 0x80 null to 0
        if (firstByte === 0x80) {
            data = Buffer.from([])
        } else {
            data = input.slice(1, length)
        }

        if (length === 2 && data[0] < 0x80) {
            throw new Error('invalid rlp encoding: byte must be less 0x80')
        }

        return {
            data: data,
            remainder: input.slice(length),
        }
    } else if (firstByte <= 0xbf) {
        // string is greater than 55 bytes long. A single byte with the value (0xb7 plus the length of the length),
        // followed by the length, followed by the string
        llength = firstByte - 0xb6
        if (input.length - 1 < llength) {
            throw new Error('invalid RLP: not enough bytes for string length')
        }
        length = safeParseInt(input.slice(1, llength).toString('hex'), 16)
        if (length <= 55) {
            throw new Error('invalid RLP: expected string length to be greater than 55')
        }
        data = input.slice(llength, length + llength)
        if (data.length < length) {
            throw new Error('invalid RLP: not enough bytes for string')
        }

        return {
            data: data,
            remainder: input.slice(length + llength),
        }
    } else if (firstByte <= 0xf7) {
        // a list between  0-55 bytes long
        length = firstByte - 0xbf
        innerRemainder = input.slice(1, length)
        while (innerRemainder.length) {
            d = _decode(innerRemainder)
            decoded.push(d.data as Buffer)
            innerRemainder = d.remainder
        }

        return {
            data: decoded,
            remainder: input.slice(length),
        }
    } else {
        // a list  over 55 bytes long
        llength = firstByte - 0xf6
        length = safeParseInt(input.slice(1, llength).toString('hex'), 16)
        const totalLength = llength + length
        if (totalLength > input.length) {
            throw new Error('invalid rlp: total length is larger than the data')
        }

        innerRemainder = input.slice(llength, totalLength)
        if (innerRemainder.length === 0) {
            throw new Error('invalid rlp, List has a invalid length')
        }

        while (innerRemainder.length) {
            d = _decode(innerRemainder)
            decoded.push(d.data as Buffer)
            innerRemainder = d.remainder
        }
        return {
            data: decoded,
            remainder: input.slice(totalLength),
        }
    }
}

/** Check if a string is prefixed by 0x */
export function isHexPrefixed(str: string): boolean {
    return str.slice(0, 2) === '0x'
}

/** Removes 0x from a given String */
export function stripHexPrefix(str: string): string {
    if (typeof str !== 'string') {
        return str
    }
    return isHexPrefixed(str) ? str.slice(2) : str
}

/** Transform an integer into its hexadecimal value */
function intToHex(integer: number | bigint): string {
    if (integer < 0) {
        throw new Error('Invalid integer as argument, must be unsigned!')
    }
    const hex = integer.toString(16)
    return hex.length % 2 ? `0${hex}` : hex
}

/** Pad a string to be even */
function padToEven(a: string): string {
    return a.length % 2 ? `0${a}` : a
}

/** Transform an integer into a Buffer */
function intToBuffer(integer: number | bigint): Buffer {
    const hex = intToHex(integer)
    return Buffer.from(hex, 'hex')
}

/** Transform anything into a Buffer */
function toBuffer(v: Input): Buffer {
    if (!Buffer.isBuffer(v)) {
        if (typeof v === 'string') {
            if (isHexPrefixed(v)) {
                return Buffer.from(padToEven(stripHexPrefix(v)), 'hex')
            } else {
                return Buffer.from(v)
            }
        } else if (typeof v === 'number' || typeof v === 'bigint') {
            if (!v) {
                return Buffer.from([])
            } else {
                return intToBuffer(v)
            }
        } else if (v === null || v === undefined) {
            return Buffer.from([])
        } else if (v instanceof Uint8Array) {
            return Buffer.from(v as any)
        } else if (BN.isBN(v)) {
            // converts a BN to a Buffer
            return Buffer.from(v.toArray())
        } else {
            throw new Error('invalid type')
        }
    }
    return v
}