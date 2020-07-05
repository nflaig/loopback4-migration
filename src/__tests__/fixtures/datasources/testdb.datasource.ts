import { juggler } from "@loopback/repository";

const mongodb = {
    name: "testdb",
    connector: "mongodb",
    host: "localhost",
    port: 27017,
    database: "testdb"
};

const mysql = {
    name: "testdb",
    connector: "mysql",
    host: "localhost",
    port: 3306,
    user: "test",
    password: process.env.MYSQL_PASSWORD,
    database: "testdb",
    insecureAuth: true
};

const postgresql = {
    name: "db",
    connector: "postgresql",
    host: "localhost",
    port: 5432
};

const memory = {
    name: "testdb",
    connector: "memory"
};

export const testdb: juggler.DataSource = new juggler.DataSource(getDataSourceConfig());

function getDataSourceConfig() {
    const { DATASOURCE } = process.env;

    switch (DATASOURCE) {
        case "mongodb":
            return mongodb;
        case "mysql":
            return mysql;
        case "postgresql":
            return postgresql;
        default:
            return memory;
    }
}
