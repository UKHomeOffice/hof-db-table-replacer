const config = require('../config');
const logger = require('./logger')({ env: config.env });
const axios = require('axios');
const { tokenUrl } = config.keycloak;

const auth = async () =>
  new Promise((resolve, reject) => {
    if (!tokenUrl) {
      // eslint-disable-next-line no-console
      logger.log('error', 'keycloak token url is not defined');
      reject(new Error('tokenUrlUndefined'));
    }

    const tokenReq = {
      url: tokenUrl,
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      data: {
        username: config.keycloak.username,
        password: config.keycloak.password,
        grant_type: 'password',
        client_id: config.keycloak.clientId,
        client_secret: config.keycloak.secret
      }
    };

    axios(tokenReq)
      .then(response => {
        resolve({ bearer: response.data.access_token });
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        logger.log('error', 'Keycloak authentication error');
        reject(error);
      });
  });

const fileRequestConfig = (url, authToken) => {
  const requestConfig = {
    url: url,
    method: 'get',
    responseType: 'stream'
  };
  if (authToken) {
    requestConfig.headers = { Authorization: `Basic ${authToken.bearer}` };
  }
  return requestConfig;
};

module.exports = { auth, fileRequestConfig };
