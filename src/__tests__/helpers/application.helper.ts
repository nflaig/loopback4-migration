import { Application, ApplicationConfig } from "@loopback/core";
import { RepositoryMixin } from "@loopback/repository";
import { testdb } from "../fixtures/datasources";
import { configData } from "../fixtures/data";
import { MigrationComponent } from "../../component";
import { MigrationBindings } from "../../keys";

export class TestApplication extends RepositoryMixin(Application) {
    constructor(options: ApplicationConfig = {}) {
        super(options);

        this.component(MigrationComponent);

        this.bind(MigrationBindings.CONFIG).to(configData);

        this.dataSource(testdb, configData.dataSourceName);
    }
}

export function getApplication(): TestApplication {
    return new TestApplication();
}
