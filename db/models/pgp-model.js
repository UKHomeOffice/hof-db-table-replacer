const config = require('../../config');
const { targetTable, sourceFileTable } = config.service;

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
      pgp.one('SELECT url FROM $1~ ORDER BY id DESC LIMIT 1', this.sourceFileTable)
        .then(data => {
          resolve(data.url);
        })
        .catch(error => {
          reject(error);
        });
    });
  };
};
