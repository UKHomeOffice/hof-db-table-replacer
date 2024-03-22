/* eslint-disable no-cond-assign */
const config = require('./config');
const { serviceName } = config.service;
const { targetColumns, validator } = require(`./services/${serviceName}/config`);

const axios = require('axios');
const { parse } = require('csv-parse');

const logger = require('./lib/logger')({ env: config.env });
const fv = require('./lib/file-vault-utils');

const client = require(`./db/${config.db.client}`);
const Model = require(`./db/models/${config.db.model}`);
const db = new Model();

async function runUpdate() {
  if (!serviceName) {
    logger.log('error', 'No service name detected in config');
    return;
  }

  logger.log('info', `Preparing table update for ${serviceName}`);

  try {
    // Log memory usage over time.
    // TODO Remove this before prod
    // setInterval(() => {
    //   logger.log('info', `Used: ${process.memoryUsage().heapUsed / 1024 / 1024}`);
    // }, 50);

    // Get the most recent CSV data URL from RDS
    const dataFileUrl = await db.getLatestUrl(client);

    // Authenticate with Keycloak and receive token
    const fvToken = config.keycloak.tokenUrl ? await fv.auth() : undefined;

    // Get the data file as a stream using URL and token
    const response = await axios(fv.fileRequestConfig(dataFileUrl, fvToken));
    const axiosStream = response.data;

    // Setup CSV parser
    const records = [];
    const invalidRecords = [];
    const parser = parse({ from: 2, trim: true, columns: targetColumns ?? true });

    axiosStream.on('error', error => {
      logger.log('error', `Axios stream error: ${error.message}`);
      throw error;
    });

    axiosStream.on('end', () => {
      parser.end();
    });

    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        // Validate records against any validator functions set in service config.
        const result = validator.records(record);
        if (result.valid) {
          records.push(record);
        } else {
          invalidRecords.push(result);
        }
      }
      // It may also be possble to batch insert from here in chunks rather than load all records into memory.
    });

    parser.on('error', error => {
      logger.log('error', `CSV parsing error: ${error.message}`);
      throw error;
    });

    parser.on('end', async () => {
      // eslint-disable-next-line no-console
      console.log('RECORDS: ', records);
      console.log('INVALID RECORDS: ', invalidRecords);
      // logger.log('info', `Records parsed from rows ${records[0].cepr} to ${records[records.length - 1].cepr}`);
    });

    // Start streaming data from Axios into CSV parser
    axiosStream.pipe(parser);
  } catch (error) {
    logger.log('error', `${error.message}`);
  }
}

runUpdate();
