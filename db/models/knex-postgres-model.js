/* eslint-disable no-console */
const config = require('../../config');
const { serviceName, targetTable, sourceFileTable } = config.service;
const { targetColumns } = require(`../../services/${serviceName}/config`);

const logger = require('../../lib/logger')({ env: config.env });

module.exports = class KnexPostgresModel {
  constructor() {
    this.requestTimeout = config.requestTimeout;
    this.targetTable = targetTable;
    this.sourceFileTable = sourceFileTable;
    this.targetColumns = targetColumns;

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

  async dropTempLookupTable(knex) {
    try {
      await knex.schema.dropTableIfExists(`${this.targetTable}_tmp`);
    } catch (error) {
      logger.log('error', 'Error dropping temporary lookup table');
      throw error;
    }
  }

  async createTempLookupTable(knex) {
    try {
      await knex.schema.createTableLike(`${this.targetTable}_tmp`, this.targetTable);
    } catch (error) {
      logger.log('error', 'Error setting up temporary lookup table')
      throw error;
    }
  }

  async insertRecords(knex, records) {
    try {
      await knex.batchInsert(`${this.targetTable}_tmp`, records);
    } catch (error) {
      logger.log('error', 'Error during records insert')
      throw error;
    }
  }

  async replaceLookupTable(knex) {
    try {
      await knex.schema.dropTableIfExists(this.targetTable);
      await knex.schema.renameTable(`${this.targetTable}_tmp`, this.targetTable);
    } catch (error) {
      logger.log('error', 'Error during table replacement')
      throw error;
    }
  }
};
