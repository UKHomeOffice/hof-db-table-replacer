/* eslint-disable no-console */
const config = require('../../config');
const { serviceName, targetTable, sourceFileTable } = config.service;
const { insertBatchSize } = config.db;
const { targetColumns } = require(`../../services/${serviceName}/config`);

const logger = require('../../lib/logger')({ env: config.env });

module.exports = class KnexPostgresModel {
  constructor() {
    this.requestTimeout = config.requestTimeout;
    this.targetTable = targetTable;
    this.sourceFileTable = sourceFileTable;
    this.targetColumns = targetColumns;

    this.notifyModel = () => logger.log('info', 'Using Knex...');
    this.notifyModel();
  }

  async getLatestUrl(knex) {
    try {
      const result = await knex.select('url', 'created_at')
        .from(this.sourceFileTable)
        .orderBy('id', 'desc')
        .limit(1)
        .timeout(this.requestTimeout);
      return result[0];
    } catch (error) {
      logger.log('error', 'Error retrieving CSV URL');
      throw new Error('Error retrieving CSV URL', { cause: error });
    }
  }

  async dropTempLookupTable(knex) {
    try {
      await knex.schema.dropTableIfExists(`${this.targetTable}_tmp`);
    } catch (error) {
      logger.log('error', 'Error dropping temporary lookup table');
      throw new Error('Error dropping temporary lookup table', { cause: error });
    }
  }

  async createTempLookupTable(knex) {
    try {
      await knex.schema.createTableLike(`${this.targetTable}_tmp`, this.targetTable);
    } catch (error) {
      logger.log('error', 'Error setting up temporary lookup table');
      throw new Error('Error setting up temporary lookup table', { cause: error });
    }
  }

  async insertRecords(knex, records) {
    try {
      const start = new Date();
      await knex.batchInsert(`${this.targetTable}_tmp`, records, insertBatchSize);
      const complete = new Date();
      const timeDiff = (complete.getTime() - start.getTime());
      logger.log('info', `Total batches: ${Math.ceil(records.length / insertBatchSize)}, Duration: ${timeDiff}`);
    } catch (error) {
      logger.log('error', 'Error during records insert');
      throw new Error('Error during records insert', { cause: error });
    }
  }

  async replaceLookupTable(knex) {
    try {
      await knex.transaction(async trx => {
        await trx.schema.dropTableIfExists(this.targetTable);
        await trx.schema.renameTable(`${this.targetTable}_tmp`, this.targetTable);
      });
    } catch (error) {
      logger.log('error', 'Error during table replacement');
      throw new Error('Error during table replacement', { cause: error });
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
      logger.log('error', 'Error setting up temporary lookup table');
      throw error;
    }
  }

  async insertRecords(knex, records) {
    try {
      const start = new Date();
      await knex.batchInsert(`${this.targetTable}_tmp`, records, insertBatchSize);
      const complete = new Date();
      const timeDiff = (complete.getTime() - start.getTime());
      logger.log('info', `Total batches: ${Math.ceil(records.length / insertBatchSize)}, Duration: ${timeDiff}`);
    } catch (error) {
      logger.log('error', 'Error during records insert');
      throw error;
    }
  }

  async replaceLookupTable(knex) {
    try {
      await knex.transaction(async trx => {
        await trx.schema.dropTableIfExists(this.targetTable);
        await trx.schema.renameTable(`${this.targetTable}_tmp`, this.targetTable);
      });
    } catch (error) {
      logger.log('error', 'Error during table replacement');
      throw error;
    }
  }
};
