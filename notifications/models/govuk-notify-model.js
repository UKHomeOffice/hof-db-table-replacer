/* eslint-disable consistent-return */
const config = require('../../config');
const logger = require('../../lib/logger')({ env: config.env });
const {
  caseworkerEmail,
  successTemplateId,
  failureTemplateId
} = config.notifications;

module.exports = class NotifyModel {
  async sendCaseworkerNotification(client, jobReport) {
    const {
      success,
      recordsCount,
      errorMessage,
      fileUploadTime,
      jobEndedTime,
      invalidRecords
    } = jobReport;

    const emailProps = {
      csv_uploaded_datetime: this.getDateAndTimeString(fileUploadTime),
      cepr_update_datetime: this.getDateAndTimeString(jobEndedTime),
      has_invalid_records: (invalidRecords.length ? 'yes' : 'no'),
      link_to_file: ''
    };
    let templateId;
    if (success) {
      emailProps.records_count = recordsCount;
      templateId = successTemplateId;
    } else {
      emailProps.failure_message = errorMessage;
      templateId = failureTemplateId;
    }

    if (invalidRecords.length) {
      const invalidRecordsCsv = Buffer.from(this.writeInvalidRecordsToCsv(invalidRecords), 'utf8');
      const fileNameDate = fileUploadTime.toLocaleDateString().replace(/\//g, '-');
      emailProps.link_to_file = client.prepareUpload(invalidRecordsCsv, {
        filename: `invalid-cepr-records-${fileNameDate}.csv`
      });
    }

    try {
      return await client.sendEmail(templateId, caseworkerEmail, {
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

    for (let i = 0; i < invalidRecords.length; i++) {
      const { reasons } = invalidRecords[i];
      const stringSizeBytes = Buffer.byteLength(csvString, 'utf8');

      if (stringSizeBytes >= 1999900) {
        logger.log('info', 'Invalid records may exceed max Notify attachment size of 2MB');
        break;
      } else {
        csvString += `${Object.values(invalidRecords[i].record).join(',')},${reasons.join('; ')}\r\n`;
      }
    }
    return csvString;
  }

  getDateAndTimeString(date) {
    return date instanceof Date && !isNaN(date) ?
      `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}` :
      'unknown date at unknown time';
  }
};
