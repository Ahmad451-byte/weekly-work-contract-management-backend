import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { WeeklyWorkContract } from '../../weekly-work-contract/entities/weekly-work-contract.entity';

@ObjectType()
@Entity('users')
export class User {

  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  firstName: string;

  @Field()
  @Column()
  lastName: string;

  @Field()
  @Column({
    unique: true,
  })
  email: string;

  @Field()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @OneToMany(
    () => WeeklyWorkContract,
    contract => contract.user,
  )
  contracts: WeeklyWorkContract[];
}