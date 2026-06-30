import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Or,
  Repository,
} from 'typeorm';

import { WeeklyWorkContract } from '../entities/weekly-work-contract.entity';
import {
  WeeklyWorkContractAuditEntry,
  AuditAction,
} from '../entities/weekly-work-contract-audit-entry.entity';
import { User } from '../../user/entities/user.entity';
import { UpdateWeeklyWorkContractInput } from '../dto/update-weekly-work-contract.input';
import { ContractValidationService } from '../validation/contract-validation.service';

const MAX_DATE = new Date('9999-12-31');

@Injectable()
export class WeeklyWorkContractService {
  constructor(
    @InjectRepository(WeeklyWorkContract)
    private readonly contractRepository: Repository<WeeklyWorkContract>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(WeeklyWorkContractAuditEntry)
    private readonly auditRepository: Repository<WeeklyWorkContractAuditEntry>,

    private readonly validation: ContractValidationService,

    private readonly dataSource: DataSource,
  ) {}

  async create(
    userId: number,
    hoursPerWeek: number,
    validFrom: Date,
    validUntil: Date | null = null,
  ): Promise<WeeklyWorkContract> {
    this.validation.validateHours(hoursPerWeek);
    this.validation.validateDateRange(validFrom, validUntil ?? undefined);

    return this.dataSource.transaction(async (manager) => {
      const user = await this.getUserOrThrow(userId, manager);

      await this.ensureNoOverlap(userId, validFrom, validUntil, manager);

      const contract = manager.create(WeeklyWorkContract, {
        user,
        hoursPerWeek,
        validFrom,
        validUntil,
      });

      const saved = await manager.save(contract);

      await this.createAudit(saved, AuditAction.CREATE, manager);

      return saved;
    });
  }

  async update(
    id: number,
    input: UpdateWeeklyWorkContractInput,
  ): Promise<WeeklyWorkContract> {
    return this.dataSource.transaction(async (manager) => {
      const contract = await this.getContractOrThrow(id, manager);

      if (input.hoursPerWeek !== undefined) {
        this.validation.validateHours(input.hoursPerWeek);
        contract.hoursPerWeek = input.hoursPerWeek;
      }

      if (input.validFrom !== undefined) {
        contract.validFrom = input.validFrom;
      }

      if (input.validUntil !== undefined) {
        contract.validUntil = input.validUntil;
      }

      this.validation.validateDateRange(
        contract.validFrom,
        contract.validUntil ?? undefined,
      );

      await this.ensureNoOverlap(
        contract.user.id,
        contract.validFrom,
        contract.validUntil,
        manager,
        contract.id,
      );

      const saved = await manager.save(contract);

      await this.createAudit(saved, AuditAction.UPDATE, manager);

      return saved;
    });
  }

  async findAll(userId: number): Promise<WeeklyWorkContract[]> {
    return this.contractRepository.find({
      where: {
        user: { id: userId },
      },
      order: {
        validFrom: 'ASC',
      },
      relations: {
        user: true,
      },
    });
  }

  async findActive(
    userId: number,
    date: Date,
  ): Promise<WeeklyWorkContract | null> {
    return this.contractRepository.findOne({
      where: {
        user: { id: userId },
        validFrom: LessThanOrEqual(date),
        validUntil: Or(IsNull(), MoreThanOrEqual(date)),
      },
      relations: {
        user: true,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const contract = await this.getContractOrThrow(id, manager);

      await this.createAudit(contract, AuditAction.DELETE, manager);

      await manager.remove(contract);
    });
  }

  private async createAudit(
    contract: WeeklyWorkContract,
    action: AuditAction,
    manager: EntityManager,
  ): Promise<void> {
    const version = await this.getNextVersion(contract.id, manager);

    const audit = manager.create(WeeklyWorkContractAuditEntry, {
      contractId: contract.id,
      userId: contract.user.id,
      hoursPerWeek: contract.hoursPerWeek,
      validFrom: contract.validFrom,
      validUntil: contract.validUntil,
      action,
      version,
    });

    await manager.save(audit);
  }

  private async getNextVersion(
    contractId: number,
    manager: EntityManager,
  ): Promise<number> {
    const last = await manager.findOne(WeeklyWorkContractAuditEntry, {
      where: { contractId },
      order: { version: 'DESC' },
    });

    return last ? last.version + 1 : 1;
  }

  private async getUserOrThrow(
    userId: number,
    manager: EntityManager,
  ): Promise<User> {
    const user = await manager.findOne(User, {
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  private async getContractOrThrow(
    id: number,
    manager: EntityManager,
  ): Promise<WeeklyWorkContract> {
    const contract = await manager.findOne(WeeklyWorkContract, {
      where: { id },
      relations: { user: true },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found.');
    }

    return contract;
  }

  private async ensureNoOverlap(
    userId: number,
    validFrom: Date,
    validUntil: Date | null,
    manager: EntityManager,
    ignoreId?: number,
  ): Promise<void> {
    const overlap = await this.findOverlap(
      userId,
      validFrom,
      validUntil,
      manager,
      ignoreId,
    );

    if (overlap) {
      throw new BadRequestException(
        'Contract overlaps with an existing contract.',
      );
    }
  }

  private async findOverlap(
    userId: number,
    validFrom: Date,
    validUntil: Date | null,
    manager: EntityManager,
    ignoreId?: number,
  ): Promise<WeeklyWorkContract | null> {
    const qb = manager
      .createQueryBuilder(WeeklyWorkContract, 'contract')
      .leftJoin('contract.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere(
        '(contract.validUntil IS NULL OR contract.validUntil >= :from)',
        { from: validFrom },
      )
      .andWhere('contract.validFrom <= :until', {
        until: validUntil ?? MAX_DATE,
      });

    if (ignoreId) {
      qb.andWhere('contract.id != :ignoreId', { ignoreId });
    }

    return qb.getOne();
  }
}
