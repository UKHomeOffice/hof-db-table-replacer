const config = require('./config');

const logger = require('./lib/logger')({ env: config.env });

const Model = require(`./db/models/${config.db.model}`);
dbClient = new Model();

function runUpdate(db) {
  logger.log('info', `Preparing table update for ${config.service.serviceName}`);

  db.getLatestUrl()
    .then(url => logger.log('info', `Latest uploaded file is at: ${url}`))
    .catch(error => logger.log('error', 'collecting latest file URL:', error));
}

runUpdate(dbClient);
