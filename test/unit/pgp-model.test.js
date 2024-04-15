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
      one: jest.fn().mockResolvedValue({
        url: 'https://...', created_at: '1987-08-14T02:17:00.000Z'
      })
    };
  });

  test('should return an object with correct properties', async () => {
    return db.getLatestUrl(client).then(data => {
      expect(data).toHaveProperty('url', 'https://...');
      expect(data).toHaveProperty('created_at', '1987-08-14T02:17:00.000Z');
    });
  });

  test('should return a URL', async () => {
    return db.getLatestUrl(client).then(data => {
      expect(data.url).toContain('https://');
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
