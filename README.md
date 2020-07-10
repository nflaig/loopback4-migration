# loopback4-migration

[![Actions Status](https://github.com/nflaig/loopback4-migration/workflows/build/badge.svg)](https://github.com/nflaig/loopback4-migration/actions)
[![Coverage Status](https://coveralls.io/repos/github/nflaig/loopback4-migration/badge.svg?branch=master)](https://coveralls.io/github/nflaig/loopback4-migration?branch=master)
[![Dependencies Status](https://david-dm.org/nflaig/loopback4-migration/status.svg)](https://david-dm.org/nflaig/loopback4-migration)

[![Latest version](https://img.shields.io/npm/v/loopback4-migration.svg?style=flat-square)](https://www.npmjs.com/package/loopback4-migration)
[![License](https://img.shields.io/github/license/nflaig/loopback4-migration.svg?color=blue&label=License&style=flat-square)](https://github.com/nflaig/loopback4-migration/blob/master/LICENSE)
[![Downloads](https://img.shields.io/npm/dw/loopback4-migration.svg?label=Downloads&style=flat-square&color=blue)](https://www.npmjs.com/package/loopback4-migration)
[![Total Downloads](https://img.shields.io/npm/dt/loopback4-migration.svg?label=Total%20Downloads&style=flat-square&color=blue)](https://www.npmjs.com/package/loopback4-migration)

Migration component that can be used by all applications build with Loopback 4 to manage migration tasks
such as database updates.

It provides a common interface to implement custom migration scripts and automatically handles
the versioning of the database and the execution of the scripts based on the application version
compared to the database version.

## Prerequisites

Some dependencies need to have at least a certain version

```sh
@loopback/core >=2.8.0
@loopback/repository >=2.5.0
```

and the application needs to have the `RepositoryMixin` applied and to automatically discover the
application version and the migration scripts the `BootMixin` is required although there is the option
of ([manual configuration](#configuration)).

 ```ts
 class MyApplication extends BootMixin(RepositoryMixin(Application)) {}
 ```

## Installation

```sh
npm install loopback4-migration
```

### Bind the component in `application.ts`

This will add the required model, repository and further artifacts to the application. By default,
the module will use the existing data source of the application to create and keep track of the
applied migrations. It will also automatically discover the version of the application based on the
`package.json` file. The data source and the version of application can also be manually configured,
see [Configuration](#update-default-values).

```ts
import { MigrationComponent } from "loopback4-migration";

export class MyApplication extends BootMixin(
    ServiceMixin(RepositoryMixin(RestApplication))
) {
    constructor(options?: ApplicationConfig) {
        super(options);

        // ...

        // Bind migration component related elements
        this.component(MigrationComponent);

        // ...
    }
}
```

## Usage

The custom migration scripts need to implement the `MigrationScript` interface. The `version` and the
`up()` method to handle database upgrades always need to be specifed. Optionally, a `scriptName` and
a `description` can be set. In addition, if required and technically possible the `down()` method can
be implemented which will be used to handle downgrades of the database.

**Note:** downgrading the database to an earlier version might not be possible in all cases and should
be considered as an edge case. Sometimes it is just impossible to revert the upgrade logic or in other
cases it might not even be required becasue the upgrade changes are backwards compatible. In any case,
it is recommended to create a database backup before updating the database.

Migration scripts added to `src/migrations` with the file naming convention `<scriptname>.migration.ts`
are automatically discovered and registered when the application is booted.
It is also possible to [manually add migration scripts](#update-default-values) from different locations
or change the default directory and naming convention, see [Configuration](#update-directory-and-naming-convention).

Another option is to use the `@migrationScript` decorator to add the binding tag to the migration script class and
bind it to the application.
The decorator also allows to [configure the scope](https://loopback.io/doc/en/lb4/Binding.html#configure-the-scope)
and add additional [tags](https://loopback.io/doc/en/lb4/Binding.html#configure-the-scope).

**Note:** Each migration script needs to have a unique class name else it will be discarded as a duplicate.

```ts
export interface MigrationScript {
    version: string;
    scriptName?: string;
    description?: string;

    up(): ValueOrPromise<any>;

    down?(): ValueOrPromise<any>;
}
```

## Example

This is an example of a migration script which updates existing products which do not have the `reviews`
property and sets `reviews` to an empty array. This is just a simple example but it allows to make the
assumption in the code that the `reviews` property is always an array and potentially avoids issues.
A downgrade function is not implemented since the update is backwards compatible.

It also utilizes [Dependency Injection](https://loopback.io/doc/en/lb4/Dependency-injection.html)
to retrieve the required dependencies such as [repositories](https://loopback.io/doc/en/lb4/Repositories.html).

The `@migrationScript` decorator would not be required here since the script follows the naming convention
and would be automatically discovered. This is just to show how the decorator could be used.

> src/migrations/1.0.1.migration.ts

```ts
import { MigrationScript, migrationScript } from "loopback4-migration";
import { repository } from "@loopback/repository";
import { ProductRepository } from "../repositories";

@migrationScript()
export class MigrationScript101 implements MigrationScript {
    version = "1.0.1";

    constructor(
        @repository(ProductRepository)
        private productRepository: ProductRepository
    ) {}

    async up(): Promise<void> {
        await this.productRepository.updateAll(
            { reviews: [] },
            { reviews: { exists: false } }
        );
    }

    async down(): Promise<void> {
        // write the statements to rollback the migration if required and possible
    }
}
```

## Configuration

The component can be configured in `application.ts` to overwrite the default values.

### Update default values

- `appVersion` - The application version retrieved from `package.json` can either be overwritten with
  this property or by setting the `APPLICATION_VERSION` environment variable. Note that the module
  currently only supports [Semantic Versioning](https://semver.org/).
- `dataSourceName` - The name of the data source which should be used to track the applied migrations.
  This is mostly relevant if the application uses more than one data source.
- `modelName` - The name of the model which will be used as table or collection name to store the applied migrations.
- `migrationScripts` - An array of migration script classes that implement the `MigrationScript` interface.
  Setting the scripts manually is usually not required since they are automatically discovered and bound
  to the application. Duplicate scripts will be removed and not bound to the application.

```ts
import { MigrationBindings } from "loopback4-migration";
import { MongodbDataSource } from "./datasources";
import { MigrationScript101, MigrationScript102, MigrationScript103 } from "./anyfolder";

export class MyApplication extends BootMixin(
    ServiceMixin(RepositoryMixin(RestApplication))
) {
    constructor(options?: ApplicationConfig) {
        super(options);

        // ...

        // Configure migration component
        this.bind(MigrationBindings.CONFIG).to({
            appVersion: "1.0.0",
            dataSourceName: MongodbDataSource.dataSourceName,
            modelName: "AnyName",
            migrationScripts: [MigrationScript101, MigrationScript102, MigrationScript103]
        });

        // ...
    }
}
```

### Update directory and naming convention

It is also possible to update the default directory and file extension by changing the `bootOptions`
of the application.

```ts
this.bootOptions = {
    migrations: {
        dirs: ["anyfolder"],
        extensions: [".any.extension"],
        nested: true
    }
};
```

## Contributing

[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/nflaig/loopback4-migration/issues)

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
