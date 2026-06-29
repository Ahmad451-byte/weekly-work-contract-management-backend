import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateWeeklyWorkContractInput {
  @Field(() => Float)
  hoursPerWeek: number;

  @Field()
  validFrom: Date;

  @Field({ nullable: true })
  validUntil?: Date;
}