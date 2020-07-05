import { Migration } from "../../../models";
import { MigrationAction } from "../../../types";

export const migrationData: Partial<Migration> = {
    version: "1.0.0",
    scriptName: "test",
    description: "test",
    action: MigrationAction.Upgrade,
    changeNumber: 1
};
