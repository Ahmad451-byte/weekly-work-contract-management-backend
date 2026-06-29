import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

@InputType()
export class CreateWeeklyWorkContractInput {

  @Field(() => Int)
  @IsInt()
  userId: number;

  @Field(() => Float)
  @Min(1)
  @Max(60)
  hoursPerWeek: number;

  @Field()
  @Type(() => Date)
  @IsDate()
  validFrom: Date;

  @Field({
    nullable: true,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validUntil?: Date;
}