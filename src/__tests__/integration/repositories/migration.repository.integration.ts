import { expect } from "@loopback/testlab";
import { juggler } from "@loopback/repository";
import {
    givenEmptyDatabase,
    givenMigrationExists,
    validateMigration,
    migrationRepository,
    getApplication,
    migrateSchema
} from "../../helpers";
import { MockMigrationScript } from "../../fixtures/migrations";
import { testdb } from "../../fixtures/datasources";
import { MigrationAction } from "../../../types";
import { MigrationRepository } from "../../../repositories";

describe("MigrationRepository (integration)", () => {
    before(migrateSchema);

    beforeEach(givenEmptyDatabase);

    after(givenEmptyDatabase);

    describe("constructor()", () => {
        it("should use the existing data source of the application if no data source name is specified", () => {
            const existingdb = new juggler.DataSource({ name: "existingdb" });

            const repository = new MigrationRepository(getApplication(), [existingdb]);

            expect(repository.dataSource).to.equal(existingdb);
        });

        it("should use the data source specified in the configuration", () => {
            const otherdb = new juggler.DataSource({ name: "otherdb" });

            const repository = new MigrationRepository(getApplication(), [otherdb, testdb], {
                dataSourceName: testdb.name
            });

            expect(repository.dataSource).to.equal(testdb);
            expect(repository.dataSource).to.not.equal(otherdb);
        });

        it("should use the model name specified in the configuration", () => {
            const modelName = "Test";
            const existingdb = new juggler.DataSource({ name: "existingdb" });
            const repository = new MigrationRepository(getApplication(), [existingdb], {
                modelName
            });

            expect(repository.modelClass.name).to.equal(modelName);
            expect(repository.modelClass.modelName).to.equal(modelName);
        });

        it("should throw an error if the data source with the given name does not exist", () => {
            const nonExistingdbName = "nonexistingdb";
            expect(() => {
                new MigrationRepository(getApplication(), [], {
                    dataSourceName: nonExistingdbName
                });
            }).to.throwError(`Did not find data source with name ${nonExistingdbName}`);
        });

        it("should throw an error if there are no data sources", () => {
            expect(() => {
                new MigrationRepository(getApplication());
            }).to.throwError("Did not find any data source");
        });
    });

    describe("findLatestMigration()", () => {
        it("should return the latest applied migration", async () => {
            const firstMigration = await givenMigrationExists();
            const secondMigration = await givenMigrationExists();

            const latestMigration = await migrationRepository.findLatestMigration();

            expect(latestMigration).to.not.deepEqual(firstMigration);
            expect(latestMigration).to.deepEqual(secondMigration);
        });
    });

    describe("createMigration()", () => {
        it("should create a new migration", async () => {
            const migrationScript = new MockMigrationScript();
            const action = MigrationAction.Downgrade;
            const createdMigration = await migrationRepository.createMigration(
                migrationScript,
                action
            );

            validateMigration(createdMigration, { ...migrationScript, action });
        });
    });
});
