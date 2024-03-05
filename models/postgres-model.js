/* eslint-disable max-len */
const config = require('../config');

module.exports = class PostgresModel {
  constructor(knex, targetTable, sourceFileTable) {
    this.requestTimeout = config.requestTimeout;
    this.knex = knex;
    this.targetTable = targetTable;
    this.sourceFileTable = sourceFileTable;
  }

  get() {
    return this.knex.select('*')
      .from(this.targetTable)
      .timeout(this.requestTimeout);
  }
};
