const config = require('../config');
const { notifyKey } = config.notifications;

const NotifyClient = require('notifications-node-client').NotifyClient;
const emailClient = new NotifyClient(notifyKey);

module.exports = emailClient;
