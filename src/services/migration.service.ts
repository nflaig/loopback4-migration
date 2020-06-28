import { BootBindings } from "@loopback/boot";
import {
    bind,
    inject,
    config,
    BindingScope,
    CoreBindings,
    Application,
    Constructor
} from "@loopback/core";
import { repository } from "@loopback/repository";
import { promisify } from "util";
import { resolve } from "path";
import { exists as existsAsync, readFile as readFileAsync } from "fs";
import compareVersions from "compare-versions";
import { MigrationRepository } from "../repositories";
import { MigrationBindings, MigrationTags } from "../keys";
import { MigrationScript, MigrationAction, MigrationConfig, PackageInfo } from "../types";
import { createMigrationScriptBinding } from "../booters";

const exists = promisify(existsAsync);
const readFile = promisify(readFileAsync);

@bind({ scope: BindingScope.TRANSIENT })
export class MigrationService {
    private appVersion: string | undefined;
    private databaseVersion: string | undefined;
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
        this.migrationScripts = await this.initMigrationScripts(
            this.migrationConfig.migrationScripts
        );

        if (!this.migrationScripts.length || !this.appVersion) return;

        const latestMigration = await this.migrationRepository.findLatestMigration();
        this.databaseVersion = latestMigration?.version;
        this.isDowngraded = latestMigration?.action === MigrationAction.Downgrade;

        const isCurrentVersion = !this.isDowngraded && this.databaseVersion === this.appVersion;
        const isLowerVersion = this.isLowerVersion();

        if (isCurrentVersion) return;

        if (isLowerVersion) {
            const upgradeScripts = this.filterUpgradeScripts();
            await this.executeUpgradeScripts(upgradeScripts);
        } else {
            const downgradeScripts = this.filterDowngradeScripts();
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
            await script.up();
            await this.migrationRepository.createMigration(script, MigrationAction.Upgrade);
        }
    }

    private async executeDowngradeScripts(downgradeScripts: MigrationScript[]): Promise<void> {
        for (const script of this.sortMigrationScripts(downgradeScripts).reverse()) {
            if (script.down) {
                await script.down();
                await this.migrationRepository.createMigration(script, MigrationAction.Downgrade);
            }
        }
    }

    private sortMigrationScripts<T extends MigrationScript>(migrationScripts: T[]) {
        return migrationScripts.sort((scriptA: T, scriptB: T) =>
            compareVersions(scriptA.version, scriptB.version)
        );
    }
}
