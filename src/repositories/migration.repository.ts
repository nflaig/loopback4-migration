/* eslint-disable indent */
import {
    Application,
    bind,
    BindingScope,
    config,
    CoreBindings,
    filterByTag,
    inject
} from "@loopback/core";
import { DefaultCrudRepository, juggler } from "@loopback/repository";
import debugFactory from "debug";
import { MigrationBindings } from "../keys";
import { Migration, updateMigrationModelName } from "../models";
import { MigrationAction, MigrationConfig, MigrationScript } from "../types";

const debug = debugFactory("loopback:migration:repository");

@bind({ scope: BindingScope.APPLICATION })
export class MigrationRepository extends DefaultCrudRepository<
    Migration,
    typeof Migration.prototype.id
> {
    constructor(
        @inject(CoreBindings.APPLICATION_INSTANCE)
        app: Application,
        @inject(filterByTag("datasource"), { optional: true })
        dataSources: juggler.DataSource[] = [],
        @config({ fromBinding: MigrationBindings.COMPONENT, optional: true })
        migrationConfig: MigrationConfig = {}
    ) {
        let dataSource: juggler.DataSource;

        const { dataSourceName, modelName } = migrationConfig;

        if (dataSourceName) {
            debug("Custom datasource name: %s", dataSourceName);

            const bindingKey = `datasources.${dataSourceName}`;

            debug("Datasource binding key: %s", bindingKey);
            try {
                dataSource = app.getSync<juggler.DataSource>(bindingKey);
            } catch {
                throw new Error(`Did not find data source with name ${dataSourceName}`);
            }
        } else {
            dataSource = dataSources[0];
        }

        if (!dataSource) throw new Error("Did not find any data source");

        debug("Datasource used for storing applied migrations: %s", dataSource.name);

        const modelClass = modelName ? updateMigrationModelName(Migration, modelName) : Migration;

        debug("Migration model class name: %s", modelClass.name);

        super(modelClass, dataSource);
    }

    async findLatestMigration(): Promise<Migration | null> {
        const latestMigration = await this.findOne({
            order: ["changeNumber DESC", "appliedAt DESC"]
        });

        debug("Last applied migration: %j", latestMigration);

        return latestMigration;
    }

    async createMigration(
        script: MigrationScript,
        action: MigrationAction,
        latestChangeNumber: number
    ): Promise<Migration> {
        const createdMigration = await this.create({
            version: script.version,
            scriptName: script.scriptName,
            description: script.description,
            action: action,
            changeNumber: latestChangeNumber + 1
        });

        debug("Created migration record: %j", createdMigration);

        return createdMigration;
    }
}
