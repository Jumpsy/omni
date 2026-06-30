---
name: backend-integration
description: Use for server-side integration, auth, retries, idempotency, transactions, and observability.
---
# Backend Integration
Purpose: make backend work reliable and observable.
Workflow: inspect data model, authorize server-side, validate input, protect secrets, write integration tests.
Outputs: backend changes and boundary notes.
Failure: leaking internal errors or skipping rollback paths.
See [performance/security](../../references/engineering/performance-security.md).
