import { bind, Binding, BindingSpec } from "@loopback/core";
import { MigrationTags } from "../keys";

export function asMigrationScript<T = unknown>(binding: Binding<T>) {
    return binding.tag(MigrationTags.MIGRATION_SCRIPT);
}

export function migrationScript(...specs: BindingSpec[]) {
    return bind(asMigrationScript, ...specs);
}
