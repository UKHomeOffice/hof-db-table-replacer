const Model = require('../../db/models/pgp-model');
const db = new Model();

jest.mock('../../config.js', () => {
  const originalModule = jest.requireActual('../../config.js');
  return {
    ...originalModule,
    service: { serviceName: 'ima' }
  };
});

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

  test('returns an error if failing', async () => {
    client = {
      one: jest.fn().mockRejectedValue(new Error('Url retrieval failed'))
    };

    return db.getLatestUrl(client).catch(error => {
      expect(error.message).toEqual('Url retrieval failed');
    });
  });
});
