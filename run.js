const config = require('./config');

const logger = require('./lib/logger')({ env: config.env });

const client = require(`./db/${config.db.client}`);
const Model = require(`./db/models/${config.db.model}`);
const db = new Model();

const fv = require('./lib/file-vault-utils');

const axios = require('axios');
// const { Readable } = require('stream');
const { Readable } = require('node:stream');

async function runUpdate() {
  logger.log('info', `Preparing table update for ${config.service.serviceName}`);

  try {
    const dataFileUrl = await db.getLatestUrl(client);
    const fvToken = await fv.auth();
    // const dataFile = await fv.getFile(dataFileUrl, fvToken);

    const stream = new Readable();
    const response = await axios(fv.getFileConfig(dataFileUrl, fvToken));
    response.data.pipe(stream);

    let counter = 0;
    stream.on('data', chunk => {
      counter++;
      console.log(`CHUNK ${counter}`, chunk.toString());
    })



    stream.on('end', () => {
      logger.log('info', 'complete!')
    });

  } catch (error) {
    logger.log('error', 'error:', error);
  }
}

runUpdate();
