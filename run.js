const config = require('./config');

const logger = require('./lib/logger')({ env: config.env });

const client = require(`./db/${config.db.client}`);
const Model = require(`./db/models/${config.db.model}`);
const db = new Model();

function runUpdate() {
  logger.log('info', `Preparing table update for ${config.service.serviceName}`);

  db.getLatestUrl(client)
    .then(url => logger.log('info', `Latest uploaded file is at: ${url}`))
    .catch(error => logger.log('error', 'collecting latest file URL:', error));
}

runUpdate();
