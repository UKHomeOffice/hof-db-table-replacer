/* eslint-disable no-cond-assign */
const config = require('./config');
const { serviceName } = config.service;
const { parseHeadings, validateRecord } = require(`./services/${serviceName}/config`);

const axios = require('axios');
const { parse } = require('csv-parse');

const logger = require('./lib/logger')({ env: config.env });
const fv = require('./lib/file-vault-utils');

const client = require(`./db/${config.db.client}`);
const Model = require(`./db/models/${config.db.model}`);
const db = new Model();

async function runUpdate() {
  try {
    logger.log('info', `Preparing table update for ${serviceName}`);

    // Get the most recent CSV data URL from RDS
    logger.log('info', 'Getting data file location from RDS');
    const dataFileUrl = await db.getLatestUrl(client);

    // Authenticate with Keycloak and receive token
    logger.log('info', 'Getting file retrival token');
    const fvToken = config.keycloak.tokenUrl ? await fv.auth() : undefined;

    // Get the data file as a stream using URL and token
    logger.log('info', 'Connecting to file retrival URL');
    const response = await axios(fv.fileRequestConfig(dataFileUrl, fvToken));
    const axiosStream = response.data;

    // Setup CSV parser
    const invalidRecords = [];
    const parser = parse({ from: 2, trim: true, columns: parseHeadings ?? true });

    axiosStream.on('error', error => {
      logger.log('error', `Axios stream error: ${error.message}`);
      throw error;
    });

    axiosStream.on('end', () => {
      parser.end();
    });

    parser.on('readable', async () => {
      axiosStream.pause();
      const records = [];
      let record;
      while ((record = parser.read()) !== null) {
        // Validate records against function set in service config.
        if (validateRecord) {
          const report = validateRecord(record);
          if (report.valid) {
            records.push(record);
          } else {
            invalidRecords.push(report);
          }
        } else {
          records.push(record);
        }
      }

      console.log('RECORDS: ', records);
      if (records.length) {
        await db.insertRecords(client, records);
      }
      axiosStream.resume();
      // It may also be possble to batch insert from here in chunks rather than load all records into memory.
    });

    parser.on('error', error => {
      logger.log('error', `CSV processing error: ${error.message}`);
      throw error;
    });

    parser.on('end', async () => {
      await db.replaceLookupTable(client);
      console.log('INVALID RECORDS: ', invalidRecords);
      logger.log('info', 'Job complete!');
    });

    // Setup temporary lookup table to receive data
    logger.log('info', 'Preparing temporary lookup table');
    await db.dropTempLookupTable(client);
    await db.createTempLookupTable(client)

    // Start streaming data from Axios into CSV parser
    logger.log('info', 'Streaming CSV data from data file');
    axiosStream.pipe(parser);
  } catch (error) {
    logger.log('error', error);
    return
  }
}

runUpdate();
