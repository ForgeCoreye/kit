---
'@solana/instruction-plans': minor
'@solana/transactions': minor
---

Add version-aware transaction size limits. Version 1 transactions now use a higher size limit of 4096 bytes (`V1_TRANSACTION_SIZE_LIMIT`), while legacy and v0 transactions continue to use the existing limit of 1232 bytes (`TRANSACTION_SIZE_LIMIT`). A new `getTransactionMessageSizeLimit` function is exported from `@solana/transactions` to select the correct limit for a given transaction message.
