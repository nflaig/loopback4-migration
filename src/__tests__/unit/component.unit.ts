import { expect } from "@loopback/testlab";
import { MigrationComponent } from "../..";
import { Migration } from "../../models";
import { MigrationRepository } from "../../repositories";
import { MigrationService } from "../../services";
import { MigrationObserver } from "../../observers";
import { MigrationBooter } from "../../booters";

describe("MigrationComponent (unit)", () => {
    describe("constructor()", () => {
        let migrationComponent: MigrationComponent;

        beforeEach(() => {
            migrationComponent = new MigrationComponent();
        });

        it("should set all artifacts correctly", async () => {
            expect(migrationComponent.models).to.deepEqual([Migration]);
            expect(migrationComponent.repositories).to.deepEqual([MigrationRepository]);
            expect(migrationComponent.services).to.deepEqual([MigrationService]);
            expect(migrationComponent.lifeCycleObservers).to.deepEqual([MigrationObserver]);
            expect(migrationComponent.booters).to.deepEqual([MigrationBooter]);
        });
    });
});
