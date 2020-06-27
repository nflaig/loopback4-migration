import { ValueOrPromise, Constructor } from "@loopback/core";

export interface MigrationScript {
    version: string;
    scriptName?: string;
    description?: string;

    up(): ValueOrPromise<any>;

    down?(): ValueOrPromise<any>;
}

export enum MigrationAction {
    Upgrade = "Upgrade",
    Downgrade = "Downgrade"
}

export type MigrationConfig = {
    appVersion?: string;
    dataSourceName?: string;
    modelName?: string;
    migrationScripts?: Constructor<MigrationScript>[];
};

export type PackageInfo = {
    name: string;
    version: string;
    description: string;
};
