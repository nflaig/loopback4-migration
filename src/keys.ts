import { CoreBindings } from "@loopback/core";
import { BindingKey } from "@loopback/context";
import { MigrationConfig } from "./types";
import { MigrationComponent } from "./component";

export namespace MigrationBindings {
    export const COMPONENT = BindingKey.create<MigrationComponent>(
        `${CoreBindings.COMPONENTS}.MigrationComponent`
    );

    export const CONFIG = BindingKey.buildKeyForConfig<MigrationConfig | undefined>(COMPONENT);

    export const MIGRATION_SCRIPTS = "migration.scripts";
}

export namespace MigrationTags {
    export const MIGRATION = "migration";

    export const MIGRATION_SCRIPT = "migration.script";
}
