import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

@Entity('weekly_work_contract_audit')
export class WeeklyWorkContractAuditEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contractId: number;

  @Column()
  userId: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  hoursPerWeek: number;

  @Column({ type: 'date' })
  validFrom: Date;

  @Column({ type: 'date', nullable: true })
  validUntil: Date | null;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({ default: 1 })
  version: number;

  @CreateDateColumn()
  createdAt: Date;
}
