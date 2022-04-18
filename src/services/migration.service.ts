import { BootBindings } from "@loopback/boot";
import {
    Application,
    bind,
    BindingScope,
    config,
    Constructor,
    CoreBindings,
    inject
} from "@loopback/core";
import { repository } from "@loopback/repository";
import compareVersions from "compare-versions";
import debugFactory from "debug";
import { exists as existsAsync, readFile as readFileAsync } from "fs";
import { resolve } from "path";
import { promisify } from "util";
import { createMigrationScriptBinding } from "../booters";
import { MigrationBindings, MigrationTags } from "../keys";
import { MigrationRepository } from "../repositories";
import { MigrationAction, MigrationConfig, MigrationScript, PackageInfo } from "../types";

const exists = promisify(existsAsync);
const readFile = promisify(readFileAsync);

const debug = debugFactory("loopback:migration:service");

@bind({ scope: BindingScope.TRANSIENT })
export class MigrationService {
    private appVersion: string | undefined;
    private databaseVersion: string | undefined;
    private latestChangeNumber: number;
    private isDowngraded: boolean;
    private migrationScripts: MigrationScript[];

    constructor(
        @repository(MigrationRepository)
        private migrationRepository: MigrationRepository,
        @inject(CoreBindings.APPLICATION_INSTANCE)
        private app: Application,
        @inject(BootBindings.PROJECT_ROOT)
        private projectRoot: string,
        @config({ fromBinding: MigrationBindings.COMPONENT, optional: true })
        private migrationConfig: MigrationConfig = {}
    ) {}

    async migrate(): Promise<void> {
        this.appVersion = await this.getApplicationVersion();
        debug("Version of application: %s", this.appVersion);
        this.migrationScripts = await this.initMigrationScripts(
            this.migrationConfig.migrationScripts
        );
        debug("Total number of migration scripts: %s", this.migrationScripts.length);

        if (!this.migrationScripts.length || !this.appVersion) return;

        const latestMigration = await this.migrationRepository.findLatestMigration();
        this.databaseVersion = latestMigration?.version;
        debug("Version of database: %s", this.databaseVersion ?? "not initialized");
        this.latestChangeNumber = latestMigration?.changeNumber ?? 0;
        debug("Change number of latest migration: %s", this.latestChangeNumber);
        this.isDowngraded = latestMigration?.action === MigrationAction.Downgrade;

        const isCurrentVersion = !this.isDowngraded && this.databaseVersion === this.appVersion;
        const isLowerVersion = this.isLowerVersion();

        if (isCurrentVersion) {
            debug("Database and application are on same version. No migrations will be executed");
            return;
        }

        if (isLowerVersion) {
            debug("Database is on a lower version than the application");
            const upgradeScripts = this.filterUpgradeScripts();
            if (upgradeScripts.length) {
                debug("Executing %s scripts to upgrade database", upgradeScripts.length);
            } else {
                debug("Did not find any scripts to upgrade database");
            }
            await this.executeUpgradeScripts(upgradeScripts);
        } else {
            debug("Database is on a higher version than the application");
            const downgradeScripts = this.filterDowngradeScripts();
            if (downgradeScripts.length) {
                debug("Executing %s scripts to downgrade database", downgradeScripts.length);
            } else {
                debug("Did not find any scripts to downgrade database");
            }
            await this.executeDowngradeScripts(downgradeScripts);
        }
    }

    private async getApplicationVersion(): Promise<string | undefined> {
        const appVersion = this.migrationConfig.appVersion ?? process.env.APPLICATION_VERSION;
        if (appVersion) return appVersion;

        let packageInfo: PackageInfo | undefined;
        const packagePath = resolve(this.projectRoot, "../package.json");

        if (await exists(packagePath)) {
            const fileContent = await readFile(packagePath, "utf8");
            packageInfo = JSON.parse(fileContent);
        }

        return packageInfo?.version;
    }

    private async initMigrationScripts(
        migrationScripts: Constructor<MigrationScript>[] = []
    ): Promise<MigrationScript[]> {
        const scripts: MigrationScript[] = [];

        const migrationScriptBindings = this.app.findByTag(MigrationTags.MIGRATION_SCRIPT);

        // instantiate scripts bound by the booter
        for (const binding of migrationScriptBindings) {
            const instantiatedScript = await this.app.get<MigrationScript>(binding.key);
            scripts.push(instantiatedScript);
        }

        // instantiate scripts provided in config
        for (const script of migrationScripts) {
            const binding = createMigrationScriptBinding(script);

            if (this.app.isBound(binding.key)) continue;

            this.app.add(binding);

            const instantiatedScript = await this.app.get<MigrationScript>(binding.key);
            scripts.push(instantiatedScript);
        }

        return scripts;
    }

    private isLowerVersion(): boolean {
        if (!this.databaseVersion) {
            return true;
        }
        const operator = this.isDowngraded ? "<=" : "<";
        return compareVersions.compare(this.databaseVersion, <string>this.appVersion, operator);
    }

    private filterUpgradeScripts(): MigrationScript[] {
        return this.migrationScripts.filter(script => {
            if (compareVersions.compare(script.version, <string>this.appVersion, ">")) {
                return false;
            }
            if (!this.databaseVersion) {
                return true;
            }
            const operator = this.isDowngraded ? ">=" : ">";
            return compareVersions.compare(script.version, this.databaseVersion, operator);
        });
    }

    private filterDowngradeScripts(): MigrationScript[] {
        return this.migrationScripts.filter(script => {
            if (compareVersions.compare(script.version, <string>this.appVersion, "<=")) {
                return false;
            }
            const operator = this.isDowngraded ? "<" : "<=";
            return compareVersions.compare(script.version, <string>this.databaseVersion, operator);
        });
    }

    private async executeUpgradeScripts(upgradeScripts: MigrationScript[]): Promise<void> {
        for (const script of this.sortMigrationScripts(upgradeScripts)) {
            debug("Executing migration script for version %s", script.version);
            await script.up();
            debug("Successfully executed upgrade method of migration script");
            await this.migrationRepository.createMigration(
                script,
                MigrationAction.Upgrade,
                this.latestChangeNumber
            );
            this.incrementChangeNumber();
        }
    }

    private async executeDowngradeScripts(downgradeScripts: MigrationScript[]): Promise<void> {
        for (const script of this.sortMigrationScripts(downgradeScripts).reverse()) {
            if (script.down) {
                debug("Executing migration script for version %s", script.version);
                await script.down();
                debug("Successfully executed downgrade method of migration script");
                await this.migrationRepository.createMigration(
                    script,
                    MigrationAction.Downgrade,
                    this.latestChangeNumber
                );
                this.incrementChangeNumber();
            }
        }
    }

    private sortMigrationScripts<T extends MigrationScript>(migrationScripts: T[]): T[] {
        return migrationScripts.sort((scriptA: T, scriptB: T) =>
            compareVersions(scriptA.version, scriptB.version)
        );
    }

    private incrementChangeNumber(): void {
        this.latestChangeNumber += 1;
    }
}
