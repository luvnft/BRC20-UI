// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { toB58 } from '../bcs';
import {
  array,
  assert,
  define,
  Infer,
  integer,
  is,
  literal,
  nullable,
  object,
  optional,
  string,
  union,
} from 'superstruct';
import { hashTypedData } from '../cryptography/hash';
import { normalizeSuiAddress, SuiObjectRef } from '../types';
import { builder } from './bcs';
import { TransactionType, TransactionBlockInput } from './Transactions';
import { BuilderCallArg, PureCallArg } from './Inputs';
import { create } from './utils';

export const TransactionExpiration = optional(
  nullable(
    union([
      object({ Epoch: integer() }),
      object({ None: union([literal(true), literal(null)]) }),
    ]),
  ),
);
export type TransactionExpiration = Infer<typeof TransactionExpiration>;

const SuiAddress = string();

const StringEncodedBigint = define<string>('StringEncodedBigint', (val) => {
  if (!['string', 'number', 'bigint'].includes(typeof val)) return false;

  try {
    BigInt(val as string);
    return true;
  } catch {
    return false;
  }
});

const GasConfig = object({
  budget: optional(StringEncodedBigint),
  price: optional(StringEncodedBigint),
  payment: optional(array(SuiObjectRef)),
  owner: optional(SuiAddress),
});
type GasConfig = Infer<typeof GasConfig>;

export const SerializedTransactionDataBuilder = object({
  version: literal(1),
  sender: optional(SuiAddress),
  expiration: TransactionExpiration,
  gasConfig: GasConfig,
  inputs: array(TransactionBlockInput),
  transactions: array(TransactionType),
});
export type SerializedTransactionDataBuilder = Infer<
  typeof SerializedTransactionDataBuilder
>;

function prepareSuiAddress(address: string) {
  return normalizeSuiAddress(address).replace('0x', '');
}

// NOTE: This value should be kept in sync with the corresponding value in
// crates/sui-protocol-config/src/lib.rs
const TRANSACTION_DATA_MAX_SIZE = 128 * 1024;

export class TransactionBlockDataBuilder {
  static fromKindBytes(bytes: Uint8Array) {
    const kind = builder.de('TransactionKind', bytes);
    const programmableTx = kind?.ProgrammableTransaction;
    if (!programmableTx) {
      throw new Error('Unable to deserialize from bytes.');
    }

    const serialized = create(
      {
        version: 1,
        gasConfig: {},
        inputs: programmableTx.inputs.map((value: unknown, index: number) =>
          create(
            {
              kind: 'Input',
              value,
              index,
              type: is(value, PureCallArg) ? 'pure' : 'object',
            },
            TransactionBlockInput,
          ),
        ),
        transactions: programmableTx.transactions,
      },
      SerializedTransactionDataBuilder,
    );

    return TransactionBlockDataBuilder.restore(serialized);
  }

  static fromBytes(bytes: Uint8Array) {
    const rawData = builder.de('TransactionData', bytes);
    const data = rawData?.V1;
    const programmableTx = data?.kind?.ProgrammableTransaction;
    if (!data || !programmableTx) {
      throw new Error('Unable to deserialize from bytes.');
    }

    const serialized = create(
      {
        version: 1,
        sender: data.sender,
        expiration: data.expiration,
        gasConfig: data.gasData,
        inputs: programmableTx.inputs.map((value: unknown, index: number) =>
          create(
            {
              kind: 'Input',
              value,
              index,
              type: is(value, PureCallArg) ? 'pure' : 'object',
            },
            TransactionBlockInput,
          ),
        ),
        transactions: programmableTx.transactions,
      },
      SerializedTransactionDataBuilder,
    );

    return TransactionBlockDataBuilder.restore(serialized);
  }

  static restore(data: SerializedTransactionDataBuilder) {
    assert(data, SerializedTransactionDataBuilder);
    const transactionData = new TransactionBlockDataBuilder();
    Object.assign(transactionData, data);
    return transactionData;
  }

  /**
   * Generate transaction digest.
   *
   * @param bytes BCS serialized transaction data
   * @returns transaction digest.
   */
  static getDigestFromBytes(bytes: Uint8Array) {
    const hash = hashTypedData('TransactionData', bytes);
    return toB58(hash);
  }

  version = 1 as const;
  sender?: string;
  expiration?: TransactionExpiration;
  gasConfig: GasConfig;
  inputs: TransactionBlockInput[];
  transactions: TransactionType[];

  constructor(clone?: TransactionBlockDataBuilder) {
    this.sender = clone?.sender;
    this.expiration = clone?.expiration;
    this.gasConfig = clone?.gasConfig ?? {};
    this.inputs = clone?.inputs ?? [];
    this.transactions = clone?.transactions ?? [];
  }

  build({
    overrides,
    onlyTransactionKind,
  }: {
    overrides?: Pick<
      Partial<TransactionBlockDataBuilder>,
      'sender' | 'gasConfig' | 'expiration'
    >;
    onlyTransactionKind?: boolean;
  } = {}) {
    // Resolve inputs down to values:
    const inputs = this.inputs.map((input) => {
      assert(input.value, BuilderCallArg);
      return input.value;
    });

    const kind = {
      ProgrammableTransaction: {
        inputs,
        transactions: this.transactions,
      },
    };

    if (onlyTransactionKind) {
      return builder
        .ser('TransactionKind', kind, { maxSize: TRANSACTION_DATA_MAX_SIZE })
        .toBytes();
    }

    const expiration = overrides?.expiration ?? this.expiration;
    const sender = overrides?.sender ?? this.sender;
    const gasConfig = { ...this.gasConfig, ...overrides?.gasConfig };

    if (!sender) {
      throw new Error('Missing transaction sender');
    }

    if (!gasConfig.budget) {
      throw new Error('Missing gas budget');
    }

    if (!gasConfig.payment) {
      throw new Error('Missing gas payment');
    }

    if (!gasConfig.price) {
      throw new Error('Missing gas price');
    }

    const transactionData = {
      sender: prepareSuiAddress(sender),
      expiration: expiration ? expiration : { None: true },
      gasData: {
        payment: gasConfig.payment,
        owner: prepareSuiAddress(this.gasConfig.owner ?? sender),
        price: BigInt(gasConfig.price),
        budget: BigInt(gasConfig.budget),
      },
      kind: {
        ProgrammableTransaction: {
          inputs,
          transactions: this.transactions,
        },
      },
    };

    return builder
      .ser(
        'TransactionData',
        { V1: transactionData },
        { maxSize: TRANSACTION_DATA_MAX_SIZE },
      )
      .toBytes();
  }

  getDigest() {
    const bytes = this.build({ onlyTransactionKind: false });
    return TransactionBlockDataBuilder.getDigestFromBytes(bytes);
  }

  snapshot(): SerializedTransactionDataBuilder {
    return create(this, SerializedTransactionDataBuilder);
  }
}
