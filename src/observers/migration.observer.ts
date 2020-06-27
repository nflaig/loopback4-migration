import { service, lifeCycleObserver, LifeCycleObserver } from "@loopback/core";
import { MigrationService } from "../services";
import { MigrationTags } from "../keys";

@lifeCycleObserver(MigrationTags.MIGRATION)
export class MigrationObserver implements LifeCycleObserver {
    constructor(
        @service(MigrationService)
        protected migrationService: MigrationService
    ) {}

    async start(): Promise<void> {
        await this.migrationService.migrate();
    }
}
