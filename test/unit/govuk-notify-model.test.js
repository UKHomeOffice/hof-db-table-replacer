const EmailModel = require('../../notifications/models/govuk-notify-model');
const emailer = new EmailModel();

jest.mock('../../config.js', () => {
  const originalModule = jest.requireActual('../../config.js');
  return {
    ...originalModule,
    notifications: {
      notifyKey: 'test',
      caseworkerEmail: 'sas-hof-test@digital.homeoffice.gov.uk',
      successTemplateId: 's-u-c-c-e-s-s',
      failureTemplateId: 'f-a-i-l-u-r-e'
    },
  };
});

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

describe('The sendCaseworkerNotification method succeeding...', () => {
  let emailClient;
  beforeAll(() => {
    emailClient = {
      sendEmail: jest.fn().mockResolvedValue({ status: 201, data: {} }),
      prepareUpload: jest.fn().mockReturnValue({ file: 'aGVsbG8K' })
    };
  });

  test('The Notify sendEmail method is called with the correct object for a success email', async () => {
    let testJobReport = {
      success: true,
      recordsCount: 10,
      errorMessage: undefined,
      fileUploadTime: new Date("1987-08-14"),
      jobEndedTime: new Date("1987-08-14"),
      invalidRecords: []
    }

    let expectedEmailProps = {
      csv_uploaded_datetime: '14/08/1987 at 01:00:00',
      cepr_update_datetime: '14/08/1987 at 01:00:00',
      has_invalid_records: 'no',
      link_to_file: '',
      records_count: 10
    }
    await emailer.sendCaseworkerNotification(emailClient, testJobReport)
    expect(emailClient.sendEmail).toHaveBeenCalled();
    expect(emailClient.sendEmail).toHaveBeenCalledWith(
      's-u-c-c-e-s-s',
      'sas-hof-test@digital.homeoffice.gov.uk',
      { personalisation: expectedEmailProps }
    );
  });

  test('sendEmail is called with the correct object for a success email with invalids', async () => {
    let testJobReport = {
      success: true,
      recordsCount: 9,
      errorMessage: undefined,
      fileUploadTime: new Date("1987-08-14"),
      jobEndedTime: new Date("1987-08-14"),
      invalidRecords: [
        {
        record: { id: 'a1', dtr: 'Yeah'},
        valid: false,
        reasons: ['id', 'dtr']
        }
      ]
    }

    let expectedEmailProps = {
      csv_uploaded_datetime: '14/08/1987 at 01:00:00',
      cepr_update_datetime: '14/08/1987 at 01:00:00',
      has_invalid_records: 'yes',
      link_to_file: { file: 'aGVsbG8K' },
      records_count: 9
    }
    await emailer.sendCaseworkerNotification(emailClient, testJobReport)
    expect(emailClient.sendEmail).toHaveBeenCalled();
    expect(emailClient.sendEmail).toHaveBeenCalledWith(
      's-u-c-c-e-s-s',
      'sas-hof-test@digital.homeoffice.gov.uk',
      { personalisation: expectedEmailProps }
    );
  });

  test('sendEmail is called with the correct object for a failure email', async () => {
    let testJobReport = {
      success: false,
      recordsCount: undefined,
      errorMessage: 'Error',
      fileUploadTime: new Date("1987-08-14"),
      jobEndedTime: new Date("1987-08-14"),
      invalidRecords: [],
    }

    let expectedEmailProps = {
      csv_uploaded_datetime: '14/08/1987 at 01:00:00',
      cepr_update_datetime: '14/08/1987 at 01:00:00',
      has_invalid_records: 'no',
      link_to_file: '',
      failure_message: 'Error'
    }
    await emailer.sendCaseworkerNotification(emailClient, testJobReport)
    expect(emailClient.sendEmail).toHaveBeenCalled();
    expect(emailClient.sendEmail).toHaveBeenCalledWith(
      'f-a-i-l-u-r-e',
      'sas-hof-test@digital.homeoffice.gov.uk',
      { personalisation: expectedEmailProps }
    );
  });

  test('sendEmail is called with the correct object for a failure email with invalids', async () => {
    let testJobReport = {
      success: false,
      errorMessage: 'Error',
      fileUploadTime: new Date("1987-08-14"),
      jobEndedTime: new Date("1987-08-14"),
      invalidRecords: [
        {
        record: { id: 'a1', dtr: 'Yeah'},
        valid: false,
        reasons: ['id', 'dtr']
        }
      ]
    }

    let expectedEmailProps = {
      csv_uploaded_datetime: '14/08/1987 at 01:00:00',
      cepr_update_datetime: '14/08/1987 at 01:00:00',
      has_invalid_records: 'yes',
      link_to_file: { file: 'aGVsbG8K' },
      failure_message: 'Error'
    }
    await emailer.sendCaseworkerNotification(emailClient, testJobReport)
    expect(emailClient.sendEmail).toHaveBeenCalled();
    expect(emailClient.sendEmail).toHaveBeenCalledWith(
      'f-a-i-l-u-r-e',
      'sas-hof-test@digital.homeoffice.gov.uk',
      { personalisation: expectedEmailProps }
    );
  });

  describe('The sendCaseworkerNotification method failing...', () => {
    let emailClient;
    beforeAll(() => {
      emailClient = {
        sendEmail: jest.fn().mockRejectedValue(new Error('Notify error')),
        prepareUpload: jest.fn().mockReturnValue({ file: 'aGVsbG8K' })
      };
    });

    test('A failing sendEmail throws an error', async () => {
      let testJobReport = {
        success: true,
        recordsCount: 10,
        errorMessage: undefined,
        fileUploadTime: new Date("1987-08-14"),
        jobEndedTime: new Date("1987-08-14"),
        invalidRecords: []
      }

      return emailer.sendCaseworkerNotification(emailClient, testJobReport).catch(error => {
        expect(error.message).toEqual('Notify error');
      });
    });
  });
});
