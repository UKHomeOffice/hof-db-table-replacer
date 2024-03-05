// Update with your config settings.
const config = require('./config');

const testConfig = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    database: 'test',
    user: 'postgres',
    password: 'postgres'
  }
};

const localConfig = {
  client: 'postgresql',
  connection: {
    database: config.service.serviceName,
    user: 'postgres',
    password: 'postgres'
  }
};

const remoteConfig = {
  client: 'pg',
  version: '8.11.3',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
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

module.exports = {
  test: setupConfig(testConfig),
  local: setupConfig(localConfig),
  development: setupConfig(remoteConfig),
  production: setupConfig(remoteConfig)
};
