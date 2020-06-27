import { MigrationRepository } from "../../repositories";
import { migrationData, configData } from "../fixtures/data";
import { testdb } from "../fixtures/datasources";
import { getApplication } from "./application.helper";
import { Migration } from "../../models";
import { MigrationConfig } from "../../types";

export const migrationRepository = new MigrationRepository(getApplication(), [testdb], configData);

export async function givenEmptyDatabase() {
    await migrationRepository.deleteAll();
}

export function givenMigrationData(data?: Partial<Migration>) {
    return <Migration>{ ...migrationData, ...data };
}

export async function givenMigrationExists(data?: Partial<Migration>) {
    return migrationRepository.create(givenMigrationData(data));
}

export function givenMigration(data?: Partial<Migration>) {
    return new Migration(givenMigrationData(data));
}

export function givenConfigData(data?: Partial<MigrationConfig>) {
    return <MigrationConfig>{ ...configData, ...data };
}
