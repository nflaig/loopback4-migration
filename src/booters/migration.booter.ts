import { ArtifactOptions, BaseArtifactBooter, BootBindings, booter, isClass } from "@loopback/boot";
import {
    Application,
    BindingScope,
    config,
    Constructor,
    CoreBindings,
    createBindingFromClass,
    inject
} from "@loopback/core";
import debugFactory from "debug";
import { MigrationBindings, MigrationTags } from "../keys";
import { MigrationScript } from "../types";

const debug = debugFactory("loopback:migration:booter");

@booter("migrations")
export class MigrationBooter extends BaseArtifactBooter {
    constructor(
        @inject(CoreBindings.APPLICATION_INSTANCE)
        private app: Application,
        @inject(BootBindings.PROJECT_ROOT)
        public projectRoot: string,
        @config()
        public migrationOptions: ArtifactOptions = {}
    ) {
        super(projectRoot, Object.assign({}, MigrationDefaults, migrationOptions));
    }

    async load() {
        await super.load();

        for (const cls of this.classes) {
            if (!isMigrationScriptClass(cls)) {
                debug("Skipping class %s. Does not implement MigrationScript interface", cls.name);
                continue;
            }

            debug("Found migration script class: %s", cls.name);

            const binding = createMigrationScriptBinding(cls);

            this.app.add(binding);
        }
    }
}

export const MigrationDefaults: ArtifactOptions = {
    dirs: ["migrations"],
    extensions: [".migration.js"],
    nested: true
};

export function createMigrationScriptBinding<T>(cls: Constructor<T>) {
    return createBindingFromClass(cls, {
        namespace: MigrationBindings.MIGRATION_SCRIPTS,
        type: MigrationTags.MIGRATION_SCRIPT,
        defaultScope: BindingScope.SINGLETON
    });
}

export function isMigrationScriptClass(cls: unknown): cls is Constructor<MigrationScript> {
    return isClass(cls) && hasUpMethod(cls);
}

function hasUpMethod(cls: Constructor<any>) {
    return typeof cls.prototype.up === "function";
}
