import { BootBindings, BaseArtifactBooter, ArtifactOptions, booter, isClass } from "@loopback/boot";
import {
    config,
    Constructor,
    CoreBindings,
    inject,
    Application,
    createBindingFromClass,
    BindingScope
} from "@loopback/core";
import { MigrationBindings, MigrationTags } from "../keys";
import { MigrationScript } from "../types";

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
            if (!isMigrationScriptClass(cls)) continue;

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
