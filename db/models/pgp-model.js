/* eslint-disable no-console */
const config = require('../../config');
const { targetTable, sourceFileTable, targetColumns } = config.service;

const logger = require('../../lib/logger')({ env: config.env });

module.exports = class PgpModel {
  constructor() {
    this.requestTimeout = config.requestTimeout;
    this.targetTable = targetTable;
    this.sourceFileTable = sourceFileTable;
    this.targetColumns = targetColumns;

    this.notifyModel = () => console.log('Using pg-promise...');
    this.notifyModel();
  }

  getLatestUrl(pgp) {
    return new Promise((resolve, reject) => {
      pgp.one('SELECT url, created_at FROM $1~ ORDER BY id DESC LIMIT 1', this.sourceFileTable)
        .then(data => {
          resolve(data.url);
        })
        .catch(error => {
          logger.log('error', 'Error retrieving CSV URL');
          reject(error);
        });
    });
  }

  async createTempLookupTable(pgp) {
    return new Promise((resolve, reject) => {
      pgp.result(
        'DROP TABLE IF EXISTS $1~', `${this.targetTable}_tmp`
      )
      .then(() => {
        pgp.result(
          'CREATE TABLE $1~ ("id" serial primary key, "cepr" varchar(255) not null, "dob" varchar(255) not null, "dtr" varchar(255) not null, "created_at" timestamptz not null default CURRENT_TIMESTAMP, "updated_at" timestamptz not null default CURRENT_TIMESTAMP)',
          `${this.targetTable}_tmp`
        )
      })
      .then((data) => {
        resolve(data);
      })
      .catch(error => {
        logger.log('error', 'Error setting up temporary lookup table')
        reject(error);
      });
    });
  }

  async insertRecords(pgp, records) {
    return new Promise((resolve, reject) => {
      const cs = new pgp.$config.pgp.helpers.ColumnSet(this.targetColumns, {table: `${this.targetTable}_tmp`});
      const insert = pgp.$config.pgp.helpers.insert(records, cs);
      pgp.none(insert)
      .then(() => {
        resolve();
      })
      .catch(error => {
        logger.log('error', 'Error during records insert')
        reject(error);
      });
    });
  }

  async replaceLookupTable(pgp) {
    return new Promise((resolve, reject) => {
      pgp.result(
        'DROP TABLE IF EXISTS $1~', `${this.targetTable}`
      )
      .then(() => {
        pgp.result(
          'ALTER TABLE $1~ RENAME TO $2~',
          [`${this.targetTable}_tmp`, this.targetTable]
        )
      })
      .then((data) => {
        resolve(data);
      })
      .catch(error => {
        logger.log('error', 'Error during table replacement')
        reject(error);
      });
    });
  }
};
