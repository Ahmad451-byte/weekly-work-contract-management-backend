
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { WeeklyWorkContract } from '../entities/weekly-work-contract.entity';
import { WeeklyWorkContractService } from '../service/weekly-work-contract.service';
import { CreateWeeklyWorkContractInput } from '../dto/create-weekly-work-contract.input';
import { UpdateWeeklyWorkContractInput } from '../dto/update-weekly-work-contract.input';

@Resolver(() => WeeklyWorkContract)
export class WeeklyWorkContractResolver {

  constructor(
    private readonly contractService: WeeklyWorkContractService,
  ) {}

  @Mutation(() => WeeklyWorkContract)
  async createWeeklyWorkContract(
    @Args('input') input: CreateWeeklyWorkContractInput,
  ): Promise<WeeklyWorkContract> {

    return this.contractService.create(
      input.userId,
      input.hoursPerWeek,
      input.validFrom,
      input.validUntil,
    );
  }

  @Query(() => [WeeklyWorkContract])
  async weeklyWorkContracts(
    @Args('userId', { type: () => Int }) userId: number,
  ): Promise<WeeklyWorkContract[]> {

    return this.contractService.findAll(userId);
  }

  @Query(() => WeeklyWorkContract, {
    nullable: true,
  })
  async activeWeeklyWorkContract(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('date') date: Date,
  ): Promise<WeeklyWorkContract | null> {

    return this.contractService.findActive(userId, date);
  }

  @Mutation(() => WeeklyWorkContract)
  async updateWeeklyWorkContract(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateWeeklyWorkContractInput,
  ): Promise<WeeklyWorkContract> {
    return this.contractService.update(id, input);
  }

  @Mutation(() => Boolean)
  async deleteWeeklyWorkContract(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {

    await this.contractService.delete(id);

    return true;
  }

}