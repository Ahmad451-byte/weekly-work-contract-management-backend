# Business Rules

## Weekly Work Contracts

The application manages weekly work contracts for employees.

### Validation Rules

- A contract must belong to an existing user.
- `hoursPerWeek` must be between **1 and 60** hours.
- `validFrom` must not be later than `validUntil`.
- Contracts for the same user must not overlap.
- `validUntil` is optional. If it is null, the contract is considered open-ended.

### Active Contract

A contract is active when:

validFrom <= requestedDate

and

validUntil is NULL or validUntil >= requestedDate

### Audit Logging

Every create, update and delete operation creates an audit entry containing:

- contractId
- userId
- hoursPerWeek
- validFrom
- validUntil
- action (CREATE, UPDATE, DELETE)
- version
- createdAt