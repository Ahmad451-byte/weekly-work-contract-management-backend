import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { User } from '../../src/user/entities/user.entity';

describe('WeeklyWorkContract GraphQL E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get(DataSource);


    await dataSource.runMigrations();
  });

  beforeEach(async () => {
    // clean in FK-safe order
    await dataSource.query(`DELETE FROM weekly_work_contract_audit`);
    await dataSource.query(`DELETE FROM weekly_work_contracts`);
    await dataSource.query(`DELETE FROM users`);


    await dataSource.getRepository(User).save({
      id: 1,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@test.com',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a weekly work contract', async () => {
    const mutation = `
      mutation {
        createWeeklyWorkContract(input: {
          userId: 1,
          hoursPerWeek: 40,
          validFrom: "2024-01-01T00:00:00.000Z"
        }) {
          id
          hoursPerWeek
          validFrom
        }
      }
    `;

    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: mutation })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.createWeeklyWorkContract).toBeDefined();
    expect(res.body.data.createWeeklyWorkContract.hoursPerWeek).toBe(40);
  });

  it('should return contracts for user', async () => {
    const query = `
      query {
        weeklyWorkContracts(userId: 1) {
          id
          hoursPerWeek
        }
      }
    `;

    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(Array.isArray(res.body.data.weeklyWorkContracts)).toBe(true);
  });

  it('should return active contract or null', async () => {
    const query = `
      query {
        activeWeeklyWorkContract(
          userId: 1,
          date: "2024-01-01T00:00:00.000Z"
        ) {
          id
          hoursPerWeek
        }
      }
    `;

    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query })
      .expect(200);

    expect(res.body.errors).toBeUndefined();

    expect(
      res.body.data.activeWeeklyWorkContract === null ||
      typeof res.body.data.activeWeeklyWorkContract === 'object'
    ).toBe(true);
  });

  it('should delete contract', async () => {
    // 1. CREATE contract first
    const createMutation = `
    mutation {
      createWeeklyWorkContract(input: {
        userId: 1,
        hoursPerWeek: 40,
        validFrom: "2024-01-01T00:00:00.000Z"
      }) {
        id
      }
    }
  `;

    const createRes = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: createMutation })
      .expect(200);

    const contractId = createRes.body.data.createWeeklyWorkContract.id;


    const deleteMutation = `
    mutation {
      deleteWeeklyWorkContract(id: ${contractId})
    }
  `;

    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: deleteMutation })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.deleteWeeklyWorkContract).toBe(true);
  });
});