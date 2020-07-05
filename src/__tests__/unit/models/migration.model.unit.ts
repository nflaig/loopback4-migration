import { migrationData } from "../../fixtures/data";
import { Migration } from "../../../models";
import { givenMigration } from "../../helpers";
import { expect } from "@loopback/testlab";
import { Entity } from "@loopback/repository";

describe("Migration (unit)", () => {
    it("should inherit from Entity", () => {
        const migration = new Migration();

        expect(migration).to.be.instanceOf(Entity);
    });

    it("should have properties set in constructor", async () => {
        const migration = givenMigration();

        expect(migration.version).to.equal(migrationData.version);
        expect(migration.scriptName).to.equal(migrationData.scriptName);
        expect(migration.description).to.equal(migrationData.description);
        expect(migration.action).to.equal(migrationData.action);
    });
});
