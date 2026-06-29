import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
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
  ) {}

  async create(
    userId: number,
    hoursPerWeek: number,
    validFrom: Date,
    validUntil?: Date,
  ): Promise<WeeklyWorkContract> {
    this.validation.validateHours(hoursPerWeek);
    this.validation.validateDateRange(validFrom, validUntil);

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const overlap = await this.findOverlap(userId, validFrom, validUntil);

    if (overlap) {
      throw new BadRequestException(
        'Contract overlaps with an existing contract.',
      );
    }

    const contract = this.contractRepository.create({
      user,
      hoursPerWeek,
      validFrom,
      validUntil: validUntil ?? undefined,
    });

    const saved = await this.contractRepository.save(contract);

    await this.createAudit(saved, AuditAction.CREATE);

    return saved;
  }

  async update(
    id: number,
    input: UpdateWeeklyWorkContractInput,
  ): Promise<WeeklyWorkContract> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: {
        user: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found.');
    }

    if (input.hoursPerWeek !== undefined) {
      this.validation.validateHours(input.hoursPerWeek);
      contract.hoursPerWeek = input.hoursPerWeek;
    }

    if (input.validUntil !== undefined) {
      this.validation.validateDateRange(
        contract.validFrom,
        input.validUntil,
      );
      contract.validUntil = input.validUntil;
    }

    const saved = await this.contractRepository.save(contract);

    await this.createAudit(saved, AuditAction.UPDATE);

    return saved;
  }

  async findAll(userId: number): Promise<WeeklyWorkContract[]> {
    return this.contractRepository.find({
      where: {
        user: {
          id: userId,
        },
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
        user: {
          id: userId,
        },
        validFrom: LessThanOrEqual(date),
        validUntil: Or(IsNull(), MoreThanOrEqual(date)),
      },
      relations: {
        user: true,
      },
    });
  }

  async delete(id: number): Promise<void> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: {
        user: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found.');
    }

    await this.createAudit(contract, AuditAction.DELETE);

    await this.contractRepository.remove(contract);
  }

  private async createAudit(
    contract: WeeklyWorkContract,
    action: AuditAction,
  ): Promise<void> {
    const audit = this.auditRepository.create({
      contractId: contract.id,
      userId: contract.user.id,
      hoursPerWeek: contract.hoursPerWeek,
      validFrom: contract.validFrom,
      validUntil: contract.validUntil ?? null,
      action,
      version: 1,
    });

    await this.auditRepository.save(audit);
  }

  private async findOverlap(
    userId: number,
    validFrom: Date,
    validUntil?: Date,
  ): Promise<WeeklyWorkContract | null> {
    return this.contractRepository
      .createQueryBuilder('contract')
      .leftJoin('contract.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere(
        '(contract.validUntil IS NULL OR contract.validUntil >= :from)',
        {
          from: validFrom,
        },
      )
      .andWhere('contract.validFrom <= :until', {
        until: validUntil ?? new Date('9999-12-31'),
      })
      .getOne();
  }
}