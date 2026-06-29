# GraphQL API Examples

## Create Contract

```graphql
mutation {
  createWeeklyWorkContract(
    input: {
      userId: 1
      hoursPerWeek: 40
      validFrom: "2025-01-01T00:00:00.000Z"
    }
  ) {
    id
    hoursPerWeek
    validFrom
  }
}
```

---

## Get Contracts

```graphql
query {
  weeklyWorkContracts(userId: 1) {
    id
    hoursPerWeek
    validFrom
    validUntil
  }
}
```

---

## Get Active Contract

```graphql
query {
  activeWeeklyWorkContract(
    userId: 1
    date: "2025-06-01T00:00:00.000Z"
  ) {
    id
    hoursPerWeek
  }
}
```

---

## Update Contract

```graphql
mutation {
  updateWeeklyWorkContract(
    id: 1
    input: {
      hoursPerWeek: 35
      validUntil: "2025-12-31T00:00:00.000Z"
    }
  ) {
    id
    hoursPerWeek
    validUntil
  }
}
```

---

## Delete Contract

```graphql
mutation {
  deleteWeeklyWorkContract(id: 1)
}
```