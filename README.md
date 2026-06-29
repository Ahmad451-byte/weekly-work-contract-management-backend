# Weekly Work Contract API

A NestJS-based backend application for managing weekly work contracts with audit logging, validation rules, and GraphQL API.

---

## 🚀 Tech Stack

- NestJS
- GraphQL (Apollo)
- TypeORM
- MySQL
- Jest (Unit & E2E Testing)

---

## 📦 Features

- Create weekly work contracts for users
- Prevent overlapping contracts
- Validate business rules (hours, date ranges)
- Audit logging for CREATE / UPDATE / DELETE actions
- GraphQL API (queries & mutations)
- Full test coverage (unit + e2e)

---

## 🏗 Project Setup

```bash
npm install
⚙️ Environment Variables

Create a .env file:

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=weekly_work_contract

Make sure .env is NOT committed.

▶️ Run the Application
# development
npm run start:dev

# production
npm run start:prod
🧪 Testing
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
📡 GraphQL Playground

After starting the app:

http://localhost:3000/graphql

Example mutation:

mutation {
  createWeeklyWorkContract(input: {
    userId: 1,
    hoursPerWeek: 40,
    validFrom: "2024-01-01T00:00:00.000Z"
  }) {
    id
    hoursPerWeek
  }
}
🧠 Business Rules
Hours per week: 1–60
No overlapping contracts per user
validFrom must be before validUntil
All changes are stored in audit table
🗄 Database

Uses MySQL with TypeORM migrations.

npm run typeorm migration:run
📊 Architecture
Modular NestJS structure
Service layer contains business logic
Resolver layer handles GraphQL API
Audit service tracks all mutations
📜 License

MIT