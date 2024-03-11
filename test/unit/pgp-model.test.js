const Model = require('../../db/models/pgp-model');
const db = new Model();

describe('The database model method getLatestUrl()', () => {
  let client;
  beforeAll(() => {
    client = {
      one: jest.fn().mockResolvedValue({ url: 'https://...' })
    };
  });

  test('should return a string', async () => {
    return db.getLatestUrl(client).then(data => {
      expect(typeof data).toBe('string');
    });
  });

  test('should return a URL', async () => {
    return db.getLatestUrl(client).then(data => {
      expect(data).toContain('https://');
    });
  });
});
