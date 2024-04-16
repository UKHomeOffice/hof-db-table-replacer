/* eslint-disable no-console, no-shadow, consistent-return */
const config = require('../../config');
const { serviceName, targetTable, sourceFileTable } = config.service;
const { insertBatchSize } = config.db;
const { targetColumns } = require(`../../services/${serviceName}/config`);

const logger = require('../../lib/logger')({ env: config.env });

module.exports = class PgpModel {
  constructor() {
    this.requestTimeout = config.requestTimeout;
    this.targetTable = targetTable;
    this.sourceFileTable = sourceFileTable;
    this.targetColumns = targetColumns;

    this.notifyModel = () => logger.log('info', 'Using pg-promise...');
    this.notifyModel();
  }

  getLatestUrl(pgp) {
    return new Promise((resolve, reject) => {
      pgp.one('SELECT url, created_at FROM $1~ ORDER BY id DESC LIMIT 1', this.sourceFileTable)
        .then(data => {
          resolve(data);
        })
        .catch(error => {
          logger.log('error', 'Error retrieving data URL');
          reject(new Error('Error retrieving data URL', { cause: error }));
        });
    });
  }

  async dropTempLookupTable(pgp) {
    return new Promise((resolve, reject) => {
      pgp.result('drop table if exists $1~', `${this.targetTable}_tmp`)
        .then(data => {
          resolve(data);
        })
        .catch(error => {
          logger.log('error', 'Error dropping temporary lookup table');
          reject(new Error('Error dropping temporary lookup table', { cause: error }));
        });
    });
  }

  async createTempLookupTable(pgp) {
    return new Promise((resolve, reject) => {
      pgp.result('create table $1~ (LIKE $2~ including all)', [`${this.targetTable}_tmp`, this.targetTable])
        .then(data => {
          resolve(data);
        })
        .catch(error => {
          logger.log('error', 'Error setting up temporary lookup table');
          reject(new Error('Error setting up temporary lookup table', { cause: error }));
        });
    });
  }

  async insertRecords(pgp, records) {
    return new Promise((resolve, reject) => {
      const cs = new pgp.$config.pgp.helpers.ColumnSet(this.targetColumns, {table: `${this.targetTable}_tmp`});
      let index = 0;

      function getNextData(pageIndex) {
        return new Promise(resolve => {
          const batch = records.slice(pageIndex, pageIndex + insertBatchSize);
          if (batch.length) {
            index += insertBatchSize;
            resolve(batch);
          } else resolve(null);
        });
      }

      pgp.tx('massive-insert', t => {
        const processData = data => {
          if (data) {
            const insert = pgp.$config.pgp.helpers.insert(data, cs);
            return t.none(insert);
          }
        };
        return t.sequence(() => getNextData(index).then(processData));
      })
        .then(data => {
          logger.log('info', `Total batches: ${data.total}, Duration: ${data.duration}`);
          resolve();
        })
        .catch(error => {
          logger.log('error', 'Error during records insert');
          reject(new Error('Error during records insert', { cause: error }));
        });
    });
  }

  async replaceLookupTable(pgp) {
    return new Promise((resolve, reject) => {
      pgp.tx('replacement-transaction', t => {
        return t.result('drop table if exists $1~', this.targetTable)
          .then(() => {
            return t.result('alter table $1~ RENAME TO $2~', [`${this.targetTable}_tmp`, this.targetTable]);
          });
      })
        .then(data => {
          resolve(data);
        })
        .catch(error => {
          logger.log('error', 'Error during table replacement');
          reject(new Error('Error during table replacement', { cause: error }));
        });
    });
  }

  async dropTempLookupTable(pgp) {
    return new Promise((resolve, reject) => {
      pgp.result('drop table if exists $1~', `${this.targetTable}_tmp`)
        .then(data => {
          resolve(data);
        })
        .catch(error => {
          logger.log('error', 'Error dropping temporary lookup table');
          reject(error);
        });
    });
  }
};
