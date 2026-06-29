import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WeeklyWorkContract } from './entities/weekly-work-contract.entity';
import { WeeklyWorkContractAuditEntry } from './entities/weekly-work-contract-audit-entry.entity';

import { WeeklyWorkContractService } from './service/weekly-work-contract.service';
import { WeeklyWorkContractResolver } from './resolver/weekly-work-contract.resolver';

import { User } from '../user/entities/user.entity';
import { ContractValidationService } from './validation/contract-validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      WeeklyWorkContract,
      WeeklyWorkContractAuditEntry,
    ]),
  ],
  providers: [
    WeeklyWorkContractService,
    WeeklyWorkContractResolver,
    ContractValidationService,
  ],
  exports: [
    WeeklyWorkContractService,
  ],
})
export class WeeklyWorkContractModule {}