import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { WeeklyWorkContractService } from '../../src/weekly-work-contract/service/weekly-work-contract.service';
import { WeeklyWorkContract } from '../../src/weekly-work-contract/entities/weekly-work-contract.entity';
import {
  WeeklyWorkContractAuditEntry,
  AuditAction,
} from '../../src/weekly-work-contract/entities/weekly-work-contract-audit-entry.entity';
import { User } from '../../src/user/entities/user.entity';

describe('WeeklyWorkContractService', () => {
  let service: WeeklyWorkContractService;

  let contractRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  let userRepository: {
    findOne: jest.Mock;
  };

  let auditRepository: {
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    contractRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    userRepository = {
      findOne: jest.fn(),
    };

    auditRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeeklyWorkContractService,
        {
          provide: getRepositoryToken(WeeklyWorkContract),
          useValue: contractRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(WeeklyWorkContractAuditEntry),
          useValue: auditRepository,
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
      await expect(service.create(1, 0, new Date())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects invalid date range', async () => {
      await expect(
        service.create(1, 40, new Date('2025-02-01'), new Date('2025-01-01')),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.create(1, 40, new Date())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws if overlapping contract exists', async () => {
      userRepository.findOne.mockResolvedValue({ id: 1 });

      jest.spyOn(service as any, 'findOverlap').mockResolvedValue({
        id: 99,
      });

      await expect(service.create(1, 40, new Date())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('creates contract successfully', async () => {
      const user = { id: 1 };

      userRepository.findOne.mockResolvedValue(user);
      jest.spyOn(service as any, 'findOverlap').mockResolvedValue(null);

      const contract = {
        id: 1,
        user,
        hoursPerWeek: 40,
        validFrom: new Date(),
      };

      contractRepository.create.mockReturnValue(contract);
      contractRepository.save.mockResolvedValue(contract);

      auditRepository.create.mockReturnValue({});
      auditRepository.save.mockResolvedValue({});

      const result = await service.create(1, 40, contract.validFrom);

      expect(contractRepository.create).toHaveBeenCalled();
      expect(contractRepository.save).toHaveBeenCalled();
      expect(auditRepository.save).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual(contract);
    });
  });

  describe('findAll', () => {
    it('returns all contracts', async () => {
      const contracts = [{ id: 1 }] as any;

      contractRepository.find.mockResolvedValue(contracts);

      const result = await service.findAll(1);

      expect(result).toEqual(contracts);
      expect(contractRepository.find).toHaveBeenCalled();
    });
  });

  describe('findActive', () => {
    it('returns active contract', async () => {
      contractRepository.findOne.mockResolvedValue({ id: 1 });

      const result = await service.findActive(1, new Date());

      expect(result).toEqual({ id: 1 });
    });

    it('returns null if not found', async () => {
      contractRepository.findOne.mockResolvedValue(null);

      const result = await service.findActive(1, new Date());

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('throws if contract not found', async () => {
      contractRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(1)).rejects.toThrow(NotFoundException);
    });

    it('deletes contract and writes audit', async () => {
      const contract = {
        id: 1,
        user: { id: 2 },
        hoursPerWeek: 40,
        validFrom: new Date(),
        validUntil: null,
      };

      contractRepository.findOne.mockResolvedValue(contract);
      contractRepository.remove.mockResolvedValue(contract);

      auditRepository.create.mockReturnValue({});
      auditRepository.save.mockResolvedValue({});

      await service.delete(1);

      expect(contractRepository.remove).toHaveBeenCalledWith(contract);
      expect(auditRepository.save).toHaveBeenCalled();
    });
  });
});
