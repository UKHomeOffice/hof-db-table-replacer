const config = require('../../config');
const { targetTable, sourceFileTable } = config.service;

module.exports = class KnexPostgresModel {
  constructor() {
    this.requestTimeout = config.requestTimeout;
    this.targetTable = targetTable;
    this.sourceFileTable = sourceFileTable;

    this.notifyModel = () => console.log('Using Knex...');
    this.notifyModel();
  }

  async getLatestUrl(knex) {
    const result = await knex.select('url')
      .from(this.sourceFileTable)
      .orderBy('id', 'desc')
      .limit(1)
      .timeout(this.requestTimeout);
    return result[0].url;
  }
};
