/**
 * Author:https://github.com/nbd-wtf/nostr-tools
 * */
import { generatePrivateKey, getPublicKey } from './keys'

test('private key generation', () => {
  expect(generatePrivateKey()).toMatch(/[a-f0-9]{64}/)
})

test('public key generation', () => {
  expect(getPublicKey(generatePrivateKey())).toMatch(/[a-f0-9]{64}/)
})

test('public key from private key deterministic', () => {
  let sk = generatePrivateKey()
  let pk = getPublicKey(sk)

  for (let i = 0; i < 5; i++) {
    expect(getPublicKey(sk)).toEqual(pk)
  }
})
