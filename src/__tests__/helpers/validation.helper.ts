import { expect } from "@loopback/testlab";
import { Migration } from "../../models";

export const uuidFormat =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateMigration(migration: Migration, expectedMigration: Partial<Migration>) {
    expect(migration.id).to.match(uuidFormat);
    expect(migration.version).to.equal(expectedMigration.version);
    expect(migration.scriptName).to.equal(expectedMigration.scriptName);
    expect(migration.description).to.equal(expectedMigration.description);
    expect(migration.action).to.equal(expectedMigration.action);
    expect(migration.appliedAt).to.be.a.Date();
    expect(migration.changeNumber).to.equal(expectedMigration.changeNumber);
}
