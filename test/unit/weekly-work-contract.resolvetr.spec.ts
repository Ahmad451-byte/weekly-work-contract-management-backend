import { WeeklyWorkContractResolver } from '../../src/weekly-work-contract/resolver/weekly-work-contract.resolver';
import { WeeklyWorkContractService } from '../../src/weekly-work-contract/service/weekly-work-contract.service';

describe('WeeklyWorkContractResolver', () => {
  let resolver: WeeklyWorkContractResolver;

  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findActive: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      delete: jest.fn(),
    };

    resolver = new WeeklyWorkContractResolver(
      service as unknown as WeeklyWorkContractService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWeeklyWorkContract', () => {
    it('calls service.create and returns result', async () => {
      const input = {
        userId: 1,
        hoursPerWeek: 40,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
      };

      const expected = { id: 1 };

      service.create.mockResolvedValue(expected);

      const result = await resolver.createWeeklyWorkContract(input as any);

      expect(service.create).toHaveBeenCalledWith(
        input.userId,
        input.hoursPerWeek,
        input.validFrom,
        input.validUntil,
      );

      expect(result).toEqual(expected);
    });
  });

  describe('weeklyWorkContracts', () => {
    it('returns all contracts for user', async () => {
      const expected = [{ id: 1 }, { id: 2 }];

      service.findAll.mockResolvedValue(expected);

      const result = await resolver.weeklyWorkContracts(1);

      expect(service.findAll).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });

  describe('activeWeeklyWorkContract', () => {
    it('returns active contract', async () => {
      const expected = { id: 1 };

      const date = new Date('2024-01-01');

      service.findActive.mockResolvedValue(expected);

      const result = await resolver.activeWeeklyWorkContract(1, date);

      expect(service.findActive).toHaveBeenCalledWith(1, date);
      expect(result).toEqual(expected);
    });

    it('returns null when none exists', async () => {
      service.findActive.mockResolvedValue(null);

      const result = await resolver.activeWeeklyWorkContract(1, new Date());

      expect(result).toBeNull();
    });
  });

  describe('deleteWeeklyWorkContract', () => {
    it('calls service.delete and returns true', async () => {
      service.delete.mockResolvedValue(undefined);

      const result = await resolver.deleteWeeklyWorkContract(1);

      expect(service.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });
});
