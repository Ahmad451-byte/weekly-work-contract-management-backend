import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { WeeklyWorkContractService } from '../../src/weekly-work-contract/service/weekly-work-contract.service';
import { WeeklyWorkContract } from '../../src/weekly-work-contract/entities/weekly-work-contract.entity';
import { WeeklyWorkContractAuditEntry } from '../../src/weekly-work-contract/entities/weekly-work-contract-audit-entry.entity';
import { User } from '../../src/user/entities/user.entity';
import { ContractValidationService } from '../../src/weekly-work-contract/validation/contract-validation.service';

describe('WeeklyWorkContractService', () => {
  let service: WeeklyWorkContractService;

  let contractRepositoryMock: any;
  let userRepositoryMock: any;
  let auditRepositoryMock: any;
  let managerMock: any;
  let dataSourceMock: any;
  let validationMock: any;

  beforeEach(async () => {
    contractRepositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    userRepositoryMock = {
      findOne: jest.fn(),
    };

    auditRepositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
    };

    managerMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    dataSourceMock = {
      transaction: jest.fn(),
    };

    dataSourceMock.transaction.mockImplementation(async (cb: any) => {
      return cb(managerMock);
    });

    validationMock = {
      validateHours: jest.fn(),
      validateDateRange: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeeklyWorkContractService,

        {
          provide: getRepositoryToken(WeeklyWorkContract),
          useValue: contractRepositoryMock,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepositoryMock,
        },
        {
          provide: getRepositoryToken(WeeklyWorkContractAuditEntry),
          useValue: auditRepositoryMock,
        },
        {
          provide: ContractValidationService,
          useValue: validationMock,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get(WeeklyWorkContractService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('rejects invalid hoursPerWeek', async () => {
      validationMock.validateHours.mockImplementation(() => {
        throw new BadRequestException();
      });

      await expect(service.create(1, 0, new Date())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects invalid date range', async () => {
      validationMock.validateDateRange.mockImplementation(() => {
        throw new BadRequestException();
      });

      await expect(
        service.create(1, 40, new Date('2025-02-01'), new Date('2025-01-01')),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws if user not found', async () => {
      validationMock.validateHours.mockReturnValue(undefined);
      validationMock.validateDateRange.mockReturnValue(undefined);

      managerMock.findOne.mockResolvedValue(null);

      await expect(service.create(1, 40, new Date())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws if overlap exists', async () => {
      validationMock.validateHours.mockReturnValue(undefined);
      validationMock.validateDateRange.mockReturnValue(undefined);

      managerMock.findOne.mockResolvedValue({ id: 1 });

      managerMock.createQueryBuilder.mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 99 }),
      });

      await expect(service.create(1, 40, new Date())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('creates contract successfully', async () => {
      const user = { id: 1 };

      validationMock.validateHours.mockReturnValue(undefined);
      validationMock.validateDateRange.mockReturnValue(undefined);

      managerMock.findOne.mockResolvedValue(user);

      managerMock.createQueryBuilder.mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      const contract = {
        id: 1,
        user,
        hoursPerWeek: 40,
        validFrom: new Date(),
        validUntil: null,
      };

      managerMock.create.mockReturnValue(contract);
      managerMock.save.mockResolvedValue(contract);

      const result = await service.create(1, 40, contract.validFrom);

      expect(managerMock.save).toHaveBeenCalled();
      expect(result).toEqual(contract);
    });
  });

  describe('findAll', () => {
    it('returns all contracts', async () => {
      const resultData = [{ id: 1 }];

      contractRepositoryMock.find.mockResolvedValue(resultData);

      const result = await service.findAll(1);

      expect(result).toEqual(resultData);
      expect(contractRepositoryMock.find).toHaveBeenCalled();
    });
  });

  describe('findActive', () => {
    it('returns active contract', async () => {
      contractRepositoryMock.findOne.mockResolvedValue({ id: 1 });

      const result = await service.findActive(1, new Date());

      expect(result).toEqual({ id: 1 });
    });

    it('returns null if not found', async () => {
      contractRepositoryMock.findOne.mockResolvedValue(null);

      const result = await service.findActive(1, new Date());

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('throws if contract not found', async () => {
      managerMock.findOne.mockResolvedValue(null);

      await expect(service.delete(1)).rejects.toThrow(NotFoundException);
    });

    it('deletes contract successfully', async () => {
      const contract = {
        id: 1,
        user: { id: 2 },
        hoursPerWeek: 40,
        validFrom: new Date(),
        validUntil: null,
      };

      managerMock.findOne
        .mockResolvedValueOnce(contract)
        .mockResolvedValueOnce(null);

      managerMock.create.mockReturnValue({});
      managerMock.save.mockResolvedValue({});

      await service.delete(1);

      expect(managerMock.remove).toHaveBeenCalledWith(contract);
    });
  });
});
