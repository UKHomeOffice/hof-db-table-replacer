'use strict';

module.exports = {
  env: process.env.NODE_ENV,
  requestTimeout: +process.env.REQUEST_TIMEOUT || 1000,
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    client: process.env.DB_CLIENT,
    model: process.env.DB_MODEL,
    insertBatchSize: +process.env.DB_INSERT_BATCH_SIZE || 2000
  },
  service: {
    serviceName: process.env.SERVICE_NAME,
    targetTable: process.env.DB_REPLACER_TARGET_TABLE,
    sourceFileTable: process.env.DB_REPLACER_SOURCE_FILE_TABLE
  },
  keycloak: {
    tokenUrl: process.env.KEYCLOAK_TOKEN_URL,
    username: process.env.KEYCLOAK_USERNAME,
    password: process.env.KEYCLOAK_PASSWORD,
    clientId: process.env.KEYCLOAK_CLIENT_ID,
    secret: process.env.KEYCLOAK_SECRET
  },
  notifications: {
    client: process.env.NOTIFICATIONS_CLIENT,
    model: process.env.NOTIFICATIONS_MODEL,
    notifyKey: process.env.NOTIFY_KEY,
    caseworkerEmail: process.env.CASEWORKER_EMAIL,
    successTemplateId: process.env.DB_REPLACER_SUCCESS_TEMPLATE,
    failureTemplateId: process.env.DB_REPLACER_FAILURE_TEMPLATE
  }
};
