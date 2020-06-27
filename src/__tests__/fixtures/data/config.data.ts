import { MigrationConfig } from "../../../types";
import { testdb } from "../datasources";
import { MockMigrationScript } from "../migrations";

export const configData: MigrationConfig = {
    appVersion: "1.0.0",
    dataSourceName: testdb.name,
    migrationScripts: [MockMigrationScript]
};
