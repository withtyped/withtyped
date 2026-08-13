---
"@withtyped/postgres": patch
---

release the pooled client even when the transaction rollback fails

If a statement in a `PostgresTransaction` failed and the subsequent `rollback` also threw (e.g. the connection died mid-transaction), the checked-out client was never released, permanently losing its pool slot. The client is now destroyed in that case, and the original statement error is still rethrown.
