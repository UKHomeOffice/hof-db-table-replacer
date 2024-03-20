/* eslint-disable no-console */
const config = require('../../config');
const { targetTable, sourceFileTable } = config.service;

const logger = require('../../lib/logger')({ env: config.env });

module.exports = class KnexPostgresModel {
  constructor() {
    this.requestTimeout = config.requestTimeout;
    this.targetTable = targetTable;
    this.sourceFileTable = sourceFileTable;

    this.notifyModel = () => console.log('Using Knex...');
    this.notifyModel();
  }

  async getLatestUrl(knex) {
    try {
      const result = await knex.select('url', 'created_at')
        .from(this.sourceFileTable)
        .orderBy('id', 'desc')
        .limit(1)
        .timeout(this.requestTimeout);
      return result[0].url;
    } catch (error) {
      logger.log('error', 'Error retrieving CSV URL');
      throw error;
    }
  }
};
