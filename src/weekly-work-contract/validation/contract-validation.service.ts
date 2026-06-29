import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class ContractValidationService {
  validateHours(hours: number) {
    if (hours < 1 || hours > 60) {
      throw new BadRequestException('hoursPerWeek must be between 1 and 60.');
    }
  }

  validateDateRange(from: Date, until?: Date) {
    if (until && from > until) {
      throw new BadRequestException('validFrom must not be after validUntil.');
    }
  }
}
