const config = require('../config');
const { host, port, user, password, database } = config.db;

// Loading and initializing the library:
const pgp = require('pg-promise')({
  // Initialization Options
});

const connectionStrings = {
  test: `postgres://${user}:${password}@${host}:${port}/test`,
  local: `postgres://${user}:${password}@${host}:${port}/${config.service.serviceName}`,
  development: `postgres://${user}:${password}@${host}:${port}/${database}`,
  production: `postgres://${user}:${password}@${host}:${port}/${database}`
};

// Creating a new database instance from the connection details:
const db = pgp(connectionStrings[config.env]);

// Exporting the database object for shared use:
module.exports = db;
