const config = require('./config');
const { serviceName, targetTable, sourceFileTable } = config.service;

const Model = require(`./models/${config.dbModel}`);
const knexConfig = require('./knexconfig.js')[config.env];
const knex = require('knex')(knexConfig);

const logger = require('./lib/logger')({ env: config.env });

const db = new Model(knex, targetTable, sourceFileTable);

logger.log('info', `Preparing table update for ${serviceName}`);

db.get()
  .then(result => {
    const records = result;
    logger.log('info', 'First record in DB table:', records[0]);
  })
  .catch(error => logger.log('error', 'Retrieving record:', error));
