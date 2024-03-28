/* eslint-disable no-console */
const config = require('../../config');
const { targetTable, sourceFileTable } = config.service;

const logger = require('../../lib/logger')({ env: config.env });

module.exports = class PgpModel {
  constructor() {
    this.requestTimeout = config.requestTimeout;
    this.targetTable = targetTable;
    this.sourceFileTable = sourceFileTable;

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
};
