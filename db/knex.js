// Update with your config settings.
const config = require('../config');
const { host, user, password, database } = config.db;

const testConfig = {
  client: 'postgresql',
  connection: {
    host: host,
    database: 'test',
    user: user,
    password: password
  }
};

const localConfig = {
  client: 'postgresql',
  connection: {
    database: config.service.serviceName,
    user: user,
    password: password
  }
};

const remoteConfig = {
  client: 'pg',
  version: '8.11.3',
  connection: {
    host: host,
    user: user,
    password: password,
    database: database
  }
};

const serviceConfig = {};

const poolConfig = {
  pool: {
    min: 0,
    max: 10
  }
};

const setupConfig = conf => Object.assign({}, conf, serviceConfig, poolConfig);

const configOptions = {
  test: setupConfig(testConfig),
  local: setupConfig(localConfig),
  development: setupConfig(remoteConfig),
  production: setupConfig(remoteConfig)
};

const knex = require('knex')(configOptions[config.env]);

module.exports = knex;
