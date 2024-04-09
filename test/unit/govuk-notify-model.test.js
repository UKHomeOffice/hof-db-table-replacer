const { EmailModel } = require('../../notifications/govuk-notify-model');
const emailer = new EmailModel();

jest.mock('../../config.js', () => {
  const originalModule = jest.requireActual('../../config.js');
  return {
    ...originalModule,
    notifications: { notifyKey: 'test' }
  };
});

// jest.mock('notifications-node-client');

// const config = require('../../config')
// const NotifyClient = require('notifications-node-client')
// const {
//   notifyKey
// } = config.notifications;
// const notifyClient = new NotifyClient(notifyKey);

// jest.mock('notifications-node-client', () => {
//   const originalModule = jest.requireActual('notifications-node-client');
//   return {
//     ...originalModule,
//     NotifyClient: {
//       sendEmail: jest.fn().mockResolvedValue({ status: 201, data: {} }),
//       prepareUpload: jest.fn().mockReturnValue({ data: { file: 'https://...' }})
//     }
//   };
// });

describe('The getDateAndTimeString method', () => {
  test('should return a correctly formatted string when given a date object', () => {
    const dateAndTimeString = emailer.getDateAndTimeString(new Date());
    expect(typeof dateAndTimeString).toBe('string');
    expect(/\d{2}\/\d{2}\/\d{4}\ at\ \d{2}\:\d{2}\:\d{2}/.test(dateAndTimeString)).toBe(true);
  });

  test('should return a specific string if it does not receive a date object', () => {
    const dateAndTimeString = emailer.getDateAndTimeString('not a date');
    expect(typeof dateAndTimeString).toBe('string');
    expect(dateAndTimeString).toBe('unknown date at unknown time');
  });
});

describe('The createCsvHeadersFromFirstRecord method', () => {
  test('Should return a string created from different input objects', () => {
    let invalidRecord = {
      record: { id: 'id is heading 1', dob: 'dob is heading two' },
      valid: false,
      reasons: []
    };
    const csvHeaders = emailer.createCsvHeadersFromFirstRecord(invalidRecord);
    expect(csvHeaders).toBe('id,dob,Reasons for invalidity');
  })
})

describe('The writeInvalidRecordsToCsv method', () => {
  test('should return the correct CSV string for different types of invalid record inputs', () => {
    const invalidRecordsOne = [
      {
        record: { id: '00000000a1', dob: '01/01/2000'},
        valid: false,
        reasons: ['invalid id value']
      }
    ];
    const invalidRecordsTwo = [
      {
        record: { id: 'a1', dtr: 'Yeah'},
        valid: false,
        reasons: ['id', 'dtr']
      },
      {
        record: { id: 'a2', dtr: 'Yes'},
        valid: false,
        reasons: []
      },
      {
        record: { id: '', dtr: ''},
        valid: false,
        reasons: []
      }
    ];
    let csvString = emailer.writeInvalidRecordsToCsv(invalidRecordsOne);
    expect(csvString).toBe('id,dob,Reasons for invalidity\r\n00000000a1,01/01/2000,invalid id value\r\n');
    csvString = emailer.writeInvalidRecordsToCsv(invalidRecordsTwo);
    expect(csvString).toBe('id,dtr,Reasons for invalidity\r\na1,Yeah,id; dtr\r\na2,Yes,\r\n,,\r\n');
  })
});

describe('The sendCaseworkerNotification method', () => {
  let emailClient;
  beforeAll(() => {
    emailClient = {
      sendEmail: jest.fn().mockResolvedValue({ status: 201, data: {} })
    };
  });

  let testJobReport = {
    success: true,
    recordsCount: 10,
    errorMessage: undefined,
    fileUploadTime: new Date(),
    jobEndedTime: new Date(),
    invalidRecords: []
  }
  test('', async () => {
    await emailer.sendCaseworkerNotification(emailClient, testJobReport)
    expect(emailClient.sendEmail).toHaveBeenCalled();
  });
});
