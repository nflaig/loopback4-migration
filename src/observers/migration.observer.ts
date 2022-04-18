import { lifeCycleObserver, LifeCycleObserver, service } from "@loopback/core";
import debugFactory from "debug";
import { MigrationTags } from "../keys";
import { MigrationService } from "../services";

const debug = debugFactory("loopback:migration:observer");

@lifeCycleObserver(MigrationTags.MIGRATION)
export class MigrationObserver implements LifeCycleObserver {
    constructor(
        @service(MigrationService)
        protected migrationService: MigrationService
    ) {}

    async start(): Promise<void> {
        debug("Invoked migration lifecycle observer");

        await this.migrationService.migrate();
    }
}
