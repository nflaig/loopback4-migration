import { migrationData } from "../../fixtures/data";
import { Migration } from "../../../models";
import { validateMigration } from "../../helpers/validation.helper";
import { givenMigrationExists } from "../../helpers";
import { expect } from "@loopback/testlab";
import { Entity } from "@loopback/repository";

describe("Migration (unit)", () => {
    it("should inherit from Entity", () => {
        const migration = new Migration();

        expect(migration).to.be.instanceOf(Entity);
    });

    it("should have properties set in constructor and generate default properties", async () => {
        const migration = await givenMigrationExists();

        validateMigration(migration, migrationData);
    });
});
