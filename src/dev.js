const DotEnv = require('dotenv');
const Bot = require('./bot');

DotEnv.config();
new Bot().initialize();
