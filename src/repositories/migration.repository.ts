/* eslint-disable indent, no-unused-vars, @typescript-eslint/no-unused-vars */
import { inject, config, CoreBindings, Application, filterByTag } from "@loopback/core";
import {
    DefaultCrudRepository,
    juggler,
    RepositoryBindings,
    RepositoryTags
} from "@loopback/repository";
import { MigrationBindings } from "../keys";
import { Migration, updateMigrationModelName } from "../models";
import { MigrationScript, MigrationAction, MigrationConfig } from "../types";

export class MigrationRepository extends DefaultCrudRepository<
    Migration,
    typeof Migration.prototype.id
> {
    constructor(
        @inject(CoreBindings.APPLICATION_INSTANCE)
        app: Application,
        @inject(filterByTag(RepositoryTags.DATASOURCE), { optional: true })
        dataSources: juggler.DataSource[] = [],
        @config({ fromBinding: MigrationBindings.COMPONENT, optional: true })
        migrationConfig: MigrationConfig = {}
    ) {
        let dataSource: juggler.DataSource;

        const { dataSourceName, modelName } = migrationConfig;

        if (dataSourceName) {
            const bindingKey = `${RepositoryBindings.DATASOURCES}.${dataSourceName}`;
            try {
                dataSource = app.getSync<juggler.DataSource>(bindingKey);
            } catch {
                throw new Error(`Did not find data source with name ${dataSourceName}`);
            }
        } else {
            dataSource = dataSources[0];
        }

        if (!dataSource) throw new Error("Did not find any data source");

        const modelClass = modelName ? updateMigrationModelName(Migration, modelName) : Migration;

        super(modelClass, dataSource);
    }

    async findLatestMigration(): Promise<Migration | null> {
        return this.findOne({ order: ["appliedAt DESC"] });
    }

    async createMigration(script: MigrationScript, action: MigrationAction): Promise<Migration> {
        return this.create({
            version: script.version,
            scriptName: script.scriptName,
            description: script.description,
            action: action
        });
    }
}
