import {
    createStubInstance,
    sinon,
    StubbedInstanceWithSinonAccessor,
    SinonSpy
} from "@loopback/testlab";
import { resolve } from "path";
import { MigrationRepository } from "../../../repositories";
import { MigrationService } from "../../../services";
import { MockMigrationScript } from "../../fixtures/migrations";
import { migrationData } from "../../fixtures/data";
import { MigrationScript, MigrationAction, MigrationConfig } from "../../../types";
import { TestApplication, givenMigration, givenConfigData } from "../../helpers";
import { MigrationBindings } from "../../../keys";

describe("MigrationService (unit)", () => {
    let migrationService: MigrationService;
    let migrationRepository: StubbedInstanceWithSinonAccessor<MigrationRepository>;
    let application: StubbedInstanceWithSinonAccessor<TestApplication>;
    let migrationScript: StubbedInstanceWithSinonAccessor<MigrationScript>;
    const projectRoot = resolve(__dirname, "../../fixtures/artifacts/project_root");

    beforeEach(givenStubbedMigrationScript);
    beforeEach(givenStubbedMigrationRepository);
    beforeEach(givenStubbedApplication);
    beforeEach(() => {
        givenMigrationService();
    });

    describe("migrate()", () => {
        it("should execute the migration script upgrade if no migration exists", async () => {
            migrationRepository.stubs.findLatestMigration.resolves(null);

            await migrationService.migrate();

            sinon.assert.calledOnce(migrationScript.stubs.up);
            sinon.assert.calledOnce(migrationRepository.stubs.createMigration);
        });

        it("should execute the migration script upgrade if the application version is higher than the latest migration version", async () => {
            const latestMigration = givenMigration({ version: "0.0.1" });
            migrationRepository.stubs.findLatestMigration.resolves(latestMigration);

            await migrationService.migrate();

            sinon.assert.calledOnce(migrationScript.stubs.up);
            sinon.assert.calledOnce(migrationRepository.stubs.createMigration);
        });

        it("should execute the migration script upgrade if the latest migration was a downgrade with the same version", async () => {
            const latestMigration = givenMigration({ action: MigrationAction.Downgrade });
            migrationRepository.stubs.findLatestMigration.resolves(latestMigration);

            await migrationService.migrate();

            sinon.assert.calledOnce(migrationScript.stubs.up);
            sinon.assert.calledOnce(migrationRepository.stubs.createMigration);
        });

        it("should not execute the migration script upgrade if the application version is equal to the latest migration version", async () => {
            const latestMigration = givenMigration();
            migrationRepository.stubs.findLatestMigration.resolves(latestMigration);

            await migrationService.migrate();

            sinon.assert.notCalled(migrationScript.stubs.up);
        });

        it("should not execute the migration script upgrade if the application version is lower than the latest migration version", async () => {
            const latestMigration = givenMigration({ version: "1.0.1" });
            migrationRepository.stubs.findLatestMigration.resolves(latestMigration);

            await migrationService.migrate();

            sinon.assert.notCalled(migrationScript.stubs.up);
        });

        it("should execute the migration script downgrade if the application version is lower than the latest migration version", async () => {
            givenMigrationService({ appVersion: "0.9.0" });
            const latestMigration = givenMigration();
            migrationRepository.stubs.findLatestMigration.resolves(latestMigration);

            await migrationService.migrate();

            sinon.assert.calledOnce(migrationScript.stubs.down as SinonSpy);
            sinon.assert.calledOnce(migrationRepository.stubs.createMigration);
        });

        it("should not execute the migration script downgrade if the application version is equal to the latest migration version", async () => {
            const latestMigration = givenMigration();
            migrationRepository.stubs.findLatestMigration.resolves(latestMigration);

            await migrationService.migrate();

            sinon.assert.notCalled(migrationScript.stubs.down as SinonSpy);
        });

        it("should not execute the migration script downgrade if the application version is higher than the latest migration version", async () => {
            const latestMigration = givenMigration({ version: "0.0.1" });
            migrationRepository.stubs.findLatestMigration.resolves(latestMigration);

            await migrationService.migrate();

            sinon.assert.notCalled(migrationScript.stubs.down as SinonSpy);
        });

        it("should not execute the migration script downgrade if the latest migration was a downgrade of the same script", async () => {
            givenMigrationService({ appVersion: "0.9.0" });
            const latestMigration = givenMigration({ action: MigrationAction.Downgrade });
            migrationRepository.stubs.findLatestMigration.resolves(latestMigration);

            await migrationService.migrate();

            sinon.assert.notCalled(migrationScript.stubs.down as SinonSpy);
        });

        it("should not execute the migration script downgrade if the script did not specify the downgrade method", async () => {
            class MigrationScriptWithoutDowngrade implements MigrationScript {
                version = migrationData.version as string;

                up() {}
            }
            application.stubs.get.resolves(new MigrationScriptWithoutDowngrade());
            givenMigrationService({
                appVersion: "0.9.0",
                migrationScripts: [MigrationScriptWithoutDowngrade]
            });
            const latestMigration = givenMigration();
            migrationRepository.stubs.findLatestMigration.resolves(latestMigration);

            await migrationService.migrate();

            sinon.assert.notCalled(migrationRepository.stubs.createMigration);
        });

        it("should not execute the migration script if the application version is undefined", async () => {
            givenMigrationService({ appVersion: undefined });

            await migrationService.migrate();

            sinon.assert.notCalled(migrationScript.stubs.up);
            sinon.assert.notCalled(migrationScript.stubs.down as SinonSpy);
            sinon.assert.notCalled(migrationRepository.stubs.createMigration);
        });

        it("should not execute the migration scripts with a higher version than the application version", async () => {
            givenMigrationService({ appVersion: "0.0.1" });

            await migrationService.migrate();

            sinon.assert.notCalled(migrationScript.stubs.up);
            sinon.assert.notCalled(migrationRepository.stubs.createMigration);
        });

        it("should execute the migration scripts incrementally based on the version", async () => {
            class SecondMigrationScript extends MockMigrationScript {}

            const secondMigrationScript = createStubInstance(MockMigrationScript);
            secondMigrationScript.version = "1.0.1";
            secondMigrationScript.stubs.up.resolves();

            application.stubs.get.onFirstCall().resolves(secondMigrationScript);
            application.stubs.get.onSecondCall().resolves(migrationScript);

            givenMigrationService({
                appVersion: "1.0.1",
                migrationScripts: [SecondMigrationScript, MockMigrationScript]
            });

            await migrationService.migrate();

            sinon.assert.callOrder(migrationScript.stubs.up, secondMigrationScript.stubs.up);
            sinon.assert.calledTwice(migrationRepository.stubs.createMigration);
        });

        it("should retrieve the application version from package.json", async () => {
            givenMigrationService({ appVersion: undefined }, projectRoot);

            await migrationService.migrate();

            sinon.assert.calledOnce(migrationScript.stubs.up);
            sinon.assert.calledOnce(migrationRepository.stubs.createMigration);
        });

        it("should allow to overwrite the application version with an environment variable", async () => {
            process.env.APPLICATION_VERSION = "0.0.1";
            givenMigrationService({ appVersion: undefined });

            await migrationService.migrate();

            sinon.assert.notCalled(migrationScript.stubs.up);
            sinon.assert.notCalled(migrationRepository.stubs.createMigration);

            delete process.env.APPLICATION_VERSION;
        });

        it("should instantiate migration scripts bound by the booter and ignore duplicates", async () => {
            application.stubs.findByTag.returns([
                `${MigrationBindings.MIGRATION_SCRIPTS}.MockMigrationScript` as any
            ]);
            application.stubs.isBound.returns(true);

            await migrationService.migrate();

            sinon.assert.calledOnce(migrationScript.stubs.up);
            sinon.assert.calledOnce(migrationRepository.stubs.createMigration);
        });

        it("should properly execute the migration scripts without providing any configuration", async () => {
            application.stubs.findByTag.returns([
                `${MigrationBindings.MIGRATION_SCRIPTS}.MockMigrationScript` as any
            ]);
            migrationService = new MigrationService(migrationRepository, application, projectRoot);

            await migrationService.migrate();

            sinon.assert.calledOnce(migrationScript.stubs.up);
            sinon.assert.calledOnce(migrationRepository.stubs.createMigration);
        });
    });

    function givenStubbedMigrationScript() {
        migrationScript = createStubInstance(MockMigrationScript);
        migrationScript.version = migrationData.version as string;
        migrationScript.stubs.up.resolves();
        if (migrationScript.stubs.down) {
            migrationScript.stubs.down.resolves();
        }
    }

    function givenStubbedMigrationRepository() {
        migrationRepository = createStubInstance(MigrationRepository);
        migrationRepository.stubs.findLatestMigration.resolves();
        migrationRepository.stubs.createMigration.resolves();
    }

    function givenStubbedApplication() {
        application = createStubInstance(TestApplication);
        application.stubs.bind.returns({ toClass: () => {} } as any);
        application.stubs.get.resolves(migrationScript);
        application.stubs.findByTag.returns([]);
        application.stubs.isBound.returns(false);
        application.stubs.add.returnsArg(0);
    }

    function givenMigrationService(config?: Partial<MigrationConfig>, root = "") {
        const configData = givenConfigData(config);
        migrationService = new MigrationService(migrationRepository, application, root, configData);
    }
});
