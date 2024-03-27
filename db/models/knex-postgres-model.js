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

  async createTempLookupTable(knex) {
    try {
      await knex.schema.dropTableIfExists(`${this.targetTable}_tmp`);
      const string = await knex.schema.createTable(`${this.targetTable}_tmp`, table => {
        table.increments();
        table.string('cepr').notNullable();
        table.string('dob').notNullable();
        table.string('dtr').notNullable();
        table.timestamps(true, true);
      }).toString();
      console.log(string);
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
