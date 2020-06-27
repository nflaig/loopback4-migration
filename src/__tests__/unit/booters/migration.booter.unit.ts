import { expect, TestSandbox } from "@loopback/testlab";
import { resolve } from "path";
import { MigrationBindings, MigrationTags } from "../../../keys";
import { TestApplication, getApplication } from "../../helpers";
import { MigrationBooter, MigrationDefaults } from "../../../booters";

describe("MigrationBooter (unit)", () => {
    const sandbox = new TestSandbox(resolve(__dirname, "../../.sandbox"));
    let app: TestApplication;

    beforeEach(resetSandbox);
    beforeEach(givenApplication);

    after(resetSandbox);

    describe("constructor()", () => {
        it("should use MigrationDefaults as options if none are given", () => {
            const migrationBooter = new MigrationBooter(app, sandbox.path);

            expect(migrationBooter.options).to.deepEqual(MigrationDefaults);
        });

        it("should overwrite defaults with provided options and uses defaults for the rest", () => {
            const options = {
                dirs: ["test"],
                extensions: [".ext1"]
            };
            const expected = Object.assign({}, options, {
                nested: MigrationDefaults.nested
            });

            const migrationBooter = new MigrationBooter(app, sandbox.path, options);

            expect(migrationBooter.options).to.deepEqual(expected);
        });
    });

    describe("load()", () => {
        it("should bind migration scripts during the load phase", async () => {
            const expected = [`${MigrationBindings.MIGRATION_SCRIPTS}.MigrationScript`];
            await sandbox.copyFile(
                resolve(__dirname, "../../fixtures/artifacts/migration-script.artifact.js")
            );
            const migrationBooter = new MigrationBooter(app, sandbox.path);
            migrationBooter.discovered = [resolve(sandbox.path, "migration-script.artifact.js")];

            await migrationBooter.load();

            const migrationScripts = app.findByTag(MigrationTags.MIGRATION_SCRIPT);
            const keys = migrationScripts.map(binding => binding.key);

            expect(keys).to.have.lengthOf(1);
            expect(keys.sort()).to.eql(expected.sort());
        });

        it("should not bind classes that are invalid migration scripts", async () => {
            await sandbox.copyFile(
                resolve(__dirname, "../../fixtures/artifacts/invalid-script.artifact.js")
            );
            const migrationBooter = new MigrationBooter(app, sandbox.path);
            migrationBooter.discovered = [resolve(sandbox.path, "invalid-script.artifact.js")];

            await migrationBooter.load();

            const migrationScripts = app.findByTag(MigrationTags.MIGRATION_SCRIPT);
            const keys = migrationScripts.map(binding => binding.key);

            expect(keys).to.have.lengthOf(0);
        });
    });

    async function resetSandbox() {
        await sandbox.reset();
    }

    function givenApplication() {
        app = getApplication();
    }
});
