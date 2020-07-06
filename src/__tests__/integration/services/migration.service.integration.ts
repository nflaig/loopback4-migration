import { expect } from "@loopback/testlab";
import { MigrationService } from "../../../services";
import {
    TestApplication,
    getApplication,
    validateMigration,
    givenEmptyDatabase,
    migrationRepository,
    givenMigrationExists,
    migrateSchema,
    omit
} from "../../helpers";
import { configData } from "../../fixtures/data";
import { MigrationScript, MigrationAction } from "../../../types";
import { MockMigrationScript } from "../../fixtures/migrations";

describe("MigrationService (integration)", () => {
    let migrationService: MigrationService;
    let application: TestApplication;
    let migrationScript: MigrationScript;

    before(migrateSchema);

    beforeEach(givenEmptyDatabase);
    beforeEach(givenApplication);
    beforeEach(givenMigrationScript);
    beforeEach(givenMigrationService);

    after(givenEmptyDatabase);

    describe("migrate()", () => {
        it("should create a migration database entry based on the executed script", async () => {
            await migrationService.migrate();

            const [migration] = await migrationRepository.find();

            validateMigration(migration, {
                ...migrationScript,
                action: MigrationAction.Upgrade,
                changeNumber: 1
            });
        });

        it("should not create a migration database entry if no migration was executed", async () => {
            const existingMigration = await givenMigrationExists();

            await migrationService.migrate();

            const migrations = await migrationRepository.find();

            expect(migrations.length).to.equal(1);
            expect(omit(migrations[0], "appliedAt")).to.deepEqual(
                omit(existingMigration, "appliedAt")
            );
        });
    });

    function givenApplication() {
        application = getApplication();
    }

    function givenMigrationScript() {
        migrationScript = new MockMigrationScript();
    }

    function givenMigrationService() {
        migrationService = new MigrationService(migrationRepository, application, "", configData);
    }
});
