import { createStubInstance, sinon, StubbedInstanceWithSinonAccessor } from "@loopback/testlab";
import { MigrationService } from "../../../services";
import { MigrationObserver } from "../../../observers";

describe("MigrationObserver (unit)", () => {
    let migrationObserver: MigrationObserver;
    let migrationService: StubbedInstanceWithSinonAccessor<MigrationService>;

    beforeEach(givenStubbedMigrationService);
    beforeEach(givenMigrationObserver);

    describe("start()", () => {
        it("should call the migrate method of the migration service", async () => {
            migrationService.stubs.migrate.resolves();

            await migrationObserver.start();

            sinon.assert.calledOnce(migrationService.stubs.migrate);
        });
    });

    function givenStubbedMigrationService() {
        migrationService = createStubInstance(MigrationService);
    }

    function givenMigrationObserver() {
        migrationObserver = new MigrationObserver(migrationService);
    }
});
