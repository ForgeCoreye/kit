import { SOLANA_ERROR__TRANSACTION__EXCEEDS_SIZE_LIMIT, SolanaError } from '@solana/errors';
import type { NominalType } from '@solana/nominal-types';
import type { TransactionMessage, TransactionMessageWithinSizeLimit } from '@solana/transaction-messages';

import { getTransactionEncoder } from './codecs';
import { Transaction } from './transaction';

/**
 * The maximum size of a transaction packet in bytes.
 */
export const TRANSACTION_PACKET_SIZE = 1280;

/**
 * The size of the transaction packet header in bytes.
 * This includes the IPv6 header and the fragment header.
 */
export const TRANSACTION_PACKET_HEADER =
    40 /* 40 bytes is the size of the IPv6 header. */ + 8; /* 8 bytes is the size of the fragment header. */

/**
 * The maximum size of a transaction in bytes.
 *
 * Note that this excludes the transaction packet header.
 * In other words, this is how much content we can fit in a transaction packet.
 */
export const TRANSACTION_SIZE_LIMIT = TRANSACTION_PACKET_SIZE - TRANSACTION_PACKET_HEADER;

/**
 * The maximum size of a version 1 transaction in bytes.
 */
export const V1_TRANSACTION_SIZE_LIMIT = 4096;

/**
 * Gets the size of a given transaction in bytes.
 *
 * @example
 * ```ts
 * const transactionSize = getTransactionSize(transaction);
 * ```
 */
export function getTransactionSize(transaction: Transaction): number {
    return getTransactionEncoder().getSizeFromValue(transaction);
}

/**
 * A type guard that checks if a transaction is within the size limit.
 */
export type TransactionWithinSizeLimit = NominalType<'transactionSize', 'withinLimit'>;

/**
 * Helper type that adds the `TransactionWithinSizeLimit` flag to
 * a transaction if and only if the provided transaction message
 * is also within the size limit.
 */
export type SetTransactionWithinSizeLimitFromTransactionMessage<
    TTransaction extends Transaction,
    TTransactionMessage extends TransactionMessage,
> = TTransactionMessage extends TransactionMessageWithinSizeLimit
    ? TransactionWithinSizeLimit & TTransaction
    : TTransaction;

/**
 * Checks if a transaction is within the size limit.
 *
 * @typeParam TTransaction - The type of the given transaction.
 *
 * @example
 * ```ts
 * if (isTransactionWithinSizeLimit(transaction)) {
 *    transaction satisfies TransactionWithinSizeLimit;
 * }
 * ```
 */
export function isTransactionWithinSizeLimit<TTransaction extends Transaction>(
    transaction: TTransaction,
): transaction is TransactionWithinSizeLimit & TTransaction {
    if (transaction.messageBytes.length === 0) {
        // If there are no message bytes, then the transaction is empty and thus within the size limit.
        return true;
    }

    const firstByte = transaction.messageBytes[0];
    const sizeLimit = (firstByte & VERSION_FLAG_MASK) === 1 ? V1_TRANSACTION_SIZE_LIMIT : TRANSACTION_SIZE_LIMIT;
    return getTransactionSize(transaction) <= sizeLimit;
}

const VERSION_FLAG_MASK = 0b01111111;

/**
 * Asserts that a given transaction is within the size limit.
 *
 * Throws a {@link SolanaError} of code {@link SOLANA_ERROR__TRANSACTION__EXCEEDS_SIZE_LIMIT}
 * if the transaction exceeds the size limit.
 *
 * @typeParam TTransaction - The type of the given transaction.
 *
 * @example
 * ```ts
 * assertIsTransactionWithinSizeLimit(transaction);
 * transaction satisfies TransactionWithinSizeLimit;
 * ```
 */
export function assertIsTransactionWithinSizeLimit<TTransaction extends Transaction>(
    transaction: TTransaction,
): asserts transaction is TransactionWithinSizeLimit & TTransaction {
    if (transaction.messageBytes.length === 0) {
        // If there are no message bytes, then the transaction is empty and thus within the size limit.
        return;
    }

    const firstByte = transaction.messageBytes[0];
    const sizeLimit = (firstByte & VERSION_FLAG_MASK) === 1 ? V1_TRANSACTION_SIZE_LIMIT : TRANSACTION_SIZE_LIMIT;
    const transactionSize = getTransactionSize(transaction);

    if (transactionSize > sizeLimit) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__EXCEEDS_SIZE_LIMIT, {
            transactionSize,
            transactionSizeLimit: sizeLimit,
        });
    }
}
