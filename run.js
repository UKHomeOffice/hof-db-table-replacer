/* eslint-disable no-cond-assign */
const config = require('./config');
const { serviceName } = config.service;
const { parseHeadings, validateRecord } = require(`./services/${serviceName}/config`);

const { pipeline } = require('node:stream/promises');
const axios = require('axios');
const { parse } = require('csv-parse');

const logger = require('./lib/logger')({ env: config.env });
const fv = require('./lib/file-vault-utils');

const client = require(`./db/${config.db.client}`);
const Model = require(`./db/models/${config.db.model}`);
const db = new Model();

const EmailModel = require(`./notifications/${config.notifications.emailModel}`)
const emailer = new EmailModel();

async function runUpdate() {
  const records = [];
  const jobReport = {
    success: undefined,
    recordsCount: undefined,
    errorMessage: undefined,
    fileUploadTime: undefined,
    jobEndedTime: undefined,
    invalidRecords: []
  };

  try {
    logger.log('info', `Preparing table update for ${serviceName}`);

    // Get the most recent CSV data URL and upload timestamp from RDS
    logger.log('info', 'Getting data file location from RDS');
    const dataFileInfo = await db.getLatestUrl(client);
    if (dataFileInfo) {
      logger.log('info', `Found file uploaded at: ${dataFileInfo.created_at.toString()}`);
      jobReport.fileUploadTime = new Date(dataFileInfo.created_at);
    }

    // Authenticate with Keycloak and receive token
    logger.log('info', 'Getting file retrival token');
    const fvToken = config.keycloak.tokenUrl ? await fv.auth() : undefined;

    // Get the data file as a stream using URL and token
    logger.log('info', 'Connecting to file retrival URL');
    const response = await axios(fv.fileRequestConfig(dataFileInfo.url, fvToken));
    const axiosStream = response.data;

    axiosStream.on('error', error => {
      logger.log('error', `Axios stream error: ${error.message}`);
      throw error;
    });

    // Setup CSV parser
    const parser = parse({ from: 2, trim: true, columns: parseHeadings ?? true });

    parser.on('readable', async () => {
      axiosStream.pause();
      let record;
      while ((record = parser.read()) !== null) {
        // Validate records against function set in service config.
        if (validateRecord) {
          const report = validateRecord(record);
          if (report.valid) {
            records.push(record);
          } else {
            jobReport.invalidRecords.push(report);
          }
        } else {
          records.push(record);
        }
      }
      axiosStream.resume();
    });

    parser.on('error', error => {
      logger.log('error', `CSV processing error: ${error.message}`);
      throw error;
    });

    // Setup temporary lookup table to receive data
    logger.log('info', 'Preparing temporary lookup table');
    await db.dropTempLookupTable(client);
    await db.createTempLookupTable(client);

    // Start streaming data from Axios into CSV parser
    logger.log('info', 'Streaming CSV data from data file');
    await pipeline(axiosStream, parser);
    parser.end();

    if (records.length) {
      logger.log('info', 'Starting record insertion to temp table');
      await db.insertRecords(client, records);
      logger.log('info', 'Replacing main lookup table from new inserts');
      await db.replaceLookupTable(client);
      jobReport.jobEndedTime = new Date();
      jobReport.success = true;
      jobReport.recordsCount = records.length;
      await emailer.sendCaseworkerNotification(jobReport);
    }

    logger.log('info', 'Job complete!');
    console.log('INVALID RECORDS: ', jobReport.invalidRecords);
  } catch (error) {
    logger.log('error', error);
    logger.log('info', 'Dropping temporary lookup table');
    await db.dropTempLookupTable(client);
    jobReport.jobEndedTime = new Date();
    jobReport.success = false;
    jobReport.errorMessage = error.message;
    await emailer.sendCaseworkerNotification(jobReport);
  }
}

runUpdate();
