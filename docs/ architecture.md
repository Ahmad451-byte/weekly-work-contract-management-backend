# Architecture

## Overview

The application follows the standard NestJS layered architecture.

```
GraphQL Resolver
        │
        ▼
WeeklyWorkContractService
        │
        ▼
ContractValidationService
        │
        ▼
TypeORM Repositories
        │
        ▼
MySQL Database
```

## Components

### Resolver

The GraphQL resolver exposes the API operations:

- createWeeklyWorkContract
- updateWeeklyWorkContract
- weeklyWorkContracts
- activeWeeklyWorkContract
- deleteWeeklyWorkContract

### Service

`WeeklyWorkContractService` contains the business logic:

- create contracts
- update contracts
- delete contracts
- search active contracts
- detect overlapping contracts
- create audit entries

### Validation Service

`ContractValidationService` contains reusable validation logic:

- validateHours()
- validateDateRange()

Separating validation from the service improves readability and makes the validation reusable.

### Persistence

The application uses:

- TypeORM
- MySQL
- Database migrations

### Audit

Every CREATE, UPDATE and DELETE operation writes an entry into the `weekly_work_contract_audit` table.

### Testing

The project contains:

- Unit tests for the service
- Unit tests for the resolver
- GraphQL end-to-end tests