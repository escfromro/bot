const DotEnv = require('dotenv');
const Bot = require('./src/bot');

DotEnv.config();
new Bot().initialize();
