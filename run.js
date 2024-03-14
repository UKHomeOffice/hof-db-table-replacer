const config = require('./config');

const axios = require('axios');
const fs = require('node:fs');
const { parse } = require('csv-parse');

const logger = require('./lib/logger')({ env: config.env });
const fv = require('./lib/file-vault-utils');

const client = require(`./db/${config.db.client}`);
const Model = require(`./db/models/${config.db.model}`);
const db = new Model();

async function runUpdate() {
  logger.log('info', `Preparing table update for ${config.service.serviceName}`);

  try {
    // Get the most recent CSV data URL from RDS
    const dataFileUrl = await db.getLatestUrl(client);

    // Authenticate with Keycloak and receive token
    const fvToken = await fv.auth();

    // Get the full data in one Buffer using URL and token
    // const dataFile = await fv.getFile(dataFileUrl, fvToken);

    // Get the data file as a stream using URL and token
    const response = await axios(fv.getFileConfig(dataFileUrl, fvToken))
    const stream = response.data;

    // Setup CSV parser
    const records = [];
    const parser = parse({ columns: true });

    parser.on('readable', function () {
      let record;
      while ((record = parser.read()) !== null) {
        // validate
        records.push(record);
      }
    });

    parser.on('error', function (error) {
      logger.log('error', err.message);
      throw error;
    });

    // Start streaming data into CSV parser
    // let chunkCounter = 1;
    stream.on('data', async chunk => {
      // chunkCounter++;
      // console.log(`CHUNK ${chunkCounter}:\n`, chunk.toString());
      await parser.write(new Buffer.from(chunk));
    });

    stream.on('end', async () => {
      parser.end();
      console.log(records);
      const writeStream = fs.createWriteStream('cepr-data.json');
      await writeStream.write(JSON.stringify(records));
    });

  } catch (error) {
    logger.log('error', 'error:', error);
  }
}

runUpdate();
