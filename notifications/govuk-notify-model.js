const config = require('../config');
const logger = require('../lib/logger')({ env: config.env });

const NotifyClient = require('notifications-node-client').NotifyClient;
const {
  notifyKey,
  caseworkerEmail,
  successTemplateId,
  failureTemplateId
} = config.notifications;
const notifyClient = new NotifyClient(notifyKey);

module.exports = class NotifyModel {
  async sendCaseworkerSuccessNotification(recordsCount, invalidRecords, fileUploadTime, completeTime) {
    const emailProps = {
      csv_uploaded_datetime: this.getDateAndTimeString(fileUploadTime),
      cepr_update_datetime: this.getDateAndTimeString(completeTime),
      records_count: recordsCount,
      has_invalid_records: (invalidRecords.length ? 'yes' : 'no'),
      link_to_file: '',
    };

    if (invalidRecords.length) {
      const invalidRecordsCsv = Buffer.from(this.writeInvalidRecordsToCsv(invalidRecords), 'utf8');
      emailProps.link_to_file = notifyClient.prepareUpload(invalidRecordsCsv, { filename: 'invalid-cepr-records.csv' });
    }

    try {
      return await notifyClient.sendEmail(successTemplateId, caseworkerEmail, {
        personalisation: emailProps
      });
    } catch (error) {
      logger.log('error', error);
    }
  }

  async sendCaseworkerFailureNotification(errorMessage, invalidRecords, fileUploadTime, failureTime) {
    const emailProps = {
      csv_uploaded_datetime: this.getDateAndTimeString(fileUploadTime),
      cepr_update_datetime: this.getDateAndTimeString(failureTime),
      failure_message: errorMessage,
      has_invalid_records: (invalidRecords.length ? 'yes' : 'no'),
      link_to_file: '',
    };

    if (invalidRecords.length) {
      const invalidRecordsCsv = Buffer.from(this.writeInvalidRecordsToCsv(invalidRecords), 'utf8');
      emailProps.link_to_file = notifyClient.prepareUpload(invalidRecordsCsv, { filename: 'invalid-cepr-records.csv' });
    }

    try {
      return await notifyClient.sendEmail(failureTemplateId, caseworkerEmail, {
        personalisation: emailProps
      });
    } catch (error) {
      logger.log('error', error);
    }
  }

  createCsvHeadersFromFirstRecord(invalidRecord) {
    const { record } = invalidRecord;
    return `${Object.keys(record).join(',')},Reasons for invalidity`;
  }

  writeInvalidRecordsToCsv(invalidRecords) {
    const dynamicHeaders = this.createCsvHeadersFromFirstRecord(invalidRecords[0]);
    let csvString = `${dynamicHeaders}\r\n`;

    for (let i=0; i < invalidRecords.length; i++) {
      const { reasons } = invalidRecords[i];
      const stringSizeBytes = Buffer.byteLength(csvString, 'utf8');

      if (stringSizeBytes >= 1999900) {
        logger.log('info', 'Invalid records may exceed max Notify attachment size of 2MB');
        return csvString;
      } else {
        csvString += `${Object.values(invalidRecords[i].record).join(',')},${reasons.join('; ')}\r\n`;
      }
    }
    console.log(csvString);
    return csvString;
  }

  getDateAndTimeString(date) {
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  }
};

