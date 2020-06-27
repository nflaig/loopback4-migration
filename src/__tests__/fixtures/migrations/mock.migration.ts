import { MigrationScript } from "../../../types";
import { migrationData } from "../data";
import { migrationScript } from "../../../decorators";

@migrationScript()
export class MockMigrationScript implements MigrationScript {
    version = migrationData.version as string;

    up() {}

    down() {}
}
