<!-- omit in toc -->
# loopback4-migration

[![Actions Status][build-badge]][actions]
[![Coverage Status][coveralls-badge]][coveralls]

[![Latest version][npm-version-badge]][npm-package]
[![License][license-badge]][license]
[![Downloads][npm-downloads-badge]][npm-package]
[![Total Downloads][npm-total-downloads-badge]][npm-package]

Migration component that can be used by all applications build with LoopBack 4 to manage migration tasks
such as database updates.

It provides a common interface to implement custom migration scripts and automatically handles
the versioning of the database and the execution of the scripts based on the application version
compared to the database version.

<!-- omit in toc -->
## Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Example](#example)
- [Configuration](#configuration)
- [Debug](#debug)
- [Related resources](#related-resources)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

Some dependencies need to be installed as peer dependencies

```sh
@loopback/boot
@loopback/context
@loopback/core
@loopback/repository
```

and the application needs to have the `RepositoryMixin` applied and to automatically discover the
application version and the migration scripts the `BootMixin` is required although there is the option
of [manual configuration](#configuration).

 ```ts
 class MyApplication extends BootMixin(RepositoryMixin(Application)) {}
 ```

## Installation

```sh
npm install loopback4-migration
```

<!-- omit in toc -->
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
`up()` method to handle database upgrades always need to be specified. Optionally, a `scriptName` and
a `description` can be set. In addition, if required and technically possible the `down()` method can
be implemented which will be used to handle downgrades of the database.

**Note:** downgrading the database to an earlier version might not be possible in all cases and should
be considered as an edge case. Sometimes it is just impossible to revert the upgrade logic or in other
cases it might not even be required because the upgrade changes are backwards compatible. In any case,
it is recommended to create a database backup before updating the database.

Migration scripts added to `src/migrations` with the file naming convention `<scriptName>.migration.ts`
are automatically discovered and registered when the application is booted.
It is also possible to [manually add migration scripts](#update-default-values) from different locations
or change the default directory and naming convention, see [Configuration](#update-directory-and-naming-convention).

Another option is to use the `@migrationScript` decorator to add the binding tag to the migration script class and
bind it to the application.
The decorator also allows to [configure the scope][lb4-binding-scope]
and add additional [tags][lb4-binding-tags].

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

This is an example of a migration script which adds the `fullName` property to all existing users
without the property.

It utilizes [Dependency Injection][lb4-dependency-injection] to retrieve the required dependencies
such as [repositories][lb4-repositories].

**Note:** The `@migrationScript` decorator would not be required here since the script follows
the naming convention and would be automatically discovered. This is just to show how the decorator
would be used.

> src/migrations/1.0.1.migration.ts

```ts
import { repository } from "@loopback/repository";
import { MigrationScript, migrationScript } from "loopback4-migration";
import { UserRepository } from "../repositories";

@migrationScript()
export class AddUserFullName implements MigrationScript {
    version = "1.0.1";
    scriptName = AddUserFullName.name;
    description = "add full name to users by combining first and last name";

    constructor(
        @repository(UserRepository)
        private userRepository: UserRepository
    ) {}

    async up(): Promise<void> {
        // retrieve all users without fullName property
        const users = await this.userRepository.find({
            where: { fullName: { exists: false } }
        });

        // add fullName property to each user
        const updateUsers = users.map(user =>
            this.userRepository.updateById(user.id, {
                fullName: `${user.firstName} ${user.lastName}`
            })
        );

        await Promise.all(updateUsers);
    }

    async down(): Promise<void> {
        // remove fullName property from all users
        await this.userRepository.updateAll(<any>{
            $unset: { fullName: 0 }
        });
    }
}
```

## Configuration

The component can be configured in `application.ts` to overwrite the default values.

<!-- omit in toc -->
### Update default values

- `appVersion` - The application version retrieved from `package.json` can either be overwritten with
  this property or by setting the `APPLICATION_VERSION` environment variable. Note that the module
  currently only supports [Semantic Versioning][semantic-versioning].
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

<!-- omit in toc -->
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

## Debug

To enable debug logs set the `DEBUG` environment variable to `loopback:migration:*`, see
[Setting debug strings][lb4-debug-strings] for further details.

## Related resources

- [Evolutionary Database Design][evolutionary-database-design]

## Contributing

[![contributions welcome][contributions-welcome-badge]][issues]

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.

[actions]: https://github.com/nflaig/loopback4-migration/actions
[license]: https://github.com/nflaig/loopback4-migration/blob/master/LICENSE
[issues]: https://github.com/nflaig/loopback4-migration/issues
[coveralls]: https://coveralls.io/github/nflaig/loopback4-migration?branch=master
[npm-package]: https://www.npmjs.com/package/loopback4-migration

[build-badge]: https://github.com/nflaig/loopback4-migration/workflows/build/badge.svg
[coveralls-badge]: https://coveralls.io/repos/github/nflaig/loopback4-migration/badge.svg?branch=master
[npm-version-badge]: https://img.shields.io/npm/v/loopback4-migration.svg?style=flat-square
[npm-downloads-badge]: https://img.shields.io/npm/dw/loopback4-migration.svg?label=Downloads&style=flat-square&color=blue
[npm-total-downloads-badge]: https://img.shields.io/npm/dt/loopback4-migration.svg?label=Total%20Downloads&style=flat-square&color=blue
[license-badge]: https://img.shields.io/github/license/nflaig/loopback4-migration.svg?color=blue&label=License&style=flat-square
[contributions-welcome-badge]: https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat

[lb4-binding-scope]: https://loopback.io/doc/en/lb4/Binding.html#configure-the-scope
[lb4-binding-tags]: https://loopback.io/doc/en/lb4/Binding.html#describe-tags
[lb4-repositories]: https://loopback.io/doc/en/lb4/Repositories.html
[lb4-dependency-injection]: https://loopback.io/doc/en/lb4/Dependency-injection.html
[lb4-debug-strings]: https://loopback.io/doc/en/lb4/Setting-debug-strings.html
[evolutionary-database-design]: https://www.martinfowler.com/articles/evodb.html
[semantic-versioning]: https://semver.org/
