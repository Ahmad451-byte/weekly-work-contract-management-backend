import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWeeklyWorkContract1782730187110 implements MigrationInterface {
    name = 'CreateWeeklyWorkContract1782730187110'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`firstName\` varchar(255) NOT NULL, \`lastName\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`weekly_work_contracts\` (\`id\` int NOT NULL AUTO_INCREMENT, \`hoursPerWeek\` decimal(5,2) NOT NULL, \`validFrom\` date NOT NULL, \`validUntil\` date NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` int NULL, INDEX \`IDX_a063d71261a55676bf3e1d993e\` (\`user_id\`, \`validFrom\`, \`validUntil\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`weekly_work_contract_audit\` (\`id\` int NOT NULL AUTO_INCREMENT, \`contractId\` int NOT NULL, \`userId\` int NOT NULL, \`hoursPerWeek\` decimal(5,2) NOT NULL, \`validFrom\` date NOT NULL, \`validUntil\` date NULL, \`action\` enum ('CREATE', 'UPDATE', 'DELETE') NOT NULL, \`version\` int NOT NULL DEFAULT '1', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`weekly_work_contracts\` ADD CONSTRAINT \`FK_b99a2f6e22b8176cd62398c799c\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`weekly_work_contracts\` DROP FOREIGN KEY \`FK_b99a2f6e22b8176cd62398c799c\``);
        await queryRunner.query(`DROP TABLE \`weekly_work_contract_audit\``);
        await queryRunner.query(`DROP INDEX \`IDX_a063d71261a55676bf3e1d993e\` ON \`weekly_work_contracts\``);
        await queryRunner.query(`DROP TABLE \`weekly_work_contracts\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
