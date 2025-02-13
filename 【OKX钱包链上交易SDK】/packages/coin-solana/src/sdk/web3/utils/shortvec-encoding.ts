/**
 * The following methods are based on `solana-web3.js`, thanks for their work
 * https://github.com/solana-labs/solana-web3.js/tree/master/packages/library-legacy/src/utils
 */

export function decodeLength(bytes: Array<number>): number {
  let len = 0;
  let size = 0;
  for (;;) {
    let elem = bytes.shift() as number;
    len |= (elem & 0x7f) << (size * 7);
    size += 1;
    if ((elem & 0x80) === 0) {
      break;
    }
  }
  return len;
}

export function encodeLength(bytes: Array<number>, len: number) {
  let rem_len = len;
  for (;;) {
    let elem = rem_len & 0x7f;
    rem_len >>= 7;
    if (rem_len == 0) {
      bytes.push(elem);
      break;
    } else {
      elem |= 0x80;
      bytes.push(elem);
    }
  }
}
