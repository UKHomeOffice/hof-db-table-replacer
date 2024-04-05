const config = require('../config');
const logger = require('./logger')({ env: config.env });

const NotifyClient = require('notifications-node-client').NotifyClient;
const {
  notifyKey,
  caseworkerEmail,
  successTemplateId,
  failureTemplateId
} = config.notify;
const notifyClient = new NotifyClient(notifyKey);

const sendCaseworkerNotification = async (success, invalidRecords) => {
  const emailProps = {
    csv_uploaded_datetime: 'time and date',
    cepr_update_datetime: 'time and date',
    has_invalid_records: (invalidRecords ? 'yes' : 'no')
  };

  const templateId = success ? successTemplateId : failureTemplateId;

  if (invalidRecords) {
    invalidRecordsCsv = Buffer.from(await writeInvalidRecordsToCsv(invalidRecords), 'utf8');
    emailProps.link_to_file = notifyClient.prepareUpload(invalidRecordsCsv, { filename: 'invalid-cepr-records.csv' });
  }

  return await notifyClient.sendEmail(templateId, caseworkerEmail, {
    personalisation: emailProps
  });
}

const createCsvHeadersFromFirstRecord = (invalidRecord) => {
  const { record } = invalidRecord;
  return `${Object.keys(record).join(',')},Reasons for invalidity`;
}

const writeInvalidRecordsToCsv = (invalidRecords) => {
  const dynamicHeaders = createCsvHeadersFromFirstRecord(invalidRecords[0]);
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

module.exports = sendCaseworkerNotification;