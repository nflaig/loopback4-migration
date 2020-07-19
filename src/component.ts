import { Component, bind, ContextTags, createServiceBinding } from "@loopback/core";
import { Migration } from "./models";
import { MigrationObserver } from "./observers";
import { MigrationRepository } from "./repositories";
import { MigrationService } from "./services";
import { MigrationBindings } from "./keys";
import { MigrationBooter } from "./booters";

@bind({ tags: { [ContextTags.KEY]: MigrationBindings.COMPONENT.key } })
export class MigrationComponent implements Component {
    models = [Migration];
    repositories = [MigrationRepository];
    lifeCycleObservers = [MigrationObserver];
    booters = [MigrationBooter];
    bindings = [createServiceBinding(MigrationService)];
}
