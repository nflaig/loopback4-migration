import { juggler } from "@loopback/repository";

const dataSources = [
    {
        name: "mongodb",
        connector: "mongodb",
        host: "localhost",
        port: 27017,
        database: "testdb"
    },
    {
        name: "mysql",
        connector: "mysql",
        host: "localhost",
        port: 3306,
        user: "test",
        password: process.env.MYSQL_PASSWORD,
        database: "testdb"
    },
    {
        name: "postgresql",
        connector: "postgresql",
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        user: "test",
        password: process.env.POSTGRESQL_PASSWORD,
        database: "testdb"
    },
    {
        name: "memory",
        connector: "memory"
    }
];

export const testdb: juggler.DataSource = new juggler.DataSource(getDataSourceConfig());

function getDataSourceConfig() {
    const dataSourceName = process.env.DATASOURCE ?? "memory";

    return dataSources.find(dataSource => dataSource.name === dataSourceName);
}
