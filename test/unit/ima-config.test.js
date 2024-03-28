const { targetColumns, validateRecord } = require('../../services/ima/config');

describe('The IMA service config', () => {
  describe('targetColumns array', () => {
    test('should contain the correct target columns for the lookup db', async () => {
      expect(targetColumns).toStrictEqual(['cepr', 'dob', 'dtr']);
    });
  });

  describe('record validator function', () => {
    test('should return the correct result object when passed a properly formatted record.', async () => {
      const record = { cepr: '1000000001', dob: '01/01/2000', dtr: 'Yes' };
      const result = validateRecord(record);
      expect(result).toHaveProperty('record', record);
      expect(result).toHaveProperty('valid', true);
      expect(result).not.toHaveProperty('reasons');
    });

    test('should return the correct result when passed a record with invalid CEPR value', async () => {
      const record = { cepr: '1001', dob: '01/01/2000', dtr: 'Yes' };
      const result = validateRecord(record);
      expect(result).toHaveProperty('record', record);
      expect(result).toHaveProperty('valid', false);
      expect(result).toHaveProperty('reasons', ['Invalid CEPR value']);
    });

    test('should return the correct result when passed a record with invalid DOB value', async () => {
      const record = { cepr: '1000000001', dob: '01-01-20', dtr: 'Yes' };
      const result = validateRecord(record);
      expect(result).toHaveProperty('record', record);
      expect(result).toHaveProperty('valid', false);
      expect(result).toHaveProperty('reasons', ['Invalid DOB format']);
    });

    test('should return the correct result when passed a record with invalid DTR value', async () => {
      const record = { cepr: '1000000001', dob: '01/01/2000', dtr: 'Yeah' };
      const result = validateRecord(record);
      expect(result).toHaveProperty('record', record);
      expect(result).toHaveProperty('valid', false);
      expect(result).toHaveProperty('reasons', ['Invalid Duty to remove alert value']);
    });

    test('should return the correct result when passed a record with invalid CEPR and DOB value', async () => {
      const record = { cepr: '1000a', dob: '01012000', dtr: 'Yes' };
      const result = validateRecord(record);
      expect(result).toHaveProperty('record', record);
      expect(result).toHaveProperty('valid', false);
      expect(result).toHaveProperty('reasons', ['Invalid CEPR value', 'Invalid DOB format']);
    });

    test('should return the correct result when passed a record with invalid CEPR and DTR value', async () => {
      const record = { cepr: 'ABCDEFGH', dob: '01/01/2000', dtr: 'Yeah' };
      const result = validateRecord(record);
      expect(result).toHaveProperty('record', record);
      expect(result).toHaveProperty('valid', false);
      expect(result).toHaveProperty('reasons', ['Invalid CEPR value', 'Invalid Duty to remove alert value']);
    });

    test('should return the correct result when passed a record with invalid DOB and DTR value', async () => {
      const record = { cepr: '1000000001', dob: '1/1/00', dtr: 'Nope' };
      const result = validateRecord(record);
      expect(result).toHaveProperty('record', record);
      expect(result).toHaveProperty('valid', false);
      expect(result).toHaveProperty('reasons', ['Invalid DOB format', 'Invalid Duty to remove alert value']);
    });

    test('should return the correct result when all record values are invalid', async () => {
      const record = { cepr: '100000000500000', dob: '01/0f/2000', dtr: 'No dtr' };
      const result = validateRecord(record);
      expect(result).toHaveProperty('record', record);
      expect(result).toHaveProperty('valid', false);
      expect(result).toHaveProperty(
        'reasons', ['Invalid CEPR value', 'Invalid DOB format', 'Invalid Duty to remove alert value']
      );
    });
  });
});
