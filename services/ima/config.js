module.exports = {
  targetColumns: ['cepr', 'dob', 'dtr'],
  parseHeadings: ['cepr', 'dob', 'dtr'],
  validateRecord: validateRecord
};

function validateRecord(record) {
  const { cepr, dob, dtr } = record;
  const invalidReasons = [];
  const report = {
    record: record,
    valid: true
  };

  const validCepr = /^([0-9]{6,10}?)$/.test(cepr);
  if (!validCepr) {
    report.valid = false;
    invalidReasons.push('Invalid CEPR value');
  };

  const validDob = /^(\d{2}\/\d{2}\/\d{4})?$/.test(dob);
  if (!validDob) {
    report.valid = false;
    invalidReasons.push('Invalid DOB format');
  };

  const validDtr = (dtr === 'Yes' || dtr === 'No') ? true : false;
  if (!validDtr) {
    report.valid = false;
    invalidReasons.push('Invalid Duty to remove alert value');
  };

  if (invalidReasons.length) {
    report.reasons = invalidReasons;
  };

  return report;
};
