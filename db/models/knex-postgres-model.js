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

  async replaceTable(knex, records) {
    try {
      await knex.schema.dropTableIfExists(`${targetTable}_tmp`);
      await knex.schema.createTable(`${targetTable}_tmp`, table => {
        table.increments();
        table.string('cepr').notNullable();
        table.string('dob').notNullable();
        table.string('dtr').notNullable();
        table.timestamps(true, true);
      });
      const ceprs = await knex
        .batchInsert(`${targetTable}_tmp`, records)
        .returning('cepr')
      await knex.schema.dropTableIfExists(targetTable);
      await knex.schema.renameTable(`${targetTable}_tmp`, targetTable);
      return ceprs;
    } catch (error) {
      logger.log('error', 'Error replacing lookup table')
      throw error;
    }
  }
};
