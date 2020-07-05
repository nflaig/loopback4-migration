import { expect } from "@loopback/testlab";
import { juggler } from "@loopback/repository";
import {
    givenEmptyDatabase,
    givenMigrationExists,
    validateMigration,
    migrationRepository,
    getApplication,
    migrateSchema,
    omit,
    TestApplication
} from "../../helpers";
import { MockMigrationScript } from "../../fixtures/migrations";
import { testdb } from "../../fixtures/datasources";
import { MigrationAction } from "../../../types";
import { MigrationRepository } from "../../../repositories";

describe("MigrationRepository (integration)", () => {
    let application: TestApplication;

    before(migrateSchema);

    beforeEach(givenEmptyDatabase);
    beforeEach(givenApplication);

    after(givenEmptyDatabase);

    describe("constructor()", () => {
        it("should use the existing data source of the application if no data source name is specified", () => {
            const existingdb = new juggler.DataSource({ name: "existingdb" });

            const repository = new MigrationRepository(application, [existingdb]);

            expect(repository.dataSource).to.equal(existingdb);
        });

        it("should use the data source specified in the configuration", () => {
            const otherdb = new juggler.DataSource({ name: "otherdb" });

            const repository = new MigrationRepository(application, [otherdb, testdb], {
                dataSourceName: testdb.name
            });

            expect(repository.dataSource).to.equal(testdb);
            expect(repository.dataSource).to.not.equal(otherdb);
        });

        it("should use the model name specified in the configuration", () => {
            const modelName = "Test";
            const existingdb = new juggler.DataSource({ name: "existingdb" });
            const repository = new MigrationRepository(application, [existingdb], {
                modelName
            });

            expect(repository.modelClass.name).to.equal(modelName);
            expect(repository.modelClass.modelName).to.equal(modelName);
        });

        it("should throw an error if the data source with the given name does not exist", () => {
            const nonExistingdbName = "nonexistingdb";
            expect(() => {
                new MigrationRepository(application, [], {
                    dataSourceName: nonExistingdbName
                });
            }).to.throwError(`Did not find data source with name ${nonExistingdbName}`);
        });

        it("should throw an error if there are no data sources", () => {
            expect(() => {
                new MigrationRepository(application);
            }).to.throwError("Did not find any data source");
        });
    });

    describe("findLatestMigration()", () => {
        it("should return the latest applied migration", async () => {
            const firstMigration = await givenMigrationExists({ changeNumber: 1 });
            const secondMigration = await givenMigrationExists({ changeNumber: 2 });

            const latestMigration = await migrationRepository.findLatestMigration();

            expect(omit(latestMigration, "appliedAt")).to.not.deepEqual(
                omit(firstMigration, "appliedAt")
            );
            expect(omit(latestMigration, "appliedAt")).to.deepEqual(
                omit(secondMigration, "appliedAt")
            );
        });
    });

    describe("createMigration()", () => {
        it("should create a new migration", async () => {
            const migrationScript = new MockMigrationScript();
            const action = MigrationAction.Downgrade;
            const createdMigration = await migrationRepository.createMigration(
                migrationScript,
                action,
                0
            );

            validateMigration(createdMigration, { ...migrationScript, action, changeNumber: 1 });
        });
    });

    function givenApplication() {
        application = getApplication();
    }
});
