'use strict';

module.exports = {
  env: process.env.NODE_ENV || 'local',
  requestTimeout: +process.env.REQUEST_TIMEOUT || 1000,
  dbModel: process.env.DB_MODEL || 'postgres-model',
  service: {
    serviceName: process.env.SERVICE_NAME,
    targetTable: process.env.TARGET_TABLE,
    sourceFileTable: process.env.SOURCE_FILE_TABLE
  },
  keycloak: {
    tokenUrl: process.env.KEYCLOAK_TOKEN_URL,
    username: process.env.KEYCLOAK_USERNAME,
    password: process.env.KEYCLOAK_PASSWORD,
    clientId: process.env.KEYCLOAK_CLIENT_ID,
    secret: process.env.KEYCLOAK_SECRET
  },
  notify: {
    notifyKey: process.env.NOTIFY_KEY || 'test-key',
    caseworkerEmail: process.env.CASEWORKER_EMAIL
  }
};
