const axios = require('axios');
const fv = require('../../lib/file-vault-utils');

const fakeUrl = 'https://...';
const fakeToken = '1234567890';

jest.mock('axios');
jest.mock('../../config.js', () => {
  const originalModule = jest.requireActual('../../config.js');
  return {
    ...originalModule,
    keycloak: { tokenUrl: 'https://...' }
  };
});

describe('The auth() function', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('succeeding', () => {
    beforeAll(() => {
      const resp = {data: {access_token: fakeToken}};
      axios.mockResolvedValue(resp);
    });
    test('should fetch token and return in correct format', () => {
      return fv.auth().then(data => expect(data).toEqual({ bearer: '1234567890' }));
    });
  });

  describe('failing', () => {
    beforeAll(() => {
      axios.mockRejectedValue(new Error('A general error'));
    });
    test('should return an error type.', () => {
      return fv.auth().catch(error => {
        expect(error.message).toBeDefined();
      });
    });
  });

  describe('with no keycloak URL available', () => {
    beforeAll(() => {
      jest.unmock('../../config.js');
      axios.mockResolvedValue({data: {}});
    });

    test('Should throw a tokenUrlUndefined error.', () => {
      return fv.auth().catch(error => {
        expect(error.message).toEqual('tokenUrlUndefined');
      });
    });
  });
});

describe('The fileRequestConfig() function', () => {
  const bearer = { bearer: fakeToken };
  const config = fv.fileRequestConfig(fakeUrl, bearer);

  test('should return an object type', () => {
    expect(typeof config === 'object').toBe(true);
  });

  test('returned object should have all necessary properties', () => {
    expect(config).toHaveProperty('url', fakeUrl);
    expect(config).toHaveProperty('method', 'get');
    expect(config).toHaveProperty('responseType', 'stream');
    expect(config).toHaveProperty('headers.Authorization', `Basic ${fakeToken}`);
  });
});
