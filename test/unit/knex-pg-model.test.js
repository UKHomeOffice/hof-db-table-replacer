const Model = require('../../db/models/knex-postgres-model');
const db = new Model();

describe('The database model method getLatestUrl()', () => {
  let client;
  beforeAll(() => {
    client = {
      select: jest.fn(() => ({
        from: jest.fn(() => ({
          orderBy: jest.fn(() => ({
            limit: jest.fn(() => ({
              timeout: jest.fn().mockResolvedValue([{ url: 'https://...' }])
            }))
          }))
        }))
      }))
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
